import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X, Plus, Minus, ArrowRight, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useQuickView } from '../context/QuickViewContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from './Toast.jsx'
import { buildVariantLabel, resolvePrice } from '../hooks/useProducts.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(Number(n))

function extractOptions(variants) {
    const sizeOrder = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'one size', 'one-size', 'onesize']
    const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))]
    sizes.sort((a, b) => {
        const ai = sizeOrder.indexOf(a.toLowerCase())
        const bi = sizeOrder.indexOf(b.toLowerCase())
        if (ai === -1 && bi === -1) return a.localeCompare(b)
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
    })

    const colorMap = {}
    variants.forEach(v => {
        if (v.color && !colorMap[v.color.toLowerCase()]) {
            colorMap[v.color.toLowerCase()] = {
                name: v.color,
                hex: v.color_hex?.[0] ?? '#cccccc',
                hexAll: v.color_hex ?? [],
            }
        }
    })
    const colors = Object.values(colorMap)

    const optionName = variants.find(v => v.option_name)?.option_name ?? null
    const optionValues = optionName
        ? [...new Set(variants.map(v => v.option_value).filter(Boolean))]
        : []

    return { sizes, colors, optionName, optionValues }
}

function findVariant(variants, selections) {
    return variants.find(v => {
        const sizeMatch  = !selections.size  || (v.size  ?? '').toLowerCase() === selections.size.toLowerCase()
        const colorMatch = !selections.color || (v.color ?? '').toLowerCase() === selections.color.toLowerCase()
        const optMatch   = !selections.optionValue || v.option_value === selections.optionValue
        return sizeMatch && colorMatch && optMatch
    }) ?? null
}

