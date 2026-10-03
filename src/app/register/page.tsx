import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "./register.module.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DiscordAuthButton } from "@/components/discord-auth";
import { GoogleSignInButton } from "@/components/google-auth";
import { DiscordIcon, PixelIcon } from "@/components/icons";
import { discordCommunityUrl } from "@/lib/site-links";

export default async function RegisterPage() {
  const supabase = await createClient();
  let user = null;
  let unavailable = false;

  try {
    ({ data: { user } } = await supabase.auth.getUser());
  } catch {
    unavailable = true;
  }

  if (user) redirect("/welcome");

  return (
    <div className="page">
      <SiteHeader user={null} />
      <main className="narrow" style={{ "--narrow": "520px" } as React.CSSProperties}>
        <div>
          <div className="stack" style={{ "--gap": "10px" } as React.CSSProperties}>
            <p className="eyebrow">Welcome to ChulaCraft</p>
            <h1 className="page-title">Choose sign-in method</h1>
            <p className="lead">New here? Continue with Discord. Next, you&apos;ll verify your Chula Google account and add your faculty and major.</p>
          </div>

          {unavailable && (
            <div className="alert alert-error pixel-4" role="alert">
              <PixelIcon name="warning" />
              <div className="stack" style={{ "--gap": "4px" } as React.CSSProperties}>
                <p className="alert-title">Registration is temporarily unavailable</p>
                <p className="alert-body">We couldn&apos;t reach the sign-in service. Try again in a few minutes. If it keeps happening, let us know on <a href={discordCommunityUrl} target="_blank" rel="noreferrer">Discord</a>.</p>
              </div>
            </div>
          )}

          <div className="stack" style={{ "--gap": "14px" } as React.CSSProperties}>
            <DiscordAuthButton className={`${styles.provider} ${styles.providerPrimary}`}>
              <span className={styles.providerIcon} aria-hidden="true"><DiscordIcon /></span>
              <span className={styles.providerText}>
                <strong>Continue with Discord</strong>
                <span>New and returning players</span>
              </span>
              <span className={styles.providerArrow} aria-hidden="true">→</span>
            </DiscordAuthButton>

            <div className={styles.or} aria-hidden="true"><span />or<span /></div>

            <GoogleSignInButton className={styles.provider}>
              <span className={`${styles.providerIcon} ${styles.providerIconLight}`} aria-hidden="true">G</span>
              <span className={styles.providerText}>
                <strong>Sign in with Google</strong>
                <span>Only if you&apos;ve already linked one to your profile</span>
              </span>
              <span className={styles.providerArrow} aria-hidden="true">→</span>
            </GoogleSignInButton>
          </div>

          <div className={`pixel-4 ${styles.note}`}>
            <PixelIcon name="shield" className={styles.noteIcon} />
            <p>We use your Discord account to sign you in and your Chula Google account to confirm you&apos;re part of the Chula community. Details are in our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
