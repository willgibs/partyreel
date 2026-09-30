---
track: crumbs-29
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "429f0181"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/use-upload-queue.ts
  - src/lib/guest/join.ts
  - src/lib/db/migration-guards.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/systems/database-security.md
  - docs/systems/admin-observability.md
---

# lp/crumbs-29

**Goal.** Build 30's red-team finds and two ROADMAP lines: one account one row at an album on a shared phone, no door's opening admitting a blocked ask (Let back in true for her), the door settled after a sign-out in flight, a blocked phone's shut screen without the name step's flash, the door's predicate once, and a report's closed status paired with its time.

## The brief

Build 30's red-team finds and two ROADMAP lines on the same paths. Its ledger is `../partyreel-wt/_scratch/redteam-28/ledger.txt`; grep it for the ids named below. Fix each at its root, with a test that fails on today's code.

- **Two rows of hers in one second** (LOW; the path of crumbs-26's shared-phone fix).
  - The setup: a shared phone holds another guest's name-only ticket (Sam's or Dana's). partyr33l, signed in, adds her first photo at that album.
  - What happens: her photo lands on a new row of hers, but a second, empty row of hers is minted the same second (album A: photo row `f667deb1`, empty `9005fb75`; album B: `46f68183` and `dbf8843f`). The phone keeps the empty row's token (sha256 checked), so her later uploads there land on a second row.
  - The cause: the queue's silent join, after the other ticket goes down, races the page's own "a confirmed visitor with no ticket joins silently" effect once `sessionToken` falls to null, and `create_guest` always inserts.
  - Make one account one row at an album, whichever join wins (a single-flight join, `create_guest` answering an account's existing row, or both; your call, under Questions).
- **A declined newcomer walks straight in** (LOW).
  - The walk: at album L ("You let each person in"), partyr33l asks and willg97 declines her. Decline blocks her and keeps her ask row waiting, for Undo.
  - Switching L to Public: the `events_door_opened` trigger admits every waiting row, hers included (row `b3df7603`, admission `in`).
  - Back at "You let each person in": Let back in says "They'll be able to open … and add photos again", and its toast "Partyreel can join again.". Once let back in she opened L straight into the album, never let in by the host.
  - No door's opening may admit a blocked ask. Make Let back in's landing true for her: she lands back at the door.
- **The door after a sign-out still in flight** (NIT).
  - The walk: press Sign out, then open an album about 3 s later, while `/api/me/menu` still answers 200.
  - What happens: the door treats her as an account and skips the name step. Send then says "Couldn't start uploading / Enter a name." with no field to type one, until a reload. Nothing was written.
  - The door should settle on who she is before it skips the name, or the failure should offer the field.
- **A blocked phone's shut screen**: while the block is read, the name step shows for 2 to 4 s before "This album is private". Draw the shut screen first, without the flash.
- **The door's predicate, spelled twice** (ROADMAP, from `crumbs-23`): `event_door_admit_listed` and `event_door_waiting_listed` spell one predicate twice. Move it into one set-returning helper that both read, with a parity guard in `migration-guards.test.ts`.
- **The reports' closed status and its time** (ROADMAP, from `hide-strikes`): a CHECK that a report is open exactly when `resolved_at` is null. The instant hide's strikes lapse from `resolved_at`, and a close written without it would count as no strike.

**SQL.** Write your migration or migrations, each with its rolled-back proof at the file's foot, in the shape of `20260930120000_hide_strikes.sql`.
- Run each proof yourself with the Supabase MCP's `execute_sql`, inside `begin; … rollback;`. Otherwise your SQL is read-only, and you never call `apply_migration`: the Orchestrator applies by protocol.
- Every function you replace keeps its signature and grants, since partyreel.com (milestone 31) calls them.
- A new object grants `anon` and `authenticated` nothing by default (CLAUDE.md).

**Verify:**
- the gate;
- each item's test red on today's code;
- on localhost, drive what runs there.

The shared phone, the host's door and the signed-in paths cannot run on localhost, so name their steps for the next build's red-team in your Handoff. Two signed-in sessions at once are not drivable there; say which steps need a second device.

**Will's desk is up:** `locked-door` and `disposable-mode` describe the door and the guest page. Change no word or behaviour their asks describe, beyond these fixes. The gate's PREMISE lines name what your change reaches; say in your Handoff why their asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception.

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
