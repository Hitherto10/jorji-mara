import { useState, useEffect } from 'react'
import { apiGet } from '../lib/api.js'   // ← NEW: replaces supabase import

// ─── Simple in-memory cache (same TTL behaviour as before) ────────────────────
// Keeps the hook fast on re-mounts — e.g. navigating away and back to Home
// without triggering a second network round-trip.
const CACHE_TTL = 5 * 60 * 1000  // 5 minutes

const cache = {
    _store: {},
    get(key) {
        const entry = this._store[key]
        if (!entry) return null
        if (Date.now() - entry.ts > CACHE_TTL) { delete this._store[key]; return null }
        return entry.data
    },
    set(key, data) {
        this._store[key] = { data, ts: Date.now() }
    },
}


export function useNewArrivals() {
    const [products, setProducts] = useState(() => cache.get('home:new_arrivals') ?? [])
    const [loading, setLoading] = useState(!cache.get('home:new_arrivals'))
    const [error, setError] = useState(null)

    useEffect(() => {
        // Serve from in-memory cache if still fresh
        const cached = cache.get('home:new_arrivals')
        if (cached) {
            setProducts(cached)
            setLoading(false)
            return
        }

        let cancelled = false
        setLoading(true)
        setError(null)

        apiGet('/api/catalog/new-arrivals')
            .then(({ data }) => {
                if (cancelled) return
                cache.set('home:new_arrivals', data ?? [])
                setProducts(data ?? [])
                setLoading(false)
            })
            .catch((err) => {
                if (cancelled) return
                setError(err.message)
                setLoading(false)
            })

        return () => { cancelled = true }
    }, [])

    return { products, loading, error }
}

// ─── useCollections ───────────────────────────────────────────────────────────
//
// CHANGED: was calling supabase.from('categories').select(...).in('slug', COLLECTION_SLUGS)...
// NOW:     calls GET /api/catalog/collections on the Cloudflare Worker.
//
// The Worker applies the same COLLECTION_SLUGS filter and collectionManifest
// logic server-side and returns the same shape CollectionsShowcase expects:
//   { id, number, title, heading, headingEm, description, image, href }

export function useCollections() {
    const [collections, setCollections] = useState(() => cache.get('home:collections') ?? [])
    const [loading, setLoading] = useState(!cache.get('home:collections'))
    const [error, setError] = useState(null)

    useEffect(() => {
        const cached = cache.get('home:collections')
        if (cached) {
            setCollections(cached)
            setLoading(false)
            return
        }

        let cancelled = false
        setLoading(true)
        setError(null)

        apiGet('/api/catalog/collections')
            .then(({ data }) => {
                if (cancelled) return
                cache.set('home:collections', data ?? [])
                setCollections(data ?? [])
                setLoading(false)
            })
            .catch((err) => {
                if (cancelled) return
                setError(err.message)
                setLoading(false)
            })

        return () => { cancelled = true }
    }, [])

    return { collections, loading, error }
}

// ─── useHomeData ──────────────────────────────────────────────────────────────
// Convenience hook — unchanged interface, both sub-hooks now call the Worker.
export function useHomeData() {
    const arrivals = useNewArrivals()
    const collections = useCollections()

    return {
        newProducts: arrivals.products,
        collections: collections.collections,
        loading: arrivals.loading || collections.loading,
        error: arrivals.error || collections.error,
    }
}