import type { Metadata } from "next";
import Link from "next/link";
import { EventCard, type UpcomingEvent } from "@/components/event-card";
import { PixelIcon } from "@/components/icons";
import { EVENT_CATEGORIES } from "@/lib/event-category";
import { createClient } from "@/lib/supabase/server";
import styles from "./search.module.css";

export const metadata: Metadata = { title: "Search" };

const MIN_QUERY = 2;

/** Site pages a visitor might be looking for by name. */
const PAGES = [
  { title: "How to join", href: "/#join", text: "Register, verify your Chula account and add your Minecraft name." },
  { title: "Register", href: "/register", text: "Sign in with Discord and get on the whitelist." },
  { title: "Events", href: "/events", text: "Community nights, builds and contests on the server." },
  { title: "Announcements", href: "/announcements", text: "Server news and maintenance windows." },
  { title: "Gallery", href: "/gallery", text: "Screenshots of builds from around the world." },
  { title: "Team", href: "/team", text: "The admins and builders who run ChulaCraft." },
  { title: "Server rules", href: "/rules", text: "What is and isn't allowed on the server." },
  { title: "About", href: "/about", text: "What ChulaCraft is and who it's for." },
  { title: "Privacy policy", href: "/privacy", text: "What we collect and why." },
  { title: "Terms of use", href: "/terms", text: "The terms you agree to when you register." },
];

/** search_players() returns this jsonb array (see src/app/players/page.tsx). */
type PlayerHit = { user_id: string; display_name: string; avatar_url: string | null; hidden: boolean };

const matches = (q: string, ...fields: (string | null | undefined)[]) =>
  fields.some((f) => f?.toLocaleLowerCase().includes(q));

/** One search across the public site: events and news are read with the
 *  visitor's own client (both granted to anon), players only when signed in
 *  (D1). Each source fails on its own, so one outage doesn't blank the page. */
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: raw } = await searchParams;
  const query = (raw ?? "").trim();
  const q = query.toLocaleLowerCase();
  const ready = query.length >= MIN_QUERY;

  let events: UpcomingEvent[] = [];
  let news: { id: string; title: string; body: string; published_at: string }[] = [];
  let players: PlayerHit[] = [];
  let failed = false;

  const supabase = await createClient();
  const signedIn = await supabase.auth.getUser().then(({ data }) => Boolean(data.user), () => false);

  if (ready) {
    const [upcoming, past, announcements] = await Promise.all([
      supabase.rpc("list_upcoming_events", { p_limit: 50 }),
      supabase.rpc("list_past_events", { p_limit: 50 }),
      supabase.rpc("list_announcements", { p_limit: 50 }),
    ]);
    failed = Boolean(upcoming.error || past.error || announcements.error);

    const categories = EVENT_CATEGORIES.filter((c) => c.label.toLocaleLowerCase().includes(q)).map((c) => c.value as string);
    events = [...(upcoming.data ?? []), ...(past.data ?? [])]
      .filter((e) => categories.includes(e.category) || matches(q, e.name, e.location, e.description_excerpt))
      .slice(0, 12) as UpcomingEvent[];
    news = (announcements.data ?? []).filter((a) => matches(q, a.title, a.body)).slice(0, 8);

    if (signedIn) {
      const { data, error } = await supabase.rpc("search_players", { p_q: query });
      if (error || !Array.isArray(data)) failed = true;
      else players = (data as PlayerHit[]).slice(0, 8);
    }
  }
  const pages = ready ? PAGES.filter((p) => matches(q, p.title, p.text)) : PAGES;
  const total = events.length + news.length + players.length + (ready ? pages.length : 0);

  return (
    <main className={`container ${styles.main}`}>
      <header className={styles.head}>
        <h1 className="page-title">{ready ? <>Results for &ldquo;{query}&rdquo;</> : "Search ChulaCraft"}</h1>
        <p className="lead">
          {!ready
            ? `Type at least ${MIN_QUERY} characters in the search bar above. Events, news and pages are searched${signedIn ? ", and players too" : ""}.`
            : total === 0 ? "Nothing matched. Try a shorter word, or browse a category below."
            : `${total} ${total === 1 ? "result" : "results"}${signedIn ? "" : ". Sign in to search players too."}`}
        </p>
        {ready && total > 0 && (
          <nav className={styles.jump} aria-label="Result types">
            {events.length > 0 && <a href="#events">Events <span>{events.length}</span></a>}
            {players.length > 0 && <a href="#players">Players <span>{players.length}</span></a>}
            {news.length > 0 && <a href="#news">News <span>{news.length}</span></a>}
            {pages.length > 0 && <a href="#pages">Pages <span>{pages.length}</span></a>}
          </nav>
        )}
      </header>

      {failed && (
        <div className="alert alert-error" role="alert">
          <PixelIcon name="warning" />
          <p className="alert-body">Part of the search couldn&apos;t load, so some results may be missing. Try again in a moment.</p>
        </div>
      )}

      {events.length > 0 && (
        <section id="events" className={styles.section} aria-labelledby="events-title">
          <h2 id="events-title" className="section-title">Events</h2>
          <ul className={styles.cards}>{events.map((e) => <EventCard key={e.id} event={e} />)}</ul>
        </section>
      )}

      {players.length > 0 && (
        <section id="players" className={styles.section} aria-labelledby="players-title">
          <h2 id="players-title" className="section-title">Players</h2>
          <ul className={styles.rows}>
            {players.map((p) => (
              <li key={p.user_id}>
                <Link href={`/player/${p.user_id}`} className={styles.row}>
                  {p.avatar_url
                    // eslint-disable-next-line @next/next/no-img-element -- Discord CDN avatar; next/image adds nothing at this size
                    ? <img className="avatar" src={p.avatar_url} alt="" width={40} height={40} referrerPolicy="no-referrer" />
                    : <span className="avatar" aria-hidden="true">{p.display_name.charAt(0).toUpperCase()}</span>}
                  <span className={styles.rowTitle}>{p.display_name}</span>
                  {p.hidden && <span className="badge badge-muted">Hides profile</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {news.length > 0 && (
        <section id="news" className={styles.section} aria-labelledby="news-title">
          <h2 id="news-title" className="section-title">News</h2>
          <ul className={styles.rows}>
            {news.map((n) => (
              <li key={n.id}>
                <Link href={`/announcements#${n.id}`} className={styles.row}>
                  <span className={styles.rowText}>
                    <span className={styles.rowTitle}>{n.title}</span>
                    <span className={styles.rowBody}>{n.body}</span>
                  </span>
                  <time className="hint" dateTime={n.published_at}>{new Date(n.published_at).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium" })}</time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pages.length > 0 && (
        <section id="pages" className={styles.section} aria-labelledby="pages-title">
          <h2 id="pages-title" className="section-title">{ready ? "Pages" : "Browse the site"}</h2>
          <ul className={styles.rows}>
            {pages.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className={styles.row}>
                  <span className={styles.rowText}>
                    <span className={styles.rowTitle}>{p.title}</span>
                    <span className={styles.rowBody}>{p.text}</span>
                  </span>
                  <PixelIcon name="arrow" size={14} className={styles.rowArrow} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ready && total === 0 && (
        <nav className={styles.categories} aria-label="Event categories">
          {EVENT_CATEGORIES.map((c) => <Link key={c.value} className="cat-chip" href={`/events?category=${c.value}`}>{c.label}</Link>)}
        </nav>
      )}
    </main>
  );
}
