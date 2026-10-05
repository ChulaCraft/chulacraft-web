/** Admin forms submit `datetime-local` in Asia/Bangkok (D8), which is what the
 *  server parses here; browsers are told the same zone by the input's value. */
export function instant(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) return null;
  const parsed = new Date(`${value}:00+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** `datetime-local` wants a bare local time with no seconds; everything here is
 *  Bangkok (D8), so the offset is stripped off the stored timestamptz. Built from
 *  the Intl parts rather than a locale string, so the shape can't drift. */
export function bangkokInput(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
