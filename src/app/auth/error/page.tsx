import Link from "next/link";
import { Brand } from "@/components/brand";
import { authFailureMessage, safeAuthFailureReason } from "@/lib/auth-error";
import styles from "./auth-error.module.css";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const reason = safeAuthFailureReason((await searchParams).reason);

  return (
    <main className={`${styles.page} auth-scene`}>
      <div className={`${styles.backdrop} auth-scene-backdrop`} />
      <header className={`${styles.header} auth-scene-header`}><Brand /></header>
      <section className={styles.layout} aria-labelledby="auth-error-title">
        <p className={styles.eyebrow}><span aria-hidden="true">+</span> AUTHENTICATION <span aria-hidden="true">+</span></p>
        <div className={`${styles.card} pixel-panel`}>
          <span className={styles.errorSymbol} aria-hidden="true"><i>!</i></span>
          <h1 id="auth-error-title">Discord sign-in didn’t finish</h1>
          <p>{authFailureMessage(reason)}</p>
          <Link className={`button button-primary ${styles.button}`} href="/">Try again</Link>
        </div>
      </section>
    </main>
  );
}
