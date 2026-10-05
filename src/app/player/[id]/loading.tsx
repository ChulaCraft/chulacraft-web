import styles from "../../loading.module.css";

// Shown while the profile card read runs; the header and layout stay put.
export default function Loading() {
  return (
    <main className="narrow" aria-busy="true" aria-label="Loading player">
      <div className="stack gap-16">
        <span className={`skeleton ${styles.title}`} />
        <span className={`skeleton ${styles.panel}`} />
        <span className={`skeleton ${styles.lines}`} />
      </div>
    </main>
  );
}