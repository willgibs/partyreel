---
track: reel-engine-video
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "17f17e57"          # the launch-prep SHA the branch was cut from
board: none            # engineering: motion video by a range-fetched window decoded on device; no board of its own
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/reel/engine/video/
  - src/lib/reel/engine/assets.ts
  - src/lib/reel/engine/assets.test.ts
  - src/lib/reel/engine/reel-types.ts
  - src/lib/reel/engine/styles/mood.ts
  - src/lib/reel/engine/encode.ts
  - src/app/(dev)/design/(shell)/lab/tools/reel-video/
reads:                  # single-sources you depend on: never duplicate, never edit
  - node_modules/mediabunny/dist/modules/src/input.d.ts
  - node_modules/mediabunny/dist/modules/src/source.d.ts
  - node_modules/mediabunny/dist/modules/src/media-sink.d.ts
  - node_modules/mediabunny/dist/modules/src/input-track.d.ts
  - src/lib/reel/engine/
  - src/lib/r2/grid-items.ts
  - docs/systems/uploads-and-r2.md
---

# lp/reel-engine-video

**Goal.** THE REEL ROUND (Will, 2026-09-22, rulings.md "the reel, reconceived"; his ruling: "Range-window decode on device" behind an "Include videos" toggle). Motion video in the reel by a six-second window of the ORIGINAL fetched by range through mediabunny's Input/UrlSource and decoded on the viewer's device: the reader with bounded retries and disposal, the per-play byte budget with the K-loop cadence and the session ceiling, the fallback ladder to the poster, a synchronous frameAt ring the draw reads, the encoder's await prepareFrame, and a harness over local mov and webm fixtures. A library with no production surface. The Lane section at the foot of the Orchestrator's plan file carries every deliverable and constraint; this manifest's brief is a copy of it.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `17f17e57`)

