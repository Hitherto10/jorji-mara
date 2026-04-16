// src/routes/checkout.js
import { Hono } from 'hono';
import { createSupabaseClient } from '../lib/supabase.js';
const checkout = new Hono();
const SHIPPING = { standard: 2500, express: 5000 };

checkout.post("/init", async (c) => {
    let body;

    try {
		body = await c.req.json();
	}
    catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

    const { items, shippingMethod = "standard", email } = body;
    // Input
    if (!email || !email.includes("@"))
        return c.json({ error: "Valid email is required" }, 400);
    if (!Array.isArray(items) || items.length === 0)
        return c.json({ error: "Cart is empty" }, 400);
    if (!SHIPPING[shippingMethod])
        return c.json({ error: "Invalid shipping method" }, 400);


    const variantIds = items.map(i => i.variantId).filter(Boolean);
    if (variantIds.length !== items.length)
        return c.json({ error: "All items must have a variantId" }, 400);// Fetch real prices from database
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
    // Initialize Paystack transaction
    const reference = `JM_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
            "Content-Type": "application/json", "Authorization": `Bearer ${c.env.PAYSTACK_SECRET_KEY}`,
        },
        body: JSON.stringify({
            email,
            amount: total * 100, // Paystack uses kobo (smallest unit)
            reference,
            currency: "NGN",
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
        console.error("[Paystack init error]", err);
        return c.json({ error: "Payment initialization failed" }, 502);
    }
    const { data: psData } = await paystackRes.json();
    return c.json({
        paymentUrl: psData.authorization_url,
        reference: psData.reference,
        total,
    });
});
export default checkout;
