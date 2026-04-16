import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'

// ─── Shape of a cart item ─────────────────────────────────────────────────────
// {
//   variantId:    string   — the product_variant.id
//   productId:    string
//   productName:  string
//   slug:         string   — for navigation
//   variantLabel: string   — e.g. "Black / XS / Full Set"
//   price:        number   — the resolved price (variant.price ?? product.price)
//   imageUrl:     string
//   quantity:     number
//   stock:        number   — max allowed
// }

const STORAGE_KEY = 'jm_cart'

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const items = raw ? JSON.parse(raw) : []
        // Ensure price is a number, fallback to 0 if not
        return items.map(item => ({
            ...item,
            price: isNaN(Number(item.price)) ? 0 : Number(item.price)
        }))
    } catch {
        return []
    }
}

function save(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { }
}

// ─── Reducer ─────────────────────────────────────────────────────────────────
function cartReducer(state, action) {
    switch (action.type) {
        case 'ADD': {
            const { item } = action
            const idx = state.findIndex(i => i.variantId === item.variantId)
            if (idx >= 0) {
                // Already in cart — increase quantity, cap at stock
                return state.map((i, n) =>
                    n === idx
                        ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) }
                        : i
                )
            }
            return [...state, item]
        }
        case 'SET_QUANTITY': {
            const { variantId, quantity } = action
            if (quantity <= 0) return state.filter(i => i.variantId !== variantId)
            return state.map(i =>
                i.variantId === variantId
                    ? { ...i, quantity: Math.min(quantity, i.stock) }
                    : i
            )
        }
        case 'REMOVE':
            return state.filter(i => i.variantId !== action.variantId)
        case 'CLEAR':
            return []
        default:
            return state
    }
}

// ─── Context ─────────────────────────────────────────────────────────────────
const CartContext = createContext(null)

export function CartProvider({ children }) {
    const [items, dispatch] = useReducer(cartReducer, [], load)

    // Persist every change
    useEffect(() => { save(items) }, [items])

    const addItem = useCallback((item) => dispatch({ type: 'ADD', item }), [])
    const setQty = useCallback((variantId, quantity) => dispatch({ type: 'SET_QUANTITY', variantId, quantity }), [])
    const removeItem = useCallback((variantId) => dispatch({ type: 'REMOVE', variantId }), [])
    const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), [])

    const totalItems = items.reduce((s, i) => s + i.quantity, 0)
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const isInCart = useCallback((variantId) => items.some(i => i.variantId === variantId), [items])
    const getItem = useCallback((variantId) => items.find(i => i.variantId === variantId), [items])

    return (
        <CartContext.Provider value={{ items, addItem, setQty, removeItem, clearCart, totalItems, subtotal, isInCart, getItem }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const ctx = useContext(CartContext)
    if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
    return ctx
}
