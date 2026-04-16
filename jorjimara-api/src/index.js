// src/index.js
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import catalogRoutes from './routes/catalog.js';
import productRoutes from './routes/products.js';
import checkoutRoutes from './routes/checkout.js';
import contactRoutes from './routes/contact.js';
import webhookRoutes from './routes/webhooks.js';
import generate from "./routes/remita/generateRRR";
import { rateLimitMiddleware } from './lib/ratelimit.js';

const app = new Hono();


// CORS
app.use("*", cors({
	origin: (origin, c) => {
		const allowed = [
			c.env.FRONTEND_ORIGIN,
			"https://jorjimara.com",
			"http://localhost:5173",
		];
		return allowed.includes(origin) ? origin : null;
	},
	allowMethods: ['GET', 'POST', 'OPTIONS'],
	allowHeaders: ['Content-Type', 'Authorization'],
	maxAge: 86400,
}));


// Rate limiting (applied to all /api/* routes)
app.use("/api/*", rateLimitMiddleware);


// Route groups
app.route("/api/catalog", catalogRoutes);
app.route("/api/products", productRoutes);
app.route("/api/checkout", checkoutRoutes);
app.route("/api/contact", contactRoutes);
app.route("/api/webhooks", webhookRoutes);
app.route("/api/generate", generate);


app.get("/health", (c) => c.json({ status: "ok", ts: Date.now() })); // Health check
app.notFound((c) => c.json({ error: "Not found" }, 404)); // 404
app.onError((err, c) => {
	console.error("[Worker Error]", err);
	return c.json({ error: "Internal server error" }, 500);
});

export default app;
