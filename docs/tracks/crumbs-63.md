---
track: crumbs-63
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "9d7475e7"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/reel/
  - docs/systems/reel.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/shared/media-lightbox.tsx
  - docs/systems/design-system.md
---

# lp/crumbs-63

**Goal.** Will's reel note: a tap anywhere on the reel shows or hides its controls exactly like the always-visible bar (auto-rest after idle, a pointer's movement still brings them up), and never opens the photo viewer.

## The brief

**Will's note (2026-10-04), in his words, because the wording is the point:** "I'd like to remove the 'click to open current photo in lightbox' from the reel. it's really confusing UX, as I intuitively click (both on desktop, or mobile tap) to open the reel controls back up, then it takes me into the lightbox even deeper, then i click x on the lightbox thinking i'm closing the reel, then i'm back on the reel so i tap and end up in the lightbox, and it's crazy confusing having to only tap that little always-visible UI bar to open the reel controls, easy to get lost. let's make taps do the same as tapping that always-on control, so it's very intuitive for on/off hide (also auto hides after no cursor movement for a bit, and still shows on cursor movement too)"

**What ships:**
- A click or a tap anywhere on the reel's picture does exactly what pressing the always-visible bar does: the controls come up, and a second tap puts them away. The picture never opens the photo viewer.
- The controls still rest on their own after a few idle seconds (today's pointer and touch timings in `live-reel-view.tsx`), and a pointer's movement still brings them up. A tap that lands on a control acts on that control and never toggles the chrome underneath it.
- Every way the reel is shown keeps the same rule: the guest's reel, the host's full-screen reel, the room's screen (`?reel=screen`), at 375 and 1440, mouse and touch, reduced motion honoured.
- Keyboard: whatever the reel answers to today keeps working; say in your Handoff what Space, Enter and Escape do after the change.
- The viewer's code in the reel (`openLightbox`, its origin frame, its state) leaves if nothing else opens it; if a control in the dock already opens the current photo, it stays; never add one. Say which in your Handoff.
- The tests that pinned the tap opening the viewer are reshaped on purpose, each keeping its real scar and saying which reason expired (Will's note).

`docs/systems/reel.md` takes the rule in place (the tap toggles the controls, never the viewer). Small and direct: no board, no migration.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and listed again under the Handoff's calls as his to overrule.

- **Does a mouse's click hide the controls that the pointer's own movement just brought up?** Recommended: yes. The click is the bar's own press, which toggles (his words: "very intuitive for on/off hide"), and any movement brings them back, so a click and then a still hand is the clean picture. The other answer is a click that only ever shows them, which leaves a mouse nothing to put them away with but waiting.
- **Does the press that dismisses an open menu also put the controls away?** Recommended: no. One press, one effect, as a popover is dismissed everywhere else; the next press on the picture is a tap again.
- **Does a control pressed with a pointer keep the dock up until the viewer presses somewhere else?** Before this lane it did: any focus inside the dock held it up, and a press leaves its control focused, so in Chrome the dock never rested again after Pause then Play (`desktop.out`, step D5b: `restedAfterMs: null`, still up at 9 s). Recommended: no. Only a key's focus (`:focus-visible`, the Tab that walks the controls) holds it, so "auto hides after no cursor movement for a bit" is true after a control was used too; and the focus moves to the view when the dock goes quiet, or Space and the arrows would stop reaching it (`inert` drops a focused control onto `body`).

## System-doc edits (in place, owned facts only)

- `docs/systems/reel.md`, "The chrome" bullet: what brings the dock up and what rests it (the key-focus pin), with two ★ lines under it (a tap on the picture is the bar's press through the one `toggleChrome`, the picture a sibling of every control, a menu's dismissing press only that, the screen pill's press its own; the focus that moves to the view when a half of the pane goes inert); the dock's keyboard line (any other key brings the controls up); the old "a tap opens the viewer" bullet cut to the facts that stay (reduced motion's first frame, the seam, the failure reports).

## Deferred (ROADMAP one-liners, bucket named)

- Now, Code hygiene: the reel no longer opens the photo viewer, which leaves its reel-only seams with no caller outside their tests: `media-lightbox.tsx`'s `ViewerOrigin` kind `"reel"` (:131, with the flight and focus words at :76, :123-125, :920 and :1033) and its `startAt` prop (:463, :510, :580, :661, :837-842), held by `media-lightbox.test.tsx` :489, and `player-live.tsx`'s `moment()` and `LiveReelMoment` (:102-112, :458-520), held by `player-live.test.tsx` :509-519 (from `crumbs-63`).
- Now, Code hygiene: the `creatorAsked` line (from `crumbs-53`) cites `live-reel-view.tsx` :168-170 and :560-578; they are :166-168 and :542-560 now.

## Handoff (replaces the chat report)

- Commits, pushed to `origin/lp/crumbs-63`: `d962bd75` (the change: `live-reel-view.tsx`, its tests, `reel.md`) and `f03c9bd5` (the reshaped tests' comment, naming which reason of each of the four expired), then this manifest alone; the head is in the chat line. No sync: `launch-prep` moved only by records since the cut (now `c311edb9`: `docs/ROADMAP.md`, `docs/STATUS.md`, `docs/tracks/*`), and none of `reads` changed.
- Artifacts: the scratch folder `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-63/` holds the logs (`typecheck.log`, `lint.log`, `test.log`, `build.log`, `smoke.log`), the real-Chrome walks (`desktop.out` before the focus fix, `desktop3.out` after; `mobile.out`, `desktop-reduced.out`, `mobile-reduced.out`, `screen.out`, `abuse.out`; the drivers `cdp.mjs`, `desktop.mjs`, `mobile.mjs`, `screen.mjs`, `abuse.mjs`) and `shots/`; it is pruned with the lane.
- Gates, each on its own exit code, on the tree committed as `d962bd75` (the one later commit is a test comment): `pnpm typecheck` 0, `pnpm lint` 0 with no warning, `pnpm test` 0 (877 files, 10,562 tests), `zsh scripts/build-lock.sh pnpm build` 0, `pnpm lab:smoke --base http://localhost:3133` 139 checks, 0 failing (scope: the Library and the shell; no board is touched). No `lab:demo`: no board. After `f03c9bd5`: the reel's two test files 87 passed, eslint on `src/components/guest/reel/` 0.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/systems/reel.md`, `src/components/guest/reel/live-reel-view.test.tsx`, `src/components/guest/reel/live-reel-view.tsx`, and this file; no exception.
- The items:
  - A click or a tap anywhere on the picture is the bar's own press: the controls come up, the next one puts them away, and the picture never opens the photo viewer (`onPictureClick`, `toggleChrome`, `live-reel-view.tsx`). The bar, the timeline and the picture share the one toggle, so they cannot drift.
  - The rests are today's: 2.4 s after a pointer, 4.2 s after a touch (the touch read off the pointerdown, since not every engine types a click; a click no pointer made, `detail` 0, gets the touch's), and a mouse's or pen's movement still brings the dock up; a finger's never does. Measured in real Chrome: `desktop3.out` D2 (up at 7590 ms, rest at 9989 ms) and D3b; `mobile.out` M2 (up at 7720 ms, rest at 11920 ms).
  - A press on a control acts on that control only: the picture is a sibling of every control, so nothing reaches it (`desktop3.out` D5, `mobile.out` M5, `abuse.out` A3; pinned by a test that fails if the handler moves up to the view). The screen pill's press anywhere is still the pill's alone, and after it a tap is the chrome's like anywhere (`screen.out`).
  - The viewer's code in the reel is gone: `openLightbox`, `closeLightbox`, the origin frame, `startAt`, `lightboxIndex`, `viewerFrom`, `viewerIds` and its links callback, `LikesProvider`, `MediaLightboxLazy`, `onScreenRef`, `pictureRef`. No control in the dock ever opened the current photo and none was added; the creator still gets the album's playable items (renamed `creatorItems`).
  - Keyboard, after the change: Space pauses and plays when the view has the focus (on a focused control it is that control's own press), and the arrows step; Enter, like any key but Escape, brings the controls up and does nothing else (on a focused control it is that control's press); Escape closes the reel (the creator closes first when it is open). None of them ever opened the viewer; none changed. Focus now stays on the view when the half of the pane it was in goes inert, so these keys keep working after a pointer pressed a control (`desktop3.out` D5c).
  - A press that begins over an open menu only dismisses it, for a mouse and for a touch (`desktop3.out` D6, `mobile.out` M7).
  - Only a key's focus holds the dock up (`:focus-visible`), so the controls rest on their own after a control was pressed too (`desktop.out` D5b before: never; `desktop3.out` D5b after: 2.43 s).
  - Reduced motion: the reel starts paused with the dock up, the dock never rests by itself, and a tap still folds it away on purpose and brings it back (`desktop-reduced.out` D3, D3b, D9; `mobile-reduced.out` M3, M4; the unit tests).
  - Tests: the four that pinned the tap opening the viewer are reshaped on purpose (the comment above the new `describe` says which reason of each expired and where the scar went: a tap never pauses the reel or mounts anything over it); new ones pin the toggle, the two rests for the bar and the picture alike, the controls, the menu, paused, reduced motion, the screen, Enter, the key-focus pin and the kept focus; each was mutation-checked (a variant that never folds, puts the handler up on the view, also pauses, drops the menu guard, reads every touch as a pointer, pins on any focus, or drops the focus move fails the matching test).
  - `reel.md` takes the rule, the sibling rule, the key-focus pin and the focus landmine in place.
- Verified and not: real Chrome over CDP (a headless Chrome of my own, `--disable-web-security` only so the pictures draw on localhost) at 1440 with a mouse and at 375 with real touch events, reduced motion, `?reel`, `?reel=screen`, the Style menu, rapid presses (`abuse.out`: twenty clicks end at parity, a drag releases to a click, the invisible Close spot is the picture, no page exception, no console error), on the demo event's guest page. NOT driven: the host's own reel (the same component with `isOwner`; its only door is the alias's sign-in), the live alias (no `lp/*` deploy exists for a lane), and iOS Safari or a real phone (this Mac has no full Xcode, so the simulator tool refused; the double-tap rule, `touch-action: manipulation` on the picture, and the click's typing there are unmeasured).
- Assets requested from Will: none
- Board ideas: nothing in the reel opens the photograph any more, so a guest watching has no way to see the picture on screen large, Share or Save it, or like it without closing the reel and finding it in the album; if that is wanted it is a design question for a board (a dock control would be new chrome), never a quiet button added here.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each:
  - A mouse's click hides the controls that its own movement had just brought up (the click is the bar's press, which toggles; movement brings them back); a drag that starts and ends on the picture counts as a click, as browsers fire it, with no slop check.
  - A press that dismisses a menu does not also put the controls away.
  - A pointer's press on a control no longer holds the dock up (only a key's focus does): beyond the tap itself, taken so "auto hides after no cursor movement for a bit" holds after a control was used.
  - `touch-action: manipulation` on the picture, so a quick second tap is a second tap (hide again) and not the browser's double-tap zoom.
- Look at first: on the alias, the guest's reel at 375 and 1440 and `?reel=screen`: a tap or click on the picture shows then hides the controls, a press on a control does only its own act, Style open then a press on the picture closes only the menu, Pause then idle and the dock still rests, and Space still pauses after that. Then, with Will's phone, the double-tap and Space/Enter (iOS Safari is the unmeasured one). In the diff: `toggleChrome`, `onPictureClick`, the view's `onPointerDownCapture` and `pressRef`, `keyFocus`, and the `useLayoutEffect` that moves the focus (all in `live-reel-view.tsx`). `lab-scope` prints a PREMISE note that `the-wait`'s open ask `arrival` lists `live-reel-view.tsx` in its `lives`: this lane touched the tap and the focus, not the arrival chrome that ask draws, so the note should clear at a re-read.
