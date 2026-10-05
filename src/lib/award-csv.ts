/** The identifier kinds admin_resolve_identifiers accepts, in the order the
 *  award form offers them. */
export const AWARD_KINDS = ["discord", "minecraft", "chula"] as const;

export type AwardKind = (typeof AWARD_KINDS)[number];

export function toAwardKind(value: string): AwardKind | null {
  return (AWARD_KINDS as readonly string[]).includes(value) ? (value as AwardKind) : null;
}

/** Same cap as admin_resolve_identifiers (20261006000001:322), checked here so
 *  the admin sees the reason without spending a round trip. */
export const MAX_CSV_ROWS = 1000;

export type ParsedCsv = {
  /** Header detected in the first row, when one of the known names is there. */
  header: AwardKind | null;
  /** Distinct, trimmed values to resolve, in first-seen order. */
  values: string[];
  /** Values that appeared more than once, so the preview can report them. */
  duplicates: string[];
  /** Data rows seen after the header, before deduping. */
  rowCount: number;
};

function cell(raw: string): string {
  const value = raw.trim();
  // Only the outer quotes are stripped, so a name containing a comma survives
  // because it was quoted in the file.
  return /^"[^"]*"$/.test(value) ? value.slice(1, -1).trim() : value;
}

/** Header names the plan accepts: discord, minecraft, chula, case-insensitively. */
function headerKind(value: string): AwardKind | null {
  return toAwardKind(value.trim().toLowerCase().replace(/[^a-z]/g, ""));
}

function splitRow(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

/**
 * Reads a pasted or uploaded CSV of player identifiers. The header row is
 * recognised by name (`discord`, `minecraft`, `chula`); without one the first
 * column is taken. Blank rows are skipped and repeats collapse, because
 * awarding the same player twice in one batch is a mistake an admin wants to
 * see, not one to ship.
 */
export function parseAwardCsv(text: string): ParsedCsv {
  const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim() !== "");
  let header: AwardKind | null = null;
  let rows = lines;

  if (lines.length > 0) {
    const first = splitRow(lines[0]).map(cell);
    const named = first.map(headerKind).find((kind): kind is AwardKind => kind !== null);
    if (named) {
      header = named;
      rows = lines.slice(1);
    }
  }

  const values: string[] = [];
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const line of rows) {
    const value = cell(splitRow(line)[0]);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) {
      if (!duplicates.includes(value)) duplicates.push(value);
      continue;
    }
    seen.add(key);
    values.push(value);
  }

  return { header, values, duplicates, rowCount: values.length + duplicates.length };
}