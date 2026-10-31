import adminStyles from "../admin.module.css";
import styles from "./insights.module.css";

// Same skeleton primitives as the other admin pages: the title, the range
// picker, a row of tiles and two chart panels.
export default function Loading() {
  return <div className={styles.page} aria-busy="true" aria-label="Loading insights">
    <span className={`skeleton ${adminStyles.skHead}`} />
    <span className={`skeleton ${styles.skRanges}`} />
    <div className={styles.tiles}>
      {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className={`skeleton ${styles.skTile}`} />)}
    </div>
    <div className={styles.grid}>
      <span className={`skeleton ${styles.skChart}`} />
      <span className={`skeleton ${styles.skChart}`} />
    </div>
  </div>;
}
