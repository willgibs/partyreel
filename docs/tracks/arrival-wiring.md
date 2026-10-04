---
track: arrival-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "42cdc1b8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/event-experience.tsx
  - src/components/guest/event-experience-head.tsx
  - src/components/guest/gallery-empty-state-wait.tsx
  - src/components/guest/gallery-empty-state-sheet.tsx
  - src/components/guest/gallery-empty-state.css
  - src/components/guest/live-gallery.tsx
  - src/lib/disposable/contact-sheet
  - src/lib/disposable/develop-words
  - docs/systems/disposable-mode.md
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/the-wait.json
---

# lp/arrival-wiring

**Goal.** Wire Will's arrival=in-place: the first open after a develop plays the contact sheet developing into the album's first rows (2.95 s; fades under reduced motion), once per device, its tempo and easing as tokens.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's pick on the-wait r2 (2026-10-04), to wire: arrival=in-place.** Read the board (`src/app/(dev)/design/sandbox/the-wait/develop.tsx`'s `InPlaceStage`, its frames) and `docs/reviews/the-wait.json`. The develop as the album's first load, 2.95 s: the contact sheet's squares flash and develop in the night's order (150 ms to 1.1 s); "Developing" turns to "Developed" at 1.25 s; the cover comes up out of its house light at 1.65 s; then the newest squares grow into the album's first rows (each tile starts on its measured square) while the rest sink and the well dissolves. Reduced motion: fades only. Its four states: the live first open, a return mid-way, reduced motion, and Monday's plain open (an album developed long ago opens plainly, never replaying).
- **The tempo and easing as tokens** (the brand round writes motion principles and may re-tune them in one change).
- **When it plays:** the first open after the develop, once per device; never again, never for an album that holds nothing back. Say in your Handoff how a second device and a return mid-play behave.
- **Ownership:** the guest album's files named in your owns. `src/components/ui/` is `graphite-wiring`'s; the hub's `event-feed/` and the guest page's reel gate are `hub-strip-wiring`'s: propose anything you need there through the Orchestrator.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **A first open that came through the door (its page or its scrim) or for the reel (`?reel`): does the develop play
  after it?** Recommended and built: no, it is spent there unplayed (the mark is written): that open's arrival was the
  door's or the reel's, and the guest who waited the night on this phone holds a ticket and meets no door, so she is
  the one it plays for. Overrule: it waits behind the door and plays as the door lets her in.
- **What the develop loads before it moves.** Recommended and built: the pictures of the squares in the first screen
  (and 48 px below it) and of the first screen's tiles that grow, asked for by id as the album asks for its window's; a
  square below the fold develops in the dark, where nobody watches it (at a phone about half the sheet). The board's
  carried `load` said the sheet's whole cap (93 previews at a phone). Overrule: every square's preview.
- **How long the still sheet waits for its pictures.** Recommended and built: it stands 0.7 s at least (the board's
  lead), then plays as soon as its pictures are decoded, and after 3 s at most whatever has landed (a slow link plays
  with dark squares rather than holding the album). Measured locally on the production build: 0.7 to 2.4 s.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: a new bullet after the album's wait, **The develop: the sheet opening into the album**
  (when it plays, the per-device mark and what spends it, the gate before the first paint and its 6 s release, the one
  switch on the document and its tokens, the derived roll and the night's order, the album's DOM it reads and why it
  mounts inside `LiveGallery`, what it loads).
- `docs/systems/disposable-mode.md`: "build what a guest meets when an album develops" became "what a guest meets", and
  its Elsewhere names the develop's home in guest-flow.md.

## Deferred (ROADMAP one-liners, bucket named)

