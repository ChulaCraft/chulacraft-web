import Form from "next/form";
import Link from "next/link";
import { nextSort, tableHref, type Column, type TableState } from "@/lib/table-query";
import styles from "./data-table.module.css";

// Shared admin table parts, per docs/admin-tables.md. No hooks, so they render
// from server and client components alike, and work without JS. Every link and
// form only changes the view, so none of them jump to the top (scroll={false}).

type Ctx = { base: string; state: TableState };

const keysOf = (c: Column) => (c.filter === "date" ? [`${c.key}_from`, `${c.key}_to`] : c.filter ? [c.key] : []);

/** The current view as hidden inputs, minus `except`, so a GET form keeps it. */
export function KeepState({ state, except = [] }: { state: TableState; except?: string[] }) {
  return <>
    {!except.includes("q") && state.q && <input type="hidden" name="q" value={state.q} />}
    {Object.entries(state.filters).filter(([k]) => !except.includes(k)).map(([k, v]) =>
      <input key={k} type="hidden" name={k} value={Array.isArray(v) ? v.join(",") : v} />)}
    {state.sort && <><input type="hidden" name="sort" value={state.sort} /><input type="hidden" name="dir" value={state.desc ? "desc" : "asc"} /></>}
  </>;
}

/** Header click cycles the column's sort: off → ▲ ascending → ▼ descending → off. */
export function SortHeader({ column: c, base, state }: Ctx & { column: Column }) {
  if (!c.sort) return <th scope="col">{c.label}</th>;
  const on = state.sort === c.key;
  const label = !on ? "sort ascending" : state.desc ? "remove sort" : "sort descending";
  return (
    <th scope="col" aria-sort={on ? (state.desc ? "descending" : "ascending") : undefined}>
      <Link scroll={false} href={tableHref(base, state, nextSort(state, c.key))} className={styles.sort} data-on={on || undefined} title={`${c.label}: ${label}`}>
        {c.label}<span aria-hidden="true">{on ? (state.desc ? "▼" : "▲") : "▾"}</span>
      </Link>
    </th>
  );
}

/** One Filter button; the panel holds every filterable column. Fill only what you need. */
export function FilterPanel({ columns, base, state }: Ctx & { columns: Column[] }) {
  const filterable = columns.filter((c) => c.filter);
  const active = filterable.filter((c) => keysOf(c).some((k) => k in state.filters)).length;
  const v = (k: string) => state.filters[k];
  return (
    <details className={styles.filters}>
      <summary className="btn btn-sm">Filter{active > 0 && <span className={styles.count}>{active}</span>}</summary>
      <Form scroll={false} action={base} className={styles.panel}>
        <KeepState state={state} except={filterable.flatMap(keysOf)} />
        <div className={styles.grid}>
          {filterable.map((c) => (
            <fieldset key={c.key} className={styles.group}>
              <legend>{c.label}</legend>
              {c.filter === "text" && <input className="input" name={c.key} defaultValue={(v(c.key) as string) ?? ""} placeholder="Contains…" autoComplete="off" aria-label={`${c.label} contains`} />}
              {c.filter === "enum" && c.options.map((o) => (
                <label key={o.value} className={styles.check}>
                  <input type="checkbox" name={c.key} value={o.value} defaultChecked={((v(c.key) as string[]) ?? []).includes(o.value)} />{o.label}
                </label>
              ))}
              {c.filter === "date" && <div className={styles.dates}>
                <label>From<input className="input" type="date" name={`${c.key}_from`} defaultValue={(v(`${c.key}_from`) as string) ?? ""} /></label>
                <label>To<input className="input" type="date" name={`${c.key}_to`} defaultValue={(v(`${c.key}_to`) as string) ?? ""} /></label>
              </div>}
            </fieldset>
          ))}
        </div>
        <div className={styles.actions}>
          <button className="btn btn-sm btn-primary" type="submit">Apply</button>
          {active > 0 && <Link scroll={false} href={tableHref(base, { ...state, filters: {} })} className="link-button">Clear filters</Link>}
        </div>
      </Form>
    </details>
  );
}

/** One removable chip per active filter, plus Clear all. */
export function FilterChips({ columns, base, state }: Ctx & { columns: Column[] }) {
  const chips = columns.flatMap((c) => {
    const keys = keysOf(c).filter((k) => k in state.filters);
    if (!keys.length) return [];
    const f = state.filters;
    const text = c.filter === "enum"
      ? (f[c.key] as string[]).map((x) => c.options.find((o) => o.value === x)?.label ?? x).join(", ")
      : c.filter === "date"
        ? [f[`${c.key}_from`] && `from ${f[`${c.key}_from`]}`, f[`${c.key}_to`] && `to ${f[`${c.key}_to`]}`].filter(Boolean).join(" ")
        : `“${f[c.key]}”`;
    return [{ key: c.key, label: `${c.label}: ${text}`, href: tableHref(base, state, { filters: Object.fromEntries(keys.map((k) => [k, undefined])) }) }];
  });
  if (state.q) chips.unshift({ key: "q", label: `Search: “${state.q}”`, href: tableHref(base, state, { q: "" }) });
  if (!chips.length) return null;
  return (
    <ul className={styles.chips} aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.key}><Link scroll={false} href={chip.href} className={styles.chip}>{chip.label}<span aria-hidden="true">×</span><span className="sr-only">Remove filter</span></Link></li>
      ))}
      <li><Link scroll={false} href={tableHref(base, { ...state, q: "", filters: {} })} className="link-button">Clear all</Link></li>
    </ul>
  );
}
