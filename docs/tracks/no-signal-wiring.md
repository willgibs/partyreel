---
track: no-signal-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c04da309"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/guest/use-upload-queue.ts
  - src/lib/guest/use-upload-queue.test.tsx
  - src/lib/guest/use-upload-queue.heal.ts
  - src/lib/guest/use-upload-queue.heal.test.tsx
  - src/lib/guest/use-upload-queue.stop.test.tsx
  - src/lib/guest/unsent/
  - src/components/guest/upload/
  - src/components/guest/door/wait-picks-store.ts
  - src/components/guest/door/wait-picks-store.test.ts
  - src/components/guest/guest-upload.tsx
  - src/components/guest/guest-upload.test.tsx
  - src/components/guest/guest-upload.turn-card.test.tsx
  - src/components/guest/upload-step.tsx
  - src/components/guest/upload-step.test.tsx
  - src/components/guest/upload-tracker.tsx
  - src/components/guest/upload-tracker.test.tsx
  - src/components/guest/gallery-rows.tsx
  - src/components/guest/gallery-rows.test.tsx
  - src/lib/guest/camera/shots.ts
  - src/lib/guest/camera/shots.test.ts
  - src/lib/guest/camera/roll-view.ts
  - src/lib/guest/camera/roll-view.test.ts
  - src/lib/guest/camera/reel.ts
  - src/lib/guest/camera/reel.test.ts
  - src/lib/guest/camera/words.ts
  - src/lib/guest/camera/words.test.ts
  - src/lib/guest/camera/own-shots.ts
  - src/lib/guest/camera/own-shots.test.ts
  - src/components/guest/camera/album-camera.tsx
  - src/components/guest/camera/album-camera.test.tsx
  - src/components/guest/camera/album-camera.film.test.tsx
  - src/components/guest/camera/camera-reel.tsx
  - src/components/guest/camera/your-shots.tsx
  - src/components/guest/camera/remove-shot.ts
  - src/components/guest/camera/camera-roll.css
  - src/lib/upload/server-pipeline.ts
  - public/line.txt
  - supabase/migrations/20261008010000_roll_taken.sql
  - src/app/(dev)/design/sandbox/no-signal/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/no-signal.json
  - docs/systems/uploads-and-r2.md
  - docs/systems/guest-flow.md
  - docs/systems/disposable-mode.md
  - src/components/guest/camera/camera-screen.tsx
---

# lp/no-signal-wiring

