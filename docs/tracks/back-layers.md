---
track: back-layers
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
