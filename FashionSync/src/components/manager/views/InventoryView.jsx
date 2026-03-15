import styles from "../../../styles/Manager.module.scss";

function statusBadge(stock, minStock) {
  if (stock === 0) return <span className={`${styles.tag} ${styles.tRed}`}>אזל</span>;
  if (stock <= minStock) return <span className={`${styles.tag} ${styles.tYellow}`}>נמוך</span>;
  return <span className={`${styles.tag} ${styles.tGreen}`}>זמין</span>;
}

export default function InventoryView({ products, onOpenDetails }) {
  return (
    <div className={`${styles.view} ${styles.active}`}>
      <div className={styles.pageHd}>
        <div className={styles.phLeft}>
          <h2>ניהול מלאי</h2>
          <p>{products.reduce((sum, p) => sum + p.stock, 0)} יחידות · {products.length} מוצרים</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.tblWrap}>
          <table>
            <thead>
              <tr>
                <th>תמונה</th>
                <th>קוד</th>
                <th>שם מוצר</th>
                <th>מלאי</th>
                <th>מחיר</th>
                <th>מינימום להתראה</th>
                <th>סטטוס</th>
                <th>פעולות</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => (
                <tr key={p.code}>
                  <td>
                    <img className={styles.ptb} src={p.img} alt={p.name} />
                  </td>

                  <td>
                    <code style={{ color: "var(--gold)", fontSize: ".78rem" }}>{p.code}</code>
                  </td>

                  <td>
                    <div className={styles.pname}>{p.name}</div>
                    <div className={styles.psku}>{p.gender}</div>
                  </td>

                  <td style={{ fontWeight: 700 }}>{p.stock}</td>

                  <td style={{ color: "var(--gold)", fontWeight: 700 }}>
                    ₪{p.price}
                  </td>

                  <td>
                    <strong style={{ color: "var(--gold)" }}>{p.minStock}</strong>
                  </td>

                  <td>{statusBadge(p.stock, p.minStock)}</td>

                  <td>
                    <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap" }}>
                      <button
                        className={`${styles.btn} ${styles.btnGhost}`}
                        style={{ padding: ".35rem .7rem", fontSize: ".75rem" }}
                        onClick={() => onOpenDetails(p)}
                      >
                        פרטים
                      </button>


                      <button
                        className={styles.btn}
                        style={{
                          background: "rgba(231,76,60,.08)",
                          border: "1px solid rgba(231,76,60,.2)",
                          color: "#f1948a",
                          padding: ".35rem .7rem",
                          fontSize: ".75rem",
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
