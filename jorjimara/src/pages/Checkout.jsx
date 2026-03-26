import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { Images } from '../components/img.js'
import { Check, ChevronRight, ChevronDown, Lock, X, ShieldCheck, Truck } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

// ─── Format helpers ───────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(Number(n))

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = ['Information', 'Shipping', 'Payment']

function StepBar({ current }) {
    return (
        <ol className="flex items-center gap-1 text-xs">
            {STEPS.map((step, i) => {
                const done    = i < current
                const active  = i === current
                return (
                    <React.Fragment key={step}>
                        <li className={`flex items-center gap-1 font-medium transition-colors ${
                            done    ? 'text-stone-500' :
                                active  ? 'text-stone-900' :
                                    'text-stone-300'
                        }`}>
                            {done && <Check className="w-3 h-3 text-green-600" />}
                            {step}
                        </li>
                        {i < STEPS.length - 1 && (
                            <ChevronRight className="w-3 h-3 text-stone-300 shrink-0" />
                        )}
                    </React.Fragment>
                )
            })}
        </ol>
    )
}

// ─── Field components ─────────────────────────────────────────────────────────
function Field({ label, id, type = 'text', value, onChange, placeholder, required, autoComplete, error }) {
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={id} className="text-xs text-stone-500 uppercase tracking-widest font-medium">
                {label}{required && <span className="text-[#4D0010] ml-0.5">*</span>}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className={`h-11 border px-3 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-300
          ${error ? 'border-red-400 bg-red-50' : 'border-stone-300 focus:border-stone-900'}`}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    )
}

function SelectField({ label, id, value, onChange, options, required, error }) {
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={id} className="text-xs text-stone-500 uppercase tracking-widest font-medium">
                {label}{required && <span className="text-[#4D0010] ml-0.5">*</span>}
            </label>
            <div className="relative">
                <select
                    id={id}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className={`w-full h-11 border px-3 pr-8 text-sm text-stone-900 outline-none appearance-none bg-white transition-colors
            ${error ? 'border-red-400' : 'border-stone-300 focus:border-stone-900'}`}
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    )
}

