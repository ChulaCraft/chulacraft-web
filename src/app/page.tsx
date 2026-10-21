import Image from "next/image";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { PixelIcon } from "@/components/icons";
import { CopyButton } from "@/components/copy-button";
import { ServerStatus } from "@/components/server-address-card";
import { EventCard, UPCOMING_EVENTS_TAG, type UpcomingEvent } from "@/components/event-card";
import { discordCommunityUrl } from "@/lib/site-links";
import { anonClient, siteSettings } from "@/lib/site-content";
import { HomeHero } from "./home-hero";
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
  { title: "Sign in with Discord", copy: "Press Continue with Discord on the Register page. This creates your ChulaCraft profile.", img: "1-discord.webp", w: 1040, h: 410 },
  { title: "Verify Chula", copy: "Sign in with your @chula.ac.th or @student.chula.ac.th Google account. Pick carefully, it can't be changed later.", img: "2-verify.webp", w: 1080, h: 574 },
  { title: "Add your Minecraft name", copy: "Type your Java Edition username on your profile. Up to 5 usernames go on the whitelist.", img: "3-minecraft.webp", w: 1180, h: 722 },
  { title: "Join", copy: `In Minecraft Java Edition, open Multiplayer → Add Server and enter ${serverAddress ?? "the server address"}.`, img: "4-join.webp", w: 1180, h: 260 },
];

export default async function HomePage() {
  const [{ events }, settings] = await Promise.all([loadUpcomingEvents(), siteSettings()]);
  const { serverAddress } = settings;

  return (
    <>
      <main>
        <HomeHero kicker={settings.homeKicker} intro={settings.homeIntro} />

        <div className={`container ${styles.addressWrap}`}>
          <section className={`panel panel-edge ${styles.address}`} aria-labelledby="addr-label">
            <div className={styles.addressText}>
              <h2 id="addr-label" className={styles.addressLabel}>Server address</h2>
              <ServerStatus address={serverAddress} />
              <p className={`mono ${styles.addressValue}`}>{serverAddress ?? "Coming soon"}</p>
              <p className={styles.addressNote}>
                <PixelIcon name="info" className="tone-amber" />
                <span><strong>Java Edition only.</strong> Bedrock and console can&apos;t connect.</span>
              </p>
            </div>
            {serverAddress && <CopyButton text={serverAddress} />}
          </section>
        </div>

        <section className={`container ${styles.section}`} aria-labelledby="events-title">
          <p className="eyebrow">Upcoming events</p>
          <div className={styles.sectionHead}>
            <h2 id="events-title" className={styles.sectionTitle}>Play together at a community event</h2>
            <Link className="link-button" href="/events">All events <PixelIcon name="arrow" size={14} /></Link>
          </div>
          {events.length === 0 ? (
            <div className={`panel ${styles.eventsEmpty}`}>
              <p className={styles.eventsEmptyTitle}>No events scheduled yet</p>
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

        <section className={`container ${styles.section}`} aria-labelledby="join-title">
          <p className="eyebrow">Four steps</p>
          <h2 id="join-title" className={styles.sectionTitle}>How to join</h2>
          <ol className={styles.steps}>
            {steps(serverAddress).map((s, i, all) => (
              <li key={s.title}>
                <span className={`pixel-4 ${styles.stepNum}`} data-last={i === all.length - 1 || undefined} aria-hidden="true">{i + 1}</span>
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
              <p className={styles.terms}>By registering you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
            </div>
            <div className={styles.actions}>
              <Link className={`btn btn-lg ${styles.ctaPrimary}`} href="/register">Register <span aria-hidden="true">→</span></Link>
              <a className={`btn btn-lg ${styles.ctaSecondary}`} href={discordCommunityUrl} target="_blank" rel="noreferrer">Join Discord</a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
