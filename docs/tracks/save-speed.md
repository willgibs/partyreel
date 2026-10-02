---
track: save-speed
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "34dba1fa"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/media-lightbox
  - src/lib/media/share-save
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - src/app/api/album/guest/
  - src/lib/db/queries/album-guest.ts
  - src/lib/r2/
  - docs/systems/uploads-and-r2.md
---

# lp/save-speed

**Goal.** Make the viewer's Save feel immediate: find what kept a ≤5 MB photo's Save 'preparing' for about 30 seconds on Will's iPhone, fix it at its cause, and give every slower step clear state and a way out.

## The brief

**Why.** Will's live walk on the alias, 2026-10-02 (iOS 26, Chrome 154 on WebKit, Wi-Fi), on the demo album: "opened the snowy mountain photo, tapped 'save' icon; waited for a good 30 seconds before the looping/loading icon stopped and switched to 'ready', which on click opens the share sheet. absolutely terrible experience waiting 30 seconds for a single image, this will be a huge complaint if not corrected to feel immediate. can't imagine the wait for bulk selecting multiple photos to download." And after it: "If it's not a file size problem causing that 30 second delay, then we absolutely need to find what's causing such a huge break in good UX. Everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility."

**What is known.** The demo album's originals are small (nine items: median 0.3 MB, largest 5.2 MB), so the bytes do not explain 30 seconds; the stall is in the path. The flow today (`media-lightbox-parts/actions.tsx`, `src/lib/media/share-save.ts`): the first tap fetches `item.downloadUrl` (an R2 presign) as a File (`fetchMediaFile`: `mode: "cors"`, `cache: "no-store"`), the button turns "ready" because the tap's user activation has lapsed, and a second tap opens the share sheet. The viewer already holds the photo on screen from a different URL (its display derivative).

**What to do.**
1. **Find the cause, measured, before changing anything:** every step's time from the tap to "ready" (the links read that carries `downloadUrl`, the presign's age and headers, R2's first byte and its whole body, CORS, `no-store` against a cache that already holds the bytes, the File and `canShare` work, anything that waits on a timer). A headless Chrome of your own at a phone's size on the alias and on your dev server; WebKit's own behaviour where you can reach it. Name the cause in your Handoff with the numbers.
2. **Fix it at its cause, and make Save immediate**, for example the original fetched as the photo opens (so the first tap shares at once where the platform allows), the right file for the act, and no duplicate download of bytes already held. Every step that can still take time shows its state (progress, not a bare spinner) and can be cancelled; leaving the photo cancels its work.
3. **Many at once:** say what the same path costs for a selection of many (his "bulk selecting multiple photos to download") and fix what your cause implies there, within your files.

**Boundaries.** The links route and the album's queries are the disposable foundation's in this round (`src/app/api/album/guest/`, `album-guest.ts`): if the fix needs the server (a different presign, a share-size derivative, headers), write it under Questions as a precise change for the next lane rather than editing them. A separate design board will ask how guests and hosts take photos home (a one-press Download all, Select all, an optimized download), so change no product shape here: only make what exists fast and honest. System doc: `uploads-and-r2.md` is the disposable foundation's while it runs, so write its Save lines (as they should read) in your Handoff under System-doc edits and the Orchestrator places them at your record.

