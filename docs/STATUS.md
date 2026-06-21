# Partyreel — Status (you-are-here)

> ROLE: the live snapshot — what's true right now + what's blocked on a human.
> BELONGS HERE: current state, the infrastructure summary, the pre-launch pointer, "after any change". · NOT HERE: shipped history (→ [`CHANGELOG.md`](CHANGELOG.md)), how systems work (→ [`systems/`](systems)), what's next (→ [`ROADMAP.md`](ROADMAP.md)).
> GROWS BY: integrate-in-place + prune (it's a snapshot — keep it short and current; move shipped narrative to CHANGELOG).

**Updated:** 2026-06-21

## Where we are

**THE ACTIVE INITIATIVE: the v0→V1 full-app refactor/redesign program** (approved 2026-06-10; 8 phases,
each re-entering plan mode for sign-off; the program plan + settled decisions live in Will's session
plan file + the agent memory `project_v1_rebuild_program.md`). Phase 1 verdicts so far (all 2026-06-10):
**MONOCHROME, both modes** (zero accent; light = paper/hairline, dark = glass/media-as-light; theme
follows system, light when unretrievable) and **base Instrument Serif** (0.60 `font-size-adjust`
calibration + 0.013em stroke weight; swappable via the five-variable display layer in
`src/app/(dev)/design/design.css`). The gated **/design** route (`DESIGN_PREVIEW_KEY`) is
**THE WORKBENCH** (2026-06-19), Partyreel's one internal UI tool, persistent beyond Phase 1. Two halves
under a polished sidebar (driven by `catalog.ts`, the single source): **Reference** = the REAL shipped UI,
synced by construction (`/design/foundations` = the live tokens via `var(--token)`; `/design/components`
= the real `ui/*` primitives; `/design/patterns` = the composed `shared/*` pieces; `/design/compositions`
= the real product UI (event card, storage meter, share suite) from sample props; `/design/system` +
`/design/demo` = the composed showcases) and **Sandbox** = the prototype explorations (`touchpoints.ts` =
the read-only shipped record). ONE theme (next-themes) flips chrome + reference + sandbox together. The live-picking
machinery is retired; the heading face is Urbanist (matches the app).
**PHASE 1 COMPLETE (2026-06-11): all 10 touchpoints ratified** — the full spec = `touchpoints.ts`
decisions + `/design/demo`. **PHASE 2 COMPLETE (2026-06-11): the V1 system is LIVE on partyreel.com**
— production tokens (mono both modes, brand→ink alias), Instrument Serif via the `font-heading`
five-knob utility, the primitive craft pass, 47 behavior pins ahead of the Phase 4-5 decomposition,
the error taxonomy + route-group boundaries (live-verified incl. the gated `/design/boom` probe →
Sentry `render:global`), and the perf baselines Phase 3 is judged against.
**PHASE 3 COMPLETE (2026-06-11): the hybrid doorbell gallery is LIVE** — Realtime contentless pings
(doorbell-to-render <1s, live-verified) + ETag/304 conditional polls (0B/0-presigns on no-change,
60s cadence while the socket is live) + 30-min stable presign buckets (browser cache works), the
upload pipeline consolidated to one engine + 4 thin strategy routes (RPC layer untouched), the
guest page streams (shell first, gallery behind Suspense), and the heavy chunks (lightbox, entry
modal, admin charts) load off the critical path.
**PHASE 4 COMPLETE (2026-06-11): the guest page `/e/[token]` is REBUILT to the ratified spec** —
left-editorial header + live stats, the masonry gallery (natural ratios), in-gallery upload tiles +
the floating Add pill (the queue extracted to `useUploadQueue`; the dropzone retired), the adaptive
entry sheet + ghost-grid locked tease, the photographic-promise empty state, the floating-pill
lightbox (gesture machinery verbatim), and a PWA manifest (installable; no service worker). The
locked-page payload is redacted (name + count only); `getGalleryStats` ships numbers never
identities; the lightbox Share uses the join url never a media URL. Current truth:
[`systems/guest-flow.md`](systems/guest-flow.md) (rewritten) · [`systems/design-system.md`](systems/design-system.md)
(reading-copy rule now real) · [`perf/v1-baseline.md`](perf/v1-baseline.md). Interim accepted: host +
marketing surfaces still pre-V1 (functional `font-heading` misuse, square host grids) until Phases 5-6.
**PHASE 4.5 COMPLETE (2026-06-12): the guest ARRIVAL experience** — the four-act choreography
(stage → 700ms beat → invitation sheet → warm threshold → success morph + reveal) ratified in the
lab (touchpoint 11, "Calm + 700ms") and transplanted: a REAL Vaul drawer (keyboard-aware, honest
affordances per access — a firm-gated welcome has NO X, drag rubber-bands), the continuous
height-gliding step container + back-to-welcome, the 28px invitation welcome (55svh presence), the
planted-gate green success morph + the held reveal curtain. A 6-lens adversarial implementation
audit confirmed + fixed 12 divergences (`3c609bb`; headline: vaul exits are KEYFRAMES not
transitions). 454 pins green; final live red-team clean (locked page = name + count only incl.
the new date redaction, generic 401s, unlock→full e2e); Test Wedding reverted to `open`. Per
Will's call, on-device choreography FINE-TUNING is deferred to a post-roadmap lab round (the lab
stays the direction-setter, not a per-phase finetune gate).
**PHASE 5 ACTIVE (the host app redesign) — IN PROGRESS 2026-06-20.** Shipped: S2a (shared `MasonryColumns`
+ dims migration + the stat-forward V3 event card + share suite) · S2b (the single-feed dashboard: filter
chips + ambient storage meter + per-section teasers) · S1 (dashboard streaming INVESTIGATED → DEFERRED
post-launch, stable on the blocking page). The gated `/design` lab became **THE WORKBENCH** (a live
reference + sandbox). **S3 (the gallery-first host event page) is the ACTIVE slice:** S0 ✅ (lab forks +
the "Trash"→"Deleted" rename) · 3a ✅ (host grids → masonry + overlay) · forks RATIFIED (A1 Editorial / B1
settings ROUTE / C1 Deleted BEHIND settings) · a cross-surface gallery-action redesign + re-order (3c →
3b → S4) · **3c.1 ✅** (the host gallery TILE action model: hover-reveal row + per-action colors incl. the
new `--save` blue + host Like + hidden-30%) · **3c.2 ✅** (the LIGHTBOX host actions: the grouped
"enjoy | curate" pill + the UNIVERSAL action-color system across guest + host, only the action SET differs;
the guest pill stays behavior-identical, gains colors; +the guest-tile Download; "Hidden from everyone"
toast; mobile tiles drop hide/delete to the lightbox) + a **polish pass** (OPTIMISTIC moderation = instant,
reverts on fail; a persistent amber hidden-marker; **LIGHTBOX-ONLY** styled tooltips [tiles use native
title]; bare-icon Like + "Added to your likes" toast; Share = blue). The polish first shipped with tooltips
on the SSR'd tiles too, which regressed host-gallery hydration on prod (reverted + re-shipped scoped — see
CHANGELOG + the hydration gotcha in [`systems/architecture.md`](systems/architecture.md)). · **3b ✅** (the
gallery-first event page, built A→D + each live-verified: a dedicated `/settings` route, the editorial
status-row header, the Share-primary command bar [the QR designer rides in the share flow], the command +
floating Add, the FOCUSED review mode with bulk approve/hide, and a `[data-route-fade]` route crossfade; the
`host-event-build` lab round ratified the focused-review + status-row picks).
**S4 ✅ (2026-06-21): the event-page polish pass + settings hardening + the motion tuner.** An emil-driven
creative polish built increment-by-increment (each green-gated → shipped → live-verified; the two riskiest
adversarially reviewed pre-ship): the focused-review takeover is now a full-screen radix Dialog with an
OPEN CASCADE + a bulk-action REMOVAL EXIT + an ALL-CAUGHT-UP success beat; checkmark pops + a QR-preset
stagger + panel entrances + rare-state fades. The 510-line `EventSettingsForm` is decomposed into section
components under one form, and leaving settings with unsaved edits now warns (a `beforeunload` + a back-link
confirm Dialog). A dev-only, design-key-gated **motion tuner** (`?key=`) writes `--tune-*` CSS vars live so
timings can be finetuned on prod without a rebuild ("build-direct + tune-live").

