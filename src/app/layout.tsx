import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { bodyFont, displayFont, monoFont } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChulaCraft | Minecraft Server",
  description: "Register your Minecraft Java Edition account for ChulaCraft.",
  icons: {
    icon: "/images/chulacraft-logo.webp",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
