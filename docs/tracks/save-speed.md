---
track: save-speed
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
