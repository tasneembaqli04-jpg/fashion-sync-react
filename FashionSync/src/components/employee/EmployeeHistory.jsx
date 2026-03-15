export default function EmployeeHistory({ history }) {
  return (
    <div className="panel active">
      <div className="page-header">
        <div className="page-title">פעילות אחרונה</div>
        <div className="page-sub">כל הפעולות שבוצעו</div>
      </div>

      <div className="card">
        <div className="feed">
          {!history.length ? (
            <div className="feed-item">
              <div className="feed-text">אין פעילות עדיין.</div>
            </div>
          ) : (
            history.map((item) => (
              <div className="feed-item" key={item.id}>
                <div className="feed-text">{item.text}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
