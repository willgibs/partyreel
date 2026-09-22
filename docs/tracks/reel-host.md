---
track: reel-host
status: handed-off     # open -> handed-off; deleted in the merge commit that integrates it
cut: "0abb6459"          # the launch-prep SHA the branch was cut from
board: reel-host       # a new board: the reel round, the host's side
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/reel-host/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/components/app/event-settings/event-settings-sheet.tsx
  - src/app/(app)/dashboard/page.tsx
  - src/components/app/share/event-sheets.tsx
  - src/app/(dev)/design/sandbox/host-curation/
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
  - src/components/lab/
  - src/app/(dev)/design/touchpoints.ts
  - docs/design/rulings.md
  - docs/systems/host-app.md
---

# lp/reel-host

**Goal.** A NEW lab board, wave 2 of THE REEL ROUND (Will, 2026-09-22, rulings.md "the reel, reconceived"): the host's side of the reel, six asks (where Style lives, the Show the reel row, where Play on a screen lives, the dashboard's line, a host's own cut added to the album, Review's interplay); a catalog to select from, nothing wiring production. The Lane section at the foot of the Orchestrator's plan file carries every ask and option; this manifest's brief is a copy of it.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `0abb6459`)

- What this is: the reel round (rulings.md "the reel, reconceived"; the plan's "The concept, in one read", section D and section F). The host no longer makes a reel; the host SETS its mood (the event's default; a viewer switches on their own device), can switch it off for an event (default on), opens the venue screen from the hub ("Play on a screen"), and sees Review's interplay ("won't play until approved"). DECIDED, NOT ASKED: the hub's Reel card is the reel's own face (drawn on `reel-front`, not here); the style default lives on the event row and the switch beside the guest list switch; a host's cut added to the album lands approved, a guest's moderated; the dashboard's "has a reel" flag becomes "the reel is live" (the switch on and three or more items); the Studio dies with the round.
- ASKS (six): `style` (where the host's Style lives: in the reel view as the host's extra control; in the settings sheet as a row of the eight moods; both, the sheet the home and the view a shortcut); `switch` (the "Show the reel" row: beside the guest list switch with one sentence; at the head of the sheet as the first row; inside the reel view as the host's own toggle); `screen` (where "Play on a screen" lives: a button on the hub beside the cards; inside the reel view as the host's extra; the share sheet as a third door beside the code and the link); `pulse` (the dashboard's line for the reel: "the reel is live" with the count; nothing until three items, then the line; the event card's cover playing); `cut` (a host's own cut added to the album: lands approved with a small cut mark in the album; lands approved with no mark; a confirm sheet first, since the host's bytes are spent); `review` (Review's interplay with the reel: the reel's view tells the host "3 waiting won't play"; the Review room's header says it; nothing, the queue is the queue). `host-curation.count` and `host-curation.arrivals` are theirs; name them and ask nothing they ask.
- Build from the kit; the truth for the shipped pieces: the hub's `src/app/(app)/dashboard/[eventId]/page.tsx`, `src/components/app/event-settings/event-settings-sheet.tsx`, the dashboard's `src/app/(app)/dashboard/page.tsx`, `src/components/app/share/event-sheets.tsx`; register (a NEW board at the HEAD of `DESK_ORDER`; the Orchestrator reorders at the merge); no em-dash; the registry test's limits.
- Owns: `src/app/(dev)/design/sandbox/reel-host/`. Reads, never edits: the files above, `src/app/(dev)/design/sandbox/host-curation/`, `src/app/(dev)/design/sandbox/gallery-fixtures.ts`, `src/components/lab/`, `src/app/(dev)/design/touchpoints.ts`, `docs/design/rulings.md`, `docs/systems/host-app.md`.
- Tests: the registry tests; `lab:smoke` whole; `pnpm lab:demo --board reel-host --base http://localhost:<port>`; the gate with every exit code.
- His to overrule: the six questions are his; nothing in this lane wires production.

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

- Read whole, the manifest's own DECIDED bullet ("the style default lives on the event row and the switch beside the guest list switch") could be misread as predetermining the `switch` ask's `guestlist` option. It does not: cross-checked against the approved plan's "Calls the Orchestrator makes" section, that sentence names a SCHEMA fact (`show_reel` gets the same host-writable column grant as `show_guest_list`, "beside" it in the grant list, section A of the plan), never a UI-placement ruling. The Lane 87 brief's own ASKS list offers `guestlist` as one of three genuine options, which is how this board built it (recommended, not decided). Taken on my own reading; his to overrule if he reads the DECIDED bullet the other way.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- Reel bucket: the eight mood swatches in `reel-host`'s Style card (`parts-settings.tsx`'s `MOOD_SWATCH`) are decorative placeholder gradients, never the real per-mood grade; a follow-up could derive them from `engine/themes.ts`'s actual grade values once a board owns that fidelity.

