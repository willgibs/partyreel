---
track: crumbs-62
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "83c1eefb"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/upload/server-pipeline
  - src/app/api/r2/complete-upload/
  - src/app/api/host/r2/complete-upload/
  - src/components/guest/event-experience.tsx
  - src/components/guest/guest-action-dock
  - docs/systems/uploads-and-r2.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/billing-caps.md
  - docs/systems/disposable-mode.md
---

# lp/crumbs-62

**Goal.** Red-team 49's LOW and two NITs: a complete sent again for an upload already recorded answers its row at once and can never delete the files behind it; the door's upload step on a waiting album says what waits; the guest's Save names photos and videos.

## The brief

**Why.** Red-team 49 on build 49 (`e795ad07`) passed every walk. Its ledger is `../partyreel-wt/_scratch/redteam-49/ledger.txt`: grep it.

1. **LOW, read from the code: a re-sent complete can delete a recorded upload's files** (`server-pipeline.ts`, upload-meter's staging). A complete sent again for an existing row re-copies its files into `events/`, and a duplicate is recognised only at the insert, after every gate. If a gate changed since the first complete (the roll now full by that very shot, the album closed, the cap reached), the refusal withdraws the `events/` files behind the recorded row. Phones retry a request whose answer was lost, so the camera roll's last shot is the likeliest victim.
   - A complete for a media id whose row exists answers that row at once, before any gate, copy or withdrawal (idempotent, as `create_media` is).
   - A refusal never withdraws a key that a recorded row points to.
   - Red first: a test that records an upload, changes a gate, sends the complete again, and finds today's code deleting the files.
2. **NIT:** on a waiting album, the door's upload step tells a newcomer "Nothing here yet. Add the first photo." (`event-experience.tsx`, `albumEmpty={mediaCount === 0}`). An album with shots waiting is not empty: say what the waiting room says, from the same source (crumbs-61's `addWords` and the waiting count).
3. **NIT:** the guest's Save says "Save 15 photos" for 12 photos and 3 videos (`guest-action-dock.tsx`). It names what it holds through crumbs-57's `setNoun`.

`trash-in-storage` (running) may later touch the upload path for its room check: keep your change small and in place, and say in your Handoff exactly what changed in `server-pipeline.ts`.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree, each step on its own exit code; `pnpm lab:smoke --base http://localhost:3133`; red first for all three (logged); for 1, a real upload on localhost recorded, its complete replayed after a gate change, and its files still served (a capture and the R2 listing).

## Questions (a recommended answer each; the Orchestrator relays them)

- **The door's upload step over a waiting album: say what waits ("2 photos developing. Add yours."), or the album's
  ordinary line?** Recommended and built: the ordinary line ("Add one now, or look around first."; the require-upload
  door's "The host has asked everyone to add a photo before the album opens."), heard from the cover's one source
  (`galleryEmpty`, which `addWords` reads), so the door never says "Nothing here yet" over what waits and agrees with
  the cover's Add. The cover under the door says the wait one screen later, and the step's words live in
  `upload-step.tsx`, outside this lane; a yes is a small words change there plus the waiting count carried to the page
  (the live source tells it only a yes or no today, `onWaitingChange`).
- **Who hears `recorded` for a recorded upload's complete: anyone holding its key, or only its own ticket (or host)?**
  Recommended and built: anyone. Nothing moves on that answer (no gate, copy, withdrawal, cookie or forensic record),
  the brief puts it before any gate (an identity read is one), and the sender learns only what the key it already
  holds told it (a tile's link names the key).

## System-doc edits (in place, owned facts only)

- `uploads-and-r2.md`, "The upload pipeline": a new ★ bullet, a recorded upload's complete is its row's to answer, a
  refusal withdraws only what no row names, a recorded clip's replay neither meets nor spends `reel_clip_add`
  (`273989a6`).
- `uploads-and-r2.md`, "Taking photos home": the select-mode sentence says the foot's Save names her set (`setNoun`)
  through the page's kinds store (`273989a6`).
- Proposed, not made (`guest-flow.md` is a read): its door paragraph's empty-album sentences (lines 775
  to 777, "Nothing here yet. Add the first photo.") could say empty is the cover's `galleryEmpty` (nothing shows, nothing of hers in
  flight, nothing waits).

## Deferred (ROADMAP one-liners, bucket named)

- none: the red-team's other W4d note (the door's step on a camera album offers "Choose from your album") is ROADMAP's
  standing "Guests: the door's first-photo step on a camera album..." line (from `disposable-camera`).

## Handoff (replaces the chat report)

- **Commits, pushed:** `0272498c` (item 1), `b879699c` (a where-I-am note), `e22130b0` (items 2 and 3), `273989a6`
  (the system doc), `d943fb23` (a WHY-comment reworded for `words.test.ts`), then this manifest. No sync: since `9d5be0bf`
  launch-prep took only records (pricing-research's merge `b0719ef4` and `34ad796c`, touching
  `docs/tracks/orchestrator.md` and `docs/tracks/pricing-research.md`), none in this lane's paths or reads.
