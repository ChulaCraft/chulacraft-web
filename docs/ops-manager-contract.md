# Ops manager contract

Single source of truth for the API that `chulacraft-server-manager` must serve and the website's `/admin/ops` consumes. `scripts/local-mocks.mjs` implements it for local dev; `src/lib/ops.ts` mirrors the types. Existing endpoint docs: `chulacraft-docs/docs/mcsv/api/`. This file is not copied there yet.

## Conventions

- JSON in and out. Timestamps are RFC 3339 UTC strings. Sizes are bytes.
- Auth on every endpoint: `Authorization: Bearer <EdDSA JWT>`, minted by the website per action, 60 s lifetime, claims `iss: "chulacraft-web"`, `aud: "mcsv-manager"`, `sub`, `jti`, `iat`, `exp`, `permission` (bit mask). The manager holds only the public key. The console WebSocket carries the token as the second subprotocol (`mcsv.jwt, <token>`), as today.
- Service ids match `^[A-Za-z0-9_.@-]+$` and come from the manager config.
- Mutating calls return `202` once the manager has accepted the work, not when it finishes. Clients poll `status`.

## Permission bits

| Bit | Name | Value | Granted to |
| --- | --- | --- | --- |
| 0 | STATUS | 1 | admin, owner |
| 1 | LOGS | 2 | admin, owner |
| 2 | CONSOLE_READ | 4 | admin, owner |
| 3 | CONSOLE_WRITE | 8 | owner |
| 4 | START | 16 | owner |
| 5 | STOP | 32 | owner |
| 6 | RESTART | 64 | admin, owner |
| 7 | BACKUP_READ | 128 | admin, owner (new) |
| 8 | BACKUP_RUN | 256 | admin, owner (new) |
| 9 | UPDATE | 512 | owner (new) |

Each token carries only the bits its request needs. `src/lib/mcsv-token.ts` adds the three new bits in Phase 7 Task 3.

## Errors

| Code | Meaning |
| --- | --- |
| 400 | Malformed body or query (for example an unknown backup `target`). |
| 401 | Missing, malformed, expired or wrongly signed token, or wrong `iss`/`aud`. |
| 403 | Valid token without the required permission bit. |
| 404 | Unknown service id, or an action/endpoint the service does not support (for example `image` on a systemd service, `update` when `updatable` is false). |
| 409 | The same action is already running (a backup of that target, an update in progress). |
| 500 | The manager failed to read or run the request. Body `{ "error": string }`. |
| 503 | systemd/D-Bus or the Docker socket proxy is unavailable. |

Error bodies are `{ "error": string }`. A failure on one service must not affect other services' endpoints.

## Endpoints

### `GET /services` (STATUS)

```json
[{ "id": "survival", "name": "Survival", "kind": "systemd", "console": true,
   "actions": ["start", "stop", "restart"], "backups": true, "updatable": false }]
```

`kind` is `"systemd"` or `"docker"`. `console`: the console WebSocket exists. `actions`: which of start/stop/restart the service allows. `backups`: the service is a backup target. `updatable`: `image` and `update` are supported (docker only). The website renders exactly this list and caps it at 50.

### `GET /service/:id/status` (STATUS)

```json
{ "state": "up", "since": "2026-10-22T09:01:20Z", "last_restart": "2026-10-22T09:01:20Z",
  "cpu_pct": 12.4, "mem_bytes": 471703076, "mem_limit_bytes": 2147483648 }
```

`state` is `"up" | "down" | "restarting" | "unknown"`. `since`: when it entered this state. `last_restart`: `null` if never. `cpu_pct` is 0..100 per the whole service (not per core); `mem_limit_bytes` is `0` when unlimited. Values are 0 when not `up`.

### `GET /service/:id/metrics?hours=24` (STATUS)

`hours` 1..168, default 24. Oldest first, 5-minute points, the last point is the current 5-minute bucket.

```json
[{ "t": "2026-10-22T11:05:00Z", "cpu_pct": 8.5, "mem_bytes": 807316001 }]
```

Missing samples (manager was down) are omitted, not zero-filled.

### `GET /service/:id/uptime?days=7` (STATUS)

`days` 1..7, default 7. Oldest first, one point per hour. `up_ratio` is the fraction of that hour (0..1) the service was `up`.

```json
[{ "t": "2026-10-22T11:00:00Z", "up_ratio": 1 }]
```

### `GET /service/:id/rlog` (LOGS)

Same body as today's `GET /server/:id/rlog` (`?max_lines=200`, newest first, `[{ "message": string }]`, extra fields allowed). Optional `?until=<RFC 3339 UTC>` returns only lines at or before that time; it defaults to now.

### Console WebSocket `/service/:id/console` (CONSOLE_READ; CONSOLE_WRITE to send)

Same protocol as today's `/server/:id/console`. Only for services with `console: true`; otherwise 404.

