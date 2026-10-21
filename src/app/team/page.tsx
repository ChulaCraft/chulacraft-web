import type { Metadata } from "next";
import Link from "next/link";
import { TeamCard, toCard } from "@/components/team-card";
import { team } from "@/lib/site-content";
import { TEAM_SECTIONS } from "@/lib/team";
import styles from "./team.module.css";

export const metadata: Metadata = {
  title: "Team",
  description: "The board, members, contributors and sponsors behind ChulaCraft, generation by generation.",
};

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ gen?: string }> }) {
  const { gen } = await searchParams;
  const result = await team().then((data) => ({ ...data, failed: false }), () => ({ generations: [], members: [], failed: true }));
  // Empty generations stay hidden while staff fill them in. Opens on the newest
  // (last in the admin's order) unless one is picked.
  const generations = result.generations.filter((g) => result.members.some((m) => m.generation_id === g.id));
  const current = generations.find((g) => g.id === gen) ?? generations.at(-1);
  const sections = TEAM_SECTIONS
    .map((s) => ({ ...s, members: result.members.filter((m) => m.generation_id === current?.id && m.kind === s.kind) }))
    .filter((s) => s.members.length > 0);

  return (
    <main className={`container ${styles.main}`}>
      <div className="stack gap-10">
        <span className="kicker" aria-hidden="true" />
        <h1 className="page-title">The team</h1>
        <p className="lead">The people behind ChulaCraft.</p>
      </div>

      {generations.length > 1 && (
        <nav className={styles.gens} aria-label="Generations">
          {generations.map((g) => (
            <Link key={g.id} href={`/team?gen=${g.id}`} className="chip" aria-current={g.id === current?.id ? "page" : undefined}>{g.name}</Link>
          ))}
        </nav>
      )}

      {result.failed ? (
        <p className="alert alert-error" role="alert">The team couldn&apos;t be loaded. Please try again in a moment.</p>
      ) : sections.length === 0 ? (
        <p className="muted">Team profiles are coming soon.</p>
      ) : <>
        {current && generations.length > 1 && <h2 className={styles.genTitle}>{current.name}</h2>}
        {sections.map((s) => (
          <section key={s.kind} aria-labelledby={`${s.kind}-title`} className={styles.section}>
            <h2 id={`${s.kind}-title`} className={styles.sectionTitle}>{s.title}</h2>
            <p className="muted">{s.lead}</p>
            <ul className={styles.grid}>{s.members.map((m) => <TeamCard key={m.id} member={toCard(m)} />)}</ul>
          </section>
        ))}
      </>}
    </main>
  );
}
