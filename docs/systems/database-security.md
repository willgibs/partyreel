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
- Rate-limiters: [`unlock-rate-limit.ts`](../../src/lib/security/unlock-rate-limit.ts) (album-password unlock) + [`abuse-rate-limit.ts`](../../src/lib/security/abuse-rate-limit.ts) (guest write endpoints; cross-event breadth) + [`public-form-limit.ts`](../../src/lib/security/public-form-limit.ts) (the marketing forms; the ONE that fails closed).

## The advisor model (`get_advisors` — run after EVERY schema change)

The expected, accepted set:

- **5 anon capability RPCs (lint `0028`, SECURITY DEFINER, executable by `anon` — by design, DO NOT
  revoke), READS ONLY:** `get_event_by_qr_token`, `get_event_media_by_qr_token`, `get_upload_context`,
  `get_public_profile`, `get_event_reel_by_qr_token`. The opaque token IS the authorization for the
  qr-keyed ones (ADR-0004); these only
  READ visibility-gated event/media state, so anon EXECUTE is safe. `get_event_reel_by_qr_token` (the 5th,
  R3 guest surfacing, `20260730120000`) returns the published reel for an OPEN event only
  (`guest_visible=true` internally; unpublished/empty/gated ⇒ zero rows — no publish-state oracle): its
  **RETURNS TABLE IS the allow-list** (8 keys, pinned key-for-key by
  [`guest-reel-contract.test.ts`](../../src/lib/reel/guest-reel-contract.test.ts) against the generated
  type — render internals/timestamps/tier can NEVER ride it), length comes back tier-DERIVED via
  `tier_limits()` and watermark tier-derived, and item_ids are `status='approved'` only (the TIMELINE
  predicate). ★ Changing its RETURNS means DROP+CREATE, which drops grants — re-grant anon+authenticated
  explicitly. Password events never use it (the unlock cookie is invisible to an RPC): they ride the
  self-guarded admin arm inside `getGuestReelContext`. `get_public_profile(p_slug)` (profiles+social)
  reads the
  public-by-existence `/u/[slug]` payload: profile card + host-displayed events + the OPEN-only attended
  arm; never follow data, never a capability link. → [profiles-social.md](profiles-social.md).
  ★ **An anon READ must never disclose more than the PAGE it backs** (QA #36/#40, `20260729180000`):
  `get_event_by_qr_token` redacts description/date/host name (plus the NAME for `private`) from a
  non-owner of a gated event, matching the locked `/e/` payload — an UNLOCKED viewer's fields come back
  through a self-guarded admin re-read inside `getEventByQrToken`, because the RPC cannot see the
  unlock cookie; and `get_public_profile`'s attended arm additionally requires
  `allow_anonymous_uploads OR a signed-in viewer`, mirroring `resolveGalleryAccess` (an
  account-required album hides its Guests list from an anonymous viewer, so the reverse surface must
  too). Both keep their anon grant — the fix is the payload, not the grant. (Was 8 —
  the five guest WRITE/password RPCs were server-mediated 2026-06-08; see below. `get_public_album` was
  DROPPED in the one-link consolidation, ADR-0010.)
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
  `like_media`/`get_my_likes`/`get_event_like_counts`, `add_to_reel`/`reorder_reel`/`set_reel_guest_visible`
  (the publish switch: UPSERTs the reel row, refuses `empty` at 0 approved items — mp4 NOT required;
  ★ the reel has TWO deliberate predicates: MEMBERSHIP (host UI/counts/`reorder_reel`'s guard) =
  `status in ('approved','hidden')` vs TIMELINE/guest/publish = `approved` only — commented at every
  site; an approved-only reorder guard would brick reels holding hidden items),
  `follow_user`/`block_user` (profiles+social, with migration `20260708120000` — block-silent follow +
  atomic two-way severance; → [profiles-social.md](profiles-social.md)).
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
  `notify_gallery_change` [the gallery doorbell, Phase 3], `set_media_removal_provenance`,
  `guard_media_privileged_transitions`, `guard_event_privileged_transitions` [the QA-Q3 transition
  guards, see Invariants], …). If an unexpected one shows up, an over-broad
  grant slipped in. (`enforce_event_pro_gates` was DROPPED in S5 — see below.)
- **Realtime gotcha (the doorbell):** `realtime.send()` swallows its own insert failures into a WARNING by
  design, and `realtime.messages` has NO day-partitions until the Realtime service first activates (the first
  client channel subscription creates them). So on a project that has never had a realtime connection, a
  DB-trigger broadcast silently no-ops — verify with a real subscription, not just SQL. The doorbell trigger
  additionally wraps `realtime.send` in its own exception guard so a Realtime outage can never fail a media write.
- **Deny-all tables** = the accepted `rls_enabled_no_policy` INFO: `reports`, `sent_emails`,
  `newsletter_signups`, `unlock_attempts`, `action_attempts`, `contact_submissions`, `job_applications`,
  `export_log` (per-attempt "Download all" log — HMAC-of-IP, never a raw IP), `ops_flags` (the `export_enabled`
  kill-switch + future ops toggles), `upload_forensics` + `forensic_audit_log` (ADR-0020 — raw IP BY RULING,
  deny-all is the containment; → [trust-safety-forensics.md](trust-safety-forensics.md)) — all
  operator/service-role-only. The "Download all" export adds NO new
  SECURITY DEFINER RPC (the mint routes are server-mediated; the Worker authorizes nothing), so the 0028/0029
  advisor split is unchanged. The abuse limiter gains an `"export"` kind (`action_attempts` is kind-generic — no
  schema change); scope = (IP, event), breadth-guarded like `join`. R3's guest reel download adds the
  `"reel_guest_download"` kind the same way: breadth 15/60min (the cross-event HARVESTER guard — one venue
  NAT hammering many events) over a venue-generous scope of 100/15min per (IP, event); fails OPEN with an
  armed `captureWarning`.
- **Leaked Password Protection (HaveIBeenPwned) is ENABLED** (2026-06-08) — that WARN is cleared. Supabase
  now rejects pwned ACCOUNT passwords at set/change; the account-security form surfaces the rejection via the
  `updateUser` error. It's an Auth feature → applies to `auth.users` passwords ONLY, not event passwords
  (those keep the 4-char min + the strength-meter guidance). No app change was needed.

## Invariants (don't break)

- **Host table writes are COLUMN-locked, not just row-locked.** RLS gates the ROW (ownership); Supabase's
  default grant gives `authenticated` UPDATE/INSERT/DELETE on EVERY column. So host-writable tables must
  `revoke insert,update,delete … from authenticated` (and `anon`) and re-grant ONLY the legit columns:
  - **`profiles`** — writable: `announcements_seen_at`, `welcomed_at`. Service-role only: `email` (QA #23, `20260729180000`: it is the recipient of EVERY transactional email, so a client-writable value is a mail-redirect primitive; audited across both deployed branches first — no client path ever wrote it), `display_name` (Phase 1: the `authenticated` UPDATE grant was REVOKED so the public name can't be set unfiltered; written ONLY by `updateDisplayNameAction` via the admin client, after required + profanity + reserved checks), `tier`, `storage_*`, `is_admin`, `stripe_*`, `avatar_updated_at`, `password_set_at`.
  - **`media`** — UPDATE `status`, `removed_at` only (no insert/delete). `purge_at` is set by a BEFORE trigger (`set_media_purge_at`) WITHOUT a column grant — do NOT grant `update(purge_at)`. Likewise ungranted: `removed_by_uploader` (owner-context `remove_my_upload` — a guest's private self-deletion), `removed_by_system` (the cron's auto-reduce marker, QA #2), `removed_by_admin` + `status_before_removed` (operator provenance + the pre-removal status, QA #8/#24, trigger/service-role-written). **SELECT is column-scoped too** (migration `20260707150000`): `legal_hold_at`/`legal_hold_reason` are NOT granted, so the owning host can't detect a legal hold via PostgREST (the host may BE the investigated uploader — ADR-0020 discretion), and neither are the three later flags above. Consequences: an authenticated `select("*")` on media ERRORS — the host reads enumerate `MEDIA_HOST_COLUMNS` (`src/lib/db/queries/media.ts`; a Vitest parity test pins that list to the grant, and pins `MediaRow` to strip every ungranted column); a WHERE on a hold column errors from the RLS client too (`purgeMediaNow`'s held-filter runs on the admin client); and a new media column is FAIL-CLOSED (invisible to hosts) until added to BOTH the grant and `MEDIA_HOST_COLUMNS`.
  - **`guests`** — SELECT is column-scoped (QA #41, `20260729180000`): `session_token` is NOT granted. It is the PLAINTEXT guest upload capability (ADR-0004), and `guests_host_select` would otherwise hand every host their guests' tokens over PostgREST. All three readers use the service-role client; no host-facing read exists. Writes were already fully revoked (RPC-only).
  - **`media_likes`** — owner-RLS (SELECT + DELETE where `auth.uid()=user_id`); INSERT/UPDATE are REVOKED at the table grant, so the ONLY write path is the access-checking `like_media` RPC. A raw browser insert would otherwise let a user "like" (and then, via `get_my_likes`, presign) media they can't see — the `saved_events` lesson (write through the RPC, never a raw insert).
  - **`reel_items`** — HOST-RLS (SELECT + DELETE scoped to the host's own event via ownership); INSERT/UPDATE REVOKED at the table grant, so the ONLY add path is the access-checked `add_to_reel` RPC (host-owned event + media `approved` + not removed), and the ONLY position-update path is the `reorder_reel(p_event_id, p_media_ids)` RPC (host-owns + a set-equality guard: the id list must EXACTLY equal the event's current reel set, else `stale`). Un-reel is the host-RLS delete from the browser. Mirrors `media_likes` exactly but HOST-scoped, not owner-self (S5 Reel R1; reorder 2026-06-22).
  - **`events`** — writable: `name`, `description`, `event_date`, `visibility`, `accepting_uploads`, `allow_anonymous_uploads`, `moderation_mode`, `qr_style`, `max_upload_bytes`, `display_in_profile`, `show_guest_list` (+ `insert(host_id)`, `update(deleted_at)` — SOFT-DELETE ONLY; the un-delete direction is refused by a trigger, see below). RPC/trigger/default-only: `event_password_hash`, `custom_slug`, `qr_token`, `purge_at`.
- ★ **A column grant can't express a TRANSITION, so the dangerous ones are refused by BEFORE triggers**
  (QA #7/#10, `20260729180000`). A column-scoped grant says *which* column may change, never *from what
  to what* — so `update(status)` also bought "un-remove", and `update(deleted_at)` also bought
  "un-delete", walking past every guard the restore RPCs carry. Revoking those columns was rejected: it
  breaks six legitimate host moderation paths + `softDeleteEvent`. Instead, `current_user` distinguishes
  a direct PostgREST write (`authenticated`/`anon`) from an RPC or the service role (inside a SECURITY
  DEFINER function `current_user` is the function OWNER, `postgres`), and two BEFORE triggers refuse
  exactly the two transitions: `media_guard_privileged_transitions` (leaving `status='removed'` → use
  `restore_media`) and `events_guard_privileged_transitions` (clearing `deleted_at` → use
  `restore_event`); `events_enforce_limit_on_undelete` re-fires the tier ceiling on that same update.
  ★ The media guard's LEGAL-HOLD branch SKIPS the row (`return null`) instead of raising — raising would
  abort a whole bulk statement AND turn "Approve all suddenly fails" into a hold oracle; the skip yields
  PGRST116 → the same "That item is no longer available." copy a missing row produces. Keep it silent.
- **Value-gates a bare grant can't express are triggers/CHECK:** the `events_password_requires_hash` CHECK
  (no `visibility='password'` without a hash) + `enforce_event_limit` (MAX_EVENTS, raises 23514). (The
  `enforce_event_pro_gates` trigger that gated `allow_anonymous_uploads` was DROPPED in S5 — require-accounts
  is now FREE for any tier + default-on; password + custom_slug stay Pro-gated via their own
  `set_event_password`/`set_event_slug` RPCs, not a table trigger.)
- ★ **Every capacity decision takes the host's `profiles` row `for update` FIRST (Pattern D).** The cap /
  ingress / event-slot checks are all check-then-act, so without serialization two concurrent uploads
  (or restores, or event creates) for one host each read N-1 and both admit. The `profiles` row is the
  per-host mutex — exactly one per host, always present, whereas the aggregates themselves
  (`host_active_bytes`, the event `count(*)`) cannot be row-locked. Carried by `create_media`,
  `create_media_as_host`, `restore_media`, `restore_event` and the `enforce_event_limit` trigger
  (migration 20260729190000). **Lock-ordering rule: each takes exactly ONE profiles lock, the host's,
  as its first lock** — single lock, single order, no deadlock is constructible. `restore_event`'s
  un-delete re-fires `enforce_event_limit`, which re-locks the SAME row in the SAME transaction (a
  same-txn re-lock is a no-op). Never lock a second host's row inside these bodies.
- **The guest WRITE path inherits the READ gate** (ADR-0023 ruling 2): `create_guest` refuses a `private`
  event outright and requires `p_unlock_proven` for `password`, and `get_upload_context` returns
  `visibility` so presign/complete re-check per request. `get_upload_context` therefore stays one of the
  FIVE anon 0028 RPCs — service-role-ing it would break every guest presign. → [uploads-and-r2.md](uploads-and-r2.md).
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
- ★ **The public marketing forms are the ONE limiter that fails CLOSED** (`contact` + `careers`, QA #14).
  Everywhere else the limiter sits behind a capability token or a verified session, so a limiter outage
  degrades to "the real gate still holds" and the route fails OPEN by design. /contact and /careers have
  NOTHING behind them: unauthenticated, one service-role insert plus one Resend send per accepted
  submission, so failing open turns a counter outage into an open pipe to the monthly email quota — and
  that quota is what the orphan-sweep and prune BREAKER alerts send on, so the drain takes out the
  alerting with the forms. Neither form is event-shaped, so breadth is disabled and the scope is the bare
  IP (like `capture`); `action_attempts.kind` is generic, so the two new kinds needed no migration. The
  gate runs AFTER the honeypot (a bot caught free must not spend a real person's budget on a shared
  office address) and BEFORE the insert and the send. ★ And the swallow is captured at the swallow point
  (QA #19): a dead limiter used to look exactly like a healthy one.

## Workflow (every schema change)

1. Write the migration (the CLI isn't installed locally → apply via the **Supabase MCP** `apply_migration`;
   keep the repo file = applied version). 2. Run `get_advisors` and confirm the expected set above (esp.
   anon vs authenticated placement of any new RPC). 3. Regenerate `types.ts`. 4. Add a rolled-back
   Supabase-MCP RPC contract check (run the RPCs inside a `DO $$ … RAISE EXCEPTION $$` block so nothing persists).

QA-round workflow lessons (2026-07-29 — don't relearn these):
- **★ Apply BEFORE push when an RPC signature changes.** PostgREST resolves RPCs by argument NAME, so
  code that passes a new arg before the migration lands fails EVERY call (it broke every guest join in
  rehearsal). Migration first, then the code push, in one sitting.
- **Prefer a transition TRIGGER over a revoke when a column's legitimate writers are RPCs.** Inside a
  SECURITY DEFINER fn `current_user` is `postgres`; a direct PostgREST write is `authenticated` — so a
  BEFORE trigger can refuse exactly the dangerous client transitions while every legitimate grant
  survives (the QA's proposed revoke would have broken six moderation paths).
- **Verify a hand-passed migration payload, don't trust it**: after applying, hash-compare every live
  `prosrc` to the repo file. ★ Postgres `btrim(text)` trims SPACES only — it leaves the body's
  leading/trailing newlines so every hash looks wrong by +2 chars; collapse whitespace THEN trim.
- **A rolled-back contract check must ride EXISTING rows** — creating an event inside the txn trips
  `enforce_event_limit`; get a locked event by UPDATE-ing one (set `event_password_hash` alongside,
  per the `events_password_requires_hash` CHECK).

## See also

[ADR-0001](../adr/0001-supabase-native-data-layer.md) (data layer) · [ADR-0004](../adr/0004-anonymous-guests-capability-tokens.md) (capability tokens) · [ADR-0014](../adr/0014-data-layer-security-posture.md) (the white-hat hardening) · [auth-accounts.md](auth-accounts.md) · [uploads-and-r2.md](uploads-and-r2.md) · [billing-caps.md](billing-caps.md).
