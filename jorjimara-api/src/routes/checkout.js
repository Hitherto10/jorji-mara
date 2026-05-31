// src/routes/checkout.js
import { Hono } from 'hono';
import { createSupabaseClient } from '../lib/supabase.js';
import { calculateShipping } from '../utils/shippingCalculator.js';

const checkout = new Hono();
const REMITA_BASE_URL  = 'https://demo.remita.net';
const GEN_RRR_PATH     = '/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit';
const STATUS_PATH      = '/remita/exapp/api/v1/send/api/echannelsvc/';

// ─── POST /api/checkout/calculate-shipping ────────────────────────────────────
// Called by the frontend to get a real-time shipping quote before proceeding
// to payment.  Weight is fetched server-side; the client never sees it.
//
// Body: { items, countryCode, stateRegion, postcode }
// Returns: { shippingFee, zone, weightKg, currency }
checkout.post('/calculate-shipping', async (c) => {
	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: 'Invalid JSON body' }, 400);
	}

	const { items, countryCode, stateRegion, postcode } = body;

	if (!countryCode)
		return c.json({ error: 'Country is required' }, 400);
	if (!postcode)
		return c.json({ error: 'Postcode is required' }, 400);
	if (!Array.isArray(items) || items.length === 0)
		return c.json({ error: 'Cart is empty' }, 400);

	const variantIds = items.map(i => i.variantId).filter(Boolean);
	if (variantIds.length !== items.length)
		return c.json({ error: 'All items must have a variantId' }, 400);

	// Fetch product weights only for international shipments
	let variants = [];
	if (countryCode !== 'NG') {
		const db = createSupabaseClient(c.env);
		const { data, error } = await db
			.from('product_variants')
			.select('id, product_id, products ( weight )')
			.in('id', variantIds)
			.eq('is_active', true);
		if (error) return c.json({ error: 'Could not retrieve product data' }, 500);
		variants = data ?? [];
	}

	try {
		const result = calculateShipping({ items, countryCode, stateRegion, variants });
		return c.json(result);
	} catch (err) {
		return c.json({ error: err.message }, 400);
	}
});


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
		countryCode, stateRegion, postcode,
		email, payerName, payerEmail,
		payerPhone, description, paymentMethod,
	} = body;

	//  Input validation
	if (!email || !email.includes('@'))
		return c.json({ error: 'Please provide a valid email' }, 400);
	if (!Array.isArray(items) || items.length === 0)
		return c.json({ error: 'Cart is empty' }, 400);
	if (!countryCode)
		return c.json({ error: 'Country is required' }, 400);
	if (!postcode)
		return c.json({ error: 'Postcode is required' }, 400);

	const variantIds = items.map(i => i.variantId).filter(Boolean);
	if (variantIds.length !== items.length)
		return c.json({ error: 'All items must have a variantId' }, 400);

	const db = createSupabaseClient(c.env);

	// ── Fetch + validate variants ───────────────────────────────────────────
	const { data: variants, error: varErr } = await db
		.from('product_variants')
		.select('id, price, stock, is_active, product_id, products ( name, price, weight )')
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

	// Re-calculate shipping server-side — never trust the client-submitted fee
	let shippingResult;
	try {
		shippingResult = calculateShipping({ items, countryCode, stateRegion, variants });
	} catch (err) {
		return c.json({ error: err.message }, 400);
	}
	const shippingCost = shippingResult.shippingFee;
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
			country:         countryCode,
			state:           stateRegion ?? null,
			postcode:        postcode,
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
					countryCode,
					stateRegion,
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

	// ── Flutterwave ──────────────────────────────────────────────────────────
	if (paymentMethod === 'flutterwave') {
		const txRef = `JM_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

		const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
			method:  'POST',
			headers: {
				'Content-Type':  'application/json',
				'Authorization': `Bearer ${c.env.FLUTTERWAVE_LIVE_SECRET_KEY}`,
			},
			body: JSON.stringify({
				tx_ref:       txRef,
				amount:       total,
				currency:     'NGN',
				redirect_url: `${c.env.FRONTEND_ORIGIN}/checkout/success`,
				// redirect_url: `${c.env.FRONTEND_ORIGIN}/checkout/success`,
				customer: {
					email,
					phonenumber: payerPhone,
					name:        payerName,
				},
				customizations: {
					title:       'Jorji Mara Apparel',
					description: description || 'Order Payment',
					logo:        `${c.env.FRONTEND_ORIGIN}/src/assets/icons/main_logo.png`,
				},
				meta: {
					lineItems:     JSON.stringify(lineItems),
					countryCode,
					stateRegion:   stateRegion ?? '',
					shippingCost,
					subtotal,
					payerName,
					payerPhone,
					customerEmail: email,
					shippingAddress: JSON.stringify({
						country: countryCode,
						state:   stateRegion ?? '',
					}),
				},
			}),
		});

		if (!flwRes.ok) {
			const err = await flwRes.json().catch(() => ({}));
			console.error('[Flutterwave init error]', err);
			return c.json({ error: 'Payment initialization failed' }, 502);
		}

		const flwData = await flwRes.json();
		if (flwData.status !== 'success') {
			console.error('[Flutterwave init failed]', flwData);
			return c.json({ error: 'Payment initialization failed', details: flwData.message }, 502);
		}

		return c.json({
			paymentUrl: flwData.data.link,
			reference:  txRef,
			total,
		});
	}

	return c.json({ error: 'Unsupported payment method' }, 400);
});

// ─── GET /api/checkout/verify-flutterwave ─────────────────────────────────────
// Called by the /checkout/success page after Flutterwave redirects the user back.
// Flutterwave appends: ?status=successful&tx_ref=JM_xxx&transaction_id=12345
//
// We verify the transaction server-side via Flutterwave's verify API,
// then persist the order and return confirmation data to the frontend.
checkout.get('/verify-flutterwave', async (c) => {
	const { status, tx_ref, transaction_id } = c.req.query();

	if (!transaction_id || !tx_ref) {
		return c.json({ error: 'Missing transaction_id or tx_ref' }, 400);
	}

	if (status !== 'successful') {
		return c.json({ error: 'Payment was not successful', status }, 402);
	}

	const db = createSupabaseClient(c.env);

	// ── Idempotency: return existing order if already saved ──────────────────
	const { data: existingOrder } = await db
		.from('orders')
		.select('id, order_number, status, payment_status, total')
		.eq('payment_ref', tx_ref)
		.maybeSingle();

	if (existingOrder) {
		return c.json({
			success:       true,
			orderId:       existingOrder.id,
			orderNumber:   existingOrder.order_number,
			paymentStatus: existingOrder.payment_status,
			total:         existingOrder.total,
			duplicate:     true,
		});
	}

	// ── Verify with Flutterwave API ──────────────────────────────────────────
	const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
		headers: { 'Authorization': `Bearer ${c.env.FLUTTERWAVE_LIVE_SECRET_KEY}` },
	});

	if (!verifyRes.ok) {
		console.error('[FLW verify] HTTP error', verifyRes.status);
		return c.json({ error: 'Could not verify payment with Flutterwave' }, 502);
	}

	const verifyData = await verifyRes.json();

	if (verifyData.status !== 'success' || verifyData.data?.status !== 'successful') {
		console.warn('[FLW verify] Payment not confirmed:', verifyData);
		return c.json({
			error:   'Payment verification failed',
			details: verifyData.message,
		}, 402);
	}

	const txData     = verifyData.data;
	const meta       = txData.meta ?? {};
	const lineItems  = (() => {
		try { return JSON.parse(meta.lineItems ?? '[]'); } catch { return []; }
	})();

	const subtotal    = Number(meta.subtotal ?? 0);
	const shippingFee = Number(meta.shippingCost ?? 0);
	const total       = txData.amount;

	// ── Persist the order ────────────────────────────────────────────────────
	const variantIds = lineItems.map(i => i.variantId).filter(Boolean);
	let serverSubtotal = 0;
	let orderLineItems = [];

	if (variantIds.length > 0) {
		const { data: variants } = await db
			.from('product_variants')
			.select('id, price, sku, size, color, product_id, products ( name, price )')
			.in('id', variantIds)
			.eq('is_active', true);

		if (variants?.length) {
			for (const item of lineItems) {
				const variant = variants.find(v => v.id === item.variantId);
				if (!variant) continue;
				const unitPrice = Number(variant.price ?? variant.products?.price ?? item.price ?? 0);
				const lineTotal = unitPrice * item.quantity;
				serverSubtotal += lineTotal;
				orderLineItems.push({
					variant_id:    variant.id,
					product_name:  variant.products?.name ?? 'Item',
					variant_size:  variant.size ?? null,
					variant_color: variant.color ?? null,
					sku:           variant.sku ?? null,
					quantity:      item.quantity,
					unit_price:    unitPrice,
					total_price:   lineTotal,
				});
			}
		}
	}

	// Insert order
	const shippingAddr = (() => { try { return JSON.parse(meta.shippingAddress ?? '{}'); } catch { return {}; } })();

	const { data: newOrder, error: orderErr } = await db
		.from('orders')
		.insert({
			payment_ref:       tx_ref,
			payment_method:    'flutterwave',
			payment_provider:  'flutterwave',
			payment_status:    'paid',
			status:            'confirmed',
			paid_at:           new Date().toISOString(),
			subtotal:          serverSubtotal || subtotal,
			shipping_fee:      shippingFee,
			discount_amount:   0,
			total:             total,
			currency:          'NGN',
			shipping_name:     meta.payerName ?? txData.customer?.name ?? null,
			shipping_phone:    meta.payerPhone ?? txData.customer?.phone_number ?? null,
			shipping_country:  shippingAddr.country ?? meta.countryCode ?? null,
			shipping_state:    shippingAddr.state ?? meta.stateRegion ?? null,
			notes:             `Flutterwave payment. Customer: ${meta.customerEmail ?? txData.customer?.email}. FLW Ref: ${txData.flw_ref}`,
		})
		.select('id, order_number')
		.single();

	// Race-safe idempotency: if a concurrent request inserted the row between
	// our SELECT and INSERT, the unique constraint on payment_ref will reject
	// this insert with Postgres code 23505. Re-fetch and return the winner.
	if (orderErr?.code === '23505') {
		const { data: racedOrder } = await db
			.from('orders')
			.select('id, order_number, payment_status, total')
			.eq('payment_ref', tx_ref)
			.maybeSingle();

		if (racedOrder) {
			console.warn(`[FLW verify] Concurrent insert raced for tx_ref ${tx_ref}; returning existing order ${racedOrder.order_number}`);
			return c.json({
				success:       true,
				orderId:       racedOrder.id,
				orderNumber:   racedOrder.order_number,
				paymentStatus: racedOrder.payment_status,
				total:         racedOrder.total,
				duplicate:     true,
			});
		}
	}

	if (orderErr || !newOrder) {
		console.error('[FLW verify] order insert error:', orderErr);
		return c.json({ error: 'Payment confirmed but order could not be saved. Please contact support.' }, 500);
	}

	// Insert line items
	if (orderLineItems.length > 0) {
		const itemRows = orderLineItems.map(r => ({ ...r, order_id: newOrder.id }));
		const { error: itemsErr } = await db.from('order_items').insert(itemRows);
		if (itemsErr) console.error('[FLW verify] order_items insert error:', itemsErr);
	}

	console.log(`[FLW verify] Order ${newOrder.order_number} created for tx_ref: ${tx_ref}`);

	// Email confirmation is sent by the frontend via POST /send-order-confirmation
	// immediately after this response arrives. That keeps it as a visible, awaitable
	// network request rather than a fire-and-forget side-effect inside this handler.
	return c.json({
		success:       true,
		orderId:       newOrder.id,
		orderNumber:   newOrder.order_number,
		paymentStatus: 'paid',
		total,
		subtotal:      serverSubtotal || subtotal,
		shippingFee,
		customerEmail: meta.customerEmail ?? txData.customer?.email ?? null,
		customerName:  meta.payerName ?? txData.customer?.name ?? null,
		payerPhone:    meta.payerPhone ?? txData.customer?.phone_number ?? null,
		txRef:         tx_ref,
		flwRef:        txData.flw_ref ?? null,
	});
});


// ─── POST /api/checkout/send-order-confirmation ───────────────────────────────
// Called by the frontend (CheckoutSuccess page) immediately after
// verify-flutterwave succeeds. Fetches the saved order + items from the DB,
// then sends confirmation emails to the customer and the admin via Resend.
//
// Using a dedicated route means:
//  • The request is visible in the browser network tab
//  • Resend calls are fully awaited — no fire-and-forget, no waitUntil needed
//  • Failures surface as a real HTTP response, not a silent log line
//
// Body: { orderId, customerEmail, customerName, payerPhone?, txRef?, flwRef? }
// Returns: { success, customer: { sent, error? }, admin: { sent, error? } }
checkout.post('/send-order-confirmation', async (c) => {
	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: 'Invalid JSON body' }, 400);
	}

	const { orderId, customerEmail, customerName, payerPhone, txRef, flwRef } = body;

	if (!orderId) return c.json({ error: 'orderId is required' }, 400);

	const db = createSupabaseClient(c.env);

	// Fetch the order and its line items from the DB
	const [{ data: order, error: orderErr }, { data: dbItems, error: itemsErr }] = await Promise.all([
		db.from('orders')
			.select('id, order_number, subtotal, shipping_fee, total, payment_ref, shipping_name, shipping_phone, shipping_state, shipping_country')
			.eq('id', orderId)
			.single(),
		db.from('order_items')
			.select('product_name, variant_size, variant_color, sku, quantity, unit_price, total_price')
			.eq('order_id', orderId),
	]);

	if (orderErr || !order) {
		console.error('[send-confirmation] Order lookup failed:', orderErr);
		return c.json({ error: 'Order not found' }, 404);
	}
	if (itemsErr) {
		console.warn('[send-confirmation] Could not fetch order items:', itemsErr);
	}

	const items        = dbItems ?? [];
	const fmt          = (n) => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(Number(n));
	const frontendOrigin = c.env.FRONTEND_ORIGIN || 'https://jorjimara.com';
	const adminEmail   = c.env.ADMIN_ORDER_EMAIL || 'jorjimara@gmail.com';
	const name         = customerName || order.shipping_name || 'there';
	const phone        = payerPhone   || order.shipping_phone || '';

	// ── Build shared item rows HTML ──────────────────────────────────────────
	const itemRowsHtml = items.map(item => `
		<tr>
		  <td style="padding:16px 0;border-bottom:1px solid #F0EDE8;vertical-align:middle;">
		    <table cellpadding="0" cellspacing="0" width="100%">
		      <tr>
		        <td style="vertical-align:middle;">
		          <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1a1a1a;line-height:1.4;font-family:Arial,sans-serif;">
		            ${item.product_name}
		          </p>
		          ${item.variant_size || item.variant_color
		            ? `<p style="margin:0 0 4px;font-size:13px;color:#888;font-family:Arial,sans-serif;">${[item.variant_size, item.variant_color].filter(Boolean).join(' / ')}</p>`
		            : ''}
		          <p style="margin:0;font-size:13px;color:#aaa;font-family:Arial,sans-serif;">Qty: ${item.quantity}</p>
		        </td>
		        <td style="vertical-align:middle;text-align:right;white-space:nowrap;padding-left:12px;">
		          <p style="margin:0;font-size:14px;font-weight:700;color:#1a1a1a;font-family:Arial,sans-serif;">&#8358;${fmt(item.total_price)}</p>
		          ${item.quantity > 1
		            ? `<p style="margin:4px 0 0;font-size:12px;color:#aaa;font-family:Arial,sans-serif;">&#8358;${fmt(item.unit_price)} each</p>`
		            : ''}
		        </td>
		      </tr>
		    </table>
		  </td>
		</tr>
	`).join('');

	// ── Customer confirmation email ──────────────────────────────────────────
	const customerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Order Confirmed — Jorji Mara</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F1ED;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F1ED;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

        <tr>
          <td align="center" style="padding-bottom:28px;">
            <img src="${frontendOrigin}/src/assets/icons/main_logo.png" alt="Jorji Mara Apparel" style="display:block;max-height:45px;width:auto;margin:0 auto;" />
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;border-radius:2px;overflow:hidden;">
            <table width="100%" cellpadding="0" cellspacing="0">

              <tr>
                <td style="background:#4d0011;padding:44px 44px 38px;">
                  <h1 style="margin:0 0 8px;font-size:36px;line-height:1.15;color:#ffffff;font-family:Georgia,serif;font-weight:400;">
                    Payment confirmed.
                  </h1>
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.55);letter-spacing:3px;text-transform:uppercase;">
                    ORDER CONFIRMATION
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:36px 44px 32px;">
                  <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#333;">
                    Hey <strong>${name}</strong>,
                  </p>
                  <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#333;">
                    Great news — your payment has been confirmed and your order is now being processed. We'll get to work on it right away.
                  </p>
                  <p style="margin:0 0 30px;font-size:15px;line-height:1.7;color:#333;">
                    If you have any questions about your order, feel free to reach out and we'll be happy to help.
                  </p>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <a href="${frontendOrigin}"
                           style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;
                                  font-size:12px;font-weight:700;padding:13px 28px;letter-spacing:1.5px;
                                  text-transform:uppercase;border-radius:2px;">
                          Visit Store
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr><td style="padding:0 44px;"><div style="height:1px;background:#F0EDE8;"></div></td></tr>

              <tr>
                <td style="padding:28px 44px 8px;">
                  <p style="margin:0;font-size:17px;font-weight:700;color:#1a1a1a;">Order summary</p>
                  ${order.order_number ? `<p style="margin:6px 0 0;font-size:12px;color:#aaa;letter-spacing:1.5px;text-transform:uppercase;">Order #${order.order_number}</p>` : ''}
                </td>
              </tr>

              <tr>
                <td style="padding:0 44px;">
                  <table width="100%" cellpadding="0" cellspacing="0">${itemRowsHtml}</table>
                </td>
              </tr>

              <tr>
                <td style="padding:0 44px 36px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;border-top:1px solid #F0EDE8;">
                    <tr>
                      <td style="padding:12px 0 4px;font-size:14px;color:#777;">Subtotal</td>
                      <td style="padding:12px 0 4px;font-size:14px;color:#777;text-align:right;">&#8358;${fmt(order.subtotal)}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#777;">Shipping</td>
                      <td style="padding:4px 0;font-size:14px;color:#777;text-align:right;">&#8358;${fmt(order.shipping_fee)}</td>
                    </tr>
                    <tr><td colspan="2" style="padding-top:14px;"><div style="height:2px;background:#1a1a1a;"></div></td></tr>
                    <tr>
                      <td style="padding:12px 0 0;font-size:20px;font-weight:700;color:#1a1a1a;">Total</td>
                      <td style="padding:12px 0 0;font-size:20px;font-weight:700;color:#1a1a1a;text-align:right;">&#8358;${fmt(order.total)} NGN</td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:28px 20px 10px;">
            <p style="margin:0;font-size:12px;color:#bbb;line-height:1.7;">
              &copy; ${new Date().getFullYear()} Jorji Mara Apparel. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

	// ── Admin notification email ─────────────────────────────────────────────
	const adminSubject = `New order ${order.order_number ? `#${order.order_number} ` : ''}— ₦${fmt(order.total)} (Flutterwave — paid)`;

	const adminHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>${adminSubject}</title></head>
<body style="margin:0;padding:0;background-color:#F4F1ED;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F1ED;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:2px;overflow:hidden;">
        <tr>
          <td style="background:#4d0011;padding:32px 36px;">
            <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.55);letter-spacing:3px;text-transform:uppercase;">New Order — Flutterwave</p>
            <h1 style="margin:0;font-size:28px;line-height:1.2;color:#ffffff;font-family:Georgia,serif;font-weight:400;">
              ${order.order_number ? `Order #${order.order_number}` : 'New Order'}
            </h1>
            <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Payment confirmed via Flutterwave</p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 36px 8px;">
            <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#bbb;">Customer</p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#333;">
              <strong>${name}</strong><br/>
              ${customerEmail ?? '—'}<br/>
              ${phone}
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 36px 8px;">
            <p style="margin:0;font-size:14px;font-weight:700;color:#1a1a1a;">Items</p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">${itemRowsHtml}</table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 36px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;border-top:1px solid #F0EDE8;">
              <tr>
                <td style="padding:12px 0 4px;font-size:14px;color:#777;">Subtotal</td>
                <td style="padding:12px 0 4px;font-size:14px;color:#777;text-align:right;">&#8358;${fmt(order.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#777;">Shipping</td>
                <td style="padding:4px 0;font-size:14px;color:#777;text-align:right;">&#8358;${fmt(order.shipping_fee)}</td>
              </tr>
              <tr><td colspan="2" style="padding-top:14px;"><div style="height:2px;background:#1a1a1a;"></div></td></tr>
              <tr>
                <td style="padding:12px 0 0;font-size:18px;font-weight:700;color:#1a1a1a;">Total</td>
                <td style="padding:12px 0 0;font-size:18px;font-weight:700;color:#1a1a1a;text-align:right;">&#8358;${fmt(order.total)} NGN</td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 36px 32px;">
            <div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:4px;padding:14px 16px;font-size:13px;color:#1b5e20;line-height:1.6;">
              <strong>&#10003; Payment confirmed.</strong> Paid via Flutterwave.<br/>
              ${txRef  ? `<strong>Tx Ref:</strong> ${txRef}<br/>` : ''}
              ${flwRef ? `<strong>FLW Ref:</strong> ${flwRef}` : ''}
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

	// ── Send both emails — fully awaited, no fire-and-forget ─────────────────
	const sendEmail = async (to, subject, html) => {
		const res = await fetch('https://api.resend.com/emails', {
			method:  'POST',
			headers: {
				'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
				'Content-Type':  'application/json',
			},
			body: JSON.stringify({
				from:    c.env.RESEND_FROM_EMAIL || 'orders@jorjimara.com',
				to:      [to],
				subject,
				html,
			}),
		});
		const resBody = await res.json().catch(() => ({}));
		return { ok: res.ok, status: res.status, body: resBody };
	};

	const [customerResult, adminResult] = await Promise.allSettled([
		customerEmail
			? sendEmail(customerEmail, `Payment confirmed — Jorji Mara Apparel`, customerHtml)
			: Promise.resolve({ ok: true, skipped: true, reason: 'no customer email provided' }),
		sendEmail(adminEmail, adminSubject, adminHtml),
	]);

	const customerOutcome = customerResult.status === 'fulfilled'
		? customerResult.value
		: { ok: false, error: String(customerResult.reason) };
	const adminOutcome = adminResult.status === 'fulfilled'
		? adminResult.value
		: { ok: false, error: String(adminResult.reason) };

	if (!customerOutcome.ok) console.error('[send-confirmation] Customer email failed:', customerOutcome);
	if (!adminOutcome.ok)    console.error('[send-confirmation] Admin email failed:',    adminOutcome);

	return c.json({
		success:  customerOutcome.ok || adminOutcome.ok,
		customer: { sent: !!customerOutcome.ok, ...(customerOutcome.ok ? {} : { error: customerOutcome.body ?? customerOutcome.error }) },
		admin:    { sent: !!adminOutcome.ok,    ...(adminOutcome.ok    ? {} : { error: adminOutcome.body    ?? adminOutcome.error    }) },
	});
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

