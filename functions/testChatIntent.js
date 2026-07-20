const {
  detectChatIntent,
} = require("./src/services/chatIntentService");

async function run() {
  const examples = [
    "אני מחפשת שמלה שחורה לחתונת ערב עד 350 שקל",
    "אני צריכה הופעה מלאה לראיון עבודה עד 500 שקל",
    "יש נעלי גברים במידה 42?",
    "כמה עולה FS-068?",
  ];

  for (const message of examples) {
    const result = await detectChatIntent({message});

    console.log("\nMessage:", message);
    console.log(JSON.stringify(result, null, 2));
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});