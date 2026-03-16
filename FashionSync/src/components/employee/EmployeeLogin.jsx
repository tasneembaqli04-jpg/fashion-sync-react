import { useState } from "react";
import { EMPLOYEES } from "../../data/employees";
import styles from "../../styles/employee/EmployeeLogin.module.scss";

export default function EmployeeLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    const foundUser = EMPLOYEES.find(
      (emp) =>
        emp.username === username &&
        emp.password === password &&
        emp.active
    );

    if (!foundUser) {
      setError("שם משתמש או סיסמה שגויים");
      return;
    }

    setError("");
    onLogin(foundUser);
  }

  return (
    <div className={styles.loginOverlay}>
      <div className={styles.loginBox}>
        <div className={styles.loginBrand}>FashionSync</div>
        <div className={styles.loginRole}>👔 פורטל עובד</div>

        <form onSubmit={handleSubmit}>
          <div className={styles.fg}>
            <label>שם משתמש</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className={styles.fg}>
            <label>סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className={styles.errMsg} style={{ display: "block" }}>
              {error}
            </div>
          )}

          <button type="submit" className={styles.btnLogin}>
            כניסה
          </button>
        </form>
      </div>
    </div>
  );
}
