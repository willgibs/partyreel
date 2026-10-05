---
track: crumbs-74
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "f160671c"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/queries/guest-events-admin.ts
  - src/components/guest/event-experience-head.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(guest)/e/[token]/page.tsx
---

# lp/crumbs-74

**Goal.** The album cover's count names its kinds from the first byte ("12 photos", "3 videos", "12 photos · 3 videos") instead of both nouns until the live source arrives.

## The brief

**The fix** (ROADMAP): the cover's count glyph says both nouns until the album's live source names its kinds, because the first paint's `getGalleryStats` (`src/lib/db/queries/guest-events-admin.ts`) knows only `approvedTotal`.
- Carry the photo and video counts there, from the same read with no extra query if the row already holds them; one aggregate if not, never a per-row scan.
- Name them from the first byte, so the first paint and the live source agree: no flash of the both-nouns wording.
- Pin it with a test that fails on the old code.

Watch the cost: the guest page is the dearest call in the compute model (`../partyreel-wt/_scratch/compute-model/report.md`), so the first paint must not get heavier. Measure the read before and after and say both.

Wiring rigor: the whole gate. Nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3131 is yours. Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is at its end; a successor may resume you).

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
