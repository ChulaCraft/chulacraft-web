import type { Metadata } from "next";
import { ShieldIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About Us | Chulacraft",
  description:
    "Meet the community behind Chulacraft, a friendly Minecraft Java survival server built around playing together.",
};

const values = [
  {
    title: "Our mission",
    description:
      "Build a safe and inclusive Minecraft community for builders, explorers, and friends.",
    icon: "shield",
  },
  {
    title: "Our vision",
    description:
      "Become a welcoming world where every player can create, collaborate, and belong.",
    icon: "world",
  },
  {
    title: "Our values",
    description:
      "Respect, teamwork, creativity, and keeping the adventure fun for everyone.",
    icon: "heart",
  },
] as const;

const serverQualities = [
  { value: "Welcoming", label: "Community" },
  { value: "Always", label: "Player focused" },
  { value: "Shared", label: "Adventures" },
  { value: "Java", label: "Survival" },
] as const;

const communityRoles = [
  { name: "Builders", role: "Creative neighbors", tone: "rose" },
  { name: "Guides", role: "Helpful regulars", tone: "violet" },
  { name: "Event hosts", role: "Shared adventures", tone: "amber" },
  { name: "Future you", role: "Next community member", tone: "blue" },
] as const;

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <SiteHeader />
      <div className={styles.scenicPage}>
        <section className={styles.about} aria-labelledby="about-heading">
          <header className={styles.heroHeading}>
            <h1 id="about-heading">
              <span aria-hidden="true">+</span> About us <span aria-hidden="true">+</span>
            </h1>
            <p>
              Chulacraft was created by and for the community. Our goal is to provide a welcoming
              space where players can relax, create, and make lasting memories together.
            </p>
          </header>

          <div className={styles.missionStage}>
            <div className={styles.missionCard}>
              {values.map((value) => (
                <article key={value.title} className={styles.missionItem}>
                  <span
                    className={`${styles.missionIcon} ${styles[value.icon]}`}
                    aria-hidden="true"
                  >
                    {value.icon === "shield" ? <ShieldIcon /> : null}
                  </span>
                  <div>
                    <h2>{value.title}</h2>
                    <p>{value.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <dl className={styles.statStrip} aria-label="What defines Chulacraft">
            {serverQualities.map((quality) => (
              <div key={quality.label}>
                <dt>{quality.value}</dt>
                <dd>{quality.label}</dd>
              </div>
            ))}
          </dl>

          <section className={styles.communityPanel} aria-labelledby="community-heading">
            <header className={styles.sectionHeading}>
              <h2 id="community-heading">
                <span aria-hidden="true">+</span> Our community <span aria-hidden="true">+</span>
              </h2>
              <p>Behind every memorable world is a group of people building it together.</p>
            </header>
            <div className={styles.roleGrid}>
              {communityRoles.map((member) => (
                <article key={member.name}>
                  <span className={`${styles.avatar} ${styles[member.tone]}`} aria-hidden="true">
                    <i />
                  </span>
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