## Handoff (replaces the chat report)

- Board commit `19d926f8` (the catalog whole, gate green pre-sync: "fix(reel-host): the cut mark leads the grid, so it actually reads as a mark"), pushed; synced with `launch-prep` by MERGE (never rebase) at `6b06223b` ("Merge remote-tracking branch 'origin/launch-prep' into lp/reel-host"), pushed. `launch-prep` had moved since the cut: `reel-view`, `reel-screen`, `reel-engine-live` and `reel-cut` all landed; conflicts in `boards.ts`, `registry.ts` and `touchpoints.ts` were both sides' registration lines inserted near their own named neighbour (mine after `export-flow`, theirs after `media-viewer`), resolved by keeping both; `docs/design/library.md` conflicted and was regenerated with `pnpm design:rules` rather than hand-resolved, per instruction.
- Every claim below names its artifact, so the Orchestrator checks rather than believes.
- Gates on the synced tree (port 3135, killed by port before build and before this handoff): `pnpm design:rules` ok; the specimen collector ok; `pnpm typecheck` ok (exit 0); `pnpm lint` ok (exit 0, 9 known warnings, none in a file this lane touched); `pnpm test` ok (exit 0, 350 files, 3867 passing, 1 skipped); `pnpm build` ok (exit 0, 259 pages); `pnpm lab:smoke --base http://localhost:3135` ok (478 checks, 0 failing, whole tree); `pnpm lab:demo --board reel-host --base http://localhost:3135` ok (6 steps, 0 failing, every option pictured, no "same picture" warnings, stages moving 6.31% to 99.89% pair to pair).
- A live bug found and fixed on this pass, worth a system-wide note for the next board that reaches for a full-bleed or absolutely-positioned overlay inside a lab frame: this frame's own document never cascades a real height down to a percentage-based `min-h-full`, so an `absolute`-positioned child of one collapses to a sliver (measured live: 0px). `SheetGround` (scene.tsx) and `ReelView` (parts-reel-view.tsx) both hit this and both are fixed, to `fixed` positioning (viewport-relative) for a standalone full-bleed scene, and to explicit pixel heights read off `SCREENS[screen].h` (never a CSS percentage) for `board.tsx`'s `StyleShortcutAndSheet` composite, which needs a cropped, not full-bleed, pane. Confirmed by eye in the browser (screenshots taken, DOM rects measured via `javascript_tool`) on the `switch`, `style` and `cut` asks before and after.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the ten files under owned `src/app/(dev)/design/sandbox/reel-host/`, this manifest, and four exceptions: `src/app/(dev)/design/(shell)/lab/boards.ts`, `src/app/(dev)/design/sandbox/registry.ts` and `src/app/(dev)/design/touchpoints.ts` (the registration exception, this board's own lines only, placed after `export-flow` per this lane's own instruction, never at the head); `docs/design/library.md` (regenerated by `pnpm design:rules`, required after any `touchpoints.ts` change, CLAUDE.md's own command).
- The six items, one line each (a catalog for his review, not yet ruled; each names this board's recommendation):
  - `style`: recommends `sheet` (a new Reel card in Settings, eight mood swatches) over `view` (a control in the reel's own chrome) or `both` (the sheet home, the view a shortcut).
  - `switch`: recommends `guestlist` (a third row beside "Show the guest list", same card) over `first` (its own card, head of the sheet) or `inview` (the host's own toggle inside the reel).
  - `screen`: recommends `hub` (a fifth door in the cards row, beside Review/Reel/Guests/Settings) over `view` (a control inside the reel) or `share` (a third block in the share sheet).
  - `pulse`: recommends `cover` (the event card's own cover crossfades through the album, no words) over `live` (a line naming the count) or `threshold` (the same line, but only past three items).
  - `cut`: recommends `confirm` (one small sheet before it lands, naming the storage cost) over `marked` (a small badge, no confirm) or `plain` (no mark, no confirm).
  - `review`: recommends `viewsays` (a quiet line in the reel's own chrome, linking to Review) over `roomsays` (one sentence added to Review's header) or `nothing`.
- Calls his to overrule: the six recommendations above are his to pick from, not settled; plus the one Question above (the DECIDED bullet's "beside the guest list switch" read as schema, not UI placement, so `switch` stayed a genuine three-way ask).
- The help articles this lane makes stale: none (a lab board changes no shipped behaviour).
- Assets requested from Will: none (every still is the shared fourteen-image bootstrap set; the mood swatches are CSS gradients, not images).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `pulse.cover` (the event card's cover playing is the most novel picture on this board) and `style.both` (the composite stacks the reel view's shortcut above the settings sheet's full picker in one frame, worth a slow look since it is answering "both" as a picture rather than a claim).

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
