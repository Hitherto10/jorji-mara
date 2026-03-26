import { useState } from 'react'
import { useCollections } from '../hooks/useHomeData.js'

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CollectionSkeleton() {
    return (
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 items-center">
            <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-10 bg-stone-200 rounded w-3/4" />
                ))}
            </div>
            <div className="aspect-[3/4] bg-stone-200 rounded-sm max-w-sm mx-auto w-full" />
            <div className="space-y-4">
                <div className="h-8 bg-stone-200 rounded w-2/3" />
                <div className="h-4 bg-stone-200 rounded w-full" />
                <div className="h-4 bg-stone-200 rounded w-4/5" />
            </div>
        </div>
    )
}

export default function CollectionsShowcase() {
    // useCollections is backed by the same in-memory cache as useHomeData,
    // so if Home already fetched it, this component gets the data instantly.
    const { collections, loading } = useCollections()
    const [activeIdx, setActiveIdx] = useState(0)
    const active = collections[activeIdx]

    return (
        <section className="bg-stone-100 py-16 mt-12 px-4 md:px-12 lg:px-24 font-[Bricolage_Grotesque]">
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <CollectionSkeleton />
                ) : collections.length === 0 ? null : (
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
                                                i === activeIdx ? 'border-stone-900' : 'border-stone-200 hover:border-stone-400'
                                            }`}
                                        >
                      <span className={`text-xs font-medium shrink-0 transition-colors duration-200 ${
                          i === activeIdx ? 'text-stone-400' : 'text-stone-300'
                      }`}>
                        {col.number}
                      </span>
                                            <span className={`font-serif text-2xl md:text-3xl font-light tracking-tight transition-colors duration-200 ${
                                                i === activeIdx
                                                    ? 'text-stone-900 italic'
                                                    : 'text-stone-400 group-hover:text-stone-700 group-hover:italic'
                                            }`}>
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
                                        i === activeIdx ? 'opacity-100' : 'opacity-0'
                                    }`}
                                    loading={i === 0 ? 'eager' : 'lazy'}
                                />
                            ))}
                        </div>

                        {/* Info */}
                        <div className="flex flex-col gap-6">
                            {collections.map((col, i) => (
                                <div
                                    key={col.id}
                                    className={`flex flex-col gap-5 transition-opacity duration-500 ${
                                        i === activeIdx ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
                                    }`}
                                >
                                    <h3 className="font-serif text-3xl md:text-4xl font-light leading-snug text-stone-900">
                                        {col.heading} <em className="italic">{col.headingEm}</em>
                                    </h3>
                                    <p className="text-stone-500 text-sm leading-relaxed">
                                        {col.description}
                                    </p>
                                    <a
                                        href={col.href}
                                        className="self-start text-xs tracking-widest uppercase font-medium text-stone-900 border-b border-stone-900 pb-0.5 hover:text-stone-500 hover:border-stone-500 transition-colors"
                                    >
                                        Shop all items
                                    </a>
                                </div>
                            ))}
                        </div>

                    </div>
                )}
            </div>
        </section>
    )
}