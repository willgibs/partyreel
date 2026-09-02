-- ============================================================================
-- Self-serve account deletion (the lp/account-deletion track).
--
-- ADDITIVE-ONLY, and deliberately TINY: one nullable column plus its partial
-- index. Nothing main's deployed code reads is narrowed or reshaped, so this is
-- safe to apply while other branches are unmerged.
--
-- ── THE MODEL (Will's rulings, 2026-09-02) ──────────────────────────────────
--   * IMMEDIATE, NO UNDO. The request cancels any active Stripe subscription,
--     soft-deletes every hosted event into the existing 30-day bin, anonymises
--     the profile, signs the host out, and stamps deletion_requested_at.
--   * The daily purge cron's sweepDeletedAccounts (src/lib/lifecycle/
--     account-deletion.ts) then hard-deletes R2-FIRST and, at ZERO remaining
--     events, deletes the auth.users row. Deleting that row cascades
--     profiles -> events -> media, which is exactly why it must come LAST: the
--     cascade would otherwise destroy the original_key/preview_key rows the R2
--     delete still needs and leave permanent orphans.
--   * A HELD account (a forensic hold on ANY of its own events, ADR-0020) is
--     anonymised at once and finishes deleting when the hold lifts. The sweep
--     skips a held event WHOLE (the FK cascade is all-or-nothing) and therefore
--     never reaches zero events, so the auth user survives with it.
--
-- ── WHY THERE IS NO NEW RPC ─────────────────────────────────────────────────
-- Everything the request path and the sweep need already exists at the SQL
-- boundary: purge_media_rows (service-role-only; refuses held ids) does the
-- atomic R2-then-row reclaim and the storage_used_bytes decrement, and the
-- set_event_purge_at BEFORE trigger derives purge_at on the soft-delete. Adding
-- a SECURITY DEFINER wrapper would only re-implement those with a new grant
-- surface to get wrong, so the app drives them through the service-role admin
-- client instead. If a future change DOES add one here: SECURITY DEFINER, the
-- caller re-verified inside, `revoke execute ... from public, anon` first
-- (the MCP's default privilege grants anon EXECUTE), and NEVER an anon grant.
--
-- ── THE COLUMN IS SERVICE-ROLE-WRITE-ONLY BY CONSTRUCTION ───────────────────
-- profiles writes are TABLE-revoked with a column re-grant allowlist
-- (20260602's lockdown; the allowlist is announcements_seen_at + welcomed_at).
-- A new column is therefore fail-closed: `authenticated` cannot write it, so
-- there is no un-request path via a direct PostgREST PATCH and no trigger is
-- needed to refuse one. ★ DO NOT add deletion_requested_at to that grant.
-- Reads are fine: profiles SELECT is own-row RLS, so a host can see their own
-- pending state and nobody else's.
--
-- ── WHAT SURVIVES A DELETION, BY DESIGN ─────────────────────────────────────
--   * guests.user_id is `on delete set null`, and media.guest_id likewise, so
--     this account's uploads to OTHER hosts' events stay in those albums,
--     unlinked. That is the promise the privacy policy and the help article
--     make, and it is enforced by the FK, not by app code.
--   * upload_forensics denormalises the uploader identity at upload time and
--     has no FK to profiles (ADR-0020), so a lawful-process record survives the
--     account it describes. A hold on media in SOMEONE ELSE'S event therefore
--     needs no special case here: that media is not this account's to delete.
--   * Billing rows in Stripe are untouched beyond the cancellation; Stripe's own
--     retention is the record of the payments.
--
-- ── EXPECTED get_advisors DELTA: NONE ───────────────────────────────────────
-- No new function, table or policy. lint 0028 stays at the five anon capability
-- RPCs, 0029 unchanged, the service-role-only set unchanged, and no new
-- rls_enabled_no_policy INFO (profiles already has policies).
--
-- ── ROLLED-BACK CONTRACT CHECK (run via MCP execute_sql AFTER apply; the
--    trailing RAISE aborts the tx so nothing persists; rides EXISTING rows) ──
--
--   do $$
--   declare
--     v_host uuid;
--     v_can_write boolean;
--   begin
--     select id into v_host from public.profiles limit 1;
--     if v_host is null then raise exception 'need one existing profile'; end if;
--
--     -- 1. the column exists, is nullable, and starts null.
--     if (select deletion_requested_at from public.profiles where id = v_host)
--        is not null
--       then raise exception 'unexpected pre-existing deletion stamp'; end if;
--
--     -- 2. ★ it is NOT writable by `authenticated` (the column-lock invariant).
--     v_can_write := has_column_privilege('authenticated', 'public.profiles',
--                                         'deletion_requested_at', 'UPDATE');
--     if v_can_write then
--       raise exception 'deletion_requested_at is client-writable: the column '
--                       'grant allowlist leaked';
--     end if;
--
--     -- 3. the service role can stamp it, and the partial index is usable.
--     update public.profiles set deletion_requested_at = now() where id = v_host;
--     if not exists (select 1 from public.profiles
--                    where id = v_host and deletion_requested_at is not null)
--       then raise exception 'stamp did not land'; end if;
--     if not exists (select 1 from pg_indexes
--                    where schemaname = 'public'
--                      and indexname = 'profiles_deletion_requested_at_idx')
--       then raise exception 'sweep index missing'; end if;
--
--     raise exception 'ROLLBACK_OK';
--   end $$;
--
-- ============================================================================

-- ─── profiles.deletion_requested_at ─────────────────────────────────────────
-- The queue marker AND the "this account is on its way out" flag. Nullable, no
-- default: adding it is metadata-only (no table rewrite). It is set once and
-- never cleared - there is no undo by ruling, so nothing in the app writes null
-- back over a non-null value.
alter table public.profiles add column deletion_requested_at timestamptz;

comment on column public.profiles.deletion_requested_at is
  'When the account holder (or an operator on their behalf) asked for deletion. Set once, never '
  'cleared: deletion is immediate and has no undo (Will, 2026-09-02). Non-null means the profile is '
  'already anonymised, any subscription is cancelled, every hosted event is soft-deleted, and the '
  'auth user is banned from signing in; sweepDeletedAccounts then hard-deletes R2-first and removes '
  'the auth.users row once the account has ZERO events left (a forensic hold on one of its events '
  'holds the whole account open until the hold lifts, ADR-0020). SERVICE-ROLE WRITE ONLY by '
  'construction - profiles writes are table-revoked with a column allowlist, and this column is '
  'deliberately NOT in it, so there is no client un-request path.';

-- The sweep's candidate scan is "the few rows where this is set", so a PARTIAL
-- index keeps it a tiny index that costs nothing on the overwhelming majority
-- of profile writes (the predicate matches the sweep's WHERE exactly).
create index profiles_deletion_requested_at_idx
  on public.profiles (deletion_requested_at)
  where deletion_requested_at is not null;
