---
track: crumbs-79
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "d7405e3f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/faq-data
  - src/components/marketing/sections/features/album/album-copy
  - src/components/marketing/sections/features/album/album-faq
  - src/components/marketing/sections/features/album/how-much-fits
  - src/components/marketing/sections/pricing/comparison-table
  - src/lib/r2/stored-copies-policy.test.ts
  - src/lib/guest/use-gallery-doorbell.sql.test.ts
  - src/lib/db/queries/profile.private-count.test.ts
  - src/lib/jobs/spend-watch-migration.test.ts
  - src/lib/forensics/migration-guards.test.ts
  - src/lib/disposable/migration-guards.test.ts
  - src/app/(dev)/design/(shell)/lab/tools/
  - docs/systems/guest-flow.md
  - docs/systems/disposable-mode.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/db/testing/migrations.ts
  - src/lib/events/dates.ts
  - src/lib/constants/marketing-voice.ts
---

# lp/crumbs-79

**Goal.** Four small ROADMAP crumbs: five marketing lines that say events have "no end date" say an end date only says when; the tests that read the migrations by hand read each function's winning body through testing/migrations.ts; the stored-copies policy stops reading comments as code; the boom tool's callout names its global-boundary probe; the camera's paragraphs move from guest-flow.md to disposable-mode.md.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU is at its limit). Port 3133 is yours; 3000 is Will's desk, never touched; 3130 is the Orchestrator's gate.

**The fixes:**
1. **Words:** five lines still say events have "no end date" (`faq-data.ts:47`, claim-fenced, its comment at :43; `features/album/album-copy.ts:156`; `features/album/album-faq.ts:48`; `features/album/how-much-fits.tsx:132`; `pricing/comparison-table.tsx:148`) where Settings offers "Add an end date": an end date only says when and never ends anything (an event never expires; deletion is the only exit). The voice is `marketing-voice.ts`'s; change only the fact, and keep any claim fence's test true.
2. **One migration reader:** `use-gallery-doorbell.sql.test.ts` and `profile.private-count.test.ts`'s `latestBody`, `spend-watch-migration.test.ts`'s `bodyOf`, and the forensics and disposable `migration-guards.test.ts` keep readers of their own: read each function's winning body through `src/lib/db/testing/migrations.ts`'s `liveFunction`, so a dropped function never reads as defined. Every assertion they make still runs.
3. **A scanner that reads comments as code:** `r2/stored-copies-policy.test.ts` loses its parse context after a template literal with a `${}` in it, so a comment naming `preview_key` reads as a reader of it; give it a real parse (the TypeScript compiler API the repo already has) or walk the AST.
4. **The boom tool:** its callout on `/design/lab/tools` and its nav entry name the bare probe only; say `?boundary=global` reaches `global-error.tsx`, as the probe's own page does.
5. **Docs:** the camera's asking (it asks a closed album again at 10 s, 20, 40, then each minute) and the door's camera paragraphs in `guest-flow.md` belong in `disposable-mode.md` (the camera's one home): move them, one home each.

Wiring rigor: the whole gate, and `lab:smoke` (the tools page).

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
