---
track: crumbs-27
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "0f267164"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/use-upload-queue.ts
  - src/lib/events/event-blocks.ts
  - src/components/app/host-media-grid.tsx
  - src/lib/guest/reconcile-album-items.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
---

# lp/crumbs-27

**Goal.** Four follow-ups from the latest lanes: a signed-in account's own reads on a shared phone as the upload now reads them, a silent join that lands waiting handed to the door's ask, Let back in's words true at Only me, and the arrival diff written once.

## The brief

Four items the latest lanes deferred (ROADMAP's lines), each fixed at its root with a test that fails on today's code:

- **A signed-in account's own reads on a shared phone.** Her Yours (the album's filter and the export's `ownMediaIds`), the door's standing and A photo first still read the name-only ticket the phone holds for the album, until her own replaces it at her first upload there. Read them as the upload now does since `crumbs-26`: her own row, or one the claim takes.
- **A silent join that lands waiting.** On a gated album, after another guest's ticket went down, the queue's silent join lands waiting, sends the file on, and fails it with "This event is private.". Hand her to the door's ask instead (`acquireTicket`; this was pre-existing for an account's own ticket too, and is reachable more now).
- **Let back in at Only me.** On someone who was in, while the album is Only me, Let back in still promises "They'll be able to open X and add photos again", which is true only once the host opens it. Say what happens at Only me, in the product's voice, beside `crumbs-24`'s four landings (`BlockedPerson.lands`).
- **The arrival diff, written once.** "An id in this render that was not in the last" is written twice: `newItemIds` in `host-media-grid.tsx` and `newArrivalIds` in `lib/guest/reconcile-album-items.ts`, which also answers nothing for an empty first snapshot. Put one pure function in `lib/shared/arrival.ts` beside `arrivalMarks`, and have both read it.

**Verify:**
- the gate;
- each item's test red on today's code and green on yours.

The shared phone and the signed-in hub cannot run on localhost, so name their steps for the next build's red-team in your Handoff.

**Paths:** your owns are a start (the Yours readers, the door's standing, `lib/shared/arrival.ts`): add each to `owns` in your manifest before editing, or name a one-line exception.

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
