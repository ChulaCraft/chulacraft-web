# ChulaCraft developer docs

Start here. These docs describe how the system fits together; the code and
migrations are still the final word, and each section names the file to check.

| Doc | What's in it |
| --- | --- |
| [api.md](api.md) | HTTP endpoints, server actions, pages, and the RPCs the browser may call |
| [database.md](database.md) | Every table, who may read/write it, key rules, and how other services use it |

## System at a glance

```
 Browser ──► Next.js (Vercel, stateless) ──► Supabase Postgres (all state)
                                                   ▲        ▲
              chulacraft-whitelist-worker ─────────┘        │   (Minecraft host: applies whitelist via RCON)
              chulacraft-discord ───────────────────────────┘   (roles, announcements, status monitor)
              chulacraft-server-manager ◄── signed JWT from /admin/server
```

- **The web app holds no state.** Sessions live in Supabase auth cookies; everything else is in Postgres.
- **The database is the shared contract.** Several services read and write it with the service-role key.
  Change a table and you may break a service that isn't in this repo; see
  [database.md → Other services](database.md#other-services-that-use-this-database).
- **All writes go through RPCs** (`security definer` Postgres functions). Players never write tables directly.

## Rules every change must keep

1. **Never delete rows to "fix" data.** Removals are soft (`is_active = false`, `lifted_at`, `deleted_at`, …) so history stays traceable.
2. **Every account-affecting write is logged** with `log_account_change(...)` into `account_change_log` (shown at `/admin/audit`).
3. **New functions are not callable by players by default.** Grant `execute` explicitly and add the function
   to the allowlist in `supabase/tests/default_function_privileges.test.sql`.
4. **Add columns, don't rename or drop them** — other services select columns by name.
5. **Schema changes are migrations only:** add a file in `supabase/migrations/`, never edit an applied one.

## Everyday commands

```bash
npm run dev                  # web app on http://localhost:3000 (needs local Supabase)
npx supabase start           # local Supabase in Docker
npx supabase db push         # apply new migrations to production (project is linked)
npm run db:types             # regenerate src/lib/supabase/database.types.ts after a migration
npm test                     # Vitest unit tests
npm run lint
```

Database tests (pgTAP) live in `supabase/tests/`; run them with `npx supabase test db`.

## Environment variables

See `.env.example`. `SUPABASE_SECRET_KEY` (service role) and `MCSV_JWT_PRIVATE_KEY` are server-only;
never expose them with a `NEXT_PUBLIC_` prefix.

## Keeping these docs true

Update the matching doc in the same PR as the change. To check the database section against reality:

```bash
npx supabase db dump --local --schema public -f /tmp/schema.sql   # full live schema
```
