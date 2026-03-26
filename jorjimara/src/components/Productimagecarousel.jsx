import { useState, useRef, useCallback } from 'react'
import { ShoppingBag } from 'lucide-react'

/**
 * ProductImageCarousel
 *
 * A reusable, performance-optimised image carousel for product cards.
 * Supports:
 *  - Touch/swipe (mobile-friendly)
 *  - Keyboard-accessible arrow buttons
 *  - Dot indicators
 *  - Left/right arrow buttons on hover (desktop)
 *  - Smooth CSS transform transitions (no JS animation loop)
 *  - Lazy image loading
 *
 * Props:
 *  images      — string[]    — array of image URLs
 *  productName — string      — used as alt text base
 *  badge       — string|null — optional badge label (e.g. "New", "Sale")
 *  className   — string      — override wrapper classes
 *  aspectClass — string      — Tailwind aspect ratio class (default: aspect-[3/4])
 *  onQuickAdd  — function    — optional callback for a "Quick Add" overlay button
 *  isOutOfStock— boolean     — show "Sold out" badge and disable quick add
 */
export default function ProductImageCarousel({
                                                 images = [],
                                                 productName = '',
                                                 badge = null,
                                                 className = '',
                                                 aspectClass = 'aspect-[3/4]',
                                                 onQuickAdd,
                                                 isOutOfStock = false,
                                                 showQuickAdd = true,
                                             }) {
    const [idx, setIdx]       = useState(0)
    const touchStartX         = useRef(null)
    const total               = images.length

    const prev = useCallback((e) => {
        e?.stopPropagation()
        setIdx(i => (i - 1 + total) % total)
    }, [total])

    const next = useCallback((e) => {
        e?.stopPropagation()
        setIdx(i => (i + 1) % total)
    }, [total])

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX
    }

    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return
        const delta = touchStartX.current - e.changedTouches[0].clientX
        if (Math.abs(delta) > 40) delta > 0 ? next() : prev()
        touchStartX.current = null
    }

    if (!images.length) {
        return (
            <div className={`${aspectClass} bg-stone-100 flex items-center justify-center text-stone-300 text-xs ${className}`}>
                No image
            </div>
        )
    }

    return (
        <div className={`group relative ${aspectClass} overflow-hidden bg-stone-100 select-none ${className}`}>
            {/* ── Sliding strip ── */}
            <div
                className="flex h-full will-change-transform transition-transform duration-300 ease-in-out"
                style={{
                    width: `${total * 100}%`,
                    transform: `translateX(-${(idx / total) * 100}%)`,
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {images.map((src, i) => (
                    <div
                        key={`${src}-${i}`}
                        style={{ width: `${100 / total}%` }}
                        className="h-full shrink-0"
                    >
                        <img
                            src={src}
                            alt={`${productName} ${i + 1}`}
                            className="w-full h-full object-cover"
                            loading={i === 0 ? 'eager' : 'lazy'}
                            decoding="async"
                        />
                    </div>
                ))}
            </div>

            {/* ── Badges ── */}
            <div className="absolute top-3 left-3 flex flex-col gap-1 z-10 pointer-events-none">
                {badge && (
                    <span className="bg-stone-900 text-white text-[9px] tracking-widest uppercase font-medium px-2 py-0.5">
                        {badge}
                    </span>
                )}
                {isOutOfStock && (
                    <span className="bg-white/90 text-stone-600 text-[9px] tracking-widest uppercase px-2 py-0.5">
                        Sold out
                    </span>
                )}
            </div>

            {/* ── Desktop hover: arrows + dots ── */}
            {total > 1 && (
                <div className="absolute inset-x-0 top-1/2 flex items-center justify-between px-3 pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <button
                        onClick={prev}
                        aria-label="Previous image"
                        className="w-7 h-7 bg-white/90 hover:bg-white flex items-center justify-center transition-colors shadow-sm"
                    >
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                            <polyline points="7.5,2 3.5,6 7.5,10" />
                        </svg>
                    </button>

                    <button
                        onClick={next}
                        aria-label="Next image"
                        className="w-7 h-7 bg-white/90 hover:bg-white flex items-center justify-center transition-colors shadow-sm"
                    >
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                            <polyline points="4.5,2 8.5,6 4.5,10" />
                        </svg>
                    </button>
                </div>
            )}

            {/* ── Mobile-only dots ── */}
            {total > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 lg:hidden z-10 pointer-events-none">
                    {images.map((_, i) => (
                        <div
                            key={i}
                            className={`w-1 h-1 rounded-full transition-colors duration-200 ${
                                i === idx ? 'bg-white' : 'bg-white/40'
                            }`}
                        />
                    ))}
                </div>
            )}

            {/* ── Quick Add overlay ── */}
            {showQuickAdd && onQuickAdd && (
                <div
                    className="absolute bottom-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onQuickAdd}
                        disabled={isOutOfStock}
                        className={`
                            rounded-full group/btn flex items-center justify-center
                            p-2 bg-white/95 backdrop-blur-sm border border-transparent
                            text-stone-800 transition-all duration-500 ease-in-out
                            hover:bg-white hover:border-stone-400
                            ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        <ShoppingBag className="w-4 h-4 shrink-0" />

                        {!isOutOfStock && (
                            <span className="
                                text-[10px] tracking-widest uppercase
                                whitespace-nowrap overflow-hidden
                                /* 2. Key Change: Use max-width and opacity together without switching position types */
                                max-w-0 opacity-0
                                transition-all duration-500 ease-in-out
                                group-hover/btn:max-w-12.5
                                group-hover/btn:opacity-100
                                group-hover/btn:ml-2
                            ">
                              Add
                            </span>
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}