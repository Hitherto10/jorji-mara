import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Clock, X, ArrowRight, TrendingUp } from 'lucide-react'
import {
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
} from '../hooks/useSearch.js'

// ─── Format helpers ───────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(Number(n))

// ─── Highlight matching text ──────────────────────────────────────────────────
function Highlight({ text, query }) {
    if (!query?.trim()) return <span>{text}</span>

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts   = text.split(new RegExp(`(${escaped})`, 'gi'))

    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase()
                    ? <mark key={i} className="bg-[#4d0011]/10 text-[#4d0011] font-semibold not-italic">{part}</mark>
                    : <span key={i}>{part}</span>
            )}
        </span>
    )
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────
function SkeletonResult() {
    return (
        <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
            <div className="w-10 h-12 bg-stone-100 shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3 bg-stone-100 rounded w-2/3" />
                <div className="h-3 bg-stone-100 rounded w-1/4" />
            </div>
        </div>
    )
}

// ─── SearchDropdown ───────────────────────────────────────────────────────────
/**
 * Props:
 *   query         — string  — current search query
 *   results       — array   — product results from useSearch
 *   loading       — bool
 *   error         — string|null
 *   recentSearches— string[]
 *   activeIndex   — number  — keyboard-navigated index (-1 = none)
 *   onSelect      — fn(product) — called when user clicks a result
 *   onRecentClick — fn(query)   — called when user clicks a recent search
 *   onClose       — fn()
 *   onViewAll     — fn()    — called when "View all results" is clicked
 *   onClearRecent — fn()
 *   onRemoveRecent— fn(query)
 */
export default function SearchDropdown({
                                           query,
                                           results,
                                           loading,
                                           error,
                                           recentSearches = [],
                                           activeIndex = -1,
                                           onSelect,
                                           onRecentClick,
                                           onClose,
                                           onViewAll,
                                           onClearRecent,
                                           onRemoveRecent,
                                       }) {
    const navigate   = useNavigate()
    const listRef    = useRef(null)
    const minChars   = 3

    const showRecents  = !query.trim() || query.trim().length < minChars
    const showResults  = query.trim().length >= minChars
    const hasResults   = results.length > 0

    // Scroll active item into view when keyboard navigating
    useEffect(() => {
        if (activeIndex < 0 || !listRef.current) return
        const item = listRef.current.querySelectorAll('[data-result-item]')[activeIndex]
        item?.scrollIntoView({ block: 'nearest' })
    }, [activeIndex])

    const handleProductClick = (product) => {
        addRecentSearch(query.trim())
        onSelect?.(product)
        navigate(`/products/${product.slug}`)
        onClose?.()
    }

    const handleViewAll = () => {
        if (query.trim()) addRecentSearch(query.trim())
        onViewAll?.()
        onClose?.()
    }

    const handleRecentClick = (recent) => {
        onRecentClick?.(recent)
    }

    const isOpen = showRecents
        ? recentSearches.length > 0
        : (loading || showResults)

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 shadow-xl z-50 overflow-hidden font-[Bricolage_Grotesque]"
                    initial={{ opacity: 0, y: -6, scaleY: 0.97 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -6, scaleY: 0.97 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    style={{ transformOrigin: 'top' }}
                >
                    <div
                        ref={listRef}
                        className="max-h-[min(420px,70vh)] overflow-y-auto overscroll-contain"
                    >

                        {/* ── Recent searches (shown when query < 3 chars) ── */}
                        {showRecents && recentSearches.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        Recent searches
                                    </p>
                                    <button
                                        onClick={onClearRecent}
                                        className="text-[10px] text-stone-400 hover:text-stone-600 transition-colors uppercase tracking-widest"
                                    >
                                        Clear all
                                    </button>
                                </div>
                                <ul>
                                    {recentSearches.map((recent, i) => (
                                        <li key={recent}>
                                            <div
                                                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors group ${
                                                    i === activeIndex ? 'bg-stone-50' : 'hover:bg-stone-50'
                                                }`}
                                                onClick={() => handleRecentClick(recent)}
                                                data-result-item
                                            >
                                                <span className="flex items-center gap-2.5 text-sm text-stone-700">
                                                    <Clock className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                                                    {recent}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onRemoveRecent?.(recent)
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-stone-600 transition-all"
                                                    aria-label={`Remove "${recent}" from history`}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* ── Loading skeletons ── */}
                        {showResults && loading && (
                            <div>
                                <div className="px-4 pt-3 pb-2">
                                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">Searching…</p>
                                </div>
                                {Array.from({ length: 4 }).map((_, i) => <SkeletonResult key={i} />)}
                            </div>
                        )}

                        {/* ── Error ── */}
                        {showResults && error && !loading && (
                            <div className="px-4 py-5 text-sm text-stone-400 text-center">
                                Something went wrong. Please try again.
                            </div>
                        )}

                        {/* ── No results ── */}
                        {showResults && !loading && !error && !hasResults && (
                            <div className="px-4 py-6 text-center">
                                <p className="text-sm text-stone-500 mb-1">No products found for</p>
                                <p className="text-sm font-medium text-stone-900">"{query}"</p>
                                <p className="text-xs text-stone-400 mt-2">Try a different search term</p>
                            </div>
                        )}

                        {/* ── Results ── */}
                        {showResults && !loading && hasResults && (
                            <div>
                                <div className="px-4 pt-3 pb-2">
                                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                                        Products
                                    </p>
                                </div>
                                <ul>
                                    {results.map((product, i) => (
                                        <li key={product.id}>
                                            <button
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group ${
                                                    i === activeIndex ? 'bg-stone-50' : 'hover:bg-stone-50'
                                                }`}
                                                onClick={() => handleProductClick(product)}
                                                data-result-item
                                            >
                                                {/* Thumbnail */}
                                                <div className="w-10 h-12 shrink-0 bg-stone-100 overflow-hidden">
                                                    {product.imageUrl
                                                        ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                        : <div className="w-full h-full bg-stone-100" />
                                                    }
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-stone-900 leading-snug line-clamp-1">
                                                        <Highlight text={product.name} query={query} />
                                                    </p>
                                                    <div className="flex items-baseline gap-2 mt-0.5">
                                                        <span className="text-xs text-stone-500">₦{fmt(product.price)}</span>
                                                        {product.comparePrice && (
                                                            <span className="text-[10px] text-stone-400 line-through">₦{fmt(product.comparePrice)}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Arrow */}
                                                <ArrowRight className="w-3.5 h-3.5 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                {/* View all results footer */}
                                <button
                                    onClick={handleViewAll}
                                    className="w-full flex items-center justify-between px-4 py-3 text-xs text-stone-500 hover:text-stone-900 border-t border-stone-100 hover:bg-stone-50 transition-colors group"
                                    data-result-item
                                >
                                    <span className="uppercase tracking-widest font-medium">
                                        View all results for "{query}"
                                    </span>
                                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}