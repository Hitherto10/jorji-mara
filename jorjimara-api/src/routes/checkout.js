// src/routes/checkout.js
import { Hono } from 'hono';
import { createSupabaseClient } from '../lib/supabase.js';

const checkout = new Hono();

const SHIPPING = { standard: 2500, express: 5000 };
const REMITA_BASE_URL  = 'https://demo.remita.net';
const GEN_RRR_PATH     = '/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit';
const STATUS_PATH      = '/remita/exapp/api/v1/send/api/echannelsvc/';

//  POST /api/checkout/init
checkout.post('/init', async (c) => {
	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: 'Invalid JSON body' }, 400);
	}

	const {
		items,
		shippingMethod = 'standard',
		email, payerName, payerEmail,
		payerPhone, description, paymentMethod,
	} = body;

	//  Input validation
	if (!email || !email.includes('@'))
		return c.json({ error: 'Please provide a valid email' }, 400);
	if (!Array.isArray(items) || items.length === 0)
		return c.json({ error: 'Cart is empty' }, 400);
	if (!SHIPPING[shippingMethod])
		return c.json({ error: 'Invalid shipping method' }, 400);

	const variantIds = items.map(i => i.variantId).filter(Boolean);
	if (variantIds.length !== items.length)
		return c.json({ error: 'All items must have a variantId' }, 400);

	const db = createSupabaseClient(c.env);

	// ── Fetch + validate variants ───────────────────────────────────────────
	const { data: variants, error: varErr } = await db
		.from('product_variants')
		.select('id, price, stock, is_active, product_id, products ( name, price )')
		.in('id', variantIds)
		.eq('is_active', true);

	if (varErr) return c.json({ error: 'Could not verify cart' }, 500);

	for (const item of items) {
		const variant = variants.find(v => v.id === item.variantId);
		if (!variant) return c.json({ error: `Variant ${item.variantId} not found or inactive` }, 400);
		if (variant.stock < item.quantity)
			return c.json({ error: `Insufficient stock for variant ${item.variantId}` }, 400);
		if (item.quantity < 1 || !Number.isInteger(item.quantity))
			return c.json({ error: 'Quantity must be a positive integer' }, 400);
	}

	// ── Calculate server-side totals ────────────────────────────────────────
	let subtotal = 0;
	const lineItems = items.map(item => {
		const variant = variants.find(v => v.id === item.variantId);
		const price   = Number(variant.price ?? variant.products?.price ?? 0);
		subtotal     += price * item.quantity;
		return { variantId: item.variantId, quantity: item.quantity, price, lineTotal: price * item.quantity };
	});

	const shippingCost = SHIPPING[shippingMethod];
	const total = subtotal + shippingCost;

	// Remita
	if (paymentMethod === 'remita') {
		const totalAmount = String(total);
		const orderId     = `JM_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
		const hashString  = c.env.MERCHANT_ID + c.env.SERVICE_TYPE_ID + orderId + totalAmount + c.env.API_KEY;
		const encoder     = new TextEncoder();
		const hashBuffer  = await crypto.subtle.digest('SHA-512', encoder.encode(hashString));
		const apiHash     = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

		const requestBody = JSON.stringify({
			serviceTypeId: c.env.SERVICE_TYPE_ID,
			amount: totalAmount,
			orderId,
			payerName,
			payerEmail,
			payerPhone,
			description,
		});

		const response = await fetch(`${REMITA_BASE_URL}${GEN_RRR_PATH}`, {
			method:  'POST',
			headers: {
				'Content-Type':  'application/json',
				'Authorization': `remitaConsumerKey=${c.env.MERCHANT_ID},remitaConsumerToken=${apiHash}`,
			},
			body: requestBody,
		});

		if (!response.ok) {
			return c.json({ error: 'Failed to generate RRR', response }, 500);
		}

		const responseText = await response.text();
		const jsonStart    = responseText.indexOf('(') + 1;
		const jsonEnd      = responseText.lastIndexOf(')');
		const jsonString   = responseText.substring(jsonStart, jsonEnd);

		let remitaResponse;
		try {
			remitaResponse = JSON.parse(jsonString);
		} catch {
			return c.json({ error: 'Invalid response from Remita' }, 500);
		}

		const rrr = remitaResponse.RRR;
		if (!rrr) {
			return c.json({ error: 'Failed to generate payment reference', details: remitaResponse }, 500);
		}

		//  Store a minimal pending-checkout record
		// This allows the webhook to reconstruct the order even if the user
		// closes the browser before /save-order is called.
		await db
			.from('pending_checkouts').upsert({
			rrr,
			order_id_hint:   orderId,
			email,
			payer_name:      payerName,
			payer_phone:     payerPhone,
			shipping_method: shippingMethod,
			subtotal,
			shipping_fee:    shippingCost,
			total,
			line_items:      lineItems,  // stored as JSON
			expires_at:      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h TTL
		}, { onConflict: 'rrr', ignoreDuplicates: false });

		return c.json({ success: true, rrr, orderId, total });
	}

	// ── Paystack ────────────────────────────────────────────────────────────
	if (paymentMethod === 'paystack') {
		const reference   = `JM_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
		const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
			method:  'POST',
			headers: {
				'Content-Type':  'application/json',
				'Authorization': `Bearer ${c.env.PAYSTACK_SECRET_KEY}`,
			},
			body: JSON.stringify({
				email,
				amount:       total * 100, // kobo
				reference,
				currency:     'NGN',
				metadata: {
					lineItems,
					shippingMethod,
					shippingCost,
					subtotal,
				},
				callback_url: `${c.env.FRONTEND_ORIGIN}/checkout/success`,
			}),
		});

		if (!paystackRes.ok) {
			const err = await paystackRes.json();
			console.error('[Paystack init error]', err);
			return c.json({ error: 'Payment initialization failed' }, 502);
		}

		const { data: psData } = await paystackRes.json();
		return c.json({
			paymentUrl: psData.authorization_url,
			reference:  psData.reference,
			total,
		});
	}

	return c.json({ error: 'Unsupported payment method' }, 400);
});

