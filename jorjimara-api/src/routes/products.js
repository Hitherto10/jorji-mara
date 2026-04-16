// src/routes/products.js
import { Hono } from 'hono';
import { createSupabaseClient } from '../lib/supabase.js';
const products = new Hono();
const PAGE_SIZE = 24;
// ─── GET /api/products/search (must be before /:slug) ───────────────
products.get("/search", async (c) => {
    const q = c.req.query("q")?.trim() ?? "";
    const limit = Math.min(parseInt(c.req.query("limit") ?? "7"), 20);

    if (q.length < 2) return c.json({ data: [] });

    const db = createSupabaseClient(c.env);
    const { data, error } = await db
        .from("products")
        .select(`
id, name, slug, price, currency, compare_price, tags,
product_images ( url, sort_order, variant_id ),
product_variants ( id, is_active, created_at, price )`,)
        .ilike("name", `%${q}%`)
        .eq("is_active", "true")
        .limit(limit);
    if (error) return c.json({ error: error.message }, 500);
    const results = (data ?? []).map(p => {
        const primaryImage = (p.product_images ?? [])
            .filter(img => img.variant_id === null)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]
            ?? (p.product_images ?? [])[0];
        const firstVariant = (p.product_variants ?? [])
            .filter(v => v.is_active)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
        const resolvedPrice = Number(firstVariant?.price ?? p.price ?? 0);
        const comparePrice = Number(p.compare_price ?? 0);
        return {
            id: p.id, name: p.name, slug: p.slug,
            price: resolvedPrice,
            comparePrice: comparePrice > resolvedPrice ? comparePrice : null,
            currency: p.currency,
            imageUrl: primaryImage?.url ?? null,
            tags: p.tags ?? [],
        };
    });
    return c.json({ data: results });
});

// ─── GET /api/products (paginated, filtered) ─────────────────────────
products.get("/", async (c) => {
    const db = createSupabaseClient(c.env);
    const page = parseInt(c.req.query("page") ?? "0");
    const sort = c.req.query("sort") ?? "new";
    const category = c.req.query("category");
    const colors = c.req.query("colors")?.split(",").filter(Boolean) ?? [];
    const sizes
        = c.req.query("sizes")?.split(",").filter(Boolean) ?? [];
    const inStock = c.req.query("inStock") === "true";
    // 1. Resolve category slug → id if provided
    let categoryId = null;
    if (category) {
        const catRes = await db.from("categories").select("id").eq("slug", category).single();
        if (catRes.data) categoryId = catRes.data.id;
    }

    // 2. Build base query
    let q = db
        .from("products")
        .select(`
            id, name, slug, price, compare_price, currency,
            is_new_in, is_featured, tags, category_id,
            categories ( id, name, slug ),
            product_images ( url, sort_order, is_primary, variant_id ),
            product_variants ( id, color, color_hex, size, option_name, option_value, stock, price, is_active )`,
            { count: "exact" })
        .eq("is_active", "true");
    if (categoryId) q = q.eq("category_id", categoryId);
    // 3. Sort
    if
        (sort === "price_asc") q = q.order("price", { ascending: true });
    else if (sort === "price_desc") q = q.order("price", { ascending: false });
    else if (sort === "name_asc") q = q.order("name", { ascending: true });
    else if (sort === "name_desc") q = q.order("name", { ascending: false });
    else
        q = q.order("created_at", { ascending: false });

    const hasVariantFilters = colors.length || sizes.length || inStock;

    // 4. Pagination — only apply at DB level when there are no variant filters
    if (!hasVariantFilters) {
        q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    }
    const { data, error, count } = await q;
    if (error) return c.json({ error: error.message }, 500);

    // 5. Client-side variant filters (colors / sizes / stock)
    let filtered = data ?? [];

    if (hasVariantFilters) {
        filtered = filtered.filter(p => {
            const av = (p.product_variants ?? []).filter(v => v.is_active);
            const colorOk = !colors.length || av.some(v => colors.some(fc => (v.color ??
                "").toLowerCase().includes(fc.toLowerCase())));
            const sizeOk = !sizes.length || av.some(v => sizes.some(fs => (v.size ?? "").toLowerCase() ===
                fs.toLowerCase()));
            const stockOk = !inStock || av.some(v => v.stock > 0);
            return colorOk && sizeOk && stockOk;
        });
    }

    const total = hasVariantFilters ? filtered.length : (count ?? 0);
    const paged = hasVariantFilters
        ? filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
        : filtered;

    return c.json({ data: paged, total, page, pageSize: PAGE_SIZE });
});

// ─── GET /api/products/:slug──────────────────────────────────────────
products.get("/:slug", async (c) => {
    const slug = c.req.param("slug");
    const db = createSupabaseClient(c.env);
    // Fetch all three tables in parallel — eliminates the waterfall
    const prodRes = await db
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", "true")
        .single();
    if (prodRes.error || !prodRes.data)
        return c.json({ error: "Product not found" }, 404);
    const prod = prodRes.data;
    const [varsRes, imgsRes] = await Promise.all([
        db.from("product_variants").select("*").eq("product_id", prod.id).order("created_at"),
        db.from("product_images").select("*").eq("product_id", prod.id).order("sort_order"),
    ]);
    return c.json({
        product: prod,

        variants: varsRes.data ?? [],
        images: imgsRes.data ?? [],
    });
});

export default products;