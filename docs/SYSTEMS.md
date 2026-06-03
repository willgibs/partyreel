# Partyreel — Systems & feature reference

> **The map of what Partyreel _is_.** One entry per system/feature: what it does, where it
> lives, and the invariants you must not break. This is the doc to skim when a goal lands —
> find the relevant system, follow it to the files. For _how to work in this repo_ (commands,
> stack, gotchas, DRY single-sources, security guardrails) read [`CLAUDE.md`](../CLAUDE.md);
> for the product _why_ read [`PRD.md`](PRD.md); binding decisions are in [`adr/`](adr/); the
> live "you-are-here" + human blockers are in [`STATUS.md`](STATUS.md); deferred work is in
> [`ROADMAP.md`](ROADMAP.md).

The **core loop**: host creates an event → gets a QR → guests scan & upload (no app, no
account) → host curates → public album → guests become future hosts. Phases 0–4 + 6 shipped
and are verified in production; Phase 5 (highlight reel) is scaffold-only.

## Shape

One **Next.js 16** app (App Router, `src/`, TS, Tailwind v4) on one domain. Route groups:
`(marketing)` public site · `(auth)` login/callback · `(app)` the gated host app · `(guest)`
the token surfaces · `api/` route handlers. Data in **Supabase** (Postgres + RLS + capability
RPCs); media in **Cloudflare R2**; payments **Stripe**; email **Resend**. Full routing map +
DRY single-sources table: [`CLAUDE.md`](../CLAUDE.md).

---

## Auth & host accounts

