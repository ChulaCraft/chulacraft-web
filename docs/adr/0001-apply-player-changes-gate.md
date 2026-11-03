# ADR 0001: admin_apply_player_changes is security definer, with a staff-area gate

Status: accepted (T3.5)

## Context

`admin_apply_player_changes(p_user_id, p_changes)` applies a staged player review in
one transaction. Design decision D1 called for security invoker, so every step would
run with the caller's own rights.

## Decisions

1. **Security definer (deviation from D1).** The ownership check added in
   `20261101000005` reads `bans` and `minecraft_registrations`, which are RLS-protected
   and unreadable to an invoker. The function therefore runs as definer with
   `search_path = ''`. Each step is still an existing `admin_*` RPC, so its own gate
   and `log_account_change` calls apply; any failure aborts the whole call. Grants:
   revoked from `public` and `anon`, granted to `authenticated`.
2. **Outer gate.** `20261102000001` replaces the owner/admin check with
   `staff_can('moderation') or staff_can('community') or staff_can('admin')`.
   The earlier gate refused moderators (ban, lift_ban) and event staff (banner) even
   though the inner RPCs allow them and the player editor shows those controls. The
   outer gate only rejects callers who could never succeed; the inner gate decides
   each step (a moderator staging `guest` is still refused with `FORBIDDEN`).
3. **Lifting a ban can roll back the whole review.** `lift_ban` restores the
   registrations the ban turned off. If restoring them would put the player over the
   5-account limit, the inner RPC raises `LIMIT_REACHED`, and because the call is one
   transaction every other staged change in the same review is rolled back too, not
   only the lift. The editor shows the error and nothing is saved; staff must free an
   account slot first, or apply the other changes without the lift.
4. **Inner gate vs ownership checks (left as is).** The ownership checks still run
   before each inner RPC's own gate. Running the inner gate first would need a new
   migration and is not required, so it is not done.

## Consequences

Any future step kind must be backed by an inner RPC that checks its own area, because
the outer gate is deliberately broad. Covered by `supabase/tests/admin_exports_and_apply.test.sql`.
