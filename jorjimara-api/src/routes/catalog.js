// src/routes/catalog.js
import { Hono } from 'hono';
import { createSupabaseClient } from '../lib/supabase.js';
const catalog = new Hono();
const COLLECTION_SLUGS = ["hair-accessories", "cardigans", "matching-sets", "hats"];


// GET /api/catalog/new-arrivals
catalog.get("/new-arrivals", async (c) => {
    const db = createSupabaseClient(c.env);
    const cache = c.env.CACHE_KV;

    const cacheKey = "catalog:new-arrivals";
    const cached = await cache.get(cacheKey, "json");

    if (cached) return c.json({ data: cached, source: "cache" });
    const { data, error } = await db
        .from("products")
        .select(`
            id, name, slug, price, currency, is_new_in, tags,
            product_images ( url, sort_order ),
            product_variants ( id, is_active, created_at )
        `)
        .eq("is_new_in", "true")
        .eq("is_active", "true")
        .order("created_at", { ascending: false })
        .limit(4);


    if (error) return c.json({ error: error.message }, 500);

    const formatted = data.map(formatProductCard);

    // Store in KV for 5 minutes
    await cache.put(cacheKey, JSON.stringify(formatted), { expirationTtl: 300 }); return c.json({ data: formatted });
});


// GET /api/catalog/collections
catalog.get("/collections", async (c) => {
    const db = createSupabaseClient(c.env);
    const cache = c.env.CACHE_KV;
    const cacheKey = "catalog:collections";
    const cached = await cache.get(cacheKey, "json");
    if (cached) return c.json({ data: cached, source: "cache" });


    const { data, error } = await db
        .from("categories")
        .select("id, name, slug, description, image_url")
        .in("slug", COLLECTION_SLUGS)
        .eq("is_active", "true");
    if (error) return c.json({ error: error.message }, 500);


    const collectionManifest = {
        "hair-accessories": { number: "01.", heading: "The Essential", headingEm: "Final Touch" },
        "cardigans": { number: "02.", heading: "Layered in", headingEm: "Softness" },
        "matching-sets": { number: "03.", heading: "Effortless", headingEm: "Coordinates" },
        "hats": { number: "04.", heading: "Sun-Kissed", headingEm: "Protection" },
    };


    const formatted = (data ?? [])
        .map(cat => {
            const meta = collectionManifest[cat.slug];
            if (!meta) return null;
            return { ...cat, title: cat.name, ...meta, href: `/collections/${cat.slug}`, image: cat.image_url };
        })
        .filter(Boolean)
        .sort((a, b) => a.number.localeCompare(b.number));

    await cache.put(cacheKey, JSON.stringify(formatted), { expirationTtl: 600 });
    return c.json({ data: formatted });
});


// GET /api/catalog/filters
catalog.get("/filters", async (c) => {
    const db = createSupabaseClient(c.env);
    const cache = c.env.CACHE_KV;
    const cacheKey = "catalog:filters";
    const cached = await cache.get(cacheKey, "json");
    if (cached) return c.json({ data: cached, source: "cache" });
    const [varRes, catRes] = await Promise.all([
        db.from("product_variants").select("color, color_hex, size").eq("is_active", "true"),
        db.from("categories").select("id, name, slug").eq("is_active", "true").order("name"),
    ]);
    if (varRes.error) return c.json({ error: varRes.error.message }, 500);
    const vars = varRes.data ?? [];
    const colorMap = {};
    vars.forEach(v => {
        if (!v.color) return;
        const key = v.color.toLowerCase();
        if (!colorMap[key]) colorMap[key] = {
            name: v.color, hex: v.color_hex?.[0] ?? "#ccc", hexAll: v.color_hex
                ?? []
        };
    });
    const sizeOrder = ["xs", "s", "m", "l", "xl", "xxl", "one size"];
    const sizes = [...new Set(vars.map(v => v.size).filter(Boolean))].sort((a, b) => {
        const ai = sizeOrder.indexOf(a.toLowerCase()), bi = sizeOrder.indexOf(b.toLowerCase());
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1; if (bi === -1) return -1;
        return ai - bi;
    });
    const result = { colors: Object.values(colorMap), sizes, categories: catRes.data ?? [] };
    await cache.put(cacheKey, JSON.stringify(result), { expirationTtl: 600 });
    return c.json({ data: result });
});



// ─── Shared formatter─────────────────────────────────────────────────
function formatProductCard(p) {

    const images = (p.product_images ?? [])
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map(img => img.url);

    const firstVariant = (p.product_variants ?? [])
        .filter(v => v.is_active)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];


    return {
        id: p.id, name: p.name, slug: p.slug,
        price: new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(Number(p.price)),
        currency: p.currency,
        badge: p.is_new_in ? "New" : (p.tags?.[0] ?? null),
        photos: images.slice(0, 3),
        firstVariantId: firstVariant?.id ?? null,
    };
}
export default catalog;