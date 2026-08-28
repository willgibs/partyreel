# Partyreel — Changelog (shipped history)

> ROLE: the shipped-history archive — what shipped, when, with what commit + verification. Read this for "when/how did X ship," NOT to learn how the system works today.
> BELONGS HERE: dated, per-initiative shipping + verification narratives. · NOT HERE: how the system works now (→ [`systems/`](systems)), what's next (→ [`ROADMAP.md`](ROADMAP.md)), current state (→ [`STATUS.md`](STATUS.md)), why-decisions (→ [`adr/`](adr)).
> GROWS BY: append (newest on top). This is the ONE deliberately append-only doc — it is kept OFF the orient path, so its length never muddies a fresh agent.

Dates are when the work was shipped + verified on partyreel.com (test data is disposable). Commits are
included where recorded; the full original prose lives in git history. The foundational build (Phases
0–4 + 6) is summarized at the bottom.

---

## 2026-08-28 — MILESTONE-4: the pricing round + the AI-discoverability layer

`launch-prep` merged to `main` (`--no-ff`, tag `milestone-4`, `62220cb`; 55 files, +4,162/−624),
prod READY + verified at the merge SHA. The milestone carries the full pricing round (below) plus
the **AI-discoverability layer** (`17e1d87`), Will's strategic bet on assistant recommendations:
`/llms.txt` + `/llms-full.txt` (llmstxt.org format; pure builders derived from the pricing/voice
constants; the grounded case with an honest when-it-is-not section and category-level comparison
per Will's ruling; builders are CLAIM_FILES so the social-proof/backstop fence covers the AI
surface; 10 tests incl. link-integrity against real routes); robots.ts welcoming 14 AI crawlers by
name (+ /account, /welcome, /design hygiene disallows); SoftwareApplication JSON-LD sitewide;
Organization email/contactPoint/foundingDate; sitemap lastModified from content frontmatter; the
press boilerplate + fact sheet extracted to `constants/press.ts` (one quotable home). Research
honesty recorded: no major model confirmedly consumes llms.txt yet (Semrush 2025), so the layer
treats it as the cheap forward bet while the real weight sits on crawlability + retrievable facts.

**Prod verification at the SHA:** all three text surfaces 200 on partyreel.com, robots showing 15
UA blocks, SoftwareApplication in the homepage HTML, /pricing serving the stacking copy; the
subscription webhook E2E on the NEW code (API create→cancel: pro provisioned with `event_slots`
null → downgraded to free with recompute, ledger untouched); the pass-purchase E2E COMPLETED with
Will's test-card entries: purchase #1 minted the ledger row (initial/$24, a clean 365-day window,
recompute -> event_pass/75 GB/1 slot) and purchase #2 proved STACKING through the branch old code
refused (2 rows -> 2 slots/150 GB, the dashboard reading "1 of 2 events used, 0 B / 150 GB").
Both TEST payments refunded, rows deleted, the profile recomputed back to Free.

## 2026-08-27 — The pricing round: /pricing rebuilt from zero + the Event Pass economics made true (ADR-0025)

Will's brief: "if the pricing page didn't exist yet, what would the ideal version be?" — with Biograph
as the polish codex ("if I could give you a guidebook of what I mean when I say polish"). Planning
surfaced two product rulings the page depended on, so the round shipped billing-first
(`72ad166` → `015df15` → `092634c` on `launch-prep`; the docs/lab commit follows).

**ADR-0025 (Will's rulings, built the same day):** Event Passes STACK (each purchase = a windowed
`event_passes` ledger row granting +1 event slot + 75 GB for its own year; `profiles.event_slots`
overrides `tier_limits.max_events` in SQL via coalesce) and Pass→Pro converts as PRORATED CREDIT
("nothing gets lost, nothing gets banked"): checkout stamps `pass_credit_cents`, the webhook grants it
as Stripe customer balance (idempotency-keyed), consumes every live pass, clears the chain. Renewal
chains a new window onto the soonest-expiring active pass. Migration applied + advisors clean (the
expected deny-all INFO for the new table) + a rolled-back contract check (dup-session refused,
inverted window refused, consumed-without-reason refused). Pure window math fixture-tested (14 tests);
provisioning recognizers re-pinned; 1162 total green.

**The page:** eight sections replacing the three-card wireframe — quiet hero (the byte-pinned golden
line) → paper chapter: the Free/Pro identity pair (Pro = the sheet in INK, a full token inversion; the
in-card size segmented control replaced three stacked CTAs) + the Event Pass stretch ticket (dashed
stub rule; the $15 renewal price surfaced on marketing for the first time; stacking + credit lines) →
the unlock grid (third text tone for the Free floors) → the find-your-size calculator (curated stop
ladder + video/hosting-again forks over the pure `recommendPlan` brain, 7 tests) → the full comparison
matrix (sticky plan header at lg, tooltip fine print via the portal rule, dashed/solid divider
grammar, mobile row-label collapse) → the always-included band → pricing FAQ (`.mkt-acc` + FAQPage
JSON-LD from one source) → CtaBand. Every number derives from `tiers.ts`/`limits.ts`; ingress stays
unmarketed (test-enforced); no em-dashes; no invented proof. Will's Biograph-codex notes bound the
design (weights conservative, third tone sparingly, shadows only where photos stack, chapter rhythm
independent of tier identity, whisper-gray banding).

**Verified:** the full gate; local DOM-driven interaction pass (the in-app pane's paint-freeze makes
screenshots lie, so hydration/switcher/calculator/FAQ asserted via events + computed styles); live on
the preview alias in real Chrome — full-page desktop walk (the screenshot gate), mobile-emulation
collapse checks (no horizontal scroll), tooltips, and all four checkout branches with a seeded
mid-term pass: Pro holder buying a pass → the exact 409 toast; a pass holder buying a SECOND pass →
a real $24 Stripe TEST session (the branch old code refused); pass holder → Pro → session metadata
carried `pass_credit_cents: 1742`, the wire-exact floor(2400 × 265/365); renewal → a $15 session
stamped `renewal: "1"`. Seed torn down after. **Deferred to the milestone merge:** webhook E2E on a
COMPLETED purchase — Stripe delivers to prod's registered endpoint, which still runs `main`'s webhook
(stated loudly, not silently downgraded). Rides along: the A35 video-gate
copy fix, the stale per-file-limits doc drift (PRICING.md + tiers.ts), the stale `#FB4817` accent
claim in marketing-content.md.

**Annual Pro, recommended → ruled → built the same day (`e248c77`):** $90 / $190 / $390, exactly
×10 the monthly ("two months free" — the deepest uniform discount the 2 TB tier's ~$372/yr
worst-case cost permits, and the conservative end of the only-move-in-the-customer's-favor door).
Three yearly Stripe TEST prices on the existing Pro products; `STRIPE_PRICE_PRO_*_YR` env trio in
all three homes; `tiers.ts` yearly plans with `plansForTier` gaining a defaulted interval param
(every pre-annual caller keeps meaning) + `annualPlanFor` + a ×10 drift-guard pin; checkout schema
+ `planForPriceId` accept the yearly ids (webhook provisioning + the ADR-0025 pass credit compose
for free). /pricing: the cadence toggle above the pair (size × cadence as independent axes),
yearly CTA note, a Billing row heading the matrix, the calculator offering the annual sibling on
Pro verdicts. Live-verified on the preview: toggle swap, Yearly × 2 TB → $390/yr, a real $90/yr
Stripe session with `plan_id: pro_100_yr`, and the portal's plan-change screen listing both
cadences with proration.

**The sitting, ruled + wired the same day (`20057e1`):** cards → V2 Stacked photos ("within the card
v2 has a nice balance"): real event photos fanned above each card head (Free two grayscale, Pro four
vivid on ink), hover spreads the stack, soft shadows via the photo-depth exception. Calculator → V1
Album fill ("definitely the V1 direction"): the slider fills a 48-tile album wall on the real gallery
grammar; video swaps timecoded clip tiles; the bare meter retired. Will's mono flag ("don't know
where this mono font is coming from") swapped the price register pricing-wide: money in the display
face (Urbanist + tabular digits), values in Inter; Geist Mono survives only as the wall's timecode
chips. Verified on the deployed preview (stacks/spread/wall/fonts; the same walk surfaced a DEV-ONLY
theming lie now recorded in testing-verification.md: `next dev` + `html.dark` can render paper
surfaces dark while the production build resolves them light).

## 2026-08-27 — The consolidation round + MILESTONE-3 (one boot surface for parallel sessions)

**The repo became the single self-sufficient boot surface for any agent, and prod caught up to the
marketing identity build** (launch-prep `b6f9841`+`5e6375e` → milestone-3 merge `310e504`, tagged).
Driven by Will's call to run parallel top-level sessions safely: three audits (docs / git /
out-of-repo context) + a stress pass found two opposite inheritance failures (repo-root sessions
inherited a memory that made every reader "the standing orchestrator"; worktree sessions provably
inherit nothing), a 24-item stale-era hit-list stacked across three doc generations, 14 out-of-repo
doc pointers, and total-but-safe branch debris. Shipped: **`docs/PROGRAM.md`** born (charter, the
new **Orchestrator/Agent role system** with Will's two rulings — max one Orchestrator, Agents
handoff without one live, succession-ready round closes — gates, round definitions, the versioning
protocol, both init templates); **STATUS.md rewritten** as the thin snapshot; CLAUDE.md's era
keystone + "Sessions & roles" + ONE canonical Git protocol statement (three partial copies
collapsed); the era reframe across README/SYSTEMS (the false "reel is scaffold-only" section
killed)/ROADMAP (duplicate loop deleted, shipped narratives pruned, QA #19 + the venue-NAT limiter
restored to the queue, the expired CI-blocker rewritten after a live check showed the DB-backup
Action green daily)/PRD/PRICING (stale tiers.ts snapshot pruned; grandfathering policy homed);
`docs/systems/README.md` folded into SYSTEMS.md. **Memory distilled 33 → 17 files** under a
retirement invariant (every lesson grep-verified into a repo home first — the four QA migration
lessons, the Tailwind standalone-translate gotcha, two P4-era craft rules, and the
callback-ref-sentinel rule were the misses, all homed). **Git teardown**: all 19 worktrees removed
(clean, no --force), 35 local + 24 remote branches deleted (every one re-verified 0-ahead or
patch-equivalent via `git cherry` at deletion time), ~26 GB reclaimed; tags + scripts + skills kept.
Verified: the full gate (1143 tests) + a **fresh-agent boot quiz** run in an isolation worktree — the
agent independently detected its worktree had materialized at `main`'s tip and self-corrected via the
new BASE_CHECK (live-validating the documented trap), then answered all 8 boot questions correctly
from the consolidated docs and confirmed every old contradiction fixed. **MILESTONE-3** merged
`--no-ff` + tagged with prod READY at the merge SHA and a marketing smoke pass on partyreel.com.

## 2026-08-27 — R6: the Help Center arc (system + the elevation passes)

**The help center became a designed product surface** (launch-prep `fa7a9bd`→`671c652`, 1122→1143 tests).
The SYSTEM round: taxonomy v3 (nine lifecycle categories, each mapped to its marketing rung; `qr-and-invites`
split out, `troubleshooting` new with its seed article), the ranked **⌘K search palette** (fs-free scorer,
match emphasis, section deep links only when a heading is the sole match reason, a Pages tail onward, radix
Dialog + `portalSkinProps`), answer-first articles (the frontmatter description renders as the "In short"
lead; scroll-spy ToC on pure `pickActiveHeading`; one delegated copy-anchor island; prev/next; keyword-scored
related; an honest feedback row → `/contact?about=` with a build-time allowlist prefill), per-article OG
cards, `content/help/AUTHORING.md` as the content agent's standing brief, and MDX vocabulary
(`Steps`/`Kbd`/`UiLabel`). The ELEVATION passes (Will's "wireframe" review → four screenshot-iterated
rounds): DOM-art category emblems + the hero emblem strip, real-photo Start-here scenes, THE FILMSTRIP
numbers band (digit pop-in over live constants), both routes moved into the **(cinema) group** (dark
overlay nav; `PaperChapter` bodies; the strip and the article's In-short card STRADDLE the cut), article
stage art (the category emblem large in light ink), `AlbumShowcase` upgraded to eight real manifest
photographs, and the sticky-ToC root-cause fix (`lg:items-start` had collapsed the rail's sticky runway).
Two site-wide rulings landed and are recorded in [`systems/design-system.md`](systems/design-system.md):
the **72px-class page-H1 ladder** (17 surfaces swept) and the **mono-for-numerals-only ruling**. Verified:
a 28-check scripted red-team (palette keyboard walk, deep links, anchors, feedback, prefill + a
crafted-slug injection case, forced-light in a dark session, reduced motion) ran green on the round's first
ship AND re-certified on the final state; every deploy alias-swept.

## 2026-08-26 — R5: routes-complete (the last new marketing surfaces)

The site reached **100% routes-complete** (launch-prep `33ee6ac`→`516219f`, 1121→1122 tests): `/about`
(mission & principles, footer-only by ruling, zero team framing), `/press` (boilerplate, fact sheet, three
downloadable brand marks generated from the shipped icon geometry), two seed help articles (profiles +
your-data, closing the guests GoDeeper gap), the `LegalArticle` two-register shell (privacy 8 / terms 10
accurate plain-language draft sections; the "In short" rails survive the future legal rewrite; stable
section ids are the legal agent's anchor contract), and the branded marketing error screen (the 404's
sibling with the "500" missing-frame strip). All verified by scroll-capture screenshots + an all-green
alias sweep.

## 2026-08-06 — MILESTONE-2: R3 the Reel Experience (host + guest) + the on-device review fixes

**The North Star's experience round: the reel became a full host + GUEST feature** (tag `milestone-2`;
R3 integrated 2026-07-30, R3.1 2026-08-04 — its own entry below, review fixes `6bc779d` 2026-08-06;
1031 → 1063 tests across the round). Built as three tracks off ADR-0022/0023 rulings, integrated by the
orchestrator through a sustained 529 outage (inline building + agent resumes):

- **Track A, the substrate:** the engine gained a `maxDim` thumb path (pre-scale transform over the SAME
  draw code; full-res-reporting DrawEnv + a shared scratch pool — byte-identical full-res output proven),
  a shared decoded-bitmap cache (in-flight dedupe + LRU; the `no-store` CORS fetch stays), IO-gated
  players, the deterministic `pickQuickAdd` blend (likes-rank + recency decay + per-uploader coverage +
  photo/video mix; no Math.random), and the GHOST read-filter (`listReelItems` joins media
  `approved+hidden`) — which also repaired the LIVE prod demo reel (12 rows / 3 ghosts, reorder bricked;
  pill 12→9, drag persisted after the fix).
- **Track B, the host experience:** the shared `PosterCard`, the ratified composite reveal transplanted
  verbatim (canvas mounted frame 0, released at open; reduced-motion fade script), the builder's
  Create-birth (theater-first, save concurrent — ★ the panel swap waits for the THEATER: `markCreated` at
  the settled exits, found live when the RPC's resolve killed the choreography mid-act), the Marquee, the
  Studio route (sheets + the filmstrip dock on `useSortableGrid`), and the share card over the one publish
  seam.
- **Track C, the guest surface:** migration `20260730120000` (`guest_visible` + `set_reel_guest_visible`
  + the 5th anon RPC `get_event_reel_by_qr_token` whose RETURNS TABLE is the 8-key allow-list, + the
  membership-predicate `reorder_reel` guard), `getGuestReelContext`'s two access arms, the two ruled card
  placements, the arrival-cut overlay, and the download route + pure client ladder (fresh artifact →
  self-encode → stale → ask-the-host; `reel_guest_download` limiter; `no_reel` oracle-free). Red-teamed on
  the alias: leak probes dark across all five event states, the 8-key shape grep-clean, the ladder forced
  ×4, limiter 429s at breadth 15, publish refusals + ghost reorder + freshness both directions live.
- **Will's on-device review round (2026-08-06)** passed R3.1's composition and drove two real fixes
  (`6bc779d`): small events had NO create path (quick-add's button gated at 4 items post-ADR-0024 + the
  action-bar pill registered unconditionally while `create()` refuses at zero — a silent dead tap; now
  offered at ≥1 with honest small-pool copy, and the pill exists only when a tap would work), and the
  guest cut's COLD open jittered (the choreography started on the gallery promise while the engine's
  `no-store` fetches decoded mid-flight; the player gained `onAssetsReady` and the overlay waits, 2.5s
  cap). Plus test-data repairs: Test Wedding's QA-debris media wiped (3 rows with destroyed R2 objects +
  2 synthetics) and reseeded.

## 2026-08-05 — Vercel hosting migration: willgibs account → P3 "Partyreel Team"

A co-tenant project drained the old willgibs Vercel account's free tier; Vercel paused the whole
account and partyreel.com + www + admin + the launch-prep alias all served **402** (prod dark, builds
blocked). Ruled permanent move to the P3 Vercel account (Hobby now, Pro at launch — the cutover
STATUS had already deferred).

- **New project**: imported `willgibs/partyreel` into the P3 "Partyreel Team" (the GitHub App already
  covered the repo — zero grant friction). Settings parity verified via API: the ignored-build-step
  command verbatim, Node 24.x, region default, deployment protection off (`ssoProtection: null`,
  program mode), prodBranch main.
- **Env restore**: 37 rows. 35 mirrored from the old project (encrypted rows via per-id API decrypt;
  the 11 Sensitive rows sourced from `.env.local` — the swappable-values policy paying off), plus 2
  computed: `NEXT_PUBLIC_SITE_URL` preview@launch-prep = the new alias, and a NEW Stripe TEST preview
  endpoint (`we_1U1I3GPtjqmVkBwkjUqWGpvR`) whose signing secret landed before the first real build
  (NEXT_PUBLIC_* is build-inlined; order mattered). The 7 dead reel-render rows (REMOTION_* ×6 +
  REEL_RENDER_WEBHOOK_SECRET) were DROPPED per ruling — the Lambda path was torn down 2026-07-08, so
  M2's env-removal task became a no-op; `.env.example`'s staged block went with them.