**S5 ✅ (2026-06-21): review-takeover polish + smoother album reveal + require-accounts free/default-on.**
P1 (`24e3fa7`): the review bulk bar groups Select-all beside Hide/Approve (count left), the action buttons
carry their count (`Approve (All)`), the heading is a bold "Review" + a muted count, and the "black squares
then 1-2s load" album reveal is gone (the takeover preloads the just-approved photos during the all-caught-up
beat + `MediaTile` shows a shimmer skeleton until a photo decodes). P2 (`4b75705`/`cddba33`): **"Require
accounts to upload" is now FREE for any tier + DEFAULT-ON** (the `enforce_event_pro_gates` Pro-gate trigger
dropped + the column default flipped) — anon uploads capture no emails, so free events seeded no new users;
allowing anon is an opt-in toggle with a consequence-confirm. All live-verified (the confirm via Will's
eyeball — the MCP renders the animated settings route as dimmed/empty, a capture blind-spot). The
**Reel Curation Foundation** is PLANNED (Part 3 of the S5 plan → ROADMAP "Highlight reel"; its own round).
**▶ NEXT = the Reel Curation Foundation round / the next P5 host-app slice / the roadmapped user-profiles +
social program.** The S3+S4+S5 specs live in the slice plans (`~/.claude/plans/p5-s3-gallery-first-event-page.md`
+ `please-continue-on-the-concurrent-scott.md`); the program arc + invariants are in the memory
`project_v1_rebuild_program.md`. Settled program decisions (hybrid doorbell gallery, monochrome identity +
state-feedback-colored, emil-design-eng the binding craft bar) are in the memory/plan; don't re-litigate.
A **NEW major program — user profiles + social** — is roadmapped to run next (see
[`ROADMAP.md`](ROADMAP.md) + the memory `profiles-social-program`).