**Goal.** A party with no signal as Will picked at no-signal r1: her unsent photos carried on her phone until each lands, a dropped line said where the send stands, and a Disposable's frame spent when she takes it.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3133 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-07; `docs/reviews/no-signal.json` round 1; the board's spec holds the platform facts, doc-checked):**
- **`carry=phone`:** a copy of each unsent file waits in this browser for this album (IndexedDB, as the held door keeps her picks: `door/wait-picks-store.ts`), whole, while the phone has room (a file it can't hold waits in the page, as today), and goes when the line is back or at her next open, by itself; the stack's x still stops one before it lands. "Back" is a request that answers, never `navigator.onLine` alone (it says online on venue Wi-Fi with no internet): a tiny static file (`public/line.txt`, no function runs) asked on `online`, on return to the page and every 20 s while one waits. Doc-check Safari's eviction and its seven-day cap before you promise anything in words: a promise says only what the keep holds.
- **`drop=standby`:** the moment the line drops mid-send, the stack keeps her photo, its bar giving way to a half-lit point and "No connection", its promise under it; the stand-in says it too; nothing opens. A file refused for a reason of its own (too large, a type) still ends in the failure sheet's Retry. On an album that waits (her host's yes, a develop), a waiting photo stands in her uploads, half-lit, "Waiting for your connection" (the carried `waits`).
- **`roll=taken`, Will's one-way door, answered:** on a Disposable, every press spends a frame at once, sent or not: the count steps down, the roll ends at 0 with its waiting shots on the reel, half-lit, and all of them land; no shot this phone took is refused for the roll. Keep CC4 (a host's removal spends a guest's shots) and the three re-shoots (camera-wiring's flat 3). Today a failed shot leaves the count (`shots.ts`'s `pendingSince`) and the server refuses shots past the roll on landing: decide what the server needs so a shot taken within the roll always lands (two phones of one guest may still overrun: say what happens then, plainly). Only if the roll's count needs SQL: **The migration, `supabase/migrations/20261008010000_roll_taken.sql`:** start from `create_media`'s newest definition in `supabase/migrations/` (never from memory) and follow `docs/systems/database-security.md`'s Workflow and checklist (grants revoked from public before they are granted exactly; the migration guards; its pre-flight on a throwaway local cluster). Prove it on the live schema inside `begin; ... rollback;` in one `execute_sql` call (that doc's recipe: the proof commented at the file's foot, RED then GREEN), and never apply it: the Orchestrator applies it through the Advisor and the protocol after your handoff, so your Handoff names the file's md5 and every caller. partyreel.com's live build (milestone 39) shares this database, so the change must leave that build working (an expand where a signature or behaviour changes; the header names what that build sees meanwhile: PROGRAM's "Before launch there are no real users").

**The board's carried calls, as taken:** every file kept whole while there is room; the next open sends by itself; the line check as above; no Android background send yet (a service worker for Android alone; iPhones have none); the Add's ring held still at what landed, with its count (its waiting look is the event-page board's, so change only its state, never its look: `shutter.tsx` and the dock are not yours).

**ROADMAP lines you meet (fold each your change reaches; quoted by their opening words):** "Lab exploration: a party with no signal" (now built: say so for its retirement); the two duplicate roll-of-1 lines ("You've taken all 1 shots"); "Clips: a guest's Add to event reads Added"; "Uploads: the same photo sent twice lands twice" (only if it falls out of your keep); "Guests: the held door keeps a choice on the device but never the camera's shots"; "what happened to my photos", after no-signal's carry; Immediate's "Code hygiene: five stale comments" for `server-pipeline.ts:544` alone.

**Keep stable:** the queue's `RunProgress` shape and its "active means queued or uploading" rule (the dock reads it), `use-upload-queue.heal.ts`'s interface (the host's `host-upload.tsx` shares it), and `camera-screen.tsx`'s props (its `recent` type comes from `reel.ts`); your camera states go in a new `camera-roll.css`, never `camera.css`.

**Retire the no-signal board:** delete `src/app/(dev)/design/sandbox/no-signal/` in your branch; the Orchestrator deletes its ledger at your record.

**Lanes running beside you (never edit their paths; a line you need there is an exception in your Handoff, with why):** brand-marks-wiring (`globals.css`, `theme.css`, the marks, `badge.tsx`), create-wizard-wiring-2 (Create, readiness, the checklist, `settings-rows.tsx`, the hub's `page.tsx`, the guest header and name menu), no-signal-wiring (the upload queue, `components/guest/upload/`, the roll's counting files), guests-room-wiring (`dashboard/[eventId]/guests/`, `guest-peek.tsx`), account-moments-wiring-2 (FollowButton, RelationToggle, Connections, `/me`, `u/[slug]/`), crumbs-91 (the album's order, the guest page, `event-experience.tsx`, `as-guest*`, Immediate's lines), and the boards event-page-r1 and brand-marks-r2 (their folders).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended, Will's to overrule.

- **What the server needs for `roll=taken`: nothing, so no migration** (`20261008010000_roll_taken.sql` unwritten).
  `create_media` counts her live shots at insert, and a phone that spends a frame per press, reads her roll as the
  album opens and counts every shot of hers no read holds never takes one past her roll, so each lands. Two phones (or
  two open pages) of one account can still overrun it, each counting off its own read: the shots past the roll are
  refused as they land (`roll_spent`, "You've taken all 24 shots on your roll."), on the failure sheet with no Retry,
  and her camera ends the roll (disposable-mode.md). Overrule: a shot a phone took within the roll it counted lands
  anyway (an allowance per device in `create_media`, a migration).
- **A file is carried until its bytes are up, never past them.** Its complete is then sent `keepalive` (it outlives a
  closed page and very likely records the row), so a copy carried on would go up whole again at the next open and land
  twice; a file whose complete lost its answer waits in its page alone, asking that complete again, and its pane says
  "Keep this page open". Overrule: carry the complete's request with the copy (Deferred).
- **What the phone kept for another identity is put down unread.** An opening page takes only what is filed under the
  identity it sends as (the device's ticket, or the host on her own album); another ticket's, or the host's on an album
  she does not host, is deleted unsent, and a kept file the server refuses as somebody else's (`session_other_account`)
  is put down, never re-sent as whoever holds the phone now. Overrule: keep them for their owner's next open (on a
  shared phone they would wait up to 14 days).
- **What waits opens only on her press.** A drop opens nothing; a press on the standby stack or its stand-in opens the
  whole send as the list popup (a panel at a desk, a sheet in hand: "Waiting for your connection", each photograph and
  where it stands, the promise in full), which closes itself once nothing waits. Overrule: the press does nothing.

## System-doc edits (in place, owned facts only)

- `docs/systems/uploads-and-r2.md`: the guest's queue never fails a file for the line (standby, `unsent/line.ts`'s
  check of `public/line.txt`, its cadence and backoff; the heal now the host panel's alone); the kept complete is the
  page's, so the keep carries a file only until its bytes are up; the camera's dropped shot said in the state's word.
- `docs/systems/guest-flow.md`: the stack's x stops a file standing by; the failure sheet's edge ignores a wait; a new
  line for a dropped line standing by where the send is (the stack, the stand-in, the waiting list, her uploads, the
  door's step, a pick added offline, a join that lost the line); a new line for the keep (`unsent/keep.ts`: copied,
  filed, re-filed, put down, restored once, one page a file, Safari's bounds); the send's toast once a wait has landed.
- `docs/systems/disposable-mode.md`: a new line, like film (`roll=taken`): a waiting shot stays counted, its reel, its
  caption and line, the roll's end, the server needing nothing, the read as the album opens (`useRollAhead`), what
  lands after a read counted on top, and two phones (or two pages) overrunning.

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Upcoming › Uploads, media and exports: Uploads: a file whose bytes went up but whose complete lost its answer waits
  in its page alone, so a reload there loses it ("Keep this page open" says so): the uploader's kept complete
  (`UNANSWERED`, by File) lives in memory; kept beside the copy, the next open could ask that complete again instead
  of sending the file whole (no-signal-wiring).
- Upcoming › The guest's album: Uploads: on an album that waits (her host's yes, a develop) a photograph waiting for
  the line stands in her uploads with no stop (the stack's x is a live album's), so one she no longer wants still goes
  when the line is back; a Stop on that row would take it back first (no-signal-wiring).
- Upcoming › The guest's album: Album: the photo viewer's chunk (`media-lightbox.lazy.tsx`) is fetched on a tile's
  first touch, so a first tap in a dead zone cannot load it (a ChunkLoadError on `pnpm dev`; a production build
  fetches it at that first open too); fetched once the album is idle, as the camera's is as it mounts, it would open
  with no line (no-signal-wiring).
- After launch › Uploads, media and exports: Uploads: Android's Background Sync (a service worker) could send what
  waits with the album closed; iPhones have none, so her phone's keep sends at her next open (no-signal r1's carried
  call, "not yet"; the retired lab line's last clause) (no-signal-wiring).

## Handoff (replaces the chat report)

- **Commits, pushed** (`lp/no-signal-wiring`): the work `12f709ad5` (the round), `b4b0ae77a` (a file carried only
  until its bytes are up; the walk's fixes), `bf4a4b410` (a camera first opened in a dead zone counts from the album's
  read of her roll: this lane's own red-team), `f3cb6d90e` (guest-flow.md's long lines wrapped); the syncs `60a81598b`
  (launch-prep at `f0623106f`: at the cut `calls.test.ts` "refuses the 31st entry" failed on the base), `f7626ec36`
  (`ec01d2013`: brand-marks-wiring and guests-room-wiring), `d6146b043` (`e86d51b49`: crumbs-91, which edited
  disposable-mode.md and guest-flow.md; merged clean); this manifest the head. launch-prep has since moved by records
  alone (`1c22b8d99`, `9c426f75f`).
- **Gates on `f3cb6d90e` (the synced tree), each its own exit code** (logs `_scratch/no-signal-wiring/gate4-*.log`):
  `zsh scripts/build-lock.sh pnpm typecheck` 0; `pnpm lint` 0; `zsh scripts/build-lock.sh pnpm test` 0 (1119 files,
  14298 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3133` 0 (180 checks,
  0 failing); no board, so no lab:demo.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file, and these exceptions:
  the three system docs (the facts above); `src/components/guest/camera/camera-screen.tsx` (a read: one import, one
  doc line, and its hint's dropped branch saying `shotsWaitingLine` where no Retry could pass; its props unchanged).
- The queue stands a drop by (`drop=standby`): `use-upload-queue.ts`'s `standBy` holds a file the line ended `queued`
  with its cause (`unsent/standby.ts`'s `waitsForLine`), the runner leaves it, and `sendWaiting` sends it on the line's
  return; what she adds offline, and a first pick whose join lost the line (`joinLostTheLine`), stand by too; the
  `RunProgress` shape and "active means queued or uploading" kept, the heal's interface kept (`host-upload.tsx` alone).
- The line (`unsent/line.ts`, `public/line.txt`): a request whose words must come back (a venue's sign-in page never
  reads as the line), 5 s after a drop then every 20 s, at once on `online` and her return, never while the phone says
  offline; a send that drops again backs off 40 s, 80 s, 160 s, then 5 minutes (`releaseGap`), a landing resets it.
- The keep (`carry=phone`; `unsent/keep.ts`, `unsent/use-keep.ts`): IndexedDB `partyreel-unsent`, a record a file,
  filed under the album and who it goes up as, put down when it lands, stops, is refused or its bytes are up, restored
  once as a page opens and sent by itself under its own ids; one page a file (Web Locks); 14 days. Safari doc-checked
  (WebKit's storage policy: script-written storage deleted after 7 days of Safari use with no interaction on the site,
  a home-screen app exempt; eviction under pressure; a private tab's gone at its close), so the words say only where
  the copy is.
- The standby surfaces: the stack's pane (`stack-tile.tsx`: Standby's half-lit point, `upload/wait-point.tsx`, "No
  connection", "Kept on this phone" or "Keep this page open"), the stand-in (`sending-stand-in.tsx`), the waiting list
  (`upload/waiting-sheet.tsx`, `Popup kind="list"`), her uploads' row (`upload-tracker.tsx`), the door's step
  (`upload-step.tsx`), the failure sheet's edge (`guest-upload.tsx`); words in `unsent/words.ts`.
- Like film (`roll=taken`): `shots.ts` counts a waiting shot; `album-camera.tsx` reads her roll beside waiting shots
  (`unread`), counts her shots another camera or an earlier page took (`elsewhere`), on their way or landed since the
  read (`landed`), and counts from the album's read as it opened (`own-shots.ts`'s `useRollAhead`, wired in
  `guest-upload.tsx`); the reel's waiting frame half-lit and still (`camera-reel.tsx`, `camera-roll.css`), the caption's
  "· 2 waiting", the line under the shutter, the roll's end saying the wait first, Your shots' waiting row.
- The no-signal board retired: `src/app/(dev)/design/sandbox/no-signal/` deleted (15 files, nothing imported them);
  `docs/reviews/no-signal.json` is the Orchestrator's.
- Walked on :3133 at 375 and 1440 in a headless Chrome of my own (`_scratch/no-signal-wiring/rt/`: `standby-375.png`,
  `standby-1440.png`, `standin-375.png`, `waits-375.png`, `waits-1440.png`, `tracker-375.png`, `cam-waiting-375.png`,
  `cam-shots-375.png`, `cam-ahead-deadzone-375.png`): a send cut mid-PUT stands by and lands on the line's return, the
  backoff's 5 s, 40 s, 80 s on a blocked bucket, a tab closed in a dead zone sends at the next open (two tabs never
  send one file), and a camera first opened offline after 3 landed shots said "Frame 4 of 24", 21 left (the DB: 4
  rows after one more shot in the dead zone landed). ★ **A slip:** the kit's `redteam/lib.mjs` defaults `APP` to
  `http://localhost:3000`, so device G9 joined "Roll ahead" and shot 3 through Will's desk server (22:47 to 22:56Z,
  about 355 requests, on this lane's own disposable event alone; closed at once, every later step on :3133).
- ROADMAP lines: "Lab exploration: a party with no signal" is built (retire it; its Background Sync clause is the
  After-launch line above); "Code hygiene: `server-pipeline.ts:544`'s comment" is done (the `captured_wall` comment
  names each strategy's zone); the two roll-of-1 lines ("You've taken all 1 shots", crumbs-90's and settings-wiring's)
  stay, since `roll=taken` needed no SQL, and say one thing (merge them); "Clips: a guest's Add to event reads Added"
  not reached; "Uploads: the same photo sent twice" not folded (the keep sends a file again under its own id, never
  twice; a re-pick is a new file); "Guests: the held door keeps a choice on the device but never the camera's shots"
  stays (`unsent/keep.ts`'s records, one a file, could now hold them); "what happened to my photos" is unblocked.
- Test data, all willg97's and in his Deleted (`deleted_at` set): "no-signal-wiring (disposable) Live"
  `c7f67de6-7384-4911-82e9-2511c5852e9f` (15 media), "… Dispo" `dd382b5c-99ef-4b46-a43b-3961e66c8f64` (4), "… Roll
  ahead" `092b272b-31f7-48e4-9996-0ece57f2d2ec` (7); the walk's Chrome profiles and captures in the scratch folder.
- Assets requested from Will: none.
- Board ideas: one state point for every surface (brand-marks-wiring's `StatusPoint`): `upload/wait-point.tsx` draws
  the Badge's Standby point standalone, the same 8px half-lit point in the word's ink; and the kit's `redteam/lib.mjs`
  refusing a walk with no `APP` (its :3000 default is Will's desk; the slip above).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (`public/line.txt` is a static file the CDN
  answers; the proxy's matcher never takes it on the app host).
- Calls for Will: what waits is kept on her phone 14 days (`UNSENT_KEEP_DAYS`), then put down unread at the next
  open (Safari may take it sooner); on a shared phone what was kept for another identity is deleted unsent; the line
  is asked 5 s after a drop, every 20 s while anything waits, and a send that keeps dropping waits up to 5 minutes
  between tries; a guest holding a ticket on a Disposable album costs one more own-roll read as the album opens.
- Look at first: a Live album at 375, three photos sent and the line cut mid-send: the stack's "No connection", "Kept
  on this phone", a press on it (the waiting list), the line back; a Disposable album in a dead zone: the count, the
  reel's half-lit frame, "Frame 5 of 24 · 1 waiting", the roll's end at 0; a tab closed in the dead zone and opened
  again online: what waited goes by itself and its toast says it landed.
