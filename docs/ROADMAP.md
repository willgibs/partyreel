# Partyreel — What's next

> ROLE: what MIGHT be next — the curated upcoming work + the buckets where deferred work accrues.
> BELONGS HERE: directly-upcoming tasks · the major-overhaul buckets · the launch checkpoint. · NOT HERE: how the system works (→ [`systems/`](systems)), the build history (→ [`CHANGELOG.md`](CHANGELOG.md)), current state (→ [`STATUS.md`](STATUS.md)), the comprehensive/speculative backlog (tracked outside these docs).
> GROWS BY: prune (delete a line when it ships or is dropped) + append one-liners under the right bucket.

**Provisional + non-binding.** Everything here is a CANDIDATE that may change — it is **not a spec, not an
invariant**, and **must not constrain current implementation** (don't bend today's feature to fit a line
below). An item is only "real" once it's **picked up into its own plan** (we re-plan per task, the house
pattern). The load-bearing "what exists / don't-revert" layer is [`systems/`](systems); this file is just
the shortlist of what could come next.

**Where deferred work goes (the one rule):** when you defer something, add it as a **one-liner under the
matching overhaul bucket or the launch checkpoint** below — never an inline "Deferred:" note elsewhere.
When that overhaul finally runs, its whole accrued task log is already sitting here.

## Picking up a task

A fresh agent given a goal can run this loop (defaults, not rails — use judgment):

1. **Orient** — [`STATUS.md`](STATUS.md) (you-are-here), then the relevant [`systems/`](systems) doc (what
   exists + invariants + the files; start at [`systems/README.md`](systems/README.md)); skim the linked
   ADR for the why.
2. **Doc-check** — before coding, pull current docs for the libraries/services the task touches via the
   **Context7 MCP** (this stack drifts; see CLAUDE.md).
3. **Plan** — for anything non-trivial, write a short plan and clarify open product/UX choices with the
   human **before** building. Reuse the DRY single-sources (CLAUDE.md).
4. **Build** — leave WHY-comments; use the MCPs (Supabase, R2, Vercel, Stripe) directly.
5. **Test** — Vitest for pure logic + a rolled-back Supabase-MCP RPC contract check for any new SQL; run
   `pnpm typecheck && lint && test && build`. After DDL run `get_advisors`.
6. **Verify on partyreel.com** — auth/upload/email/checkout can't complete on localhost (see CLAUDE.md);
   deploy + drive Chrome, antagonistically (red-team the change), + the Supabase/R2 MCPs to seed/inspect.
7. **Record (subtractively)** — update the owning `systems/` doc in place, move any shipping narrative to
   [`CHANGELOG.md`](CHANGELOG.md), prune what your change made stale, and log any new deferred task as a
   one-liner under its bucket here.

## Now (concrete, pick-up-able)

- **Uploader attribution + unified identity (4-phase initiative) — SHIPPED + CLOSED 2026-06-09** (ADR-0015;
  full record in [`CHANGELOG.md`](CHANGELOG.md)): P1 required public display names + `allow_anonymous_uploads`,
  P2 the lightbox attribution caption, P3 claim-anonymous-uploads-on-sign-in, P4 the merged Events tab + the
  Uploads hub + "Recently deleted"→"Trash". **Deferred follow-up:** the cross-gallery sort/filter system the
  `get_my_uploads` shape is already filter-ready for — now with a **like-count** sort dimension (Likes shipped
  2026-06-09 → [`CHANGELOG.md`](CHANGELOG.md)). (Delete-own from the Uploads tab SHIPPED 2026-06-09 via the
  security-bearing `remove_my_upload` RPC, "soft but private to the host" → [`CHANGELOG.md`](CHANGELOG.md).)
- **Gated gallery — account creation as the incentive to SEE (3-phase initiative). SHIPPED + CLOSED 2026-06-09**
  (P1 server-enforced `none|teaser|full` access + the capped teaser; P2 the unified entry modal + first-visit
  welcome; P3 the host "Require guest accounts" relabel + live preview). → [ADR-0017](adr/0017-gated-gallery-view-access.md),
  [`CHANGELOG.md`](CHANGELOG.md), [`systems/guest-flow.md`](systems/guest-flow.md).
