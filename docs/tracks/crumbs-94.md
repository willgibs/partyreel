---
track: crumbs-94
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
  # and the harness's tests live in the lib beside its pins (item 1): the true-clock ask, and what a scenario counts
  - src/lib/compute-model-clock.test.ts
  - src/lib/compute-model-phones.test.ts
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

Each is built as recommended and is Will's to overrule.

- **Item 4, at the door's upload step a paused refusal is said once: whose voice?** Built: the step's. Its fail-open view
  now says what the album's failure sheet said (that the host paused, that the file is still on her phone, the way on:
  the sheet's own two sentences, the host unnamed), and the door lets go of what the step stood on in the breath the step
  goes, so the sheet that waits behind it opens on nothing. The other voice is the album's sheet (it names the host and
  stays until Done) with the step holding its "Sending" frame until the door leaves; that needs the page to know when the
  album's ask has answered, or a stalled ask leaves the step on a stale "Sending". Recommended: the step's, as built.
- **Item 5, does a pause that lets a guest into an ordinary album end the door's ask for that pass?** Built: yes, so a
  reopen never raises the soft upload step over the album she is in; a photo-first album keeps its rule (the step returns
  on a reopen). Recommended: yes.
- **Item 6, a photograph this device cannot draw in the reel: leave it out, or draw its named stand-in?** Built: left out
  (its bytes came in and the browser's decoders refused them), kept out for the view's life; the album's tile and the
  dashboard still name it. The reel's system doc is silent; its own eligibility rule already leaves out an item with
  nothing drawable. Recommended: leave it out; a wall or a phone in a hand plays photographs, and "Can't show here" on
  it reads as a failure to the room.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: the pause paragraph (a pause that lets her in passes the ordinary album's soft upload step; a
  guest the pause let into a photo-first album does not hear the reopen; one voice at the door, `failOpenFailures`).
- `docs/systems/dashboard.md`: `PhotoImg` hears a failure two ways (an `error` event, and a callback ref reading `complete`
  with no `naturalWidth` for one that failed before React listened), and the album's tile reads the same.
- `docs/systems/reel.md`: the take leaves out a photograph this device cannot draw (`UndecodableImageError`, `undrawn`).
- Not edited, and why: `docs/systems/architecture.md`'s compute budget points at `run.mjs`'s head for the model's usage, and
  that head now says the hour scenarios send each version ask the server's window and count only their own phone.

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Guests: a guest the pause let into a photo-first album never hears the reopen: the sync answers her a teaser at the `upload` gate, which carries no `accepting` (only a full answer does), so her cover keeps its closed line and the door's step never returns until a reload; carry the word on that teaser too, or read an `upload` gate as open (walked 2026-10-08: 100 s after the reopen, still closed; the sync's own answers were a manifest with `accepting: false`, then a teaser).
- Guests: at a photo-first door a paused refusal's view stands after the host reopens inside one poll, with no way to try again (the queue's failure is stale, and the step's one button refreshes into the same view, walked 2026-10-08): lift a `paused` failure when the page hears the album open, as the camera's banner lifts (`uploadsWord.heard`); it needs the word to reach a teaser first (the line above), and a refresh that finds uploads open to count as a word.
- Tests: a full `pnpm test` can exit 1 with every test green on two unhandled `Failed to resolve import "server-only"` rejections from `src/lib/db/mutations/my-uploads.ts`, attributed to `guest-upload.test.tsx` (one full run in three of crumbs-94's, never alone): find the lazy import that reaches it unmocked and mock it there (crumbs-94's gate).
- Reel: the host's clip creator (`components/reel/clip-canvas.tsx`) and the clip's encode (`lib/reel/clip-encode.ts`) still draw a still this browser cannot decode as a theme-colour hold, and encode it into the file; `loadReelAssets` now names them (`undecodable`): leave them out of the selection, or say so before the encode (crumbs-94; a choice for the reel's next round, so not made here).

## Handoff (replaces the chat report)

- **Commits** (all pushed to `origin/lp/crumbs-94`; launch-prep had not moved from `a6530e7d6`, so no sync commit): `0df957ea2`
  (item 2), `5530d7501` (item 3), `afed4622c` (items 4 and 5), `5a1b161e2` (item 6), `97af63454` (item 1's model),
  `ea241995c` (item 1's budget lines), `5a2c95db6` (the album tile, item 3's twin, and the system docs), `6e04b370b` (the
  model's handler never leaves a request paused), `b69c3f4b0` (the claim). The head is in the chat line.
- **Gates**, each on its own exit code, on `6e04b370b`: `pnpm typecheck` 0, `pnpm lint` 0 (no warning), `pnpm test` 0 on the
  second of two runs of the final tree (1,130 files, 14,532 tests; the first exited 1 with every test passing, see Look at
  first), `zsh scripts/build-lock.sh pnpm build` 0. `pnpm lab:smoke --base http://localhost:3131` 0 on `5a2c95db6` (172
  checks, 0 failing; the one commit after it touches `scripts/compute-model/true-clock.mjs` and its test only). No board:
  no `lab:demo`. `node scripts/compute-model/run.mjs --reproject <the clean run>` holds the new budget (exit 0).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned paths and this file, plus what the manifest
  claimed (the four `src/lib/reel/` files of item 6, and `src/lib/compute-model-clock.test.ts` and
  `src/lib/compute-model-phones.test.ts`, the harness's tests, which live in the lib beside its older pins), and the three
  system docs under System-doc edits. No other file.
- **The items**
  1. Cost: `97af63454` the hour scenarios send each version ask the server's window (`scripts/compute-model/true-clock.mjs`,
     CDP's Fetch domain, the product's own `edgeWindowOf` imported, nothing in the product changed) and a scenario counts only
     its own phone (`phones.mjs`'s `ownRecords`); `ea241995c` the two lines: live 26 to 30 calls and 1,190 to 1,790 ms, down 74
     to 76 and 4,270 to 3,210, the reason in the commit. **A lone phone pays the same as before cdn-version, so no Question:**
     measured clean, same harness and day, k 20 and 10: live now 27 calls, 893 ms (an hour: 21.5 calls, 439 ms) against 25,
     1,025 ms (22.0, 527 ms) on the tree before cdn-version (`e239105ea`); down now 69 calls, 1,604 ms (60.0, 1,199 ms)
     against 68, 2,023 ms (64.0, 1,664 ms). A cheap ask is one call at about 19 ms where the sync it replaces was one call at
     23 to 26 ms; the `ALBUM_EDGE_TRUST_MS` sync replaces an ask (11 and 13 an hour measured, 12 by design), never adds
     one, and no live ask was followed by a sync (milestone 40's 43 and 127 calls were every ask followed by one).
  2. Settings: `0df957ea2` two pins (`updateEvent`: `events.test.ts`; `eventPatch`: `settings-state.test.tsx`), each over
     every other key and each checked to bite by removing the guard it holds.
  3. Dashboard: `5530d7501` `PhotoImg`'s callback ref reads `complete` with no `naturalWidth`; walked on the old code the stage
     drew the broken image on 5 of 5 reloads, on the fix the stand-in on 4 of 4 at 1440 and 3 of 3 at 375. `5a2c95db6`: the
     album's tile did not catch it either, so the host's album drew the HEIC broken on every load (4 of 4); now 0.
  4. Guests, one voice: `afed4622c`; walked at 375 and 1440, the step's words for about a second, then the door goes and no
     sheet rises (before: the sheet rose 1.0 s later, overlapping the step's exit for 0.23 s).
  5. Guests, the reopen: `afed4622c`; walked, an ordinary album's step does not return after a pause and a reopen (it did).
     A photo-first album's return is the rule but is not reached live for a guest the pause let in (Deferred).
  6. Reel: `5a1b161e2`; walked at 1440 and 375, three dark stretches of 1.8 to 2 s in 50 s before, none after (1440 at
     40 ms samples, 375 at 200 ms; only the opening's dark 0.2 s at the very start).
- **Test data**, deleted: events `4bad7344-f7da-40ea-876a-ef204816c568` ("crumbs-94 (disposable) ordinary", six photos, one
  an un-previewed HEIC) and `f5db55bd-6ed9-4008-a1c5-0706298fe620` ("crumbs-94 (disposable) photo-first") moved to Deleted
  through the product's own soft delete (purge_at 2026-11-07), with their guests ("W3A", "W4", "W5", "W6" names). The
  "Compute model (test)" event gained its routine "Compute Hour" guest rows (six). My headless Chrome, its driver and the dev
  server are closed.
- **Assets requested from Will**: none
- **Board ideas**: the clip creator over a photograph this browser cannot decode (the last Deferred line): what she is told
  and whether it leaves the selection is a small board's question.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none
- **Calls for Will**: none
- **Look at first**: (1) the door at a phone width over an ordinary album: Settings > What guests can add > Nothing, for
  now, with a guest at the upload step pressing Send, and the step's two sentences ("The host has paused uploads for now."
  and where the file is). (2) `/dashboard/<event>` and the stage over a HEIC with no preview, reloaded: the stand-in on every
  load. (3) The first `pnpm test` of the final tree exited 1 with all tests green: two unhandled rejections, `Failed to
  resolve import "server-only" from src/lib/db/mutations/my-uploads.ts`, attributed to `guest-upload.test.tsx` (a file
  this lane did not touch, 3 of 3 green alone; the same tree re-run: exit 0), so a race in a lazy import that loses to the
  file's teardown under load; the gate may meet it once. (4) `lab:smoke` printed "PREMISE event-page: 1 open ask (page)
  describe docs/systems/guest-flow.md, which this change touched": that board's open ask is the Orchestrator's to re-read
  against the doc's three edits.
