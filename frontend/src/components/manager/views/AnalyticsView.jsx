import { useMemo } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import overviewStyles from "../../../styles/manager/ManagerOverview.module.scss";
import { useLanguage } from "../../../translations/LanguageProvider";

function isSameMonth(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
}

export default function AnalyticsView({ orders = [], products = [] }) {
  const { t: dict } = useLanguage();
  const t = dict.manager.analytics;

  const stats = useMemo(() => {
    const realOrders = orders.filter(
      (o) =>
        !Array.isArray(o.items) ||
        !o.items.every((item) => item.isGiftCard)
    );

    const monthOrders = realOrders.filter((o) =>
      isSameMonth(o.date || o.createdAt)
    );

    const monthRevenue = monthOrders.reduce(
      (sum, o) => sum + (Number(o.total) || 0),
      0
    );
    const salesCount = monthOrders.length;
    const avgOrder = salesCount ? Math.round(monthRevenue / salesCount) : 0;

    let missingCostCount = 0;
    const monthExpenses = monthOrders.reduce((sum, order) => {
      const orderExpense = (order.items || []).reduce((itemSum, item) => {
        if (item.isGiftCard) return itemSum;

        const product = products.find((p) => p.code === item.code);
        const cost = Number(product?.cost) || 0;

        if (!product || !product.cost) {
          missingCostCount += 1;
        }

        return itemSum + cost * (Number(item.qty) || 0);
      }, 0);

      return sum + orderExpense;
    }, 0);

    const monthProfit = monthRevenue - monthExpenses;

    const categoryMap = {};
    monthOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        if (item.isGiftCard) return;
        const product = products.find((p) => p.code === item.code);
        const category = product?.cat || "אחר";
        const itemTotal = (Number(item.price) || 0) * (Number(item.qty) || 0);
        categoryMap[category] = (categoryMap[category] || 0) + itemTotal;
      });
    });

    const categorySales = Object.entries(categoryMap).sort(
      (a, b) => b[1] - a[1]
    );

    const maxCategorySale = Math.max(1, ...categorySales.map(([, v]) => v));

    const ordersByCustomer = {};
    realOrders.forEach((order) => {
      const email = order.customerEmail || "unknown";
      ordersByCustomer[email] = (ordersByCustomer[email] || 0) + 1;
    });

    const totalCustomers = Object.keys(ordersByCustomer).length;
    const repeatCustomers = Object.values(ordersByCustomer).filter(
      (c) => c > 1
    ).length;
    const repeatPct = totalCustomers
      ? Math.round((repeatCustomers / totalCustomers) * 100)
      : 0;

    return {
      monthRevenue,
      monthExpenses,
      monthProfit,
      missingCostCount,
      salesCount,
      avgOrder,
      categorySales,
      maxCategorySale,
      repeatPct,
    };
  }, [orders, products]);

  const categoryColors = [
    "var(--gold)",
    "var(--blue)",
    "var(--green)",
    "var(--purple)",
    "var(--orange)",
  ];

  return (
    <div className={layoutStyles.view}>
      <div className={layoutStyles.pageHd}>
        <div className={layoutStyles.phLeft}>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div className={overviewStyles.statsGrid}>
        <div className={`${overviewStyles.stat} ${overviewStyles.gold}`}>
          <div className={overviewStyles.statIcon}>📈</div>
          <div className={overviewStyles.statLabel}>{t.monthRevenue}</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--gold)" }}
          >
            ₪{stats.monthRevenue.toLocaleString()}
          </div>
        </div>

        <div className={`${overviewStyles.stat} ${overviewStyles.green}`}>
          <div className={overviewStyles.statIcon}>🛍️</div>
          <div className={overviewStyles.statLabel}>{t.monthSales}</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--green)" }}
          >
            {stats.salesCount}
          </div>
        </div>

        <div className={`${overviewStyles.stat} ${overviewStyles.blue}`}>
          <div className={overviewStyles.statIcon}>🔄</div>
          <div className={overviewStyles.statLabel}>{t.avgOrder}</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--blue)" }}
          >
            ₪{stats.avgOrder.toLocaleString()}
          </div>
        </div>

        <div className={`${overviewStyles.stat} ${overviewStyles.purple}`}>
          <div className={overviewStyles.statIcon}>👥</div>
          <div className={overviewStyles.statLabel}>{t.repeatCustomers}</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--purple)" }}
          >
            {stats.repeatPct}%
          </div>
        </div>

        <div className={`${overviewStyles.stat} ${overviewStyles.orange}`}>
          <div className={overviewStyles.statIcon}>📉</div>
          <div className={overviewStyles.statLabel}>{t.monthExpenses}</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--orange)" }}
          >
            ₪{stats.monthExpenses.toLocaleString()}
          </div>
        </div>

        <div className={`${overviewStyles.stat} ${overviewStyles.gold}`}>
          <div className={overviewStyles.statIcon}>💵</div>
          <div className={overviewStyles.statLabel}>{t.monthProfit}</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: stats.monthProfit >= 0 ? "var(--green)" : "var(--red)" }}
          >
            ₪{stats.monthProfit.toLocaleString()}
          </div>
        </div>
      </div>

      <div className={uiStyles.card}>
        <div className={uiStyles.cardHd}>
          <div className={uiStyles.cardTitle}>{t.salesByCategory}</div>
        </div>

        <div className={uiStyles.cardBody}>
          {stats.categorySales.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "var(--muted)",
                padding: "1.5rem",
              }}
            >
              {t.noSalesThisMonth}
            </div>
          ) : (
            <div className={overviewStyles.barChart}>
              {stats.categorySales.map(([category, value], index) => (
                <div className={overviewStyles.barRow} key={category}>
                  <div className={overviewStyles.barLbl}>
                    {dict.categoryLabels[category] || category}
                  </div>
                  <div className={overviewStyles.barTrk}>
                    <div
                      className={overviewStyles.barFill}
                      style={{
                        width: `${Math.round(
                          (value / stats.maxCategorySale) * 100
                        )}%`,
                        background: categoryColors[index % categoryColors.length],
                      }}
                    />
                  </div>
                  <div className={overviewStyles.barVal}>
                    ₪{value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {stats.missingCostCount > 0 && (
        <div className={uiStyles.card}>
          <div className={uiStyles.cardHd}>
            <div className={uiStyles.cardTitle}>{t.noteTitle}</div>
          </div>
          <div
            className={uiStyles.cardBody}
            style={{ color: "var(--muted)", fontSize: "0.9rem" }}
          >
            {t.missingCostNote.replace("{count}", stats.missingCostCount)}
          </div>
        </div>
      )}
    </div>
  );
}