- **"Download all" zip export — SHIPPED 2026-06-22 (`bc4d5fb` + download fix `34d0a9f`).** A streaming export
  Worker (`workers/export`, off Vercel) zips an album; a Next mint route HMAC-signs the authorized key list, the
  browser top-level form-POSTs it, the Worker streams a `client-zip` store-zip from R2. Concept B config modal +
  bulk "Download selected" + the guest album; `export_log` + the `export_enabled` kill-switch at `/admin/exports`.
  → [ADR-0018](adr/0018-download-all-zip-export.md), [`systems/uploads-and-r2.md`](systems/uploads-and-r2.md).
  Deferred: an async build-to-R2 job for >cap (2000-item / ~20 GB) albums; a custom `export.partyreel.com`
  subdomain (v1 uses `*.workers.dev`).
- **Thumbnail/preview variant — SHIPPED 2026-06-22 (`729e781`).** CLIENT-side: the browser makes a ~640px WebP
  preview at upload (photos downscale, videos a poster frame), uploads it as the `preview` R2 variant (size-bound),
  records `preview_key`; tiles serve it, the lightbox keeps full-res. $0 generation (no CF transform fee — the
  storage-billed-model fit). A migration added `preview_key` to `get_event_media_by_qr_token` + `get_my_likes`.
  → [`systems/uploads-and-r2.md`](systems/uploads-and-r2.md). **Deferred follow-on:** a server-side BACKFILL of
  previews for existing (pre-feature) media (a one-off worker/script); counting the small preview bytes toward the
  storage meter; the operator moderation feed's preview; an AVIF upgrade (a future worker) if quality ever demands it.
- **Unified per-upload size limit + per-event `max_upload_bytes`** (own round) — replace the per-type limits
  with a single per-upload ceiling = min(remaining storage, ~5 GB), enforced at presign; video stays
  Pro-only; keep a generous duration cap. See [`systems/uploads-and-r2.md`](systems/uploads-and-r2.md).
- **Strip EXIF/GPS from served + downloaded originals** (own round; near-term, flagged after Download-all
  2026-06-22) — phone photos embed GPS + device EXIF; tiles already serve the canvas-regenerated (EXIF-free)
  preview, but the lightbox, per-item Save, and the new "Download all" zip serve ORIGINALS with EXIF intact, so
  a guest's location leaks on download. Strip EXIF on the publicly-served/downloaded variant (or at upload),
  retaining only what's needed. A focused privacy fix that can ship independently of, and is the natural first
  slice of, the broader forensic/abuse round below (which also wants the EXIF strip).
- **Forensic / device-ID capture for abuse + law-enforcement response** (Will, 2026-06-08; its own planning
  round) — when media is reported, hand LE something useful instead of "we deleted it." Capture per-upload
  only what's actually helpful (IP is shared/weak, email is disposable): IP + precise timestamp + Vercel geo,
  full UA + UA client hints, and a durable FIRST-PARTY device id (localStorage/cookie UUID) that survives
  session-token rotation. Extract + retain key EXIF (GPS, device make/model/serial, capture time) into a
  locked record AND strip EXIF from the publicly-served variant (also fixes a latent GPS-privacy leak). On a
  report, LEGAL-HOLD the media (exclude from the 30-day auto-purge) + an admin preserve/export action. CSAM:
  remove-from-live + a NCMEC CyberTipline report + a SEGREGATED, encrypted, deny-all, time-bounded
  (18 U.S.C. §2258A(h): 90d, +90 on LE request) preservation hold (a legal mandate + safe harbor, not
  "storage"); NO PhotoDNA (enterprise-grade, too costly now). Store as deny-all service-role PII, defined
  retention, admin/legal-only access. Confirm the policy with counsel. (The abuse-focused rate limiter that
  was the last deferred security piece SHIPPED 2026-06-08, commit `7bb2b53`.)
- **Bulk Restore-all / Empty-bin** for the recovery bins (per-item already ships).
- **Immediate hard-purge for egregious content** in `/admin/albums` (today only soft-remove → 30-day window).
- **File-picker upload e2e reconfirm** on a real device (the optimistic-tile path is client-only; couldn't
  be driven via the Chrome MCP).
- **Arrival choreography fine-tune (post-roadmap lab round)** — Will's call closing P4.5: the lab sets
  direction during the program; on-device finetuning (beat/heights/morph timing via the touchpoint-11
  player + a real gated event) batches into one round after the V1 phases land. Include the
  password+account lighter-path feel and the account-step in-place-morph judgment call.

