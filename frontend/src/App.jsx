import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Customer from "./pages/Customer";
import Manager from "./pages/Manager";
import Checkout from "./pages/Checkout";
import { DialogProvider } from "./components/common/DialogProvider";
import { LanguageProvider, useLanguage } from "./translations/LanguageProvider";
import ErrorBoundary from "./components/common/ErrorBoundary";

/**
 * The routes, behind a boundary so a render error on one page cannot blank
 * the whole application.
 *
 * Split out from App so it sits inside LanguageProvider and can take the
 * message from the dictionary rather than hard-coding one language.
 */
function RoutedPages() {
  const { t: dict } = useLanguage();

  return (
    <ErrorBoundary
      title={dict.common.errorBoundaryTitle}
      message={dict.common.errorBoundaryMessage}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/customer" element={<Customer />} />
        <Route path="/manager" element={<Manager />} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <LanguageProvider>
      <DialogProvider>
        <BrowserRouter>
          <RoutedPages />
        </BrowserRouter>
      </DialogProvider>
    </LanguageProvider>
  );
}

export default App;
