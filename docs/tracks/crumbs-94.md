---
track: crumbs-94
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "f1dfc634"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - scripts/compute-model/
  - src/components/guest/
  - src/components/app/photo-img.tsx
  - src/components/app/media-grid.tsx
  - src/components/app/dashboard/
  - src/components/reel/
  - src/components/app/event-settings/
  - src/lib/db/mutations/events.test.ts
  # claimed at the walk, the reel's player lives in the lib (item 6): the loader that tells a refused decode from a failed fetch,
  # and the live source that leaves such a photograph out of the take
  - src/lib/reel/engine/assets.ts
  - src/lib/reel/engine/assets.test.ts
  - src/lib/reel/live/source.ts
  - src/lib/reel/live/source.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/guest-flow.md
  - docs/systems/dashboard.md
  - docs/systems/reel.md
  - docs/systems/host-app.md
  - src/lib/album/store.ts
  - src/lib/album/edge-version.ts
---

# lp/crumbs-94

**Goal.** Six of the ROADMAP's Immediate lines closed at their source: the compute model measuring cdn-version's path truthfully, Settings' verified-email patch pinned, and red-team 58b's four NITs.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3131 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**The items, each an Immediate line in `docs/ROADMAP.md` quoted by its opening words (read each line whole; the Orchestrator retires each at your record):**
1. **"Cost: the compute model cannot measure cdn-version's path"**: the harness's clock shim (`scripts/compute-model/chrome.mjs`'s `clockShim`, K=20) runs a phone's `Date` fast, so every version ask's window (`w`, `src/lib/album/edge-version.ts`) misses the server's, answers `clock`, and the store (`src/lib/album/store.ts`'s `pollOnce`) falls back to a full sync. Make the model ask as a phone with a true clock would (rewrite `w` to the server's window in the harness, never in the product), re-measure `guest-hour-live` and `guest-hour-down` (`pnpm compute:model --port 3131`), and set their two lines in `budget.json` to the truth with the reason in the commit (the file's note). **Then say, with the measured numbers, what a lone phone costs an hour now against before cdn-version** (each tick's cheap ask, plus the full sync `ALBUM_EDGE_TRUST_MS` forces): if a lone phone pays more, write a Question with your recommendation (for one: a phone whose cheap asks keep missing the CDN's cache asks the album itself, and probes the cache now and then), and build nothing in `src/lib/album/` (it is not yours).
2. **"Settings: pin in a test that `eventPatch` and `updateEvent` name `require_verified_email` only when her switch provides it"**: the test the line asks for.
3. **"Dashboard: `PhotoImg` listens only for `onError`"**: a cached undecodable image that failed before hydration is caught as the album tile catches it (`img.complete` and `naturalWidth` in a callback ref).
4. **"Guests: at the door's upload step one paused refusal is said twice"**: one voice.
5. **"Guests: a reopen puts the door's upload step back up, unprompted"**: only where the album is photo-first.
6. **"Reel: an undecodable HEIC plays as a black 3-second slide"**: find the reel's player and claim its file at boot; leave such a photograph out of the reel, or draw its named stand-in, whichever the reel's system doc favours.

**No lane runs beside you.** Claim at boot any file a fix reaches outside your owns; a single line in another system's file is fine, listed in the Handoff with why.

**Record:** the facts each fix changes, refined in place in its system doc; anything left is a Deferred line.

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
- Calls for Will: only a decision built in that he cannot see by using the product (plans, billing and renewals; lifecycle and timing; deletion, retention and privacy; safety and moderation; what the product does on its own), one line each, or none. A design, wording or flow choice is never one: production and the lab show it
- Look at first: ...
