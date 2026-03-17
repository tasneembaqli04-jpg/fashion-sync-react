export function getReply(message, products) {
  const text = String(message || "").trim().toLowerCase();

  if (
    text.includes("מבצע") ||
    text.includes("מבצעים") ||
    text.includes("הנחה") ||
    text.includes("הנחות")
  ) {
    const saleItems = products.filter((p) => p.sale && p.stock > 0);
    if (saleItems.length) {
      const names = saleItems
        .slice(0, 3)
        .map((p) => `${p.name} (₪${p.price})`)
        .join(", ");

      return `יש כרגע ${saleItems.length} פריטים במבצע 🏷️<br>לדוגמה: ${names}.<br>לחץ על "🏷️ מבצעים" בקטלוג כדי לראות את כל הפריטים במבצע!`;
    }

    return "כרגע אין מבצעים זמינים, אבל שווה לבדוק שוב בקרוב — אנחנו מוסיפים מבצעים חדשים מעת לעת 🏷️";
  }

  if (text.includes("קיץ"))
    return "לקיץ יש לנו חולצת לינן קלאסית ושמלת קיץ פרחונית. אפשר גם לסנן בקטלוג לפי עונת קיץ ☀️";

  if (text.includes("חורף"))
    return "לחורף יש לנו עליונית פוטר חמה ומעיל חורף כבד. אפשר לסנן לפי חורף ❄️";

  if (text.includes("חולצה") || text.includes("חולצות"))
    return "כן, יש חולצות במערכת כמו חולצת לינן קלאסית, חולצת טי בייסיק וחולצת מכופתרת קלאסית.";

  if (text.includes("מכנס") || text.includes("מכנסיים"))
    return "כן, יש מכנסיים במערכת כמו ג'ינס סלים פיט ומכנסי טרנינג נוח.";

  if (text.includes("שמלה") || text.includes("שמלות"))
    return "כן, יש שמלות במערכת כמו שמלת קיץ פרחונית, שמלת ערב אלגנטית וחצאית מידי אלגנטית.";

  if (
    text.includes("עליונית") ||
    text.includes("עליוניות") ||
    text.includes("זקט") ||
    text.includes("ז'קט")
  ) {
    return "כן, יש עליוניות במערכת כמו ז'קט עור שחור, עליונית פוטר חמה, מעיל חורף כבד וסווטשרט אביבי.";
  }

  if (text.includes("מידה") || text.includes("מידות"))
    return 'יש מגוון מידות לפי פריט. בנוסף, אם אין את המידה הרצויה אפשר לבחור "אחר" ולכתוב את המידה המבוקשת.';

  if (text.includes("צבע") || text.includes("צבעים"))
    return "כן, לכל פריט יש מגוון צבעים שאפשר לבחור בעת ההוספה לסל.";

  if (text.includes("מחיר") || text.includes("מחירים"))
    return "המחירים במערכת מתחילים מ־₪99 ומגיעים עד ₪849.";

  if (text.includes("שעות") || text.includes("פתיחה"))
    return "שעות הפתיחה הן א'–ה' 9:00–21:00 ו־ו' 9:00–15:00 ⏰";

  if (text.includes("כתובת") || text.includes("איפה"))
    return "הכתובת היא רחוב הרצל 42, תל אביב 📍";

  if (text.includes("משלוח") || text.includes("משלוחים"))
    return "משלוח רגיל 3–5 ימי עסקים ב־₪25, משלוח מהיר 1–2 ימי עסקים ב־₪49, ומשלוח חינם מעל ₪350 🚚";

  if (
    text.includes("החזרה") ||
    text.includes("החזרות") ||
    text.includes("להחזיר")
  ) {
    return "ניתן להחזיר פריטים תוך 30 יום מיום הרכישה, בתנאי שהם במצב מקורי עם תגיות. פריטי מכירה סופית אינם ניתנים להחזרה.";
  }

  if (
    text.includes("נקודות") ||
    text.includes("קופון") ||
    text.includes("קופונים")
  ) {
    return "מוצג שללקוח יש 1,250 נקודות, שזה שווה ל־₪62.5 לשימוש בקנייה הבאה. בנוסף בסל מוצג צבירת נקודה לכל ₪1.";
  }

  if (
    text.includes("תשלום") ||
    text.includes("משלמים") ||
    text.includes("לשלם")
  ) {
    return "אפשר לשלם בכרטיס אשראי, ביט או קופון מתנה 💳";
  }

  if (
    text.includes("שלום") ||
    text.includes("היי") ||
    text.includes("הי")
  ) {
    return "שלום! ברוך הבא ל-FashionSync 😊 איך אפשר לעזור?";
  }

  if (text.includes("חדש") || text.includes("מה חדש")) {
    return "כרגע במערכת יש פריטים כמו חולצת לינן קלאסית, שמלת קיץ פרחונית, ג'ינס סלים פיט, עליונית פוטר חמה ועוד.";
  }

  return "אפשר לשאול על מוצרים, מחירים, משלוחים, החזרות, מידות, צבעים, נקודות, כתובת ושעות פתיחה 😊";
}