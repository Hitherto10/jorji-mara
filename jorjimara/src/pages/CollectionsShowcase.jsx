import {useState} from "react";
import {Images} from "../components/img.js";
import {supabase} from "../lib/supabase.js";

const collectionManifest = {
    "hair-accessories": {
        number: "01.",
        heading: "The Essential",
        headingEm: "Final Touch",
    },
    "cardigans": {
        number: "02.",
        heading: "Layered in",
        headingEm: "Softness",
    },
    "matching-sets": {
        number: "03.",
        heading: "Effortless",
        headingEm: "Coordinates",
    },
    "hats": {
        number: "04.",
        heading: "Sun-Kissed",
        headingEm: "Protection",
    }
};

async function getBrandedCollections() {
    try {
        const { data: dbCategories, error } = await supabase
            .from('categories') // Assuming your table is named categories
            .select('*')
            .in('slug', Object.keys(collectionManifest)) // Only fetch what's in our manifest
            .eq('is_active', true);

        if (error) throw error;

        // Map and Format the data
        return dbCategories
            .map((cat) => {
                const meta = collectionManifest[cat.slug];

                return {
                    id: cat.id,
                    number: meta.number,
                    title: cat.name,
                    heading: meta.heading,
                    headingEm: meta.headingEm,
                    description: cat.description,
                    image: cat.image_url,
                    href: `/collections/${cat.slug}`,
                };
            })

            .sort((a, b) => a.number.localeCompare(b.number));

    } catch (err) {
        console.error("Error fetching collections:", err.message);
        return [];
    }
}

const collections = await getBrandedCollections();


export default function CollectionsShowcase() {
    const [activeIdx, setActiveIdx] = useState(0);
    const active = collections[activeIdx];

    return (
        <section className="bg-stone-100 py-16 mt-12  px-4 md:px-12 lg:px-24 font-[Bricolage_Grotesque]">

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 items-center">

                    {/* Nav */}
                    <nav className="flex flex-col gap-2">
                        <p className="text-xs tracking-widest uppercase text-stone-400 font-medium mb-4">
                            Our Collections
                        </p>
                        <ul className="list-none flex flex-col m-0 p-0">
                            {collections.map((col, i) => (
                                <li key={col.id}>
                                    <button
                                        onClick={() => setActiveIdx(i)}
                                        className={`group w-full flex items-baseline gap-3 py-4 border-b text-left transition-colors duration-200 ${
                                            i === activeIdx
                                                ? "border-stone-900"
                                                : "border-stone-200 hover:border-stone-400"
                                        }`}
                                    >
                                        <span
                                            className={`text-xs font-medium shrink-0 transition-colors duration-200 ${
                                                i === activeIdx ? "text-stone-400" : "text-stone-300"
                                            }`}
                                        >
                                          {col.number}
                                        </span>
                                        <span
                                            className={`font-serif text-2xl md:text-3xl font-light tracking-tight transition-colors duration-200 ${
                                                i === activeIdx
                                                    ? "text-stone-900 italic"
                                                    : "text-stone-400 group-hover:text-stone-700 group-hover:italic "
                                            }`}
                                        >
                                            {col.title}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Image */}
                    <div className="relative overflow-hidden aspect-[3/4] w-full max-w-sm mx-auto lg:max-w-none">
                        {collections.map((col, i) => (
                            <img
                                key={col.id}
                                src={col.image}
                                alt={col.title}
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                                    i === activeIdx ? "opacity-100" : "opacity-0"
                                }`}
                            />
                        ))}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col gap-6">
                        {collections.map((col, i) => (
                            <div
                                key={col.id}
                                className={`flex flex-col gap-5 transition-opacity duration-500 ${
                                    i === activeIdx ? "opacity-100" : "opacity-0 absolute pointer-events-none"
                                }`}
                            >
                                <h3 className="font-serif text-3xl md:text-4xl font-light leading-snug text-stone-900">
                                    {col.heading} <em className="italic">{col.headingEm}</em>
                                </h3>
                                <p className="text-stone-500 text-sm leading-relaxed">
                                    {col.description}
                                </p>

                            <a    href={col.href}
                                className="self-start text-xs tracking-widest uppercase font-medium text-stone-900 border-b border-stone-900 pb-0.5 hover:text-stone-500 hover:border-stone-500 transition-colors"
                                >
                                Shop all items
                            </a>
                            </div>
                            ))}
                    </div>

                </div>
            </div>
        </section>
    );
}
