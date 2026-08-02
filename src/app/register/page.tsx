import Image from "next/image";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { RegistrationPanel } from "@/components/registration-panel";
import { SignOutButton } from "@/components/sign-out-button";
import type { RegistrationView } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import styles from "./register.module.css";

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

export default async function RegisterPage() {
  const supabase = await createClient();
  let user;

  try {
    ({ data: { user } } = await supabase.auth.getUser());
  } catch {
    return <ServiceUnavailable />;
  }

  if (!user) redirect("/");

  let data: {
    minecraft_username: string;
    desired_whitelisted: boolean;
    sync_status: string;
    updated_at: string;
  } | null = null;
  let lookupFailed = false;

  try {
    const lookup = await supabase
      .from("minecraft_registrations")
      .select("minecraft_username, desired_whitelisted, sync_status, updated_at")
      .maybeSingle();
    data = lookup.data;
    lookupFailed = Boolean(lookup.error);
  } catch {
    lookupFailed = true;
  }

  const registration: RegistrationView | null = data
    ? {
        minecraftUsername: data.minecraft_username,
        desiredWhitelisted: data.desired_whitelisted,
        syncStatus: data.sync_status as RegistrationView["syncStatus"],
        updatedAt: data.updated_at,
      }
    : null;
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
      <header className={`${styles.header} auth-scene-header`}>
        <Brand />
        <SignOutButton />
      </header>

      <div className={styles.shell}>
        <section className={styles.intro} aria-labelledby="register-title">
          <p className={styles.eyebrow}><span aria-hidden="true">+</span> CHULACRAFT WHITELIST <span aria-hidden="true">+</span></p>
          <h1 id="register-title">Register</h1>
          <p>Connect your Minecraft Java Edition account to start your adventure.</p>
        </section>

        <div className={styles.panelStack}>
          <div className={styles.playerBar}>
            {avatar ? (
              <Image
                src={avatar}
                alt=""
                width={40}
                height={40}
                unoptimized
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className={styles.avatarFallback} aria-hidden="true">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <small>Discord connected</small>
              <strong>{displayName}</strong>
            </div>
            <span className={styles.connectedBadge}>Online</span>
          </div>

          <RegistrationPanel
            initialRegistration={registration}
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
