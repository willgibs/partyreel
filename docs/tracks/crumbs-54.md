---
track: crumbs-54
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "7010ace4"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/event-experience
  - src/components/guest/gallery-live
  - src/components/guest/live-gallery
  - src/components/guest/guest-upload
  - src/lib/guest/use-upload-queue
  - src/components/guest/upload/failure-sheet
  - src/components/guest/save-account-prompt
  - src/components/guest/camera/
  - src/lib/guest/camera/
  - src/app/(guest)/e/[token]/page
  - docs/systems/guest-flow.md
  - docs/systems/disposable-mode.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/disposable/reveal.ts
  - src/lib/guest/upload-tracker.ts
  - src/components/guest/upload-tracker.tsx
  - src/lib/guest/reel-url.ts
  - src/components/guest/reel/live-reel.tsx
  - docs/systems/reel.md
---

# lp/crumbs-54

**Goal.** Fix what red-team 44 found on build 44's guest album: a delayed album's upload never stands in the album, not even while it sends; a returning guest arriving on ?reel meets the reel's black, never her album; and the words around an upload say what is true on an album whose uploads wait.

## The brief

**Why.** Red-team 44 walked build 44 (`ece3f8a1`) on the alias, 2026-10-03; its ledger is `/Users/gibby/local/ai/partyreel-wt/_scratch/redteam-44/ledger.txt` (grep `MEDIUM:`, `LOW:` and `NIT`; captures under `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/2ba90542-62d6-487c-8c79-3657619f9133/scratchpad/rt44tools/shots/`). It is still walking: the Orchestrator relays anything more it finds to you. Will's rules behind every item: "the album is never visible before any door/gate that should be encountered first", and on the reel, he hated that "some (reel) seems to flash a guest album as it loads the slideshow".

