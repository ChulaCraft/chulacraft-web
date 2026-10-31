import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";
import { anonClient } from "@/lib/site-content";

/** Built per request so a newly published event is listed straight away;
 *  crawlers fetch it rarely and it is two anon reads. */
export const dynamic = "force-dynamic";

const STATIC_ROUTES = ["/", "/about", "/announcements", "/events", "/gallery", "/team", "/rules", "/privacy", "/terms", "/register"];

/** Public pages plus every published event the two anon list reads return
 *  (the next 12 and the last 48). Players are left out: their pages are
 *  signed-in only and noindex to crawlers. A failed read still serves the
 *  static pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const url = (path: string) => new URL(path, site).toString();
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({ url: url(path) }));
  try {
    const client = anonClient();
    const [upcoming, past] = await Promise.all([
      client.rpc("list_upcoming_events", { p_limit: 12 }),
      client.rpc("list_past_events", { p_limit: 48 }),
    ]);
    for (const event of [...(upcoming.data ?? []), ...(past.data ?? [])] as { id: string }[]) {
      entries.push({ url: url(`/events/${event.id}`) });
    }
  } catch {
    // Static routes only.
  }
  return entries;
}
