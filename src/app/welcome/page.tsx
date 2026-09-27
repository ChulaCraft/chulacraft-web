import Link from "next/link";
import { LinkGoogleButton } from "@/components/google-auth";
import { ServerAddressCard } from "@/components/server-address-card";
import { SiteHeader } from "@/components/site-header";
import { classifyIdentities, identityEmail } from "@/lib/chula";
import { MAX_MINECRAFT_ACCOUNTS } from "@/lib/registration";
import { requireVerifiedUser } from "@/lib/verified-user";
import styles from "../dashboard/dashboard.module.css";
import { ServiceUnavailable } from "../dashboard/service-unavailable";

/** Landing page after sign-in: shows what's left to do, the profile page does the editing. */
export default async function WelcomePage() {
  const session = await requireVerifiedUser();
  if (!session) return <ServiceUnavailable />;
  const { supabase, user } = session;

  let accountCount = 0;
  let chulaEmail: string | null = null;
  let lookupFailed = false;
  try {
    const [accounts, claim] = await Promise.all([
      supabase.from("minecraft_registrations").select("id").eq("user_id", user.id).eq("is_active", true),
      supabase.from("chula_claims").select("email").eq("user_id", user.id).maybeSingle(),
    ]);
    lookupFailed = Boolean(accounts.error || claim.error);
    accountCount = accounts.data?.length ?? 0;
    chulaEmail = claim.data?.email ?? null;
  } catch {
    lookupFailed = true;
  }
  if (lookupFailed) return <ServiceUnavailable />;

  const personal = classifyIdentities(user.identities ?? []).personal.filter((i) => identityEmail(i) !== chulaEmail);
  const personalEmail = personal[0] ? identityEmail(personal[0]) : null;
  const meta = user.user_metadata;
  const name = typeof meta.full_name === "string" ? meta.full_name : typeof meta.user_name === "string" ? meta.user_name : "player";
  const ready = accountCount > 0;

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
            <li data-done="true">
              <span aria-hidden="true">✓</span>
              <div><strong>Verify Chula account</strong><small>{chulaEmail ?? "Done"}</small></div>
            </li>
            <li data-done={Boolean(personalEmail)}>
              <span aria-hidden="true">{personalEmail ? "✓" : "+"}</span>
              <div><strong>Add personal Google (optional)</strong><small>{personalEmail ?? "Sign in with your everyday Google account too."}</small></div>
              {!personalEmail && <LinkGoogleButton className={`button button-header-signup ${styles.linkButton}`} />}
            </li>
            <li data-done={ready}>
              <span aria-hidden="true">{ready ? "✓" : "4"}</span>
              <div><strong>Add a Minecraft account</strong><small>{ready ? `${accountCount} account${accountCount === 1 ? "" : "s"} registered` : `Java Edition, up to ${MAX_MINECRAFT_ACCOUNTS} accounts.`}</small></div>
              {!ready && <Link className={`button button-header-signup ${styles.linkButton}`} href="/dashboard">Add</Link>}
            </li>
          </ol>
        </section>

        {ready && <ServerAddressCard address={process.env.NEXT_PUBLIC_MINECRAFT_SERVER_ADDRESS} />}
        <p className={styles.intro}><Link href="/dashboard">Go to your profile →</Link></p>
      </div>
    </main>
  );
}
