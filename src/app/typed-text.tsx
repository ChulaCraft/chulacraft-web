import type { CSSProperties } from "react";
import styles from "./home.module.css";

/** Text typed out a letter at a time behind a block caret (the letter and
 *  caret timing lives in home.module.css). Each part can carry its own class,
 *  as the hero does to highlight "Chula". Every letter carries its index in
 *  --i for its delay; spaces become no-break spaces so a flex row keeps them.
 *  Screen readers get the plain text; the letters are decoration. */
export function TypedText({ parts }: { parts: { text: string; className?: string }[] }) {
  let i = 0;
  const letters = (text: string) =>
    [...text].map((c) => {
      const n = i++;
      return <span key={n} className={styles.letter} style={{ "--i": n } as CSSProperties}>{c === " " ? " " : c}</span>;
    });
  return (
    <>
      <span className="sr-only">{parts.map((p) => p.text).join("")}</span>
      <span className={styles.typed} aria-hidden="true">
        {parts.map((p, k) => p.className ? <span key={k} className={p.className}>{letters(p.text)}</span> : letters(p.text))}
        <span className={styles.caret} />
      </span>
    </>
  );
}