## Major overhauls (each its own planning round; drop related deferred tasks here)

- **Notification system** — the announcements overhaul · new bell signals (link-activity "new since last
  seen" deltas; billing `past_due` alerts, needs a denormalized flag on `profiles`) · a durable per-item
  feed + real-time push · per-item announcement un-read toggling. Build the foundational features first so
  we know what needs notifying. Extension point: [`systems/notifications-analytics-growth.md`](systems/notifications-analytics-growth.md).
- **Admin / operations portal** — **P8 backend-ops & observability (the priority piece):** every backend
  job (the cron sweeps, the media-backup Worker + DLQ, the **weekly backup prune**, the DB backup)
  manageable + health-surfaced in `/admin` with zero silent failures (a missing nightly backup pages,
  never passes quietly). The prune currently ships **alert-only** (breaker trips page via Sentry + a
  deduped email); a job-runs heartbeat that ALSO catches "a job silently stopped running" lands here.
  (At very large scale, the prune+reconcile per-run bucket scans can move to a merge-join / deletion
  tombstone / shared copy-state index — see [`systems/durability-backups.md`](systems/durability-backups.md).)
  Also: an operator-action audit log · per-announcement edit + read receipts · live-Stripe subscription
  health on the account detail. See [`systems/admin-observability.md`](systems/admin-observability.md).
- **Vercel / Next.js optimization** — ~~the 12s guest-gallery poll~~ SHIPPED Phase 3 (doorbell +
  ETag/304 + stable presigns → [`systems/guest-flow.md`](systems/guest-flow.md)) · **dashboard
  Suspense streaming DEFERRED post-launch** (P5 S1, three live strandings: completions die inside
  radix TabsContent regardless of child shape, and even outside-radix boundaries displayed but
  never client-hydrated on this page while the guest page's identical shape works; revisit in the
  PPR/cacheComponents era - the permanent `/design/stream-probe` + the blocking page + loading.tsx
  are the baseline) · front Vercel
  with Cloudflare at launch (DNS already migrating there) · Vercel Spend-Management hard cap + alerts ·
  revisit the `proxy.ts` per-request `getUser` matcher scope · a large-gallery presigned-read strategy
  (per-media proxy/pagination beyond the Phase-3 stable buckets) · Realtime concurrent-connection quota
  (one socket per open guest tab) at launch scale · `cacheComponents`/"use cache" adoption post-launch
  (deferral rationale → [`systems/architecture.md`](systems/architecture.md)) · the **`(app)` dashboard
  first-load latency** (~1-3s to hydrate, observed 2026-06-09 — the layout fans out `getUser` +
  notifications + profile + avatar, then the page adds events + storage; Phase 5 streams/parallelizes
  the chain; Phase 3 added the interim `loading.tsx` skeletons).
- **Emails** — a transactional-email automation system + the guest "email me the album" auto-send (reuses
  `sendOnce`). See [`systems/lifecycle-recovery.md`](systems/lifecycle-recovery.md).
- **Share studio (QR + share-content configurator)** — (Will, 2026-06-11, from the V1 design lab's QR-card
  round) an in-app generator for polished share outputs so hosts never build their own: card presets
  (minimal-ink + photo-backed won the lab round), per-common-event-type curated stock cover images +
  generic sets (hosts rarely have a cover BEFORE the event), toggles for link/date/cover, mobile/story
  vs printable formats, multiple file types, drag-and-drop element placement as the stretch goal. Doubles
  as a growth lever (every output carries the QR) and keeps hosts on-site. Slots into the V1 program
  around Phases 5-6; needs its own planning round. **Foundation shipped:** the QR DESIGNER ("Customize",
  preset styles) now lives prominently in the event-page Share dialog (3b, 2026-06-21) — deliberately a fun,
  core, growth-loop feature, NOT tucked into settings; the share studio is its evolution into a full
  share-OUTPUT configurator (cards, covers, formats) on top of that QR styling.
- **Highlight reel** — stitch a reel from the best clips (core-loop step 5). TWO halves:
  - **Curation foundation — R1 SHIPPED 2026-06-21 (`ec49410`); follow-ons deferred.** The host-curation layer
    that feeds the reel; generation stays deferred. **SHIPPED + live-verified:** the `reel_items` table +
    access-checked `add_to_reel` RPC (grant-locked, mirrors `media_likes`) + the host-only `ReelProvider` +
    the `Add to Reel` action (a `--reel` violet `Clapperboard`, distinct from Like, in the tile overlay +
    lightbox) + the event-page **Gallery / Reel / Reviews** tabs (`?eventTab=`, `resolveInitialEventTab`). Curation FREE
    for any tier; one reel/event; add-order; host-only + host-private + approved-only. (`reel_eligible` stays
    dead scaffold, NOT reused.) **R2 + R3 SHIPPED (2026-06-21, `a7405d6`):** the **Reviews tab** (the pending
    queue as a tab — AMBER count, moderation-gated visibility + Reviews-as-landing when a queue waits, the
    takeover sibling-mounted via `ReviewTakeoverProvider`) + the **moderation-disable auto-approve confirm**
    (count-named confirm; `updateEventAction` → `approveAllPending` enforces "live holds no pending").
    **Event-feed redesign SHIPPED (2026-06-22, `4d3ddcc` + beat hotfix `c316b21`):** the Gallery/Reel/Reviews
    TABS became a stacked, pill-filtered media-forward feed (`EventFeed`, `?section=`, urgency-ordered); the
    review pop-up inlined into `ReviewSection` (`useReviewTriage`); a contextual floating action bar morphs by
    the scrolled section. A=Condense / B=Fade / C=FLIP ratified, `motion` dropped. → [`systems/host-app.md`](systems/host-app.md).
    **Album bulk-select SHIPPED (2026-06-22, `6e5e1c7` + clamp hotfix `5a73410`):** the Gallery Select mode (a
    shared `useSelection` + `SelectableMediaGrid` + a `HostSelectionProvider`; Select button / long-press →
    bulk Add to reel / Like / Hide-Show / Delete; new plain-RLS bulk status+remove mutations; reel/like loop the
    idempotent RPCs). Download stays out (the zip worker below). → [`systems/host-app.md`](systems/host-app.md).
    **Drag-to-reorder + uniform Reel/Review grids SHIPPED (2026-06-22, `ae5fc24`):** the `reorder_reel` SECURITY
    DEFINER RPC (set-equality guard) + our own dependency-free `useSortableGrid` (pointer drag + 2-axis FLIP +
    geometric drop-index; beats dnd-kit on a uniform grid) + a Reorder/Done header button → a numbered sortable
    grid. Reel + Review became UNIFORM grids (a `layout` prop on the shared grids; Gallery keeps the masonry).
    → [`systems/host-app.md`](systems/host-app.md). **DEFERRED follow-ons (each its own slice):** the Reel
    **Create reel** generation flow
    (the floating placeholder ships disabled); guest-facing reel surfacing on `/e/[qr]`; multiple named reels;
    concise per-knob descriptions in the motion tuner; tuning the scroll-spy active-section hand-off on a short
    feed (with Will). The `--reel` violet + the `Clapperboard` icon are RATIFIED (Will, 2026-06-21). Bulk
    "Download all" zip stays its own deferred worker initiative.
  - **Generation (Tabled — needs a product + architecture decision first).** Transcode/stitch runs in an
    **external worker, NOT Vercel** (ADR-0003). Open: worker platform (managed video API vs self-hosted ffmpeg
    on Cloudflare Containers), trigger (on-demand vs auto), clip-selection, output/`preview_key`, tier-gating.
  See [`systems/host-app.md`](systems/host-app.md).
- **User profiles + social discovery (Will, 2026-06-20 — a NEW platform-expansion program; the dedicated
  round runs NEXT, right after the Phase-5 host/guest core 3c→3b).** Turns the single-event tool into a
  multi-event creator network (a VSCO-style link-in-bio + a social graph). Foundations are ~70% there
  already: ONE unified account (`profiles` = `auth.users`; any signed-in guest can host), uploader→user
  identity (`media.guest_id`→`guests.user_id`→profiles) + `claim_anonymous_uploads`, `saved_events` (the
  exact follow template), avatars (public bucket), the Pro custom-slug pattern (`EventSlugControl` +
  `check_slug_available` + reserved-slugs + `GATED_EVENT_SETTINGS`). The key new primitive: an
  `events.display_in_profile` boolean that DECOUPLES discovery from access (today `visibility` only gates
  who can OPEN) — an open-uploadable event can stay OFF a public, indexable profile (a tight-group event),
  an additive column. Phasing (each shippable, Pro-gated where it monetizes): P1 public profile + Pro
  `/u/[slug]` + the `display_in_profile` config + attribution-as-profile-link + the disable-downloads
  public album; P2 `user_follows` (any→any, a `saved_events` clone) + the event guest list (signed-in
  uploaders, derivable today) — surface it as a **"Guests (N)" feed section + pill** (alongside Review/Gallery/
  Reel in the stacked feed; "must upload to become a guest," sortable by upload count to encourage contributions — a
  motivation behind the require-account-to-upload default, Will 2026-06-21); P3 a dashboard "Following"
  filter-chip → a profiles grid; P4 (v2) a social
  feed (DEPENDS on the Notification overhaul above) + discovery. THE one-way-door risk (why a dedicated
  research round, not an interleave): a public profile + guest lists open a CONSENT/privacy surface — a
  guest may not want to be listed/followable → OPT-IN discoverability (a per-user `discoverable` flag; the
  guest list host-visible by default, public only by opt-in) + a blocking model, confirmed before build.
  Additive, not dilutive: it amplifies the North Star (a guest sees a host's profile + other events → wants
  their own = the "second event" loop); the core frictionless-capture flow stays unchanged. NOT
  launch-gating. Cheap profile-aware HOOKS are laid during 3c/3b NOW (attribution keeps the uploader user
  id so the future profile-link is a one-line add). Supersedes the speculative-backlog "guest→full-user
  conversion" line.

## Launch checkpoint (far off — a bucket; tasks get assigned here, handled together at launch)

- Enable leaked-password protection (HaveIBeenPwned) `[human]` — Pro-gated; the long-standing advisor WARN.
- Stripe test → live cutover `[eng+human]` — re-create products/prices in live + swap the 5 env vars
  (code unchanged); checklist in [`PRICING.md`](PRICING.md).
- Tune `MONTHLY_INGRESS_BYTES.pro` `[eng]` — currently `null`/unmetered; set before Pro launch.
- Real `/privacy` page `[content]` — replace the stub; include the drafted Sentry session-replay
  disclosure line.
- Swap the demo event to curated media `[eng+content]` — repoint `NEXT_PUBLIC_DEMO_QR_TOKEN` to a dedicated
  event with catchy approved media.
- Committed automated RPC integration suite `[eng]` — replace the per-change rolled-back MCP checks (needs a
  paid Supabase branch or a local Postgres test DB).
- Confirm the Sentry email-alert rule fires `[human]`.
- Pre-launch test-data hard reset ("Recovery Phase 6") `[eng]` — the deletion-aware prune has shipped (in
  dry-run), so the "reset ≥35 d before launch so test objects age out of the Bucket Lock" timing
  constraint is gone.
- Flip the backup prune to live `[human]` — set `PRUNE_MODE=live` in `workers/backup/wrangler.jsonc` +
  redeploy once the primary is populated (it ships in dry-run, deleting nothing). Also set the shared
  `PRUNE_API_SECRET` (Vercel + `wrangler secret put`). See [`systems/durability-backups.md`](systems/durability-backups.md).
- Revisit the git workflow for production `[eng]` — while there are no live users we commit straight to `main`
  (fewer Vercel builds, fix-forward on a bad build). Once real users arrive, reconsider feature branches + PR
  preview deploys so a bad build can't reach them. The current rule lives in [`../CLAUDE.md`](../CLAUDE.md) (working loop + Git).
- Toggle critical secrets to Vercel "Sensitive" `[human]` — pre-launch all env vars are non-sensitive (so
  values stay swappable); at launch flip the critical ones (the Supabase service-role key, Stripe + webhook,
  `CRON_SECRET`, `PRUNE_API_SECRET`, `UNLOCK_COOKIE_SECRET`) to Sensitive.

## Speculative / longer-horizon backlog

Bigger ideas that need product reshaping or a decision before they're roadmap-ready (co-hosts, referral
program, guest→full-user conversion, host 2FA, proactive CSAM filtering, NSFW / host trust-level configs, a
content CMS, a Backblaze B2 cross-vendor backup tier, …) are tracked **outside these docs** to keep this
file to actual upcoming work. Pull one in here (as a Now task or a new overhaul bucket) when it's ready.
