import styles from "./legal-page.module.css";

export const LEGAL_EFFECTIVE_DATE = "27 September 2026";

/** Shared shell for /privacy and /terms. Section headings use ids s1…sN to match `sections`. */
export function LegalPage({ title, sections, children }: { title: string; sections: string[]; children: React.ReactNode }) {
  return (
    <>
      <main className={`container ${styles.main}`}>
        <header className={styles.header}>
          <span className="kicker" aria-hidden="true" />
          <h1 id="legal-title" className={styles.title}>{title}</h1>
          <p className={styles.meta}>Effective {LEGAL_EFFECTIVE_DATE}</p>
        </header>
        <div className={styles.layout}>
          <nav className={styles.toc} aria-label="On this page">
            <p>On this page</p>
            {sections.map((s, i) => <a key={s} href={`#s${i + 1}`}><span>{i + 1}</span>{s}</a>)}
          </nav>
          <article className={styles.doc} aria-labelledby="legal-title">{children}</article>
        </div>
      </main>
    </>
  );
}
