export const SHIPPING_OPTIONS = [
  {
    id: "standard",
    icon: "📦",
    label: "משלוח רגיל",
    days: "5–7 ימי עסקים",
    price: 25,
    note: "חינם לרכישות מעל ₪200",
  },
  {
    id: "express",
    icon: "⚡",
    label: "משלוח מהיר",
    days: "2–3 ימי עסקים",
    price: 29,
    note: "",
  },
  {
    id: "same_day",
    icon: "🚀",
    label: "משלוח באותו יום",
    days: "עד 23:59 היום",
    price: 59,
    note: "מרכז בלבד",
  },
  {
    id: "pickup",
    icon: "🏪",
    label: "איסוף עצמי",
    days: "המועד ייקבע לאחר אישור ההזמנה",
    price: 0,
    note: "הכתובת תוצג בהמשך התהליך",
  },
];
