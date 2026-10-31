import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

/** Signed-in and staff areas stay out of search results; they redirect a
 *  crawler to sign-in anyway. Player pages are allowed to be crawled so their
 *  `noindex` (player/[id]/page.tsx) can be read. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/settings", "/dashboard", "/api"] },
    sitemap: new URL("/sitemap.xml", getSiteUrl()).toString(),
  };
}
