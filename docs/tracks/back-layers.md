---
track: back-layers
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "4c11a0ad"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/media-lightbox
  - src/components/ui/popup
  - src/components/ui/layer-is-up.ts
  - src/components/shared/masonry.tsx
  - src/components/guest/camera/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(guest)/
  - src/lib/history-entry.ts
---

# lp/back-layers

**Goal.** Back peels one layer a press and keys act on the top layer: the viewer's arrows stand down under a layer, Back over a confirm closes only the confirm, a reload strands no history marker, and the camera's shots take their own entry.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3135 is yours; 3000 is Will's desk.

From ROADMAP "Now" (provenance in git): on a phone, Back is how people leave a layer, so each press peels exactly one; on a desk, keys act on the top layer. Each fix pinned by a test that fails on the old code:
1. **The viewer's arrow keys step the photograph behind a layer opened over it** (the credit's look, a confirm), since `ownsKeys` (`media-lightbox.tsx`) knows controls, not dialogs: stand down while a layer is up (`layerIsUp`).
2. **On a phone, Back over a confirm opened over the viewer (Delete, Remove) closes both at once**, since only place shapes hold a history entry (`useBackCloses` in `ui/popup.tsx`, `popup-back.ts`): a question over a place takes one too, deciding which kinds earn an entry (under Questions).
3. **A reload while a phone place is open (a screen, a cover, the credit's look) strands its `prPopup` marker**, so one Back closes nothing, and a viewer reopened from its address writes none (`masonry.tsx`): drop unclaimed markers on load, and give the reopened viewer its entry.
4. **The camera's Back from her shots closes the whole camera**, since only the camera holds an entry (`useBackCloses` in `guest/camera/album-camera.tsx`): her shots take an entry of their own, so Back peels one layer a press, as Escape already does.

`popup.tsx` is shared by every popup kind: change only its history behavior, and keep `popup-kinds.test.ts` and the Library's popup specimens green. Wiring rigor: the whole gate, and each fix walked on your port at 375 (Back by `history.back()` in your own tab) and 1440 (keys).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

None is a one-way door (no migration, no stored shape; each is a line or two of `ui/popup.tsx`, `ui/popup-back.ts` or
`media-lightbox.tsx`); each is built as its recommended answer and listed again under the Handoff's calls.

1. **Which popups hold a history entry in a hand?** Recommended, built: a place (a screen, a cover, a sheet) as before,
   and a question (a confirm, a form) only when it opens over another layer: the viewer, a place, a look, a routed room
   (`PopupContent`'s `holdsIf`, which asks `layerIsUp({ dialogsOnly })` once as it opens, never counting its own
   element). A question over the bare page holds none: Back there leaves the page, as before. The other answer, every
   popup in a hand holds one (Back closes a question anywhere, Android's own convention), costs every confirm on a page
   a race between its own Back and its act (Delete event's redirect, sign out everywhere, account deletion), so it is
   his to ask for. Over a routed room the room provider's `keep` rewrites a question's marker with the room's own when
   the hub re-renders; the question still leaves by its address (`many`), so Back and Cancel behave (an act that closed
   the room itself would go one entry short; none does: Delete event redirects).
2. **What does Back do while a question's save is pending?** Recommended, built (no code of its own): Back closes the
   question as any Back does, and the save already sent carries on and lands as it would (its toast, its redirect),
   since a sent write cannot be recalled; where a caller refuses the close mid-save (the claims review's Delete), the
   question stays and that Back is spent.
3. **The viewer's arrows: `layerIsUp`, as the brief named, or the layer the key came from?** Recommended, built: the
   layer the key came from (`insideAnotherLayer(target)`, beside `layerIsUp` in its one home), since `layerIsUp` also
   counts a layer UNDER the viewer: a viewer opened from inside a panel would lose its arrows to the panel. A modal over
   the viewer holds the focus, and a menu or a look takes it as it opens, so every layer over it is caught.
4. **"Drop unclaimed markers on load": strip the marker, or step over the entry?** Recommended, built: step over. A
   stripped marker leaves the entry, so one Back still lands on the same page and closes nothing; going Back over a dead
   entry (a marker this page life never wrote) takes it off the path at the same address, so nothing moves and the
   reopened viewer stands on its own entry (which is how it gets "its entry": it takes up the one it had).

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`: the alertdialog bullet (a surface that is itself a layer and owns the keys asks
  `insideAnotherLayer`) and the places bullet (a question holds an entry over another layer; entries leave in stack
  order, a person's Back pops only the top one, a push waits for a Back of ours, a reload's dead entry is stepped over).

## Deferred (ROADMAP one-liners, bucket named)

- Guests: a photograph opened from a shared link (`?photo=`) has no entry under it, so the phone's Back leaves the album
  with the photograph open; a base entry written under a deep-linked viewer (the album's address replaced, the
  photograph's pushed) would make Back close the photograph first (`masonry.tsx`'s address open; his call, since the
  close already lands in the album in place).
- Engineering: a popup whose act navigates (a server action's redirect, `router.push`) leaves its entry under the next
  page, so Back from there lands on a same-address entry with nothing open (one dead Back); a place's links already
  replace theirs (crumbs-32), and since back-layers a question over a layer holds an entry too (Settings' Delete event).
  The reload sweep steps over only an earlier page life's markers, never this one's.
- Guests: Forward onto a closed popup's entry closes the popup open beneath it (`onPopState` in `ui/popup-back.ts`
  reads a landing off the top as a Back, as each popup did before); phones rarely go Forward.

## Handoff (replaces the chat report)

- **Commits:** the work is `db448da18`; the sync is `8b84745b7`, a merge of `origin/launch-prep` at `246f5ea5d`
  (crumbs-81 had merged: popup-consuming Settings code and tests, so the whole gate ran again on the merge); both
  pushed to `origin/lp/back-layers`. This manifest is the commit after them, whose sha is the chat line's.
  `launch-prep` moved since by durability-restore (`0b0dad8c7`: the admin's jobs, the backup Worker, none of this
  lane's paths or reads) and a desk record (`7ac527c23`), so no second sync.
- **Gates** on the synced tree (`8b84745b7`; this manifest commit changes no code), each on its own exit code, logs in
  `/Users/gibby/local/ai/partyreel-wt/_scratch/back-layers/`:
  - `zsh scripts/build-lock.sh pnpm typecheck` exit 0 (`gate-typecheck.log`); `pnpm lint` exit 0, no warning
    (`gate-lint.log`).
  - `zsh scripts/build-lock.sh pnpm test` (`gate-test.log`): 988 of 989 files, 12,297 of 12,298 tests. The one failure
    is known and pre-existing, not this lane's: `src/lib/track-manifests.test.ts > drive-fixes.md is well-formed`
    (that manifest's `reads` name `../partyreel-wt/_scratch/drive-walk/ledger.txt`, which resolves from the primary
    checkout only; the merge gate runs there).
  - `zsh scripts/build-lock.sh pnpm build` exit 0 (`gate-build.log`).
  - `pnpm lab:smoke --base http://localhost:3135` exit 0: 190 checks, 0 failing (`gate-lab-smoke.log`); its PREMISE
    line: identity's 8 open asks (field, button, focus, selected, press, loading, toggles, edge) describe
    `src/components/ui/` and `docs/systems/design-system.md`, which this lane touched (the popup history and the layer
    question only, no look of an asked atom): his to re-read before the next sitting.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`) = the owned paths + this file, plus:
  - `src/components/shared/masonry.test.tsx`: the owned `masonry.tsx`'s own tests (its prefix names the source).
    Item 1 reshapes two crumbs-47 pins on purpose, each saying so in place: "stepping the viewer while the look is
    open (an arrow key behind the scrim) takes the look away and keeps the viewer on the next photograph" and its
    shared-link twin (scar kept: one key reaching the layer under the one it was pressed in; expired reason dropped:
    the step now never happens). Items 2 and 3 add theirs.
  - `docs/systems/design-system.md`: the System-doc edit above.
- **The items**, each pinned by a test that fails on the old code (the new `popup`, `masonry`, `media-lightbox` and
  `album-camera` tests run against the seven sources `git stash`ed back to the base's: 10 failed, each item's pins
  below; the guards beside them, a layer under the viewer, the Cancel, the Delete act and the desk, hold on both;
  `popup-back.test.tsx` imports the new export, so it cannot load there), and each walked on port 3135 in a headless
  Chrome of my own (CDP, `cdp.mjs`; 375 = a phone's metrics, touch and UA; 1440 = a desk), as a guest of the albums
  `crumbs-76 free (disposable)` and `crumbs-76 camera (disposable)`; the walks re-ran on the synced tree
  (`walk-viewer-synced.log` 10/10, `walk-camera-synced.log` 5/5, `walk-reload-synced.log` 1/1,
  `walk-antagonist-synced.log` 3/3), reading `navigation.entries()` and the markers at each step; shots in `shots/`:
  1. **Keys act on the top layer.** `media-lightbox.tsx`'s window listener stands down for a key from inside another
     layer (`insideAnotherLayer` in `ui/layer-is-up.ts`). Pins: `media-lightbox.test.tsx` "★ an arrow pressed inside a
     confirm over the viewer steps nothing behind it" and "a layer UNDER the viewer never takes its keys"; the two
     reshaped `masonry.test.tsx` pins (the look). Walk at 1440: arrows inside the Delete confirm leave the photograph,
     Escape, then the viewer's own arrow steps (`v-1440-01-arrows-in-confirm.png`).
  2. **Back over a question over the viewer closes the question alone.** `PopupContent`'s `holdsIf` (Q1); the
     viewer's Delete and Remove are the one table's confirm (`media-lightbox-parts/actions.tsx`, its Delete
     permanently now in a `Popup`, so `PopupContent` sees its state; `actions.tsx` left `popup-kinds.test.ts`'s
     `LEFT_ALONE`); `ui/popup-back.ts` keeps the entries as a stack (in order, one landing at a time, a person's Back
     pops only the top one, a push waits for a Back of ours); `masonry.tsx`'s `leaveEntry` waits for a popup's entry
     over the viewer before going Back over its own (else the act's Back landed one short and the photograph reopened).
     Pins: `popup.test.tsx` "★ a confirm (and a form) over a place: one entry more, and the phone's Back closes it and
     leaves the place", "its own close takes its entry back"; `masonry.test.tsx` "★ Back over the viewer's Delete
     confirm closes the confirm alone", "its Cancel...", "★ confirming Delete closes both... never reopens";
     `popup-back.test.tsx` "the stack of entries": every layer's act, the swap (a look closing as its Block screen
     opens), a refresh-stripped place under a question, a push while a Back is on its way. Walk at 375: the confirm at
     entry 2 over the viewer's 1, Back to 1 with the viewer open, Cancel to 1, Delete to the album's 0 with nothing
     reopened (`v-375-02-confirm-over-viewer.png`, `v-375-03-after-back-1.png`, `v-375-05-after-delete.png`).
  3. **A reload strands no entry.** `stepOverDeadEntries` (`ui/popup-back.ts`) on every popup hook's mount and the
     album's (`masonry.tsx`). Pins: `masonry.test.tsx` "★ a reload with a popup open over the viewer: its dead entry
     is stepped over, the viewer stands on its own, and its walk writes the address"; `popup-back.test.tsx` "a
     reload's dead entry" (one, two in a row, never this page life's). Walk at 375: a reload under the Delete confirm
     lands on entry 1 (from 2) with `prPhoto` taken up, a step writes `?photo=` again, one Back closes onto the album
     (`v-375-04-after-reload.png`); a reload under the camera and her shots lands on the album's entry (from 2 to 0,
     `reload-375-01-camera.png`); no console error or warning through it (`walk-console-synced.log`).
  4. **Her shots take their own entry.** `album-camera.tsx`: `useBackCloses(open && view === "shots", backToCamera)`.
     Pins: `album-camera.test.tsx` "★ the phone's Back from her shots goes back to the camera, and the next Back closes
     the camera" and "her shots' own Back arrow takes their entry back". Walk at 375: camera at 1, her shots at 2, Back
     to the camera at 1, her arrow back to 1, Back to the album at 0 (`cam-375-03-her-shots.png` to
     `cam-375-05-after-back-2.png`); two Backs at once, a Back 120 ms after her arrow, and the camera's close under her
     shots each end on the album's entry (`walk-antagonist-synced.log`).
- **Live data left behind** (disposable albums only): one test photograph on `crumbs-76 free (disposable)`,
  `abca8336-b6cd-4036-b5ce-8a22d587a496`, approved, from the first walk, whose guest session died with its killed
  Chrome before the walk could delete it (its four siblings were deleted by the walks themselves, `removed`); guest
  rows named "Back-layers walk", 7 on the free album and 8 on the camera album (each door join is a row). The
  photograph goes with the host's Remove, or with the album.
- **Assets requested from Will:** none.
- **Board ideas:** none beyond the Deferred lines.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule**, one line each: a question holds a history entry over another layer and none over the bare
  page (Q1); Back mid-save closes the question and the save carries on (Q2); the viewer's keys follow the layer that
  holds the focus, not every layer up (Q3); a reload's dead entries are stepped over by a programmatic Back at load,
  same address (Q4); the viewer's Delete and Remove confirms are the one table's confirm now, as its Delete permanently
  was: side by side at 1440 they differ by the title's line, 2 px (`shots/compare-1440-side-by-side.png`,
  `compare-before-*` and `compare-after-*`).
- **Look at first:** on a phone, a guest's own photograph's Delete in the viewer (Back closes the confirm and leaves
  the photograph; Delete closes both onto the album). Then what port 3135 cannot reach (sign-in runs on 3000), pinned
  in jsdom only, at 375 with Back on the desk build: the host's Remove over the viewer; the credit's look and its Block
  screen (the swap); the claims review's Not mine confirm after a decision has refreshed the list; Settings' confirms
  (Delete event's Cancel and Back, a confirm switch), which now hold an entry over the routed room.
