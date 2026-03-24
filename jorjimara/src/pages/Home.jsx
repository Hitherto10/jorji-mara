import React, {useState, useRef} from 'react';
import {Images} from "../components/img.js";
import { newProducts} from "../components/content.js";
import CollectionsShowcase from "./CollectionsShowcase.jsx";
import HeroSection from "./HeroSection.jsx";
import {Handbag, Search, UserRound} from "lucide-react";
import Footer from "../components/Footer.jsx";
import api from "../lib/api.js";


function ProductCard({ product }) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const touchStartX = useRef(null);
    const total = product.photos.length;

    const changeImage = (dir) => {
        setCurrentIdx((prev) => (prev + dir + total) % total);
    };

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const delta = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(delta) > 40) changeImage(delta > 0 ? 1 : -1);
        touchStartX.current = null;
    };

    return (
        <div className="group flex flex-col cursor-pointer">
            {/* Image wrapper */}
            <div
                className="relative aspect-3/4 overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Sliding strip of all images */}
                <div
                    className="flex h-full transition-transform duration-300 ease-in-out"
                    style={{ width: `${total * 100}%`, transform: `translateX(-${(currentIdx / total) * 100}%)` }}
                >
                    {product.photos.map((src, i) => (
                        <div key={i} style={{ width: `${100 / total}%` }} className="h-full shrink-0">
                            <img src={src} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>

                {/* Badge */}
                {product.badge && (
                    <span className="absolute top-3 left-3 bg-stone-900 text-white text-[9px] tracking-widest uppercase font-medium px-2 py-1">
                        {product.badge}
                    </span>
                )}

                {/* Arrows + dots — desktop hover only */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={() => changeImage(-1)}
                        className="w-7 h-7 bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
                    >
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                            <polyline points="7.5,2 3.5,6 7.5,10" />
                        </svg>
                    </button>

                    <div className="flex gap-1">
                        {product.photos.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIdx(i)}
                                className={`w-1 h-1 rounded-full transition-colors duration-200 ${
                                    i === currentIdx ? "bg-white" : "bg-white/50"
                                }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => changeImage(1)}
                        className="w-7 h-7 bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
                    >
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                            <polyline points="4.5,2 8.5,6 4.5,10" />
                        </svg>
                    </button>
                </div>

                {/* Mobile-only dots */}
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 lg:hidden">
                    {product.photos.map((_, i) => (
                        <div
                            key={i}
                            className={`w-1 h-1 rounded-full transition-colors duration-200 ${
                                i === currentIdx ? "bg-white" : "bg-white/40"
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Info */}
            <div className="pt-3 pb-4 flex flex-col gap-1">
                <p className="text-sm font-normal tracking-wide text-stone-800">{product.name}</p>
                <p className="text-sm text-stone-500 font-light">{product.currency}{product.price}</p>
            </div>

            {/* Quick add */}
            <button className="mt-auto w-full border border-stone-300 py-2.5 text-[10px] tracking-widest uppercase font-medium text-stone-800 hover:bg-stone-100 transition-colors lg:opacity-0 lg:group-hover:opacity-100">
                Quick Add
            </button>
        </div>
    );
}


// await supabase.auth.signInWithOAuth({
//     provider: 'google',
//     options: {
//         redirectTo: `${window.location.origin}/`
//     }
// })


export default function Home() {


    return (
        <>
            <HeroSection />

            <section className="mx-auto font-[Bricolage_Grotesque] py-12 px-4 md:px-12 lg:px-28">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-8 gap-6">
                    <h2 className="font-serif text-3xl md:text-4xl font-light tracking-tight text-stone-900">
                        Our Latest <em className="italic font-light">Arrivals</em>
                    </h2>
                </div>

                {/* The 2x2 Mobile Grid / 4-Column Desktop Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {newProducts.map((product) => (
                        <div key={product.id} className="bg-white">
                            <ProductCard product={product}/>
                        </div>
                    ))}
                </div>
            </section>

            <div className="max-w-4xl pt-12 px-4 md:px-6 mx-auto text-center">
                <h2 className="text-xl md:text-3xl font-light leading-tight text-gray-900">
                    Discover our world of collections and style, connect with us, and explore your luxury
                    <span className="italic font-serif"> fashion happy place</span>.
                </h2>
            </div>

            <section className="font-[Bricolage_Grotesque] max-w-7xl mx-auto px-4 md:px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ">
                    <div
                        className="relative group overflow-hidden rounded-sm min-h-75 md:min-h-100 lg:min-h-125 flex items-center justify-center text-center">
                        <div className="absolute inset-0">
                            <img
                                src="https://impulse-theme-apparel.myshopify.com/cdn/shop/files/zoe-NKjIT7u5nXE-unsplash_4731e75f-58b0-4df0-ad47-2812433d6154.png?v=1697225826&width=1200"
                                alt="Limited time"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/10"></div>
                        </div>

                        <div className="relative z-10 p-6 text-white">
                            <p className="italic text-sm md:text-base mb-1">Limited time</p>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Original.</h2>
                            <a href="/collections/apparel"
                               className="inline-block bg-[#362119] text-white px-6 py-3 text-sm font-medium uppercase tracking-wider hover:bg-opacity-90 transition-colors">
                                View variations
                            </a>
                        </div>
                    </div>

                    <div
                        className="relative group overflow-hidden rounded-sm min-h-[300px] md:min-h-[400px] lg:min-h-[500px] flex items-end justify-end text-right">
                        <div className="absolute inset-0">
                            <img
                                src="https://impulse-theme-apparel.myshopify.com/cdn/shop/files/natalia-blauth-Y5NnPfnuOjA-unsplash_3b1fb8ed-c2bd-42c2-8b82-62dcf57f77b3.png?v=1697227800&width=1200"
                                alt="N&F"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/10"></div>
                        </div>

                        <div className="relative z-10 p-8 text-white">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">Now stocking<br/>J~M
                            </h2>
                            <a href="/collections/naked-and-famous"
                               className="inline-block bg-[#362119] text-white px-6 py-3 text-sm font-medium uppercase tracking-wider hover:bg-opacity-90 transition-colors">
                                Shop JorjiMara
                            </a>
                        </div>
                    </div>

                    <div
                        className="relative group overflow-hidden rounded-sm min-h-[200px] md:min-h-[280px] md:col-span-2 flex items-end justify-start text-left">
                        <div className="absolute inset-0">
                            <img
                                src={`${Images.wideImage}`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/20"></div>
                        </div>

                        <div className="relative z-10 p-8 text-white">
                            <h2 className="text-3xl md:text-4xl font-bold mb-1">Your Style. <br/> Your Happy Place
                            </h2>
                            <p className="text-sm md:text-base mb-4 opacity-90">Cozy, Comfortable, Luxury.</p>
                            <span
                                className="inline-block bg-[#362119] text-white px-6 py-3 text-sm font-medium uppercase tracking-wider hover:bg-opacity-90 transition-colors">
                            </span>
                        </div>
                    </div>

                </div>
            </section>

            <CollectionsShowcase/>

            <section
                className="font-[Bricolage_Grotesque] text-stone-900 mx-auto max-w-7xl px-6 my-16 md:my-24 font-light antialiased">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-16 lg:gap-24">

                    <div className="w-full md:w-[50%] lg:w-[45%] flex flex-col gap-6 md:gap-8">

                        <div className="mb-4 space-y-2 text-center md:text-left">
                            <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">
                                made with care
                            </p>
                            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-extralight tracking-tight leading-tight">
                                <span className={`text-[#4D0010]`}>Hi, I'm Jorji</span>
                            </h2>
                        </div>

                        <div className="relative grid grid-cols-12 items-start gap-4">
                            <div className="col-span-12 group relative aspect-[3/4] overflow-hidden bg-white shadow-xl">
                                <img
                                    src={`${Images.jorjiImage}`}
                                    alt="Hand attaching pink buttons to Jorji's crocheted cardigan"
                                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                            </div>
                        </div>
                    </div>

                    <div
                        className="w-full md:w-[50%] flex flex-col items-center md:items-start text-center md:text-left gap-8">

                        <div
                            className="space-y-6 text-base md:text-lg leading-[1.8] text-stone-700 max-w-125">

                            <p>
                                The one-woman team behind this little knit and crochet label. Every piece is handmade in small batches using mostly natural fibres with a focus on {" "}
                                <span className="font-normal text-stone-900">
                                    soft textures, easy silhouettes, and embodying the “made with love” feeling.
                                </span>
                            </p>
                            <p>
                                Think cute, feminine pieces with a dreamy twist, the kind that make you stand out without even trying.
                            </p>
                            <p>
                                Each item is crafted slowly, thoughtfully, and meant to be worn, lived in, and loved for a long time.
                            </p>

                            <p className="text-xs md:text-sm font-medium italic text-stone-600 tracking-wide mt-10">
                                Thanks so much for stopping by my store, it really means the world that you’re here.
                            </p>
                        </div>

                        <a
                            href="/collections/shop-all"
                            className="inline-block w-full text-center md:w-auto mt-8 bg-[#4D0010] text-white text-xs font-bold uppercase tracking-[0.2em] px-12 py-4 shadow-lg hover:bg-stone-800 transition-colors duration-300"
                        >
                            Shop here
                        </a>
                    </div>

                </div>
            </section>

            <Footer />
        </>
    );
}