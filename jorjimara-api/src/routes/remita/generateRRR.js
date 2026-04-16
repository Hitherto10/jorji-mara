import { Hono } from 'hono';
import { createSupabaseClient } from '../../lib/supabase.js';

const generate = new Hono();

const MERCHANT_ID = "2547916";
const API_KEY = "1946";
const SERVICE_TYPE_ID = "4430731";
const LIVE_URL = "demo.remita.net";
const GEN_RRR_PATH = "/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit";
const SHIPPING = { standard: 2500, express: 5000 };

generate.post('/rrr', async (c) => {
	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const { items, shippingMethod = "standard", email, payerName, payerEmail, payerPhone, description } = body;
	// Input validation
	if (!email || !email.includes("@"))
		return c.json({ error: "Valid email is required" }, 400);
	if (!Array.isArray(items) || items.length === 0)
		return c.json({ error: "Cart is empty" }, 400);
	if (!SHIPPING[shippingMethod])
		return c.json({ error: "Invalid shipping method" }, 400);
	if (!payerName || !payerEmail || !payerPhone || !description)
		return c.json({ error: "Missing required payer details" }, 400);

	const variantIds = items.map(i => i.variantId).filter(Boolean);
	if (variantIds.length !== items.length)
		return c.json({ error: "All items must have a variantId" }, 400);
	// Fetch real prices from database
	const db = createSupabaseClient(c.env);
	const { data: variants, error } = await db
		.from("product_variants")
		.select("id, price, stock, is_active, product_id, products ( name, price )")
		.in("id", variantIds)
		.eq("is_active", "true");
	if (error) return c.json({ error: "Could not verify cart" }, 500);
	// Validate every item is in stock
	for (const item of items) {
		const variant = variants.find(v => v.id === item.variantId);
		if (!variant) return c.json({ error: `Variant ${item.variantId} not found or inactive` }, 400);
		if (variant.stock < item.quantity)
			return c.json({ error: `Insufficient stock for variant ${item.variantId}` }, 400);
		if (item.quantity < 1 || !Number.isInteger(item.quantity))
			return c.json({ error: "Quantity must be a positive integer" }, 400);
	}
	// Calculate server-side subtotal
	let subtotal = 0;
	const lineItems = items.map(item => {
		const variant = variants.find(v => v.id === item.variantId);
		const price = Number(variant.price ?? variant.products?.price ?? 0);
		subtotal += price * item.quantity;
		return { variantId: item.variantId, quantity: item.quantity, price, lineTotal: price * item.quantity };
	});
	const shippingCost = SHIPPING[shippingMethod];
	const total = subtotal + shippingCost;

	// Generate RRR
	const totalAmount = String(total);
	const orderId = Date.now();
	const hashString = MERCHANT_ID + SERVICE_TYPE_ID + orderId + totalAmount + API_KEY;
	const encoder = new TextEncoder();
	const data = encoder.encode(hashString);
	const hashBuffer = await crypto.subtle.digest('SHA-512', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const apiHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

	const requestBody = JSON.stringify({
		serviceTypeId: SERVICE_TYPE_ID,
		amount: totalAmount,
		orderId: orderId,
		payerName,
		payerEmail,
		payerPhone,
		description
	});
	console.log(requestBody)

	const response = await fetch(`https://${LIVE_URL}${GEN_RRR_PATH}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `remitaConsumerKey=${MERCHANT_ID},remitaConsumerToken=${apiHash}`
		},
		body: requestBody
	});

	if (!response.ok) {
		return c.json({ error: "Failed to generate RRR" }, 500);
	}

	const responseText = await response.text();
	const jsonStart = responseText.indexOf('(') + 1;
	const jsonEnd = responseText.lastIndexOf(')');
	const jsonString = responseText.substring(jsonStart, jsonEnd);
	let remitaResponse;
	try {
		remitaResponse = JSON.parse(jsonString);
	} catch (e) {
		return c.json({ error: "Invalid response from Remita" }, 500);
	}

	const rrr = remitaResponse.RRR;
	if (rrr) {
		return c.json({ success: true, rrr });
	} else {
		return c.json({ error: "Failed to generate RRR", details: remitaResponse }, 500);
	}
});

export default generate;
