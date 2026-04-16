"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import React, { useRef, useState, useEffect } from "react"
import {Images} from "./img.js";

export default function ScrollHorizontal() {
    const containerRef = useRef(null)
    const [viewWidth, setViewWidth] = useState(0)


    useEffect(() => {
        setViewWidth(window.innerWidth)
        const handleResize = () => setViewWidth(window.innerWidth)
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    })

    const contentWidth = (items.length * ITEM_WIDTH) + ((items.length - 1) * GAP)
    const xDistance = contentWidth - viewWidth + 100
    const x = useTransform(scrollYProgress, [0, 1], [0, -xDistance])

    return (
        <div id="example">
            {/* The tall container that creates the scroll length */}
            <div ref={containerRef} style={{ height: "400vh", position: "relative" }}>
                <h1 className="text-4xl md:text-5xl font-[Newsreader] tracking-tight text-center text-[#4d0011] font-light relative top-18">
                    Connect with Us ♡
                </h1>
                <div className="sticky-wrapper">
                    <motion.div className="gallery" style={{ x }}>
                        {items.map((item) => (
                            <a
                                href={item.link}
                                key={item.id}
                                target="_blank"
                                className="gallery-item-wrapper"
                            >
                                <div
                                    className="gallery-item"
                                    style={{
                                        "--item-image": `url(${item.image})`
                                    }}
                                >
                                    {/* Overlay for darkening and play button */}
                                    <div className="overlay">
                                        <div className="play-button">
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </motion.div>
                </div>
            </div>

            <StyleSheet />
        </div>
    )
}

function StyleSheet() {
    return (
        <style>{`
            .sticky-wrapper {
                position: sticky;
                top: 0;
                height: 100vh;
                width: 99vw; 
                display: flex;
                align-items: center;
                overflow: hidden;
            }

            .gallery {
                display: flex;
                gap: 30px;
                padding-left: 50px; /* Initial offset for the first image */
                will-change: transform;
            }
            .gallery-item-wrapper {
                text-decoration: none;
                flex-shrink: 0;
            }

            .gallery-item {
                flex-shrink: 0;
                width: 400px;
                height: 600px;
                border-radius: 12px;
                background-image: var(--item-image);
                background-size: cover;
                background-position: center;
                position: relative;
                overflow: hidden;
                transition: transform 0.3s ease;
            }
            
            .overlay {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.3s ease;
            }

            .gallery-item:hover .overlay {
                background: rgba(0, 0, 0, 0.4);
            }

            /* Play button styling */
            .play-button {
                width: 80px;
                height: 80px;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transform: scale(0.8);
                transition: all 0.3s ease;
            }

            .play-button svg {
                width: 40px;
                height: 40px;
                margin-left: 2px; /* Visual centering for triangle */
                color: #000;
            }

            .gallery-item:hover .play-button {
                opacity: 1;
                transform: scale(1);
            }
            
            .gallery-item:hover {
                transform: scale(1.02);
            }
        `}</style>
    )
}

const items = [
    { id: 1, link: "https://www.instagram.com/p/DPe9CifDai5/", image: Images.post_1 },
    { id: 2, link: "https://www.instagram.com/p/DRj91WujCXy/", image: Images.post_2 },
    { id: 3, link: "https://www.instagram.com/p/DP1FGeJjGGO/", image: Images.post_3 },
    { id: 4, link: "https://www.instagram.com/p/DUA5uo5jbZk/", image: Images.post_4 },
    { id: 5, link: "https://www.instagram.com/p/DThxeE1DWbY/", image: Images.post_5 },
    { id: 6, link: "https://www.instagram.com/p/DTPrjVoDd2I/", image: Images.post_6 },
]

const ITEM_WIDTH = 400
const GAP = 30