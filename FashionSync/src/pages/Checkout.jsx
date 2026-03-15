import { Link, useNavigate } from "react-router-dom";
import styles from "../styles/Checkout.module.scss";

function Checkout() {
  const navigate = useNavigate();

  const handleBackToCustomer = () => {
    navigate("/customer");
  };

  const handleFinishOrder = () => {
    alert("ההזמנה הושלמה בהצלחה");
    navigate("/");
  };

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div>
          <h1 className={styles.brand}>FashionSync</h1>
          <p className={styles.subtitle}>תשלום</p>
        </div>

        <div className={styles.actions}>
          <Link to="/" className={styles.linkBtn}>
            דף הבית
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.checkoutCard}>
          <h2>סיכום הזמנה</h2>

          <div className={styles.row}>
            <span>שמלה שחורה</span>
            <span>₪149</span>
          </div>

          <div className={styles.row}>
            <span>חולצה לבנה</span>
            <span>₪89</span>
          </div>

          <div className={styles.totalRow}>
            <span>סה״כ</span>
            <span>₪238</span>
          </div>

          <div className={styles.buttons}>
            <button className={styles.ghostBtn} onClick={handleBackToCustomer} type="button">
              חזרה ללקוח
            </button>

            <button className={styles.primaryBtn} onClick={handleFinishOrder} type="button">
              אישור תשלום
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Checkout;