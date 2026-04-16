import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { Handbag, ExternalLink, Plus, Minus } from 'lucide-react';
import AddToCartButton from '../components/AddToCartButton.jsx'
import CartDrawer from '../components/cart/CartDrawer.jsx'
import { motion } from "motion/react";
import { apiGet } from '../lib/api.js'   // ← replaces supabase import

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (amount) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(Number(amount));

function extractOptions(variants) {
    const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];

    const sizeOrder = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'one size', 'one-size', 'onesize'];
    sizes.sort((a, b) => {
        const ai = sizeOrder.indexOf(a.toLowerCase());
        const bi = sizeOrder.indexOf(b.toLowerCase());
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });

    const colorMap = {};
    variants.forEach(v => {
        if (v.color && !colorMap[v.color.toLowerCase()]) {
            colorMap[v.color.toLowerCase()] = {
                name: v.color,
                hex: v.color_hex?.[0] ?? '#cccccc',
                hexAll: v.color_hex ?? [],
            };
        }
    });
    const colors = Object.values(colorMap);

    const optionName = variants.find(v => v.option_name)?.option_name ?? null;
    const optionValues = optionName
        ? [...new Set(variants.map(v => v.option_value).filter(Boolean))]
        : [];

    return { sizes, colors, optionName, optionValues };
}

function findVariant(variants, selections) {
    return variants.find(v => {
        const sizeMatch = !selections.size || (v.size ?? '').toLowerCase() === selections.size.toLowerCase();
        const colorMatch = !selections.color || (v.color ?? '').toLowerCase() === selections.color.toLowerCase();
        const optMatch = !selections.optionValue || v.option_value === selections.optionValue;
        return sizeMatch && colorMatch && optMatch;
    }) ?? null;
}

