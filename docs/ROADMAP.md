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

**Picking up a task:** the working loop lives in [`CLAUDE.md`](../CLAUDE.md) (orient → doc-check →
plan → build → test → verify live → record); your role + branch rules are CLAUDE.md "Sessions &
roles" + [`PROGRAM.md`](PROGRAM.md).

## Now (concrete, pick-up-able)

- **Elevation-program deferred queue (marketing).** Logged at
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

- **Cross-gallery sort/filter for the Uploads hub** — `get_my_uploads` is already filter-ready; add a
  **like-count** sort dimension. (The rest of the attribution initiative shipped + closed 2026-06-09,
  ADR-0015 → [`CHANGELOG.md`](CHANGELOG.md).)
- **Zip-export follow-ons** — an async build-to-R2 job for >cap (2000-item / ~20 GB) albums; a custom
  `export.partyreel.com` subdomain (v1 uses `*.workers.dev`). (The export itself shipped, ADR-0018.)
- **Preview-variant follow-ons** — a server-side BACKFILL of previews for pre-feature media; counting
  preview bytes toward the storage meter; the operator moderation feed's preview; an AVIF upgrade if
  quality ever demands it. (The client-generated `preview` variant shipped 2026-06-22.)
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

- **QA hardening — the remaining fix queue** (the ~590-agent adversarial round of 2026-07-28/29;
  Q1-Q4 + the write spine shipped as milestone-1.5 — [ADR-0023](adr/0023-qa-round-product-rulings.md) +
  [`CHANGELOG.md`](CHANGELOG.md); this list IS the remaining queue). Roughly in the intended order:
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
    · #19 limiter failures are SILENT (fail-open is BY DESIGN — the token/session is the real gate,
    documented in `src/lib/security/abuse-rate-limit.ts` — but a limiter error today produces no
    Sentry/`captureError` signal, so a silently-dead limiter looks identical to a healthy one; add the
    observability, in both the abuse store and the unlock limiter) · a venue-NAT-aware per-IP limiter
    for `create_guest`/`create_report` (a naive per-IP cap blocks legit venue crowds; reuse the unlock
    limiter's count-failures design)
    · quick wins: hoist `assertResendEnv` ABOVE the `sent_emails` claim (a throw currently leaves the
    claim row, permanently suppressing that dedupeKey), #42 security headers (`poweredByHeader` is still
    on), a `STYLE_IDS.every(engineSupports)` catalog↔engine parity assertion.
  - **Infrastructure debt:** #46 CI (typecheck/lint/test/build on push — the 2026-07 Actions-minutes
    blocker is over: the daily DB-backup Action has been running green since the August reset, so
    minutes exist; validate a CI workflow now) · #45 recover the two live-only columns into a migration
    file (committed migrations can no longer rebuild the schema) · #44 preservation-prefix backup truth ·
    #47 teardown residue + stale doc claims.
  - **Carried-forward live verification:** #11 the >90-min presign-roll soak + #12 upload retry (fixed
    in code at milestone-1.5, never verified live; the two soak traps are in
    [`systems/testing-verification.md`](systems/testing-verification.md)).

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
- **Billing follow-ons** — pricing **grandfathering** when the first price change happens (the policy is
  ruled + recorded in [`PRICING.md`](PRICING.md) "Grandfathering"; the build is `planForPriceId` mapping
  MULTIPLE historical Price IDs per plan, newest = the public offer) · a full [`PRD.md`](PRD.md) refresh
  to the shipped product (this consolidation pass fixed only the misleading era claims) · **annual Pro
  billing** when Will rules the yearly numbers (the /pricing hero reserves the toggle slot; needs new
  Stripe prices + `planForPriceId` rows + a tiers.ts shape addition) · **per-pass dashboard management**
  (choose WHICH stacked pass a renewal extends, per-pass expiry rows in the storage meter; v1 renews the
  soonest-expiring, ADR-0025) · the `authenticated` role holds a latent table-level **TRUNCATE grant on
  `profiles`** (unreachable via PostgREST, found 2026-08-27; sweep table grants and revoke in the next
  security pass).
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
- **Highlight reel — SHIPPED end-to-end through milestone-2** (curation + the canvas engine + the
  14-style catalog + Studio + guest surfacing/download; current truth
  [`systems/host-app.md`](systems/host-app.md) + [`systems/guest-flow.md`](systems/guest-flow.md);
  settled scope [`specs/reel-v1.md`](specs/reel-v1.md), ADR-0022/0024). **Deferred follow-ons:**
  Pro motion video (real video playing in the live player + trim; R2 CORS work) · multiple named
  reels · the reveal-moment polish · dropping the legacy `highlight_reels.theme` column (the R8
  destructive batch) · concise per-knob motion-tuner descriptions · the short-feed scroll-spy
  hand-off tune (with Will) · a future auto-scoring "best clips" worker (`highlight_score` /
  `reel_eligible` stay dead scaffold for it).
- **User profiles + social discovery — P1-P3 LIVE since milestone-2** (`/u/[slug]` profiles, the
  follow/block graph, the Guests feed section + guest list, the dashboard Following chip; the
  consent/privacy one-way-door is RULED in [ADR-0019](adr/0019-social-privacy-host-controlled-guest-list.md),
  do not re-litigate; current truth [`systems/profiles-social.md`](systems/profiles-social.md)).
  **Still ahead:** P4 (v2) the social feed (DEPENDS on the Notification overhaul above) + discovery ·
  the notification-prefs UI (R5 owns sends; storage + defaults shipped) · guest-list
  sort-by-upload-count (the contribution-encouragement idea, Will 2026-06-21). NOT launch-gating.

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
- Revisit the paid-ingress `INGRESS_CAP_MULTIPLIER` (currently 3× the storage cap, ADR-0021) before
  Pro launch `[eng]` — confirm the multiplier holds at real scale.
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
