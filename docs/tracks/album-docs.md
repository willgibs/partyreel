---
track: album-docs
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "0ac99010"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/systems/guest-flow.md
  - docs/systems/reel.md
  - docs/systems/testing-verification.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/album-docs

**Goal.** Write what `album-guest-wiring` made true into the three system docs it could not own, each fact refined in place in its one home, so the guest album, the viewer and the reel read as they now work.

## The brief

`album-guest-wiring` merged at `a474d130`: every guest album is the paged, windowed rows. Its Handoff wrote the lines the Orchestrator owes the docs; read them in full with `git show c1ace8fe:docs/tracks/album-guest-wiring.md` (the sections "`guest-flow.md`, for the Orchestrator to write in place", "`reel.md`, for the Orchestrator" and "`testing-verification.md`, one line for the Orchestrator").

Write each into its doc as CLAUDE.md's "Keeping the docs healthy" asks: find the line or passage it refines (the Handoff names each by its opening words) and rewrite it in place, synthesized in the doc's own voice; delete what is no longer true (the whole-album poll, `/api/guests/gallery`, `gallery-fingerprint.ts`, the masonry gallery, `merge-gallery-items.ts`, the quadratic take); never stack a new note beside an old one, and add no history. Check every fact you write against the code at your tip (the named files and exports exist and say what the line claims); a line the code contradicts goes in your Handoff instead of the doc.

The host's half (`album-host-wiring`, merged at `7130d26d`) is already written in `host-app.md`; keep the guest docs consistent with it where they meet (the store in `src/lib/album/`, the sync routes).

Verify with the doc tests (`src/lib/no-em-dash-policy.test.ts`, `record-depth-policy.test.ts`, `single-source-policy.test.ts`, `content-policy.test.ts`, `src/app/(dev)/design/_data/docs.test.ts`) and `pnpm test`. In your Handoff, list each passage you changed by its new opening words.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The doc tests named in the brief and `pnpm test`, each on its own exit code; every changed passage's facts checked against the code at the tip.

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
