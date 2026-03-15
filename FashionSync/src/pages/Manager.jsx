import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginOverlay from "../components/manager/LoginOverlay";
import ManagerSidebar from "../components/manager/ManagerSidebar";
import ManagerTopbar from "../components/manager/ManagerTopbar";
import DetailsModal from "../components/manager/modals/DetailsModal";

import OverviewView from "../components/manager/views/OverviewView";
import AddProductModal from "../components/manager/modals/AddProductModal";
import InventoryView from "../components/manager/views/InventoryView";
import AlertsView from "../components/manager/views/AlertsView";
import TasksView from "../components/manager/views/TasksView";
import ReceiptsView from "../components/manager/views/ReceiptsView";
import AnalyticsView from "../components/manager/views/AnalyticsView";
import SettingsView from "../components/manager/views/SettingsView";

import styles from "../styles/Manager.module.scss";

const INITIAL_PRODUCTS = [
  {
    code: "FS-001",
    name: "חולצת לינן קלאסית",
    gender: "גברים",
    cat: "חולצות",
    stock: 12,
    price: 189,
    minStock: 10,
    notifyCount: 0,
    trending: true,
    bestseller: false,
    desc: "חולצת לינן איכותית ונוחה.",
    salesLastMonth: 0,
    img: "https://img.kwcdn.com/product/fancy/c61fb9bc-58ae-40c5-bd3e-b99ba62d5b9b.jpg?imageMogr2/auto-orient%7CimageView2/2/w/800/q/70/format/webp",
    variants: [
      { colorName: "לבן", colorHex: "#f6f6f6", sizes: { S: 3, M: 4, L: 3, XL: 2 } },
      { colorName: "שחור", colorHex: "#111111", sizes: { S: 1, M: 3, L: 2, XL: 1 } },
    ],
  },
  {
    code: "FS-002",
    name: "ג'ינס סלים פיט",
    gender: "גברים",
    cat: "מכנסיים",
    stock: 3,
    price: 349,
    minStock: 10,
    notifyCount: 4,
    trending: false,
    bestseller: true,
    desc: "ג'ינס כהה.",
    salesLastMonth: 1,
    img: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400",
    variants: [
      { colorName: "כחול כהה", colorHex: "#1f3a6b", sizes: { 28: 1, 30: 1, 32: 1, 34: 0 } },
      { colorName: "שחור", colorHex: "#111111", sizes: { 28: 0, 30: 1, 32: 0, 34: 0 } },
    ],
  },
  {
    code: "FS-003",
    name: "שמלת קיץ פרחונית",
    gender: "נשים",
    cat: "שמלות",
    stock: 0,
    price: 279,
    minStock: 10,
    notifyCount: 8,
    trending: true,
    bestseller: true,
    desc: "שמלה קיצית קלילה.",
    salesLastMonth: 0,
    img: "https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=400",
    variants: [
      { colorName: "ירוק", colorHex: "#2e8b57", sizes: { XS: 0, S: 0, M: 0, L: 0 } },
      { colorName: "ורוד", colorHex: "#d85b8a", sizes: { XS: 0, S: 0, M: 0, L: 0 } },
    ],
  },
  {
    code: "FS-004",
    name: "ז'קט עור שחור",
    gender: "נשים",
    cat: "עליוניות",
    stock: 2,
    price: 699,
    minStock: 10,
    notifyCount: 2,
    trending: false,
    bestseller: false,
    desc: "ז'קט עור קלאסי.",
    salesLastMonth: 2,
    img: "https://xcdn.next.co.uk/common/items/default/default/itemimages/3_4Ratio/product/lge/103395s5.jpg?im=Resize,width=400",
    variants: [
      { colorName: "שחור", colorHex: "#111111", sizes: { XS: 0, S: 1, M: 1, L: 0, XL: 0 } },
      { colorName: "חום", colorHex: "#6b3f2a", sizes: { XS: 0, S: 0, M: 1, L: 0, XL: 0 } },
    ],
  },
  {
    code: "FS-005",
    name: "חולצת טי בייסיק",
    gender: "נשים",
    cat: "חולצות",
    stock: 20,
    price: 99,
    minStock: 10,
    notifyCount: 0,
    trending: false,
    bestseller: true,
    desc: "חולצת טי נוחה.",
    salesLastMonth: 15,
    img: "https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400",
    variants: [
      { colorName: "לבן", colorHex: "#f6f6f6", sizes: { XS: 3, S: 5, M: 6, L: 4, XL: 2 } },
      { colorName: "שחור", colorHex: "#111111", sizes: { XS: 2, S: 3, M: 4, L: 2, XL: 1 } },
    ],
  },
  {
    code: "FS-006",
    name: "שמלת ערב אלגנטית",
    gender: "נשים",
    cat: "שמלות",
    stock: 0,
    price: 599,
    minStock: 10,
    notifyCount: 11,
    trending: true,
    bestseller: false,
    desc: "שמלת ערב ארוכה.",
    salesLastMonth: 0,
    img: "https://images.pexels.com/photos/1755428/pexels-photo-1755428.jpeg?auto=compress&cs=tinysrgb&w=400",
    variants: [
      { colorName: "שמפניה", colorHex: "#d9c5a3", sizes: { XS: 0, S: 0, M: 0, L: 0 } },
      { colorName: "שחור", colorHex: "#111111", sizes: { XS: 0, S: 0, M: 0, L: 0 } },
    ],
  },
  {
    code: "FS-007",
    name: "עליונית פוטר חמה",
    gender: "גברים",
    cat: "עליוניות",
    stock: 5,
    price: 459,
    minStock: 10,
    notifyCount: 0,
    trending: false,
    bestseller: false,
    desc: "פוטר חם ונוח.",
    salesLastMonth: 0,
    img: "https://images.pexels.com/photos/6311600/pexels-photo-6311600.jpeg?auto=compress&cs=tinysrgb&w=400",
    variants: [
      { colorName: "אפור", colorHex: "#7b7f87", sizes: { S: 1, M: 2, L: 2, XL: 0 } },
      { colorName: "שחור", colorHex: "#111111", sizes: { S: 0, M: 1, L: 1, XL: 0 } },
    ],
  },
  {
    code: "FS-008",
    name: "מכנסי טרנינג נוח",
    gender: "גברים",
    cat: "מכנסיים",
    stock: 0,
    price: 219,
    minStock: 10,
    notifyCount: 11,
    trending: false,
    bestseller: true,
    desc: "מכנסי טרנינג רחבים.",
    salesLastMonth: 1,
    img: "https://www.delta.co.il/pub/media/catalog/product/cache/f3dca7ff1d37a6b21edba38be76bc1a9/l/n/LN00956_LM05H_3-1754217257726666.jpg",
    variants: [
      { colorName: "שחור", colorHex: "#111111", sizes: { S: 0, M: 0, L: 0, XL: 0 } },
      { colorName: "ירוק זית", colorHex: "#556b2f", sizes: { S: 0, M: 0, L: 0, XL: 0 } },
    ],
  },
  {
    code: "FS-009",
    name: "חולצת מכופתרת קלאסית",
    gender: "גברים",
    cat: "חולצות",
    stock: 6,
    price: 229,
    minStock: 10,
    notifyCount: 0,
    trending: true,
    bestseller: false,
    desc: "מכופתרת אלגנטית.",
    salesLastMonth: 0,
    img: "https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=400",
    variants: [
      { colorName: "לבן", colorHex: "#f6f6f6", sizes: { S: 1, M: 2, L: 2, XL: 1 } },
      { colorName: "תכלת", colorHex: "#6aa7ff", sizes: { S: 0, M: 1, L: 1, XL: 0 } },
    ],
  },
  {
    code: "FS-010",
    name: "חצאית מידי אלגנטית",
    gender: "נשים",
    cat: "שמלות",
    stock: 8,
    price: 199,
    minStock: 10,
    notifyCount: 0,
    trending: true,
    bestseller: true,
    desc: "חצאית מידי מחמיאה.",
    salesLastMonth: 2,
    img: "https://nitedress.co.il/wp-content/uploads/2021/03/41656-d8640c.jpeg",
    variants: [
      { colorName: "שחור", colorHex: "#111111", sizes: { XS: 1, S: 2, M: 3, L: 2 } },
      { colorName: "בז", colorHex: "#d2b48c", sizes: { XS: 0, S: 1, M: 1, L: 0 } },
    ],
  },
];

