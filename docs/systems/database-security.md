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
- Rate-limiters: [`unlock-rate-limit.ts`](../../src/lib/security/unlock-rate-limit.ts) (album-password unlock) + [`abuse-rate-limit.ts`](../../src/lib/security/abuse-rate-limit.ts) (guest write endpoints; cross-event breadth).

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
  `save_event`/`get_saved_events`/`get_my_uploads`/`remove_my_upload`, `claim_anonymous_uploads`, `restore_media`/`restore_event`/`purge_media_now`,
  `like_media`/`get_my_likes`/`get_event_like_counts`, `add_to_reel`.
  (`create_media_as_host` MOVED to service-role-only above when its size authority was hardened.) SECURITY
  DEFINER but `revoke … from public, anon` + `grant … to authenticated`; each authorizes internally via
  `auth.uid()` + ownership. They appear ONLY in 0029, **never 0028** — that split IS the security property.
  (`claim_anonymous_uploads(text[])` stamps `guests.user_id = auth.uid()` onto a browser's still-unclaimed
  anonymous uploads; authorized by the held `session_token` capabilities + the `user_id IS NULL` no-theft
  guard, so — unlike the anon WRITE RPCs above — there is no client-spoofable value to protect, and it stays
  browser-callable rather than server-mediated. → [guest-flow.md](guest-flow.md).) (`get_my_uploads(integer)`
  returns the user's OWN media across events — host + guest — reading event name/date for events they don't
  own, like `get_saved_events`; SECURITY DEFINER + `auth.uid()`, filter-ready, ≤200. → [host-app.md](host-app.md).)
  (`remove_my_upload(uuid)` soft-deletes one of those uploads, re-checking the SAME host-arm/guest-arm ownership;
  a guest's self-deletion is marked `removed_by_uploader=true` = private to the host. → [lifecycle-recovery.md](lifecycle-recovery.md).)
  (**Likes:** `like_media(uuid)` favorites a media the caller can SEE — host of its event, OR a guest of it, OR an
  OPEN album (a password/private PURE viewer who never joined as a guest can't like — an INTENTIONAL v1
  boundary, not a bug) — idempotent insert; `get_my_likes(integer)` is the cross-event "Likes" tab feed and RE-APPLIES that
  access predicate so a now-inaccessible like never leaks its presigned key; `get_event_like_counts(uuid)` is
  HOST-GATED (returns zero rows to a non-host) — the ONLY count path, so a like count NEVER reaches a guest
  (host-only counts, enforced at the data layer). Unlike + heart-state are owner-RLS straight from the browser.
  → [host-app.md](host-app.md).)
- **Service-role-only (must NEVER appear in either advisor list):** the 6 server-mediated write/password
  RPCs above, plus `purge_media_rows`, `record_link_hit`, `host_active_bytes`, and the trigger-only functions
  (`set_media_purge_at`, `set_event_purge_at`, `enforce_event_limit`, `handle_new_user`,
  `notify_gallery_change` [the gallery doorbell, Phase 3], …). If an unexpected one shows up, an over-broad
  grant slipped in. (`enforce_event_pro_gates` was DROPPED in S5 — see below.)
- **Realtime gotcha (the doorbell):** `realtime.send()` swallows its own insert failures into a WARNING by
  design, and `realtime.messages` has NO day-partitions until the Realtime service first activates (the first
  client channel subscription creates them). So on a project that has never had a realtime connection, a
  DB-trigger broadcast silently no-ops — verify with a real subscription, not just SQL. The doorbell trigger
  additionally wraps `realtime.send` in its own exception guard so a Realtime outage can never fail a media write.
- **Deny-all tables** = the accepted `rls_enabled_no_policy` INFO: `reports`, `sent_emails`,
  `newsletter_signups`, `unlock_attempts`, `action_attempts`, `contact_submissions`, `job_applications` (operator/service-role-only).
- **Leaked Password Protection (HaveIBeenPwned) is ENABLED** (2026-06-08) — that WARN is cleared. Supabase
  now rejects pwned ACCOUNT passwords at set/change; the account-security form surfaces the rejection via the
  `updateUser` error. It's an Auth feature → applies to `auth.users` passwords ONLY, not event passwords
  (those keep the 4-char min + the strength-meter guidance). No app change was needed.

## Invariants (don't break)

- **Host table writes are COLUMN-locked, not just row-locked.** RLS gates the ROW (ownership); Supabase's
  default grant gives `authenticated` UPDATE/INSERT/DELETE on EVERY column. So host-writable tables must
  `revoke insert,update,delete … from authenticated` (and `anon`) and re-grant ONLY the legit columns:
  - **`profiles`** — writable: `email`, `announcements_seen_at`, `welcomed_at`. Service-role only: `display_name` (Phase 1: the `authenticated` UPDATE grant was REVOKED so the public name can't be set unfiltered; written ONLY by `updateDisplayNameAction` via the admin client, after required + profanity + reserved checks), `tier`, `storage_*`, `is_admin`, `stripe_*`, `avatar_updated_at`, `password_set_at`.
  - **`media`** — UPDATE `status`, `removed_at` only (no insert/delete). `purge_at` is set by a BEFORE trigger (`set_media_purge_at`) WITHOUT a column grant — do NOT grant `update(purge_at)`. `removed_by_uploader` is likewise ungranted (set only by the owner-context `remove_my_upload` RPC — a guest's private self-deletion marker).
  - **`media_likes`** — owner-RLS (SELECT + DELETE where `auth.uid()=user_id`); INSERT/UPDATE are REVOKED at the table grant, so the ONLY write path is the access-checking `like_media` RPC. A raw browser insert would otherwise let a user "like" (and then, via `get_my_likes`, presign) media they can't see — the `saved_events` lesson (write through the RPC, never a raw insert).
  - **`reel_items`** — HOST-RLS (SELECT + DELETE scoped to the host's own event via ownership); INSERT/UPDATE REVOKED at the table grant, so the ONLY add path is the access-checked `add_to_reel` RPC (host-owned event + media `approved` + not removed). Un-reel is the host-RLS delete from the browser. Mirrors `media_likes` exactly but HOST-scoped, not owner-self (S5 Reel R1).
  - **`events`** — writable: `name`, `description`, `event_date`, `visibility`, `accepting_uploads`, `allow_anonymous_uploads`, `moderation_mode`, `qr_style`, `max_upload_bytes` (+ `insert(host_id)`, `update(deleted_at)`). RPC/trigger/default-only: `event_password_hash`, `custom_slug`, `qr_token`, `purge_at`.
- **Value-gates a bare grant can't express are triggers/CHECK:** the `events_password_requires_hash` CHECK
  (no `visibility='password'` without a hash) + `enforce_event_limit` (MAX_EVENTS, raises 23514). (The
  `enforce_event_pro_gates` trigger that gated `allow_anonymous_uploads` was DROPPED in S5 — require-accounts
  is now FREE for any tier + default-on; password + custom_slug stay Pro-gated via their own
  `set_event_password`/`set_event_slug` RPCs, not a table trigger.)
- **Never expose raw R2 keys/URLs to the browser** — presign server-side (ADR-0003). → [uploads-and-r2.md](uploads-and-r2.md).
- **The Stripe webhook is the SOLE writer of `tier`/`storage_cap_bytes`** — never trust the client for entitlements. → [billing-caps.md](billing-caps.md).
- **The service-role / secret key is server-only** (behind `import "server-only"`); never `NEXT_PUBLIC_`.
- **Events have no end date** — deletion is the only lifecycle exit (the anti-abuse core).

## Gotchas (why it's like this — don't revert)

- **A column-level `revoke update(col)` is a SILENT NO-OP while a TABLE-level grant stands** (the root
  cause of the `events` Pro-bypass CVE: the earlier `set_event_password`/`set_event_slug` column-revokes
  did nothing because the table grant was never revoked, so a free host could PATCH
  `event_password_hash`/`custom_slug` (and, before S5 un-gated it, `allow_anonymous_uploads`) to steal Pro
  features). You MUST
  `revoke insert,update,delete … from authenticated` at the TABLE level FIRST, then `grant (cols)`. Verify
  with `has_column_privilege`, then re-run `get_advisors`. (ADR-0014; fixed in `…163011_lock_down_events_write_grant`.)
- **RPCs created via the Supabase MCP `apply_migration` inherit a default privilege that GRANTS EXECUTE to
  `anon`.** A bare `revoke … from public` does NOT remove it (it bit the slug RPCs). Any host-only RPC
  created via the MCP must explicitly `revoke execute … from anon`; always re-run `get_advisors` to confirm anon vs authenticated placement.
- **Postgres integer literals are int4**, so `2 * 1024 * 1024 * 1024` (2 GB) overflows int4 even when
  assigned to a `bigint` constant, during DECLARE init before the body runs. Force `2::bigint * 1024 * 1024 * 1024`.
- ★ **A NEW junction table silently breaks PostgREST embeds between the two tables it links (PGRST201).** A
  table with FKs to two tables that ALREADY have a relationship (esp. with a composite PK of exactly those two
  FKs, like `reel_items(event_id, media_id)`) makes PostgREST infer an extra many-to-many between them — so any
  existing query embedding one from the other via a bare `tableB!inner(...)` becomes AMBIGUOUS and throws (a
  runtime PostgREST resolution error — typecheck/lint/build do NOT catch it). This took `/dashboard` + the
  admin views + the purge cron DOWN ~2h after `reel_items` shipped (latent until a page hit such an embed).
  **Always PIN cross-table embeds to the FK constraint:** `events!media_event_id_fkey!inner(...)`, never
  `events!inner(...)`. The embedded resource keeps its table name (`events`), so `.eq("events.col", …)` filters
  are unchanged. When adding ANY table with two FKs, grep the codebase for embeds between those tables. (Fixed
  `184bcb1`; verify a hinted embed against live PostgREST — a green build proves nothing here.)
- **Upload size-spoof (closed, ADR-0014):** `create_media`/`_as_host` once trusted the CLIENT
  `file_size_bytes` (PUT-big-claim-tiny beat the cap). The real size is now re-derived from an R2 HEAD at
  complete (`headObjectSize`, [`../../src/lib/r2/presign.ts`](../../src/lib/r2/presign.ts)); the client value is advisory. → [uploads-and-r2.md](uploads-and-r2.md).
- **Rate limits must be ABUSE-focused, NOT volume-focused — an event concentrates guests behind ONE venue/
  CGNAT IP**, so a naive per-IP volume cap 429s a *crowd*. Two venue-safe limiters: the album-password unlock
  (count failures + clear-on-success, deny-all `unlock_attempts`), and the **abuse-focused limiter** for the
  server-mediated guest writes (`create_guest`/`create_report`/`capture-email`) — deny-all `action_attempts`
  + the `action_rate` RPC, keyed on cross-event BREADTH (one IP touching many DISTINCT events = a scraper; a
  venue is ONE event → never trips) + a high per-(IP,event) backstop ([`abuse-rate-limit.ts`](../../src/lib/security/abuse-rate-limit.ts)).
  Raw volumetric DoS is the Vercel edge firewall's job (a launch task). The OTP "Enter event" path is still
  PER-IP (Supabase Auth) — venue-OTP volume is a launch consideration.

## Workflow (every schema change)

1. Write the migration (the CLI isn't installed locally → apply via the **Supabase MCP** `apply_migration`;
   keep the repo file = applied version). 2. Run `get_advisors` and confirm the expected set above (esp.
   anon vs authenticated placement of any new RPC). 3. Regenerate `types.ts`. 4. Add a rolled-back
   Supabase-MCP RPC contract check (run the RPCs inside a `DO $$ … RAISE EXCEPTION $$` block so nothing persists).

## See also

[ADR-0001](../adr/0001-supabase-native-data-layer.md) (data layer) · [ADR-0004](../adr/0004-anonymous-guests-capability-tokens.md) (capability tokens) · [ADR-0014](../adr/0014-data-layer-security-posture.md) (the white-hat hardening) · [auth-accounts.md](auth-accounts.md) · [uploads-and-r2.md](uploads-and-r2.md) · [billing-caps.md](billing-caps.md).
