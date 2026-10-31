import { plainText } from "@/lib/markdown";

export type IcsEvent = {
  id: string;
  name: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
};

const CRLF = "\r\n";
const TWO_HOURS = 2 * 60 * 60 * 1000;
const encoder = new TextEncoder();

/** 2026-10-20T02:00:00.000Z -> 20261020T020000Z */
const stamp = (date: Date) => date.toISOString().replace(/[-:]|\.\d{3}/g, "");

/** TEXT values: backslash first so the others' escapes survive. */
const escapeText = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r\n?|\n/g, "\\n");

/** Folds a content line to 75 octets, continuations led by one space. Cuts
 *  fall between code points, so a Thai (3-octet) character is never split. */
function fold(line: string): string {
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const octets = encoder.encode(char).length;
    // A continuation line spends one octet on its leading space.
    if (size + octets > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += octets;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

/** An RFC 5545 calendar holding the one event. Times are UTC, so no VTIMEZONE. */
export function eventIcs(event: IcsEvent, origin: string, now = new Date()): string {
  const start = new Date(event.starts_at);
  const end = event.ends_at ? new Date(event.ends_at) : new Date(start.getTime() + TWO_HOURS);
  const description = event.description ? plainText(event.description) : "";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ChulaCraft//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@chulacraft`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeText(event.name)}`,
    ...(description ? [`DESCRIPTION:${escapeText(description)}`] : []),
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    `URL:${origin.replace(/\/$/, "")}/events/${event.id}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ];
  return lines.map(fold).join(CRLF) + CRLF;
}

/** `<slug>.ics`; a name with no ASCII letters or digits (all Thai) falls back to the id. */
export function icsFilename(event: Pick<IcsEvent, "id" | "name">): string {
  const slug = event.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
  return `${slug || event.id}.ics`;
}
