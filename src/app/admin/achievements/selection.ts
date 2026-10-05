import { UUID } from "@/lib/registration";

/** The players ticked in one or more searches, kept in the URL as a comma
 *  separated list so a selection survives a reload and a shared link. Only
 *  UUIDs are honoured, so the query string cannot smuggle anything else. */
export function selectionIds(raw: string | null | undefined): string[] {
  return (raw ?? "").split(",").map((value) => value.trim()).filter((value) => UUID.test(value));
}

export function selectionParam(ids: string[]) {
  return ids.join(",");
}