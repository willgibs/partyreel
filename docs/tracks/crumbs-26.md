---
track: crumbs-26
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "a79c7af7"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/session-tokens.ts
  - src/lib/guest/use-upload-queue.ts
  - src/components/ui/popup.tsx
  - src/lib/history-entry.ts
  - src/components/admin/report-queue.tsx
  - src/components/app/event-settings/door-page.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/auth-accounts.md
  - docs/systems/design-system.md
---

# lp/crumbs-26

**Goal.** Build 27's red-team finds: a signed-in account's uploads never filed under another guest's ticket on a shared phone (MEDIUM, first), a double tap's second press never landing in an arriving sheet, the title kept after a Back that follows a refresh, a reopened report on a deleted photo never called the whole album, and the door page able to return to the saved door.

## The brief

Build 27's red-team (`../partyreel-wt/_scratch/redteam-27/ledger.txt`) found these; each is fixed at its root with a test that fails on today's code:

1. **MEDIUM, first: a signed-in account's uploads are filed under another guest's ticket.** On one browser, visitor "Sam Partyreel" joined album ER and added nothing. partyr33l then signed in and added a photo at ER, and at EB, where she had just answered Not mine for Dana, added another. Media `30b98e02` was filed under Sam's row and `06fb3be8` under Dana's. Her own photo read "Sam Partyreel · Unverified" with Report and no Delete, and she was then asked "1 photo was added on this phone as Sam Partyreel. Is it yours?" about her own photo.
   - Since `shared-claims`, sign-in rightly leaves other people's tickets on the phone, but the upload path still uses any name-only ticket the device holds for that album.
   - A signed-in account uploads only through a ticket that is its own: one it holds, or one it just claimed. Otherwise it mints its own at the door, and another person's ticket is never used for it.
   - Read `whose_ticket` (`20260929234000_shared_phone_claims.sql`), `session-tokens.ts`, `device-tickets` and the upload queue.
   - A SQL change is a migration: prove it rolled back on the live schema, hold it in `migration-guards.test.ts`, and never apply it. The Orchestrator applies by protocol, and new objects in `public` grant `anon` and `authenticated` nothing by default.
2. **LOW: a double tap's second press lands in the arriving Share sheet.** At 375, on the hub's code card, a double tap on "Everything": the second click is swallowed, but its mousedown focuses the sheet's "Custom link" input beside Save link, which on a phone raises the keyboard (2 of 3 runs). `ui/popup.tsx` guards `onClickCapture` alone, so guard the press itself (pointerdown and mousedown) while the layer arrives.
3. **LOW: Back after a refresh drops the page's `<title>`.** Open the demo reel (or the hub's Settings sheet), run `router.refresh()` (or flip the reel switch), then close: the `<title>` element is removed, `document.title` is empty, and the tab shows the raw URL until a reload. The reel goes Back after a refresh since `crumbs-19`, the hub since `crumbs-18` (`lib/history-entry.ts`).
4. **LOW: a reopened report on a deleted photo says "The whole album".** Dismiss a report on a photo, delete the photo permanently, Undo the dismissal: the sweep tile's fact line reads "The whole album · …" beside its own "The photo was deleted." art, where the peek rightly says "A photo". `report-queue.tsx` falls back to "The whole album" whenever the uploader is null.
5. **NIT: the door page cannot return to the saved door.** After picking "A password" unsaved, clicking the saved "You let each person in" does not re-select it, so the page shows a door that is not saved until a reload.

**Verify:**
- the gate;
- each item's test red on today's code and green on yours;
- items 2 to 5 driven where localhost reaches them.

The shared phone, the hub and the portal need a signed-in session localhost cannot give, so name their steps for the next build's red-team in your Handoff, bug 1 first, in the red-team's own steps.

**Paths:** your owns are a start (the ticket's other readers, a migration's file): add each to `owns` in your manifest before editing, or name a one-line exception. Never a path `crumbs-25` owns (its manifest).

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
