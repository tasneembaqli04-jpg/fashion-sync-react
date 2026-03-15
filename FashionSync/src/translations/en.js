import { useMemo, useState } from "react";
import he from "./he";
import en from "./en";

const dictionaries = { he, en };

export function useTranslate() {
  const [lang, setLang] = useState("he");

  const t = useMemo(() => dictionaries[lang] || dictionaries.he, [lang]);

  return {
    lang,
    setLang,
    t,
  };
}