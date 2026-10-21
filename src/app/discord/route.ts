import { siteSettings } from "@/lib/site-content";

/** Every "Join Discord" link points here, so changing the invite in
 *  /admin/settings updates them all, client components included. */
export async function GET() {
  const { discordUrl } = await siteSettings();
  return Response.redirect(discordUrl, 307);
}
