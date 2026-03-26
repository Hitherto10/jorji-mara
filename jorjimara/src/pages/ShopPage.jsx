import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import AddToCartButton from '../components/AddToCartButton.jsx'
import { useProducts, useFilterOptions } from '../hooks/useProducts.js'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(n)

function getPrimaryImage(product) {
    const imgs = product.product_images ?? []
    const primary = imgs.find(i => i.is_primary ) ?? imgs.find(i => !i.variant_id) ?? imgs[0]
    console.log(primary)
    return primary?.url ?? null
}

function getActiveVariants(product) {
    return (product.product_variants ?? []).filter(v => v.is_active)
}

function getFirstVariant(product) {
    return getActiveVariants(product)[0] ?? null
}

// ─── ProductCard (listing version) ───────────────────────────────────────────
function ProductCard({ product }) {
    const navigate   = useNavigate()
    const firstVariant = getFirstVariant(product)
    const imageUrl   = getPrimaryImage(product)
    const price      = Number(firstVariant?.price ?? product.price)
    const hasStock   = getActiveVariants(product).some(v => v.stock > 0)

    // Unique active colors for the swatch row
    const colorMap = {}
    getActiveVariants(product).forEach(v => {
        if (v.color) colorMap[v.color.toLowerCase()] = { name: v.color, hex: v.color_hex?.[0] ?? '#ccc' }
    })
    const colors = Object.values(colorMap).slice(0, 6)

    const goToProduct = () => {
        const url = firstVariant
            ? `/products/${product.slug}?variant=${firstVariant.id}`
            : `/products/${product.slug}`
        navigate(url)
    }

    return (
        <div className="group flex flex-col cursor-pointer" onClick={goToProduct}>
            {/* Image */}
            <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                {imageUrl
                    ? <img src={imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    : <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300 text-xs">No image</div>
                }

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {product.is_new_in && (
                        <span className="bg-stone-900 text-white text-[9px] tracking-widest uppercase px-2 py-0.5">New</span>
                    )}
                    {!hasStock && (
                        <span className="bg-white/90 text-stone-600 text-[9px] tracking-widest uppercase px-2 py-0.5">Sold out</span>
                    )}
                    {product.compare_price && Number(product.compare_price) > price && (
                        <span className="bg-[#4D0010] text-white text-[9px] tracking-widest uppercase px-2 py-0.5">Sale</span>
                    )}
                </div>

                {/* Quick add */}
                <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={e => e.stopPropagation()}>
                    <AddToCartButton
                        product={product}
                        variant={firstVariant}
                        imageUrl={imageUrl}
                        isOutOfStock={!hasStock}
                        compact
                        label="Quick Add"
                    />
                </div>
            </div>

            {/* Info */}
            <div className="pt-3 pb-1">
                <p className="text-sm text-stone-800 leading-snug">{product.name}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm text-stone-500 font-light">₦{fmt(price)}</span>
                    {product.compare_price && Number(product.compare_price) > price && (
                        <span className="text-xs text-stone-400 line-through">₦{fmt(product.compare_price)}</span>
                    )}
                </div>

                {/* Color swatches */}
                {colors.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                        {colors.map(c => (
                            <span
                                key={c.name}
                                title={c.name}
                                className="w-3.5 h-3.5 rounded-full border border-stone-200"
                                style={{ background: c.hex }}
                            />
                        ))}
                        {Object.keys(colorMap).length > 6 && (
                            <span className="text-[10px] text-stone-400 self-center">+{Object.keys(colorMap).length - 6}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── FilterPanel ─────────────────────────────────────────────────────────────
function FilterSection({ title, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div className="border-b border-stone-200 pb-4 mb-4">
            <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between mb-3 group">
                <span className="text-xs font-semibold uppercase tracking-widest text-stone-700">{title}</span>
                <span className={`text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-3.5 h-3.5" />
                </span>
            </button>
            {open && children}
        </div>
    )
}

function FilterPanel({ filters, setFilters, options, onClose }) {
    const toggle = (key, value) => {
        setFilters(prev => {
            const arr = prev[key] ?? []
            return {
                ...prev,
                [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
            }
        })
    }

    const activeCount = (filters.colors?.length ?? 0) + (filters.sizes?.length ?? 0) + (filters.categories?.length ?? 0) + (filters.inStock ? 1 : 0)

    return (
        <div className="w-full lg:w-56 shrink-0">
            <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-semibold uppercase tracking-widest text-stone-700">
                    Filters {activeCount > 0 && <span className="ml-1 text-[#4D0010]">({activeCount})</span>}
                </span>
                {activeCount > 0 && (
                    <button
                        onClick={() => setFilters({ colors: [], sizes: [], categories: [], inStock: false })}
                        className="text-xs text-stone-400 hover:text-stone-700 underline"
                    >
                        Clear all
                    </button>
                )}
                {onClose && (
                    <button onClick={onClose} className="lg:hidden text-stone-400 hover:text-stone-700">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Categories */}
            {options.categories.length > 0 && (
                <FilterSection title="Category">
                    <div className="space-y-2">
                        {options.categories.map(cat => {
                            const checked = filters.categories?.includes(cat.slug)
                            return (
                                <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
                                    <div
                                        onClick={() => toggle('categories', cat.slug)}
                                        className={`w-3.5 h-3.5 border transition-colors flex-shrink-0 ${checked ? 'bg-stone-900 border-stone-900' : 'border-stone-300 group-hover:border-stone-600'}`}
                                    >
                                        {checked && <svg viewBox="0 0 10 10" className="w-full h-full text-white" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="2,5 4,7.5 8,2.5"/></svg>}
                                    </div>
                                    <span className="text-sm text-stone-600">{cat.name}</span>
                                </label>
                            )
                        })}
                    </div>
                </FilterSection>
            )}

            {/* Colors */}
            {options.colors.length > 0 && (
                <FilterSection title="Color">
                    <div className="flex flex-wrap gap-2">
                        {options.colors.map(c => {
                            const selected = filters.colors?.includes(c.name.toLowerCase())
                            const isMulti  = c.hexAll.length > 1
                            return (
                                <button
                                    key={c.name}
                                    onClick={() => toggle('colors', c.name.toLowerCase())}
                                    title={c.name}
                                    className={`relative w-7 h-7 rounded-full border-2 transition-all ${selected ? 'border-stone-900 scale-110' : 'border-transparent hover:border-stone-400'}`}
                                >
                                    {isMulti ? (
                                        <span className="absolute inset-0 rounded-full overflow-hidden flex">
                                            {c.hexAll.map((hex, i) => <span key={i} className="flex-1 h-full" style={{ background: hex }} />)}
                                        </span>
                                    ) : (
                                        <span className="absolute inset-0 rounded-full" style={{ background: c.hex }} />
                                    )}
                                    {(c.hex === '#FFFFFF' || c.hex === '#ffffff') && (
                                        <span className="absolute inset-0 rounded-full border border-stone-300" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </FilterSection>
            )}

            {/* Sizes */}
            {options.sizes.length > 0 && (
                <FilterSection title="Size">
                    <div className="flex flex-wrap gap-2">
                        {options.sizes.map(size => {
                            const selected = filters.sizes?.includes(size)
                            return (
                                <button
                                    key={size}
                                    onClick={() => toggle('sizes', size)}
                                    className={`px-2.5 h-8 text-xs uppercase border transition-all ${
                                        selected ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300 text-stone-600 hover:border-stone-700'
                                    }`}
                                >
                                    {size}
                                </button>
                            )
                        })}
                    </div>
                </FilterSection>
            )}

            {/* Availability */}
            <FilterSection title="Availability">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div
                        onClick={() => setFilters(prev => ({ ...prev, inStock: !prev.inStock }))}
                        className={`w-3.5 h-3.5 border transition-colors flex-shrink-0 ${filters.inStock ? 'bg-stone-900 border-stone-900' : 'border-stone-300 group-hover:border-stone-600'}`}
                    >
                        {filters.inStock && <svg viewBox="0 0 10 10" className="w-full h-full text-white" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="2,5 4,7.5 8,2.5"/></svg>}
                    </div>
                    <span className="text-sm text-stone-600">In stock only</span>
                </label>
            </FilterSection>
        </div>
    )
}

// ─── Sort Dropdown ────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
    { value: 'new',        label: 'Newest first' },
    { value: 'featured',   label: 'Featured' },
    { value: 'price_asc',  label: 'Price, low to high' },
    { value: 'price_desc', label: 'Price, high to low' },
    { value: 'name_asc',   label: 'Alphabetically, A–Z' },
    { value: 'name_desc',  label: 'Alphabetically, Z–A' },
]

function SortDropdown({ value, onChange }) {
    const [open, setOpen] = useState(false)
    const current = SORT_OPTIONS.find(o => o.value === value)
    const ref = useRef(null)

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2 text-sm text-stone-700 border border-stone-300 px-3 py-2 hover:border-stone-600 transition-colors"
            >
                {current?.label}
                <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-stone-200 shadow-lg z-20">
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setOpen(false) }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                    opt.value === value ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-50'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

// ─── Main ShopPage ────────────────────────────────────────────────────────────
export default function ShopPage() {
    const [filters,     setFilters]     = useState({ colors: [], sizes: [], categories: [], inStock: false })
    const [sort,        setSort]        = useState('new')
    const [page,        setPage]        = useState(0)
    const [mobileFilters, setMobileFilters] = useState(false)

    const { products, total, loading, error, pageSize } = useProducts({ filters, sort, page })
    const { options } = useFilterOptions()

    const totalPages = Math.ceil(total / pageSize)

    // Reset to page 0 when filters/sort change
    const handleFilterChange = useCallback((updater) => {
        setFilters(updater)
        setPage(0)
    }, [])

    const handleSortChange = useCallback((s) => {
        setSort(s)
        setPage(0)
    }, [])

    const activeFilterCount =
        (filters.colors?.length ?? 0) +
        (filters.sizes?.length ?? 0) +
        (filters.categories?.length ?? 0) +
        (filters.inStock ? 1 : 0)

    return (
        <>
            <div className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm">
                <Header />
            </div>

            <main className="font-[Bricolage_Grotesque] pt-20 min-h-screen">
                {/* Page header */}
                <div className="text-center py-10 border-b border-stone-100">
                    <h1 className="font-serif text-3xl md:text-4xl font-light tracking-wide uppercase text-stone-900">
                        Shop All
                    </h1>
                    <p className="text-sm text-stone-400 mt-2">Handmade with love, crafted for you</p>
                </div>

                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
                    {/* Mobile filter toggle */}
                    <div className="flex items-center justify-between mb-6 lg:hidden">
                        <button
                            onClick={() => setMobileFilters(true)}
                            className="flex items-center gap-2 text-sm border border-stone-300 px-4 py-2 hover:bg-stone-50 transition-colors"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                        </button>
                        <SortDropdown value={sort} onChange={handleSortChange} />
                    </div>

                    {/* Mobile filter drawer */}
                    {mobileFilters && (
                        <>
                            <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setMobileFilters(false)} />
                            <div className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white p-6 overflow-y-auto shadow-xl">
                                <FilterPanel
                                    filters={filters}
                                    setFilters={handleFilterChange}
                                    options={options}
                                    onClose={() => setMobileFilters(false)}
                                />
                            </div>
                        </>
                    )}

                    <div className="flex gap-8">
                        {/* Desktop sidebar filters */}
                        <aside className="hidden lg:block sticky top-24 self-start h-fit">
                            <FilterPanel
                                filters={filters}
                                setFilters={handleFilterChange}
                                options={options}
                            />
                        </aside>

                        {/* Products grid */}
                        <div className="flex-1 min-w-0">

                            {/* Toolbar */}
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-sm text-stone-500">
                                    {loading ? 'Loading…' : `${total.toLocaleString()} product${total !== 1 ? 's' : ''}`}
                                </p>
                                <div className="hidden lg:block">
                                    <SortDropdown value={sort} onChange={handleSortChange} />
                                </div>
                            </div>

                            {/* Active filter pills */}
                            {activeFilterCount > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {filters.colors?.map(c => (
                                        <button key={c} onClick={() => handleFilterChange(prev => ({ ...prev, colors: prev.colors.filter(x => x !== c) }))}
                                            className="flex items-center gap-1 text-xs border border-stone-300 px-2.5 py-1 hover:bg-stone-50 transition-colors capitalize">
                                            {c} <X className="w-3 h-3 text-stone-400" />
                                        </button>
                                    ))}
                                    {filters.sizes?.map(s => (
                                        <button key={s} onClick={() => handleFilterChange(prev => ({ ...prev, sizes: prev.sizes.filter(x => x !== s) }))}
                                            className="flex items-center gap-1 text-xs border border-stone-300 px-2.5 py-1 hover:bg-stone-50 transition-colors uppercase">
                                            {s} <X className="w-3 h-3 text-stone-400" />
                                        </button>
                                    ))}
                                    {filters.categories?.map(c => {
                                        const cat = options.categories.find(o => o.slug === c)
                                        return (
                                            <button key={c} onClick={() => handleFilterChange(prev => ({ ...prev, categories: prev.categories.filter(x => x !== c) }))}
                                                className="flex items-center gap-1 text-xs border border-stone-300 px-2.5 py-1 hover:bg-stone-50 transition-colors">
                                                {cat?.name ?? c} <X className="w-3 h-3 text-stone-400" />
                                            </button>
                                        )
                                    })}
                                    {filters.inStock && (
                                        <button onClick={() => handleFilterChange(prev => ({ ...prev, inStock: false }))}
                                            className="flex items-center gap-1 text-xs border border-stone-300 px-2.5 py-1 hover:bg-stone-50 transition-colors">
                                            In stock <X className="w-3 h-3 text-stone-400" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="text-sm text-red-500 mb-4">Error: {error}</div>
                            )}

                            {loading ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="animate-pulse">
                                            <div className="aspect-[3/4] bg-stone-100 mb-3" />
                                            <div className="h-3 bg-stone-100 rounded w-3/4 mb-2" />
                                            <div className="h-3 bg-stone-100 rounded w-1/2" />
                                        </div>
                                    ))}
                                </div>

                            ) : products.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-4 text-stone-400">
                                    <p className="text-sm">No products match your filters.</p>
                                    <button
                                        onClick={() => handleFilterChange({ colors: [], sizes: [], categories: [], inStock: false })}
                                        className="text-xs text-stone-700 underline hover:text-stone-900"
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                    {products.map(p => <ProductCard key={p.id} product={p} />)}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && !loading && (
                                <div className="flex items-center justify-center gap-2 mt-10">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="px-4 py-2 border border-stone-300 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-30 transition-colors"
                                    >
                                        ← Prev
                                    </button>

                                    {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                                        // Smart pagination: show first, last, and pages around current
                                        let pageNum
                                        if (totalPages <= 7) {
                                            pageNum = i
                                        } else if (i === 0) {
                                            pageNum = 0
                                        } else if (i === 6) {
                                            pageNum = totalPages - 1
                                        } else {
                                            const mid = Math.min(Math.max(page, 2), totalPages - 3)
                                            pageNum = mid - 2 + i
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-9 h-9 text-sm border transition-colors ${
                                                    page === pageNum
                                                        ? 'bg-stone-900 text-white border-stone-900'
                                                        : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                                                }`}
                                            >
                                                {pageNum + 1}
                                            </button>
                                        )
                                    })}

                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="px-4 py-2 border border-stone-300 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-30 transition-colors"
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    )
}
