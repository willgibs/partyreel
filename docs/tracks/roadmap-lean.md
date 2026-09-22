---
track: roadmap-lean
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "6fd4bbbd"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/ROADMAP.md
  - docs/ASSETS.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/
  - src/app/
  - CLAUDE.md
---

# lp/roadmap-lean

**Goal.** Rewrite the ROADMAP and the asset requests as current, open work only: one line per task, no provenance, nothing done or moot.

## The brief

THE RESHAPE (Will, 2026-09-22). His words: "Our goal isn't to preserve a historical log of all of our decisions - a huge history is simply dead weight... It's important to use your intuition and decide what should carry from our history/decisions (gotchas, rules, knowledge, tips, patterns, etc) but not build a textbook of 'The History of Building Partyreel'. Our Library and Lab should work the same way - the Library establishes all of our working rules (global and per component) for new agents to pull from, without giving them a backlog of history to distill anything. Doesn't matter what we've done before - agent tasks follow current rules and seek best solution at every point."

The rule for every line you keep: it states a current rule, fact, gotcha or task in the present tense, with at most a one-line why. Dates, "was", provenance ("from X (2026-09-19)"), narratives of what shipped when and stories of retired boards go: git holds them. Nothing true and still binding is lost: when unsure whether a fact still holds, check the code, and keep it if it does. The CHANGELOG is already retired (the merge commits carry what shipped); the rulings log `docs/design/rulings.md` retires in the `docs-rules` lane. Four lanes run at once on disjoint files: `docs-rules`, `systems-trim`, `roadmap-lean`, `pointer-sweep`.

YOUR PART: `docs/ROADMAP.md` (about 98 KB) and `docs/ASSETS.md`, current open work only.

1. ROADMAP: one line per task, present tense, under the existing bucket headings (keep `## Now` exactly: `usher/kit/record.py` writes under it; keep any heading a test reads, and run `pnpm test`); no provenance ("From `x` (2026-09-19, the lab):"), no "SHIPPED" narratives, no history; merge duplicates; drop tasks already done (check the code) and tasks the identity and reel rounds made moot. The reel round replaces the host-made, stored reel: the Studio, the mp4 export with its upload and download routes, publish and the reel-published send, reel curation, "multiple named reels", the reveal polish and "no slideshow mode" are gone or become that round's own wiring; the identity round shipped the optional email, the claim and profiles that publish nothing until chosen. Harvest still-open seams from the old queue's maps (`git show 6fd4bbbd:docs/tracks/orchestrator.md`, the sections "The app round's map" and "The overnight round's maps"): a seam still open in today's code becomes one ROADMAP line.
2. A gotcha or current fact found in the ROADMAP is not a task: list it in your Handoff under "For other homes" (the systems doc it belongs in), verbatim-ready.
3. ASSETS: the requests Will still has open (requested or parked), one row each; delivered and withdrawn rows go; no history in the columns.

HANDOFF EXTRAS: ROADMAP lines and bytes before and after; every task dropped as done or moot, one line each (what and why).

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** `pnpm test` and `pnpm lint`, each on its own exit code (docs-only: say so and skip the build).

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Calls his to overrule, one line each
- Look at first: ...
