import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../translations/LanguageProvider";
import {
  subscribeToOrders,
  advanceOrderStatus,
  confirmOrder,
  rejectOrder,
} from "../services/orders/ordersService";
import { getAllCustomers } from "../services/customer/customerFirestore";
import {
  countOrdersNeedingDecision,
  countOrdersAwaitingDelivery,
} from "../functions/manager/orderStatus";
import {
  activateGiftCard,
  rejectGiftCard,
} from "../services/giftcard/giftCardService";
import {
  sendShippingUpdateEmail,
  sendGiftCardActivatedEmail,
  sendOrderRejectedEmail,
  sendGiftCardRejectedEmail,
} from "../services/email/emailService";

/**
 * Holds the manager's view of every order, and the decisions taken on them.
 *
 * Orders arrive over a subscription rather than a fetch, because customers
 * place them while the manager has the screen open and a new order has to
 * appear on its own. Each one is normalised on arrival into the shape the
 * manager's screens read, so no screen has to know how an order is stored.
 *
 * Customer details are fetched separately and joined in by email. That fetch
 * and the subscription race, and either can land first, so both sides fill the
 * join: the fetch back-fills details onto orders already on screen, and the
 * subscription looks up details for orders arriving later.
 *
 * Every decision writes to Firestore and updates local state at once rather
 * than waiting for the subscription to echo it back, so the screen responds
 * immediately. A gift card is not shipped, so confirming or rejecting an order
 * that contains one activates or voids the card and sends the matching email
 * instead of a shipping update.
 *
 * @param {object} options - What the hook needs from the page.
 * @param {boolean} options.isLoggedIn - Manager session; nothing loads without one.
 * @param {number} options.refreshKey - Bumped by the page to re-subscribe.
 * @returns {object} Order state, the counts the sidebar shows, and the actions.
 */
