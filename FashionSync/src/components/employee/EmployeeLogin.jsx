import { useState } from "react";
import { EMPLOYEES } from "../../data/employees";

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
    <div className="login-overlay">
      <div className="login-box">
        <div className="login-brand">FashionSync</div>
        <div className="login-role">👔 פורטל עובד</div>

        <form onSubmit={handleSubmit}>
          <div className="fg">
            <label>שם משתמש</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="fg">
            <label>סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="err-msg" style={{ display: "block" }}>{error}</div>}

          <button type="submit" className="btn-login">
            כניסה
          </button>
        </form>
      </div>
    </div>
  );
}
