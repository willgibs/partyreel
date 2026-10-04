---
track: crumbs-66
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "0b83614f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/events/visibility-labels
  - src/components/guest/event-experience-head.tsx
  - src/components/app/dashboard/events-section.tsx
  - src/components/app/event-feed/hub-reel
  - src/components/guest/reel/live-reel-view
  - scripts/compute-model/run.mjs
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/crumbs-66

**Goal.** Small fixes from red-team 53b and the round's deferred lines: the door's honest words in the hub, the album cover's sharp photos, Reset's focus, the hub reel's develop words, and the compute harness's join wait.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the alias, partyreel.com or any *.vercel.app (Hobby's Active CPU). Port 3000 is Will's desk.

**The fixes**, each pinned by a test that fails on the old code:
1. **Red-team 53b's NIT, copy:** the hub's "What a guest needs" list says "Anyone with the link or the code comes in." even when the door asks for a confirmed email, where Settings says "after confirming an email" (`src/lib/events/visibility-labels.ts`, `DOOR_STEP_LINES.public`). Say what the door really asks, from the same facts Settings reads.
2. **Red-team 53b's NIT, images:** the album header's rotating cover photos are 640 px files stretched to full width with no `srcset` (`event-experience-head.tsx`). Serve the size the screen needs from the variants that already exist (`docs/systems/uploads-and-r2.md`: the phone copy and previews). Never a new image transform: Vercel's image optimizer bills, and the compute budget counts every call.
3. **The Display quiet line's Reset** (`events-section.tsx`) drops the focus to the body, as the menu's did before crumbs-65; hand it to the Display button on its press.
4. **The hub's reel before the develop** says nothing of the develop. Its dock says "Guests get it at the develop." (the prop is `live-reel-view.tsx`'s, the wiring `hub-reel.tsx`'s, the time the Reel card's `developsAt`).
5. **The compute harness:** `pnpm compute:model`'s first scenario after its warmup (guest-join-upload) can time out at the door's name step in a full run, and an errored scenario leaves its phones polling under the next scenarios' labels. Harden the join's wait and close a scenario's devices on error (`scripts/compute-model/run.mjs`).

Wiring rigor (these ship): the whole gate. The board check is `lab:smoke` only, since no board changes.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule (the same lines stand under the Handoff's calls).

- **Is the album's cover made sharper from the phone copy? Recommended: not in a crumb; nothing built.** The cover's six
  stills are the 640 px previews because that is all the album's wire carries for a photograph besides the original: a link
  answer is `[id, tile, view, download, who]` (`AlbumLinkTuple`, `album-wire.ts`), `readGuestAlbumMedia` and the host's twin
  select `original_key, preview_key` and nothing else, and `phone_key` is read by exports and purges alone. A `srcset` of
  preview and phone copy would need the phone link on the wire for the cover's ids (the page's seed, `useCoverStills`,
  the hub's `reelCoverStills` and `newestCoverStills`, the link store, both links routes), and the phone copy is the wrong
  size for it: 2048 px, 327 KB on average in the test data (299 KB median; 182 of 3,445 photos have one, only uploads
  since 2026-10-03), so every 2x phone would fetch six of them, about 2 MB and nearer 4 MB for 12 MP originals, on the
  page's first screen, where the cover costs a few hundred KB now. Overrule: a purpose-made ~1280 px cover variant made in
  the browser at upload beside the preview (no transform, `upload/preview.ts`), carried for the cover's ids only and drawn
  as the second candidate of `HeadStills`' `srcset`; the Deferred line below says where each piece lives.
- **What does the hub's list say at a Public and a password door? Recommended and built: Settings' own sentence.**
  "Anyone with the link, after confirming an email." (or "after typing a name", and "and adding a photo", as the album
  asks), built by `doorGuestLine` from Settings' own function (`doorSentence`) over the same four facts, so the two cannot
  disagree; a password door reads "Anyone with the password, after confirming an email." where it read "The link, then
  the password you share with them."; the gates and Only me keep their lines (a gate that keys on an address already says
  the email). "or the code" leaves the hub's line (step one's own line, on the door page and in marketing, still says
  it). Overrule: keep the password door's old line (the NIT named Public alone), or keep "or the code".
