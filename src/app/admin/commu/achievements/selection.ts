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

/** Rows per page in the award picker. */
export const AWARD_PAGE_SIZE = 50;
/** admin_list_player_ids stops here (20261101000001), so "select all" can fall short. */
export const MAX_SELECT_ALL = 5000;