const TITLES = {
  overview: "סקירה כללית",
  inventory: "ניהול מלאי",
  alerts: "התראות",
  tasks: "משימות לעובדים",
  receipts: "קבלות מכירה",
  analytics: "אנליטיקה",
  settings: "הגדרות",
};

const DEFAULT_TASKS = [];

function createAlerts(products) {
  const alerts = [];

  products.forEach((p) => {
    if (p.stock === 0) {
      alerts.push({
        key: `oos_${p.code}`,
        type: "danger",
        code: p.code,
        title: "🚫 המוצר אזל מהמלאי",
        msg: p.name,
        createdAt: Date.now(),
      });
    }

    if (p.stock > 0 && p.stock <= p.minStock) {
      alerts.push({
        key: `low_${p.code}`,
        type: "warn",
        code: p.code,
        title: "⚠️ מלאי נמוך",
        msg: `${p.name} — נותרו ${p.stock} יח׳`,
        createdAt: Date.now(),
      });
    }

    if (p.notifyCount > 15) {
      alerts.push({
        key: `demand_${p.code}`,
        type: "info",
        code: p.code,
        title: "🔥 ביקושים גבוהים",
        msg: `${p.name} — נרשמו ${p.notifyCount} בקשות`,
        demandCount: p.notifyCount,
        isDemand: true,
        createdAt: Date.now(),
      });
    }
  });

  return alerts;
}

