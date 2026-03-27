import { createContext, useContext, useState, useCallback } from 'react'

/**
 * QuickViewContext
 *
 * Provides a global trigger for the QuickView modal.
 * Any component can call openQuickView(slug) to show the modal.
 *
 * Usage:
 *   const { openQuickView } = useQuickView()
 *   openQuickView('chai-flare')
 */
const QuickViewContext = createContext(null)

export function QuickViewProvider({ children }) {
    const [slug, setSlug] = useState(null)

    const openQuickView  = useCallback((productSlug) => setSlug(productSlug), [])
    const closeQuickView = useCallback(() => setSlug(null), [])

    return (
        <QuickViewContext.Provider value={{ slug, openQuickView, closeQuickView }}>
            {children}
        </QuickViewContext.Provider>
    )
}

export function useQuickView() {
    const ctx = useContext(QuickViewContext)
    if (!ctx) throw new Error('useQuickView must be used inside <QuickViewProvider>')
    return ctx
}