The **v1 foundation is built and verified in production** — the focused phased build is complete and the
project was in **one-off-task mode** (a goal → its own small plan → build → verify on partyreel.com →
record) until the program above took over as the main thread. Everything live is mapped in [`SYSTEMS.md`](SYSTEMS.md) (the index → the `systems/` deep docs);
the dated shipping history is in [`CHANGELOG.md`](CHANGELOG.md). Live + verified: host auth (incl. email+
password), the create wizard + QR designer + first-time welcome + custom slug, the unified guest event
page (live polling gallery, 3-state visibility, verified-email gate, saved events), guest + host upload,
moderation + the daily lifecycle cron + the "Recently deleted" recovery, the storage-cap tier model +
Stripe (Pro subs, Event Pass, portal), the growth loop + link analytics + the notification bell, the
album lightbox + per-item download, the admin portal (R1–P7), the marketing site (7 rounds + polish arc),
media durability (all 3 pillars + the deletion-aware backup prune, shipping in dry-run), and the
data-layer security hardening. Canonical domain
**partyreel.com**.

**Only scaffolded:** the highlight reel (DB scaffold only; the build is tabled pending a worker-platform
decision — see [ROADMAP.md](ROADMAP.md)).
## Infrastructure

All backing services run under the dedicated owner account **partyr33l@gmail.com ("P3")** (the migration
is recorded in [`CHANGELOG.md`](CHANGELOG.md)):

- **Supabase** project `ddafaemglzmuekbtjwzn` (P3 "Partyreel Team", Pro; daily backups on; the public
  `avatars` Storage bucket holds profile photos). ⚠️ the P3
  Supabase **MCP may be connected read-only** — the DB tool group returns a `permission` error if so;
  re-auth with the DB scope or use the dashboard SQL editor.
- **Cloudflare R2** account `8bd90d2f6a374d6cdff2f379e929b060` — bucket `partyreel` (primary, ENAM) +
  `partyreel-backup` (Bucket-Locked, WNAM).
- **Stripe** `acct_1TcStrPtjqmVkBwk` (**TEST** mode — live cutover is a launch task). **Sentry** org
  `partyreel`. **Resend** (`partyreel.com` verified; auth email routes via Resend SMTP). **Google OAuth**
  P3 web client. In-app operator `partyr33l@gmail.com` (`is_admin` + TOTP MFA).
- **"Allow new signups" must stay ON** (account-from-guest + email+password create all depend on it;
  anonymous sign-ins stay OFF per ADR-0008).
- **Deferred cutovers** (not blocking): Vercel hosting (still willgibs **Hobby** → P3 **Pro** at launch),
  domain + DNS (GoDaddy → P3 Cloudflare), the GitHub repo (`github.com/willgibs/partyreel` → P3 at sale).

## Pre-launch / human-blocked

The launch-gated + human/config tasks live in [`ROADMAP.md`](ROADMAP.md) → **Launch checkpoint** (each
tagged `[human]`/`[eng]`/`[content]`): leaked-password protection, Stripe test→live, `MONTHLY_INGRESS_BYTES.pro`,
the real `/privacy` page, the demo-event swap, the committed RPC suite, the Sentry email-alert-rule check,
the pre-launch test-data reset, the backup-prune live-flip (`PRUNE_MODE=live`, post-launch).
Resolved config (custom SMTP, "allow signups" ON, the `{{ .Token }}`
template, the account-password dashboard settings) is recorded in [`CHANGELOG.md`](CHANGELOG.md).

**Already configured — DO NOT redo:** R2 buckets + creds + CORS + abort-multipart lifecycle rule; the apex
`partyreel.com` domain; `CRON_SECRET` (Vercel); `profiles.is_admin` for the operator; the Stripe **TEST**
products/prices + webhook endpoint + Billing Portal + the 5 env vars; Supabase TOTP MFA +
`admin.partyreel.com/auth/callback` in the redirect allow-list + `NEXT_PUBLIC_ADMIN_HOST` in Vercel
(`partyr33l@gmail.com` holds the TOTP factor; break-glass = delete it in the Supabase dashboard,
`auth.mfa_factors`); the Sentry project + DSN + 4 env vars; the media-backup Worker + the DB-backup GitHub
Action secrets; the deletion-aware prune (deployed in dry-run, both crons) + its shared `PRUNE_API_SECRET`
(Vercel + the Worker).

## After any change

Advance this file (you-are-here), the owning [`systems/`](systems) doc (refine in place), the
[`ROADMAP.md`](ROADMAP.md) bucket, and move any shipping narrative to [`CHANGELOG.md`](CHANGELOG.md) — same
change. Re-run `get_advisors` after any DDL and confirm the expected set (see
[`systems/database-security.md`](systems/database-security.md)).
