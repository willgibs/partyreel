---
track: reel-cut
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "0abb6459"          # the launch-prep SHA the branch was cut from
board: reel-cut        # a new board: the reel round, the creator
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/reel-cut/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/reel/reel-studio.tsx
  - src/components/reel/studio-moments-picker.tsx
  - src/components/reel/style-rail.tsx
  - src/components/reel/reel-stitching-dialog.tsx
  - src/components/guest/guest-reel-overlay.tsx
  - src/lib/reel/engine/
  - src/app/(dev)/design/sandbox/guest-capture/
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
  - src/components/lab/
  - src/app/(dev)/design/touchpoints.ts
  - docs/design/rulings.md
  - docs/systems/host-app.md
---

# lp/reel-cut

**Goal.** A NEW lab board, wave 2 of THE REEL ROUND (Will, 2026-09-22, rulings.md "the reel, reconceived"): the creator, from the reel to a cut, nine asks (the entry, the room at a laptop and in a hand, the looks, the moments as local selection with three fills, a hidden item for the host, the export's minute, the finish, the free mark, the device that cannot encode), reshaping the retired reel-studio board's room, styles, moments, blocked and wait; every reel frame the real engine over the fixture album; a catalog to select from, nothing wiring production. The Lane section at the foot of the Orchestrator's plan file carries every ask and option; this manifest's brief is a copy of it.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `0abb6459`)

