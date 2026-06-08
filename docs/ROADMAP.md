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

- **Uploader attribution + unified identity** (4-phase initiative; ADR-0015; master plan
  `~/.claude/plans/after-becoming-familiar-with-purring-beaver.md`; re-enter plan mode per phase). **P1
  SHIPPED 2026-06-08**: required profanity-filtered public display names, `require_email`→
  `allow_anonymous_uploads`, email-primary "Enter event", `display_name` service-role-write-only. **P2 SHIPPED
  2026-06-08**: the lightbox attribution caption (uploader name public / email host-gallery-only / "Anonymous"
  + a context-aware info popover; NOT on the dense grid tiles), resolved by one admin-read; email-leak
  red-teamed live. **P3 claim is PLANNED** (2026-06-08; detailed plan in the master-plan file): auto-claim a
  browser's anonymous uploads on sign-in via a new authenticated `claim_anonymous_uploads` RPC + localStorage
  `pr_session_*` enumeration + a subtle toast. **Sequencing (Will's split, 2026-06-08): the server-mediation
  remediation below runs FIRST** (its own dedicated phase — it closes live findings + hardens the claim's write
  path), THEN the P3 claim, THEN **P4** dashboard consolidation (merge Your-events+Saved into one "Events" tab,
  add an "Uploads" tab, rename "Recently deleted"→"Trash"). See
  [`systems/guest-flow.md`](systems/guest-flow.md) + [`systems/uploads-and-r2.md`](systems/uploads-and-r2.md).
- **"Download all" zip export** — heavier; stream-zip or an external worker (ADR-0003 keeps it off Vercel,
  like the reel). Per-item Save already ships.
- **Unified per-upload size limit + per-event `max_upload_bytes`** (own round) — replace the per-type limits
  with a single per-upload ceiling = min(remaining storage, ~5 GB), enforced at presign; video stays
  Pro-only; keep a generous duration cap. See [`systems/uploads-and-r2.md`](systems/uploads-and-r2.md).
- **Per-IP rate-limiting for `create_report` + the presign routes** — the deferred edge pass (the unlock
  limiter is already in place). See [`systems/database-security.md`](systems/database-security.md). (Folded
  into the server-mediation remediation below.)
- **Server-mediate the guest write/password RPCs** (H1/H2/H3 pentest remediation, 2026-06-08) — revoke anon
  EXECUTE on `create_media`/`create_media_as_host`/`verify_event_password`/`create_report`/`create_guest`/
  `capture_guest_email`; route each through its Next handler via the service-role client with server-derived
  trusted values (R2-HEAD size, verified email, host_id) + rate limits. The negative-size CHECK stopgap
  already shipped (commit `415962b`). **NOW THE NEXT DEDICATED PHASE (Will's split, 2026-06-08): runs BEFORE
  the P3 claim** — H2 is a LIVE unthrottled password brute-force oracle, and this hardens the write path the
  claim builds on. Re-enter plan mode to refresh it against the post-P1/P2 end-state before executing. Plan:
  `~/.claude/plans/we-just-added-and-dapper-storm.md`.
- **Bulk Restore-all / Empty-bin** for the recovery bins (per-item already ships).
- **Immediate hard-purge for egregious content** in `/admin/albums` (today only soft-remove → 30-day window).
- **File-picker upload e2e reconfirm** on a real device (the optimistic-tile path is client-only; couldn't
  be driven via the Chrome MCP).

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
- **Vercel / Next.js optimization** — the **12s guest-gallery poll** (`event-experience.tsx` →
  `/api/guests/gallery`, the top cost driver) → Supabase Realtime or conditional ETag/304s · front Vercel
  with Cloudflare at launch (DNS already migrating there) · Vercel Spend-Management hard cap + alerts ·
  revisit the `proxy.ts` per-request `getUser` matcher scope · a large-gallery presigned-read strategy
  (proxy/cache vs the current per-request presign).
- **Emails** — a transactional-email automation system + the guest "email me the album" auto-send (reuses
  `sendOnce`). See [`systems/lifecycle-recovery.md`](systems/lifecycle-recovery.md).
- **Highlight reel (Tabled — needs a product + architecture decision first)** — stitch a reel from the best
  clips (core-loop step 5). Scaffold exists; transcode/stitch runs in an **external worker, NOT Vercel**
  (ADR-0003). Open: worker platform (managed video API vs self-hosted ffmpeg on Cloudflare Containers),
  trigger (on-demand vs auto), clip-selection, output/`preview_key`, tier-gating. See [`systems/host-app.md`](systems/host-app.md).

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
- Revisit the git workflow for production `[eng]` — pre-launch we commit straight to `main` (fewer Vercel
  builds, fix-forward on a bad build). At launch, reconsider feature branches + PR preview deploys so a bad
  build can't reach real users. The current rule lives in [`../CLAUDE.md`](../CLAUDE.md) (working loop + Git).
- Toggle critical secrets to Vercel "Sensitive" `[human]` — pre-launch all env vars are non-sensitive (so
  values stay swappable); at launch flip the critical ones (the Supabase service-role key, Stripe + webhook,
  `CRON_SECRET`, `PRUNE_API_SECRET`, `UNLOCK_COOKIE_SECRET`) to Sensitive.

## Speculative / longer-horizon backlog

Bigger ideas that need product reshaping or a decision before they're roadmap-ready (co-hosts, referral
program, guest→full-user conversion, host 2FA, proactive CSAM filtering, NSFW / host trust-level configs, a
content CMS, a Backblaze B2 cross-vendor backup tier, …) are tracked **outside these docs** to keep this
file to actual upcoming work. Pull one in here (as a Now task or a new overhaul bucket) when it's ready.
