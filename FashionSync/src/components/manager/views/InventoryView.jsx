import styles from "../../../styles/Manager.module.scss";

function getStatus(stock, minStock) {
  if (stock === 0) {
    return { label: "אזל", className: styles.tRed };
  }

  if (stock <= minStock) {
    return { label: "נמוך", className: styles.tOrange };
  }

  return { label: "זמין", className: styles.tGreen };
}

function getVariantTotal(variant) {
  return Object.values(variant.sizes || {}).reduce(
    (sum, qty) => sum + (parseInt(qty, 10) || 0),
    0
  );
}

export default function InventoryView({ products = [], onOpenDetails }) {
  const totalUnits = products.reduce((sum, product) => sum + product.stock, 0);

  return (
    <div className={styles.view}>
      <div className={styles.pageHd}>
        <div className={styles.phLeft}>
          <h2>ניהול מלאי</h2>
          <p>
            {totalUnits} יחידות · {products.length} מוצרים
          </p>
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
                <th>מינימום</th>
                <th>סטטוס</th>
                <th>פעולות</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => {
                const status = getStatus(product.stock, product.minStock);

                return (
                  <tr key={product.code}>
                    <td>
                      <img
                        className={styles.ptb}
                        src={product.img}
                        alt={product.name}
                      />
                    </td>

                    <td>
                      <code className={styles.productCode}>{product.code}</code>
                    </td>

                    <td>
                      <div className={styles.pname}>{product.name}</div>
                      <div className={styles.psku}>
                        {product.gender} · {product.cat}
                      </div>
                    </td>

                    <td style={{ fontWeight: 700 }}>{product.stock}</td>

                    <td className={styles.priceCell}>₪{product.price}</td>

                    <td>
                      <strong className={styles.minStockValue}>
                        {product.minStock}
                      </strong>
                    </td>

                    <td>
                      <span className={`${styles.tag} ${status.className}`}>
                        {status.label}
                      </span>
                    </td>

                    

                    <td>
                      <div className={styles.inventoryActions}>
                        <button
                          className={styles.btnGhost}
                          style={{
                            padding: ".3rem .62rem",
                            fontSize: ".72rem",
                          }}
                          onClick={() => onOpenDetails(product)}
                        >
                          פרטים
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}