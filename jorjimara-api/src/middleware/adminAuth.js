// Validates requests to /api/admin/* by comparing the Bearer token against
// the ADMIN_SECRET environment variable set via `wrangler secret put ADMIN_SECRET`.
export async function adminAuthMiddleware(c, next) {
	const auth = c.req.header('Authorization')
	if (!auth?.startsWith('Bearer ')) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	const token = auth.slice(7)
	if (!c.env.ADMIN_SECRET || token !== c.env.ADMIN_SECRET) {
		return c.json({ error: 'Forbidden' }, 403)
	}

	await next()
}
