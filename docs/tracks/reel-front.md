---
track: reel-front
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "17f17e57"          # the launch-prep SHA the branch was cut from
board: reel-front      # a new board: the reel round, the album's head
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/reel-front/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/guest/event-experience.tsx
  - src/components/guest/guest-reel-card.tsx
  - src/components/reel/poster-card.tsx
  - src/components/guest/entry-shell.tsx
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/lib/demo.ts
  - src/app/(dev)/design/sandbox/guest-capture/
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
  - src/components/lab/
  - src/app/(dev)/design/touchpoints.ts
  - docs/design/rulings.md
  - docs/systems/guest-flow.md
---

# lp/reel-front

**Goal.** A NEW lab board, THE REEL ROUND (Will, 2026-09-22, rulings.md "the reel, reconceived"): the album's head, seven asks (the living tile, its verbs, the small states, the yours-first beat, the door's backdrop where the decision is already full, the head once uploads close, the host's hub card as the reel's face), every tile option measured for what it adds to the first paint; a catalog to select from, nothing wiring production. The Lane section at the foot of the Orchestrator's plan file carries every ask and option; this manifest's brief is a copy of it.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `17f17e57`)

- What this is: the reel round (rulings.md "the reel, reconceived"; the plan's "The concept, in one read", sections C and F). The reel plays from a living tile at the head of the album. DECIDED, NOT ASKED: the tile exists from the third reel-eligible item and is absent under it or with the host's switch off; the tile is its OWN slot directly above the `aboveAlbum` slot (the demo's turn card and paired lines keep their one slot and stay adjacent to the first photograph); the reel never renders behind a door for a gated viewer (a teaser viewer sees no reel; at `none` the backdrop stays the ghost pack), so the door-over-the-moving-reel option exists ONLY where the decision is already `full`; every reel surface's stills are `preview_key`; "yours first" reads the approved payload only (a held first upload never enters a take). Every option MEASURED for what it adds to the album's first paint (say the cost on the tile: the engine is a lazy boundary and a tile that plays must load it after the album is interactive; a still first, the player starting on intersection). The retired `reel-studio` board's files are in git, not on disk: `git show 90f29be4:src/app/(dev)/design/sandbox/reel-studio/<file>` (`stills.tsx`, `room.tsx`, `pickers.tsx`, `surfaces.tsx`, `fixtures.ts`, `spec.ts`) shows how every reel frame was drawn by the real engine over fixture clips.
- ASKS (seven): `tile` (what the living tile is: the live player in thumb mode, a still first; a slow crossfade of the newest stills with no engine; a framed still with a play mark and a count); `verbs` (the tile's verbs: Watch and Add yours; Watch alone; Watch and Make your own); `states` (the small states: 0, 1 and 2 items, and the switch off: nothing; a line "two more and the reel begins"; the tile dimmed with the count); `yours` (the beat after a guest's first upload: the tile says "yours is in it" and the reel leads with it; the tile unchanged; a toast); `door` (the door's welcome, only where the decision is already `full`: over the moving reel, blurred; over the nine stills as shipped; over one still); `closed` (the head once uploads are closed, the keepsake state the hero used to own: the tile as during the event minus Add yours; a larger keepsake tile; the reel playing in place at the head); `hub` (the host's hub Reel card as the reel's own face: the living thumb with "live"; the labelled card as shipped; the thumb with the count and the switch's state); and the `/demo` order against the turn card is drawn inside `tile` at 375 and 1440 (both present at once). `guest-capture.moment` and `host-curation.arrivals` are theirs; name them and ask nothing they ask. This board reshapes `reel-studio.door` and `reel-studio.guests`, whose product is gone.
- Build from the kit; the truth for the shipped options: `src/components/guest/event-experience.tsx` (the slots), `src/components/guest/guest-reel-card.tsx`, `src/components/reel/poster-card.tsx`, the door's `src/components/guest/entry-shell.tsx`, the hub's `src/app/(app)/dashboard/[eventId]/page.tsx`; register (a NEW board at the HEAD of `DESK_ORDER`; the Orchestrator reorders at the merge); no em-dash; the registry test's limits.
- Owns: `src/app/(dev)/design/sandbox/reel-front/`. Reads, never edits: the files above, `src/lib/demo.ts` (the one-slot rule), `src/app/(dev)/design/sandbox/guest-capture/`, `src/app/(dev)/design/sandbox/gallery-fixtures.ts`, `src/components/lab/`, `src/app/(dev)/design/touchpoints.ts`, `docs/design/rulings.md`, `docs/systems/guest-flow.md`.
- Tests: the registry tests; `lab:smoke` whole; `pnpm lab:demo --board reel-front --base http://localhost:3139`; the gate with every exit code.
- His to overrule: the seven questions are his; nothing in this lane wires production.

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

- none: the seven asks are the board's own output, not a blocking question; every implementation call this lane took
  on its own recommendation is listed under "Calls his to overrule" below instead, since he can overrule any of them
  directly on the board at his review.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none: this lane owns no `docs/systems/` path; nothing here changed a fact outside its own sandbox directory.

## Deferred (ROADMAP one-liners, bucket named)

- The lab and the kit: the tile's first-paint cost (Handoff, below) is a source-size proxy, never a real bundle
  trace, because the feature has no production route yet to trace; `reel-guest-wiring` should re-measure with a real
  `React.lazy` boundary and Next's build output once the tile is wired, and correct the number if it drifts.

## Handoff (replaces the chat report)

- Board commit `5c9474c2` (the seven-ask board, `reel-front/` new). Two syncs past `origin/launch-prep` while
  building: first `2f920be6` (`reel-view`, the `identity-*` boards, `reel-engine-video`; the touchpoints/registry/
  boards.ts registration conflicts resolved by keeping both sides' lines) then `7d6d7bb7` (`library.md` regenerated);
  the app was restarted for a model update between sessions (every process killed, nothing uncommitted lost) and a
  second sync followed, `cfba86ed` (`reel-screen`, `reel-engine-live`; a clean auto-merge, no conflicts) then
  `ecec394a` (`library.md` regenerated again, 20 standing boards). Pushed throughout, including a `wip:` checkpoint
  (`8fcc9c4e`) at the coordinator's word right before the restart. Head not named here by design (Program.md): the
  chat report's own line carries it.
- Every claim below names its artifact, so the Orchestrator checks rather than believes.
- Gates on the fully synced tree (past `reel-screen` and `reel-engine-live`), each its own exit code: `pnpm
  design:rules` ok (228 components, 1916 contracts, 20 standing boards) · specimens ok (140 specimens on 101 entries)
  · `pnpm typecheck` ok · `pnpm lint` ok (9 known warnings, 0 errors, baseline unmoved, none in a file this lane
  touched) · `pnpm test` ok (3867 passed, 1 skipped, 350 files) · `pnpm build` ok (259 pages) · `pnpm lab:smoke --base
  http://localhost:3139` ok (469 checks, 0 failing) · `pnpm lab:demo --board reel-front --base http://localhost:3139`
  ok (7 steps, 0 failing, every option drawn: `tile` moves up to 21.02%, `verbs` 1.25%, `states` 13.13%, `yours`
  3.61%, `door` 73.70%, `closed` 68.93%, `hub` 4.36%; no UNPAINTED, no "same picture": one of each was found and
  fixed mid-build, see below; numbers stable across both pre-restart and post-restart runs).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/reel-front/*` (new, 7
  files) + `src/app/(dev)/design/touchpoints.ts`, `src/app/(dev)/design/sandbox/registry.ts`,
  `src/app/(dev)/design/(shell)/lab/boards.ts` (the registration exception, this board's lines only) +
  `docs/design/library.md` (generated) + this manifest. Nothing else.
- Registration: on the Orchestrator's mid-build correction, registered beside `guest-capture` in all four lists
  (`RulingId`, `SandboxId`, `RULINGS`, `DESK_ORDER`) rather than at a shared head spot; the first sync then found
  `reel-view` and the `identity-*` chain had also landed beside neighbours of their own (`reel-view` after
  `media-viewer`, `identity-door`/`claims`/`profile` after `guest-capture` too), so the two touchpoints.ts conflicts
  were resolved by keeping every side's line (commit `2f920be6`); the second sync (`cfba86ed`, past `reel-screen` and
  `reel-engine-live`) auto-merged clean with no conflicts at all, since neither of those touched the same lines.
- The items, one line each (recommended marked ★; every option is drawn on the board, this is the builder's read):
  - `tile`: ★ the engine, playing (thumb-mode crossfade of real engine frames, lazy after first paint); a slow
    no-engine crossfade of plain stills, and one framed still, are the cheaper alternatives, both drawn.
  - `verbs`: ★ Watch alone (the view already carries Add yours / Make your own in its own control set); Watch+Add
    and Watch+Make add a corner control, both drawn.
  - `states`: ★ Nothing at all under three items or with the switch off (a promise with no picture is the empty-state
    failure this system already rejected once); a text line and a dimmed box are drawn, toggled by a `Count` knob
    (0/1/2).
  - `yours`: ★ the tile's corner swaps to "yours is in it"; the tile unchanged, and a one-time toast, both drawn.
  - `door`: ★ the album's stills, dimmed, as shipped (the welcome teases the album, not the reel); the moving reel
    and one still are drawn, all three only where access is already `full` (ruled).
  - `closed`: ★ it plays in place, always (the same fixed slot, now autoplaying, the keepsake promotion without
    reopening the one-slot decision); the same tile minus Add yours, and a larger keepsake tile, both drawn.
  - `hub`: ★ the labelled card, as shipped (Review/Guests/Settings are text-only; one picture on four breaks the
    row's rhythm); a living thumbnail and a still-with-count are drawn.
- Calls his to overrule, one line each (lab-only design choices, never wired):
  - The living tile is a full-bleed HORIZONTAL reshape of the shipped `PosterCard` (2:1 at a phone, 21:9 at a
    laptop), not its 4:5 portrait keepsake shape: the slot it sits in (`event-experience.tsx`'s BLEED area, directly
    above `aboveAlbum`) is a wide band, never a tall card.
  - The fixture world is Maya and Jay's wedding (`guest-capture`'s and `reel-view`'s own world), for continuity across
    the reel round's boards; a fresh 12-photo pool, one marked as the viewer's own for the `yours` ask.
  - The crossfade paces: about 1.1s a still where the engine is "playing" (reads as a reel), about 3.2s where it is
    explicitly the no-engine option (reads as a slow rotation): the whole distinguishing evidence for that ask
    beyond image source.
  - Reduced motion: the "playing" depiction rests on frame 0 (matching `CanvasReelPlayer`'s own convention), the
    "still"/"framed"/"counted" depictions rest on a curated later frame; found needing this split via `lab:demo`
    (below), not decided up front.
- Two real defects found and fixed while building, both from running the actual gate rather than trusting the code:
  1. `lab:demo`'s "same picture" check (`--threshold 0.1%`) caught `hub`'s "living" and "counted, with the switch"
     options rendering IDENTICAL pixels (0.055% diff) under `prefers-reduced-motion: reduce`, which is `lab:demo`'s
     own default capture mode: both froze on the same engine frame (`heroIndex`). Fixed by resting the "living"/
     "playing" depiction on frame 0 instead (`board.tsx`'s `EngineMedia`, `parts.tsx`'s `Crossfade` `restIndex` prop,
     renamed from `heroIndex` for clarity); re-ran clean at 4.36% max diff, every pairwise diff now 3.4% or more.
  2. `react-hooks/set-state-in-effect` (a real lint ERROR, not a warning) on a corrective `setFrames()` call inside
     `useEngineFrames`'s effect, added to let a late-mounting section adopt an already-finished render pass. Fixed
     with a lazy `useState` initializer reading the module cache instead (`engine.ts`), which cannot race the effect
     (one JS thread, no promise callback lands between a render and its own effect committing).
  3. The `hub` ask's own measure function read `getBoundingClientRect()` on a `display: contents` wrapper (used only
     to carry a `data-rf-hub-reel` marker), which has no box in Chrome and read 0 by 0px. Fixed by moving the marker
     onto `HubReelCardBody`'s own root element and deleting the wrapper; the caption now reads real numbers (158 by
     94px, matching the shipped card's `h-24 w-40`).
- First-paint measurement (the `tile` ask's own requirement), method named: summed and gzipped the TypeScript source
  of every module the "engine, playing" and "one framed still" options' `EngineMedia` component imports transitively
  (`engine.ts` itself, `build-reel-props.ts`, and the engine's `asset-cache`, `assets`, `canvas2d`, `constants`,
  `contract`, `layout`, `reel-types`, `registry`, `style-registry`, `styles/mood`, `themes`, `timeline`):
  101,818 bytes raw, 41,327 bytes gzipped (about 40 KB), a CEILING since production minification shrinks it further
  and the number is TS source, not a bundled/tree-shaken artifact. The "slow crossfade, no engine" option imports
  none of this: its cost is the fixture images alone, already paid by the album. `mediabunny` (video decode/encode)
  is NOT in this set; stills-only assets never load it. Script at
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/reel-front/measure-engine.mjs`.
- Visual verification beyond `lab:demo`: the Browser pane at 375 and at 1440, reduced motion off, confirmed the
  `tile`, `door` and `hub` scenes render as designed (a real engine-graded wedding photo in the tile's frame,
  "Maya & Jay · Cinematic · 12 moments"; the blurred album grid behind the welcome sheet; the Reel/Guests cards at
  matching box sizes on the hub); screenshots not saved (ephemeral pane), the DOM measurements above are the
  durable record.
- The help articles this lane makes stale: none (nothing shipped touches production copy).
- Assets requested from Will: none (bible 18's twelve marketing stills, already reused by every board in the round).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `tile`; every other ask assumes whichever tile type is chosen there; `hub` next, since its recommendation
  (unlike every other ask here) argues AGAINST giving the flagship feature a picture, which deserves a second look.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). The reel round's `reel-front` board asked seven decisions on the
album's living tile at Maya and Jay's wedding: what the tile is (engine playing, no-engine crossfade, or one framed
still), its verbs, its small states before three items, the beat after a guest's first approved photo, the door's
backdrop where access is already full, the keepsake state once uploads close, and the host hub's Reel card. Every
option drawn by the real engine over fixture clips, off-DOM (`engine.ts`) so a portalled lab frame never mounts a
live canvas; `lab:demo`'s own reduced-motion capture caught two options rendering identically and a `display:
contents` measurement reading 0 by 0px, both fixed before handoff. Registered beside `guest-capture` per the
mid-round correction; nothing here wires production.
