import layoutStyles from "../../styles/employee/EmployeeLayout.module.scss";
import overviewStyles from "../../styles/employee/EmployeeOverview.module.scss";

export default function EmployeeHistory({ history }) {
  return (
    <div className={`${layoutStyles.panel} ${layoutStyles.active}`}>
      <div className={layoutStyles.pageHeader}>
        <div className={layoutStyles.pageTitle}>פעילות אחרונה</div>
        <div className={layoutStyles.pageSub}>כל הפעולות שבוצעו</div>
      </div>

      <div className={layoutStyles.card}>
        <div className={overviewStyles.feed}>
          {!history.length ? (
            <div className={overviewStyles.feedItem}>
              <div className={overviewStyles.feedText}>
                אין פעילות עדיין.
              </div>
            </div>
          ) : (
            history.map((item) => (
              <div className={overviewStyles.feedItem} key={item.id}>
                <div className={overviewStyles.feedText}>
                  {item.text}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
