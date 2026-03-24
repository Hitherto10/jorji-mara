import Home from "./pages/Home.jsx";
import {Routes, Route} from "react-router-dom";
import {lazy} from "react";

const Products = lazy(() => import("./pages/Products.jsx"));
function App() {

  return (
    <>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
        </Routes>

    </>
  )
}

export default App
