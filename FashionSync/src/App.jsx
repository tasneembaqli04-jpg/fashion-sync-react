import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react"; 
import Home from "./pages/Home";
import Customer from "./pages/Customer";
import Employee from "./pages/Employee";
import Manager from "./pages/Manager";
import Checkout from "./pages/Checkout";

function App() {
  const [promotedProduct, setPromotedProduct] = useState(null);
  const handlePromote = (product) => {
    setPromotedProduct(product);
    if (product && product.img) {
      localStorage.setItem("featuredProductImage", product.img);
      window.dispatchEvent(new Event("storage"));
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home promotedProduct={promotedProduct} />} />
        <Route
          path="/customer"
          element={<Customer promotedProduct={promotedProduct} />}
        />

        <Route path="/employee" element={<Employee />} />
        <Route
          path="/manager"
          element={<Manager onPromote={handlePromote} />}
        />

        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