- **Fix 1 reached files `owns` does not name. Recommended and built: yes.** The hub's line is built from `ReadyFacts`
  (`readiness.ts`), which had no identity switch to say, and the page builds those (`[eventId]/page.tsx`);
  `guest-experience-summary.ts` exports `doorSentence` (and a `DoorFacts` type), so the label module reads Settings' own
  sentence instead of keeping a second copy of its words. The two facts are optional on `ReadyFacts` (absent reads as a
  new event's own: an email, no photo first), so no board, Library stand-in or other lane's file changed. Each is listed
  under the lane check.
- **Where does the hub's reel say it, and in what words? Recommended and built:** "Guests get it at the develop." under
  the dock's controls, only while the dock is up (at rest the bar is a pill with no room for words), for as long as
  `developsAt` (the Reel card's own time) is ahead, on the develop clock every reader shares, so a hub left open across
  the develop stops saying it at the develop itself. It names no time (the card's `title` says the same, unsized).
  Overrule: name the time ("at 9 am"), or draw a mark on the resting bar.
- **The hub's reel view carried no stylesheet. A finding, fixed (no decision):** `live-reel.css` holds the dock's classes
  (`lr-pane`, `lr-bar-content`, `lr-dock-content`, `lr-follow`) and only the guests' controller imported it; the hub mounts
  the view without that controller, and the built hub route's client manifest never listed the sheet (a `grep` of
  `.next/server/app/(app)/dashboard/[eventId]/page_client-reference-manifest.js` for the sheet's chunk found nothing; the
  guest page's listed it). The host's dock drew unclipped, the bar's glyphs over the controls. The view imports its own
  sheet now (`live-reel-view.tsx`), and the rebuilt view's chunk list names it (below).
- **How far does the harness's join go to survive a loaded machine? Recommended and built:** it presses the door's three
  buttons (the welcome's Continue, the chooser's Continue as guest, the name's Continue) by what is on screen and again
  when the screen did not answer, never a fourth (Create account, Log in, Continue with Google); the name field is blurred
  and given 600 ms to settle before the name's Continue is pressed; a repeat is capped at three and never made while the
  mint is on its way (the button is disabled, "Just a second…"). Overrule: fail the run on a lost press instead (it is a
  lost tap in the product too, below).

## System-doc edits (in place, owned facts only)

- `docs/systems/reel.md`: the hub's reel bullet gains the dock's line ("Guests get it at the develop.", `dockNote`) and when
  it stops.
- `docs/systems/host-app.md`: the checklist bullet's facts gain the door line's source (`doorGuestLine`: Settings' own
  sentence, from the identity step and the photo first the page hands over).

## Deferred (ROADMAP one-liners, bucket named)

- Guests: the album's cover and the hub's head draw 640 px previews edge to edge (red-team 53b's NIT, not fixed in
  crumbs-66: see its Questions). A sharper cover is a ~1280 px cover variant made in the browser at upload beside the
  preview (`upload/preview.ts`, `r2/keys.ts`' `MediaVariant`, the purge policy's `MEDIA_KEY_COLUMNS`), carried for the
  cover's six ids as an optional fifth element of the link tuple (`album-wire.ts`; the page's seed, `useCoverStills`,
  `reelCoverStills`, `newestCoverStills`, both links routes) and drawn as the second candidate of `HeadStills`' `srcset`.
  The phone copy (2048 px, about 330 KB) is the wrong size for six rotating stills and is off the wire.
- Host: `settings-rows.tsx`'s `doorLine` (the quick choice's note for the current door) is the second copy of the helper
  `readiness.ts` kept before crumbs-66, and still says "Anyone with the link or the code comes in." beside the email
  choice; point it at `doorGuestLine` with Settings' live values.
- Guests: the name step's Continue can lose a press. With the field focused, the press moves focus to the button, the
  field's blur drops the keyboard's lift (`use-keyboard-inset.ts`) and the sheet's foot moved 65 px up between pointerdown
  and pointerup, so the release landed on the sheet and the click on the body: 3 of 6 presses under a 6x CPU throttle in
  Chrome's phone emulation (events recorded in `_scratch/crumbs-66/lost-press.log`). A real thumb on a slow phone may meet
  it; unverified (the emulation has no keyboard); `lab/tools/keyboard-sheet` is where to look.
- Design: a Library specimen of the hub's reel view with its dock (and `dockNote`), so `lab:smoke` renders it: the view is
  reachable only signed in, which is how its missing stylesheet went unseen.

## Handoff (replaces the chat report)

Scratch (every log named below): `../partyreel-wt/_scratch/crumbs-66/`.

- **★ A cross-lane note for compute-uploads (read first).** My harness checks ran on the shared test event "Compute model
  (test)" while that lane was measuring: I looked for a listener on 3131 only at the start of the session, and its
  `after-full` run (results object at 22:19:02Z, written 22:32:41Z) began later. Mine, by `meta.date` in
  `stress/*/results.json` (UTC): sixteen `guest-viewer-20` joins 22:01 to 22:14 (a guest row each, no upload), one
  `guest-join-upload` at 22:23:36Z (ten photos uploaded at about 22:24Z, inside `after-full`'s hour scenarios), and the
  forced-error pair 22:25:27Z and 22:29:00Z (two guest rows each, then `guest-hour-live` for three minutes). Another
  lane's lit album pays about 20 calls for a ten-photo burst, so its `guest-hour-live` or `guest-hour-down` of that window
  may carry that much extra, and a guest join may add a sync; their `after-hourdown` re-measures the second. I touched
  nothing of theirs, and every request of mine went to my own port.

- **Commits**, all on `origin/lp/crumbs-66`: fix 3 `91ceb5f22`, fix 4 `64953ad8d`, fix 1 `0b0572216`, the reel view's
  stylesheet `f426bc4e2`, the harness `fdc0e8b16`, `0b8547ca7` and `66abc030d` (the last code commit), then this manifest
  alone (the head is in the chat line). launch-prep had not moved (`805c52ed0` at the cut and at the last fetch), so there is
  no sync commit.
- **Gates**, each on its own exit code. On `fb282da95` (every `src/` change but a test): `pnpm lint` 0, `pnpm test` 0
  (909 files, 11,156 tests), `NEXT_PUBLIC_SITE_URL=http://localhost:3132 zsh scripts/build-lock.sh pnpm build` 0,
  `pnpm lab:smoke --base http://localhost:3132 --timeout 90000` 0 (156 checks, 0 failing; scope the Library, the shell and
  boards create-wizard, event-header, host-dashboard and identity, which import `guest-experience-summary.ts`)
  (`lint.log`, `test.log`, `build.log`, `smoke.log`). On `66abc030d` (`git diff fb282da95..66abc030d --stat`: only
  `scripts/compute-model/{phones,run}.mjs`, `src/lib/compute-model-phones.test.ts` and this file): `pnpm typecheck` 0,
  `pnpm lint` 0, `pnpm test` 0 (909 files, 11,162 tests) (`typecheck2.log`, `lint3.log`, `test3.log`). The smoke's PREMISE
  line: drive-export's nine open asks describe `events-section.tsx`; this lane changed only the quiet line's Reset press (a
  focus handoff), nothing those asks describe.
- **Red first**: each new or reshaped test fails on the old source (that file's source swapped for `origin/launch-prep`'s,
  then restored): events-section 1, hub-reel 2 (a third, "says nothing with no develop", holds on both), live-reel-view 1
  for the dock's line and 1 for the stylesheet, readiness 2; `visibility-labels.test.ts` and `compute-model-phones.test.ts`
  import functions the old source does not have, and the harness's red is measured, below.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): 18 files. Under `owns`: `visibility-labels.ts` and its
  test, `events-section.tsx`, `hub-reel.tsx` and its test, `live-reel-view.tsx` and its test, `run.mjs`; this file; and
  `docs/systems/reel.md` and `host-app.md` (listed under System-doc edits). Exceptions, each for its reason:
  `events-section.test.tsx` (the owns name a file, its test is its pin); `src/app/(app)/dashboard/[eventId]/page.tsx`
  (four lines: the two identity facts for fix 1, `developsAt` for fix 4: props the owned files take); `readiness.ts` and
  `readiness.test.ts` (the hub's door line is built there from `ReadyFacts`); `guest-experience-summary.ts` (two lines: it
  exports `doorSentence` and a `DoorFacts` type, so the label module reads Settings' own sentence); `scripts/compute-model/
  phones.mjs` (new) and `src/lib/compute-model-phones.test.ts` (new): the harness's testable half, since `run.mjs`
  measures the moment it is loaded and cannot be imported.
- **The items**
  1. NIT, the hub's door line: `doorGuestLine` (`visibility-labels.ts`) says "Anyone with the link, after confirming an
     email." (a name, a photo first, as the album asks) at a Public and a password door, from `doorSentence` over Settings'
     own four facts; `ReadyFacts` carries the two switches (optional), the hub's page hands them (`page.tsx`), the old local
     copy in `readiness.ts` is gone. Tests: `visibility-labels.test.ts` (the sentence equals Settings' for both doors across
     all 16 fact combinations) and `readiness.test.ts`.
  2. NIT, the cover's photographs: not built; see the first Question and the first Deferred line (the phone copy is off the
     wire and the wrong size; 327 KB average, 182 of 3,445 photos have one).
  3. NIT, the quiet line's Reset: it hands the focus to the Display button before React drops the line (`events-section.tsx`).
     Real Chrome (a scratch page on 3132, since removed): after a real click on Reset the active element is the Display
     button (`aria-haspopup=dialog`), the line gone, the layout back to gallery; `events-section.test.tsx`.
  4. The hub's reel before the develop: the view takes `dockNote` (`live-reel-view.tsx`: a line under the dock's controls,
     in the dock's glass type), the hub says "Guests get it at the develop." while `developsAt` is ahead, on `useWaitClock`
     so it stops at the develop itself (`hub-reel.tsx`; tests in both). Real Chrome on a scratch page with the reel's sheet
     loaded: the line reads under the timeline at a desk and at 375, one line, inside the dock.
  5. A finding beyond the five, fixed: the hub's reel view carried no stylesheet. `live-reel.css` holds the dock's classes
     and only the guests' controller imported it (`live-reel.tsx`); the hub's built route never listed it, the guest page's
     did, so the host's dock drew unclipped (the first scratch screenshot: the bar's glyphs over the controls). The view
     imports its own sheet; the rebuilt view's loader names it first (`css-evidence.txt`: module 456813 in
     `static/chunks/0sh64xlulp2jx.js`); `live-reel-view.test.tsx` holds the import.
  6. The compute harness, measured on the production build with CPU throttled by `Emulation.setCPUThrottlingRate` on a
     scratch copy of `chrome.mjs` (`stress/`): the old join's name-step timeout reproduced, 3 of 4 joins at 6x and 10x
     (`old-6`, `old-6-b`, `old-10-a`), and in every failed join the server's ledger holds no `POST /api/guests`. The
     recorded pointer events say why (`lost-press.log`): the press moves focus off the name field, the blur drops the
     keyboard's lift, the sheet's foot moves 65 px up between pointerdown and pointerup, and the click lands on the body
     (3 of 6 presses). The join (`phones.mjs`, `run.mjs`) now blurs the field and waits 600 ms, presses the name's Continue,
     and presses again when the sheet did not move (capped at three, never while the button is disabled for its mint);
     the door's two navigation presses read the screen the same way and press only the welcome's Continue and the chooser's
     Continue as guest. First presses landed 8 of 8 at 6x and 4 of 4 at 10x or unthrottled, against 2 of 8 without the blur
     (`press-count-before.log`, `press-count-after*.log`); 8 of 8 whole joins passed, one mint each (`fix-6-c`..`fix-10-d`);
     the real first scenario, `guest-join-upload` under 6x, passed at 60 calls of its 68 (`join-upload-6.log`).
     Closing on error: a forced error after both phones joined (`<out>/photos` made a file, so `photos(10)` throws): the
     old harness left `listener` and `uploader` polling, 3 and 3 records under `guest-hour-live`; the new one none
     (`err-old.log`, `err-new.log`, the ledgers counted by scenario and device). A full 15-minute `pnpm compute:model` run
     was not made: the other seven scenarios are unchanged; run it at the milestone.
- **ROADMAP lines this lane closes** (the Orchestrator records them): the door line, the Display Reset, the hub reel's
  develop words, the compute harness's join and phones; the cover line stays, as the Deferred line below.
- Assets requested from Will: none
- Board ideas: the name step's Continue can lose a press (Deferred, third line: the keyboard-sheet bench is where to look);
  a Library specimen of the hub's reel view with its dock (Deferred, last line).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule: the six Questions above, one line each (the cover stays on the preview; the hub's door line is
  Settings' own sentence, a password door included, "or the code" gone from it; fix 1 reached `readiness.ts`, the hub's page
  and `guest-experience-summary.ts`; the dock says the develop line under its controls only while it is up, naming no time;
  the reel view imports its own sheet; the harness presses again and never a fourth button).
- Look at first (signed in, the local build at port 3000; nothing of mine touched Vercel):
  1. A Disposable album with a develop ahead and two shots: its hub, the Reel card, the reel over the hub: at rest the bar
     is a slim pill and the controls grow out of it (the sheet is new on the hub), raise the dock: "Guests get it at the
     develop." under the timeline. Set the develop a minute ahead and leave the reel open: the line goes at the develop, on
     the clock's next half minute; after Develop now in Settings, a fresh open has no line.
  2. The hub's "What a guest needs" list on a new event: the door row reads "Anyone with the link, after confirming an
     email."; in Settings, What guests do first set to a name: the row reads "after typing a name" once the save lands; A
     photo first on: "...and adding a photo".
  3. The dashboard with Display set to Table: Tab to the quiet line's Reset, Enter: the focus is on the Display button, and
     the next Tab leaves from there.
