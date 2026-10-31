import styles from "../../loading.module.css";

// Shown while the profile card read runs; the header and layout stay put. At least a
// screen tall (styles.main), or the footer paints in view and jumps when the card streams in.
export default function Loading() {
  return (
    <main className={`narrow ${styles.main}`} aria-busy="true" aria-label="Loading player">
      <div className="stack gap-16">
        <span className={`skeleton ${styles.title}`} />
        <span className={`skeleton ${styles.panel}`} />
        <span className={`skeleton ${styles.lines}`} />
      </div>
    </main>
  );
}