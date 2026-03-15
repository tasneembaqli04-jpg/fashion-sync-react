export default function EmployeeTasks({ tasks, onCompleteTask, onMarkSeen }) {
  return (
    <div className="panel active">
      <div className="page-header">
        <div className="page-title">📋 המשימות שלי</div>
        <div className="page-sub">כל המשימות שנשלחו לעובד</div>
      </div>

      {!tasks.length ? (
        <div className="tasks-empty-state">אין משימות כרגע</div>
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <div className={`task ${task.done ? "completed" : ""}`} key={task.id}>
              <div className="task-icon">{task.icon || "📌"}</div>

              <div className="task-info">
                <div className="task-title">{task.title}</div>
                {task.desc && <div className="task-sub">{task.desc}</div>}
              </div>

              <div className="task-btns-col">
                {!task.seen && (
                  <button className="task-seen-btn" onClick={() => onMarkSeen(task.id)}>
                    📬 קיבלתי
                  </button>
                )}

                {!task.done ? (
                  <button className="task-done-btn" onClick={() => onCompleteTask(task.id)}>
                    סיימתי ✓
                  </button>
                ) : (
                  <button className="task-done-btn" disabled>
                    ✓ הושלם
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
