import { Fragment, type ReactNode } from "react";

// A small Markdown subset for event details and the site pages: ## headings,
// paragraphs, line breaks, - and 1. lists, | tables |, **bold**, *italic*,
// `code`, [links](https://…) and [site links](/privacy).
// Builds React elements, never HTML strings, so text can't inject markup;
// links must be http(s) or start with a single /.
// ponytail: no images, nesting or blockquotes; swap for a library if admins
// need them.

const INLINE = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/(?!\/)[^\s)]*)\))/g;

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${m.index}`;
    if (m[2]) out.push(<strong key={k}>{m[2]}</strong>);
    else if (m[3]) out.push(<em key={k}>{m[3]}</em>);
    else if (m[4]) out.push(<code key={k}>{m[4]}</code>);
    else if (m[6].startsWith("/")) out.push(<a key={k} href={m[6]}>{m[5]}</a>);
    else out.push(<a key={k} href={m[6]} target="_blank" rel="noreferrer">{m[5]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const withBreaks = (lines: string[], key: string) =>
  lines.map((line, i) => <Fragment key={i}>{i > 0 && <br />}{inline(line, `${key}-${i}`)}</Fragment>);

const cells = (line: string) => line.trim().slice(1, -1).split("|").map((c) => c.trim());

/** | head | head | then an optional |---|---| row, then body rows. */
function table(lines: string[], key: string) {
  const [head, ...rest] = lines;
  const body = /^[\s|:-]+$/.test(rest[0] ?? "") ? rest.slice(1) : rest;
  return <div key={key} className="md-table"><table>
    <thead><tr>{cells(head).map((c, i) => <th key={i}>{inline(c, `${key}h${i}`)}</th>)}</tr></thead>
    <tbody>{body.map((row, r) => <tr key={r}>{cells(row).map((c, i) => <td key={i}>{inline(c, `${key}-${r}-${i}`)}</td>)}</tr>)}</tbody>
  </table></div>;
}

function block(lines: string[], key: string): ReactNode[] {
  const heading = /^#{1,3}\s+(.*)$/.exec(lines[0]);
  // A heading line followed by more: the heading, then the rest as its own block.
  if (heading) return [<h3 key={`${key}h`}>{inline(heading[1], key)}</h3>, ...(lines.length > 1 ? block(lines.slice(1), `${key}r`) : [])];
  if (lines.length > 1 && lines.every((l) => /^\s*\|.*\|\s*$/.test(l))) return [table(lines, key)];
  if (lines.every((l) => /^\s*[-*]\s+/.test(l))) return [<ul key={key}>{lines.map((l, i) => <li key={i}>{inline(l.replace(/^\s*[-*]\s+/, ""), `${key}-${i}`)}</li>)}</ul>];
  if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) return [<ol key={key}>{lines.map((l, i) => <li key={i}>{inline(l.replace(/^\s*\d+[.)]\s+/, ""), `${key}-${i}`)}</li>)}</ol>];
  return [<p key={key}>{withBreaks(lines, key)}</p>];
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n?/g, "\n").trim().split(/\n\s*\n/);
  return <>{blocks.flatMap((b, i) => block(b.split("\n").map((l) => l.trimEnd()), String(i)))}</>;
}

/** The same text with the syntax removed, for one-line excerpts. */
export function plainText(source: string): string {
  return source
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*`]/g, "")
    .replace(/^\s*(#{1,3}|[-*]|\d+[.)])\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
