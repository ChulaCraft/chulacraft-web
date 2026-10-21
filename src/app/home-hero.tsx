import Image from "next/image";
import Link from "next/link";
import { DiscordIcon } from "@/components/icons";
import { discordCommunityUrl } from "@/lib/site-links";
import styles from "./home.module.css";

/** The homepage hero. The admin settings page renders it too, as a live
 *  preview: `preview` keeps it out of the page outline and off the preload list. */
export function HomeHero({ kicker, intro, preview = false }: { kicker: string; intro: string; preview?: boolean }) {
  const Heading = preview ? "p" : "h1";
  return (
    <section className={styles.hero} aria-labelledby={preview ? undefined : "hero-title"} data-preview={preview || undefined}>
      <div className={styles.heroFrame}>
        <Image
          className={styles.heroImage}
          src="/images/landingpage-bg.webp"
          alt="ChulaCraft players outside a Chulalongkorn-inspired Minecraft building"
          fill
          preload={!preview}
          sizes="(min-width: 1920px) 1920px, 100vw"
        />
      </div>
      <div className={styles.heroTint} aria-hidden="true" />
      <div className={`container ${styles.heroInner}`}>
        <p className="eyebrow">Minecraft Java survival server for the Chula community</p>
        <Heading id={preview ? undefined : "hero-title"} className={styles.heroTitle}>
          <span className={styles.kicker}>{kicker}</span>{" "}
          <span className={styles.brandName}>ChulaCraft</span>
        </Heading>
        <p className={styles.heroIntro}>{intro}</p>
        <div className={styles.actions}>
          <Link className="btn btn-primary btn-lg" href="/register">Register <span aria-hidden="true">→</span></Link>
          <a className="btn btn-lg" href={discordCommunityUrl} target="_blank" rel="noreferrer"><DiscordIcon /> Join Discord</a>
        </div>
        <p className={styles.terms}>By registering you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
      </div>
    </section>
  );
}
