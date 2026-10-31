import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { bodyFont, bodyFontRegular, displayFont, monoFont } from "@/lib/fonts";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  // Canonical and og:image URLs are relative; this makes them absolute.
  metadataBase: new URL(getSiteUrl()),
  // Pages set a short `title`; the template adds the site name to every tab.
  title: { default: "ChulaCraft | Minecraft Server", template: "%s | ChulaCraft" },
  description: "ChulaCraft is the Minecraft Java server for the Chula community. Register, verify your Chula account and join.",
  // Every public page sets its own `alternates.canonical`. The icons, the
  // manifest and the shared image come from the metadata files beside this one
  // (icon.png, apple-icon.png, manifest.ts, opengraph-image.tsx). Pages leave
  // `openGraph` alone so the shared image is not dropped by a shallow merge.
  openGraph: { siteName: "ChulaCraft", type: "website", locale: "en_US" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${bodyFontRegular.variable} ${displayFont.variable} ${monoFont.variable}`}>
        {/* Header and footer live here so client navigations keep them instead of re-fetching. */}
        <div className="page">
          <a className="skip-link" href="#content">Skip to content</a>
          <SiteHeader />
          {/* Skip-link target: pages each render their own <main>, so the jump lands just before it. */}
          <span id="content" tabIndex={-1} />
          {children}
          <SiteFooter />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
