import { useState } from "react";
import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import baseStyles from "../../styles/customer/Customer.module.scss";

export default function NotifyModal({
  open = false,
  notifyText = "",
  closeNotifyModal,
  submitNotify,
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div
      className={`${modalStyles.modalWrap} ${open ? modalStyles.open : ""}`}
      id="notify-modal"
    >
      <div className={modalStyles.modalBox} style={{ width: "480px" }}>
        <button className={modalStyles.modalClose} onClick={closeNotifyModal}>
          ✕
        </button>

        <div
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: "1.3rem",
            color: "var(--gold)",
            marginBottom: "0.6rem",
          }}
        >
          🔔 הרשמה להתראה
        </div>

        <div
          id="notify-text"
          style={{
            color: "var(--light-gray)",
            marginBottom: "1rem",
            lineHeight: "1.6",
          }}
          dangerouslySetInnerHTML={{ __html: notifyText }}
        />

        <div className={modalStyles.pdField}>
          <label>כתובת Gmail</label>
          <input
            id="notify-email"
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={modalStyles.pdField} style={{ marginTop: "0.75rem" }}>
          <label>מספר טלפון</label>
          <input
            id="notify-phone"
            type="tel"
            placeholder="05X-XXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className={modalStyles.pdActions} style={{ marginTop: "1rem" }}>
          <button
            className={`${baseStyles.btn} ${baseStyles.btnGold}`}
            onClick={() => submitNotify(email, phone)}
          >
            ✅ שלח
          </button>

          <button
            className={`${baseStyles.btn} ${baseStyles.btnOutline}`}
            onClick={closeNotifyModal}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}