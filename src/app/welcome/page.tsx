import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { ServerAddressCard } from "@/components/server-address-card";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import styles from "../dashboard/dashboard.module.css";

function ServiceUnavailable() {
  return (
    <main className={`${styles.page} auth-scene`}>
      <div className={`${styles.backdrop} auth-scene-backdrop`} />
      <div className={styles.errorLayout}>
        <Brand />
        <section className={`${styles.errorCard} pixel-panel`} role="status">
          <span className={styles.errorSymbol} aria-hidden="true"><i>!</i></span>
          <h1>Registration is temporarily unavailable</h1>
          <p>Please refresh in a moment. Your saved registration has not been changed.</p>
        </section>
      </div>
    </main>
  );
}

/** Landing page after sign-in: shows what's left to do, the profile page does the editing. */
export default async function WelcomePage() {
  const supabase = await createClient();
  let user;
  try {
    ({ data: { user } } = await supabase.auth.getUser());
  } catch {
    return <ServiceUnavailable />;
  }
  if (!user) redirect("/");

  let chulaLinked = false;
  let accountCount = 0;
  let lookupFailed = false;
  try {
    const [chula, accounts] = await Promise.all([
      supabase.from("cu_sso_identities").select("user_id").eq("user_id", user.id).maybeSingle(),
      supabase.from("minecraft_registrations").select("id").eq("user_id", user.id).eq("is_active", true),
    ]);
    lookupFailed = Boolean(chula.error || accounts.error);
    chulaLinked = Boolean(chula.data);
    accountCount = accounts.data?.length ?? 0;
  } catch {
    lookupFailed = true;
  }
  if (lookupFailed) return <ServiceUnavailable />;

  const meta = user.user_metadata;
  const name = typeof meta.full_name === "string" ? meta.full_name : typeof meta.user_name === "string" ? meta.user_name : "player";
  const ready = chulaLinked && accountCount > 0;

  return (
    <main className={`${styles.page} auth-scene`}>
      <div className={`${styles.backdrop} auth-scene-backdrop`} />
      <SiteHeader user={user} />

      <div className={styles.shell}>
        <section className={styles.intro} aria-labelledby="welcome-title">
          <p className={styles.eyebrow}><span aria-hidden="true">+</span> CHULACRAFT <span aria-hidden="true">+</span></p>
          <h1 id="welcome-title">Welcome</h1>
          <p>Hi {name}! {ready ? "You’re all set. See you on the server." : "Finish these steps to join the server."}</p>
        </section>

        <section className={`${styles.card} pixel-panel`} aria-label="Getting started">
          <ol className={styles.steps}>
            <li data-done="true">
              <span aria-hidden="true">✓</span>
              <div><strong>Sign in with Discord</strong><small>Done</small></div>
            </li>
            <li data-done={chulaLinked}>
              <span aria-hidden="true">{chulaLinked ? "✓" : "2"}</span>
              <div><strong>Link Chula SSO</strong><small>{chulaLinked ? "Done" : "Confirms you’re part of the CU community."}</small></div>
              {!chulaLinked && <a className={`button button-header-signup ${styles.linkButton}`} href="/auth/cusso/start?intent=link">Link</a>}
            </li>
            <li data-done={accountCount > 0}>
              <span aria-hidden="true">{accountCount > 0 ? "✓" : "3"}</span>
              <div><strong>Add a Minecraft account</strong><small>{accountCount > 0 ? `${accountCount} account${accountCount === 1 ? "" : "s"} registered` : "Java Edition, up to 5 accounts."}</small></div>
              {chulaLinked && accountCount === 0 && <Link className={`button button-header-signup ${styles.linkButton}`} href="/dashboard">Add</Link>}
            </li>
          </ol>
        </section>

        {ready && <ServerAddressCard address={process.env.NEXT_PUBLIC_MINECRAFT_SERVER_ADDRESS} />}
        <p className={styles.intro}><Link href="/dashboard">Go to your profile →</Link></p>
      </div>
    </main>
  );
}
