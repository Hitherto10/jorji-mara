import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import SearchBar from './SearchBar.jsx'

/**
 * SearchOverlay
 *
 * A full-screen search experience triggered from the header.
 * On desktop: a clean overlay panel that drops from the top.
 * On mobile: same treatment, full width.
 *
 * Props:
 *  open    — bool
 *  onClose — fn()
 */
export default function SearchOverlay({ open, onClose }) {

    // Lock scroll when overlay is open
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden'
        else      document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    // Escape key to close
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [onClose])

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        className="fixed top-0 left-0 right-0 z-[70] bg-white border-b border-stone-200 shadow-xl"
                        initial={{ y: '-100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '-100%' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 38 }}
                    >
                        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3 font-[Bricolage_Grotesque]">
                            {/* Expanded SearchBar */}
                            <div className="flex-1">
                                <SearchBar
                                    autoFocus
                                    onClose={onClose}
                                />
                            </div>

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="shrink-0 w-9 h-9 flex items-center justify-center text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-400 transition-colors"
                                aria-label="Close search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}