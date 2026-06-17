// src/index.js
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import catalogRoutes       from './routes/catalog.js';
import productRoutes       from './routes/products.js';
import checkoutRoutes      from './routes/checkout.js';
import saveOrderRoute      from './routes/remita/saveOrder.js';
import contactRoutes       from './routes/contact.js';
import webhookRoutes       from './routes/webhooks.js';
import adminRoutes         from './routes/admin/index.js';
import { rateLimitMiddleware } from './lib/ratelimit.js';
import { adminAuthMiddleware } from './middleware/adminAuth.js';

const app = new Hono();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use('*', cors({
	origin: (origin, c) => {
		const allowed = [
			c.env.FRONTEND_ORIGIN,
			c.env.ADMIN_ORIGIN,
			'https://jorjimara.com',
			'https://admin.jorjimara.com',
			'http://localhost:5173',
			'http://localhost:5174',
			'http://localhost:5175',
			'http://localhost:5176',
		];
		return allowed.includes(origin) ? origin : null;
	},
	allowMethods:  ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowHeaders:  ['Content-Type', 'Authorization'],
	maxAge:        86400,
}));

// ─── Rate limiting (public routes only — admin is exempt) ─────────────────────
app.use('/api/catalog/*', rateLimitMiddleware);
app.use('/api/products/*', rateLimitMiddleware);
app.use('/api/checkout/*', rateLimitMiddleware);
app.use('/api/contact/*',  rateLimitMiddleware);
app.use('/api/webhooks/*', rateLimitMiddleware);

// ─── Admin routes (auth-guarded) ──────────────────────────────────────────────
app.use('/api/admin/*', adminAuthMiddleware);
app.route('/api/admin', adminRoutes);

// ─── Public routes ────────────────────────────────────────────────────────────
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