- What this is: the reel round (rulings.md "the reel, reconceived"; the plan `~/.claude/plans/great-work-however-1-dapper-twilight.md`, "Video in the live reel" and section B, verbatim where it counts). Will's ruling of the video question: "Let's make "Include videos" a toggle in the play controls" and, on the middle ground, "Range-window decode on device (Recommended)". Today the engine draws a video's POSTER still; the only video files are the originals (up to 10 GB, mp4, mov, webm; no transcode). The encoder library already in the bundle (`mediabunny` 1.50.4) also READS media: `Input` over a `UrlSource` fetches only the byte ranges it needs (`requestInit` accepts `cache: "no-store"` and `mode: "cors"`), demuxes mp4, mov and webm, `canDecode()` probes the device's decoder, and `CanvasSink.canvases(start, end)` yields decoded frames for a window. So the live reel plays a six-second window of the original, fetched by range, decoded on the viewer's device, drawn into the canvas like any still; nothing new is stored. Your lane builds that reader, its budget and its fallback ladder as a library with a harness, and wires no production surface.
- DELIVERABLES: `src/lib/reel/engine/video/window-reader.ts` (mediabunny `Input` + `UrlSource(url, {requestInit: {cache: "no-store", mode: "cors"}, maxCacheSize: 8 MiB, getRetryDelay: two quick retries then fail})`, `parallelism: 1`, `getPrimaryVideoTrack`, `canDecode`, `CanvasSink` sized to the composition's short side with `fit: "cover"` and a small `poolSize`, `canvases(start, start + window)` into a small frame ring; at most TWO readers live at once (the playing clip's and the next's); `input.dispose()` and the generator's `return()` in a `finally` at the window's end; an `Input` per play from the CURRENT url, never held across a presign bucket roll; any rejection surfaces as "possible expiry" to the caller, since an expired presign answers a CORS-shaped failure with no status); `src/lib/reel/engine/video/budget.ts` (pure: `file_size_bytes / duration_seconds × window` against a per-clip cap constant; over budget → a shorter window down to a floor, else the poster; the budget is charged PER PLAY because `no-store` is mandatory, so a video plays with motion at most once every K loops (a knob, default 3) and draws its poster otherwise, and a session ceiling of total video bytes after which every video falls to its poster); `src/lib/reel/engine/video/ladder.ts` (pure: Include videos off → the poster with motion · undecodable → the poster · over budget → the poster · not ready by its cue → the poster this pass, retried next loop; `navigator.connection?.saveData` starts Include videos off on that device); `src/lib/reel/engine/reel-types.ts` gains a video asset kind carrying a SYNCHRONOUS `frameAt(localSec)` over a pre-filled ring (an async pump OUTSIDE the draw fills the ring), because `drawReelFrame` is contractually synchronous and `registry.ts`'s pooled-scratch safety invariant depends on it; `src/lib/reel/engine/assets.ts` learns the video asset (the poster first; the frames when the ring has them); `src/lib/reel/engine/styles/mood.ts` draws the frame whose timestamp ≤ the clip's local time (`drawImage` from the sink's canvas, downscaled), else the poster; `src/lib/reel/engine/encode.ts` gains one `await prepareFrame(f)` before each `drawReelFrame`, so a cut's encoder pulls frames sequentially through the same reader while the draw itself never awaits. The harness: extend `src/app/(dev)/design/(shell)/lab/tools/reel-parity/` or add `.../reel-video/` (your call, say which) playing a real mov and a real webm FIXTURE window from local files served with range support (check that the dev server answers 206 for a `public/` file; if it does not, a tiny fixture route of your own), with the toggle, the budget, the K-loop cadence and the ceiling as knobs, and a heap readout. Contract tests: the budget ladder; a source the device cannot decode resolves to the poster with no throw; the encode with a video clip produces frames in order; the reader disposes on abort.
- THE INFRA PRECONDITION IS NOT YOURS: the R2 bucket's CORS gains `range` in AllowedHeaders and `Content-Range`, `Accept-Ranges`, `Content-Length` in ExposeHeaders by Will's own command (the Orchestrator was refused); until it lands, R2 range reads from the alias fail on the exposed headers, which is why your harness plays LOCAL fixtures. Write the reader so a missing `Content-Range` is one more "poster" outcome, never a throw. The alias range fetch answering 206 with `Content-Range` readable is the Orchestrator's verification, not yours.
- Constraints you inherit: the CORS cache-poisoning trap (uploads-and-r2.md, starred: a CORS consumer of a tile-shared presign must bypass the HTTP cache); `RENDER_VERSION` in `render-hash.ts` is dying with the stored file, do not bump it; the existing `CanvasReelPlayer` untouched; every engine test green.
- Owns: `src/lib/reel/engine/video/` (new), `src/lib/reel/engine/assets.ts` and `assets.test.ts`, `src/lib/reel/engine/reel-types.ts`, `src/lib/reel/engine/styles/mood.ts`, `src/lib/reel/engine/encode.ts`, and the harness folder you name. Reads, never edits: `node_modules/mediabunny/dist/modules/src/{input,source,media-sink,input-track}.d.ts`, the rest of `src/lib/reel/engine/`, `src/lib/r2/grid-items.ts`, `docs/systems/uploads-and-r2.md`, the plan's "Video in the live reel".
- Tests: the suites above; the gate with every exit code; `pnpm build`; the harness at :3137.
- Announce in the Handoff: the video asset's shape and `prepareFrame`'s contract (the live lane's Include-videos knob and the wiring code to them); the budget constants; what the harness proved. You merge FIRST of the two engine lanes.

## The verdict map (every answer of the batch; this lane wires only its own board's)

**`voice` r1 (eight; the board RETIRES at its wiring, its voice written up from the wins):**
- `absence=named` + his rewrite: bible 20 is ruled PERMISSIVE (naming an absence a guest is wary of is allowed; the rule
  forbids defining Partyreel against something else, "we're not cloud storage, we're not vsco") AND the line changes
  everywhere: "No app, no account." becomes "No app required." because accounts may be required. The Orchestrator
  rewrites bible 20's `statement` and `why` in `rules/bible.ts` at the batch record (his words); the lane sweeps the 66 lines
  (every "no account" promise goes; "no app" stays as a benefit).
- `hero-sub=?` with his line: `SITE_SUBHEAD` becomes "Your guests took the best photos and videos at your event. Partyreel
  collects them with one easy link. No more chasing group chats the next day." (verbatim). `SITE_DESCRIPTION` (thesis +
  subhead) would reach ~200 characters: the lane gives the meta description its own line under 160 and says so.
- `feature-h1=today`: nothing moves; his "I do not like three-line headings on desktop" becomes a measurement on the
  alias of all six feature h1s at 1440 (`PageHero` `lg` = `text-title`, 80 px in `max-w-3xl`, likely two to three lines)
  and a proposal in the Handoff for any that wrap to three (shorter h1 copy, never the load-bearing width).
