import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import styles from "./legal-page.module.css";

export const LEGAL_EFFECTIVE_DATE = "27 September 2026";

/** Shared shell for /privacy and /terms. */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className={styles.page}>
      <SiteHeader />
      <article className={styles.doc} aria-labelledby="legal-title">
        <h1 id="legal-title">{title}</h1>
        <p className={styles.meta}>Effective {LEGAL_EFFECTIVE_DATE}</p>
        {children}
      </article>
      <SiteFooter />
    </main>
  );
}
