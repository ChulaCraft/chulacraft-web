import { LinkGoogleButton } from "@/components/google-auth";
import { PixelIcon } from "@/components/icons";
import { RegistrationPanel } from "@/components/registration-panel";
import { classifyIdentities, identityEmail, linkErrorMessage } from "@/lib/chula";
import { REGISTRATION_COLUMNS, toRegistrationView, type RegistrationView } from "@/lib/registration";
import { requireVerifiedUser } from "@/lib/verified-user";
import Link from "next/link";
import { unlinkPersonalGoogle, updatePrivacy } from "../dashboard/actions";
import styles from "../dashboard/dashboard.module.css";
import { ServiceUnavailable } from "../dashboard/service-unavailable";

/** my_privacy() builds jsonb, so generated types cannot describe it; a
 *  missing row reads back as all-public. */
type Privacy = { profile: string; minecraft: string; achievements: string; friends: string };

const LEVEL_OPTIONS: { value: string; label: string }[] = [
  { value: "public", label: "Anyone signed in" },
  { value: "friends", label: "Friends only" },
  { value: "private", label: "Nobody" }
];

const PRIVACY_ERRORS: Record<string, string> = {
  INVALID_LEVEL: "That privacy setting isn't one we know.",
  FAILED: "That didn't save. Please try again in a moment."
};

const PRIVACY_FIELDS = [
  ["profile", "Profile", "Whether anybody can open your profile at all."],
  ["minecraft", "Minecraft names", "The usernames linked to your account."],
  ["achievements", "Achievements", "The badges you have earned."],
  ["friends", "Friend list", "Who you are friends with."]
] as const;

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; unlinked?: string; done?: string }> }) {
  const { error: errorCode, unlinked, done } = await searchParams;
  const session = await requireVerifiedUser();
  if (!session) return <ServiceUnavailable />;
  const { supabase, user } = session;

  let registrations: RegistrationView[] = [];
  let chulaEmail: string | null = null;
  let chulaGoogleSub: string | null = null;
  let privacy: Privacy = { profile: "public", minecraft: "public", achievements: "public", friends: "public" };
  let lookupFailed = false;

  try {
    const [accounts, claim, privacyRow] = await Promise.all([
      supabase
        .from("minecraft_registrations")
        .select(REGISTRATION_COLUMNS)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at"),
      // my_chula_claim() returns the caller's own row, so this page never needs
      // the service-role client just to show which account is claimed.
      supabase.rpc("my_chula_claim").maybeSingle(),
      supabase.rpc("my_privacy")
    ]);
    lookupFailed = Boolean(accounts.error || claim.error);
    chulaEmail = claim.data?.email ?? null;
    chulaGoogleSub = claim.data?.google_sub ?? null;
    registrations = (accounts.data ?? []).map(toRegistrationView);
    privacy = (privacyRow.data as Privacy | null) ?? privacy;
  } catch {
    lookupFailed = true;
  }

  const personalIdentity = classifyIdentities(user.identities ?? [], chulaGoogleSub).personal.find((i) => identityEmail(i) !== chulaEmail) ?? null;
  const errorMessage = linkErrorMessage(errorCode);
  const privacyError = errorMessage ? null : PRIVACY_ERRORS[errorCode ?? ""] ?? null;

  return (
    <main className={`container ${styles.main}`}>
      <div className="stack gap-10">
        <span className="kicker" aria-hidden="true" />
        <h1 className="page-title">Settings</h1>
        <p className="lead">Your Minecraft accounts, who can see what, and how you sign in.</p>
      </div>

      {lookupFailed ? (
        <section className={`panel ${styles.loadError}`} role="alert">
          <h2 className={styles.cardTitle}><PixelIcon name="warning" size={22} className={styles.dangerIcon} />Couldn&apos;t load your settings</h2>
          <p className="muted">Something went wrong while loading your details. Your Minecraft accounts and whitelist aren&apos;t affected.</p>
          <Link href="/settings" className="link-button">Try again →</Link>
        </section>
      ) : (
        <div className={styles.layout}>
          <div className={styles.side}>
            {/* AC 19: four selects, all saved together, so the most
                restrictive of profile and field is what the database applies. */}
            <section className={`panel ${styles.card}`} aria-labelledby="privacy-title">
              <h2 id="privacy-title" className={styles.cardTitle}>Privacy</h2>
              <div role="status" aria-live="polite">
                {done === "privacy" && <p className={`alert alert-success ${styles.smallAlert}`}><PixelIcon name="check" />Privacy settings saved.</p>}
                {privacyError && <div className={`alert alert-error ${styles.smallAlert}`} role="alert"><PixelIcon name="warning" /><p>{privacyError}</p></div>}
              </div>
              <form action={updatePrivacy} className={styles.privacyForm}>
                {PRIVACY_FIELDS.map(([field, label, help]) => (
                  <div className="field" key={field}>
                    <label htmlFor={`privacy-${field}`}>{label}</label>
                    <select id={`privacy-${field}`} name={field} className="input" defaultValue={privacy[field]}>
                      {LEVEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <p className="field-help">{help}</p>
                  </div>
                ))}
                <div className={styles.privacyActions}>
                  <button type="submit" className="btn btn-primary">Save privacy</button>
                  <p className="hint">Everything is public unless you change it here.</p>
                </div>
              </form>
            </section>

            <section className={`panel ${styles.card}`} aria-labelledby="methods-title">
              <h2 id="methods-title" className={styles.cardTitle}>Sign-in methods</h2>
              {errorMessage && <div className={`alert alert-error ${styles.smallAlert}`} role="alert"><PixelIcon name="warning" /><p>{errorMessage}</p></div>}
              {unlinked && <p className={`alert alert-success ${styles.smallAlert}`} role="status"><PixelIcon name="check" />Personal Google account unlinked.</p>}
              {/* No claim past requireVerifiedUser means a guest: there's no Chula account to show. */}
              {chulaEmail && (
                <div className={styles.method}>
                  <div className={styles.cardHead}>
                    <h3>Chula Google</h3>
                    <span className="badge badge-green pixel-4"><PixelIcon name="check" />Verified</span>
                  </div>
                  <p className="mono">{chulaEmail}</p>
                  <p className="hint">Can&apos;t be changed without an admin.</p>
                </div>
              )}
              <div className={styles.method}>
                <div className={styles.cardHead}>
                  <h3>Personal Google <span className="optional">(optional)</span></h3>
                  {personalIdentity
                    ? <span className="badge badge-green pixel-4"><PixelIcon name="check" />Linked</span>
                    : <span className="badge badge-muted pixel-4">Not linked</span>}
                </div>
                {personalIdentity ? (
                  <form action={unlinkPersonalGoogle} className={styles.methodRow}>
                    <p className="mono">{identityEmail(personalIdentity)}</p>
                    <input type="hidden" name="identityId" value={personalIdentity.identity_id} />
                    <button type="submit" className="btn btn-sm btn-outline">Unlink</button>
                  </form>
                ) : (
                  <div className={styles.methodRow}>
                    <p className="muted">Lets you sign in with Google as well as Discord.</p>
                    <LinkGoogleButton className="btn btn-sm" />
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className={styles.wide}>
            <RegistrationPanel initialRegistrations={registrations} />
          </div>
        </div>
      )}
    </main>
  );
}
