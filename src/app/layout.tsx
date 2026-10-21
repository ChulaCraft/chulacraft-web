import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { bodyFont, displayFont, monoFont } from "@/lib/fonts";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  // Pages set a short `title`; the template adds the site name to every tab.
  title: { default: "ChulaCraft | Minecraft Server", template: "%s | ChulaCraft" },
  description: "Register your Minecraft Java Edition account for ChulaCraft.",
  icons: {
    icon: "/images/chulacraft-logo.webp",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`}>
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
