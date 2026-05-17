// src/index.js
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import catalogRoutes  from './routes/catalog.js';
import productRoutes  from './routes/products.js';
import checkoutRoutes from './routes/checkout.js';
import saveOrderRoute from './routes/remita/saveOrder.js';
import contactRoutes  from './routes/contact.js';
import webhookRoutes  from './routes/webhooks.js';
import { rateLimitMiddleware } from './lib/ratelimit.js';

const app = new Hono();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use('*', cors({
	origin: (origin, c) => {
		const allowed = [
			c.env.FRONTEND_ORIGIN,
			'https://jorjimara.com',
			'http://localhost:5174',
		];
		return allowed.includes(origin) ? origin : null;
	},
	allowMethods:  ['GET', 'POST', 'OPTIONS'],
	allowHeaders:  ['Content-Type', 'Authorization'],
	maxAge:        86400,
}));

// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use('/api/*', rateLimitMiddleware);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.route('/api/catalog',    catalogRoutes);
app.route('/api/products',   productRoutes);
app.route('/api/checkout',   checkoutRoutes);

// POST /api/checkout/save-order  — call after successful Remita payment
app.route('/api/checkout/save-order', saveOrderRoute);

app.route('/api/contact',    contactRoutes);

// POST /api/webhooks/remita   — Remita notifies us of payment status changes
// POST /api/webhooks/paystack — Paystack notifies us of charge.success events
app.route('/api/webhooks',   webhookRoutes);

// ─── Utility ──────────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', ts: Date.now() }));
app.notFound((c)  => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
	console.error('[Worker Error]', err);
	return c.json({ error: 'Internal server error' }, 500);
});

export default app;
