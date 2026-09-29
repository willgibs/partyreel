---
track: window-notes
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "57b17ace"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/review/ledger.ts
  - src/app/(dev)/design/review/ledger.test.ts
  - src/app/(dev)/design/review/status.ts
  - src/app/(dev)/design/(shell)/lab/page.tsx
  - src/app/(dev)/design/(shell)/lab/_desk/queue.ts
  - src/app/(dev)/design/(shell)/lab/_desk/queue.test.ts
  - scripts/lab-review.mjs
  - src/app/(dev)/design/(shell)/lab/_desk/lab-review.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/_window.json
  - docs/reviews/README.md
  - docs/PROGRAM.md
---

# lp/window-notes

**Goal.** A note of Will's binds only the board it was given on: stop the lab merging board-less window notes into every board, let window notes expire with their sitting, and leave program-wide notes to the Orchestrator's synthesis.

## The brief

**What went wrong** (Will, 2026-09-29). The desk shows three notes as "Your notes this window … what you said this round that binds every board", and the lab merges them into every board's notes: `review/status.ts` builds a board's `notes` from its own round plus `windowNotesFor(board)`, and `review/ledger.ts`'s `windowNotesFor` returns every `on: null` note of the window's latest round ("the lines a board must still be answering"); the desk's rows (`_desk/queue.ts`) render them. Those three were his notes on the brand-voice board (round 6 of `docs/reviews/_window.json`, 2026-09-17), transcribed with `on: null`; and since no sitting opened a newer window round, round 6 has stayed "latest" for twelve days, so they have bound every board since, pushing lanes toward a form he never asked of them. His principle, which the fix must hold: a note binds only what it was given on, and nothing he says is a standing rule; a note meant for the whole program is the Orchestrator's to fold into the doc it refines, synthesized, never a quote stacked on every board.

**Do:**
1. A board's notes are its own: stop merging board-less window notes into each board's status and its desk row.
2. The desk's window section shows only the latest sitting's board-less notes, framed as what he said at that sitting (never "binds every board"), and nothing once a newer sitting has come or the Orchestrator has folded them in. Pick the cleanest signal (the window round's date against the board rounds opened since, or a `folded` mark the record sets) and say which in your README relay.
3. Transcription (`scripts/lab-review.mjs`): a note with no board prints a line telling the Orchestrator to fold it into the program's docs or file it on its board; it never becomes a rule by default.
4. Tests on fixtures, never on the live ledger's contents (today's `ledger.test.ts` asserts the real window holds board-less notes); each reshaped test keeps its scar.
5. Relays in your Handoff, since `docs/reviews/` is the Orchestrator's: the `_window.json` data (the three voice notes to `on: "brand-voice"`, their true board; every other stale board-less note either folded or deleted, with where its lesson already lives), and the `docs/reviews/README.md` lines on the window, word for word.
6. A read-only audit: list every other place a note of Will's about one board became a program-wide rule (the lab kit's traps on `/design/lab/kit`, PROGRAM.md's round rules, the bible's ten, the glossary), each with where it came from, for the Orchestrator to judge; change none of them.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

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
