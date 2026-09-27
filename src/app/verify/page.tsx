import Link from "next/link";
import { redirect } from "next/navigation";
import { LinkGoogleButton } from "@/components/google-auth";
import { SignOutButton } from "@/components/sign-out-button";
import { SiteHeader } from "@/components/site-header";
import { linkErrorMessage } from "@/lib/chula";
import { reconcileIdentities } from "@/lib/reconcile-identities";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import styles from "../dashboard/dashboard.module.css";
import { ServiceUnavailable } from "../dashboard/service-unavailable";

/** The one step between Discord sign-in and the rest of the site. */
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  let errorCode = (await searchParams).error;
  const supabase = await createClient();
  let user;
  let destination: string | null = null;
  let lookupFailed = false;
  try {
    ({ data: { user } } = await supabase.auth.getUser());
    if (user) {
      const { data: verified, error } = await supabase.rpc("am_i_chula_verified");
      if (error) lookupFailed = true;
      else if (verified === true) destination = "/welcome";
      else {
        // Identities linked from the console skip /auth/callback; clean them up here.
        const { data: identityData, error: identityError } = await supabase.auth.getUserIdentities();
        if (identityError || !identityData) lookupFailed = true;
        else {
          const outcome = await reconcileIdentities(supabase, createAdminClient(), user.id, identityData.identities);
          if (outcome.signOut) destination = `/auth/error?reason=${outcome.reason}`;
          else if (!outcome.path.startsWith("/verify")) destination = outcome.path;
          else errorCode = new URL(outcome.path, "http://x").searchParams.get("error") ?? errorCode;
        }
      }
    }
  } catch {
    lookupFailed = true;
  }
  if (lookupFailed) return <ServiceUnavailable />;
  if (!user) redirect("/");
  if (destination) redirect(destination);
  const errorMessage = linkErrorMessage(errorCode);

  return (
    <main className={`${styles.page} auth-scene`}>
      <div className={`${styles.backdrop} auth-scene-backdrop`} />
      <SiteHeader user={user} />

      <div className={styles.shell}>
        <section className={styles.intro} aria-labelledby="verify-title">
          <p className={styles.eyebrow}><span aria-hidden="true">+</span> ONE MORE STEP <span aria-hidden="true">+</span></p>
          <h1 id="verify-title">Verify you’re Chula</h1>
          <p>Link your @chula.ac.th or @student.chula.ac.th Google account to finish signing up.</p>
          {errorMessage && <p className={styles.statusNote} role="alert">{errorMessage}</p>}
        </section>

        <section className={`${styles.card} pixel-panel`} aria-label="Verify Chula account">
          <LinkGoogleButton chula />
          <p><small>We store your Chula Google email to confirm CU membership. It can’t be changed later without an admin. See the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</small></p>
          <SignOutButton />
        </section>
      </div>
    </main>
  );
}