// ─── Order summary ────────────────────────────────────────────────────────────
function OrderSummary({ items, subtotal, collapsed, onToggle }) {
    return (
        <div className="lg:hidden">
            {/* Mobile toggle */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between py-4 border-b border-stone-200 text-sm font-medium text-stone-900"
            >
        <span className="flex items-center gap-2 text-[#4D0010]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
          </svg>
            {collapsed ? 'Show order summary' : 'Hide order summary'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </span>
                <span>₦{fmt(subtotal)}</span>
            </button>
            {!collapsed && (
                <div className="py-4 border-b border-stone-200">
                    <SummaryItems items={items} subtotal={subtotal} />
                </div>
            )}
        </div>
    )
}

function SummaryItems({ items, subtotal, discountCode, onDiscountApply }) {
    const [code, setCode] = useState('')
    return (
        <div className="flex flex-col gap-5">
            {/* Items */}
            <ul className="flex flex-col gap-3">
                {items.map(item => (
                    <li key={item.variantId} className="flex items-start gap-3">
                        <div className="relative shrink-0 w-14 h-16 bg-stone-100 overflow-hidden border border-stone-200">
                            {item.imageUrl && (
                                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                            )}
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {item.quantity}
              </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-stone-900 font-medium leading-snug line-clamp-1">{item.productName}</p>
                            {item.variantLabel && (
                                <p className="text-xs text-stone-400 mt-0.5">{item.variantLabel}</p>
                            )}
                        </div>
                        <span className="text-sm text-stone-700 font-medium shrink-0">₦{fmt(item.price * item.quantity)}</span>
                    </li>
                ))}
            </ul>

            {/* Discount code */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="Discount code or gift card"
                    className="flex-1 h-10 border border-stone-300 px-3 text-sm outline-none focus:border-stone-900 transition-colors placeholder:text-stone-300"
                />
                <button
                    onClick={() => onDiscountApply?.(code)}
                    className="px-4 h-10 text-xs uppercase tracking-widest font-medium border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors whitespace-nowrap"
                >
                    Apply
                </button>
            </div>

            {/* Totals */}
            <div className="flex flex-col gap-2 pt-2 border-t border-stone-100">
                <div className="flex justify-between text-sm text-stone-600">
                    <span>Subtotal</span>
                    <span>₦{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-600">
          <span className="flex items-center gap-1">
            Shipping
            <span className="text-[10px] text-stone-400">(calculated at next step)</span>
          </span>
                    <span className="text-stone-400">—</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-stone-900 pt-2 border-t border-stone-200">
                    <span>Total</span>
                    <span>₦{fmt(subtotal)}</span>
                </div>
            </div>
        </div>
    )
}

// ─── Express checkout bar ──────────────────────────────────────────────────────
function ExpressCheckout() {
    return (
        <div className="mb-8">
            <p className="text-center text-xs text-stone-400 uppercase tracking-widest mb-4">Express checkout</p>
            <div className="grid grid-cols-3 gap-2">
                {/* Shop Pay */}
                <button className="h-11 bg-[#5A31F4] rounded flex items-center justify-center hover:opacity-90 transition-opacity">
                    <span className="text-white font-bold text-sm tracking-wide">shop</span>
                    <span className="text-white text-xs ml-0.5">pay</span>
                </button>
                {/* PayPal */}
                <button className="h-11 bg-[#FFC439] rounded flex items-center justify-center hover:opacity-90 transition-opacity">
                    <span className="font-bold text-[#003087] text-sm">Pay</span>
                    <span className="font-bold text-[#009CDE] text-sm">Pal</span>
                </button>
                {/* Google Pay */}
                <button className="h-11 bg-black rounded flex items-center justify-center gap-1 hover:opacity-90 transition-opacity">
                    <svg viewBox="0 0 41 17" className="h-4" fill="none">
                        <path d="M19.526 2.635v4.083h2.518c.6 0 1.096-.202 1.488-.605.403-.403.605-.882.605-1.437 0-.544-.202-1.018-.605-1.422-.392-.413-.888-.619-1.488-.619h-2.518zm0 5.52v4.736h-1.504V1.198h3.99c1.013 0 1.873.337 2.582 1.012.72.675 1.08 1.497 1.08 2.466 0 .991-.36 1.819-1.08 2.484-.697.665-1.559.996-2.583.996h-2.485v-.001zM27.194 9.088c0-.545.143-1.034.429-1.467a2.9 2.9 0 011.208-1.028 3.814 3.814 0 011.748-.388c.996 0 1.813.265 2.451.797.638.532.957 1.236.957 2.112v4.278h-1.433v-.964h-.057c-.617.793-1.437 1.189-2.46 1.189-.874 0-1.607-.26-2.198-.78-.591-.52-.886-1.17-.886-1.95l-.001-.001zm1.467-.146c0 .39.155.712.464.968.31.257.685.385 1.127.385.61 0 1.148-.229 1.615-.685.466-.457.7-.992.7-1.604-.44-.352-1.053-.528-1.84-.528-.572 0-1.048.143-1.427.428-.38.286-.639.665-.639 1.036zM39.086 9.342l-3.434 7.934H34.18l1.274-2.756-2.26-5.178h1.524l1.63 3.93h.024l1.587-3.93h1.127z" fill="white"/>
                        <path d="M13.32 7.602c0-.403-.035-.79-.1-1.162H6.9v2.2h3.6a3.07 3.07 0 01-1.33 2.018v1.666h2.152c1.258-1.162 1.998-2.876 1.998-4.722z" fill="#4285F4"/>
                        <path d="M6.9 14.4c1.8 0 3.312-.594 4.416-1.612l-2.153-1.666c-.596.402-1.36.637-2.263.637-1.74 0-3.213-1.176-3.74-2.757H.937v1.718A6.674 6.674 0 006.9 14.4z" fill="#34A853"/>
                        <path d="M3.16 9.002A4.01 4.01 0 012.949 7.8c0-.416.073-.821.21-1.202V4.88H.937A6.665 6.665 0 000 7.8c0 1.078.261 2.1.937 3.04l2.223-1.838z" fill="#FBBC05"/>
                        <path d="M6.9 3.841c.983 0 1.863.338 2.556 1.002l1.915-1.916C10.208 1.891 8.7 1.2 6.9 1.2A6.674 6.674 0 00.937 4.88L3.16 6.598C3.687 5.017 5.16 3.84 6.9 3.84z" fill="#EA4335"/>
                    </svg>
                    <span className="text-white text-sm font-medium">Pay</span>
                </button>
            </div>

            <div className="relative flex items-center my-6">
                <div className="flex-1 border-t border-stone-200" />
                <span className="mx-4 text-xs text-stone-400 uppercase tracking-widest">Or</span>
                <div className="flex-1 border-t border-stone-200" />
            </div>
        </div>
    )
}

// ─── Step 1: Information ──────────────────────────────────────────────────────
function StepInformation({ data, onChange, onNext }) {
    const [errors, setErrors] = useState({})

    const validate = () => {
        const e = {}
        if (!data.email)    e.email    = 'Email is required'
        if (!data.email?.includes('@')) e.email = 'Enter a valid email'
        return e
    }

    const handleNext = () => {
        const e = validate()
        if (Object.keys(e).length) { setErrors(e); return }
        onNext()
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-900">Contact</h2>
                <a href="#" className="text-xs text-stone-500 underline hover:text-stone-900">Sign in</a>
            </div>

            <Field
                label="Email"
                id="email"
                type="email"
                value={data.email}
                onChange={v => { onChange('email', v); setErrors(e => ({ ...e, email: '' })) }}
                placeholder="you@example.com"
                autoComplete="email"
                required
                error={errors.email}
            />

            <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                    type="checkbox"
                    checked={data.marketing}
                    onChange={e => onChange('marketing', e.target.checked)}
                    className="w-4 h-4 accent-stone-900"
                />
                <span className="text-xs text-stone-600">Email me with news and offers</span>
            </label>

            <button
                onClick={handleNext}
                className="w-full h-12 bg-[#4D0010] hover:bg-[#3a000c] text-white text-sm tracking-widest uppercase font-medium transition-colors"
            >
                Continue to shipping
            </button>
        </div>
    )
}

// ─── Step 2: Shipping ─────────────────────────────────────────────────────────
const NIGERIAN_STATES = [
    '', 'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
    'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja',
    'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
    'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
    'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
].map(s => ({ value: s, label: s || 'State / Region' }))

const SHIPPING_OPTIONS = [
    { id: 'standard', label: 'Standard Delivery', detail: '5–7 business days', price: 2500 },
    { id: 'express',  label: 'Express Delivery',  detail: '2–3 business days', price: 5000 },
]

function StepShipping({ contact, data, onChange, onNext, onBack }) {
    const [errors, setErrors]   = useState({})
    const [shipping, setShipping] = useState('standard')

    const validate = () => {
        const e = {}
        if (!data.firstName) e.firstName = 'Required'
        if (!data.lastName)  e.lastName  = 'Required'
        if (!data.address)   e.address   = 'Required'
        if (!data.city)      e.city      = 'Required'
        if (!data.state)     e.state     = 'Required'
        if (!data.phone)     e.phone     = 'Required'
        return e
    }

    const handleNext = () => {
        const e = validate()
        if (Object.keys(e).length) { setErrors(e); return }
        onChange('shippingMethod', shipping)
        onChange('shippingPrice', SHIPPING_OPTIONS.find(o => o.id === shipping)?.price ?? 0)
        onNext()
    }

    const f = (key, val) => {
        onChange(key, val)
        setErrors(e => ({ ...e, [key]: '' }))
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Contact recap */}
            <div className="border border-stone-200 rounded-sm divide-y divide-stone-200 text-sm">
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-stone-400 text-xs uppercase tracking-widest">Contact</span>
                    <span className="text-stone-700">{contact.email}</span>
                    <button onClick={onBack} className="text-xs text-stone-500 underline hover:text-stone-900 ml-4">Change</button>
                </div>
            </div>

            <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-900">Shipping address</h2>

            <div className="grid grid-cols-2 gap-3">
                <Field label="First name"  id="firstName" value={data.firstName} onChange={v => f('firstName', v)} required error={errors.firstName} autoComplete="given-name" />
                <Field label="Last name"   id="lastName"  value={data.lastName}  onChange={v => f('lastName', v)}  required error={errors.lastName}  autoComplete="family-name" />
            </div>
            <Field label="Address"       id="address"   value={data.address}   onChange={v => f('address', v)}   required error={errors.address}   autoComplete="street-address" />
            <Field label="Apartment, suite, etc. (optional)" id="apartment" value={data.apartment} onChange={v => onChange('apartment', v)} autoComplete="address-line2" />
            <div className="grid grid-cols-2 gap-3">
                <Field label="City"        id="city"      value={data.city}      onChange={v => f('city', v)}      required error={errors.city}      autoComplete="address-level2" />
                <SelectField label="State" id="state"     value={data.state}     onChange={v => f('state', v)}     required error={errors.state} options={NIGERIAN_STATES} />
            </div>
            <Field label="Phone"         id="phone"     value={data.phone}     onChange={v => f('phone', v)}     type="tel" required error={errors.phone} autoComplete="tel" />

            {/* Shipping method */}
            <div>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-900 mb-3">Shipping method</h2>
                <div className="flex flex-col gap-2">
                    {SHIPPING_OPTIONS.map(opt => (
                        <label
                            key={opt.id}
                            className={`flex items-center justify-between px-4 py-3 border cursor-pointer transition-colors ${
                                shipping === opt.id ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-400'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                    shipping === opt.id ? 'border-stone-900' : 'border-stone-300'
                                }`}>
                                    {shipping === opt.id && <div className="w-2 h-2 rounded-full bg-stone-900" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-stone-900">{opt.label}</p>
                                    <p className="text-xs text-stone-400">{opt.detail}</p>
                                </div>
                            </div>
                            <span className="text-sm font-medium text-stone-900">₦{fmt(opt.price)}</span>
                            <input type="radio" name="shipping" value={opt.id} checked={shipping === opt.id} onChange={() => setShipping(opt.id)} className="sr-only" />
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex gap-3">
                <button onClick={onBack} className="px-5 h-12 text-xs text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-400 uppercase tracking-widest transition-colors">
                    ← Back
                </button>
                <button onClick={handleNext} className="flex-1 h-12 bg-[#4D0010] hover:bg-[#3a000c] text-white text-sm tracking-widest uppercase font-medium transition-colors">
                    Continue to payment
                </button>
            </div>
        </div>
    )
}

// ─── Step 3: Payment ──────────────────────────────────────────────────────────
// Payment providers are mock/placeholder UI only — no real integration.
const PAYMENT_METHODS = [
    {
        id: 'paystack',
        label: 'Paystack',
        description: 'Pay with your debit/credit card via Paystack',
        icon: (
            <div className="w-8 h-8 rounded bg-[#00c3f7] flex items-center justify-center">
                <span className="text-white font-black text-xs">P</span>
            </div>
        ),
    },
    {
        id: 'flutterwave',
        label: 'Flutterwave',
        description: 'Cards, bank transfer, and mobile money',
        icon: (
            <div className="w-8 h-8 rounded bg-[#f5a623] flex items-center justify-center">
                <span className="text-white font-black text-xs">F</span>
            </div>
        ),
    },
    {
        id: 'bank',
        label: 'Bank Transfer',
        description: 'Transfer directly to our bank account',
        icon: (
            <div className="w-8 h-8 rounded bg-stone-800 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
            </div>
        ),
    },
]

function StepPayment({ contact, shipping, subtotal, onBack, onPlace }) {
    const [selected, setSelected] = useState('paystack')
    const [placing,  setPlacing]  = useState(false)
    const [placed,   setPlaced]   = useState(false)

    const shippingPrice = shipping.shippingPrice ?? 0
    const total         = subtotal + shippingPrice

    const handlePlace = async () => {
        setPlacing(true)
        // Simulate async order placement
        await new Promise(r => setTimeout(r, 1400))
        setPlacing(false)
        setPlaced(true)
        onPlace?.()
    }

    if (placed) {
        return (
            <div className="flex flex-col items-center gap-5 py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-7 h-7 text-green-600" />
                </div>
                <div>
                    <h2 className="text-xl font-serif font-light text-stone-900 mb-1">Order placed!</h2>
                    <p className="text-sm text-stone-500">
                        A confirmation will be sent to <strong className="text-stone-700">{contact.email}</strong>
                    </p>
                </div>
                <a href="/products" className="mt-4 bg-[#4D0010] text-white px-8 py-3 text-xs uppercase tracking-widest font-medium hover:bg-[#3a000c] transition-colors">
                    Continue shopping
                </a>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Contact + Shipping recap */}
            <div className="border border-stone-200 rounded-sm divide-y divide-stone-200 text-sm">
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                    <span className="text-stone-400 text-xs uppercase tracking-widest shrink-0">Contact</span>
                    <span className="text-stone-700 flex-1 truncate">{contact.email}</span>
                    <button onClick={() => onBack(0)} className="text-xs text-stone-500 underline hover:text-stone-900 shrink-0">Change</button>
                </div>
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                    <span className="text-stone-400 text-xs uppercase tracking-widest shrink-0">Ship to</span>
                    <span className="text-stone-700 flex-1 truncate">
            {[shipping.address, shipping.city, shipping.state].filter(Boolean).join(', ')}
          </span>
                    <button onClick={() => onBack(1)} className="text-xs text-stone-500 underline hover:text-stone-900 shrink-0">Change</button>
                </div>
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                    <span className="text-stone-400 text-xs uppercase tracking-widest shrink-0">Method</span>
                    <span className="text-stone-700 flex-1">
            {shipping.shippingMethod === 'express' ? 'Express Delivery' : 'Standard Delivery'} · ₦{fmt(shippingPrice)}
          </span>
                </div>
            </div>

            {/* Payment method selector */}
            <div>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-900 mb-3">Payment method</h2>
                <div className="flex flex-col gap-2">
                    {PAYMENT_METHODS.map(pm => (
                        <label
                            key={pm.id}
                            className={`flex items-center gap-4 px-4 py-3 border cursor-pointer transition-colors ${
                                selected === pm.id ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-400'
                            }`}
                        >
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                selected === pm.id ? 'border-stone-900' : 'border-stone-300'
                            }`}>
                                {selected === pm.id && <div className="w-2 h-2 rounded-full bg-stone-900" />}
                            </div>
                            {pm.icon}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-stone-900">{pm.label}</p>
                                <p className="text-xs text-stone-400">{pm.description}</p>
                            </div>
                            <input type="radio" name="payment" value={pm.id} checked={selected === pm.id} onChange={() => setSelected(pm.id)} className="sr-only" />
                        </label>
                    ))}
                </div>
            </div>

            {/* Total */}
            <div className="bg-stone-50 border border-stone-100 px-4 py-4 flex flex-col gap-2">
                <div className="flex justify-between text-sm text-stone-600">
                    <span>Subtotal</span>
                    <span>₦{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-600">
                    <span>Shipping</span>
                    <span>₦{fmt(shippingPrice)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-stone-900 pt-2 border-t border-stone-200">
                    <span>Total</span>
                    <span>₦{fmt(total)}</span>
                </div>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 text-xs text-stone-400">
                <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                Your payment information is encrypted and secure
            </div>

            <div className="flex gap-3">
                <button onClick={() => onBack(1)} className="px-5 h-12 text-xs text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-400 uppercase tracking-widest transition-colors">
                    ← Back
                </button>
                <button
                    onClick={handlePlace}
                    disabled={placing}
                    className="flex-1 h-12 bg-[#4D0010] hover:bg-[#3a000c] disabled:bg-stone-400 text-white text-sm tracking-widest uppercase font-medium transition-colors flex items-center justify-center gap-2"
                >
                    {placing ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Processing…
                        </>
                    ) : (
                        <>
                            <Lock className="w-4 h-4" />
                            Pay ₦{fmt(total)}
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

// ─── Main Checkout ────────────────────────────────────────────────────────────
export default function Checkout() {
    const navigate = useNavigate()
    const { items, subtotal, clearCart } = useCart()

    const [step, setStep] = useState(0)
    const [summaryOpen, setSummaryOpen] = useState(false)

    // Contact form state
    const [contact, setContact] = useState({ email: '', marketing: true })

    // Shipping form state
    const [shipping, setShipping] = useState({
        firstName: '', lastName: '', address: '', apartment: '',
        city: '', state: '', phone: '',
        shippingMethod: 'standard', shippingPrice: 2500,
    })

    const updateContact  = (key, val) => setContact(c => ({ ...c, [key]: val }))
    const updateShipping = (key, val) => setShipping(s => ({ ...s, [key]: val }))

    const handlePlaced = () => {
        clearCart()
        // Stay on the success screen — user can navigate away
    }

    // Redirect if cart is empty (and not in the "placed" success state)
    if (items.length === 0 && step < 3) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-5 font-[Bricolage_Grotesque] text-stone-500">
                <svg className="w-12 h-12 text-stone-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                </svg>
                <p className="text-sm">Your cart is empty.</p>
                <button onClick={() => navigate('/products')} className="text-xs uppercase tracking-widest underline text-stone-700 hover:text-stone-900">
                    Browse products
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white font-[Bricolage_Grotesque]">
            {/* ── Header ── */}
            <header className="border-b border-stone-100 px-4 md:px-8 py-4 flex items-center justify-between">
                <img
                    src={Images.main_logo}
                    alt="Jorji Mara"
                    className="h-7 w-auto object-contain cursor-pointer"
                    onClick={() => navigate('/')}
                />
                <StepBar current={step} />
                <div className="w-24 flex justify-end">
                    <button onClick={() => navigate('/products')} className="text-stone-400 hover:text-stone-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12">

                {/* ── LEFT: Forms ── */}
                <div>
                    {/* Mobile order summary toggle */}
                    <OrderSummary
                        items={items}
                        subtotal={subtotal}
                        collapsed={!summaryOpen}
                        onToggle={() => setSummaryOpen(v => !v)}
                    />

                    {/* Express checkout — only show on step 0 */}
                    {step === 0 && <ExpressCheckout />}

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                        >
                            {step === 0 && (
                                <StepInformation
                                    data={contact}
                                    onChange={updateContact}
                                    onNext={() => setStep(1)}
                                />
                            )}
                            {step === 1 && (
                                <StepShipping
                                    contact={contact}
                                    data={shipping}
                                    onChange={updateShipping}
                                    onNext={() => setStep(2)}
                                    onBack={() => setStep(0)}
                                />
                            )}
                            {step === 2 && (
                                <StepPayment
                                    contact={contact}
                                    shipping={shipping}
                                    subtotal={subtotal}
                                    onBack={(s) => setStep(typeof s === 'number' ? s : 1)}
                                    onPlace={handlePlaced}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Footer links */}
                    <div className="mt-10 flex flex-wrap gap-4 text-xs text-stone-400">
                        <a href="#" className="hover:text-stone-700 transition-colors">Refund policy</a>
                        <a href="#" className="hover:text-stone-700 transition-colors">Shipping policy</a>
                        <a href="#" className="hover:text-stone-700 transition-colors">Privacy policy</a>
                        <a href="#" className="hover:text-stone-700 transition-colors">Terms of service</a>
                    </div>
                </div>

                {/* ── RIGHT: Order summary (desktop) ── */}
                <aside className="hidden lg:block border-l border-stone-100 pl-12">
                    <div className="sticky top-8">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-6">
                            Order summary ({items.length} {items.length === 1 ? 'item' : 'items'})
                        </h3>
                        <SummaryItems items={items} subtotal={subtotal} />

                        {/* Trust badges */}
                        <div className="mt-6 pt-6 border-t border-stone-100 flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-xs text-stone-500">
                                <Lock className="w-4 h-4 text-stone-400 shrink-0" />
                                Secure checkout — 128-bit SSL encryption
                            </div>
                            <div className="flex items-center gap-2 text-xs text-stone-500">
                                <Truck className="w-4 h-4 text-stone-400 shrink-0" />
                                Free shipping on orders over ₦50,000
                            </div>
                            <div className="flex items-center gap-2 text-xs text-stone-500">
                                <ShieldCheck className="w-4 h-4 text-stone-400 shrink-0" />
                                Easy returns within 14 days
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}