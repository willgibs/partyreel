---
track: crumbs-57
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c4314652"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/disposable/use-wait-clock
  - src/components/app/event-feed/event-hub-head-cover
  - src/lib/guest/camera/words
  - src/lib/disposable/wait-words
  - src/components/app/export/take-home-panel
  - src/components/app/create-event-wizard/look-step
  - src/components/app/event-settings/door-page
  - src/components/app/share/as-guest-view
  - docs/systems/disposable-mode.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/systems/design-system.md
---

# lp/crumbs-57

**Goal.** Red-team 46's LOW and its five open NITs, made true: the wait's clock turns at the develop itself, a develop tomorrow says its day, the host's Download panel names what it holds, See it as a guest says what a real newcomer reads, Create's print sample opens on its photograph, and 'Only me' sits on one line at 375.

## The brief

**Why.** Red-team 46 on build 46 (`9af92e54`, its ledger `../partyreel-wt/_scratch/redteam-46/ledger.txt`; grep it, never read it whole) passed every walk; its two MEDIUMs are fixed (crumbs-56, merged at `64e90196`). What stays open is one LOW and five NITs (its sixth NIT, the sheet's screen-reader noun, crumbs-56 fixed):
1. **LOW, the clock at the develop.** After the host's own Develop now (`develops_at` = the database's now), her hub cover stands up to 30 s ('What your guests see until it develops at 7:42 am. / Look / Develop now / 0 photos developing. All at once at 7:42 am · in under a minute.'), and a guest's eyebrow 'DEVELOPS AT 7:42 AM' stands over her developed album as long: both read `useWaitClock` (`WAIT_CLOCK_STEP_MS` 30 s). A host who sees nothing change may press Develop now again. The clock turns at the develop itself: a reader whose develop time changes or arrives reads it fresh, and a develop ahead gets its tick at its own moment, still one shared store (`useSyncExternalStore`, never a `setState` in an effect). Fix it at the hook so every reader (`event-experience-head.tsx`, `camera-settings.tsx` and the rest, which you read, not edit) is right with no change of its own. Red first: a test that moves the develop to now and finds the old hook still saying 'develops at' until its next step.
2. **NIT, a develop tomorrow loses its day.** At Saturday 11:50 EDT a Sunday 9 am develop reads 'DISPOSABLE · DEVELOPS AT 9 AM' (`developsWhen`, `src/lib/guest/camera/words.ts`: under `DAY_MS` it says 'at <clock>'), three hours after today's 9 am; the sheet's 'All at once at 9 am · in 21 h 9 min.' too. 'At 9 am' only when it is today in her clock; tomorrow says so ('tomorrow at 9 am'), as the week says its day; every reader of `developsWhen` and `wait-words.ts` follows, under tests that pin a clock either side of midnight.
3. **NIT, the Download panel's noun.** The host's 'Take it home' panel (`take-home-panel.tsx`) heads an album of 28 photos and no video '28 photos & videos': the noun follows what it holds (photos, videos, or both), as the rest of the app words it.
4. **NIT, See it as a guest's Add.** Its phone says 'Take the first photo' over 102 developing shots, where a real newcomer to the same album reads 'Take photos' (`as-guest-view.tsx` against `/e/<qr>`): the view derives the same words the guest page does, from the same source. `as-guest-view.tsx` is also edited by `event-dates` (still open): do this item last, after your sync past its merge, which the Orchestrator relays; never edit it before.
5. **NIT, Create's print sample.** The look step's print card is black for about a second after Continue: its photograph is a `next/image` with `fill` and no priority (lazy), mounted only at Continue (`look-step.tsx`). It opens on its photograph: eager, and fetched before the step (our own marketing image through the optimizer is allowed; no user media ever goes through `next/image`, `media-cost-policy.test.ts`).
6. **NIT, 'Only me' at 375.** In the Settings room's 'What the link opens' control (`door-page.tsx`), 'Only me' wraps onto two lines beside 'Public' and 'Private' at 375: each choice sits on one line at 375 and at 320, with no new words.

No product behaviour changes beyond these; words only where a test holds them. Will's standard: far less text, never a tool's voice.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's steps), each on its own exit code; `pnpm lab:smoke --base http://localhost:3131`; red first for items 1 to 4 (tests failing on today's code, logged); captures in your scratch: the print step's first frame after Continue at 375 and 1440, the door control at 375 and 320, the Download panel on a photos-only album.

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
