# Import Dependency Graph

```
proxy.ts → lib/supabase/middleware → lib/env, lib/bounded-fetch

app/page.tsx → components/{auth-button, icons, site-footer, site-header, server-address-card}
                → lib/site-links

app/about/page.tsx → components/{icons, site-footer, site-header}

app/register/page.tsx → components/{brand, site-header, site-footer, discord-auth, cusso-auth}
                       → lib/supabase/server

app/welcome/page.tsx → components/{brand, server-address-card, site-header}      (post-sign-in onboarding checklist)
app/dashboard/page.tsx → components/{brand, registration-panel, site-header}    (profile + Minecraft accounts)
                      → lib/{registration, supabase/server}

app/admin/layout.tsx → components/site-header, lib/supabase/server             (role gate: owner/admin)
app/admin/page.tsx → lib/supabase/server                                        (player search)
app/admin/users/[id]/page.tsx → lib/supabase/server, ./actions                 (player detail)
app/admin/users/[id]/actions.ts → lib/supabase/server                          (server actions → admin RPCs)

app/not-found.tsx → components/brand

app/layout.tsx → lib/fonts

app/auth/callback/route.ts → lib/{env, bounded-fetch, auth-error}
app/auth/cusso/start/route.ts → lib/{env, cusso/client}
app/auth/cucallback/route.ts → lib/{env, bounded-fetch, auth-error(type), supabase/server, cusso/server}
app/auth/error/page.tsx → components/brand, lib/auth-error

app/api/registration/minecraft/route.ts → lib/{supabase/server, registration}

components/site-header → components/{brand, icons, sign-out-button}, lib/{site-links, supabase/server}
components/auth-button → components/icons, lib/supabase/client
components/discord-auth → components/icons, lib/supabase/client
components/sign-out-button → lib/supabase/client
components/cusso-auth → components/icons                                        (links to /auth/cusso/start)
components/registration-panel → components/icons, lib/registration, app/register/register.module.css (cross-tree CSS import)

lib/supabase/server.ts → lib/{env, bounded-fetch}                               (createClient + createAdminClient)
lib/supabase/client.ts → lib/env
lib/supabase/middleware.ts → lib/{env, bounded-fetch}
lib/cusso/client.ts → lib/env
lib/cusso/server.ts → lib/env
```

Leaf modules with no local deps: `lib/env`, `lib/bounded-fetch`, `lib/fonts`, `lib/site-links`, `lib/auth-error`, `lib/registration`, `components/icons`, `components/brand`.

Admin CSS: `app/admin/admin.module.css` is shared by the layout, the search page, and `users/[id]/page.tsx`.

Notable coupling: `components/registration-panel.tsx` imports CSS from `app/register/register.module.css` — component reaching into a route's styles rather than owning its own.

## Database RPCs called from the app

| Caller | RPC / table |
|---|---|
| `api/registration/minecraft` | `consume_registration_attempt`, `add_minecraft_account` (POST), `change_minecraft_account` (PATCH), `minecraft_registrations` (GET) |
| `welcome/page` | `minecraft_registrations`, `cu_sso_identities` (own rows via RLS) |
| `dashboard/page` | `minecraft_registrations`, `cu_sso_identities`, `profiles` (own rows via RLS) |
| `auth/cucallback` | `link_cu_sso` + `cu_sso_identities` lookup (service key via `createAdminClient`) |
| `admin/*` | `current_app_role`, `admin_search_users`, `admin_get_user`, `admin_set_whitelisted`, `admin_set_role` |

_Generated 2026-09-23. Regenerate by grepping local `import ... from "@/` / relative imports under `src/` if the structure drifts._