function getImagesForVariant(allImages, variantId, productId) {
    const variantImages = allImages
        .filter(img => img.variant_id === variantId)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const sharedImages = allImages
        .filter(img => img.variant_id === null && img.product_id === productId)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const combined = [...variantImages, ...sharedImages];
    return combined.length > 0 ? combined : allImages
        .filter(img => img.product_id === productId)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ImageGallery({ images, productName, isOutOfStock }) {
    const [activeIdx, setActiveIdx] = useState(0);
    const touchStartX = useRef(null);

    useEffect(() => setActiveIdx(0), [images]);

    const go = useCallback((dir) => {
        setActiveIdx(prev => (prev + dir + images.length) % images.length);
    }, [images.length]);

    const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const delta = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(delta) > 40) go(delta > 0 ? 1 : -1);
        touchStartX.current = null;
    };

    if (!images.length) return (
        <div className="aspect-3/4 bg-stone-100 flex items-center justify-center">
            <span className="text-stone-400 text-sm">No images available</span>
        </div>
    );

    return (
        <div className="flex gap-3">
            {/* Thumbnails — hidden on mobile, shown on desktop */}
            <div className="hidden lg:flex flex-col gap-2 w-14 shrink-0">
                {images.map((img, i) => (
                    <button
                        key={img.id}
                        onClick={() => setActiveIdx(i)}
                        className={`aspect-square overflow-hidden border transition-all ${i === activeIdx ? 'border-stone-900' : 'border-transparent hover:border-stone-300'
                            }`}
                    >
                        <img src={img.url} alt={img.alt_text || productName} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>

            {/* Main image */}
            <div className="flex-1 relative">
                {isOutOfStock && (
                    <div className="absolute top-4 left-4 z-10 bg-white/90 px-3 py-1.5 backdrop-blur-sm border border-stone-200">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-stone-900">Sold Out</p>
                    </div>
                )}
                <div
                    className="relative overflow-hidden aspect-[3/4] bg-stone-50"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Sliding strip */}
                    <div
                        className="flex h-full transition-transform duration-350 ease-in-out"
                        style={{
                            width: `${images.length * 100}%`,
                            transform: `translateX(-${(activeIdx / images.length) * 100}%)`
                        }}
                    >
                        {images.map((img, i) => (
                            <div key={img.id} style={{ width: `${100 / images.length}%` }} className="h-full shrink-0">
                                <img
                                    src={img.url}
                                    alt={img.alt_text || `${productName} ${i + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Nav arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={() => go(-1)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-colors"
                            >
                                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                                    <polyline points="7.5,2 3.5,6 7.5,10" />
                                </svg>
                            </button>
                            <button
                                onClick={() => go(1)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-colors"
                            >
                                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                                    <polyline points="4.5,2 8.5,6 4.5,10" />
                                </svg>
                            </button>
                        </>
                    )}

                    {/* Mobile dot indicators */}
                    {images.length > 1 && (
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 lg:hidden">
                            {images.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveIdx(i)}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeIdx ? 'bg-stone-900' : 'bg-stone-400'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Counter */}
                <div className="flex justify-between items-center mt-2 text-xs text-stone-400 lg:hidden">
                    <span>{activeIdx + 1} / {images.length}</span>
                </div>
            </div>
        </div>
    );
}

function AccordionSection({ icon, title, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-t border-stone-200">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between py-4 text-left hover:opacity-70 transition-opacity"
            >
                <div className="flex items-center gap-3">
                    {icon && <span className="text-stone-500">{icon}</span>}
                    <span className="text-xs tracking-widest uppercase font-medium text-stone-800">{title}</span>
                </div>
                <span className="text-stone-400 text-lg leading-none">{open ? '−' : '+'}</span>
            </button>
            {open && (
                <div className="pb-4 text-sm text-stone-600 leading-relaxed">
                    {children}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductPage() {
    const { slug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [cartOpen, setCartOpen] = useState(false)
    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [allImages, setAllImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selections, setSelections] = useState({ size: null, color: null, optionValue: null });
    const [quantity, setQuantity] = useState(1);

    // ── Fetch product data ────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        // ─── CHANGED: one API call instead of three Supabase calls ────────
        //
        // Before (waterfall — each call waited for the previous one):
        //   1. supabase.from('products').select('*').eq('slug', slug).single()
        //   2. supabase.from('product_variants').select('*').eq('product_id', prod.id)
        //   3. supabase.from('product_images').select('*').eq('product_id', prod.id)
        //
        // After (single round-trip — Worker runs all three queries in parallel):
        //   GET /api/products/:slug  →  { product, variants, images }
        //
        // Everything below this block is UNCHANGED — same state, same derived
        // logic, same UI. Only the data source is different.

        apiGet(`/api/products/${slug}`)
            .then(({ product: prod, variants: vars, images: imgs }) => {
                if (cancelled) return;

                setProduct(prod);
                setVariants(vars ?? []);
                setAllImages(imgs ?? []);
                setLoading(false);

                // Pre-select variant from URL ?variant=id (same logic as before)
                const urlVariantId = searchParams.get('variant');
                const startVariant = urlVariantId
                    ? (vars ?? []).find(v => v.id === urlVariantId)
                    : (vars ?? []).find(v => v.is_active);

                if (startVariant) {
                    setSelections({
                        size: startVariant.size ?? null,
                        color: startVariant.color ?? null,
                        optionValue: startVariant.option_value ?? null,
                    });
                }
            })
            .catch(err => {
                if (cancelled) return;
                setError(err.message ?? 'Product not found.');
                setLoading(false);
            });

        return () => { cancelled = true; };
    }, [slug]);

    // ── Derived state ─────────────────────────────────────────────────────
    const activeVariants = variants.filter(v => v.is_active);
    const { sizes, colors, optionName, optionValues } = extractOptions(activeVariants);
    const selectedVariant = findVariant(activeVariants, selections);
    const displayImages = getImagesForVariant(allImages, selectedVariant?.id, product?.id);

    // Keep URL in sync with selected variant
    useEffect(() => {
        if (selectedVariant) {
            setSearchParams({ variant: selectedVariant.id }, { replace: true });
        }
    }, [selectedVariant?.id]);

    const select = (key, value) => {
        setSelections(prev => ({ ...prev, [key]: value }));
        setQuantity(1);
    };

    // ── Content sections from DB ──────────────────────────────────────────
    const contentSections = product?.content_sections ?? {};

    const sectionIcons = {
        'Shipping & Returns': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>,
        'Composition & Materials': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>,
        'Details': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>,
        'default': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
    };

    const getIcon = (title) => {
        const key = Object.keys(sectionIcons).find(k => title.toLowerCase().includes(k.toLowerCase()));
        return key ? sectionIcons[key] : sectionIcons['default'];
    };

    // ── Displayed price ───────────────────────────────────────────────────
    const displayPrice = selectedVariant?.price ?? product?.price;
    const comparePrice = product?.compare_price;

    // ── Stock indicator ───────────────────────────────────────────────────
    const stock = selectedVariant?.stock ?? 0;
    const isOutOfStock = selectedVariant && stock <= 0;
    const isLowStock = selectedVariant && stock > 0 && stock < 10;
    const isVeryLowStock = selectedVariant && stock > 0 && stock <= 3;

    // ─────────────────────────────────────────────────────────────────────
    if (loading) return (
        <>
            <Header />
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
            </div>
        </>
    );

    if (error || !product) return (
        <>
            <Header />
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-stone-500">
                <p>{error || 'Product not found.'}</p>
                <button onClick={() => navigate('/')} className="text-sm underline text-stone-800">Back to home</button>
            </div>
        </>
    );

    return (
        <>
            <div className="fixed top-0 left-0 w-full z-50 bg-white text-stone-900 shadow-sm">
                <Header />
            </div>

            <main className="font-[Bricolage_Grotesque] mt-20 max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
                {/* Breadcrumb */}
                <nav className="text-xs text-stone-400 mb-6 flex items-center gap-1.5">
                    <button onClick={() => navigate('/')} className="hover:text-stone-700 transition-colors">Home</button>
                    <span>/</span>
                    <span className="text-stone-700">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px] gap-8 lg:gap-12">

                    {/* ── LEFT: Images ── */}
                    <div>
                        <ImageGallery images={displayImages} productName={product.name} isOutOfStock={isOutOfStock} />
                    </div>

                    {/* ── RIGHT: Product info ── */}
                    <div className="flex flex-col gap-5">

                        {/* Name + price */}
                        <div>
                            <h1 className="font-serif text-2xl md:text-3xl font-light text-stone-900 mb-2">
                                {product.name}
                            </h1>
                            <div className="flex items-baseline gap-3">
                                <span className="text-lg font-light text-stone-900">
                                    ₦{fmt(displayPrice)}
                                </span>
                                {comparePrice && Number(comparePrice) > Number(displayPrice) && (
                                    <span className="text-sm text-stone-400 line-through">
                                        ₦{fmt(comparePrice)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* ── Size selector ── */}
                        {sizes.length > 0 && (
                            <div>
                                <p className="text-xs uppercase tracking-widest text-stone-500 mb-2.5 font-medium">
                                    Size{selections.size && <span className="normal-case tracking-normal font-normal text-stone-800 ml-2 capitalize">{selections.size}</span>}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {sizes.map(size => {
                                        const available = activeVariants.some(v =>
                                            (v.size ?? '').toLowerCase() === size.toLowerCase() &&
                                            (!selections.color || (v.color ?? '').toLowerCase() === selections.color.toLowerCase()) &&
                                            (!selections.optionValue || v.option_value === selections.optionValue) &&
                                            v.stock > 0
                                        );
                                        const selected = (selections.size ?? '').toLowerCase() === size.toLowerCase();
                                        return (
                                            <button
                                                key={size}
                                                onClick={() => select('size', size)}
                                                className={`min-w-[44px] px-3 h-9 text-xs uppercase tracking-wide border transition-all ${selected
                                                        ? 'bg-stone-900 text-white border-stone-900'
                                                        : available
                                                            ? 'border-stone-300 text-stone-700 hover:border-stone-700'
                                                            : 'border-stone-200 text-stone-300 cursor-not-allowed line-through'
                                                    }`}
                                                disabled={!available && !selected}
                                            >
                                                {size}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── Color selector ── */}
                        {colors.length > 0 && (
                            <div>
                                <p className="text-xs uppercase tracking-widest text-stone-500 mb-2.5 font-medium">
                                    Color{selections.color && <span className="normal-case tracking-normal font-normal text-stone-800 ml-2">{selections.color}</span>}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {colors.map(c => {
                                        const available = activeVariants.some(v =>
                                            (v.color ?? '').toLowerCase() === c.name.toLowerCase() &&
                                            (!selections.size || (v.size ?? '').toLowerCase() === selections.size.toLowerCase()) &&
                                            v.stock > 0
                                        );
                                        const selected = (selections.color ?? '').toLowerCase() === c.name.toLowerCase();
                                        const isMulti = c.hexAll.length > 1;
                                        return (
                                            <button
                                                key={c.name}
                                                onClick={() => select('color', c.name)}
                                                title={`${!available ? 'Not in Stock' : c.name}`}
                                                className={`relative w-9 h-9 rounded-full border-2 transition-all ${selected ? 'border-stone-900 scale-110' : 'border-transparent hover:border-stone-400'
                                                    } ${!available && !selected ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                disabled={!available && !selected}
                                            >
                                                {isMulti ? (
                                                    <span className="absolute inset-0 rounded-full overflow-hidden flex">
                                                        {c.hexAll.map((hex, i) => (
                                                            <span key={i} className="flex-1 h-full" style={{ background: hex }} />
                                                        ))}
                                                    </span>
                                                ) : (
                                                    <span
                                                        className="absolute inset-0 rounded-full"
                                                        style={{ background: c.hex }}
                                                    />
                                                )}
                                                {c.hex === '#FFFFFF' || c.hex === '#ffffff' ? (
                                                    <span className="absolute inset-0 rounded-full border border-stone-200" />
                                                ) : null}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── Custom option ── */}
                        {optionName && optionValues.length > 0 && (
                            <div>
                                <p className="text-xs uppercase tracking-widest text-stone-500 mb-2.5 font-medium">
                                    {optionName}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {optionValues.map(val => {
                                        const available = activeVariants.some(v =>
                                            v.option_value === val &&
                                            (!selections.size || (v.size ?? '').toLowerCase() === selections.size.toLowerCase()) &&
                                            (!selections.color || (v.color ?? '').toLowerCase() === selections.color.toLowerCase()) &&
                                            v.stock > 0
                                        );
                                        const selected = selections.optionValue === val;
                                        return (
                                            <button
                                                key={val}
                                                onClick={() => select('optionValue', val)}
                                                className={`px-4 h-9 text-xs tracking-wide border transition-all rounded-sm ${selected
                                                        ? 'bg-[#4d0011] text-white border-[#4d0011]'
                                                        : available
                                                            ? 'border-stone-300 text-stone-700 hover:border-stone-700'
                                                            : 'border-stone-200 text-stone-300 cursor-not-allowed line-through'
                                                    }`}
                                                disabled={!available && !selected}
                                            >
                                                {val}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Custom orders link */}
                        <p className="text-xs text-stone-500">
                            Kindly contact us{' '}
                            <a href="mailto:hello@jorjimara.com" className="underline text-stone-700 hover:text-stone-900">here</a>
                            {' '}for custom orders ♡
                        </p>

                        {product.size_chart_id && (
                            <button className="self-start flex items-center gap-1.5 text-xs text-stone-600 underline hover:text-stone-900 transition-colors">
                                Size Chart
                                <ExternalLink className="w-3 h-3" />
                            </button>
                        )}

                        {/* Stock indicator */}
                        {isOutOfStock ? (
                            <div className="flex items-center gap-2 text-xs text-red-600 font-medium py-1.5 w-fit uppercase tracking-wider">
                                Out of stock
                            </div>
                        ) : isLowStock ? (
                            <div className="flex flex-col gap-2 w-full max-w-75">
                                <div className={`flex items-center gap-2 text-xs font-medium py-1.5 w-fit uppercase tracking-wider ${isVeryLowStock
                                        ? 'text-red-700'
                                        : 'text-amber-700'
                                    }`}>
                                    {isVeryLowStock ? 'Almost Gone!' : 'Selling Fast!'} Only {stock} left
                                </div>
                            </div>
                        ) : selectedVariant && (
                            <></>
                        )}

                        {/* ── Quantity + Add to cart ── */}
                        <div className="flex gap-3 items-center">
                            {/* Quantity picker */}
                            <div className="flex items-center border border-stone-300 h-12">
                                <button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className={`w-10 h-full flex items-center justify-center transition-colors ${quantity <= 1 ? 'bg-stone-50 text-stone-300 cursor-not-allowed' : 'hover:bg-stone-50'
                                        }`}
                                    disabled={quantity <= 1}
                                >
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-10 text-center text-sm">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(q => Math.min(stock, q + 1))}
                                    className={`w-10 h-full flex items-center justify-center transition-colors ${isOutOfStock || quantity >= stock ? 'bg-stone-50 text-stone-300 cursor-not-allowed' : 'hover:bg-stone-50'
                                        }`}
                                    disabled={isOutOfStock || quantity >= stock}
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Add to cart */}
                            <AddToCartButton
                                product={product}
                                variant={selectedVariant}
                                imageUrl={displayImages[0]?.url}
                                quantity={quantity}
                                isOutOfStock={isOutOfStock}
                                onCartOpen={() => setCartOpen(true)}
                            />
                        </div>

                        {/* Buy it now */}
                        <button
                            disabled={isOutOfStock || !selectedVariant}
                            className={`w-full h-12 text-sm tracking-widest uppercase font-medium transition-all ${isOutOfStock || !selectedVariant
                                    ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                                    : 'bg-[#4d0011] text-white hover:bg-[#3a000c]'
                                }`}
                        >
                            Buy it now
                        </button>

                        {/* ── Accordions ── */}
                        <div className="mt-2 border-t border-stone-200">
                            {product.description && (
                                <AccordionSection icon={sectionIcons['Details']} title="Details" defaultOpen>
                                    <p className="whitespace-pre-line">{product.description}</p>
                                </AccordionSection>
                            )}

                            {contentSections.compositionAndMaterials && contentSections.compositionAndMaterials.length > 0 && (
                                <AccordionSection
                                    icon={sectionIcons['Composition & Materials']}
                                    title="Composition & Materials"
                                >
                                    <ul className="space-y-2">
                                        {contentSections.compositionAndMaterials.map((item, i) => (
                                            <li key={i} className="flex justify-between items-center border-b border-stone-50 pb-1">
                                                <span className="capitalize">{item.component}</span>
                                                <span className="text-stone-400 font-medium">{item.percentage}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionSection>
                            )}

                            {contentSections.fulfillment && (
                                <AccordionSection
                                    icon={sectionIcons['Shipping & Returns']}
                                    title="Shipping & Returns"
                                >
                                    <div className="space-y-4">
                                        {contentSections.fulfillment.shipping && (
                                            <div>
                                                <h4 className="text-[10px] uppercase tracking-widest font-semibold text-stone-900 mb-1.5">Shipping</h4>
                                                <p className="mb-2">{contentSections.fulfillment.shipping.body}</p>
                                                {contentSections.fulfillment.shipping['estimated time'] && (
                                                    <div className="flex items-center gap-2 text-xs bg-stone-50 p-2 rounded border border-stone-100">
                                                        <span className="font-medium text-stone-900">Estimated Delivery:</span>
                                                        <span className="text-stone-600">{contentSections.fulfillment.shipping['estimated time']}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {contentSections.fulfillment.policy && (
                                            <div className="pt-2 border-t border-stone-100">
                                                <h4 className="text-[10px] uppercase tracking-widest font-semibold text-stone-900 mb-1.5">Returns Policy</h4>
                                                <p className="whitespace-pre-line">{contentSections.fulfillment.policy.body}</p>
                                            </div>
                                        )}
                                    </div>
                                </AccordionSection>
                            )}
                        </div>

                    </div>
                </div>
            </main>

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
            <Footer />
        </>
    );
}