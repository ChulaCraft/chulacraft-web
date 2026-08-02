import Image from "next/image";
import { AuthButton } from "@/components/auth-button";
import { DiscordIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ServerAddressCard } from "@/components/server-address-card";
import { discordCommunityUrl } from "@/lib/site-links";
import styles from "./home.module.css";

const serverAddress = process.env.NEXT_PUBLIC_MINECRAFT_SERVER_ADDRESS;

const features = [
  {
    title: "Safe & friendly",
    copy: "A welcoming CU community with clear rules and respectful play.",
    icon: <path d="M12 2.5 20 6v6c0 5-3.3 8.4-8 10-4.7-1.6-8-5-8-10V6l8-3.5Zm-3.4 9.4 2.1 2.1 4.7-4.8" />
  },
  {
    title: "Active community",
    copy: "Join events, make friends, and build together beyond the server.",
    icon: <><circle cx="8" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M2.5 20c.3-4 2.2-6 5.5-6s5.2 2 5.5 6M13 15c3.8-.8 7 .8 7.5 5" /></>
  },
  {
    title: "Survival & creative",
    copy: "Play your way while keeping the shared world lively and collaborative.",
    icon: <><path d="m4 20 9-9M9 5l2-2 10 10-3 3L8 6Z" /><path d="m5.5 17.5 3 3" /></>
  },
  {
    title: "Custom features",
    copy: "Community-made plugins and quality-of-life improvements for CU players.",
    icon: <><path d="M4 8h16v12H4zM7 4h10l2 4H5l2-4Z" /><path d="M9 13h6M12 10v6" /></>
  }
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <SiteHeader />
      <section className={styles.hero} aria-labelledby="home-title">
        <Image
          className={styles.heroImage}
          src="/images/landingpage-bg.png"
          alt="ChulaCraft players relaxing with a dog outside a Chulalongkorn-inspired Minecraft building"
          fill
          priority
          sizes="100vw"
        />
        <div className={styles.tint} aria-hidden="true" />

        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}><span aria-hidden="true">✦</span> A Minecraft server for CU community <span aria-hidden="true">✦</span></p>
            <h1 id="home-title">Chulacraft</h1>
            <p className={styles.tagline}>Build. Explore. Connect.</p>
            <p className={styles.intro}>
              ChulaCraft is a Minecraft server for Chulalongkorn University students and friends.
              Build, explore, and connect in a world made by our community.
            </p>

            <div className={styles.actions}>
              <AuthButton />
              <a className="button button-outline" href={discordCommunityUrl} target="_blank" rel="noreferrer">
                <DiscordIcon /> Join Discord
              </a>
            </div>

            <ServerAddressCard address={serverAddress} className={styles.serverCard} />
          </div>

          <ul className={styles.features} aria-label="Why play on ChulaCraft">
            {features.map((feature) => (
              <li key={feature.title}>
                <span className={styles.featureIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter">
                    {feature.icon}
                  </svg>
                </span>
                <span>
                  <strong>{feature.title}</strong>
                  <small>{feature.copy}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
