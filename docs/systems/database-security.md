# Database & security model

> ROLE: the data-layer security model + the DB workflow every schema change follows.
> BELONGS HERE: RLS shapes, the capability-token RPC inventory, the advisor 0028/0029 split + expected set, the column-grant lockdown pattern + its lessons, the migrations workflow, rate-limiting. · NOT HERE: a single feature's own RPC details (→ that feature's doc), why-decisions (→ `../adr/0001`, `0004`, `0014`).
> GROWS BY: integrate-in-place.

## What it does

**RLS is the security boundary.** The proxy ([`../../src/proxy.ts`](../../src/proxy.ts)) only refreshes
cookies, it does **not** authorize. Every Server Function / route handler re-verifies authz with
`getUser()` (→ [auth-accounts.md](auth-accounts.md)) AND relies on RLS policies / SECURITY DEFINER RPCs
at the DB. Anonymous guests have no JWT: they authorize via **capability tokens** validated INSIDE
SECURITY DEFINER RPCs (ADR-0004); `anon` never gets direct table access. Privileged writes go through the
service-role admin client (`server-only`).

## Where it lives

- Schema = Supabase-native SQL migrations + RLS + generated types (ADR-0001) in [`../../supabase/migrations/`](../../supabase/migrations).
- Clients: [`../../src/lib/supabase/`](../../src/lib/supabase) — `client` (browser/anon), `server`
  (RSC/route handlers, async), `middleware` (proxy refresh), `admin` (service-role, `server-only`, bypasses RLS).
- Data access only via [`../../src/lib/db/`](../../src/lib/db) (queries/mutations) — never inline SQL in components.
- Generated types: [`../../src/lib/db/types.ts`](../../src/lib/db/types.ts) — **do not hand-edit** (`.prettierignore`d so regen stays churn-free).
- Unlock rate-limiter: [`../../src/lib/security/unlock-rate-limit.ts`](../../src/lib/security/unlock-rate-limit.ts).

## The advisor model (`get_advisors` — run after EVERY schema change)

The expected, accepted set:

- **3 anon capability RPCs (lint `0028`, SECURITY DEFINER, executable by `anon` — by design, DO NOT
  revoke), READS ONLY:** `get_event_by_qr_token`, `get_event_media_by_qr_token`, `get_upload_context`. The
  opaque token IS the authorization (ADR-0004); these only READ visibility-gated event/media state, so anon
  EXECUTE is safe. (Was 8 — the five guest WRITE/password RPCs were server-mediated 2026-06-08; see below.
  `get_public_album` was DROPPED in the one-link consolidation, ADR-0010.)
- **★ Server-mediated write/password RPCs (service-role-only — in NEITHER 0028 nor 0029):** `create_media`,
  `create_media_as_host`, `create_guest`, `verify_event_password`, `create_report`, `capture_guest_email`.
  A 2026-06-08 live pentest proved anon EXECUTE on these was directly PostgREST-callable, BYPASSING every
  route-level guard (the ADR-0014 R2-HEAD size authority, the unlock rate-limiter) → cap-evasion cost-bomb
  (H1) + an unthrottled password oracle (H2) + spam/victim-email poisoning (H3). FIX (ADR-0016): `revoke
  execute … from public, anon, authenticated`; the Next routes invoke them via the **service-role admin
  client** with **server-derived trusted values** (R2-HEAD size; `getUser()` user_id/host_id; the verified
  email read from `auth.users`, never the client). THE LESSON: enforce at the boundary the attacker actually
  reaches — an anon RPC grant IS the attack surface, not the route wrapping it.
- **Authenticated-only RPCs (lint `0029`):** the host/account RPCs — `get_host_upload_context`,
  `set_event_password`/`clear_event_password`, `set_event_slug`/`clear_event_slug`,
  `check_slug_available`, `has_password`/`verify_current_password`/`mark_password_set`,
  `save_event`/`get_saved_events`, `restore_media`/`restore_event`/`purge_media_now`. (`create_media_as_host`
  MOVED to service-role-only above when its size authority was hardened.) SECURITY DEFINER but
  `revoke … from public, anon` + `grant … to authenticated`; each authorizes internally via `auth.uid()` +
  ownership. They appear ONLY in 0029, **never 0028** — that split IS the security property.
- **Service-role-only (must NEVER appear in either advisor list):** the 6 server-mediated write/password
  RPCs above, plus `purge_media_rows`, `record_link_hit`, `host_active_bytes`, and the trigger-only functions
  (`set_media_purge_at`, `set_event_purge_at`, `enforce_event_limit`, `enforce_event_pro_gates`, `handle_new_user`,
  …). If an unexpected one shows up, an over-broad grant slipped in.
- **Deny-all tables** = the accepted `rls_enabled_no_policy` INFO: `reports`, `sent_emails`,
  `newsletter_signups`, `unlock_attempts`, `contact_submissions`, `job_applications` (operator/service-role-only).
- **The "Leaked Password Protection Disabled" WARN is now ACTIONABLE** (post-ADR-0011 account passwords) —
  enable HaveIBeenPwned in the Supabase dashboard (a launch task; Pro-gated).

## Invariants (don't break)