### `POST /service/:id/{start|stop|restart}` (START / STOP / RESTART)

No body. Returns `202 {}` and the state follows (`restarting` while a restart runs). `404` if the action is not in the service's `actions`. `409` if an action on that service is already running.

### `GET /backups` (BACKUP_READ)

Newest first.

```json
[{ "id": "bk-3", "target": "world", "kind": "nightly", "size_bytes": 812000000,
   "created_at": "2026-10-22T09:01:20Z", "status": "ok" }]
```

`target`: `"world"` (the Minecraft world), `"supabase"` (database dump) or `"bot"` (the Discord bot's `db.json`). `kind`: `"manual" | "nightly"`. `status`: `"running" | "ok" | "failed"`. `GET /backups` merges the manifests the backup units write with a `running` entry for any pending request whose unit is active. The API never deletes; retention is done by the backup script (see [Backups](#backups)).

### `POST /backups` (BACKUP_RUN)

Body `{ "target": "world" | "supabase" | "bot" }`. Returns `202 { "id": "bk-<utc>-<target>" }`; the new entry appears in `GET /backups` as `running`. `400` for another target, `409` if that target is already running. The manager never runs a dump itself; it hands the request to a root-owned unit:

1. It makes the id `bk-<utc>-<target>` and writes it to `/var/lib/mcsv_manager/backup-requests/<target>.id`.
2. It starts `chulacraft-backup@<target>.service` over D-Bus.
3. If starting the unit fails, it deletes the file and answers `500`.
4. The script, as root, reads the file, validates the id against `^bk-[0-9TZ]+-(world|supabase|bot)$`, deletes the file, and writes that id into the manifest with kind `manual`. With no file the script makes its own id and kind `nightly`.

### `GET /service/:id/image` (STATUS)

```json
{ "current": "ghcr.io/chulacraft/discord-bot:1.4.2", "latest": "ghcr.io/chulacraft/discord-bot:1.5.0",
  "checked_at": "2026-10-22T11:51:20Z" }
```

`current` and `latest` are `<image:tag>@<short digest>` (first 8 hex of the sha256). An image with no `RepoDigests` (built locally, never pushed) has `current` = `<image:tag>@unknown` and `latest` equal to `current`, so it reads as up to date. `current` is the running container's image: its tag plus the matching `RepoDigests` entry. `latest` is the digest the registry holds for the same tag, found with a read-only registry lookup (`GET /distribution/{name}/json` through the socket proxy, no pull). Equal strings mean up to date. `checked_at` is when that registry lookup last ran; the manager caches it (about hourly) and this endpoint never triggers a pull. If the registry is unreachable, serve the cached value; with no cache, `latest` equals `current`. `404` unless `updatable`.

### `POST /service/:id/update` (UPDATE)

No body. Pull + recreate, run by a root-owned systemd template unit, never by the manager process (see [Updates](#updates)). Returns `202` once the unit is started; afterwards `image.current == image.latest`. `404` unless `updatable`, `409` while the unit for that service is active.

### Aliases

`GET /servers` and `/server/:id/*` (status, rlog, start/stop/restart, console, cmd) keep working unchanged until the website has switched to `/services` and `/service/:id/*` in production. The manager removes them in a later release, announced in this file. The website has no `/servers` fallback: the manager with both sets ships first, then the migrations and the website together, then the aliases go (OPERATOR_RUNBOOK.md, "Release order (ops console)").

## Manager config

Listed services are the only ones the API knows. Example (TOML):

```toml
[[service]]
id = "survival"
name = "Survival"
backend = "systemd"
unit = "minecraft@survival.service"   # console = true, backups target "world"

[[service]]
id = "discord-bot"
name = "Discord bot"
backend = "docker"
container = "chulacraft-discord"
compose_file = "/srv/chulacraft/discord/compose.yaml"   # required for updatable; written to the root-owned update env file
compose_service = "bot"

[backups]
nightly_at = "04:00"      # host local time; the timer, not the manager, fires it
keep_daily = 7            # per target
keep_weekly = 4           # per target
world_dir = "/srv/minecraft/instances/<id>"   # one per Minecraft instance, matching minecraft@<id>.service
```

Backup commands and credentials live in the root-owned `backup.env`, never in the manager config and never on the website.

`id` must match the id pattern. `website` and `bot` are reserved: `/admin/ops/website` and `/admin/ops/bot` are fixed pages, so the website drops services with those ids (and every repeat of an id after the first). `console` is true for systemd services with a command pipe; docker services get it only if the manager implements attach. `updatable` is true iff `compose_file` and `compose_service` are set. `actions` defaults to all three.

Metrics: systemd from cgroup properties over D-Bus (`CPUUsageNSec`, `MemoryCurrent`, `MemoryMax`); docker from `/containers/<id>/stats?stream=false`. The manager keeps 7 days of 5-minute samples; storage is its own choice.

## Docker socket proxy

The manager never gets `/var/run/docker.sock` (root-equivalent). It talks to a filtering proxy that allows only:

The proxy is a small binary shipped with the manager (`mcsv-docker-proxy`). It allows only:

| Method and path | Use | Narrowing |
| --- | --- | --- |
| `GET /containers/json` | list | Filtered to the containers named in the manager config |
| `GET /containers/{id}/json` | inspect state | `{id}` must be a configured container; `Config.Env` is removed from the response |
| `GET /containers/{id}/logs` | rlog | Configured container only |
| `GET /containers/{id}/stats` (`stream=false`) | metrics | Configured container only |
| `POST /containers/{id}/start`, `/stop`, `/restart` | actions | Configured container only |
| `GET /images/{name}/json` | running image inspect (`RepoDigests`) | Configured images only |
| `GET /distribution/{name}/json` | registry digest lookup for `latest`, no pull | Configured images only |

`{id}` may be a container name or id, and is resolved to a name before the check.

Deny list, each answered `403`:

- Any container not named in the manager config, on every path above.
- Any response that would carry `Config.Env` (it holds the bot's tokens). The proxy strips it from `GET /containers/{id}/json` and never returns it elsewhere.
- Everything else: exec, create, delete, build, pull, volumes, networks, `POST /containers/create`.

The manager user is not in the `docker` group; the proxy serves only the read and lifecycle calls above.

## Updates

Pull and recreate need container create/remove, which the proxy denies on purpose, so they run outside the manager as a root-owned systemd template unit:

```ini
# /etc/systemd/system/chulacraft-update@.service
[Service]
Type=oneshot
EnvironmentFile=/etc/chulacraft/update/%i.env      # root-owned, 0600
ExecStart=/bin/sh -c 'docker compose -f "$COMPOSE_FILE" pull "$COMPOSE_SERVICE" && docker compose -f "$COMPOSE_FILE" up -d "$COMPOSE_SERVICE"'
```

- `/etc/chulacraft/update/<service-id>.env` (`COMPOSE_FILE=...`, `COMPOSE_SERVICE=...`) is generated from the manager config at deploy time. Nothing from a request ever reaches the command line; the request only picks which `<service-id>` instance to start, and only ids with `updatable` services have an env file.
- The manager starts `chulacraft-update@<service-id>.service` over D-Bus like any other unit. The shipped polkit rule (`config/polkit-1/rules.d/mcsv-manager.rules` in the manager repo) allows the manager user to manage every unit, not only `chulacraft-update@*`. Narrowing it is out of scope here. The limit that matters is in the unit: it takes only its instance name from the request, and only instances with an env file do anything.
- While that unit is `active`, the manager answers `409`. A failed unit shows in `journalctl -u chulacraft-update@<service-id>`.

## Backups

Backups are one implementation, run by root, never by the manager (the same pattern as [Updates](#updates)).

- `chulacraft-backup@<target>.service` (target `world`, `supabase` or `bot`) and `chulacraft-backup-nightly.timer` (04:00 host time, `Persistent=true`). The timer starts the three targets; `POST /backups` starts one.
- Archives go to `/var/backups/chulacraft/` (`0700 root`). Manifests go to `/var/lib/chulacraft-backup/manifest/` (`0750 root:mcsv-mgr`), so the manager can read sizes and status but no archive.
- Retention is `keep_daily = 7` and `keep_weekly = 4` per target, applied by the script after a successful run.
- Target `world` makes one archive per Minecraft instance under one backup id, and `size_bytes` is their sum. The instances come from `WORLD_INSTANCES` in `backup.env`; preflight lists them with `systemctl list-units 'minecraft@*'`. The disk-space guard uses that sum.
- A run that fails always posts to the alert webhook, because `/admin/ops` cannot show backups until the manager is deployed.

## Health probe: `GET /api/ops/health` (website)

Served by the website, not the manager. `Authorization: Bearer <OPS_HEALTH_TOKEN>`, compared in constant time; wrong or missing token is `401`. Probe the `www` host, `https://www.chulacraft.com/api/ops/health`: the bare domain answers `308` to `www`, and `fetch` drops `Authorization` on a cross-origin redirect, so the probe would see `401`. A probe must not follow redirects.

```json
{ "ok": true, "db": "ok", "errors_5m": 0, "version": "d071e91" }
```

`db` is `"ok" | "down"`; `ok` is false when `db` is down. `errors_5m` counts errors recorded in the last 5 minutes. `version` is the short `VERCEL_GIT_COMMIT_SHA`, or `dev`. The bot's status monitor probes it every 60 s: down when the request fails, is not 200, or `ok` is false; error-spike alert when `errors_5m >= 10`. The manager sends no alerts.

## Restore is manual

There is no restore endpoint or button. A restore is an operator runbook step (`OPERATOR_RUNBOOK.md`, "Ops console, backups and restore").
