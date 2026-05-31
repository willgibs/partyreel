# Partyreel — What's next / backlog

> The v1 foundation shipped (the phased roadmap is complete — what exists is mapped in
> [`SYSTEMS.md`](SYSTEMS.md)). The project is now in **one-off task mode**: a goal becomes its
> own small plan. This file is the parking lot — deferred work + decisions kept ready so a new
> agent needs only a goal. [`STATUS.md`](STATUS.md) is you-are-here; [`CLAUDE.md`](../CLAUDE.md)
> is the operating guide; [`PRD.md`](PRD.md) is the product why; [`adr/`](adr/) holds decisions.

## Picking up a task

A fresh agent given a goal can run this loop (defaults, not rails — use judgment):

1. **Orient** — [`STATUS.md`](STATUS.md) (you-are-here + human blockers), then the relevant
   [`SYSTEMS.md`](SYSTEMS.md) entry (what exists + invariants + the files); skim the linked
   ADR/PRD for the why.
2. **Doc-check** — before coding, pull current docs for the libraries/services the task touches
   via the **Context7 MCP** (this stack drifts; see CLAUDE.md "Tooling").
3. **Plan** — for anything non-trivial, write a short plan and clarify open product/UX choices
   with the human (AskUserQuestion) **before** building. Reuse the DRY single-sources (CLAUDE.md).
4. **Build** — leave WHY-comments; use the MCPs (Supabase, R2, Vercel, Stripe) directly.
5. **Test** — Vitest for pure logic + a rolled-back Supabase-MCP RPC contract check for any new
   SQL; run `pnpm typecheck && lint && test && build` + `format`. After DDL run `get_advisors`.
6. **Verify on partyreel.com** — host UI is auth-gated and auth/upload/email can't complete on
   localhost (see CLAUDE.md "Local dev vs. live testing"); deploy + drive Chrome (+ the Supabase
   MCP to seed/inspect state — test data is disposable).
7. **Record** — advance STATUS + the SYSTEMS entry + this backlog + any ADR, same change.

## ⏸️ Tabled — needs a product + architecture decision first

- **Highlight reel (Phase 5)** — stitch a highlight reel from the best clips (core-loop step 5).
  Scaffold exists (`highlight_reels` + media reel fields; see SYSTEMS). **Hard constraint:**
  transcode/stitch runs in an **external worker, NOT Vercel** (ADR-0003). **Central open fork:**
  where the worker runs — a **managed video API** (e.g. Shotstack, ~$0.20–0.40/rendered min,
  fastest) vs. **self-hosted ffmpeg on Cloudflare Containers** (same account as R2 = zero egress,
  cheapest at scale, most to build). Also open: trigger (on-demand vs. auto-on-event-complete),
  clip-selection algorithm (start heuristic), output format + `preview_key`/poster generation,
  any tier-gating (PRD's no-watermark stance steers away from a reel watermark). Resume with a
  short product + architecture spec; the "Generate reel" entry point appears in the host gallery
  only when it ships.

## Near-term follow-ups (ready to build; deferred from shipped cuts)

- **Notification center signals (extend the bell)** — link-activity "new since last seen" deltas
  (from `link_stats`) and billing/payment alerts (needs a denormalized Stripe `past_due` flag on
  `profiles` first). Each = one read in `getNotificationData` + one case in `buildNotifications`.
- **Announcement compose UI** — a small `/admin` form to publish `announcements` (today they're
  authored via SQL/MCP). Also deferred: a durable per-item notification feed + real-time push,
  and per-item announcement un-read toggling (today's marker is "all caught up as of a timestamp").
- **Host access gates** (Phase-3 deferral) — per-event settings that gate guest access: a
  **passphrase** (emoji/short phrase) to upload and/or view, and **require-upload-to-view**
  (optionally an item minimum). Each needs an event-settings field + a gate in the
  capability-token guest-flow / album RPCs.
- **Guest "email me the album" auto-send** — the growth-loop capture is email-only today; the
  automatic album-link email (reusing `sendOnce`) was deferred.
- **Album download — bigger cuts** (per-item Save shipped in the lightbox): a host **"Download all"
  (zip)** export — heavier; stream-zip or an external worker for large albums (ADR-0003 keeps
  transcode/stitch off Vercel, same constraint applies to large zips) — and a **per-tile
  hover/quick-download** on the grid. If galleries get huge, switch the download URL from the
  current up-front per-item presign to a **lazy/route-based presign** (dovetails with the deferred
  large-gallery read-proxy noted in `lib/r2/presign.ts`).
- **Guest gallery follow-ups** — the unified live guest event page **shipped** (`/e/[qr_token]`:
  guests now see + add to a live polling gallery + share the join link). Remaining: **per-photo
  attribution** (uploader display-name on tiles — `get_event_media_by_qr_token` + `get_public_album`
  would return `guest.display_name`), and the deferred **"email me the album" auto-send** (reuse
  `sendOnce`; blocked on Resend). Also: a true file-picker upload e2e for the optimistic-tile path
  couldn't be driven via the Chrome MCP (client-only logic, verified locally) — reconfirm on a real
  device when convenient.

## v2+ docket (post-core, bigger)

- **Multi-account events (co-hosts + invited guests)** — let an owner link other accounts:
  **co-hosts** (shared management) and **invite-only guests** (extending `require_email`).
  **Co-hosting is paid-only** — the **owner** must be Pro / hold an Event Pass; co-hosts need no
  plan of their own. **Additive model:** keep `events.host_id` as the owner/billing+storage
  anchor, add an **`event_members(event_id, user_id, role)`** table, and broaden the host RLS
  policies (`events_host_all`, `media_host_all`, …) from `host_id = auth.uid()` to
  membership-based. Deferring causes no painful migration — but write near-term host RLS in a
  membership-broadening-friendly way. **→ When this ships, wire co-host invitations into the
  notification bell** ("you've been invited to co-host X / N pending invites" — Will: required
  follow-up; it's a one-read + one-`buildNotifications`-case extension), and consider invite-only
  guests there too.
- **Referral program** — a % incentive with attribution + payouts (Stripe credits or Connect):
  planners refer hosts; guests who sign up from an event page earn the host a cut on Pro
  conversion. Substantial (attribution + payouts) → post-core.
- **Guest → full-user conversion** — `require_email` becomes a _confirmed_ email (magic-link)
  that quietly creates a latent account; a later traditional login triggers full signup/onboarding
  and merges. Interacts with auth + the tier-gated `require_email`.
- **Proactive CSAM filtering** — an upload-time hash-matching tool (PhotoDNA a candidate). v1
  ships only the report/takedown + operator-review MVP.
- **NSFW filtering** — only if a real need emerges; host-opt-in, image moderation on photos +
  sampled video keyframes to keep cost down (≈ $1/1k images, video ≈ $0.10/min via Rekognition —
  sample frames; Google Vision has no video moderation).
- **AI support-recovery** — triage "I lost my media" emails, match sender → account/event,
  auto-send a time-boxed download link (PRD "Data retention").

## Tech debt / decisions to revisit

- **Committed automated RPC integration suite** — today the RPC contract is checked via
  rolled-back Supabase-MCP runs per change. A committed suite needs a paid Supabase branch or a
  local Postgres test DB. Do before launch.
- **Presigned read-URL strategy for very large galleries** — currently per-request presign (1 h
  TTL); revisit a proxy/caching approach only if albums get huge.
- **Cold storage for the storage tail** — evaluated + rejected (R2 IA only ~33% cheaper; Glacier
  = cross-cloud project). Revisit an R2 IA lifecycle rule only if tail cost grows.
