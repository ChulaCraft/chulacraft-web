import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { openPendingLink, PENDING_LINK_COOKIE } from "@/lib/cusso/pending";
import { createClient } from "@/lib/supabase/server";
import styles from "../../error/auth-error.module.css";
import { confirmLink } from "./actions";

export default async function ConfirmCuLinkPage() {
  const pending = openPendingLink((await cookies()).get(PENDING_LINK_COOKIE)?.value);
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!pending || !user || pending.userId !== user.id) redirect("/auth/error?reason=start_failed");

  return (
    <main className={`${styles.page} auth-scene`}>
      <div className={`${styles.backdrop} auth-scene-backdrop`} />
      <header className={`${styles.header} auth-scene-header`}><Brand /></header>
      <section className={styles.layout} aria-labelledby="cu-confirm-title">
        <p className={styles.eyebrow}><span aria-hidden="true">+</span> CHULA SSO <span aria-hidden="true">+</span></p>
        <div className={`${styles.card} pixel-panel`}>
          <h1 id="cu-confirm-title">Link this Chula account?</h1>
          <p>
            <strong>{pending.displayName ?? pending.username}</strong> ({pending.username}) will be linked to your account.
            Only continue if you just signed in to Chula SSO yourself.
          </p>
          <form action={confirmLink}>
            <button className={`button button-primary ${styles.button}`} type="submit">Link account</button>
          </form>
          <Link className={styles.button} href="/dashboard">Cancel</Link>
        </div>
      </section>
    </main>
  );
}
