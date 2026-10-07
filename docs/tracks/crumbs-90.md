---
track: crumbs-90
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "57cd8566"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/upload/
  - src/lib/guest/upload-refusal
  - src/lib/guest/use-upload-queue
  - src/lib/guest/name-door
  - src/components/guest/upload/
  - src/components/guest/guest-name-step
  - src/components/guest/entry-modal
  - src/components/shared/album-tile
  - src/components/app/media-grid
  - src/app/(guest)/e/[token]/page.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/guest-flow.md
---

# lp/crumbs-90

**Goal.** The guest's send and album made right where Immediate's lines say they are not: what a dropped line does to a complete, the heal beside a Retry, a HEIC with no preview, the failure sheet's words beside the toast and a roll's refusal, an album tile's focus, a photo link's image size, and two dead arms removed.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3132 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**The items, in order (each an Immediate line in `docs/ROADMAP.md`, quoted by its opening words; the Orchestrator retires each at your record):**
1. **"Album: the failure sheet offers Retry on a roll refusal"** (no-signal r1): a refused shot classed as the file's own, no Retry, as the camera already says it.
2. **"Album: the send's toast"** fires beside the failure sheet at one run's end: a "joined" over "2 of 3 didn't upload"; one voice at a run's end (the sheet saying what joined, or the toast quiet while the sheet stands), your call with its reason.
3. **"Uploads: a complete sent the instant a dropped line came back hung about 2 minutes"** (red-team 56b): find the wait and end it.
4. **"Uploads: the heal re-asks a kept complete on the browser's `online` event at once"**: a Retry all pressed as the line comes back must not be a second complete beside the heal's.
5. **"Uploads: a HEIC from a browser that cannot decode it"**: a tile is never blank; the server-side preview if it is proportionate, else a named stand-in in `MediaTile`, said under Questions.
6. **"Guests: in a 45-photo send the in-flight recorder counted the album's direct tiles dipping"** (unsure): reproduce it on a local build with the kit's recorder (`usher/kit/redteam/`), fix it if real, or retire the line with what you measured.
7. **"Album: an album tile shows no keyboard focus"**: the halo on an overlay that holds the keyboard's focus, as the line says.
8. **"Share: a photo link's `og:image:width` and `og:image:height`"** declare what the card serves.
9. **"Guests: drop the one-file presign and complete bodies"** and **"Guest door: the name door's `account` mode has no caller"**: both removed with their tests' reasons.

**Walk your own items antagonistically,** on a local build at 375 and 1440: a send cut mid-run (the network throttled, then offline, then back), a Retry all pressed as the line returns, a Disposable roll spent, a HEIC from desktop Chrome, Tab through an album; the abuse path of anything that reaches the pipeline (a complete for another guest's upload, a refused shot retried by hand). Test data disposable and named "crumbs-90 (disposable)".

**Nearby lanes (never edit their paths):** crumbs-88 (handed off, merging after milestone 39: the reel's controls, the guest door's confirm beat and adopted name, Create, the hub, the dashboard's stage), crumbs-89 (running: Settings' door, its state and the email gate), the board after-party r1 (its sandbox folder). Your merge follows milestone 39 and crumbs-88, so sync with `launch-prep` before your handoff if it moved.

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

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
