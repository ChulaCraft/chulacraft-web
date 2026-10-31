# Chulacraft registration runbook

## Safe launch order

1. Run `supabase/migrations/202607270001_minecraft_registrations.sql` in the intended Supabase project and verify RLS with two test users.
2. Configure Supabase Discord OAuth. In Discord, use only the exact provider callback `https://xtqpulleqbvoroxzheor.supabase.co/auth/v1/callback`. In Supabase URL Configuration, set Site URL to `https://mc.ratchaphon.com` and allow both `http://localhost:3000/auth/callback` and `https://mc.ratchaphon.com/auth/callback`. During domain migration, the old Vercel callback may remain temporarily. The app intentionally uses the path-only callback so the allowlist does not depend on query parameters.
3. Set only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` on the web host.
4. On the Minecraft host, create `minecraft/.env` from its example with `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and the existing `RCON_PASSWORD`. Never place these backend secrets on the web host.
5. Start with `docker compose -f minecraft/compose.yaml up -d --build`. Whitelist enforcement is enabled by this stack, so do not turn it on before the migration and worker secrets are ready.
6. Deploy the web application over HTTPS, update the Supabase Site URL/redirect allow list, then perform one real Discord/Minecraft registration test.

## Normal operations

- Inspect service health with `docker compose -f minecraft/compose.yaml ps` and worker logs with `docker compose -f minecraft/compose.yaml logs -f whitelist-sync`.
- Back up the Supabase project/database and `minecraft/data/` (world, Paper configuration, and manual whitelist entries). Do not edit `data/whitelist.json` while Paper is running.
- On restart, the worker reconciles all desired registrations. A `synced` record can therefore be restored after a world/container rebuild without manual RCON commands.
- To revoke a player, set their known database record to `desired_whitelisted=false`. The worker removes only that known username; it does not remove manual entries such as `kaikub`.

## Daily stats

- `pg_cron` runs `public.snapshot_stats_daily()` at 23:55 Bangkok (job `stats-daily`), one row per day in `public.stats_daily`. Enable the `pg_cron` extension once on the hosted project (Dashboard → Database → Extensions) before applying `20261017000002_stats_daily.sql`.
- Check it with `select * from cron.job_run_details order by start_time desc limit 5;`. A missed day is a gap, not an error; re-running the function for today is safe.
- `/admin/insights` reads `stats_daily`; its history begins on the first snapshot, and a missed day shows as a gap in the chart.

## Troubleshooting and recovery

| Symptom | Check and recovery |
| --- | --- |
| Registration stays pending/failed | Check `whitelist-sync` logs and its health; it retries automatically with capped backoff. Confirm the Minecraft service is healthy and RCON remains internal. |
| `SUPABASE_ERROR` in worker logs | Verify the URL and backend secret on the Minecraft host, Supabase availability, and RLS/migration state. Do not log or paste the secret. |
| `RCON_OFFLINE` or `RCON_TIMEOUT` | Check `minecraft` logs and Docker health, then restart the affected service. The durable Supabase row is retried after recovery. |
| Player cannot sign in | Confirm the Discord provider, Supabase Site URL, and allowed callback URL match the deployed HTTPS web URL exactly. |
| Registration attempts are unexpectedly limited | Check the caller's `registration_attempt_windows` row through the operator database access. The durable limit is five attempts per authenticated user in ten minutes; the IP limit additionally relies on the deployment proxy correctly setting `X-Forwarded-For`. |
| Need to roll back web deployment | Redeploy the last known-good web build; registration records remain safe in Supabase. Do not roll back the database migration without a reviewed data plan. |

## Secret incident response

If a Supabase backend key, Discord secret, or RCON password may have been exposed, rotate it immediately in its owning service, update only the relevant private environment, redeploy/restart that service, and review normal logs for accidental disclosure. RCON must never be forwarded publicly; only Minecraft TCP `25565` should be exposed.

## Roles and Chula verification

Roles live in `public.profiles.role` (`owner`, `admin`, `user`). Owners change roles from `/admin/users/<id>`. Promote an owner by SQL only to bootstrap, e.g. when the first owner's Discord account logged in after the profiles migration ran:

```sql
update public.profiles p set role = 'owner'
  from auth.identities i
  where i.user_id = p.user_id and i.provider = 'discord' and i.provider_id = '938769182210809866';
```

