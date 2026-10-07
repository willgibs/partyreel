---
track: crumbs-89
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "cb44675e"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-settings/settings-state
  - src/components/app/event-settings/door-page
  - src/components/ui/dormant
  - src/app/(app)/dashboard/[eventId]/guests/invited-section
  - src/app/(app)/dashboard/[eventId]/actions
  - src/lib/db/mutations/event-doors
  - src/lib/event/door/
  - supabase/migrations/20261007140000_email_first_memory.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/database-security.md
  - docs/systems/guest-flow.md
---

# lp/crumbs-89

**Goal.** Milestone 39's last MEDIUM closed at its source: a host's names-only door comes back on every path when a gate that forced "An email first" is left, and Settings' rows stay true after a load.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3131 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**Why this lane, now:** red-team 57b walked milestone 39's build (`cd38cf21a`) and found one MEDIUM, in crumbs-87's item 1 (its ledger: `../partyreel-wt/_scratch/redteam-57b/ledger.txt`, the W1 lines; crumbs-87's Handoff and Q1: `git show a7991bc30^2:docs/tracks/crumbs-87.md`). Milestone 39 waits on it, so the MEDIUM comes first and the rest only where it shares a cause; a re-walk of exactly your items follows your merge.

**The items, in order:**
1. **The MEDIUM (red-team 57b):** a names-only album with a guest in by name; Private > You let each person in ("An email first" forced on); back to Public. Within one page visit the switch comes back off with its toast; across a load it does not (7 of 12 trials): a hard load with the sheet open (`?room=settings&setting=door`: a reload, a restored tab, a pasted link), the first save after the load, Close without leaving, and the phone's full-screen door page (where only Back caught up). The album then stays Public with `require_verified_email` true and the name-only guest meets "Confirm your email to see everything". The restore (`settings-state.tsx`'s effect over `settings-state-email.ts`'s device note) waits for the hub's row to show the door change, and after a load the row never sees the saves. Fix it at the source so it holds on every one of those paths and on another device: crumbs-87's Q1 named the complete answer, the database remembering her choice (the first Immediate line under The host app: a column the gate's hold sets when `set_event_door` turns the step on from off, given back by one `before update of gate` trigger, `email_restored` in `set_event_door`'s answer for the toast), then the device note goes. If the database route proves wrong, say why under Questions and take the next most robust (the save's own answer, never the hub's row).
2. **The door page says it before the move** (the second Immediate line under The host app): a move onto "You let each person in" or the invite list turns An email first on for everyone, and the line before the move says nothing of it; say what it does to people already in, as the password's two groups do (`door-page.tsx`'s `consequenceOf`).
3. **Settings' rows after a load (red-team 57b, LOW, the MEDIUM's own cause):** after a hard load with the sheet open, the rows never see the saves (the Guests room's invite list sticks on "Saving… 0 on the list" while the database holds the address, until the room is reopened). Find why the hub's row stops taking the saves after a load and fix it there, so every setting reads true after its save on any path.
4. **A dead tap band (red-team 57b, LOW, crumbs-87's item 8):** an awake setting's hidden summary line in `ui/dormant.tsx` still catches taps in a 12 px band, so tapping the "A photo first" label (and "Max size") does nothing at 1440 and 375; the halo's room must not cost the label its tap.

**The migration, `supabase/migrations/20261007140000_email_first_memory.sql`:** start from `set_event_door`'s newest definition in `supabase/migrations/` (never from memory) and follow `docs/systems/database-security.md`'s Workflow and checklist (grants revoked from public before they are granted exactly; the migration guards; its pre-flight on a throwaway local cluster). Prove it on the live schema inside `begin; ... rollback;` in one `execute_sql` call (that doc's recipe: the proof commented at the file's foot, RED then GREEN), and never apply it: the Orchestrator applies it through the Advisor and the protocol after your handoff, so your Handoff names the file's md5 and every caller. Milestone 38's live build shares this database, so the change must leave that build working (an expand where a signature or behaviour changes; the header names what that build sees meanwhile: PROGRAM's "Before launch there are no real users").

**Walk your own items antagonistically,** each on every path 57b names (a hard load with the sheet open, a reload mid-hold, Close without leaving, 375's full-screen page and Back, another browser as the second device), reading `events.require_verified_email` by read-only SQL after each, and a name-only guest's own view after each; then the password's first set while held. Test data disposable and named "crumbs-89 (disposable)".

**Nearby lanes (never edit their paths):** crumbs-88 (handed off, merging after milestone 39: `event-page.tsx`, the hub's badge and cover link, Create, the dashboard's stage, the reel; and six system docs, `host-app.md` among them, so a stale line in a doc you do not own goes in your Handoff for the Orchestrator); the boards after-party r1 and no-signal r1 (their sandbox folders).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as its recommended answer and listed again under the Handoff's calls to overrule.

- **Q1 · Item 1: who writes the memory.** Built: one `BEFORE UPDATE OF gate` trigger (`events_email_held`) owns
  `events.email_held` both ways: an address gate that turns the step on from off sets it (only `set_event_door` can), any
  other gate gives her names only back and clears it (`set_event_door`'s other doors and `set_event_password`'s first
  set alike). `set_event_door`'s update stays verbatim (`migration-guards.test.ts` pins it) and answers `email_restored`
  from one read of the row after it. Recommended: take it (the brief named the hold's set in `set_event_door`; the
  trigger is the same moment, and one writer of the column).
- **Q2 · Item 3: why the row stopped taking the saves, and the fix.** Found: React 19.3's canary bundled with Next 16.2.6
  parks a revalidating Server Action's commit for good when a payload chunk that arrived during the wait answers its
  `then` synchronously while React unwinds a render already suspended-with-delay: `pingSuspendedRoot` records no ping in
  render context at that exit status. Measured on a production build (`../partyreel-wt/_scratch/crumbs-89/rt/pf*.log`):
  the root's lane 1024 pending and suspended with no ping, the router's new state whole (every cache node and lazy
  settled), the last parked thenable a chunk that went `resolved_model` to fulfilled as it was bound, and ONE unrelated
  state update committed it at once (`markRootUpdated` clears suspended lanes). On an album of 8 photographs about half
  the first saves after a hard load park (6 of 12, 3 of 6, 4 of 6); on an empty one, rarely (1 of 10, 1 of 60). Built: once a save has answered, Settings and the invite list nudge React
  with an empty update at 1, 2.5, 5 and 9 s while their commit has not landed (`settings-state-unpark.ts`). Recommended:
  take it now; report upstream and retire it on the fix, or give it one hub-wide home (Deferred), since React itself is
  no lane's to patch.
- **Q3 · Item 2's words.** Built: before a move onto letting each person in or the invite list from names only, with
  guests in by name: "N guest(s) is/are in on a name alone. Letting each person in / Your invite list asks them to confirm
  an email too, before they see everything or add more." [Ask for an email] [Keep it as it is]; under the gates while the
  step is on: "A gate stops newcomers; everyone in keeps adding, the N in by name once they confirm an email."
  Recommended: take them; the words are his to overrule.
- **Q4 · The password's first set says it too.** Built: the password control answers success alone, so the provider
  lays the password door at once from that success and, where the page knew the gate held the step from off (the row's
  `email_held` or the hold's own answer), the step off with the door's own toast. Recommended: take it.
- **Q5 · A gate this page never saw.** Built: a giving back the page did not see coming (another device's gate) is said
  without naming one: "It was only on while the door asked for a confirmed address." Recommended: take it.
- **Q6 · Holds standing at the apply.** Built: no backfill (the database never saw what she had), so leaving a gate held
  before the apply leaves the step on, as today; every hold after it is remembered. Recommended: take it (no real users).

## System-doc edits (in place, owned facts only)

- none (the lane owns no `docs/systems/` doc). Lines made stale, for their owners: `host-app.md` "An email first" (the
  event remembers a gate's hold, `events.email_held` by `events_email_held`, so every door move, the password's first
  set and every device give names only back, said from the save's own answer, `email_restored`; crumbs-88's
  "device-bound" goes; the door page says what an address gate asks of the guests in by name before the move) and "A
  setting with no effect right now" (a folded side is inert); `database-security.md` Grants (`email_held` is
  trigger-only, beside `purge_at`) and the trigger functions (`events_email_held`, SECURITY INVOKER); and a gotcha for
  Settings' saves in `host-app.md`: a revalidating action's commit can be parked by React (Q2), so a save answers for
  itself and nudges (`settings-state-unpark.ts`).

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Immediate · The host app · Settings: once `20261007140000_email_first_memory.sql` is applied and `types.ts`
  regenerated, read `events.email_held` through the generated type (`heldOf`'s seam in `settings-state.tsx`) (crumbs-89).
- Upcoming · Code hygiene · React 19.3's canary (Next 16.2.6) drops a ping that answers synchronously while a
  suspended-with-delay transition unwinds (`pingSuspendedRoot`), parking a revalidating Server Action's commit until
  another update: Settings and the invite list nudge it (`settings-state-unpark.ts`); the hub's other revalidating acts
  (the password control's own state, At the door, Blocked) can still meet it; report upstream and retire the nudge on the
  fix, or give it one hub-wide home (crumbs-89's Q2).
- Upcoming · The host app · Settings' door menu (`settings-rows.tsx`'s `doorConsequence`) says an address gate "Turns An
  email first on" but not what it asks of the guests in by name, which the door page now says before the move (crumbs-89).

## Handoff (replaces the chat report)

- **Commits** on `lp/crumbs-89`, pushed: `23cda34ed` (items 1 to 4), then this manifest alone. No sync commit:
  launch-prep moved only by records since the cut (`efda4c701`, `4e142c25e`).
- **Gates** on `23cda34ed`, each on its own exit code (logs `../partyreel-wt/_scratch/crumbs-89/gate/`): typecheck 0; lint
  0; test 0 (1,083 files, 13,676 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base
  http://localhost:3131` 0 (168 checks, 0 failing).
- **Lane check** `git diff --name-only origin/launch-prep...HEAD`: 17 paths, every one under owns (the deleted
  `settings-state-email.ts` and the new `settings-state-unpark*.ts`, `event-doors-migration.test.ts` by their prefixes),
  plus this file. No exceptions.
- **The items:**
  1. The MEDIUM: `20261007140000_email_first_memory.sql` (below), `settings-state.tsx` (`saveDoor` lays the step off and
     says it from `email_restored`; `passwordSet`, `passwordCleared`; `emailHeld` from the row), `event-doors.ts` and
     `[eventId]/actions.ts` (`emailRestored`, null where the database answers no such key), `words.ts` (`emailBackLine`);
     `settings-state-email.ts` and the row-keyed effect deleted. Tests: `settings-state.test.tsx` (reshaped, scar kept,
     the expired reason said), `event-doors.test.ts`, `event-doors-migration.test.ts`, `actions.test.ts`, `door-page.test.tsx`.
     Walked on a local production build against today's database (the column not there): hold, a reload mid-hold, Public,
     at 1440 and at 375's full-screen page, and the password's first set while held: the hold and the leave applied as
     the first saves after hard loads, nothing claimed or given back, the switch live; the restore itself is the proof's
     (every way out, the password's first set, gate to gate, her own step on) and the tests' (with the proof's real
     answers), so its walk is the re-walk after the apply.
  2. `door-page.tsx` (`consequenceOf` with `inByName` and the step, `insideNote`); `door-page.test.tsx`. Walked at 1440
     and 375 (captures `../partyreel-wt/_scratch/crumbs-89/rt/shots-w1-*.png`): the line, no write until "Ask for an
     email", then held; the name-only guest's own album read "Confirm your email to see everything"; no sideways scroll.
  3. `settings-state-unpark.ts` (+ test), wired into `settings-state.tsx` and `invited-section.tsx` (Q2). Before: 3 of 6
     first saves after a hard load stale (the provider's row, `rt/pf16.log`, `pf17.log`). After, on the final build: 12 of
     12 applied (`../partyreel-wt/_scratch/crumbs-89/w-item3-hardload.log`; the parked ones at about 1.3 to 1.6 s), and the
     Guests room's invite list after hard loads 6 of 6 adds listed and removes gone, "Saving…" cleared each time
     (`w-item3-invite.log`).
  4. `ui/dormant.tsx`: the folded line is `inert`; `dormant.test.tsx` (fails without it). Walked at 1440 and 375: every
     point of the "A photo first" and "Max size per upload" labels' top 12 px lands on the label, and a press 2 px into
     "A photo first" opens its confirm ("Ask for a photo before the album?", answered Leave it open).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** one migration, none of the rest.
  - `supabase/migrations/20261007140000_email_first_memory.sql`, md5 `4836beb3057324108cf394c3f1e6e3b3` at `23cda34ed`, NOT
    applied: `events.email_held` (boolean, not null, default false, no client grant), `events_email_held()` (plpgsql,
    INVOKER, empty path, revoked from public, anon, authenticated) and its `BEFORE UPDATE OF gate` trigger, and
    `set_event_door` carried from 20260930130000 with `email_restored` (grants restated as they stood). Its header's apply
    protocol (1) to (5) is the order; advisors' delta none (27/4/36). Pre-flight on a throwaway Postgres 17 stand-in (the
    diff of `set_event_door` exactly the new read and key). Its foot ran on the live schema in one `execute_sql` each: RED
    "1 the hold | f | set_event_door answers no email_restored", GREEN every row ok (hashes `events_email_held()`
    `e8946631499647c941bc6a84acb04755`, `set_event_door` `57e3f04e923c66320678e5304c923959`), and a read after found no
    column, function, trigger or proof guest, `set_event_door` at `fedc84d0d2df8c7fbaf5c44687605f4b` as before.
  - ★ Apply before the merge: this build reads `email_restored` (absent reads null: nothing given back, nothing claimed,
    today's behaviour). Milestone 38's and 39's builds call `set_event_door` by its two names and read `email_held` and
    `admitted` (unchanged); after the apply their album gets names only back in the database and their Settings shows it
    as the row catches up (milestone 39's device note then forgets itself with no toast).
  - Every caller: `set_event_door` ← `setEventDoor` (`lib/db/mutations/event-doors.ts`) ← `setEventDoorAction`
    (`[eventId]/actions.ts`) ← `SettingsProvider.saveDoor` ← `DoorPage` and Settings' door menu (`settings-rows.tsx`);
    `set_event_password` (unchanged; its gate write fires the trigger) ← `setEventPassword` ← `setEventPasswordAction` ←
    `EventPasswordControl` ← `DoorPage` (`passwordSet`); `events.email_held` is written by the trigger alone and read by
    `heldOf` off the hub's `getEvent` (`select("*")`).
- **Assets requested from Will:** none.
- **Board ideas:** step 3's held line could say names only come back when the gate goes, now the event knows
  (`email_held`); one hub-wide home for the save nudge (Deferred).
- **Test data** (willg97, all through the product's own UI): event `bc89e1e0-4182-463e-a072-39a8ebeed5d4` "crumbs-89
  (disposable) door" is in Deleted (purge 2026-11-06) with its name-only guest "Mira c89" and her 8 photographs; the
  invite addresses `crumbs89-disposable-*@example.com` added and removed (`event_invites` 0); the album password set and
  removed. The rolled-back proofs left nothing (read after). The headless Chrome, its driver, the 3131 servers and the
  local cluster are stopped.
- **Calls his to overrule:** Q3's words; Q5's line for a gate the page never saw; the nudge's timings (1, 2.5, 5, 9 s).
- **Look at first:** the migration's trigger (the one writer of the memory) and its foot; then `settings-state-unpark.ts`
  (a workaround for React's lost ping, with its measurement) and where it is called; then `saveDoor` and `passwordSet`.
