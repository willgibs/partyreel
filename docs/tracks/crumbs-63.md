---
track: crumbs-63
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
