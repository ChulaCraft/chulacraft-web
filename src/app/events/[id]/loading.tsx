import styles from "../../loading.module.css";
import event from "./event.module.css";

// Shown while the event detail read runs; the header and layout stay put.
export default function Loading() {
  return (
    <main className={`container ${event.main}`} aria-busy="true" aria-label="Loading event">
      <div className={event.layout}>
        <span className={`skeleton ${event.cover}`} />
        <span className={`skeleton ${styles.panel} ${event.info}`} />
        <span className={`skeleton ${styles.lines} ${event.body}`} />
      </div>
    </main>
  );
}