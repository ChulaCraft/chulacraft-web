const BOM = "﻿";
const SIGNED_NUMBER = /^[+-]?\d+(\.\d+)?%?$/;

function cell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  // A leading = + - @ tab or CR can start a formula in a spreadsheet, so it is
  // prefixed with '. A plain signed number or percentage ("+12%", "-50%", "-3.5")
  // can't run anything and is left as is.
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s) && !SIGNED_NUMBER.test(s)) s = `'${s}`;
  return /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(columns: { key: string; label: string }[], rows: Record<string, unknown>[]): string {
  const lines = [columns.map((c) => cell(c.label)), ...rows.map((r) => columns.map((c) => cell(r[c.key])))];
  return BOM + lines.map((l) => l.join(",")).join("\r\n");
}
