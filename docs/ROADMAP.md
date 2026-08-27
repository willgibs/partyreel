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

- **Elevation-program deferred queue (marketing; the program plan file is the working ledger).** Logged at
  R5/R6 settlement (2026-08-27): the dedicated **help-content agent** fills the library against
  [`content/help/AUTHORING.md`](../content/help/AUTHORING.md) (Will initializes; UI + taxonomy are final);
  the dedicated **legal agent** fills privacy/terms bodies in the `LegalArticle` shell (section ids stable;
  the plain-language drafts are its brief); **self-serve account DELETION in the app** (supersedes the help
  article's contact path — swap that article's deletion section when it ships); faq-accordion
  native-`<details>` → the `.mkt-acc` recipe (clocks aligned, markup not); FAQ/GoDeeper unification onto
  `shared/` (M3's ready-to-apply plan); the **MonoCaption sweep question** (does the R6 mono ruling extend
  to press facts / legal status lines / GoDeeper captions — Will rules); `/press` grows into the
  partnerships/ambassador kit; post-launch event-type candidates `/events/birthdays` + `/events/memorials`;
  the media batch (per-vertical reel renders, a landscape wedding render, honest trip/conference subjects).

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
- **HEIC/HEIF/AVIF + WebM metadata strip** — the client-side strip consciously fails open on item-based
  ISOBMFF (Exif is an iloc-referenced item; blanking `meta` would destroy the image) and EBML, so those
  formats still upload with metadata intact; close the residual leak window (iloc-aware blanking) if real
  devices turn out to upload unconverted HEIC. → [`systems/uploads-and-r2.md`](systems/uploads-and-r2.md).
- **JPEG MPF secondary-image Exif scrub** — the Exif inside a post-EOI MPF secondary image (gain map /
  dual-shot preview) is consciously kept (excising shifts the trailer the MPF index points into; needs
  in-place TIFF surgery or coordinated MPF size+offset rewrites); the backfill report flags it as
  clean-but-GPS. → [`systems/uploads-and-r2.md`](systems/uploads-and-r2.md).
