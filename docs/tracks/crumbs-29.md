---
track: crumbs-29
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "429f0181"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/use-upload-queue.ts
  - src/lib/guest/use-upload-queue.test.tsx
  - src/lib/guest/join.ts
  - src/lib/guest/join.test.ts
  - src/lib/guest/door-hold.ts
  - src/lib/guest/door-hold.test.ts
  - src/components/guest/event-experience.tsx
  - src/components/guest/door-settles.test.tsx
  - src/lib/db/migration-guards.test.ts
  - src/lib/db/row-cap-sql.test.ts
  - supabase/migrations/20260930130000_the_door_admits_no_block.sql
  - supabase/migrations/20260930140000_one_account_one_ticket.sql
  - supabase/migrations/20260930150000_report_resolved_when_closed.sql
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

- **One account, one row at an album: both halves (built).** The server answers it: `create_guest` and `ask_to_join`
  hand a confirmed account the ticket it already holds at the album (its newest proved row there at the admission the
  door gives it, no block holding it), under an advisory lock on the album and the account, so whichever join wins
  they answer one row; and the client asks a nameless join once at a time (`joinEvent`), so the page's join and the
  queue's share one post and one cookie. **Recommended: both.** The one visible consequence, **his to overrule**: her
  second device (a laptop after her phone) now holds the SAME ticket as her first, where each device used to mint a
  row of its own; nothing reads rows per device (the guest list counts a confirmed guest once per person, the owner
  rule keys on the account), and a typed name still mints a row a join. Overrule → the client half alone (the race is
  closed; two devices keep two rows), dropping `20260930140000`.
- **Let back in at a Public door lets the declined newcomer straight in (built).** A Public trip now leaves her ask
  waiting behind her block; lifted at Public, the ask is let in, as the door's opening would have let it in had the
  block never held it (a waiting ticket at a Public album cannot add: its uploads read the album as private). The
  words already promise it there ("They'll be able to open … and add photos again"). **Recommended: yes.** Overrule →
  she stays waiting at Public until the host lets her in from At the door, and `blockedLanding` must say "door" there.
- **A first Add refused for want of a confirmed email keeps dropping her picks.** `name_required` (the page rendered
  across a sign-out in flight on a names-only album) now keeps her picks for the door; `verification_required` (the
  same on an email-first album) still drops them and refreshes onto the email step at once, as the mid-run flip's
  docs describe. **Recommended: keep** (a code round trip stands between her and the album, and picking again after
  it costs one tap). Overrule → hold them for the door the same way (one branch in `joinSilently`).

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: The upload act, SOMEBODY ELSE'S TICKET (the page is told before a ticket goes down and
  holds its door until its refresh lands; a first Add's `name_required` and the page's own join go to the door);
  Joining + identity, the dedupe line (one account, one ticket at an album; a typed name, one ticket a join; still no
  unique `(event_id, user_id)`, and why).
- `docs/systems/host-app.md`: Who can get in (Public lets in every ask no block holds, read from `event_door_asks`);
  At the door (Let back in's landing at a Public door); Invited (the list's twins read one set).
- `docs/systems/database-security.md`: the ask's share lock (a confirmed account's own joins at one album take the
  account's lock after it); the owner-only helpers (`event_door_asks`, `event_account_ticket`); the invite list's
  DEFINER gotcha (both twins read one set); the row cap's `INTERNAL` exception.
