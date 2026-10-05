import Link from "next/link";
import { redirect } from "next/navigation";
import { PixelIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import styles from "./players.module.css";

/** search_players() in supabase/migrations/20261007000001_social.sql:84
 *  returns this jsonb array of trimmed cards — display keys only, no sections.
 *  A profile that only matches by exact Minecraft name comes back hidden=true. */
type SearchHit = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  hidden: boolean;
  relationship: string;
};

const MIN_QUERY = 2;

function Avatar({ src, name, size = 40 }: { src: string | null; name: string; size?: number }) {
  return src
    // eslint-disable-next-line @next/next/no-img-element -- Discord CDN avatar; next/image adds nothing at this size
    ? <img className="avatar" src={src} alt="" width={size} height={size} style={{ width: size, height: size }} referrerPolicy="no-referrer" />
    : <span className="avatar" aria-hidden="true" style={{ width: size, height: size }}>{name.charAt(0).toUpperCase()}</span>;
}

export default async function PlayersPage({ searchParams }: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  const { q: rawQuery, error: errorCode } = await searchParams;
  const query = (rawQuery ?? "").trim();

  // D1: signed-in only, same as /player/[id]. Logged out → /register, before
  // any search runs — the RPCs are granted to authenticated alone.
  const supabase = await createClient();
  let signedIn = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  } catch {
    signedIn = false;
  }
  if (!signedIn) redirect("/register");

  let hits: SearchHit[] = [];
  let failed = false;
  if (query.length >= MIN_QUERY) {
    try {
      const { data, error } = await supabase.rpc("search_players", { p_q: query });
      // A failed search shows the empty state with an error, not a lie: the
      // page must not imply "nobody matched".
      failed = Boolean(error) || !Array.isArray(data);
      hits = Array.isArray(data) ? data as SearchHit[] : [];
    } catch {
      failed = true;
    }
  }

  return (
    <main className="narrow">
      <div className={styles.main}>
        {/* The search is the page: a lit panel up top, results under their own heading. */}
        <section className={`panel ${styles.searchPanel}`} aria-labelledby="players-title">
          <span className="kicker" aria-hidden="true" />
          <h1 id="players-title" className="page-title">Find players</h1>
          <p className="lead">Search by Discord name or Minecraft username. Players who hide their profile only match their exact Minecraft name.</p>
          <form action="/players" method="get" role="search" className={styles.form}>
            <div className="field">
              <label htmlFor="q">Name or username</label>
              <input
                id="q"
                name="q"
                type="search"
                className="input"
                defaultValue={query}
                minLength={MIN_QUERY}
                autoComplete="off"
                placeholder="At least 2 characters"
                aria-describedby="q-help"
              />
            </div>
            <button type="submit" className="btn btn-primary"><PixelIcon name="search" />Search</button>
            <p id="q-help" className={`field-help ${styles.formHelp}`}>At least {MIN_QUERY} characters. Up to 20 results.</p>
          </form>
        </section>

        {errorCode && (
          <div className="alert alert-error" role="alert">
            <PixelIcon name="warning" />
            <p className="alert-body">That player is no longer available.</p>
          </div>
        )}
        {failed && (
          <div className="alert alert-error" role="alert">
            <PixelIcon name="warning" />
            <p className="alert-body">The search didn&apos;t work. Please try again in a moment.</p>
          </div>
        )}

        <section className={styles.resultsSection} aria-labelledby="results-title">
          <h2 id="results-title" className={styles.resultsTitle}>
            {query.length < MIN_QUERY ? "Results" : `Results for “${query}”`}
            {hits.length > 0 && <span className="badge badge-muted pixel-4">{hits.length}</span>}
          </h2>
          {query.length < MIN_QUERY ? (
            <p className="muted">Type at least {MIN_QUERY} characters to search.</p>
          ) : hits.length === 0 ? (
            <p className="muted">No players matched &ldquo;{query}&rdquo;.</p>
          ) : (
            <ul className={styles.results}>
              {hits.map((hit) => (
                <li key={hit.user_id}>
                  <Link href={`/player/${hit.user_id}`} className={styles.hit}>
                    <Avatar src={hit.avatar_url} name={hit.display_name} />
                    <span className={styles.hitText}>
                      <span className={styles.hitName}>{hit.display_name}</span>
                      {hit.hidden && <span className="badge badge-muted pixel-4">Hides profile</span>}
                    </span>
                    <PixelIcon name="chevron" className={styles.hitArrow} size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}