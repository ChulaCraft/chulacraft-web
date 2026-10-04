import Link from "next/link";
import { redirect } from "next/navigation";
import { LinkGoogleButton } from "@/components/google-auth";
import { SignOutButton } from "@/components/sign-out-button";
import { PixelIcon } from "@/components/icons";
import { StepProgress } from "@/components/step-progress";
import { linkErrorMessage } from "@/lib/chula";
import { reconcileIdentities } from "@/lib/reconcile-identities";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import styles from "./verify.module.css";
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
      const { data: verified, error } = await supabase.rpc("am_i_player_verified");
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
    <>
      <main className="narrow" style={{ "--narrow": "540px" } as React.CSSProperties}>
        <div>
          <div className="stack">
            <StepProgress step={2} />
            <h1 className="page-title">One more step: Verify you&apos;re Chula</h1>
            <p className="lead">Sign in with your Chula Google account. We only use it to confirm you&apos;re part of the Chula community.</p>
          </div>

          {errorMessage && (
            <div className="alert alert-error" role="alert">
              <PixelIcon name="warning" />
              <div className="stack" style={{ "--gap": "4px" } as React.CSSProperties}>
                <p className="alert-title">Verification didn&apos;t finish</p>
                <p className="alert-body">{errorMessage}</p>
              </div>
            </div>
          )}

          <section className={`panel ${styles.card}`} aria-label="Verify Chula account">
            <div className="stack" style={{ "--gap": "6px" } as React.CSSProperties}>
              <p className={styles.label}>Accepted accounts</p>
              <div className={styles.chips}><span className="chip">@chula.ac.th</span><span className="chip">@student.chula.ac.th</span></div>
            </div>
            <div className="alert alert-warning">
              <PixelIcon name="lock" />
              <p className="alert-body"><strong className="tone-amber">Choose carefully.</strong> Your Chula account can&apos;t be changed later without an admin. See the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
            </div>
            <LinkGoogleButton chula className="btn btn-primary btn-lg" />
          </section>

          <div className={styles.footer}>
            <p className="hint">Invited by an admin? Ask them on Discord to finish setting you up.</p>
            <SignOutButton className="link-button" />
          </div>
        </div>
      </main>
    </>
  );
}
