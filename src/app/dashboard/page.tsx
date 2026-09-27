import Image from "next/image";
import { LinkGoogleButton } from "@/components/google-auth";
import { RegistrationPanel } from "@/components/registration-panel";
import { classifyIdentities, identityEmail, linkErrorMessage } from "@/lib/chula";
import { REGISTRATION_COLUMNS, toRegistrationView, type RegistrationView } from "@/lib/registration";
import { requireVerifiedUser } from "@/lib/verified-user";
import styles from "./dashboard.module.css";
import { SiteHeader } from "@/components/site-header";
import { ServiceUnavailable } from "./service-unavailable";
import { unlinkPersonalGoogle } from "./actions";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string; unlinked?: string }> }) {
  const { error: errorCode, unlinked } = await searchParams;
  const session = await requireVerifiedUser();
  if (!session) return <ServiceUnavailable />;
  const { supabase, user } = session;

  let registrations: RegistrationView[] = [];
  let role = "user";
  let chulaEmail: string | null = null;
  let lookupFailed = false;

  try {
    const [accounts, profile, claim] = await Promise.all([
      supabase
        .from("minecraft_registrations")
        .select(REGISTRATION_COLUMNS)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at"),
      supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle(),
      supabase.from("chula_claims").select("email").eq("user_id", user.id).maybeSingle(),
    ]);
    lookupFailed = Boolean(accounts.error || profile.error || claim.error);
    chulaEmail = claim.data?.email ?? null;
    registrations = (accounts.data ?? []).map(toRegistrationView);
    role = profile.data?.role ?? "user";
  } catch {
    lookupFailed = true;
  }

  const personalIdentity = classifyIdentities(user.identities ?? []).personal.find((i) => identityEmail(i) !== chulaEmail) ?? null;
  const errorMessage = linkErrorMessage(errorCode);

  const meta = user.user_metadata;
  const displayName =
    typeof meta.full_name === "string"
      ? meta.full_name
      : typeof meta.user_name === "string"
        ? meta.user_name
        : "Discord player";
  const avatar = typeof meta.avatar_url === "string" ? meta.avatar_url : null;

  return (
    <main className={`${styles.page} auth-scene`}>
      <div className={`${styles.backdrop} auth-scene-backdrop`} />
      <SiteHeader user={user} />

      <div className={styles.shell}>
        <section className={styles.intro} aria-labelledby="register-title">
          <p className={styles.eyebrow}><span aria-hidden="true">+</span> CHULACRAFT PROFILE <span aria-hidden="true">+</span></p>
          <h1 id="register-title">Profile</h1>
          <p>Manage your sign-in methods and Minecraft Java Edition accounts.</p>
          {errorMessage && <p className={styles.statusNote} role="alert">{errorMessage}</p>}
          {unlinked && <p className={styles.statusNote} role="status">Personal Google account unlinked.</p>}
        </section>

        <div className={styles.panelStack}>
          <div className={styles.profileCard}>
            {avatar ? (
              <Image
                src={avatar}
                alt=""
                width={96}
                height={96}
                unoptimized
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className={styles.avatarFallback} aria-hidden="true">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <strong>{displayName}</strong>
              <small>Discord connected{role !== "user" && ` · ${role}`}</small>
              <small>Your picture and name come from Discord. Change them there and sign in again.</small>
            </div>
          </div>

          <div className={styles.playerBar}>
            <span className={styles.avatarFallback} aria-hidden="true">CU</span>
            <div>
              <small>Chula Google</small>
              <strong>{chulaEmail ?? "Verified"}</strong>
            </div>
            <span className={styles.connectedBadge}>Linked</span>
          </div>

          <div className={styles.playerBar}>
            <span className={styles.avatarFallback} aria-hidden="true">G</span>
            <div>
              <small>Personal Google (optional sign-in)</small>
              <strong>{personalIdentity ? identityEmail(personalIdentity) : "Not linked"}</strong>
            </div>
            {personalIdentity ? (
              <form action={unlinkPersonalGoogle}>
                <input type="hidden" name="identityId" value={personalIdentity.identity_id} />
                <button type="submit" className={`button button-header-signup ${styles.linkButton}`}>Unlink</button>
              </form>
            ) : (
              <LinkGoogleButton className={`button button-header-signup ${styles.linkButton}`} />
            )}
          </div>

          <RegistrationPanel
            initialRegistrations={registrations}
            lookupFailed={lookupFailed}
          />
        </div>
      </div>

      <footer className={styles.footer}>
        Java Edition only <span aria-hidden="true">•</span> Your registration is private
      </footer>
    </main>
  );
}
