import layoutStyles from "../../styles/employee/EmployeeLayout.module.scss";
import overviewStyles from "../../styles/employee/EmployeeOverview.module.scss";
import { ACTIVITY_ICONS } from "../../data/constants";

export default function EmployeeHistory({ history }) {
  return (
    <div className={`${layoutStyles.panel} ${layoutStyles.active}`}>
      <div className={layoutStyles.pageHeader}>
        <div className={layoutStyles.pageTitle}>פעילות אחרונה</div>
        <div className={layoutStyles.pageSub}>כל הפעולות שבוצעו במערכת</div>
      </div>

      <div className={layoutStyles.card}>
        <div className={overviewStyles.feed}>
          {!history || !history.length ? (
            <div className={overviewStyles.feedItem}>
              <div className={overviewStyles.feedText}>
                אין פעילות עדיין.
              </div>
            </div>
          ) : (
            history.map((item) => (
              <div className={overviewStyles.feedItem} key={item.id}>
                <div className={overviewStyles.feedIcon}>
                  {ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.default}
                </div>
                
                <div className={overviewStyles.feedContent}>
                  <div className={overviewStyles.feedText}>
                    {item.text}
                  </div>
                  <div className={overviewStyles.feedTime}>
                    {item.time}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}