- Now: the host's hub develops too (the board's carried `hub`: her cover is the guests' sheet, so her first open after
  the develop develops it): mount `DevelopSheet` over `event-hub-head-cover.tsx` (hub-strip-wiring's `event-feed/`).
- Now: the guest's read carries the period's start (`sealed_from`), so an album turned disposable mid-party develops
  only its roll (today its photos from before the switch develop on the sheet too: `rollOfEntries`'s note).

## Handoff (replaces the chat report)

- **Commits:** `80e2850c5` (the first cut) and `42b182e2a` (the live night's order, the edges, the docs), pushed to
  `lp/arrival-wiring`; the head is the chat line. **Sync:** at the Orchestrator's ask (small-fixes) the branch took
  `origin/launch-prep` at `9246e880c` by fast-forward, before any work commit, so there is no sync commit. Launch-prep
  has since moved to `6c7cbc7a3` (styles-wiring, graphite-wiring): it touches none of my paths or reads
  (`wait-words.ts` in comments only, `globals.css` in tokens the develop does not read), and no file is changed on
  both sides, so no second sync.
- **Gates** on `42b182e2a`'s tree, each its own exit code: `pnpm typecheck` 0; `pnpm lint` 0; `pnpm test` 0 (899
  files, 10,934 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3134` 0
  (155 checks, 0 failing; scope the Library and the boards create-wizard, event-header, identity, the-wait).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = 12 owned paths + this file;
  `src/lib/disposable/contact-sheet-develop.ts` and its test sit under the owned prefix
  `src/lib/disposable/contact-sheet`. No exceptions. (One stray: a `git stash` in this worktree popped the shared
  stash of `lp/type-scale` into it; the conflict kept their entry, `stash@{0}` "WIP on lp/type-scale", untouched, and
  the stray file was removed from here.)
- The develop's tokens and data, one home: `src/lib/disposable/contact-sheet-develop.ts` (`DEVELOP_TEMPO`: the
  board's in-place moments, durations and curves; `developVars` writes them for the stylesheet, which names no number
  of its own; the roll, the night's order, the sheet, the verdict, the gate script), 25 tests.
- The words: `develop-words.ts` (`DEVELOP_TITLES`, Developing to Developed; the clock "All at once at 9 am" said of a
  time that has come; what a screen reader hears), their times the wait's own words.
- The drawing: `DevelopSheet` in `gallery-empty-state-sheet.tsx`, `ContactSheet`'s frame class for class with its
  ground a layer of its own; the fold's cells have one home (`SHEET_FOLD_CELLS`, `contact-sheet.ts`).
- The director: `AlbumDevelop` in `gallery-empty-state-wait.tsx` (the cold open decided once in the render that holds
  the seed and her clock; the live develop when the standing sheet's wait ends; the still sheet, its pictures, the
  play, the growing tiles, the ends) and `DevelopGate` (the script before the cover).
- The page: `event-experience.tsx` (the gate where a develop may be owed, the cover's stills held in
  `[data-develop-cover]`, the album's box `[data-develop-album]`), `live-gallery.tsx` (its section is
  `[data-develop-rows]`, its head row `[data-develop-head]`, and it mounts the develop beside them, where the page's
  tests, which mock the album by its exports, never meet it); the stylesheet's half is `gallery-empty-state.css`'s
  "THE DEVELOP".
- **Verified locally on the production build** (`next start` on 3134 against the real Supabase and R2; my own
  headless Chrome at 390x844 and 1440x900; a disposable test album of willg97's, "Arrival wiring develop", 60
  photographs from the host and three guests, seeded through `scripts/seed-demo-event.mjs` with the develop time ahead
  and then Develop now by SQL; films and montages in `_scratch/arrival-wiring/`): the cold first open (held from the
  first byte, the still sheet, the play in 3.0 s, the mark written, every tile linked after); the desk; reduced motion
  (fades alone, 2.8 s); the live develop (Develop now with the page open: the night's sheet keeps her squares and her
  pictures through the turn, then develops); a press mid-play (the album at rest on the next frame, spent); a press on
  the still sheet (the same); a reload mid-play (plays whole again, then marked); a fresh device (the welcome, never
  held, spent); Monday's plain open (never held). The live red-team is the alias's, after merge: the develop needs no
  allow-listed flow.
- **A second device** plays it once there (the mark is this browser's). **A return mid-play** plays it whole from the
  start (the mark is written only when it ends or she ends it); a tab put away mid-play stands the sheet still and
  plays it again when she is back.
- Assets requested from Will: none.
- Board ideas: the hub's develop (Deferred); "See it as a guest" (`share/as-guest-view.tsx`) composes its own album
  and does not play the develop; the alias's doorbell latency on Develop now with a page open (locally about 8 s
  between the save and the page's sync, which the live develop's own ask then shortens) is worth a measure live.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the door's or the reel's first open spends it (Questions); only the first screen's pictures
  load (Questions); the still sheet waits up to 3 s for its pictures (Questions); a resize ends it only mid-play (the
  still sheet lays itself out again); on a page open across the develop the night's sheet keeps standing,
  "Developing", until the roll lands (asking the album at once, then every 4 s, letting the album go plainly after
  30 s).
- Look at first: a returning guest's phone the morning after (no door): the cover on its house light, the sheet
  developing where it stood, the newest squares growing into the first rows; then Develop now with her page open.
