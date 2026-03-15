import styles from "../../styles/Home.module.scss";

export default function HomeBackground({ featuredImage }) {
  const backgroundImage = featuredImage
    ? `url(${featuredImage})`
    : `url("https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg?auto=compress&cs=tinysrgb&w=1600")`;

  return (
    <>
      <div
        className={styles.bgImage}
        style={{ backgroundImage }}
      />
      <div className={styles.grain} />
    </>
  );
}
