import type { NextRequest } from "next/server";
import { managerSocketOrigin } from "@/lib/mcsv-token";
import { updateSession } from "@/lib/supabase/middleware";

const isDev = process.env.NODE_ENV === "development";

/** The browser Supabase client calls its own origin (Auth/REST; no realtime is used). */
function supabaseOrigin(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** Per-request policy, per node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md. */
function buildCsp(nonce: string): string {
  const supabase = supabaseOrigin();
  const manager = managerSocketOrigin();
  return [
    "default-src 'self'",
    // 'strict-dynamic' lets the nonce-carrying Next.js/Vercel scripts load their own children
    // (e.g. @vercel/analytics injecting /_vercel/insights/script.js) whatever its origin.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // React `style={{...}}` attributes cannot carry a nonce and several components use them,
    // and styles are not an execution vector, so 'unsafe-inline' here keeps layout working.
    "style-src 'self' 'unsafe-inline'",
    // Discord avatars, mc-heads.net player heads (admin player search) and
    // the Supabase origin, which serves the public achievement/event images.
    `img-src 'self' blob: data: https://cdn.discordapp.com https://media.discordapp.net https://mc-heads.net${supabase ? ` ${supabase}` : ""}`,
    "font-src 'self' data:",
    `connect-src 'self'${supabase ? ` ${supabase}` : ""}${manager ? ` ${manager}` : ""} https://va.vercel-scripts.com`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Production only: it would rewrite the http:// Supabase URLs used by local dev.
    ...(isDev ? [] : ["upgrade-insecure-requests"])
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  // Next.js parses the nonce out of the request CSP header while rendering and stamps its own tags.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  return updateSession(request, buildCsp(nonce));
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"] };
