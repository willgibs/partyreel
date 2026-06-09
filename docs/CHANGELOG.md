# Partyreel — Changelog (shipped history)

> ROLE: the shipped-history archive — what shipped, when, with what commit + verification. Read this for "when/how did X ship," NOT to learn how the system works today.
> BELONGS HERE: dated, per-initiative shipping + verification narratives. · NOT HERE: how the system works now (→ [`systems/`](systems)), what's next (→ [`ROADMAP.md`](ROADMAP.md)), current state (→ [`STATUS.md`](STATUS.md)), why-decisions (→ [`adr/`](adr)).
> GROWS BY: append (newest on top). This is the ONE deliberately append-only doc — it is kept OFF the orient path, so its length never muddies a fresh agent.

Dates are when the work was shipped + verified on partyreel.com (test data is disposable). Commits are
included where recorded; the full original prose lives in git history. The foundational build (Phases
0–4 + 6) is summarized at the bottom.

---

## 2026-06-08 — Security: abuse-focused rate limiter for guest write endpoints (H3b)

Closed the one deferred piece of the server-mediation remediation (commit `7bb2b53`): the now
service-role-only `create_guest` / `create_report` / `capture-email` routes had no throttle. Per Will, the
limiter is ABUSE-focused, NOT volume-focused (an event app gets heavy LEGITIMATE traffic from one NAT IP, so
a per-IP volume cap would block the core use case).

- Venue-safe design: the primary signal is cross-event BREADTH (one IP touching many DISTINCT events = a
  scraper; a venue is exactly ONE event, so it never trips) + a high per-(IP,event) backstop (runaway-bot
  guard); raw volumetric DoS stays the Vercel edge firewall's job. Deny-all `action_attempts` (HMAC hashes
  only, mirrors `unlock_attempts`) + the `action_rate` service-role RPC (the `COUNT(DISTINCT)` breadth in one
  round-trip); `abuse-rate-limit.ts` (pure, unit-tested) + the server-only store; wired into the three routes
  (`429` + `Retry-After`; fail-OPEN + Sentry on a limiter error; cron-pruned).
