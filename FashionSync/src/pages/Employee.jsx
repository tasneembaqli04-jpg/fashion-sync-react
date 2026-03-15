import { useEffect, useMemo, useState } from "react";
import EmployeeLogin from "../components/employee/EmployeeLogin";
import EmployeeTopbar from "../components/employee/EmployeeTopbar";
import EmployeeSidebar from "../components/employee/EmployeeSidebar";
import EmployeeOverview from "../components/employee/EmployeeOverview";
import EmployeeTasks from "../components/employee/EmployeeTasks";
import EmployeeSell from "../components/employee/EmployeeSell";
import EmployeeInventory from "../components/employee/EmployeeInventory";
import EmployeeOrders from "../components/employee/EmployeeOrders";
import EmployeeHistory from "../components/employee/EmployeeHistory";
import NotificationBar from "../components/employee/NotificationBar";
import ConfirmDialog from "../components/employee/ConfirmDialog";
import NewProductModal from "../components/employee/NewProductModal";
import StockEditModal from "../components/employee/StockEditModal";
import ScanModal from "../components/employee/ScanModal";

import { PRODUCTS_SEED } from "../data/products";

export default function Employee() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePanel, setActivePanel] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [sellItems, setSellItems] = useState([]);
  const [inventorySearch, setInventorySearch] = useState("");

  const [tasks, setTasks] = useState([
    {
      id: "T1",
      title: "לבדוק מלאי של חולצות קיץ",
      desc: "לעבור על פריטים עם מלאי נמוך",
      icon: "📦",
      done: false,
      seen: false,
    },
    {
      id: "T2",
      title: "להכין הזמנה ללקוח",
      desc: "הזמנה שממתינה בדלפק",
      icon: "📋",
      done: false,
      seen: false,
    },
  ]);

  const [orders, setOrders] = useState([
    {
      id: "ORD-0001",
      customer: "מיכל כהן",
      status: "pending",
      items: [
        {
          name: "שמלת קיץ פרחונית",
          img: "https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=800",
          size: "M",
          qty: 1,
          price: 279,
        },
      ],
    },
    {
      id: "ORD-0002",
      customer: "יוסי אברהם",
      status: "ready",
      items: [
        {
          name: "ג'ינס סלים פיט",
          img: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=800",
          size: "32",
          qty: 1,
          price: 349,
        },
      ],
    },
  ]);

  const [history, setHistory] = useState([]);
  const [notification, setNotification] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isStockEditOpen, setIsStockEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState("inventory");

  useEffect(() => {
    setProducts(PRODUCTS_SEED);
  }, []);

  function showNotification(text, type = "info", icon = "ℹ️") {
    setNotification({ text, type, icon });

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  }

  function handleLogin(user) {
    setCurrentUser(user);
    showNotification(`ברוך הבא, ${user.name}!`, "success", "✅");
  }

  function handleLogout() {
    setCurrentUser(null);
    setActivePanel("overview");
    setSellItems([]);
    setIsSidebarOpen(false);
  }

  function handleShowPanel(panel) {
    setActivePanel(panel);
    setIsSidebarOpen(false);
  }

  function handleToggleTheme() {
    document.body.dataset.theme =
      document.body.dataset.theme === "light" ? "dark" : "light";
  }

  function handleRefresh() {
    setProducts([...products]);
    showNotification("הדף עודכן", "info", "🔄");
  }

  function addHistory(text) {
    setHistory((prev) => [
      {
        id: Date.now().toString(),
        text,
      },
      ...prev,
    ]);
  }

  function handleAddSell(code) {
    const found = products.find(
      (p) => p.code.toUpperCase() === code.trim().toUpperCase()
    );

    if (!found) {
      showNotification("מוצר לא נמצא", "error", "❌");
      return;
    }

    if (found.stock <= 0) {
      showNotification("המוצר אזל מהמלאי", "error", "⚠️");
      return;
    }

    setSellItems((prev) => {
      const existing = prev.find((item) => item.code === found.code);

      if (existing) {
        return prev.map((item) =>
          item.code === found.code ? { ...item, qty: item.qty + 1 } : item
        );
      }

      return [...prev, { ...found, qty: 1 }];
    });
  }

  function handleChangeSellQty(code, delta) {
    setSellItems((prev) =>
      prev
        .map((item) =>
          item.code === code ? { ...item, qty: item.qty + delta } : item
        )
        .filter((item) => item.qty > 0)
    );
  }

  function handleRemoveSellItem(code) {
    setSellItems((prev) => prev.filter((item) => item.code !== code));
  }

  function handleCompleteSell() {
    if (!sellItems.length) return;

    const total = sellItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        const sold = sellItems.find((item) => item.code === product.code);
        if (!sold) return product;

        return {
          ...product,
          stock: Math.max(0, product.stock - sold.qty),
        };
      })
    );

    addHistory(`מכירה הושלמה — ₪${total}`);
    setSellItems([]);
    showNotification("המכירה הושלמה", "success", "✅");
  }

  function handleCompleteTask(taskId) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, done: true } : task
      )
    );
    showNotification("המשימה הושלמה", "success", "✅");
  }

  function handleMarkSeen(taskId) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, seen: true } : task
      )
    );
    showNotification("אישור קבלה נשלח", "success", "📬");
  }

  function handleToggleOrderReady(orderId) {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: order.status === "ready" ? "pending" : "ready",
            }
          : order
      )
    );
  }

  function handleSaveNewProduct(form) {
    if (!form.name.trim()) {
      showNotification("נדרש שם פריט", "error", "❌");
      return;
    }

    const newProduct = {
      code: form.code || `FS-${String(products.length + 1).padStart(3, "0")}`,
      name: form.name,
      cat: form.cat,
      gender: form.gender,
      stock: Number(form.qty) || 0,
      price: Number(form.price) || 0,
      desc: form.desc,
      img:
        form.img ||
        "https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=800",
      season: "all",
      colors: ["שחור", "לבן"],
      sizes: ["S", "M", "L", "XL"],
    };

    setProducts((prev) => [...prev, newProduct]);
    setIsNewProductOpen(false);
    addHistory(`נוסף מוצר חדש — ${newProduct.name}`);
    showNotification("המוצר נוסף", "success", "✅");
  }

  function handleOpenStockEdit(product) {
    setEditingProduct(product);
    setIsStockEditOpen(true);
  }

  function handleSaveStockEdit(code, newStock) {
    setProducts((prev) =>
      prev.map((product) =>
        product.code === code ? { ...product, stock: newStock } : product
      )
    );

    setIsStockEditOpen(false);
    setEditingProduct(null);
    addHistory(`עודכן מלאי עבור ${code}`);
    showNotification("המלאי עודכן", "success", "✅");
  }

  function handleOpenScan(target) {
    setScanTarget(target);
    setIsScanOpen(true);
  }

  function handleApplyScanCode(code, target) {
    const found = products.find(
      (p) => p.code.toUpperCase() === code.trim().toUpperCase()
    );

    if (!found) {
      showNotification("מוצר לא נמצא", "error", "❌");
      return;
    }

    if (target === "sell") {
      handleAddSell(code);
    } else {
      showNotification(`נסרק: ${found.name}`, "success", "✅");
    }

    setIsScanOpen(false);
  }

  const tasksCount = useMemo(
    () => tasks.filter((task) => !task.done).length,
    [tasks]
  );

  const ordersCount = useMemo(
    () => orders.filter((order) => order.status === "pending").length,
    [orders]
  );

  if (!currentUser) {
    return <EmployeeLogin onLogin={handleLogin} />;
  }

  return (
    <>
      <NotificationBar
        notification={notification}
        onClose={() => setNotification(null)}
      />

      <ConfirmDialog
        confirmData={confirmData}
        onCancel={() => setConfirmData(null)}
        onConfirm={() => {
          if (confirmData?.onConfirm) confirmData.onConfirm();
          setConfirmData(null);
        }}
      />

      <EmployeeTopbar
        currentUser={currentUser}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onShowPanel={handleShowPanel}
        onOpenScan={handleOpenScan}
        onOpenNewProduct={() => setIsNewProductOpen(true)}
        onRefresh={handleRefresh}
      />

      <div className="app-body">
        <EmployeeSidebar
          currentUser={currentUser}
          activePanel={activePanel}
          isSidebarOpen={isSidebarOpen}
          onShowPanel={handleShowPanel}
          onToggleTheme={handleToggleTheme}
          onLogout={handleLogout}
          onCloseSidebar={() => setIsSidebarOpen(false)}
          tasksCount={tasksCount}
          ordersCount={ordersCount}
        />

        <main className="main visible">
          {activePanel === "overview" && (
            <EmployeeOverview
              currentUser={currentUser}
              products={products}
              tasks={tasks.filter((task) => !task.done)}
              history={history}
              onShowPanel={handleShowPanel}
            />
          )}

          {activePanel === "tasks" && (
            <EmployeeTasks
              tasks={tasks}
              onCompleteTask={handleCompleteTask}
              onMarkSeen={handleMarkSeen}
            />
          )}

          {activePanel === "sell" && (
            <EmployeeSell
              sellItems={sellItems}
              onAddSell={handleAddSell}
              onChangeSellQty={handleChangeSellQty}
              onRemoveSellItem={handleRemoveSellItem}
              onCompleteSell={handleCompleteSell}
              onOpenScan={handleOpenScan}
            />
          )}

          {activePanel === "inventory" && (
            <EmployeeInventory
              products={products}
              inventorySearch={inventorySearch}
              onChangeSearch={setInventorySearch}
              onOpenScan={handleOpenScan}
              onOpenNewProduct={() => setIsNewProductOpen(true)}
              onOpenStockEdit={handleOpenStockEdit}
            />
          )}

          {activePanel === "orders" && (
            <EmployeeOrders
              orders={orders}
              onToggleOrderReady={handleToggleOrderReady}
            />
          )}

          {activePanel === "history" && <EmployeeHistory history={history} />}
        </main>
      </div>

      <NewProductModal
        isOpen={isNewProductOpen}
        onClose={() => setIsNewProductOpen(false)}
        onSave={handleSaveNewProduct}
      />

      <StockEditModal
        isOpen={isStockEditOpen}
        product={editingProduct}
        onClose={() => {
          setIsStockEditOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveStockEdit}
      />

      <ScanModal
        isOpen={isScanOpen}
        scanTarget={scanTarget}
        onClose={() => setIsScanOpen(false)}
        onApplyCode={handleApplyScanCode}
      />
    </>
  );
}
