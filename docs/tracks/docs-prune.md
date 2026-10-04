---
track: docs-prune
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "016f0c8d"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/systems/admin-observability.md
  - docs/systems/architecture.md
  - docs/systems/auth-accounts.md
  - docs/systems/dashboard.md
  - docs/systems/database-security.md
  - docs/systems/design-system.md
  - docs/systems/disposable-mode.md
  - docs/systems/durability-backups.md
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/marketing-content.md
  - docs/systems/notifications-analytics-growth.md
  - docs/systems/profiles-social.md
  - docs/systems/testing-verification.md
  - docs/systems/trust-safety-forensics.md
  - docs/systems/uploads-and-r2.md
  - docs/SYSTEMS.md
  - usher/kit/
  - src/app/(dev)/design/sandbox/take-home/
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/STATUS.md
---

# lp/docs-prune

**Goal.** Will's ask: the dead weight in the docs that impedes global problem-solving and future-facing creativity, found and cut in place: history, one-off fixes written as landmines, design written as law, restatement, and a ROADMAP 'Now' that only grows; the take-home board retired; unused kit scripts deleted; the 26 policy tests classified for Will.

## Where I am

- Handed off. Booted from `a62356f0`; synced with launch-prep `8fa910336` (pricing-wiring's merge) as `11d6a4877`,
  which is still launch-prep's tip at the handoff. The audit went out first as the WIP `e9b11f832`; the cuts landed after
  a verification pass. Everything this lane wrote outside the repo is in `/Users/gibby/local/ai/partyreel-wt/_scratch/docs-prune/`.

## The brief

**Will's ask (2026-10-04):** "Any other dead weight we've been accruing in docs that impede global problem-solving and future-facing creativity?" His standing philosophy, which this lane applies everywhere it owns: everything is unprotected and may be relitigated; nothing we do is perfect, so everything stays in search of better; history and past decisions must never weigh on agents as rules rather than working guidelines. CLAUDE.md's "Keeping the docs healthy" is the standard: docs hold what a strong model cannot find or infer (security practice, data handling, user safety, how the systems work, their gotchas); design and past decisions are guidance with their reason, never a law; every fact has one home, edited in place; what shipped lives in its merge commit; a one-off mistake is fixed and left in git, and only a recurring one earns a line. Every added line dilutes the rest.

**What the Orchestrator measured** (2026-10-04): `guest-flow.md` 1,409 lines with 153 ★ landmines; `design-system.md` 748 lines, 92 ★; `host-app.md` 542 lines, 80 ★; `marketing-content.md` 51 ★; ROADMAP's "Now" 327 lines, most carrying the lane that filed them; 26 `*-policy.test.ts` files; the `take-home` board still on the desk though `take-home-wiring` built its picks; kit scripts that nothing names.

**Two phases, in this order.**

**1. The audit** (`/Users/gibby/local/ai/partyreel-wt/_scratch/docs-prune/audit.md`, pushed as a WIP commit note in your `## Where I am` the moment it is whole): per owned doc, its lines and ★ before and the cuts you will make by kind, with three or four real examples each, so the Orchestrator can sanity-check your judgment before the bulk of it lands. The kinds:
- **History:** which round, red-team, crumbs lane or build found or fixed something; dates; "Will's pick"/"his word" provenance; quotes of Will except where the wording itself is the point (a coined term, a line of copy).
- **One-off fixes written as landmines:** a ★ that records a single bug's fix which code and a test already hold. ★ is for a line a strong model would likely get wrong AND that guards something real (security, data loss, cost, a trap that recurs); everything else loses the star or the line.
- **Design written as law:** a taste pick stated as "never"/"always"/a rule with no reason, where production or the Library already shows it. Rewrite it as guidance with its reason in a line, or cut it.
- **Restatement:** what the code, its WHY-comments or a test make plain, framework behaviour current docs give, a doc repeating another doc's fact (keep the one home, point to it).
- **The backlog:** each ROADMAP "Now" line read against the code: done or superseded, cut; vague or no longer true, cut; real, kept as one line in plain words with no provenance tag. "Now" should read as what is genuinely next; say how many lines remain and where the rest went (git keeps every cut line).

**2. The cuts, in place,** across what you own, by the audit. Cut boldly; when in doubt about a ★ that guards security, data or money, keep it and say why. Never move a fact to a new home just to keep it; never add a "pruned" note or a changelog. Then:
- **Retire the `take-home` board**: delete `src/app/(dev)/design/sandbox/take-home/` after checking no open ask remains on it (its ledger `docs/reviews/take-home.json` is the Orchestrator's to delete at your merge: name it in your Handoff); `registry.test.ts` and `queue.test.ts` green.
- **The kit:** delete a script in `usher/kit/` that nothing references (README, other scripts, docs, `package.json`) and that no runbook step names; trim the README's lines about retired machinery. Run `zsh usher/kit/negative.sh` after.
- **The 26 policy tests: classify, never delete.** In your Handoff, one line each: GUARD (a real trap: security, cost, a framework or compiler bug, data) or TASTE (a past style pick held as law), and for each TASTE one whether Will should keep it as his voice rule or let it go. Will decides.
- **The Orchestrator's single-writer docs, as ready files:** `docs/ROADMAP.md`, `docs/PROGRAM.md`, `docs/ASSETS.md` and `docs/tracks/README.md` have one writer by design (`track-manifests.test.ts`'s `NEVER_OWNED`), so write each pruned whole to `/Users/gibby/local/ai/partyreel-wt/_scratch/docs-prune/<name>.new.md` from `origin/launch-prep`'s current text (the ROADMAP's triage is the big one), and the Orchestrator copies them in at your merge after reading the diff. Never edit those four in your worktree.
- **What you do not own, proposed:** cuts you would make in `CLAUDE.md`, `docs/STATUS.md`, `docs/PRICING.md`, `docs/PRD.md`, `docs/systems/billing-caps.md` and `docs/systems/reel.md` (owned by the Orchestrator or running lanes), listed under your Handoff's proposals with their lines, for the Orchestrator to apply after those lanes merge.

