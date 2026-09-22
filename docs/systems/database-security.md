# Database & security model

> ROLE: the data-layer security model + the DB workflow every schema change follows.
> BELONGS HERE: RLS shapes, the capability-token RPC inventory, the advisor 0028/0029 split + expected set, the column-grant lockdown pattern + its lessons, the migrations workflow, rate-limiting. · NOT HERE: a single feature's own RPC details (→ that feature's doc).
> GROWS BY: integrate-in-place.

## What it does

**RLS is the security boundary.** The proxy ([`../../src/proxy.ts`](../../src/proxy.ts)) only refreshes
cookies, it does **not** authorize. Every Server Function / route handler re-verifies authz with
`getUser()` (→ [auth-accounts.md](auth-accounts.md)) AND relies on RLS policies / SECURITY DEFINER RPCs
at the DB. Anonymous guests have no JWT: they authorize via **capability tokens** validated INSIDE
SECURITY DEFINER RPCs; `anon` never gets direct table access. Privileged writes go through the
service-role admin client (`server-only`).

## Where it lives

- Schema = Supabase-native SQL migrations + RLS + generated types (no ORM) in [`../../supabase/migrations/`](../../supabase/migrations).
- Clients: [`../../src/lib/supabase/`](../../src/lib/supabase) — `client` (browser/anon), `server`
  (RSC/route handlers, async), `middleware` (proxy refresh), `admin` (service-role, `server-only`, bypasses RLS).
- Data access only via [`../../src/lib/db/`](../../src/lib/db) (queries/mutations) — never inline SQL in components.
- Generated types: [`../../src/lib/db/types.ts`](../../src/lib/db/types.ts) — **do not hand-edit** (`.prettierignore`d so regen stays churn-free).
- Migration guards: [`db/migration-guards.test.ts`](../../src/lib/db/migration-guards.test.ts) + [`forensics/migration-guards.test.ts`](../../src/lib/forensics/migration-guards.test.ts) pin the load-bearing SQL facts below, latest-wins across the migration files, so a later `create or replace` that drops one fails the gate.
- Rate-limiters: [`unlock-rate-limit.ts`](../../src/lib/security/unlock-rate-limit.ts) (album-password unlock) + [`abuse-rate-limit.ts`](../../src/lib/security/abuse-rate-limit.ts) (guest write endpoints; cross-event breadth) + [`public-form-limit.ts`](../../src/lib/security/public-form-limit.ts) (the marketing forms; the ONE that fails closed).

## The advisor model (`get_advisors` — run after EVERY schema change)

The expected, accepted set:

- **5 anon capability RPCs (lint `0028`, SECURITY DEFINER, executable by `anon` — by design, DO NOT
  revoke), READS ONLY:** `get_event_by_qr_token`, `get_event_media_by_qr_token`, `get_upload_context`,
  `get_public_profile`, `get_event_reel_by_qr_token`. The opaque token IS the authorization for the
  token-keyed ones and each only READS visibility-gated state, so anon EXECUTE is safe (0029 lists these
  five too: `authenticated` can call them). `get_event_reel_by_qr_token` returns an OPEN event's published
  reel only (`guest_visible=true`; anything else is zero rows, so there is no publish-state oracle); its
  **RETURNS TABLE IS the allow-list** (8 keys, pinned by [`guest-reel-contract.test.ts`](../../src/lib/reel/guest-reel-contract.test.ts)
  against the generated type, so no render internal, timestamp or tier ever rides it), the length is
  tier-DERIVED via `tier_limits()` and the watermark from the tier, and `item_ids` are `status='approved'`
  only. ★ Changing a RETURNS TABLE means DROP+CREATE, which drops the grants:
  re-grant anon + authenticated explicitly. Password events ride the self-guarded admin arm inside
  `getGuestReelContext` instead (an RPC cannot see the unlock cookie). `get_public_profile(p_slug)` reads
  the public-by-existence `/u/[slug]` payload (the profile card, the events the host chose to display, the
  OPEN-only attended arm): never follow data, never an attended event's capability link.
  → [profiles-social.md](profiles-social.md).
  ★ **An anon READ must never disclose more than the PAGE it backs.** `get_event_by_qr_token` redacts the
  description, date, custom slug and host name (plus the NAME for `private`) from a non-owner of a gated
  event, matching the locked `/e/` payload; an UNLOCKED viewer's fields come back through a self-guarded
  admin re-read inside `getEventByQrToken`. `get_public_profile`'s attended arm requires
  `allow_anonymous_uploads OR a signed-in viewer`, mirroring `resolveGalleryDecision` (an album that
  requires verified emails hides its Guests list from an anonymous viewer, so the reverse surface must too).
  Both keep their anon grant: the fix is the payload, not the grant.
