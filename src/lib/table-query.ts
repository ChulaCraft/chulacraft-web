// URL ⇄ table state for admin tables. See docs/admin-tables.md.

export type Option = { value: string; label: string };
export type Column = { key: string; label: string; sort?: boolean } & (
  | { filter?: undefined }
  | { filter: "text" }
  | { filter: "enum"; options: Option[] }
  | { filter: "date" }
);

export type Filters = Record<string, string | string[]>;
/** sort "" = no column chosen; the table's RPC applies its default order. */
export type TableState = { q: string; sort: string; desc: boolean; filters: Filters };
export type RawParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const isDay = (v: string | undefined): v is string => {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
};

/** Search params → state. Anything unknown or malformed is dropped here, so the
 *  RPC's INVALID only fires for hand-made calls. */
export function readTable(sp: RawParams, columns: Column[]): TableState {
  const filters: Filters = {};
  for (const c of columns) {
    if (c.filter === "text") {
      const v = one(sp[c.key])?.trim().slice(0, 100);
      if (v) filters[c.key] = v;
    } else if (c.filter === "enum") {
      const allowed = new Set(c.options.map((o) => o.value));
      const raw = sp[c.key];
      const v = [...new Set((Array.isArray(raw) ? raw : [raw ?? ""]).flatMap((x) => x.split(",")).filter((x) => allowed.has(x)))];
      if (v.length) filters[c.key] = v;
    } else if (c.filter === "date") {
      for (const end of ["from", "to"]) {
        const v = one(sp[`${c.key}_${end}`]);
        if (isDay(v)) filters[`${c.key}_${end}`] = v;
      }
    }
  }
  const sortKey = one(sp.sort);
  const sort = columns.some((c) => c.sort && c.key === sortKey) ? sortKey! : "";
  return { q: one(sp.q)?.trim().slice(0, 100) ?? "", sort, desc: sort === "" || one(sp.dir) !== "asc", filters };
}

/** State (with a patch) → URL. Defaults are omitted so links stay short. */
export function tableHref(base: string, state: TableState, patch: { q?: string; sort?: string; desc?: boolean; filters?: Partial<Record<string, string | string[] | undefined>> } = {}) {
  const next = { ...state, ...patch, filters: { ...state.filters, ...patch.filters } };
  const p = new URLSearchParams();
  if (next.q) p.set("q", next.q);
  for (const [k, v] of Object.entries(next.filters)) {
    const text = Array.isArray(v) ? v.join(",") : v;
    if (text) p.set(k, text);
  }
  if (next.sort) {
    p.set("sort", next.sort);
    p.set("dir", next.desc ? "desc" : "asc");
  }
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}

/** URLSearchParams → the same shape Next gives a page (repeated keys as arrays). */
export function paramsOf(sp: URLSearchParams): RawParams {
  const out: RawParams = {};
  for (const key of new Set(sp.keys())) {
    const all = sp.getAll(key);
    out[key] = all.length > 1 ? all : all[0];
  }
  return out;
}

/** A header click: off → ascending → descending → off. */
export function nextSort(state: TableState, key: string): { sort: string; desc: boolean } {
  if (state.sort !== key) return { sort: key, desc: false };
  return state.desc ? { sort: "", desc: true } : { sort: key, desc: true };
}
