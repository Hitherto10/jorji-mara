// src/routes/checkout.js
import { Hono } from 'hono';
import { createSupabaseClient } from '../lib/supabase.js';

const checkout = new Hono();

// Shipping fees - these should match the frontend SHIPPING_OPTIONS
const SHIPPING = {
	express: 5000,           // Express Delivery Within Abuja (2–3 business days)
	'other-states': 8000,    // Delivery Outside Abuja (5–10 business days)
};
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
		shippingMethod,
		email, payerName, payerEmail,
		payerPhone, description, paymentMethod,
	} = body;

	//  Input validation
	if (!email || !email.includes('@'))
		return c.json({ error: 'Please provide a valid email' }, 400);
	if (!Array.isArray(items) || items.length === 0)
		return c.json({ error: 'Cart is empty' }, 400);
	if (!shippingMethod || !SHIPPING[shippingMethod])
		return c.json({ error: 'Invalid or missing shipping method' }, 400);

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

// ─── POST /api/checkout/confirm ──────────────────────────────────────────────
checkout.post('/confirm', async (c) => {
	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: 'Invalid JSON body' }, 400);
	}
	const { email, full_name, shipping, items = [], subtotal = 0, shippingFee = 0, total = 0 } = body;

	if (!email) return c.json({ error: 'Email is required' }, 400);

	const fmt = (n) => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(Number(n));

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

	const resendRes = await fetch('https://api.resend.com/emails', {
		method:  'POST',
		headers: {
			'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
			'Content-Type':  'application/json',
		},
		body: JSON.stringify({
			from:    c.env.RESEND_FROM_EMAIL || 'orders@jorjimara.com',
			to:      [email],
			subject: `We're on it — Jorji Mara Apparel`,
			html:    emailHtml,
		}),
	});

	if (!resendRes.ok) {
		const resendErr = await resendRes.json().catch(() => ({}));
		console.error('Resend error:', resendErr);
		return c.json({ error: resendErr.message ?? 'Failed to send confirmation email' }, 400);
	}

	return c.json({ success: true }, 200);
});

export default checkout;