- **★ Server-mediated write/password RPCs (service-role-only — in NEITHER 0028 nor 0029):** an anon
  EXECUTE grant on a write RPC IS the attack surface, not the route wrapping it: PostgREST calls it
  directly, past every route guard (the R2-HEAD size authority, the unlock and abuse limiters), which buys
  cap-evasion cost bombs, an unthrottled password oracle and victim-email poisoning. So each is
  `revoke execute … from public, anon, authenticated`, called by the Next routes on the **service-role
  admin client** with **server-derived trusted values** (the R2-HEAD size, the `getUser()` ids, the
  verified email from `auth.users`; never the client): `create_media`, `create_media_as_host`,
  `create_guest`, `verify_event_password`, `create_report`, `capture_guest_email`; `get_upload_gate` (the
  upload-to-view gate's one READ: has this session token or account completed an upload on this event,
  and is the album full by the presign's own two caps; only the guest page's render and the gallery poll
  call it, so a token can never be probed through it); `remove_my_upload_by_session` (an anonymous guest's
  own-photo removal, the token validated against the media's guest row, a claimed row never touched; only
  via `POST /api/guests/remove`); `set_guest_display_name` (names a name-only guest by session token; its
  route is part of the gate because profanity and reserved names cannot be checked in SQL, the obscenity
  matcher never shipping to a browser, as `updateDisplayNameAction` is for a profile name);
  `set_guest_pending_email` (attaches, changes or DETACHES a guest row's unproved address by session
  token, only via `POST /api/guests/email`, whose `attach_email` limiter is part of the gate; a VERIFIED
  row is refused, a blank address detaches).