- **Gates on `d943fb23`, each on its own exit code** (logs in `../partyreel-wt/_scratch/crumbs-62/`): typecheck 0
  (`gate-typecheck.log`), lint 0 (`gate-lint.log`), test 0, 876 files and 10,502 tests (`gate-test.log`), build 0
  (`gate-build.log`), `lab:smoke --base http://localhost:3133` 0, 142 checks (`gate-lab-smoke.log`). No board, so no
  `lab:demo`. The smoke's PREMISE note (the-wait's open `arrival` ask describes `event-experience.tsx`) re-read: this
  change touches the door step's `albumEmpty` source and the kinds store's wiring, never what a developed album's first
  open draws, so its premise stands.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + one exception,
  `src/components/guest/event-experience.album.test.tsx`: item 2's red test, beside the page's waiting-album tests,
  since the owned prefix `src/components/guest/event-experience.tsx` matches no test file (its `EntryModal` stub now
  keeps its props; one describe added).
- **1, the LOW, fixed:** a complete for an upload already recorded is its row's to answer, before any gate, copy or
  withdrawal, and a refusal withdraws only what no row names. Red: `red-item1.log` (15 failing, today's code calling
  `deleteR2Objects` with the original, preview and phone keys on a roll replay and on a dead ticket); live `red.json`
  (A replayed byte for byte after uploads closed: 403, then its `events/` files gone; B on a dead ticket: 401, then
  gone; the album's own links 404 for both). Green: `green-item1.log` (159 passed, `phone-copy.test.ts` and
  `session-cookie.test.ts` included), live `green.json` (both replays 200 `recorded` in under 100 ms, every file of
  both kept, the links serving 200 at their exact bytes) and capture `item1-replayed-album-served.jpg`; live
  `race.json` (two completes of one shot at once on a one-frame roll: `approved` and `recorded`, files kept, one row;
  a key not its row's: 400 `bad_key`, nothing moved).
- **Exactly what changed in `server-pipeline.ts`** (`git diff 9d5be0bf d943fb23 -- src/lib/upload/server-pipeline.ts`):
  it imports `readRecordedUpload` (a new module, `server-pipeline-recorded.ts`, one admin read of `media` by id); in
  `runCompletePipeline`, after the key binding and consistency checks and before the multipart branch, a row found
  answers at once (`answerRecorded`: `{ok:true,status:"recorded"}`, or 400 `bad_key` for a key not its row's); the
  record's refusal and throw paths call `withdrawUnlessRecorded` where they called `unlandCopies` (a row: `recorded`,
  nothing withdrawn, and a throw then reported as `record_twin`; a failed read: nothing withdrawn, said as
  `unrecorded_copies_left`; none: `unlandCopies` as before); the helpers sit after `unlandCopies`; the header gains
  the complete spine's step and one ★ invariant, and two comments say the idempotent case is now a twin's. The presign
  half, the meter, the landing helpers and every response shape are untouched.
- **2, the door's NIT, fixed:** the door hears `albumEmpty={galleryEmpty}`, the cover's one source. Red
  `red-item2.log` (`albumEmpty` true under a cover saying Add photos); green `green-item2.log`; live, a newcomer at an
  album with two shots developing reads "Add your photos / Add one now, or look around first." and no "Nothing here
  yet" anywhere (`item2-door-upload-step-waiting-album.jpg`).
- **3, the Save's NIT, fixed:** the foot's Save names her set through `setNoun`, the album's kinds carried out of its
  live source by a page store (`guest-action-dock-kinds.ts`, its source `guest-action-dock-kinds-source.tsx`, said
  only while she selects). Red `red-item3.log` ("Save 3 photos" for two photos and a video); green
  `green-item3.log`; live on two photos and a clip, Select > All reads "Save 3 photos & videos" (the album's line "3
  photos & videos"), the clip alone "Save 1 video" (`item3-save-one-video.jpg`).
- **Not walked locally:** a host's replay (sign-in cannot run on localhost; the engine is shared, unit-pinned in
  `server-pipeline.test.ts`) and a multipart's replay (unit-pinned): the alias's red-team.
- **Test data:** five disposable albums of willg97's ("crumbs-62 replay red", "... replay green", "... waiting door",
  "... mixed save", "... twin race") soft-deleted at 23:42Z, purging 2026-11-02 with their files (`cleanup.log`; their
  bytes sit in his Deleted until then). Not restorable: his 2026-10 meter +4,957,710 B, 9 photos and 1 video (the ten
  landed files), and the hour's tallies; `staging/` left to its day rule. Dev server killed by port; my Browser pane
  tab closed; no headless Chrome.
- **Assets requested from Will:** none.
- **Board ideas:** a purged upload's `staging/` twins outlive its row for up to a day, so its complete sent again
  records it anew under the sender's ticket (no reach a saved copy lacks); the purge could take the twins with it. And
  `live-gallery-select.ts` could carry each pick's kind where the album makes the pick, retiring the page's kinds
  store.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** a stranger's complete for a recorded upload hears `recorded` (Question 2); the early
  answer heals no cookie and writes no forensic record (both the first landing's); a failed row read lands as before
  and then withdraws nothing (the orphan sweep's, said); a twin whose record threw is answered `recorded` when its row
  exists; the door's step over a waiting album says its ordinary line (Question 1); the kinds store is the page's, not the
  select store's (outside this lane).
- **Look at first:** the LOW was broader than read. Any ticket, a dead one included, withdrew a recorded upload's
  files within its staging day for whoever knew the key a tile's link shows: unauthenticated (`red.json`, step "B: its
  complete on a dead ticket"). The same early answer closes it. Then `server-pipeline.ts`'s diff, above.