- **Host table writes are COLUMN-locked, not just row-locked.** RLS gates the ROW (ownership); Supabase's
  default grant gives `authenticated` UPDATE/INSERT/DELETE on EVERY column. So host-writable tables must
  `revoke insert,update,delete … from authenticated` (and `anon`) and re-grant ONLY the legit columns:
  - **`profiles`** — writable: `email`, `announcements_seen_at`, `welcomed_at`. Service-role only: `display_name` (Phase 1: the `authenticated` UPDATE grant was REVOKED so the public name can't be set unfiltered; written ONLY by `updateDisplayNameAction` via the admin client, after required + profanity + reserved checks), `tier`, `storage_*`, `is_admin`, `stripe_*`, `avatar_updated_at`, `password_set_at`.
  - **`media`** — UPDATE `status`, `removed_at` only (no insert/delete). `purge_at` is set by a BEFORE trigger (`set_media_purge_at`) WITHOUT a column grant — do NOT grant `update(purge_at)`.
  - **`events`** — writable: `name`, `description`, `event_date`, `visibility`, `accepting_uploads`, `allow_anonymous_uploads`, `moderation_mode`, `qr_style`, `max_upload_bytes` (+ `insert(host_id)`, `update(deleted_at)`). RPC/trigger/default-only: `event_password_hash`, `custom_slug`, `qr_token`, `purge_at`.
- **Value-gates a bare grant can't express are triggers/CHECK:** `enforce_event_pro_gates` (the
  `allow_anonymous_uploads` Pro gate — raises 42501 when a Free host tries to turn anonymous uploads OFF),
  the `events_password_requires_hash` CHECK (no
  `visibility='password'` without a hash), `enforce_event_limit` (MAX_EVENTS, raises 23514).
- **Never expose raw R2 keys/URLs to the browser** — presign server-side (ADR-0003). → [uploads-and-r2.md](uploads-and-r2.md).
- **The Stripe webhook is the SOLE writer of `tier`/`storage_cap_bytes`** — never trust the client for entitlements. → [billing-caps.md](billing-caps.md).
- **The service-role / secret key is server-only** (behind `import "server-only"`); never `NEXT_PUBLIC_`.
- **Events have no end date** — deletion is the only lifecycle exit (the anti-abuse core).

## Gotchas (why it's like this — don't revert)

- **A column-level `revoke update(col)` is a SILENT NO-OP while a TABLE-level grant stands** (the root
  cause of the `events` Pro-bypass CVE: the earlier `set_event_password`/`set_event_slug` column-revokes
  did nothing because the table grant was never revoked, so a free host could PATCH
  `event_password_hash`/`custom_slug`/`allow_anonymous_uploads` to steal Pro features). You MUST
  `revoke insert,update,delete … from authenticated` at the TABLE level FIRST, then `grant (cols)`. Verify
  with `has_column_privilege`, then re-run `get_advisors`. (ADR-0014; fixed in `…163011_lock_down_events_write_grant`.)
- **RPCs created via the Supabase MCP `apply_migration` inherit a default privilege that GRANTS EXECUTE to
  `anon`.** A bare `revoke … from public` does NOT remove it (it bit the slug RPCs). Any host-only RPC
  created via the MCP must explicitly `revoke execute … from anon`; always re-run `get_advisors` to confirm anon vs authenticated placement.
- **Postgres integer literals are int4**, so `2 * 1024 * 1024 * 1024` (2 GB) overflows int4 even when
  assigned to a `bigint` constant, during DECLARE init before the body runs. Force `2::bigint * 1024 * 1024 * 1024`.
- **Upload size-spoof (closed, ADR-0014):** `create_media`/`_as_host` once trusted the CLIENT
  `file_size_bytes` (PUT-big-claim-tiny beat the cap). The real size is now re-derived from an R2 HEAD at
  complete (`headObjectSize`, [`../../src/lib/r2/presign.ts`](../../src/lib/r2/presign.ts)); the client value is advisory. → [uploads-and-r2.md](uploads-and-r2.md).
- **Auth rate limits are PER-IP, and an event concentrates guests behind ONE venue/CGNAT IP** — so the OTP
  account-required ("Enter event") path can 429 a *crowd*. The album-password unlock has a venue-NAT-aware rate-limiter
  (count failures + clear-on-success, deny-all `unlock_attempts`). Deferred: per-IP limits on `create_report` + the presign routes.

## Workflow (every schema change)

1. Write the migration (the CLI isn't installed locally → apply via the **Supabase MCP** `apply_migration`;
   keep the repo file = applied version). 2. Run `get_advisors` and confirm the expected set above (esp.
   anon vs authenticated placement of any new RPC). 3. Regenerate `types.ts`. 4. Add a rolled-back
   Supabase-MCP RPC contract check (run the RPCs inside a `DO $$ … RAISE EXCEPTION $$` block so nothing persists).

## See also

[ADR-0001](../adr/0001-supabase-native-data-layer.md) (data layer) · [ADR-0004](../adr/0004-anonymous-guests-capability-tokens.md) (capability tokens) · [ADR-0014](../adr/0014-data-layer-security-posture.md) (the white-hat hardening) · [auth-accounts.md](auth-accounts.md) · [uploads-and-r2.md](uploads-and-r2.md) · [billing-caps.md](billing-caps.md).
