import React, { useState, useCallback, useRef, useEffect, useMemo, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { Images } from '../components/img.js'
import { Check, ChevronRight, ChevronDown, Lock, X, ShieldCheck, Truck } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { apiPost } from '../lib/api.js';
import remitaLogo from "../assets/images/remitaLogo.png";
import { SHIPPING_COUNTRIES, NIGERIAN_STATES, getNigeriaFee } from '../hooks/useShipping.js';

// Global ref for makePayment callback
let globalOnPlaceRef = null;

// ─── Format helpers 
import { useCurrency } from '../context/CurrencyContext.jsx';

// ─── Step indicator 
const STEPS = ['Information', 'Shipping', 'Payment']

function StepBar({ current }) {
    return (
        <ol className="flex items-center gap-1 text-xs">
            {STEPS.map((step, i) => {
                const done = i < current
                const active = i === current
                return (
                    <React.Fragment key={step}>
                        <li className={`flex items-center gap-1 font-medium transition-colors ${done ? 'text-stone-500' :
                            active ? 'text-stone-900' :
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

// ─── Field components
function Field({ label, id, type = 'text', value, onChange, placeholder, required, autoComplete, error }) {
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={id} className="text-xs text-stone-500 uppercase tracking-widest font-medium">
                {label}{required && <span className="text-[#4d0011] ml-0.5">*</span>}
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
                {label}{required && <span className="text-[#4d0011] ml-0.5">*</span>}
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

// ─── Order summary ─
function OrderSummary({ items, subtotal, shippingFee, collapsed, onToggle }) {
    const { formatPrice } = useCurrency();
    return (
        <div className="lg:hidden">
            {/* Mobile toggle */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between py-4 border-b border-stone-200 text-sm font-medium text-stone-900"
            >
                <span className="flex items-center gap-2 text-[#4d0011]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                    </svg>
                    {collapsed ? 'Show order summary' : 'Hide order summary'}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
                </span>
                <span>{formatPrice(subtotal)}</span>
            </button>
            {!collapsed && (
                <div className="py-4 border-b border-stone-200">
                    <SummaryItems items={items} subtotal={subtotal} shippingFee={shippingFee} />
                </div>
            )}
        </div>
    )
}

function SummaryItems({ items, subtotal, shippingFee, discountCode, onDiscountApply }) {
    const { formatPrice } = useCurrency();
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
                        <span className="text-sm text-stone-700 font-medium shrink-0">{formatPrice(item.price * item.quantity)}</span>
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
                    <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-600">
                    <span>Shipping</span>
                    {shippingFee != null
                        ? <span className="font-medium text-stone-800">{formatPrice(shippingFee)}</span>
                        : <span className="text-stone-400 text-xs italic">calculated at next step</span>
                    }
                </div>
                <div className="flex justify-between text-base font-semibold text-stone-900 pt-2 border-t border-stone-200">
                    <span>Total</span>
                    <span>{formatPrice(subtotal + (shippingFee ?? 0))}</span>
                </div>
            </div>
            <p className="text-[10px] text-stone-400 mt-2 italic">Note: Conversions are estimates. You will be charged in NGN and your bank may apply a different exchange rate.</p>
        </div>
    )
}

// ─── Express checkout bar
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
                        <path d="M19.526 2.635v4.083h2.518c.6 0 1.096-.202 1.488-.605.403-.403.605-.882.605-1.437 0-.544-.202-1.018-.605-1.422-.392-.413-.888-.619-1.488-.619h-2.518zm0 5.52v4.736h-1.504V1.198h3.99c1.013 0 1.873.337 2.582 1.012.72.675 1.08 1.497 1.08 2.466 0 .991-.36 1.819-1.08 2.484-.697.665-1.559.996-2.583.996h-2.485v-.001zM27.194 9.088c0-.545.143-1.034.429-1.467a2.9 2.9 0 011.208-1.028 3.814 3.814 0 011.748-.388c.996 0 1.813.265 2.451.797.638.532.957 1.236.957 2.112v4.278h-1.433v-.964h-.057c-.617.793-1.437 1.189-2.46 1.189-.874 0-1.607-.26-2.198-.78-.591-.52-.886-1.17-.886-1.95l-.001-.001zm1.467-.146c0 .39.155.712.464.968.31.257.685.385 1.127.385.61 0 1.148-.229 1.615-.685.466-.457.7-.992.7-1.604-.44-.352-1.053-.528-1.84-.528-.572 0-1.048.143-1.427.428-.38.286-.639.665-.639 1.036zM39.086 9.342l-3.434 7.934H34.18l1.274-2.756-2.26-5.178h1.524l1.63 3.93h.024l1.587-3.93h1.127z" fill="white" />
                        <path d="M13.32 7.602c0-.403-.035-.79-.1-1.162H6.9v2.2h3.6a3.07 3.07 0 01-1.33 2.018v1.666h2.152c1.258-1.162 1.998-2.876 1.998-4.722z" fill="#4285F4" />
                        <path d="M6.9 14.4c1.8 0 3.312-.594 4.416-1.612l-2.153-1.666c-.596.402-1.36.637-2.263.637-1.74 0-3.213-1.176-3.74-2.757H.937v1.718A6.674 6.674 0 006.9 14.4z" fill="#34A853" />
                        <path d="M3.16 9.002A4.01 4.01 0 012.949 7.8c0-.416.073-.821.21-1.202V4.88H.937A6.665 6.665 0 000 7.8c0 1.078.261 2.1.937 3.04l2.223-1.838z" fill="#FBBC05" />
                        <path d="M6.9 3.841c.983 0 1.863.338 2.556 1.002l1.915-1.916C10.208 1.891 8.7 1.2 6.9 1.2A6.674 6.674 0 00.937 4.88L3.16 6.598C3.687 5.017 5.16 3.84 6.9 3.84z" fill="#EA4335" />
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

// ─── Step 1: Information
function StepInformation({ data, onChange, onNext }) {
    const [errors, setErrors] = useState({})

    const validate = () => {
        const e = {}
        if (!data.email) e.email = 'Email is required'
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

            <button
                onClick={handleNext}
                className="w-full h-12 bg-[#4d0011] hover:bg-[#3a000c] text-white text-sm tracking-widest uppercase font-medium transition-colors"
            >
                Continue to shipping
            </button>
        </div>
    )
}

// ─── Step 2: Shipping ─────────────────────────────────────────────────────────
// Country options built at module level (one-time sort, never re-computed)
const COUNTRY_OPTIONS = [
    { value: '', label: 'Select your country' },
    ...SHIPPING_COUNTRIES,
]
const NG_STATE_OPTIONS = [
    { value: '', label: 'Select state' },
    ...NIGERIAN_STATES,
]

function StepShipping({ contact, data, onChange, onNext, onBack, items }) {
    const { formatPrice } = useCurrency();
    const [errors, setErrors]       = useState({})
    const [calculating, setCalc]    = useState(false)
    const [calcError, setCalcError] = useState(null)

    const isNigeria = data.country === 'NG'

    // ── Nigeria: instant flat-fee based on state ─────────────────────────────
    useEffect(() => {
        if (data.country !== 'NG') return
        const fee = getNigeriaFee(data.state)
        onChange('shippingFee', fee)
    }, [data.country, data.state])

    // ── International: debounced API call when country + postcode are filled ─
    useEffect(() => {
        if (!data.country || data.country === 'NG') return
        if (!data.postcode || data.postcode.trim().length < 2) return

        const timer = setTimeout(async () => {
            setCalc(true)
            setCalcError(null)
            onChange('shippingFee', null)
            try {
                const result = await apiPost('/api/checkout/calculate-shipping', {
                    items:       items.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
                    countryCode: data.country,
                    stateRegion: data.state || '',
                    postcode:    data.postcode.trim(),
                })
                onChange('shippingFee', result.shippingFee)
            } catch {
                setCalcError('Could not calculate shipping. Please check your details and try again.')
                onChange('shippingFee', null)
            } finally {
                setCalc(false)
            }
        }, 600)
        return () => clearTimeout(timer)
    }, [data.country, data.postcode])

    const validate = () => {
        const e = {}
        if (!data.firstName) e.firstName = 'Required'
        if (!data.lastName)  e.lastName  = 'Required'
        if (!data.address)   e.address   = 'Required'
        if (!data.city)      e.city      = 'Required'
        if (!data.country)   e.country   = 'Please select a country'
        if (!data.postcode)  e.postcode  = 'Postcode / ZIP is required'
        if (!data.phone)     e.phone     = 'Required'
        if (data.shippingFee == null) {
            e.shipping = isNigeria
                ? 'Please select a state to confirm your shipping'
                : 'Shipping fee could not be calculated — check your country and postcode'
        }
        return e
    }

    const handleNext = () => {
        const e = validate()
        if (Object.keys(e).length) { setErrors(e); return }
        onNext()
    }

    // Field change helper: clears the matching error
    const f = (key, val) => {
        onChange(key, val)
        setErrors(e => ({ ...e, [key]: '' }))
    }

    // When country changes, reset dependent fields
    const handleCountryChange = (val) => {
        onChange('country',     val)
        onChange('state',       '')
        onChange('postcode',    '')
        onChange('shippingFee', null)
        setErrors({})
        setCalcError(null)
    }

    return (
        <div className="flex flex-col gap-6">

            {/* Contact recap */}
            <div className="border border-stone-200 rounded-sm divide-y divide-stone-200 text-sm">
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-stone-400 text-xs uppercase tracking-widest">Contact</span>
                    <span className="text-stone-700 flex-1 truncate mx-3">{contact.email}</span>
                    <button onClick={onBack} className="text-xs text-stone-500 underline hover:text-stone-900 shrink-0">Change</button>
                </div>
            </div>

            <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-900">Shipping address</h2>

            <div className="grid grid-cols-2 gap-3">
                <Field label="First name" id="firstName" value={data.firstName} onChange={v => f('firstName', v)} required error={errors.firstName} autoComplete="given-name" />
                <Field label="Last name"  id="lastName"  value={data.lastName}  onChange={v => f('lastName',  v)} required error={errors.lastName}  autoComplete="family-name" />
            </div>

            <Field label="Address" id="address" value={data.address} onChange={v => f('address', v)} required error={errors.address} autoComplete="street-address" />
            <Field label="Apartment, suite, etc. (optional)" id="apartment" value={data.apartment} onChange={v => onChange('apartment', v)} autoComplete="address-line2" />
            <Field label="City" id="city" value={data.city} onChange={v => f('city', v)} required error={errors.city} autoComplete="address-level2" />

            {/* Country */}
            <SelectField
                label="Country / Region"
                id="country"
                value={data.country}
                onChange={handleCountryChange}
                options={COUNTRY_OPTIONS}
                required
                error={errors.country}
            />

            {/* State / Region — dropdown for NG, free-text for everywhere else */}
            {isNigeria ? (
                <SelectField
                    label="State"
                    id="state"
                    value={data.state}
                    onChange={v => f('state', v)}
                    options={NG_STATE_OPTIONS}
                    required
                    error={errors.state}
                />
            ) : (
                <Field
                    label="State / Region"
                    id="state"
                    value={data.state}
                    onChange={v => onChange('state', v)}
                    placeholder="e.g. California, Greater London"
                    autoComplete="address-level1"
                />
            )}

            {/* Postcode / ZIP — always required */}
            <Field
                label="Postcode / ZIP"
                id="postcode"
                value={data.postcode}
                onChange={v => { onChange('postcode', v); setErrors(e => ({ ...e, postcode: '' })) }}
                placeholder=" "
                autoComplete="postal-code"
                required
                error={errors.postcode}
            />

            <Field label="Phone" id="phone" value={data.phone} onChange={v => f('phone', v)} type="tel" required error={errors.phone} autoComplete="tel" />

            {/* ── Shipping fee widget ── */}
            {data.country && (
                <div className={`rounded-sm border px-4 py-4 transition-all ${
                    calcError                                        ? 'border-red-200 bg-red-50'
                    : data.shippingFee != null                       ? 'border-emerald-200 bg-emerald-50'
                    :                                                  'border-stone-200 bg-stone-50'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-stone-400 shrink-0" />
                            <span className="text-sm font-medium text-stone-700">
                                {isNigeria ? 'Domestic Delivery' : 'DHL Express International'}
                            </span>
                        </div>

                        <div className="text-sm">
                            {calculating ? (
                                <span className="flex items-center gap-2 text-stone-400">
                                    <div className="w-3.5 h-3.5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                                    Calculating…
                                </span>
                            ) : data.shippingFee != null ? (
                                <span className="font-semibold text-emerald-700">{formatPrice(data.shippingFee)}</span>
                            ) : (
                                <span className="text-stone-400 text-xs">
                                    {isNigeria && !data.state    ? 'Select state above'
                                    : !data.postcode             ? 'Enter postcode above'
                                    :                              '—'}
                                </span>
                            )}
                        </div>
                    </div>

                    {calcError && (
                        <p className="text-xs text-red-500 mt-2">{calcError}</p>
                    )}
                    {errors.shipping && !calcError && (
                        <p className="text-xs text-red-500 mt-2">{errors.shipping}</p>
                    )}
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="px-5 h-12 text-xs text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-400 uppercase tracking-widest transition-colors"
                >
                    ← Back
                </button>
                <button
                    onClick={handleNext}
                    disabled={calculating}
                    className="flex-1 h-12 bg-[#4d0011] hover:bg-[#3a000c] disabled:bg-stone-400 text-white text-sm tracking-widest uppercase font-medium transition-colors flex items-center justify-center gap-2"
                >
                    {calculating ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Calculating shipping…</>
                    ) : 'Continue to payment'}
                </button>
            </div>
        </div>
    )
}

const PAYMENT_METHODS = [
    {
        id: 'bank_transfer',
        label: 'Bank Transfer',
        description: 'Direct Bank Transfer',
        icon: null,
    }
]

function makePayment(rrr, orderData) {
    let paymentEngine = RmPaymentEngine.init(
        {
            key: import.meta.env.VITE_REMITA_PUBLIC_KEY,
            processRrr: true,
            transactionId: Math.floor(Math.random()*1101233),
            extendedData: {
                customFields: [
                    {
                        name: "rrr",
                        value: rrr
                    }
                ]
            },
        onSuccess: async function (response) {
            console.log('Remita Payment Successful Response', response);
            const saveOrderPayload = {
                rrr: rrr,
                contact: { email: orderData.email },
                shipping: {
                    firstName: orderData.payerName.split(' ')[0],
                    lastName: orderData.payerName.split(' ').slice(1).join(' '),
                    address: orderData.shipping?.address || '',
                    apartment: orderData.shipping?.apartment || '',
                    city: orderData.shipping?.city || '',
                    state: orderData.shipping?.state || '',
                    phone: orderData.payerPhone,
                    country: orderData.shipping?.country || '',
                    shippingMethod: orderData.shipping?.country || '',
                },
                items: orderData.items,
                subtotal: orderData.subtotal,
                shippingFee: orderData.shippingFee,
                total: orderData.total
            };
            
            try {
                const saveResponse = await fetch('/api/checkout/save-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(saveOrderPayload)
                });
                
                if (!saveResponse.ok) {
                    const errorData = await saveResponse.json().catch(() => ({}));
                    console.error('Failed to save order:', errorData);
                    throw new Error('Failed to save order');
                }
                
                const savedOrder = await saveResponse.json();
                console.log('Order saved successfully:', savedOrder);
                
                // Call the onPlace callback if it exists
                if (globalOnPlaceRef) {
                    globalOnPlaceRef();
                }
            } catch (err) {
                console.error('Error in onSuccess callback:', err);
                alert('Order could not be saved. Please contact support.');
            }
        },
        onError: function (response) {
            console.log('Remita Payment Error Response', response);
        },
        onClose: function () {
            console.log("Remita payment widget closed");
        }
    });
    paymentEngine.showPaymentWidget();
}

function StepSuccess({ email, items, contact, shipping, subtotal, shippingFee, total }) {
    const { formatPrice } = useCurrency();
    const [summaryOpen, setSummaryOpen] = useState(true)
    const orderRef = `JM-${Date.now().toString(36).toUpperCase().slice(-8)}`

    const shippingAddress = [
        shipping?.address,
        shipping?.apartment,
        shipping?.city,
        shipping?.state,
    ].filter(Boolean).join(', ')

    return (
        <div className="flex flex-col items-center py-10 font-[Bricolage_Grotesque]">

            {/* ── Hero: checkmark + heading ── */}
            <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mb-5 shadow-sm">
                    <Check className="w-8 h-8 text-green-500 stroke-[2.5]" />
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-stone-900 mb-2">
                    Thank you for your order!
                </h1>
                <p className="text-sm text-stone-500 max-w-sm">
                    Your order has been received and your bank transfer is being confirmed.
                </p>
            </div>

            {/* ── Order ref chip ── */}
            <div className="flex items-center gap-3 border border-stone-200 rounded-md px-4 py-2.5 mb-4 text-sm">
                <span className="text-stone-400 text-xs uppercase tracking-widest">Order ref</span>
                <span className="font-mono font-semibold text-stone-800">{orderRef}</span>
            </div>

            {/* ── Email notice ── */}
            <div className="flex items-center gap-2 text-sm text-stone-500 mb-10">
                <svg className="w-4 h-4 shrink-0 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span>Order confirmation sent to <strong className="text-stone-700">{contact?.email}</strong></span>
            </div>

            {/* ── Order Summary ── */}
            <div className="w-full max-w-xl border border-stone-200 rounded-xl overflow-hidden mb-6">
                {/* Header */}
                <button
                    onClick={() => setSummaryOpen(v => !v)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-stone-50 transition-colors"
                >
                    <span className="font-semibold text-stone-900 text-sm">Order Summary</span>
                    <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
                </button>

                {summaryOpen && (
                    <div className="border-t border-stone-100 bg-white">
                        {/* Items */}
                        {items.map((item, i) => (
                            <div key={item.variantId ?? i} className="flex items-center gap-4 px-5 py-4 border-b border-stone-100 last:border-b-0">
                                <div className="relative shrink-0 w-14 h-16 bg-stone-100 rounded overflow-hidden border border-stone-200">
                                    {item.imageUrl && (
                                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                                    )}
                                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {item.quantity}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-stone-900 leading-snug">{item.productName}</p>
                                    {item.variantLabel && <p className="text-xs text-stone-400 mt-0.5">{item.variantLabel}</p>}
                                    <p className="text-xs text-stone-400 mt-0.5">Qty: {item.quantity}</p>
                                </div>
                                <span className="text-sm font-semibold text-stone-900 shrink-0">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                        ))}

                        {/* Totals */}
                        <div className="px-5 py-4 flex flex-col gap-2 border-t border-stone-100 bg-stone-50">
                            <div className="flex justify-between text-sm text-stone-500">
                                <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-stone-500">
                                <span>Shipping</span><span>{formatPrice(shippingFee)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200 mt-1">
                                <span>Total</span><span>{formatPrice(total)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Delivery Details ── */}
            {shippingAddress && (
                <div className="w-full max-w-xl border border-stone-200 rounded-xl overflow-hidden mb-10">
                    <div className="px-5 py-4 bg-white">
                        <h3 className="font-semibold text-stone-900 text-sm mb-3">Delivery Details</h3>
                        <div className="flex items-start gap-3 text-sm text-stone-600">
                            <Truck className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Shipping to</p>
                                <p className="font-medium text-stone-800">{shipping?.firstName} {shipping?.lastName}</p>
                                <p className="text-stone-500">{shippingAddress}</p>
                                {shipping?.phone && <p className="text-stone-500">{shipping.phone}</p>}
                            </div>
                        </div>
                        {shipping?.country && (
                            <div className="flex items-start gap-3 mt-4 text-sm text-stone-600">
                                <ShieldCheck className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Shipping method</p>
                                    <p className="font-medium text-stone-800">
                                        {shipping.country === 'NG'
                                            ? (getNigeriaFee(shipping.state) === 5000
                                                ? 'Domestic Delivery – FCT Abuja'
                                                : 'Domestic Delivery – Outside Abuja')
                                            : 'DHL Express International'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Payment note ── */}
            <div className="w-full max-w-xl bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-8 text-sm text-amber-800">
                <p className="font-semibold mb-1">⏳ Payment confirmation pending</p>
                <p className="leading-relaxed">
                    We are currently verifying your bank transfer. You will receive another email once your payment has been confirmed or if further action is required.
                </p>
            </div>

            {/* ── CTA ── */}
            <a
                href="/"
                className="bg-[#4d0011] hover:bg-[#3a000c] text-white px-10 py-3.5 text-xs uppercase tracking-widest font-medium transition-colors rounded-sm"
            >
                Return to Homepage
            </a>
        </div>
    )
}

function StepPayment({ contact, shipping, subtotal, items, onBack, onPlace }) {
    const { formatPrice } = useCurrency();
    const [selected, setSelected] = useState('bank_transfer')
    const [placing, setPlacing] = useState(false)

    const shippingPrice = shipping.shippingFee ?? 0
    const total = subtotal + shippingPrice

    const handlePlace = async () => {
        setPlacing(true);
        try {
            if (selected === 'bank_transfer') {
                // Generate a local order ref for bank transfers
                const localOrderRef = `BT-${Date.now()}`;
                
                try {
                    await apiPost('/api/checkout/confirm', {
                        rrr: localOrderRef,
                        email: contact.email,
                        full_name: `${shipping.firstName} ${shipping.lastName}`,
                        shipping: {
                            address:  shipping.address,
                            apartment: shipping.apartment,
                            city:     shipping.city,
                            state:    shipping.state,
                            postcode: shipping.postcode,
                            country:  shipping.country,
                            phone:    shipping.phone,
                            method:   shipping.country === 'NG'
                                ? (getNigeriaFee(shipping.state) === 5000
                                    ? 'Domestic Delivery (FCT – Abuja)'
                                    : 'Domestic Delivery (Outside Abuja)')
                                : 'DHL Express International',
                        },
                        items: items.map(item => ({
                            variantId: item.variantId,
                            productName: item.productName,
                            variantLabel: item.variantLabel,
                            quantity: item.quantity,
                            price: item.price,
                            imageUrl: item.imageUrl,
                        })),
                        subtotal,
                        shippingFee: shippingPrice,
                        total,
                    });
                } catch (err) {
                    console.error("Failed to confirm bank transfer order", err);
                    alert("Order could not be confirmed at this time. Please try again or contact support.");
                    setPlacing(false);
                    return;
                }

                if (onPlace) onPlace();
                setPlacing(false);
                return;
            }

            // Step 1: Initialize checkout with Remita to generate RRR
            const initResponse = await apiPost('/api/checkout/init', {
                items: items.map(item => ({
                    variantId: item.variantId,
                    quantity:  item.quantity,
                })),
                countryCode:  shipping.country,
                stateRegion:  shipping.state  || '',
                postcode:     shipping.postcode,
                email:        contact.email,
                payerName:    `${shipping.firstName} ${shipping.lastName}`,
                payerEmail:   contact.email,
                payerPhone:   shipping.phone,
                description:  `Jorji Mara Apparel Order`,
                paymentMethod: 'remita',
            });

            if (!initResponse.success || !initResponse.rrr) {
                throw new Error('Failed to generate payment reference');
            }

            // Step 2: Persist the order and send confirmation emails
            try {
                await apiPost('/api/checkout/confirm', {
                    rrr: initResponse.rrr,
                    email: contact.email,
                    full_name: `${shipping.firstName} ${shipping.lastName}`,
                    shipping: {
                        address:  shipping.address,
                        apartment: shipping.apartment,
                        city:     shipping.city,
                        state:    shipping.state,
                        postcode: shipping.postcode,
                        country:  shipping.country,
                        phone:    shipping.phone,
                        method:   shipping.country === 'NG'
                            ? (getNigeriaFee(shipping.state) === 5000
                                ? 'Domestic Delivery (FCT – Abuja)'
                                : 'Domestic Delivery (Outside Abuja)')
                            : 'DHL Express International',
                    },
                    items: items.map(item => ({
                        variantId: item.variantId,
                        productName: item.productName,
                        variantLabel: item.variantLabel,
                        quantity: item.quantity,
                        price: item.price,
                        imageUrl: item.imageUrl,
                    })),
                    subtotal,
                    shippingFee: shippingPrice,
                    total,
                });
            } catch (err) {
                console.error("Failed to confirm order", err);
            }

            // Step 3: Trigger Remita payment widget with the RRR
            makePayment(initResponse.rrr, {
                email: contact.email,
                payerName: `${shipping.firstName} ${shipping.lastName}`,
                payerPhone: shipping.phone,
                shipping: {
                    address: shipping.address,
                    apartment: shipping.apartment,
                    city: shipping.city,
                    state: shipping.state,
                },
                country: shipping.country,
                stateRegion: shipping.state,
                items: items.map(item => ({
                    variantId: item.variantId,
                    quantity: item.quantity,
                })),
                subtotal,
                shippingFee: shippingPrice,
                total,
            });

            setPlacing(false);
        } catch (err) {
            console.error("[Checkout Payment Error]", err);
            alert('Payment initialization failed. Please try again.');
            setPlacing(false);
        }
    };

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
                    <span className="text-stone-400 text-xs uppercase tracking-widest shrink-0">Ship to</span>
                    <span className="text-stone-700 flex-1">
                        {shipping.country === 'NG' ? 'Domestic Delivery' : 'DHL Express'} · {formatPrice(shippingPrice)}
                    </span>
                </div>
            </div>

            {/* Payment method selector */}
            <div className="w-full max-w-2xl">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-3">
                    Payment Method
                </h2>
 
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {PAYMENT_METHODS.map((pm) => (
                        <label
                            key={pm.id}
                            className={`group relative flex items-center justify-center h-16 px-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                                selected === pm.id
                                    ? 'border-stone-900 bg-white shadow-sm ring-1 ring-stone-900'
                                    : 'border-stone-200 bg-stone-50/30 hover:border-stone-300 hover:bg-white'
                            }`}
                        >
                            {/* Tiny Selection Dot */}
                            <div className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full transition-transform ${
                                selected === pm.id ? 'bg-stone-900 scale-100' : 'bg-transparent scale-0'
                            }`} />

                            {/* Logo Container - Constrained size */}
                            <div className="w-full h-8 flex items-center justify-center">
                                {pm.icon ? (
                                    <img
                                        src={pm.icon}
                                        alt={pm.label}
                                        className={`max-w-[80%] max-h-full object-contain transition-all duration-300 ${
                                            selected === pm.id
                                                ? 'grayscale-0 opacity-100'
                                                : 'grayscale opacity-50 group-hover:opacity-80'
                                        }`}
                                    />
                                ) : (
                                    <span className="text-sm font-medium text-stone-900">{pm.label}</span>
                                )}
                            </div>

                            <input
                                type="radio"
                                name="payment"
                                className="sr-only"
                                checked={selected === pm.id}
                                onChange={() => setSelected(pm.id)}
                            />
                        </label>
                    ))}
                </div>

                {selected === 'bank_transfer' && (
                    <div className="mt-4 p-4 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700">
                        <p className="font-medium text-stone-900 mb-2">Please make a transfer to the following account:</p>
                        <p><strong>Bank:</strong> Stanbic IBTC</p>
                        <p><strong>Account Number:</strong> 0081688464</p>
                        <p><strong>Account Name:</strong> Jorji Mara Apparel</p>
                        <p className="mt-2 text-xs text-stone-500">Click "I have paid" below after making the transfer.</p>
                    </div>
                )}
            </div>

            {/* Total */}
            <div className="bg-stone-50 border border-stone-100 px-4 py-4 flex flex-col gap-2">
                <div className="flex justify-between text-sm text-stone-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-600">
                    <span>Shipping</span>
                    <span>{formatPrice(shippingPrice)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-stone-900 pt-2 border-t border-stone-200">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
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
                    className="flex-1 h-12 bg-[#4d0011] hover:bg-[#3a000c] disabled:bg-stone-400 text-white text-sm tracking-widest uppercase font-medium transition-colors flex items-center justify-center gap-2"
                >
                    {placing ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Confirming…
                        </>
                    ) : (
                        <>
                            <Check className="w-4 h-4" />
                            I have paid {formatPrice(total)}
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

// Main Checkout  
export default function Checkout() {
    const navigate = useNavigate()
    const { items, subtotal, clearCart } = useCart()

    // ─── Buy It Now session override ───
    // Read from sessionStorage exactly once on mount via useState initializer.
    // Using a raw sessionStorage.getItem in the render body would re-run on every
    // re-render (e.g. typing in the email field), causing checkoutItems to flip to
    // empty mid-session and triggering the empty-cart redirect prematurely.
    const [buyNowItem] = useState(() => {
        try {
            const raw = sessionStorage.getItem('jm_buy_now')
            return raw ? JSON.parse(raw) : null
        } catch {
            return null
        }
    })

    const checkoutItems = buyNowItem ? [buyNowItem] : items
    const checkoutSubtotal = buyNowItem ? buyNowItem.price * buyNowItem.quantity : subtotal

    // Clean up buy now session when leaving checkout
    useEffect(() => {
        return () => {
            sessionStorage.removeItem('jm_buy_now');
        };
    }, []);

    const [step, setStep] = useState(0)
    const [summaryOpen, setSummaryOpen] = useState(false)

    // Contact form state
    const [contact, setContact] = useState({ email: '', marketing: true })

    // Shipping form state
    const [shipping, setShipping] = useState({
        firstName: '', lastName: '', address: '', apartment: '',
        city: '', country: '', state: '', postcode: '', phone: '',
        shippingFee: null,
    })

    const updateContact = (key, val) => setContact(c => ({ ...c, [key]: val }))
    const updateShipping = (key, val) => setShipping(s => ({ ...s, [key]: val }))

    // Snapshot of the order taken at the moment "I have paid" is clicked,
    // before clearCart() wipes the live cart data.
    const [orderSnapshot, setOrderSnapshot] = useState(null)

    const handlePlaced = () => {
        const fee = shipping.shippingFee ?? 0
        setOrderSnapshot({
            items: [...checkoutItems],
            subtotal: checkoutSubtotal,
            shippingFee: fee,
            total: checkoutSubtotal + fee,
        })
        setStep(3)
        if (buyNowItem) {
            sessionStorage.removeItem('jm_buy_now')
        } else {
            clearCart()
        }
    }

    // Redirect if cart is empty (and not in the "placed" success state)
    if (checkoutItems.length === 0 && step !== 3) {
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
            <header className="border-b bg-white z-50 sticky top-0 border-stone-100 px-4 md:px-8 py-4 flex items-center justify-between">
                <img
                    src={Images.main_logo}
                    alt="Jorji Mara"
                    className="h-7 w-auto object-contain hidden md:block cursor-pointer"
                    onClick={() => navigate('/')}
                />
                <StepBar current={step} />
                <div className="w-24 flex justify-end">
                    <button onClick={() => navigate('/products')} className="text-stone-400 flex hover:text-stone-700 transition-colors text-nowrap items-center gap-2">
                        <span className={`hidden md:block`}>Exit Checkout </span><X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12">

                {/* ── LEFT: Forms ── */}
                <div>
                    {/* Mobile order summary toggle */}
                    {step !== 3 && (
                        <OrderSummary
                            items={checkoutItems}
                            subtotal={checkoutSubtotal}
                            shippingFee={shipping.shippingFee}
                            collapsed={!summaryOpen}
                            onToggle={() => setSummaryOpen(v => !v)}
                        />
                    )}

                    {/* Express checkout — only show on step 0 */}
                    {/*{step === 0 && <ExpressCheckout />}*/}

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
                                    items={checkoutItems}
                                />
                            )}
                            {step === 2 && (
                                <StepPayment
                                    contact={contact}
                                    shipping={shipping}
                                    subtotal={checkoutSubtotal}
                                    items={checkoutItems}
                                    onBack={(s) => setStep(typeof s === 'number' ? s : 1)}
                                    onPlace={handlePlaced}
                                />
                            )}
                            {step === 3 && (
                                <StepSuccess
                                    email={contact.email}
                                    contact={contact}
                                    items={orderSnapshot?.items ?? []}
                                    shipping={shipping}
                                    subtotal={orderSnapshot?.subtotal ?? 0}
                                    shippingFee={orderSnapshot?.shippingFee ?? 0}
                                    total={orderSnapshot?.total ?? 0}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Footer links */}
                    <div className="mt-10 flex flex-wrap gap-4 text-xs text-stone-400">
                        <a href="/shipping-and-returns" className="hover:text-stone-700 transition-colors">Shipping & Returns</a>
                        <a href="/privacy-policy" className="hover:text-stone-700 transition-colors">Privacy policy</a>
                    </div>
                </div>

                {/* ── RIGHT: Order summary (desktop) ── */}
                {step !== 3 && (
                    <aside className="hidden lg:block border-l border-stone-100 pl-12">
                        <div className="sticky top-8">
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-6">
                                Order summary ({checkoutItems.length} {checkoutItems.length === 1 ? 'item' : 'items'})
                            </h3>
                            <SummaryItems items={checkoutItems} subtotal={checkoutSubtotal} shippingFee={shipping.shippingFee} />
                        </div>
                    </aside>
                )}
            </div>
        </div>
    )
}



