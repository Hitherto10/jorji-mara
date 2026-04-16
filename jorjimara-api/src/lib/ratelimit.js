// src/lib/ratelimit.js
// Per-route limits (requests per 60 seconds per IP)
const LIMITS = {
    "/api/products/search": 30,
    "/api/checkout/init": 10,
    "/api/contact": 5,
    "default": 100,
};





function getLimit(pathname) {
    for (const [pattern, limit] of Object.entries(LIMITS)) {
        if (pathname === pattern) return limit;
    }
    return LIMITS.default;
}

/**
* Hono middleware — checks and increments the rate limit counter in KV.
* Key format: rl:{ip}:{route-group}
* Value: JSON { count, windowStart }
*/
export async function rateLimitMiddleware(c, next) {
    const kv
        = c.env.RATE_LIMIT_KV; const ip
            = c.req.header("CF-Connecting-IP") ?? "unknown";
    const pathname = new URL(c.req.url).pathname;
    const limit = getLimit(pathname);
    const key = `rl:${ip}:${pathname}`;
    const now = Date.now();
    const window = 60_000; // 60 seconds in ms
    const raw = await kv.get(key);
    let state = raw ? JSON.parse(raw) : { count: 0, windowStart: now };
    // Reset if outside the current window
    if (now - state.windowStart > window) {
        state = { count: 0, windowStart: now };
    }
    if (state.count >= limit) {
        const retryAfter = Math.ceil((state.windowStart + window - now) / 1000);
        return c.json({ error: "Rate limit exceeded" }, 429, {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
        });
    }
    state.count++;
    // Store with TTL slightly longer than the window
    await kv.put(key, JSON.stringify(state), { expirationTtl: 120 });
    // Add rate limit headers to the response
    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(limit - state.count));
    return next();
}