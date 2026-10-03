import styles from "../admin.module.css";

export default function Loading() {
  return <>
    <span className="skeleton" style={{ width: 200, height: 36 }} />
    <span className="skeleton" style={{ height: 120 }} />
    <ul className={styles.results} aria-busy="true" aria-label="Loading players">
      {[0, 1, 2].map((i) => (
        <li key={i} className={styles.skeletonRow}>
          <span className="skeleton" style={{ width: 40, height: 40 }} />
          <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}><span className="skeleton" style={{ width: "40%", height: 12 }} /><span className="skeleton" style={{ width: "60%", height: 10 }} /></span>
          <span className="skeleton" style={{ width: 90, height: 22 }} />
        </li>
      ))}
    </ul>
  </>;
}
