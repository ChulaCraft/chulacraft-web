import Image from "next/image";
import Link from "next/link";
import { DiscordIcon, PixelIcon } from "@/components/icons";
import { CopyButton } from "@/components/copy-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { serverAddress } from "@/components/server-address-card";
import { discordCommunityUrl } from "@/lib/site-links";
import styles from "./home.module.css";

const features = [
  { title: "Safe play with clear rules", copy: "Rules are posted up front and community admins keep the world friendly for everyone.", tone: "var(--pink)", icon: "M2 1h8v1h1v5h-1v2h-1v1h-1v1h-1v1h-2v-1h-1v-1h-1v-1h-1v-2h-1v-5h1z" },
  { title: "Active community", copy: "Regular events in-game and a busy Discord where players meet, plan, and team up.", tone: "var(--lavender)", icon: "M1 2h10v6h-5v1h-1v1h-1v1h-1v-3h-2z" },
  { title: "Survival and creative in one shared world", copy: "Gather, explore, and build in survival, then plan big projects in creative.", tone: "var(--green)", icon: "M5 1h2v1h2v1h2v6h-2v1h-2v1h-2v-1h-2v-1h-2v-6h2v-1h2zM2 4v4h1v1h2v1h1v-5h-1v-1h-2v0z" },
  { title: "Community-made plugins", copy: "Plugins and quality-of-life improvements built and maintained by players.", tone: "var(--pink-soft)", icon: "M1 3h3v-1h1v-1h2v1h1v1h3v3h-1v1h-1v1h1v1h1v2h-10v-3h1v-1h1v-1h-1v-1h-1z" },
];

const steps = [
  // Images: re-shoot with `node scripts/capture-join-guide.mjs`.
  { title: "Sign in with Discord", copy: "Press Continue with Discord on the Register page. This creates your ChulaCraft profile.", img: "1-discord.webp", w: 1040, h: 410 },
  { title: "Verify Chula", copy: "Sign in with your @chula.ac.th or @student.chula.ac.th Google account. Pick carefully, it can't be changed later.", img: "2-verify.webp", w: 1080, h: 574 },
  { title: "Add your Minecraft name", copy: "Type your Java Edition username on your profile. Up to 5 usernames go on the whitelist.", img: "3-minecraft.webp", w: 1180, h: 722 },
  { title: "Join", copy: `In Minecraft Java Edition, open Multiplayer → Add Server and enter ${serverAddress ?? "the server address"}.`, img: "4-join.webp", w: 1180, h: 260 },
];

export default function HomePage() {
  return (
    <div className="page">
      <SiteHeader active="home" overlay />
      <main>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroFrame}>
            <Image
              className={styles.heroImage}
              src="/images/landingpage-bg.webp"
              alt="ChulaCraft players outside a Chulalongkorn-inspired Minecraft building"
              fill
              preload
              sizes="(min-width: 1920px) 1920px, 100vw"
            />
          </div>
          <div className={styles.heroTint} aria-hidden="true" />
          <div className={`container ${styles.heroInner}`}>
            <p className="eyebrow">Minecraft Java survival server for the Chula community</p>
            <h1 id="hero-title" className={styles.heroTitle}>Build. Explore. <span>Connect.</span></h1>
            <p className={styles.heroIntro}>A community-run survival world for the Chula community. Sign in with Discord, verify your Chula account, and start building.</p>
            <div className={styles.actions}>
              <Link className="btn btn-primary btn-lg" href="/register">Register <span aria-hidden="true">→</span></Link>
              <a className="btn btn-lg" href={discordCommunityUrl} target="_blank" rel="noreferrer"><DiscordIcon /> Join Discord</a>
            </div>
          </div>
        </section>

        <div className={`container ${styles.addressWrap}`}>
          <section className={`panel panel-edge ${styles.address}`} aria-labelledby="addr-label">
            <div className={styles.addressText}>
              <h2 id="addr-label" className={styles.addressLabel}>Server address</h2>
              <p className={`mono ${styles.addressValue}`}>{serverAddress ?? "Coming soon"}</p>
              <p className={styles.addressNote}>
                <PixelIcon name="info" className="tone-amber" />
                <span><strong>Java Edition only.</strong> Bedrock and console can&apos;t connect.</span>
              </p>
            </div>
            {serverAddress && <CopyButton text={serverAddress} />}
          </section>
        </div>

        <section className={`container ${styles.section}`} aria-labelledby="features-title">
          <p className="eyebrow">What it&apos;s like</p>
          <h2 id="features-title" className={styles.sectionTitle}>One shared world, built by the Chula community</h2>
          <ul className={styles.features}>
            {features.map((f, i) => (
              <li key={f.title} className="panel">
                <div className={styles.featureTop}>
                  <span className={`pixel-4 ${styles.featureIcon}`} style={{ background: f.tone }} aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 12 12" fill="currentColor" shapeRendering="crispEdges"><path d={f.icon} fillRule="evenodd" /></svg>
                  </span>
                  <span className={styles.featureNum} aria-hidden="true">0{i + 1}</span>
                </div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className="muted">{f.copy}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={`container ${styles.section}`} aria-labelledby="join-title">
          <p className="eyebrow">Four steps</p>
          <h2 id="join-title" className={styles.sectionTitle}>How to join</h2>
          <ol className={styles.steps}>
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className={`pixel-4 ${styles.stepNum}`} data-last={i === steps.length - 1 || undefined} aria-hidden="true">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.copy}</p>
                <div className={`pixel-4 ${styles.stepShot}`}>
                  <Image src={`/images/guide/${s.img}`} alt="" width={s.w} height={s.h} sizes="(min-width: 1200px) 280px, (min-width: 520px) 45vw, 90vw" />
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={`container ${styles.section} ${styles.ctaSection}`} aria-labelledby="cta-title">
          <div className={`pixel-8 ${styles.cta}`}>
            <div className={styles.ctaText}>
              <h2 id="cta-title" className="display">Ready to build?</h2>
              <p>Registering takes a few minutes. Questions first? Ask in our Discord.</p>
            </div>
            <div className={styles.actions}>
              <Link className={`btn btn-lg ${styles.ctaPrimary}`} href="/register">Register <span aria-hidden="true">→</span></Link>
              <a className={`btn btn-lg ${styles.ctaSecondary}`} href={discordCommunityUrl} target="_blank" rel="noreferrer">Join Discord</a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
