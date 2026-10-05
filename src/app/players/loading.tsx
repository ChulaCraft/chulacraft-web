import styles from "../loading.module.css";

// Shown while the player search runs; the header and the form stay put.
export default function Loading() {
  return (
    <main className="narrow" aria-busy="true" aria-label="Loading players">
      <div className="stack gap-16">
        <span className={`skeleton ${styles.title}`} />
        <span className={`skeleton ${styles.lines}`} />
        <span className={`skeleton ${styles.panel}`} />
        <span className={`skeleton ${styles.panelShort}`} />
      </div>
    </main>
  );
}