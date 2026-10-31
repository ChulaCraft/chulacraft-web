import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

// Achievement and event images live in the public "achievements" Storage bucket.
const storage = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL("/storage/v1/object/public/achievements/**", process.env.NEXT_PUBLIC_SUPABASE_URL) : null;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // `next dev` only trusts localhost. Extra hostnames for opening the dev
  // server remotely (e.g. a Tailscale Serve name) come from the local env file,
  // comma-separated, so no personal hostname is committed.
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(",").map((h) => h.trim()).filter(Boolean),
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },
  experimental: {
    // Achievement and event images arrive as multipart form data on a server
    // action, so the 1MB default would reject a valid 2MB upload (AC 4).
    serverActions: { bodySizeLimit: "3mb" }
  },
  images: {
    // AVIF is ~20-30% smaller than WebP; browsers without it still get WebP.
    formats: ["image/avif", "image/webp"],
    // Site images only change on deploy, so keep optimized copies for 31 days.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "media.discordapp.net" },
      ...(storage ? [storage] : [])
    ],
    // Local `supabase start` serves Storage from 127.0.0.1, which the optimizer
    // refuses by default. Only ever true for that loopback dev setup.
    dangerouslyAllowLocalIP: storage !== null && ["127.0.0.1", "localhost"].includes(storage.hostname)
  },
  // v1.1 moved community admin under /admin/commu; keep old bookmarks working.
  // Events first: the achievements rule would otherwise catch it.
  async redirects() {
    return [
      { source: "/admin/achievements/events/:path*", destination: "/admin/commu/events/:path*", permanent: true },
      { source: "/admin/achievements/:path*", destination: "/admin/commu/achievements/:path*", permanent: true },
      { source: "/admin/announcements/:path*", destination: "/admin/commu/announcements/:path*", permanent: true },
      // v1.1 Phase 7: the Minecraft-only server page became the ops console for every service.
      { source: "/admin/server", destination: "/admin/ops", permanent: true }
    ];
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        // Content-Security-Policy is built per request in src/proxy.ts so it can carry a nonce.
      ]
    }, {
      // The staff scanner needs the camera. Listed after the catch-all because
      // the last matching key wins, so the whole value is restated here.
      source: "/admin/commu/events/:id/check-in",
      headers: [{ key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" }]
    }];
  }
};

export default nextConfig;
