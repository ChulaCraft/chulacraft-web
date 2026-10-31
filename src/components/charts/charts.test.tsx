import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { delta } from "@/lib/insights/range";
import { BarChart, barRows, barWidths } from "./bar-chart";
import { barReadout } from "./bar-rows";
import { ChartFrame } from "./chart-frame";
import { FunnelChart, funnelNote } from "./funnel-chart";
import { LineChart, alignSeries, formatDay, lineLayout, lineRows, readout, seriesProblem, type LineSeries } from "./line-chart";
import { MetricTile, deltaText } from "./metric-tile";
import { Sparkline, sparkLabel } from "./sparkline";

const BAD = /NaN|Infinity/;
const days = (values: (number | null)[]) => values.map((value, i) => ({ day: `2026-10-${String(i + 10).padStart(2, "0")}`, value }));

describe("Sparkline", () => {
  it.each([[[]], [[5]], [[0, 0, 0]], [[null, 3, null]], [[1, null, 2, 4]]])("renders %j without NaN", (values) => {
    const html = renderToStaticMarkup(<Sparkline values={values} label="Signups" />);
    expect(html).toContain('role="img"');
    expect(html).not.toMatch(BAD);
  });

  it("labels with the first and last values present", () => {
    expect(sparkLabel([null, 4, 7, 12, null], "Signups")).toBe("Signups: 4 to 12");
    expect(sparkLabel([9], "Signups")).toBe("Signups: 9");
    expect(sparkLabel([], "Signups")).toBe("Signups: no data");
  });
});

describe("LineChart", () => {
  const online: LineSeries = { name: "Players online", points: days([3, 5, null, 4, 6]) };

  it("leaves a gap for a missing snapshot day", () => {
    const [line] = lineLayout([online], 640).lines;
    expect(line.d.match(/M/g)).toHaveLength(2);
  });

  it.each([[[]], [[7]], [[0, 0, 0]], [[null, null]]])("renders %j without NaN", (values) => {
    const html = renderToStaticMarkup(<LineChart series={[{ name: "A", points: days(values) }]} yLabel="Players" />);
    expect(html).toContain('tabindex="0"');
    expect(html).not.toMatch(BAD);
  });

  it("draws a dot for a lone point between gaps", () => {
    const [line] = lineLayout([{ name: "A", points: days([null, 4, null]) }], 640).lines;
    expect(line.d).toBe("M" + line.lone[0].x + " " + line.lone[0].y);
    expect(line.lone).toHaveLength(1);
  });

  it("keeps at most three series and spreads colliding end labels", () => {
    const four = ["A", "B", "C", "D"].map((name) => ({ name, points: days([1, 2, 3]) }));
    const layout = lineLayout(four, 640);
    expect(layout.lines).toHaveLength(3);
    const ys = layout.labels.map((l) => l.y);
    for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(14);
  });

  it("reads out every series for a day", () => {
    const series = [online, { name: "Signups", points: days([1, 2, 3, 4, 5]) }];
    expect(readout(series, 2)).toBe("12 Oct: Players online no data, Signups 3");
    expect(readout(series, 99)).toBe("");
  });

  it("builds table/CSV rows from exactly the series it draws", () => {
    const series = [online, { name: "Signups", points: days([1, 2, 3, 4, 5]) }];
    const { columns, rows } = lineRows(series);
    expect(columns).toEqual([{ key: "day", label: "Day" }, { key: "s0", label: "Players online" }, { key: "s1", label: "Signups" }]);
    expect(rows).toHaveLength(5);
    expect(rows[2]).toEqual({ day: "2026-10-12", s0: null, s1: 3 });
  });

  it("flags more than three series and drops the rest from plot and rows alike", () => {
    const four = ["A", "B", "C", "D"].map((name) => ({ name, points: days([1, 2]) }));
    expect(seriesProblem(four)).toMatch(/at most 3/);
    expect(lineRows(four).columns.map((c) => c.label)).toEqual(["Day", "A", "B", "C"]);
    expect(seriesProblem(four.slice(0, 3))).toBeNull();
    expect(seriesProblem([])).toBeNull();
  });

  it("flags series on different days and aligns them to the first series' days", () => {
    const a = { name: "A", points: days([1, 2, 3]) };
    const b = { name: "B", points: [{ day: "2026-10-12", value: 9 }, { day: "2026-10-30", value: 7 }] };
    expect(seriesProblem([a, b])).toMatch(/"B" has a different day list/);
    expect(alignSeries([a, b]).series[1].points.map((p) => p.value)).toEqual([null, null, 9]);
    expect(lineRows([a, b]).rows.map((r) => r.s1)).toEqual([null, null, 9]);
    expect(readout([a, b], 2)).toBe("12 Oct: A 3, B 9");
  });

  it("formats days and passes through anything else", () => {
    expect(formatDay("2026-10-22")).toBe("22 Oct");
    expect(formatDay("week 3")).toBe("week 3");
  });
});

