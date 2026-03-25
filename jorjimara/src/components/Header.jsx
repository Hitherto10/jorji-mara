import React, { useState } from 'react';
import { Images } from "./img.js";
import { Handbag, Search, UserRound, X, Plus, Menu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const navItems = [
    { label: "Home", href: "#", hasChildren: false },
    { label: "Presets", href: "#", hasChildren: true },
    { label: "Shop", href: "#", hasChildren: true },
    { label: "Pages", href: "#", hasChildren: true },
    { label: "Blog", href: "#", hasChildren: false },
    { label: "Contact", href: "#", hasChildren: false },
];

const socialIcons = [
    // X (Twitter)
    <svg key="x" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>,
    // Facebook
    <svg key="fb" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>,
    // Instagram
    <svg key="ig" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>,
    // Vimeo
    <svg key="vm" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 0 0 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.48 4.807z"/>
    </svg>,
    // YouTube
    <svg key="yt" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>,
];

export const HeaderDrawer = ({menuOpen, setMenuOpen}) => {
    return (
        <>
            {/* ── MOBILE DRAWER ── */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/30"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setMenuOpen(false)}
                        />

                        {/* Drawer panel — slides in from left */}
                        <motion.div
                            className="fixed top-0 left-0 z-50 h-full w-[85vw] max-w-sm bg-white flex flex-col"
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                        >
                            {/* Drawer header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
                                <img
                                    src={Images.main_logo}
                                    alt="Flairy Logo"
                                    className="h-7 w-auto object-contain"
                                />
                                <button
                                    onClick={() => setMenuOpen(false)}
                                    aria-label="Close menu"
                                    className="hover:opacity-60 transition-opacity"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Nav items */}
                            <nav className="flex-1 overflow-y-auto px-6 py-4">
                                <ul className="divide-y divide-stone-100">
                                    {navItems.map((item) => (
                                        <li key={item.label}>

                                            <a   href={item.href}
                                                 className="flex items-center justify-between py-4 text-sm tracking-widest uppercase font-[Inter] font-medium text-stone-900 hover:opacity-60 transition-opacity"
                                            >
                                                {item.label}
                                                {item.hasChildren && <Plus className="w-4 h-4 text-stone-400" />}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>

                            {/* Bottom: Login + socials */}
                            <div className="px-6 py-6 border-t border-stone-100 flex flex-col gap-5">
                                <button className="w-full bg-stone-900 text-white py-3.5 text-sm tracking-widest uppercase font-[Inter] font-medium hover:bg-stone-700 transition-colors">
                                    Log In
                                </button>
                                <div className="flex items-center gap-5 text-stone-500">
                                    {socialIcons}
                                </div>
                            </div>

                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <>
            {/* ── DESKTOP HEADER ── */}
            <div className="z-90 grid grid-cols-3 text-black font-[Bricolage_Grotesque]  items-center px-10 lg:px-40 py-4">

                {/* LEFT NAV — hidden on mobile */}
                <nav className="hidden md:flex items-center space-x-8 ">
                    <a href="#" className="hover:opacity-60 transition-opacity">Home</a>
                    <a href="#" className="hover:opacity-60 transition-opacity">Contact</a>
                    <div className="flex items-center space-x-1 cursor-pointer hover:opacity-60 transition-opacity">
                        <span>Shop</span>
                    </div>
                </nav>

                {/* MOBILE: hamburger on the left */}
                <div className="flex md:hidden items-center">
                    <Menu onClick={() => setMenuOpen(true)} />
                </div>

                {/* CENTER LOGO */}
                <div className="flex justify-center">
                    <img
                        src={Images.main_logo}
                        alt="Flairy Logo"
                        className="h-8 w-auto object-contain"
                    />
                </div>

                {/* RIGHT NAV */}
                <nav className="flex items-center justify-end space-x-8  font-[Inter]">
                    <div className="flex items-center space-x-4 md:space-x-5">
                        <Search className="w-5 h-5 cursor-pointer hover:opacity-60 transition-opacity" />
                        <Handbag className="w-5 h-5 cursor-pointer hover:opacity-60 transition-opacity" />
                        <UserRound className="hidden md:block w-5 h-5 cursor-pointer hover:opacity-60 transition-opacity" />
                    </div>
                </nav>

            </div>

            <HeaderDrawer
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
            />

        </>
    );
}