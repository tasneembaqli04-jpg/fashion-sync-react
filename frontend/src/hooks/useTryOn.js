import { useRef, useState } from "react";
import { useLanguage } from "../translations/LanguageProvider";
import { requestSmartTryOn } from "../services/tryOn/smartTryOnService";
import { TRY_ON_ERRORS } from "../services/tryOn/tryOnErrors";

/**
 * Each Try-On error code maps to a key under customer.dialogs. A code with no
 * entry falls back to the general message, so a failure from the network layer
 * cannot put its own wording on screen.
 */
const TRY_ON_ERROR_KEYS = {
  [TRY_ON_ERRORS.NO_PRODUCT]: "tryOnErrorProductNotFound",
  [TRY_ON_ERRORS.NO_PRODUCT_IMAGE]: "tryOnErrorProductImageMissing",
  [TRY_ON_ERRORS.NO_CUSTOMER_IMAGE]: "tryOnErrorUploadImage",
  [TRY_ON_ERRORS.REQUEST_FAILED]: "tryOnErrorGeneric",
};

/**
 * Holds the Try-On dialog: the customer's photo, the request, and its result.
 *
 * Generating an image takes long enough that the customer can close the dialog
 * or ask again before the first attempt returns, so the in-flight request is
 * tracked in a ref and cancelled on both. Two guards follow from that, and
 * both matter:
 *
 * - After awaiting, the signal is checked before the result is stored, so a
 *   cancelled attempt cannot fill a dialog the customer has already closed.
 * - The cleanup only clears the loading flag when the request finishing is
 *   still the current one. Without that check, a slow first attempt landing
 *   after a second has started would switch the spinner off while the second
 *   is still running.
 *
 * The product is identified by the code the product dialog is showing, which
 * is why both the value and its setter are passed in: opening Try-On from a
 * product card has to point that dialog at the right product first.
 *
 * @param {object} options - What the hook needs from the page.
 * @param {Array<object>} options.products - Catalogue, used to resolve the code.
 * @param {string} options.selectedProductCode - Code of the product on show.
 * @param {Function} options.setSelectedProductCode - Points the product dialog at a code.
 * @returns {object} Dialog state and the actions it binds to.
 */
export function useTryOn({
  products,
  selectedProductCode,
  setSelectedProductCode,
}) {
  const { t: dict } = useLanguage();

  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [tryOnSelfie, setTryOnSelfie] = useState("");
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnResult, setTryOnResult] = useState(null);
  const [tryOnError, setTryOnError] = useState("");
  const tryOnAbortRef = useRef(null);

  function closeTryOnModal() {
    tryOnAbortRef.current?.abort();
    tryOnAbortRef.current = null;

    setTryOnLoading(false);
    setTryOnError("");
    setTryOnOpen(false);
  }

  function tryOnSelfieUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setTryOnSelfie(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  function clearTryOnSelfie() {
    setTryOnSelfie("");
  }

  async function handleTryOnRequest() {
    if (!tryOnSelfie) {
      setTryOnError(dict.customer.dialogs.tryOnErrorUploadImage);
      return;
    }

    const productForTryOn = products.find(
      (product) => String(product.code) === String(selectedProductCode),
    );

    if (!productForTryOn) {
      setTryOnError(dict.customer.dialogs.tryOnErrorProductNotFound);
      return;
    }

    tryOnAbortRef.current?.abort();

    const controller = new AbortController();
    tryOnAbortRef.current = controller;

    setTryOnLoading(true);
    setTryOnError("");
    setTryOnResult(null);

    try {
      const result = await requestSmartTryOn({
        product: productForTryOn,
        imageUrl: tryOnSelfie,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      setTryOnResult(result);
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      console.error("Try On request failed:", error);

      // The code decides the wording; the message stays in the console. An
      // unrecognised code, including anything thrown by the network layer,
      // falls back to the general message rather than showing its own text.
      const messageKey = TRY_ON_ERROR_KEYS[error?.code];

      setTryOnError(
        dict.customer.dialogs[messageKey] ||
          dict.customer.dialogs.tryOnErrorGeneric
      );
    } finally {
      if (tryOnAbortRef.current === controller) {
        tryOnAbortRef.current = null;
        setTryOnLoading(false);
      }
    }
  }

  function openTryOnFromProduct(code) {
    setSelectedProductCode(code);
    setTryOnOpen(true);
    setTryOnResult(null);
    setTryOnError("");
  }

  return {
    tryOnOpen,
    setTryOnOpen,
    tryOnSelfie,
    tryOnLoading,
    tryOnResult,
    tryOnError,
    closeTryOnModal,
    tryOnSelfieUpload,
    clearTryOnSelfie,
    handleTryOnRequest,
    openTryOnFromProduct,
  };
}