- **Authenticated-only RPCs (lint `0029`):** `get_host_upload_context`,
  `set_event_password`/`clear_event_password`, `set_event_slug`/`clear_event_slug`, `check_slug_available`,
  `has_password`/`verify_current_password`/`mark_password_set`, `save_event`/`get_saved_events`,
  `get_my_uploads`/`remove_my_upload`, `claim_anonymous_uploads`,
  `list_guest_rows_by_email`/`claim_guest_rows_by_email`/`disown_guest_rows_by_email`,
  `restore_media`/`restore_event`/`purge_media_now`, `like_media`/`get_my_likes`/`get_event_like_counts`,
  `add_to_reel`/`reorder_reel`/`upsert_reel_config`/`set_reel_guest_visible` (the publish switch: UPSERTs
  the reel row, refuses `empty` at 0 approved items; no mp4 required).
  ★ The reel has TWO deliberate predicates: MEMBERSHIP (host UI/counts/`reorder_reel`'s guard) =
  `status in ('approved','hidden')` vs TIMELINE/guest/publish = `approved` only, commented at every
  site; an approved-only reorder guard would brick reels holding hidden items.
  The social pair `follow_user`/`block_user` is in this class too (block-silent follow + atomic two-way
  severance; → [profiles-social.md](profiles-social.md)). Each is SECURITY DEFINER with
  `revoke … from public, anon` + `grant … to authenticated` and authorizes internally via `auth.uid()` +
  ownership; they appear ONLY in 0029, **never 0028**, and that split IS the security property.
  `claim_anonymous_uploads(text[])` stamps `guests.user_id = auth.uid()` onto a browser's still-unclaimed
  anonymous uploads, authorized by the held `session_token` capabilities + the `user_id IS NULL` no-theft
  guard (no client-spoofable value, so it stays browser-callable); for a CONFIRMED caller it also stamps
  `verified_at` and `email` and clears `pending_email` (→ [guest-flow.md](guest-flow.md)).
  **The claim by address** (`list_guest_rows_by_email()`, `claim_guest_rows_by_email(uuid[])`,
  `disown_guest_rows_by_email(uuid[])`) is keyed on the CALLER'S OWN CONFIRMED address, read from
  `auth.users` under definer privilege. ★ The address is never a parameter, which is the whole oracle gate:
  nothing can answer "is this address a Partyreel guest?", and an UNCONFIRMED caller gets an empty set even
  for their own address, because confirming it IS the authorization. The claim stamps `user_id`,
  `verified_at` and `email` and clears `pending_email`; the disown removes the rows' media through the
  uploader path and detaches the address. `get_my_uploads(integer)` returns the caller's OWN media across
  events (host + guest; the app reads 200), reading the name/date of events they don't own, like
  `get_saved_events` (→ [host-app.md](host-app.md)); `remove_my_upload(uuid)` re-checks the SAME ownership and marks
  a guest's self-deletion `removed_by_uploader=true`, private to the host (→ [lifecycle-recovery.md](lifecycle-recovery.md)).
  **Likes:** `like_media(uuid)` favorites media the caller can SEE (host of its event, a guest of it, or
  an OPEN album; a password/private PURE viewer who never joined cannot like, by design);
  `get_my_likes(integer)` RE-APPLIES that predicate, so a now-inaccessible like never leaks its presigned
  key; `get_event_like_counts(uuid)` is HOST-GATED (zero rows to a non-host) and the ONLY count path, so a
  like count NEVER reaches a guest. Unlike + heart-state are owner-RLS from the browser.
- **Service-role-only (must NEVER appear in either advisor list):** the server-mediated RPCs above, plus
  `action_rate`, `purge_media_rows`, `record_link_hit`, `host_active_bytes`, `monthly_ingress_cap` and the
  trigger-only functions (`set_media_purge_at`, `set_event_purge_at`, `set_updated_at`,
  `enforce_event_limit`, `handle_new_user`, `enforce_follow_not_blocked`, `notify_gallery_change` [the
  gallery doorbell], `set_media_removal_provenance`, `guard_media_privileged_transitions`,
  `guard_event_privileged_transitions` [the transition guards, see Invariants],
  `sync_event_verified_email_flags` [keeps `events.require_verified_email` and the legacy
  `allow_anonymous_uploads` exact opposites both ways, so `get_public_profile`'s attended-arm clause, still
  on the legacy flag, stays truthful; nothing new keys on the legacy flag, and dropping it re-points that
  clause in the same migration]). If one shows up in either list, an over-broad grant slipped in. The
  trigger-only functions keep EXECUTE **revoked from `anon`/`authenticated`** and still fire: EXECUTE on a
  trigger function is checked when the trigger is created, never when it fires.
- **Realtime gotcha (the doorbell):** `realtime.send()` swallows its own insert failures into a WARNING,
  and `realtime.messages` has NO day-partitions until the first client channel subscription creates them,
  so on a project that never had a realtime connection a DB-trigger broadcast silently no-ops: verify with
  a real subscription, not just SQL. The doorbell trigger also wraps `realtime.send` in its own exception
  guard, so a Realtime outage never fails a media write.
- **Deny-all tables** = the accepted `rls_enabled_no_policy` INFO, all operator/service-role-only:
  `reports`, `sent_emails`, `newsletter_signups`, `unlock_attempts`, `action_attempts`,
  `contact_submissions`, `job_applications`, `event_passes` (the Event Pass purchase ledger), `job_runs`
  (the `/admin/jobs` run log), `reel_render_log` (the `/admin/reels` render log), `export_log` (per-attempt
  "Download all" log: HMAC-of-IP, never a raw IP), `ops_flags` (the kill switches: `export_enabled`,
  `reel_render_enabled`, one per backend job), `upload_forensics` + `forensic_audit_log` (raw IP by design,
  plus the uploader identity denormalized at capture, `guest_display_name` included since a name-only
  guest's typed name IS the identity a lawful-process response needs; deny-all is the containment →
  [trust-safety-forensics.md](trust-safety-forensics.md)). The "Download all" export has NO SECURITY
  DEFINER RPC (the mint routes are server-mediated; the Worker authorizes nothing); its limiter kind
  `"export"` is scoped to (IP, event) and breadth-guarded like `join`. The guest reel download's
  `"reel_guest_download"` kind: breadth 15 events / 60 min (the cross-event HARVESTER guard) over a
  venue-generous 100 / 15 min per (IP, event); fails OPEN with an armed `captureWarning`.
- **Leaked Password Protection (HaveIBeenPwned) is ENABLED**, so that WARN never shows: Supabase rejects a
  pwned ACCOUNT password at set/change, and the account-security form surfaces it from the `updateUser`
  error. It covers `auth.users` passwords ONLY, never event passwords (those keep the 4-character minimum
  and the strength-meter guidance).

## Invariants (don't break)

- ★ **Every SECURITY DEFINER function pins `set search_path = ''` and fully-qualifies every object
  name** (`public.events`, `auth.users`, `extensions.crypt`). The function runs as its owner, so an
  unpinned `search_path` lets a caller shadow an unqualified name with their own object and execute it
  with owner privileges. An authoritative function scan is part of every security pass; a new RPC
  without the pin is the one that breaks it. No SECURITY DEFINER body uses dynamic SQL.
- **Host table writes are COLUMN-locked, not just row-locked.** RLS gates the ROW (ownership); Supabase's
  default grant gives `authenticated` UPDATE/INSERT/DELETE on EVERY column. So host-writable tables must
  `revoke insert,update,delete … from authenticated` (and `anon`) and re-grant ONLY the legit columns:
  - **`profiles`** — writable: `announcements_seen_at`, `welcomed_at`; every other column is service-role-only (a new one is fail-closed). Never grant: `email` (the recipient of EVERY transactional email, so a client-writable value is a mail-redirect primitive), `display_name` and `bio` (public text, written ONLY by `updateDisplayNameAction` / `setProfileBioAction` on the admin client after the validation + profanity checks), `deletion_requested_at` (a client write would be an un-request path), `slug`, `tier`, `tier_expires_at`, `event_slots`, `storage_*`, `is_admin`, `stripe_*`, `avatar_updated_at`, `password_set_at`.
  - **`media`** — UPDATE `status`, `removed_at` only (no insert/delete). `purge_at` is set by a BEFORE trigger (`set_media_purge_at`): never grant `update(purge_at)`. Also write-ungranted: `removed_by_uploader` (owner-context `remove_my_upload`: a guest's private self-deletion), `removed_by_system` (the cron's auto-reduce marker), `removed_by_admin` + `status_before_removed` (operator provenance + the pre-removal status, trigger/service-role-written). **SELECT is column-scoped too**: `legal_hold_at`/`legal_hold_reason` are NOT granted, so the owning host (who may BE the investigated uploader) can't detect a legal hold via PostgREST, and neither are `removed_by_system`, `removed_by_admin`, `status_before_removed`. So an authenticated `select("*")` on media ERRORS: the host reads enumerate `MEDIA_HOST_COLUMNS` (`src/lib/db/queries/media.ts`; a Vitest parity test pins that list to the grant and `MediaRow` to strip every ungranted column); a WHERE on a hold column errors from the RLS client too (`purgeMediaNow`'s held-filter runs on the admin client); and a new media column is FAIL-CLOSED (invisible to hosts) until added to BOTH the grant and `MEDIA_HOST_COLUMNS`.
  - **`guests`** — SELECT is column-scoped: `session_token`, the PLAINTEXT guest upload capability, is NOT granted (`guests_host_select` would otherwise hand every host their guests' tokens); its readers all use the service-role client. ★ **THE TOKEN ALSO RIDES A COOKIE**: `pr_guest_<eventId>` carries it raw, beside the signed `pr_unlock_<eventId>`, because Require an upload to view is resolved in an RSC and localStorage is invisible there. HttpOnly (LESS reachable than the localStorage copy), Secure in production, SameSite=Lax, path `/`, 60 days, shape-guarded `/^[0-9a-f]{64}$/` on read, and UNSIGNED on purpose: the database checks it against this column's unique index, so a forged value resolves to no row. Written only by `POST /api/guests` (a mint), `POST /api/guests/name`, `POST /api/guests/email`, `POST /api/r2/complete-upload` (a created row) and the gallery poll's heal; expired by `POST /api/guests/leave`, which the guest sign-out calls so a shared phone does not open the full album on the last contributor's ticket. ★ **It is a READ capability only**: every WRITE route takes the token from the request BODY (pinned in `session-cookie.test.ts`), so the cookie adds no CSRF surface. → [guest-flow.md](guest-flow.md). Writes are fully revoked (RPC-only), and `display_name` and `verified_at` stay OUT of the SELECT grant (the guest list and the credit are built on the admin client; the narrower the host's view the better). ★ **TWO EMAIL COLUMNS, ONE PATH BETWEEN THEM.** `guests.email` is ONLY EVER a CONFIRMED `auth.users` address, written server-side at the mint from `email_confirmed_at`, and the one of the two inside the host's grant. `guests.pending_email` is ONLY EVER an address a guest TYPED and nobody proved: outside every grant, never shown to the host or another guest, never attributed to an account, never mailed on its own, never expiring. The ONLY path from the second to the first is a claim that PROVES it (`claim_guest_rows_by_email`, or `claim_anonymous_uploads` under a confirmed session), and the code holds the same line: `resolveUploaderIdentity` case 3 returns no address at all, `getEventGuestList` selects neither column, and `POST /api/guests/capture-email` requires `email_confirmed_at` before it writes `guests.email` (a bare `user.email` is satisfied by an unconfirmed sign-up). The one exception, `upload_forensics.guest_pending_email`, is deny-all + service-role: capture-only, lawful process, never rendered.
  - **`media_likes`** — owner-RLS (SELECT + DELETE where `auth.uid()=user_id`); INSERT/UPDATE REVOKED, so the ONLY write path is the access-checking `like_media` RPC (a raw insert would let a user like, then via `get_my_likes` presign, media they can't see). `saved_events` follows the same rule.
  - **`reel_items`** — HOST-RLS (SELECT + DELETE on the host's own event); INSERT/UPDATE REVOKED, so the ONLY add path is the access-checked `add_to_reel` RPC (host-owned event + media `approved` + not removed) and the ONLY position-update path is `reorder_reel(p_event_id, p_media_ids)` (host-owns + a set-equality guard: the ids must EXACTLY equal the event's current reel set, else `stale`). Un-reel is the host-RLS delete from the browser.
  - **`events`** — writable: `name`, `description`, `event_date`, `visibility`, `accepting_uploads`, `allow_anonymous_uploads`, `moderation_mode`, `qr_style`, `max_upload_bytes`, `display_in_profile`, `show_guest_list`, `require_verified_email` (free on every tier, default ON; never write it and its legacy twin in one statement expecting both to stand: the trigger resolves a contradiction, on an update in the new column's favour), `require_upload_to_view` (default off), + `insert(host_id)` and `update(deleted_at)` (SOFT-DELETE ONLY; a trigger refuses the un-delete, see below). RPC/trigger/default-only: `event_password_hash`, `custom_slug`, `qr_token`, `purge_at`.
- ★ **A column grant can't express a TRANSITION, so the dangerous ones are refused by BEFORE triggers.**
  A column-scoped grant says *which* column may change, never *from what to what*: `update(status)` would
  also buy "un-remove" and `update(deleted_at)` "un-delete", past every guard the restore RPCs carry, yet
  the host moderation paths and `softDeleteEvent` legitimately write both columns. So `current_user` tells
  a direct PostgREST write (`authenticated`/`anon`) from an RPC or the service role (inside a SECURITY
  DEFINER function it is the OWNER, `postgres`), and two BEFORE triggers refuse exactly the two
  transitions: `media_guard_privileged_transitions` (leaving `status='removed'` → use `restore_media`) and
  `events_guard_privileged_transitions` (clearing `deleted_at` → use `restore_event`);
  `events_enforce_limit_on_undelete` re-fires the tier ceiling on that same update. Prefer this shape over
  a revoke whenever a column's legitimate writers are RPCs.
  ★ The media guard's LEGAL-HOLD branch SKIPS the row (`return null`) instead of raising: raising would
  abort a whole bulk statement AND make "Approve all suddenly fails" a hold oracle. The skip yields
  PGRST116, the same "That item is no longer available." copy a missing row produces. Keep it silent.
- **Value-gates a bare grant can't express are triggers/CHECK:** the `events_password_requires_hash` CHECK
  (no `visibility='password'` without a hash) + `enforce_event_limit` (the tier's `MAX_EVENTS`, or the
  host's `event_slots` when set; raises 23514). The paid-tier gates on the password and custom slug live
  inside `set_event_password`/`set_event_slug`, not a table trigger.
- ★ **Every capacity decision takes the host's `profiles` row `for update` FIRST (Pattern D).** The cap /
  ingress / event-slot checks are check-then-act, so without serialization two concurrent uploads (or
  restores, or event creates) for one host each read N-1 and both admit. The `profiles` row is the
  per-host mutex (exactly one per host, always present); the aggregates themselves (`host_active_bytes`,
  the event `count(*)`) cannot be row-locked. Carried by `create_media`, `create_media_as_host`,
  `restore_media`, `restore_event` and the `enforce_event_limit` trigger. **Lock-ordering rule: each takes
  exactly ONE profiles lock, the host's, as its first lock**, so no deadlock is constructible;
  `restore_event`'s un-delete re-fires `enforce_event_limit`, which re-locks the SAME row in the SAME
  transaction (a no-op). Never lock a second host's row inside these bodies.
- **The guest WRITE path inherits the READ gate**: `create_guest` refuses a `private`
  event outright and requires `p_unlock_proven` for `password`, and `get_upload_context` returns
  `visibility` so presign/complete re-check per request. `get_upload_context` therefore stays one of the
  FIVE anon 0028 RPCs — service-role-ing it would break every guest presign. → [uploads-and-r2.md](uploads-and-r2.md).
- **Never expose raw R2 keys/URLs to the browser** — presign server-side. → [uploads-and-r2.md](uploads-and-r2.md).
- **The Stripe webhook is the SOLE writer of `tier`/`storage_cap_bytes`** — never trust the client for entitlements. → [billing-caps.md](billing-caps.md).
- **The service-role / secret key is server-only** (behind `import "server-only"`); never `NEXT_PUBLIC_`.
- **Events have no end date** — deletion is the only lifecycle exit (the anti-abuse core).

## Gotchas (why it's like this — don't revert)

- **A column-level `revoke update(col)` is a SILENT NO-OP while a TABLE-level grant stands** (with the
  table grant standing, a free host can PATCH `event_password_hash`/`custom_slug` straight past the
  paid-tier gates). You MUST `revoke insert,update,delete … from authenticated` at the TABLE level FIRST,
  then `grant (cols)`. Verify with `has_column_privilege`, then re-run `get_advisors`.
- ★ **And the mirror: a TABLE-level `revoke` CASCADES TO THE COLUMN GRANTS and wipes them all.** "Revoke
  the table first" is right when you re-grant the whole column list, and a loaded gun when you only mean
  to ADD one column: a belt `revoke insert, update, delete on public.events from authenticated, anon`
  leaves only the new column granted, and every `authenticated` write naming another column
  (`allow_anonymous_uploads`, say) fails with "permission denied for table events", the whole host app
  down. **Adding a column = a bare additive `grant insert (col), update (col)`, nothing else.**
- **RPCs created via the Supabase MCP `apply_migration` inherit a default privilege that GRANTS EXECUTE to
  `anon`.** A bare `revoke … from public` does NOT remove it. Any host-only RPC created via the MCP must
  explicitly `revoke execute … from anon` (a service-role-only one, from `authenticated` too), a
  drop-and-recreate re-inherits the default (re-state its grants in full), and `get_advisors` confirms
  anon vs authenticated placement.
- **Postgres integer literals are int4**, so `2 * 1024 * 1024 * 1024` (2 GB) overflows int4 even when
  assigned to a `bigint` constant, during DECLARE init before the body runs. Force `2::bigint * 1024 * 1024 * 1024`.
- ★ **A NEW junction table silently breaks PostgREST embeds between the two tables it links (PGRST201).**
  FKs to two already-related tables (especially a composite PK of exactly those FKs, as `reel_items` has:
  `reel_items(event_id, media_id)`) make PostgREST infer an extra many-to-many, so an existing bare
  `tableB!inner(...)` embed between them becomes AMBIGUOUS and throws at runtime; typecheck, lint and
  build never catch it, and it stays latent until a page (`/dashboard`, the admin views, the purge cron)
  hits the embed. **Always PIN cross-table embeds to the FK constraint:** `events!media_event_id_fkey!inner(...)`,
  never `events!inner(...)`. The embedded resource keeps its table name (`events`), so `.eq("events.col", …)`
  filters are unchanged. Adding ANY table with two FKs: grep for embeds between those tables, and verify a
  hinted embed against live PostgREST (a green build proves nothing here).
- **Upload size-spoof:** the complete seam ([`server-pipeline.ts`](../../src/lib/upload/server-pipeline.ts))
  re-derives the real size from an R2 HEAD (`headObjectSize`, [`presign.ts`](../../src/lib/r2/presign.ts))
  and hands that to `create_media`/`_as_host`; the CLIENT `file_size_bytes` is advisory (trusting it lets
  a PUT-big-claim-tiny upload beat the cap), so `media.file_size_bytes` mirrors the stored object and the
  storage meters derive from it. → [uploads-and-r2.md](uploads-and-r2.md).
- **Rate limits must be ABUSE-focused, NOT volume-focused: an event concentrates guests behind ONE
  venue/CGNAT IP**, so a naive per-IP volume cap 429s a *crowd*. Two venue-safe limiters: the
  album-password unlock (count failures + clear-on-success, deny-all `unlock_attempts`) and the
  **abuse-focused limiter** (the guest join, rename, attach-email, report and capture writes, the exports,
  the reel routes): deny-all `action_attempts` + the `action_rate` RPC, keyed on cross-event BREADTH (one
  IP touching many DISTINCT events = a scraper; a venue is ONE event, so it never trips) + a high
  per-(IP,event) backstop ([`abuse-rate-limit.ts`](../../src/lib/security/abuse-rate-limit.ts)). Both
  fail OPEN (the capability or session is the real gate), and a failing limiter records into the
  `abuse_limiter` signal so a dead one never looks idle. Raw volumetric DoS is the Vercel edge firewall's
  job; the guest OTP "Enter event" path is throttled only by Supabase Auth, PER-IP.
- ★ **The public marketing forms are the ONE limiter that fails CLOSED** (`contact` + `careers`). Everywhere
  else the limiter sits behind a capability token or a verified session, so an outage degrades to "the
  real gate still holds" and the route fails OPEN by design. /contact and /careers have NOTHING behind
  them (unauthenticated, one service-role insert + one Resend send per accepted submission), so failing
  open turns a counter outage into an open pipe to the monthly email quota, which the orphan-sweep and
  prune BREAKER alerts also send on. Neither form is event-shaped, so breadth is off and the scope is the
  bare IP (like `capture`); `action_attempts.kind` is generic, so a new kind needs no migration. The gate
  runs AFTER the honeypot (a bot caught free must not spend a real person's budget on a shared office
  address) and BEFORE the insert and the send. ★ And the swallow is captured at the swallow point: a dead
  limiter otherwise looks exactly like a healthy one.

## Workflow (every schema change)

1. Write the migration (no Supabase CLI locally → apply via the **Supabase MCP** `apply_migration`;
   keep the repo file = applied version). 2. Run `get_advisors` and confirm the expected set above (esp.
   anon vs authenticated placement of any new RPC). 3. Regenerate `types.ts`. 4. Add a rolled-back
   Supabase-MCP RPC contract check (run the RPCs inside a `DO $$ … RAISE EXCEPTION $$` block so nothing persists).

**Migrations are immutable history**: never edit one that has been applied, add a new one. The repo file
IS the applied SQL, which keeps the repo and the live schema comparable; `apply_migration` stamps its own
version timestamp, so match a live migration to its file by name.

★ **Pre-flight a migration on a throwaway local cluster before handing it off** (Homebrew
`postgresql@17` is installed; `initdb` into a scratch dir, socket under `/private/tmp` because a
scratchpad path blows the 103-byte socket limit, `LC_ALL=C` or the postmaster dies "multithreaded
during startup"). Load a stand-in carrying the REAL column types/defaults/constraints of the tables
you touch, the Supabase roles, an `auth.uid()`/`auth.users` stub, the CURRENT bodies of every
function you replace and the touched grant state; apply the migration VERBATIM; run the contract
check; then run a second probe that drives the DEPLOYED build's paths through `set local role
authenticated` / `anon`. It cannot see live DRIFT (step 1 still stands), but it is the only thing that
catches a wrong GRANT (the table-revoke cascade above) before production, and `pg_get_functiondef`
before/after is then a real diff to hand over rather than a claim.

Workflow lessons:
- **★ Apply BEFORE push when an RPC signature changes.** PostgREST resolves RPCs by argument NAME, so
  code that passes a new arg before the migration lands fails EVERY call. Migration first, then the code
  push, in one sitting.
- **Verify a hand-passed migration payload, don't trust it**: after applying, hash-compare every live
  `prosrc` to the repo file. ★ Postgres `btrim(text)` trims SPACES only — it leaves the body's
  leading/trailing newlines so every hash looks wrong by +2 chars; collapse whitespace THEN trim.
- **A rolled-back contract check must ride EXISTING rows** — creating an event inside the txn trips
  `enforce_event_limit`; get a locked event by UPDATE-ing one (set `event_password_hash` alongside,
  per the `events_password_requires_hash` CHECK).

## See also

[auth-accounts.md](auth-accounts.md) · [uploads-and-r2.md](uploads-and-r2.md) · [billing-caps.md](billing-caps.md).
