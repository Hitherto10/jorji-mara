// src/routes/webhooks.js
//
// Handles inbound webhooks from Remita and Paystack.
//
// Remita sends a POST to /api/webhooks/remita when payment status changes.
// We verify the payload authenticity, then call persistOrder() to create or
// update the order record in Supabase.
//
// Paystack sends a POST to /api/webhooks/paystack similarly.
//
// IMPORTANT: Register these URLs in your Remita merchant dashboard and
// Paystack dashboard so they receive events.

import { Hono } from 'hono';
import { createSupabaseClient } from '../lib/supabase.js';
import { persistOrder } from './remita/saveOrder.js';

const router = new Hono();

// ─── Shipping fee lookup (keep in sync with checkout.js) ────────────────────
const SHIPPING_FEES = { standard: 2500, express: 5000 };

// ─── POST /api/webhooks/remita ───────────────────────────────────────────────
//
// Remita webhook payload shape (verify against your integration docs):
// {
//   merchantId:    string
//   serviceTypeId: string
//   orderId:       string       — your internal orderId (JM_xxx)
//   rrr:           string       — Remita Retrieval Reference
//   amount:        string       — e.g. "5000.00"
//   transactionId: string
//   status:        '01' | '021' | '04' | ...
//   description:   string
//   hash:          string       — SHA-512 for verification
// }
router.post('/remita', async (c) => {
	let payload;
	try {
		payload = await c.req.json();
	} catch {
		return c.json({ error: 'Invalid JSON' }, 400);
	}

	const { merchantId, rrr, orderId, amount, status: remitaStatus, hash } = payload;

	// ── Verify webhook authenticity ──────────────────────────────────────────
	// Remita signs webhooks with SHA-512( merchantId + serviceTypeId + orderId + amount + apiKey )
	// Adjust the hash input to match Remita's actual webhook signature scheme.
	if (!rrr || !merchantId) {
		return c.json({ error: 'Missing required fields' }, 400);
	}

	// Re-compute the expected hash
	const expectedHashInput = `${merchantId}${orderId}${amount}${c.env.API_KEY}`;
	const encoder           = new TextEncoder();
	const hashBuffer        = await crypto.subtle.digest('SHA-512', encoder.encode(expectedHashInput));
	const expectedHash      = Array.from(new Uint8Array(hashBuffer))
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');

	if (hash && hash !== expectedHash) {
		console.warn('[webhook/remita] Hash mismatch. Possible spoofed webhook.', { received: hash, expected: expectedHash });
		return c.json({ error: 'Invalid signature' }, 401);
	}

	// ── Map Remita status → our payment_status ───────────────────────────────
	let paymentStatus;
	if (remitaStatus === '01' || String(remitaStatus).toLowerCase().includes('success')) {
		paymentStatus = 'paid';
	} else if (remitaStatus === '04') {
		paymentStatus = 'refunded';
	} else {
		// Unknown or pending — log and acknowledge without taking action
		console.log('[webhook/remita] Non-actionable status:', remitaStatus, 'for RRR:', rrr);
		return c.json({ received: true, action: 'none' });
	}

	const db = createSupabaseClient(c.env);

	// ── Check if order already exists for this RRR ───────────────────────────
	const { data: existingOrder } = await db
		.from('orders')
		.select('id, payment_status, status')
		.eq('payment_ref', rrr)
		.maybeSingle();

	if (existingOrder) {
		// Order already exists — just update payment/order status if needed
		if (existingOrder.payment_status !== paymentStatus) {
			const { error: updateErr } = await db
				.from('orders')
				.update({
					payment_status: paymentStatus,
					status:         paymentStatus === 'paid' ? 'confirmed' : existingOrder.status,
					paid_at:        paymentStatus === 'paid' ? new Date().toISOString() : null,
				})
				.eq('id', existingOrder.id);

			if (updateErr) {
				console.error('[webhook/remita] Failed to update order status:', updateErr);
				return c.json({ error: 'Failed to update order' }, 500);
			}
			console.log(`[webhook/remita] Updated order ${existingOrder.id} to status: ${paymentStatus}`);
		}
		return c.json({ received: true, action: 'updated', orderId: existingOrder.id });
	}

	// ── Order doesn't exist yet — the webhook arrived before the frontend called save-order ──
	// This can happen if the user closed the browser immediately after paying.
	// We can't fully reconstruct the order without the cart items and shipping info,
	// so we log this for manual follow-up. In a production system you'd store a
	// "pending_orders" record during /init that includes all the needed data.
	console.warn('[webhook/remita] Received webhook for unknown RRR:', rrr, 'orderId:', orderId);

	// Attempt to find a pending_checkout record if you implement that pattern
	// (see note in checkout.js about saving a draft order at /init time)
	return c.json({
		received: true,
		action:   'no_matching_order',
		note:     'Order not found for this RRR. Manual review required.',
		rrr,
		orderId,
	});
});

