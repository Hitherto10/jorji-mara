import React, { useState } from 'react'
import { Images } from './img.js'
import { Search, UserRound, X, Plus, Menu } from 'lucide-react'
import { Handbag } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useCart } from '../context/CartContext.jsx'
import CartDrawer from './cart/CartDrawer.jsx'
import SearchOverlay from './SearchOverlay.jsx'
import { useNavigate } from 'react-router-dom'

const navItems = [
    { label: 'Home',    href: '/',         hasChildren: false },
    { label: 'Shop',    href: '/products', hasChildren: false },
    { label: 'Contact', href: '/contact',  hasChildren: false },
]

const socialIcons = [
    <svg key="x"  viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    <svg key="fb" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    <svg key="ig" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
]

export const HeaderDrawer = ({ menuOpen, setMenuOpen }) => {
    const navigate = useNavigate()
    return (
        <AnimatePresence>
            {menuOpen && (
                <>
                    <motion.div className="fixed inset-0 z-40 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={() => setMenuOpen(false)} />
                    <motion.div className="fixed top-0 left-0 z-50 h-full w-[85vw] max-w-sm bg-white flex flex-col" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.35, ease: 'easeInOut' }}>
                        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
                            <img src={Images.main_logo} alt="Jorji Mara" className="h-7 w-auto object-contain" />
                            <button onClick={() => setMenuOpen(false)} className="hover:opacity-60 transition-opacity"><X className="w-5 h-5" /></button>
                        </div>
                        <nav className="flex-1 overflow-y-auto px-6 py-4">
                            <ul className="divide-y divide-stone-100">
                                {navItems.map(item => (
                                    <li key={item.label}>
                                        <a href={item.href} onClick={() => setMenuOpen(false)} className="flex items-center justify-between py-4 text-sm tracking-widest uppercase font-medium text-stone-900 hover:opacity-60 transition-opacity">
                                            {item.label}
                                            {item.hasChildren && <Plus className="w-4 h-4 text-stone-400" />}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                        <div className="px-6 py-6 border-t border-stone-100 flex flex-col gap-5">
                            <button className="w-full bg-stone-900 text-white py-3.5 text-sm tracking-widest uppercase font-medium hover:bg-stone-700 transition-colors">Log In</button>
                            <div className="flex items-center gap-5 text-stone-500">{socialIcons}</div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// CartIcon with badge — used in both hero nav and sticky header
export function CartIcon({ onClick, className = 'w-5 h-5' }) {
    const { totalItems } = useCart()
    return (
        <button onClick={onClick} className="relative cursor-pointer hover:opacity-60 transition-opacity">
            <Handbag className={className} />
            {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#4d0011] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {totalItems > 9 ? '9+' : totalItems}
                </span>
            )}
        </button>
    )
}

export default function Header() {
    const [menuOpen,    setMenuOpen]    = useState(false)
    const [cartOpen,    setCartOpen]    = useState(false)
    const [searchOpen,  setSearchOpen]  = useState(false)
    const navigate = useNavigate()

    return (
        <>
            <div className="z-90 grid grid-cols-3 text-black font-[Bricolage_Grotesque] items-center px-10 lg:px-40 py-4">
                {/* LEFT NAV — desktop */}
                <nav className="hidden md:flex items-center space-x-8">
                    <a href="/"         className="hover:opacity-60 transition-opacity text-sm">Home</a>
                    <a href="/products" className="hover:opacity-60 transition-opacity text-sm">Shop</a>
                    <a href="/contact"  className="hover:opacity-60 transition-opacity text-sm">Contact</a>
                </nav>

                {/* LEFT — mobile: hamburger + search */}
                <div className="flex md:hidden items-center gap-3">
                    <Menu onClick={() => setMenuOpen(true)} className="cursor-pointer" />
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="hover:opacity-60 transition-opacity"
                        aria-label="Open search"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                </div>

                {/* CENTER LOGO */}
                <div className="flex justify-center">
                    <img
                        src={Images.main_logo}
                        alt="Jorji Mara"
                        className="h-8 w-auto object-contain cursor-pointer"
                        onClick={() => navigate('/')}
                    />
                </div>

                {/* RIGHT NAV */}
                <nav className="flex items-center justify-end space-x-4 md:space-x-5">
                    {/* Desktop search */}
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="hidden md:block hover:opacity-60 transition-opacity"
                        aria-label="Open search"
                    >
                        <Search className="w-5 h-5 cursor-pointer" />
                    </button>

                    <CartIcon onClick={() => setCartOpen(true)} />
                    <UserRound className="hidden md:block w-5 h-5 cursor-pointer hover:opacity-60 transition-opacity" />
                </nav>
            </div>

            <HeaderDrawer menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

            {/* Search overlay — lives in Header so it overlays any page */}
            <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
    )
}