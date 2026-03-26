import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext.jsx'
import { ToastProvider } from './components/Toast.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const ShopPage = lazy(() => import('./pages/ShopPage.jsx'))
const ProductPage = lazy(() => import('./pages/ProductPage.jsx'))
const Checkout = lazy(() => import('./pages/Checkout.jsx'))

function App() {
    return (
        <CartProvider>
            <ToastProvider>
                <Suspense fallback={<div className="min-h-screen bg-white" />}>
                    <Routes>
                        <Route path="/"                element={<Home />} />
                        <Route path="/products"        element={<ShopPage />} />
                        <Route path="/products/:slug"  element={<ProductPage />} />
                        <Route path="/checkout"        element={<Checkout />} />
                    </Routes>
                </Suspense>
            </ToastProvider>
        </CartProvider>
    )
}

export default App