Your Handoff's table: per doc, lines and ★ before and after. The gate: `pnpm test` (it parses the docs the lab reads) and `lab:smoke` for the board's retirement; typecheck and lint if anything under `src/` changed.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- Q1 (Will): `content-policy.test.ts` refuses `nothing but (their|a|your) phones`, so "Your guests need nothing but
  their phones." became "No app required for your guests." (`7922f94c0`). Under the marketing principle that line
  sells the feeling truthfully (the inbox is on the phone). Recommended: let that one assertion go; the test's
  "no app" with "no account" fence stays, since "no account" is false on a default event.
- Q2 (Will): marketing-content.md's ★ "A line that says an event 'stays up' carries the Free plan's one exception",
  held by `src/lib/constants/events.test.ts`, reaches intro, subhead and statement lines. Recommended: keep the ★ (a
  Free host told her album simply stays up, who leaves it untouched six months, loses it) and narrow `events.test.ts`
  to body lines and FAQ answers, so a hero may say "stays up" with the exception in the fine print beside it.
- Q3 (Will): billing-caps.md's ★ "An estimate always carries its camera" (with PRICING's "every surface says so"
  and `formatCapacity`'s `basis: true`) puts "on an iPhone" on celebratory lines too. Recommended: exact on the pricing
  table and its hovers, free on a feeling line such as the post-checkout receipt.

## System-doc edits (in place, owned facts only)

- The 17 owned system docs and `docs/SYSTEMS.md`, cut in place by the audit (`d2f2d406d`), pricing-wiring's four
  proposed edits folded in with the old "ingress" name retired (`2d29a817e`), and the index and dashboard.md's Guest-cards
  pointer (`660e727a9`). No other lane's doc was edited.

## Deferred (ROADMAP one-liners, bucket named)