**The direction** (Will, 2026-10-02): "Everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility." A modern consumer app, cool to 18 to 50, never a tool.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3135`; the measured timings before and after (a table: each step, ms) in your Handoff from a headless Chrome of your own at 375 on the alias and on your dev server; Will's phone is the final check, named in your Handoff with the exact steps for him.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Desk and Android Save of a photograph the viewer holds: from memory, or the signed link?** Recommended and
  built: from memory (the same file under the server's name, at once, never downloaded twice; md5-identical to R2's
  object in `_scratch/save-speed/downloads-desk/`); the link stays for a clip and for a photograph not held yet.
- **A clip beside the photograph on screen waits for that photograph's original** (`preload="none"`, then
  `"metadata"` as before) because iOS reads a neighbour's metadata as the whole clip. Recommended and built: wait;
  the cost is that a swipe onto that clip in the first second starts it a beat later.
- **A tap before the bytes land, on a link slower than five seconds, still ends in "Ready" and a second tap**
  (WebKit opens a sheet only within 5 s of the tap; no page can extend it). Recommended and built: keep the honest
  word; the ring that fills before it is the new part.
- **For the next lane (the disposable foundation's routes, no change of mine): R2's S3 endpoint speaks HTTP/1.1
  only**, so every R2 read on a page shares about six connections. A read Worker at the edge (HTTP/2, signed like the
  export Worker) would lift that ceiling for tiles, the viewer and the reel. Recommended: not now (Save no longer
  waits on it); it refines ROADMAP's large-gallery read line (Deferred below).

## System-doc edits (in place, owned facts only)

`uploads-and-r2.md` is the disposable foundation's and `guest-flow.md` a read, so these are the lines as they should
read, for the Orchestrator to place:

- `uploads-and-r2.md`, R2 and presigns, a bullet after "Configured outside the repo": "- ★ **R2's S3 endpoint speaks
  HTTP/1.1 only** (`curl --http2` negotiates 1.1), so every R2 read a page makes (tiles, the viewer's originals, a
  clip's ranges, the light's samples, a Save) shares about six connections to one host, CORS and no-cors alike (iOS
  26.5 WebKit carried an `<img>`, a clip and a CORS fetch on one connection). What loads first is a choice the
  viewer makes (below)."
- `uploads-and-r2.md`, "A CORS read of a tile-shared presign bypasses the HTTP cache", its third sentence: "The reel
  engine's asset loader and video window reader, and the viewer's held originals and its tap reads (Share, Save),
  fetch with `cache: "no-store"`, and so does any new CORS reader of gallery presigns."
- `uploads-and-r2.md`, "Tile previews are made in the browser at upload", its last sentence: "Tiles serve
  `previewUrl ?? url` (an `onError` falls back to the original); the viewer draws the original and Save and Share
  send it (below); a row with no preview serves the original, which the viewer then draws from the tile's cached
  copy rather than holding it twice."
- `uploads-and-r2.md`, a bullet after "Save is a signed download": "- ★ **The viewer holds the original it draws,
  and Save and Share send those bytes** (`lib/media/share-save-held.ts`, save-speed: Will's iPhone sat 30 s on
  Save, then asked for a second tap). A photograph with a preview has its original read once (CORS, `no-store`) and
  drawn from an object URL, and a tap hands that file to `navigator.share` with no await before it: WebKit opens a
  sheet only within 5 s of the tap (measured 5,023 ms), and the old read on the tap, a second copy of the original
  the viewer had just drawn, queued behind the viewer's own loads, was the whole wait. The photograph on screen
  loads first, its neighbours after it, two at once, and a neighbouring clip asks for nothing until the centre is
  held, since iOS reads a neighbour's `metadata` as the whole clip; a slot that lets go aborts after a short grace;
  held files nobody draws stay inside 64 MB, oldest out first. A clip is never held: its Save reads on the tap,
  drawn as a ring with a stop. Anything it cannot hold (over 32 MB, a body quiet for 15 s, a refused read) is drawn
  and saved the plain way, and two refused reads before any success (an origin R2's CORS does not list, localhost
  among them) turn holding off for the page."
- `guest-flow.md`, the viewer's bullet: "★ **SHARE SENDS THE FILE** (a photograph's is the original the viewer
  already holds, so the sheet opens inside the tap; a clip's is read on the tap, its progress drawn and stoppable,
  over 100 MB falling back: [uploads-and-r2.md](uploads-and-r2.md)), then the link, then a copy; ... a file that
  lands after the tap's activation lapsed leaves a one-tap Ready." (the rest of the bullet as it reads)

## Deferred (ROADMAP one-liners, bucket named)

- Major overhauls, Vercel / Next.js optimization: refine "A large-gallery presigned-read strategy (per-media proxy
  or pagination beyond the stable buckets)" in place with ", where a read proxy at the edge would also lift R2's
  HTTP/1.1 ceiling of about six connections a page (measured, save-speed)".

## Handoff (replaces the chat report)

- **Commits, pushed:** work `16a264a2` and `bc90f053`; sync `07aa7528` (origin/launch-prep `9f4a7d90`, which
  brought header-wiring's merge into my read `guest-flow.md`); the head is in the chat line.
- **Gates on the synced tree at `07aa7528`**, each its own exit code: `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test`
  0 (766 files, 9,083 tests), `zsh scripts/build-lock.sh pnpm build` 0, `pnpm lab:smoke --base
  http://localhost:3135` 0 (134 checks; it reached the event-header and identity boards through the viewer's
  imports; `lab:demo` on both found no open step). Logs: `_scratch/save-speed/gate2-*.log`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the nine owned paths under
  `src/components/shared/media-lightbox*` and `src/lib/media/share-save*`, plus this file. No exceptions.
- **The cause, measured** (harnesses and logs in `_scratch/save-speed/`: `measure-chrome.mjs`, `measure-webkit.mjs`,
  `wir_measure.py` and `wir_cors.py` driving the iOS 26.5 Simulator's Safari over its web inspector): the snowy
  mountain is `98643ee7`, 294,018 bytes, so the bytes never explained it. Save's file was a SECOND download of the
  original the viewer had just drawn (a CORS read with `no-store`, so the drawn copy could not serve it), started
  only on the tap, sharing the link with the viewer's own downloads (the photograph, its neighbour and, on iOS, the
  next clip whole: `9a24d46b`, 2.8 MB, buffered 0 to 5.76 s at `preload="metadata"`, `wir_videos.py`) over R2's
  HTTP/1.1 connections (one pool: `wir_pool.py`); the sheet needs the tap's activation, which WebKit keeps 5,023 ms
  (`wir_activation.py`); the code waited out the whole download behind a bare spinner, then asked for a second tap.
  On a desk's link that download is 0.3 s; on a 3G-class link it is 24.2 s then Ready, the shape of his 30 s (his
  Wi-Fi at that moment is the one number not reachable from here).
