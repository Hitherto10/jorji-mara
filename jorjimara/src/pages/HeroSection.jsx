import {Images} from "../components/img.js";
import React, { useRef } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import Header, {HeaderDrawer} from "../components/Header.jsx";
import {Handbag, Menu, Search, UserRound,  X, Plus } from "lucide-react";

export default function HeroSection() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [showHeader, setShowHeader] = useState(false);

    // Track raw window scroll — no target, no container needed
    const { scrollY } = useScroll();

    // Show/hide header based on raw px scrolled
    useMotionValueEvent(scrollY, "change", (latest) => {
        setShowHeader(latest > 200);
    });

    // Logo: travels upward and shrinks as user scrolls
    // Input range is raw px — tune these to match your logo size
    const logoY     = useTransform(scrollY, [0, 400], ["0vh", "-42vh"]);
    const logoScale = useTransform(scrollY, [0, 400], [1, 0.18]);


    return (
        // Normal section — no sticky, no h-[200vh], scrolls like any other element
        <div className={`relative h-[110vh]`}>
            <section className="relative h-screen w-full overflow-hidden ">

                {/* BACKGROUND — completely normal, scrolls with the page */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={`${Images.heroimage}`}
                        alt="Hero"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* OVERLAY */}
                <div className="absolute inset-0 z-0 bg-[#332E2C]/40" />

                <div className="z-50 absolute flex items-center justify-between w-full px-10 lg:px-40 py-4 text-white ">

                    <nav className="hidden md:flex items-center space-x-8  font-[Inter]">
                        <a href="#" className="hover:opacity-60 transition-opacity">Home</a>
                        <a href="#" className="hover:opacity-60 transition-opacity">Contact</a>
                        <div className="flex items-center space-x-1 cursor-pointer hover:opacity-60 transition-opacity">
                            <span>Shop</span>
                        </div>
                    </nav>

                    <div className="flex md:hidden items-center">
                        <Menu className="w-6 h-6" onClick={() => setMenuOpen(true)} />
                    </div>

                    {/* RIGHT NAV */}
                    <nav className="flex items-center space-x-8  font-[Inter]">
                        <div className="hidden md:flex items-center space-x-1 cursor-pointer hover:opacity-60 transition-opacity">
                            <span>Collections</span>
                        </div>
                        <div className="flex items-center space-x-5">
                            <Search className="w-6 h-6 cursor-pointer hover:opacity-60 transition-opacity" />
                            <Handbag className="w-6 h-6 cursor-pointer hover:opacity-60 transition-opacity" />
                            <UserRound className="hidden md:block w-5 h-5 cursor-pointer hover:opacity-60 transition-opacity" />
                        </div>
                    </nav>

                </div>

                {/*HEADER*/}
                <motion.header
                    className="fixed top-0 left-0 w-full z-50 bg-white text-stone-900 shadow-sm"
                    initial={{ opacity: 0, y: "-100%" }}
                    animate={
                        showHeader
                            ? { opacity: 1, y: "0%" }
                            : { opacity: 0, y: "-100%" }
                    }
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                    <Header />
                </motion.header>

                {/*LOGO*/}
                <motion.div
                    className="absolute p-3 inset-0 flex items-center justify-center z-20 pointer-events-none"
                    style={{ y: logoY, scale: logoScale }}
                >
                    <img
                        src={`${Images.white_logo}`}
                        alt="Flairy Logo"
                        className="w-full md:w-290 h-auto object-contain"
                    />
                </motion.div>

                {/* ── BOTTOM CONTENT ── */}
                <div
                    className="absolute text-white bottom-16 left-1/2 -translate-x-1/2 text-center z-20 flex flex-col items-center space-y-6 whitespace-nowrap"
                    // style={{ y: contentY, opacity: contentOpacity }}
                >
                    <span className="uppercase tracking-widest text-lg font-[Inter]">
                      New Collection
                    </span>
                    <em className="font-[Newsreader] text-6xl text-wrap italic">
                        Courtside Capsule
                    </em>
                    <button className="bg-white text-black px-10 py-3 text-sm uppercase font-[Inter] font-[450] hover:bg-neutral-200 transition">
                        Shop Now
                    </button>
                </div>

                <HeaderDrawer
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                />

            </section>
        </div>

    );
}