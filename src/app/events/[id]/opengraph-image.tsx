import { eventImageUrl } from "@/components/event-card";
import { cardImage, OG_SIZE, OG_TYPE, pictureData, siteImage } from "@/lib/og-image";
import { UUID } from "@/lib/registration";
import { anonClient } from "@/lib/site-content";

export const alt = "ChulaCraft event";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "full", timeStyle: "short" });

/** Name, date and poster. Read anonymously: a shared link is opened by a
 *  crawler with no session, and get_event returns published events only, so a
 *  draft or unknown id gets the site image. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return siteImage();
  const { data } = await anonClient().rpc("get_event", { p_id: id }).then((r) => r, () => ({ data: null }));
  const event = data as { name: string; starts_at: string; location: string | null; image_path: string | null } | null;
  if (!event) return siteImage();
  const poster = await pictureData(event.image_path ? eventImageUrl(event.image_path) : null, 400, 500);
  return cardImage({
    kicker: "ChulaCraft event",
    title: event.name,
    lines: [when(event.starts_at), ...(event.location ? [event.location] : [])],
    picture: poster ? { src: poster, width: 400, height: 500 } : null,
  });
}
