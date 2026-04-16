import { useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from './Toast.jsx'
import { Handbag } from 'lucide-react'

// Props:
//   product     — { id, name, slug, price }
//   variant     — the selected product_variant object (or null)
//   imageUrl    — string
//   quantity    — number (default 1)
//   isOutOfStock— bool
//   onCartOpen  — optional callback to open the cart drawer
//   className   — override button classes
//   label       — button text (default 'Add to Cart')
//   compact     — if true, renders the small "Quick Add" style button

export default function AddToCartButton({
    product,
    variant,
    imageUrl,
    quantity = 1,
    isOutOfStock = false,
    onCartOpen,
    className,
    label = 'Add to Cart',
    compact = false,
    showIcon = true,
}) {
    const { addItem, isInCart } = useCart()
    const toast = useToast()
    const [pulse, setPulse] = useState(false)

    const inCart = variant ? isInCart(variant.id) : false
    const disabled = isOutOfStock || !variant

    const handle = (e) => {
        e?.stopPropagation()
        if (disabled) return

        addItem({
            variantId: variant.id,
            productId: product.id,
            productName: product.name,
            slug: product.slug,
            // variantLabel: buildVariantLabel(variant),
            price: variant?.price ?? product?.price ?? 0,
            imageUrl: imageUrl ?? null,
            quantity,
            stock: variant.stock ?? 99,
        })

        setPulse(true)
        setTimeout(() => setPulse(false), 600)

        toast({ message: `${product.name} added to cart` })
        onCartOpen?.()
    }

    if (compact) {
        return (
            <button
                onClick={handle}
                disabled={disabled}
                className={
                    className ??
                    `mt-auto w-full border border-stone-300 py-2.5 text-[10px] tracking-widest uppercase font-medium bg-stone-200
                    transition-colors lg:opacity-0 lg:group-hover:opacity-100
                    ${disabled ? 'text-stone-300 cursor-not-allowed' : 'text-stone-800 hover:bg-stone-100'}`
                }
            >
                {isOutOfStock ? 'Out of Stock' : inCart ? 'In Cart ✓' : label}
            </button>
        )
    }

    return (
        <button
            onClick={handle}
            disabled={disabled}
            className={
                className ??
                `flex-1 h-12 flex items-center justify-center gap-2 text-sm tracking-widest uppercase font-medium transition-all
                ${pulse ? 'scale-95' : 'scale-100'}
                ${disabled
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    : inCart
                        ? 'bg-green-800 text-white hover:bg-green-700'
                        : 'bg-stone-900 text-white hover:bg-stone-700'
                }`
            }
        >
            {showIcon && <Handbag className="w-4 h-4" />}
            {isOutOfStock ? 'Out of Stock' : inCart ? 'In Cart ✓' : label}
        </button>
    )
}
