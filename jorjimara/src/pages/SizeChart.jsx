import React from 'react';
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

const SizeChart = () => {
    const sizes = ["X-Small", "Small", "Medium", "Large", "X-Large"];
    const measurements = [
        { label: "Bust", values: ["28–30", "32–34", "36–38", "40–42", "44–46"] },
        { label: "Waist", values: ["23–24", "25–26½", "28–30", "32–34", "36–38"] },
        { label: "Hips", values: ["33–34", "35–36", "38–40", "42–44", "46–48"] },
    ];
    return (
        <>
            <div className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm">
                <Header />
            </div>

            <div className="min-h-screen bg-[#FCFBF9] text-stone-800 font-light">
                <div className="max-w-4xl mx-auto px-6 py-20 md:py-32 font-[Bricolage_Grotesque]">

                    {/* Header */}
                    <header className="mb-16 text-center">
                        <h1 className="text-4xl md:text-5xl font-[Newsreader] mb-4 text-stone-900 tracking-tight">
                            Size Chart
                        </h1>
                        <p className="text-stone-500 text-sm uppercase tracking-[0.2em]">
                            Measurements in inches
                        </p>
                    </header>

                    {/* Table Container with Horizontal Scroll for Mobile */}
                    <div className="overflow-x-auto pb-4">
                        <table className="w-full border-collapse min-w-[600px]">
                            <thead>
                            <tr className="border-b border-stone-200">
                                <th className="py-6 px-4 text-left font-serif italic text-lg text-stone-400">
                                    Size
                                </th>
                                {sizes.map((size) => (
                                    <th key={size} className="py-6 px-4 text-center font-normal text-[13px] uppercase tracking-widest text-stone-900">
                                        {size}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                            {measurements.map((row) => (
                                <tr key={row.label} className="group hover:bg-stone-50/50 transition-colors">
                                    <td className="py-8 px-4 font-serif text-xl text-stone-800">
                                        {row.label}
                                    </td>
                                    {row.values.map((val, idx) => (
                                        <td key={idx} className="py-8 px-4 text-center text-stone-600 font-light tracking-wider">
                                            {val}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Note */}
                    <footer className="mt-12 border-t border-stone-200 pt-8 text-center">
                        <p className="text-stone-500 text-[13px] leading-relaxed max-w-md mx-auto italic">
                            All measurements are body measurements. If you fall between sizes or need assistance with custom sizing, please contact us before placing your order.
                        </p>
                    </footer>
                </div>
            </div>

            <Footer />

        </>

    );
};

export default SizeChart;