// ─── GET /api/checkout/status/:rrr ────────────────────────────────────────────
// Frontend fallback: poll this after returning from the Remita payment widget
// to verify status without waiting for the webhook.
//
// Returns:
// { status: 'paid' | 'pending' | 'failed', orderId?, orderNumber?, remitaStatus, amount }

checkout.get('/status/:rrr', async (c) => {
	const { rrr } = c.req.param();

	if (!rrr || rrr.length < 5) {
		return c.json({ error: 'Invalid RRR' }, 400);
	}

	// 1. Check if we already have a saved order for this RRR
	const db = createSupabaseClient(c.env);
	const { data: existingOrder } = await db
		.from('orders')
		.select('id, order_number, status, payment_status, total, created_at')
		.eq('payment_ref', rrr)
		.maybeSingle();

	if (existingOrder) {
		return c.json({
			found:         true,
			orderId:       existingOrder.id,
			orderNumber:   existingOrder.order_number,
			status:        existingOrder.status,
			paymentStatus: existingOrder.payment_status,
			total:         existingOrder.total,
		});
	}

	// 2. No order yet — query Remita directly
	const hashInput  = `${c.env.MERCHANT_ID}${rrr}${c.env.API_KEY}`;
	const encoder    = new TextEncoder();
	const hashBuffer = await crypto.subtle.digest('SHA-512', encoder.encode(hashInput));
	const apiHash    = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

	const statusUrl = `${REMITA_BASE_URL}${STATUS_PATH}/${c.env.MERCHANT_ID}/${rrr}/${apiHash}/status.reg`;

	let remitaData;
	try {
		const res = await fetch(statusUrl, {
			headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
		});

		const text = await res.text();
		const jsonStart = text.indexOf('{');
		const jsonEnd   = text.lastIndexOf('}');
		remitaData = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
	} catch (err) {
		console.error('[checkout/status] Remita status fetch error:', err.message);
		return c.json({ error: 'Could not retrieve payment status' }, 502);
	}

	// Map Remita status code to a clean status
	const remitaCode = remitaData?.status ?? '';
	let paymentStatus = 'unknown';

	if (remitaCode === '01' || remitaData?.message?.toLowerCase().includes('success')) {
		paymentStatus = 'paid';
	} else if (remitaCode === '021' || remitaData?.message?.toLowerCase().includes('pending') || remitaData?.message?.toLowerCase().includes('awaiting')) {
		paymentStatus = 'pending';
	} else if (remitaCode === '04') {
		paymentStatus = 'refunded';
	} else {
		paymentStatus = 'failed';
	}

	return c.json({
		found:         false,
		paymentStatus,
		remitaStatus:  remitaCode,
		remitaMessage: remitaData?.message,
		amount:        remitaData?.amount,
		rrr,
	});
});

export default checkout;
