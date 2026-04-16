export async function withCache(request, ttl, fetchFn) {
    const cache = caches.default; // Cloudflare global cache
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetchFn();
    // Clone before consuming — response body can only be read once
    const toCache = response.clone();
    const headers = new Headers(toCache.headers);
    headers.set("Cache-Control", `public, max-age=${ttl}`);
    await cache.put(request, new Response(toCache.body, { headers })); return response;
}
// Usage in products.js /:slug handler:
// return withCache(c.req.raw, 120, async () => c.json({ product, variants, images }));