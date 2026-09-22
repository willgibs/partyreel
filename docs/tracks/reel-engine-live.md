---
track: reel-engine-live
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "17f17e57"          # the launch-prep SHA the branch was cut from
board: none            # engineering: the rolling live composer and its harness; no board of its own
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/reel/live/
  - src/lib/reel/engine/player-live.tsx
  - src/lib/reel/engine/player-live.test.tsx
  - src/lib/reel/engine/asset-cache.ts
  - src/lib/reel/engine/asset-cache.test.ts
  - src/lib/reel/engine/layout.ts
  - src/lib/reel/engine/layout.test.ts
  - src/lib/reel/engine/timeline.ts
  - src/lib/reel/engine/timeline.test.ts
  - src/app/(dev)/design/(shell)/lab/tools/reel-live/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/reel/engine/
  - src/lib/reel/seed-default.ts      # the repo's one string-to-seed fn, and where the < 1e6 bound is written
  - src/lib/reel/engine/video/        # reel-engine-video's reader, budget, ladder and prepareFrame
  - src/lib/reel/quick-add.ts
  - src/lib/reel/build-reel-props.ts
  - src/lib/guest/reconcile-gallery-items.ts
  - src/app/(dev)/design/(shell)/lab/tools/reel-parity/
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
  - docs/systems/host-app.md
  - docs/systems/uploads-and-r2.md
---

# lp/reel-engine-live

**Goal.** THE REEL ROUND (Will, 2026-09-22, rulings.md "the reel, reconceived": the reel becomes a live, looping montage of everything the album shows, no host action, no stored file). Build the ROLLING live composer beside the shipped fixed one, as a library with a lab harness and no production surface: the seeded take per loop from the quick-add brain, windows overlapping by one clip and handing over mid-hold, an immediate drop, the splice, the surface pacing with the hold guard in planReel, the refcounted bitmap cache, the live player with a monotonic clock and per-clip assets, and the harness at /design/lab/tools/reel-live over local fixtures. The Lane section at the foot of the Orchestrator's plan file carries every deliverable and constraint; this manifest's brief is a copy of it.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `17f17e57`)

