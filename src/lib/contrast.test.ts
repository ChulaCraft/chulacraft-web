import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Reads the real tokens from globals.css so a palette change can't quietly
// break the badge tier contrast (WCAG 2.x relative luminance).
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

function declarations(block: string) {
  return Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

/** The first `:root { … }` is the theme the site ships (dark). A light theme,
 *  when one exists, overrides it under `prefers-color-scheme: light`. */
const dark = declarations(css.match(/^:root\s*\{([\s\S]*?)^\}/m)![1]);
const lightBlock = css.match(/@media\s*\(prefers-color-scheme:\s*light\)\s*\{\s*:root[^{]*\{([\s\S]*?)\}/);
const themes: [string, Record<string, string>][] = [["dark", dark]];
if (lightBlock) themes.push(["light", { ...dark, ...declarations(lightBlock[1]) }]);

type Rgb = [number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function toOklab([r, g, b]: Rgb): Rgb {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

function fromOklab([L, a, b]: Rgb): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
    .map((c) => Math.min(1, Math.max(0, toSrgb(c)))) as Rgb;
}

/** Hex, var(--x) and `color-mix(in oklab, A p%, B)`: the forms the palette uses. */
function resolve(value: string, tokens: Record<string, string>): Rgb {
  const v = value.trim();
  const hex = v.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16) / 255) as Rgb;
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  if (ref) return resolve(tokens[ref[1]], tokens);
  const mix = v.match(/^color-mix\(in oklab,\s*(.+?)\s+(\d+(?:\.\d+)?)%,\s*(.+)\)$/);
  if (mix) {
    const p = Number(mix[2]) / 100;
    const a = toOklab(resolve(mix[1], tokens));
    const b = toOklab(resolve(mix[3], tokens));
    return fromOklab([0, 1, 2].map((i) => a[i] * p + b[i] * (1 - p)) as Rgb);
  }
  throw new Error(`Unsupported colour: ${v}`);
}

const luminance = ([r, g, b]: Rgb) => 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

function contrast(a: Rgb, b: Rgb) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const TIERS = ["common", "rare", "epic", "legendary"];

describe("contrast helper", () => {
  it("matches the WCAG reference values", () => {
    expect(contrast([0, 0, 0], [1, 1, 1])).toBeCloseTo(21, 5);
    expect(contrast(resolve("#777777", {}), [1, 1, 1])).toBeCloseTo(4.48, 2);
  });
});

describe.each(themes)("badge tier tokens (%s)", (_name, tokens) => {
  // The frame sits between the panel and the card's own background (--bg).
  const panels = ["--surface", "--bg"].map((token) => [token, resolve(tokens[token], tokens)] as const);
  const ink = resolve(tokens["--tier-ink"], tokens);

  it.each(TIERS)("%s frame is at least 3:1 against the panel", (tier) => {
    const frame = resolve(tokens[`--tier-${tier}`], tokens);
    for (const [, panel] of panels) expect(contrast(frame, panel)).toBeGreaterThanOrEqual(3);
  });

  it.each(TIERS)("%s chip text is at least 4.5:1 against the chip", (tier) => {
    expect(contrast(ink, resolve(tokens[`--tier-${tier}`], tokens))).toBeGreaterThanOrEqual(4.5);
  });
});

/** Charts print on white: `@media print { :root { … } }` swaps in ink-dark
 *  chart tokens, and the panel is white unless that block names its own. */
const printBlock = css.match(/@media\s+print\s*\{\s*:root[^{]*\{([\s\S]*?)\}/);
const printTokens = declarations(printBlock?.[1] ?? "");
const chartThemes: [string, Record<string, string>, string][] = [
  ["dark", dark, dark["--surface"]],
  ["print", { ...dark, ...printTokens }, printTokens["--surface"] ?? "#ffffff"]
];

describe("print chart tokens", () => {
  it("are defined", () => expect(Object.keys(printTokens)).toEqual(expect.arrayContaining(["--chart-1", "--chart-2", "--chart-3", "--chart-axis"])));
});

describe.each(chartThemes)("chart tokens (%s)", (_name, tokens, panelColour) => {
  const panel = resolve(panelColour, tokens);

  it.each(["--chart-1", "--chart-2", "--chart-3"])("%s line is at least 3:1 against the panel", (token) => {
    expect(contrast(resolve(tokens[token], tokens), panel)).toBeGreaterThanOrEqual(3);
  });

  it("axis text is at least 4.5:1 against the panel", () => {
    expect(contrast(resolve(tokens["--chart-axis"], tokens), panel)).toBeGreaterThanOrEqual(4.5);
  });
});
