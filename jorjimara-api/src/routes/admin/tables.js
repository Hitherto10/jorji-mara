import { Hono } from 'hono';
import { createSupabaseClient } from '../../lib/supabase.js';

// Explicit allowlist — never expose tables outside this set.
const ALLOWED_TABLES = new Set([
	'products',
	'categories',
	'collections',
	'collection_products',
	'size_charts',
	'product_variants',
	'product_images',
	'orders',
	'order_items',
	'profiles',
	'addresses',
	'carts',
	'cart_items',
	'reviews',
	'wishlists',
	'coupons',
	'newsletter_subscribers',
	'pending_checkouts',
]);

const router = new Hono();

// ── GET  /api/admin/tables/:table ─────────────────────────────────────────────
// Query params:
//   page, pageSize, search, searchField, sortField, sortOrder
//   filters={"col":"val"}  →  column equality filters (eq)
//   in_<col>=val1,val2    →  IN filters
router.get('/:table', async (c) => {
	const table = c.req.param('table');
	if (!ALLOWED_TABLES.has(table)) return c.json({ error: 'Unknown table' }, 400);

	const q       = c.req.query();
	const page    = Math.max(0, parseInt(q.page    ?? '0'));
	const pageSize = Math.min(500, Math.max(1, parseInt(q.pageSize ?? '50')));

	const db = createSupabaseClient(c.env);
	let query = db.from(table).select('*', { count: 'exact' }).range(page * pageSize, (page + 1) * pageSize - 1);

	if (q.search && q.searchField) {
		query = query.ilike(q.searchField, `%${q.search}%`);
	}

	if (q.sortField) {
		query = query.order(q.sortField, { ascending: q.sortOrder === 'asc' });
	}

	// Column equality filters passed as JSON
	if (q.filters) {
		try {
			const filters = JSON.parse(q.filters);
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null && value !== '') {
					query = query.eq(key, value);
				}
			}
		} catch {
			return c.json({ error: 'Invalid filters JSON' }, 400);
		}
	}

	// IN filters: in_product_id=id1,id2,id3
	for (const [key, value] of Object.entries(q)) {
		if (key.startsWith('in_') && value) {
			const col  = key.slice(3);
			const vals = value.split(',').filter(Boolean);
			if (vals.length) query = query.in(col, vals);
		}
	}

	const { data, error, count } = await query;
	if (error) return c.json({ error: error.message }, 400);
	return c.json({ data: data ?? [], count: count ?? 0 });
});

// ── POST /api/admin/tables/:table ─────────────────────────────────────────────
router.post('/:table', async (c) => {
	const table = c.req.param('table');
	if (!ALLOWED_TABLES.has(table)) return c.json({ error: 'Unknown table' }, 400);

	const payload = await c.req.json();
	const db = createSupabaseClient(c.env);

	const { data, error } = await db.from(table).insert(payload).select();
	if (error) return c.json({ error: error.message }, 400);
	return c.json({ data: Array.isArray(data) ? data[0] : data }, 201);
});

// ── POST /api/admin/tables/:table/batch-delete ────────────────────────────────
// Body: { ids: string[], primaryKey?: string }
router.post('/:table/batch-delete', async (c) => {
	const table = c.req.param('table');
	if (!ALLOWED_TABLES.has(table)) return c.json({ error: 'Unknown table' }, 400);

	const { ids, primaryKey = 'id' } = await c.req.json();
	if (!Array.isArray(ids) || ids.length === 0) {
		return c.json({ error: 'ids must be a non-empty array' }, 400);
	}

	const db = createSupabaseClient(c.env);
	const { error } = await db.from(table).delete().in(primaryKey, ids);
	if (error) return c.json({ error: error.message }, 400);
	return c.json({ success: true });
});

// ── PATCH /api/admin/tables/:table/:id ───────────────────────────────────────
// Query param: primaryKey (default "id")
// Body: the fields to update (no primaryKey field in body)
router.patch('/:table/:id', async (c) => {
	const table = c.req.param('table');
	const id    = c.req.param('id');
	if (!ALLOWED_TABLES.has(table)) return c.json({ error: 'Unknown table' }, 400);

	const primaryKey = c.req.query('primaryKey') || 'id';
	const payload    = await c.req.json();
	const db = createSupabaseClient(c.env);

	const { data, error } = await db.from(table).update(payload).eq(primaryKey, id).select();
	if (error) return c.json({ error: error.message }, 400);
	return c.json({ data: Array.isArray(data) ? data[0] : data });
});

// ── DELETE /api/admin/tables/:table/:id ──────────────────────────────────────
// Query param: primaryKey (default "id")
router.delete('/:table/:id', async (c) => {
	const table = c.req.param('table');
	const id    = c.req.param('id');
	if (!ALLOWED_TABLES.has(table)) return c.json({ error: 'Unknown table' }, 400);

	const primaryKey = c.req.query('primaryKey') || 'id';
	const db = createSupabaseClient(c.env);

	const { error } = await db.from(table).delete().eq(primaryKey, id);
	if (error) return c.json({ error: error.message }, 400);
	return c.json({ success: true });
});

export default router;