- **Domain cutover**: registrar is external (GoDaddy), so the move was pure `_vercel` TXT
  re-verification with pointing records untouched (zero propagation window). Apex verified + serving,
  www 308→apex, admin 307→/admin. New branch alias
  `partyreel-git-launch-prep-partyreel.vercel.app`; its exact `/auth/callback` added to the Supabase
  redirect allow-list (old-alias entry kept until decommission).
- **Verified**: robots/sitemap hosts, demo `/e/`, pricing/login/blog, cron 401-unauth vs authorized
  full purge sweep (also proving the R2 object creds from P3 runtime), crons registered + enabled,
  env inventory complete, and a full Google OAuth round trip on the new alias landing signed-in on
  the dashboard.
- **R2 CORS closed next-day (2026-08-06)**: Will restored the partyr33l wrangler OAuth + Chrome
  session; the new alias origin was appended read-then-merge via `wrangler r2 bucket cors set` and
  proven three ways: preflight 204 (hostile origin still 403), the Film-strip poster canvas drawing
  live on the alias (CORS fetch + decode), and a browser export POST invoking the Worker with an Ok
  stream (EXPORT_SIGNING_SECRET Vercel↔Worker parity confirmed; a bogus-token probe correctly got
  403). One transient uninvoked 503 was observed on an earlier attempt (edge blip, not the app).
- **Decommission complete (2026-08-06, Will's confirm)**: old Vercel project deleted (verified
  not_found), old-alias Stripe TEST endpoint `we_1TowqZ...` deleted (2 endpoints remain: apex + new
  alias), old-alias removed from the Supabase redirect list (6 entries) and from R2 CORS (3 origins),
  old token retired from `.env.local`. Bonus: `partyreel.vercel.app` was claimed by the new project
  the moment the old one released it (verified). Still open: Sentry source-map upload confirmation
  (M2 prod pass).

## 2026-08-04 — R3.1: the studio-first recomposition of the reel

**Will's M2 gate review of the live R3 build ruled a composition change, not a feature change:** the
feed's Reel section had become a settings page wedged into a scroll of media, while the Studio, which
already twinned every one of those controls, was missing the one thing it needed. Recorded as
[ADR-0024](adr/0024-studio-first-reel-composition.md) (amending ADR-0023 ruling 4's composite). Pure
recomposition: no migration, no schema change, no advisors movement, no engine change. Built on
`lp/reel-studio-first`, 1059 → 1063 tests.

- **The feed section is visual only** (`c3ddebe`). The marquee keeps the status chip + "Open studio"
  door, the poster (a live paused player), and the Share card. The style rail, layout, cover, length,
  moments grid, download row and stitching dialog all leave, ~165 lines. The feed now mounts ZERO
  thumbnail canvases: the IO-gated poster is the section's only player. The PRE-Create builder is
  deliberately untouched, because birth is a feed event.
- **Feed reorder retired** (same commit). The header Reorder/Done mode and its sortable-grid swap are
  gone (`reel-reorder-provider`, `reel-reorder-button`, `reel-sortable-grid` deleted, plus the panel's
  third arm and the page's provider mount); the Studio's filmstrip dock reorders beside a reel that
  keeps PLAYING. `useSortableGrid` survives, the dock consumes it.
- **The tile-row diet** (`bf442d4`). Add-to-reel and DELETE come off `HostTileOverlay`, leaving
  `like, download, hide/show` and closing the row at three: a five-chip hover fan on a dense masonry
  grid is a misclick trap, and hide already covers the urgent case reversibly. Both actions keep the
  lightbox + bulk-Select unchanged. `ReelButton` loses its row variant and its `variant` prop with it.
  The builder's "tap the clapperboard on any photo" copy had become false and now points at gallery
  Select.
- **The Moments picker** (`1e1f685`), the round's one net-new surface and now the primary selection
  door anywhere in the product. First in the Studio's sheet tray (plus a "+" tile on the dock), a
  bespoke dark-room grid over the route's full pool in a `70dvh` sheet. Membership IS the state: a tap
  writes, the dock reshuffles, the player re-cuts. Violet POSITION badge when in-reel, a soft
  "suggested" hint from `pickQuickAdd` with one "Add suggested (N)" chip, a read-only like count.
  ★ Add routes through the SILENT `addMany`, never `toggle` (toggle toasts on every add, and adding
  several in a row is the normal gesture); the rule is pure and pinned. Hidden members stay removable
  but cannot be re-added, matching `add_to_reel`'s own predicate. The Studio's length sheet also
  gained the free-tier `/pricing` link, the one capability the marquee's length row had that it
  lacked.
- **Verification.** Gate green at each commit (typecheck / lint / 1063 tests / build). Grep-proofs:
  zero imports of the three deleted files, the marquee free of StyleRail / HostMediaGrid /
  StitchingDialog, `HostTileOverlay` down to three chips. The authed live pass runs at integration.

## 2026-07-29 — milestone-1.5: the QA hardening rounds (Q1-Q4 + the write spine)

**A ~590-agent adversarial QA round (Will, Opus 5, read-only against `launch-prep`) produced a
48-finding fix queue; this milestone closes everything that could destroy customer media, mis-bill a
host, or let a caller escalate past a guard.** 66 commits, 5 migrations, 950 → 973 tests, merged to
`main` as `8163e45` + tag `milestone-1.5`. Four product questions went to Will and are recorded as
[ADR-0023](adr/0023-qa-round-product-rulings.md).

- **Q1 (`c0f6bd6` + apply `c03fe4b`) — stop destroying media.** `create_media`/`_as_host` stored the
  client-supplied `p_preview_key` VERBATIM while prefix-checking `p_original_key`, so any free account
  could register a victim's key and permanently delete the victim's R2 object from their own Trash
  (both purge paths enumerate `preview_key` into `deleteR2Objects`); now bound to the event like
  `original_key`. And the nightly cron's sweep 5 soft-removed over-cap media, emailed "recoverable for
  30 days", then sweep 8 in the SAME invocation hard-deleted it: a service-role-only `removed_by_system`
  flag plus a 24h floor stop the standby bin re-collecting same-run removals. Prod audit: zero planted
  keys. An Opus-5 audit of the work caught three real gaps (a dead validator, pagination compared
  against the REQUESTED page size, and a `MediaRow` claiming an ungranted column).
- **Q2 (`58658ad` + apply `1800f90` + `73a7291`) — the money set.** One plan at a time; an active Event
  Pass MAY start Pro (Will's 1a: only Pro→Pass collapses a cap) and plan switches route to the Stripe
  portal where proration is correct (1b). Provisioning `.select()`s and asserts exactly one row, so a
  paid-but-unprovisioned host 5xxs into a Stripe retry instead of returning 200 with nothing granted.
  `stripe_event_created_at` (epoch sentinel) gives the ordering guard one comparison; a partial unique
  index on `stripe_customer_id` closes the duplicate-customer path.
- **Q3 (`014cd6b`/`780b...` + apply `08df59a`) — escalation guards.** The QA proposed revoking
  `media(status, removed_at)`, which would have broken six legitimate moderation paths. Instead:
  BEFORE-UPDATE **transition triggers**, which work because inside a SECURITY DEFINER function
  `current_user` is `postgres` while a direct PostgREST write is `authenticated` (verified empirically on
  live) — so the trigger refuses exactly the dangerous client transitions and every RPC path survives.
  Plus removal provenance (a host can no longer silently reverse an operator takedown), an un-delete
  event-limit trigger, and the #36/#40 disclosure redactions. The hold branch SKIPS rather than raises,
  to avoid a bulk-statement abort becoming a legal-hold oracle.
- **Q4 (`841bf94`/`f009575`/`32d5416`/`dc1f15e`) — the guest path works all night.** Pattern B was the
  widest class: PostgREST resolves with `{ error }`, so `const { data } = await …` reads a BROKEN query
  as an EMPTY one. `mustQuery`/`mustCount` + an inline `partyreel/no-swallowed-db-error` ESLint rule
  (which caught 14 real violations on first run) retire it; the reads that were acting on a lie included
  the guest export summarising a 40 GB album as "0 files" and the cron's inactivity check, where a failed
  "newest upload" read was indistinguishable from "never had an upload" (it could age out a live album).
- **The write spine (`b3b6f30`, migration `20260729190000`) — the review's "single clearest structural
  finding".** The read path re-ran its gate on every surface; the write path never got the same pass.
  Now all three guest write seams (mint, presign, complete) re-check the event's lock through one
  `mayUploadPastLock` helper: `private` refuses every guest write, `password` accepts the signed unlock
  cookie **or** verified ownership. Both halves matter — gating only the mint would let a token minted
  before the lock upload forever (exactly the remediation for a leaked link), and a bare `isUnlocked()`
  would break the OWNER, who reads their own album without ever seeing the password modal. #6 pins the
  complete seam's `<variant>`/`<kind>`/`<ext>` to what presign minted, which transitively pins
  complete-time `content_type` to presign-time with zero stored state (the QA's proposed presign-issuance
  table is unnecessary: the key IS the issuance record). #17 gives every capacity decision a per-host
  `profiles` row lock (Pattern D), one lock in one order so no deadlock is constructible.

**Verification.** Every migration was diffed against live `pg_get_functiondef` BEFORE applying, and for
the write spine all 8 live `prosrc` bodies were hash-compared to the repo file AFTER applying (an
800-line hand-passed payload is verified, not assumed). Advisors came back unchanged at every step, the
load-bearing result being that `get_upload_context` kept its anon grant (it gained a `visibility` key;
service-role-ing it would have broken every guest presign) while `create_media`/`_as_host`/`create_guest`
stayed in NEITHER advisor list despite the MCP's default anon EXECUTE grant. Rolled-back contract checks
rode EXISTING rows (creating an event trips `enforce_event_limit`). Live on the alias, the QA's own
attacks were re-run: locked-event mint + presign refused 403 `unlock_required`; a pre-lock presigned URL
with bytes already in R2 refused at COMPLETION; variant-swap, kind-swap, ext-drift and cross-event keys
all refused; unlock → mint → presign still works; the owner still uploads to their own locked event; an
open event unaffected. Prod test state restored afterward (guests 6, media 24, event back to `open`).

**Not verified live, carried forward:** QA #11 (the >90-minute presign-roll soak) and #12 (upload retry
on a dropped request). Both are Q4 code and both need a foregrounded real-album session; staging the
soak surfaced two traps that make a WORKING album read as broken (a hidden tab never polls by design;
the demo event skips polling entirely) — recorded in [`systems/testing-verification.md`](systems/testing-verification.md) (`ee6ed5d`).

## 2026-07-21 — Videos in reels: posters everywhere (R3 slice A) + two found-live bugs

**Video items now draw their client-generated poster frames in every reel style, live player and
export alike.** The Remotion-era `posterMode` flag was deleted outright (videos ALWAYS resolve to
their poster WebP; a missing poster degrades to a theme-color hold, never a black clip or an
undecodable mp4 URL), `RENDER_VERSION` bumped 2→3 so every cached artifact regenerates, the
teardown's caller-less GET poll surface (`GET /api/reel/render` + `getReelRenderState` +
`finalizeIfLanded` + the stitching dialog's dormant poll mode) was pruned, and the style browser
gained a video fixture proving the poster path visually. The demo event's three legacy null-poster
videos were replaced through the REAL upload pipeline (fetch-from-R2 File injection; the folder-share
and localhost-fetch routes both dead-end — Chrome's private-network blocking). The live pass caught
and fixed TWO real bugs beyond the slice: (1) `measureFile` had no timeout, so Chrome's hidden-tab
media throttling wedged the whole upload queue before its first network call (now settles empty at
7s, best-effort like every other media wait); (2) the reel engine's CORS asset fetch read
img-poisoned HTTP-cache entries (R2 sends no `Vary: Origin`), silently nulling EVERY clip — the
engine now fetches `cache: "no-store"`; the landmine is recorded in uploads-and-r2.md. Verified live
on the alias: all 12 reel slots draw real media across styles (video posters at the tail), fresh $0
on-device encode → artifact stored → clean finalize (`client_minted` → `client_encoded`). 874 tests.

## 2026-07-08 — The Lambda/Remotion teardown (R3 slice B; "maxing out the services we want to own")

**The reel now has exactly one render path: the canvas engine + on-device WebCodecs encode.** Will's
ruling ("Teardown is a go") deleted the entire Remotion/AWS-Lambda surface, ~11,900 lines net: the
Lambda trigger + webhook finalize in the render service, `lambda-client.ts`, the
`/api/internal/reel-complete` webhook route, `workers/reel-render/` (plus 695MB of orphaned local
node_modules), the old `@remotion/player` component, the Remotion composition (its seven PURE modules,
including the 14-style catalog `style-registry.ts` and the shared `reel-types.ts` contract, were
relocated into `src/lib/reel/engine/` first), the design lab's DOM sides (the old reel lab deleted; the
parity page reworked to a canvas-only style browser; the served-its-purpose reel-spike retired), all
five `@remotion/*` dependencies, and the seven reel env vars (code + the preview-scoped Vercel copies;
the production-scoped copies wait for milestone-2, when `main` stops carrying Lambda code). The
no-WebCodecs export fallback became an honest modern-browser notice; playback never needed anything.
Two feared subtleties resolved cleanly: the engine's spring was ALREADY a self-contained port (the
sampled-pin suites show zero diff, byte-identical pins = the parity proof), and the composition
relocation triggered no import-graph breakage (`pnpm build` verified at the relocation commit). The
client-encode contract survived byte-for-byte (begin/mint/finalize, cache HEAD guard, refusal logging,
kill-switch, limiter, `rendered_hash`). Kept-and-flagged: the now caller-less `GET /api/reel/render`
poll surface, pruned in the videos slice. The AWS sub-account closure is a `[human]` launch-checklist
line. 874 tests + a production build at the merge.

## 2026-07-08 — Profiles + the social layer (ADR-0019 ruled model, P1-P3)

**Public profiles, follows, blocks, and host-controlled guest lists land in one slice.** The data layer:
`profiles.slug` (service-role write; app-side Pro gate so grandfathering never breaks), the two host
toggles (`events.display_in_profile` + `show_guest_list`, column-granted), `user_follows` (owner-
perspective RLS; writes only via the block-aware `follow_user` RPC + a SECURITY DEFINER trigger
backstop), `user_blocks` (blocker-only RLS; `block_user` severs follows both ways atomically),
R5-shaped `notification_prefs`, and `profile_hidden_events` (the guest-side hide). The anon
`get_public_profile` RPC deliberately grows the accepted anon-read set 3 to 4; its attended arm is
gated open-events-only (the parity-review catch: gated-event attendance must never leak to anonymous
profile viewers). Surfaces: `/u/[slug]` (logged-out-visible, counts nowhere), the account Public
profile + Connections cards (slug claim with live availability, per-event hides, owner-private
follower count, blocks), the event-settings social card (loud guest-list consent copy), the album
"Guests" feed section on both host and guest surfaces, follow/block affordances, and the dashboard
Following chip. Verified live on the alias: migration applied + ROLLBACK_OK contract check (slug
CHECK, follow/block/severance both directions, trigger backstop, prefs defaults, gated-event leak
negative), advisors exactly the expected delta, third-party graph reads = 0 rows, anon REST probes
42501 on all four tables, slug write locked from hosts, the anon RPC payload leak-probed clean, and
the full UI pass (claim @willg, flip both toggles, /u/willg anonymous 200, Guests pill + honest
empty state). 874 tests at the merge.

## 2026-07-08 — Milestone 1 (R1 Decision Studio + R2 Reel Engine) merged to main

The `launch-prep` integration branch merged to `main` (`--no-ff`, tag `milestone-1`) carrying: the seven
T1 rulings recorded (ADR-0019..0022 + the two lab decisions), the ADR-0021 pricing slice (30s/60s reel
caps + the 3x ingress multiplier, TS + SQL + the composer paid-lock, migration applied + parity-verified),
the ADR-0020 forensic capture track (upload_forensics + legal hold + /admin/forensics + the CSAM runbook
draft; the media SELECT column-scoping shipped with a same-day main hotfix `a65d29e` when it briefly broke
prod's star-selects), the FULL 14-style canvas reel engine (8 moods + 6 treatments, parity-verified per
style against the Remotion originals, frame-normalized washes, the redesigned bottom-right watermark with
3 variants for T2), the composer swap + client-encoded export (above), the request-scoped auth cache, and
the T1-ruled composite reveal + marketing-identity directions in the lab. 853 tests at the merge.

## 2026-07-08 — Reel Plan A Phase C: the composer on the canvas engine + client-encoded export

**The reel export goes $0 by default.** The composer's live player is now `CanvasReelPlayer` (the same
`drawReelFrame` the encoder steps: the preview pixels ARE the export pixels; `@remotion/player` no longer
imported by the composer, kept only for the parity harness + the Lambda fallback until R8). **Download video**
probes WebCodecs per browser: supported → `encodeReel` renders the mp4 on the host's device (real progress in
the dual-mode stitching dialog; the local file saves the instant the encode lands), then uploads it to the reel
output key via the NEW host-authed `POST /api/reel/upload` (begin → mint → finalize). The mint is the new abuse
surface, built tight: getUser + own-event, the whole config re-derived server-side (tier → watermark + length
clamp, membership, hash re-compared each phase so a mid-encode config change 409s), a content-length-bound
`video/mp4` presign capped at server-length × a bitrate budget (`client-encode-budget.ts`, parity-tested
against the encoder), the existing `reel_render_enabled` kill-switch + `reel_render` limiter, and an idempotent
finalize that verifies the object landed AFTER the mint stamp before stamping `ready` + `rendered_hash` and
logging `client_encoded` at cost 0 (mint logs `client_minted`; `/admin/reels` labels both). Cache semantics
unchanged (`rendered_hash` match → the stored mp4, $0). No WebCodecs → the untouched Lambda render. No DDL
(`reel_render_log.outcome` is text). Verified: Vitest (budget math, contract zod, gate logic, hash
invalidation; 853 green), typecheck/lint/build green, curl red-team of the route's parse/authz surface
(400/403/405); live e2e on the preview alias (2026-07-08): a real 25s encode ran `client_minted` →
`client_encoded` in 7 seconds at $0.00 (the Lambda rows directly above it in the same log: ~2 minutes,
~$0.014), a second click served `cached` with no re-encode, a style switch invalidated the hash and
re-encoded in 6s, and the Free-account composer shows the locked 60s chip + upgrade copy. The operator
kill-switch drill (flip at /admin/reels, watch a refusal) is an M1-pass item with Will. Known quality
delta, flagged for Will's judgment: the encode sources the 640px preview WebPs (literal WYSIWYG), so
full-size playback reads softer than originals; the ~2400px render-source variant is the queued fix.

