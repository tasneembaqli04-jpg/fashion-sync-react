/**
 * Callers into the email cloud functions.
 *
 * Every send is fire-and-forget: no caller awaits the result, and a message
 * that does not go out never blocks the order, the return or the status change
 * that triggered it. A failure here is therefore reported at warning level.
 * Raising it to an error would put a red line in the console for something the
 * application has already handled, and it would put twenty-two of them there
 * whenever the functions are simply unreachable.
 */
const EMAIL_URL =
  import.meta.env.VITE_EMAIL_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/sendOrderEmail";

export async function sendOrderConfirmationEmail({ toEmail, order, lang }) {
  if (!toEmail || !order) return null;

  try {
    const response = await fetch(EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, order, lang }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      console.warn(`Order email not sent: ${data?.message || "rejected by the server"}`);
      return null;
    }

    return data;
  } catch (err) {
    console.warn(`Order email not sent: ${err.message}`);
    return null;
  }
}

const STOCK_ALERT_EMAIL_URL =
  import.meta.env.VITE_STOCK_ALERT_EMAIL_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/sendStockAlertEmail";

export async function sendStockAlertEmail({ toEmail, productName, productNameEn, lang }) {
  if (!toEmail) return null;

  try {
    const response = await fetch(STOCK_ALERT_EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, productName, productNameEn, lang }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      console.warn(`Stock alert email not sent: ${data?.message || "rejected by the server"}`);
      return null;
    }

    return data;
  } catch (err) {
    console.warn(`Stock alert email not sent: ${err.message}`);
    return null;
  }
}
const SHIPPING_UPDATE_EMAIL_URL =
  import.meta.env.VITE_SHIPPING_UPDATE_EMAIL_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/sendShippingUpdateEmail";

export async function sendShippingUpdateEmail({ toEmail, orderId, stageIndex, isPickup, lang }) {
  if (!toEmail || !orderId) return null;

  try {
    const response = await fetch(SHIPPING_UPDATE_EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, orderId, stageIndex, isPickup, lang }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      console.warn(`Shipping update email not sent: ${data?.message || "rejected by the server"}`);
      return null;
    }

    return data;
  } catch (err) {
    console.warn(`Shipping update email not sent: ${err.message}`);
    return null;
  }
}
const PICKUP_SCHEDULED_EMAIL_URL =
  import.meta.env.VITE_PICKUP_SCHEDULED_EMAIL_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/sendPickupScheduledEmail";

export async function sendPickupScheduledEmail({ toEmail, orderId, pickupDate, pickupTime, lang }) {
  if (!toEmail) return null;

  try {
    const response = await fetch(PICKUP_SCHEDULED_EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, orderId, pickupDate, pickupTime, lang }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      console.warn(`Pickup scheduled email not sent: ${data?.message || "rejected by the server"}`);
      return null;
    }

    return data;
  } catch (err) {
    console.warn(`Pickup scheduled email not sent: ${err.message}`);
    return null;
  }
}

const RETURN_STATUS_EMAIL_URL =
  import.meta.env.VITE_RETURN_STATUS_EMAIL_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/sendReturnStatusEmail";

export async function sendReturnStatusEmail({ toEmail, itemName, itemNameEn, status, giftCardCode, giftCardAmount, lang }) {
  if (!toEmail || !status) return null;

  try {
    const response = await fetch(RETURN_STATUS_EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, itemName, itemNameEn, status, giftCardCode, giftCardAmount, lang }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      console.warn(`Return status email not sent: ${data?.message || "rejected by the server"}`);
      return null;
    }

    return data;
  } catch (err) {
    console.warn(`Return status email not sent: ${err.message}`);
    return null;
  }
}
const ORDER_CANCELLATION_EMAIL_URL =
  import.meta.env.VITE_ORDER_CANCELLATION_EMAIL_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/sendOrderCancellationEmail";

export async function sendOrderCancellationEmail({ toEmail, orderId, total, lang }) {
  if (!toEmail) return null;

  try {
    const response = await fetch(ORDER_CANCELLATION_EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, orderId, total, lang }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      console.warn(`Order cancellation email not sent: ${data?.message || "rejected by the server"}`);
      return null;
    }

    return data;
  } catch (err) {
    console.warn(`Order cancellation email not sent: ${err.message}`);
    return null;
  }
}
const CONTACT_NOTIFICATION_EMAIL_URL =
  import.meta.env.VITE_CONTACT_NOTIFICATION_EMAIL_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/sendContactNotificationEmail";

