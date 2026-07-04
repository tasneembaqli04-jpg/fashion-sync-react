import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "../styles/checkout/Checkout.module.scss";

import { SHIPPING_OPTIONS } from "../data/shippingOptions";
import {
  getAppliedDiscountPercent,
  buildCart,
  getCurrentUser,
  clearCheckoutCart,
  saveReceiptAndOrder,
  updateProductsStock,
} from "../functions/checkout/checkoutStorage";
import {
  getDiscountAmount,
  getShippingCost,
  getSubtotal,
  getTotal,
} from "../functions/checkout/checkoutPricing";

import CheckoutTopbar from "../components/checkout/checkoutTopbar";
import CheckoutStepsBar from "../components/checkout/CheckoutStepsBar";
import CheckoutStep1Details from "../components/checkout/CheckoutStep1Details";
import CheckoutStep2Shipping from "../components/checkout/CheckoutStep2Shipping";
import CheckoutStep3Payment from "../components/checkout/CheckoutStep3Payment";
import CheckoutStep4Success from "../components/checkout/CheckoutStep4Success";
import ProcessingOverlay from "../components/checkout/ProcessingOverlay";
import { getCartFromFirestore } from "../functions/customer/cartFirestore";
export default function Checkout() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [cart, setCart] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(
    SHIPPING_OPTIONS?.[0] || null,
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

    async function loadCart() {
      if (currentUser?.email) {
        const firestoreCart = await getCartFromFirestore(currentUser.email);
        setCart(Array.isArray(firestoreCart) ? firestoreCart : []);
      } else {
        const nextCart = buildCart();
        setCart(Array.isArray(nextCart) ? nextCart : []);
      }
    }

    loadCart();
  }, []);

  const subtotal = useMemo(() => getSubtotal(cart), [cart]);

  const discountAmount = useMemo(
    () => getDiscountAmount(subtotal, discountPct),
    [subtotal, discountPct],
  );

  const shippingCost = useMemo(
    () => getShippingCost(selectedShipping, subtotal),
    [selectedShipping, subtotal],
  );

  const total = useMemo(
    () => getTotal(cart, discountPct, selectedShipping),
    [cart, discountPct, selectedShipping],
  );

  const installmentOptions = useMemo(() => {
    if (payMethod !== "card" || total < 100) return [1];
    if (total >= 1000) return [1, 2, 3, 6, 12];
    if (total >= 500) return [1, 2, 3, 6];
    return [1, 2, 3];
  }, [payMethod, total]);

  useEffect(() => {
    if (!installmentOptions.includes(selectedInstallments)) {
      setSelectedInstallments(1);
    }
  }, [installmentOptions, selectedInstallments]);

  function handleInputChange(event) {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === "bitPhone") {
      nextValue = value.replace(/[^\d-]/g, "").slice(0, 11);
    }

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

  function validateStep1Fields() {
    const nextErrors = {};

    if (!formData.firstName.trim()) nextErrors.firstName = true;
    if (!formData.lastName.trim()) nextErrors.lastName = true;

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
    if (!emailOk) nextErrors.email = true;

    const phoneClean = formData.phone.replace(/-/g, "").trim();
    const phoneOk = /^0\d{9}$/.test(phoneClean);
    if (!phoneOk) nextErrors.phone = true;

    if (!formData.street.trim()) nextErrors.street = true;
    if (!formData.city.trim()) nextErrors.city = true;

    return nextErrors;
  }

  function validatePaymentFields() {
    const nextErrors = {};

    if (!termsAccepted) {
      nextErrors.terms = true;
    }

    if (payMethod === "card") {
      const cardNumberClean = formData.cardNumber.replace(/\s/g, "");
      if (cardNumberClean.length < 15) nextErrors.cardNumber = true;
      if (!formData.cardHolder.trim()) nextErrors.cardHolder = true;
      if (formData.cardId.trim().length !== 9) nextErrors.cardId = true;
      if (!/^\d{2}\/\d{2}$/.test(formData.expiry.trim())) {
        nextErrors.expiry = true;
      }
      if (formData.cvv.trim().length !== 3) nextErrors.cvv = true;
    }

    if (payMethod === "bit") {
      const bitPhoneClean = formData.bitPhone.replace(/-/g, "").trim();
      if (!/^0\d{9}$/.test(bitPhoneClean)) {
        nextErrors.bitPhone = true;
      }
    }

    if (payMethod === "paypal") {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
      if (!emailOk) {
        nextErrors.email = true;
      }
    }

    return nextErrors;
  }

  function goToStep2() {
    const stepErrors = validateStep1Fields();
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

  function handlePay() {
    const paymentErrors = validatePaymentFields();
    setErrors(paymentErrors);

    if (Object.keys(paymentErrors).length > 0) {
      return;
    }

    setProcessing(true);

    setTimeout(async () => {
      try {
        const orderItems = await getCartFromFirestore(formData.email);

        if (orderItems.length === 0) {
          throw new Error("העגלה ריקה, אי אפשר ליצור הזמנה");
        }

        const orderSubtotal = getSubtotal(orderItems);
        const orderDiscountAmount = getDiscountAmount(
          orderSubtotal,
          discountPct,
        );
        const orderShippingCost = getShippingCost(
          selectedShipping,
          orderSubtotal,
        );
        const orderTotal =
          orderSubtotal - orderDiscountAmount + orderShippingCost;

        const receipt = {
          id: `RCP-${Date.now()}`,
          date: new Date().toISOString(),
          customer: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            phone: formData.phone,
            street: formData.street,
            city: formData.city,
            zip: formData.zip,
            notes: formData.notes,
          },
          items: orderItems,
          subtotal: orderSubtotal,
          discountAmount: orderDiscountAmount,
          discountPct,
          shipping: selectedShipping,
          shippingCost: orderShippingCost,
          total: orderTotal,
          payMethod,
          installments: payMethod === "card" ? selectedInstallments : 1,
          status: 0,
        };

        await saveReceiptAndOrder(receipt);
        updateProductsStock(orderItems);
        await clearCheckoutCart();
        setProcessing(false);

        setSuccessData({
          receiptId: receipt.id,
          isCash: payMethod === "cash",
          email: formData.email,
          items: orderItems,
          shippingCost: orderShippingCost,
          discountAmount: orderDiscountAmount,
          total: orderTotal,
        });

        setCurrentStep(4);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        console.error("Payment save error FULL:", error);
        console.error("message:", error?.message);
        console.error("stack:", error?.stack);
        setProcessing(false);
        alert(
          `אירעה שגיאה בשמירת ההזמנה: ${error?.message || "שגיאה לא ידועה"}`,
        );
      }
    }, 1500);
  }
  function handleToggleTerms(event) {
    const checked = event.target.checked;
    setTermsAccepted(checked);

    setErrors((prev) => ({
      ...prev,
      terms: checked ? undefined : prev.terms,
    }));
  }

  function handlePrint() {
    window.print();
  }

  const backToStore = () => {
    setCart([]);
    setSuccessData(null);
    setCurrentStep(1);
    navigate("/customer", { replace: true });
  };

  const isPayDisabled = !termsAccepted;

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
            isPayDisabled={isPayDisabled}
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