- Now: Testing: `album-camera.test.tsx`'s "keeps no roll for the host" reads "Shot 1 taken." with `getByText` straight
  after the press (:410); red once under a loaded full gate (this lane's, on `660e727a9`), green 3 of 3 alone;
  `findByText` waits for it.
- Now: Design: the global reduced-motion guard's `!important` in `@layer base` cuts twelve declared fades to an instant
  (`globals.css` 651, 694, 718, 814, 845, 874, 939, 1428, 1433, 1439; `album-tile.css:83`; `live-reel.css:121`); move
  each beside the guard as `doorway.css` does, or stop promising the fade.
- Now: Code hygiene: comments pointing at a fact no doc holds or one that changed: `(guest)/e/[token]/card/route.tsx:15`
  (one link per event is guest-flow.md's), `api/cron/purge/route.ts`'s header ("the only scheduled app-side code"),
  `validation/auth.ts:15` (`OTP_LENGTH`), `event-feed/host-album.tsx`'s header (the doorbell's reason),
  `event/bulk-selection.ts` and its test (Approve all "the one caller"), `disposable/reveal.ts`'s header (a CHECK now
  refuses approve plus develop), `theme.css:84-85` (Card wears 2xl), `article-toc.tsx:32`, `stream-probe/page.tsx:31`,
  `validation/upload.ts:172-174` ("skips" a preview), `workers/backup/src/index.ts:20` and its README:22 (avatars),
  `seed-demo-event.mjs:587`, `configurator.tsx:49-52` and `pass-card.tsx:42`, `db-backup.yml:15` and `r2/client.ts:8`
  (CLAUDE.md does not hold their facts), `tiers.test.ts:141`.
- Now: Code hygiene: dead code: `DoorPool` and `.door-pool` (`door/lit.tsx`, `lit.css`), `capToLength` outside tests
  (`build-reel-props.ts`, and `encode.ts:48-51`'s note), Frame's push and `lab:set` path, `reference-ui.tsx`'s
  `RefHeader`, `RefSection` and `Spec` (`toc.tsx:193-198` names `RefSection`), `guest-name-step.tsx`'s `account` mode.
- Now: Admin: admin-observability.md's kill switches do not name `export_enabled`, which fails open
  (`lib/export/export-service.ts`); name it with its direction.
- Launch checkpoint, "The legal rewrite:": /privacy says HEIC, HEIF, AVIF and WebM are stored as sent (the stripper
  strips every accepted format), and /privacy and the Terms call the guest list a host's option (it is always on;
  `show_guest_list` was dropped); `legal-privacy.tsx:329` and `:441` cite doc facts no doc holds.

## Handoff (replaces the chat report)

- **Commits, all pushed:** the audit (WIP `e9b11f832`), the 17 docs (`d2f2d406d`), the sync with launch-prep
  `8fa910336` (`11d6a4877`; launch-prep has not moved since), the take-home retirement (`a5fdb55cf`), pricing-wiring's
  edits (`2d29a817e`), the kit (`9fa877651`), the index (`660e727a9`), then this manifest; the head is in the chat line.
- **Gates on `660e727a9`**, each on its own exit code (logs `_scratch/docs-prune/gate-*.log`): typecheck 0 (23 s);
  lint 0 (35 s); `pnpm test` 1 on its first run (the one load flake above, `album-camera.test.tsx`, camera code this
  lane never touched, then 3 of 3 green alone), 0 on its second (876 files, 10,577 tests); build 0 (48 s);
  `lab:smoke --base http://localhost:3134` 0 (15 checks, 0 failing); `/design/lab/take-home` answers 404 and the desk
  serves; `zsh usher/kit/negative.sh`: all refusals hold.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the 17 owned system docs, `docs/SYSTEMS.md`,
  `usher/kit/` (README, `merge-lane.sh`, the two deleted scripts), the deleted `sandbox/take-home/` and this file. No
  exception.
- **The audit:** `_scratch/docs-prune/audit.md`: the numbers, the stale facts corrected in passing, Will's marketing
  principle with what runs against it, the ROADMAP's triage, one section per doc (the cuts by kind with real examples,
  each ★ kept and what it guards, what was kept in doubt), the verification pass, the ready files.
- **The table** (lines and ★, before → after; the 17 docs 5,724 → 4,574 lines and 575 → 209 ★):

