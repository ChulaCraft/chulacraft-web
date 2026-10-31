import type { MetadataRoute } from "next";

// Colours are --night and --sakura from globals.css (the site is dark-only).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ChulaCraft",
    short_name: "ChulaCraft",
    description: "The Minecraft Java server for the Chula community.",
    start_url: "/",
    display: "standalone",
    background_color: "#110c1b",
    theme_color: "#110c1b",
    // public/icons: the logo at 80% on --night, so "maskable" crops keep it whole.
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
