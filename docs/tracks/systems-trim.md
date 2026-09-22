---
track: systems-trim
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "6fd4bbbd"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/systems/
  - docs/SYSTEMS.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/
  - src/app/(dev)/design/_data/docs.ts
  - CLAUDE.md
---

# lp/systems-trim

**Goal.** Trim the system docs to current truth: present-tense facts, gotchas and invariants, with no dated narratives, provenance or retired-feature stories.

## The brief

THE RESHAPE (Will, 2026-09-22). His words: "Our goal isn't to preserve a historical log of all of our decisions - a huge history is simply dead weight... It's important to use your intuition and decide what should carry from our history/decisions (gotchas, rules, knowledge, tips, patterns, etc) but not build a textbook of 'The History of Building Partyreel'. Our Library and Lab should work the same way - the Library establishes all of our working rules (global and per component) for new agents to pull from, without giving them a backlog of history to distill anything. Doesn't matter what we've done before - agent tasks follow current rules and seek best solution at every point."

The rule for every line you keep: it states a current rule, fact, gotcha or task in the present tense, with at most a one-line why. Dates, "was", provenance ("from X (2026-09-19)"), narratives of what shipped when and stories of retired boards go: git holds them. Nothing true and still binding is lost: when unsure whether a fact still holds, check the code, and keep it if it does. The CHANGELOG is already retired (the merge commits carry what shipped); the rulings log `docs/design/rulings.md` retires in the `docs-rules` lane. Four lanes run at once on disjoint files: `docs-rules`, `systems-trim`, `roadmap-lean`, `pointer-sweep`.

YOUR PART: the system docs (`docs/systems/*.md`, `docs/SYSTEMS.md`), about 578 KB, trimmed to current truth.

1. In every doc: rewrite dated narratives as present-tense facts (drop the date, keep the fact: "(found live 2026-07-21)", "(Will, 2026-09-18)", "ruled 2026-06-20"); delete narratives of what shipped when, retired features, superseded decisions and provenance chains (check the code when unsure whether a fact still holds); keep every ★ gotcha, invariant and don't-revert with its one-line why; keep facts true to the code as it is today (the reel sections of `host-app.md` and `guest-flow.md` describe the shipped reel that the reel round replaces at its wiring: they stay, trimmed and true to today's code).
2. Never rename, remove or reorder a heading: anchors are linked from code comments, the Library and other docs (`src/app/(dev)/design/_data/docs.ts` reads sections of `design-system.md` and `marketing-content.md` by id, and the Library reads ★ lines). Body text only.
3. Every mention of `rulings.md` or `CHANGELOG` states the rule instead.
4. Each doc ends noticeably shorter, never less true. `docs/SYSTEMS.md` stays the index: one row per system, present tense (its highlight-reel section becomes a plain row).

HANDOFF EXTRAS: per doc, bytes before and after; every fact you found stale against the code, one line each (what it said, what is true).

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** `pnpm design:rules`, `pnpm test` and `pnpm lint`, each on its own exit code (docs-only: say so and skip the build); the Library's doctrine pages at 1440 on your port :3132 render every section they link.

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
