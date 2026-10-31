import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ recordAppError: vi.fn() }));
vi.mock("@/lib/app-errors", async () => ({ ...(await import("@/lib/error-route")), recordAppError: m.recordAppError }));

import { onRequestError } from "./instrumentation";

const request = { path: "/player/3f2a9c1e-8b7d-4e6f-a1b2-c3d4e5f60718?x=1", method: "GET", headers: {} };
const context = (routePath: string) =>
  ({ routerKind: "App Router", routePath, routeType: "render", renderSource: "server-rendering", revalidateReason: undefined }) as Parameters<typeof onRequestError>[2];

describe("onRequestError", () => {
  beforeEach(() => m.recordAppError.mockReset());

  it("records the route pattern from context.routePath, never the visited path", async () => {
    await onRequestError(Object.assign(new Error("boom"), { digest: "99" }), request, context("/player/[id]/page"));
    expect(m.recordAppError).toHaveBeenCalledWith({ kind: "server", route: "/player/[id]", message: "boom", digest: "99" });
  });

  it("ignores redirects and not-found", async () => {
    await onRequestError(Object.assign(new Error("x"), { digest: "NEXT_REDIRECT;replace;/;307;" }), request, context("/page"));
    await onRequestError(Object.assign(new Error("x"), { digest: "NEXT_HTTP_ERROR_FALLBACK;404" }), request, context("/page"));
    expect(m.recordAppError).not.toHaveBeenCalled();
  });
});