function buildReceipts(products) {
  const p0 = products[0];
  const p1 = products[1];
  const p3 = products[3];
  const p4 = products[4];

  return [
    {
      id: "RCP-1000001",
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      items: [
        { code: p0.code, name: p0.name, price: p0.price, qty: 2, img: p0.img },
        { code: p4.code, name: p4.name, price: p4.price, qty: 1, img: p4.img },
      ],
      total: p0.price * 2 + p4.price,
    },
    {
      id: "RCP-1000002",
      date: new Date(Date.now() - 86400000).toISOString(),
      items: [{ code: p1.code, name: p1.name, price: p1.price, qty: 1, img: p1.img }],
      total: p1.price,
    },
    {
      id: "RCP-1000003",
      date: new Date(Date.now() - 3600000).toISOString(),
      items: [
        { code: p3.code, name: p3.name, price: p3.price, qty: 1, img: p3.img },
        { code: p4.code, name: p4.name, price: p4.price, qty: 3, img: p4.img },
      ],
      total: p3.price + p4.price * 3,
    },
  ];
}

export default function Manager() {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [theme, setTheme] = useState("dark");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [tasks, setTasks] = useState(DEFAULT_TASKS);

  const alerts = useMemo(() => createAlerts(products), [products]);
  const receipts = useMemo(() => buildReceipts(products), [products]);

  const pageTitle = TITLES[activeView] || "מנהל ראשי";

  const stats = useMemo(() => {
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const lowCount = products.filter(
      (p) => p.stock === 0 || (p.stock > 0 && p.stock <= p.minStock)
    ).length;
    const demandCount = products.filter((p) => p.notifyCount > 15).length;
    const sales = receipts.reduce((sum, r) => sum + r.total, 0);

    return {
      totalStock,
      lowCount,
      demandCount,
      sales,
      productCount: products.length,
      receiptCount: receipts.length,
    };
  }, [products, receipts]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    if (!window.confirm("להתנתק?")) return;
    setIsLoggedIn(false);
    setActiveView("overview");
    setGlobalSearch("");
  };

  const handleGoHome = () => {
    if (!window.confirm("לחזור לדף הבית?")) return;
    navigate("/");
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleAddTask = (newTask) => {
    setTasks((prev) => [{ ...newTask, id: `MT-${Date.now()}` }, ...prev]);
  };

  const handleDeleteTask = (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const handleClearTasks = () => {
    if (!window.confirm("למחוק את כל המשימות?")) return;
    setTasks([]);
  };

  const filteredProducts = useMemo(() => {
    if (!globalSearch.trim()) return products;
    const q = globalSearch.trim();
    return products.filter(
      (p) => p.name.includes(q) || p.code.includes(q) || p.cat.includes(q)
    );
  }, [products, globalSearch]);

  const shellClassName = `${styles.appShell} ${theme === "light" ? styles.light : ""}`;

  if (!isLoggedIn) {
    return <LoginOverlay onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={shellClassName}>
      <ManagerSidebar
        activeView={activeView}
        onChangeView={(view) => {
          setActiveView(view);
          setMobileSidebarOpen(false);
        }}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        onToggleTheme={handleToggleTheme}
        theme={theme}
        alertCount={alerts.length}
        taskCount={tasks.length}
        mobileOpen={mobileSidebarOpen}
      />

      {mobileSidebarOpen && (
        <div
          className={styles.mobOverlay}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className={styles.mainWrap}>
        <ManagerTopbar
          title={pageTitle}
          globalSearch={globalSearch}
          onGlobalSearchChange={setGlobalSearch}
          onRefresh={() => window.location.reload()}
          onAddProductClick={() => setIsAddProductOpen(true)}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <div className={styles.content}>
          {activeView === "overview" && (
            <OverviewView
              stats={stats}
              alerts={alerts}
              products={products}
              receipts={receipts}
              onOpenAlerts={() => setActiveView("alerts")}
            />
          )}

          {activeView === "inventory" && (
            <InventoryView
              products={filteredProducts}
              onOpenDetails={(product) => {
                setSelectedProduct(product);
                setIsDetailsOpen(true);
              }}
            />

          )}

          {activeView === "alerts" && (
            <AlertsView alerts={alerts} products={products} />
          )}

          {activeView === "tasks" && (
            <TasksView
              tasks={tasks}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onClearTasks={handleClearTasks}
            />
          )}

          {activeView === "receipts" && (
            <ReceiptsView receipts={receipts} />
          )}

          {activeView === "analytics" && <AnalyticsView />}

          {activeView === "settings" && <SettingsView />}
        </div>
      </div>
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSubmit={(newProduct) => {
          setProducts((prev) => [...prev, newProduct]);
        }}
      />
      <DetailsModal
        isOpen={isDetailsOpen}
        product={selectedProduct}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedProduct(null);
        }}
        onSave={(updatedProduct) => {
          setProducts((prev) =>
            prev.map((p) =>
              p.code === updatedProduct.code ? updatedProduct : p
            )
          );
          setIsDetailsOpen(false);
          setSelectedProduct(null);
        }}
      />


    </div>
  );
}