- What this is: the reel round (rulings.md "the reel, reconceived", every sentence his; the plan `~/.claude/plans/great-work-however-1-dapper-twilight.md` "The concept, in one read", section C's creator bullet and section F). A CUT is yours: from the reel, anyone with album access taps "Make your own", picks moments, one of the fourteen looks, portrait or landscape, a length, and the cut renders on the device with the shipped encoder, saves to the phone, and shares as a FILE; on a paid event "Add to the album" sends it through the ordinary upload queue as a video of the uploader's that the live reel skips. DECIDED, NOT ASKED (his rulings and the plan's calls): cuts leave on devices, never stored; the fourteen looks are the cut's (the eight moods roll in the live reel, the six treatments live here); the tier levers stand (the free cut's mark and the shorter length, the paid cut neither; the mark is stamped in the dispatch layer so no style exports unmarked); no music; no end-card; curated randomness, never a timeline (style, orientation, cover, length and order; no per-clip editing); Share is its own tap on the finish screen, never chained off the encode (iOS spends the activation during the render), probed with the REAL file, else Save with a line; "Add to the album" renders only when the payload says video is allowed, rides the upload queue, lands moderated for a guest and approved for the host; the pool is the reel-eligible album, so a cut is never cut from cuts; where the device cannot encode, "Make your own" is absent and the view carries one honest line. The shipped Studio's five sheets (Moments, Style, Cover, Length, Layout), its filmstrip dock and its stitching dialog are the material; the retired `reel-studio` board's `room.tsx` and `pickers.tsx` are in git (`git show 90f29be4:src/app/(dev)/design/sandbox/reel-studio/room.tsx`), never on disk. A board is a CATALOG (bible 22): every option a working picture, the same world (the wedding album the `media-viewer` board uses), every reel frame drawn by the REAL engine over the fixture clips, at 1440 and 375, a lede of at most 240 characters per ask, a minute each for him.
- ASKS (nine): `entry` (how "Make your own" opens from the view: a sheet over the reel that becomes the creator; a room of its own the reel slides into; the album's page with the creator beneath); `room` (the creator at a laptop and in a hand: the reel capped with the work sliding over it, as the Studio shipped; the reel filling the room with the work floating on the ruled glass; a workbench, the reel large and the open sheet a column beside it; reshapes `reel-studio.room`); `looks` (how fourteen looks are offered: the four-column wall in the ruled sheet; one scrolling row with the reel always visible; three to start and the rest behind More; reshapes `reel-studio.styles`); `moments` (LOCAL selection with three fills, "the reel's picks", "only mine", "everything": the sheet over the reel; a pool under the reel never over it; the album itself with the cut in a tray; reshapes `reel-studio.moments`); `blocked` (a hidden item for the HOST alone, who still sees it in the pool: the tile says it itself; a line on the tap; the ruled tooltip only; reshapes `reel-studio.blocked`); `wait` (the export's minute: the frame stacking and counting down the moments still to draw, with Cancel; a bar across the reel's foot while it keeps playing; a modal as shipped; and what a backgrounded tab and a lost context do, drawn as a note on each; reshapes `reel-studio.wait`); `finish` (the finish screen: Save, Share as a file, Add to the album, Make another as four equal doors; Share leading with the rest beneath; Save leading with Share and Add as a pair); `mark` (the free mark in the preview: drawn exactly where it exports, with one line naming the paid plan; drawn with no line; a corner chip that says "free" and links); `noencode` (the device that cannot encode: the honest line in the view where the button was; a greyed button with the line; nothing at all). `guest-capture.follow` and `guest-capture.landing` are theirs; name them and ask nothing they ask.
- Build from the kit (`src/components/lab/`; the app-side boards are the precedents; `src/components/reel/reel-studio.tsx`, `studio-moments-picker.tsx`, `style-rail.tsx`, `reel-stitching-dialog.tsx` and `src/components/guest/guest-reel-overlay.tsx` are the truth for the shipped options, never edited); register in `registry.ts`, `boards.ts` and `touchpoints.ts` (your own lines only; a NEW board registers at the HEAD of `DESK_ORDER`; the Orchestrator moves the six reel boards below `media-viewer` at the merges); no em-dash; every string inside the registry test's limits.
- Owns: `src/app/(dev)/design/sandbox/reel-cut/`. Reads, never edits: the files above, `src/lib/reel/engine/`, `src/app/(dev)/design/sandbox/guest-capture/`, `src/app/(dev)/design/sandbox/gallery-fixtures.ts`, `src/components/lab/`, `src/app/(dev)/design/touchpoints.ts`, `docs/design/rulings.md`, `docs/systems/host-app.md`.
- Tests: the registry tests; `lab:smoke` whole; `pnpm lab:demo --board reel-cut --base http://localhost:<port>`; the gate with every exit code.
- His to overrule: the nine questions are his; nothing in this lane wires production.

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

Three calls the goal left open. Each is TAKEN and built on, and each is drawn on the board itself as a
carried call (`spec.ts`'s `carried`), so Will meets them above the sections rather than a page away.

- **`world`: whose cut is on the board, and on what kind of event?** TAKEN: Priya's, the guest
  `media-viewer` and `guest-capture` already draw at Maya and Jay's wedding, on a PAID event, so
  "Add to the album" exists at the finish; `mark` asks its own question on a free one and says so.
  If he overrules: a host-first board would be drawn from the hub and the pool would start
  hidden-aware, which changes `entry` and `blocked` and nothing else.
- **`settings`: do orientation, cover and length still get controls?** TAKEN: yes, the shipped tray
  of five (Moments, Style, Cover, Length, Layout), drawn on every room but never asked, because
  "curated randomness, never a timeline" is ruled and nothing here edits a clip. If he overrules:
  name the chip that goes and the tray loses it.
- **`fills`: what are the three fills called?** TAKEN: "The reel's picks", "Only mine", "Everything"
  as placeholders. The SETS are real and measured (8, 5 and 23 of the album's 26); the words are a
  copy round's and any of the three can be renamed without moving a pixel.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. A lab-only lane owns no system fact; `docs/systems/reel.md` is born at the round's record and
  `host-app.md`'s "Reel curation, the live composer, and the .mp4 export" is the wiring round's to
  rewrite, not this one's.

## Deferred (ROADMAP one-liners, bucket named)

- Lab workflow: `defineExploration` could take a `tile` hint per ask that also drives the stage's own
  width, so a board whose one question is "at a laptop and in a hand" does not have to hand-roll a
  two-frame scene (`scene.tsx`'s `TwoScreens` is the third board to build one of these).

## Handoff (replaces the chat report)

- Board commit `254b4ae4`; sync merge with `origin/launch-prep` (which had moved 19 commits, the two
  sibling reel boards among them) `9a6b6def`. Pushed on `lp/reel-cut`.
- Gates on the SYNCED tree, each on its own exit code: `pnpm design:rules` ok (228 components, 1916
  contracts, 18 policies) · specimen collector ok (140 specimens on 101 entries) · `pnpm typecheck`
  ok · `pnpm lint` ok (0 errors, 9 known warnings, none in a file this lane touched) · `pnpm test` ok
  (345 files, 3784 passed, 1 skipped) · `pnpm build` ok (258 pages) · `pnpm lab:smoke --base
  http://localhost:3134` ok (471 checks, 0 failing; `reel-cut` reads 730 words against the 1200
  budget) · `pnpm lab:demo --board reel-cut --base http://localhost:3134` ok (9 steps, 0 failing,
  "Every step draws its options"; tallest `room` at 2.6 screens, wordiest `mark` at 275 words).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/reel-cut/`
  (seven files) + this manifest + the three registration files (`sandbox/registry.ts`,
  `(shell)/lab/boards.ts`, `design/touchpoints.ts`, my own lines only) + ONE exception:
  `docs/design/library.md`, which is GENERATED by the gate's own `pnpm design:rules` from my board's
  registration row and is pinned fresh by `rules-registry.test.ts` ("library.md is stale"), so it
  cannot be left out. Its only delta against `launch-prep` is the standing-board count (19 to 20) and
  my board's row. Four lanes touching that count line is exactly the collision the head-of-list rule
  was changed for: at the merge, take either side and re-run `pnpm design:rules` rather than
  hand-resolving. My own sync merge resolved it that way.
- The items, one line each (nine asks, twenty-seven options, every one drawn by construction):
  - `entry`: how "Make your own" opens from the reel. Recommended `room` (a place of its own the cut
    slides into), because a cut has fourteen looks against the reel's eight and its own clip list,
    orientation and length, so a sheet over the view puts two Style controls two inches apart.
  - `room`: the creator at both sizes, drawn at 1440 AND 375 in one step. Recommended `bench` (the
    open panel beside the cut at a laptop, today's room in a hand): the capture measures the panel
    covering 0 percent of the cut on the bench against a real number on the other two.
  - `looks`: how fourteen are offered. Recommended `wall`, and the board's own reason is visible:
    every tile is HER clips drawn by the engine, so the wall does not need the cut behind it.
  - `moments`: the local pick with three fills. Recommended `pool` (a band under the cut, never over
    it). The fill knob is live, so the same option can be read at 8, 5 and 23 moments.
  - `blocked`: the hidden tile only the host meets. Recommended `caption` (the tile says it itself),
    since a tooltip answers a pointer and never a thumb.
  - `wait`: the export's minute, each option carrying what a backgrounded tab and a lost context do.
    Recommended `stack` (the frame stacks and counts the moments down).
  - `finish`: Recommended `share` (Share leads, the rest beneath), with the plan knob so the screen
    can be read with and without "Add to the album".
  - `mark`: Recommended `line`. All three draw the REAL free mark, stamped by the engine's dispatch
    layer exactly where the file will carry it; what varies is what the room says about it.
  - `noencode`: Recommended `line` (one honest sentence where the button was).
  - A kept option lands in the Library as the creator's working version at the wiring round, not as
    another exploration (his standing rule); the board retires at that wiring.
- Calls his to overrule, one line each: the three carried calls above (`world` the paid event and
  Priya as the maker, `settings` the shipped tray of five drawn but not asked, `fills` the three
  placeholder words). Two smaller ones inside the board's own craft: the export verb reads "Make it"
  (the Studio's word was "Download", which no longer describes what happens), and the mark's line
  reads "Free cuts carry the small mark and run to 30 seconds. Pro removes both."
- The help articles this lane makes stale: none. Nothing here wires a production byte; the reel's
  six help articles are the sweep lane's, already listed in the round's plan.
- Assets requested from Will: none. Every frame is the engine over the twelve bootstrap stills the
  rest of the lab already reuses.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Findings worth keeping (each already fixed here, each a rule for the next board over this world):
  1. A full-width panel must cap its content. The shipped sheet only ever stood over a 360 px room,
     so at 1440 it drew a four column wall at 350 px a tile and three of fourteen fitted; `room.tsx`
     now holds a 560 px reading column inside any sheet or foot band.
  2. A tooltip cannot live inside the tile that clips its own photograph. `blocked=tooltip` first
     drew nothing at all; the clip is an inner box now and the tooltip its sibling, and the two
     hidden fixtures were moved off column zero so a centred tooltip is not halved by the frame edge.
  3. A quiet door loses its icon and a type step, or three of them (one the five-word "Add to the
     album") want 374 px of the 343 a phone has.
  All three were caught by `--save-shots` captures, not by eye.
- Not mine, seen and worth saying: every lab route logs `TypeError: window.__reelLive is not a
  function` in the browser console, on `identity-door` as much as on this board. Nothing in the repo
  defines or calls `__reelLive` (`git grep` is empty), so it arrives from the browser environment.
- Look at first: `/design/lab/reel-cut`, step `room` with the sidebar collapsed: the bench at 1440
  is the board's strongest frame (the cut large on the left, all fourteen engine-drawn looks standing
  beside it). Then `mark`, where the engine's own "partyreel.com" stamp sits in the frame exactly
  where the file will carry it, and `wait`, where the cut's frame stacks and counts down.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-22). `reel-cut` opened the creator to the lab as wave 2
of the reel round: nine decisions on what a guest meets after tapping "Make your own", drawn over the
album `media-viewer` already uses, with Priya as the maker and the host appearing once, at the hidden
tile no cut can take. The retired `reel-studio` board's room, looks, moments, blocked tile and wait
were reshaped for a cut rather than a stored reel (no publish lamp, no Share as the room's act, the
pool the reel-eligible album), and three new questions were added that only the new concept has: the
finish screen's doors, the free mark drawn where it exports, and a device with no encoder. Every reel
frame is `drawReelFrame` over the fixture clips in one pass of eighteen draws, the free mark
included; nothing on the board presigns, encodes or writes a row.
