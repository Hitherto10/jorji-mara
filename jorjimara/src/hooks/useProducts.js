import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

const PAGE_SIZE = 24

// Builds the variant label shown in the cart: "Black / XS / Full Set"
export function buildVariantLabel(variant) {
    return [variant.color, variant.size, variant.option_value]
        .filter(Boolean)
        .join(' / ')
}

// Resolves the display price for a variant (falls back to product price)
export function resolvePrice(variant, product) {
    return Number(variant?.price ?? product?.price ?? 0)
}

// ─── useProducts ─────────────────────────────────────────────────────────────
// Fetches products with efficient server-side filtering + pagination.
// filters: { colors: string[], sizes: string[], categories: string[], inStock: bool }
// sort:    'new' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc'
export function useProducts({ filters = {}, sort = 'new', page = 0 } = {}) {
    const [products, setProducts] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Abort stale requests
    const abortRef = useRef(null)

    const fetch = useCallback(async () => {
        if (abortRef.current) abortRef.current = false

        setLoading(true)
        setError(null)

        // ── 1. Base query — only fetch columns the listing page needs ──────
        let q = supabase
            .from('products')
            .select(`
                id,
                name,
                slug,
                price,
                compare_price,
                currency,
                is_new_in,
                is_featured,
                tags,
                category_id,
                categories ( id, name, slug ),
                product_images ( url, sort_order, is_primary, variant_id ),
                product_variants ( id, color, color_hex, size, option_name, option_value, stock, price, is_active )
            `, { count: 'exact' })
            .eq('is_active', true)

        // ── 2. Category filter ─────────────────────────────────────────────
        if (filters.categories?.length) {
            // We need product IDs in those categories
            const { data: cats } = await supabase
                .from('categories')
                .select('id')
                .in('slug', filters.categories)
            if (cats?.length) {
                q = q.in('category_id', cats.map(c => c.id))
            }
        }

        // ── 3. Sort ────────────────────────────────────────────────────────
        switch (sort) {
            case 'price_asc':   q = q.order('price', { ascending: true });  break
            case 'price_desc':  q = q.order('price', { ascending: false }); break
            case 'name_asc':    q = q.order('name',  { ascending: true });  break
            case 'name_desc':   q = q.order('name',  { ascending: false }); break
            case 'featured':    q = q.order('is_featured', { ascending: false }).order('created_at', { ascending: false }); break
            default:            q = q.order('created_at', { ascending: false }); // 'new'
        }

        // ── 4. Pagination ──────────────────────────────────────────────────
        q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

        const { data, error: err, count } = await q

        if (abortRef.current === false) return // stale — discard

        if (err) { setError(err.message); setLoading(false); return }

        // ── 5. Client-side filter by color / size / inStock ───────────────
        // These filter at the variant level — can't do this server-side without
        // complex joins, and the payload is small enough after pagination.
        let filtered = data || []

        if (filters.colors?.length || filters.sizes?.length || filters.inStock) {
            filtered = filtered.filter(p => {
                const activeVars = (p.product_variants || []).filter(v => v.is_active)

                const colorOk = !filters.colors?.length || activeVars.some(v =>
                    filters.colors.some(fc =>
                        (v.color ?? '').toLowerCase().includes(fc.toLowerCase()) ||
                        (v.color_hex ?? []).some(h => h.toLowerCase() === fc.toLowerCase())
                    )
                )
                const sizeOk = !filters.sizes?.length || activeVars.some(v =>
                    filters.sizes.some(fs => (v.size ?? '').toLowerCase() === fs.toLowerCase())
                )
                const stockOk = !filters.inStock || activeVars.some(v => v.stock > 0)

                return colorOk && sizeOk && stockOk
            })
        }

        setProducts(filtered)
        setTotal(count ?? 0)
        setLoading(false)
    }, [JSON.stringify(filters), sort, page])

    useEffect(() => {
        abortRef.current = null
        fetch()
        return () => { abortRef.current = false }
    }, [fetch])

    return { products, total, loading, error, pageSize: PAGE_SIZE }
}

// ─── useFilterOptions ─────────────────────────────────────────────────────────
// Fetches all distinct filter options: colors, sizes, categories.
// Runs once at mount and is cached — these don't change often.
let optionsCache = null

export function useFilterOptions() {
    const [options, setOptions] = useState(optionsCache ?? { colors: [], sizes: [], categories: [] })
    const [loading, setLoading] = useState(!optionsCache)

    useEffect(() => {
        if (optionsCache) return
        async function load() {
            const [varRes, catRes] = await Promise.all([
                supabase
                    .from('product_variants')
                    .select('color, color_hex, size')
                    .eq('is_active', true),
                supabase
                    .from('categories')
                    .select('id, name, slug')
                    .eq('is_active', true)
                    .order('name'),
            ])

            const vars = varRes.data ?? []

            // Unique colors by normalized name
            const colorMap = {}
            vars.forEach(v => {
                if (!v.color) return
                const key = v.color.toLowerCase()
                if (!colorMap[key]) {
                    colorMap[key] = {
                        name:  v.color,
                        hex:   v.color_hex?.[0] ?? '#cccccc',
                        hexAll: v.color_hex ?? [],
                    }
                }
            })

            // Unique sizes
            const sizeOrder = ['xs','s','m','l','xl','xxl','one size']
            const sizeSet = [...new Set(vars.map(v => v.size).filter(Boolean))]
            sizeSet.sort((a, b) => {
                const ai = sizeOrder.indexOf(a.toLowerCase())
                const bi = sizeOrder.indexOf(b.toLowerCase())
                if (ai === -1 && bi === -1) return a.localeCompare(b)
                if (ai === -1) return 1; if (bi === -1) return -1
                return ai - bi
            })

            const result = {
                colors:     Object.values(colorMap),
                sizes:      sizeSet,
                categories: catRes.data ?? [],
            }
            optionsCache = result
            setOptions(result)
            setLoading(false)
        }
        load()
    }, [])

    return { options, loading }
}

