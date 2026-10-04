import Image from "next/image";
import Link from "next/link";
import styles from "./error-screen.module.css";

type Action = { label: string; href: string };

export function ErrorScreen({ code, title, body, primary, secondary, help }: {
  code: string; title: string; body: string; primary: Action; secondary: Action; help: string;
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
            <Link className="btn btn-primary btn-lg" href={primary.href}>{primary.label}</Link>
            <Link className="btn btn-lg" href={secondary.href}>{secondary.label}</Link>
          </div>
          <p className="hint">{help}</p>
        </div>
      </main>
    </>
  );
}
