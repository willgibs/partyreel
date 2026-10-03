---
track: crumbs-54
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
