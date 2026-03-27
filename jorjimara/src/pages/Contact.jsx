import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

// ─── Social icons ─────────────────────────────────────────────────────────────
const PinterestIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
)

const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
    </svg>
)

const InstagramIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
)

// ─── Contact info items ────────────────────────────────────────────────────────
const contactDetails = [
    {
        label: 'Email us',
        value: 'jorjimara@gmail.com',
        href: 'mailto:jorjimara@gmail.com',
    },
    {
        label: 'Response time',
        value: 'Within 24 hours',
        href: null,
    },
]

const socials = [
    { label: 'Instagram', href: 'https://instagram.com', icon: <InstagramIcon /> },
    { label: 'TikTok',    href: 'https://tiktok.com',    icon: <TikTokIcon /> },
    { label: 'Pinterest', href: 'https://pinterest.com', icon: <PinterestIcon /> },
]

// ─── Animated field ───────────────────────────────────────────────────────────
function FloatingField({ id, label, type = 'text', name, required, children }) {
    const [focused, setFocused] = useState(false)
    const [filled,  setFilled]  = useState(false)

    const handleChange = (e) => setFilled(e.target.value.length > 0)
    const raised = focused || filled

    return (
        <div className="relative group">
            {children ? (
                // textarea variant
                <div className="relative">
                    <textarea
                        id={id}
                        name={name}
                        required={required}
                        rows={5}
                        onChange={handleChange}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        className="peer w-full pt-6 pb-3 px-4 bg-transparent border border-stone-200 text-stone-900 text-sm resize-none outline-none transition-colors duration-200 focus:border-stone-900 placeholder-transparent"
                        placeholder={label}
                    />
                    <label
                        htmlFor={id}
                        className={`absolute left-4 pointer-events-none transition-all duration-200 font-medium
                            ${raised
                            ? 'top-2 text-[10px] tracking-widest uppercase text-stone-400'
                            : 'top-4 text-sm text-stone-400'
                        }`}
                    >
                        {label}
                    </label>
                    <span className={`absolute bottom-0 left-0 h-px bg-stone-900 transition-all duration-300 ${focused ? 'w-full' : 'w-0'}`} />
                </div>
            ) : (
                <div className="relative">
                    <input
                        id={id}
                        name={name}
                        type={type}
                        required={required}
                        onChange={handleChange}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        className="peer w-full pt-6 pb-3 px-4 bg-transparent border border-stone-200 text-stone-900 text-sm outline-none transition-colors duration-200 focus:border-stone-900 placeholder-transparent"
                        placeholder={label}
                    />
                    <label
                        htmlFor={id}
                        className={`absolute left-4 pointer-events-none transition-all duration-200 font-medium
                            ${raised
                            ? 'top-2 text-[10px] tracking-widest uppercase text-stone-400'
                            : 'top-[50%] -translate-y-1/2 text-sm text-stone-400'
                        }`}
                    >
                        {label}
                    </label>
                    <span className={`absolute bottom-0 left-0 h-px bg-stone-900 transition-all duration-300 ${focused ? 'w-full' : 'w-0'}`} />
                </div>
            )}
        </div>
    )
}

