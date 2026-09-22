---
track: reel-story
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "0abb6459"          # the launch-prep SHA the branch was cut from
board: reel-story      # a new board: the reel round, the marketing story
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/reel-story/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/marketing/sections/reel/
  - src/components/marketing/sections/home/reel-teaser.tsx
  - src/lib/constants/marketing-voice.ts
  - src/lib/constants/features.ts
  - src/lib/constants/how-it-works.ts
  - src/lib/constants/events.ts
  - src/components/marketing/sections/pricing/
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
  - src/components/lab/
  - src/app/(dev)/design/touchpoints.ts
  - docs/design/rulings.md
  - docs/systems/marketing-content.md
  - docs/ASSETS.md
---

# lp/reel-story

**Goal.** A NEW lab board, wave 2 of THE REEL ROUND (Will, 2026-09-22, rulings.md "the reel, reconceived"): the marketing story of the reel, seven asks (the thesis line, the /reel page's arc, the home's teaser and the hero film's role, the pricing rows' words, the how-it-works steps, the event pages' reel column, the help category's name); his standing site rulings bind; a catalog to select from, nothing wiring production. The Lane section at the foot of the Orchestrator's plan file carries every ask and option; this manifest's brief is a copy of it.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `0abb6459`)

- What this is: the reel round (rulings.md "the reel, reconceived"; the plan's "The concept, in one read", section E's marketing bullet and section F). Every marketing surface today sells a host-made, post-event, stored reel ("Every event ends with a reel.", "From the first scan to the final cut", "Pick a style. The reel cuts itself, ready to share.", "Every guest can take the reel home."); the reel is now live from the third photo, alive on the venue's wall, and a cut is anyone's. His standing rulings on the site bind: no page ends the same way with the reel ("that will feel incredibly repetitive"), no centred portrait video leaving blank space on desktop, the demo door as the proof on the event pages, the hero film parked (ASSETS row 1). DECIDED, NOT ASKED: the `/reel` page's live style switcher stays as the engine's proof; the tier rows become the cut's length and mark; the words are the copy asks' to settle and nothing pins them.
- ASKS (seven): `thesis` (the one line: "Every event has a reel."; "Scan. Add. Watch it grow."; "The reel that makes itself."; drawn on the home's close and the feature entry); `arc` (the `/reel` page's arc: the live reel, the screen, then the cut; the cut first as the thing people post; the screen first as the flagship moment); `teaser` (the home's reel section: the demo album's live reel through the real engine; the hero film (ASSETS row 1, parked) as a landscape film; a still poster with a play mark); `pricing` (the pricing rows' words: "Cut length" and "Cut watermark"; "Your reel" with one row; the reel absent from the table, the cut's mark a footnote); `steps` (the how-it-works host step "Cut the reel" and the guest step "Get the reel": "Watch the reel grow" and "Make your cut"; "Put it on a screen" as the host's step; the reel folded into the share step); `events` (the event pages' reel column, "cut into one highlight reel you can send the same night": the live reel on the wall for each type; the cut a guest posts; the column gone, the demo door alone); `help` (the help category's name and the nav entry's words: "The reel"; "Reels and cuts"; "The live reel"). Nothing here overlaps `site-chrome` (structure) or `press-page` (the fact sheet is the sweep's).
- Build from the kit; the truth for the shipped copy: `src/components/marketing/sections/reel/`, `src/components/marketing/sections/home/reel-teaser.tsx`, `src/lib/constants/marketing-voice.ts`, `features.ts`, `how-it-works.ts`, `events.ts`, the pricing sections under `src/components/marketing/sections/pricing/`; register (a NEW board at the HEAD of `DESK_ORDER`; the Orchestrator reorders at the merge); no em-dash; the registry test's limits.
- Owns: `src/app/(dev)/design/sandbox/reel-story/`. Reads, never edits: the files above, `src/app/(dev)/design/sandbox/gallery-fixtures.ts`, `src/components/lab/`, `src/app/(dev)/design/touchpoints.ts`, `docs/design/rulings.md`, `docs/systems/marketing-content.md`, `docs/ASSETS.md`.
- Tests: the registry tests; `lab:smoke` whole; `pnpm lab:demo --board reel-story --base http://localhost:<port>`; the gate with every exit code.
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
