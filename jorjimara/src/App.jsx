import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext.jsx'
import { ToastProvider } from './components/Toast.jsx'
import { QuickViewProvider } from './context/QuickViewContext.jsx'
import QuickViewModal from './components/QuickViewModal.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const ShopPage = lazy(() => import('./pages/ShopPage.jsx'))
const ProductPage = lazy(() => import('./pages/ProductPage.jsx'))
const Checkout = lazy(() => import('./pages/Checkout.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))
const ShippingAndReturns = lazy(() => import('./pages/ShippingReturns.jsx'))
const SizeChart = lazy(() => import('./pages/SizeChart.jsx'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy.jsx'))

function App() {
    return (
        <CartProvider>
            <ToastProvider>
                <QuickViewProvider>
                    {/* Modal lives at the root so it can overlay any page */}
                    <QuickViewModal />

                    <Suspense fallback={<div className="min-h-screen bg-white" />}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/products" element={<ShopPage />} />
                            <Route path="/products/:slug" element={<ProductPage />} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="/contact" element={<Contact />} />
                            <Route path="/size-chart" element={<SizeChart />} />
                            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                            <Route path="/shipping-and-returns" element={<ShippingAndReturns />} />
                        </Routes>
                    </Suspense>
                </QuickViewProvider>
            </ToastProvider>
        </CartProvider>
    )
}

export default App