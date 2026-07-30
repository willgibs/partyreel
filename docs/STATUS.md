# Partyreel — Status (you-are-here)

> ROLE: the live snapshot — what's true right now + what's blocked on a human.
> BELONGS HERE: current state, the infrastructure summary, the pre-launch pointer, "after any change". · NOT HERE: shipped history (→ [`CHANGELOG.md`](CHANGELOG.md)), how systems work (→ [`systems/`](systems)), what's next (→ [`ROADMAP.md`](ROADMAP.md)).
> GROWS BY: integrate-in-place + prune (it's a snapshot — keep it short and current; move shipped narrative to CHANGELOG).

**Updated:** 2026-07-08

## THE ELEVATION PROGRAM (the active thread, 2026-07-02)

A standing-orchestrator program is taking all four surfaces (App / Marketing / Admin / `/design` lab) to
magic-grade before a later, separate launch round. **The program plan (rounds, gates, versioning
protocol, Round 0 runbook) lives at `~/.claude/plans/you-are-the-standing-humble-unicorn.md`** — read it
before picking up any program work. Headlines a fresh agent must know:

- **Branch protocol supersedes straight-to-main** (see CLAUDE.md Git): work rides the `launch-prep`
  integration branch; tracks commit to `lp/<track>`; the orchestrator alone integrates, applies
  migrations, deploys workers; `main` is frozen except milestone merges + hotfixes.
- **Live red-team target between milestones** = `https://partyreel-git-launch-prep-willgibs.vercel.app`
  (branch-scoped env + R2 CORS + Stripe TEST preview webhook wired; Supabase redirect allow-list is
  Will's dashboard step).
- **Rounds**: R0 bootstrap + EXIF strip ✅ (milestone-0 `f99d9cc`) → R1 Decision Studio ✅ + R2 Reel
  Engine + Foundation ✅ **(milestone-1 merged 2026-07-08: the full 14-style canvas engine, the composer
  swap + $0 client-encoded export, the ADR-0021 pricing slice, the ADR-0020 forensic capture track →
  [`CHANGELOG.md`](CHANGELOG.md))** → R3 Reel Experience (NEXT: guest surfacing + the ruled composite
  reveal) → parallel tracks (Marketing build · R4 Growth · R4b Social · R5 Notifications · R6 Polish ·
  R7 Admin) → R8 Hardening + Certification.
- **Gates**: lab-validate before shipping creative magic; options-doc + Will's ruling for one-way-doors;
  NO launch switches (those accrete in ROADMAP's Launch checkpoint).
- **T1 RULING DAY COMPLETE (2026-07-05)** — all seven decisions ruled, recorded as
  [ADR-0019](adr/0019-social-privacy-host-controlled-guest-list.md) (host-controlled guest lists, open
  follows, notification tiers) · [ADR-0020](adr/0020-forensic-capture-csam-policy.md) (A3-lite capture,
  1-year REPORT-Act preservation, reactive CSAM posture) ·
  [ADR-0021](adr/0021-pricing-numbers-reel-caps-ingress.md) (reel 30s/60s, ingress 3x cap, renewal $15)
  · [ADR-0022](adr/0022-reel-guest-surfacing.md) (publish switch, adaptive placement, guest downloads,
  hybrid source, NO end-card) + two lab decisions on their touchpoints (marketing = B+C hybrid with an
  IA gate before the build; reveal = the Assembly x First-frame-held x Lights-down COMPOSITE). Cinematic
  canvas parity PASSED (unlocks the 13 style ports; watermark redesign to bottom-right required). The
  post-T1 fan-out is the program plan's active section.
- **T2 DEVICE SESSION + T2.5 MARKETING-IA WALK COMPLETE (2026-07-08)** — the composite reveal is ratified
  as-built (tuner stays in the lab; R3 wires it to production), the scrim watermark stands (re-grade when the
  real logo lands), export quality passed (the render-source variant slice dropped), and videos-in-reels is
  the diagnosed R3 headline (poster backfill + code fix + RENDER_VERSION bump; motion video = the Pro slice).
  The marketing IA is ratified in [`decisions/t2p5-marketing-ia.md`](decisions/t2p5-marketing-ia.md): the
  MADE-FROM home arc, the `/reel` flagship route, product-dark/resources-light, the secondary-route plan,
  interim license-free media. The leading-copy VOICE is spun into its own exploration round (the remaining
  gate before Track B copy; round-2 boards in flight on Will's golden-set rulings). **R3 Reel Experience
  is the open critical path.** Slice B SHIPPED 2026-07-08: the LAMBDA/REMOTION TEARDOWN (Will: "teardown
  is a go") — the canvas engine + on-device encode is the reel's ONLY render path; ~11.9k lines + 5 deps
  + 7 env vars deleted (the production-scoped env copies + the AWS sub-account close wait for M2 / the
  launch checklist). Slice A SHIPPED + LIVE-VERIFIED 2026-07-21: videos draw their poster frames
  everywhere (posterMode footgun deleted, RENDER_VERSION 3, the caller-less poll surface pruned), the
  demo event's 3 legacy black videos replaced with poster-bearing re-uploads, and TWO found-live bugs
  fixed en route (a hidden-tab video upload wedged the queue: measureFile timeout-guarded; and the
  img-poisoned CORS cache blacked out every reel clip: the engine fetches `cache: "no-store"` — see
  [`systems/uploads-and-r2.md`](systems/uploads-and-r2.md)). Remaining R3: slice C reel-UI lab round
  (IN FLIGHT: 3 directions building on the `reel-experience` touchpoint; Will ruled the reel is BORN by
  an explicit Create act) → slice D guest surfacing + the reveal (0028 anon set grows 4 → 5) → M2.

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
eyeball — the MCP renders the animated settings route as dimmed/empty, a capture blind-spot).

**Reel Curation R1 ✅ (2026-06-21, `ec49410`): Add to Reel + Uploads/Reel tabs.** The host marks approved
media as "in the reel" (a violet `Clapperboard` chip distinct from Like, in the tile overlay + lightbox) and
views the curated set in a new **Reel tab** (event page now has Gallery | Reel | Reviews, `?eventTab=`). Built to mirror
likes: a grant-locked `reel_items` table + an access-checked `add_to_reel` RPC + a host-only `ReelProvider`.
Curation is FREE; one reel/event; add-order; host-only + host-private + approved-only. Live-verified
end-to-end. The `--reel` violet + the `Clapperboard` icon are RATIFIED (Will, 2026-06-21); the tile-action
order is `reel, like, download, hide/show, delete` and the chip stack/slide feel is signed off.

**Reel R2+R3 ✅ (2026-06-21, `a7405d6`): the Reviews tab + the moderation-disable auto-approve confirm.** The
pending queue is now the third tab (**Gallery | Reel | Reviews**), visible only while moderation holds uploads,
with an AMBER count and Reviews-as-landing-tab when a queue waits; the full-screen takeover is mounted by
`ReviewTakeoverProvider` (a tab sibling, so it survives switches). Turning moderation OFF pops a count-named
confirm and `approveAllPending` auto-approves the queue on save (the server enforces "live mode holds no
pending media"). Live-verified end-to-end. (Album bulk-select, drag-reorder, and reel generation all
shipped since; guest-facing reel surfacing is the remaining deferred slice — see the reel roadmap below.)
**Event-page feed redesign ✅ (2026-06-22, `4d3ddcc` + beat hotfix `c316b21`): the host event page is now a
stacked, pill-filtered media-forward feed** (the Gallery|Reel|Reviews TABS retired). `EventFeed` mirrors
`DashboardFeed` (`?section=`, urgency-ordered `Review · Gallery · Reel`); the review pop-up is inlined into the
`ReviewSection` (driven by `useReviewTriage`); a **contextual floating action bar** morphs by the scrolled
section (Review Select/Approve all → bulk bar, Gallery Add, Reel disabled Create reel). A=Condense / B=Fade /
C=FLIP ratified in the `/design/event-feed` lab; `motion` dropped. The live red-team caught + the hotfix fixed
a `parseInt("2.5s")`-vs-minified-time beat bug (`read-css-ms.ts`). Live-verified end-to-end incl. the beat +
the FLIP + mobile 375px. Current truth: [`systems/host-app.md`](systems/host-app.md). Known live-tune item
handed to Will: the scroll-spy hand-off on a short feed.
**Album bulk-select ✅ (2026-06-22, `6e5e1c7` + clamp hotfix `5a73410`): the Gallery section gains a Select
mode** (Select button / long-press → multi-select → a floating bulk cluster: Add to reel · Like · Hide/Show ·
Delete, smart Hide/Show label, count-named delete confirm). Shared `useSelection` (prune-not-reset) +
`SelectableMediaGrid` extracted from Review; a `HostSelectionProvider` (mirrors `HostAddProvider`) holds the
state, the gallery grid registers its optimistic bulk handlers. Hide/Show + Delete = new plain RLS bulk
mutations; reel + like loop the existing idempotent RPCs + one summary toast. Live-verified end-to-end (incl.
the live-caught clamp-reflow fix + the cross-tenant no-op + mobile). Current truth:
[`systems/host-app.md`](systems/host-app.md).
**Reel drag-reorder + uniform Reel/Review grids ✅ (2026-06-22, `ae5fc24`): the Reel is orderable by drag**,
and the Reel + Review render as UNIFORM grids (Gallery keeps the masonry "wow"). A `layout` prop on the shared
grids; our own dependency-free `useSortableGrid` (pointer drag + 2-axis FLIP + geometric drop-index, beats
dnd-kit on a uniform grid); a `reorder_reel` SECURITY DEFINER RPC (set-equality guard, grant-locked). A
Reorder/Done header button → a numbered sortable grid. Live-verified (desktop drag + persist across reload +
mobile touch press-and-hold + the rolled-back RPC contract). Current truth:
[`systems/host-app.md`](systems/host-app.md).
**Thumbnail/preview variant ✅ (2026-06-22, `729e781`): tiles serve a small CLIENT-generated WebP preview**, the
lightbox + Save keep full-res. The browser makes a ~640px preview at upload (photos downscale, videos a poster
frame), uploads it as the `preview` R2 variant (size-bound), records `preview_key`. $0 generation (no CF
transform fee — Will's storage-billed-model call). A migration added `preview_key` to the guest-gallery RPCs
(the gap). Live-verified: photo tile 253KB→16KB (~94%), video 788KB→8.5KB poster img (~99%), old media fall back,
lightbox full-res. Current truth: [`systems/uploads-and-r2.md`](systems/uploads-and-r2.md).
**"Download all" zip export ✅ (2026-06-22, `bc4d5fb` + download fix `34d0a9f`): slice 3 done.** Host + guest
galleries zip a whole album via a new streaming export Worker (`workers/export`, off Vercel, ADR-0018); a Next
mint route authorizes + HMAC-signs the key list, the browser top-level form-POSTs it, the Worker streams a
store-zip (`client-zip`) straight from R2. Concept B config modal + bulk "Download selected" + the guest album;
`export_log` + the `export_enabled` kill-switch at `/admin/exports`. Live-verified end-to-end (the full chain +
every fail-closed gate + a real 9-file zip downloaded). Current truth: [`systems/uploads-and-r2.md`](systems/uploads-and-r2.md).
**Highlight Reel GENERATION ✅ (2026-06-22) + PHASE 2 the STYLE CATALOG ✅ (2026-07-02): the North Star ships.** S1-3
(spike `d8b6dba` / composer `4806e71` / `.mp4` export `f460456`) proved + shipped Remotion Lambda→R2, the live in-app
`@remotion/player`, and the Download-video export. **Phase 2 (`0cfcc4f` + fixes `b6d1767`/`fafba3c`): the host composer
now offers a 14-style CATALOG (8 media-first moods + 6 stylized treatments, a grouped popover) + a portrait/landscape
ORIENTATION; SHUFFLE REMOVED (deterministic seed); a styleId dispatcher (pure `style-registry` + remotion `StyleDispatch`
with the watermark hoisted so all styles stamp it); `highlight_reels.style_id/orientation` + a new authenticated-only
`upsert_reel_config`; `fitClip` now runs in prod; `RENDER_VERSION` 2 + `deploy-site` pushed the treatments into the
Lambda bundle.** Live-verified end-to-end (Layered parallax + Landscape → player swaps, config persists, the mp4 renders
+ downloads: `status ready`, $0.024/~3min). ★ Two render fixes the live red-team caught (from the version bump forcing
re-renders): `overwrite:true` (stable output key) + a 240s Lambda function (heavy treatments hit the 120s ceiling).
Current truth: [`systems/host-app.md`](systems/host-app.md) "Reel composer" + the `project_reel_generation_spec` memory.
**▶ NEXT (fully specified for a fresh agent in [`specs/reel-v1.md`](specs/reel-v1.md) → "Next slices — roadmap"):**
(A) **treatment render OPTIMIZATION** (blur-downscale — treatments cost ~4× moods; recommended first, self-contained);
(B) **guest-facing reel surfacing + download** (the next feature — a new `/e/` surface + an anon capability-token reel
RPC; needs a planning round with Will); plus follow-ups (lab→StyleDispatch DRY, style-popover thumbnails, drop the
legacy `theme` column, AWS concurrency 10→2000). Beyond the reel: the roadmapped user-profiles +
social program. The S3+S4+S5+Reel specs live in the slice plans
(`~/.claude/plans/p5-s3-gallery-first-event-page.md` + `please-continue-on-the-concurrent-scott.md`); the
program arc + invariants are in the memory
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

The **highlight reel is now fully built** (curation R1-R3 + bulk-select + drag-reorder + the live composer + the
`.mp4` export on Remotion Lambda); the remaining reel work is guest surfacing + Pro video trim (see the NEXT above).
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
