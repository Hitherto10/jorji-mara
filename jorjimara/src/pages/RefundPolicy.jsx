import React from 'react';
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

const RefundPolicy = () => {

    return (
        <>
            <div className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm">
                <Header />
            </div>

            <div className="min-h-screen bg-[#FCFBF9] text-stone-800 font-light selection:bg-stone-200">
                <div className="max-w-3xl mx-auto px-6 py-20 md:py-32 font-[Bricolage_Grotesque]">

                    {/* Header */}
                    <header className="mb-16">
                        <h1 className="text-4xl md:text-5xl font-[Newsreader] mb-6 text-stone-900 tracking-tight">
                           Refund Policy
                        </h1>
                        <p className="text-stone-500 text-[13px] uppercase tracking-widest italic">
                            Last updated: May 21st, 2026
                        </p>
                    </header>

                    {/* Content Body */}
                    <div className="space-y-12 text-[15px] leading-relaxed tracking-wide text-stone-600">

                        <section className="space-y-4">
                            <h2 className="text-xl font-[Newsreader] text-stone-900 mb-6 italic">1. INTRODUCTION</h2>
                            <p>
                                At Jorji Mara Apparel, every piece we create is handmade with care and intentionality.
                                Because of the handmade and limited nature of our collections, all sales are final.
                                Please read this policy carefully before placing your order.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-[Newsreader] text-stone-900 mb-6 italic">2. ALL SALES ARE FINAL</h2>
                            <div className="space-y-4">
                                <p>Due to the handcrafted and limited-edition nature of our pieces, we are unable to
                                    accept returns or offer refunds once an order has been placed. This applies to all
                                    items across all product categories, regardless of size, colour, or style.</p>
                                <p>We encourage all customers to:</p>
                                <ul className="list-disc space-y-3 pl-0">
                                    <li>Read product descriptions in full before purchasing</li>
                                    <li>Review sizing guides carefully — if you are between sizes, we recommend
                                        sizing up or reaching out to us before checkout</li>
                                    <li>Examine all product images thoroughly, as they are representative of the
                                        actual item you will receive</li>
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-[Newsreader] text-stone-900 mb-6 italic">3. ORDER CANCELLATIONS</h2>
                            <p>
                                Once an order is placed and payment is confirmed, it enters production or fulfilment
                                immediately and cannot be cancelled. We are unable to make exceptions to this policy
                                as each piece is made to order or held in limited stock.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-[Newsreader] text-stone-900 mb-6 italic">4.  DAMAGED OR INCORRECT ITEMS</h2>
                            <div className="space-y-6">
                                <p>While all sales are final, we take full responsibility for our errors. If you receive
                                    an item that is:</p>

                                <ul className="list-disc space-y-3 pl-0">
                                    <li>Significantly different from what was described or shown on the website</li>
                                    <li>Damaged upon arrival due to a fault on our end</li>
                                    <li>The wrong item entirely (incorrect product sent)</li>
                                </ul>

                                <p>Please contact us within 48 hours of delivery at Jorjimara@gmail.com with:</p>

                                <ul className="list-disc space-y-3 pl-0">
                                    <li>Your order number</li>
                                    <li>A clear description of the issue</li>
                                    <li>Photos of the item and packaging received</li>
                                </ul>

                                <p>We will review each case individually and where our error is confirmed, we will work
                                    with you to find a fair resolution, which may include a replacement or store credit
                                    at our discretion.</p>

                                <p>Please note: general dissatisfaction with style, colour perception, or a change of
                                    mind does not qualify under this clause.</p>
                            </div>
                        </section>




                        <section>
                            <h2 className="text-xl font-[Newsreader] text-stone-900 mb-6 italic">5. SIZING & FIT</h2>
                            <p>
                                We strongly advise all customers to consult our sizing guide before purchasing. We
                                are not responsible for items that do not fit due to incorrect size selection.

                                If you are unsure about sizing or need additional measurements for a specific piece,
                                please contact us before completing your order — we are happy to assist.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-[Newsreader] text-stone-900 mb-6 italic">6. LOST OR DELAYED SHIPMENTS
                            </h2>
                            <p>
                                Once an order has been dispatched and a tracking number provided, responsibility for
                                delivery passes to the shipping carrier. We are not liable for delays, losses, or
                                damages caused by the carrier. However, if your order has not arrived within a
                                reasonable timeframe, please contact us and we will do our best to assist you in
                                investigating with the carrier.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-[Newsreader] text-stone-900 mb-6 italic">7. CONTACT</h2>
                            <div className="space-y-4">
                                <p>
                                    We understand that shopping online requires trust, and we want every customer to feel
                                    confident before they buy. If you have any questions about a product, sizing, materials,
                                    or anything else prior to checkout — please do not hesitate to reach out.
                                </p>
                                <ul className="list-disc space-y-3 pl-0">
                                    <li><span className="text-stone-900 font-medium">Email: </span> Jorjimara@gmail.com</li>
                                    <li><span className="text-stone-900 font-medium">Address: </span> 16 Janet Y. Duniya Street, Abuja, Nigeria.</li>

                                </ul>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
            <Footer />

        </>

    );
};

export default RefundPolicy;