| Doc | Lines | ★ |
| --- | --- | --- |
| `guest-flow.md` | 1409 → 1010 | 154 → 45 |
| `design-system.md` | 748 → 598 | 92 → 8 |
| `host-app.md` | 542 → 397 | 80 → 17 |
| `marketing-content.md` | 496 → 345 | 51 → 11 |
| `admin-observability.md` | 334 → 265 | 29 → 18 |
| `database-security.md` | 321 → 314 | 29 → 25 |
| `uploads-and-r2.md` | 303 → 263 | 28 → 17 |
| `auth-accounts.md` | 260 → 250 | 23 → 18 |
| `disposable-mode.md` | 239 → 191 | 23 → 8 |
| `testing-verification.md` | 210 → 165 | 15 → 8 |
| `lifecycle-recovery.md` | 185 → 179 | 15 → 11 |
| `profiles-social.md` | 145 → 125 | 6 → 3 |
| `durability-backups.md` | 130 → 121 | 8 → 7 |
| `trust-safety-forensics.md` | 116 → 115 | 5 → 5 |
| `architecture.md` | 111 → 96 | 5 → 3 |
| `dashboard.md` | 88 → 68 | 10 → 4 |
| `notifications-analytics-growth.md` | 87 → 72 | 2 → 1 |
| `docs/SYSTEMS.md` | 27 → 27 | 1 → 1 |
| `usher/kit/README.md` | 219 → 213 | 0 → 0 |

