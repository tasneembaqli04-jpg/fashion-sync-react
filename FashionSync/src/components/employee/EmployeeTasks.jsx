import layoutStyles from "../../styles/employee/EmployeeLayout.module.scss";
import taskStyles from "../../styles/employee/EmployeeTasks.module.scss";

export default function EmployeeTasks({ tasks, onCompleteTask, onMarkSeen }) {
  return (
    <div className={`${layoutStyles.panel} ${layoutStyles.active}`}>
      <div className={layoutStyles.pageHeader}>
        <div className={layoutStyles.pageTitle}>📋 המשימות שלי</div>
        <div className={layoutStyles.pageSub}>כל המשימות שנשלחו לעובד</div>
      </div>

      {!tasks.length ? (
        <div className={taskStyles.tasksEmptyState}>אין משימות כרגע</div>
      ) : (
        <div className={taskStyles.taskList}>
          {tasks.map((task) => (
            <div
              className={`${taskStyles.task} ${task.done ? taskStyles.completed : ""}`}
              key={task.id}
            >
              <div className={taskStyles.taskIcon}>{task.icon || "📌"}</div>

              <div className={taskStyles.taskInfo}>
                <div className={taskStyles.taskTitle}>{task.title}</div>
                {task.desc && <div className={taskStyles.taskSub}>{task.desc}</div>}
              </div>

              <div className={taskStyles.taskBtnsCol}>
                {!task.seen && (
                  <button
                    className={taskStyles.taskSeenBtn}
                    onClick={() => onMarkSeen(task.id)}
                  >
                    📬 קיבלתי
                  </button>
                )}

                {!task.done ? (
                  <button
                    className={taskStyles.taskDoneBtn}
                    onClick={() => onCompleteTask(task.id)}
                  >
                    סיימתי ✓
                  </button>
                ) : (
                  <button className={taskStyles.taskDoneBtn} disabled>
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