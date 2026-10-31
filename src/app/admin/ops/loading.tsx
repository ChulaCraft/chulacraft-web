import adminStyles from "../admin.module.css";
import styles from "./ops.module.css";

// The title, then a few service rows.
export default function Loading() {
  return <div className={styles.page} aria-busy="true" aria-label="Loading ops">
    <span className={`skeleton ${adminStyles.skHead}`} />
    {[0, 1, 2, 3].map((i) => <span key={i} className={`skeleton ${styles.skRow}`} />)}
  </div>;
}
