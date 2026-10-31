"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { compact, cursorKey, linePath, linearScale, nearestIndex, niceTicks, type Point } from "./scale";
import styles from "./charts.module.css";
import { MAX_SERIES, alignSeries, lineRows, seriesProblem, type LineSeries } from "./line-series";

export { MAX_SERIES, alignSeries, lineRows, seriesProblem, type LineSeries };

const SERIES = [styles.s1, styles.s2, styles.s3];
const H = 220;
const TOP = 24;
const BOTTOM = 24;
const CHAR = 7.5; // rough width of one 12px character, Thai included
const MIN_GAP = 14;

const finite = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** "2026-10-22" → "22 Oct"; anything unparseable is shown as given. */
export function formatDay(day: string): string {
  const t = Date.parse(`${day}T00:00:00Z`);
  return Number.isNaN(t) ? day : DAY.format(t);
}

const shorten = (s: string, chars: number) => (s.length <= chars ? s : `${s.slice(0, Math.max(1, chars - 1))}…`);

/** All the geometry for one render at `width` px. Pure, so it is unit-tested. */
export function lineLayout(input: LineSeries[], width: number) {
  const { days, series } = alignSeries(input);
  const n = days.length;
  const values = series.flatMap((s) => s.points.map((p) => p.value)).filter(finite);
  const max = values.length ? Math.max(...values) : 0;
  const ticks = niceTicks(max, 4);
  const top = ticks.at(-1)! > 0 ? ticks.at(-1)! : 1;

  const left = 8 + Math.max(...ticks.map((t) => compact(t).length)) * CHAR;
  const longest = Math.max(0, ...series.map((s) => s.name.length));
  const gutter = Math.min(width * 0.3, 16 + longest * CHAR);
  const right = Math.max(left + 1, width - gutter);
  const x = linearScale([0, n - 1], [left, right]);
  const y = linearScale([0, top], [H - BOTTOM, TOP]);

  const lines = series.map((s, si) => {
    const points: (Point | null)[] = days.map((_, i) => (finite(s.points[i]?.value) ? { x: x(i), y: y(s.points[i].value!) } : null));
    // A point with no neighbour draws no line segment, so it gets a dot.
    const lone = points.filter((p, i): p is Point => p !== null && !points[i - 1] && !points[i + 1]);
    const end = points.filter((p): p is Point => p !== null).at(-1) ?? null;
    return { name: s.name, className: SERIES[si], d: linePath(points), lone, end };
  });

  // Direct labels at each line's end, nudged apart only as far as they overlap.
  const chars = Math.max(1, Math.floor((gutter - 12) / CHAR));
  const labels = lines
    .filter((l) => l.end)
    .map((l) => ({ text: shorten(l.name, chars), x: l.end!.x + 8, y: l.end!.y }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) labels[i].y = Math.max(labels[i].y, labels[i - 1].y + MIN_GAP);

  const xTicks = n === 0 ? [] : [...new Set(n > 2 && width >= 420 ? [0, Math.floor((n - 1) / 2), n - 1] : [0, n - 1])];

  return {
    days, lines, labels, left, right,
    grid: ticks.map((t) => ({ label: compact(t), y: y(t) })),
    xTicks: xTicks.map((i) => ({ label: formatDay(days[i]), x: x(i), anchor: (n === 1 ? "middle" : i === 0 ? "start" : i === n - 1 ? "end" : "middle") as "start" | "middle" | "end" })),
    x, y
  };
}

/** The tooltip's words for day `i`, also announced to screen readers. */
export function readout(input: LineSeries[], i: number): string {
  const { days, series } = alignSeries(input);
  const day = days[i];
  if (day === undefined) return "";
  const parts = series.map((s) => `${s.name} ${finite(s.points[i]?.value) ? s.points[i].value!.toLocaleString("en") : "no data"}`);
  return `${formatDay(day)}: ${parts.join(", ")}`;
}

/**
 * Up to three daily series on one axis. The plot is focusable: ←/→ (and
 * Home/End) move a cursor across days and the pointer does the same; a tooltip
 * lists every series at that day. Each line is labelled at its end, so there is
 * no legend box. Wrap it in ChartFrame, with `lineRows(series)` as its
 * columns/rows, for the title, table and CSV.
 *
 * Contract: at most three series, all on the same day list. A breach is
 * logged with console.error and the chart draws what it can: the first three
 * series, aligned to the first series' days (lineRows does the same, so the
 * table and CSV still match the plot).
 */
export function LineChart({ series, yLabel }: { series: LineSeries[]; yLabel: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [cursor, setCursor] = useState<number | null>(null);
  const [spoken, setSpoken] = useState("");

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const problem = seriesProblem(series);
  useEffect(() => {
    if (problem) console.error(problem);
  }, [problem]);

  const layout = lineLayout(series, width);
  const n = layout.days.length;
  const shown = alignSeries(series).series;
  const at = cursor !== null && cursor < n ? cursor : null;

  function onKeyDown(e: KeyboardEvent<SVGSVGElement>) {
    const next = cursorKey(at, e.key, n);
    if (next === undefined) return;
    e.preventDefault();
    setCursor(next);
    setSpoken(next === null ? "" : readout(series, next));
  }

  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    if (box.width === 0) return;
    setCursor(nearestIndex(((e.clientX - box.left) * width) / box.width, layout.left, layout.right, n));
  }

  const cx = at === null ? 0 : layout.x(at);
  const side = cx < width / 3 ? "translateX(12px)" : cx > (width * 2) / 3 ? "translateX(calc(-100% - 12px))" : "translateX(-50%)";

  return <div ref={wrap} className={styles.plotWrap}>
    <svg
      className={styles.plot}
      viewBox={`0 0 ${width} ${H}`}
      width={width}
      height={H}
      tabIndex={0}
      role="group"
      aria-label={`${yLabel} by day, ${shown.map((s) => s.name).join(", ")}. Use the left and right arrow keys to read each day.`}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setCursor(null)}
      onBlur={() => setCursor(null)}
    >
      <text className={styles.axis} x={0} y={12}>{yLabel}</text>
      {layout.grid.map((g, i) => <g key={i}>
        <line className={styles.grid} x1={layout.left} x2={layout.right} y1={g.y} y2={g.y} />
        <text className={styles.axis} x={layout.left - 8} y={g.y} dy="0.32em" textAnchor="end">{g.label}</text>
      </g>)}
      {layout.xTicks.map((t) => <text key={t.x} className={styles.axis} x={t.x} y={H - 6} textAnchor={t.anchor}>{t.label}</text>)}
      {layout.lines.map((l, i) => <g key={i} className={l.className}>
        <path className={styles.line} d={l.d} />
        {l.lone.map((p) => <circle key={p.x} className={styles.dot} cx={p.x} cy={p.y} r={3} />)}
        {l.end && <circle className={styles.dot} cx={l.end.x} cy={l.end.y} r={4} />}
      </g>)}
      {layout.labels.map((l, i) => <text key={i} className={styles.endLabel} x={l.x} y={l.y} dy="0.32em">{l.text}</text>)}
      {at !== null && <g aria-hidden="true">
        <line className={styles.crosshair} x1={cx} x2={cx} y1={TOP} y2={H - BOTTOM} />
        {layout.lines.map((l, si) => {
          const v = shown[si].points[at]?.value;
          return finite(v) ? <circle key={si} className={`${styles.dot} ${l.className}`} cx={cx} cy={layout.y(v)} r={4} /> : null;
        })}
      </g>}
    </svg>
    {at !== null && <div className={styles.tooltip} style={{ left: cx, transform: side }} aria-hidden="true">
      <div className={styles.tooltipDay}>{formatDay(layout.days[at])}</div>
      {shown.map((s, si) => <div key={si} className={`${styles.tooltipRow} ${SERIES[si]}`}>
        <span className={styles.key} />
        <strong>{finite(s.points[at]?.value) ? s.points[at].value!.toLocaleString("en") : "–"}</strong>
        <span>{s.name}</span>
      </div>)}
    </div>}
    <p className="sr-only" aria-live="polite">{spoken}</p>
  </div>;
}
