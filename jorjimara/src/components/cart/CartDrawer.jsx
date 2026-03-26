import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext.jsx'
import { Plus, Minus, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

const fmt = (n) => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(n)

function CartItem({ item }) {
    const { setQty, removeItem } = useCart()

    return (
        <div className="font-[Bricolage_Grotesque] flex gap-4 py-4 border-b border-stone-100">
            {/* Thumbnail */}
            <div className="w-20 h-24 shrink-0 bg-stone-50 overflow-hidden">
                {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-stone-100" />
                }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-stone-900 leading-snug">{item.productName}</p>
                    <button
                        onClick={() => removeItem(item.variantId)}
                        className="shrink-0 text-stone-400 hover:text-stone-700 transition-colors mt-0.5"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {item.variantLabel && (
                    <p className="text-xs text-stone-400">{item.variantLabel}</p>
                )}

                <p className="text-sm text-stone-700 font-medium mt-auto">
                    ₦{fmt(item.price * item.quantity)}
                </p>

                {/* Qty controls */}
                <div className="flex items-center border border-stone-200 w-fit mt-1">
                    <button
                        onClick={() => setQty(item.variantId, item.quantity - 1)}
                        className="w-8 h-7 flex items-center justify-center hover:bg-stone-50 transition-colors"
                    >
                        <Minus className="w-3 h-3 text-stone-600" />
                    </button>
                    <span className="w-8 text-center text-xs">{item.quantity}</span>
                    <button
                        onClick={() => setQty(item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-8 h-7 flex items-center justify-center hover:bg-stone-50 transition-colors disabled:opacity-30"
                    >
                        <Plus className="w-3 h-3 text-stone-600" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function CartDrawer({ open, onClose }) {
    const { items, subtotal, totalItems, clearCart } = useCart()
    const navigate = useNavigate()

    // Lock scroll when open
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [onClose])

    const FREE_SHIPPING_THRESHOLD = 50000
    const remaining = FREE_SHIPPING_THRESHOLD - subtotal
    const progress  = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-60 bg-black/40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        className="fixed top-0 right-0 bottom-0 z-70 w-full max-w-md bg-white flex flex-col shadow-2xl"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
                            <h2 className="font-medium text-stone-900 text-sm tracking-wider uppercase">
                                Your Cart {totalItems > 0 && <span className="text-stone-400 font-normal">({totalItems})</span>}
                            </h2>
                            <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Free shipping progress */}
                        {/*{subtotal > 0 && (*/}
                        {/*    <div className="px-6 py-3 bg-stone-50 border-b border-stone-100">*/}
                        {/*        {remaining > 0 ? (*/}
                        {/*            <p className="text-xs text-stone-600 mb-1.5">*/}
                        {/*                Add <span className="font-medium text-stone-900">₦{fmt(remaining)}</span> more for free shipping*/}
                        {/*            </p>*/}
                        {/*        ) : (*/}
                        {/*            <p className="text-xs text-green-700 font-medium mb-1.5">🎉 You've unlocked free shipping!</p>*/}
                        {/*        )}*/}
                        {/*        <div className="h-1 bg-stone-200 rounded-full overflow-hidden">*/}
                        {/*            <div*/}
                        {/*                className="h-full bg-stone-900 rounded-full transition-all duration-500"*/}
                        {/*                style={{ width: `${progress}%` }}*/}
                        {/*            />*/}
                        {/*        </div>*/}
                        {/*    </div>*/}
                        {/*)}*/}

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto px-6">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-stone-400">
                                    <svg className="w-12 h-12 text-stone-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                                    </svg>
                                    <p className="text-sm">Your cart is empty</p>
                                    <button
                                        onClick={() => { onClose(); navigate('/products') }}
                                        className="text-xs uppercase tracking-widest underline text-stone-700 hover:text-stone-900"
                                    >
                                        Browse products
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {items.map(item => <CartItem key={item.variantId} item={item} />)}
                                    <button
                                        onClick={clearCart}
                                        className="text-xs text-stone-400 hover:text-stone-600 transition-colors mt-3 mb-2 underline"
                                    >
                                        Clear cart
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="px-6 py-6 border-t border-stone-100 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-stone-600">Subtotal</span>
                                    <span className="font-medium text-stone-900">₦{fmt(subtotal)}</span>
                                </div>
                                <p className="text-xs text-stone-400">Shipping and taxes calculated at checkout</p>
                                <button
                                    onClick={() => { onClose(); navigate('/checkout') }}
                                    className="w-full bg-[#4D0010] hover:bg-[#3a000c] text-white py-4 text-sm tracking-widest uppercase font-medium transition-colors"
                                >
                                    Checkout — ₦{fmt(subtotal)}
                                </button>
                                <button
                                    onClick={() => { onClose(); navigate('/products') }}
                                    className="w-full border border-stone-300 text-stone-700 py-3 text-xs tracking-widest uppercase hover:bg-stone-50 transition-colors"
                                >
                                    Continue shopping
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
