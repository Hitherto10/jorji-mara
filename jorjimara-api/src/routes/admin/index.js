import { Hono } from 'hono';
import tableRoutes from './tables.js';

const admin = new Hono();

// GET /api/admin/auth/verify — lightweight token check used by the login page
admin.get('/auth/verify', (c) => c.json({ ok: true }));

admin.route('/tables', tableRoutes);

export default admin;