**1. The MEDIUM: a delayed album's upload stands in the album while it sends.** On an album with a develop time ahead (any capture; check an approve-each album too), a signed-out ticket guest at 375 adds 1 to 3 photos through the cover's Add: a MutationObserver counting `[data-album-grid] > [data-media-tile]` at callback time, plus a frame sampler, sees one laid-out tile from the press until the last lands (+2.7 s to +5.6 s for one photo; +44 s to +53 s for three), re-keyed per photo. It shows blurred behind the add sheet, and with the sheet dismissed the photo stands full width under "Uploads appear in the album when it develops, …" for about 3 s each, before "The album starts with you" returns. Only she sees it (no other reader gets an id), but it breaks the fix's own invariant, "no tile stands in the album for her alone". The landing half is fixed (`disposable-camera`'s `landedAs`, `crumbs-52`'s sealed landing kept in her in-flight uploads); the in-flight half still draws the queue's optimistic tile, so a video stands in the album for its whole upload, then vanishes. Fix it at its cause, red first: where uploads wait (the page's one reading, `uploadsWait`: approve-each, or a develop time ahead through `lib/disposable/reveal.ts`), an upload in the air never enters the album's grid and lives in her tracker from the press (sending, then waiting). An album that shows uploads at once keeps today's optimistic tile, byte for byte.

**2. LOW: a returning guest arriving on `?reel` meets her album first** (a shared reel link, hard or soft): the album paints, then the reel over it (about 140 ms on a desk, about 1 s at 4x CPU on a slow link). The curtain stands for the owner only (`reelAsked` in `src/app/(guest)/e/[token]/page.tsx`: "The owner alone: she never owes the door"). Recommended and built, his to overrule: a viewer who owes no door (a returning guest whose door is passed, a public album's let-in visitor) arriving on `?reel` wears the same black from the first byte to the reel; a newcomer still meets the door first, and the reel after it. The door's first byte (door-reveal's `doorArrival`) is never weakened.

**3. LOW: the failure sheet's "Everything else is in <host>'s album."** is false on an album whose uploads wait (nothing of hers is in the album until it develops or is let in; red-team 43 flagged the same words). Say what is true there (her other uploads wait with the rest, in her tracker), one formatter with the keep and the tracker where one already exists (`src/lib/disposable/develop-words.ts`).

**4. NITs:** the camera's live region announced "Shot 6 is on the roll." for a shot the server then refused (both lines inside a second): announce a shot only once the roll counts it, or word the first line so it never promises what the server refuses. The keep said "Your 5 photos are waiting to develop" with a video among them: name what was sent (photos, videos, or shots).

**Constraints:** red first for every item; the leak invariants never move (no sealed or held id leaves the server for anyone but its uploader; `docs/systems/disposable-mode.md`); `use-upload-queue.ts` keeps its API (twelve files import it); no SQL.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code) and `pnpm lab:smoke --base http://localhost:3131`; Vitest red first for each item (the in-flight tile never in the grid on a delayed album and unchanged on a live one; `reelAsked` for a returning guest and never for a newcomer; the failure sheet's and the keep's words; the camera's announcement); and the red-team's own measure on your dev server in a headless Chrome of your own (uploads stood in at the network, as `disposable-camera` did): a MutationObserver counting tiles at callback time plus a frame sampler, 0 tiles from the press to the landing on a delayed album at 375, and the curtain in the first painted frame of a returning guest's `?reel`; captures in your Handoff.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Whose adds wait, for the album's head.** Recommended and built: the page reads it once per viewer (`addsWaitFor`
  over `uploadsWait`): a guest's wait where uploads wait; the host's on her own guest page only for a develop time
  ahead (`create_media_as_host` approves hers, and seals them with everyone's), so on approve-each her Add keeps
  today's stack and tile; the demo's never (its uploads are simulated and land at once).
- **The camera's line at the press.** Recommended and built: the second of the brief's two ways, "Shot 6 taken." (the
  host's words already) and "Video taken.", said in the press's own frame; announcing only once the roll counts it
  would trail the shutter by an upload each, out of order behind a run of shots.
- **The failure sheet's words where uploads wait.** Recommended and built: the keep's own sentence with "Everything
  else" for its subject and her rows' words for its state ("Everything else is waiting to develop, Sat, Oct 3, 10:00
  PM." / "Everything else is waiting for approval."); an album that shows uploads at once keeps "Everything else is in
  Maya's album." byte for byte.
- **The keep's noun.** Recommended and built: a camera album's are shots ("Your 5 shots are waiting to develop, …");
  elsewhere by kind, photos or videos, and a mix in `formatKindCount`'s own word, uploads ("Your 4 uploads joined
  Maya's album."), on the Sent line and the offer alike.
- **A guest's `?reel` (Will's call).** Recommended and built as the brief recommends: the black stands for any viewer
  who owes no door (`doorArrival` drew no stage and no scrim, at full access), the owner as before; a newcomer, or a
  guest who still owes a step, meets the door first and the reel after it.
- **After a develop her tracker goes.** Recommended and built: the live reading ends the wait (`useLiveUploadsWait`),
  so on an album that now shows uploads at once her tracker hides as it does on any live album (her photos are in the
  album), where it stood on with "The host reviews uploads ..." under it; approve-each keeps it.

## System-doc edits (in place, owned facts only)

- `guest-flow.md`: the keep's Sent line names what went (`keepSent`); the failure sheet's line on the rest
  (`uploadFailureElsewhere`); the stack only where what she adds shows at once (`addsWait`, `addsWaitFor`); the tracker's
  reading held live (`useLiveUploadsWait`, `developsAtOf`); the live reel's curtain for any viewer who owes no door; the
  door's reduced-motion fade in `@layer base`.
- `disposable-mode.md`: the camera's bullet (nothing of hers in the air at the head, her tracker from the press, "Shot
  6 taken."); the sync's `waiting` read live by the guest's page.

## Deferred (ROADMAP one-liners, bucket named)

- (guest) The host adding from her own guest page on a develop album sees nothing of hers there, in the air or landed
  (sealed with everyone's, and the owner has no tracker); her hub shows every one: a waiting word for the host, if wanted.
- (docs, the Orchestrator's) `reel.md` (this lane's read): "the owner's curtain stands on it" reads "the curtain" now.

## Handoff (replaces the chat report)

Captures and logs are under `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-54/` (`runs/<run>/`, `gate-*.log`).

- **Commits.** The work is `24be3adc`, pushed; this manifest the commit after it. launch-prep moved (account-exit's
  merge and records) with no code touching this lane's work or its reads, and `git merge-tree` of the head with
  `origin/launch-prep` is clean, so no sync (PROGRAM.md's rule).
- **Gates on `24be3adc`'s tree, each on its own exit code:** `pnpm typecheck` 0 (`gate-typecheck.log`), `pnpm lint` 0
  (`gate-lint.log`), `pnpm test` 0, 803 files and 9,514 tests (`gate-test.log`), `zsh scripts/build-lock.sh pnpm
  build` 0 (`gate-build.log`), `pnpm lab:smoke --base http://localhost:3131` 0, 163 checks (`gate-smoke.log`); no board,
  so no `lab:demo`. Red first: `red-run.log` (21 red), `red-run-2.log` (15 red), green `green-run.log`,
  `green-run-2.log`; the live reading's hook pins proved by a mutation (no clock, a reached develop read as ahead: 5 of 8
  red, restored).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): owned paths, the new `event-experience-wait.ts`
  and its test under the owned prefix, this file, and two exceptions: `components/guest/entry-modal.tsx` (+ its test),
  because the keep's noun passes through the door that draws the keep and names its sheet (one prop, no lane owns it);
  `components/guest/door/doorway.css` + `door/doorway-reduced-motion.test.ts`, accepted by the Orchestrator for the
  reduced-motion LOW (`globals.css` untouched).
- **The MEDIUM** (`live-gallery.tsx`'s `addsWait`, the page's `addsWaitFor`): where what she adds waits, nothing in the
  air draws at the album's head. Measured at 375 against real albums, uploads stood in at the network: a develop album
  (Door flow probe, its `develops_at` set by SQL), 2 files (a photo and a clip) from the press to the last landing:
  471 frames, 0 stack, 0 tiles, the empty album in every frame, the tracker "Your uploads" from the press then "1",
  "2 waiting to develop" (`runs/develop-now/result.json` `phase1`, `p1-*.png`); an approve-each album (4 photos), 3 files:
  714 frames, 0 stack, 4 tiles throughout, "3 waiting for approval" (`runs/approve-final/summary.json`); the control, a
  live album: the stack at +165 ms in 367 frames, 7 tiles to 9 at the landing (`runs/live-control/summary.json`).
- **The stale develop LOW** (`useLiveUploadsWait`, `developsAtOf`): the line went 1.2 s after a Develop now (SQL
  `develops_at = now()` at 03:43:22.168Z, the line gone 03:43:23.344Z, one navigation, no reload) and 94 ms after a
  develop time came on the clock (`runs/develop-now/result.json` and `runs/develop-clock/result.json`, `noteTurns`);
  an upload after either stood at the head from +160 ms and landed in the album (0 to 1 tile, no line, no tracker:
  `phase3`).
- **`?reel` LOW:** a returning ticket guest's hard `?reel`: the curtain in the first frame and all 150, 0 bare album
  frames, the view at +584 ms; soft from /help at 4x CPU (same document): curtain from the first album frame, 0 bare,
  the view at +2,745 ms; her Close drops `?reel` in place and the curtain with it; a newcomer meets the door's stage
  from the first frame, no curtain (`runs/reel-returning/summary.json`, `hard-after.png`, `soft-after.png`).
- **The failure sheet LOW:** "1 of 3 didn't upload / Everything else is waiting for approval." on the approve-each
  album (`runs/approve-refuse/failure.txt`, `05b-failure-sheet.png`); the develop words are pinned
  (`failure-sheet.test.tsx`, `guest-upload.test.tsx`).
- **The reduced-motion door LOW** (`--force-prefers-reduced-motion`, a newcomer's Continue): before, the closed stage's
  transition was `1e-05s` and opacity cut 1 to 0 in one frame (`runs/door-rm-before/summary.json`); after, `0.2s`,
  10 frames between 1 and 0 over 198 ms, hidden at 215 ms (`runs/door-rm-after/summary.json`).
- **The NITs:** the keep said "Your 3 uploads are waiting to develop, ..." with a clip among them and "Your 2 photos"
  for photos alone (`runs/develop-signal/result.json`, `runs/develop-clock/result.json`); the camera's "Shot 7 taken."
  and a refused shot's line never "on the roll" are pinned (`album-camera.test.tsx`, `words.test.ts`): no camera album
  stood to drive live (red-team 44 deleted them).
- **Test data:** Door flow probe (disposable, willg97's, its media all removed) had its `develops_at` set by SQL for the
  runs (two hours ahead then `now()` as a Develop now, twice; 100 and 110 s ahead for the clock) and restored to null
  (`sealed_from` null, no media written); name-only guest rows "crumbs-54 <run>" ride four disposable probes (Guest door
  tracker probe 3, Export wiring probe 2, Door flow probe 3, Reel lane probe 1); every upload was stood in, none reached
  R2 or a media row.
- Assets requested from Will: none.
- Board ideas: the host's own adds on her guest page's develop album (Deferred above).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Calls his to overrule:** the camera's "Shot 6 taken." / "Video taken." for guest and host; the failure sheet's
  "Everything else is waiting to develop, <time>." / "... waiting for approval."; the keep's shots / photos / videos /
  uploads; a guest's `?reel` behind the black; her tracker going with the develop; the host's Add on approve-each
  keeping its stack.
- **Look at first:** `runs/develop-now/` (the three phases on one open page), then `runs/reel-returning/`.
