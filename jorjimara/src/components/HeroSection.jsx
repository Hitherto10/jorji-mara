import { Images } from "./img.js";
import React, { useRef } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import Header, { HeaderDrawer, CartIcon } from "./Header.jsx";
import CartDrawer from "./cart/CartDrawer.jsx";
import SearchOverlay from './SearchOverlay.jsx'
import { Menu, Search, UserRound } from "lucide-react";

export default function HeroSection() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [showHeader, setShowHeader] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false)

    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setShowHeader(latest > 200);
    });

    const logoY = useTransform(scrollY, [0, 400], ["0vh", "-42vh"]);
    const logoScale = useTransform(scrollY, [0, 400], [1, 0.18]);

    return (
        <div className="relative h-[110vh]">
            <section className="relative h-screen w-full overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src={Images.heroimage} alt="Hero" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 z-0 bg-[#332E2C]/40" />

                <div className="z-50 absolute flex items-center justify-between w-full px-10 lg:px-40 py-4 text-white">
                    <nav className="hidden md:flex items-center space-x-8 font-[Inter]">
                        <a href="/jorjimara/public" className="hover:opacity-60 transition-opacity">Home</a>
                        <a href="/products" className="hover:opacity-60 transition-opacity">Shop</a>
                        <a href="/contact" className="hover:opacity-60 transition-opacity">Contact</a>
                    </nav>
                    <div className="flex md:hidden items-center">
                        <Menu className="w-6 h-6" onClick={() => setMenuOpen(true)} />
                    </div>
                    <nav className="flex items-center space-x-8 font-[Inter]">
                        <div className="flex items-center space-x-5">
                            <button
                                onClick={() => setSearchOpen(true)}
                                className="hover:opacity-60 transition-opacity"
                                aria-label="Open search"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                            <CartIcon onClick={() => setCartOpen(true)} className="w-6 h-6" />
                            <UserRound className="hidden md:block w-5 h-5 cursor-pointer hover:opacity-60 transition-opacity" />
                        </div>
                    </nav>
                </div>

                <motion.header
                    className="fixed top-0 left-0 w-full z-50 bg-white text-stone-900 shadow-sm"
                    initial={{ opacity: 0, y: "-100%" }}
                    animate={showHeader ? { opacity: 1, y: "0%" } : { opacity: 0, y: "-100%" }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                    <Header />
                </motion.header>

                <motion.div
                    className="absolute p-3 inset-0 flex items-center justify-center z-20 pointer-events-none"
                    style={{ y: logoY, scale: logoScale }}
                >
                    <img src={Images.white_logo} alt="Jorji Mara" className="w-full md:w-290 h-auto object-contain" />
                </motion.div>

                <div className="absolute text-white bottom-16 left-1/2 -translate-x-1/2 text-center z-20 flex flex-col items-center space-y-6 whitespace-nowrap">
                    <span className="uppercase tracking-widest text-lg font-[Inter]">New Collection</span>
                    <em className="font-[Newsreader] text-6xl text-wrap italic">Courtside Capsule</em>
                    <a href="/products" className="bg-white text-black px-10 py-3 text-sm uppercase font-[Bricolage_Grotesque] rounded-sm font-[450] hover:bg-neutral-200 transition">
                        Shop Now
                    </a>
                </div>

                <HeaderDrawer menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
                <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
                <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

            </section>
        </div>
    );
}
