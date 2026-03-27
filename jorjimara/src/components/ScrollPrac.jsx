"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import React, { useRef, useState, useEffect } from "react"

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
            <div ref={containerRef}  style={{ height: "400vh", position: "relative" }}>
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
    { id: 1, link: "https://www.instagram.com/reel/DUA5uo5jbZk/", image: "https://scontent.cdninstagram.com/v/t51.71878-15/621667615_1789965141685706_2893581126804685367_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=106&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=bYUSf_s6W9QQ7kNvwF0Nc_3&_nc_oc=Ado68zbqVaFJy0QUVERv0x8TCZ4X1itJMyP9ITzuuyJ9r47rc7U3SAN1UGMrPWX79cc&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&edm=ANo9K5cEAAAA&_nc_gid=E_MJlJ4yW3Kilq8lityk5w&_nc_tpa=Q5bMBQHCwG2neXDyomBsyHzwFkGfelTelYU5vN4r7Xx2aXytsYn8noWTXGeQS1aejR7xwxfjMSDsc3kh&oh=00_AfyX3f2MJbJzOisoRVV5CEYwLmAlzNzg4zAEB52-UEg3wg&oe=69CCDDD6" },
    { id: 2, link: "https://www.instagram.com/reel/DThxeE1DWbY/", image: "https://scontent.cdninstagram.com/v/t51.71878-15/616050366_1224850296377786_5292688716504892423_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=108&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=iFOtecPlPEsQ7kNvwEt5bnn&_nc_oc=AdoY-UhqX9AMM23X0GYIJf7C0z21dzKFuDHJFRhP2puhlOkwNOiQsGDaMy6eF97Pvww&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&edm=ANo9K5cEAAAA&_nc_gid=E_MJlJ4yW3Kilq8lityk5w&_nc_tpa=Q5bMBQF8gfehMm4NfKOdQkkbN8BQLphskDNtE0Ef5KVGebFROA6cQaPb7EasD1AFx8iahMwYu8rZBKz-&oh=00_AfzAAWw_eIAhM2tqSNhRHDTwdZsGUgpOGZVcbh4WvFzbaw&oe=69CCEF7A" },
    { id: 3, link: "https://www.instagram.com/reel/DTaLs9hDakz/", image: "https://scontent.cdninstagram.com/v/t51.82787-15/615277600_17877977922460132_5254909418748309283_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=108&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=QaFJFr7oaVsQ7kNvwHm66wx&_nc_oc=AdoerpkmWj6RWhG_h2PWzDPAWGmwetIZI43PFbB6sAPk8VNXufste_FB4kyqdpo2jDg&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&edm=ANo9K5cEAAAA&_nc_gid=E_MJlJ4yW3Kilq8lityk5w&_nc_tpa=Q5bMBQHSdsA9vOyG-BIcf-JZ8EQhKTdUoZ8KgBq0v_G5TEBoWONofPJBxWsW29C0NyAXE5J0gcUtOQrT&oh=00_AfxLjnmfPvLEXxOEytasHfQdpciOydJRKYY8hCMyBc-eCg&oe=69CCD044" },
    { id: 4, link: "https://www.instagram.com/reel/DTU9RPXDeGc/", image: "https://scontent.cdninstagram.com/v/t51.71878-15/610966093_4278858359066833_3185757787636876270_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=100&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=x5sksXjMNoAQ7kNvwGGi_Nl&_nc_oc=AdocM4xKlZICJ0pyabNC46CK1KNsmiSg3QiZffVg_lHoyVH-iat2Pe55jMVj5GWxY3M&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&edm=ANo9K5cEAAAA&_nc_gid=E_MJlJ4yW3Kilq8lityk5w&_nc_tpa=Q5bMBQETssFcK9n--o0HmYmS8ryscxkBC2I07GkaKNmO3Y1DRwqq24nqDanCQ3W_jGE4brgdA_uuuwbe&oh=00_AfySExoTrybpZUyLij9ocoyf1STJD72l8kK90q9qX1B1Yw&oe=69CCCBE7" },
    { id: 5, link: "https://www.instagram.com/reel/DTPrjVoDd2I/", image: "https://scontent.cdninstagram.com/v/t51.71878-15/612975580_1417752833192199_8820518838476961265_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=103&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=INfrf3hO4d0Q7kNvwGKmbAG&_nc_oc=Adp8P2-40oi5tWdE_lOH06olG5sn6vf_MbmA71-K5GzVFL2UHae71XM9_xzPyMjfZWQ&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&edm=ANo9K5cEAAAA&_nc_gid=E_MJlJ4yW3Kilq8lityk5w&_nc_tpa=Q5bMBQFHljV7WmZD5mRsu4MftFjJgqxxNgmABjG6CeMVDD3io-mKZ0e-tT-fc80MaepREyXLEi86cg5B&oh=00_Afwp37OH7L_eFR03Szu7JaLZQ9Jiguzq018C4ziUGNfXsw&oe=69CCD464" },
    { id: 6, link: "https://www.instagram.com/reel/DRj91WujCXy/", image: "https://scontent.cdninstagram.com/v/t51.71878-15/591169844_916354081560539_4835273940907477007_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=108&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=7qeFmv7pAZEQ7kNvwFZVfQz&_nc_oc=AdppdOMHotEvpZShtDEWl5WgxhuHIRkipTC9cAy1V62XEsPq47-NFm2mWVoWkJa81t0&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&edm=ANo9K5cEAAAA&_nc_gid=F6K8Wq8qp_yIdAr1JHlORg&_nc_tpa=Q5bMBQFd6Xu_-rihc186tjK7fQ7hi-sGJC07lttvU0Mcrc-i6yNVRwrSj7vGow3n6RA3xaAcwhB-UVpA&oh=00_Afzzj82FV7tgk4ZrTkoSJfEnEYZ-Xk_fR5YKeP90DHDRsA&oe=69CCC823" },
]

const ITEM_WIDTH = 400
const GAP = 30