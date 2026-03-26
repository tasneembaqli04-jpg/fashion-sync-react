import EmployeeDeliveries from "../components/employee/EmployeeDeliveries";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import layoutStyles from "../styles/employee/EmployeeLayout.module.scss";

export default function Employee() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activePanel, setActivePanel] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [products, setProducts] = useState(PRODUCTS_SEED);
  const [sellItems, setSellItems] = useState([]);
  const [inventorySearch, setInventorySearch] = useState("");

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("fs_tasks");
    if (saved) return JSON.parse(saved);
    return [
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
    ];
  });

  const [deliveries, setDeliveries] = useState(() => {
    const saved = localStorage.getItem("fs_deliveries");
    return saved ? JSON.parse(saved) : [];
  });

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

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("fs_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [notification, setNotification] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isStockEditOpen, setIsStockEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState("inventory");
  const [scannedCode, setScannedCode] = useState("");
  const featuredProduct = useMemo(() => {
    const code = localStorage.getItem("featuredProductCode");
    if (!code) return null;
    return products.find((p) => p.code === code) || null;
  }, [products]);

  useEffect(() => {
    const saved = localStorage.getItem("fs_theme");
    if (saved === "light") {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
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
    navigate("/");
  }

  function handleShowPanel(panel) {
    setActivePanel(panel);
    setIsSidebarOpen(false);
  }

  function handleToggleTheme() {
    const isLight = document.body.classList.toggle("light");
    localStorage.setItem("fs_theme", isLight ? "light" : "dark");
  }
  function handleRefresh() {
    setProducts([...products]);
    showNotification("הדף עודכן", "info", "🔄");
  }

  function addHistory(text) {
    setHistory((prev) => {
      const updated = [{ id: Date.now().toString(), text }, ...prev].slice(
        0,
        50,
      );
      localStorage.setItem("fs_history", JSON.stringify(updated));
      return updated;
    });
  }

  function handleAddSell(code) {
    const found = products.find(
      (p) => p.code.toUpperCase() === code.trim().toUpperCase(),
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
          item.code === found.code ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      return [...prev, { ...found, qty: 1 }];
    });
  }

  function handleChangeSellQty(code, delta) {
    setSellItems((prev) =>
      prev
        .map((item) =>
          item.code === code ? { ...item, qty: item.qty + delta } : item,
        )
        .filter((item) => item.qty > 0),
    );
  }

  function handleRemoveSellItem(code) {
    setSellItems((prev) => prev.filter((item) => item.code !== code));
  }

  function handleCompleteSell() {
    if (!sellItems.length) return;

    const total = sellItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0,
    );

    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        const sold = sellItems.find((item) => item.code === product.code);
        if (!sold) return product;
        return {
          ...product,
          stock: Math.max(0, product.stock - sold.qty),
        };
      }),
    );

    addHistory(`מכירה הושלמה — ₪${total}`);
    setSellItems([]);
    showNotification("המכירה הושלמה", "success", "✅");
  }

  function handleCompleteTask(taskId) {
    setTasks((prev) => {
      const updated = prev.map((task) =>
        task.id === taskId ? { ...task, done: true } : task,
      );
      localStorage.setItem("fs_tasks", JSON.stringify(updated));
      return updated;
    });
    showNotification("המשימה הושלמה", "success", "✅");
  }

  function handleMarkSeen(taskId) {
    setTasks((prev) => {
      const updated = prev.map((task) =>
        task.id === taskId ? { ...task, seen: true } : task,
      );
      localStorage.setItem("fs_tasks", JSON.stringify(updated));
      return updated;
    });
    showNotification("אישור קבלה נשלח", "success", "📬");
  }

  function handleToggleOrderReady(orderId) {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const newStatus = order.status === "ready" ? "pending" : "ready";
        if (newStatus === "ready") {
          const delivery = {
            id: `DEL-${Date.now()}`,
            orderId: order.id,
            customer: order.customer,
            items: order.items,
            status: "waiting",
            createdAt: Date.now(),
          };
          setDeliveries((prev) => {
            const updated = [delivery, ...prev];
            localStorage.setItem("fs_deliveries", JSON.stringify(updated));
            return updated;
          });
        }
        return { ...order, status: newStatus };
      }),
    );
  }

  function handleUpdateDeliveryStatus(deliveryId, newStatus) {
    setDeliveries((prev) => {
      const updated = prev.map((d) =>
        d.id === deliveryId ? { ...d, status: newStatus } : d,
      );
      localStorage.setItem("fs_deliveries", JSON.stringify(updated));
      return updated;
    });
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
      season: form.season || "all",
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
        product.code === code ? { ...product, stock: newStock } : product,
      ),
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
    if (target === "sell") {
      handleAddSell(code);
      setIsScanOpen(false);
    } else if (target === "code") {
      setScannedCode(code);
      setIsScanOpen(false);
    } else {
      const found = products.find(
        (p) => p.code.toUpperCase() === code.trim().toUpperCase(),
      );
      if (!found) {
        showNotification("מוצר לא נמצא", "error", "❌");
      } else {
        showNotification(`נסרק: ${found.name}`, "success", "✅");
      }
      setIsScanOpen(false);
    }
  }

  const tasksCount = useMemo(
    () => tasks.filter((task) => !task.done).length,
    [tasks],
  );

  const ordersCount = useMemo(
    () => orders.filter((order) => order.status === "pending").length,
    [orders],
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

      <div className={layoutStyles.appBody}>
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

        <main className={`${layoutStyles.main} ${layoutStyles.visible}`}>
          {activePanel === "overview" && (
            <EmployeeOverview
              currentUser={currentUser}
              products={products}
              tasks={tasks.filter((task) => !task.done)}
              history={history}
              onShowPanel={handleShowPanel}
              featuredProduct={featuredProduct}
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

          {activePanel === "deliveries" && (
            <EmployeeDeliveries
              deliveries={deliveries}
              onUpdateStatus={handleUpdateDeliveryStatus}
            />
          )}
        </main>
      </div>

      <NewProductModal
        isOpen={isNewProductOpen}
        onClose={() => {
          setIsNewProductOpen(false);
          setScannedCode("");
        }}
        onSave={handleSaveNewProduct}
        onOpenScanner={handleOpenScan}
        scannedCode={scannedCode}
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
