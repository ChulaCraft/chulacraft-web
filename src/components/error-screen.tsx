import Image from "next/image";
import Link from "next/link";
import styles from "./error-screen.module.css";

/** A link, or a button when the screen is an error boundary offering a retry. */
type Href = { label: string; href: string };
type Action = Href | { label: string; onClick: () => void };

export function ErrorScreen({ code, title, body, primary, secondary, help }: {
  code: string; title: string; body: string; primary: Action; secondary: Href; help: string;
}) {
  return (
    <>
      <main className={styles.main}>
        <Image className={styles.bg} src="/images/collection/current/2026-08-12_20.42.49.webp" alt="" fill sizes="100vw" />
        <div className={styles.tint} aria-hidden="true" />
        <div className={`container ${styles.inner}`}>
          <p className={styles.code} aria-hidden="true">{code}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.body}>{body}</p>
          <div className={styles.actions}>
            {"href" in primary
              ? <Link className="btn btn-primary btn-lg" href={primary.href}>{primary.label}</Link>
              : <button type="button" className="btn btn-primary btn-lg" onClick={primary.onClick} autoFocus>{primary.label}</button>}
            <Link className="btn btn-lg" href={secondary.href}>{secondary.label}</Link>
          </div>
          <p className="hint">{help}</p>
        </div>
      </main>
    </>
  );
}
