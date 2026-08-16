import { useLanguage } from "../../translations/LanguageProvider";
import {
  ALL_MONTHS,
  availableYears,
  getMonthPart,
  getYearPart,
} from "../../functions/shared/monthFilter";

/**
 * Year and month selectors for a screen that filters records by date.
 *
 * Replaces the single dropdown each screen used to build for itself, which
 * listed every month the shop had ever operated and gained an entry every
 * month. Two selectors keep the lists bounded: one year per year of trading,
 * and always the same twelve months.
 *
 * The value is a single string — "all", "YYYY", or "YYYY-MM" — so a screen
 * still holds one piece of state, and `matchesMonthFilter` reads it.
 *
 * `getDate` decides which field a record is filed under. The screens do not
 * all agree on that, and passing it in is what lets each keep its own
 * behaviour while sharing this component.
 *
 * @param {object} props - Component props.
 * @param {Array<object>} props.records - Records being filtered, for the year list.
 * @param {Function} props.getDate - Reads the date value from a record.
 * @param {string} props.value - Current filter value.
 * @param {Function} props.onChange - Called with the new filter value.
 * @param {object} [props.style] - Extra styles for the wrapper.
 */
export default function MonthFilter({
  records = [],
  getDate,
  value = ALL_MONTHS,
  onChange,
  style,
}) {
  const { t: dict } = useLanguage();
  const t = dict.common.monthFilter;
  const MONTH_NAMES = dict.monthNames;

  const years = availableYears(records, getDate);
  const selectedYear = getYearPart(value);
  const selectedMonth = getMonthPart(value);

  function changeYear(nextYear) {
    // Clearing the year clears everything: a month without a year would match
    // that month in every year, which is not a choice the old selector could
    // express and not one to introduce here.
    if (!nextYear) {
      onChange(ALL_MONTHS);
      return;
    }

    onChange(selectedMonth ? `${nextYear}-${selectedMonth}` : nextYear);
  }

  function changeMonth(nextMonth) {
    // Choosing a month before a year takes the current year, which is what
    // the old selector defaulted to.
    const year = selectedYear || String(new Date().getFullYear());

    onChange(nextMonth ? `${year}-${nextMonth}` : year);
  }

  const selectStyle = {
    padding: "0.45rem 0.7rem",
    borderRadius: "9px",
    border: "1px solid var(--border)",
    background: "var(--surface2)",
    color: "var(--text)",
    fontFamily: "Alef, sans-serif",
    fontSize: "0.85rem",
  };

  return (
    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", ...style }}>
      <select
        value={selectedYear}
        onChange={(e) => changeYear(e.target.value)}
        aria-label={t.yearLabel}
        style={selectStyle}
      >
        <option value="">{t.allTime}</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      <select
        value={selectedMonth}
        onChange={(e) => changeMonth(e.target.value)}
        aria-label={t.monthLabel}
        style={selectStyle}
      >
        <option value="">{t.allMonthsInYear}</option>
        {MONTH_NAMES.map((name, index) => (
          <option key={name} value={String(index + 1).padStart(2, "0")}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