describe("bars", () => {
  it("scales to the largest value and handles all-zero data", () => {
    expect(barWidths([5, 10, 0])).toEqual([50, 100, 0]);
    expect(barWidths([0, 0])).toEqual([0, 0]);
    expect(barWidths([])).toEqual([]);
  });

  it("is one keyboard stop with readable rows, not hidden from screen readers", () => {
    const html = renderToStaticMarkup(<BarChart label="Faculty" data={[{ label: "Arts", value: 4 }]} />);
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="Faculty. Use the arrow keys to read each bar."');
    expect(html).not.toContain("aria-hidden");
    expect(html).toContain('aria-live="polite"');
  });

  it("reads out label, value and the funnel note", () => {
    expect(barReadout(barRows([{ label: "Arts", value: 1200 }])[0])).toBe("Arts: 1,200");
    expect(barReadout({ label: "Verified", value: "150", note: "83% of previous step", width: 60 })).toBe("Verified: 150 · 83% of previous step");
  });

  it("renders long Thai labels as wrapping HTML text", () => {
    const html = renderToStaticMarkup(<BarChart horizontal data={[{ label: "คณะวิศวกรรมศาสตร์", value: 12 }, { label: "Other", value: 0 }]} />);
    expect(html).toContain("คณะวิศวกรรมศาสตร์");
    expect(html).not.toMatch(BAD);
  });

  it("notes each funnel step against the previous one", () => {
    const steps = [{ step: "signed_in", label: "Signed in", n: 200 }, { step: "discord", label: "Discord", n: 150 }, { step: "verified", label: "Verified", n: 0 }, { step: "registered", label: "Registered", n: 0 }];
    expect(funnelNote(steps, 0)).toEqual({ count: "200", note: "" });
    expect(funnelNote(steps, 1).note).toBe("75% of previous step");
    expect(funnelNote(steps, 3).note).toBe("– of previous step");
    expect(renderToStaticMarkup(<FunnelChart steps={steps} />)).toContain("150");
  });
});

describe("MetricTile", () => {
  it("states the change with a sign and words", () => {
    const html = renderToStaticMarkup(<MetricTile label="New players" value={1284} delta={delta(112, 100)} series={[1, 2, 3]} href="/admin/players" />);
    expect(html).toContain("1,284");
    expect(html).toContain("+12%");
    expect(html).toContain("Up +12% vs previous period");
    expect(html).toContain('href="/admin/players"');
  });

  it("reads New instead of an infinite percentage and hides 'none'", () => {
    expect(deltaText(delta(5, 0))).toBe("New vs previous period (was 0)");
    expect(deltaText(delta(5, null))).toBe("");
    expect(renderToStaticMarkup(<MetricTile label="X" value={0} delta={delta(0, null)} />)).not.toContain("vs prev");
  });
});

describe("ChartFrame", () => {
  const columns = [{ key: "day", label: "Day" }, { key: "n", label: "Signups" }];

  it("puts the rows in a table and offers the CSV", () => {
    const html = renderToStaticMarkup(<ChartFrame title="Signups" csvName="signups" columns={columns} rows={[{ day: "2026-10-22", n: 4 }]}><p>chart</p></ChartFrame>);
    expect(html).toContain("<figcaption");
    expect(html).toContain("Download CSV");
    expect(html).toMatch(/<div class="sr-only"><table>/);
    expect(html).toContain("<td>2026-10-22</td><td>4</td>");
  });

  it("shows an empty state with no rows", () => {
    const html = renderToStaticMarkup(<ChartFrame title="Signups" csvName="signups" columns={columns} rows={[]}><p>chart</p></ChartFrame>);
    expect(html).toContain("No data in this range");
    expect(html).not.toContain("chart</p>");
    expect(html).not.toContain("Download CSV");
  });
});
