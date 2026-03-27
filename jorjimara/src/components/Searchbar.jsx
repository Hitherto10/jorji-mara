import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useSearch, getRecentSearches, removeRecentSearch, clearRecentSearches } from '../hooks/useSearch.js'
import SearchDropdown from './SearchDropdown.jsx'

/**
 * SearchBar
 *
 * A self-contained search component that:
 *  - Shows a live autocomplete dropdown
 *  - Navigates to /search?search=q on Enter or "View all"
 *  - Supports arrow-key navigation within dropdown
 *  - Closes on outside click / Escape
 *  - Manages recent searches in localStorage
 *
 * Props:
 *  onClose   — optional fn() — called when the search bar should close (used in overlay mode)
 *  autoFocus — bool — focus the input on mount
 *  className — additional wrapper classes
 */
export default function SearchBar({ onClose, autoFocus = false, className = '' }) {
    const navigate  = useNavigate()
    const inputRef  = useRef(null)
    const wrapperRef= useRef(null)

    const { query, setQuery, results, loading, error, reset } = useSearch({ debounceMs: 300, minChars: 3, limit: 7 })

    const [open,          setOpen]          = useState(false)
    const [activeIndex,   setActiveIndex]   = useState(-1)
    const [recentSearches,setRecentSearches]= useState(getRecentSearches)

    // Auto focus
    useEffect(() => {
        if (autoFocus) inputRef.current?.focus()
    }, [autoFocus])

    // Open dropdown when there's a query or recent searches
    useEffect(() => {
        setOpen(true)
        setActiveIndex(-1)
    }, [query, results])

    // Refresh recent searches whenever dropdown opens without a query
    useEffect(() => {
        if (open && !query.trim()) {
            setRecentSearches(getRecentSearches())
        }
    }, [open, query])

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // ── Navigate to search results page ────────────────────────────────────
    const goToResults = useCallback((q = query) => {
        const trimmed = q.trim()
        if (!trimmed) return
        setOpen(false)
        navigate(`/search?search=${encodeURIComponent(trimmed)}`)
        onClose?.()
    }, [query, navigate, onClose])

    // ── Keyboard navigation ─────────────────────────────────────────────────
    const handleKeyDown = (e) => {
        const totalItems = results.length + (results.length > 0 ? 1 : 0) // +1 for "View all"

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setActiveIndex(i => Math.min(i + 1, totalItems - 1))
                break

            case 'ArrowUp':
                e.preventDefault()
                setActiveIndex(i => Math.max(i - 1, -1))
                break

            case 'Enter':
                e.preventDefault()
                if (activeIndex >= 0 && activeIndex < results.length) {
                    // Navigate to the highlighted product
                    const product = results[activeIndex]
                    setOpen(false)
                    navigate(`/products/${product.slug}`)
                    onClose?.()
                } else {
                    // Navigate to results page
                    goToResults()
                }
                break

            case 'Escape':
                e.preventDefault()
                if (query) {
                    reset()
                } else {
                    setOpen(false)
                    onClose?.()
                }
                break

            default:
                break
        }
    }

    const handleClearInput = () => {
        reset()
        inputRef.current?.focus()
    }

    const handleClearRecent = () => {
        clearRecentSearches()
        setRecentSearches([])
    }

    const handleRemoveRecent = (recent) => {
        removeRecentSearch(recent)
        setRecentSearches(getRecentSearches())
    }

    const handleRecentClick = (recent) => {
        setQuery(recent)
        inputRef.current?.focus()
    }

    return (
        <div ref={wrapperRef} className={`relative w-full ${className}`}>
            {/* ── Input ── */}
            <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-stone-400 pointer-events-none shrink-0" />

                <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search products…"
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full h-10 pl-10 pr-10 text-sm text-stone-900 bg-stone-50 border border-stone-200 outline-none transition-colors duration-200 focus:bg-white focus:border-stone-900 placeholder:text-stone-400 font-[Bricolage_Grotesque]"
                    aria-label="Search products"
                    aria-expanded={open}
                    aria-autocomplete="list"
                    role="combobox"
                />

                <AnimatePresence>
                    {query && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.12 }}
                            onClick={handleClearInput}
                            className="absolute right-3 text-stone-400 hover:text-stone-700 transition-colors"
                            aria-label="Clear search"
                        >
                            <X className="w-3.5 h-3.5" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Dropdown ── */}
            {open && (
                <SearchDropdown
                    query={query}
                    results={results}
                    loading={loading}
                    error={error}
                    recentSearches={recentSearches}
                    activeIndex={activeIndex}
                    onSelect={() => {}} // navigation handled inside dropdown
                    onRecentClick={handleRecentClick}
                    onClose={() => { setOpen(false); onClose?.() }}
                    onViewAll={() => goToResults()}
                    onClearRecent={handleClearRecent}
                    onRemoveRecent={handleRemoveRecent}
                />
            )}
        </div>
    )
}