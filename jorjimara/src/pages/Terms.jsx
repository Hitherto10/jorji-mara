import React from 'react';
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

const Terms = () => {

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
                            TERMS & CONDITIONS
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
                                These Terms and Conditions govern your use of the Jorji Mara Apparel website
                                (www.jorjimara.com) and any purchases made through it. By accessing our website
                                or placing an order, you agree to be bound by these terms in full.

                                Jorji Mara Apparel is a registered business operating as:
                                Jorji Mara Apparel
                                16 Janet Y. Duniya Street, Abuja, Nigeria

                                If you do not agree with any part of these terms, please do not use our website
                                or services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-[Newsreader] text-stone-900 mb-6 italic">2. ACCOUNTS</h2>
                            <div className="space-y-4">
                                <p>Users may create an account on our website to manage orders, track purchases, and
                                    access account-specific features. By creating an account, you agree to:</p>
                                <ul className="list-disc space-y-3 pl-0">
                                    <li>Provide accurate and complete information during registration</li>
                                    <li>Keep your login credentials secure and confidential</li>
                                    <li>Notify us immediately of any unauthorised access to your account</li>
                                    <li>Take full responsibility for all activity that occurs under your account</li>
                                </ul>
                                <p>We reserve the right to suspend or terminate accounts that violate these terms or
                                    are found to be fraudulent.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-[Newsreader] text-stone-900 mb-6 italic">3. PRODUCTS & PURCHASES</h2>
                            <div className="space-y-6">
                                <p>Jorji Mara Apparel sells physical goods (clothing and apparel items) through our
                                    website. All purchases are one-time payments — we do not offer subscription plans.</p>

                                <ul className="list-disc space-y-3 pl-0">
                                    <li>Product descriptions, sizing details, and images are provided to help you make
                                        informed decisions. Please review these carefully before placing an order.</li>
                                    <li>All prices are listed in the applicable currency at checkout and are subject to
                                        change without notice.</li>
                                    <li>We reserve the right to refuse or cancel any order at our discretion, including
                                        in cases of suspected fraud or stock unavailability.</li>
                                    <li>An order is confirmed only upon receipt of full payment.</li>
                                </ul>
                            </div>
                        </section>


                        <section className="space-y-4">
                            <h2 className="text-xl font-[Newsreader] text-stone-900 mb-6 italic">4. PROMOTIONS, CONTESTS & SWEEPSTAKES</h2>
                            <p>
                                We may from time to time offer promotions, contests, or sweepstakes. Any such
                                activity will be subject to its own specific rules communicated at the time of the
                                promotion. By participating, you agree to those rules. Jorji Mara Apparel reserves
                                the right to cancel or modify any promotion at any time.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-[Newsreader] text-stone-900 mb-6 italic">5. INTELLECTUAL PROPERTY</h2>
                            <p>
                                All content on this website — including but not limited to our logo, brand name,
                                visual designs, photography, graphics, and written content — is the exclusive
                                property of Jorji Mara Apparel and is protected by applicable intellectual property
                                laws.

                                You may not reproduce, distribute, modify, or use any of our content for commercial
                                purposes without our prior written consent.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-[Newsreader] text-stone-900 mb-6 italic">6. USER FEEDBACK & SUGGESTIONS</h2>
                            <div className="space-y-4">
                                <p>If you submit feedback, ideas, or suggestions to us, you agree that:</p>
                                <ul className="list-disc space-y-3 pl-0">
                                    <li>We may use, implement, or act on your feedback without any obligation to
                                        compensate or credit you</li>
                                    <li>Your submission does not grant you any rights over any resulting product,
                                        feature, or content</li>
                                </ul>
                                <p>We appreciate all feedback and use it to improve our products and experience.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-[Newsreader] text-stone-900 mb-6 italic">7. LIMITATION OF LIABILITY
                            </h2>
                            <p>
                                To the fullest extent permitted by law, Jorji Mara Apparel shall not be liable for
                                any indirect, incidental, or consequential damages arising from your use of our
                                website or products. Our total liability to you shall not exceed the amount paid
                                for the specific order in question.

                                We do not guarantee that our website will be available at all times or free from
                                errors, and we are not responsible for any loss caused by reliance on information
                                on this site.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-[Newsreader] text-stone-900 mb-6 italic">8. PRIVACY</h2>
                            <p>
                                We are committed to protecting your personal information. Any data collected through
                                our website — such as your name, address, and email — is used solely for order
                                processing and communication purposes. We do not sell your data to third parties.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-[Newsreader] text-stone-900 mb-6 italic">9. GOVERNING LAW
                            </h2>
                            <p>
                                These Terms and Conditions are governed by and construed in accordance with the laws
                                of the Federal Republic of Nigeria. Any disputes arising from these terms shall be
                                subject to the jurisdiction of Nigerian courts.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-[Newsreader] text-stone-900 mb-6 italic">10. CHANGES TO THESE TERMS
                            </h2>
                            <p>
                                We reserve the right to update these Terms and Conditions at any time. Changes will
                                be posted on this page with an updated date. Continued use of our website after any
                                changes constitutes your acceptance of the new terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-[Newsreader] text-stone-900 mb-6 italic">11. CONTACT</h2>
                            <div className="space-y-4">
                                <p>
                                    For any questions or concerns regarding these Terms and Conditions, please reach out:
                                </p>
                                <ul className="list-disc space-y-3 pl-0">
                                    <li><span className="text-stone-900 font-medium">Email: </span> Jorjimara@gmail.com</li>
                                    <li><span className="text-stone-900 font-medium">Address: </span> 16 Janet Y. Duniya Street, Abuja, Nigeria.</li>
                                    <li><span className="text-stone-900 font-medium">Website: </span>  https://www.jorjimara.com</li>
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

export default Terms;