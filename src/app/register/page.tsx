import Image from "next/image";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { RegistrationPanel } from "@/components/registration-panel";
import { SignOutButton } from "@/components/sign-out-button";
import type { RegistrationView } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import styles from "./register.module.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DiscordAuthButton } from "@/components/discord-auth";
import { CussoAuthButton } from "@/components/cusso-auth";

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
  
  try {
    let user;
    ({ data: { user } } = await supabase.auth.getUser());
    if (user) redirect("/welcome");
  } catch {
    return <ServiceUnavailable />;
  }

  return (
    <main className={`${styles.page} auth-scene`}>
      <SiteHeader />

      <section className={styles.hero} aria-labelledby="home-title">
        <div className={`${styles.backdrop} auth-scene-backdrop`} />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <h1 id="home-title">Login</h1>

            <div className={styles.actions}>
              <DiscordAuthButton />
              <CussoAuthButton />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