Supabase Auth — **email + password, email magic-link/OTP, and Google OAuth** (`(auth)/login`, `/auth/callback`). The
`(app)` layout ([layout.tsx](../src/app/(app)/layout.tsx)) is the single gate: `getUser()`
(NOT `getSession()`) → redirect `/login` if anon. `handle_new_user` trigger creates a
`profiles` row on signup (one row per `auth.users` row). Clients:
`src/lib/supabase/{client,server,middleware,admin}.ts`. **Identity linking:** Supabase
**auto-links identities that share a _verified_ email into ONE user** — so magic-link +
Google for the same email land on the same account + `profiles` row (it refuses to link an
_unverified_ email, anti-takeover; **SSO is the only non-linking exception** — not used here).
Caveat: matching is exact-string, so Gmail dot/plus aliases (`will.g+x@…`) are distinct users.
**Email + password ([ADR-0011](adr/0011-email-password-auth.md))** is an additional credential on that
same `auth.users` row (Supabase-managed `encrypted_password`; no app column) — so the account is
reachable through every path interchangeably. `/login` leads with password ([password-sign-in.tsx](../src/components/auth/password-sign-in.tsx);
code + Google are the alternatives; "Create account" = OTP-verify then set; forgot = reuse OTP →
`/account?reset=1`). The **`/account`** page (UserMenu → Account) sets/changes the password via
`updateUser` on the browser client, with a `verify_current_password` RPC re-confirming the old password
before a change (first-time set needs only the session). `has_password` / `verify_current_password` are
authenticated-only SECURITY DEFINER RPCs (return booleans; the hash never leaves the DB). The shared
`<EmailSignIn>` is reused UNCHANGED (guests still get the frictionless code-first path).
**Guest email capture is NOT an auth account** (just `guests.email` + `newsletter_signups`) — a
guest who later signs up creates their first real account then (see the v2 "guest → full-user
conversion" item in ROADMAP).
**Profile photos (avatars)** — a host uploads an avatar on `/account`
([account-avatar-form.tsx](../src/components/app/account-avatar-form.tsx) + an interactive circular
[avatar-cropper.tsx](../src/components/app/avatar-cropper.tsx)): the image is cropped + re-encoded to a
512px WebP CLIENT-side, POSTed to **`/api/account/avatar`** (raw blob; the bytes bypass `create_media`,
since avatars aren't event media — no cap/ledger), validated server-side (content-type + size +
magic-byte WebP sniff, so no SVG/XSS), then PUT to a DETERMINISTIC R2 key **`avatars/<id>/avatar.webp`**
([avatarObjectKey](../src/lib/r2/keys.ts)). Overwrite-on-replace ⇒ exactly one object per user ⇒ **zero
orphans by construction** (the purge cron's media sweep only scans `events/`); DELETE removes the R2
object **then** clears the marker (R2-first — the single orphan-prevention rule). `profiles.avatar_updated_at`
is the existence marker (service-role-write-only, written by the route's admin client so it stays in
lockstep with R2); when set, the server presigns a short-TTL GET ([avatar-url.ts](../src/lib/r2/avatar-url.ts))
for the `<Avatar>` in the account card AND the **UserMenu** (radix `AvatarImage` auto-falls-back to the
initial letter when the src is null/fails). This is part one of the (now complete) 3-part profile-photos
build; the other two: the `/account` **display-name editor** (next paragraph) and the guest **"Hosted by"
byline** — on `/e/[qr_token]` ([event-experience.tsx](../src/components/guest/event-experience.tsx)) the
host's photo shows next to their name (the photo ONLY if an avatar exists — no initials fallback in the
guest context — and the whole line only when a real name is set), fed by a server-only admin read
[`getHostAvatarUrl`](../src/lib/db/queries/guest-events-admin.ts) that presigns the host avatar by
`events.host_id` + `profiles.avatar_updated_at` WITHOUT touching the anon `get_event_by_qr_token` RPC
(no contract change; `host_id` rides only inside the avatar's presigned URL path, like media keys).
**Display names** — `/account` has a Display name field
([display-name-form.tsx](../src/components/app/display-name-form.tsx) → `updateDisplayNameAction`, a plain
RLS self-update; an empty value clears it to null). `handle_new_user` NO LONGER falls back to the email
local-part (Phase 2 migration + a one-time backfill that nulled rows where `display_name` == the email
local-part), so a null `display_name` genuinely means "not set" — which is what the guest "Hosted by"
byline (Phase 3) keys off. Google/OAuth still populate it from `full_name`; every other `display_name`
reader already falls back to the email.
**Invariant:** `profiles` is host-writable only on `display_name, email, announcements_seen_at,
welcomed_at` (the `grant update(...)` allowlist); `tier`/`storage_*`/`is_admin`/`stripe_*`/`avatar_updated_at`
are service-role / webhook only.

## Events & the create flow

`events` (host_id, opaque `qr_token` (DB-generated; the single event link, ADR-0010), `moderation_mode`,
`visibility` (`open|password|private`, ADR-0007) + `event_password_hash` (bcrypt; never
client-read), `accepting_uploads`, `require_email`, `qr_style`, `custom_slug` (optional Pro alias,
ADR-0012), `deleted_at`/`purge_at`). The **sole create path** is the **`/dashboard/new` wizard**
([create-event-wizard.tsx](../src/components/app/create-event-wizard.tsx)) — Details → QR
design → Share — which creates **once at commit** via the non-redirecting `createEventInWizard`
([actions.ts](../src/app/(app)/dashboard/actions.ts)) so the Share step can show the real QR +
album link. Settings are edited later on the event page ([event-settings-form.tsx](../src/components/app/event-settings-form.tsx),
**not auto-save**). `enforce_event_limit` trigger guards `MAX_EVENTS`. **Events have no end
date** — deletion is the only lifecycle exit (anti-abuse).

## Custom event link (slug)

Pro / Event-Pass hosts can set an optional **custom slug** — a human-friendly ALIAS for the one
event link, `/e/<slug>` (e.g. `/e/sarahs-wedding`), editable anytime (ADR-0012). The permanent
`/e/<qr_token>` link never changes and the QR always encodes it; the slug is NOT a second
capability. `events.custom_slug` (nullable, case-insensitively unique among non-deleted events via
a partial index, RPC-write-only) is set/cleared by `set_event_slug` / `clear_event_slug`
(authenticated-only SECURITY DEFINER, tier-gated — the `event_password_hash` pattern).
`get_event_by_qr_token` resolves `qr_token OR custom_slug` (token wins) and returns the **canonical
qr_token**, which the guest page threads to every downstream qr-keyed RPC (media poll, `create_guest`,
`save_event`, `create_report`, `verify_event_password`) so a slug arrival behaves exactly like a token
arrival. Editing/removing a slug (or deleting the event) frees it for other events immediately (no
old→new redirect). Validation + a reserved-word list live in
[event.ts](../src/lib/validation/event.ts) + [reserved-slugs.ts](../src/lib/constants/reserved-slugs.ts);
the host UI is [event-slug-control.tsx](../src/components/app/event-slug-control.tsx) in the "Share with
guests" card (set / change / remove) AND reused verbatim in the create wizard's Share step. It has
**debounced live availability** as you type (idle → checking → available / taken / invalid, via the
authenticated `check_slug_available` RPC called straight from the browser with a request-id race guard;
the synchronous classification is the pure `evaluateSlugInput` in [slug.ts](../src/lib/slug.ts)), a
**change/remove warning dialog** (both break the live link, so both confirm), and a name-derived
**suggestion chip** (`suggestSlug`). Downgrade keeps the slug resolving + removable but not changeable
(mirrors password).

## QR designer

In-app QR styling so hosts never leave for an external stylizer. **`qr-code-styling`** (must be
dynamic-imported inside `useEffect` — SSR `window` access). Preset set single-sourced in
[qr-presets.ts](../src/lib/constants/qr-presets.ts) (`classic`/`bold`/`rounded`/`dots`),
persisted on `events.qr_style` (plain text column, app-validated — not a DB enum, so presets
grow without a migration). Components: `StyledQr` (renderer) → `QrPresetPicker` (reused by the
wizard) → `EventQr` (+ SVG/PNG download) → `QrDesignerDialog` ("Customize" on the event page).
**Invariant:** presets keep DARK modules on WHITE for scannability; brand color only tints
corner finders.

## First-time host welcome

A streamlined full-page **`/welcome`** intro (NOT a coachmark overlay): 3 steps → the create
wizard ([welcome-flow.tsx](../src/components/app/welcome-flow.tsx)). Auto-shown **once** to new
accounts via `profiles.welcomed_at` (the `/dashboard` page redirects when null via
[welcome.ts](../src/lib/welcome.ts) `shouldShowWelcome`; existing hosts were backfilled). Every
exit calls `markWelcomed` **before** navigating (no redirect loop). "How it works" copy is
single-sourced with the marketing page ([how-it-works.ts](../src/lib/constants/how-it-works.ts)).

## Guest join + upload (the core loop)

`/e/[token]` ([page](../src/app/(guest)/e/[token]/page.tsx)) — the scanned-QR landing page is one
**unified, formal event page** ([event-experience.tsx](../src/components/guest/event-experience.tsx)):
minimal **auth-aware header** (logo + a quiet "Start for free" CTA when signed out, the visitor's
**account menu** when signed in — [guest-header.tsx](../src/components/guest/guest-header.tsx)) + the event header, then a quiet
**`[Save event] [Invite]` action row** (one-link Part 2; ADR-0010), the **upload panel** (only when
accepting), and a **live gallery** below — contiguous, with no share wedged between upload + gallery.
The opaque `qr_token` IS the authorization
(ADR-0004). **State follows `visibility` (ADR-0007):** `private` → a **locked screen** (master
lock — no name/gallery/upload); `password` → a `<PasswordGate>` (name shown) until a signed unlock
cookie, then the full experience (media via the server admin-read); `open` → the full experience;
`accepting_uploads=false` → the **view-only state** of the one page: the upload panel is removed
entirely (a quiet "uploads closed" line in its place), leaving the action row + gallery. **Joining is just-in-time + SILENT** —
a first-time guest picks files and `create_guest` issues a `session_token` (localStorage,
returning-guest) behind the scenes; guest names are gone (Phase 2b). A **`require_email`** event is
instead gated at the PAGE level before the upload panel renders (Phase 2c, ADR-0008) — but ONLY when
uploads are on (the RSC gates `needsEmailVerification` on `accepting_uploads`, so a closed event stays
view-only with no verify prompt; one-link Part 2): `/e/` swaps the
upload slot for `<VerifyEmailPrompt>` (the shared `<EmailSignIn>` OTP — 6-digit code + magic-link
fallback), the gallery still shows; on verify, `create_guest` derives identity from `auth.uid()` and
stamps `guests.user_id` (account-from-guest). Upload is **browser → R2
direct** (single PUT < 100 MB else multipart) via `/api/r2/presign-upload` + `/api/r2/complete-upload`;
`create_media` writes the row + ledger + enforces caps; `get_upload_context` is the presign-time
pre-check. The **live gallery** seeds from an SSR batch then **polls `/api/guests/gallery` every
~12 s** (paused when the tab is hidden) + refetches on each upload; a guest's own LIVE uploads show
**optimistically** at the top (local blob, deduped against the poll by media id —
[merge-gallery-items.ts](../src/lib/guest/merge-gallery-items.ts)). Gallery media come from the new
**`get_event_media_by_qr_token`** RPC (approved, newest-first, gated `visibility='open'` — a
password event's media comes from the server admin-read instead); it's qr-keyed (the single event link; ADR-0010). The **Invite**
action ([guest-share.tsx](../src/components/guest/guest-share.tsx)) is one button in the action row → a
dialog holding the event QR + Copy link + native Share + Download; the link IS the JOIN link, so invited
guests can view AND upload. R2 presign via the shared `toGridItems` ([src/lib/r2/](../src/lib/r2/)).

## Galleries

**Two surfaces share `MediaGrid` + the lightbox:** the host event page and the **guest event page
`/e/[token]`** (live + polling — see "Guest join"; with uploads off it reads as a view-only album). All **presign R2 keys server-side** (`presignDownload`, 1 h TTL; via the shared
`toGridItems`) and are `force-dynamic`; raw R2 keys/URLs are NEVER exposed to the browser (ADR-0003).
The always-dark `gallery` surface is now UNUSED as a full page (Part 2's view-only state shipped as a panel-removal on the themed event page, not a dark redesign; ADR-0010) — its `--gallery` tokens persist for the lightbox backdrop + `SaveEventButton`'s `tone="gallery"`, and keep media the hero: they stay dark in **every** theme (the `--gallery` tokens are never overridden in `.dark`), independent of the **global Light/Dark/System theme toggle** in the host account menu ([user-menu.tsx](../src/components/app/user-menu.tsx), next-themes `.dark` class). Tiles open a shared **lightbox**
([media-lightbox.tsx](../src/components/shared/media-lightbox.tsx)) — full-screen view, ←/→ +
keyboard nav, chevrons, **mobile swipe** (peek-the-neighbor; see the lightbox gotchas in CLAUDE.md),
video playback, and a **Save** that downloads the original. **Download = a SECOND
presign of the same key with `ResponseContentDisposition: attachment`** (`presignDownload`'s
`downloadFilename`, named by [download-filename.ts](../src/lib/media/download-filename.ts)); the
browser `download` attr can't force a cross-origin R2 save — the signed disposition does (so no
bucket-CORS change). Both grids (public `MediaGrid` + `HostMediaGrid`) wrap each tile in a button
that opens the lightbox; **video tiles render controls-less thumbnails** (a controls-less `<video>`
is non-interactive → button-legal; it plays with controls inside the lightbox). **No new security
surface** — same approved media, same capability boundary (qr_token / host RLS). Host **bulk-zip
download is deferred** (ROADMAP).

## Moderation & curation

`media.status` enum `pending | approved | hidden | removed`; `create_media` sets
`pending`/`approved` from the event's `moderation_mode`. Host grid
([host-media-grid.tsx](../src/components/app/host-media-grid.tsx)) does per-item
Approve/Hide/Unhide/Remove + a **Pending review** queue (Approve all) for `hold_for_approval`
events. Mutations: `setMediaStatus`/`removeMedia`/`approveAllPending`. **Remove is soft**
(`status='removed'` + `removed_at`) — frees the slot immediately; the cron reclaims after a
7-day grace.

**Host upload (two-way media).** The host can also add media directly from the event page (e.g. a
photographer's batch), not just curate guest uploads. An "Add photos" toggle in the Uploads card
header ([event-uploads.tsx](../src/components/app/event-uploads.tsx)) reveals a dropzone
([host-upload.tsx](../src/components/app/host-upload.tsx)) that reuses the shared `uploadFile` against
authenticated **`/api/host/r2/{presign,complete}-upload`** routes. These call the
**`create_media_as_host`** RPC — the AUTHENTICATED twin of `create_media` (auth's via `auth.uid()` +
event ownership, NOT a capability token): same per-file limits + cap/ingress enforcement (host uploads
**count against the plan**), but `status='approved'` always (the host is the moderator) and
`guest_id = NULL` (**host upload = `guest_id IS NULL`**). It is `authenticated`-only (never anon).
Host and guest media are indistinguishable in the grid/album (one seamless album); the component
`router.refresh()`es after a batch so new rows appear.

## Lifecycle & the purge cron

[`/api/cron/purge`](../src/app/api/cron/purge/route.ts) — daily (`0 4 * * *`), timing-safe
`Bearer $CRON_SECRET` (Vercel auto-sends it). **7 sweeps**: expired_events, removed_media,
orphans, expired_passes, over_capacity, renewal_nudges, inactive_free_events (each
independently try/caught). `purge_media_rows` RPC does the atomic R2-then-row reclaim +
`storage_used_bytes` decrement (**service-role-only**, must stay REVOKED from anon). Soft-delete
stamps `purge_at = deleted_at + 60d` (recoverable tail). **Three counters are deliberately
different — don't reconcile:** per-event slot counts non-removed; the monthly `storage_ledger`
NEVER decrements (churn defense); `storage_used_bytes` drops only on hard-delete. R2 helpers:
[delete.ts](../src/lib/r2/delete.ts) (`parseMediaIdFromKey`).

## Storage caps, tiers & payments

**Storage-cap model** (not item counts): a tier = a total stored-bytes cap. **Single source**
[tiers.ts](../src/lib/constants/tiers.ts) (Free 2 GB; Pro 100/500/2048 GB; Event Pass 75 GB)
must mirror the SQL `tier_limits()` (a Vitest parity test guards it). `create_media` enforces
`cap + 10% overflow buffer` + a **monthly ingress meter** (`storage_ledger.cumulative_bytes`,
never refunds — the real anti-abuse guard). **Video is Pro-only** (Phase 2): a `tier='free'` gate at
the top of the tier-caps block in BOTH `create_media` + `create_media_as_host` rejects `type='video'`
(a free event is photos-only for guests AND the host); `videosAllowedForTier` (client) + an advisory
`video_blocked` flag (`get_upload_context`/`get_host_upload_context`) drive the upload UI. **Stripe**
(`/api/stripe/{checkout,portal,webhook}`):
the **raw-body webhook is the SOLE writer** of `tier`/`storage_cap_bytes`/`stripe_subscription_id`
(via the admin client; idempotent, pure `resolveSubscriptionUpdate`). Price↔plan map +
env-driven Price IDs in [src/lib/stripe/](../src/lib/stripe/) (NOT in the client-safe `tiers.ts`).
**Event Pass** = one-time `mode:payment` → `tier_expires_at`. Over-capacity retention = 45-day
grace → largest-first auto-reduce into the removed tail. Detail: [PRICING.md](PRICING.md).

## Transactional email & lifecycle nudges

**Resend** (`resend` dep). **Always send via `sendOnce({ kind, dedupeKey, … })`**
([send.ts](../src/lib/email/send.ts)) — it CLAIMS a `sent_emails` row (unique `(kind,
dedupe_key)`) before sending, so the daily cron can call it every run and Resend is hit at most
once per state (free-tier frugality). Templates: [templates.ts](../src/lib/email/templates.ts).
Lifecycle emails: over-cap grace/reduced, renewal nudge (14 d pre-expiry, shared
`RENEWAL_NUDGE_DAYS`), free-tier inactivity warn/remove. **Needs `RESEND_API_KEY` + `EMAIL_FROM`
+ a verified sending domain** (human task — see STATUS).

## Safety (reports / operator review)

`create_report` RPC (anon capability-token, **insert-only, never auto-hides**) + a discreet
report dialog on the public album. Operator review in the **admin portal** (`/admin/reports`; see
"Admin / operations portal") — dismiss/action on open reports, plus an Open/All history view (resolved
reports read-only). `reports` is RLS **deny-all** (operator-internal).
v1 is reports/review only — **no scanner/NSFW filter** (v2+).

## Admin / operations portal

Internal tool for running Partyreel, served on the **`admin.partyreel.com` subdomain by the SAME
Next app** (route segment [src/app/admin/](../src/app/admin) with its own `AdminShell` chrome,
distinct from the host `AppShell`). Three hard gates, all behind ONE seam
([admin-context.ts](../src/lib/auth/admin-context.ts)): `getUser()` + `profiles.is_admin` + **AAL2
(app-based TOTP MFA, free)**. `requireAdmin()` (pages/layouts: anon → login, non-admin →
`notFound()` 404, leak-proof) and `requireAdminAction()` (actions/routes: returns an `ActionResult`,
**requires AAL2** for writes) are the only entry points — **never read `is_admin` directly**; this
is the single seam a future `staff_members`+roles model swaps into (solo admin now, team later).
**Perimeter:** the proxy ([proxy.ts](../src/proxy.ts)) redirects the subdomain root → `/admin`; the
layout host-guards so the **apex 404s `/admin`** (existence never leaks); admin auth cookies are
**host-isolated** (separate login at the subdomain — `@supabase/ssr` cookies are host-only; never set
a `.partyreel.com` cookie domain). Login is **host-aware** ([login-form.tsx](../src/components/auth/login-form.tsx))
so the subdomain keeps its own session + deep-links to `/admin`. MFA enroll/step-up
([mfa-enroll.tsx](../src/components/admin/mfa-enroll.tsx)/[mfa-challenge.tsx](../src/components/admin/mfa-challenge.tsx))
are **lockout-proof** (reachable at AAL1; break-glass = delete the factor in the Supabase dashboard /
`auth.mfa_factors`). Surfaces today: **Support** + **Applicants** (P3 triage of `contact_submissions` /
`job_applications` — status `new`/`in_progress`/`closed` single-sourced in
[triage.ts](../src/lib/constants/triage.ts) + a DB CHECK, reply-from-inbox `mailto`, `handled_by`/
`handled_at`, server-rendered status filter, Overview count badges), **Reports** (the review queue with
an Open/All history filter, resolved rows read-only), **Accounts** (P4 read-only host browser: search by
email/name, and a detail view of tier + subscription/Event-Pass state + ACTIVE storage vs effective cap +
the raw `storage_used_bytes` counter + event/media counts, plus a test/live-aware Stripe customer
deep-link for any billing change), **Albums** (P5 proactive moderation: a recent-uploads feed across all
events + an album drill-in, with direct soft-remove + restore within the grace), **Metrics** (P6 platform
analytics: KPIs across accounts / content / engagement / growth + live Stripe revenue, with trend +
distribution charts), **Announcements** (P7 operator compose/publish to the host notification bell), and
**Security** (MFA status). The 8+ surfaces are reached via a **single header dropdown** (P7,
[admin-nav.tsx](../src/components/admin/admin-nav.tsx), `usePathname` active-section), and a header
**operator-alerts bell** ([operator-alerts.tsx](../src/components/admin/operator-alerts.tsx)) surfaces
pending work (new support / applicants / open reports) portal-wide from the existing count queries.
Triage status
writes go through `requireAdminAction` + the service-role admin client (deny-all tables); shared
`TriageStatusControl` + `TriageFilter`. **Accounts is READ-ONLY** (no writes, no migration): service-role
reads in [queries/accounts.ts](../src/lib/db/queries/accounts.ts) (the only cross-host `profiles` reader —
RLS scopes `profiles` to the owner, so the admin client is the sole path), with ACTIVE storage reusing the
over-capacity sweep's exact query (non-removed media in non-deleted events); the Stripe deep-link is the
pure, unit-tested `buildStripeCustomerUrl` ([dashboard.ts](../src/lib/stripe/dashboard.ts), test/live
derived from the `STRIPE_SECRET_KEY` prefix server-side, never exposing the key). The **Stripe webhook
stays the SOLE writer** of tier/cap/subscription. **Albums** (proactive moderation) is the operator's
direct counterpart to the reactive Reports queue: cross-host media reads via service-role
([queries/moderation.ts](../src/lib/db/queries/moderation.ts) — the only cross-host media reader, RLS
scopes media to the owning host), presigned for render through the shared `toGridItems`/`MediaTile`/
`MediaLightbox` path. Soft-remove reuses the reports "Action" shape (`status='removed'` + `removed_at`,
the 7-day purge cron reclaims) and **restore** clears `removed_at` (→ `approved`); both go through
`requireAdminAction` (AAL2). No migration, no new RPC, no new grants (a soft-remove is a plain
status/removed_at update). Soft-remove pulls the item from every public album/gallery instantly (those
reads already exclude `status='removed'`); immediate hard-purge for egregious content is deferred.
**Metrics** (P6a) is a platform-wide dashboard: one service-role aggregator
([queries/metrics.ts](../src/lib/db/queries/metrics.ts)) rolls existing tables up via cheap `head:true`
counts + small column fetches fed to PURE, unit-tested reducers ([lib/metrics/aggregate.ts](../src/lib/metrics/aggregate.ts)),
so it stays **migration-free**; "Media" inner-joins events so active-media stays consistent with the
active-events count. **Revenue is read LIVE from Stripe** (the source of truth, vs the lossy synced tier):
a best-effort `getPlatformRevenue` ([stripe/revenue.ts](../src/lib/stripe/revenue.ts)) returns MRR (the
pure `computeMrrCents`, interval-normalized) + balance, or null → a graceful "unavailable" card. **Charts
(P6b)** are `recharts` line + bar wrappers ([metrics-charts.tsx](../src/components/admin/metrics-charts.tsx),
grayscale + the coral accent via CSS-var tokens); their per-day trends come from the SAME fetched rows via
pure builders (no new query). recharts `ResponsiveContainer` is seeded with a positive `initialDimension`
so its first paint is valid (no "width(-1)/height(-1)" warning); `react-is` is pinned to React 19 via a pnpm override
(the zod-override pattern). **Announcements (P7)** is the operator compose/publish surface for the
EXISTING `announcements` table (the operator used raw SQL before): an AAL2-gated action
([announcements/actions.ts](../src/app/admin/announcements/actions.ts)) inserts via the service-role
client (the table has no host write policy), validated by the shared zod schema; a future `published_at`
= scheduled (the host read RLS hides it until then). Hosts read it via the UNCHANGED notification center.
Error
tracking is **Sentry** (free tier — see ROADMAP "Admin portal" R2), not an in-portal log. Gated by `NEXT_PUBLIC_ADMIN_HOST` (unset in dev → `/admin` reachable directly
on localhost, though auth/MFA only complete on the live subdomain).

## Observability (Sentry error tracking)

App-wide error tracking via **`@sentry/nextjs`** (free Developer tier; see ROADMAP "Admin portal" R2).
**DSN-gated:** `NEXT_PUBLIC_SENTRY_DSN` unset → `enabled: false` no-op, so dev + an unconfigured build
stay green (mirrors `assert*Env`). Wiring: [instrumentation.ts](../src/instrumentation.ts) (`register()`
+ `onRequestError = captureRequestError`, which **auto-captures unhandled throws** in route handlers,
Server Components, and the proxy), [instrumentation-client.ts](../src/instrumentation-client.ts) (browser
init + Session Replay), and `src/sentry.server.config.ts` / `src/sentry.edge.config.ts` — all spread one
**`commonInit`** ([lib/observability/sentry.ts](../src/lib/observability/sentry.ts), the single source
for DSN + sampling + the `scrubEvent` PII `beforeSend`). `next.config.ts` wraps with `withSentryConfig`
(`useRunAfterProductionCompileHook` = Turbopack **post-build** source maps, needs `@sentry/nextjs`
≥10.13; upload gated on the build-time `SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT`, so it builds
without creds). **Scope:** errors (always) + **10% tracing** + **on-error Session Replay**
(`replaysOnErrorSampleRate: 1`, session 0; `blockAllMedia` + `maskAllText` so guests' photos + typed text
are never recorded). **Manual captures go ONLY where errors were swallowed** (everything else rides
`onRequestError`), via `captureError(area, err, extra?)` / `captureWarning(area, msg, extra?)` (coarse
`area` tag): the upload finalizer's `completeMultipartUpload` catch, the Stripe webhook's provisioning
failures + a signature warning (**never re-reads the raw body**), all 7 purge-cron sweeps (a `runSweep`
helper), and the admin report-action DB errors. **Invariants:** keep Sentry **out of `src/lib/db/*`**
(capture at route/action entry points); `sendDefaultPii: false` + `scrubEvent` strips presigned-URL
query strings + emails. Engineering errors → Sentry; operator upload-safety review → the reports queue
(the portal links out to Sentry, no embedded viewer).

## Marketing site

Public `(marketing)` route group on the shared domain. Nav is a single source
([marketing-nav.ts](../src/lib/constants/marketing-nav.ts)) consumed by the config-driven
[marketing-header.tsx](../src/components/marketing/marketing-header.tsx) (desktop dropdowns + a
mobile `Sheet` menu — both in the client [marketing-nav.tsx](../src/components/marketing/marketing-nav.tsx))
and the multi-column [marketing-footer.tsx](../src/components/marketing/marketing-footer.tsx); both
render only **live** routes and grow per round. SEO: Org/Website/Breadcrumb JSON-LD
([jsonld.tsx](../src/components/marketing/jsonld.tsx)) + a single `SITE_URL`/brand constant
([site.ts](../src/lib/constants/site.ts)) now shared by `sitemap.ts` / `robots.ts` / root
`metadataBase`. **Brand = the app's design system turned up**: grayscale UI + the single `#FB4817`
accent (`--brand`), media is the color; marketing runs louder via type/layout/motion only (motion
follows the in-repo `emil-design-eng` skill). Text face is **Inter** with tightened heading tracking
(global `--tracking-tight` override). **Media-frame library** (polish-arc Round 2) lives in
[components/marketing/frames/](../src/components/marketing/frames) — a `BrowserFrame` base + a *vocabulary*
of distinct decorative frames (`AlbumFrame`, `GalleryFrame`, `ReelFrame`, `PhoneFrame`,
`QrFrame`) sharing the grayscale + sparse-`bg-brand/15` tokens; consumed by `/features` + the event pages
(never one visual reused). **Pages:** **home** (**R5 home pass**: the `FeatureHighlights` teaser leads
with a `GalleryFrame` spotlight + a benefit list, and the Events teaser renders the shared
**`EventFrameCards`** — the SAME frame-preview cards as the `/events` hub, single-sourced in
[event-frame-cards.tsx](../src/components/marketing/event-frame-cards.tsx) so they never drift; the hero
(`AlbumFrame`) + `ReelTeaser` (`ReelFrame`) were already framed, so the home now alternates frame
arrangements: hero → gallery-spotlight → event cards → reel-spotlight), **`/features`** (capability deep-dive — copy single-sourced
in [features.ts](../src/lib/constants/features.ts), which also feeds the home `FeatureHighlights` teaser;
**retrofitted (R2)** from 5 identical card grids into varied, frame-rich sections — a QR hero + phone /
gallery / album spotlights (`FeatureSpotlight` + the `FEATURE_PRESENTATION` map in
[features-layout.ts](../src/lib/constants/features-layout.ts), guarded so every group is styled) + the
`ReelTeaser` marquee + a bespoke privacy panel + a storage keepsake pair. `QrFrame` takes a
`liveQrUrl?` — set (R3, see **Interactive demo** below) it renders a REAL scannable QR (the client
[live-qr.tsx](../src/components/marketing/frames/live-qr.tsx) wrapping `StyledQr`) linking to the demo;
unset it falls back to the decorative block), **`/events`**
(the "Events" section, renamed from "Use cases" in the polish arc: hub + 4 umbrella landing pages —
weddings/parties/conferences/trips — off ONE `[slug]` template; copy single-sourced in
[events.ts](../src/lib/constants/events.ts) as `EVENT_TYPES`/`getEventType`/`EVENT_TYPE_SLUGS` —
`EVENT_TYPE*` avoids colliding with the real `events` domain — feeds the home section + the `Events ▾`
dropdown; per-slug `next/og` card + breadcrumb/FAQ JSON-LD. **Retrofitted (R4)** so no two event
pages look alike: each type gets a DISTINCT hero frame AND a DISTINCT "Built for X" layout, mapped in
`EVENT_PRESENTATION` ([events-layout.ts](../src/lib/constants/events-layout.ts) — the events analogue of
`FEATURE_PRESENTATION`, a flat record since every type fills the same two slots; guarded by a coverage
test) — weddings→album/bento, parties→phone/rows, conferences→qr(decorative)/quadrants, trips→reel/timeline.
The `eventFrame(frame, variant)` resolver ([event-frame.tsx](../src/components/marketing/event-frame.tsx))
renders the right frame for BOTH the hero and the **frame-preview hub** (each `/events` card previews its
type's frame in a fixed-height "stage" so the cards align despite the frames' different aspect ratios — no
transform-scale; the QR path stays decorative, never `liveQrUrl`); `BuiltFor`
([built-for.tsx](../src/components/marketing/built-for.tsx)) switches the 4 benefit layouts off one data
shape. The **hub page itself is now a full landing page** (not just the card directory): a hero
(headline + SEO overview) + the trust strip + the shared `EventFrameCards` + a cross-event benefits 4-up +
an aggregate FAQ with **FAQPage JSON-LD** (rich-result eligible), all single-sourced in the `EVENTS_HUB`
block ([events.ts](../src/lib/constants/events.ts)); its `<details>` FAQ is the shared
[FaqAccordion](../src/components/marketing/faq-accordion.tsx), reused by each `[slug]` page), **`/contact`** (form →
deny-all `contact_submissions` via a Server Action + service-role admin insert; best-effort Resend
notify via `sendOnce`; displayed `SUPPORT_EMAIL` vs. routed `CONTACT_NOTIFY_EMAIL` env — see
[ADR-0005](adr/0005-marketing-form-submissions.md)), **`/careers`** (mission-focused hub + per-role
`[slug]` pages — copy in [careers.ts](../src/lib/constants/careers.ts); a deny-all `job_applications`
table via the same R4 form pattern; only roles with an explicit `location`/`offer` show remote/perk
framing, so the General Application stays neutral), **`/help`** (help center — an in-repo **MDX content
pipeline**: `content/help/*.mdx` + `gray-matter` (list/parse) + `next-mdx-remote/rsc` (render) +
**build-time zod frontmatter validation**, loader [help.ts](../src/lib/content/help.ts); a categorized
index with **client-side search** ([help-search.tsx](../src/app/(marketing)/help/help-search.tsx)) +
per-article `[slug]` pages with an on-this-page TOC, related articles, Breadcrumb/Article JSON-LD, and a
Contact CTA. Articles use first-party MDX components ([mdx-components.tsx](../src/components/marketing/mdx-components.tsx))
— `Callout`, `AlbumShowcase`, and inline **spec components** that read the `limits.ts`/`tiers.ts` single
sources so numbers can't drift — styled by a `prose-help` `@tailwindcss/typography` theme whose colors
point at design tokens (auto-adapts to dark, no `prose-invert`); heading ids + the TOC share one in-repo
`slugify`. See [ADR-0006](adr/0006-mdx-content-pipeline.md). The generic core was extracted to
[content/collection.ts](../src/lib/content/collection.ts) so the blog reuses it.), **`/blog`** (+
`/blog/[slug]`) — the **second consumer** of the pipeline via [blog.ts](../src/lib/content/blog.ts) on
the shared [collection.ts](../src/lib/content/collection.ts) core (`loadCollection` + `slugify` +
`extractHeadings` + `readingTime` + `escapeXml`): a date-sorted index with a **client-side tag filter**,
per-post pages (byline from a **client-safe** [authors.ts](../src/lib/content/authors.ts) registry —
default `partyreel-team`, named `will-gibson` for human-voice posts — + reading time, TOC, related
posts, **Article JSON-LD with a `Person` author**, a per-post `next/og` card), and a **build-static
RSS 2.0 feed** at `/blog/feed.xml` (`dynamic="force-static"`, hand-rolled, no dep; the pure
`buildBlogRssXml` takes its site config as a param so it stays out of the env-validating `site.ts` +
is unit-tested). `draft: true` posts are excluded from listing/sitemap/RSS. 4 launch posts.),
`/pricing`, legal. The header **`Resources ▾`** dropdown + footer **Resources** column group Help +
**Blog** + Contact (Company → Careers). OG brand color is single-sourced as `BRAND_HEX` in `site.ts`
(satori needs a literal hex). **The 7-round marketing build-out is complete**; the **polish arc**
(Events rename → frame library + `/features` → interactive demo) is now through Round 3 (ROADMAP).

## Not-found pages (404)

**Four** `not-found.tsx` files (the root catch-all + one per route group that needs tailored copy)
share ONE animated core ([not-found-screen.tsx](../src/components/shared/not-found-screen.tsx) — icon
→ h1 → subhead → CTA row → footnote; presentational/content-only, **no `Container` or chrome** so it
composes into different wrappers without double-wrapping); the lost-visitor copy is itself
single-sourced in [marketing-not-found.tsx](../src/components/marketing/marketing-not-found.tsx) (used
by both the root and the marketing boundary). **Next 16:** a `not-found.tsx` is a Server Component,
returns a 404 status, and auto-injects `noindex`; each renders inside its segment's layout chain.
**The load-bearing gotcha (live-caught):** the root [not-found.tsx](../src/app/not-found.tsx) renders
its OWN `MarketingHeader`/`Footer` because UNMATCHED URLs (`/nope`) fall through to `app/layout.tsx`
with no group chrome — but a `notFound()` thrown INSIDE the marketing group renders the root boundary
**inside** `(marketing)/layout.tsx`, which ALREADY renders header/footer, so the chrome **double-stacks**
(two `<header>` + nested `<main>`). The fix is a [(marketing)/not-found.tsx](<../src/app/(marketing)/not-found.tsx>)
boundary that renders ONLY the centered content — so marketing-route 404s use it (single chrome) and
only genuinely-unmatched URLs hit the chrome-bearing root. By audience: **root** = an unmatched URL
(lost visitor), with its own header/footer → home/help CTAs + features/pricing/contact links;
**marketing** = a bad blog/help/events/careers `[slug]` (same lost-visitor content, NO chrome — the
layout supplies it); **guest** ([(guest)/e/[token]/not-found.tsx](<../src/app/(guest)/e/[token]/not-found.tsx>))
= a dead/expired event link (the real-world QR dead-end) → reassures ("double-check the link, ask the
host") + a growth-loop "What is Partyreel?" CTA and the `DEMO_EVENT_URL` demo when configured, under a
minimal `Logo` header in the narrow guest column (no `GuestHeader` — it needs a real token); **host**
([(app)/not-found.tsx](<../src/app/(app)/not-found.tsx>)) = a missing/not-yours dashboard event,
rendered INSIDE the already-authed `AppShell` (the `(app)` layout's `getUser()` gate has passed before
the page calls `notFound()`) → back-to-dashboard / create-event. Tab titles on the dynamic
`[slug]`/`[token]` variants come from the page's own `generateMetadata` (the house pattern: a fallback
title there, `notFound()` in the body), so only the unmatched-URL root shows "Page not found ·
Partyreel"; the 404 status + `noindex` hold on every variant. Entrance is the CSS-only
`[data-not-found]` `@starting-style` fade+rise with a `--nf-i` top-down stagger (globals.css,
reduced-motion-safe) — the one entrance that fires on first paint, so it degrades to fully-visible if
an engine skips it. (Admin 404s still fall to the root not-found and CAN double-stack inside the admin
shell — an `admin/not-found.tsx` is the same one-file fix if that ever matters; staff-only, deferred.)

## Interactive demo

**Env-gated, no schema change** (polish-arc R3). A REAL curated event's `qr_token` is set in
`NEXT_PUBLIC_DEMO_QR_TOKEN` (public; must be referenced explicitly in `env.ts`'s `parsePublic()` —
Next only inlines literally-named `process.env.NEXT_PUBLIC_*`). [demo.ts](../src/lib/demo.ts) is the
single source: `DEMO_EVENT_URL` (the `/e/[token]` URL) + `isDemoToken(token)`. When set: the `/features`
hero QR + a home-hero **"Try the live demo"** CTA become real links, and that event's existing
`/e/[qr_token]` guest page runs in **DEMO MODE** — threaded as `isDemo` from the page
([page.tsx](<../src/app/(guest)/e/[token]/page.tsx>)) through `event-experience.tsx` to
[guest-upload.tsx](../src/components/guest/guest-upload.tsx): a banner shows, the ~12 s gallery poll is
**paused**, the silent just-in-time join **skips `POST /api/guests`**
(sentinel session) and the queue **skips `uploadFile`** — `simulateUpload` returns a synthetic
`approved` outcome so the existing **optimistic-tile path** prepends a local `createObjectURL` tile that
is **never persisted** (no presign / R2 PUT / `create_media` / `create_guest`; email-capture suppressed).
The synthetic id never appears in the (paused) poll, so the tile is gone on refresh and the curated media
stays pristine. **Unset → no demo anywhere** (decorative QR, no CTA, normal guest behavior); the app
builds/runs identically. Verified end-to-end via the Preview MCP (curated event + Supabase confirming
**zero** new `media`/`guests` rows after a simulated upload); not Vitest-unit-tested (env-coupled, trivial
token equality).

## Growth loop

Branded share pages + the post-upload growth state. **SEO/OG**: `metadataBase` + `next/og`
code-generated images (site-wide + a per-event card at `(guest)/e/[token]/opengraph-image.tsx`),
`sitemap.ts`/`robots.ts` (marketing only); `/e/` emits OG so the one link unfurls but stays
**`robots noindex`** (the opaque token must never be indexed). **Guest email capture**: a soft,
one-time post-upload prompt → `capture_guest_email` RPC sets `guests.email` + upserts the durable
`newsletter_signups` list (survives event/guest deletion).

## Saved events (accounts-from-guest growth)

A signed-in visitor can SAVE any event to their dashboard ("Saved" tab) — the FREE
account-creation growth payoff (ADR-0009). Augments the anonymous capability flow; the upload
pipeline is untouched. **Save = `save_event(p_qr_token)`** (authenticated-only
SECURITY DEFINER): resolves the event from the page's TOKEN (never a client id), refuses
`private`/your-own events, idempotent. Status-check + **unsave = plain per-user RLS**
(`saved_events_owner_all`, `auth.uid() = user_id`) from the browser client. **Read =
`get_saved_events()`** (authenticated-only SECURITY DEFINER, `auth.uid()`-based, no `p_user_id`)
— reads non-owned events' names/covers (so it MUST be DEFINER), MASKS by visibility (cover NULL
for password/private; private fully blanked + `accessible=false`; deleted excluded), and returns
the event's **`qr_token`** (the single link; ADR-0010) → saved cards link to
`/e/[qr_token]`. Covers presigned server-side. Both RPCs sit in the authenticated advisor list
(0029) ONLY, never anon (0028); `saved_events` is RLS-policied. The **Save button**
([save-event-button.tsx](src/components/guest/save-event-button.tsx)) is the always-visible lever
(shown to signed-out visitors too → a "create a free account to save" dialog: shared
`<EmailSignIn>` + Google; a `pr_pending_save_` localStorage flag finishes the save after a redirect
sign-in), mounted on the `/e/` header (one link now; ADR-0010). The post-upload
`<SaveAccountPrompt>` replaced the newsletter `EmailCapturePrompt` (account-first; the newsletter
opt-in folded into the save dialog). Dashboard = "Your events" + "Saved" tabs over a shared
cover-art `<EventCard>` (owned covers via one batched newest-approved-media query).

## Link analytics

Per-event-per-day **aggregate counts, NO PII** ([link_stats](../supabase/migrations/) `event_id,
kind, day, count`; `kind` = `qr_scan`/`album_view`). Recorded server-side in each guest page's
`after()` via `recordLinkHit` → the **service-role-only** `record_link_hit` RPC (REVOKED from
anon — must stay absent from the anon advisor list), bot-filtered at ingest
([bots.ts](../src/lib/analytics/bots.ts) `isLikelyBot`). Hosts read via an RLS policy; counts
show on the event's Share card. Code: `src/lib/db/{queries,mutations}/analytics.ts`.

## Notification center

**Derive-on-read** in-app bell ([notification-bell.tsx](../src/components/app/notification-bell.tsx))
in the `(app)` header — no feed table. `getNotificationData` gathers signals each host page load
→ the **pure** `buildNotifications` ([build.ts](../src/lib/notifications/build.ts)) → badge +
panel. **v1 alerts** (STATE — persist until resolved): uploads-to-review (`media.status='pending'`),
over-capacity (`storage_grace_until`), Event-Pass-expiring (`tier_expires_at` within
`RENEWAL_NUDGE_DAYS`). **PLUS broadcast announcements**: a global `announcements` table
(operator-write-only via RLS — host inserts are RLS-blocked; authored via SQL/MCP) with per-host
read state via `profiles.announcements_seen_at`. **Extension point:** add a signal = one read in
`getNotificationData` + one case in `buildNotifications`. **When building any new host surface,
ask whether it should feed the bell** (e.g. co-host invites — see ROADMAP).

## Highlight reel — SCAFFOLD ONLY (tabled)

DB scaffold exists (`highlight_reels` table + `status` enum; `media.highlight_score`/`clip_*`/
`reel_eligible`/`preview_key`) but **no processing ships**. Hard constraint: transcode/stitch
runs in an **external worker, NOT Vercel functions** (ADR-0003). Deliberately tabled pending a
product + architecture decision (worker platform) — see ROADMAP.

---

## Security & data model (invariants)

- **RLS is the boundary** — the proxy ([src/proxy.ts](../src/proxy.ts)) only refreshes cookies.
  Re-verify authz with `getUser()` in every Server Function/route AND rely on RLS / SECURITY
  DEFINER RPCs at the DB.
- **Anonymous guests use capability tokens** (ADR-0004) validated inside SECURITY DEFINER RPCs;
  `anon` never gets direct table access. The **8 anon capability-token RPCs**
  (`get_event_by_qr_token`, `get_public_album`, `create_guest`, `create_media`,
  `get_upload_context`, `create_report`, `capture_guest_email`, `get_event_media_by_qr_token`)
  show as advisor WARNs **by design — do NOT revoke** (see CLAUDE.md "get_advisors").
- **Service-role-locked RPCs** (`purge_media_rows`, `record_link_hit`) must stay REVOKED from
  anon/authenticated — they must NEVER appear in the anon advisor list.
- **Table RLS shapes:** deny-all (operator/service-role-only) = `reports`, `sent_emails`,
  `newsletter_signups` (the accepted `rls_enabled_no_policy` INFO); host-read-via-policy =
  `link_stats`, `announcements`; host-all = `events`, `media`, etc.
- **The Stripe webhook is the SOLE writer of tier/cap;** never trust the client for entitlements.
- **Never expose raw R2 keys/URLs;** presign server-side. **Events have no end date** (anti-abuse).
