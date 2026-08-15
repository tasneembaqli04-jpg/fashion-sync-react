import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../translations/LanguageProvider";
import { useDialog } from "../components/common/DialogProvider";
import { getOrdersByUser, cancelOrder } from "../services/orders/ordersService";
import { restockOrderItems } from "../services/products/productsService";
import { sendOrderCancellationEmail } from "../services/email/emailService";
import {
  requestReturn,
  markReturnSeenByCustomer,
  subscribeToReturnRequestsByUser,
} from "../services/returns/returnsService";

/**
 * Holds the customer's order history and the returns raised against it.
 *
 * The two belong together because a return is always about a line in an
 * order, and the orders screen shows both: an order's own status, and the
 * status of any return requested from it.
 *
 * They arrive differently, though. Orders are fetched once per visit to the
 * screen, since an order changes only when the customer or the manager acts
 * on it. Return requests are subscribed to, because the manager approves or
 * rejects them while the customer is looking at the screen, and the decision
 * has to appear without a reload.
 *
 * Both reset when the customer signs out, so one customer's history cannot be
 * left on screen for the next.
 *
 * @param {object} options - What the hook needs from the page.
 * @param {object|null} options.currentUser - Signed-in customer, or null.
 * @param {string} options.activePanel - Panel on show; revisiting refetches orders.
 * @returns {object} Order and return state, and the actions the screen binds to.
 */
export function useCustomerOrders({ currentUser, activePanel }) {
  const { t: dict, lang } = useLanguage();
  const { confirmDialog, alertDialog } = useDialog();

  const [orders, setOrders] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [returnModalOrder, setReturnModalOrder] = useState(null);

  useEffect(() => {
    if (!currentUser?.email) {
      setOrders([]);
      setReturnRequests([]);
      return;
    }

    let cancelled = false;

    getOrdersByUser(currentUser.email).then((userOrders) => {
      if (!cancelled) {
        // Newest first: the screen reads top-down and the recent order is the
        // one the customer came to check.
        setOrders(userOrders.slice().reverse());
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentUser, activePanel]);

  useEffect(() => {
    if (!currentUser?.email) {
      setReturnRequests([]);
      return;
    }

    const unsubscribe = subscribeToReturnRequestsByUser(
      currentUser.email,
      setReturnRequests,
    );

    return () => unsubscribe();
  }, [currentUser]);

  // A return the manager has decided on that the customer has not looked at
  // yet. Counted into the orders badge so the decision is noticed.
  const unseenReturnUpdates = useMemo(() => {
    return returnRequests.filter(
      (r) => r.status !== "pending" && !r.seenByCustomer,
    );
  }, [returnRequests]);

  // Status 3 is delivered, so anything below it is still on its way.
  const activeOrdersCount = useMemo(
    () => orders.filter((o) => (Number(o.status) || 0) < 3).length,
    [orders],
  );

  function updateOrder(docId, updates) {
    setOrders((prev) =>
      prev.map((o) => (o.docId === docId ? { ...o, ...updates } : o)),
    );
  }

  async function handleCancelOrder(order) {
    const confirmed = await confirmDialog(
      dict.customer.orders.confirmCancelOrder,
    );
    if (!confirmed) return;

    await cancelOrder(order.docId);
    await restockOrderItems(order.items);

    setOrders((prev) =>
      prev.map((o) =>
        o.docId === order.docId ? { ...o, cancelled: true } : o,
      ),
    );
    sendOrderCancellationEmail({
      toEmail: order.customerEmail || currentUser?.email || "",
      orderId: order.id,
      total: order.total,
      lang,
    });

    alertDialog(dict.customer.orders.cancelSuccess);
  }

  async function dismissReturnUpdate(id) {
    await markReturnSeenByCustomer(id);
    setReturnRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, seenByCustomer: true } : r)),
    );
  }

  function openReturnRequestModal(order) {
    setReturnModalOrder(order);
  }

  function closeReturnRequestModal() {
    setReturnModalOrder(null);
  }

  async function submitReturnRequest({ item, reason, reasonKey, note }) {
    if (!returnModalOrder || !item) return;

    await requestReturn({
      orderDocId: returnModalOrder.docId,
      orderId: returnModalOrder.id,
      itemCode: item.code,
      itemName: item.name,
      itemNameEn: item.nameEn || "",
      itemImg: item.img,
      qty: item.qty,
      color: item.color,
      size: item.size,
      price: item.price,
      customerEmail: currentUser?.email || "",
      customerName: currentUser?.name || "",
      reason,
      reasonKey,
      note,
    });

    closeReturnRequestModal();
    alertDialog(dict.customer.returns.submitSuccess);
  }

  return {
    orders,
    returnRequests,
    returnModalOrder,
    unseenReturnUpdates,
    activeOrdersCount,
    updateOrder,
    handleCancelOrder,
    dismissReturnUpdate,
    openReturnRequestModal,
    closeReturnRequestModal,
    submitReturnRequest,
  };
}
