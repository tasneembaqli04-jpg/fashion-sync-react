import { useMemo } from "react";
import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import overviewStyles from "../../../styles/manager/ManagerOverview.module.scss";
import { useLanguage } from "../../../translations/LanguageProvider";
import { calculateMonthlyStats } from "../../../functions/manager/analytics";

export default function AnalyticsView({ orders = [], products = [], returnRequests = [] }) {
  const { t: dict } = useLanguage();
  const t = dict.manager.analytics;

  const stats = useMemo(
    () =>
      calculateMonthlyStats({
        orders,
        products,
        returnRequests,
        otherCategoryLabel: t.otherCategory,
      }),
    [orders, products, returnRequests, t.otherCategory]
  );

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
          <div className={overviewStyles.statSub}>{t.repeatAllTime}</div>
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

      {stats.returnsCount > 0 && (
        <div className={uiStyles.card}>
          <div className={uiStyles.cardHd}>
            <div className={uiStyles.cardTitle}>{t.returnsNoteTitle}</div>
          </div>
          <div
            className={uiStyles.cardBody}
            style={{ color: "var(--muted)", fontSize: "0.9rem" }}
          >
            {t.returnsNote
              .replace("{count}", stats.returnsCount)
              .replace("{amount}", stats.returnsRevenueDeduction.toLocaleString())}
          </div>
        </div>
      )}
    </div>
  );
}