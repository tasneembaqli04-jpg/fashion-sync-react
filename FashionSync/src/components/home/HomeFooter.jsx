import styles from "../../styles/Home.module.scss";
import { Link } from "react-router-dom";

export default function HomeFooter() {
  return (
    <div className={styles.footerStrip} style={{ marginTop: "auto" }}>
      <span>FashionSync · כל הזכויות שמורות · 2026</span>
      <span>•</span>
      
      <span>•</span>
      <Link to="/manager">כניסת מנהל</Link>
    </div>
  );
}