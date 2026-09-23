import Image from "next/image";
import { redirect } from "next/navigation";
import { RegistrationPanel } from "@/components/registration-panel";
import { REGISTRATION_COLUMNS, toRegistrationView, type RegistrationView } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import styles from "./dashboard.module.css";
import { SiteHeader } from "@/components/site-header";
import { ServiceUnavailable } from "./service-unavailable";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ linked?: string }> }) {
  const { linked } = await searchParams;
  const supabase = await createClient();
  let user;

  try {
    ({ data: { user } } = await supabase.auth.getUser());
  } catch {
    return <ServiceUnavailable />;
  }

  if (!user) redirect("/");

  let registrations: RegistrationView[] = [];
  let chulaUsername: string | null = null;
  let role = "user";
  let lookupFailed = false;

  try {
    const [accounts, chula, profile] = await Promise.all([
      supabase
        .from("minecraft_registrations")
        .select(REGISTRATION_COLUMNS)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at"),
      supabase.from("cu_sso_identities").select("chula_username").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle(),
    ]);
    lookupFailed = Boolean(accounts.error || chula.error || profile.error);
    registrations = (accounts.data ?? []).map(toRegistrationView);
    chulaUsername = chula.data?.chula_username ?? null;
    role = profile.data?.role ?? "user";
  } catch {
    lookupFailed = true;
  }

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
          {linked === "cu" && <p className={styles.statusNote} role="status">Chula SSO linked. You can now add Minecraft accounts.</p>}
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
              <small>Chula SSO</small>
              <strong>{chulaUsername ?? "Not linked"}</strong>
            </div>
            {chulaUsername ? (
              <span className={styles.connectedBadge}>Linked</span>
            ) : (
              <a className={`button button-header-signup ${styles.linkButton}`} href="/auth/cusso/start?intent=link">Link Chula SSO</a>
            )}
          </div>

          <RegistrationPanel
            initialRegistrations={registrations}
            lookupFailed={lookupFailed}
            canAdd={Boolean(chulaUsername)}
          />
        </div>
      </div>

      <footer className={styles.footer}>
        Java Edition only <span aria-hidden="true">•</span> Your registration is private
      </footer>
    </main>
  );
}
