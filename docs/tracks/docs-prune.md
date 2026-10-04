---
track: docs-prune
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
