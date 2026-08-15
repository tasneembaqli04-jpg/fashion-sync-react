import { useState } from "react";
import { useLanguage } from "../translations/LanguageProvider";
import { getItemName } from "../functions/customer/itemDisplay";

/**
 * Holds the share dialog: which product is being shared, and how.
 *
 * The dialog offers three routes and each behaves differently. Copying puts a
 * link on the clipboard and flips the confirmation; WhatsApp opens a new tab;
 * email hands the message to the mail client through a mailto link, which
 * navigates the current tab. Only the first has any visible result inside the
 * page, which is why `copied` exists and the other two report nothing.
 *
 * The product code is kept here rather than returned: the caller opens the
 * dialog by code and never needs it back, and holding it inside means the
 * share actions cannot be called for a product the dialog is not showing.
 *
 * @param {Array<object>} [products] - The catalogue, used to resolve the code.
 * @returns {object} Dialog state and the three actions the dialog binds to.
 */
export function useShareModal(products = []) {
  const { t: dict, lang } = useLanguage();

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareProductCode, setShareProductCode] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  const shareProduct =
    products.find((item) => item.code === shareProductCode) || null;

  // Derived rather than stored. Holding the heading in state froze it at the
  // language in force when the dialog opened, so switching language with the
  // dialog on screen left the old wording behind. Deriving also means the
  // product code is the only thing being remembered.
  const shareItemName = shareProduct
    ? `${getItemName(shareProduct, lang)} · ₪${shareProduct.price}`
    : "";

  function openShareModal(code) {
    const product = products.find((item) => item.code === code);
    if (!product) return;

    setShareProductCode(code);
    setShareCopied(false);
    setShareModalOpen(true);
  }

  function closeShareModal() {
    setShareModalOpen(false);
  }

  function doShare(type) {
    const product = shareProduct;
    if (!product) return;

    // The shared text is written in the interface language, so the product
    // name has to follow it. Taking product.name directly produced an English
    // sentence with a Hebrew name sitting inside it.
    const productName = getItemName(product, lang);

    const url = `${window.location.origin}/customer?item=${product.code}`;
    const text = dict.customer.misc.shareMessageTemplate
      .replace("{name}", productName)
      .replace("{price}", product.price);

    if (type === "copy") {
      navigator.clipboard?.writeText(url);
      setShareCopied(true);
    } else if (type === "whatsapp") {
      window.open(
        "https://wa.me/?text=" + encodeURIComponent(`${text} ${url}`),
        "_blank",
      );
    } else if (type === "email") {
      window.location.href =
        "mailto:?subject=" +
        encodeURIComponent(
          dict.customer.misc.shareEmailSubjectPrefix + productName,
        ) +
        "&body=" +
        encodeURIComponent(text + "\n" + url);
    }
  }

  return {
    shareModalOpen,
    shareItemName,
    shareCopied,
    openShareModal,
    closeShareModal,
    doShare,
  };
}