- `pro-line=video` with his line: "For videos and unlimited events." at `plan-cards.tsx:316`, single-sourced beside the
  other ruled lines in `marketing-voice.ts`; the four sibling one-liners (`pricing-teaser.tsx:37`, `faq-data.ts:47`,
  `how-much-fits.tsx:154`, `llms.ts:133,233`) aligned to the same order (videos first, unlimited events); two or three
  "slightly more engaging" phrasings offered in the Handoff for his overrule on the alias.
- `host-empty=album`: "Your first album starts here" in `events-empty-teaser.tsx:41-43`; its body line loses "No app, no
  account"; the CTA stays "Create your first event" into the wizard.
- `gate=ask` with his adjustment: the body of `enter-event-prompt.tsx:56-59` becomes "For safety, the host has requested
  you confirm your email. One tap and you're in." (verbatim; the eyebrow, the title and the password path unchanged). His
  "big one" (skip confirmation for a badge) is the `guest-verify` exploration below, not this lane.
- `empty=starts`: "The album starts with you" in `gallery-empty-state.tsx:69-76`; the CTA "Be the first to add a photo" stays.
- `moment=today`: `guest-upload.tsx:77` unchanged. His "redesign our toasts" is the `toasts` exploration below.
- The finding to write up (the lane, in `marketing-voice.ts`'s head comment and `docs/systems/`): the two deliberately
  identical questions (`host-empty`, `empty`) got one voice, the album noun and "starts".

**`body-type` r1 (seven; six wire now, `buttons` goes to round two on the same board):**
- `reading=16` (every guest-facing sentence; the 26 `text-[15px]` go), `working=14` (the app's body; the admin "can break
  away" toward density, so the admin's own sizes are mapped where equal and otherwise left for the `admin` board),
  `marketing=fluid` (16 at a phone to 18 at a desk, a clamp like the heading steps), `caption=10` read with his note as
  TWO bottom steps: the caption step stays 12 (the labels he named) and a `micro` step at 10 is the FLOOR (the event
  cards' metadata chips, count pips; nothing under 10 outside depicted type), `label=12-08` (every uppercase label,
  marketing and app, at 12 px on 0.08em; the Eyebrow atom and the 75 `tracking-[0.14em]` literals move; he may drop to 11
  later), `leading=length` (2 x size - 8: 10/12, 12/16, 14/20, 16/24, 18/28; the marketing clamp's leading a clamp too).
- `buttons=ladder` "not a direct selection, more work required": round two on `buttons` alone (below); the wiring lane
  leaves Button's sizes as today (the `sm` literal stays until the rung is ruled).
- The write-up: the steps as tokens with leading and tracking companions in `theme.css` beside the heading steps,
  `TYPE_STEPS` and `cn()` knowing them, the policy test extended from headings to body sizes (stock classes that equal a
  step are on the ladder; px literals and off-step stock sizes fail; depicted type and the named exceptions exempt), the
  Library's foundations page, `design-system.md`'s type section refined in place.

**`glass` r1 (seven; the recipe goes to round two FIRST, the wiring follows it in one lane):**
- `recipe=frost` with "worth a second round ... so we can nail our glass from the start", `reel=white` with "may be worth
  exploring making this the standard - I don't want to have separate glass treatments and would prefer to find a global
  that works everywhere": round two asks the ONE material (Frost, Crystal, White-on-Frost) on every glass surface at once.
- `grades=one`, `behind=album` (the album blurred at half brightness behind the lightbox), `row=bar` (one pane holding the
  host's three controls), `paper=dark` (dark glass over media whatever the theme): rulings that wire with the material.
- `tiles=?` with his rule: on a mobile image card nothing but an active like mark, a video play mark and a subtle like
  count (state, never a control); every action (like, download, select, hide) lives in the lightbox's controls, select
  handling multi-item. A standing ruling for `media-viewer`, `app-vocabulary`, `guest-shape` and `host-curation` (the
  carried call below), wired by the glass lane on the tiles it owns and by `media-viewer`'s wiring in the lightbox.

**`app-shape` r1 (eight; two wiring lanes now, round two on the home across host states; the board stays):**
- `home=pulse`: `/dashboard` becomes the front page ("what needs you, then what just arrived": the waiting queues and the
  storage line first, the photographs of the last hour, then your events); the five-chip inbox (`dashboard-feed.tsx`,
  `filter-chips.tsx`) goes. His "worth more dashboard explorations ... across all host states" is round two (below).
- `density=cover` + "let's do both": the events list keeps the cover cards AND gains a row/table view behind a toggle
  aligned right opposite "Your events" (sorting and filtering in the table); the choice persists per host; the board's
  `lands` says every list of events in the app (the bin, saved events, the hosts you follow) shares the shape.
- `event=hub` + his three additions: a row of cards (Review, Reel, Guests, Settings LAST; the board's "Album" card becomes
  Settings), the gallery BELOW the cards by default in most-recent order, a clickable QR code horizontally centred to the
  left of the title + metadata stack that opens the share mini-modal.
- `nav=crumbs`: a trail in the bar (Partyreel / the event / the room), the cards row going sticky as the album scrolls
  ("could pick up sticky-style from the cards"), and a creative way to keep Share reachable from the sticky row.
- `share=room` overridden by his `settings` note: sharing gets ONE comprehensive surface as a SHEET (the code, the link,
  the posters, the invite, the custom link claim, anything future), reached from the event's menu and from the mini-modal;
  the QR at the left of the title opens a view-transition-style mini-modal (a bigger scannable code, view/copy the link,
  a door to the sheet); a third, subtler event link with a copy button sits under the metadata line.
- `settings=sheet`: the settings page of cards becomes a sheet over the album (the album stays behind it); the photo bin
  joins the album as a filter; "Deleted" names one thing.
- `you=?` with his answer: a person's own photos, likes and connections live on the PROFILE page (an owner mode of
  `/u/[slug]`), where the avatar and profile settings can also be changed; plans, billing and profile management live on
  the ACCOUNT page (billing gets its first door: a Plan card); the avatar may be changed in both places. The user menu
  gets the two doors. The personal feeds leave the home.
- `phone=same`: one shape at both sizes, the crumb header narrowed, the cards row scrolling sideways with a conditional
  gradient at either edge, sticky after the page scrolls past the cards.

## The ownership rules every lane follows this round

- One manifest owner per path; no two lanes' `owns` overlap, not even by a shared prefix. A second lane's single-line
  edit in another lane's file rides the lane-check exception line of its Handoff ("exceptions and why"), applied AFTER
  syncing past the owner's merge, never before. `merge-lane.sh` aborts only on real git conflicts (same or adjacent
  lines, a delete against a modify), so distinct hunks merge clean; the pre-handoff sync carries the first lane's hunks.
- `ladder-wiring` owns explicit FILES (its real footprint, about seventy: `git grep -lE
  'text-\[(7|8|9|11|13|15|17)px\]|text-\[0\.8rem\]|tracking-\[0\.14em\]' -- src ':!src/app/(dev)'`), never a prefix
  another lane sits under; a file whose only sizes are stock classes equal to a step needs no edit at all.
- The app-shape lanes build on stock classes that EQUAL a step (`text-sm` 14, `text-xs` 12, `text-base` 16,
  `text-[10px]`) and never on the announced step names: Tailwind v4 emits no utility for an undeclared `--text-working`,
  the element silently inherits, and nothing in the gate sees it. The names are a mechanical swap after a lane syncs
  past the ladder's merge, or a follow-up.
- A wiring lane never deletes, renames or breaks the props of a module the lab imports: every module
  `git grep -l "from \"@/" src/app/\(dev\)` resolves to (`filter-chips`, `trash-section`, `storage-meter`, `feed-section`,
  `empty-section-teaser`, `event-card`, `app-shell`, `feed-section-header`, `event-filter-pills`, `review-section`,
  `use-review-triage`, `recently-deleted-grid`, `event-settings/*`, `event-slug-control`, `my-uploads-gallery`,
  `lib/dashboard/filters.ts`, `media-grid`, `host-selection-provider`, `review-actions`, `gallery-actions`, `styled-qr`,
  `host-media-grid`, `export-dialog`, `download-all-button`, `selectable-media-grid`, `review-grid`, `feed-section-empty`,
  `qr-preset-picker`, `enter-event-prompt`, `gallery-empty-state`, `likes-provider`, `password-gate`, and more): a retired file stays on disk with a head comment
  naming the boards that draw it; `AppShell` and `EventCard` props stay backward compatible; `pnpm design:rules` when
  `component-notes.ts`'s AppShell contract changes.
- `docs/systems/host-app.md` is split by heading: `home-wiring` edits inside `## Dashboard landing`, `## Events & the
  create flow`, `## First-time host welcome`; `hub-wiring` inside `## QR designer`, `## Custom event link (slug)`, `## The
  event page`, `## Moderation & curation` and one Reel-card door line in `## Reel curation`; nobody touches the H1, the
  ROLE block or `## See also` (the Orchestrator rewrites the H1 at the record); edits stay inside a section body, never
  on a heading line or the blank line before the next heading; the second lane to land syncs first.
- `src/lib/single-source-policy.test.ts` refuses one UPPER_SNAKE export from two `src/lib` modules: `home-wiring`'s
  `lib/dashboard/*` and `hub-wiring`'s `lib/event/*` never both export a `SECTION_LABEL`; `voice-wiring` deletes the four
  sibling Pro lines rather than re-exporting one.
- `content/help/` and `content/blog/` belong to `voice-wiring` alone. The app-shape lanes change what several help
  articles describe (the dashboard, the event page, sharing, settings): each lists the articles it makes stale in its
  Handoff (help how-tos track shipped reality), and one `help-sync` follow-up (Sonnet) rewrites them after both land.
- Every new door a wiring lane adds (the QR and its mini-modal, the copy button, the list toggle, the menu rows, the
  cards) carries `trackAttrs` as the chrome's doors do; every new component gets its `for` line in
  `rules/component-notes.ts` and a `// @contract-for:` test, so it lands in the Library with its `new` badge
  (`pnpm design:rules`); the sheets, the mini-modal and the table read `ui/floating-layer.ts`.
- ONE responsive Sheet for the product (a side panel at a desk, a bottom sheet in a hand, on `ui/sheet.tsx` with
  `ui/drawer.tsx` retired or folded): `hub-wiring` builds it for settings and sharing, and it is the sheet
  `guest-shape`'s dialogs, `profile-page`'s quick-look and `app-pricing`'s object inherit ("apply this sheet concept
  everywhere"); its contract test is the one others reuse.

**Binds.** The bible (`/design/library`), the contracts of every component under a path you own, and the policies;
Will's notes in the ledger and rulings.md; the ownership rules above; CLAUDE.md's working loop (doc-check via Context7
first: Next 16, Tailwind v4, zod v4 and Supabase SSR drift). `DESIGN_PREVIEW_KEY` rides the environment, never a command
line. Never edit a record doc (`docs/CHANGELOG.md`, `STATUS.md`, `ROADMAP.md`, `ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/design/rulings.md`, `docs/reviews/`); a `docs/systems/` fact inside your lane is refined in place and listed below.
Stage explicitly; never `--no-verify` or force-push; the `Co-Authored-By` trailer on every commit.

**Verify on.** For a production lane: the gate on the synced tree (`pnpm design:rules`, the specimen collector
`node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` (10 known warnings on 2026-09-21; the number moves, the exit code is the gate, a warning in a file you touched is yours), `pnpm test`,
`pnpm build`), each on its own exit code; `pnpm lab:smoke --base http://localhost:<your port>` whole; the surfaces the Handoff is
judged on, local at 1440 and 375 (the Orchestrator red-teams them on the alias). For a lab lane: the board at 1440 and 375 with
reduced motion honoured, `pnpm lab:smoke` whole, `pnpm lab:demo --board <board> --base http://localhost:<your port>` pressing
every step (a backdrop-filter step reports UNPAINTED in headless Chrome: capture it by hand and say so). One process at a
time on this machine; your dev server on your own port, killed by port before a build, a test run and the handoff.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none. Every open call was taken inside the lane and is listed under "Calls his to overrule" below; none
  of them is a one-way door (each is a constant or a branch, changeable in a line).

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. No `docs/` path is in this lane's `owns`, and nothing here reaches a production surface: the
  reel's facts live in `host-app.md`, which the wiring lanes own this round. The facts the wiring lane
  should carry into it are under "Announced interfaces" below.

## Deferred (ROADMAP one-liners, bucket named)

- The reel: the gallery payload does not carry `media.file_size_bytes` (the column exists and is NOT
  NULL; the guest RPC's allow-list and `toGridItems` do not return it), so the ladder decides on an
  unknown size and the reader re-checks after the container read. Returning it lets the budget refuse a
  4K original before a single byte is requested.
- The reel: a twenty-minute soak, and a soak against a REAL R2 original rather than a 600 KB fixture,
  once the bucket's CORS precondition lands (not this lane's).
- The reel: an undecodable codec (HEVC or 10-bit on a screen with no decoder) is pinned by a fake in the
  unit tests and has never been met on real hardware here.
- The reel: the decode's long edge is capped at the composition's SHORT side, so a portrait video
  covering a portrait composition is upscaled 1.78x from 608x1080. One line in `decodeSizeFor` raises it
  if Will finds it soft on a wall.

## Handoff (replaces the chat report)

- Head is the WORK commit `8a8fa015` plus the SYNC MERGE `0cbbfc5d` (`origin/launch-prep` had moved to
  `22310b00`; merged, never rebased, and the whole gate re-run on the synced tree). This manifest is the
  only commit after them.
- Every claim below names its artifact.
- Gates on the SYNCED tree, each on its own exit code: `pnpm design:rules` ok (227 components, 1911
  contracts, 18 policies; the generated artifacts did not change), specimens ok (140 specimens on 101
  entries), `pnpm typecheck` ok, `pnpm lint` ok (0 errors, 9 warnings, the 2026-09-22 baseline, none in a
  file this lane touched), `pnpm test` ok (345 files, 3778 passed, 1 skipped), `pnpm build` ok (258 static
  pages), `pnpm lab:smoke --base http://localhost:3137` ok (434 checks, 0 failing). The dev server was
  killed by port before the build, the test run and this handoff.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the owned paths only, plus two
  REGISTRATION-EXCEPTION files, each one added block for this harness and nothing else:
  `src/app/(dev)/design/_data/nav.ts` (+6, the tool's nav entry) and
  `src/app/(dev)/design/_data/catalog.test.ts` (+6, `reel-video` in the tools list the nav test walks). A
  prettier pass had also rewrapped an unrelated `SURFACE_ORDER` line in nav.ts; it was reverted, so that
  diff is six added lines.

### The items

- `window-reader.ts`: the reader is real. mediabunny `Input` over a `UrlSource` with `cache: "no-store"`,
  `mode: "cors"`, an 8 MiB source cache, `parallelism: 1` and two quick retries (0.25s, 0.5s) then fail;
  `getPrimaryVideoTrack`, a size read that doubles as the RANGE PROBE, `canDecode`, a `CanvasSink` into
  an eight-frame ring. Every non-frame outcome is the poster and never a throw, and a statusless
  rejection is reported with `possibleExpiry` (the presign trap). `dispose()` returns the generator and
  disposes the Input in a `finally`, proven by a pin and by `net::ERR_ABORTED` on the in-flight range
  read in the lab.
- The ring is PACED by the draw: `frameAt` prunes what playback has passed, and that is what lets the
  pump pull the next frame, so a clip nobody draws fetches one ring and stops. Memory and bytes are
  bounded by the same number. Two softenings, both "a hold beats a blank": before the window's first
  frame the first frame answers, and a pump that falls behind holds its newest frame rather than dropping
  back to the poster.
- The deck holds at most TWO readers (the playing clip's and the next), evicts the least recently
  acquired, and REOPENS whenever a key's url changes, so an `Input` is never held across a presign roll.
- `budget.ts`: pure. `file_size / duration x window` plus the container's read against the per-clip cap;
  over it the window shortens to a floor, under that the poster. A session ledger charged PER PLAY
  (no-store means every play pays again), charged with the estimate at the cue and reconciled to the
  bytes actually read at the window's end. The K-loop cadence is keyed per clip, so an album's videos
  spread across the cadence instead of all spending on loop 0.
- `ladder.ts`: the whole fallback order in one pure call, cheapest refusal first, so a device that will
  never play motion never opens a reader. Include videos defaults ON (his pick); only Data Saver starts
  it off, read through `readSaveData()`, which never throws.
- `prepare-frame.ts` (a file the brief did not name, and the other half of the encoder seam): the ONE
  place the ladder is evaluated, so the live player, the venue screen and the cut cannot disagree.
- The encoder seam: `encodeReel` awaits `prepareFrame(f)` once, immediately before the frame it prepares.
  `drawReelFrame` stays synchronous and `registry.ts`'s pooled-scratch invariant is untouched.
- The harness is a NEW tool, `/design/lab/tools/reel-video` (the brief left extend-or-add to me; the
  style browser next door grades how a style LOOKS, this grades what motion COSTS, and the two knob sets
  do not belong on one page). It plays a real mov, a real webm and a portrait mp4 from
  `.../reel-video/fixtures/` through a range-capable route of its own.
- Contract tests, all new: `video/budget.test.ts` (24), `video/ladder.test.ts` (14),
  `video/window-reader.test.ts` (27), `video/prepare-frame.test.ts` (10), `video/mood-motion.test.ts`
  (7), `video/encode-seam.test.tsx` (3), `assets.test.ts` (7). Two of them live in `video/` rather than
  beside the file they pin, because `styles/mood.ts` and `encode.ts` are owned as FILES, not prefixes, so
  their sibling test paths are not this lane's; each says so in its head comment.

### Announced interfaces (what the live lane and the cut wire to)

- The video asset, in `reel-types.ts`: `ReelClip.video?: ReelVideoSource | null`, where
  `ReelVideoSource = { kind: "window"; frameAt: (localSec: number) => ReelVideoFrame | null }` and
  `ReelVideoFrame = { image, width, height, localSec }`. `frameAt` is SYNCHRONOUS by contract, takes
  CLIP-LOCAL seconds, advances the ring's cursor (so it is asked in non-decreasing time order), and
  returning null is the NORMAL answer: the renderer draws the poster. `assets.ts` mirrors the same object
  onto `ClipAsset.video`; `mood.ts` reads `clip.video`, because a posterless video has no asset at all.
- `prepareFrame`, in `encode.ts`:
  `EncodeReelOptions.prepareFrame?: (frame: number) => void | Promise<void>`, awaited once before each
  `drawReelFrame`. It must RESOLVE, never reject: a window that will not land is a poster, not a failed
  export. Omitted (every reel without video) it costs nothing.
- The wiring object, in `video/prepare-frame.ts`:
  `createVideoPlayback({ props, frame, sourceFor, includeVideos?, everyNLoops?, windowSec?, capBytes?,
  ledger?, deck?, loopIndex?, onDecision?, onFailure? })` returns
  `{ videoSourceFor(i), cue(i), prepareFrame(f), setIncludeVideos(on), includeVideos, decisions(),
  stats(), dispose() }`. THE LIVE LANE WIRES its "Include videos" control to `setIncludeVideos` (its
  start value to `videosDefaultOn(readSaveData())`), its loop counter to `loopIndex`, and the payload's
  per-clip facts (`clipKey` = the media id, `url` = the presigned ORIGINAL, `fileSizeBytes`,
  `durationSec`) to `sourceFor`; it calls `cue(i)` for the clip on screen and the one after it, hangs
  `videoSourceFor(i)` on each clip's `video`, and reports `onFailure`'s `possibleExpiry` into its own
  ETag refetch. THE CUT WIRES `encodeReel(props, { prepareFrame: playback.prepareFrame })`.

### The budget constants (all exported, all one line to change)

- `VIDEO_WINDOW_SEC` 6, `VIDEO_WINDOW_FLOOR_SEC` 2, `VIDEO_CLIP_BYTE_CAP` 6 MiB (a 6s window at
  ~8.4 Mbps: a phone's 1080p original fits, a 4K60 one is refused outright),
  `VIDEO_CONTAINER_OVERHEAD_BYTES` 256 KiB, `VIDEO_SESSION_BYTE_CEILING` 200 MiB,
  `VIDEO_MOTION_EVERY_N_LOOPS` 3, `VIDEO_RING_FRAMES` 8, `VIDEO_POOL_HEADROOM` 4,
  `VIDEO_SOURCE_CACHE_BYTES` 8 MiB, `VIDEO_SOURCE_PARALLELISM` 1, `VIDEO_RETRY_DELAYS_SEC` [0.25, 0.5],
  `VIDEO_MAX_LIVE_READERS` 2, `VIDEO_WAIT_TIMEOUT_MS` 8000 (the encoder's wait only; the live draw never
  blocks).

### What the harness proved, with numbers (local, :3137, Chromium)

- Real containers, really range-read: every read of `landscape-10s.mov` (QuickTime/h264, 608 KB),
  `landscape-10s.webm` (VP9, 677 KB) and `portrait-10s.mp4` (534 KB) answered `206 Partial Content` with
  `Content-Range`. The fixture route is the harness's own, so the 206 path is ours.
- One play decodes the window EXACTLY: 180 frames for a 6s window of a 30fps source, reading 0.52 to
  0.66 MB. Over 76.7s of playback the mov was fetched 4 times for 1.94 MB total (three plays), so the
  8 MiB source cache kept a window from re-requesting a range inside itself.
- Live readers never exceeded 2 in any sample; the third acquire evicts and disposes.
- JS heap over three soaks (about nine minutes in total), sampled every 10 to 20 seconds: a 150s run went
  39.1 to 43.3 MB, a 195s run went 43.3 to 38.7 MB, and a 200s run on the SYNCED tree went 76.5 to
  40.3 MB (it starts high because the page had just compiled, and settles). Flat or falling every time,
  never rising: canvases are pooled and the ring is bounded. The twenty-minute soak is deferred.
- The toggle: Include videos off takes live readers to 0/2 and frames decoded to 0, every video reports
  "poster: Include videos is off", and the ledger keeps its record of what was already spent.
- The cadence: at K=3 the first loop reported "poster: a poster pass in the loop cadence" for two of the
  three videos; at K=1 all three reported motion, at "6.0s (~0.61 MB)", "6.0s (~0.65 MB)" and
  "5.8s (~0.55 MB)" (the third capped by its own clip hold).
- 375 wide: no horizontal overflow (`documentElement.scrollWidth === clientWidth`), and a transition
  captured mid-flight shows the decoded frame CONTAINED over the theme backdrop with the photo below it.
  Reduced motion starts the harness paused.
- No console errors at any point.

### Calls his to overrule (one line each)

- The decode is ASPECT-PRESERVING with its long edge capped at the composition's short side, NOT
  `fit: "cover"` at the composition's size as the brief sketched: the renderer decides cover-vs-contain
  from the clip's declared dims and a mismatched-orientation clip is deliberately CONTAINED, so a
  pre-cropped decode would double-crop it and make the motion disagree with the poster it takes over
  from, mid-clip, on screen.
- A window shorter than its clip's hold ends on a FREEZE of its last decoded frame rather than a snap
  back to the poster, because the poster is usually frame 0 and returning to it reads as a rewind.
- A reader lives for ONE loop and is retired at the loop boundary: otherwise a drained window replays its
  freeze on the next pass and the K-loop cadence never gets to decide again.
- The window a clip asks for is capped by that clip's own HOLD, so a 2.7s hold buys 2.7s and never
  fetches seconds that are not on screen.
- A codec not yet probed is treated OPTIMISTICALLY (open the reader, let `canDecode` downgrade a later
  pass) rather than paying a metadata read before every first decision.
- A NEW lab tool rather than extending `reel-parity`, and the fixtures live in the harness folder behind
  a range route of its own rather than in `public/`. For the record: Next 16's dev server DOES answer 206
  for a `public/` file (measured on `/next.svg`), so the route is a lane-ownership and control call, not
  a workaround.
- `video/prepare-frame.ts` is a file the brief did not name; it is the other half of the encoder seam and
  the single place the ladder is evaluated.
- Five small binaries (1.9 MB in total) entered the repo as harness fixtures, transcoded from
  `partyreel-test-media`; `fixtures/route-note.md` carries the ffmpeg lines that regenerate them.

### The rest

- The help articles this lane makes stale: none. Nothing here reaches a production surface.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. THE INFRA PRECONDITION IS STILL
  OPEN AND IS NOT MINE: until the bucket's CORS gains `range` in AllowedHeaders and `Content-Range`,
  `Accept-Ranges`, `Content-Length` in ExposeHeaders, a range read from the alias answers with a size the
  browser will not report, which this reader treats as `range-unreadable` and draws the poster. That is a
  degradation, not a break, and it is pinned by a test.
- Look at first: `/design/lab/tools/reel-video` with "Motion every K loops" set to "every loop" (the
  default K=3 makes the first loop a poster pass on purpose); then flip Include videos off and watch live
  readers go to 0/2 while the album keeps playing its posters.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-22). The reel round's video engine landed as a library with
a lab harness and no production surface: a range-window reader over mediabunny's `Input` and `UrlSource`
that fetches a bounded window of the ORIGINAL and decodes it on the viewer's device into a small ring the
synchronous draw reads, with a per-play byte budget, a K-loop cadence, a session ceiling and a fallback
ladder whose every rung is the poster. `reel-types.ts` gained the video asset kind and its starred
synchronous contract, `assets.ts` learned it, `styles/mood.ts` draws a decoded frame in the poster's
place, and `encode.ts` gained the one awaited `prepareFrame` a cut pulls through. The harness at
`/design/lab/tools/reel-video` proved it over a real mov, a real webm and a portrait mp4 served by byte
range: 180 frames a window, at most two live readers, a flat heap, and every failure resolving to a still.