Accounts are created with Discord only, then verified by linking a `@chula.ac.th` / `@student.chula.ac.th` Google account on `/verify`. `SUPABASE_JWT_SECRET` and the old `NEXT_PUBLIC_CHULA_SSO_APP_ID` / `CHULA_SSO_APP_SECRET` are no longer used and can be removed from the deployment environment.

To let a player change their Chula account, use **Reset Chula link** on `/admin/users/<id>`. That removes the claim and the Google identity, and the player verifies again on their next visit.

### Switching from CU SSO to Google (deploy order)

1. Google Auth Platform: Audience **External**, **Publish app**. In Supabase, enable the Google provider and turn on **Allow manual linking**.
2. Apply `20260927000001_chula_google.sql` (additive only), then deploy the web app.
3. Supabase → Authentication → Hooks → **Before User Created** → `public.hook_only_discord_signups`. Immediately sign in with a brand-new Discord account to confirm Discord signups still work.
4. Apply `20260927000002_drop_cu_sso.sql`.

## Ops console, backups and restore

`/admin/ops` (owner/admin) shows every service the server-manager lists. The API is specified in `docs/ops-manager-contract.md`. Image update is owner-only and runs through the root-owned `chulacraft-update@<service-id>.service` unit (contract, "Updates"); check a failed update with `journalctl -u chulacraft-update@<service-id>`. Restore is never a button; do it by hand as below.

### Release order (ops console)

The new `/admin/ops` calls only the manager's `/services` and `/service/:id/*` (console WebSocket `/service/:id/console` included). The manager in production today serves only `/servers` and `/server/:id/*`, and `20261031000002_ops_console.sql` drops `admin_server_console_access`, which the deployed `/admin/server` still uses. The website has no `/servers` fallback, so release in this order:

1. Ship the server-manager that serves `/services` and `/service/:id/*` **and** keeps the `/servers` + `/server/:id/*` aliases (contract, "Aliases"). The deployed `/admin/server` keeps working. Check: `GET /services` lists every service.
2. Apply the Phase 7 migrations (`20261031000001` to `20261031000003`, and any later ones) and deploy the website in the same window. Between the two, `/admin/server` (old site, function dropped) or `/admin/ops` (new site, function missing) fails; keep the window short.
3. In a later manager release, after `/admin/ops` works in production, remove the aliases and note it in `docs/ops-manager-contract.md`.

### `OPS_HEALTH_TOKEN` (website health probe)

1. Generate one long random value: `openssl rand -base64 32`.
2. Website host: set `OPS_HEALTH_TOKEN` (server-only, never `NEXT_PUBLIC_`) and redeploy.
3. Bot host (`chulacraft-discord/.env`): set `OPS_HEALTH_TOKEN` to the same value, plus the site URL its status monitor already uses, then restart the bot container.
4. Check: `curl -s -H "Authorization: Bearer $OPS_HEALTH_TOKEN" https://<site>/api/ops/health` returns `{"ok":true,"db":"ok",...}`. Without the header it returns 401.
5. Rotate by changing both sides; the monitor shows the website down until they match.

### Restore a world backup

1. Pick the backup in `/admin/ops` (Backups, `target: world`, status `ok`) and note its file on the Minecraft host.
2. Tell players, then stop the server: `systemctl stop minecraft@survival` (or Stop in `/admin/ops`).
3. Move the current world aside, never delete it: `mv <world_dir> <world_dir>.broken-$(date +%F)`.
4. Extract the backup into `<world_dir>` and check ownership matches the Minecraft user.
5. Start the server, watch the log in `/admin/ops` until it reports Done, and join once to confirm. Keep `.broken-*` until the restore is confirmed good.
6. Whitelist: the worker reconciles on restart, so no manual RCON edits are needed.

### Restore a Supabase dump

1. Prefer restoring into a scratch project first: create it, then `psql "$SCRATCH_DB_URL" < dump.sql` (or `pg_restore` for custom-format dumps) and spot-check the tables you need.
2. For production, announce downtime, then take one more dump of the current database as the safety copy.
3. Restore with the same command against the production connection string. Review errors; extension and role "already exists" messages are normal.
4. Re-run any migration newer than the dump date (`npx supabase db push`), then load `/admin` and a public page to confirm.
5. Never run a restore from the website host with service-role keys in shell history; use a throwaway shell.

