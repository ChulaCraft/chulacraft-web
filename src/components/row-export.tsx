"use client";

import { useEffect, useState } from "react";

const FORM_ID = "export-rows";

type Props = {
  /** The export route, for example /admin/players/export. */
  href: string;
  /** The screen's current filters, repeated names allowed. */
  filters?: [string, string][];
  className?: string;
};

/**
 * Export-all link plus a button that exports only the ticked rows. Row checkboxes
 * join the form with `<input type="checkbox" name="id" value={id} form="export-rows">`,
 * so server-rendered lists need no client state. Ticked ids go in a POST body.
 */
export function RowExport({ href, filters = [], className = "btn" }: Props) {
  const [ticked, setTicked] = useState(0);
  useEffect(() => {
    const count = () => setTicked(document.querySelectorAll(`input[name="id"][form="${FORM_ID}"]:checked`).length);
    document.addEventListener("change", count);
    return () => document.removeEventListener("change", count);
  }, []);
  const query = new URLSearchParams(filters).toString();
  return <>
    <a className={className} href={query ? `${href}?${query}` : href} download>Export all</a>
    <button type="submit" form={FORM_ID} className={className} disabled={ticked === 0}>Export ticked{ticked > 0 ? ` (${ticked})` : ""}</button>
    <form id={FORM_ID} method="post" action={href}>
      {filters.map(([name, value], i) => <input key={i} type="hidden" name={name} value={value} />)}
    </form>
  </>;
}
