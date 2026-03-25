import Home from "./pages/Home.jsx";
import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

const Products = lazy(() => import("./pages/Products.jsx"));
const ProductPage = lazy(() => import("./pages/ProductPage.jsx"));

function App() {
    return (
        <Suspense fallback={<div className="min-h-screen" />}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:slug" element={<ProductPage />} />
            </Routes>
        </Suspense>
    );
}

export default App;
