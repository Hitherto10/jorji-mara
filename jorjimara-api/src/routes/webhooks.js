import { Hono } from 'hono';
import { createSupabaseClient } from '../lib/supabase.js';
const webhooks = new Hono();
// Paystack webhook
webhooks.post("/payment", async (c) => {
    const rawBody = await c.req.text();
    const signature = c.req.header("x-paystack-signature");
    // 1. Verify HMAC-SHA512 signature
    const isValid = await verifyPaystackSignature(
        rawBody,
        signature,
        c.env.WEBHOOK_SIGNATURE_SECRET
    );
    if (!isValid) {
        console.warn("[Webhook] Invalid signature — ignoring");
        return c.json({ error: "Unauthorized" }, 401);
    }
    let event;
    try { event = JSON.parse(rawBody); }
    catch { return c.json({ error: "Bad payload" }, 400); }
    // 2. Only handle successful charges
    if (event.event !== "charge.success") {
        return c.json({ received: true });
    }
    const { reference, amount, metadata, customer } = event.data;
    // 3. Check for duplicate webhook delivery (idempotency)
    const db = createSupabaseClient(c.env);
    const { data: existing } = await db
        .from("orders")
        .select("id")
        .eq("payment_reference", reference)
        .single(); if (existing) {
            console.log("[Webhook] Duplicate — already processed:", reference);
            return c.json({ received: true });
        }
    // 4. Insert order into Supabase
    // Adjust the column names to match your actual orders table schema
    const orderPayload = {
        payment_reference: reference,
        email: customer.email,
        total_amount: amount / 100, // Convert kobo → NGN
        currency: "NGN",
        shipping_method: metadata.shippingMethod,
        shipping_cost: metadata.shippingCost,
        line_items: metadata.lineItems,
        status: "paid",
        created_at: new Date().toISOString(),
    };


    const { error: insertError } = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/orders`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": c.env.SUPABASE_SERVICE_ROLE,
                "Authorization": `Bearer ${c.env.SUPABASE_SERVICE_ROLE}`,
                "Prefer": "return=minimal",
            },
            body: JSON.stringify(orderPayload),
        }
    );
    console.log("[Webhook] Order inserted for reference:", reference);
    return c.json({ received: true });
});


// HMAC-SHA512 verification using Web Crypto API
async function verifyPaystackSignature(body, signature, secret) {
    if (!signature || !secret) return false; const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
    return hex === signature;
}
export default webhooks;