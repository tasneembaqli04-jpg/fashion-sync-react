export function validateStep1(form) {
  const errors = {};

  if (!String(form.firstName || "").trim()) {
    errors.firstName = true;
  }

  if (!String(form.lastName || "").trim()) {
    errors.lastName = true;
  }

  const email = String(form.email || "").trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    errors.email = true;
  }

  const phone = String(form.phone || "").replace(/-/g, "").trim();
  const phoneOk = /^0\d{9}$/.test(phone);
  if (!phoneOk) {
    errors.phone = true;
  }

  if (!String(form.street || "").trim()) {
    errors.street = true;
  }

  if (!String(form.city || "").trim()) {
    errors.city = true;
  }

  return errors;
}

export function validatePayment(form, payMethod, termsAccepted) {
  const errors = {};

  if (!termsAccepted) {
    errors.terms = true;
  }

  if (payMethod === "cash" || payMethod === "paypal") {
    return errors;
  }

  if (payMethod === "bit") {
    const bitPhone = String(form.bitPhone || "").replace(/-/g, "").trim();
    if (bitPhone && !/^0\d{9}$/.test(bitPhone)) {
      errors.bitPhone = true;
    }
    return errors;
  }

  const cardNumber = String(form.cardNumber || "").replace(/\s/g, "").trim();
  if (cardNumber.length < 15) {
    errors.cardNumber = true;
  }

  if (!String(form.cardHolder || "").trim()) {
    errors.cardHolder = true;
  }

  const cardId = String(form.cardId || "").trim();
  if (!/^\d{9}$/.test(cardId)) {
    errors.cardId = true;
  }

  const expiry = String(form.expiry || "").trim();
  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    errors.expiry = true;
  }

  const cvv = String(form.cvv || "").trim();
  if (!/^\d{3}$/.test(cvv)) {
    errors.cvv = true;
  }

  return errors;
}