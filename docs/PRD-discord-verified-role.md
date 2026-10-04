# PRD: Auto-assign Discord `verified` role

Status: draft, pending approval · 2026-10-04 · Spec: `.omc/specs/deep-interview-discord-verified-role.md`

## 1. Problem
Players register and verify on the website, and Java whitelisting already happens automatically. The Discord `verified` role is still granted by hand.

## 2. Goal
Every player verified on the website (Chula Google claim or admin-marked guest) gets the `verified` role in the ChulaCraft Discord server automatically, within ~30 s, with no manual step.

## 3. Scope
**In:** chulacraft-discord bot role sync; one Supabase migration in chulacraft-web.
**Out:** Bedrock support; role removal; website UI changes; whitelist worker changes.

## 4. User stories
1. As a member already in Discord, after I verify on the website I get `verified` without asking an admin.
2. As a verified player joining Discord for the first time, I get `verified` right after joining.
3. As an admin, every already-verified player gets the role when this ships, without manual work.

## 5. Design

```
guildMemberAdd ───────────┐
Realtime: chula_claims    ├─► queue (Set) ──30 s──► RPC verified_discord_ids(ids) ──► roles.add (missing only)
  INSERT                  │     (timer starts on first item; empty → nothing runs)
Realtime: profiles UPDATE ┘
startup / Realtime resubscribe ─► full sweep: RPC(all) ∩ guild members
```

### 5.1 Database (chulacraft-web, new migration)
- `alter publication supabase_realtime add table public.chula_claims, public.profiles;`
- `public.verified_discord_ids(p_discord_ids text[] default null, p_user_ids uuid[] default null) returns setof text`
  - Returns Discord IDs of verified players (`is_player_verified`), restricted to the given Discord IDs or user IDs; both null → all.
  - Discord ID: `chula_claims.discord_id`, else `auth.identities.provider_id` where `provider='discord'`.
  - `security definer`, `search_path=''`, execute granted to `service_role` only.

### 5.2 Bot (chulacraft-discord)
- New module `src/verified-role.js`; wired from `src/bot.js`.
- Intents: add `GatewayIntentBits.GuildMembers` (enable **Server Members Intent** in the Developer Portal).
- New dependency: `@supabase/supabase-js` (Realtime + RPC).
- Config: env `SUPABASE_URL`, `SUPABASE_SECRET_KEY`; `VERIFIED_ROLE_ID` in the JSON db config next to existing IDs.
- Queue: holds Discord IDs (from joins / `chula_claims`) and user IDs (from `profiles` updates). First item arms a 30 s timer; on fire, drain the queue, make one RPC call, then add the role to each returned member who lacks it. No timer while the queue is empty.
- Full sweep on `ready` and on each Realtime `SUBSCRIBED` (covers backfill and events missed while disconnected): `guild.members.fetch()` → RPC(all) → intersect → add missing roles.
- Errors (missing member, hierarchy, 429) are logged per member; the bot never crashes on them.

### 5.3 Discord server setup
- Bot role must sit **above** `verified` and have **Manage Roles**.

## 6. Acceptance criteria
1. In-guild member completes Chula verification → `verified` within ~35 s.
2. Admin marks member as guest → `verified` within ~35 s.
3. Verified player joins the guild → `verified` within ~35 s.
4. Unverified member joins → no role, no error.
5. Bot startup grants `verified` to every verified player currently in the guild.
6. Multiple events inside one window → one RPC call.
7. Idle → zero RPC calls.
8. Members already holding the role → no `roles.add`.
9. A failed role add is logged and the bot keeps running.

## 7. Tests
- Bot unit test (existing `test/` style): fake timers + stubbed RPC/guild — batching (6), idle (7), skip-existing (8), error (9).
- SQL test script: `verified_discord_ids` returns Chula + guest IDs and omits unverified ones; non-service role → permission denied.
- Manual: verify a test account on staging → role appears.

## 8. Rollout
1. Apply the migration (additive; safe with the current app).
2. ✅ Done (2026-10-04): Server Members Intent enabled; bot role above `verified`. ⏳ Owner still to do: grant the bot **Manage Roles** (until then `roles.add` fails with 50013, which is logged per member; no crash).
3. Set env and `VERIFIED_ROLE_ID` (owner will do this later; until then the bot must start with the feature disabled and log a warning, not crash); deploy the bot → startup sweep performs the backfill.
4. Check bot logs for the sweep count.

Rollback: redeploy the previous bot. The publication and RPC are harmless if left in place.

## 9. Risks
- Realtime events missed during a disconnect → covered by the sweep on resubscribe.
- `profiles` UPDATE events fire on any profile edit → a few extra (batched) RPC calls; acceptable.
- Service-role key on the bot host → accepted; the host is trusted.
