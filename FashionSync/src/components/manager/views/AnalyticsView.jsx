import layoutStyles from "../../../styles/manager/ManagerLayout.module.scss";
import uiStyles from "../../../styles/manager/ManagerUI.module.scss";
import overviewStyles from "../../../styles/manager/ManagerOverview.module.scss";

export default function AnalyticsView() {
  return (
    <div className={layoutStyles.view}>
      <div className={layoutStyles.pageHd}>
        <div className={layoutStyles.phLeft}>
          <h2>אנליטיקה</h2>
          <p>סטטיסטיקות מכירות והוצאות</p>
        </div>
      </div>

      <div className={overviewStyles.statsGrid}>
        <div className={`${overviewStyles.stat} ${overviewStyles.gold}`}>
          <div className={overviewStyles.statIcon}>📈</div>
          <div className={overviewStyles.statLabel}>הכנסות החודש</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--gold)" }}
          >
            ₪38,420
          </div>
          <div className={`${overviewStyles.statSub} ${overviewStyles.up}`}>
            ↑ 12.4%
          </div>
        </div>

        <div className={`${overviewStyles.stat} ${overviewStyles.red}`}>
          <div className={overviewStyles.statIcon}>📉</div>
          <div className={overviewStyles.statLabel}>הוצאות החודש</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--red)" }}
          >
            ₪22,150
          </div>
          <div className={`${overviewStyles.statSub} ${overviewStyles.dn}`}>
            ↑ 4.1% מהחודש קודם
          </div>
        </div>

        <div className={`${overviewStyles.stat} ${overviewStyles.green}`}>
          <div className={overviewStyles.statIcon}>🛍️</div>
          <div className={overviewStyles.statLabel}>מכירות</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--green)" }}
          >
            143
          </div>
          <div className={`${overviewStyles.statSub} ${overviewStyles.up}`}>
            ↑ 8.2%
          </div>
        </div>

        <div className={`${overviewStyles.stat} ${overviewStyles.blue}`}>
          <div className={overviewStyles.statIcon}>🔄</div>
          <div className={overviewStyles.statLabel}>ממוצע עסקה</div>
          <div
            className={overviewStyles.statVal}
            style={{ color: "var(--blue)" }}
          >
            ₪269
          </div>
          <div className={`${overviewStyles.statSub} ${overviewStyles.up}`}>
            ↑ 3.8%
          </div>
        </div>
      </div>

      <div className={uiStyles.card} style={{ marginBottom: "1.1rem" }}>
        <div className={uiStyles.cardHd}>
          <div className={uiStyles.cardTitle}>💼 סיכום כספי — החודש</div>
        </div>

        <div className={uiStyles.cardBody}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                padding: "0.85rem",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: "11px",
              }}
            >
              <div
                style={{
                  fontSize: "0.62rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: "0.3rem",
                }}
              >
                הכנסות
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.5rem",
                  color: "var(--green)",
                  fontWeight: 700,
                }}
              >
                ₪38,420
              </div>
            </div>

            <div
              style={{
                padding: "0.85rem",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: "11px",
              }}
            >
              <div
                style={{
                  fontSize: "0.62rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: "0.3rem",
                }}
              >
                הוצאות
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.5rem",
                  color: "var(--red)",
                  fontWeight: 700,
                }}
              >
                ₪22,150
              </div>
            </div>

            <div
              style={{
                padding: "0.85rem",
                background: "rgba(201,168,76,0.06)",
                border: "1px solid var(--border-gold)",
                borderRadius: "11px",
              }}
            >
              <div
                style={{
                  fontSize: "0.62rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: "0.3rem",
                }}
              >
                רווח נקי
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.5rem",
                  color: "var(--gold)",
                  fontWeight: 700,
                }}
              >
                ₪16,270
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={layoutStyles.g2}>
        <div className={uiStyles.card}>
          <div className={uiStyles.cardHd}>
            <div className={uiStyles.cardTitle}>מכירות לפי קטגוריה</div>
          </div>

          <div className={uiStyles.cardBody}>
            <div className={overviewStyles.barChart}>
              <div className={overviewStyles.barRow}>
                <div className={overviewStyles.barLbl}>שמלות</div>
                <div className={overviewStyles.barTrk}>
                  <div
                    className={overviewStyles.barFill}
                    style={{ width: "82%", background: "var(--gold)" }}
                  />
                </div>
                <div className={overviewStyles.barVal}>₪12,400</div>
              </div>

              <div className={overviewStyles.barRow}>
                <div className={overviewStyles.barLbl}>מכנסיים</div>
                <div className={overviewStyles.barTrk}>
                  <div
                    className={overviewStyles.barFill}
                    style={{ width: "64%", background: "var(--blue)" }}
                  />
                </div>
                <div className={overviewStyles.barVal}>₪9,680</div>
              </div>

              <div className={overviewStyles.barRow}>
                <div className={overviewStyles.barLbl}>חולצות</div>
                <div className={overviewStyles.barTrk}>
                  <div
                    className={overviewStyles.barFill}
                    style={{ width: "48%", background: "var(--green)" }}
                  />
                </div>
                <div className={overviewStyles.barVal}>₪7,260</div>
              </div>

              <div className={overviewStyles.barRow}>
                <div className={overviewStyles.barLbl}>עליוניות</div>
                <div className={overviewStyles.barTrk}>
                  <div
                    className={overviewStyles.barFill}
                    style={{ width: "35%", background: "var(--purple)" }}
                  />
                </div>
                <div className={overviewStyles.barVal}>₪5,290</div>
              </div>
            </div>
          </div>
        </div>

        <div className={uiStyles.card}>
          <div className={uiStyles.cardHd}>
            <div className={uiStyles.cardTitle}>הוצאות לפי קטגוריה</div>
          </div>

          <div className={uiStyles.cardBody}>
            <div className={overviewStyles.barChart}>
              <div className={overviewStyles.barRow}>
                <div className={overviewStyles.barLbl}>רכש</div>
                <div className={overviewStyles.barTrk}>
                  <div
                    className={overviewStyles.barFill}
                    style={{ width: "75%", background: "var(--red)" }}
                  />
                </div>
                <div className={overviewStyles.barVal}>₪12,800</div>
              </div>

              <div className={overviewStyles.barRow}>
                <div className={overviewStyles.barLbl}>שכירות</div>
                <div className={overviewStyles.barTrk}>
                  <div
                    className={overviewStyles.barFill}
                    style={{ width: "50%", background: "var(--orange)" }}
                  />
                </div>
                <div className={overviewStyles.barVal}>₪5,500</div>
              </div>

              <div className={overviewStyles.barRow}>
                <div className={overviewStyles.barLbl}>שכר</div>
                <div className={overviewStyles.barTrk}>
                  <div
                    className={overviewStyles.barFill}
                    style={{ width: "28%", background: "var(--purple)" }}
                  />
                </div>
                <div className={overviewStyles.barVal}>₪2,850</div>
              </div>

              <div className={overviewStyles.barRow}>
                <div className={overviewStyles.barLbl}>שיווק</div>
                <div className={overviewStyles.barTrk}>
                  <div
                    className={overviewStyles.barFill}
                    style={{ width: "10%", background: "var(--muted)" }}
                  />
                </div>
                <div className={overviewStyles.barVal}>₪1,000</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={uiStyles.card}>
        <div className={uiStyles.cardHd}>
          <div className={uiStyles.cardTitle}>📊 לקוחות חוזרים</div>
          <span className={`${uiStyles.tag} ${uiStyles.tGreen}`}>
            68% — ↑ 5%
          </span>
        </div>

        <div className={uiStyles.cardBody}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: "160px" }}>
              <div className={overviewStyles.barChart}>
                <div className={overviewStyles.barRow}>
                  <div className={overviewStyles.barLbl}>חוזרים</div>
                  <div className={overviewStyles.barTrk}>
                    <div
                      className={overviewStyles.barFill}
                      style={{ width: "68%", background: "var(--green)" }}
                    />
                  </div>
                  <div
                    className={overviewStyles.barVal}
                    style={{ color: "var(--green)" }}
                  >
                    68%
                  </div>
                </div>

                <div className={overviewStyles.barRow}>
                  <div className={overviewStyles.barLbl}>חדשים</div>
                  <div className={overviewStyles.barTrk}>
                    <div
                      className={overviewStyles.barFill}
                      style={{ width: "32%", background: "var(--blue)" }}
                    />
                  </div>
                  <div
                    className={overviewStyles.barVal}
                    style={{ color: "var(--blue)" }}
                  >
                    32%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}