---
track: docs-rules
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "6fd4bbbd"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/design/README.md
  - docs/specs/
  - src/app/(dev)/design/_data/
  - src/app/(dev)/design/(shell)/library/
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/touchpoints.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/rules/
  - docs/systems/design-system.md
  - docs/PROGRAM.md
  - CLAUDE.md
---

# lp/docs-rules

**Goal.** Distill Will's rulings log into the rules it became, then retire it and its Library page; keep the Library's specs and rulings registry to current rules only.

## The brief

THE RESHAPE (Will, 2026-09-22). His words: "Our goal isn't to preserve a historical log of all of our decisions - a huge history is simply dead weight... It's important to use your intuition and decide what should carry from our history/decisions (gotchas, rules, knowledge, tips, patterns, etc) but not build a textbook of 'The History of Building Partyreel'. Our Library and Lab should work the same way - the Library establishes all of our working rules (global and per component) for new agents to pull from, without giving them a backlog of history to distill anything. Doesn't matter what we've done before - agent tasks follow current rules and seek best solution at every point."

The rule for every line you keep: it states a current rule, fact, gotcha or task in the present tense, with at most a one-line why. Dates, "was", provenance ("from X (2026-09-19)"), narratives of what shipped when and stories of retired boards go: git holds them. Nothing true and still binding is lost: when unsure whether a fact still holds, check the code, and keep it if it does. The CHANGELOG is already retired (the merge commits carry what shipped); the rulings log `docs/design/rulings.md` retires in the `docs-rules` lane. Four lanes run at once on disjoint files: `docs-rules`, `systems-trim`, `roadmap-lean`, `pointer-sweep`.

YOUR PART: the rulings log and the Library's rules.

1. Read `docs/design/rulings.md` whole (Will's dated rulings, each with a **Became:** line). For every section: if what it became already lives as a current rule in its home (the bible under `src/app/(dev)/design/rules/`, a policy test, `docs/design/guidance.md`, `docs/design/README.md`, a `docs/systems/` doc, `docs/PROGRAM.md`, CLAUDE.md, a component's contract), drop the section; if a still-live directive has no home, write it into its home as a current rule (present tense, one-line why; his exact words only where the words are the rule itself, such as a copy line he wrote); drop dead material (superseded rulings, retired boards' verdicts, process events, Moltbook and usher matters, dates). The bible changes only by his ruling: never add or reword a bible rule; a bible-level directive missing from the bible goes in your Handoff as a question. You own `docs/design/guidance.md` and `docs/design/README.md`; a fact whose home is a `docs/systems/` doc (the `systems-trim` lane owns those), `docs/PROGRAM.md` or CLAUDE.md (the Orchestrator's) goes in your Handoff under "For other homes", verbatim-ready, naming the home.
2. Delete `docs/design/rulings.md`. Remove the Library's rulings page (`src/app/(dev)/design/(shell)/library/rulings/`), its nav entry and search-index entries (`_data/nav.ts`), `listRulings` (`_data/docs.ts`) and every test assertion about them (`_data/docs.test.ts`, `links.test.ts`, `catalog.test.ts`, and anything the gate names). No Library link points at a removed page.
3. `docs/specs/*.md`: each spec is either a current rule the Library carries (keep it, present tense, no history) or a dead proposal (delete it and its references in your owned files).
4. The rulings registry `RULINGS` in `src/app/(dev)/design/touchpoints.ts`: delete every row whose board or item left without a winner in the codebase (retired unruled, superseded, `reel-studio`), keeping every row a test requires (every standing board's row; every ruled component's row with `lives`); rewrite each remaining row's `ruled` and `why` as the current rule and its rationale in the present tense (a standing board: `open` and what it asks; a ruled item: what binds and why), inside `touchpoints.test.ts`'s limits. Keep ids, `lives`, `board` fields and `DESK_ORDER` exactly as they are.
5. Every mention of `rulings.md` or `CHANGELOG` in your owned files states the rule instead.

HANDOFF EXTRAS: a carried/dropped table (one line per rulings.md section: its home, or why dropped); "For other homes" (PROGRAM.md principles, CLAUDE.md lines, docs/systems facts, verbatim-ready, each naming its home); memory candidates (Will's durable preferences about how he works, one line each); bible questions.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The full gate on the synced tree, each step on its own exit code (`pnpm design:rules`, the specimen collector, typecheck, lint, test, build, `pnpm lab:smoke --base http://localhost:3131`); the Library at 1440 with no link to a removed page.

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
