---
track: reel-engine-video
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Every claim below (a retirement, a migration, a gate, a fix) names its artifact (a commit hash, a log line, a file path), so
  the Orchestrator checks rather than believes; a claim with no artifact is read as unverified.
- Gates on the synced tree: design:rules ok, specimens ok, typecheck ok, lint ok (8 known), test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board <board>` ok (a board)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each: `<id>: <the builder's verdict>; a kept one becomes <the Library entry it lands as>`
- Calls his to overrule on the alias, one line each
- The help articles this lane makes stale, one line each (a `help-sync` lane rewrites them)
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