- **No guard lost:** nine verifiers read each doc against its original; the errors and drifts they found are fixed in
  `d2f2d406d` (the list is audit.md's "The verification pass").
- **For the Orchestrator at the merge:** delete `docs/reviews/take-home.json` (the retired board's ledger); copy in the
  four ready files after reading each diff, all current against `8fa910336`: `ROADMAP.new.md` (514 → 352 lines;
  "Now" 332 → 181 bullets: of the 327 triaged lines 175 stay (one split in two) beside the five recorded since, 27
  moved to their buckets, 38 cut as speculative, 28 done, 26 superseded, 17 vague, 14 duplicate, 2 untrue, each with its evidence in
  `roadmap/R1.ledger.md` to `R6.ledger.md` and the totals in `ROADMAP.counts.md`), `PROGRAM.new.md` (149 → 133),
  `ASSETS.new.md` (51 lines, rows trimmed, none landed), `tracks-README.new.md` (114 → 106, its template now matching
  `cut-lane.py` byte for byte).
- **The 26 policy tests, for Will** (GUARD: a real trap; TASTE: a past style pick, with keep or let go):
  - `src/lib/content-policy.test.ts`: MIXED. GUARD: the social-proof, CSAM and NCMEC, breakers'-numbers, "no app"
    with "no account" and promise-neutralization fences and its coverage check. TASTE: the MDX em-dash walk and
    "business day" (keep, his voice); `nothing but … phones` (let go: against the marketing principle, Q1).
  - `src/lib/type-ladder-policy.test.ts`: MIXED. GUARD: `cn()` and tailwind-merge reach, the colour-namespace clash.
    TASTE: one weight beside `font-heading` (keep: shadcn's generator adds a weight to every title).
  - `src/lib/no-em-dash-policy.test.ts`: TASTE, keep as his voice rule.
  - `src/components/marketing/chrome/demo-door-policy.test.ts`: TASTE, keep (one door, so the demo's opening is one edit).
  - `src/lib/record-depth-policy.test.ts`: TASTE, keep as the docs rule (the 80 and 150 caps are picks).
  - `src/components/marketing/faint-copy-policy.test.tsx`: GUARD (contrast under WCAG AA; it never reads the words).
  - `src/app/(marketing)/marketing-h1-policy.test.ts`: GUARD (LCP: a hidden h1 shipped).
  - `src/app/(marketing)/marketing-css-policy.test.ts`: GUARD (marketing CSS outliving a client navigation).
  - `src/app/(marketing)/marketing-dynamic-params-policy.test.ts`: GUARD (Next 16's white shell for an unknown slug).
  - `src/components/marketing/chrome/home-link-policy.test.ts`: GUARD (about 73 KB a load from prefetching the home).
  - `src/app/css-source-policy.test.ts`: GUARD (Tailwind v4's `@reference` trap and production CSS weight).
  - `src/components/admin/admin-prefetch-policy.test.ts`: GUARD (two auth reads per prefetched portal route).
  - `src/app/(dev)/design/(shell)/_shell/prefetch-policy.test.ts`: GUARD (Next's keyless prefetch 404s in the lab).
  - `src/lib/adopt-typed-value-policy.test.ts`: GUARD (hydration overwrites typed input).
  - `src/lib/bare-login-policy.test.ts`: GUARD (a lapsed session loses the host's place).
  - `src/lib/client-form-policy.test.ts`: GUARD (a pre-hydration submit leaks fields into URLs and logs).
  - `src/lib/db/queries/request-auth-policy.test.ts`: GUARD (a `getUser()` round trip per query).
  - `src/lib/db/row-cap-policy.test.ts`: GUARD (PostgREST's silent 1,000-row cut).
  - `src/lib/gate-dev-cache-policy.test.ts`: GUARD (Turbopack's stale-cache reload loop broke the gate).
  - `src/lib/history-state-policy.test.ts`: GUARD (Next ignores a history call handed its own state; a shipped HIGH).
  - `src/lib/refresh-then-write-policy.test.ts`: GUARD (a URL write drops a pending refresh or reloads).
  - `src/lib/jsx-text-escape-policy.test.ts`: GUARD (an escape in JSX text ships literally).
  - `src/lib/jsx-text-space-policy.test.ts`: GUARD (SWC drops a leading space; "30days" shipped).
  - `src/lib/media-cost-policy.test.ts`: GUARD (guest media kept off Vercel's bill).
  - `src/lib/r2/stored-copies-policy.test.ts`: GUARD (no orphaned phone copy after a purge).
  - `src/lib/single-source-policy.test.ts`: GUARD (one home per constant; the grace days drive a removal).
  - Outside the 26: `src/lib/constants/events.test.ts` puts the Free exception into hero-level lines (Q2). Facts per
    test: `_scratch/docs-prune/policy-tests.md`.
- **Proposals for the docs this lane does not own**, each snippet unique in its file and checked against `8fa910336`
  (where a proposal gives a "current" and a "WIP" form, the WIP form now applies; the "(current only)" ones are moot):
  - `CLAUDE.md` (132 → about 130), `docs/STATUS.md` (78 → about 46), `docs/PRD.md` (117 → about 111):
    `proposals/claude-status-prd.md` (3, 17 and 15 proposals: the guest line's stale "when the host asks for one",
    STATUS's era and desk sections whose facts have homes, the PRD's four stale facts).
  - `docs/PRICING.md` (601 → about 520): `proposals/pricing.md` (history, 14 stale lines such as the prune's cap, the
    breakers and the spend watch's rule 3, and restatement; album-calm is built but the archetypes still price it as a
    lever, for the cost model's owner).
  - `docs/systems/billing-caps.md` (24 proposals, 246 → about 230 lines, 14 → 10 ★) and `docs/systems/reel.md` (43,
    266 → about 227 lines, 18 → 4 ★): `proposals/billing-reel.md`; one renames reel.md's "The names are Will's", which
    `videos-switch.test.tsx:4` quotes, so edit both together or keep the lead-in.
- **Assets requested from Will:** none.
- **Board ideas:** a copy pass in the marketing principle's direction: the event pages' close (Q1), the
  `/features/album` h1 (already a ROADMAP line), the "stays up" lines if Q2 moves the exception.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - The marketing principle's home (marketing-content.md's voice paragraph) and the cut clause calling "Nothing but
    their phones" the same promise as "no account".
  - The "stays up" ★ kept as user safety (Q2).
  - Three ★ added: "The open item is an ID, never a position" (design-system.md), "No receipt email"
    (marketing-content.md), "An account-deletion walk ends in Cancel deletion" (testing-verification.md).
  - `merge-lane.sh` now refuses a conflicted `registry.ts` instead of silently taking launch-prep's.
  - `wave6-check.mjs` (one past batch's checks) and `desk-check.mjs` (`desk-sections.mjs`'s older copy) deleted.
  - database-security.md: "a new DEFINER function is service-role only unless a signed-in browser must call it".
  - The ROADMAP keeps the lost one-time notice (its line beginning "Lifecycle: a one-time notice") as a task.
  - ASSETS: row 35 parked (its board retired), row 14 re-pointed to "Lab explorations no board asks yet", row 22
    rewritten (the album hero draws `STREAM_FRAMES`).
  - PROGRAM: "Roles" cut to CLAUDE.md's "Sessions & roles", and the board-authoring paragraph to the toolbox page.
- Look at first: audit.md's "The numbers" and "Will's marketing principle", then `ROADMAP.new.md`'s "Now" beside
  `ROADMAP.counts.md`, then the `merge-lane.sh` diff in `9fa877651` (the kit's one behaviour change).
