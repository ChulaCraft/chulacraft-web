import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
      { protocol: "https", hostname: "media.discordapp.net" }
    ]
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
    }];
  }
};

export default nextConfig;