- What this is: Will's own project (2026-09-22, rulings.md "the reel, reconceived", every sentence his; the plan `~/.claude/plans/great-work-however-1-dapper-twilight.md` is the Orchestrator's record and you may read it whole, especially "The concept, in one read", "Video in the live reel" and section B): the reel becomes a LIVE, looping montage of everything the album shows right now, alive from the third reel-eligible item, spliced within seconds when an upload lands, obeying the album's gate, no host action, no stored file. The shipped engine (`src/lib/reel/engine/`) is a FIXED-LENGTH composer: every clip decoded up front, the clock zeroed on every props identity, a plan seeded by clip index. Your lane builds the rolling composer BESIDE it, as a library with a lab harness, and wires no production surface (the wiring round does that after his desk review). Nothing here writes a row, presigns, or touches a route. The lesson on record: "reel generation shipped zero design magic because the magic was never prototyped": the harness IS the prototype he reacts to.
- DELIVERABLES (section B of the plan, verbatim where it counts): `src/lib/reel/live/take.ts` (a seeded order per loop: `seed = hash(eventId, loopIndex)`; the quick-add brain (`src/lib/reel/quick-add.ts`, pure, mulberry32) as the ORDERING function: uploader spread, photo and video mix, likes weighing in only where the payload carries counts, the newest ids front-loaded within a loop, "yours first" from the device's own ids, cuts (`reelEligible === false`) never in the order); `src/lib/reel/live/window.ts` (a plan over a window of N clips through the existing `planReel`; windows overlap by ONE clip: window N+1 begins with window N's last clip and the handover happens at a frame where `frameStateAt` reports no transition in flight, so no two plans are ever composited and no background or watermark is drawn twice; the seed `hash(eventId, loopIndex, windowIndex)`, never per loop alone; prefix-deterministic); `src/lib/reel/live/source.ts` (a `ClipSource` over the LATEST gallery items by id: url, poster, dims, `reelEligible`, `type`; `splice(newIds)` queues arrivals soon after the current clip; `drop(ids)` is IMMEDIATE: an id leaving the payload is cut from every planned window and the clip on screen advances on the next frame through the style's shortest transition); `src/lib/reel/live/pacing.ts` (`surface: "hand" | "wall"`: ONE factor on `photoHoldSec`, on every transition's `durationSec` and on the video window); the hold guard in `src/lib/reel/engine/layout.ts` (`planReel` clamps each hold to the SUM of its two adjacent gaps plus two frames, the condition `timeline.ts` names as the thing to fix before a faster theme ships; today it clamps to the max) with a pure test that no surface and mood pair can produce a three-layer frame; `src/lib/reel/engine/asset-cache.ts` gains `retain(url)`/`release(url)` refcounts so eviction never `close()`s a bitmap a playing window still holds (today's LRU closes on evict and a closed bitmap throws inside the rAF tick); `src/lib/reel/engine/player-live.tsx` (a sibling of `CanvasReelPlayer` for a source: prefetch two windows ahead through the shared cache, retain before a window's plan is built and release one window behind; the tick wraps `drawReelFrame` in try/catch that reports through `onFailure` and keeps the rAF alive; a MONOTONIC wall clock the live player owns and never resets; assets keyed PER CLIP ID in a map the source fills, so a style switch rebuilds only the style-derived artifacts while the bitmaps stay and the current frame keeps drawing, and a splice mutates only the upcoming window's plan; IO and visibility gating kept; reduced motion kept; `maxDim` thumb mode kept; `onClipChange(item)` for the caption and the tap-to-jump; `onFailure(count)`; a contract test asserts the drawn frame index is non-decreasing across a style switch and across a splice). Moods only (the registry's `kind === "mood"`; a treatment id falls back to the default mood). The harness at `src/app/(dev)/design/(shell)/lab/tools/reel-live/` (the `reel-parity` tool is the precedent: local fixtures, never a remote picture, because a remote picture taints the canvas) plays a real fixture album with knobs: surface, hold, window, the seed, simulated arrivals (an "Add three" button that splices), simulated drops, the style, Include videos (a STUB until `reel-engine-video` lands; the Orchestrator announces its merge in `docs/tracks/orchestrator.md`, and you sync past it before handoff so the knob comes alive if the timing allows, else it stays a stub and says so). Pure tests for the take, the window's handover, the splice, the immediate drop and the hold guard.
- Constraints you inherit, all starred in the docs: `drawReelFrame` is contractually synchronous (the pooled scratch layers depend on it; `registry.ts`); the engine fetches with `cache: "no-store"` (uploads-and-r2.md's CORS lesson); `planReel` is pure per props and memoized by props identity; the existing `CanvasReelPlayer` and its test (thumb neutrality) are untouched; the six treatments compose a finite set and are out of scope.
- Owns: `src/lib/reel/live/` (new), `src/lib/reel/engine/player-live.tsx` (+ its test, new), `src/lib/reel/engine/asset-cache.ts` and `asset-cache.test.ts`, `src/lib/reel/engine/layout.ts` and `layout.test.ts`, `src/lib/reel/engine/timeline.ts` and `timeline.test.ts`, `src/app/(dev)/design/(shell)/lab/tools/reel-live/` (new; register it the way `reel-parity` is registered in `_data/nav.ts`, `_data/catalog.test.ts` and the tools page, your own lines only). Reads, never edits: the rest of `src/lib/reel/engine/`, `src/lib/reel/quick-add.ts`, `src/lib/reel/build-reel-props.ts`, `src/lib/guest/reconcile-gallery-items.ts`, `src/app/(dev)/design/(shell)/lab/tools/reel-parity/`, `src/app/(dev)/design/sandbox/gallery-fixtures.ts`, `docs/systems/host-app.md` (the reel section), `docs/systems/uploads-and-r2.md`.
- Tests: the pure suites above; the existing engine tests green; the gate with every exit code; `pnpm build`; the harness at :3132 playing a 300-item fixture loop for 20 minutes with arrivals splicing within one clip, no restart, no blank hold, a flat heap (say the numbers in the Handoff).
- Announce in the Handoff: the `ClipSource` interface and the live player's props, since the wiring lanes code to them; every knob's default; what the harness proved.

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

- **None that stop the round.** Every open call was taken and built, and each is listed under "Calls his to
  overrule" in the Handoff with the reason and the cost of reversing it. Two are worth his eye because they
  deviate from the brief's letter to keep its intent: the window's SEED (an index offset rather than a per-window
  hash, because a per-window seed re-rolls the shared clip's scale at every handover) and the SPLICE (the current
  window is re-opened on the clip playing now, because mutating only the upcoming window put an upload up to a
  whole window away: measured at 2.58 s and 2 clips on the first arrival, and one arrival that had not appeared
  inside 30 s).

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- **None.** The reel's own home (`docs/systems/reel.md`) is born at the round's record, and `host-app.md`'s reel
  section belongs to the sweep; nothing in this lane is a fact those docs hold yet. Every invariant this lane
  creates is written where it binds: the hold guard's math in `layout.ts`, the two-layer completeness note in
  `timeline.ts`, the retain rule in `asset-cache.ts`, the seed's 1e6 ceiling in `live/take.ts`, the handover in
  `live/window.ts`, and the payload contract in `live/source.ts`.

## Deferred (ROADMAP one-liners, bucket named)

- **The reel** · `indexOffset` moves from a structural extra in `layout.ts` onto `ReelProps` itself, once
  `reel-types.ts` is free of the video lane.
- **The reel** · the LOOP boundary is the one handover that is not seamless (a new loop means a new seed, so the
  carried clip's Ken-Burns steps once): `reel-view`'s `loop` ask may want a deliberate beat there anyway, and if
  it rules "nothing", carrying the previous loop's seed for that one clip is a half-hour follow-up.
- **The reel** · the live reel's one-per-loop Sentry report when a loop's failure count crosses a threshold
  (the plan's section C) rides the wiring lane that mounts the view; `onFailure(count)` is the seam.

## Handoff (replaces the chat report)

- WORK commit `27c816a3` (the composer, the source, the player, the guard, the harness); SYNC-MERGE commit
  `637e4843` (past `reel-engine-video` at `31171495`; two one-line conflicts, both in the lab's nav and catalog
  test where the two lanes registered a tool at the same spot, both kept). Three commits follow it: `c2f52a22`
  (the motion video wiring, and the first two stalls the soak found), `817996f2` (prettier over this lane's own
  files) and `6350407d` (the slot-chain deadlock, the third stall). All pushed on `lp/reel-engine-live`.
- **The Include-videos knob is ALIVE, not a stub.** It runs through the video lane's `createVideoPlayback`:
  ONE reader deck and ONE byte ledger for the whole session (their ceilings are session promises, and a
  playback per window would have multiplied both by however many windows a night rolls through), a playback per
  WINDOW because clip indices are the window's own, `windowSec` fed from this lane's surface factor so the ONE
  pacing factor reaches the video too, `loopIndex` fed from the TAKE's loop so the K-loop cadence means what it
  says, `sourceFor` reading the ORIGINAL url off the LATEST item so a bucket roll hands the reader a new url
  rather than a dead one, and the motion source hung on the clips BEFORE the decode (`loadReelAssets` copies
  `clip.video` onto the asset as it builds it). Every failure surfaces through `onReport` and draws the poster.
- Gates, each on its own exit code, on the SYNCED tree at `6350407d`: `pnpm design:rules` 0 (228 components,
  1916 contracts on 163 components from 121 contract tests, 18 policies; NO diff) ·
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` 0 (140 specimens on 101 entries; NO diff) ·
  `pnpm typecheck` 0 · `pnpm lint` 0 (9 known warnings, none in a file this lane touched) · `pnpm test` 0
  (350 files, 3867 passed, 1 skipped) · `pnpm build` 0 (259 pages) ·
  `pnpm lab:smoke --base http://localhost:3132` 0 (443 checks, 0 failing). Prettier was run over this
  lane's OWN files by explicit path: `layout.ts`, `layout.test.ts`, `timeline.ts` and the lab's `nav.ts` were
  already drifted before it touched them, so they are left as they were rather than reformatted wholesale.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the owned paths, plus TWO registration lines,
  which is the exception this manifest's brief grants (`register it the way reel-parity is registered`):
  `src/app/(dev)/design/_data/nav.ts` (one TOOLS entry) and `src/app/(dev)/design/_data/catalog.test.ts` (one id
  in the tool list). The tools INDEX page needed no edit: it reads the nav. No generated artifact moved
  (`rules.generated.json`, `docs/design/library.md` and `specimens.generated.json` are all unchanged, because
  the live player deliberately carries no `@contract-for:` marker yet).

**The announced interfaces** (the wiring lanes code to these; every one is exported and typed):

- `ClipSource` (`src/lib/reel/live/source.ts`), built by `createClipSource({ eventId, items?, ownIds?, windowSize?, pass?, cache?, load? })`:
  `setItems(items) -> { added, dropped }` (the album's own payload; it SPLICES what arrived and DROPS what left, and
  the first non-empty call is the seed, never an arrival) · `setOwnIds(set)` ("yours first", from the next loop) ·
  `splice(ids)` · `drop(ids)` · `pendingCount()` · `itemFor(id)` · `isLive(id)` · `eligibleCount()` (the >= 3
  threshold is the caller's) · `revision()` · `setCurrentWindow(i)` · `windowAt(i, look)` · `rewindowAt(from, clipId, look)` ·
  `cutawayFrom(from, clipId, look)` · `prepare(window, { needs, frame, signal })` · `release(i)` · `dispose()` ·
  `stats()`. It takes the album's item shape directly (`LiveMediaItem` in `live/items.ts` is a structural
  SUPERTYPE of `GridMedia`, so a provider hands its array straight in and `reelEligible` lands the day
  `toGridItems` carries it). It imports no style registry, so mounting a source costs the album nothing.
- `LiveReelPlayer` (`src/lib/reel/engine/player-live.tsx`): `{ source, styleId, surface?, holdScale?, orientation?,
  watermark?, includeVideos?, paused?, maxDim?, className?, onClipChange?, onFailure?, onFrame?, onReport? }`.
  `paused` OMITTED means reduced motion decides; PASSED means the caller's control owns it. `onClipChange(item)`
  is the caption and the tap-to-jump; `onFailure(count)` is cumulative and never silent; `onFrame(state)` reports
  `{ globalFrame, localFrame, windowIndex, loopIndex, clipId, failures, video }` once a tick. It renders the
  canvas and NO frame: the tile, the view and the screen each frame it themselves.
- `ReelLook` (`live/window.ts`): `{ styleId, surface, holdScale?, orientation?, watermark?, includeVideos? }`.
  `ReelWindow`: `{ index, loopIndex, startIndex, ids, props, plan, handoverFrame, handoverOffset, overlapIndex }`.
- Knob defaults: surface `hand` (factor 0.70; `wall` is 1.00, the kits as designed) · `holdScale` 1 ·
  window 6 clips · prefetch 2 ahead, release one behind · take pass 12 · video window 6 s x the surface factor ·
  `watermark` false (the live reel is unmarked on every tier) · `includeVideos` false in the player, true in the
  harness · style: moods only, a treatment falls back to Cinematic. `onFrame` also carries the reader's session
  numbers (`video: { liveReaders, bytesRead, framesDecoded, spentBytes }`, null where a window has no motion).

**What the harness proved** (`/design/lab/tools/reel-live`, local fixtures, Chrome at :3132; it renders clean
at 375 with no horizontal overflow and at the pane's desktop width):

- **The soak.** The 300-photograph fixture album, a real Chrome, the harness at :3132, measured in FRAMES
  PLAYED rather than wall clock (the browser pane is shared with other lanes, and the player freezes on purpose
  while its tab is hidden, so wall time would measure the pane and not the reel):
  **14,241 frames drawn without a break** — 9.9 minutes of reel, across a full LOOP roll (the take re-drawn for
  loop 1 over the same 300 items) — while 24 acts landed in it: six "Add three", six "Hide the one on screen",
  six style switches and six surface switches. Over that run: the clock went backward **0 times**; failures
  **0**; the longest a single photograph held was **156 frames (6.5 s)**, which is the WALL surface's own video
  window, not a stall; slots held **2 to 4**, retained stills **11 to 14**, derived assets **16 to 27**, and the
  JS heap sawtoothed between **40 and 74 MB** with no upward drift. **44 distinct video clips played real motion**,
  range-read and decoded on the device, at most **1 live reader** at a time.
- **The two acts, measured by hand while the tab was fronted** (three of each, back to back):
  a DROP of the photograph on screen left in **1 frame (0.04 s)** every time, 0 clips in between, same window;
  an ARRIVAL was on screen in **9, 11 and 12 frames (0.38 to 0.50 s)**, 0 clips in between, same window. Will's
  "spliced within seconds" is half a second, and a hidden photograph is gone on the next frame.
- **What the soak found, and what it cost:** three stalls, all the same shape (the clock kept running while the
  drawn frame stopped), and all now pinned. The prefetch that never refilled after an overtaken load; the
  prefetch that ate the arrival queue while a rewindow waited for a transition; and the slot chain left pointing
  at a released slot, which deadlocked window planning outright. None of the three would have shown in a test
  that did not run for minutes, and the first one held a photograph on screen for 51 seconds.
- **The twenty-minute wall-clock soak was not reached, and that is the honest number.** The browser pane is
  shared: another lane's session navigated the tab twice mid-run, and a hidden tab freezes the reel by design.
  9.9 minutes of continuous reel time with every counter flat is what was measured. `source.test.ts` walks 60
  windows through the release cycle deterministically for the same bookkeeping claim.

**Calls his to overrule on the alias, one line each:**

- The window's seed is the LOOP's, with `planReel` honouring an `indexOffset` so a window is the exact slice of
  the loop's plan: the brief's per-window hash would re-roll `panFrac`, and `baseZoom = 1 + 2*panFrac + 0.015`,
  so the clip shared by two windows would jump ~5% in scale at every handover. With the offset the swap is
  pixel-identical, pinned in `window.test.ts` for all 8 moods at both surfaces.
- `indexOffset` is declared in `layout.ts` as a structural extra on the props, not a field on `ReelProps`,
  because `reel-types.ts` belongs to the video lane this round. Absent, `planReel` is byte-for-byte what it was.
- The hold guard clamps to the SUM of the two adjacent gaps plus two frames. It is a NO-OP for all 8 moods at
  both surfaces (pinned), so no shipped reel's length or pixels move; it binds only on a pacing a board could ask
  for, which is exactly what `timeline.ts` warned about.
- A take's pass is SHUFFLED on the loop's seed and then de-clumped, not chronological. With no likes the brain's
  score is dominated by recency, which is the same number every loop, so the reel would have played the identical
  film for ever. The pass MEMBERSHIP still comes from the brain, so the newest are still in the first pass.
- A splice RE-OPENS the current window on the clip playing now (`rewindowAt`), so the upload is the next
  photograph. The brief's "mutate only the upcoming window" was built first and measured: 2.58 s and 2 clips on
  a good day, and a second arrival that had not appeared inside 30 s.
- A drop takes the style's shortest transition out, from the very next frame (measured at 1 frame, 0.04 s).
- The live player renders no border and no `data-lit`: the bright edge would owe a line in
  `shared/lit-edge-contract.test.ts`, another lane's file, and the frame is the surface's decision anyway.
- No `@contract-for:` marker on `player-live.test.tsx` yet: it would put the player in the Library index, which
  then owes a `for` line in `rules/component-notes.ts` for a component nothing mounts.
- `setItems` does both halves itself (splice what arrived, drop what left) so a provider needs one call; and an
  item that stops being ELIGIBLE (held, hidden, or marked as a cut) is a departure even though its id is still
  in the payload.
- The player never disposes the source: it gives its own retains back and leaves the object to its owner.
- The surface factors (hand 0.70, wall 1.00) and the six-second video window are starting points for `reel-view`
  and `reel-screen`; the harness's Hold slider is the knob their verdicts move.
- The video playback is disposed at EVERY window swap (handover, splice, cutaway, look change), so readers never
  accumulate. The cost is that a video straddling a handover re-opens its reader once; at roughly one video in
  eight clips and one handover in six, that is rare enough to leave, and the alternative is refcounting a deck
  another lane owns.
- The prefetch heals itself on every tick rather than only on an event; a load overtaken by a splice or a look
  change is dropped by a GENERATION counter; it holds off while an arrival is queued (planning the next window is
  what CONSUMES that queue); and releasing a slot re-points the chain at the highest one still there. All four
  came out of the soaks, where each on its own froze the picture while the clock ran on.
- The harness's video fixtures are the `reel-video` lane's own files, through ITS range route (a `public/` file
  does not answer 206 in dev). Read-only: no file of that lane is touched, only three urls are named.

- The help articles this lane makes stale: none (no production surface, no copy).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `/design/lab/tools/reel-live` with the 300-photograph album. Press "Add three" and watch the
  arrival become the NEXT photograph; press "Hide the one on screen" and watch it leave on the next frame;
  change Style mid-hold and watch the grade change without the picture moving. The number to keep an eye on is
  "Times the clock went backward": it must stay at zero, because a reel that restarts is the whole thing this
  replaces.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-22). Built the ROLLING live composer beside the shipped fixed one,
as a library with a lab harness and no production surface: `src/lib/reel/live/` (`items`, `take`, `pacing`,
`window`, `source`), `engine/player-live.tsx`, the hold guard and a window offset in `engine/layout.ts`, refcounts
in `engine/asset-cache.ts`, and the harness at `/design/lab/tools/reel-live`. The handover is seamless by
construction (windows share the loop's seed and differ only by `indexOffset`, so the clip two windows share is the
same clip); an arrival becomes the next photograph rather than the next window's; a drop leaves on the next frame;
the clock never resets; and the Include-videos knob came alive through `reel-engine-video`'s `prepareFrame`
after syncing past its merge. Pure suites for the take, the pacing, the handover, the splice, the drop, the guard
and the slot chain, plus a jsdom contract suite for the player, three of them written against stalls a soak found
and each failing without its fix; the shipped `CanvasReelPlayer` and its thumb-neutrality test were not touched.
