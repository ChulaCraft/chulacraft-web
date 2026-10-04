import styles from "./loading.module.css";

// Shown instantly on navigation while a page's server data loads; the layout keeps the header.
export default function Loading() {
  return (
    <main className={`container stack gap-16 ${styles.main}`} aria-busy="true" aria-label="Loading">
      <span className={`skeleton ${styles.title}`} />
      <span className={`skeleton ${styles.lines}`} />
      <span className={`skeleton ${styles.panel}`} />
      <span className={`skeleton ${styles.panelShort}`} />
    </main>
  );
}
