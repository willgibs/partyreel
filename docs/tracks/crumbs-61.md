---
track: crumbs-61
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "015ff8e6"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/gallery-live
  - src/lib/events/dates
  - src/lib/guest/refresh-coalescer
  - src/lib/guest/use-gallery-doorbell
  - src/components/guest/gallery-empty-state
  - src/components/guest/event-experience.tsx
  - src/lib/guest/camera/words
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/disposable-mode.md
  - docs/systems/dashboard.md
  - docs/PRICING.md
---

# lp/crumbs-61

**Goal.** Red-team 48's three LOWs and three NITs: one link minted once for a guest's own upload; a range keeps its length when its start moves; Develop now reaches every guest together; the waiting sheet's footer at 375; the real guest page's Add says a newcomer's words; the guest album names what it holds.

## The brief

**Why.** Red-team 48 on build 48 (`26f14c6b`) found no MEDIUM. Its ledger is `../partyreel-wt/_scratch/redteam-48/ledger.txt`: grep it for each item's steps, never read it whole.

1. **LOW: a guest's own upload mints its link twice.** A links call runs beside the sync that already carries the link: 40 links calls for 20 photos (`gallery-live.tsx`'s `notifyUploaded` against `album-wire-carry.ts`, album-calm's). One link for one photo, and the cost line it saves goes in your Handoff.
2. **LOW: moving a range's start a year earlier keeps the old end.** 2027-10-05 to 09 became 2026-10-05 to 2027-10-09, 369 days (`endForNewStart`, `src/lib/events/dates.ts`). The end follows the start by the range's length as last saved, in both directions.
3. **LOW: Develop now reaches each guest on her own 15 s beat** (+0.38 s, +0.84 s and +7.2 s after the host), so crumbs-57's "in the same second" no longer holds; each screen stays consistent. A develop is one moment, never a stream: ring it at once if the doorbell can tell it from an arrival without a migration. If it needs one, write it for the Orchestrator under `supabase/migrations/20261003211000_`, or leave it as a Question with your recommendation.
4. **NIT: the waiting sheet's footer wraps badly at 375** with a "tomorrow" develop time (`gallery-empty-state-sheet.tsx` and its css).
5. **NIT: a guest who joined an empty album keeps "Take the first photo"** after others' shots are waiting. The real guest page (`event-experience.tsx`) adopts `addWords` (`lib/guest/camera/words.ts`, crumbs-57's), so it and See it as a guest say one thing. That also retires its ROADMAP line.
6. **NIT: the guest album says "12 photos & videos"** on a photos-only album, while the host's Download panel says "12 photos" (crumbs-57's `setNoun`). The guest's count names what it holds, from one home.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree, each step on its own exit code; `pnpm lab:smoke --base http://localhost:3133`; red first for 1, 2, 3, 5 and 6 (logged); captures at 375 for 4, 5 and 6; for 1, the links calls counted for one guest's 5 uploads before and after.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and listed as Will's to overrule; none is a one-way door.

1. **A range keeps its length wherever its first day goes** (item 2, the brief's own rule). A host who moves her first day
   earlier to ADD a day (a Thursday before her Friday to Sunday weekend) now sees the end move with it and sets the end again;
   the old arm kept her Sunday, and kept it a year on when a year was corrected (369 days). *Recommended: yes*, since the
   alternative (keep the end while the move is small) needs a distance Will would have to pick.
2. **Apply `20261003211000_doorbell_moment.sql`** (item 3: the ring cannot be told from an arrival without a migration).
   *Recommended: apply it by name (`doorbell_moment`)*: an expand (one body, the payload `{"moment": true}`), proven rolled back
   on the live schema both ways, safe in either order with the build, no type moves. And **no spread on the at-once ask**: a
   200-tab wedding develops once with 200 syncs inside about a second (≈15x the post-calm average, ≈4x the pre-calm one,
   PRICING's 960,000 syncs over five hours); if the first live develop at scale strains the database, a jittered ask is one
   constant in `refresh-coalescer.ts`.
3. **The cover's desk glyph names the kinds too** (item 6 beyond the album's own line, so one page never counts one album two
   ways). *Recommended: yes*: one optional prop on `event-experience-head.tsx`; its first paint says both nouns (the server
   knows a total, never its kinds) and flips after hydration (its words show on a hover or a tap only).
4. **The desk's side column always stacks the clock as two lines** (item 4): a short clock that fit on one line ("All at once at
   11:59 pm · in 7 h 15 min") is two lines there now, one shape instead of a clock that sometimes broke mid-phrase.
   *Recommended: yes.*

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: six refinements, each in the line it belongs to: the cover's Add follows the sync's word on what
  waits and is `addWords` (Empty state); the sheet's clock breaks at its phrases, its quote now "tomorrow at 9 am" (the contact
  sheet); her own upload's link is minted once (`owedLinks`, Live gallery); a moment rings at once (the doorbell); the album's
  count line and the cover's glyph say `albumCountWords` (Stats; One true count).

