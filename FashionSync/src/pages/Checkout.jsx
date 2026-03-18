import { useEffect, useMemo, useState } from "react";
import styles from "../styles/checkout/Checkout.module.scss";

import { SHIPPING_OPTIONS } from "../data/shippingOptions";
import {
  getAppliedDiscountPercent,
  buildCart,
  clearCheckoutCart,
  getCurrentUser,
  saveReceipt,
  updateProductsStock,
} from "../functions/checkout/checkoutStorage";
import {
  getDiscountAmount,
  getShippingCost,
  getSubtotal,
  getTotal,
} from "../functions/checkout/checkoutPricing";
import {
  validatePayment,
  validateStep1,
} from "../functions/checkout/checkoutValidation";

import CheckoutTopbar from "../components/checkout/checkoutTopbar";
import CheckoutStepsBar from "../components/checkout/CheckoutStepsBar";
import CheckoutStep1Details from "../components/checkout/CheckoutStep1Details";
import CheckoutStep2Shipping from "../components/checkout/CheckoutStep2Shipping";
import CheckoutStep3Payment from "../components/checkout/CheckoutStep3Payment";
import CheckoutStep4Success from "../components/checkout/CheckoutStep4Success";
import ProcessingOverlay from "../components/checkout/ProcessingOverlay";

