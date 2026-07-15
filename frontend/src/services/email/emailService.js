const EMAIL_URL =
  import.meta.env.VITE_EMAIL_URL ||
  "http://127.0.0.1:5001/fashionsync-dc79f/us-central1/sendOrderEmail";

export async function sendOrderConfirmationEmail({ toEmail, order }) {
  if (!toEmail || !order) return null;

  try {
    const response = await fetch(EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, order }),
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

export async function sendStockAlertEmail({ toEmail, productName }) {
  if (!toEmail) return null;

  try {
    const response = await fetch(STOCK_ALERT_EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, productName }),
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

export async function sendShippingUpdateEmail({ toEmail, orderId, stageIndex }) {
  if (!toEmail || !orderId) return null;

  try {
    const response = await fetch(SHIPPING_UPDATE_EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, orderId, stageIndex }),
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