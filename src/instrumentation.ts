import type { Instrumentation } from "next";

// Records server errors (render, route handler, action, proxy) in app_errors, under the
// route pattern from context.routePath (e.g. /events/[id]), never the visited path.
export const onRequestError: Instrumentation.onRequestError = async (err, _request, context) => {
  const digest = typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined;
  // Redirects and not-found are control flow, not failures.
  if (digest && /^NEXT_(REDIRECT|NOT_FOUND|HTTP_ERROR_FALLBACK)/.test(digest)) return;
  try {
    const message = err instanceof Error ? err.message : String(err);
    const { normaliseRoute, recordAppError } = await import("@/lib/app-errors");
    await recordAppError({ kind: "server", route: normaliseRoute(context.routePath, true), message, digest });
  } catch {
    // Reporting must never become a second failure.
  }
};