function getImagesForVariant(allImages, variantId, productId) {
    const variantImages = allImages
        .filter(img => img.variant_id === variantId)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

    const sharedImages = allImages
        .filter(img => img.variant_id === null)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

    const combined = [...variantImages, ...sharedImages]
    return combined.length > 0
        ? combined
        : allImages.filter(img => img.product_id === productId).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

// ─── Mini image gallery inside the modal ─────────────────────────────────────
function ModalGallery({ images, productName }) {
    const [activeIdx, setActiveIdx] = useState(0)
    const touchStartX = useRef(null)

    useEffect(() => setActiveIdx(0), [images])

    const go = useCallback((dir) => {
        setActiveIdx(i => (i + dir + images.length) % images.length)
    }, [images.length])

    const onTouchStart = e => { touchStartX.current = e.touches[0].clientX }
    const onTouchEnd   = e => {
        if (touchStartX.current === null) return
        const delta = touchStartX.current - e.changedTouches[0].clientX
        if (Math.abs(delta) > 40) go(delta > 0 ? 1 : -1)
        touchStartX.current = null
    }

    if (!images.length) {
        return <div className="aspect-[3/4] bg-stone-100 flex items-center justify-center text-stone-300 text-xs">No image</div>
    }

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Main image */}
            <div
                className="relative flex-1 overflow-hidden bg-stone-50 min-h-0"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                {/* Sliding strip */}
                <div
                    className="flex h-full will-change-transform transition-transform duration-300 ease-in-out"
                    style={{
                        width: `${images.length * 100}%`,
                        transform: `translateX(-${(activeIdx / images.length) * 100}%)`,
                    }}
                >
                    {images.map((img, i) => (
                        <div
                            key={img.id ?? i}
                            style={{ width: `${100 / images.length}%` }}
                            className="h-full shrink-0"
                        >
                            <img
                                src={img.url}
                                alt={img.alt_text || `${productName} ${i + 1}`}
                                className="w-full h-full object-cover"
                                loading={i === 0 ? 'eager' : 'lazy'}
                                draggable={false}
                            />
                        </div>
                    ))}
                </div>

                {/* Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={() => go(-1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-colors z-10"
                            aria-label="Previous"
                        >
                            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                                <polyline points="7.5,2 3.5,6 7.5,10" />
                            </svg>
                        </button>
                        <button
                            onClick={() => go(1)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-colors z-10"
                            aria-label="Next"
                        >
                            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                                <polyline points="4.5,2 8.5,6 4.5,10" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Counter badge */}
                {images.length > 1 && (
                    <span className="absolute bottom-2 right-3 text-[10px] text-white bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {activeIdx + 1} / {images.length}
                    </span>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 shrink-0">
                    {images.map((img, i) => (
                        <button
                            key={img.id ?? i}
                            onClick={() => setActiveIdx(i)}
                            className={`w-12 h-14 shrink-0 overflow-hidden border-2 transition-all ${
                                i === activeIdx ? 'border-stone-900' : 'border-transparent hover:border-stone-300'
                            }`}
                        >
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function QuickViewSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 animate-pulse h-full">
            <div className="bg-stone-100 aspect-[3/4] md:aspect-auto md:h-full" />
            <div className="p-6 md:p-8 flex flex-col gap-4">
                <div className="h-5 bg-stone-100 rounded w-2/3" />
                <div className="h-4 bg-stone-100 rounded w-1/3" />
                <div className="h-px bg-stone-100 w-full my-2" />
                <div className="h-3 bg-stone-100 rounded w-1/4 mt-2" />
                <div className="flex gap-2 mt-1">
                    {[1,2,3].map(i => <div key={i} className="h-9 w-12 bg-stone-100 rounded-sm" />)}
                </div>
                <div className="h-3 bg-stone-100 rounded w-1/4 mt-3" />
                <div className="flex gap-2 mt-1">
                    {[1,2].map(i => <div key={i} className="w-8 h-8 bg-stone-100 rounded-full" />)}
                </div>
                <div className="mt-auto flex gap-3">
                    <div className="h-12 flex-1 bg-stone-100 rounded-sm" />
                </div>
            </div>
        </div>
    )
}

// ─── Main QuickView Modal ─────────────────────────────────────────────────────
export default function QuickViewModal() {
    const { slug, closeQuickView } = useQuickView()
    const { addItem, isInCart }    = useCart()
    const toast                    = useToast()
    const navigate                 = useNavigate()

    const [product,   setProduct]   = useState(null)
    const [variants,  setVariants]  = useState([])
    const [allImages, setAllImages] = useState([])
    const [loading,   setLoading]   = useState(false)
    const [error,     setError]     = useState(null)

    const [selections, setSelections] = useState({ size: null, color: null, optionValue: null })
    const [quantity,   setQuantity]   = useState(1)
    const [addedPulse, setAddedPulse] = useState(false)

    // ── Fetch when slug changes ───────────────────────────────────────────
    useEffect(() => {
        if (!slug) {
            setProduct(null)
            setVariants([])
            setAllImages([])
            setSelections({ size: null, color: null, optionValue: null })
            setQuantity(1)
            return
        }

        let cancelled = false
        setLoading(true)
        setError(null)

        async function load() {
            // Fetch product + variants + images in parallel
            const [prodRes] = await Promise.all([
                supabase
                    .from('products')
                    .select('*')
                    .eq('slug', slug)
                    .eq('is_active', true)
                    .single(),
            ])

            if (cancelled) return
            if (prodRes.error || !prodRes.data) {
                setError('Product not found.')
                setLoading(false)
                return
            }

            const prod = prodRes.data

            const [varsRes, imgsRes] = await Promise.all([
                supabase
                    .from('product_variants')
                    .select('*')
                    .eq('product_id', prod.id)
                    .order('created_at', { ascending: true }),
                supabase
                    .from('product_images')
                    .select('*')
                    .eq('product_id', prod.id)
                    .order('sort_order', { ascending: true }),
            ])

            if (cancelled) return

            const vars = varsRes.data ?? []
            const imgs = imgsRes.data ?? []

            setProduct(prod)
            setVariants(vars)
            setAllImages(imgs)
            setLoading(false)

            // Pre-select first active variant
            const first = vars.find(v => v.is_active)
            if (first) {
                setSelections({
                    size:        first.size         ?? null,
                    color:       first.color        ?? null,
                    optionValue: first.option_value ?? null,
                })
            }
        }

        load()
        return () => { cancelled = true }
    }, [slug])

    // ── Lock scroll while open ────────────────────────────────────────────
    useEffect(() => {
        if (slug) document.body.style.overflow = 'hidden'
        else      document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [slug])

    // ── Esc to close ──────────────────────────────────────────────────────
    useEffect(() => {
        const handler = e => { if (e.key === 'Escape') closeQuickView() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [closeQuickView])

    // ── Derived ───────────────────────────────────────────────────────────
    const activeVariants  = variants.filter(v => v.is_active)
    const { sizes, colors, optionName, optionValues } = extractOptions(activeVariants)
    const selectedVariant = findVariant(activeVariants, selections)
    const displayImages   = getImagesForVariant(allImages, selectedVariant?.id, product?.id)

    const displayPrice  = selectedVariant?.price ?? product?.price
    const comparePrice  = product?.compare_price
    const hasSale       = comparePrice && Number(comparePrice) > Number(displayPrice)
    const stock         = selectedVariant?.stock ?? 0
    const isOutOfStock  = selectedVariant ? stock <= 0 : false
    const isLowStock    = selectedVariant && stock > 0 && stock <= 5
    const inCart        = selectedVariant ? isInCart(selectedVariant.id) : false

    const select = (key, value) => {
        setSelections(prev => ({ ...prev, [key]: value }))
        setQuantity(1)
    }

    const handleAddToCart = () => {
        if (!selectedVariant || isOutOfStock) return
        addItem({
            variantId:    selectedVariant.id,
            productId:    product.id,
            productName:  product.name,
            slug:         product.slug,
            variantLabel: buildVariantLabel(selectedVariant),
            price:        resolvePrice(selectedVariant, product),
            imageUrl:     displayImages[0]?.url ?? null,
            quantity,
            stock:        selectedVariant.stock ?? 99,
        })
        setAddedPulse(true)
        setTimeout(() => setAddedPulse(false), 600)
        toast({ message: `${product.name} added to cart` })
    }

    const goToFullPage = () => {
        closeQuickView()
        navigate(
            selectedVariant
                ? `/products/${product.slug}?variant=${selectedVariant.id}`
                : `/products/${product.slug}`
        )
    }

    return (
        <AnimatePresence>
            {slug && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[2px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={closeQuickView}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-8 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div
                            className="relative w-full max-w-3xl bg-white shadow-2xl pointer-events-auto overflow-hidden flex flex-col"
                            style={{ maxHeight: 'min(90vh, 680px)' }}
                            initial={{ scale: 0.94, y: 24 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 16, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* ── Close button ── */}
                            <button
                                onClick={closeQuickView}
                                className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-stone-100 border border-stone-200 transition-colors rounded-sm"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4 text-stone-600" />
                            </button>

                            {loading ? (
                                <div className="flex-1 min-h-0">
                                    <QuickViewSkeleton />
                                </div>
                            ) : error || !product ? (
                                <div className="flex items-center justify-center h-60 text-stone-400 text-sm">
                                    {error ?? 'Product not found.'}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 flex-1 min-h-0 overflow-hidden font-[Bricolage_Grotesque]">

                                    {/* ── LEFT: Gallery ── */}
                                    <div className="relative bg-stone-50 overflow-hidden"
                                         style={{ maxHeight: 'min(90vh, 680px)' }}>
                                        {/* Sale badge */}
                                        {hasSale && (
                                            <span className="absolute top-3 left-3 z-10 bg-[#4d0011] text-white text-[9px] tracking-widest uppercase font-medium px-2.5 py-1">
                                                Sale
                                            </span>
                                        )}
                                        {product.is_new_in && !hasSale && (
                                            <span className="absolute top-3 left-3 z-10 bg-stone-900 text-white text-[9px] tracking-widest uppercase font-medium px-2.5 py-1">
                                                New
                                            </span>
                                        )}
                                        {/* Mobile: fixed height, desktop: full height */}
                                        <div className="h-72 md:h-full p-0">
                                            <ModalGallery images={displayImages} productName={product.name} />
                                        </div>
                                    </div>

                                    {/* ── RIGHT: Info + actions ── */}
                                    <div className="flex flex-col overflow-y-auto p-6 md:p-7 gap-4">

                                        {/* Name */}
                                        <div>
                                            <h2 className="font-serif text-xl md:text-2xl font-light text-stone-900 leading-snug">
                                                {product.name}
                                            </h2>

                                            {/* Price */}
                                            <div className="flex items-baseline gap-2.5 mt-1.5">
                                                <span className={`text-base font-light ${hasSale ? 'text-[#4d0011]' : 'text-stone-900'}`}>
                                                    ₦{fmt(displayPrice)}
                                                </span>
                                                {hasSale && (
                                                    <span className="text-sm text-stone-400 line-through">
                                                        ₦{fmt(comparePrice)}
                                                    </span>
                                                )}
                                                {hasSale && (
                                                    <span className="text-xs font-medium bg-red-50 text-red-700 px-1.5 py-0.5 rounded">
                                                        {Math.round((1 - Number(displayPrice) / Number(comparePrice)) * 100)}% off
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="h-px bg-stone-100" />

                                        {/* ── Color selector ── */}
                                        {colors.length > 0 && (
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-2 font-medium">
                                                    Color
                                                    {selections.color && (
                                                        <span className="normal-case tracking-normal font-normal text-stone-700 ml-2">
                                                            {selections.color}
                                                        </span>
                                                    )}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {colors.map(c => {
                                                        const available = activeVariants.some(v =>
                                                            (v.color ?? '').toLowerCase() === c.name.toLowerCase() &&
                                                            (!selections.size || (v.size ?? '').toLowerCase() === selections.size.toLowerCase()) &&
                                                            v.stock > 0
                                                        )
                                                        const selected = (selections.color ?? '').toLowerCase() === c.name.toLowerCase()
                                                        const isMulti  = c.hexAll.length > 1
                                                        return (
                                                            <button
                                                                key={c.name}
                                                                onClick={() => select('color', c.name)}
                                                                title={c.name}
                                                                disabled={!available && !selected}
                                                                className={`relative w-8 h-8 rounded-full border-2 transition-all ${
                                                                    selected ? 'border-stone-900 scale-110' : 'border-transparent hover:border-stone-400'
                                                                } ${!available && !selected ? 'opacity-25 cursor-not-allowed' : ''}`}
                                                            >
                                                                {isMulti ? (
                                                                    <span className="absolute inset-0 rounded-full overflow-hidden flex">
                                                                        {c.hexAll.map((hex, i) => (
                                                                            <span key={i} className="flex-1 h-full" style={{ background: hex }} />
                                                                        ))}
                                                                    </span>
                                                                ) : (
                                                                    <span className="absolute inset-0 rounded-full" style={{ background: c.hex }} />
                                                                )}
                                                                {(c.hex === '#FFFFFF' || c.hex === '#ffffff') && (
                                                                    <span className="absolute inset-0 rounded-full border border-stone-200" />
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* ── Size selector ── */}
                                        {sizes.length > 0 && (
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-2 font-medium">
                                                    Size
                                                    {selections.size && (
                                                        <span className="normal-case tracking-normal font-normal text-stone-700 ml-2 capitalize">
                                                            {selections.size}
                                                        </span>
                                                    )}
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {sizes.map(size => {
                                                        const available = activeVariants.some(v =>
                                                            (v.size ?? '').toLowerCase() === size.toLowerCase() &&
                                                            (!selections.color || (v.color ?? '').toLowerCase() === selections.color.toLowerCase()) &&
                                                            (!selections.optionValue || v.option_value === selections.optionValue) &&
                                                            v.stock > 0
                                                        )
                                                        const selected = (selections.size ?? '').toLowerCase() === size.toLowerCase()
                                                        return (
                                                            <button
                                                                key={size}
                                                                onClick={() => select('size', size)}
                                                                disabled={!available && !selected}
                                                                className={`min-w-[42px] px-3 h-8 text-[10px] uppercase tracking-wide border transition-all ${
                                                                    selected
                                                                        ? 'bg-stone-900 text-white border-stone-900'
                                                                        : available
                                                                            ? 'border-stone-300 text-stone-700 hover:border-stone-700'
                                                                            : 'border-stone-200 text-stone-300 cursor-not-allowed line-through'
                                                                }`}
                                                            >
                                                                {size}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* ── Custom option (Piece, etc.) ── */}
                                        {optionName && optionValues.length > 0 && (
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-2 font-medium">
                                                    {optionName}
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {optionValues.map(val => {
                                                        const available = activeVariants.some(v =>
                                                            v.option_value === val &&
                                                            (!selections.size  || (v.size  ?? '').toLowerCase() === selections.size.toLowerCase()) &&
                                                            (!selections.color || (v.color ?? '').toLowerCase() === selections.color.toLowerCase()) &&
                                                            v.stock > 0
                                                        )
                                                        const selected = selections.optionValue === val
                                                        return (
                                                            <button
                                                                key={val}
                                                                onClick={() => select('optionValue', val)}
                                                                disabled={!available && !selected}
                                                                className={`px-3 h-8 text-[10px] tracking-wide border transition-all ${
                                                                    selected
                                                                        ? 'bg-[#4d0011] text-white border-[#4d0011]'
                                                                        : available
                                                                            ? 'border-stone-300 text-stone-700 hover:border-stone-700'
                                                                            : 'border-stone-200 text-stone-300 cursor-not-allowed line-through'
                                                                }`}
                                                            >
                                                                {val}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* ── Stock note ── */}
                                        {isOutOfStock ? (
                                            <p className="text-xs text-red-600 font-medium uppercase tracking-wider">Out of stock</p>
                                        ) : isLowStock ? (
                                            <p className="text-xs text-amber-700 font-medium uppercase tracking-wider">
                                                Only {stock} left — order soon
                                            </p>
                                        ) : null}

                                        {/* ── Quantity ── */}
                                        <div className="flex items-center gap-3">
                                            <p className="text-[10px] uppercase tracking-widest text-stone-500 font-medium w-16">Quantity</p>
                                            <div className="flex items-center border border-stone-200">
                                                <button
                                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                    disabled={quantity <= 1}
                                                    className="w-9 h-9 flex items-center justify-center hover:bg-stone-50 disabled:opacity-30 transition-colors"
                                                >
                                                    <Minus className="w-3 h-3 text-stone-600" />
                                                </button>
                                                <span className="w-9 text-center text-sm text-stone-900 select-none">{quantity}</span>
                                                <button
                                                    onClick={() => setQuantity(q => Math.min(stock, q + 1))}
                                                    disabled={isOutOfStock || quantity >= stock}
                                                    className="w-9 h-9 flex items-center justify-center hover:bg-stone-50 disabled:opacity-30 transition-colors"
                                                >
                                                    <Plus className="w-3 h-3 text-stone-600" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* ── CTA buttons ── */}
                                        <div className="flex flex-col gap-2 mt-auto pt-2">
                                            <button
                                                onClick={handleAddToCart}
                                                disabled={isOutOfStock || !selectedVariant}
                                                className={`w-full h-11 flex items-center justify-center gap-2 text-xs tracking-widest uppercase font-medium transition-all
                                                    ${addedPulse ? 'scale-95' : 'scale-100'}
                                                    ${isOutOfStock || !selectedVariant
                                                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                                    : inCart
                                                        ? 'bg-green-800 text-white hover:bg-green-700'
                                                        : 'bg-stone-900 text-white hover:bg-stone-700'
                                                }`}
                                            >
                                                {isOutOfStock
                                                    ? 'Out of Stock'
                                                    : inCart
                                                        ? 'In Cart ✓'
                                                        : 'Add to Cart'}
                                            </button>

                                            {/* View full details */}
                                            <button
                                                onClick={goToFullPage}
                                                className="w-full h-10 flex items-center justify-center gap-1.5 text-xs tracking-widest uppercase font-medium text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-400 transition-colors group"
                                            >
                                                View full details
                                                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}