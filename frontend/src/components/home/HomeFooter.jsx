import styles from "../../styles/Home.module.scss";
import { Link } from "react-router-dom";
import { useLanguage } from "../../translations/LanguageProvider";

export default function HomeFooter() {
  const { t: dict } = useLanguage();
  const t = dict.home.footer;

  return (
    <div className={styles.footerStrip} style={{ marginTop: "auto" }}>
      <span>{t.copyright}</span>
      <span>•</span>


      <Link to="/manager">{t.managerLogin}</Link>
    </div>
  );
}