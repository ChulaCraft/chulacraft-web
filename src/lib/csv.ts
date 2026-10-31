type Cell = string | number | boolean | null;

/** RFC 4180 CSV. Text starting like a formula gets a leading ' so a
 *  spreadsheet shows it instead of running it. */
export function toCsv(rows: Cell[][]): string {
  const cell = (value: Cell) => {
    if (value === null) return "";
    let text = String(value);
    if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return rows.map((row) => row.map(cell).join(",") + "\r\n").join("");
}
