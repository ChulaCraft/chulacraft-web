import type { Metadata } from "next";
import { inter, minecraftia, rajdhani } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chulacraft | Minecraft Server",
  description: "Register your Minecraft Java Edition account for Chulacraft.",
  icons: {
    icon: "/images/chulacraft-logo.webp",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${rajdhani.variable} ${minecraftia.variable}`}>{children}</body>
    </html>
  );
}
