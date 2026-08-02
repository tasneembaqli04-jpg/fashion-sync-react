import styles from "../../styles/Home.module.scss";
import { HOME_FLOATING_ITEMS } from "../../data/homeFloatingItems";
export default function FloatingItems({ exclude = [] }) {
  const items = HOME_FLOATING_ITEMS.filter((item) => !exclude.includes(item.icon));

  return (
    <>
      {items.map((item, index) => (
        <div key={index} className={styles.floatItem} style={item.style}>
          {item.icon}
        </div>
      ))}
    </>
  );
}