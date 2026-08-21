import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
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
  let user = null;

  try {
    ({ data: { user } } = await supabase.auth.getUser());
  } catch {
    return <ServiceUnavailable />;
  }

  if (user) redirect("/welcome");

  return (
    <main className={`${styles.page} auth-scene`}>
      <div className={`${styles.backdrop} auth-scene-backdrop`} />
      <SiteHeader user={null} />

      <section className={styles.shell} aria-labelledby="register-title">
        <div className={styles.intro}>
          <p className={styles.eyebrow}><span aria-hidden="true">+</span> CHULACRAFT ACCESS <span aria-hidden="true">+</span></p>
          <h1 id="register-title">Register</h1>
          <p>Sign in to connect your Minecraft Java Edition account and join the ChulaCraft whitelist.</p>
        </div>

        <div className={`${styles.card} ${styles.authCard} pixel-panel`}>
          <p className={styles.cardLabel}>Choose a sign-in method</p>
          <h2>Continue to registration</h2>
          <p className={styles.introCopy}>Use Discord or your Chula account. You will return here to finish your player registration.</p>
          <div className={styles.actions}>
            <DiscordAuthButton />
            <CussoAuthButton />
          </div>
          <p className={styles.authNote}>Your sign-in is used only to identify your ChulaCraft registration.</p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