- `docs/systems/admin-observability.md`: the instant hide (the CHECK that pairs a report's close with its time).

## Deferred (ROADMAP one-liners, bucket named)

- Guests (bug): the host's own Add on her album's guest page goes through the guest queue, and `create_guest` never
  counts the host as in, so at a gated door her upload never goes (proved rolled back 2026-09-30 on `55bcdbe0`: approve
  mints her a waiting ticket her picks wait on for good, invite refuses "Ask the host to let you in.", closed "This
  event is private."); count the host in (`create_guest`'s `v_in`), or send the owner's Add through the host routes
  its own note promises (from `crumbs-29`).
- Host (words): Let back in's landing for a declined newcomer at Only me reads "back at the door, and you can let them
  in from there", but Only me shuts everyone until the host opens it, so the host's Let in there leaves her at a closed
  album; `blockedLanding` could say so there (from `crumbs-29`).

## Handoff (replaces the chat report)

- **Work `75600355`, pushed.** No sync: launch-prep moved by records only (`cc79d54e`, build 33's empty trigger, and
  `2637f92f`, the pickup), none of this lane's reads.
- **Gates on `75600355`**, each on its own exit code: typecheck 0, lint 0, test 0 (666 files, 7,939 tests), build 0,
  `pnpm lab:smoke --base http://localhost:3131` 0 (133 checks, 0 failing; its `/design/lab/tools/boom` 500 is that
  tool's own intentional crash). No board, so no `lab:demo`. Logs: `../partyreel-wt/_scratch/crumbs-29/`
  (`typecheck-2.log`, `lint-2.log`, `test-2.log`, `build-2.log`, `smoke-2.log`).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + the four system docs
  above (Record subtractively). Nothing owned is untouched.
- **PREMISE** (smoke): `disposable-mode` (guest-flow.md, event-experience.tsx), `event-ready` (host-app.md) and
  `locked-door` (guest-flow.md). Their asks still hold: no word, step or design moved. The door's steps, its words and
  its shut door are as they were; what changed is WHEN the door re-derives after the phone's ticket goes (after the
  server answers, never from the phone alone), who a Public trip lets in (never a blocked ask), and how many rows one
  account holds at an album. The camera, the waiting room of the camera, the wall, the peek, the checklist and the
  code's door marks read none of it.
- **The items** (each test red on `origin/launch-prep`, proved by swapping the old file back or running the proof on
  today's bodies):
  - Two rows of hers in one second → `supabase/migrations/20260930140000_one_account_one_ticket.sql`
    (`event_account_ticket`; both mints answer it before they insert; red: "FAIL: her two joins minted two tickets";
    green in its foot, six steps) and, in two real sessions on a throwaway postgres@17 (`_scratch/crumbs-29/pg/`,
    `race.sh`, `race-result.txt`): today's bodies answered the racing join at once with a second ticket (her 3 rows),
    this file's waited 2.0 s for the first's commit and answered its ticket (1 row), at a Public album and at letting
    each person in. Client: `joinEvent` shares a nameless join in flight (`join.test.ts` "★ two nameless joins at once
    share one post", red).
  - A declined newcomer walks straight in → `supabase/migrations/20260930130000_the_door_admits_no_block.sql`
    (`events_door_opened` reads `event_door_asks`; Let back in at Public lets her in; red on today's bodies: "FAIL: a
    Public trip let the declined ask in"; green: at approve Let back in admits nobody and she reads waiting, At the
    door, her ticket private; at Public it lets her in and her ticket adds). Its landing words need no change:
    `blockedLanding` reads her waiting ask as "door" ("They'll be back at the door…", toast "… is back at the door.").
  - The door after a sign-out in flight → `joinSilently` hands a `name_required` to the door with her picks queued
    (`use-upload-queue.test.tsx` "★ a first Add whose join the server refuses for want of a name…", red), and the
    page's own join refused for want of a confirmed account re-reads who is here (`door-settles.test.tsx` "★ the
    page's own join refused…", red).
  - A blocked phone's shut screen → the queue tells the page before the ticket and its name go down
    (`use-upload-queue.test.tsx` "★ a ticket only the door can replace…", red) and the page holds its door on the name
    it had until its refresh lands (`src/lib/guest/door-hold.ts`, `event-experience.tsx`'s `settleViewer`;
    `door-settles.test.tsx` "★ a ticket going down…", red; `door-hold.test.ts`). Local A/B on `localhost:3131`
    (`_scratch/crumbs-29/local-door-hold-ab.txt`, a dead ticket on "Guest door tracker probe (disposable)", every
    refresh held 3 s): today's code drew a door step at +875 ms with the refresh landing at +3,648 ms; this lane's
    opened it at +3,903 ms, after the refresh landed at +3,465 ms. Nothing written.
  - The door's predicate once → `event_door_asks`, which `event_door_admit_listed`, `event_door_waiting_listed`,
    `events_door_opened`, `set_event_door`'s count and `let_back_in` read; owner-only EXECUTE; the parity guard and
    "no body lets a waiting row in but through the door's asks, or the host's own answer" in
    `migration-guards.test.ts`; `row-cap-sql.test.ts` gains `INTERNAL`, checked from the grants. Proof step 4: the
    count read 1 and the list let in exactly that one, a listed ask the host declined never.
  - The reports' closed status and its time → `supabase/migrations/20260930150000_report_resolved_when_closed.sql`
    (red on today's table: all five partings written; green: each refused 23514, the portal's own writes pass) and a
    guard that every write of a report's status in the app carries `resolved_at`.
  - Guards reshaped with their scars: the doors' "turning Public lets in every ask no block holds", the list's admit
    reading the helper.
- **ROADMAP lines these retire:** the door's predicate spelled twice (from `crumbs-23`); the reports' closed-status
  CHECK (from `hide-strikes`).
- **Proposed migrations** (apply by protocol, each independent; every body's drift md5 and the md5 it leaves are in its
  header and foot): `20260930130000_the_door_admits_no_block.sql` (a new owner-only helper; five bodies replaced, ACLs
  as before), `20260930140000_one_account_one_ticket.sql` (a new owner-only helper; `create_guest` and `ask_to_join`
  replaced, signatures and grants as before), `20260930150000_report_resolved_when_closed.sql` (one CHECK). Advisors:
  no delta expected. Types: two new Functions. No Worker, Vercel, Stripe or env change. Milestone 31's build runs on
  either side of each.
- **For the next build's red-team** (what localhost cannot sign in to; one device throughout, serial sign-outs and
  sign-ins, and two tabs of one session for the last):
  - With `20260930140000` applied: the phone signed out types "Sam" at a Public, names-only album A and adds 1 photo
    (Maybe later); sign in as partyr33l; A: add 1 photo, then a second. SQL: ONE row of hers at A (user_id partyr33l,
    verified) carrying both, `pr_session_<A>`'s sha256 its token, Sam's row untouched. The same at B after Not mine to
    Dana's ticket.
  - With `20260930130000` applied: at L ("You let each person in") partyr33l asks; sign out; willg97 declines her,
    turns L Public (SQL: her row still `waiting`), back to "You let each person in": Blocked, Let back in reads
    "They'll be back at the door, and you can let them in from there.", press: "Partyreel is back at the door.", At the
    door lists her; sign out; partyr33l opens L: the held door, not the album; willg97 Let in; she opens L. Then
    decline her again at Public: Let back in reads "They'll be able to open L and add photos again.", press, SQL her row
    `in`, she opens L and a photo goes up.
  - The door after a sign-out in flight: partyr33l on `/dashboard`, Sign out, open album K (names only) within ~3 s
    while `/api/me/menu` still answers 200: welcome Continue, "Add your photos", 1 photo, Send: no "Couldn't start
    uploading" toast; the door moves to "How do you want to join?" with the photo waiting; Continue as guest, a name:
    the photo goes up on the new named row (SQL: one row, named, the photo).
  - A blocked phone: tab 3 on album D holding X's name-only ticket (rendered signed out, never reloaded), partyr33l
    signs in in tab 2 (blocked at D by account); tab 3: 1 photo, Send: a `[data-entry-step]` MutationObserver records NO
    door step before "This album is private" (build 30 saw the name step for 2 to 4 s). SQL: nothing under X, no row of
    hers.
  - With `20260930150000` applied: in the portal, dismiss a report and Undo it, action an item and Undo it: each goes
    through (no 23514).
- **Assets requested from Will:** none.
- **Board ideas:** none.
- **Calls his to overrule:** her second device holds the same ticket as her first (one row an account an album);
  Let back in at a Public door lets a declined newcomer straight in; a first Add refused `name_required` keeps her
  picks for the door; an email-first album's `verification_required` still drops them (the three Questions above).
- **Look at first:** `20260930130000`'s `event_door_asks` and `let_back_in`'s Public admission; `20260930140000`'s
  `event_account_ticket` and where both mints ask it; `event-experience.tsx`'s `settleViewer` with
  `src/lib/guest/door-hold.ts`.
