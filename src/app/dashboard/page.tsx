import { LinkGoogleButton } from "@/components/google-auth";
import { PixelIcon } from "@/components/icons";
import { RegistrationPanel } from "@/components/registration-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { classifyIdentities, identityEmail, linkErrorMessage } from "@/lib/chula";
import { REGISTRATION_COLUMNS, toRegistrationView, type RegistrationView } from "@/lib/registration";
import { createAdminClient } from "@/lib/supabase/server";
import { requireVerifiedUser } from "@/lib/verified-user";
import Link from "next/link";
import { AboutYouForm } from "../register/details/about-you-form";
import { unlinkPersonalGoogle } from "./actions";
import styles from "./dashboard.module.css";
import { ServiceUnavailable } from "./service-unavailable";

type Profile = { first_name: string | null; last_name: string | null; nickname: string | null; faculty: string | null; major: string | null };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string; unlinked?: string; edit?: string; saved?: string }> }) {
  const { error: errorCode, unlinked, edit, saved } = await searchParams;
  const session = await requireVerifiedUser();
  if (!session) return <ServiceUnavailable />;
  const { supabase, user } = session;

  let registrations: RegistrationView[] = [];
  let profile: Profile | null = null;
  let chulaEmail: string | null = null;
  let chulaGoogleSub: string | null = null;
  let lookupFailed = false;

  try {
    const [accounts, profileRow, claim] = await Promise.all([
      supabase
        .from("minecraft_registrations")
        .select(REGISTRATION_COLUMNS)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at"),
      supabase.from("profiles").select("first_name, last_name, nickname, faculty, major").eq("user_id", user.id).maybeSingle(),
      // google_sub is not readable by the authenticated role, so the claim is
      // looked up with the admin client; the user id comes from the session.
      createAdminClient().from("chula_claims").select("email, google_sub").eq("user_id", user.id).maybeSingle(),
    ]);
    lookupFailed = Boolean(accounts.error || profileRow.error || claim.error);
    chulaEmail = claim.data?.email ?? null;
    chulaGoogleSub = claim.data?.google_sub ?? null;
    registrations = (accounts.data ?? []).map(toRegistrationView);
    profile = profileRow.data;
  } catch {
    lookupFailed = true;
  }

  const personalIdentity = classifyIdentities(user.identities ?? [], chulaGoogleSub).personal.find((i) => identityEmail(i) !== chulaEmail) ?? null;
  const errorMessage = linkErrorMessage(errorCode);

  const meta = user.user_metadata;
  const displayName = typeof meta.full_name === "string" ? meta.full_name : typeof meta.user_name === "string" ? meta.user_name : "Discord player";
  const handle = typeof meta.user_name === "string" ? meta.user_name : typeof meta.name === "string" ? meta.name : null;
  const avatar = typeof meta.avatar_url === "string" ? meta.avatar_url : null;
  const editing = edit === "info";
  const infoRows = [
    ["First name", profile?.first_name],
    ["Last name", profile?.last_name],
    ["Nickname", profile?.nickname],
    ["Faculty", profile?.faculty],
    ["Major", profile?.major],
  ] as const;

  return (
    <div className="page">
      <SiteHeader user={user} active="dashboard" />
      <main className={`container ${styles.main}`}>
        <div className="stack" style={{ "--gap": "10px" } as React.CSSProperties}>
          <span className="kicker" aria-hidden="true" />
          <h1 className="page-title">Your profile</h1>
          <p className="lead">Manage how you sign in and which Minecraft accounts are on the whitelist.</p>
        </div>

        {lookupFailed ? (
          <section className={`panel ${styles.loadError}`} role="alert">
            <h2 className={styles.cardTitle}><PixelIcon name="warning" size={22} className={styles.dangerIcon} />Couldn&apos;t load your profile</h2>
            <p className="muted">Something went wrong while loading your details. Your Minecraft accounts and whitelist aren&apos;t affected.</p>
            <Link href="/dashboard" className="link-button">Try again →</Link>
          </section>
        ) : (
          <div className={styles.layout}>
            <div className={styles.side}>
              <section className={`panel ${styles.profile}`} aria-label="Profile">
                {avatar
                  // eslint-disable-next-line @next/next/no-img-element -- Discord CDN avatar; next/image adds nothing here
                  ? <img className={`pixel-4 ${styles.avatar}`} src={avatar} alt="" width={72} height={72} referrerPolicy="no-referrer" />
                  : <span className={`avatar ${styles.avatar}`} role="img" aria-label="No profile picture">{displayName.charAt(0).toUpperCase()}</span>}
                <div className={styles.profileText}>
                  <p className={styles.displayName}>{displayName}</p>
                  {handle && <p className="muted">@{handle}</p>}
                </div>
              </section>

              <section className={`panel ${styles.card}`} aria-labelledby="info-title">
                <div className={styles.cardHead}>
                  <h2 id="info-title" className={styles.cardTitle}>Personal information</h2>
                  {!editing && <Link className="link-button" href="/dashboard?edit=info">Edit</Link>}
                </div>
                <div role="status" aria-live="polite">
                  {saved === "info" && !editing && <p className={`alert alert-success ${styles.smallAlert}`}><PixelIcon name="check" />Saved.</p>}
                </div>
                {editing ? (
                  <AboutYouForm
                    next="/dashboard"
                    submitLabel="Save changes"
                    cancelHref="/dashboard"
                    initial={{ first: profile?.first_name ?? "", last: profile?.last_name ?? "", nick: profile?.nickname ?? "", faculty: profile?.faculty ?? "", major: profile?.major ?? "" }}
                  />
                ) : (
                  <dl className={styles.info}>
                    {infoRows.map(([label, value]) => (
                      <div key={label} style={{ display: "contents" }}>
                        <dt>{label}</dt>
                        <dd data-empty={!value || undefined}>{value || "Not set"}</dd>
                      </div>
                    ))}
                  </dl>
                )}
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

            <RegistrationPanel initialRegistrations={registrations} />
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
