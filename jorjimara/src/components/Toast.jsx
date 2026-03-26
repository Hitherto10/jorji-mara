import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { createPortal } from 'react-dom'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const toast = useCallback(({ message, type = 'success', duration = 2800 }) => {
        const id = Date.now() + Math.random()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
    }, [])

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {createPortal(
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center pointer-events-none">
                    {toasts.map(t => (
                        <div
                            key={t.id}
                            className={`px-5 py-3 rounded-sm text-sm font-medium shadow-lg animate-fade-in-up
                                ${t.type === 'error'
                                    ? 'bg-red-900 text-white'
                                    : t.type === 'info'
                                        ? 'bg-stone-800 text-white'
                                        : 'bg-stone-900 text-white'
                                }`}
                        >
                            {t.message}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
    return ctx
}