## Deferred (ROADMAP one-liners, bucket named)

- Guests: the cover's desk glyph says both nouns until the album's source tells it its kinds, since the first paint's `getGalleryStats` knows only `approvedTotal`; carrying the photo and video counts there would name them from the first byte (from `crumbs-61`).

## Handoff (replaces the chat report)

Artifacts live in `../partyreel-wt/_scratch/crumbs-61/` (called `scratch/` below): the red logs `red-*.log`, the captures
`cap-*`, the measures `item*-measure.txt`, the gates `final-*.log`.

- **Commits, pushed:** the work `e8d30cc2` (items 2, 4, 5, 6), `31b47cd7` (items 1 and 3, the system doc), `b76334a1` (page-level
  tests, the ROADMAP line), `5f13c2b3` (this manifest's Questions); the sync `ff0628f1` (launch-prep at `98fd4780`, backup-prune's
  merge: nothing of this lane's paths or reads moved; launch-prep has not moved since, behind 0). The head is in the chat line.
- **Gates on `5f13c2b3`** (the handoff commit after it changes this file alone), each on its own exit code: `pnpm typecheck` 0,
  `pnpm lint` 0 (no warnings), `pnpm test` 0 (869 files, 10,389 tests), `zsh scripts/build-lock.sh pnpm build` 0,
  `pnpm lab:smoke --base http://localhost:3133` 0 (158 checks, 0 failing): `scratch/final-{typecheck,lint,test,build,smoke}.log`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned paths and this file, plus eight exceptions, each the
  smallest edit its item needed: `docs/ROADMAP.md` (one line retired, the `addWords` line item 5 fixes; wait-wiring retired its own the
  same way); `src/lib/events/event-dates.test.ts` and `src/components/app/event-settings/event-page.test.tsx` (one test each,
  reshaped on purpose: they pinned the retired "an end still after the new day stays" arm; their scar, the end following the day it
  was saved from, is kept in `dates.test.ts`); `src/components/guest/event-experience.camera.test.tsx` (the page's own tests: its live
  source records the two new callbacks, three new tests); `src/components/guest/event-experience-head.tsx` (one optional prop,
  `mediaWords`, Q3); `src/components/guest/live-gallery.tsx` (the count line reads the source's words: one destructure, one expression,
  one comment) and `src/components/guest/live-gallery.test.tsx` (two tests for that line); `supabase/migrations/20261003211000_doorbell_moment.sql`
  (the path the brief names, written for the Orchestrator).
- **The items**, each red first (`red-*.log`), the real browser against the real shell where it shows:
  1. **LOW, her own upload mints its link once.** `gallery-live.tsx`'s `owedLinks`: an id is owed from `notifyUploaded` until the sync
     after it has answered, the window's ask for her optimistic tile waits and is then answered by the carry, a sync that fails or carries
     no link still lets the ask go, a take-back cancels it. Red `scratch/red-1-links.log` (the links route asked for her own id before each
     delta). **Measured** in a headless Chrome at 375 (`scratch/item1.mjs`, `item1-measure.txt`) over a modelled server (sync 400 ms, links
     230 ms, the ledger's), the real shell, provider, store, carry and grid: one guest's five uploads cost 4 syncs and **5 links calls, all
     her own ids, before; 4 syncs and 0 after**. **The cost line it saves:** one links call per approved upload (a function run, twice with
     the proxy; ≈4 ms of database, PRICING's figure for a links call; three presigns; a JSON body): the 2,000-guest wedding's ≈10,000
     uploads ≈ 10,000 calls ≈ $0.04 at PRICING's ≈$4 a million and ≈40 s of database; the red-team's ledger, 20 photos and 40 links calls,
     is 20 now (the window's asks for older ids stay). Her tile draws the blob until the delta lands, where the separate ask landed ≈170 ms
     sooner: the same picture.
  2. **LOW, a range keeps its length.** `dates.ts`'s `endForNewStart`; the ledger's own walk (2027-10-05 to 09, the year retyped 2026)
     is 2026-10-05 to 09 now, in `dates.test.ts` and Settings' own test. Red `scratch/red-2-dates.log`.
  3. **LOW, Develop now asks at once.** The doorbell cannot tell a develop's ring from an arrival, so a migration: `album_doorbell`
     says `{"moment": true}` (written, NOT applied), and `isMoment` + the coalescer's `moment()` + `connectDoorbell` ask at once for it;
     `use-gallery-doorbell.sql.test.ts` holds the SQL's key to the client's reader. Red `scratch/red-3-moment.log`. The migration's
     rolled-back check on the live schema: RED step 1 false, GREEN all true, nothing persisted (`scratch/proof-results.txt`, and the
     file's own foot). **Measured** on a real subscribed client (`scratch/item3.mjs`, `item3-measure.txt`): a plain ping waited 11.6 s
     and 14.2 s for its batch tick, a moment's sync began the same millisecond it arrived; the delivered message is
     `{ type, event, payload: { ...the sender's, id }, meta }`.
  4. **NIT, the waiting sheet's footer at 375.** `gallery-empty-state-sheet.tsx` (`ClockWords`): "Yours · N" one run, the clock a row of its
     own when it does not fit, the desk's side column stacked (it broke "in 16 h" from "16 min" too). Red `scratch/red-4-footer.log`.
     Captures at 375 on the real shell in the red-team's own state (three of hers, tomorrow's clock): `cap-4-real-before-375.png`
     ("Yours ·" over "3", "in 15 h 43" over "min"), `cap-4-real-after-375.png`; the sheet at 296, 351, 366, 406 and 1100:
     `cap-4-before-351.jpg`, `cap-4-after-{351,320,desk}.jpg`.
  5. **NIT, the real page's Add.** `event-experience.tsx` calls `addWords` and follows the sync's word on what waits (`onWaitingChange`,
     told on a flip, never a count); `words.test.ts`'s grep is reshaped to "the page calls the function". Red `scratch/red-5-add.log`.
     Real shell at 375 over a sync that says 3 shots wait: old `cap-5-old-after-flip-375.png` ("Take the first photo" over "3 Developing"),
     new `cap-5-after-flip-375.png` ("Take photos"). The ROADMAP line is retired.
  6. **NIT, the count names what the album holds.** `gallery-live.tsx`'s `albumCountWords` over `setNoun`, in the album's line
     (`countWords`) and the cover's glyph (`onCountWordsChange`); both nouns where the source cannot see in (a teaser). Red
     `scratch/red-6-{count,line,glyph}.log`. Real page at 375 on "guest-view-menu QA" (11 photos): `cap-6-before-375-photos-only.jpg`
     ("11 photos & videos"), `cap-6-after-375-photos-only.jpg` ("11 photos"); its mixed twin reads "58 photos & videos" (DOM text).
- **Assets requested from Will:** none.
- **Board ideas:** none beyond the lane.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** `supabase/migrations/20261003211000_doorbell_moment.sql` (Q2): apply
  by name through `apply_migration`, then match the live body to the file's; no types to regenerate. No Worker, Vercel, Stripe or env change.
- **Calls his to overrule:** Questions 1 to 4 above, and item 1's blob-then-delta swap.
- **Left behind, all disposable:** a guest row "Crumbs61 Test" with no upload on the "guest-view-menu QA" event (joined through my local
  dev server's door for the 375 capture), and five broadcasts on the topic `gallery:scratchcrumbs61000000000000000aa1`, which names no
  event; the rolled-back checks left nothing. No row was deleted by hand. The scratch routes that drove the real-browser measures
  (`scratch/scratch-routes/`) were never committed.
- **Look at first:** `scratch/cap-4-real-after-375.png` and `scratch/cap-5-after-flip-375.png` (the two states the red-team walked),
  then `scratch/item1-measure.txt`.
