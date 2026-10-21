import Image from "next/image";
import Link from "next/link";
import { RegisterConsent } from "@/components/register-consent";
import { HeroStage } from "./hero-stage";
import { TypedText } from "./typed-text";
import styles from "./home.module.css";

/** The homepage hero: the world fills the screen, then shrinks into a card
 *  as the reader scrolls and the site header slides in (HeroStage drives it).
 *  The admin settings page renders it too, as a live preview: `preview`
 *  shows the settled card, keeps it out of the page outline, off the preload
 *  list and inert. */
export function HomeHero({ kicker, intro, preview = false }: { kicker: string; intro: string; preview?: boolean }) {
  const Heading = preview ? "p" : "h1";
  const stage = (
    <div className={styles.stage}>
      <div className={styles.card}>
        <Image
          className={styles.cardImage}
          src="/images/landingpage-bg.webp"
          alt="ChulaCraft players outside a Chulalongkorn-inspired Minecraft building"
          fill
          preload={!preview}
          sizes="100vw"
        />
        <div className={`container ${styles.cardText}`}>
          <div className={styles.heroCopy}>
            <Heading id={preview ? undefined : "hero-title"} className={styles.heroTitle}>
              <span className={styles.kicker}>{kicker}</span>
              {/* Typed out, then "Chula" is highlighted as if selected. */}
              <span className={styles.brandName}>
                <TypedText parts={[{ text: "Chula", className: styles.chula }, { text: "Craft" }]} />
              </span>
            </Heading>
            <p className={styles.heroIntro}>{intro}</p>
          </div>
          <div className={styles.heroBottom}>
            <div className={styles.heroActions}>
              <Link className="btn btn-primary btn-lg" href="/register">Register</Link>
              <Link className={styles.howLink} href="/about">How we work<span aria-hidden="true">→</span></Link>
            </div>
            <RegisterConsent />
          </div>
        </div>
      </div>
    </div>
  );

  return preview
    ? <section className={styles.hero} data-preview inert>{stage}</section>
    : <HeroStage className={styles.hero} aria-labelledby="hero-title">{stage}</HeroStage>;
}
