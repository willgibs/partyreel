---
track: crumbs-57
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Each is built as recommended, and his to overrule.

- **How the clock turns at the develop: no argument, a fresh read per render, steps on the half minute.** Built: `useWaitClock` keeps its call (so `event-gallery.tsx`, `event-hub-head.tsx`, `camera-settings.tsx`, `event-experience.tsx` and every other reader are right with no change, and the files `event-dates` had just edited stay untouched); a render that finds the reading older than 250 ms reads the clock again, and the steps fall on :00 and :30 of the wall clock, where a picked develop time (a whole minute; Develop now is already past) meets one exactly. A develop at a non-minute second (nothing in the product writes one) steps at the next half minute. Overrule: a develop-time argument on the hook, one line in each reader, gives any second its own tick.
- **A develop looking back says "yesterday".** Built (`developedWhen`, the mirror of "tomorrow"): "Disposable · developed yesterday" at 12:10 am over a 9 pm develop, which read "developed at 9 pm" (tonight's, three hours on). Overrule: leave the past as it was.
- **The week ends at six days on.** Built: a develop seven days out says its date ("Oct 17 at 9 am"), never the weekday that would be today's own name ("Saturday at 9 am" on a Saturday, which the hours rule said). Overrule: the old rule.
- **'Only me' at 375 and 320: the words never wrap, the icons yield.** Built: each choice is `whitespace-nowrap` with a small padding, and its icon draws only where the control itself (a container query, 264 px of content and up: every phone from 368 px, the 375's included) has the room for icon and words; a 320 phone's third is 69 px and "Only me" is 55. Overrule: icons everywhere stacked over the words (a taller control), or none anywhere.
- **See it as a guest's Add settles after hydration.** Built: the Add reads what waits off the guests' own live source (`waiting.count`, the fact the guest page's `albumWaits` asks), so over waiting shots it says the first-photo words until the source answers, one swap at hydration, and "Take photos" after; the guest page decides it in its first byte on the server. A first byte that is right is two lines in files outside this lane (`readAsGuest` asks `albumWaits` as the page does and the as-guest page hands `waitingOnArrival` to the view). Overrule: take that wiring.

## System-doc edits (in place, owned facts only)

- `docs/systems/disposable-mode.md`: "The wait's words and clock" added to the host's cover section (the calendar's days; the one clock every reader decides ahead or reached on, which turns at the develop; a reader with a clock of its own brings the stale cover back), and the Settings note's example says "tomorrow at 9 am".

## Deferred (ROADMAP one-liners, bucket named)

- Guests: the guest page's Add (`event-experience.tsx`) carries the four phrases of `addWords` (`lib/guest/camera/words.ts`) inline, held to them by a test's grep (`words.test.ts`); adopt the function there so the page and See it as a guest share one (from `crumbs-57`).
- Host: See it as a guest's first byte can say the Add's words too: `readAsGuest` (`as-guest.server.ts`) asks `albumWaits` as the guest page does and the as-guest page hands `waitingOnArrival` to `AsGuestView`, which then needs no swap at hydration (from `crumbs-57`).
- Docs: `docs/systems/guest-flow.md` quotes "at 9 am" for a develop the next morning (lines 36 to 37, 93, 312, 325 and 1148: "All at once at 9 am · in 10 h 20 min", "Disposable · develops at 9 am"); `developsWhen` says "tomorrow at 9 am" there now, the example's own hours (from `crumbs-57`).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/crumbs-57`:** work `b7667cdc` (items 1, 2, 3, 5, 6) and `31a539a5` (item 4, the hook's clock-set-back fix, one test line outside the lane, the doc). No sync commit: the Orchestrator's relay (event-dates merged at `6f700751`) came before any edit, so the branch was merged up to `e5be373c` by a fast-forward; launch-prep has moved since by records only (`4c23717e`: `docs/STATUS.md` and tracks), which need no sync. The head is in the chat line.
- **Gates on `31a539a5`** (the tree handed off, bar this manifest), each on its own exit code, logs in `../partyreel-wt/_scratch/crumbs-57/`: `pnpm typecheck` exit 0 (`gate-final-typecheck.log`), `pnpm lint` exit 0, no warnings (`gate-final-lint.log`), `pnpm test` exit 0, 851 files and 10,091 tests (`gate-final-test.log`), `zsh scripts/build-lock.sh pnpm build` exit 0 (`gate-final-build.log`), `pnpm lab:smoke --base http://localhost:3131` exit 0, 147 checks, 0 failing (`gate-final-smoke.log`). The suite is also green at other hours, because a develop tomorrow made the words depend on the hour: `TZ=Europe/Moscow` (20:05 local; it caught `album-camera.test.tsx`, fixed), `Asia/Kathmandu` (22:51), `Pacific/Kiritimati` (07:07 the next day), and at 13:05 EDT (`gate-test-tz-*.log`).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every line sits under an `owns` prefix but one, the exception below, plus this manifest.
  ```
  docs/systems/disposable-mode.md
  src/components/app/create-event-wizard/look-step.test.tsx
  src/components/app/create-event-wizard/look-step.tsx
  src/components/app/event-feed/event-hub-head-cover.clock.test.tsx
  src/components/app/event-settings/door-page.test.tsx
  src/components/app/event-settings/door-page.tsx
  src/components/app/export/take-home-panel.test.tsx
  src/components/app/export/take-home-panel.tsx
  src/components/app/share/as-guest-view.test.tsx
  src/components/app/share/as-guest-view.tsx
  src/components/guest/camera/album-camera.test.tsx   <- the exception
  src/lib/disposable/use-wait-clock.test.tsx
  src/lib/disposable/use-wait-clock.ts
  src/lib/disposable/wait-words.test.ts
  src/lib/disposable/wait-words.ts
  src/lib/guest/camera/words.test.ts
  src/lib/guest/camera/words.ts
  ```
  The exception, one assertion: `album-camera.test.tsx` fixes its develop six hours ahead and asserted `"Develops at"`, which a develop tomorrow no longer says, so it failed every evening after 6 pm local (found by the Moscow run); it pins the shape now (`/^Develops (tomorrow )?at /`). No reader of the clock was edited (`event-gallery.tsx`, `event-hub-head.tsx`, `camera-settings.tsx`, `event-experience.tsx` and the rest are as they were), and `src/lib/events/dates.ts` is imported (`daysBetween`), never edited.
- **Red first** (each failed on the code before it, logged in the scratch folder): the hook's four (`red-1-hook.log`: a develop moved to now still saying "develops at", a develop ahead 11 s late, a late reader on the first one's reading, steps off the half minutes), the hub's two (`red-1b-hub.log`: her cover standing after Develop now, and 11 s past a develop's minute), the clock set back (`red-1c-hook-clockback.log`), the words' seventeen (`red-2-words.log`), the panel's four (`red-3-panel.log`: "28 photos & videos" over 28 photos), See it as a guest's three (`red-4-asguest.log`), Create's two (`red-5-look.log`: the lazy image, no early fetch). Item 6 is layout, so it is held by a structure pin (`door-page.test.tsx`) and the captures; its measure is below.
- **The items:**
  1. **The clock at the develop**: `src/lib/disposable/use-wait-clock.ts`. Every render reads a clock at most 250 ms old and the steps fall on the wall clock's half minutes, with no change to any reader; the hub's cover lifts on the render that brings the develop and at the picked minute (`event-hub-head-cover.clock.test.tsx`, mounting the real `EventGallery`), the guest eyebrow reads "developed" the same way (`use-wait-clock.test.tsx`). Checked in my own headless Chrome on real timers (a throwaway page, removed): steps landed 1 ms and 2 ms after :00 and :30, a reader mounted late read the wall clock, and a develop moved to now read "Disposable · developed at 1:01 pm" 80 ms after the press.
  2. **A develop tomorrow says its day**: `developsWhen` (`src/lib/guest/camera/words.ts`) reads the calendar's days in her clock through the events' `daysBetween`: "at 9 am" today, "tomorrow at 9 am", the weekday inside the week, then the date; `developedWhen` (`wait-words.ts`) the same looking back. Pinned either side of midnight, across the autumn clock change, and for the seven-day edge (`words.test.ts`, `wait-words.test.ts`); every guest line, the hub's cover and Settings' note follow with no edit.
  3. **The Download panel's noun**: `take-home-panel.tsx` heads the panel with `setNoun(photos, clips)` ("28 photos", "3 videos", "214 photos & videos"), not `formatMediaCount`. `shots/panel-photos-only-1440.png`, `panel-photos-only-375.png`, `panel-mixed-1440.png`, `panel-videos-only-1440.png`.
  4. **See it as a guest's Add**: `as-guest-view.tsx` hands the live source's `waiting.count` up (`WaitingBridge`) and says `addWords({ camera, empty })` with `empty` false while anything waits, so 102 developing shots read "Take photos"; the four phrases are one function in `words.ts`, and a test holds the guest page's inline copy to them. `shots/asguest-L-waiting-camera-375.png` (a throwaway page with a stand-in seed: the Add swaps once at hydration, no console error, an empty album unchanged).
  5. **Create's print sample**: `look-step.tsx`. The photograph is eager, high priority and decoded with the step, and the module asks for the very file the step draws (`preload` of the `getImageProps` srcset and sizes) when the page loads, while she names the event. Measured on the real wizard in my headless Chrome (a throwaway page, removed): before, the `img` stood lazy at the first frame and loaded 772 ms later at 375 (93 ms at 1440, warm dev optimizer), its request starting after Continue; after, the fetch starts about 210 ms after the page loads (initiator `link`), the `img` is complete in its first frame (0 ms black at both widths) and nothing is requested after Continue. `shots/look-before-375-a1.png` against `look-after-375-a1.png` (150 ms after Continue, the carry still in flight), and the 1440 pair.
  6. **'Only me' at 375 and 320**: `door-page.tsx`. Measured on the real `DoorPage` at the control width the room gives it (279 px at 375, 224 at 320, 264 at 360, 294 at 390; the Library's page chrome is 138 px, so I set the viewport to match): before, "Only me" wrapped to two lines at 375, 360 and 320 (the control 60 px tall) and stood on one at 390; after, every choice is one line at all four (40 px), with icons at 375 and 390 and the words alone at 360 and 320. `shots/door-375-before.png`, `door-375-after.png`, `door-320-before.png`, `door-320-after.png`, `door-360-*.png`, `door-390-*.png`, `door-1440-after.png`.
- **Assets requested from Will:** none.
- **Board ideas:** the clock's tests found the next time-of-day trap cheaply: after any words change that reads the calendar's days, run the suite once under `TZ=Europe/Moscow` (evening) and `Pacific/Kiritimati` (next day); a Library-less check of the Create and Settings rooms on localhost is only possible through a throwaway page (both are signed-in routes), so the lab's specimen of Create's room whole (the wizard's `create` seam, already a ROADMAP line) would let `lab:demo` hold this lane's first-frame check.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the five Questions above (the clock without an argument, "yesterday", the week's end at six days, the door's icons yielding under 264 px, the Add settling after hydration), and the one assertion outside the lane (`album-camera.test.tsx`).
- **Look at first:** on the alias, Develop now on a hub whose cover stands (it should lift on the page's refresh, with Settings' note and a guest's open eyebrow following in the same second); a disposable album late at night with a develop at 9 am (the eyebrow, the sheet's clock line and the camera's bar say "tomorrow at 9 am"); Create at `/dashboard/new` (Continue opens the look step with the party photograph in its first frame; the Network panel shows the optimizer's `mkt-party-dj-01.jpg` requested by `link` at the page's load); Settings > Who can get in at 375 and 320; the hub's Download on a photos-only album; See it as a guest over a waiting album (the Add reads "Take photos").
