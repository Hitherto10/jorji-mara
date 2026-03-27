import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

// ─── Simple in-memory query cache ────────────────────────────────────────────
// Prevents duplicate Supabase calls for the same query within a session.
const queryCache = new Map()
const CACHE_TTL  = 2 * 60 * 1000 // 2 minutes

function getCached(key) {
    const entry = queryCache.get(key)
    if (!entry) return null
    if (Date.now() - entry.ts > CACHE_TTL) { queryCache.delete(key); return null }
    return entry.data
}

function setCache(key, data) {
    queryCache.set(key, { data, ts: Date.now() })
}

// ─── Recent searches (localStorage) ──────────────────────────────────────────
const RECENT_KEY  = 'jm_recent_searches'
const MAX_RECENT  = 6

export function getRecentSearches() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] }
}

export function addRecentSearch(query) {
    if (!query?.trim()) return
    try {
        const prev    = getRecentSearches()
        const updated = [query, ...prev.filter(q => q.toLowerCase() !== query.toLowerCase())].slice(0, MAX_RECENT)
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
    } catch { /* empty */ }
}

export function removeRecentSearch(query) {
    try {
        const updated = getRecentSearches().filter(q => q !== query)
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
    } catch { /* empty */ }
}

export function clearRecentSearches() {
    try { localStorage.removeItem(RECENT_KEY) } catch { /* empty */ }
}

// ─── Core search function ─────────────────────────────────────────────────────
async function searchProducts(query, limit = 7) {
    const cacheKey = `${query.toLowerCase()}:${limit}`
    const cached   = getCached(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
        .from('products')
        .select(`
            id,
            name,
            slug,
            price,
            currency,
            compare_price,
            tags,
            product_images ( url, sort_order, variant_id ),
            product_variants ( id, is_active, created_at, price )
        `)
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .limit(limit)

    if (error) throw new Error(error.message)

    const results = (data ?? []).map(p => {
        // Primary image: shared (no variant_id), lowest sort_order
        const primaryImage = (p.product_images ?? [])
                .filter(img => img.variant_id === null)
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]
            ?? (p.product_images ?? [])[0]

        // Resolved price: first active variant price OR product price
        const firstVariant = (p.product_variants ?? [])
            .filter(v => v.is_active)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]

        const resolvedPrice = Number(firstVariant?.price ?? p.price ?? 0)
        const comparePrice  = Number(p.compare_price ?? 0)

        return {
            id:           p.id,
            name:         p.name,
            slug:         p.slug,
            price:        resolvedPrice,
            comparePrice: comparePrice > resolvedPrice ? comparePrice : null,
            currency:     p.currency,
            imageUrl:     primaryImage?.url ?? null,
            tags:         p.tags ?? [],
        }
    })

    setCache(cacheKey, results)
    return results
}

// ─── useSearch — autocomplete hook ───────────────────────────────────────────
export function useSearch({ debounceMs = 300, minChars = 3, limit = 7 } = {}) {
    const [query,    setQuery]    = useState('')
    const [results,  setResults]  = useState([])
    const [loading,  setLoading]  = useState(false)
    const [error,    setError]    = useState(null)

    // Race-condition guard: only apply results from the latest request
    const reqIdRef   = useRef(0)
    const timerRef   = useRef(null)
    const prevQuery  = useRef('')

    const runSearch = useCallback(async (q) => {
        const id = ++reqIdRef.current
        setLoading(true)
        setError(null)
        try {
            const data = await searchProducts(q, limit)
            if (id === reqIdRef.current) {
                setResults(data)
                setLoading(false)
            }
        } catch (err) {
            if (id === reqIdRef.current) {
                setError(err.message)
                setLoading(false)
            }
        }
    }, [limit])

    useEffect(() => {
        clearTimeout(timerRef.current)

        const trimmed = query.trim()

        if (trimmed.length < minChars) {
            setResults([])
            setLoading(false)
            return
        }

        // Skip if same as last query (prevents duplicate calls on focus re-trigger)
        if (trimmed.toLowerCase() === prevQuery.current.toLowerCase()) {
            return
        }

        timerRef.current = setTimeout(() => {
            prevQuery.current = trimmed
            runSearch(trimmed)
        }, debounceMs)

        return () => clearTimeout(timerRef.current)
    }, [query, minChars, debounceMs, runSearch])

    const reset = useCallback(() => {
        setQuery('')
        setResults([])
        setLoading(false)
        setError(null)
        prevQuery.current = ''
        reqIdRef.current++
    }, [])

    return { query, setQuery, results, loading, error, reset }
}

// ─── Full-page search (all results, no limit) ─────────────────────────────────
export function useSearchResults(query) {
    const [results,  setResults]  = useState([])
    const [loading,  setLoading]  = useState(false)
    const [error,    setError]    = useState(null)
    const reqIdRef   = useRef(0)

    useEffect(() => {
        const trimmed = query?.trim() ?? ''
        if (!trimmed) {
            setResults([])
            return
        }

        const id = ++reqIdRef.current
        setLoading(true)
        setError(null)

        searchProducts(trimmed, 100).then(data => {
            if (id === reqIdRef.current) {
                setResults(data)
                setLoading(false)
            }
        }).catch(err => {
            if (id === reqIdRef.current) {
                setError(err.message)
                setLoading(false)
            }
        })
    }, [query])

    return { results, loading, error }
}