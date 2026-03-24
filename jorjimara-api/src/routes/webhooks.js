// const crypto = require('crypto')
// const supabase = require('../supabase')
// const express = require('express');
//
// import crypto from 'crypto.js'
//
//
// // const { sendOrderConfirmationEmail } = require('../services/email')
//
//
//
//
//
//
// const router = express.Router();
//
// router.post('/:provider', express.raw({ type: 'application/json' }),
//     async (req, res) => {
//         const { provider } = req.params
//         // 1. Verify signature — reject anything not from the real gateway
//         const secret = process.env[`${provider.toUpperCase()}_WEBHOOK_SECRET`]
//         const signature = req.headers[`x-${provider}-signature`]
//         const hash = crypto.createHmac('sha512', secret)
//             .update(req.body).digest('hex')
//         if (hash !== signature) return res.status(401).json({ error: 'Invalid signature.' })
//                 const event = JSON.parse(req.body)
//                 // 2. Detect payment success (event name varies by gateway)
//                 const isSuccess = (
//                     event.event === 'charge.success' || // Paystack
//                     event.event === 'charge.completed' || // Flutterwave
//                     event.data?.status === 'successful' // others
//                 )
//                 if (isSuccess) {
//                     const order_id = event.data?.metadata?.order_id
//                     if (!order_id) return res.sendStatus(200) // no order reference — ignore
//                     // 3. Mark order as paid
//                     // idempotency guard: .eq("payment_status", "pending") means this only
//                     // fires once even if the webhook is delivered twice.
//                     const { data: order } = await supabase
//                         .from('orders')
//                         .update({ status: 'processing', payment_status: 'paid',
//                             payment_provider: provider, paid_at: new Date() })
//                         .eq('id', order_id).eq('payment_status', 'pending')
//                         .select('*, order_items(*)').single()
//                     if (order) {
//                         // 4. Decrement stock for every ordered variant
//                         for (const item of order.order_items) {
//                             await supabase.rpc('decrement_stock', {
//                                 variant_id: item.variant_id, qty: item.quantity,
//                             })
//                         }
//                         // 5. Send order confirmation email to customer
//                         const customerEmail = event.data?.customer?.email
//                         if (customerEmail) await sendOrderConfirmationEmail(order, customerEmail)
//                     }
//                 }
//                 res.sendStatus(200) // always respond 200 — gateways retry on any other code
//             }
//         )
//
// export default router