- **Timings** (the snowy mountain, ms after the Save tap's click, headless Chrome of mine at 375, iPhone UA). Before
  = launch-prep on the alias; after = this branch on my dev server, its Chrome's own CORS check off because R2
  answers no localhost origin (the bytes and the link are R2's own).

  | Link · when the tap comes | Before: first byte · whole file · sheet | After |
  | --- | --- | --- |
  | Desk · photograph sharp | +116 · +323 · sheet +323 | no read; sheet +0 (in the tap) |
  | Slow 4G · photograph sharp | +576 · +3,516 · sheet +3,516 | no read; sheet +1; sharp 2,089 after opening (was 4,374) |
  | Slow 4G · as the capsule lands | +581 · +5,854 · Ready +5,856, sheet +6,349 on a second tap | ring 0 to 100% on the viewer's one read; sheet +1,498, one tap |
  | 3G · photograph sharp | +2,061 · +13,791 · Ready +13,793, sheet +14,324 | no read; sheet +1; sharp 7,945 after opening (was 17,728) |
  | 3G · as the capsule lands | +2,114 · +24,168 · Ready +24,169, sheet +24,635 | ring; Ready +7,378 (past 5 s), sheet +7,851 |

  iOS 26.5 Safari in the Simulator (real WebKit, real sheet): before on the alias, first byte +122, file +235, sheet
  +235; after on my dev server (R2's bytes served through the inspector, R2 listing no localhost): held, the real
  sheet with Save Image at +3 (`sim-held-settled-real.png`); an original 3 s late, the ring then the sheet at +2,924
  in one tap (`sim-held-waiting.png`); 7 s late, Ready at +6,952 and the sheet on the second tap
  (`sim-held-ready.png`). macOS WebKit (Playwright's build): +194 before (`a85286c6`), +1 after.
- **Many at once:** the bulk path is the zip Worker, a top-level download with no activation and no per-file read,
  so this cause does not reach it (on iOS it lands a .zip in Files, the coming board's question). The per-file
  path for a selection would pay this cause N times: N full reads after the tap on six connections, past 5 s for
  any real selection (twenty 3 MB photographs: about 10 s at 50 Mbps, 48 s at 10), so always a long wait and a
  second tap. What my cause implies there is built into the store: originals the viewer has drawn are held (64 MB
  unused), wanted by id and awaited by id, so a "save many" that board picks starts from bytes in hand and reads the
  rest once, with one progress and one tap.
- Items:
  - `lib/media/share-save-held.ts` (new): the page's held originals: once per photograph, the centre first,
    neighbours after (two at once, a microtask late so a commit's left slot cannot jump the queue), released downloads
    aborted after a grace, held files inside a budget, plain for anything it cannot hold, off after two refusals.
  - `lib/media/share-save.ts`: `fetchMediaFile` streams with progress, ends a body quiet for 15 s as `stalled`, says
    why it failed, takes a priority; `saveToPhotos` and `shareMedia` take a held `file` and reach `share()` with no
    await before it.
  - The viewer: draws the held object URL (never the link while the bytes come, the ring kept by
    `data-lightbox-holding`), holds a neighbouring clip at `preload="none"` until the centre is held.
  - The capsule: Save and Share open the sheet inside the tap on a held file; a tap before the bytes land waits on
    the viewer's own read (a ring with a stop, its percent in `data-lightbox-progress`, a tap stops it); a clip
    reads on the tap with the same ring; the other act takes a wait over; a desk saves a held file from memory.
  - Tests: `share-save.test.ts` (stream, cap, stall, priority, a held file shared synchronously),
    `share-save-held.test.ts` (19: the order, the grace, the budget, plain, off, the commit's re-mount),
    `media-lightbox.test.tsx` (11 wiring pins over a store the test drives); two pins reshaped (the ring's sheet
    rule gains the holding marker; a failure says why).
- Assets requested from Will: none.
- Board ideas: the album's light samples every tile's preview with a second, `no-store` read at load (nine reads on
  the demo, the `Fetch` previews in `_scratch/save-speed/chrome-alias-all.json`), on the same six connections;
  sampling the painted tiles (or a shared read) would take it off the link.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the desk's Save from memory; a neighbouring clip waiting for the centre; "Ready" kept past 5 s.
- **Will's phone, the final check** (on the alias once it carries this branch, Chrome on his iPhone, Wi-Fi): open the
  demo album, Continue, Look around; open the snowy mountain (the fifth tile) and once it is sharp tap Save: the sheet
  opens at once, Save Image puts it in Photos; open the next photograph and tap Save the instant the capsule shows:
  the Save glyph becomes a ring with a stop that fills, and the sheet opens by itself; tap Save on a clip and then
  tap the ring: it stops. A wait he still sees: its ring tells us where the time went (stuck at the start is the
  link's first byte, a slow fill is the link).
- Look at first: `src/lib/media/share-save-held.ts`, then `onSaveToPhotos` in
  `src/components/shared/media-lightbox-parts/actions.tsx`.
