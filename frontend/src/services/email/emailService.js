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
      console.error("Order email failed:", data?.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Order email request failed:", err);
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
      console.error("Stock alert email failed:", data?.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Stock alert email request failed:", err);
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
      console.error("Shipping update email failed:", data?.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Shipping update email request failed:", err);
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
      console.error("Pickup scheduled email failed:", data?.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Pickup scheduled email request failed:", err);
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
      console.error("Return status email failed:", data?.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Return status email request failed:", err);
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
      console.error("Order cancellation email failed:", data?.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Order cancellation email request failed:", err);
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
      console.error("Contact notification email failed:", data?.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Contact notification email request failed:", err);
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
      console.error("Welcome email failed:", data?.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Welcome email request failed:", err);
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
    console.error("Password reset request failed:", err);
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
      console.error("Verification email failed:", data?.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Verification email request failed:", err);
    return null;
  }
}