**The live location leak is closed.** Guests' phone photos/videos carried GPS + device EXIF into the R2
originals served by the lightbox, per-item Save, and the Download-all zip. Now a **client-side, lossless,
byte-level strip runs at the upload seam** (`src/lib/upload/uploader.ts` step 0 → `src/lib/media/strip-metadata.ts`,
dependency-free, browser+Node): JPEG (Exif/XMP/IPTC/COM dropped; ICC + JFIF kept; a minimal orientation-only
Exif is REBUILT so rotated photos stay upright; MPF gain-map indexes are offset-rewritten so iPhone HDR photos
survive intact; motion-photo trailers get their embedded MP4 metadata blanked in place), PNG (eXIf/tEXt/iTXt),
WebP (EXIF/XMP + VP8X flags), MP4/MOV (udta/©xyz/loci/meta/keys/ilst/XMP blanked by rename-to-`free`, zero
offset movement, big files never fully in memory). Fail-open by design: unparseable/exotic input uploads
unmodified (a corrupted keepsake is worse than the leak); HEIC/WebM are conscious ROADMAP gaps. Built by an
isolated-worktree agent + 3 adversarial review lenses, which caught two REAL bugs pre-merge (a stale MPF index
that corrupted iPhone HDR gain maps — reproduced on a prod object — and trailer-carried GPS invisible to the
reporter); both fixed with fail-open guarantees. 43 new unit tests (627 total).
**Backfill:** `scripts/backfill-strip-exif.mjs` (dry-run default) ran LIVE: 14/16 pre-existing originals
stripped (2 carried real GPS), ledger (`file_size_bytes`, `storage_used_bytes`, `storage_ledger`) corrected,
re-run reports 0 remaining, 0 errors. **Live-verified on partyreel.com**: a real GPS-tagged 4032×3024 iPhone
JPEG uploaded through the production browser pipeline landed in R2 at the exact predicted stripped size,
`hasGpsMetadata=false`, orientation 6 preserved.
**Rode along in the milestone:** the elevation-program bootstrap — CLAUDE.md's git section now carries the
program branch protocol (`launch-prep` integration, `lp/*` tracks, frozen main), STATUS points at the program
plan, and ROADMAP's launch checkpoint gained the program-teardown + AWS-quota lines. The `launch-prep` preview
alias is fully wired for live red-teams (branch env, R2 CORS, Supabase redirect, a temporary Stripe TEST
webhook endpoint) and smoke-verified end-to-end (OAuth, upload, a real Lambda reel render + webhook, $0.0135).

## 2026-07-02 — Reel STYLE CATALOG + orientation, wired end-to-end (Reel V1 Phase 2, `923457b`/`0cfcc4f` + fixes `b6d1767`/`fafba3c`)

The host composer graduates from 8 themes + shuffle to a **14-style catalog** (8 media-first "moods" + 6 stylized
"treatments") + a **portrait/landscape orientation**, persisted and matched by the .mp4 export (WYSIWYG). Built over a
long deep-polish run of all 14 styles in the `/design/reel` lab, then integrated. Durable facts in
[`systems/host-app.md`](systems/host-app.md); design/dispatch details in [`systems/design-system.md`](systems/design-system.md).
Live-verified on partyreel.com: pick a treatment (Layered parallax) + Landscape → the player swaps, config persists, the
.mp4 renders + downloads (`status ready`, $0.024/~3min).
- **The styleId dispatcher** (respects the pure/remotion import boundary): `composition/style-registry.ts` is PURE
  (catalog → `{kind, themeId}`, server-safe) so `build-reel-props`/`render-service` resolve `styleId`→theme without
  pulling remotion; `composition/style-render.tsx` is the REMOTION half — `styleComponent` + `styleDuration` +
  `StyleDispatch`. **Watermark HOISTED** out of `Reel.tsx` into `StyleDispatch` so all 14 styles stamp it (a treatment
  reel was exporting unmarked). `Root.tsx` + `reel-player.tsx` dispatch via `StyleDispatch` + `styleDuration`.
- **Composer:** Shuffle removed (seed is now the deterministic `defaultReelSeed`); a scalable **Style popover** (grouped
  Media-first / Stylized) + an **Orientation** toggle.
- **DB:** `highlight_reels.style_id`+`orientation` (backfilled from `theme`, kept synced); a new authenticated-only
  `upsert_reel_config(p_style_id, p_orientation, ...)` (the old `p_theme` overload kept during the deploy window, then
  dropped). `build-reel-props` now populates `ReelClip.width/height` → **fitClip runs in prod** (designed
  mismatched-orientation framing); treatment video clips guard to their poster (no `<Video>` path yet).
- **Render:** `RENDER_VERSION` 1→2 folds `style` + `orientation` into the cache hash; `deploy-site` pushed the treatments
  into the Lambda bundle (a composition change MUST be paired with `deploy-site` or a treatment silently renders as its
  base mood).
