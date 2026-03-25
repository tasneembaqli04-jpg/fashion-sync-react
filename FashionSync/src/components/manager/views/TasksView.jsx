import { useState, useEffect, useRef } from "react";
import styles from "../../../styles/Manager.module.scss";

const ICONS = [
  { value: "📦", label: "מלאי" },
  { value: "🏷️", label: "מכירה" },
  { value: "📸", label: "צילום" },
  { value: "🧹", label: "ניקוי / סידור" },
  { value: "🔖", label: "תיוג מחירים" },
  { value: "📋", label: "כללי" },
  { value: "⚠️", label: "דחוף" },
  { value: "🚚", label: "משלוח" },
  { value: "🔍", label: "בדיקה" },
];
const URGENCY = [
  { value: "high", label: "דחוף", emoji: "🔴" },
  { value: "med", label: "בינוני", emoji: "🟠" },
  { value: "low", label: "רגיל", emoji: "🟢" },
];

const EMPLOYEES = [
  { value: "כולם", label: "כל העובדים", emoji: "👥" },
  { value: "דנה לוי", label: "דנה לוי", emoji: "👤" },
  { value: "רון מזרחי", label: "רון מזרחי", emoji: "👤" },
];

const LINKS = [
  { value: "", label: "ללא קישור", emoji: "—" },
  { value: "inventory", label: "ניהול מלאי", emoji: "📦" },
  { value: "addprod", label: "קבלת סחורה", emoji: "➕" },
  { value: "sell", label: "סריקת מכירה", emoji: "🏷️" },
  { value: "catalog", label: "קטלוג", emoji: "📋" },
];

const dropdownStyle = {
  position: "absolute",
  top: "calc(100% + 4px)",
  right: 0,
  width: "100%",
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  zIndex: 999,
  direction: "rtl",
  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
  overflow: "hidden",
  minWidth: "fit-content", 
  maxWidth: "100%",
};

const optionStyle = (isSelected) => ({
  padding: "0.5rem 0.85rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  flexDirection: "row", 
  gap: "0.55rem",
  fontSize: "0.82rem",
  color: isSelected ? "var(--gold)" : "var(--text)",
  background: isSelected ? "var(--gold-dim)" : "transparent",
  transition: "background 0.15s",
  fontFamily: "Alef, sans-serif",
  whiteSpace: "nowrap",
  direction: "rtl", 
  textAlign: "right", 
});
const triggerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  width: "100%",
  direction: "rtl",
  fontFamily: "Alef, sans-serif",
  fontSize: "0.88rem",
  color: "var(--text)",
  textAlign: "right",
};

