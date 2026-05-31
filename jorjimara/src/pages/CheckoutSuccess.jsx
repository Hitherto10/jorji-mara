import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, X, Loader, ShieldCheck } from 'lucide-react'
import { Images } from '../components/img.js'
import { useCart } from '../context/CartContext.jsx'

const BASE_URL = import.meta.env.VITE_CLDFLARE_API_URL

async function apiGet(path) {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
    return data
}

async function apiPost(path, payload) {
    const res = await fetch(`${BASE_URL}${path}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
    return data
}

// ─── Status states
const STATE = {
    VERIFYING: 'verifying',
    SUCCESS:   'success',
    FAILED:    'failed',
    CANCELLED: 'cancelled',
}

export default function CheckoutSuccess() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { clearCart } = useCart()

    const [state, setState]       = useState(STATE.VERIFYING)
    const [orderData, setOrder]   = useState(null)
    const [errorMsg, setError]    = useState('')

    // Flutterwave appends: ?status=successful&tx_ref=JM_xxx&transaction_id=12345
    const status        = searchParams.get('status')
    const txRef         = searchParams.get('tx_ref')
    const transactionId = searchParams.get('transaction_id')

    // Guard against React StrictMode dev double-invocation of useEffect,
    // which would otherwise fire two parallel /verify-flutterwave requests
    // and risk creating duplicate orders if they race past the server's
    // idempotency check.
    const verifyStartedRef = useRef(false)

    useEffect(() => {
        if (verifyStartedRef.current) return
        verifyStartedRef.current = true

        // If user lands here without Flutterwave params, redirect to checkout
        if (!txRef && !transactionId) {
            navigate('/checkout', { replace: true })
            return
        }

        if (status === 'cancelled') {
            setState(STATE.CANCELLED)
            return
        }

        if (status !== 'successful') {
            setState(STATE.FAILED)
            setError('Payment was not completed. No charge has been made to your account.')
            return
        }

        // Step 1 — Verify the payment server-side and save the order
        const params = new URLSearchParams({ status, tx_ref: txRef, transaction_id: transactionId })
        apiGet(`/api/checkout/verify-flutterwave?${params.toString()}`)
            .then(async data => {
                setOrder(data)
                setState(STATE.SUCCESS)
                clearCart()

                // Step 2 — Send confirmation emails via a dedicated route so the
                // call is visible in the network tab and is fully awaited server-side.
                // We fire this after showing success — a slow/failed email send must
                // never block the customer seeing their confirmation.
                try {
                    const emailResult = await apiPost('/api/checkout/send-order-confirmation', {
                        orderId:       data.orderId,
                        customerEmail: data.customerEmail,
                        customerName:  data.customerName,
                        payerPhone:    data.payerPhone,
                        txRef:         data.txRef,
                        flwRef:        data.flwRef,
                    })
                    console.log('[CheckoutSuccess] Confirmation emails:', emailResult)
                } catch (emailErr) {
                    // Non-fatal — order is confirmed, email delivery can be retried
                    console.warn('[CheckoutSuccess] Confirmation email request failed:', emailErr.message)
                }
            })
            .catch(err => {
                console.error('[CheckoutSuccess] Verification error:', err)
                setState(STATE.FAILED)
                setError(err.message || 'We could not verify your payment. Please contact support with your transaction reference.')
            })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const fmt = (n) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(Number(n))

    return (
        <div className="min-h-screen bg-white font-[Bricolage_Grotesque]">
            {/* Header */}
            <header className="border-b border-stone-100 px-4 md:px-8 py-4 flex items-center justify-between">
                <img
                    src={Images.main_logo}
                    alt="Jorji Mara"
                    className="h-7 w-auto object-contain cursor-pointer"
                    onClick={() => navigate('/')}
                />
            </header>

            <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center">

                {/* ── Verifying ── */}
                {state === STATE.VERIFYING && (
                    <div className="flex flex-col items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-stone-50 border-2 border-stone-200 flex items-center justify-center">
                            <Loader className="w-7 h-7 text-stone-400 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-semibold text-stone-900">Verifying your payment…</h1>
                        <p className="text-sm text-stone-500">Please wait while we confirm your transaction. Do not close this page.</p>
                    </div>
                )}

                {/* ── Success ── */}
                {state === STATE.SUCCESS && (
                    <div className="flex flex-col items-center gap-5 w-full">
                        <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center shadow-sm">
                            <Check className="w-8 h-8 text-green-500 stroke-[2.5]" />
                        </div>

                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold text-stone-900 mb-2">
                                Thank you for your order!
                            </h1>
                            <p className="text-sm text-stone-500 max-w-sm">
                                Your payment has been confirmed and your order is being processed.
                            </p>
                        </div>

                        {/* Order ref */}
                        {orderData?.orderNumber && (
                            <div className="flex items-center gap-3 border border-stone-200 rounded-md px-4 py-2.5 text-sm">
                                <span className="text-stone-400 text-xs uppercase tracking-widest">Order</span>
                                <span className="font-mono font-semibold text-stone-800">#{orderData.orderNumber}</span>
                            </div>
                        )}

                        {/* Email notice */}
                        {orderData?.customerEmail && (
                            <div className="flex items-center gap-2 text-sm text-stone-500">
                                <svg className="w-4 h-4 shrink-0 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                                <span>Confirmation sent to <strong className="text-stone-700">{orderData.customerEmail}</strong></span>
                            </div>
                        )}

                        {/* Amount paid */}
                        {orderData?.total && (
                            <div className="w-full bg-stone-50 border border-stone-100 rounded-lg px-5 py-4 flex justify-between text-sm">
                                <span className="text-stone-500">Total paid</span>
                                <span className="font-semibold text-stone-900">{fmt(orderData.total)}</span>
                            </div>
                        )}

                        {/* Tx ref */}
                        {txRef && (
                            <div className="w-full bg-stone-50 border border-stone-100 rounded-lg px-5 py-3 flex justify-between text-xs text-stone-400">
                                <span>Transaction ref</span>
                                <span className="font-mono">{txRef}</span>
                            </div>
                        )}

                        {/* Security note */}
                        <div className="flex items-center gap-2 text-xs text-stone-400 mt-1">
                            <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                            Secured by Flutterwave
                        </div>

                        <a
                            href="/"
                            className="mt-4 bg-[#4d0011] hover:bg-[#3a000c] text-white px-10 py-3.5 text-xs uppercase tracking-widest font-medium transition-colors rounded-sm"
                        >
                            Return to Homepage
                        </a>
                    </div>
                )}

                {/* ── Cancelled ── */}
                {state === STATE.CANCELLED && (
                    <div className="flex flex-col items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
                            <X className="w-8 h-8 text-amber-500" />
                        </div>
                        <h1 className="text-2xl font-semibold text-stone-900">Payment Cancelled</h1>
                        <p className="text-sm text-stone-500 max-w-sm">
                            You cancelled the payment. No charge has been made to your account.
                        </p>
                        <button
                            onClick={() => navigate('/checkout')}
                            className="bg-[#4d0011] hover:bg-[#3a000c] text-white px-10 py-3.5 text-xs uppercase tracking-widest font-medium transition-colors rounded-sm"
                        >
                            Back to Checkout
                        </button>
                    </div>
                )}

                {/* ── Failed ── */}
                {state === STATE.FAILED && (
                    <div className="flex flex-col items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
                            <X className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-semibold text-stone-900">Payment Failed</h1>
                        <p className="text-sm text-stone-500 max-w-sm leading-relaxed">
                            {errorMsg || 'Your payment could not be confirmed. Please contact support if the issue persists.'}
                        </p>
                        {txRef && (
                            <p className="text-xs text-stone-400 font-mono">Ref: {txRef}</p>
                        )}
                        <div className="flex gap-3 flex-wrap justify-center">
                            <button
                                onClick={() => navigate('/checkout')}
                                className="bg-[#4d0011] hover:bg-[#3a000c] text-white px-8 py-3.5 text-xs uppercase tracking-widest font-medium transition-colors rounded-sm"
                            >
                                Try Again
                            </button>
                            <a
                                href="/contact"
                                className="border border-stone-300 text-stone-700 hover:border-stone-600 px-8 py-3.5 text-xs uppercase tracking-widest font-medium transition-colors rounded-sm"
                            >
                                Contact Support
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
