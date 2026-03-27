import { useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Search, ArrowLeft, X } from 'lucide-react'
import { motion } from 'motion/react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import ProductImageCarousel from '../components/Productimagecarousel.jsx'
import { useSearchResults, addRecentSearch } from '../hooks/Usesearch.js'
import { useQuickView } from '../context/QuickViewContext.jsx'

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

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="animate-pulse">
            <div className="aspect-[3/4] bg-stone-100 mb-3" />
            <div className="h-3 bg-stone-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-stone-100 rounded w-1/2" />
        </div>
    )
}

// ─── Product card ─────────────────────────────────────────────────────────────
function SearchResultCard({ product, query }) {
    const navigate        = useNavigate()
    const { openQuickView } = useQuickView()

    const goToProduct = () => navigate(`/products/${product.slug}`)

    return (
        <motion.div
            className="group flex flex-col cursor-pointer"
            onClick={goToProduct}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            role="link"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && goToProduct()}
        >
            <ProductImageCarousel
                images={product.imageUrl ? [product.imageUrl] : []}
                productName={product.name}
                showQuickAdd
                onQuickView={() => openQuickView(product.slug)}
            />
            <div className="pt-3">
                <p className="text-sm text-stone-800 leading-snug line-clamp-2">
                    <Highlight text={product.name} query={query} />
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm text-stone-500 font-light">₦{fmt(product.price)}</span>
                    {product.comparePrice && (
                        <span className="text-xs text-stone-400 line-through">₦{fmt(product.comparePrice)}</span>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ query }) {
    const navigate = useNavigate()
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-24 gap-6 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
                <Search className="w-7 h-7 text-stone-300" />
            </div>
            <div>
                <p className="text-stone-500 text-sm mb-1">No products found for</p>
                <p className="text-stone-900 font-medium text-lg">"{query}"</p>
                <p className="text-stone-400 text-xs mt-2 leading-relaxed max-w-xs mx-auto">
                    Try different keywords, check for typos, or browse all products.
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={() => navigate('/products')}
                    className="px-6 py-2.5 bg-stone-900 text-white text-xs uppercase tracking-widest font-medium hover:bg-stone-700 transition-colors"
                >
                    Browse all products
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2.5 border border-stone-300 text-stone-700 text-xs uppercase tracking-widest hover:bg-stone-50 transition-colors"
                >
                    Go back
                </button>
            </div>
        </motion.div>
    )
}

// ─── Main SearchResultsPage ───────────────────────────────────────────────────
export default function SearchResultsPage() {
    const [searchParams] = useSearchParams()
    const navigate       = useNavigate()
    const query          = searchParams.get('search') ?? ''

    const { results, loading, error } = useSearchResults(query)

    // Add to recent searches when arriving on results page
    useEffect(() => {
        if (query.trim()) addRecentSearch(query.trim())
    }, [query])

    return (
        <>
            <div className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm">
                <Header />
            </div>

            <main className="font-[Bricolage_Grotesque] pt-20 min-h-screen bg-white">

                {/* ── Page header ── */}
                <div className="border-b border-stone-100 py-8 px-4 md:px-8">
                    <div className="max-w-6xl mx-auto">

                        {/* Back link */}
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors mb-4 uppercase tracking-widest"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            Back
                        </button>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-1">
                                    Search results
                                </p>
                                <h1 className="font-serif text-2xl md:text-3xl font-light text-stone-900">
                                    {query
                                        ? <>Results for <em className="italic text-[#4d0011]">"{query}"</em></>
                                        : 'All products'
                                    }
                                </h1>
                            </div>

                            {/* Result count */}
                            {!loading && results.length > 0 && (
                                <p className="text-sm text-stone-400 shrink-0">
                                    {results.length} product{results.length !== 1 ? 's' : ''} found
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Results grid ── */}
                <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">

                    {error && (
                        <div className="text-center py-12 text-sm text-red-500">
                            Something went wrong. Please try searching again.
                        </div>
                    )}

                    {loading && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    )}

                    {!loading && !error && results.length === 0 && query && (
                        <EmptyState query={query} />
                    )}

                    {!loading && !error && results.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {results.map(product => (
                                <SearchResultCard key={product.id} product={product} query={query} />
                            ))}
                        </div>
                    )}

                    {/* Browse all CTA if no query */}
                    {!query && !loading && (
                        <div className="text-center py-12">
                            <p className="text-stone-400 text-sm mb-4">Enter a search term to find products</p>
                            <button
                                onClick={() => navigate('/products')}
                                className="px-6 py-2.5 bg-stone-900 text-white text-xs uppercase tracking-widest font-medium hover:bg-stone-700 transition-colors"
                            >
                                Browse all products
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </>
    )
}