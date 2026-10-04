import styles from "../admin.module.css";

export default function Loading() {
  return <>
    <span className={`skeleton ${styles.skHead}`} />
    <span className={`skeleton ${styles.skLines}`} />
    <ul className={styles.results} aria-busy="true" aria-label="Loading players">
      {[0, 1, 2].map((i) => (
        <li key={i} className={styles.skeletonRow}>
          <span className={`skeleton ${styles.avatarSm}`} />
          <span className={styles.skRowLines}><span className="skeleton" /><span className="skeleton" /></span>
          <span className={`skeleton ${styles.skBadge}`} />
        </li>
      ))}
    </ul>
  </>;
}
