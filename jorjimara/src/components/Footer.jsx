import { useState } from "react";
import { Images } from "./img.js";

// Pinterest icon (not in lucide)
const PinterestIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
);

// TikTok icon (not in lucide)
const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
    </svg>
);

const Instagram = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
);

const customerCare = [
    {
        id: "1",
        item: "Contact",
        link: "/contact"
    },
    {
        id: "2",
        item: "Shipping & Returns",
        link: "/shipping-and-returns"
    },
    {
        id: "3",
        item: "Refund Policy",
        link: "/refund-policy"
    },

    {
        id: "4",
        item: "Size Chart",
        link: "/size-chart"
    },

]

const Information = [
    {
        id: "1",
        item: "Privacy Policy",
        link: "/privacy-policy"
    },
    {
        id: "2",
        item: "Terms and Conditions",
        link: "/terms"
    },
]


export default function Footer() {
    const [email, setEmail] = useState("");

    const handleSubscribe = (e) => {
        e.preventDefault();
        // hook up to your email service here
        setEmail("");
    };

    return (
        <footer className="bg-white font-[Inter] text-stone-900 px-6 md:px-12 lg:px-24">
            {/* ── DIVIDER ── */}
            <div className=" mx-auto ">
                <div className="border-t border-stone-200" />
            </div>

            {/* ── MAIN FOOTER GRID ── */}
            <div className=" mx-auto  py-12 grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10">

                {/* LOGO */}
                <div className="flex items-start">
                    <img
                        src={Images.main_logo}
                        alt="Flairy Logo"
                        className="h-10 w-auto object-contain"
                    />
                </div>

                {/* CUSTOMER CARE */}
                <div className="flex flex-col gap-4">
                    <p className="text-[10px] tracking-[0.18em] uppercase text-stone-400">
                        Customer Care
                    </p>
                    <ul className="flex flex-col gap-3">
                        {customerCare.map((item) => (
                            <li key={item.id}>
                                <a href={item.link}
                                    className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
                                    {item.item}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* INFORMATION */}
                <div className="flex flex-col gap-4">
                    <p className="text-[10px] tracking-[0.18em] uppercase text-stone-400">
                        Information
                    </p>
                    <ul className="flex flex-col gap-3">
                        {Information.map((item) => (
                            <li key={item.id}>
                                <a href={item.link}
                                   className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
                                    {item.item}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>

            {/* ── DIVIDER ── */}
            <div className=" mx-auto ">
                <div className="border-t border-stone-200" />
            </div>

            {/* ── BOTTOM BAR ── */}
            <div className=" mx-auto  py-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6 text-xs text-stone-400">
                    <span>© 2026 Jorji Mara</span>
                </div>

                {/* SOCIAL ICONS */}
                <div className="flex items-center gap-5 text-stone-500">
                    <a href="https://instagram.com/jorji.mara" aria-label="Instagram" className="hover:text-stone-900 transition-colors">
                        <Instagram />
                    </a>
                    <a href="https://tiktok.com/@jorji.mara" aria-label="TikTok" className="hover:text-stone-900 transition-colors">
                        <TikTokIcon />
                    </a>
                    <a href="https://pinterest.com/jorjimara" aria-label="Pinterest" className="hover:text-stone-900 transition-colors">
                        <PinterestIcon />
                    </a>
                </div>
            </div>

        </footer>
    );
}