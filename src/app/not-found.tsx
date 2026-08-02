import Link from "next/link";
import { Brand } from "@/components/brand";
import styles from "./not-found.module.css";

export default function NotFoundPage() {
  return <main className={styles.page}>
    <Brand />
    <section className={styles.card} aria-labelledby="not-found-heading">
      <span className={styles.code} aria-hidden="true">404</span>
      <h1 id="not-found-heading">This chunk is unexplored</h1>
      <p>The page you were looking for is not part of this world. Head back to Chulacraft and continue your adventure.</p>
      <Link className="button button-primary" href="/">Return home</Link>
    </section>
  </main>;
}
