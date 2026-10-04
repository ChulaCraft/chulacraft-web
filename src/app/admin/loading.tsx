import styles from "./admin.module.css";

// The layouts keep the header, so only the content area needs a placeholder.
export default function Loading() {
  return <>
    <span className={`skeleton ${styles.skHead}`} aria-busy="true" aria-label="Loading" />
    <span className={`skeleton ${styles.skLines}`} />
    <span className={`skeleton ${styles.skTall}`} />
  </>;
}