function CustomSelect({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className={styles.mtfField} style={{ position: "relative" }} ref={ref}>
      <div className={styles.mtfLabel}>{label}</div>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={styles.mtfInput}
        style={triggerStyle}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>{selected?.emoji}</span>
          <span>{selected?.label}</span>
        </div>
        <span style={{ opacity: 0.6, fontSize: "0.75rem" }}>⌄</span>
      </button>

      {open && (
        <div style={dropdownStyle}>
          {options.map((item) => (
            <div
              key={item.value}
              onClick={() => {
                onChange(item.value);
                setOpen(false);
              }}
              style={optionStyle(value === item.value)}
              onMouseEnter={(e) => {
                if (value !== item.value)
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                if (value !== item.value)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontSize: "1rem" }}>{item.emoji}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TasksView({
  tasks,
  onAddTask,
  onDeleteTask,
  onClearTasks,
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [urg, setUrg] = useState("med");
  const [emp, setEmp] = useState("כולם");
  const [link, setLink] = useState("");
  const [icon, setIcon] = useState("📦");
  const [showError, setShowError] = useState(false);

  const handleSubmit = () => {
    if (!title.trim()) {
      setShowError(true);
      setTimeout(() => setShowError(false), 2500);
      return;
    }

    const newTask = {
      id: `MT-${Date.now()}`,
      title: title.trim(),
      desc: desc.trim(),
      urg,
      emp,
      link,
      icon,
      createdAt: new Date().toISOString(),
      done: false,
      seen: false,
    };

    const existing = JSON.parse(localStorage.getItem("fs_tasks") || "[]");
    localStorage.setItem("fs_tasks", JSON.stringify([newTask, ...existing]));
    onAddTask(newTask);

    setTitle("");
    setDesc("");
    setUrg("med");
    setEmp("כולם");
    setLink("");
    setIcon("📦");
  };

  const urgLabels = { high: "דחוף", med: "בינוני", low: "רגיל" };
  const urgClass = {
    high: styles.ubHigh,
    med: styles.ubMed,
    low: styles.ubLow,
  };
  const cardClass = {
    high: styles.urgHigh,
    med: styles.urgMed,
    low: styles.urgLow,
  };

  return (
    <div className={`${styles.view} ${styles.active}`}>
      <div className={styles.pageHd}>
        <div className={styles.phLeft}>
          <h2>📋 משימות לעובדים</h2>
          <p>הוסף משימות שיופיעו אוטומטית בפורטל העובד</p>
        </div>
        <span className={`${styles.tag} ${styles.tBlue}`}>
          {tasks.length} משימות
        </span>
      </div>

      <div className={styles.mgrTaskForm}>
        <div className={styles.mgrTaskFormTitle}>➕ הוסף משימה חדשה</div>

        <div className={styles.mtfGrid}>
          <div className={styles.mtfField} style={{ gridColumn: "span 2" }}>
            <div className={styles.mtfLabel}>כותרת המשימה</div>
            <input
              className={styles.mtfInput}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="לדוגמה: עדכון מלאי — חולצות חדשות"
            />
          </div>

          <div className={styles.mtfField} style={{ gridColumn: "span 2" }}>
            <div className={styles.mtfLabel}>תיאור / הנחיות</div>
            <input
              className={styles.mtfInput}
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="הוראות מפורטות לעובד..."
            />
          </div>

          <CustomSelect
            label="דחיפות"
            options={URGENCY}
            value={urg}
            onChange={setUrg}
          />
          <CustomSelect
            label="עובד מיועד"
            options={EMPLOYEES}
            value={emp}
            onChange={setEmp}
          />
          <CustomSelect
            label="אייקון"
            options={ICONS.map((i) => ({ ...i, emoji: i.value }))}
            value={icon}
            onChange={setIcon}
          />
          <CustomSelect
            label="קישור לקטגוריה (אופציונלי)"
            options={LINKS}
            value={link}
            onChange={setLink}
          />
        </div>

        {showError && (
          <div
            className={`${styles.alert} ${styles.aDanger}`}
            style={{ marginBottom: ".6rem" }}
          >
            ❌ יש למלא לפחות כותרת
          </div>
        )}

        <button
          className={`${styles.btn} ${styles.btnGold}`}
          style={{ padding: ".65rem 1.4rem" }}
          onClick={handleSubmit}
        >
          📤 שלח משימה לעובד
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHd}>
          <div className={styles.cardTitle}>📋 משימות שנשלחו</div>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            style={{
              fontSize: ".72rem",
              padding: ".3rem .7rem",
              color: "var(--red)",
            }}
            onClick={onClearTasks}
          >
            🗑 נקה הכל
          </button>
        </div>
        <div className={styles.cardBody}>
          {tasks.length === 0 ? (
            <div className={styles.mgrTasksEmpty}>
              <div className={styles.mgrTasksEmptyIcon}>📭</div>
              <div style={{ fontSize: ".86rem" }}>לא נשלחו משימות עדיין</div>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`${styles.mgrTaskCard} ${cardClass[task.urg]}`}
              >
                <div className={styles.mgrTaskIcon}>{task.icon}</div>
                <div className={styles.mgrTaskInfo}>
                  <div className={styles.mgrTaskTitleTxt}>{task.title}</div>
                  {task.desc && (
                    <div className={styles.mgrTaskDescTxt}>{task.desc}</div>
                  )}
                  <div className={styles.mgrTaskMeta}>
                    <span
                      className={`${styles.mgrTaskUrgBadge} ${urgClass[task.urg]}`}
                    >
                      {urgLabels[task.urg]}
                    </span>
                    <span className={styles.mgrTaskEmpBadge}>
                      👤 {task.emp}
                    </span>
                    {task.link && (
                      <span
                        style={{
                          fontSize: ".66rem",
                          background: "rgba(201,168,76,.1)",
                          color: "var(--gold)",
                          padding: ".1rem .5rem",
                          borderRadius: "20px",
                        }}
                      >
                        🔗 {task.link}
                      </span>
                    )}
                    <span className={styles.mgrTaskDateTxt}>
                      {new Date(task.createdAt).toLocaleString("he-IL", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <button
                  className={styles.mgrTaskDel}
                  onClick={() => onDeleteTask(task.id)}
                >
                  🗑
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
