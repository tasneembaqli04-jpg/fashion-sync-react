import { useState } from "react";
import { useLanguage } from "../translations/LanguageProvider";
import {
  buildGiftCardPreview,
  buyGiftCard as buyGiftCardFn,
} from "../functions/customer/giftCard";
import { getGiftCard } from "../services/giftcard/giftCardService";

/**
 * Each refusal from buyGiftCard maps to a key under customer.giftCard. A
 * reason with no entry falls back to the general message, so an unrecognised
 * code cannot put untranslated text on screen.
 */
const GIFT_CARD_ERROR_KEYS = {
  recipientRequired: "errorRecipientRequired",
  invalidAmount: "errorInvalidAmount",
  loginRequired: "errorLoginRequired",
};

/**
 * Holds the gift card panel: buying one, and checking the balance of one.
 *
 * The two halves share a screen but nothing else. Buying builds a cart line
 * and sends the customer to checkout; checking a balance is a read that
 * touches neither. They live together here because the panel does, and their
 * state is kept separate for the same reason.
 *
 * Buying is the only part that reaches outside: it replaces the cart and
 * navigates away, so `setCart` and `navigate` are passed in rather than
 * reached for, which keeps the page in charge of both.
 *
 * @param {object} options - Everything the panel needs from the page.
 * @param {Array<object>} options.cart - The current cart, appended to on purchase.
 * @param {Function} options.setCart - Replaces the cart once the card is added.
 * @param {object|null} options.currentUser - Signed-in customer, or null.
 * @param {Function} options.navigate - Router navigate, used to reach checkout.
 * @returns {object} Panel state and the actions it binds to.
 */
export function useGiftCard({ cart, setCart, currentUser, navigate }) {
  const { t: dict } = useLanguage();

  const [giftAmount, setGiftAmount] = useState("100");
  const [giftCustomAmount, setGiftCustomAmount] = useState("");
  const [giftName, setGiftName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftPreviewCode, setGiftPreviewCode] = useState("—");
  const [giftError, setGiftError] = useState("");

  const [giftCheckCode, setGiftCheckCode] = useState("");
  const [giftCheckResult, setGiftCheckResult] = useState(null);
  const [giftCheckError, setGiftCheckError] = useState("");

  const giftPreview = buildGiftCardPreview({
    amount: giftAmount,
    customAmount: giftCustomAmount,
    name: giftName,
    message: giftMessage,
  });

  function handleGcAmountChange(value) {
    setGiftAmount(value);
  }

  async function checkGiftCardBalance() {
    const code = giftCheckCode.trim();
    setGiftCheckError("");
    setGiftCheckResult(null);

    if (!code) {
      setGiftCheckError(dict.customer.misc.giftCheckErrorEmptyCode);
      return;
    }

    const card = await getGiftCard(code);

    if (!card) {
      setGiftCheckError(dict.customer.misc.giftCheckErrorNotFound);
      return;
    }

    setGiftCheckResult(card);
  }

  async function buyGiftCard() {
    const result = await buyGiftCardFn({
      amount: giftAmount,
      customAmount: giftCustomAmount,
      name: giftName,
      message: giftMessage,
      email: currentUser?.email,
      cart,
    });

    if (!result.ok) {
      setGiftError(
        dict.customer.giftCard[GIFT_CARD_ERROR_KEYS[result.reason]] ||
          dict.customer.dialogs.unknownError
      );
      return;
    }

    setGiftError("");
    setGiftPreviewCode(result.code);
    setCart(result.nextCart);
    navigate("/checkout");
  }

  return {
    giftAmount,
    setGiftAmount,
    giftCustomAmount,
    setGiftCustomAmount,
    giftName,
    setGiftName,
    giftMessage,
    setGiftMessage,
    giftPreviewCode,
    giftError,
    giftPreview,
    handleGcAmountChange,
    buyGiftCard,

    giftCheckCode,
    setGiftCheckCode,
    giftCheckResult,
    giftCheckError,
    checkGiftCardBalance,
  };
}