export function useManagerOrders({ isLoggedIn, refreshKey }) {
  const { lang } = useLanguage();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;

    let unsubscribe = null;
    let customersMap = new Map();

    getAllCustomers().then((customers) => {
      customersMap = new Map(
        customers.map((customer) => [customer.email, customer])
      );

      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          customerDetails:
            customersMap.get(order.customerEmail) || order.customerDetails,
        })),
      );
    });

    unsubscribe = subscribeToOrders((firestoreOrders) => {
      const normalized = firestoreOrders.map((order) => {
        const customer = customersMap.get(order.customerEmail);

        return {
          docId: order.docId,
          id: order.id,

          customerDetails: customer || null,
          customerEmail: order.customerEmail,
          customerEmbedded: order.customer || null,

          status: order.ready ? "ready" : "pending",
          stageIndex: Number(order.status) || 0,
          confirmed: Boolean(order.confirmed),
          items: Array.isArray(order.items) ? order.items : [],
          total: Number(order.total) || 0,
          subtotal: Number(order.subtotal) || 0,
          discountAmount: Number(order.discountAmount) || 0,
          shippingCost: Number(order.shippingCost) || 0,
          date: order.date || order.createdAt || null,
          createdAt: order.date || order.createdAt || null,
          payMethod: order.payMethod || "",
          shipping: order.shipping || null,
          cancelled: Boolean(order.cancelled),
          rejected: Boolean(order.rejected),
          rejectedAt: order.rejectedAt || null,
          deliveredAt: order.deliveredAt || null,
          pickupDate: order.pickupDate || "",
          pickupTime: order.pickupTime || "",
        };
      });

      setOrders(normalized);
      setOrdersLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isLoggedIn, refreshKey]);

  // Both badges count over every order, not just the current month: an order
  // left waiting since last month is exactly the one that must not be hidden.
  // The month selector on the orders screen is for browsing, not for deciding
  // what still needs doing.
  const pendingOrdersCount = useMemo(
    () => countOrdersNeedingDecision(orders),
    [orders],
  );

  const pendingDeliveriesCount = useMemo(
    () => countOrdersAwaitingDelivery(orders),
    [orders],
  );

  // The financial side of an order, without the customer-facing fields. This
  // is what the reports and the revenue figures are computed from.
  const receipts = useMemo(() => {
    return orders.map((order) => ({
      id: order.id,
      date: order.date || order.createdAt || new Date().toISOString(),
      total: Number(order.total) || 0,
      subtotal: Number(order.subtotal) || 0,
      discountAmount: Number(order.discountAmount) || 0,
      shippingCost: Number(order.shippingCost) || 0,
      payMethod: order.payMethod || "",
      shipping: order.shipping || null,
      customer: order.customerEmbedded || order.customerDetails || null,
      items: Array.isArray(order.items) ? order.items : [],
    }));
  }, [orders]);

  /**
   * Approves an order: records the decision, activates any gift card in it,
   * and tells the customer.
   *
   * Reports which of the three actually happened, because they can part
   * company. A failed write means nothing happened and the screen is put back;
   * a failed email means the order really is approved and only the customer
   * was not told. Saying "approved" for both would hide the second, which is
   * the one the manager has to act on.
   *
   * Only the field this function set is reverted, never the whole order, so a
   * subscription update that landed while the write was in flight is left
   * alone. The subscription is the authority either way and will correct the
   * screen on its next echo.
   *
   * @param {string} orderDocId - Firestore document id of the order.
   * @returns {Promise<{ok: boolean, failed?: string}>} What succeeded.
   *          `failed` is "write", "giftCard" or "email".
   */
  async function handleConfirmOrder(orderDocId) {
    const order = orders.find((o) => o.docId === orderDocId);
    const giftCardItems = (order?.items || []).filter((item) => item.isGiftCard);

    setOrders((prevOrders) =>
      prevOrders.map((o) =>
        o.docId === orderDocId ? { ...o, confirmed: true } : o
      )
    );

    try {
      await confirmOrder(orderDocId);
    } catch (err) {
      console.error(`Order not confirmed: ${err.message}`);

      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.docId === orderDocId ? { ...o, confirmed: false } : o
        )
      );

      return { ok: false, failed: "write" };
    }

    if (giftCardItems.length > 0) {
      // Awaited one at a time rather than in parallel: an order rarely holds
      // more than one card, and a serial loop reports which card failed.
      let cardFailed = false;

      for (const item of giftCardItems) {
        try {
          await activateGiftCard(item.code);
        } catch (err) {
          console.error(`Gift card ${item.code} not activated: ${err.message}`);
          cardFailed = true;
        }
      }

      if (cardFailed) return { ok: false, failed: "giftCard" };

      if (order?.customerEmail) {
        const sent = await sendGiftCardActivatedEmail({
          toEmail: order.customerEmail,
          giftCardCode: giftCardItems[0].code,
          amount: giftCardItems[0].price,
          lang,
        });

        if (!sent) return { ok: false, failed: "email" };
      }

      return { ok: true };
    }

    if (order?.customerEmail) {
      const sent = await sendShippingUpdateEmail({
        toEmail: order.customerEmail,
        orderId: order.id,
        stageIndex: 0,
        lang,
      });

      if (!sent) return { ok: false, failed: "email" };
    }

    return { ok: true };
  }

  /**
   * Rejects an order: records the decision, voids any gift card in it, and
   * tells the customer. Reports its outcome the same way as approval.
   *
   * @param {string} orderDocId - Firestore document id of the order.
   * @returns {Promise<{ok: boolean, failed?: string}>} What succeeded.
   *          `failed` is "write", "giftCard" or "email".
   */
  async function handleRejectOrder(orderDocId) {
    const order = orders.find((o) => o.docId === orderDocId);
    const giftCardItems = (order?.items || []).filter((item) => item.isGiftCard);

    setOrders((prevOrders) =>
      prevOrders.map((o) =>
        o.docId === orderDocId ? { ...o, rejected: true } : o
      )
    );

    try {
      await rejectOrder(orderDocId);
    } catch (err) {
      console.error(`Order not rejected: ${err.message}`);

      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.docId === orderDocId ? { ...o, rejected: false } : o
        )
      );

      return { ok: false, failed: "write" };
    }

    if (giftCardItems.length > 0) {
      let cardFailed = false;

      for (const item of giftCardItems) {
        try {
          await rejectGiftCard(item.code);
        } catch (err) {
          console.error(`Gift card ${item.code} not voided: ${err.message}`);
          cardFailed = true;
        }
      }

      if (cardFailed) return { ok: false, failed: "giftCard" };

      if (order?.customerEmail) {
        const sent = await sendGiftCardRejectedEmail({
          toEmail: order.customerEmail,
          lang,
        });

        if (!sent) return { ok: false, failed: "email" };
      }

      return { ok: true };
    }

    if (order?.customerEmail) {
      const sent = await sendOrderRejectedEmail({
        toEmail: order.customerEmail,
        orderId: order.id,
        lang,
      });

      if (!sent) return { ok: false, failed: "email" };
    }

    return { ok: true };
  }

  function handleAdvanceOrderStage(orderDocId, nextIndex, isPickup = false) {
    advanceOrderStatus(orderDocId, nextIndex, isPickup);

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.docId === orderDocId ? { ...order, stageIndex: nextIndex } : order
      )
    );

    const order = orders.find((o) => o.docId === orderDocId);
    if (order?.customerEmail) {
      sendShippingUpdateEmail({
        toEmail: order.customerEmail,
        orderId: order.id,
        stageIndex: nextIndex,
        isPickup,
        lang,
      });
    }
  }

  /**
   * Reflects a translation the historical sweep has just written to Firestore.
   * The sweep owns the writing; this only keeps the copy on screen in step.
   */
  function applyOrderTranslation(orderDocId, { items, customerEmbedded }) {
    setOrders((prev) =>
      prev.map((o) =>
        o.docId === orderDocId ? { ...o, items, customerEmbedded } : o
      )
    );
  }

  return {
    orders,
    ordersLoading,
    pendingOrdersCount,
    pendingDeliveriesCount,
    receipts,
    handleConfirmOrder,
    handleRejectOrder,
    handleAdvanceOrderStage,
    applyOrderTranslation,
  };
}