// ─── POST /api/webhooks/paystack ─────────────────────────────────────────────
//
// Paystack webhook payload:
// {
//   event: 'charge.success' | 'charge.failed' | ...
//   data: {
//     reference:   string
//     amount:      number  (in kobo)
//     status:      'success' | 'failed'
//     metadata:    { lineItems, shippingMethod, shippingCost, subtotal }
//     customer:    { email }
//   }
// }
router.post('/paystack', async (c) => {
	// ── Verify Paystack signature ────────────────────────────────────────────
	const signature = c.req.header('x-paystack-signature');
	const rawBody   = await c.req.text();

	if (!signature || !c.env.PAYSTACK_SECRET_KEY) {
		return c.json({ error: 'Missing signature' }, 401);
	}

	// HMAC-SHA512 of raw body using your Paystack secret key
	const keyData     = new TextEncoder().encode(c.env.PAYSTACK_SECRET_KEY);
	const msgData     = new TextEncoder().encode(rawBody);
	const cryptoKey   = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
	const sigBuffer   = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
	const expectedSig = Array.from(new Uint8Array(sigBuffer))
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');

	if (signature !== expectedSig) {
		console.warn('[webhook/paystack] Invalid signature');
		return c.json({ error: 'Invalid signature' }, 401);
	}

	let event;
	try {
		event = JSON.parse(rawBody);
	} catch {
		return c.json({ error: 'Invalid JSON' }, 400);
	}

	if (event.event !== 'charge.success') {
		// Acknowledge non-success events without doing anything
		return c.json({ received: true, action: 'none' });
	}

	const { reference, amount: amountKobo, status, metadata, customer } = event.data;

	if (status !== 'success') {
		return c.json({ received: true, action: 'none' });
	}

	const db = createSupabaseClient(c.env);

	// ── Idempotency check ────────────────────────────────────────────────────
	const { data: existingOrder } = await db
		.from('orders')
		.select('id, order_number, payment_status')
		.eq('payment_ref', reference)
		.maybeSingle();

	if (existingOrder) {
		if (existingOrder.payment_status !== 'paid') {
			await db
				.from('orders')
				.update({ payment_status: 'paid', status: 'confirmed', paid_at: new Date().toISOString() })
				.eq('id', existingOrder.id);
		}
		return c.json({ received: true, action: 'updated', orderId: existingOrder.id });
	}

	// ── Reconstruct order from Paystack metadata ─────────────────────────────
	// The /init route embeds lineItems + shipping info in Paystack's metadata field
	const { lineItems, shippingMethod, shippingCost, subtotal } = metadata ?? {};

	if (!lineItems?.length) {
		console.warn('[webhook/paystack] No lineItems in metadata for reference:', reference);
		return c.json({ received: true, action: 'no_metadata' });
	}

	const total = (amountKobo / 100); // convert kobo back to naira

	// We don't have shipping address from metadata — you'd need to store it in Paystack metadata at /init
	const { order, error: saveErr } = await persistOrder(db, {
		paymentRef:       reference,
		paymentMethod:    'paystack',
		paymentProvider:  'paystack',
		paymentStatus:    'paid',
		subtotal:         subtotal ?? (total - (shippingCost ?? 0)),
		shippingFee:      shippingCost ?? SHIPPING_FEES[shippingMethod ?? 'standard'],
		total,
		// Shipping address not available from webhook alone unless embedded in metadata
		shippingName:     customer?.email ?? 'Unknown',
		shippingPhone:    null,
		shippingAddress1: null,
		shippingCity:     null,
		shippingState:    null,
		shippingCountry:  'Nigeria',
		notes:            `Paystack webhook. Customer: ${customer?.email}`,
	}, lineItems);

	if (saveErr) {
		console.error('[webhook/paystack] persistOrder error:', saveErr);
		return c.json({ error: 'Failed to save order' }, 500);
	}

	console.log(`[webhook/paystack] Order ${order.order_number} created for reference: ${reference}`);
	return c.json({ received: true, action: 'created', orderId: order.id, orderNumber: order.order_number });
});

