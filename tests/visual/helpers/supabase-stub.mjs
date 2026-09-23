import { createServer } from "node:http";

const host = "127.0.0.1";
const port = 3211;
let authenticated = false;

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${host}:${port}`);

  if (request.method === "GET" && url.pathname === "/health") {
    response.writeHead(204).end();
    return;
  }

  if (request.method === "POST" && url.pathname === "/__visual/state") {
    authenticated = url.searchParams.get("authenticated") === "true";
    response.writeHead(204).end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/auth/v1/user") {
    if (authenticated) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        id: "00000000-0000-4000-8000-000000000001",
        aud: "authenticated",
        role: "authenticated",
        email: "visual-audit@example.test",
        app_metadata: { provider: "discord", providers: ["discord"] },
        user_metadata: { full_name: "Visual Player", user_name: "visual-player" },
        identities: [],
        created_at: "2026-01-01T00:00:00.000Z"
      }));
      return;
    }
    response.writeHead(401, { "content-type": "application/json" });
    response.end(JSON.stringify({ message: "No authenticated visual-audit session" }));
    return;
  }

  if (request.method === "GET" && ["/rest/v1/minecraft_registrations", "/rest/v1/cu_sso_identities", "/rest/v1/profiles"].includes(url.pathname)) {
    response.writeHead(200, { "content-type": "application/json" });
    response.end("null");
    return;
  }

  response.writeHead(405, { "content-type": "application/json" });
  response.end(JSON.stringify({ message: "Visual audit stub is read-only" }));
});

server.listen(port, host);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
