import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { createBoundedFetch } from "@/lib/bounded-fetch";
import { getPublicSupabaseEnvironment } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";
import { DEFAULT_PAGES, LEGAL_EFFECTIVE_DATE, type PageSlug } from "@/lib/site-pages";

// Staff-edited content (20261025000001), read anonymously without cookies.
// Read live, once per request (React cache): staff expect to see a save the
// moment they look. Tag invalidation of unstable_cache still served the old
// copy once after every save.
// ponytail: one small RPC per page view; cache it in Phase 7 if it shows up in
// the measurements, with an invalidation that is actually read-your-writes.

export const DEFAULT_DISCORD_URL = "https://discord.gg/TQ65Fkdx6A";

/** What the site shows when a setting was never set or was cleared. */
export const SETTING_DEFAULTS = {
  home_kicker: "Build your world at",
  home_intro: "A community-run survival world for the Chula community. Sign in with Discord, verify your Chula account, and start building.",
  server_address: process.env.NEXT_PUBLIC_MINECRAFT_SERVER_ADDRESS?.trim() ?? "",
  discord_url: DEFAULT_DISCORD_URL,
  registration_open: "true",
  reports_open: "true",
};
export type SettingKey = keyof typeof SETTING_DEFAULTS;
export const SETTING_KEYS = Object.keys(SETTING_DEFAULTS) as SettingKey[];

export function anonClient() {
  const { url, key } = getPublicSupabaseEnvironment();
  return createSupabaseClient<Database>(url, key, {
    global: { fetch: createBoundedFetch() },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

const storedSettings = cache(
  async () => {
    const { data, error } = await anonClient().rpc("get_site_settings");
    if (error) throw new Error(error.message);
    return Object.fromEntries((data ?? []).map((row) => [row.key, row.value])) as Partial<Record<SettingKey, string>>;
  }
);

/** Stored values over the defaults. A database outage falls back to the
 *  defaults, so it can't take every page down with it. */
export async function siteSettings() {
  const stored = await storedSettings().catch(() => ({}));
  const s = { ...SETTING_DEFAULTS, ...stored };
  return {
    homeKicker: s.home_kicker,
    homeIntro: s.home_intro,
    serverAddress: s.server_address || null,
    discordUrl: s.discord_url,
    registrationOpen: s.registration_open !== "false",
    reportsOpen: s.reports_open !== "false",
  };
}

type Rows<F extends keyof Database["public"]["Functions"]> = Database["public"]["Functions"][F]["Returns"];
export type GalleryGroup = Rows<"list_gallery_groups">[number];
export type GalleryImage = Rows<"list_gallery">[number];
export type TeamGeneration = Rows<"list_team_generations">[number];
export type TeamMember = Rows<"list_team">[number];

/** Throws on failure; the pages decide what an outage looks like. */
export const gallery = cache(
  async (): Promise<{ groups: GalleryGroup[]; images: GalleryImage[] }> => {
    const client = anonClient();
    const [groups, images] = await Promise.all([client.rpc("list_gallery_groups"), client.rpc("list_gallery")]);
    if (groups.error || images.error) throw new Error((groups.error ?? images.error)!.message);
    return { groups: groups.data ?? [], images: images.data ?? [] };
  }
);

export const team = cache(
  async (): Promise<{ generations: TeamGeneration[]; members: TeamMember[] }> => {
    const client = anonClient();
    const [generations, members] = await Promise.all([client.rpc("list_team_generations"), client.rpc("list_team")]);
    if (generations.error || members.error) throw new Error((generations.error ?? members.error)!.message);
    return { generations: generations.data ?? [], members: members.data ?? [] };
  }
);

const storedPage = cache(
  async (slug: PageSlug) => {
    const { data, error } = await anonClient().rpc("get_site_page", { p_slug: slug });
    if (error) throw new Error(error.message);
    return data?.[0] ?? null;
  }
);

export const effectiveDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", day: "numeric", month: "long", year: "numeric" });

/** The edited text, or the built-in one when never edited or unreachable. */
export async function sitePage(slug: PageSlug) {
  const row = await storedPage(slug).catch(() => null);
  return row
    ? { source: row.body, effective: effectiveDate(row.updated_at), edited: true }
    : { source: DEFAULT_PAGES[slug], effective: LEGAL_EFFECTIVE_DATE, edited: false };
}