// ─── Main Contact Page ────────────────────────────────────────────────────────
export default function Contact() {
    const [status,   setStatus]   = useState('idle') // idle | sending | success | error
    const formRef = useRef(null)

    const onSubmit = async (e) => {
        e.preventDefault()
        setStatus('sending')

        const formData = new FormData(e.target)
        formData.append('access_key', `${import.meta.env.VITE_WEB3FORMS_ACCESS_KEY}`)

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData,
            })
            const data = await response.json()

            if (data.success) {
                setStatus('success')
                e.target.reset()
                // Reset back to idle after a few seconds
                setTimeout(() => setStatus('idle'), 6000)
            } else {
                setStatus('error')
                setTimeout(() => setStatus('idle'), 4000)
            }
        } catch {
            setStatus('error')
            setTimeout(() => setStatus('idle'), 4000)
        }
    }

    const sending = status === 'sending'
    const success = status === 'success'
    const error   = status === 'error'

    return (
        <>
            <div className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm">
                <Header />
            </div>

            <main className="font-[Bricolage_Grotesque] pt-15 min-h-screen bg-white">

                {/* ── Hero banner ── */}
                <div className="relative overflow-hidden bg-[#F7F4F0] border-b border-stone-100">
                    {/* Decorative background text */}
                    <p className="pointer-events-none select-none absolute inset-0 flex items-center justify-center text-[12vw] font-serif font-extralight text-stone-200/60 whitespace-nowrap leading-none overflow-hidden">
                        Say hello
                    </p>

                    <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 md:py-28 text-center">
                        <motion.p
                            className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-medium mb-4"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            Get in touch
                        </motion.p>
                        <motion.h1
                            className="font-serif text-4xl md:text-6xl font-extralight text-stone-900 leading-tight mb-5"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.08 }}
                        >
                            We'd love to{' '}
                            <em className="italic text-[#4d0011]">hear from you</em>
                        </motion.h1>
                        <motion.p
                            className="text-stone-500 text-sm md:text-base leading-relaxed max-w-lg mx-auto"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.16 }}
                        >
                            Reach out to us about a custom order, question about sizing, or a warm message — Jorji reads every single one.
                        </motion.p>
                    </div>
                </div>

                {/* ── Two-column content ── */}
                <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-16 lg:gap-24">

                    {/* ── LEFT: info column ── */}
                    <motion.aside
                        className="flex flex-col gap-10"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.55, delay: 0.2 }}
                    >
                        {/* Contact details */}
                        <div className="flex flex-col gap-6">
                            <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-semibold">Contact details</p>
                            {contactDetails.map(item => (
                                <div key={item.label} className="flex flex-col gap-0.5">
                                    <p className="text-[10px] tracking-widest uppercase text-stone-400 font-medium">{item.label}</p>
                                    {item.href ? (
                                        <a
                                            href={item.href}
                                            className="text-sm text-stone-800 hover:text-[#4d0011] transition-colors underline-offset-2 hover:underline"
                                        >
                                            {item.value}
                                        </a>
                                    ) : (
                                        <p className="text-sm text-stone-800">{item.value}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-stone-100 w-full" />

                        {/* Socials */}
                        <div className="flex flex-col gap-4">
                            <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-semibold">Follow along</p>
                            <div className="flex flex-col gap-3">
                                {socials.map(s => (
                                    <a
                                        key={s.label}
                                        href={s.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-sm text-stone-700 hover:text-stone-900 transition-colors group"
                                    >
                                        <span className="text-stone-400 group-hover:text-[#4d0011] transition-colors">{s.icon}</span>
                                        {s.label}
                                        <span className="ml-auto text-stone-300 group-hover:text-stone-500 transition-colors text-xs">→</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-stone-100 w-full" />

                        {/* Note */}
                        <div className="bg-[#F7F4F0] px-5 py-5 ">
                            <p className="text-xs text-stone-600 leading-relaxed">
                                For <strong className="font-semibold text-stone-900">custom orders</strong>, please include your size, preferred colours, and any special requests. Jorji crafts each piece by hand and loves bringing your vision to life.
                            </p>
                        </div>
                    </motion.aside>

                    {/* ── RIGHT: form ── */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.55, delay: 0.25 }}
                    >
                        <AnimatePresence mode="wait">
                            {success ? (
                                /* ── Success state ── */
                                <motion.div
                                    key="success"
                                    className="flex flex-col items-start gap-5 py-12"
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="w-12 h-12 rounded-full bg-[#4d0011]/10 flex items-center justify-center shrink-0">
                                        <svg className="w-6 h-6 text-[#4d0011]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-serif text-2xl font-light text-stone-900 mb-1">Message sent ♡</h3>
                                        <p className="text-sm text-stone-500 leading-relaxed">
                                            Thank you so much for reaching out! Jorji will get back to you within 24 hours.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="mt-4 text-xs uppercase tracking-widest text-stone-500 hover:text-stone-900 border-b border-stone-300 hover:border-stone-700 pb-0.5 transition-colors"
                                    >
                                        Send another message
                                    </button>
                                </motion.div>
                            ) : (
                                /* ── Form ── */
                                <motion.form
                                    key="form"
                                    onSubmit={onSubmit}
                                    className="flex flex-col gap-5"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="mb-2">
                                        <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-semibold mb-1">Send a message</p>
                                        <h2 className="font-serif text-2xl md:text-3xl font-light text-stone-900">
                                            Let's <em className="italic">talk</em>
                                        </h2>
                                    </div>

                                    {/* Name + Email side by side on md+ */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <FloatingField id="name"  name="name"  label="Your name"  required />
                                        <FloatingField id="email" name="email" label="Email address" type="email" required />
                                    </div>

                                    {/* Subject */}
                                    <FloatingField id="subject" name="subject" label="Subject (e.g. Custom order, Sizing question…)" />

                                    {/* Message */}
                                    <FloatingField id="message" name="message" label="Your message" required>
                                        textarea
                                    </FloatingField>

                                    {/* Error banner */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.p
                                                className="text-xs text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                            >
                                                Something went wrong — please try again or email us directly at jorjimara@gmail.com
                                            </motion.p>
                                        )}
                                    </AnimatePresence>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className={`mt-2 w-full h-13 flex items-center justify-center gap-3 text-xs tracking-[0.2em] uppercase font-semibold transition-all duration-200
                                            ${sending
                                            ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                                            : 'bg-[#4d0011] hover:bg-[#3a000c] text-white'
                                        }`}
                                    >
                                        {sending ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                Sending…
                                            </>
                                        ) : (
                                            <>
                                                Send message
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                                </svg>
                                            </>
                                        )}
                                    </button>

                                    <p className="text-[10px] text-stone-400 text-center leading-relaxed">
                                        By submitting this form you agree to our{' '}
                                        <a href="#" className="underline hover:text-stone-700 transition-colors">privacy policy</a>.
                                        Your information will never be shared.
                                    </p>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* ── FAQ strip ── */}
                <div className="bg-[#F7F4F0] border-t border-stone-100">
                    <div className="max-w-6xl mx-auto px-4 md:px-8 py-14">
                        <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-semibold mb-8">Quick answers</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    q: 'How long does shipping take?',
                                    a: 'Standard delivery is 2-5 weeks. Express options are available at checkout.',
                                },
                                {
                                    q: 'Do you accept custom orders?',
                                    a: 'Absolutely! Send us a message with your vision and Jorji will reach out to discuss details and timelines.',
                                },
                                {
                                    q: 'What is your returns policy?',
                                    a: 'We currently do not offer returns or refunds, all sales are final! Please see our full Shipping & Refunds Policy for further details."',
                                },
                            ].map(item => (
                                <div key={item.q} className="flex flex-col gap-2">
                                    <p className="text-sm font-semibold text-stone-900 leading-snug">{item.q}</p>
                                    <p className="text-sm text-stone-500 leading-relaxed">{item.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </main>

            <Footer />
        </>
    )
}