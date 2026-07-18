import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Customer from "./pages/Customer";
import Manager from "./pages/Manager";
import Checkout from "./pages/Checkout";
import { DialogProvider } from "./components/common/DialogProvider";

function App() {
  return (
    <DialogProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/customer" element={<Customer />} />
          <Route path="/manager" element={<Manager />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </BrowserRouter>
    </DialogProvider>
  );
}

export default App;