- **Two render fixes the live red-team caught** (both from the version bump forcing a re-render of every existing reel):
  (1) `renderMediaOnLambda` needs `overwrite: true` — the stable output key errored "already exists" on the 2nd render;
  (2) heavy treatments (parallax's full-frame blur at landscape 30s) hit the **120s Lambda ceiling** → deployed a **240s**
  render function (repointed `REMOTION_LAMBDA_FUNCTION_NAME`). Follow-up: a blur-downscale pass to make the treatments
  render fast+cheap rather than "within 240s."

---

## 2026-06-22 — Reel .mp4 EXPORT: Download video (Reel V1 slice 3, `f460456`)

The curated reel becomes a downloadable video. A **Download video** button under the composer renders the reel to a
real `.mp4` on **Remotion Lambda** (AWS) from the **full-res originals** (the player stays on fast previews; a tip
makes the gap explicit), writes it **directly to R2** (`s3OutputProvider`, no copy), and downloads it. Durable facts
in [`systems/host-app.md`](systems/host-app.md) "Reel curation … the .mp4 export"; the slice plan in
[`specs/reel-v1.md`](specs/reel-v1.md). Live-verified on partyreel.com: trigger → render → ready → download.
- **Async architecture (NOT the sync zip-export):** a Remotion render is a ~60-90s job → ONE file, so the template is
  the backup-prune **trigger → webhook** pattern. `POST /api/reel/render` (getUser + own-event) → the server-only
  `render-service` → `renderMediaOnLambda` (funnelled through `lambda-client.ts`, a server-only `@remotion/lambda/client`
  boundary so the AWS SDK never reaches a client bundle). Completion has TWO idempotent paths: the signed webhook
  (`/api/internal/reel-complete`, `validateWebhookSignature`) AND the `GET` poll's R2-HEAD finalize
  (`LastModified >= render_started_at` disambiguates the stable-key overwrite; drives local dev where Lambda can't reach
  localhost). ★ The bundling trap: importing the `composition` BARREL (re-exports Reel/Root → `remotion`) into a server
  route breaks the build (`React.createContext` undefined) — server code imports the pure `layout`/`themes`/`reel-types`
  submodules directly.
- **Lazy + cached:** a stored `rendered_hash` (sha256 of ordered-approved-ids + theme/seed/length/cover + watermark +
  version) is the cache key — an unchanged reel re-serves the existing mp4 for **$0**; only config/membership churn
  re-encodes.
- **Free-tier watermark:** a small `partyreel.com` wordmark stamped over the reel, server-derived from `profiles.tier`
  (the render route never trusts the client), mirrored in the live player for WYSIWYG. Pro has none.
- **Ops (P8):** the `reel_render_enabled` kill-switch + the deny-all `reel_render_log` at `/admin/reels`, the
  `reel_render` abuse-limiter kind, `highlight_reels` render columns (all service-role-write). Rolled-back grant
  contract-checked (no host/anon writes); advisors clean.
- **★ Cleanup landmine fixed:** event-purge deletes R2 by ENUMERATED media keys + the orphan sweep ignores non-media
  keys, so the reel mp4 (no media row) would leak forever on deletion — `sweepExpiredEvents` now also deletes
  `reelOutputKey` per purged event.
- **Live red-team (partyreel.com, demo event):** Download → POST 200 → minted → completed (~72s) → ready, mp4 at
  `events/<id>/reel/reel.mp4`, **cost $0.00622** (the webhook authenticated + delivered cost). Cache (unchanged →
  `cached`, $0, no modal), kill-switch (off → 503 "Reel videos are paused" + `rejected_mode`), the free-tier watermark +
  hint (a Free host), the WYSIWYG tip. All four `reel_render_log` outcomes captured. The `REMOTION_*` +
  `REEL_RENDER_WEBHOOK_SECRET` moved to Vercel (the production trigger runs server-side; the spike kept them local).
- **Deferred:** guest-facing reel surfacing + download (its own next slice), Pro video trim + real-video-in-player + R2
  CORS, the theme palette + the reveal, eager pre-encode (gated on the AWS-quota re-measure).

---

## 2026-06-22 — Reel COMPOSER: the live in-app reel ($0) (Reel V1 slice 2, `4806e71`)

The reel comes ALIVE in the app. The host's curated set now **plays as a live in-browser `@remotion/player` reel**
(the "wow in between") in the Reel section — player hero on top, the editable curated grid below — with auto-magic
controls (**theme · shuffle · cover · length**), all client-side + **$0** (shuffle just re-seeds; nothing encodes).
The downloadable `.mp4` export (the Lambda trigger) is the next slice. Durable facts in
[`systems/host-app.md`](systems/host-app.md) "Reel composer"; the slice plan in [`specs/reel-v1.md`](specs/reel-v1.md).
- **WYSIWYG single-source:** the proven spike composition MOVED `workers/reel-render/src` → `src/lib/reel/composition`
  (the app's `tsconfig` excludes `workers/`, so the canonical source lives in the app; the worker's site entry imports
  back into it — verified by `remotion compositions` still bundling `Reel` from the app path). ONE `<Reel>` drives BOTH
  the in-app Player AND the Lambda render; `remotion`/`@remotion/player`/`@remotion/media` added to the app exact-pinned
  `4.0.482` (lockstep). + a `posterMode` flag (the Player shows video by its poster still — R2-CORS blocks in-browser
  `<Video>`; the export keeps real `<Video>`, byte-identical). 3 starter theme kits (classic/warm/punchy).
- **Data:** `buildReelProps` (pure, 10 vitest cases) turns `reel_items` order + the already-presigned `GridMedia` into
  the Player inputProps (no 2nd presign). Migration: `highlight_reels` + `theme/seed/length_seconds/cover_media_id`,
  a one-per-event unique index, the **host table-write lockdown** (status/output_key render-only), and
  `upsert_reel_config` (SECURITY DEFINER, host-owns, lazy row-create, anon-grant revoked). Rolled-back contract-tested
  (host-owns / upsert / cover-soft-null / cross-tenant / unauthorized); advisors clean.
- **UI:** the empty state offers a one-tap **"Fill from gallery"** auto-fill. emil craft on the controls (the Button's
  press-scale + custom easing). A live-test polish: the 9:16 player is a centered phone-frame (no wide black side-bars).
- **Live-verified on partyreel.com** (host `willg97`, demo event): auto-fill seeded 9 → the player autoplays the reel
  (Ken-Burns + grade) → theme switch (Punchy) + Shuffle re-render live → the config persisted (lazy `highlight_reels`
  row, `theme=punchy`, the shuffled seed). The export path stayed green (the worker still bundles + renders).

## 2026-06-22 — Highlight-reel render-pipeline spike (Reel V1 slice 1, `workers/reel-render`)

De-risked the reel's one real unknown before building any UI: that a **Remotion** composition renders *our* kind
of reel (Ken-Burns stills + crossfades + a CSS grade + a trimmed `@remotion/media` video, vertical 1080×1920) on
**Remotion Lambda (AWS)**, reading R2 and writing the mp4 back to R2, fast + cheap. Standalone package, NOT in the
Vercel build, NOT app-wired (hardcoded demo-event inputProps). Outcome: **the pipeline is proven; numbers + levers
captured**; full state in [`workers/reel-render/SPIKE-NOTES.md`](../../workers/reel-render/SPIKE-NOTES.md), verdict in
[`specs/reel-v1.md`](specs/reel-v1.md) open-item #1.
- **Proven:** one composition drives both the (future) `@remotion/player` preview and the Lambda encode (WYSIWYG by
  construction — a Lambda output frame == the local render frame). **Direct-to-R2** via `outName.s3OutputProvider`
  works with **no S3→R2 copy step** (output verified in R2: h264 1080×1920, 502 frames, 21.0s, plays). **Cost ≈
  $0.01/render** (Remotion-accrued; `estimatePrice` ~$0.002) — the cost model holds.
- **AWS:** new account `Partyreel` (562923010969) under `partyr33l@gmail.com` — Will did the signup (password/payment/
  OTP), the agent drove IAM via Chrome. A **sub-account of an org** (free-tier auto-enrolls; so the concurrency
  quota-increase must go via the console, not the CLI). Least-priv IAM: `remotion-lambda-role`/`-policy` +
  `remotion-user`/inline `remotion-user-policy`; `policies validate` all ✅.
- **Measured (2048MB, ORIGINAL demo media, 7 renderers under a new-account 10-concurrency cap):** with-video reel
  cold **88.6s** / warm **76.7s**; photos-only **62.2s**. **★ Bottleneck = per-Lambda CPU** (software-rendering big
  original JPEGs + the CSS filter), NOT the architecture/cost/video. Levers (all fixable, next slice): preview-sized
  media not originals; concurrency **10→2000 requested** (pending AWS); memory 3008MB; video CORS → `@remotion/media`
  fast path vs the OffthreadVideo fallback. **`framesPerLambda` landmine:** default → "Rate Exceeded" (>10 cap), 200
  → 120s timeout, **80** was the sweet spot here.
- **Lazy-vs-eager:** lazy-on-download stays the target but is **GATED** on a next-slice re-measure with previews +
  the raised quota + 3008MB (encode is cached either way, so first-view cost is paid once). Env contract forward-staged
  (`REMOTION_AWS_*` in `.env.example` + `src/lib/env.ts` `assertReelRenderEnv()`); the Lambda fn + site stay deployed.

## 2026-06-22 — "Download all" zip export (`bc4d5fb` + download fix `34d0a9f`)

Per-item Save streamed ONE original; "Download all" now zips a whole album. Heavy/streaming work runs OFF
Vercel on a new **streaming export Worker** (`workers/export`, `partyreel-export`, deployed via `wrangler`,
ADR-0018). A Next mint route authorizes (host: own-event; guest: access-resolved, never beyond `gallery.rows`)
+ **HMAC-signs** the authorized `[{key,name}]` list into an opaque token; the browser top-level form-POSTs it;
the Worker verifies the signature + expiry + per-key layout and **streams a STORE-method zip** (`client-zip`)
straight from R2 to the browser, so bytes never touch Vercel. The app is the single authz oracle.
- **UI** = the design-lab **Concept B** config modal (Everything/Photos/Videos chips with live counts from a
  `step:"summary"` call, host-only "Include hidden", the total size/count as the result) on the host Gallery
  header + bulk "Download selected" (direct) + the guest album (hidden in demo). emil craft: center scale-in,
  press feedback, the size animates as the consequence of the config.
- **Security/cost** = signed sealed manifest (keys = equivalent exposure to the presigned gallery URLs already
  shipped), per-export cap (2000 items / ~20 GB), the `"export"` abuse-limiter kind, the `export_enabled`
  kill-switch + per-attempt `export_log` (HMAC-of-IP, never raw) surfaced at `/admin/exports`. Marginal cost
  ~$0 (R2 egress free; store-zip CPU is just CRC32) — no per-image fee, no temp storage.
- **Download fix** (`34d0a9f`): switched from a hidden-iframe form-POST to a TOP-LEVEL form POST (the durable,
  restriction-proof pattern — cross-origin iframe downloads are increasingly browser-restricted). Honest note:
  the iframe ALSO downloaded fine; the "no file saved" reading during the red-team was a false alarm (the test
  browser saves to a non-default dir, so files were landing all along).
- **Verified live (partyreel.com + the Worker):** the full guest chain via curl (summary → mint → Worker → a
  9-file 10.6 MB `unzip`-clean zip); every attack fails closed (no-token 400, garbage/forged/expired/bad-key-
  layout 403, GET 405, bad-qr 403, host-unauth 401); the kill-switch (DB flag off → mint 503 paused → on);
  `export_log` rows correct (minted + rejected_mode, HMAC-of-IP, no raw IP). In the browser (host dashboard):
  the Concept B modal renders + recomputes live (Photos → 1.4 MB / 6 items), and clicking Download saves a
  valid 9-file `partyreel-demo.zip` to disk. (Admin `/admin/exports` page needs an admin+MFA login → Will's
  visual check; its data + toggle are verified.)

## 2026-06-22 — Client-side thumbnail/preview variant (`729e781`)

Galleries served full-res R2 originals on every tile (slow cold loads, high bandwidth). Now the BROWSER
generates a small ~640px WebP preview at upload + uploads it as the reserved `preview` R2 variant; tiles serve
it, the lightbox + Save keep full-res. **Generation is $0 + predictable** (no Cloudflare transform fee) — the
fit for a storage-billed model (Will's steer, after confirming the CF Images/transform fee is one-time-per-upload
but still an external variable cost he'd rather not carry).
- **preview-size.ts** (pure, tested): `PREVIEW_MAX_EDGE=640` / WebP / `q0.75`; `previewTargetSize` (never
  upscales) + `shouldSkipPreview` + `MAX_PREVIEW_BYTES` (2 MB).
- **preview.ts** (browser, best-effort, never throws → null): photos = `createImageBitmap`-resize (avoids the
  full-res-canvas OOM) → canvas → WebP; videos = `<video>` seek ~0.1s (+ a `seeked` timeout) → `drawImage`.
- **Pipeline (additive, contract-preserving):** presign issues a 2nd **size-BOUND** PUT for the preview (reuses
  `presignUpload`; bound + capped so the preview key can't be abused to evade the storage cap; skipped over the
  cap); uploader generates → PUTs best-effort → sends `preview_key` only on success (a preview failure NEVER
  fails the upload); complete records it (`create_media` already forwarded `p_preview_key`).
- **Serve:** `GridMedia.previewUrl`; `MediaTile` photo `<img previewUrl??url onError→url>`, video → `<img>`
  poster (no `<video>` fetch) else the `<video>` poster fallback; the lightbox unchanged. `toGridItems` + the
  host inline build + `toMyUploadsItems` presign `previewUrl`.
- **Migration:** re-created `get_event_media_by_qr_token` (+ `get_my_likes`) with `preview_key` in the
  `RETURNS TABLE` (the gap — their fixed return list excluded it, so the highest-traffic guest gallery couldn't
  serve previews without it); grants re-applied + verified (anon+authenticated vs authenticated-only). The
  direct-table selects/maps thread `preview_key`.
- **Live-verified** (partyreel.com, demo event, real uploads via Will): both a photo + a video got `preview_key`
  set; the `preview.webp` objects exist in R2 (200, image/webp); the **photo tile** fetched a **16 KB** 640×360
  WebP (vs the 253 KB original, ~94% cut) and the **video tile** an **8.5 KB** 320×176 poster `<img>` (vs the
  788 KB video, ~99% cut, no `<video>` fetch); old preview-less media fell back to the original; the **lightbox**
  served the full-res `original.jpg`. 524 unit tests. Demo restored pristine (R2 + rows + storage counter).

## 2026-06-22 — Reel drag-to-reorder + uniform Reel/Review grids (`ae5fc24`)

The Reel section becomes orderable by drag; per Will the **Reel + Review render as uniform grids** while the
**Gallery keeps the masonry "wow."** Next Reel-curation follow-on after album bulk-select.
- **Uniform layout** — a `layout: "masonry" | "uniform"` prop on the shared grids (`MasonryColumns` +
  `SelectableMediaGrid`), default masonry. Reel display + Review pass uniform (`4/5` portrait, `object-cover`,
  `grid-cols-3 sm:grid-cols-4`); Gallery (incl. its album select) keeps masonry. Uniformity gives the reel a
  legible drag-order and standardizes Review's selection hit-targets.
- **The sortable primitive** — our own dependency-free `useSortableGrid` (the project dropped framer-motion +
  ships no drag lib): a hand-rolled pointer machine + a 2-axis FLIP for the sibling slide (mirrors `use-flip` but
  X AND Y) + a geometric `pointToIndex` drop-index + edge autoscroll + touch press-to-grab (450ms, so a scroll
  never reorders) + keyboard reorder + reduced-motion. ★ On a uniform grid the drop-index is two integer
  divisions, so hand-rolling beats adding dnd-kit. Pure `pointToIndex`/`moveItem` helpers unit-tested.
- **`reorder_reel(p_event_id, p_media_ids)` RPC** — the SECOND reel write path (since `reel_items` UPDATE is
  grant-revoked): SECURITY DEFINER, host-owns + a **set-equality membership guard** (rejects cross-event /
  partial / dup / stale lists with `reason:'stale'`), one `UPDATE … FROM unnest(…) WITH ORDINALITY`, grant-locked
  (authenticated only — advisors confirm no anon). `ReelProvider.reorder` = optimistic new-`Set` rebuild + revert.
- **Reorder mode** — a thin `ReelReorderProvider` + a `Reorder`/`Done` header button (shown when `> 1` item) +
  `reel-sortable-grid` (numbered drag tiles, no overlay/lightbox); reel-panel swaps to it. Operates on the FULL
  membership (a hidden in-reel item shows dimmed) so the set-equality guard holds.
- **Live-verified** (partyreel.com, demo event, 6-item reel): the uniform Reel grid (desktop 4-col / mobile
  3-col); Reorder/Done + numbered badges; a **desktop drag** (tile 4 → position 1, siblings FLIP-slide, persisted
  to the DB, survives a RELOAD); a **mobile touch press-and-hold + drag** (dispatched pointer events, persisted);
  + the **rolled-back RPC contract check** (happy re-stamps the exact order; cross-event / partial / dup → stale;
  foreign event → not_found; unauthorized without a claim). 515 unit tests (the sortable helpers added).

## 2026-06-22 — Gallery album bulk-select (`6e5e1c7` + clamp hotfix `5a73410`)

The host event page's **Gallery** section gains a multi-select mode mirroring Review's, so curating a reel
or hiding/deleting a burst is one action, not N taps. Next slice in the Reel-curation thread (the roadmap's
"album bulk-select folds into the feed's Select mode").
- **Enter:** a `Select` button in the section header / floating bar, OR **long-press a tile** (`use-long-press.ts`,
  ~450ms, seeds that tile; threaded through `MasonryColumns` as opt-in `onTileLongPress`, no-op on guest/bin).
- **Bulk cluster** (`gallery-actions.tsx`, in the floating bar): `All/Clear · N · Add to reel · Like ·
  Hide|Show · Delete · Cancel`, each in its state color, the Hide|Show label SMART ("Show" iff all selected
  are hidden), Delete behind a count-named confirm ("Remove 8 items?").
- **Architecture:** a thin `HostSelectionProvider` (mirrors `HostAddProvider`) holds the selection state +
  `run(kind)`; the gallery grid registers its optimistic bulk handlers, the bar delegates to them (the seam
  the review bar uses for `triage.run`). Shared `useSelection(ids)` extracted from `useReviewTriage` (which now
  composes it, unchanged) — ★ PRUNES the selection on an album change, never resets, so a poll/revalidate can't
  wipe an in-progress multi-select. Shared `SelectableMediaGrid` extracted from the review grid (preview optional).
- **Mutations:** Hide/Show + Delete = new plain RLS bulk writes `setMediaStatusBulk`/`removeMediaBulk`
  (`.in('id', …)`, no `pending` predicate — they act on the live album, unlike the review queue's bulk); Add to
  reel + Like = a client loop over the existing idempotent RPCs (`ReelProvider.addMany`/`LikesProvider.likeMany`),
  one summary toast each. No new SQL.
- **★ Clamp hotfix (`5a73410`, caught live by Will):** the select grid hardcoded the unclamped
  `tileAspect(it, false)` (inherited from the review grid), so entering Select reflowed the album's tile heights
  (the normal grid clamps extreme ratios). Threaded a `clampAspect` prop; the gallery passes it true.
- **Live-verified** (partyreel.com, demo event): Select + long-press entry (seeded), checkmarks + count, Add to
  reel (one "Added 2 to your reel" toast + reflects in the Reel section), Hide → smart-Show → Show, Delete (count
  confirm + exit beat + count 9→8), the no-reflow fix (tile height 269px identical normal vs select, measured),
  mobile 390px bar fit, and the cross-tenant no-op (a foreign media id touches 0 rows under the bulk predicate).
  506 unit tests (a `useSelection` prune-not-reset pin added).

## 2026-06-22 — Consistent feed section headers + harmonized empty states (`47f0b2d`)

Follow-up to the feed redesign (Will): on a long "All" scroll the sections were hard to tell apart
(Gallery had no header, Reel was a centered card-less empty state, Review a left-aligned bordered card), and
toggling pills bounced the layout.
- **`FeedSectionHeader`** (new) — the one subtle header every section leads with: an 11px uppercase eyebrow +
  the pill-identical count badge (amber on a live Review queue), locked to `min-h-7` on the ROW. That fixed
  height (== the tallest right-slot control, a `size="sm"` h-7 button) is the **no-bounce guarantee**: a
  label-only Gallery/Reel header and the Review-pending header (which carries the Select/Approve-all cluster)
  resolve to the exact same 28px band, so a pill toggle never shifts the header's top. (A design panel ranked
  this over a hairline-underline variant — rejected as un-subtle for the monochrome system.)
- **`FeedSectionEmpty`** (new) — the Reel empty-state treatment Will preferred (centered, card-less, the
  size-12 icon circle) extracted + applied to ALL empty/teaser states: Reel, Gallery (was a lone left-aligned
  `<p>`), and Review caught-up + moderation-off (dropped their bordered cards). Always renders UNDER the
  header. Review-pending now reads "Review" + an amber count badge (matching Gallery/Reel) instead of the
  "· N waiting" prose.
- **Live-verified:** the header sits at an identical Y across All→Gallery→Reel→Review toggles (measured by
  matched-crop screenshots — the JS geometry API was zeroed in the headless context, a known tooling
  blind-spot), incl. the critical Gallery↔Review-pending case; the Reel + Review-moderation-off empties now
  render identically centered. (`pnpm` gate green; demo data restored.)

## 2026-06-22 — Host event page → stacked, pill-filtered media-forward feed (`4d3ddcc`, beat hotfix `c316b21`)

The host event page moved from **tabs** (Gallery | Reel | Reviews) to a **dashboard-style stacked,
pill-filtered feed** — a media-forward landing that stacks the sections for a full scroll-through, with the
review pop-up retired and a contextual floating action bar. Built on the proven `DashboardFeed` hydration-safe
shape; the two motion-defining picks were prototyped + ratified in the gated `/design/event-feed` lab (Will,
2026-06-22): **A=Condense** (sticky pills shrink on scroll), **B=Fade** (filter swap), **C=FLIP** (urgency
reorder — framer-`motion` was trialed and rejected, the package dropped).

- **Feed shell:** `lib/event/sections.ts` (replaces `tabs.ts`) — `resolveInitialEventSection` (`?section=`,
  legacy `?eventTab=` still resolves) + `orderedSections` (Review leads while a queue waits, sinks last when
  caught up / moderation off); pure + unit-tested. `EventFeed` (the `DashboardFeed` analog) takes the Gallery +
  Reel sections as opaque RSC slots + the Review queue as data; `EventFilterPills` (`All · Review · Gallery ·
  Reel`, amber live Review count, sticky-condense).
- **Inline review:** retired `HostReview`/`ReviewTakeoverProvider`/`ReviewsPanel`; the triage machine moved to a
  `useReviewTriage` hook shared by the inline `ReviewSection` (pending grid / caught-up line / moderation-off
  "turn on review" teaser / the inline all-caught-up beat) and the floating bar. `use-flip.ts` (FLIP) ported to
  `src/lib/shared/`.
- **Contextual floating action bar** (the headline): generalizes the floating Add via a scroll-spy
  (`use-active-section.ts`) so the action MORPHS by the section in view — Review Select/Approve all + bulk bar,
  Gallery Add photos (shared `HostAddProvider` opens the command strip's panel), Reel a disabled Create reel.
- **Beat hotfix (`c316b21`):** the live red-team caught the all-caught-up beat collapsing to ~2ms. Root cause:
  baking `--tune-review-beat-ms: 2500ms` into globals.css, then the build minifier (Lightning CSS, via Tailwind
  v4) CANONICALIZED it to `2.5s`, and the JS `parseInt("2.5s")` returned `2`. New `read-css-ms.ts`
  (`parseCssMs`, unit-tested) parses `s`/`ms`/bare; replaces the four `parseInt`-based `readMs` copies.
- **Live-verified (partyreel.com, demo event):** feed renders + clean hydration (zero console errors); pills +
  urgency reorder both directions; A=Condense on scroll; the floating bar morphs to Gallery's Add; the
  moderation-off Review teaser sorts last; seeded a pending queue → the amber Review section led the stack →
  Select mode + the forced floating bulk bar (Select all · N · Hide · Approve · Cancel) → per-tile checkmarks →
  Approve a subset (toast) → **Approve all → the "All caught up" beat (post-fix) → the FLIP relocated Review to
  the bottom**; mobile 375px = clean 2-col masonry. DB left clean. Known live-tune item (handed to Will): the
  scroll-spy active-section hand-off on a short feed (the bar holds Gallery's action when the bottom sections
  can't reach the center band — no functional loss; Reel's is a disabled placeholder, the teaser has its own
  inline button).

## 2026-06-22 — App typography on the Urbanist heading face + global media-grid gap

App headings had drifted off the design system: page titles (Dashboard, Settings, event name, all 13 /admin
pages) rendered as **unstyled Inter** (`text-2xl font-semibold tracking-tight`); `CardTitle` used the Urbanist
`font-heading` face but at `font-medium` (500), too thin to outrank the Inter-500 `FormLabel`s; event names felt
undersized; and media grids split between a tight `gap-[3px]` (galleries) and `gap-2` (review/Reviews/admin
moderation). Will's design-system pass, with a tiered scale:
- **`PageHeading`** ([new, `components/shared/page-heading.tsx`](../../src/components/shared/page-heading.tsx)) =
  Urbanist **700** + -0.03em (the `font-heading` utility) — the one source for every app + admin page `<h1>`;
  swept ~17 pages onto it. **`CardTitle`** → `font-semibold` (Urbanist **600**), one edit lifting all ~14
  card/section titles clear of the Inter-500 labels. **Event names** bumped + onto Urbanist: dashboard card
  `text-lg`→`text-xl`, event-page hero → `PageHeading text-3xl`.
- **`--gap-gallery` token** (`3px`, beside `--radius-tile`): the masonry + the three `gap-2` grids (review
  takeover, Reviews tab, admin moderation) now all read `gap-[var(--gap-gallery)]` — one knob for every
  media-tile grid, so switching event-page sections no longer jumps the spacing.
- **Docs corrected:** `design-system.md` no longer says "Instrument Serif" (swapped to Urbanist 2026-06-19) or
  "functional headings stay Inter" — replaced with the Urbanist utility + the tiered scale + the gap token; the
  stale globals.css comments fixed too. Verified computed styles live (not just "looks bold").

## 2026-06-22 — HOTFIX: PGRST201 embed ambiguity took /dashboard + admin + purge cron down (`184bcb1`)

**Incident:** `/dashboard` rendered the "Something went wrong" boundary (Will hit it navigating back from an
event page). Vercel runtime logs showed **`PGRST201`** — "more than one relationship found between events and
media" — on `GET /dashboard`.

**Root cause:** the R1 `reel_items` table (`ec49410`, ~2h earlier) is a junction with a composite PK
`(event_id, media_id)` and FKs to BOTH `events` and `media`, so PostgREST inferred an `events`↔`media`
many-to-many that collided with the direct `media_event_id_fkey`. Every query embedding `events` from `media`
via a bare `events!inner(...)` became ambiguous and threw. **Latent since R1** — `/dashboard`
(`getHostStorageSummary`) was just the first page to hit such an embed; the admin metrics/accounts/moderation
views and the **purge cron** (a durability job) were silently failing too. typecheck/lint/build can't catch it
(it's a live-PostgREST schema-relationship resolution, not a type error) — and the R1/R2 red-teams only loaded
the event page, never `/dashboard`.

**Fix:** pinned all 9 `events`↔`media` embeds to the direct FK — `events!inner(...)` →
`events!media_event_id_fkey!inner(...)` — across `storage`/`accounts`/`metrics`/`moderation` queries + the
purge cron. The embedded resource keeps its name `events`, so the `.eq("events.col", …)` filters are unchanged.
**Verified against LIVE PostgREST before shipping:** the bare form returns PGRST201 (HTTP 300) with both
relationships named; the hinted form resolves (HTTP 200). Recorded the gotcha as a ★ landmine in
database-security.md (any new junction over two already-related tables breaks their embeds → always hint the
FK; grep when adding such a table).

## 2026-06-21 — Reviews tab + moderation-disable auto-approve confirm (Reel R2+R3, `a7405d6`)

Completed the event-page tab system (**Gallery | Reel | Reviews**) and the moderation lifecycle. The
pending-approval queue, which lived in a teaser ABOVE the tabs, is now a proper **Reviews tab**; turning
moderation off auto-approves anything still under review.

- **R2 — Reviews tab.** `tabs.ts` gains `"reviews"` + `resolveInitialEventTab(eventTab, { moderationOn,
  hasPending })` — gates the tab to moderation-on (never a dead tab) and, with no explicit `?eventTab`,
  **surfaces Reviews first when a queue is waiting** (Will's call). A new `ReviewTakeoverProvider` (mirrors
  `ReelProvider`) owns the takeover open-state and mounts the full-screen `HostReview` as a **sibling of the
  tabs** — always mounted, so it survives tab switches (the S4 close/beat-lifecycle invariant); `HostReview`
  took surgical controlled-`open`/`showTeaser` props (the beat/exit/resync choreography byte-for-byte). New
  `ReviewsPanel` is the tab content (pending grid + "Review all" + an all-caught-up empty state). The count is
  **amber** (a needs-action signal, distinct from the muted Gallery/Reel counts). The standalone above-tabs
  teaser is removed; `event-uploads.tsx`'s stale "review above" empty copy now points to the Reviews tab.
- **R3 — moderation-disable confirm.** The `/settings` moderation Switch got the Part-2 confirm pattern
  (deferred open, apply-on-confirm); it fires only when turning OFF with a queue and names the count.
  `pendingCount` threads via the existing `getEventCardStats` through the settings form. `updateEventAction`
  calls `approveAllPending(id)` when moderation resolves to `live` — the modal is consent, the server is the
  invariant (live mode never holds pending media; idempotent, `getUser` + RLS-scoped).
- **Verified:** gate green (typecheck/lint/491 tests/build) + a 5-dimension adversarial review workflow
  (hydration, controlled-open, takeover-survival, authz, copy) returned zero actionable findings. Live on
  the demo (seeded 3 pending via Supabase MCP): landed on Reviews with the amber `(3)`; "Review all" opened
  the takeover; approving 1 dropped the header to 2 **with the takeover staying open** (survival under
  revalidate) + a green toast; counts updated (Gallery 6→7, Reviews 3→2). Settings: toggling moderation off
  popped the confirm naming "2 photos," and on save the DB showed `moderation=live` + **0 pending** (both
  auto-approved); the Reviews tab then disappeared. No console errors. Demo restored to its original state.

## 2026-06-21 — Reel Curation R1: Add to Reel + Uploads/Reel tabs (`ec49410`)

The curation foundation for the highlight reel (its own round, post-S5). The host marks approved media as
"in the reel" and views the curated set in a new Reel tab; the highlight VIDEO generation stays deferred
(external worker, ADR-0003). Decisions ratified with Will: ONE reel per event, curation FREE for any tier
(generation is the future paid moment), add-order (reorder later), host-only + host-private + approved-only.
Built to MIRROR the proven likes system end-to-end; green-gated (489 tests) → shipped → live-verified.
- **Data** (`…180000_reel_items`): a `reel_items(event_id, media_id, position, added_at)` join table -
  host-scoped SELECT+DELETE RLS, grant-locked (select,delete to authenticated; INSERT/UPDATE revoked), and
  an access-checked SECURITY DEFINER `add_to_reel(media_id)` (host owns event + media approved + not removed;
  appends position; idempotent). Un-reel = a host-RLS browser delete. Advisors clean (`add_to_reel` in 0029,
  NOT 0028; `reel_items` policied); types regenerated; the RPC's unauthorized guard contract-checked.
- **State**: a `ReelProvider` cloned from `LikesProvider` but HOST-ONLY (the signed-out account branch
  dropped) - an optimistic, insertion-ordered Set seeded server-side (`listReelItems`), client-direct RPC/
  delete, shared across both tabs so an add in Uploads reflects instantly in the Reel tab.
- **Action**: a `ReelButton` (a `Clapperboard` in a NEW `--reel` violet token) distinct from Like, in the
  host tile overlay (before Like, approved-only) + the lightbox curate group; reads `useReel()` so it's
  host-only + opt-in.
- **Tabs**: `resolveInitialEventTab` (pure, unit-tested, mirrors `resolveInitialFilter`) + a Tabs
  (Uploads | Reel) below the command strip (`?eventTab=`); HostReview stays above (Reviews is a later round).
  The Reel tab renders the curated set in add-order with an empty onboarding teaser + a "generation coming
  soon" note. Client-island tab content (host-page hydration).
- **Live-verified** (partyreel.com, host): the tabs hydrate; Add-to-Reel writes land (`reel_count`, positions
  0/1), the chip flips to the violet `lab(64.9 38 -56)`; the Reel tab shows the added media in add-order
  (cross-tab via the shared provider); un-reel drops the tile + the row; pluralization + the generation note
  correct; no console errors. The `--reel` violet (`lab(64.9 38 -56)`) + the `Clapperboard` icon are RATIFIED
  (Will, 2026-06-21). DEFERRED: Reviews tab + moderation-disable confirm, album bulk-select, drag-reorder,
  guest-facing surfacing, multiple reels, the generation worker.
- **Follow-up polish (Will's review, `847ac9c` · `f96c320`):** Like + Reel gained a colored STROKE on hover
  + a FILL on active (they only had an active color before); fixed a DUPLICATE host heart (the masonry tile
  LikeButton + the overlay row LikeButton stacked → a darker "double-wrapped" chip; suppress the tile one for
  the host via `!viewerIsHost`); `cursor-pointer` on every action chip (only the Download `<a>` had it). And
  the signature emil bit: at rest the hover-reveal chips now **collapse + stack neatly off the right edge**
  (the `[data-reveal-chip]` hook — width+margin → 0, row switched gap→margin) so the persistent chips don't
  float with awkward gaps, then **slide back** to their interleaved slots on tile hover (reduced-motion =
  opacity-only). Verified live (at-rest collapse + hover-expand via computed widths; the feel handed to Will).
- **Tabs redesign + animation fix (Will's 2nd review, `ddd13d7`):** the stack/slide had shipped BROKEN - no
  transition (my `[data-reveal-chip]` rules sat in `@layer base`, but the chips' own Tailwind
  transition/`ml-1` are in the higher `utilities` layer, which silently won) and a stuck-expanded tile after a
  mouse click (tile-wide `:focus-within` held it). Fixed: `!important` to beat the layer + fold color/transform
  into the transition; expand on `:hover`/`:focus-visible`/`:has(:focus-visible)` (a mouse click gives `:focus`
  but not `:focus-visible`, so nothing sticks). Active fills softened to a `/25` fill + full stroke (was a
  solid fill that hid the outline), extended to the hidden marker. And the layout: the **Uploads tab →
  Gallery**, **per-tab Card wrappers + headings removed** (bare grid), the **item count moved into a subtle
  muted `(N)` tab label** (scales to future Reviews / Guests), and the tabs switched to the **`line` underline
  variant** (no more double grey box). Verified live (transition now includes max-width; active fill computes
  `oklab(… / 0.25)`; counts + line tabs render).
- **Tile-action reorder (Will's 3rd review, `fa2f590`):** the old order put Hide far-LEFT inside a moderation
  sub-group, so hiding reshuffled the row (the reel chip dropped from the MIDDLE and the hide affordance jumped
  to a separate marker). New FIXED order, left → right: `reel, like, download, hide/show, delete` (beneficial
  curation first, danger last). reel rides the far LEFT so hiding (which drops the item from the approved-only
  reel) collapses the LEADING chip without shuffling the rest; hide/show is now ONE slot (EyeOff approved /
  persistent amber Eye hidden) so toggling swaps the glyph in place. Dropped the dead per-tile Approve (pending
  lives in the review takeover, never the album/reel grid). Verified live: order confirmed; added a tile to the
  reel then hid it - the violet reel chip dropped from the far left while like/download/show/delete held their
  exact positions (no shuffle); amber "Hidden from everyone" toast; clean reset (reel back to 0; no console errors).

## 2026-06-21 — P5·S5: review-takeover polish + smoother album reveal + require-accounts free/default-on (`24e3fa7` · `4b75705` · `cddba33`)

Will's S4-review follow-ups, two independent parts, each green-gated → shipped → live-verified on partyreel.com.
- **P1 — takeover polish + the reveal gap** (`24e3fa7`): the bulk bar's **Select all/Deselect all** moved RIGHT
  beside Hide/Approve (count stays left, all clickable controls grouped); the action buttons carry their count
  (`Hide (3)` / `Approve (All)`); the heading split into a bold **Review** + a muted count. Killed the
  "black squares then 1-2s load" album reveal: the takeover **preloads the just-approved photos during the
  ~1.8s all-caught-up beat** (it holds their stable presigned URLs, which recur byte-identical in the album →
  the reveal paints from cache), and **`MediaTile` now shows a shimmer skeleton** under a photo until it
  decodes, then fades it in (a shared primitive → smooths every gallery surface; reduced-motion = static muted
  block). The real fix (a resized thumbnail variant on upload) stays deferred → ROADMAP. Live-verified: bar
  layout, button counts, bold/muted heading, the skeleton mechanism (loaded photos → skeleton gone).
- **P2 — "Require accounts to upload" is FREE + DEFAULT-ON** (`4b75705`, fix `cddba33`): a monetization reframe
  (Will) — requiring accounts was Pro-gated to push upgrades, but anonymous uploads capture no emails, so FREE
  events seeded no new account-holders (the growth loop stalled). Un-gated for any tier + default-on (safety +
  email capture); allowing anonymous uploads is now an opt-in toggle with a consequence-confirm Dialog. Dropped
  the `enforce_event_pro_gates` trigger (it gated ONLY this setting) + ALTERed the column default to `false`
  (migration `…170000_ungate_require_accounts_default_on`, user-authorized + applied, `get_advisors` clean);
  removed the server tier-gate + the UI Pro-lock + the `GATED_EVENT_SETTINGS` entry; relabeled the toggle +
  rewrote its copy. ENFORCEMENT unchanged (the gallery teaser-gate + `create_guest` email check). The
  confirm-Dialog open is deferred a tick (`setTimeout 0`) so radix's dismissable-layer doesn't catch the
  switch's own click and auto-close it — caught + fixed during the live red-team (Will confirmed it stays open).
  Password + custom_slug stay Pro-gated. Supersedes the config/permissions-rework Pro-gate for require-accounts.
- **Test-tooling note:** the Chrome MCP rendered the (S4-animated) settings route as dimmed/empty in every
  screenshot while the DOM was fully visible (`opacity:1`, real heights) — a capture blind-spot; the confirm
  modal was verified by handing Will the 10-second look. → [testing-verification.md](systems/testing-verification.md).

---

## 2026-06-21 — P5·S4: the event-page polish pass + settings hardening + the motion tuner (`e3c3c62` · `3074d62` · `b058b49` · `a56721b` · `d2f5d7a` · `8824bd1` · `7260223`)

The S3 gallery-first follow-up: an emil-driven creative polish of the host event page + a settings refactor
+ a navigation guard, built increment-by-increment — each green-gated (typecheck/lint/486 tests/build) →
shipped to `main` → live-verified on partyreel.com (signed-in host) before the next. The two riskiest
increments were ADVERSARIALLY REVIEWED (3 independent lenses each) before ship.
- **S4·0 — the motion tuner** (`e3c3c62`): a dev-only, design-key-gated panel (`src/components/dev/
  motion-tuner.tsx`) that writes `--tune-*` CSS vars to `<html>` so motion timings can be finetuned LIVE on
  the real host page ("build-direct + tune-live"), no rebuild loop. Config-driven (each polish increment
  appends knobs); the CSS reads `var(--tune-x, <baked default>)` so it's a pure no-op without the panel; the
  non-throwing `isDesignGateOpen` opens it via `?key=` (never 404s the host's real page). Verified live:
  range + select both drive real computed CSS; inert (unmounted) without the key.
- **A2 — review takeover → full-screen Dialog + open cascade** (`3074d62`): the focused-review takeover
  re-homed from a hand-rolled `fixed inset-0` overlay (its own Escape + scroll-lock) into a full-screen radix
  `Dialog` (radix owns focus-trap / scroll-lock / Escape; a `fullScreen` variant on `ui/dialog.tsx`). The
  pending grid CASCADES in (`[data-review-tile]` + `--tile-i`). The optimistic logic preserved byte-for-byte.
  Adversarial review (optimistic / a11y / hydration lenses) → shipped + an overlay nit fixed.
- **A3 — bulk-approve removal exit + all-caught-up beat** (`b058b49`): the signature delights. On approve/hide
  the acted tiles fade + scale OUT (`[data-exiting]`) before the list reflows; when the LAST pending clears an
  "all caught up" success beat (`[data-unlock-success]`) plays before the takeover closes. `run()` rewritten
  (fire the action up front → exit → commit → beat → reconcile); the parent now ALWAYS renders `HostReview`
  so it owns its close lifecycle (the beat + the radix close-exit survive the revalidation that empties
  pendingItems). Adversarial review caught + fixed TWO majors pre-ship: (1) the beat must ride OUT the
  close-slide (reset caughtUp only AFTER the exit — no empty-"Review 0 photos" flash); (2) a guest upload
  landing DURING the beat cancels the close (a `pendingRef` re-check) so the host isn't bounced under a false
  "all caught up". Live-verified incl. capturing the beat + the optimistic subset/all approve persisting to
  the DB.
- **A4 — micro-feedback** (`a56721b`): selection-checkmark scale-in (`[data-check-pop]`, review tiles + QR
  presets); QR preset swatches cascade in (`[data-preset-arrive]` keyframe + `--arrive-i`); the Add panel +
  the bulk-bar action set reveal (`[data-settings-reveal]`, re-keyed on the 0↔some SWAP only); the bulk-bar
  seam fixed (`bg-background/95`+blur → opaque).
- **A5 — rare-state fades** (`d2f5d7a`): the Uploads empty/all-caught-up copy fades in; the settings route's
  sections settle in a light top-down stagger (`--arrive-i`) atop the route crossfade.
- **B — EventSettingsForm decomposition** (`8824bd1`): the 510-line form split into an orchestrator (the one
  `useForm`/`<Form>` + the single Save) + section components (`event-settings/{details,visibility,uploads,
  danger-zone}-section.tsx`) reading the form via `useFormContext`. Behavior-preserving: isDirty/reset, the
  password-panel resetField, the useWatch preview crossfade, the Pro-gates, the `passwordSelectedWithoutHash`
  block all preserved. Live-verified a save round-trip (persist + dirty-clear) through the new structure.
- **C — unsaved-changes guard** (`7260223`): leaving settings with unsaved edits now warns. A `beforeunload`
  hook (`use-unsaved-changes-guard.ts`, registered only while dirty) for hard nav + a `SettingsWithGuard`
  client wrapper that owns `dirty` (the form reports via `onDirtyChange`) and intercepts the back-link
  (Next 16 `Link.onNavigate` → preventDefault → a confirm Dialog → Discard `router.push` / Keep editing).
  Scope: the back-link + beforeunload ONLY (not every app-shell link, not popstate). Live-verified: dirty →
  back → "Discard changes?" → Discard navigates cleanly; Save clears the guard.
- **TEST-TOOLING note:** the Chrome-MCP `javascript_tool` runs in an isolated world — `style.setProperty` on
  `<html>` from it does NOT reach the app's main-world `getComputedStyle` (run()'s `readMs`), so an
  MCP-injected `--tune-*` can't widen a JS-read motion to ease capture; capture a transient via trigger +
  short `wait` + `screenshot` in ONE `browser_batch` instead. (The "magic"/creative-delight principle was
  encoded into CLAUDE.md + design-system.md earlier, `681c13d`.)
- **Follow-up fix** (`d5afd0c`): the review teaser + takeover had shipped (since 3b) rendering tiles with
  `next/image`, whose `/_next/image` optimizer 400s on presigned R2 URLs (no remotePatterns; presigns are
  short-lived + per-request) AND can't render video — so EVERY review thumbnail was broken. It went unnoticed
  because the black tiles read as "loading" (the testing-verification trap); Will caught it on a real reload.
  Fixed to the shared `MediaTile` (plain `<img>` / `<video>` poster) like every other gallery surface;
  live-verified the teaser + takeover thumbnails now load (R2 200s, video posters + play badges).
- **Review-surface iteration on Will's live notes** (`7b40c90` · `9c532ec`): (1) **Select all / Deselect
  all** in the bulk bar (select everything → deselect the few rejects → Approve; hoisted out of the re-keyed
  crossfade so it never loses focus / re-fades). (2) per-**video preview** — a ▶ on video tiles opens an
  in-takeover `<video controls autoPlay>` overlay (a poster can't tell you what you're approving); tiles became
  a `<div>` with sibling select + ▶ buttons; preview resets on close + drops in the resync. (3) the **motion
  tuner now works over the takeover** — it's `modal={!devUnlocked}` (a modal radix Dialog's
  `body{pointer-events:none}` made the body-portaled tuner inert), + an `onInteractOutside` guard so tuning
  doesn't dismiss the (non-modal) takeover. (4) **6-col** desktop grid (denser triage). Adversarially reviewed
  (3 lenses, optimistic logic CLEAN); live-verified all four — and live testing caught that the review's claim
  "non-modal radix doesn't self-close" was WRONG (dragging a slider closed the takeover until the guard, the
  reinforcing-case for verify-don't-trust).
- **Review round 2 on Will's notes** (`8aa86c2`): (1) NO one-click approve-all — the Hide/Approve actions
  appear only once something is selected, so a fresh 0-selected takeover can't auto-approve everything
  ("Select all → Approve" is the intentional whole-queue path; removed the standalone "Approve all"). (2) The
  motion tuner MOVED to the lab at `/design/motion` (a `MotionPlayground` driving replayable dummy animations
  on the same hooks) — tuning real prod animations was finicky (refresh + re-enter per tweak); the tuner was
  removed from the prod event page and the takeover reverted to plain modal (dropped the non-modal hack +
  onInteractOutside + devUnlocked). (3) GLOBAL state-colored toasts — sonner data-type → success=green /
  warning=amber / error=red (unlayered CSS via the cn-toast hook); HIDE now toasts warning (amber) from the
  review surface + the tile/lightbox moderation. (4) the "all caught up" beat hold 1100ms → 1800ms (it cleared
  too fast to read). Live-verified all four (the colored toast confirmed via the warning icon + the shipped CSS
  rule, since sonner toasts are transient to the Chrome MCP). OPEN: red-for-deletions deferred (a successful
  delete in toast.error reads as failure via the error icon; needs a destructive-confirmation variant).

## 2026-06-21 — P5·S3·3b: the gallery-first host event page (`dd476f4` · `f4ed111` · `42677d1` · `9f2eea2` · `026834c` · `47d08f0`)

The host event page rebuilt **gallery-first** (the gallery IS the page, mirroring the guest experience),
lab-first then built A→D — each increment deployed + live-verified on partyreel.com before the next.
- **Stage 1 — the lab** (`dd476f4`, ratified `31c43b8`): a new `host-event-build` Workbench touchpoint staged
  interactive takes of the whole page (header config-status treatments, the responsive command strip, the
  review surface in BOTH forms, the settings crossfade). Will felt them live + picked **review = FOCUSED
  review mode** (a full takeover, not in-page expansion) + **header = STATUS ROW**; recorded on the touchpoint.
- **A** (`f4ed111`, picker fix `42677d1`): a dedicated `/settings` route (settings form + link/slug config +
  the Deleted bin behind it), the gallery-first restructure, the Share-primary command strip, and a
  `[data-route-fade]` CSS route crossfade. `EventShareDialog` gained opt-in props to surface the QR designer
  ("Customize") in the share flow (Will: a fun, core feature, NOT tucked into settings) + a quiet Settings
  link. Live red-team caught the QR picker overflowing the dialog (`sm:grid-cols-4` is a VIEWPORT breakpoint,
  the dialog ~460px) → fixed to a 2×2 that fits any container.
- **B** (`9f2eea2`): the editorial status-row header (name + date / items / contributors / views stat line +
  Open / Accepting config chips). `contributorCount` computed LOCALLY (host-accurate, vs `getGalleryStats`'s
  guest-privacy zero for password/private events).
- **C** (`026834c`): the ratified upload combo — the command Add (inline panel) + a floating Add on scroll
  (never both, via a sentinel; `FloatingAddButton` + `useInViewSentinel` reused from guest), with a live
  "N uploading" chip. `EventUploads` is gallery-only now; the uploader moved to the command bar.
- **D** (`47d08f0`): the FOCUSED review mode replaces the Pending-review card — a faded-edge teaser opens a
  full-screen takeover with tap-to-select + a bulk bar (Approve / Hide the selection, or Approve all),
  optimistic with revert-on-failure. New `approveBulk`/`hideBulk` mutations (scoped to `status='pending'`) +
  actions. The gated `/design/compositions` probe gains the review surface for auth-free hydration checks.
- **Hydration discipline:** every SSR'd surface stays native-`title` only (no radix Tooltip — the 3c.2
  regression cause); rich client UI lives in client islands. No hydration errors across A–D.
- **Verified:** typecheck/lint/test (486)/build green at each increment; live red-team in Chrome (signed in)
  per increment — gallery-first order, command strip + the nested QR designer (picker 2×2), command + floating
  Add, the focused review with a **seeded-pending bulk approve that persisted to the DB** (8 approved + 1
  pending mid-test, then restored). A standing Google sign-in privilege was recorded so the live red-team
  self-serves when the test session is logged out (`de92bb5`).

## 2026-06-20 — P5·S3·3c.2: the lightbox host actions + the UNIVERSAL action-color refresh (`4b8cbc9`, `6600e28`)

The gallery-action model reaches the lightbox, and the per-action color system goes **universal**.
- **Stage 1 — the lab** (`4b8cbc9`): the `gallery-actions` Workbench touchpoint recolored + restructured
  (a color legend, host tile rest-vs-hover, the colored grouped lightbox pill, guest parity), plus a live
  **interactive toast demo** (sonner) to feel + lock the Like/Hide copy. Ratified in chat → the touchpoint
  `decision`/`decisionNote` recorded. Direction correction: the color system is **UNIVERSAL (guest + host)**;
  only the action SET differs (guests have no hide/approve/delete) — the prior "viewer pill is unchanged"
  was a translation artifact (the guest viewer keeps its behavior/gestures but DOES gain the action colors).
- **Stage 2 — live** (`6600e28`): the shared `media-lightbox.tsx` gains the host's grouped **"enjoy | curate"
  pill** (`[like · count · download · share] | [approve-or-hide-or-unhide · remove]`), gated
  `viewerIsHost && onSetStatus` so the **guest pill is behavior-identical**. Like LEFTMOST (ratified B2);
  Remove modal-confirm; approve/hide/unhide direct. New `onSetStatus`/`onRemove` props thread
  page → event-uploads / pending-grid → host-media-grid → masonry → lightbox (with the event JOIN url for
  Share). A shared `useModeration(eventId)` hook is the ONE home for the moderation calls + copy/toasts
  (tile overlay + lightbox); **Hide toasts "Hidden from everyone" from both**. The host tile moderation
  flips to `hidden md:flex` (mobile tiles = Like + Save only; hide/delete → the lightbox). Universal color:
  the lightbox + tile Like turn rose when liked (was white), Download is blue-on-hover everywhere, and the
  GUEST tile gains a blue Download beside the far-right Like; the like toast is "Added to your likes".
- **Verified:** 486 green incl. 5 new lightbox host-action pins (curate gated on host; status→buttons;
  remove behind confirm; the guest pill carries none) + all gesture/guest pins; typecheck/lint/build clean;
  the guest lightbox live-checked locally (clean enjoy pill, no curate, behavior unchanged). Host lightbox
  live red-team on partyreel.com (Will's session): approved → `Like·Save·Share | Hide·Remove`, hidden →
  `… | Show·Remove`, Hide persisted + the pill swapped, Remove modal-confirm (Cancel = no delete), mobile
  flip confirmed.
- **Polish — regressed, reverted, re-shipped scoped** (Will's review pass). The polish: OPTIMISTIC
  moderation (instant tile + lightbox via `useOptimistic` lifted to HostMediaGrid; reverts + toasts on
  failure, killing the revalidation lag), a **persistent amber hidden marker** (off-hover + mobile, like the
  liked heart, atop the 30% dim), a bare-icon lightbox Like, Share = blue (`--save`), the "Added to your
  likes" toast, and styled hover tooltips.
  - **Regression** (`a4c3fd4`): the first cut wrapped ~50 actions in radix Tooltips INCLUDING the SSR'd
    gallery TILES (+ a nested `Tooltip`/`Dialog` on the tile Remove). That caused a hydration mismatch that
    PROD React bails on (dev recovers, so it was masked): the host gallery subtree silently never hydrated
    (lightbox wouldn't open, tile actions dead, `readyState:complete`, zero console errors). Reverted (`f98f225`).
  - **Root cause + fix** (`2f23c3a`): tooltips are now **LIGHTBOX-ONLY** (the lightbox is `MediaLightboxLazy`,
    `ssr:false` => client-only => can't cause a hydration mismatch; the SSR'd tiles use native `title`). The
    optimistic moderation + the persistent marker were re-confirmed to hydrate cleanly. The rest of the
    polish (bare-icon Like, Share=blue, active-amber Show, the like toast) re-shipped unchanged.
  - **Verified:** 486 green; typecheck/lint/build clean. Confirmed via a NEW gated host-gallery hydration
    probe (`/design/compositions` now wraps the moderation grid in `LikesProvider`) which hydrates clean on a
    fresh dev server AND on prod (objective react-fiber check), plus Will confirmed the real host event page
    on his browser (lightbox opens; hide/unhide + tooltips/colors work). LESSON: CDP automated checks
    (programmatic `.click()`, react-fiber inspection) FALSE-NEGATIVE on the heavy `(app)` host page — the
    light gated probe + a human's real browser are the reliable instruments (see
    [`systems/architecture.md`](systems/architecture.md)).

## 2026-06-20 — P5·S3 progress: 3a masonry foundation, the gallery-action model (3c.1), + the profiles roadmap (`0ef35d5`, `73d109c`, `59fe7e2`, `d76792f`)

- **3a** (`0ef35d5`): `MasonryColumns` gained a `renderOverlay` slot + `viewerIsHost` pass-through; the
  host moderation + recovery-bin grids adopted the shared masonry (controls ride any ratio); dims plumbed
  into the event-page mappings; the dead square-grid `MediaGrid` retired. The lab `/design/compositions`
  gained the moderation + bin grids.
- **Gallery-action lab** (`73d109c`): a `gallery-actions` Workbench touchpoint staged the cross-surface
  hover + lightbox action model (host hover arrangements, the lightbox pill layouts, guest parity).
- **3c.1** (`59fe7e2` + `d76792f`): the host gallery TILE action model. A NEW `--save` blue action token
  (the first non-state hue) + the per-action color system (like=rose, hide=amber, remove=red, save=blue,
  approve=green; monochrome at rest → color on direct hover). The host tile is a hover-reveal top-right
  action row, far-right persistent Like, and the host can now LIKE (a `LikesProvider` on the host gallery;
  a host like is a normal like). Hidden media renders at 30% opacity (`MasonryColumns` `dimItem`); the
  status dot is dropped. A new `LikeButton variant="row"` leaves the pinned GUEST tile untouched. NEXT:
  3c.2 (the lightbox host actions). Ratified S0 forks: A1 Editorial / B1 settings ROUTE / C1 Deleted
  BEHIND settings.
- **Roadmap:** a NEW "User profiles + social discovery" Major Overhaul (`59fe7e2`) — a platform expansion
  (profiles + Pro `/u/[slug]` + follow + guest lists + a Following tab); the dedicated round runs after the
  S3 host/guest core; cheap profile-aware hooks laid in 3c/3b now.

## 2026-06-20 — P5·S3·S0: gallery-first event-page forks + "Trash" → "Deleted" rename (`bb11f15`)

The S3·S0 lab round (the gallery-first host event page Will flagged "terribly designed"). The
gallery-first DIRECTION is ratified; this stages it CONCRETE for review.
- NEW `host-event-page` Workbench touchpoint (surface "host", auto-surfaced; "Exploring") with three
  labeled groups: **A. whole-page composition** (3 takes - editorial / stat-line / share-forward),
  **B. settings entry** (route / drawer / dialog), **C. deleted placement** (behind-settings /
  command-strip / gallery-toggle). Hand-built PhoneShell mocks, no production imports, emil-annotated.
  Verified behind the key (both modes flip) + live (gate 404s without the key; keyed renders). Awaiting
  Will's ratification of the composition + both forks (recorded on the touchpoint when picked).
- **Copy rename "Trash" → "Deleted"** (the canonical user-facing label, concise like Events/Uploads/
  Likes): the dashboard filter chip, the event-page section heading, the over-cap reduced + inactivity
  recovery emails, the "items about to be cleared" notification, the standby-bytes meter line, and the
  no-longer-in-bin error. LABEL ONLY - the `trash` filter VALUE + the legacy `?tab=deleted` alias +
  `RecentlyDeletedGrid` + all internal identifiers are unchanged, so the deep-link contract holds. Email
  + feed pins updated; 479 green.
- Process: planning moved to **Master > Phase > Slice** (per-slice plan files; the Phase 5 plan is now a
  lean index + the deep S3 plan at `p5-s3-gallery-first-event-page.md`).

## 2026-06-20 — Workbench round-out: complete the live reference (`761d274`, `3c5f576`)

Fleshed out the live-reference coverage (Will's call: round out the tool while it's fresh, before S3).
- **Components** gained the remaining `ui/*` primitives (no `select`/`combobox` exist): **Form** (a live
  react-hook-form + zod demo with real validation), **Drawer** (vaul), **Label**.
- NEW **`/design/patterns`**: the standalone `shared/*` patterns (Logo, the play badges over a sample
  poster, EmptyState both variants, NotFoundScreen, AnonymousInfo; SetNameStep `inert` + RouteError as a
  static mock, since those mount side effects).
- NEW **`/design/compositions`**: the real PRODUCT components from sample props (the live app UI without
  seeding an event) - EventCard in all four states, the StorageMeter, the FilterChips, the share suite,
  the teasers. Data/provider-heavy UI deferred with an on-page note (S3 adds the moderation gallery here).
- LESSON: the build does NOT catch RSC serialization errors. The server Patterns page passing `onSaved` to
  the client `SetNameStep` threw "event handlers cannot be passed to Client Component props" only at
  RUNTIME (200/500 check caught it) - wrapped it in a client demo. Verify pages render, not just compile.

## 2026-06-19 — The Workbench: the design lab becomes a live reference + sandbox (`da2a0f8`, `ed40bd1`, `9030adf`)

The gated `/design` lab outgrew its "pick a variant + ratify" origins. In two steps it became **the
Workbench**, Partyreel's one internal UI tool: a live design-system reference + a prototyping sandbox.

- **Reference (live, synced by construction)**: NEW `/design/foundations` renders the design tokens from
  the REAL CSS vars (every swatch fills with `var(--token)`; type/radius/motion/elevation specimens);
  NEW `/design/components` imports the real `ui/*`+`shared/*` primitives from production (fully
  interactive overlays via composition, the stateful three in a client island). Edit a token/component,
  this updates. `reference/reference-ui.tsx` is the framing kit; `/design/system`+`/design/demo` are the
  composed showcases.
- **Shell + IA**: NEW `catalog.ts` is the SINGLE source for the tool's contents + nav (zones
  Reference/Sandbox/Lab → groups → entries; sandbox derives from `touchpoints.ts` by surface; adding any
  UI is one entry). The sidebar (`lab-nav.tsx`) has a three-tier hierarchy (zones bold, groups quiet,
  items the only clickable rows + a status dot, sr-only status), a live search, real app-token chrome,
  desktop rail + mobile drawer.
- **Theme unified on next-themes** (the lab's single source): one toggle drives the REAL app theme;
  `.dark .mono` follows the global class so chrome + reference + sandbox all flip together. The bespoke
  mode store + the duplicate Urbanist load were retired; `.font-opt-urbanist` points at the root
  `--font-display`.
- **Selection machinery retired**: `SelectButton`/`PicksBoard`/the picks store removed (`selection.tsx`
  deleted); `decision`/`decisionNote` survive as a read-only "Shipped" status + the variant NAME (never a
  number). The "Touchpoint N of 13" count + the picking vocabulary are gone; the landing is "The
  Workbench". The lab heading face swapped Instrument Serif → Urbanist (matches the app).

Verified: 479 green, typecheck/lint/build clean; preview across light+dark (one toggle flips chrome +
live reference + sandbox), real primitives render + open (Dialog/Popover), live swatches show real
tokens; live prod red-team (gate 404s without/with wrong key). A 4-lens, 23-agent adversarial review
(refutation-verified) found + fixed 14 items (the Tooltip-timing lie, a stale "Instrument" rule, WCAG
`aria-hidden`-focusable + use-of-color gaps, DRY/dead-config). Gated + no-index + self-contained;
`design.css` → `globals.css` token dedup stays a Phase 8 follow-up.

## 2026-06-12 — V1 program PHASE 4.5 COMPLETE: the guest ARRIVAL experience

Opened from Will's iPhone pass of the live gated entry (sheet popped like a load artifact, dishonest
drag bar, autofocus keyboard ambush, small type, disconnected steps, zero unlock feedback) + the
strategic reframe: the gated arrival is the PRIMARY first experience. Lab-first: the interactive
ARRIVAL FLOW PLAYER (touchpoint 11, real Vaul physics + knobs, `9c89e72`) → Will ratified **Calm +
700ms beat** (`441f088`) → the production transplant in four slices: `ca36a6f` (S2 the Vaul shell
swap + the honest-affordance table + no autofocus), `9f6ddf6` (S3 the continuous step container +
back-to-welcome), `9eb9ef7` (S4 the arrival beat + the invitation welcome + warm gates + Act 1),
`fd43dcb` (S5 the success hold + the reveal).

**The adversarial implementation audit** (6 lenses, 45 agents, every finding refutation-verified;
prompted by a mid-build model handoff): 12 unique confirmed findings, all fixed in `3c609bb` —
headline catches: the hold wasn't HELD (X/handle popped in over "You're in"; a mid-beat dismiss
corrupted the lighter path), the password→account hop dead-ended for returning guests, the
exits-faster override was a NO-OP (vaul's close is a keyframe animation, not a transition), the
ratified in-place button morph had been replaced by a step swap, the ratified 55svh welcome
presence + h-11 password input + warm error copy never shipped, `event_date` leaked into locked
pages via the new welcome byline (redaction extended), StrictMode dev ghost clones, hold
idempotence. 454 pins green. CLOSE (2026-06-12): final live red-team clean (locked flight payload
= name + count only incl. the new date redaction; zero presigns; generic 401; unlock→full e2e),
wire JS 571 KB (+9, the perf note), Test Wedding reverted to `open`. Per Will, on-device
choreography fine-tuning deferred to a post-roadmap lab round (lab = direction, not a per-phase
finetune gate).

## 2026-06-11 — V1 program PHASE 4 COMPLETE: the guest redesign (the flagship surface)

Nine slices, each shipped green + live-verified; the live guest page `/e/[token]` rebuilt to the
ratified Phase-1 spec while preserving every behavior (47→417 pins, updated never deleted). Commits
`af93082` (S1) · `80f1f0d` (S2) · `bc05694` (S3) · `b82597a` (S4) · `f81dd1e` (S5) · `6afa008` (S6) ·
`caa7628` (S7) · `d912513` (S8) · `a553972`+close (S9).

- **S1 dimensions:** width/height/duration_seconds plumbed RPC→GuestMediaRow→toGridItems→GridMedia
  (nullable; outside the ETag hash since write-once per id). Cross-access ETag invariant re-verified.
- **S2 masonry:** the ratified V2 grid (CSS columns-2, 3px gaps/radius, natural aspect ratios, 1:1
  null fallback, seeded 45ms stagger, corner play badge). Guest-only; host grids untouched.
- **S3 header + stats:** the left-editorial header (byline + "N photos & videos from M guests" +
  full-width Add + Save/Invite row, 15px reading copy). New `getGalleryStats` admin read (numbers
  only, never identities). HARDENING found red-teaming: host name + description leaked into the RSC
  flight payload of LOCKED pages (props serialize even when the UI hides them) → the page now passes
  a redacted `shellEvent` at access `none` (name + count only).
- **S4 queue extraction:** the upload machine moved verbatim into `useUploadQueue`; GuestUpload
  became a thin engine + `{openPicker, retry}` handle + `onQueueChange`. 3 new contract pins added
  BEFORE the UI moved.
- **S5 in-gallery upload:** progress/error/retry/green-check render as masonry tiles; the blob
  re-key (queueId→mediaId, same URL object) makes a pending tile become the optimistic tile with
  zero flicker; floating Add pill via an IntersectionObserver sentinel (never both Adds); the
  dropzone + per-file list retired. Live-verified end to end (a 1MB upload: pending tile in 5ms,
  complete + green check in 2.1s, header live-bumped).
- **S6 entry sheet:** the adaptive bottom sheet (max-sm: utilities), ghost grid + locked count tease,
  the host-safety account framing, drag bar on dismissible steps only. The step machine untouched;
  password firmness re-verified (Escape/backdrop/X inert), unlock flow live-verified.
- **S7 empty state:** the photographic-promise ghost mosaic (sample pack re-optimized to ~60KB total
  of grayscale WebP) + centered CTA; header drops its Add at 0 items.
- **S8 lightbox surgery:** the floating-pill chrome on the SHARED viewer (action pill + attribution
  pill, floating close, thirds tap nav via onBackdropClick, whisper scrims, guest-only `shareUrl` =
  join url never a media URL). The gesture machinery kept byte-verbatim (17 physics pins). Counter
  pin reformatted + 4 new side-tap pins.
- **S9 PWA + close:** the web manifest + ink-aperture icon set (192/512/maskable/apple) + viewport
  theme color (no service worker, settled); save-prompt reskin; the docs + perf note + this record.
- **Phase-close adversarial review** (5-lens workflow over the full diff): two real in-phase
  regressions confirmed + fixed (`b6e3daa`), no others. (1) The S8 floating pill stack was
  `absolute inset-x-0 z-10` with no `pointer-events-none`, so its full-width flanks sat above the
  swipe track and ate pointerdown across the bottom strip — killing swipe-nav + center-tap-close on
  all 6 shared-viewer surfaces; restored to `pointer-events-none` wrapper + `pointer-events-auto` on
  just the pills. (2) The S5 floating Add pill stayed dead after a password unlock: the sentinel's
  mount-only `[]`-effect read a null ref (the node renders only at access ≠ `none`) and never re-ran,
  and unlock flips access via `router.refresh()` without remounting; switched to a callback ref that
  re-attaches the IntersectionObserver whenever the node mounts.
- Bundle flat (`/e/[token]` 562 KB vs 561 KB); 417 tests green throughout.

## 2026-06-11 — V1 program PHASE 3 COMPLETE: data & delivery architecture (the doorbell gallery)

Eight slices, each shipped green + live-verified; the blind 12s poll became the hybrid doorbell.
Commits `60e9848` (S1) · `4f0c200` (S2) · `7431758` (S3) · `238c554` (S4) · `9ed17ad` (S5) ·
`3aafa50` (S6) · `2322299` (S7) · the S8 docs/fix commit.

- **S1 stable presigns:** gallery read URLs are deterministic within 30-min signing buckets
  (`signingDate` pinned; 90-min TTL) — browser image cache works across refetches. Live-verified
  byte-identical URLs across polls.
- **S2 ETag/304:** the poll route fingerprints the viewer-visible gallery (content + access +
  teaserTotal + bucket id) and answers unchanged galleries with a bare 304 BEFORE presigning.
  Red-teamed the cross-access invariant: a teaser validator with full-access cookies 200s (and the
  reverse); no-ETag early returns; content-change invalidation.
- **S3 doorbell trigger:** `notify_gallery_change()` rings the PUBLIC channel `gallery:<qr_token>`
  on approved-set changes only; realtime.send failures can never fail a media write. 5-assertion
  rolled-back contract check; advisors unchanged. Field find: `realtime.send` no-ops SILENTLY until
  the Realtime service first activates (no day-partitions before the first client subscription).
- **S4 doorbell client:** public-channel subscription + a leading-edge coalescer (~2s suppression +
  jitter + trailing flush); poll drops to 60s while live, 12s when the socket is down. Verified with
  an in-page MutationObserver: **doorbell-to-render 1.05s on a DB approve** (only the ping path
  explains it at a 60s cadence).
- **S5 upload consolidation:** one pipeline engine (`upload/server-pipeline.ts`) + 4 thin strategy
  routes; the hardened RPC layer untouched (ADR-0016). 10 pre-refactor error-path curl fixtures
  re-run post-refactor: byte-identical. Live single-PUT upload through the new pipeline (join →
  presign → R2 PUT → complete `approved`) rendered in the open live tab in **<1s**.
- **S6 streaming scaffold:** the guest RSC passes the gallery as a PROMISE; the shell streams first
  (curl-verified order: shell ~4KB → skeleton ~14KB → tiles ~85KB); `LiveGallery` owns the moved
  machinery via React 19 `use()` + `key={access}`; dashboard + event-detail get `loading.tsx`.
- **S7 code splits:** lazy lightbox (mount latch + pointerover preload, 4 call sites; the component
  file untouched so the pins import it directly), React.lazy EntryModal (forwardRef), lazy admin
  recharts.
- **S8:** revalidation map + slug/password trims, the cacheComponents deferral rationale, the perf
  after-column (steady-state poll 200/74.6KB/120-presigns/12s → **304/0B/0-presigns/60s**, p50
  509→331ms; guest DCL 776→496ms, load 1055→703ms; wire JS 567→561KB with the heavy chunks now
  interaction-deferred), and these records.
- **Phase-close adversarial review** (10 agents over the full diff): 1 confirmed finding (the
  loading.tsx files nested a second `<main>` with wrong geometry — fixed same-day), 4 refuted
  (notably: forged doorbell pings by token holders only induce cheap coalesced 304 polls — the
  capability model holds).
- 410 tests green throughout (the 47 behavior pins survived the LiveGallery extraction untouched).

## 2026-06-11 — V1 program PHASE 2 COMPLETE: the V1 system live (foundation + safety nets)

Five slices, each shipped green + live-verified; the Phase 1 spec became production reality.
Commits `329aa82` (S1) · `39089de` (S2+S3) · `adc3f0c` (S4) · `f0c24b1` (probe).

- **S1 - behavior pins:** vitest split into unit (node) + component (jsdom) projects; 47 pins
  freeze MediaLightbox (20: gesture lock, edge damp, commit/springback timing via a synthetic-clock
  shift + DOMMatrix polyfill), GuestUpload (11: one-at-a-time queue, JIT join, demo, retry) and
  LikesProvider (16: seed/replay/optimistic/revert) ahead of the Phase 4-5 decomposition. Pins
  assert behavior only - the visual flip didn't touch them. (jsdom can't drive the lightbox
  pause-on-navigate effect; that pin was dropped, covered by live device passes.)
- **S2 - token transplant + type flip:** globals.css rewritten to the mono system (paper/night,
  brand→ink alias collapsed all 88 brand usages, state colors, the rounding system, the elevation
  contract, three motion curves, `font-heading` as the five-knob @utility, sidebar tokens removed);
  Instrument Serif self-hosted via next/font; `BRAND_HEX` → ink (all 4 OG cards re-verified
  legible); icon.svg ink; the one focus-state brand usage → ring tokens; QR coral corners
  intentionally retained (scanner-safe).
- **S3 - primitive craft:** button press-scale on `--ease-emphasis` + radius-rides-height; floating
  panels → `rounded-float` + `shadow-float` (zero shadows in dark - the contract); exits-faster
  durations proven composing with tw-animate; switch/progress strong curves; skeleton shimmer;
  empty-state quiet variant; play-badge → gallery tokens; the global 0.01ms reduced-motion guard.
- **S4 - error taxonomy + boundaries:** `src/lib/errors/` (34-code superset, total fallback-copy
  map, compiler-enforced subtype assertions over every result union); `error.tsx` in all 5 route
  groups via the shared `RouteError` (never renders `error.message`) + dependency-free
  `global-error.tsx`; Sentry `SentryArea` grew `render:*`; contact + careers migrated to coded
  failure arms as proof adoption.
- **S5 - baselines + records:** `docs/perf/v1-baseline.md` (wire JS 439-567 KB/route; gallery poll
  p50 509 ms live / 74.6 KB / 120 presigns per poll at 60 items - the doorbell's comparison base;
  live TTFB/DCL/load medians) + `docs/systems/design-system.md` + this record.
- **Live verification:** mono + IS confirmed on partyreel.com (computed-style probes, both modes,
  390px); the gated `/design/boom` probe (PERMANENT lab instrument) crashed prod render →
  global-error rendered generic + digest with zero message leakage → Sentry event tagged
  `render:global`; gate red-teamed (no/wrong key 404, right key 500); `notFound()` paths still 404;
  poll-baseline seed rows deleted + storage counter verified untouched. Two intentional Sentry
  issues from the probe (`JAVASCRIPT-NEXTJS-J`/`-H`) remain unresolved (permission-gated): resolve
  from the Sentry UI.

## 2026-06-11 — V1 program PHASE 1 COMPLETE: all 10 touchpoints ratified (round 7)

Will's final numbered form + notes landed; the lab now records the COMPLETE V1 component spec.
Commit `05b28e1`.

- **Entry = V4 adaptive sheet** (the verdict that also settles the header question): public events
  keep the real-gallery backdrop, locked/empty show the ghost grid + real count; lock mark above the
  heading; the account step framed as the host's SAFETY choice in natural copy, not a capture gate.
- **Header = V1 left editorial** (no cover-image pressure on hosts). Upload combo drops the add tile:
  header Add on load, floating Add on scroll, never both; play badges mark video tiles.
- **Rounding finalized:** surfaces 2px (near-sharp), NEW `--radius-tile` 3px + 3px gaps for media
  (corners no longer open holes), actions stay 16px-at-40px height-scaled.
- **Warning state added** (amber tokens, both modes): needs-review chips wear it. Event cards get
  meta-pill icons + the REAL per-event QR top-left (tiny on purpose; taps open the share suite).
- **Lightbox:** ~30% gracious side tap zones, whisper scrims, swipe primary with tight neighbor
  slide-in. **Forms:** SYSTEM RULE - Instrument for identity moments only; functional headings in
  Inter. Demo recomposed to the final spec.
- The full decision record + remix notes live in `src/app/(dev)/design/touchpoints.ts`.
- **Phase 1 of the v0→V1 program is COMPLETE** (identity, type, component spec all locked; the lab
  stays as the standing design instrument). Next: Phase 2 (design foundation + safety nets)
  re-enters plan mode.

## 2026-06-11 — V1 program Phase 1, round 6: 8 of 10 touchpoints ratified + the cohesive demo

Will's 10-note decision round, synthesized into the lab. Commit `4378d89`.

- **Ratified** (decision config): upload = floating+tile combo w/ green check; gallery = masonry;
  buttons = the sharp-surface/round-action radius system (16px @ 40px, height-scaled action tokens,
  one knob to go pill); lightbox = floating pill (revised: NO like counts for guests, attribution on
  its own bar, edge swipe hints, designed video state); event card = stat-forward overlay (refined
  pills + QR share chip); forms = card sections refined for management, focused column for guided
  flows; empty = photographic promise (mosaic fills the field, CTA centered); qr-card = minimal ink
  AND photo-backed as presets. **Open: entry (1) and header (4)**, header pending the entry verdict.
- **Policy locked: state feedback always gets color** (mono bans BRAND color, never MEANING): success
  green tokens (light+dark), liked = rose heart (white read as unliked), error red. Specimen updated.
- **Three new entry options** (V4 adaptive sheet + ghost grid, V5 count marquee, V6 inline teaser +
  sticky bar) all tease the gallery's SHAPE and COUNT, never pixels - so password + empty events hold
  and the account incentive survives.
- **/design/demo**: the cohesive composition of current picks (event page, lightbox, brand-new event),
  hand-rebuilt per round per Will's call (deliberately not generated from localStorage).
- **Share studio** (QR/share-content configurator) filed on the ROADMAP as its own feature.
- Verified: suite green, demo + revisions walked locally, live behind the gate.

## 2026-06-10 — Design lab: the selection mechanism (picks board + copy summary)

Will's workflow ask, built into the lab. Commit `b103359`.

- Every variant card carries a **Select** control; picks persist per-browser in localStorage
  (`design-picks`, `useSyncExternalStore` per the house pattern, SSR-safe).
- The hub gains the **numbered picks board** (touchpoints 1-10 with variant number + NAME): pass the
  whole set as a screenshot, or **Copy summary** for a numbered text block that maps 1:1 onto numbered
  remix notes in a message.
- Two layers by design: localStorage = Will's WORKING picks (filled badge); `decision` config in
  `touchpoints.ts` = the RATIFIED record the agent commits once passed (outlined badge + "locked").
- Verified: select → store → board live-tested locally end to end; suite green; live on
  partyreel.com behind the gate.

## 2026-06-10 — V1 program Phase 1, round 5: the design lab + the selection round begins

Type verdict landed (Will): **base Instrument Serif locked** (0.60 calibration + 0.013em stroke;
final sizing tweaks happen in the built UI if needed). Commit `449884f`.

- **/design formalized as the standing internal design lab** (Will's call: maintain an internal
  system for prototyping, comparison, and selection): `/design/system` is the locked-system
  reference (five screens + live specimen); `touchpoints.ts` is the DECISION RECORD - Will's pick
  per touchpoint lands as `decision` config and renders as Selected badges on the index ("N of 10
  decided") and the touchpoint page. The lab is the record, not just the showroom. (This supersedes
  the Phase 8 "remove or keep the playground" question: it stays.)
- The type slate retired; the vendored weighted fork stays in `fonts-local/` unused (README notes
  how to resurrect it if real weights are ever needed).
- **Five new touchpoints** join the original five for the selection round: lightbox chrome (pinned /
  floating pill / immersive auto-hide), host event card (cover-led / compact row / stat-forward
  overlay), forms & inputs (card sections / inline rows / focused column), empty & loading states
  (typographic / iconographic / photographic promise), QR table card (minimal ink / invitation
  frame / photo-backed) - the QR cards use the app's real `StyledQr` + classic mono preset, so the
  codes actually scan.
- Verified: suite green; all 12 lab routes 200 behind the gate, retired font routes 404, keyless
  404; 13-capture pack from live. **Phase 1 exit = the 10 touchpoint picks.**

## 2026-06-10 — V1 program Phase 1, round 4: IS bigger + the weighted fork + two new registers

Will: Instrument still leads but reads small; try the multi-weight fork he found, an all-caps
condensed (MasterClass register), and Noto. Commit `799e66b`.

- **A bumped again:** `font-size-adjust` 0.58 → 0.60 (+18% over native); hero verified clip-free at
  `leading-[1.08]`. (Hosting answer recorded: next/font SELF-HOSTS the Google faces too - build-time
  download, served from our domain, zero runtime Google requests.)
- **B, the fork (the build story):** `eliheuer/instruments-serif` (OFL-1.1) ships UFO sources only.
  fontmake rejected the variable build: 51 on-curve points in the Black master labeled `line` where
  Regular has `curve`. Mechanically repaired (relabel only, geometry untouched), then built as a
  **CFF2 variable** (`-o variable-cff2`; the TTF path crashes cu2qu on the now-degenerate cubics) and
  vendored as a 22KB woff2 via `next/font/local` with license + provenance in
  `src/app/(dev)/design/fonts-local/`. Shown at weight 600 with A's exact calibration so the weight
  treatment (real vs stroke) is the only variable. Repaired glyphs verified clean at 600.
- **C/D:** Oswald all-caps condensed (new `--display-transform` knob in the swappable layer; measured
  x-ratio 0.58 → no adjust) and Noto Serif Display (measured 0.54, near-parity).
- Verified: suite green; all five options + the vendored woff2 confirmed serving live behind the gate;
  7-capture pack delivered. Standing call: if none of the new variations wins, Instrument Serif
  carries into Phase 2 as is.

## 2026-06-10 — V1 program Phase 1, round 3.5: swappable type + Instrument tuning + craft pass

Will locked Instrument Serif as the working face with two requirements: the design system must make
the face EASILY SWAPPABLE, and Instrument needed more apparent size plus a touch more weight (it ships
in 400 only). Commit `73b30bf`.

- **Swappable-face architecture:** one generic `[data-dir-display]` rule reads five variables
  (`--display-font/adjust/tracking/weight/stroke`); a face is a block of five values and nothing else.
  Swapping the brand face = changing one block. Phase 2 lifts this shape into the `@theme` type tokens.
- **Instrument tuning:** calibration bumped ABOVE Inter parity (`font-size-adjust: 0.58`; its hairline
  strokes read smaller than its metrics) + a `0.013em` text-stroke as synthetic display weight
  (uniform stem thickening beats browser faux-bold; `font-synthesis: none` so engines can't fake one).
- **Craft pass on the touchpoints** (6-agent parallel critique, confirmed findings applied): press
  feedback on every pressable, the bottom sheet enters as one unit, full-screen CTA semibold +
  safe-area padding, dropzone contrast, FAB shadow/grouping, queue-row hierarchy, gallery stagger
  demos + leading-snug, quiet-tier shape legibility, px-labeled size ramp.
- Verified: suite green; calibration + stroke confirmed via computed styles. NOTE: Vercel dropped the
  webhook for `73b30bf` (no build was created for a successfully pushed commit, first occurrence);
  re-fired by the next push.

## 2026-06-10 — V1 program Phase 1, round 3: type calibration + component touchpoints

Will's round-2 read: Instrument Serif is the favorite BUT renders visibly smaller than Inter at equal
CSS size, and the other faces didn't land. Commit `df97085`.

- **The size lesson, made systematic:** in-browser canvas metrics confirmed the gap (x-height ratio
  0.51 vs Inter's 0.55, ~8%; DM Serif runs 15% small). Every display face now carries a one-time
  `font-size-adjust: 0.55` calibration in its `.font-opt-*` block, normalizing rendered x-height to
  Inter's - so standardized heading scales need NO per-use adjustment. Phase 2 inherits this as the
  per-face calibration in the type tokens. Unsupported browsers degrade to the uncalibrated size.
- **New serif slate** in Instrument's high-contrast neighborhood: Gloock, DM Serif Display, Prata,
  Playfair Display (+ Instrument calibrated, + Inter control); the round-2 grotesks/soft serifs gone.
- **Component touchpoints** (the new explored variable): `/design/c/[touchpoint]` - guest entry
  (centered card / bottom sheet / full-screen welcome), upload moment (dropzone card / floating action
  bar / add-tile-in-grid), gallery grid (uniform / masonry / edge-to-edge), event header (left
  editorial / centered formal / cover hero), buttons (soft rect / pill / sharp + size ramp). All set
  in Instrument on the locked mono system, light/dark toggleable, phone-framed where mobile-first.
- Verified: suite green; calibration confirmed live (computed `fontSizeAdjust: 0.55`); gate re-checked
  on all 11 new routes (404 keyless/bogus, 200 keyed); 11-capture pack from live delivered.
- Exit: Will picks per-touchpoint variant numbers + the typeface (or asks for another round).

## 2026-06-10 — V1 program Phase 1, round 2: monochrome locked, type exploration

Round-1 verdict (Will): **monochrome won, both modes** - zero accent ever; light (paper, hairline) and
dark (glass, media as the light source) ship as ONE system following the device preference, light when
unretrievable. Commit `a1e1569`.

- /design restructured around the verdict: one `.mono` token sheet (light + `[data-mode="dark"]`
  variants; geometry unified to the light radius, revisit in Phase 2), a per-page light/dark/system
  toggle (`mode-shell.tsx`, `useSyncExternalStore` per the house pattern, server snapshot = light by
  construction), and **type as the explored variable**: `/design/[font]` serves six display faces
  (Fraunces, Instrument Serif, Newsreader, Space Grotesk, Geist, Inter-as-control) on identical
  screens, each with per-face optical tuning (`.font-opt-*`).
- The accent direction (Warm Celebration) retired; the upload-success motion specimen is ink-quiet.
- Verified: suite green; toggle + both modes walked locally (a dev-server route-cache restart was
  needed after the `[direction]`→`[font]` rename - prod build unaffected); live gate re-red-teamed on
  the new routes (no/wrong key + bogus slug 404; all six 200 with the key); 12-capture pack (6 faces x
  2 modes, full-page, from live) delivered.
- Exit: Will picks the typeface (+ remix notes) → Phase 2 starts from the locked mono sheet + face.

## 2026-06-10 — V1 rebuild program Phase 1: the identity exploration playground

The v0→V1 full-app refactor/redesign program kicked off (8 phases; the program plan + settled decisions
live in the session plan file; the active-state pointer is in [STATUS.md](STATUS.md)). Phase 1 shipped:
commit `36627e3`.

- A gated `(dev)/design` route group at **/design**: production 404s unless `?key=` timing-safe-matches
  the new `DESIGN_PREVIEW_KEY` env var (set in `.env.local` + Vercel; dev mode is open); `noindex`,
  linked nowhere, absent from the sitemap.
- Three complete identity hypotheses as scoped token sheets (`design.css` `.dir-*` overrides of the raw
  `@theme` vars) + per-direction display faces (Fraunces / Space Grotesk / Bricolage Grotesque, loaded
  only on /design): **A Monochrome Editorial** (light paper, serif, ZERO accent), **B Monochrome
  Night** (dark glass, zero accent, media as the light source), **C Warm Celebration** (the single
  accent exploration, golden-amber). Set composition is 2 monochrome + 1 accent per Will's mid-build
  call: brand color reads too loud next to photos; accent never rides inline iconography in ANY
  direction.
- Five identical-markup screens per direction (guest entry in a phone shell, live gallery + lightbox,
  host dashboard, marketing hero, system specimen) + LIVE motion specimens per the emil-design-eng
  craft standard (custom curves, <300ms, `@starting-style`, press feedback, reduced-motion variants).
  Real Unsplash-licensed sample photos in `public/design/` make the media-is-the-color test honest.
- Verified: full suite green; all three directions walked locally (Preview MCP, desktop + mobile);
  live gate red-teamed on partyreel.com (no/wrong/empty key, subpages, bogus direction, param-case all
  404; correct key 200 on all four pages; `noindex` meta confirmed; sitemap clean); full-page
  screenshot pack captured FROM LIVE (Playwright, 3 directions x 2 widths) and delivered.
- **No DDL, no production-surface changes.** Exit: Will picks a winner + remix notes; the choice gets
  an ADR and the winning sheet transplants into `@theme` in Phase 2.

## 2026-06-09 — Gated gallery P3: host relabel + live guest-experience preview (initiative CLOSED)

The final phase; the 3-phase gated-gallery initiative ([ADR-0017](adr/0017-gated-gallery-view-access.md)) is
complete. Commit `4bd003a`.

- The upload-framed "Allow anonymous uploads" toggle is relabeled **"Require guest accounts"** (a display
  inversion of the same `allow_anonymous_uploads` column: switch ON = accounts required = stored `false`; the
  schema + the server Pro-gate are untouched), with a reframed description for the view-gating.
- A new pure `guestExperienceSummary({visibility, accountRequired, acceptingUploads})` (unit-tested) renders a
  live "what your guests will experience" line under the access controls (re-keyed so it crossfades as the host
  flips the toggles). The dashboard event-detail access line now uses the SAME helper — one source, no drift
  (and the dashboard line now reflects the accounts gate too).
- **No DDL.** Verified: the helper matrix (Vitest); live on partyreel.com as the signed-in host (the relabel +
  reframed copy + the Free-tier upgrade lock + the live summary render, and the dashboard access line shows the
  same sentence). The inverted switch is correct-by-construction (symmetric `!field.value` / `!checked`,
  type-checked; the read side confirmed live by the summary reflecting `accountRequired`).

**Initiative complete (P1 + P2 + P3):** account creation is now the incentive to SEE — a signed-out viewer of a
gated event gets a server-enforced real-photo teaser behind a unified entry modal, the host controls access with
clear labels + a live preview, and the full set never leaves the server. Rationale + the access model: ADR-0017.

## 2026-06-09 — Gated gallery P2: the unified entry modal + first-visit welcome

P1's server-enforced gate gets its face. One `Dialog` ([`entry-modal.tsx`](systems/guest-flow.md)) drives all
guest entry with ordered steps that adapt to the event: `welcome → password? → account?`. Commit `966ee0e`.

- **Server-driven steps:** `computeEntry` (pure, unit-tested) derives the ordered steps from the access-derived
  `gateSteps` + a first-visit flag; each step's existing form (`<PasswordGate>` / `<EnterEventPrompt>`, reused as
  step bodies) advances via `router.refresh()` → the RSC re-resolves → the satisfied gate drops. No client
  step-machine.
- **Welcome** = the always-on friendly front door + a light mini-guide, shown on the first visit per device
  (`pr_welcome_<qrToken>` via `useSyncExternalStore`), even on a fully public event; suppressed for the
  owner/demo. The button reads "Continue" when a gate follows, else "View event".
- **Dismissibility fits what's behind each step** (Will's "dismiss to what?"): welcome freely dismissable to the
  page behind; password FIRM (no X / backdrop / Escape — nothing behind it but the locked event); account closes
  to the browsable teaser, re-opened by the gallery's "See all N photos" button. Shell is Radix `Dialog` ONLY (a
  swipe-away drawer would mis-signal a must-complete gate) — a deliberate reshape from the master sketch's
  Drawer-on-mobile idea.
- Removed the full-page password early-return (the modal owns it); the `none` state renders a locked backdrop
  revealing only the NAME (privacy parity with the OG metadata + the old locked screen). `<EnterEventPrompt>`
  reframed for the VIEW gate ("See all the photos"); `<PasswordGate>` lost its full-screen wrapper (now a step
  body); a `[data-entry-step]` crossfade.
- **No DDL.** Verified locally against the real prod DB (anonymous localhost = a true guest context): the welcome
  ("View event" public / "Continue" gated), the account step over the teaser + the "See all" re-open, the FIRM
  password step (no Close), the locked-backdrop name-only privacy, first-visit-fires-once. Live render confirmed
  on partyreel.com (the welcome modal renders for a signed-in non-owner first visit; no SSR/hydration crash). The
  signed-out OTP-completion inside the modal reuses the unchanged `<EnterEventPrompt>`/`<EmailSignIn>` flow (live
  since P1). Testing note: a stale service worker in the test browser profile was masking edits mid-session (the
  app ships NO service worker; cleared it) — a localhost-caching gotcha worth remembering.
- **Next:** P3 (host relabel to "Require guest accounts" + a live "what your guests will experience" preview).

## 2026-06-09 — Gated gallery P1: server-enforced gallery access + teaser (gate the VIEW)

Account-required (`allow_anonymous_uploads = false`) and password events previously gated only UPLOAD, so an
anonymous visitor could harvest the whole gallery friction-free while contributing had friction. P1 of the
gated-gallery initiative (ROADMAP "gate the gallery VIEW") flips it: account creation becomes the incentive to
SEE. A signed-out viewer of a gated event is capped SERVER-SIDE to a real-photo teaser, the rest withheld until
they qualify. Commit `4707dc4`.

- **Access model:** a pure `resolveGalleryAccess(event, {isOwner, isAuthed, isUnlocked}) -> none|teaser|full`
  (`src/lib/events/gallery-access.ts`) is the single source of truth, enforced IDENTICALLY by the RSC and the
  `/api/guests/gallery` poll via the server-only `loadGalleryForAccess`. The poll was previously UNAUTHENTICATED,
  so gating only the RSC would have been a trivial bypass (call the poll directly) — closing that was the crux.
- **Teaser** = the newest `TEASER_LIMIT` (9) approved PHOTOS + a total count for "+N more", in one
  `count:'exact'` round trip via a new self-guarded `getApprovedPhotoTeaser` admin read (photos-only; password
  requires the unlock cookie, open is public, else nothing). Withheld media NEVER leaves the server (not a CSS
  blur). **Privacy rule:** a password event stays `none` until unlocked — real teaser photos appear only after
  the password is proven. Owner + signed-in + demo bypass to `full`; `needsAccount` was removed (the teaser
  state subsumes it).
- **No DDL** (all capping is server-side TypeScript), so `get_advisors` is unchanged (the same 3 anon read RPCs).
- **Verified:** the full access matrix as Vitest unit tests; locally via curl against the real prod Supabase
  (open+anon → full/12; open+account-required anon → teaser/9 + total 12, photos only; password no-cookie →
  none/0; password+unlock → teaser/9), and the RSC payload contained exactly 9 media keys with the 3 withheld
  absent. Live on partyreel.com: the anonymous poll returned teaser/9; the signed-in test host saw the FULL
  gallery + upload panel (no teaser caption, no account gate), confirming signed-in users are NOT over-gated.
- **Next:** P2 (the unified `welcome -> password? -> account?` entry modal + the first-visit welcome, folding in
  `<PasswordGate>` + `<EnterEventPrompt>`) and P3 (host relabel to "Require guest accounts" + a live preview).

## 2026-06-09 — Likes: favorite media + a "Likes" dashboard tab (host-only counts)

Logged-in users can like any photo/video they can see; the likes collect in a new dashboard **Likes** tab
(mirroring Uploads). Anonymous guests get the like button + the SAME create-account flow as Save (a capture
lever). Commit `5152c58`.

- **DB (migration `20260609160000`):** a `media_likes` table (PK `media_id+user_id`; owner-RLS SELECT/DELETE;
  INSERT/UPDATE REVOKED so the only write path is the RPC). Three authenticated-only RPCs (lint 0029, never
  0028 — NO new anon RPC): `like_media` (access-checked idempotent insert — host OR guest OR open-album),
  `get_event_like_counts` (HOST-GATED counts), `get_my_likes` (the Likes-tab feed; re-applies the access
  predicate so a now-inaccessible like never leaks its presigned key). Unlike + heart-state are owner-RLS
  straight from the browser (mirrors save/unsave).
- **Host-only counts** (Will's call), enforced at the DATA layer: counts come ONLY from the host-gated RPC and
  show ONLY on the host management gallery as a subtle "♥ N" badge (a curation signal; also makes the data
  ready for the future sort/filter system). No count ever reaches a guest.
- **UI:** a `LikesProvider` (one per gallery — optimistic toggle + ONE shared anon→signup dialog with
  pending-intent replay) + a `LikeButton` (desktop tile hover-reveal + the lightbox control row; mobile gets it
  only in the lightbox). Wired into the guest event page, the Uploads tab, and the new Likes tab (where an
  unlike drops the tile). `GoogleIcon` extracted + shared with Save.
- **Verified:** a rolled-back contract matrix (every access arm — host/open/guest/denied — the host-gated count
  returning zero to a non-host, the leak guard); `get_advisors` (the 3 RPCs in 0029, none in 0028); the grant
  lock (`authenticated` has no INSERT). Live on partyreel.com (seeded media): host like via the lightbox → DB
  row + the Likes tab populates + the host gallery shows "♥ 1"; unlike → row deleted + tile drops. Anon→signup
  dialog + the desktop/mobile responsive split verified locally (Preview MCP).
- **Follow-up (`9256c8e`):** `MyLikesGallery` now owns its empty state, so unliking the LAST item on the Likes
  tab shows "No likes yet" INSTANTLY (unlike is a client-only delete with no server revalidation, so deciding
  empty in the component avoids a refetch + dedupes the copy). Live-verified.

---

## 2026-06-09 — Delete-own uploads from the Uploads tab (`remove_my_upload`)

The deferred follow-up to attribution P4 (the read-only Uploads hub): a per-item delete in the dashboard
"Uploads" tab (commit `b087e46`).

- **New SECURITY DEFINER `remove_my_upload(p_media_id)` RPC** (authenticated-only, lint 0029 — never 0028)
  re-checks ownership against the SAME host-arm/guest-arm predicates as `get_my_uploads` (`auth.uid()`-based,
  no client-supplied trust) then soft-removes, reusing the 30-day recovery machinery (the `set_media_purge_at`
  trigger derives `purge_at`; the cron auto-purges). Idempotent — a repeat remove never resets `removed_at`.
- **"Soft, but private to the host"** (the product call): a guest's self-deletion of an upload they made to
  someone else's event is marked `media.removed_by_uploader=true` and hidden from that host's restore path
  (excluded from `listRecentlyDeletedMedia` + refused by `restore_media`); the uploader's deletion wins. A
  host deleting their own event's upload leaves it `false` (host-restorable, like the event-gallery Remove).
  The new column is write-locked (NOT in the `authenticated (status, removed_at)` grant), so only the
  owner-context RPC sets it.
- **UI:** an opt-in Trash control in the shared lightbox (behind a confirm), wired only by the Uploads tab;
  `useOptimistic` removal + `revalidatePath`, toast on failure. The album / host / recovery lightboxes are
  unchanged (the prop is omitted there).

Verified: a rolled-back Supabase RPC contract matrix (both arms; cross-tenant → `not_found`; idempotency; bin
exclusion; `restore_media` privacy refusal; `purge_at = removed_at + 30d`) + advisors (`remove_my_upload` in
0029, anon EXECUTE denied, `has_column_privilege` on the marker = false). Live on partyreel.com (signed in as
the test host; seeded then torn down): deleted a host upload (→ `removed_by_uploader=false`, lands in that
event's Trash) AND a guest upload to another host's event (→ `removed_by_uploader=true`, excluded from that
host's bin + restore refused) through the real lightbox → confirm → action → optimistic-removal path; the
active-bytes meter freed immediately. All 321 unit tests green.

## 2026-06-09 — Attribution P4: dashboard consolidation (Events + Uploads + Trash)

The FINAL phase of the uploader-attribution + unified-identity initiative (commit `622b519`). Turns the
unified `guests.user_id` (P3) into a personal home, and CLOSES the initiative (P1 identity → P2 attribution →
P3 claim → P4 dashboard).

- **Merged "Your events" + "Saved" into one "Events" tab** — interleaved by recency (hosted by `created_at`,
  saved by `saved_at`, so a just-created OR just-saved event lands top), each card icon-differentiated
  (hosted calendar glyph vs saved bookmark) on the shared `EventCard`. Threaded `saved_at` through
  `SavedEventCardData` for the sort; preserved saved-event visibility masking + Unsave + the disabled/lock state.
- **New "Uploads" tab** — the user's own media across ALL events (host + guest) via a new authenticated
  SECURITY DEFINER `get_my_uploads(p_limit)` RPC (UNION ALL of host-arm + guest-arm, provably disjoint;
  `is_host_upload` + event/type/date make it filter-ready for a future cross-gallery filter; excludes
  soft-deleted events + non-approved/removed media; no masking — own uploads). Flat newest-first `MediaGrid`
  + lightbox (view + per-item download); a new `toMyUploadsItems` presigns per-item against each item's OWN
  event (ADR-0003); a gated event-context caption links each item to `/e/`. 200 cap + a truncation footer (no
  silent cap). Delete-own deferred (a future security-bearing RPC).
- **"Recently deleted" → "Trash"** across all user-facing copy (dashboard tab + storage-meter line, the
  per-event media section, 2 recovery emails, the bell nudge, the mutations error, + the email test). Internal
  identifiers + the `value="deleted"` tab key stay.
- Dashboard Tabs are now deep-linkable via `?tab=` (events|uploads|deleted) with instant client switching
  (`history.replaceState`, no server round-trip). Save-on-signup unchanged (verified it still lands cleanly).
- Design craft (emil-design-eng): press feedback + reduced-motion on the cards, an opacity load-fade on
  gallery photos (`complete`-checked so a cached image can't stick at opacity-0), the lightbox event caption
  fades via the house `--ease-emphasis`, crisp non-animated tab swaps.
- Live-verified on partyreel.com (staged, then torn down): the Events tab interleaved a hosted event (calendar
  glyph) + a just-saved event (bookmark glyph + unsave) by recency; the Uploads tab rendered the live RPC's
  item with the lightbox event caption "Partyreel Demo · July 9, 2026" + the Save button; the Trash tab + the
  `?tab=` deep-link survived a refresh. `get_my_uploads` advisor 0029 (never 0028); a rolled-back contract
  matrix (A/B isolation, status/removed/soft-deleted-event exclusions, `is_host_upload`, disjoint UNION ALL,
  limit/sort, grant auth/anon); typecheck/lint/test (321)/build green.

## 2026-06-09 — Attribution P3: claim anonymous uploads on sign-in

When an anonymous guest later authenticates, their prior anonymous uploads FROM THIS BROWSER silently become
theirs (the third phase of the uploader-attribution + identity initiative; commit `5123f7f`). An anonymous
upload is a `guests` row with `user_id IS NULL`; the browser still holds its `session_token` in `localStorage`
(`pr_session_{qr_token}`). On sign-in a client helper enumerates those tokens and the DB stamps them to the
new account.

- New authenticated SECURITY DEFINER `claim_anonymous_uploads(text[])` (migration `…609120000`) stamps
  `guests.user_id = auth.uid()` only where `session_token = ANY(...)` AND `user_id IS NULL` (the `IS NULL`
  guard makes it theft-proof + idempotent; ≤1000-token bound; never writes `email`). Browser-callable by
  design (mirrors `save_event`): identity is `auth.uid()` and the tokens are held capabilities, so there is no
  client-spoofable value for server-mediation to protect (cf. ADR-0016).
- `src/lib/guest/session-tokens.ts` (the shared `SESSION_PREFIX` + a pure, unit-tested
  `collectStoredSessionTokens`) + `src/lib/guest/claim-uploads.ts` (best-effort helper; module in-flight/done
  guards; no sessionStorage — the `IS NULL` filter makes a reload's re-run a silent 0-op). Mounted via
  `<ClaimUploadsOnAuth>` in the `(app)` layout (loud toast) + the guest `EventExperience` (silent), plus direct
  silent calls in the in-page sign-in handlers (`EnterEventPrompt`, the save dialog). The toast is loud only in
  the account context; silent on guest `/e/` paths so it never stacks with the "Saved" toast.
- Live-verified on partyreel.com: a real host sign-in + many reloads claimed 14 staged anonymous rows to the
  test host; an operator-owned row was NEVER touched (no theft); the success toast "We added your uploads to
  your account." renders on the dashboard (confirmed visually by Will — the auto-claim fires ~1-3s post-load
  once the data-heavy dashboard hydrates). Rolled-back contract matrix (claims the NULL row, leaves a foreign
  row, idempotent re-run, 1001-array → `program_limit_exceeded`, grant auth=true/anon=false, never writes
  email); typecheck/lint/test (321)/build green; advisor `0029` (never `0028`).

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