// ─── POST /api/webhooks/flutterwave ──────────────────────────────────────────
//
// Flutterwave webhook payload:
// {
//   event: 'charge.completed'
//   data: {
//     id:         number          — Flutterwave transaction ID
//     tx_ref:     string          — our reference (JM_xxx)
//     flw_ref:    string
//     amount:     number
//     currency:   'NGN'
//     status:     'successful' | 'failed' | 'pending'
//     customer:   { email, name, phone_number }
//     meta:       { lineItems, shippingCost, subtotal, payerName, payerPhone, ... }
//   }
// }
//
// Flutterwave signs webhooks with a custom header: verif-hash
// Set the secret in your Flutterwave dashboard and store it as FLUTTERWAVE_WEBHOOK_SECRET
router.post('/flutterwave', async (c) => {
	// ── Verify webhook signature ─────────────────────────────────────────────
	const secretHash = c.env.FLUTTERWAVE_WEBHOOK_SECRET;
	const signature  = c.req.header('verif-hash');

	if (secretHash && signature !== secretHash) {
		console.warn('[webhook/flutterwave] Invalid signature. Possible spoofed webhook.');
		return c.json({ error: 'Invalid signature' }, 401);
	}

	let payload;
	try {
		payload = await c.req.json();
	} catch {
		return c.json({ error: 'Invalid JSON' }, 400);
	}

	// Only handle charge.completed events
	if (payload.event !== 'charge.completed') {
		return c.json({ received: true, action: 'none' });
	}

	const { id: transactionId, tx_ref, amount, status, customer, meta } = payload.data ?? {};

	if (status !== 'successful') {
		console.log('[webhook/flutterwave] Non-successful status:', status, 'for tx_ref:', tx_ref);
		return c.json({ received: true, action: 'none' });
	}

	if (!tx_ref) {
		return c.json({ error: 'Missing tx_ref' }, 400);
	}

	const db = createSupabaseClient(c.env);

	// ── Idempotency check ────────────────────────────────────────────────────
	const { data: existingOrder } = await db
		.from('orders')
		.select('id, order_number, payment_status')
		.eq('payment_ref', tx_ref)
		.maybeSingle();

	if (existingOrder) {
		if (existingOrder.payment_status !== 'paid') {
			await db
				.from('orders')
				.update({ payment_status: 'paid', status: 'confirmed', paid_at: new Date().toISOString() })
				.eq('id', existingOrder.id);
		}
		return c.json({ received: true, action: 'updated', orderId: existingOrder.id });
	}

	// ── No order yet — reconstruct from meta ─────────────────────────────────
	// The /init route embeds lineItems + shipping info in Flutterwave's meta field
	const lineItems = (() => {
		try { return JSON.parse(meta?.lineItems ?? '[]'); } catch { return []; }
	})();

	if (!lineItems.length) {
		console.warn('[webhook/flutterwave] No lineItems in meta for tx_ref:', tx_ref);
		return c.json({ received: true, action: 'no_metadata' });
	}

	const subtotal    = Number(meta?.subtotal ?? 0);
	const shippingFee = Number(meta?.shippingCost ?? 0);
	const total       = amount;

	const shippingAddr = (() => {
		try { return JSON.parse(meta?.shippingAddress ?? '{}'); } catch { return {}; }
	})();

	const { order, error: saveErr } = await persistOrder(db, {
		paymentRef:       tx_ref,
		paymentMethod:    'flutterwave',
		paymentProvider:  'flutterwave',
		paymentStatus:    'paid',
		subtotal:         subtotal || total - shippingFee,
		shippingFee,
		total,
		shippingName:     meta?.payerName ?? customer?.name ?? null,
		shippingPhone:    meta?.payerPhone ?? customer?.phone_number ?? null,
		shippingAddress1: null,
		shippingCity:     null,
		shippingState:    shippingAddr.state ?? meta?.stateRegion ?? null,
		shippingCountry:  shippingAddr.country ?? meta?.countryCode ?? 'Nigeria',
		notes:            `Flutterwave webhook. Customer: ${customer?.email}. Transaction ID: ${transactionId}`,
	}, lineItems);

	if (saveErr) {
		console.error('[webhook/flutterwave] persistOrder error:', saveErr);
		return c.json({ error: 'Failed to save order' }, 500);
	}

	console.log(`[webhook/flutterwave] Order ${order.order_number} created for tx_ref: ${tx_ref}`);
	return c.json({ received: true, action: 'created', orderId: order.id, orderNumber: order.order_number });
});

export default router;