- **Forensic capture follow-ons (ADR-0020)** — the A3-lite capture + legal hold + preservation +
  `/admin/forensics` SHIPPED 2026-07-07 (→ [`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)).
  Remaining, all gated: the pre-strip client-side EXIF capture (COUNSEL-GATED, ADR-0020 decision 1 — the
  server never sees EXIF post-strip, so extraction must run client-side before the strip); proactive
  hashing (PhotoDNA/Safer) at real scale; any media-serving re-architecture to widen the Cloudflare CSAM
  scanner past proxied traffic. The counsel sign-offs + NCMEC registration live in the Launch checkpoint.
- **Bulk Restore-all / Empty-bin** for the recovery bins (per-item already ships).
- **Immediate hard-purge for egregious content** in `/admin/albums` (today only soft-remove → 30-day window).
- **File-picker upload e2e reconfirm** on a real device (the optimistic-tile path is client-only; couldn't
  be driven via the Chrome MCP).
- **Arrival choreography fine-tune (post-roadmap lab round)** — Will's call closing P4.5: the lab sets
  direction during the program; on-device finetuning (beat/heights/morph timing via the touchpoint-11
  player + a real gated event) batches into one round after the V1 phases land. Include the
  password+account lighter-path feel and the account-step in-place-morph judgment call.

## Major overhauls (each its own planning round; drop related deferred tasks here)

- **QA hardening — the remaining fix queue** (the ~590-agent round of 2026-07-28/29; queue file
  `~/.claude/plans/please-conduct-a-thorough-staged-pixel.md`; Q1-Q4 + the write spine shipped as
  milestone-1.5). What's left, roughly in the intended order:
  - **Abuse + jobs + observability:** #13 a `presign` abuse kind (pure TS, `action_attempts` is
    kind-generic; needs `Retry-After`/429 vocabulary the pipeline lacks today) · #14 the contact + careers
    limiter, fail-CLOSED (unauthenticated + unthrottled today: each call = one service-role insert + one
    Resend send, and ~3,000 requests drain the monthly quota, after which the orphan-sweep and prune
    breaker alerts cannot send) · #15 the purge cron + backup Worker have NO `/admin` surface and NO kill
    switch (the P8 mandate; `/admin/exports` + `/admin/reels` are the byte-identical template, and
    NOTHING persists a job run today — no heartbeat table exists) · #27 per-ROW isolation inside the
    sweep loops (isolation is per-sweep today, so one bad address aborts the rest of that sweep's
    accounts) · #37/#38 persist the pagination cursor for the backup reconcile + orphan sweep (both are
    function-local `let`s, so both restart at bucket head every run and nothing past the per-run cap is
    ever examined) · #39 POST id batches (supabase-js renders `.in()` into the URL; several sites can
    reach ~1000-2000 UUIDs) · #22 scrub Sentry (guest capability tokens ride the URL PATH, and
    `beforeSend` is error-events-only, so breadcrumbs/transactions/`extra` bypass the current scrubber)
    · quick wins: hoist `assertResendEnv` ABOVE the `sent_emails` claim (a throw currently leaves the
    claim row, permanently suppressing that dedupeKey), #42 security headers (`poweredByHeader` is still
    on), a `STYLE_IDS.every(engineSupports)` catalog↔engine parity assertion.
  - **Infrastructure debt:** #46 CI · #45 recover the two live-only columns into a migration file
    (committed migrations can no longer rebuild the schema) · #44 preservation-prefix backup truth ·
    #47 teardown residue + stale doc claims.
  - **Carried-forward live verification:** #11 the >90-min presign-roll soak + #12 upload retry.
  - ⚠️ **#46 CI is blocked until 2026-08-01** — the GitHub account's monthly Actions minutes are
    exhausted (Will, 2026-07-29), so a new workflow cannot be validated before the reset. The same
    outage means the **DB-backup Action (durability Pillar C) is not running** in the meantime; the R2
    media-backup Worker (Pillar B) is unaffected since it runs on Cloudflare.

- **Notification system** — the announcements overhaul · new bell signals (link-activity "new since last
  seen" deltas; billing `past_due` alerts, needs a denormalized flag on `profiles`) · a durable per-item
  feed + real-time push · per-item announcement un-read toggling · **the reel-published guest send** (R3
  ruled NO email until R5 and shipped only the seam: `setReelGuestVisibleAction` is the single publish
  hook — audience/transport design lands here, and late joiners see the card meanwhile, no catch-up mail).
  Build the foundational features first so
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
  - **Generation SHIPPED + LIVE ([`specs/reel-v1.md`](specs/reel-v1.md)).** The North Star runs on a **canvas engine**
    (`src/lib/reel/engine/`): ONE draw fn powers the live `CanvasReelPlayer` AND the on-device WebCodecs `.mp4` export
    (mediabunny), uploaded via the host-authed `/api/reel/upload` begin→mint→finalize handshake ($0 at any scale,
    lazy+cached, free-tier watermark, `/admin/reels` kill-switch + `reel_render_log` + limiter). The **14-style catalog**
    (8 media-first moods + 6 stylized treatments) + portrait/landscape orientation are live; shuffle removed (deterministic
    seed). **The Remotion/AWS-Lambda render path was TORN DOWN 2026-07-08** (the original S1-S3 shipped on Lambda; the
    canvas-engine spike + AWS's concurrency denial retired it — `@remotion/*` deps, `workers/reel-render/`, the Lambda
    trigger/webhook all gone). Settled (do-not-relitigate): **one-source WYSIWYG** (player == export), **Lazy+cached**, the
    **14-style catalog + orientation** (shuffle gone), **1 reel all tiers**, **free** w/ the watermark lever, **Pro video**
    preview+trim. **NEXT:** guest-facing reel surfacing + download (the next feature; needs a planning round —
    [`specs/reel-v1.md`](specs/reel-v1.md) + [`decisions/t1-reel-guest-surfacing.md`](decisions/t1-reel-guest-surfacing.md));
    plus Pro video real-video-in-player + R2 CORS, the reveal moment, and dropping the legacy `highlight_reels.theme`
    column. → [`systems/host-app.md`](systems/host-app.md).
  See [`systems/host-app.md`](systems/host-app.md).
- **User profiles + social discovery (Will, 2026-06-20 — the platform-expansion program; P1-P3 BUILT
  2026-07-08 on the elevation-program track, pending integration).** Turns the single-event tool into a
  multi-event creator network (a VSCO-style link-in-bio + a social graph). The consent/privacy one-way-door
  is RULED — [ADR-0019](adr/0019-social-privacy-host-controlled-guest-list.md), do not re-litigate: the
  guest list is HOST-controlled (`events.show_guest_list`, no per-guest opt-in), the guest's control lives
  on their OWN profile (`profile_hidden_events`), there is NO per-user `discoverable` flag (creating a
  profile IS the consent act), follows are open any-to-any with an owner-private graph, and blocking
  shipped IN the slice. What's built (track `worktree-wf_421d3486-dcf-1`, migration `20260708120000`
  UNAPPLIED until the orchestrator integrates): P1 `/u/[slug]` public profile + the app-side Pro slug gate
  + `display_in_profile` (discovery decoupled from access; the attended arm additionally stays
  open-visibility-only per the consent scope); P2 `user_follows`/`user_blocks` + the "Guests" feed section
  + pill + the guest-album guest list (approved signed-in uploaders, deduped); P3 the dashboard "Following"
  chip (chip-only, never stacked into All). Still ahead: P4 (v2) a social feed (DEPENDS on the Notification
  overhaul above) + discovery; the notification-prefs UI (R5 owns sends; storage + defaults shipped);
  guest-list sort-by-upload-count (deferred, the contribution-encouragement idea, Will 2026-06-21).
  Additive, not dilutive: it amplifies the North Star (a guest sees a host's profile + other events → wants
  their own = the "second event" loop); the core frictionless-capture flow stays unchanged. NOT
  launch-gating. Current truth: [`systems/profiles-social.md`](systems/profiles-social.md).

## Launch checkpoint (far off — a bucket; tasks get assigned here, handled together at launch)

- Enable leaked-password protection (HaveIBeenPwned) `[human]` — Pro-gated; the long-standing advisor WARN.
- Counsel sign-off gate (ADR-0020 D2) `[human]` — before launch counsel signs: (1) the privacy-policy +
  ToS forensic-capture disclosure language (IP/UA/geo/device UUID per upload), (2) the CSAM incident
  runbook ([`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)) + NCMEC registration,
  (3) the retention schedule (media-lifetime rows, 1-year preservation), (4) the pre-strip EXIF capture
  go/no-go. The 8-item checklist is in the T1 options-doc (git history: `decisions/t1-forensic-csam-policy.md`).
- NCMEC CyberTipline ESP registration `[human]` — register before launch (prep note in
  [`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)); if denied, we still report actively.
- Enable the Cloudflare CSAM Scanning Tool at the DNS move `[human]` — free; scans only proxied traffic
  (cannot see presigned R2 media — state that plainly), per ADR-0020 C2.
- Stripe test → live cutover `[eng+human]` — re-create products/prices in live + swap the 5 env vars
  (code unchanged); checklist in [`PRICING.md`](PRICING.md).
- Verify the Stripe Billing Portal permits switching between the three Pro prices `[human]` — now
  LOAD-BEARING, not cosmetic: per ADR-0023 1b a Pro host changing storage size is routed to the
  portal (checkout refuses the second subscription it used to create silently). If the portal's
  product config does not allow the swap, a paying host has no self-serve way to resize.
- Tune `MONTHLY_INGRESS_BYTES.pro` `[eng]` — currently `null`/unmetered; set before Pro launch.
- Real `/privacy` page `[content]` — replace the stub; include the drafted Sentry session-replay
  disclosure line.
- Swap the demo event to curated media `[eng+content]` — repoint `NEXT_PUBLIC_DEMO_QR_TOKEN` to a dedicated
  event with catchy approved media.
- Committed automated RPC integration suite `[eng]` — replace the per-change rolled-back MCP checks. BLOCKED
  on a direct pg connection; the exact gaps + the two unblock paths + the intended test list are in
  [`decisions/rpc-suite-blocked.md`](decisions/rpc-suite-blocked.md) (2026-07-03).
- Confirm the Sentry email-alert rule fires `[human]`.
- Pre-launch test-data hard reset ("Recovery Phase 6") `[eng]` — the deletion-aware prune has shipped (in
  dry-run), so the "reset ≥35 d before launch so test objects age out of the Bucket Lock" timing
  constraint is gone.
- Flip the backup prune to live `[human]` — set `PRUNE_MODE=live` in `workers/backup/wrangler.jsonc` +
  redeploy once the primary is populated (it ships in dry-run, deleting nothing). Also set the shared
  `PRUNE_API_SECRET` (Vercel + `wrangler secret put`). See [`systems/durability-backups.md`](systems/durability-backups.md).
- Revisit the git workflow for production `[eng]` — the elevation program runs on the `launch-prep`
  integration branch (see [`../CLAUDE.md`](../CLAUDE.md) Git); when the program ends, decide the standing
  post-program workflow (straight-to-main speed vs branches/PR previews once real users arrive).
- **Elevation-program teardown** `[eng]` — when the program's final milestone merges: re-enable Vercel SSO
  deployment protection (`ssoProtection: all_except_custom_domains`), delete the temporary Stripe TEST
  webhook endpoint `we_1U1I3GPtjqmVkBwkjUqWGpvR` (the launch-prep preview endpoint, recreated in the
  2026-08-05 P3 migration — it must NOT survive into the live-mode cutover), remove the preview origin from
  the R2 `partyreel` bucket CORS + the Supabase auth redirect allow-list, remove the 3 branch-scoped
  Vercel env vars (`NEXT_PUBLIC_SITE_URL`/`STRIPE_WEBHOOK_SECRET`/`DESIGN_PREVIEW_KEY` @launch-prep),
  delete the `launch-prep` branch +
  `lp/*` remnants, and revert CLAUDE.md's git section to the post-program rule.
- Close the AWS Remotion sub-account (console) `[human]` — the Lambda render path was torn down 2026-07-08
  (canvas + on-device client-encode is the only reel path now); the sub-account under `partyr33l@gmail.com`
  (the `remotion-lambda-role`/`remotion-user` IAM + the deployed Remotion site/function) has no remaining use.
- Toggle critical secrets to Vercel "Sensitive" `[human]` — pre-launch all env vars are non-sensitive (so
  values stay swappable); at launch flip the critical ones (the Supabase service-role key, Stripe + webhook,
  `CRON_SECRET`, `PRUNE_API_SECRET`, `UNLOCK_COOKIE_SECRET`) to Sensitive.

## Speculative / longer-horizon backlog

Bigger ideas that need product reshaping or a decision before they're roadmap-ready (co-hosts, referral
program, guest→full-user conversion, host 2FA, proactive CSAM filtering, NSFW / host trust-level configs, a
content CMS, a Backblaze B2 cross-vendor backup tier, …) are tracked **outside these docs** to keep this
file to actual upcoming work. Pull one in here (as a Now task or a new overhaul bucket) when it's ready.