export default function Checkout() {
  const [currentStep, setCurrentStep] = useState(1);
  const [cart, setCart] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(
    SHIPPING_OPTIONS?.[0] || null
  );
  const [discountPct, setDiscountPct] = useState(0);
  const [payMethod, setPayMethod] = useState("card");
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    zip: "",
    notes: "",
    cardNumber: "",
    cardHolder: "",
    cardId: "",
    expiry: "",
    cvv: "",
    bitPhone: "",
  });

  useEffect(() => {
    const nextCart = buildCart();
    setCart(Array.isArray(nextCart) ? nextCart : []);

    setDiscountPct(getAppliedDiscountPercent());

    const currentUser = getCurrentUser();
    if (currentUser?.email || currentUser?.name) {
      const parts = String(currentUser?.name || "")
        .trim()
        .split(" ")
        .filter(Boolean);

      setFormData((prev) => ({
        ...prev,
        email: prev.email || currentUser?.email || "",
        firstName: prev.firstName || parts[0] || "",
        lastName:
          prev.lastName || (parts.length > 1 ? parts.slice(1).join(" ") : ""),
      }));
    }
  }, []);

  const subtotal = useMemo(() => getSubtotal(cart), [cart]);

  const discountAmount = useMemo(
    () => getDiscountAmount(subtotal, discountPct),
    [subtotal, discountPct]
  );

  const shippingCost = useMemo(
    () => getShippingCost(selectedShipping, subtotal),
    [selectedShipping, subtotal]
  );

  const total = useMemo(
    () => getTotal(cart, discountPct, selectedShipping),
    [cart, discountPct, selectedShipping]
  );

  const installmentOptions = useMemo(() => {
    if (total >= 1000) return [1, 2, 3, 6, 12];
    if (total >= 500) return [1, 2, 3, 6];
    if (total >= 100) return [1, 2, 3];
    return [1];
  }, [total]);

  useEffect(() => {
    if (!installmentOptions.includes(selectedInstallments)) {
      setSelectedInstallments(1);
    }
  }, [installmentOptions, selectedInstallments]);

  function handleInputChange(event) {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === "cardNumber") {
      const clean = value.replace(/\D/g, "").slice(0, 16);
      nextValue = clean.match(/.{1,4}/g)?.join(" ") || clean;
    }

    if (name === "expiry") {
      const clean = value.replace(/\D/g, "").slice(0, 4);
      nextValue =
        clean.length >= 2 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
    }

    if (name === "cvv") {
      nextValue = value.replace(/\D/g, "").slice(0, 3);
    }

    if (name === "cardId") {
      nextValue = value.replace(/\D/g, "").slice(0, 9);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  }

  function handleSelectShipping(shippingId) {
    const found = SHIPPING_OPTIONS.find((option) => option.id === shippingId);
    if (found) {
      setSelectedShipping(found);
    }
  }

  function getDeliveryText() {
    if (!selectedShipping) return "";

    if (selectedShipping.id === "same_day") {
      return "⚡ אספקה עד הערב!";
    }

    if (selectedShipping.id === "pickup") {
      return "ניתן לאסוף מחר בין 10:00–20:00, הרצל 42, תל אביב";
    }

    return `זמן אספקה משוער: ${selectedShipping.days}${
      selectedShipping.note ? ` · ${selectedShipping.note}` : ""
    }`;
  }

  function goToStep2() {
    const stepErrors = validateStep1(formData);
    setErrors(stepErrors);

    if (Object.keys(stepErrors).length > 0) return;

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToStep3() {
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack(step) {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function completeOrder() {
    const receiptId = `RCP-${Date.now()}`;
    const isCash = payMethod === "cash";

    const receipt = {
      id: receiptId,
      date: new Date().toISOString(),
      emp: "self-checkout",
      payMethod,
      status: isCash ? "pending_payment" : "paid",
      items: cart.map((item) => ({
        code: item.code,
        name: item.name,
        price: item.price,
        qty: item.qty,
        img: item.img,
        size: item.size,
        color: item.color,
      })),
      total,
      shipping: selectedShipping?.label || "",
      shippingCost,
      customer: {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone,
      },
    };

    saveReceipt(receipt);

    if (!isCash) {
      updateProductsStock(cart);
    }

    clearCheckoutCart();

    setSuccessData({
      receiptId,
      isCash,
      email: formData.email,
      items: cart,
      shippingCost,
      discountAmount,
      total,
    });

    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePay() {
    const paymentErrors = validatePayment(formData, payMethod, termsAccepted);
    setErrors(paymentErrors);

    if (Object.keys(paymentErrors).length > 0) return;

    setProcessing(true);

    const delay = payMethod === "cash" ? 800 : 2200;
    setTimeout(() => {
      setProcessing(false);
      completeOrder();
    }, delay);
  }

  function handleToggleTerms(event) {
    const checked = event.target.checked;
    setTermsAccepted(checked);

    if (checked) {
      setErrors((prev) => ({
        ...prev,
        terms: undefined,
      }));
    }
  }

  function handlePrint() {
    window.print();
  }

  function backToStore() {
    window.location.href = "/customer";
  }

  return (
    <>
      <CheckoutTopbar />
      <ProcessingOverlay isOpen={processing} />

      <div className={styles.checkoutWrap}>
        <CheckoutStepsBar currentStep={currentStep} />

        {currentStep === 1 && (
          <CheckoutStep1Details
            form={formData}
            errors={errors}
            onChange={handleInputChange}
            onNext={goToStep2}
          />
        )}

        {currentStep === 2 && (
          <CheckoutStep2Shipping
            shippingOptions={SHIPPING_OPTIONS}
            selectedShipping={selectedShipping}
            onSelectShipping={handleSelectShipping}
            deliveryText={getDeliveryText()}
            subtotal={subtotal}
            discount={discountAmount}
            shippingCost={shippingCost}
            total={total}
            onBack={() => goBack(1)}
            onNext={goToStep3}
          />
        )}

        {currentStep === 3 && (
          <CheckoutStep3Payment
            payMethod={payMethod}
            setPayMethod={setPayMethod}
            form={formData}
            errors={errors}
            onChange={handleInputChange}
            installments={installmentOptions}
            selectedInstallments={selectedInstallments}
            onSelectInstallments={setSelectedInstallments}
            subtotal={subtotal}
            discount={discountAmount}
            shippingCost={shippingCost}
            total={total}
            termsAccepted={termsAccepted}
            onToggleTerms={handleToggleTerms}
            onBack={() => goBack(2)}
            onPay={handlePay}
          />
        )}

        {currentStep === 4 && successData && (
          <CheckoutStep4Success
            isCash={successData.isCash}
            email={successData.email}
            receiptId={successData.receiptId}
            items={successData.items}
            shippingCost={successData.shippingCost}
            discount={successData.discountAmount}
            total={successData.total}
            onBackToStore={backToStore}
            onPrint={handlePrint}
          />
        )}
      </div>
    </>
  );
}