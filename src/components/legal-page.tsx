import { Markdown } from "@/lib/markdown";
import styles from "./legal-page.module.css";

/** Text before the first "## " line, then one section per "## " line. */
export function splitSections(source: string) {
  const [intro, ...rest] = source.replace(/\r\n?/g, "\n").split(/^## +/m);
  return {
    intro,
    sections: rest.map((part) => {
      const nl = part.indexOf("\n");
      return nl === -1 ? { title: part.trim(), body: "" } : { title: part.slice(0, nl).trim(), body: part.slice(nl + 1) };
    }),
  };
}

/** Shell for /rules, /privacy and /terms: numbered sections from the Markdown,
 *  each linked from the side menu. `preview` is the admin editor's copy, which
 *  sits inside the admin's own <main>. */
export function LegalPage({ title, source, effective, preview = false }: { title: string; source: string; effective: string; preview?: boolean }) {
  const { intro, sections } = splitSections(source);
  const Main = preview ? "div" : "main";
  return (
    <Main className={`container ${styles.main}`}>
      <header className={styles.header}>
        <span className="kicker" aria-hidden="true" />
        <h1 id="legal-title" className={styles.title}>{title}</h1>
        <p className={styles.meta}>Effective {effective}</p>
      </header>
      <div className={styles.layout}>
        {sections.length > 0 && (
          <nav className={styles.toc} aria-label="On this page">
            <p>On this page</p>
            {sections.map((s, i) => <a key={i} href={`#s${i + 1}`}><span>{i + 1}</span>{s.title}</a>)}
          </nav>
        )}
        <article className={`md ${styles.doc}`} aria-labelledby="legal-title">
          <Markdown source={intro} />
          {sections.map((s, i) => <section key={i} className="md">
            <h2 id={`s${i + 1}`}><span>{i + 1}</span> {s.title}</h2>
            <Markdown source={s.body} />
          </section>)}
        </article>
      </div>
    </Main>
  );
}
