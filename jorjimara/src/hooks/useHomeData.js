import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

// ─── Cache ────────────────────────────────────────────────────────────────────
// Simple in-memory cache with TTL (5 minutes). Prevents refetches on
// component remounts without adding a heavy dependency like React Query.
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const cache = {
    _store: {},
    get(key) {
        const entry = this._store[key]
        if (!entry) return null
        if (Date.now() - entry.ts > CACHE_TTL) {
            delete this._store[key]
            return null
        }
        return entry.data
    },
    set(key, data) {
        this._store[key] = { data, ts: Date.now() }
    },
}

// ─── useNewArrivals ───────────────────────────────────────────────────────────
// Fetches the 4 newest "new in" products for the homepage.
// Uses a single joined query — products + images + variants in one round trip.
// Only selects fields that the ProductCard component actually uses.
export function useNewArrivals() {
    const [products, setProducts] = useState(() => cache.get('home:new_arrivals') ?? [])
    const [loading,  setLoading]  = useState(!cache.get('home:new_arrivals'))
    const [error,    setError]    = useState(null)

    useEffect(() => {
        const cached = cache.get('home:new_arrivals')
        if (cached) {
            setProducts(cached)
            setLoading(false)
            return
        }

        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)

            // One query — Supabase PostgREST supports nested selects.
            // product_images and product_variants are returned as arrays inside each product.
            const { data, error: err } = await supabase
                .from('products')
                .select(`
                  id,
                  name,
                  slug,
                  price,
                  currency,
                  is_new_in,
                  tags,
                  product_images ( url, sort_order, variant_id ),
                  product_variants ( id, is_active, created_at )
                `)
                .eq('is_new_in', true)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(4)

            if (cancelled) return
            if (err) { setError(err.message); setLoading(false); return }

            const formatted = (data ?? []).map(p => {
                // Sort images by sort_order, keep only those without a variant_id (shared images)
                const images = (p.product_images ?? [])
                    .filter(img => img.variant_id === null)
                    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                    .map(img => img.url)
                    .slice(0, 3)

                const firstVariant = (p.product_variants ?? [])
                    .filter(v => v.is_active)
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]

                return {
                    id:             p.id,
                    name:           p.name,
                    slug:           p.slug,
                    price:          new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(Number(p.price)),
                    currency:       p.currency,
                    badge:          p.is_new_in ? 'New' : (p.tags?.[0] ?? null),
                    photos:         images,
                    firstVariantId: firstVariant?.id ?? null,
                }
            })

            cache.set('home:new_arrivals', formatted)
            setProducts(formatted)
            setLoading(false)
        }

        load()
        return () => { cancelled = true }
    }, [])

    return { products, loading, error }
}

// ─── useCollections ───────────────────────────────────────────────────────────
// Fetches branded collections for the CollectionsShowcase.
// Same manifest-based approach as before, but cached and leaner.
const COLLECTION_SLUGS = ['hair-accessories', 'cardigans', 'matching-sets', 'hats']

const collectionManifest = {
    'hair-accessories': { number: '01.', heading: 'The Essential',   headingEm: 'Final Touch'    },
    'cardigans':        { number: '02.', heading: 'Layered in',      headingEm: 'Softness'       },
    'matching-sets':    { number: '03.', heading: 'Effortless',      headingEm: 'Coordinates'    },
    'hats':             { number: '04.', heading: 'Sun-Kissed',      headingEm: 'Protection'     },
}

export function useCollections() {
    const [collections, setCollections] = useState(() => cache.get('home:collections') ?? [])
    const [loading,     setLoading]     = useState(!cache.get('home:collections'))
    const [error,       setError]       = useState(null)

    useEffect(() => {
        const cached = cache.get('home:collections')
        if (cached) {
            setCollections(cached)
            setLoading(false)
            return
        }

        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)

            const { data, error: err } = await supabase
                .from('categories')
                .select('id, name, slug, description, image_url')
                .in('slug', COLLECTION_SLUGS)
                .eq('is_active', true)

            if (cancelled) return
            if (err) { setError(err.message); setLoading(false); return }

            const formatted = (data ?? [])
                .map(cat => {
                    const meta = collectionManifest[cat.slug]
                    if (!meta) return null
                    return {
                        id:         cat.id,
                        number:     meta.number,
                        title:      cat.name,
                        heading:    meta.heading,
                        headingEm:  meta.headingEm,
                        description: cat.description,
                        image:      cat.image_url,
                        href:       `/collections/${cat.slug}`,
                    }
                })
                .filter(Boolean)
                .sort((a, b) => a.number.localeCompare(b.number))

            cache.set('home:collections', formatted)
            setCollections(formatted)
            setLoading(false)
        }

        load()
        return () => { cancelled = true }
    }, [])

    return { collections, loading, error }
}

// ─── useHomeData ──────────────────────────────────────────────────────────────
// Convenience hook that fires BOTH queries in parallel and returns a combined
// loading state. This is the main entry point for the Home page.
export function useHomeData() {
    const arrivals    = useNewArrivals()
    const collections = useCollections()

    return {
        newProducts:  arrivals.products,
        collections:  collections.collections,
        loading:      arrivals.loading || collections.loading,
        error:        arrivals.error   || collections.error,
    }
}