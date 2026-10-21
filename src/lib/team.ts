// Sections inside each team generation, in page order. Mirrors the kind check
// on public.team_members (20261025000001).
export const TEAM_SECTIONS = [
  { kind: "board", title: "Board", lead: "Heads of each department.", titleLabel: "Department", titleHint: "E.g. Head of Events, Head of Build." },
  { kind: "member", title: "Members", lead: "Run the server, the Discord and the events.", titleLabel: "Role", titleHint: "E.g. Builder, Moderator. Optional." },
  { kind: "contributor", title: "Contributors", lead: "Built, designed or coded something you use here.", titleLabel: "Contribution", titleHint: "E.g. Website, Spawn build. Optional." },
  { kind: "sponsor", title: "Sponsors", lead: "Helped keep ChulaCraft running.", titleLabel: "Tagline", titleHint: "Optional. Add their website as the link." },
] as const;

export type TeamKind = (typeof TEAM_SECTIONS)[number]["kind"];

export const isTeamKind = (value: string): value is TeamKind => TEAM_SECTIONS.some((s) => s.kind === value);
