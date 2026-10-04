---
track: crumbs-66
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

(filled at the end)
