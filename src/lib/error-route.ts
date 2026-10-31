// The one route normaliser for error capture. Shared by the browser reporter
// (report-error.ts) and the server recorder (app-errors.ts re-exports it), so it
// imports nothing server-only.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Turns a URL path into a route pattern: query and fragment dropped, UUID and all-digit
 *  segments become `[id]`. One bug on /player/<uuid> is then one group, and no user id is
 *  stored. `fromFile` is for Next's context.routePath, a route file path such as
 *  "/events/[id]/page" (the docs show an "/app" prefix): the prefix, the `/page` or
 *  `/route` file name, route groups and slots are dropped too. */
export function normaliseRoute(path: string, fromFile = false): string {
  const parts = path.split(/[?#]/)[0].split("/").filter(Boolean);
  if (fromFile) {
    // src/app has no "app" route, so a leading "app" can only be the directory.
    if (parts[0] === "app") parts.shift();
    if (parts.at(-1) === "page" || parts.at(-1) === "route") parts.pop();
  }
  const kept = parts
    .filter((s) => !/^\(.*\)$/.test(s) && !s.startsWith("@"))
    .map((s) => (UUID.test(s) || /^\d+$/.test(s) ? "[id]" : s));
  return `/${kept.join("/")}`.slice(0, 200);
}
