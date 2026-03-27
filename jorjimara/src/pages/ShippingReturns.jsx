import React from 'react';
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

const ShippingAndReturns = () => {
    return (
        <>
            <div className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm">
                <Header />
            </div>

            <div className="min-h-screen bg-[#FCFBF9] text-stone-800 font-light selection:bg-stone-200">
                {/* Container with a narrow max-width to match the site's readability */}
                <div className="max-w-3xl mx-auto px-6 py-20 md:py-32">

                    {/* Section: Shipping & Returns Heading */}
                    <section className="mb-20 font-[Bricolage_Grotesque]">
                        <h1 className="text-4xl md:text-5xl font-[Newsreader] mb-12 text-stone-900 tracking-tight">
                            Shipping & Returns
                        </h1>

                        <div className="space-y-6 text-[15px] leading-relaxed tracking-wide text-stone-600">
                            <p>
                                As all our items are handmade, please allow 3-4 weeks for your item to be processed and sent out.
                            </p>
                            <p>
                                Once your order has shipped, you will receive an email with further information. Delivery times vary depending on your location.
                            </p>
                            <p>
                                Your order may be subject to import duties and taxes (including VAT), which are incurred once a shipment reaches your destination country. Jorji Mara is not responsible for these charges if they are applied and are your responsibility as the customer.
                            </p>
                            <p>
                                We take great care in processing and shipping your orders; however, once an item has been handed over to the courier, it is in their care. Jorji Mara is not responsible for any lost, delayed, or damaged packages. Please contact the shipping provider directly for claims regarding delivery issues. We’ll always do our best to support you in tracking your order and pointing you in the right direction if an issue arises.
                            </p>
                        </div>
                    </section>

                    {/* Section: Returns & Refunds */}
                    <section className={`font-[Bricolage_Grotesque]`}>
                        <h2 className="text-4xl md:text-5xl font-[Newsreader] mb-12 text-stone-900 tracking-tight ">
                            Returns & Refunds
                        </h2>

                        <div className="space-y-6 text-[15px] leading-relaxed tracking-wide text-stone-600">
                            <p>
                                Due to the handmade and limited nature of our pieces, we are unable to accept returns or offer refunds once an order has been placed. Please review product details and sizing carefully before purchasing. If you have any questions prior to checkout, we’re more than happy to help.
                            </p>
                        </div>
                    </section>

                </div>
            </div>

            <Footer />

        </>

    );
};

export default ShippingAndReturns;