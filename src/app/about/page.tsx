import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DiscordIcon } from "@/components/icons";
import { discordCommunityUrl } from "@/lib/site-links";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About",
  description: "A community-run Minecraft Java server for the Chula community.",
};

const values = [
  { title: "Mission", copy: "Build a safe and inclusive Minecraft community for builders, explorers, and friends.", icon: "M5 1h2v2h2v2h2v2h-2v2h-2v2h-2v-2h-2v-2h-2v-2h2v-2h2zM5 5v2h2v-2z" },
  { title: "Vision", copy: "Become a welcoming world where every player can create, collaborate, and belong.", icon: "M3 3h6v1h1v1h1v2h-1v1h-1v1h-6v-1h-1v-1h-1v-2h1v-1h1zM5 5v2h2v-2z" },
  { title: "Values", copy: "Respect, teamwork, creativity, and keeping the adventure fun for everyone.", icon: "M2 2h3v1h2v-1h3v1h1v3h-1v1h-1v1h-1v1h-1v1h-2v-1h-1v-1h-1v-1h-1v-1h-1v-3h1z" },
];

const gallery = [
  { src: "/images/collection/beta/firstEnderdragonBeat.webp", alt: "Players celebrating the server's first Ender Dragon kill", wide: true },
  { src: "/images/collection/current/nice.webp", alt: "A player build on the ChulaCraft world" },
  { src: "/images/collection/beta/2026-08-03_18.57.27.webp", alt: "Another player build on the ChulaCraft world" },
];

export default function AboutPage() {
  return (
    <>
      <main>
        <section className={styles.hero} aria-labelledby="about-title">
          <Image className={styles.heroImage} src="/images/collection/current/2026-08-23_17.58.05.webp" alt="" fill preload sizes="100vw" />
          <div className={styles.heroTint} aria-hidden="true" />
          <div className={`container ${styles.heroInner}`}>
            <span className="kicker" aria-hidden="true" />
            <h1 id="about-title" className={styles.heroTitle}>About ChulaCraft</h1>
            <p className={styles.heroIntro}>A community-run Minecraft Java server for the Chula community. One shared world where players build, explore, and look out for each other.</p>
          </div>
        </section>

        <section className={`container ${styles.values}`} aria-label="Mission, vision and values">
          <ul>
            {values.map((v) => (
              <li key={v.title} className="panel">
                <span className={`pixel-4 ${styles.valueIcon}`} aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 12 12" fill="currentColor" shapeRendering="crispEdges"><path d={v.icon} fillRule="evenodd" /></svg>
                </span>
                <h2 className={styles.valueTitle}>{v.title}</h2>
                <p className="lead">{v.copy}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={`container ${styles.community}`} aria-labelledby="community-title">
          <div className={styles.communityText}>
            <span className="kicker" aria-hidden="true" />
            <h2 id="community-title" className={styles.communityTitle}>The community</h2>
            <p className="lead">ChulaCraft is run by members of the Chula community. Admins keep the world safe, players build the plugins, and events get planned together on Discord.</p>
            <p className="lead">Everyone who joins verifies with a Chula account, so you&apos;re always playing alongside people from your own university.</p>
            <div className={styles.actions}>
              <a className="btn btn-primary btn-lg" href={discordCommunityUrl} target="_blank" rel="noreferrer"><DiscordIcon /> Join Discord</a>
              <Link className="btn btn-lg" href="/register">Register</Link>
            </div>
          </div>
          <div className={styles.gallery}>
            {gallery.map((g) => (
              <div key={g.src} className={`pixel-8 ${styles.shot}`} data-wide={g.wide || undefined}>
                <Image src={g.src} alt={g.alt} fill sizes="(min-width: 800px) 380px, 100vw" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