export async function sendContactNotificationEmail({ name, email, message }) {
  if (!message) return null;

  try {
    const response = await fetch(CONTACT_NOTIFICATION_EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      console.warn(`Contact notification email not sent: ${data?.message || "rejected by the server"}`);
      return null;
    }

    return data;
  } catch (err) {
    console.warn(`Contact notification email not sent: ${err.message}`);
    return null;
  }
}
const WELCOME_EMAIL_URL =
  import.meta.env.VITE_WELCOME_EMAIL_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/sendWelcomeEmail";

export async function sendWelcomeEmail({ toEmail, name, lang }) {
  if (!toEmail) return null;

  try {
    const response = await fetch(WELCOME_EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, name, lang }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      console.warn(`Welcome email not sent: ${data?.message || "rejected by the server"}`);
      return null;
    }

    return data;
  } catch (err) {
    console.warn(`Welcome email not sent: ${err.message}`);
    return null;
  }
}
const PASSWORD_RESET_EMAIL_URL =
  import.meta.env.VITE_PASSWORD_RESET_EMAIL_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/sendPasswordResetEmail";

export async function sendPasswordResetRequest({ toEmail, lang }) {
  if (!toEmail) return null;

  try {
    const response = await fetch(PASSWORD_RESET_EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, lang }),
    });

    const data = await response.json().catch(() => null);
    return data;
  } catch (err) {
    console.warn(`Password reset not sent: ${err.message}`);
    return null;
  }
}
const VERIFICATION_EMAIL_URL =
  import.meta.env.VITE_VERIFICATION_EMAIL_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/sendVerificationEmail";

export async function sendVerificationCodeEmail({ toEmail, code, lang }) {
  if (!toEmail || !code) return null;

  try {
    const response = await fetch(VERIFICATION_EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, code, lang }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      console.warn(`Verification email not sent: ${data?.message || "rejected by the server"}`);
      return null;
    }

    return data;
  } catch (err) {
    console.warn(`Verification email not sent: ${err.message}`);
    return null;
  }
}
const GIFT_CARD_ACTIVATED_EMAIL_URL =
  import.meta.env.VITE_GIFT_CARD_ACTIVATED_EMAIL_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/sendGiftCardActivatedEmail";

export async function sendGiftCardActivatedEmail({ toEmail, giftCardCode, amount, lang }) {
  if (!toEmail || !giftCardCode) return null;

  try {
    const response = await fetch(GIFT_CARD_ACTIVATED_EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, giftCardCode, amount, lang }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      console.warn(`Gift card activated email not sent: ${data?.message || "rejected by the server"}`);
      return null;
    }

    return data;
  } catch (err) {
    console.warn(`Gift card activated email not sent: ${err.message}`);
    return null;
  }
}
const ORDER_REJECTED_EMAIL_URL =
  import.meta.env.VITE_ORDER_REJECTED_EMAIL_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/sendOrderRejectedEmail";

export async function sendOrderRejectedEmail({ toEmail, orderId, reason, lang }) {
  if (!toEmail || !orderId) return null;

  try {
    const response = await fetch(ORDER_REJECTED_EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, orderId, reason, lang }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      console.warn(`Order rejected email not sent: ${data?.message || "rejected by the server"}`);
      return null;
    }

    return data;
  } catch (err) {
    console.warn(`Order rejected email not sent: ${err.message}`);
    return null;
  }
}
const GIFT_CARD_REJECTED_EMAIL_URL =
  import.meta.env.VITE_GIFT_CARD_REJECTED_EMAIL_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/sendGiftCardRejectedEmail";

export async function sendGiftCardRejectedEmail({ toEmail, lang }) {
  if (!toEmail) return null;

  try {
    const response = await fetch(GIFT_CARD_REJECTED_EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, lang }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      console.warn(`Gift card rejected email not sent: ${data?.message || "rejected by the server"}`);
      return null;
    }

    return data;
  } catch (err) {
    console.warn(`Gift card rejected email not sent: ${err.message}`);
    return null;
  }
}