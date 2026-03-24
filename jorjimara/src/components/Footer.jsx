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
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Instagram</title><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg>
);

export default function Footer() {
    const [email, setEmail] = useState("");

    const handleSubscribe = (e) => {
        e.preventDefault();
        // hook up to your email service here
        setEmail("");
    };

    return (
        <footer className="bg-white font-[Inter] text-stone-900 px-6 md:px-12 lg:px-24">

            {/* ── NEWSLETTER ── */}
            <div className=" mx-auto pt-14 pb-10">
                <p className="text-xs tracking-[0.2em] uppercase text-stone-600 mb-4">
                    Newsletter
                </p>
                <form
                    onSubmit={handleSubscribe}
                    className="flex items-center border-b border-stone-200 pb-3 w-full max-w-full overflow-hidden"
                >
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className="min-w-0 flex-1 bg-transparent text-2xl text-stone-900 placeholder:text-stone-900 outline-none font-light pr-4"
                    />
                    <button
                        type="submit"
                        className="shrink-0 text-xs tracking-[0.2em] uppercase font-semibold text-stone-900 hover:opacity-50 transition-opacity whitespace-nowrap"
                    >
                        Subscribe
                    </button>
                </form>
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

                {/* SHOP */}
                <div className="flex flex-col gap-4">
                    <p className="text-[10px] tracking-[0.18em] uppercase text-stone-400">
                        Shop
                    </p>
                    <ul className="flex flex-col gap-3">
                        {["New Arrivals", "Best Sellers", "Collections", "Sale"].map((item) => (
                            <li key={item}>

                            <a    href="#"
                                className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
                                >
                                {item}
                            </a>
                            </li>
                            ))}
                    </ul>
                </div>

                {/* CUSTOMER CARE */}
                <div className="flex flex-col gap-4">
                    <p className="text-[10px] tracking-[0.18em] uppercase text-stone-400">
                        Customer Care
                    </p>
                    <ul className="flex flex-col gap-3">
                        {["Contact", "FAQ", "Track Order", "Returns"].map((item) => (
                            <li key={item}>

                            <a    href="#"
                                className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
                                >
                                {item}
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
                        {["Shipping & Returns", "Size Chart", "Privacy Policy", "Terms of Service"].map((item) => (
                            <li key={item}>

                            <a    href="#"
                                className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
                                >
                                {item}
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
                    <a href="#" className="hover:text-stone-700 transition-colors">
                        Terms and Policies
                    </a>
                </div>

                {/* SOCIAL ICONS */}
                <div className="flex items-center gap-5 text-stone-500">
                    <a href="#" aria-label="Instagram" className="hover:text-stone-900 transition-colors">
                        <Instagram />
                    </a>
                    <a href="#" aria-label="TikTok" className="hover:text-stone-900 transition-colors">
                        <TikTokIcon />
                    </a>
                    <a href="#" aria-label="Pinterest" className="hover:text-stone-900 transition-colors">
                        <PinterestIcon />
                    </a>
                </div>
            </div>

        </footer>
    );
}