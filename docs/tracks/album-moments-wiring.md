---
track: album-moments-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e094108"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/shared/arrival
  - src/components/shared/arrival.css
  - src/components/shared/use-arrival-gate
  - src/components/shared/album-window
  - src/components/shared/album-tile
  - src/lib/shared/album-window
  - src/lib/shared/album-rows
  - src/components/guest/guest-upload
  - src/components/guest/upload/
  - src/components/guest/gallery-rows
  - src/components/guest/live-gallery
  - src/components/guest/event-experience
  - src/components/guest/reel/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/guest-moments.json
  - src/app/(dev)/design/sandbox/guest-moments/spec.ts
  - docs/systems/guest-flow.md
  - docs/systems/reel.md
  - docs/systems/disposable-mode.md
---

# lp/album-moments-wiring

**Goal.** Three beats of a guest's night as Will picked at guest-moments r1: her own photo glowing as everyone's, a short toast when her send has landed, a batch landing whole in its places, and the reel opening on its first photograph.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3134 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-06; `docs/reviews/guest-moments.json` round 1):** own = glow, batch = settle, opening = still. The board (`src/app/(dev)/design/sandbox/guest-moments/`) draws each on production's own album, rows engine and arrival lights: that drawing is your spec. Its limit and where are camera-wiring's.

- **own = glow:** her own photo, landing on her phone, wears the same rim and wash as any arrival (2 s): one light for every photo new to the album, on her phone as on the host's. The sweep retires (`arrival.ts`'s "your own never glows, it sweeps"; reshape its test with the scar of why). His note: "I'm not sure we need to mark guest uploads to avoid crowding gallery view, and marking the first specifically makes it easy to get lost in the gallery when more uploads follow. If we can pop up a temporary toast, whether when their uploads begin landing or the last one completes (your call, and we're always open to even better ideas you may have), that's likely enough for them to feel confident about the upload success and go find their media in the album if they'd like."
- **The send's toast (the Orchestrator's call on his "your call", his to overrule):** when a send's last photo has landed, one short toast says what landed in that album's truth, never at the start (the stack already shows a send while it runs): in a Live album how many are in, with a press that shows hers (the album's Yours view); in a Review album that they went to the host to approve (her stack is hidden there and approval already says "One of yours is in the album" later); a send with refusals keeps today's failure sheet and the toast counts only what landed. It reverses `guest-upload.tsx`'s "No upload toasts" (an error toast has usually gone by the time she looks): keep that reason for errors, which stay in the sheet's Retry. A better idea than a toast is welcome as a Question with a drawing in your captures.
- **batch = settle:** each photo of a batch is whole in its place from the first frame its place opens, glowing; the neighbours still glide; it waits for its slowest photo at the gate that already waits for each to draw (2 s at most): never an empty place at the top (carried call BM3: the glow stays on others' photos).
- **opening = still:** the reel's curtain is its first photograph, already on the page as the cover (`event-experience-head.tsx`'s `CoverStills`, slot 0 eager, `pickCoverIds` the reel's own opening), standing at once with Close beside it; the reel starts from it; a reel opening on a video uses its poster; a sealed album (no stills) keeps a quiet dark with Close. Fold in the ROADMAP's two curtain lines: a returning guest's hard `?reel` on a slow link painting the album's head before the black (the curtain placed before the head, from the first byte), and the hub's Reel card leaving its owner on black with no ceiling (a seed or view chunk that never lands).

**Nearby lanes this wave (never edit their paths):** the camera and its roll (camera-wiring), the hub (event-header-wiring-2), `globals.css` (event-header-wiring-2's alone: name a token you need in your Handoff).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`; a local red-team of every surface you change, antagonistic (the error cases, the cross-tenant and abuse paths, malformed input, a throttled network, reduced motion, Tab with the halo, a screen reader's names), at 375 and 1440, in the room and on paper where both exist; the walks you could not drive listed for the desk. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired.

**The walk for this lane:** on your port, two guests and the host on one Live album: her send of six landing (the glow, the toast, its press), a send with one refused, a Review album's send, a batch of others' landing at the top on a throttled line, the reel opened from a shared link and from the hub's Reel card on a slow line, a sealed album's reel.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, each naming its bucket and area)

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