- Hygiene: explicit `grant execute … to service_role` for `create_media` / `create_report` /
  `capture_guest_email` (they had relied on Supabase's implicit default grant — verified working, now explicit).
- Live-verified on partyreel.com: the report backstop trips at 16 (15× `200` → `429`); 12/12 venue joins to
  ONE event all allowed (0 throttled); the six direct anon RPCs return `404`; an identity-forgery probe (body
  `user_id`) left the guest row `user_id` NULL. Rolled-back contract check (breadth = 3 distinct, backstop =
  2, no cross-IP bleed); typecheck/lint/test (317)/build green; advisors clean (`action_rate` in neither 0028
  nor 0029; new `action_attempts` deny-all INFO).

## 2026-06-08 — Security remediation: server-mediated guest RPCs (pentest H1/H2/H3)

Closed the externally-exploitable findings from the 2026-06-08 live pentest by SERVER-MEDIATING the six guest
write/password RPCs (ADR-0016; commits `2e4c909` H1, `2d63b38` H2, `b3b48e3` H3a, `1bcf61f` password UI).
Root cause: each was `anon` EXECUTE-granted, so directly PostgREST-callable, bypassing every route-level guard.

- **H1 (cost-bomb):** `create_media` + `create_media_as_host` are now service-role-only; the complete-upload
  routes call them via the admin client with the authoritative R2-HEAD size. `create_media_as_host`'s
  `auth.uid()` ownership became a trusted `p_host_id` from `getUser()`. Live-verified with two real uploads
  (host 5.7 MB + guest 10 MB through the new path); the direct anon attack now returns `42501`.
- **H2 (password oracle):** `verify_event_password` is service-role-only; the unlock route (admin client) is
  the sole caller, so the venue-NAT limiter is unbypassable (20/IP → `429`, blocking even the correct password
  once tripped). The limiter keeps fail-open but now Sentry-alerts; a client-side cooldown keeps honest-traffic
  cost off Vercel. Password minimums kept (8 accounts / 4 events) with a soft live strength meter as guidance.
- **H3 (spam/poison):** `create_guest` (now a trusted `p_user_id`; the verified email is read from `auth.users`,
  the client `p_email` dropped) / `create_report` / `capture_guest_email` (new `/api/guests/capture-email`
  route deriving the email from the verified session) are all service-role-only. Anon attacks (incl.
  `capture_guest_email` with a victim address) now return `42501`; legit join + report still work.

The anon advisor set shrank 8 → 3 (reads only); the six are service-role-only. The `415962b` CHECK remains the
floor. DEFERRED: a venue-NAT-aware per-IP rate limit for `create_guest`/`create_report` (a naive per-IP cap
would block legitimate venue crowds; it needs the unlock limiter's count-failures design) → ROADMAP; Vercel's
edge firewall is the volumetric backstop. `typecheck`/`lint`/`test (310)`/`build` green; every phase
live-red-teamed on partyreel.com.

---

## 2026-06-08 — Per-photo uploader attribution caption (uploader-attribution P2)

Phase 2 of the uploader-attribution initiative (commit `69b8b71`; builds on P1's required display names). The
media lightbox now shows **who** uploaded each photo/video: a subtle bottom-center caption — the uploader's
public **display name**, a **"Host"** badge for the host's own uploads, or **"Anonymous"** with a tap-to-open
info popover whose copy is context-aware (guests see "The host has enabled anonymous uploads for this event.";
the host sees a nudge to require accounts in Settings). Attribution is **lightbox-only** — the dense grid tiles
stay clean by construction (`MediaTile` reads only `type` + `url`).

Identity is resolved server-side by ONE shared admin-read (`getUploaderIdentities`), required because
`profiles` RLS is own-row-only so a host's normal query can't read guests' names (mirrors the `getHostAvatarUrl`
byline pattern). A pure `resolveUploaderIdentity` CASE classifies host / anonymous / named-guest. The uploader's
**email is shown on the HOST gallery only**: the host dashboard spreads it, but every guest-facing item is built
by `toGridItems`, which copies only name + flags and never email, so email-safety is by construction (not a
runtime flag) and pinned by a standing source test. No migration (reads existing tables + FKs).

Live-verified on partyreel.com (staged four identities against one real photo): the host view showed
name+"Host" (no email), named guests showed name + email, anonymous showed "Anonymous" + the host-copy popover;
the guest view showed the same minus every email, with the guest-copy popover; and an **anonymous fetch of the
SSR HTML + `/api/guests/gallery` JSON carried zero email** (item keys: `id, type, url, downloadUrl,
uploaderName, isHost, isAnonymous`). Nested Esc closes the popover first, the lightbox second. `pnpm typecheck
&& lint && test && build` green.

---

## 2026-06-08 — Identity foundation: required display names + `allow_anonymous_uploads` (uploader-attribution P1)

Phase 1 of the uploader-attribution / unified-identity initiative (commit `9238531`; ADR-0015). Every account
now always has a **public display name**: required at every signup/onboarding path (host welcome + a guest
name step), profanity-filtered via **`obscenity`** (tuned word-boundary so it does NOT block real names like
Anushka/Shitij/Dickson while still catching slurs/leetspeak/compounds), and reserved/impersonation-blocked
(`admin`, `partyreel`, etc.). The check is **authoritative**: the `authenticated` UPDATE grant on
`profiles.display_name` was revoked, so the column is service-role-write-only and the validated
`updateDisplayNameAction` (getUser → validate → profanity → admin client) is the only write path, unbypassable
by a direct API call. `handle_new_user` now leaves `display_name` NULL for ALL signups (incl. OAuth); onboarding
prefills the guarded input from `user_metadata`, so even a Google name flows through the one filter.

"Verify email to upload" was reframed as account entry: the host setting `events.require_email` was renamed +
inverted to **`allow_anonymous_uploads`** (default on; turning it off — requiring an account — stays Pro-gated),
and an account-required event shows an email-primary **"Enter event"** flow (`EnterEventPrompt`, with a secondary
password login) instead of the old verify prompt. There are no verification-only paths; an account simply proves
ownership.

Migrations `20260608093908` (column rename + `create_guest`/`get_event_by_qr_token`/`enforce_event_pro_gates`
recreated, values flipped) and `20260608093939` (display_name grant lockdown + `handle_new_user`). Verified:
typecheck/lint/test (297) /build green; `get_advisors` clean; rolled-back `create_guest` contract check (blocks
anon when an account is required, allows otherwise); live red-team on partyreel.com (profanity + reserved
rejected, short name "AJ" saved, empty disables Save, the "Allow anonymous uploads" Free-lock + upgrade hint,
guest page renders clean). Built on the security agent's baseline; the deferred anon-RPC server-mediation stays
owned by P3. P2 (lightbox attribution UI), P3 (claim anonymous uploads), P4 (dashboard consolidation) pending.

## 2026-06-08 — Per-upload limits: 10 GB ceiling + host-configurable per-event cap

Retired the per-TYPE per-file limits (50 MB photo / 2 GB + 5-min video) for ONE universal **10 GB per-upload
ceiling** across photos and videos: size is the only gate, the 5-minute duration cap is gone, and full-quality
big files stop being friction. Video stays Pro-gated; the storage cap + monthly-ingress meter are unchanged.
Restored the original "one guest can't fill the host's storage" protection as a host-configurable
**per-event cap** (`events.max_upload_bytes`, 25 MiB to 10 GB, or null = no cap), available to **every tier**
and bounding **guest** uploads only — the host's own batch uploads (`create_media_as_host`) are exempt, since
the host owns the setting. The effective guest limit min(10 GB, host cap, remaining storage) is enforced
server-side: the cap is read from the event row INSIDE the SECURITY DEFINER RPC (never client-supplied) and
re-checked on the authoritative R2-HEAD size, so it can't be spoofed. Bumped the upload presign TTL 15 min →
**2 h** (a multipart upload presigns all its parts up front, so a multi-GB transfer must finish before they
expire). Migration `20260608120000_universal_upload_ceiling_and_host_cap`: nullable column + a 25 MiB–10 GB
CHECK + an additive host column grant + CREATE-OR-REPLACE of `create_media` / `create_media_as_host` /
`get_upload_context` (`get_advisors` unchanged from baseline; types regenerated). Single-sourced as
`MAX_UPLOAD_BYTES` / `MIN_UPLOAD_CAP_BYTES` / `UPLOAD_CAP_PRESETS` in `lib/media/limits.ts`, mirrored by the SQL
`c_max_upload_bytes` (`::bigint`-cast to dodge the int4 overflow). New "Max size per upload" control in the
event-settings "Guest uploads" card (native `<select>` of presets, all tiers); marketing / FAQ / help / pricing
copy updated to "up to 10 GB."

**Megafile / cost-abuse hardening (same initiative, follow-up commit).** A presigned multipart upload didn't
bind Content-Length, so a bad actor could declare a ≤10 GB upload, get up to ~640 part URLs, over-stuff each
part, and call complete — assembling a multi-TB **orphan** in R2 that the real-time backup Worker would
replicate into the 35-day WORM bucket (`create_media`'s ceiling guards the DB/cap accounting, NOT the R2
object's existence; raising the ceiling 2 GB → 10 GB widened this). Closed at two layers: (1) **Content-Length
is now bound into every presigned PUT + UploadPart** (the route signs each part's exact size — fixed part size
for parts 1..N-1, the remainder for the last), so R2 rejects (403) any body larger than declared; (2) a
**complete-time guard** sums the real uploaded part sizes via `ListParts` and ABORTS the multipart instead of
assembling if the total exceeds the ceiling, so no oversized object is ever created (or backed up). New
`sumMultipartParts` / `abortMultipartUpload` in `r2/presign.ts`; both complete routes call the guard before
`completeMultipartUpload`.

Verified: typecheck + lint + 290 Vitest + build all green; rolled-back Supabase-MCP RPC contract checks confirm
the gates (11 GB → ceiling reject, 200 MB vs a 100 MB host cap → host-cap reject, 10 MB → accept, video on a
free host → gate reject); the megafile hardening proven against the **real R2 bucket** (signed Content-Length:
correct size → 200, oversized → 403 for both single-PUT and multipart parts; a legit 2-part multipart sums +
assembles byte-exact). **Live on partyreel.com**: the "Max size per upload" control renders + persists through
the authenticated write (DB shows the saved cap, reload reads it back), and a guest presign red-team returned
the expected results (200 MB → 422 "capped at 100 MB"; 5 MB → presigned; 11 GB → 400 schema-bound). Feature
commit `8e55910` + the hardening follow-up.

## 2026-06-08 — Avatars moved off R2 to Supabase Storage

Profile avatars now live in a **public Supabase Storage `avatars` bucket** instead of the shared R2 media
bucket, cleanly separating account metadata from the durability-critical event media + its WORM backup. Pure
backend swap: the client cropper and the `POST /api/account/avatar` validation (content-type + 512 KiB cap +
magic-byte WebP sniff) are unchanged; only the storage backend moved. New `src/lib/supabase/avatar-storage.ts`
(upload / remove / getUrl via the service-role admin client, which bypasses storage RLS, so the bucket needs
no policies); the deterministic path `<id>/avatar.webp` + `upsert` keeps the one-object-per-user zero-orphan
property. Reads are a stable public CDN URL with a `?v=<avatar_updated_at>` cache-bust (no per-render
presign); `profiles.avatar_updated_at` stays the service-role-write-only existence marker + the `?v=` version.
Removed the now-dead R2 avatar code (`r2/put.ts`, `r2/avatar-url.ts`, `avatarObjectKey`). Migration
`20260608040803` creates the bucket (512 KiB + `image/webp` as defense-in-depth); 0 avatars existed, so the
cut-over needed no backfill. Closes the ROADMAP "avatars → Supabase Storage" round + the durability doc's
queued-initiative gap. Bytes ride Supabase infra durability (not pg_dump); avatars are derivable, so by design.
Live-verified on partyreel.com (upload / replace / remove; one object held through replace; 415/413/422
validation; guest "Hosted by" byline).

## 2026-06-07 — Deletion-aware backup prune (ADR-0013, Pillar B), deployed in dry-run

Bounded the keep-all media backup: a weekly Worker cron (`0 6 * * 1`) reclaims a `partyreel-backup` object
once its source is gone, the inverse of the orphan sweep and the only job that deletes from the last-resort
backup. Layered safety: a **dual existence check** (prune only when BOTH the `media` row is gone AND the
primary R2 object is absent, so no single-source fault can wrongly prune), an app-side
**`media_table_empty` circuit-breaker** that fails closed + alerts (Sentry + a deduped email, reusing the
orphan-sweep machinery), a **36-day age gate** (one day past the Bucket Lock), a **per-run delete clamp**
(500), and **dry-run by default** (deletes nothing until `PRUNE_MODE=live`). DB-first ordering HEADs the
primary only for the confirmed-gone set, so cost stays ~$0 into tens of millions of objects. New code:
`workers/backup` `prune` branch + `prune-strategy.ts`; app `r2/prune-guard.ts` + `/api/internal/backup-prune`
+ `pruneBreakerEmail` + the shared `PRUNE_API_SECRET`. Observability is alert-only (the `/admin` job-runs
heartbeat is deferred to admin P8). Verified: `pnpm typecheck`/`lint`/`test` (290) + `build` + worker `typecheck`/tests (15), plus a LIVE
adversarial pass (endpoint auth 401/500, zod 400, breaker trip + operator email, dual-gate excludes existing
rows; the deployed Worker's cron routing + empty-primary early-out = zero deletes). Worker + app route + the
shared `PRUNE_API_SECRET` (Vercel + Cloudflare) are LIVE in dry-run ([#2](https://github.com/willgibs/partyreel/pull/2),
[#3](https://github.com/willgibs/partyreel/pull/3)). PENDING: the live-flip (`PRUNE_MODE=live`) + the
destructive drill, both post-launch (the 36-day age gate + the lock keep the delete path unreachable until then).

## 2026-06-07 — Documentation consolidation (in progress)

- **Phase 1 — system reference layer** (`be7dd8e`): added `docs/systems/` (12 per-system reference docs +
  a folder index, +1,146 lines) holding the per-system gotchas/invariants, each with a maintenance-contract
  header. Additive (no existing doc changed). Gate-verified (286 links resolve, all landmine keywords
  present) + validated by fresh subagents constrained to `docs/systems/` (3 trap tests refused+cited; a
  targeted plan navigated correctly). Master plan: the docs-consolidation initiative (keep all knowledge,
  restructure so CLAUDE.md stays lean + depth loads on demand).

## 2026-06-06 → 06-07 — Media durability (ADR-0013): all 3 pillars

- **Pillar A — orphan-sweep circuit-breaker** (`6f151c5`): the cron's orphan sweep now deletes nothing +
  alerts (Sentry + a deduped operator email) when `media` is empty or the orphan set is pathological, so a
  DB fault can't wipe the un-backed-up R2 bucket.
- **Pillar B — real-time media backup** (`workers/backup/`, 2026-06-06): a Cloudflare Worker (R2
  `object-create` → Queue → consumer + a daily reconciliation `scheduled()`) copies every `events/` object
  to a Bucket-Locked 2nd R2 bucket (WNAM, IA, ≥35-day WORM). DR-drill-verified: ~15 s replication, the lock
  blocks deletion, restore works, >100 MB multipart copy byte-identical. Workers Paid ~$5/mo, zero egress.
- **Pillar C — off-site DB backup** (2026-06-07): a nightly `pg_dump` → `partyreel-backup/db/` via
  [`db-backup.yml`](../.github/workflows/db-backup.yml), restore-verified (every table's row count matched
  prod into a throwaway Postgres 17); hardened with a post-upload byte-size verify + Node-24 opt-in.
  Findings: R2 has no native versioning/replication; Bucket Lock GA + free; R2↔R2 egress free.

## 2026-06-06 — Infrastructure ownership migration → partyr33l@gmail.com ("P3")

Every backing service moved off the founder's personal accounts to the dedicated owner account P3:
Supabase (project ref unchanged, now P3 "Partyreel Team" Pro org), Cloudflare R2 (new account, bucket
re-created), Stripe (same acct, ownership transferred), Sentry (same org, ownership transferred), Resend
(new acct, domain re-verified), Google OAuth (new client), and the in-app operator (`partyr33l@gmail.com`
= is_admin + MFA; `hi@willgibs.com` retired). Verified live (Google + email-OTP sign-in, R2 upload, Stripe
upgrade→downgrade, admin AAL2). Deferred: Vercel hosting (willgibs Hobby → P3 Pro at launch), domain + DNS
(GoDaddy → P3 Cloudflare), GitHub repo (→ P3 at sale).

## 2026-06-04 — Security hardening (ADR-0014)

- **Phase 1 — events write-grant lockdown** (migration `…163011`, `ba8c08f`): closed a live CVE — `events`
  kept Supabase's default grant, so a free host could PATCH `event_password_hash`/`custom_slug`/
  `require_email`/`qr_token`/`purge_at` to steal Pro features. Root-cause lesson: a column-level
  `revoke update(col)` is a SILENT NO-OP while a table-level grant stands (the prior column-revokes did
  nothing; `has_column_privilege` confirmed all 17 columns writable). Fix mirrors the media/profiles
  column-lock + trigger-derived `purge_at` + the `enforce_event_pro_gates` trigger +
  `events_password_requires_hash` CHECK. Verified by a 16/16 rolled-back matrix + a LIVE authenticated PATCH
  (every forbidden column → 403; a granted column → 204).
- **Phase 2 — broad white-hat sweep** (`cc5671e`/`9ba3a80`/`3cc3489`, migrations `…175656`/`…180225`):
  least-privilege grant sweep across ALL tables; closed an **upload size-spoof cap-evasion** (re-derive the
  real `file_size_bytes` from an R2 HEAD at complete — proven live: a `size_bytes:1` upload stored the real
  50 KB); a **venue-NAT-aware unlock rate-limiter** (count failures + clear-on-success; deny-all
  `unlock_attempts`; proven live: 20 wrong → 429 + Retry-After 900, correct → cleared). 15/15 rolled-back
  matrix; advisors unchanged.

## 2026-06-03 → 06-04 — Recovery / "Recently deleted" (Phases 1–5 of 6)

- **Phase 1 — cap-meter refactor** (`23bc5a0`): the cap enforces against ACTIVE bytes
  (`host_active_bytes()` = non-removed media in non-deleted events), so deleting frees cap room
  immediately; `storage_used_bytes` becomes the physical-only meter.
- **Phase 1.5 — security hotfix** (`cde3dc6`): locked `media` writes to the moderation columns only
  (the default grant let a host PATCH `file_size_bytes=0` to beat the cap).
- **Phase 2 — unified window + standby budget**: ONE 30-day window (`RECENTLY_DELETED_WINDOW_DAYS`);
  `media.purge_at` trigger-derived (un-spoofable); an 8th cron sweep `sweepStandbyBudget` bounds
  deleted-but-stored bytes to 1× the cap (oldest-first).
- **Phase 3 — restore/purge RPCs**: `restore_media`/`restore_event`/`purge_media_now` (authenticated,
  ownership-gated; capacity-gated against the BASE cap; all-or-nothing event restore; jsonb `{ok,reason}`).
- **Phase 4 — host bin UI**: a dashboard "Recently deleted" events tab + a per-event removed-media section;
  the storage meter now shows ACTIVE bytes. Live-verified (meter reads 52.5 KB active not 2.6 MB physical;
  restore-at-cap refused with the exact "Free up X" toast).
- **Phase 5 — recovery notifications + email copy**: a `recovery_clearing` bell alert
  (`RECOVERY_PURGE_NUDGE_DAYS`=7); system-removal emails point to the in-app self-serve restore.
- **Phase 6** (pre-launch test-data hard reset) deferred to the launch checkpoint.

## 2026-06-03 — 404 / not-found pages

Five audience-aware `not-found.tsx` (root + per route group) sharing one animated core
(`NotFoundScreen` + single-sourced `MarketingNotFound`); fixed a live-caught double-chrome stacking bug
(the `(marketing)/not-found.tsx` boundary renders content-only). Live-verified: all five render, every
variant 404 + `noindex`, no leak.

## 2026-06-03 — Upload thumbnail previews + custom event slug

- **Upload thumbnails** (`04ab35b`/`238bee9`): camera-roll thumbnail previews on the upload queue,
  extracted to a shared `UploadThumbnail` (guest + host), routed through `videoPosterSrc()`. Live-verified.
- **Custom event slug** (ADR-0012, Phases 1+2): Pro/Event-Pass `/e/<slug>` alias (the permanent
  `/e/<qr_token>` + QR unchanged); `set_event_slug`/`clear_event_slug` (authenticated-only, tier-gated);
  `get_event_by_qr_token` resolves slug-or-token → canonical token; `EventSlugControl` with debounced live
  availability (`check_slug_available`) + change/remove warning + suggestion chip. Live-verified; a
  corrective migration revoked an MCP-default `anon` grant (the "MCP RPCs inherit anon EXECUTE" lesson).

## 2026-06-02 — Profile photos, display names, account password

- **Profile photos + display names** (3-part, migration `…213758`): avatar upload (cropper → 512px WebP →
  `POST /api/account/avatar` → deterministic `avatars/<id>/avatar.webp`, zero orphans by construction); the
  `/account` display-name editor (dropped the email-prefix fallback + a one-time backfill); the guest
  "Hosted by" avatar+name byline. Live-verified (R2 held at exactly 1 object through replace; 415/422 on
  bad bytes).
- **Account email + password** (ADR-0011, migrations `…200420` + `…210158`): a traditional email+password
  login alongside OTP/magic-link/Google. Headline live catch: GoTrue writes a non-null bcrypt PLACEHOLDER
  for OTP/magic-link signups, so the first `has_password()` mislabeled OTP-origin hosts → fixed with a
  service-role `password_set_at` flag stamped by `mark_password_set()`. Full Chrome-MCP matrix verified
  (create → set → login; generic anti-enumeration error; CHANGE-mode re-check; OTP-origin add-password).
- **Resend custom SMTP**: auth emails route via Resend SMTP (lifts the built-in ~2/hr cap that blocked live
  OTP); per-IP auth limits raised 30 → 150 / 5 min.

## 2026-06-01 → 06-02 — Config / permissions rework (ADR-0007/0008/0009)

- **Phase 1 — 3-state access + Pro password** (`ea02f32`+`c0721bc`, ADR-0007): `is_public` → an
  `event_visibility` enum (open/password/private); Pro password gate (bcrypt via
  `set/clear_event_password`; the anon `verify_event_password`; a signed unlock cookie; password media via a
  cookie-guarded server admin-read). Phone-verified.
- **Phase 2a — video Pro-only** (`6bdd0bd`): a `tier='free'` video gate at the top of the tier-caps block
  in both upload RPCs + an advisory `video_blocked` flag. Live-verified (guest video presign → 403).
- **Phase 2b — drop guest display names** (`6d33e3b`): removed `guests.display_name` +
  `events.require_display_name`; `create_guest` → 2-arg; the just-in-time join is now field-less + silent.
- **Phase 2c — verified-email OTP** (`2b389d6`, ADR-0008): "require email" = a verified email (native OTP);
  `create_guest` derives identity from `auth.uid()`; new `guests.user_id` (account-from-guest); a shared
  `<EmailSignIn>`. Caught live: the Supabase Email-OTP length was 8 vs a 6-slot input → pinned to 6
  (`OTP_LENGTH`).
- **Phase 3 — saved events** (`7ab930f`, ADR-0009): a signed-in visitor can save any event (FREE growth
  driver); `save_event`/`get_saved_events` (authenticated-only; visibility-masked); the always-visible Save
  button + the post-upload `<SaveAccountPrompt>` (replaced the newsletter prompt). Full account-from-guest
  loop live-verified end-to-end.

## 2026-06 — One-link consolidation (ADR-0010) + host upload

- **One link per event** — Part 1 (data + routing, `37707d8`): collapsed the two-token model to
  `/e/[qr_token]`; dropped `get_public_album` + the `share_token` column + the `/a/` route (anon advisor
  list 9 → 8). Part 2 (flow redesign, `d4b0902`): header → `[Save event] [Invite]` action row → upload →
  gallery, contiguous; uploads-off = the view-only state; `needsEmailVerification` gated on
  `accepting_uploads`. Full cross-state matrix live-verified.
- **Host-side media upload** (`06554ff`): the host adds media from the event page via `create_media_as_host`
  (authenticated twin of `create_media`; counts against caps; `status='approved'`; `guest_id=NULL`). Shared
  `uploadFile` + `/api/host/r2/*`. Live-verified (new row `guest_id=NULL`, `storage_used_bytes` +103).
- **Unified guest event page** (`f073451`) + the album lightbox + per-item download (`8a4f3ae`).

## 2026-06-01 → — Admin / operations portal (R1–P7)

Served on `admin.partyreel.com` by the same app; one `requireAdmin`/`requireAdminAction` seam + free TOTP
MFA (AAL2); host-isolated cookies.
- **R1 — perimeter + auth** (`8c7a237` host-aware callback, `21a9526` #418 fix, `c44536d` QR): subdomain
  routing, the seam, lockout-proof MFA, `AdminShell`, report review moved to `/admin/reports`.
- **R2 — Sentry** (`7d997cb`): `@sentry/nextjs` app-wide, DSN-gated no-op, on-error Session Replay
  (media-blocked, text-masked), manual captures only at swallowed paths. Live-verified via a deliberate
  bad-signature webhook → issue with `area:webhook` + clean PII.
- **P3 — support & moderation inbox** (`e0903c2`): `/admin/support` + `/admin/applicants` triage +
  Reports Open/All filter.
- **P4 — accounts & billing** (`9282aa6`): read-only host browser + tier/sub/active-storage/Stripe deep-link.
- **P5 — proactive album moderation** (`d812ccc`): cross-event uploads feed + drill-in + soft-remove/restore.
- **P6 — metrics** (`53c82b3` numbers + live Stripe revenue; `7dce416`/`bb460b6` recharts charts).
- **P7 — nav dropdown + operator-alerts bell + announcements compose/publish** (`b1df0d7`). The
  blog/help/careers CMS was deferred (content stays file-based).

## 2026-05 — Marketing site build-out + polish arc

- **7-round build-out**: foundation (nav single-source, config-driven header + mobile Sheet, footer,
  JSON-LD, the `#FB4817` accent) · `/features` · `/events` (hub + 4 type pages) · `/contact` (ADR-0005) ·
  `/careers` · `/help` (the MDX content pipeline, ADR-0006) · `/blog` (+ RSS, on the generalized
  `collection.ts` core). All deployed + Chrome-tested.
- **Polish arc (5 rounds + follow-ups)**: "Use cases" → "Events"; the media-frame library +
  `/features` retrofit; the interactive demo (env-gated `NEXT_PUBLIC_DEMO_QR_TOKEN`); event landing-page
  retrofit; the home pass; the enriched `/events` hub; and the whole-app em-dash sweep + the AST guard
  (`no-em-dash-policy.test.ts`).

## Foundational build (Phases 0–4 + 6) — pre-2026-06

The v1 foundation: the Supabase-native data layer + RLS (ADR-0001), the single-app route groups
(ADR-0002), browser→R2 presigned uploads (ADR-0003), anonymous-guest capability tokens (ADR-0004), host
auth + the create flow, guest join/upload + galleries, moderation + the purge-cron lifecycle, the
storage-cap tier model + Stripe (Pro subs, Event Pass, portal), and the growth loop (SEO + guest email
capture) + link analytics + the notification center. Full detail is in git history + the ADRs.
