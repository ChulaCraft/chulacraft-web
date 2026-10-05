import styles from "../admin.module.css";

export default function Loading() {
  return <>
    <span className={`skeleton ${styles.skHead}`} aria-busy="true" aria-label="Loading" />
    <ul className={styles.catalog} aria-busy="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className={styles.skeletonRow}>
          <span className={`skeleton ${styles.catalogThumb}`} />
          <span className={styles.skRowLines}><span className="skeleton" /><span className="skeleton" /></span>
          <span className={`skeleton ${styles.skBadge}`} />
        </li>
      ))}
    </ul>
  </>;
}