// ─── POST /api/checkout/confirm ──────────────────────────────────────────────
checkout.post('/confirm', async (c) => {
	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: 'Invalid JSON body' }, 400);
	}
	const {
		rrr,
		email,
		full_name,
		shipping,
		items = [],
		subtotal: clientSubtotal = 0,
		shippingFee: clientShippingFee = 0,
		total: clientTotal = 0,
	} = body;

	if (!email) return c.json({ error: 'Email is required' }, 400);

	const fmt = (n) => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(Number(n));

	// ── Persist the order ───────────────────────────────────────────────────
	// We verify variants + recompute money server-side, then insert into
	// orders + order_items. Bank transfer flow → status & payment_status
	// remain 'pending' until the admin confirms the wire transfer.
	const db = createSupabaseClient(c.env);

	let subtotal = Number(clientSubtotal) || 0;
	let shippingFee = Number(clientShippingFee) || 0;
	let total = Number(clientTotal) || 0;
	let lineItems = [];           // rows for order_items insert
	let orderNumber = null;
	let orderId = null;
	const paymentRef = rrr || `JM_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

	const variantIds = items.map(i => i.variantId).filter(Boolean);

	if (variantIds.length === items.length && items.length > 0) {
		// Re-fetch variants to validate cart + recompute totals server-side
		const { data: variants, error: varErr } = await db
			.from('product_variants')
			.select('id, price, stock, is_active, sku, size, color, product_id, products ( name, price, weight )')
			.in('id', variantIds)
			.eq('is_active', true);

		if (varErr || !variants) {
			console.error('[checkout/confirm] variant fetch error:', varErr);
		} else {
			let serverSubtotal = 0;
			const rows = [];
			let allFound = true;

			for (const item of items) {
				const variant = variants.find(v => v.id === item.variantId);
				if (!variant) { allFound = false; break; }

				const unitPrice = Number(variant.price ?? variant.products?.price ?? item.price ?? 0);
				const totalPrice = unitPrice * item.quantity;
				serverSubtotal += totalPrice;

				rows.push({
					variant_id:    variant.id,
					product_name:  variant.products?.name ?? item.productName ?? 'Item',
					variant_size:  variant.size ?? null,
					variant_color: variant.color ?? null,
					sku:           variant.sku ?? null,
					quantity:      item.quantity,
					unit_price:    unitPrice,
					total_price:   totalPrice,
					image_url:     item.imageUrl ?? null,
				});
			}

			if (allFound) {
				subtotal = serverSubtotal;
				// Recompute shipping server-side (mirrors /init)
				try {
					const shippingResult = calculateShipping({
						items,
						countryCode: shipping?.country,
						stateRegion: shipping?.state ?? '',
						variants,
					});
					shippingFee = shippingResult.shippingFee;
				} catch {
					// fall back to client-supplied fee if the calculator rejects
				}
				total = subtotal + shippingFee;
				lineItems = rows;
			}
		}
	}

	// Idempotency — if an order with this payment_ref already exists, reuse it
	const { data: existingOrder } = await db
		.from('orders')
		.select('id, order_number')
		.eq('payment_ref', paymentRef)
		.maybeSingle();

	if (existingOrder) {
		orderId = existingOrder.id;
		orderNumber = existingOrder.order_number;
	} else {
		const { data: newOrder, error: orderErr } = await db
			.from('orders')
			.insert({
				payment_ref:       paymentRef,
				payment_method:    'bank_transfer',
				payment_provider:  'manual',
				payment_status:    'pending',
				status:            'pending',
				subtotal,
				shipping_fee:      shippingFee,
				discount_amount:   0,
				total,
				currency:          'NGN',
				shipping_name:     full_name ?? null,
				shipping_phone:    shipping?.phone ?? null,
				shipping_address1: shipping?.address ?? null,
				shipping_address2: shipping?.apartment ?? null,
				shipping_city:     shipping?.city ?? null,
				shipping_state:    shipping?.state ?? null,
				shipping_country:  shipping?.country ?? null,
				notes:             `Bank transfer pending verification. Customer email: ${email}`,
			})
			.select('id, order_number')
			.single();

		if (orderErr || !newOrder) {
			console.error('[checkout/confirm] order insert error:', orderErr);
			return c.json({ error: 'Could not save order. Please contact support.' }, 500);
		}

		orderId = newOrder.id;
		orderNumber = newOrder.order_number;

		if (lineItems.length > 0) {
			const itemRows = lineItems.map(r => ({ ...r, order_id: orderId }));
			const { error: itemsErr } = await db.from('order_items').insert(itemRows);
			if (itemsErr) {
				console.error('[checkout/confirm] order_items insert error:', itemsErr);
				// Order is saved; line items failed — flag for manual review
			}
		}
	}

	// ── Build order item rows ────────────────────────────────────────────────
	const itemRowsHtml = items.map(item => `
		<tr>
		  <td style="padding:16px 0;border-bottom:1px solid #F0EDE8;vertical-align:middle;">
		    <table cellpadding="0" cellspacing="0" width="100%">
		      <tr>
		        <td width="68" style="vertical-align:middle;padding-right:14px;">
		          ${item.imageUrl
				? `<img src="${item.imageUrl}" alt="${item.productName}" width="60" height="68" style="display:block;object-fit:cover;border-radius:3px;" />`
				: `<div style="width:60px;height:68px;background:#F0EDE8;border-radius:3px;"></div>`
			}
		        </td>
		        <td style="vertical-align:middle;">
		          <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1a1a1a;line-height:1.4;font-family:Arial,sans-serif;">
		            ${item.productName}
		          </p>
		          ${item.variantLabel ? `<p style="margin:0 0 4px;font-size:13px;color:#888;font-family:Arial,sans-serif;">${item.variantLabel}</p>` : ''}
		          <p style="margin:0;font-size:13px;color:#aaa;font-family:Arial,sans-serif;">Qty: ${item.quantity}</p>
		        </td>
		        <td style="vertical-align:middle;text-align:right;white-space:nowrap;padding-left:12px;">
		          <p style="margin:0;font-size:14px;font-weight:700;color:#1a1a1a;font-family:Arial,sans-serif;">&#8358;${fmt(item.price * item.quantity)}</p>
		          ${item.quantity > 1 ? `<p style="margin:4px 0 0;font-size:12px;color:#aaa;font-family:Arial,sans-serif;">&#8358;${fmt(item.price)} each</p>` : ''}
		        </td>
		      </tr>
		    </table>
		  </td>
		</tr>
	`).join('');

	// ── Shipping address display ─────────────────────────────────────────────
	const shippingLines = [
		shipping?.address,
		shipping?.apartment,
		shipping?.city,
		shipping?.state,
	].filter(Boolean).join(', ');

	const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Order Confirmation — Jorji Mara</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F1ED;font-family:Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F1ED;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- Brand header -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <img src="${c.env.FRONTEND_ORIGIN || 'https://jorjimara.com'}/src/assets/icons/main_logo.png" alt="Jorji Mara Apparel" style="display:block; max-height:45px; width:auto; margin:0 auto;" />
            </td>
          </tr>

          <!-- White card -->
          <tr>
            <td style="background:#ffffff;border-radius:2px;overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Burgundy hero band -->
                <tr>
                  <td style="background:#4d0011;padding:44px 44px 38px;">
                    <h1 style="margin:0 0 8px;font-size:36px;line-height:1.15;color:#ffffff;font-family:Georgia,serif;font-weight:400;">
                      We're on it.
                    </h1>
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.55);letter-spacing:3px;text-transform:uppercase;">
                      ORDER CONFIRMATION
                    </p>
                  </td>
                </tr>

                <!-- Body copy -->
                <tr>
                  <td style="padding:36px 44px 32px;">
                    <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#333;">
                      Hey <strong>${full_name || 'there'}</strong>,
                    </p>
                    <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#333;">
                      This is just a quick note to say we've received your order.
                    </p>
                    <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#333;">
                      Once your bank transfer is confirmed, we'll send you another email to let you know whether payment was received and to provide next steps.
                    </p>
                    <p style="margin:0 0 30px;font-size:15px;line-height:1.7;color:#333;">
                      In the meantime, if you have any questions, feel free to reach out and we'll be happy to help.
                    </p>

                    <!-- Single CTA: Visit Store only -->
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <a href="${c.env.FRONTEND_ORIGIN || 'https://jorjimara.com'}"
                             style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;
                                    font-size:12px;font-weight:700;padding:13px 28px;letter-spacing:1.5px;
                                    text-transform:uppercase;border-radius:2px;">
                            Visit Store
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr><td style="padding:0 44px;"><div style="height:1px;background:#F0EDE8;"></div></td></tr>

                <!-- Order summary header -->
                <tr>
                  <td style="padding:28px 44px 8px;">
                    <p style="margin:0;font-size:17px;font-weight:700;color:#1a1a1a;">Order summary</p>
                  </td>
                </tr>

                <!-- Items -->
                <tr>
                  <td style="padding:0 44px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${itemRowsHtml}
                    </table>
                  </td>
                </tr>

                <!-- Totals -->
                <tr>
                  <td style="padding:0 44px 36px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;border-top:1px solid #F0EDE8;">
                      <tr>
                        <td style="padding:12px 0 4px;font-size:14px;color:#777;">Subtotal</td>
                        <td style="padding:12px 0 4px;font-size:14px;color:#777;text-align:right;">&#8358;${fmt(subtotal)}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:14px;color:#777;">Shipping (${shipping?.method || 'Standard Delivery'})</td>
                        <td style="padding:4px 0;font-size:14px;color:#777;text-align:right;">&#8358;${fmt(shippingFee)}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top:14px;">
                          <div style="height:2px;background:#1a1a1a;"></div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0 0;font-size:20px;font-weight:700;color:#1a1a1a;">Total</td>
                        <td style="padding:12px 0 0;font-size:20px;font-weight:700;color:#1a1a1a;text-align:right;">&#8358;${fmt(total)} NGN</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${shippingLines ? `
                <!-- Divider -->
                <tr><td style="padding:0 44px;"><div style="height:1px;background:#F0EDE8;"></div></td></tr>

                <!-- Shipping address -->
                <tr>
                  <td style="padding:24px 44px 36px;">
                    <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#bbb;">
                      Shipping to
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#333;">
                      ${full_name || ''}<br/>
                      ${shippingLines}${shipping?.phone ? `<br/>${shipping.phone}` : ''}
                    </p>
                  </td>
                </tr>` : ''}

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 20px 10px;">
              <p style="margin:0;font-size:12px;color:#bbb;line-height:1.7;">
                &copy; ${new Date().getFullYear()} Jorji Mara Apparel. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

	// ── Admin notification email ────────────────────────────────────────────
	const adminEmail = c.env.ADMIN_ORDER_EMAIL || 'jorjimara@gmail.com';
	const adminSubject = `New order ${orderNumber ? `#${orderNumber} ` : ''}— ₦${fmt(total)} (bank transfer pending)`;

	const adminHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>${adminSubject}</title></head>
<body style="margin:0;padding:0;background-color:#F4F1ED;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F1ED;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:2px;overflow:hidden;">
        <tr>
          <td style="background:#4d0011;padding:32px 36px;">
            <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.55);letter-spacing:3px;text-transform:uppercase;">New Order — Action Required</p>
            <h1 style="margin:0;font-size:28px;line-height:1.2;color:#ffffff;font-family:Georgia,serif;font-weight:400;">
              ${orderNumber ? `Order #${orderNumber}` : 'New Order'}
            </h1>
            <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Bank transfer pending verification</p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 36px 8px;">
            <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#bbb;">Customer</p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#333;">
              <strong>${full_name || '—'}</strong><br/>
              ${email}${shipping?.phone ? `<br/>${shipping.phone}` : ''}
            </p>
          </td>
        </tr>

        ${shippingLines ? `
        <tr>
          <td style="padding:18px 36px 8px;">
            <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#bbb;">Shipping to</p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#333;">
              ${shippingLines}${shipping?.postcode ? `, ${shipping.postcode}` : ''}${shipping?.country ? ` (${shipping.country})` : ''}
            </p>
            ${shipping?.method ? `<p style="margin:6px 0 0;font-size:13px;color:#666;">Method: ${shipping.method}</p>` : ''}
          </td>
        </tr>` : ''}

        <tr>
          <td style="padding:20px 36px 8px;">
            <p style="margin:0;font-size:14px;font-weight:700;color:#1a1a1a;">Items</p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${itemRowsHtml}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 36px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;border-top:1px solid #F0EDE8;">
              <tr>
                <td style="padding:12px 0 4px;font-size:14px;color:#777;">Subtotal</td>
                <td style="padding:12px 0 4px;font-size:14px;color:#777;text-align:right;">&#8358;${fmt(subtotal)}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:14px;color:#777;">Shipping</td>
                <td style="padding:4px 0;font-size:14px;color:#777;text-align:right;">&#8358;${fmt(shippingFee)}</td>
              </tr>
              <tr><td colspan="2" style="padding-top:14px;"><div style="height:2px;background:#1a1a1a;"></div></td></tr>
              <tr>
                <td style="padding:12px 0 0;font-size:18px;font-weight:700;color:#1a1a1a;">Total</td>
                <td style="padding:12px 0 0;font-size:18px;font-weight:700;color:#1a1a1a;text-align:right;">&#8358;${fmt(total)} NGN</td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 36px 32px;">
            <div style="background:#FFF8E1;border:1px solid #FFE08A;border-radius:4px;padding:14px 16px;font-size:13px;color:#7a5a00;line-height:1.6;">
              <strong>Payment ref:</strong> ${paymentRef}<br/>
              Please verify the bank transfer in Stanbic IBTC (0081688464) and then mark this order as paid.
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

	const sendEmail = (to, subject, html) => fetch('https://api.resend.com/emails', {
		method:  'POST',
		headers: {
			'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
			'Content-Type':  'application/json',
		},
		body: JSON.stringify({
			from:    c.env.RESEND_FROM_EMAIL || 'orders@jorjimara.com',
			to:      [to],
			subject,
			html,
		}),
	});

	const [customerRes, adminRes] = await Promise.allSettled([
		sendEmail(email, `We're on it — Jorji Mara Apparel`, emailHtml),
		sendEmail(adminEmail, adminSubject, adminHtml),
	]);

	if (customerRes.status === 'rejected' || (customerRes.value && !customerRes.value.ok)) {
		const errBody = customerRes.status === 'fulfilled'
			? await customerRes.value.json().catch(() => ({}))
			: { message: String(customerRes.reason) };
		console.error('Resend customer email error:', errBody);
		return c.json({
			success:     true,
			orderId,
			orderNumber,
			emailWarning: errBody.message ?? 'Customer email failed',
		}, 200);
	}

	if (adminRes.status === 'rejected' || (adminRes.value && !adminRes.value.ok)) {
		const errBody = adminRes.status === 'fulfilled'
			? await adminRes.value.json().catch(() => ({}))
			: { message: String(adminRes.reason) };
		console.error('Resend admin email error:', errBody);
	}

	return c.json({ success: true, orderId, orderNumber }, 200);
});

export default checkout;
