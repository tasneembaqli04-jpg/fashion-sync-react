import styles from "../../styles/Home.module.scss";
import { HOME_FLOATING_ITEMS } from "../../data/homeFloatingItems";

export default function FloatingItems() {
  return (
    <>
      {HOME_FLOATING_ITEMS.map((item, index) => (
        <div key={index} className={styles.floatItem} style={item.style}>
          {item.icon}
        </div>
      ))}
    </>
  );
}
