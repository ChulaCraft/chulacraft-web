import Image from "next/image";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { PixelIcon } from "@/components/icons";
import { RegisterConsent } from "@/components/register-consent";
import { CopyButton } from "@/components/copy-button";
import { ServerStatus } from "@/components/server-address-card";
import { EventCard, UPCOMING_EVENTS_TAG, type UpcomingEvent } from "@/components/event-card";
import { discordCommunityUrl } from "@/lib/site-links";
import { anonClient, siteSettings } from "@/lib/site-content";
import { HomeHero } from "./home-hero";
import { PlayOnView } from "./play-on-view";
import { TypedText } from "./typed-text";
import styles from "./home.module.css";

/** The next published events, cached for a minute.
 *
 * unstable_cache rather than `use cache`: the latter is a Cache Components
 * feature (node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md)
 * and would mean turning on cacheComponents in next.config.ts, which changes how
 * every other route opts into caching. This is the documented way to cache a
 * non-fetch read for a bounded time.
 *
 * The client is built from the publishable key with no cookies on purpose: a
 * cache scope may not read cookies (unstable_cache.md, "Good to know"), and an
 * anonymous read is exactly what this is — the same surface a logged-out visitor
 * gets, granted to anon in 20261006000002. A cookie-carrying client would also
 * make the entry per-visitor, which the count does not need to be. */
const upcomingEvents = unstable_cache(
  async (): Promise<UpcomingEvent[]> => {
    const { data, error } = await anonClient().rpc("list_upcoming_events", { p_limit: 4 });
    if (error) throw new Error(error.message);
    return (data ?? []) as UpcomingEvent[];
  },
  ["upcoming-events"],
  { revalidate: 60, tags: [UPCOMING_EVENTS_TAG] }
);

/** D9: the empty state is part of the design, and so is a Supabase that is
 *  unreachable. Both render the section rather than throwing, so a database
 *  outage cannot take the landing page down with it. */
async function loadUpcomingEvents() {
  try {
    return { events: await upcomingEvents(), failed: false };
  } catch {
    return { events: [] as UpcomingEvent[], failed: true };
  }
}

const steps = (serverAddress: string | null) => [
  // Images: re-shoot with `node scripts/capture-join-guide.mjs`.
  { title: "Sign in with Discord", copy: "Press Continue with Discord on the Register page. This creates your ChulaCraft profile.", img: "1-discord.webp", w: 1040, h: 426 },
  { title: "Verify Chula", copy: "Sign in with your @chula.ac.th or @student.chula.ac.th Google account. Pick carefully, it can't be changed later.", img: "2-verify.webp", w: 1080, h: 574 },
  { title: "Add your Minecraft name", copy: "Type your Java Edition username in Settings. Up to 5 usernames go on the whitelist.", img: "3-minecraft.webp", w: 1180, h: 610 },
  { title: "Join", copy: `In Minecraft Java Edition, open Multiplayer → Add Server and enter ${serverAddress ?? "the server address"}.`, img: "4-join.webp", w: 1280, h: 388 },
];

export default async function HomePage() {
  const [{ events }, settings] = await Promise.all([loadUpcomingEvents(), siteSettings()]);
  const { serverAddress } = settings;

  return (
    <main className={styles.main}>
      <HomeHero kicker={settings.homeKicker} intro={settings.homeIntro} />

      {/* The server band: what every visitor came for, set as one line across
          the page rather than a card. scripts/capture-join-guide.mjs shoots
          this region by its name. */}
      <section className={styles.band} aria-labelledby="addr-label">
        <div className={`container ${styles.address}`}>
          <h2 id="addr-label" className={styles.addressLabel}>Server address</h2>
          <p className={`mono ${styles.addressValue}`}>{serverAddress ?? "Coming soon"}</p>
          <div className={styles.addressSide}>
            <ServerStatus address={serverAddress} />
            {serverAddress && <CopyButton text={serverAddress} className="btn btn-outline" />}
          </div>
          <p className={styles.addressNote}>
            <PixelIcon name="info" className="tone-amber" />
            <span><strong>Java Edition only.</strong> Bedrock and console can&apos;t connect.</span>
          </p>
        </div>
      </section>

      {/* Statement on the left, its evidence on the right. */}
      <section className={`container ${styles.section} ${styles.split}`} aria-labelledby="events-title">
        <div className={styles.statement}>
          <h2 id="events-title" className={styles.sectionTitle}>Upcoming events</h2>
          <p className={styles.sectionLead}>Build nights, contests and survival runs, planned together on Discord.</p>
          <Link className="link-button" href="/events">See all events <PixelIcon name="arrow" size={14} /></Link>
        </div>
        {events.length === 0 ? (
          <div className={styles.eventsEmpty}>
            <p className={styles.eventsEmptyTitle}>No events scheduled yet.</p>
            <p className="muted">
              Dates get posted here and on <a href={discordCommunityUrl} target="_blank" rel="noreferrer">Discord</a>. Turn on notifications so you hear when the next one is announced.
            </p>
          </div>
        ) : (
          <ul className={styles.features}>
            {events.map((event) => <EventCard key={event.id} event={event} />)}
          </ul>
        )}
      </section>

      <section id="join" className={`container ${styles.section}`} aria-labelledby="join-title">
        <div className={styles.joinHead}>
          <h2 id="join-title" className={styles.sectionTitle}>How to join</h2>
          <p className={styles.sectionLead}>Four steps, about five minutes.</p>
        </div>
        <ol className={styles.steps}>
          {steps(serverAddress).map((s, i) => (
            <li key={s.title} className={styles.step}>
              <span className={styles.stepNum} aria-hidden="true">{i + 1}</span>
              <div className={styles.stepText}>
                <h3>{s.title}</h3>
                <p>{s.copy}</p>
              </div>
              <div className={styles.stepShot}>
                <Image src={`/images/guide/${s.img}`} alt="" width={s.w} height={s.h} sizes="(min-width: 1000px) 520px, 90vw" />
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* The close: the question types itself out once it's on screen, then
          the one way in appears with what registering agrees to. */}
      <PlayOnView className={styles.cta} aria-labelledby="cta-title">
        <Image className={styles.ctaPhoto} src="/images/collection/current/nice.webp" alt="" fill sizes="100vw" />
        <div className={`container ${styles.ctaInner}`}>
          <h2 id="cta-title" className={styles.ctaTitle}><TypedText parts={[{ text: "Ready to build?" }]} /></h2>
          <div className={styles.ctaAfter}>
            <Link className="btn btn-primary" href="/register">Register</Link>
            <RegisterConsent className={styles.ctaConsent} />
          </div>
        </div>
      </PlayOnView>
    </main>
  );
}
