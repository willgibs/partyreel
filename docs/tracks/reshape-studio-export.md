---
track: reshape-studio-export
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "5143c87e"          # the launch-prep SHA the branch was cut from
board: reel-studio     # and export-flow: both reshaped in place, unanswered, at their round; no retirement, no new board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/reel-studio/
  - src/app/(dev)/design/sandbox/export-flow/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/overtaken.ts
  - src/components/lab/exploration.ts
  - src/components/lab/board-spec.ts
  - src/app/(dev)/design/touchpoints.ts
  - docs/design/rulings.md
  - docs/STATUS.md
  - src/app/(app)/dashboard/[eventId]/reel/
  - src/components/app/export/
  - src/components/guest/live-gallery.tsx
---

# lp/reshape-studio-export

**Goal.** A lane of the overtaken audit (Will, 2026-09-21, verbatim in `docs/design/rulings.md` under "the overtaken audit: reshape or remove, and the stacking rule"): "For any open questions that have been 'overtaken', please evaluate whether they should be reshaped or removed", with his criteria (reshape a question that could still offer a better solution than the earlier selection that overtook it, with updated context; remove only a question with zero potential value; "I'd rather you lean into reshape if you aren't confident in removal"; "everything is unprotected and anything may be re-litigated"). The Orchestrator read every badged question against the ruling its badge names and judged each: the verdicts for this lane's boards are the brief below, one line per question, and are the whole reading. This is lab work on the boards' own folders: no production byte.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `5143c87e`)

- What this is: as Lane 62's first line, for these two boards (the same rules: reshape with the context folded in, dead options dropped, new concepts where a ruling made one possible, the badges deleted as exception lines in `overtaken.ts`, the boards unanswered at their round with `round.changed` saying what moved).
- reel-studio.door (redraw): the event hub's Reel card is the door (app-shape r1 event=hub), so the status-row link the three options sat in is gone. Ask what the card shows: a labelled card as shipped, or the reel's own face as the door with Edit reel at its corner (the poster idea moved onto the card).
- reel-studio.room: floating panes wear the ruled glass material (glass r2). Ask the laptop room's shape as before.
- reel-studio.styles: the sheet is a side panel at a desk (guest-shape r2), so the wall no longer covers the reel there; a whole gallery of printed designs is owed (first-event r1). Ask wall vs rail vs three with a hand as the place the wall still covers the reel.
- reel-studio.moments: the same posture rule; ask sheet vs pool vs tray with a desk already served by the panel and a hand still paying the sheet's price.
- reel-studio.blocked: the product's tooltip is instant at a mouse (app-vocabulary r1). Ask the touch half only: what a thumb reads on a blocked tile.
- reel-studio.sharing: sharing lives on the share sheet (app-shape r1). Ask what unsharing costs and where the count is said, on that sheet.
- reel-studio.wait (new): the celebration modal is for a moment worth feeling, not a minute of waiting (app-pricing r1); the stack tile counting down is the house idiom for a run in progress (guest-upload r1). Ask what a host sees while the video is made, with a new option: the reel's own frame as a stack counting down in place.
- reel-studio.guests: the site's demo door is a plain framed still (demo-event r2); the album's head carries a guest's own waiting tile (guest-upload r1). Ask how a guest meets the reel on the album, with first paint's cost and the head's room named.
- export-flow.means: a guest's own photographs are known and marked and the Yours filter exists (guest-shape r1 and r2); the app makes a PDF of printed stock (first-event r1). Ask what Download hands a guest, with own-first as a bundle the filter already defines.
- export-flow.chips (dropped `three`): a chip that renders a zero and takes the tap is out (app-shape r2); a lock says why and offers the way (app-pricing r1); a guest is told the limits of what they may add (guest-upload r1). Ask two chips vs the chip that says why.
- export-flow.wait: Download wears the one sheet (guest-shape r1); bytes in flight are narrated in place and silently (guest-upload r1). Ask whether the sheet holds until the bytes land, a line, or a toast.
- export-flow.stuck (dropped `forever`): a failure's ways out are real buttons (app-door r1); a run that did not finish is read on one surface at its end (guest-upload r1). Ask timeout vs cancel.
- export-flow.hollow (dropped `silence`): he refuses a gap a person has to check for themselves (guest-upload r1). Ask after vs refuse.
- export-flow.cap (dropped `bite`): a refusal that names no number is out (app-pricing r1); the act states its terms before the files fly (guest-upload r1). Ask near vs split.
- export-flow.phone: he took our own surface over the system's on the way in (guest-upload r1). Ask the way out with that lean named.
- export-flow.object (dropped `link`): the album's link and its copy sit twice on the page (app-shape r1). Ask whether Download opens a dialog of bundles or just starts.
- Owns: `src/app/(dev)/design/sandbox/reel-studio/`, `src/app/(dev)/design/sandbox/export-flow/`. Reads: `src/app/(dev)/design/sandbox/overtaken.ts`, `src/components/lab/exploration.ts`, `src/components/lab/board-spec.ts`, `src/app/(dev)/design/touchpoints.ts`, `docs/design/rulings.md`, `docs/STATUS.md`, `src/app/(app)/dashboard/[eventId]/reel/`, `src/components/app/export/`, `src/components/guest/live-gallery.tsx` (the guest's Download dialog lives in it).
- Verify: the registry tests and `overtaken.test.ts` green (the sixteen entries deleted); `lab:smoke` whole; `lab:demo --board reel-studio` and `--board export-flow`; both boards at 375 and 1440; the gate.
- His to overrule: every reshaped framing; the five dropped options; the new stack option; the door's redraw.

## The verdict map (every answer of the batch; this lane wires only its own board's)

(no verdict map: the audit's verdicts for this lane's boards are the brief above, one line per question; the rulings they fold in are verbatim in docs/design/rulings.md)

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

- none: the brief carried a line per question and every call it left open was taken and is listed under "his to overrule".

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none: lab work on two board folders, no production byte and no `docs/systems/` fact inside the lane.

## Deferred (ROADMAP one-liners, bucket named)

- Now: the shipped export dialog is still a centred `Dialog` (`src/components/app/export/export-dialog.tsx`); `guest-shape` r1 ruled the guest's dialogs onto the one responsive Sheet and the board is drawn on it, so the swap is a wiring line whoever wires `export-flow`.
- Now: `overtaken.test.ts` still asserts `overtakenFor("media-viewer","opening")` and two literal glossed keys (`media-viewer.opening`, `contact-page.topic`); the last audit lane to land inherits them, and once the map is empty the file's remaining live-entry assertions want one pass to read off the grammar rather than the entries.

## Handoff (replaces the chat report)

- BOARD commit `265ca025` (the two boards, the sixteen badges, the test's floor); the head is the merge above it. Synced: `origin/launch-prep` had moved nine commits (to `18b63b31`, the identity reshape's wave 0 and wave 1 cut), merged clean, no file in common.
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` 0 (215 components, 1650 contracts, 18 policies; `rules.generated.json` byte-identical, see the note below) · specimen collector 0 (140 specimens on 101 entries) · `pnpm typecheck` 0 · `pnpm lint` 0 (10 known warnings, none in a file this lane touched) · `pnpm test` 0 (318 files, 3,309 passed, 1 skipped) · `pnpm build` 0 (255 static pages) · `pnpm lab:smoke --base http://localhost:3137` 0 (418 checks, 0 failing; reel-studio 717 words, export-flow 703, budget 1200) · `pnpm lab:demo --board reel-studio` 0 (8 steps, 0 failing, every step draws its options) · `--board export-flow` 0 (the same).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `export-flow/{board.tsx,dialog.tsx,export-flow.css,spec.ts}`, `reel-studio/{board.tsx,fixtures.ts,spec.ts,surfaces.tsx}` (both under `owns`), plus two exceptions: `sandbox/overtaken.ts` (the sixteen badge entries deleted, one line below each, nothing else in the file touched: the type, the grammar, the functions and the other 53 entries are byte-identical) and `sandbox/overtaken.test.ts` (ONE assertion: `glossed.length >= 40` became `glossed.length * 2 >= KEYS.length`, because deleting fifteen glossed entries takes the count to 35 and the test is named in this lane's brief as a gate. A proportion survives every audit lane and the empty map, so a lane that syncs past this one needs no further edit on that line; the comment was written to the SAME line count so `rules.generated.json`, which indexes the file by line, did not move).
- The sixteen entries deleted from `overtaken.ts`, and why each one went: every one was RESHAPED rather than removed, so the badge would now point at a question that has already absorbed it. `reel-studio.door` (concedes; the ask it named no longer exists in that form). `reel-studio.room` (glass r2 is in the room's context and its float option). `reel-studio.styles` (guest-shape r2 + pricing r2 + first-event r1, all three in the context and the recommendation). `reel-studio.moments` (guest-shape r1 in the context and the sheet option). `reel-studio.blocked` (app-vocabulary r1; the question now asks the touch half only). `reel-studio.sharing` (app-shape r1; the sheet is in the context and the confirm option). `reel-studio.wait` (app-pricing r1 + guest-upload r1; both in the context, and guest-upload r1 IS the new option). `reel-studio.guests` (demo-event r2 + guest-upload r1, both in the context and the because). `export-flow.means` (guest-shape r1/r2 + first-event r1; the Yours lens is now the option's own mechanism). `export-flow.chips` (app-shape r2 + app-pricing r1 + guest-upload r1; the first dropped the option). `export-flow.wait` (guest-shape r1 + guest-upload r1; the sheet is the surface now). `export-flow.stuck` (app-door r1 + guest-upload r1; the first dropped `forever`). `export-flow.hollow` (guest-upload r1; it dropped `silence`). `export-flow.cap` (app-pricing r1 + guest-upload r1; the first dropped `bite`). `export-flow.phone` (guest-upload r1; the lean is named in the context and the because). `export-flow.object` (concedes; app-shape r1 dropped `link` and the question was re-aimed).
- The items, one line each. **reel-studio** · `door`: REDRAWN, because `event=hub` deleted the status row its three options sat in; it now asks what the hub's Reel card shows, a labelled card as shipped against the reel's own frame with Edit reel at its corner (round one's poster idea, moved onto the card), and the whole event-page surface is rebuilt as the hub (the held 112 px code at the left of the title, the link row, the cards row copied class for class from `event-cards-row.tsx`, the album beneath). · `room`: glass r2 folded in, so the float option floats on the ONE ruled material and the question is the room's shape alone. · `styles`: the ruled side panel means the wall covers nothing at a desk and a gallery of designs is owed twice over, so the recommendation moves from the rail to the wall and the rail's case is a hand. · `moments`: the same posture, so sheet and pool converge at a desk and the question is a long act in a hand; `tray` gains the hub's own full-size album. · `blocked`: the mouse half is ruled, so it asks the touch half only and `title` becomes "the ruled tooltip, and nothing else". · `sharing`: drawn on the ruled share sheet's terms, the Undo riding the toast's own action slot. · `wait`: NEW option `stack`, the reel's own frame stacking and counting down the moments still to draw, quoted from `UploadStackTile` (two ghost edges at 3 and 6 px, everything it says in one strip, the ONE material at the measured 0.34 tint that puts white at 4.78:1) and recommended over the bar. · `guests`: demo r2 and the album's waiting tile folded into the case for the still. **export-flow** · every question drawn on the ONE responsive sheet (bottom sheet under 640, side panel above it, `max-w-md`, the numbers read off `floatingEdgeEntranceResponsive`); `means` the Yours lens; `chips` DROPPED `three`; `wait` the sheet holding; `stuck` DROPPED `forever`; `hollow` DROPPED `silence`; `cap` DROPPED `bite`; `object` DROPPED `link` and became whether Download opens a sheet at all, recommending `zip`; `phone` unchanged in shape, with his own-surface lean named.
- Calls his to overrule on the alias, one line each:
  - The door's REDRAW itself: three options were retired with the surface they lived on rather than re-asked, and the poster became one of two card shapes. If he wants the old three back, the hub's status row would have to come back with them.
  - `door` recommends `face`, and its `shared` knob was dropped because the shipped Reel card says nothing about sharing (a knob that moves nothing on the stage).
  - `styles` recommends `wall` where round one recommended `rail`: the ruled panel answered the rail's whole case at a desk.
  - `wait` recommends the NEW `stack` over `player`: the device is drawing those frames, so a reel that claims to keep playing is a fiction.
  - `object` recommends `zip` because its old recommendation (`link`) is one of the five dropped options; the never-expires sentence is kept in `dialog.tsx` with no caller rather than deleted.
  - The five dropped options are dropped on the Orchestrator's verdict lines, not on mine; each one is named above with the ruling that forbids it.
  - `export-flow` is drawn on the ruled sheet although the shipped dialog is still a centred `Dialog`: a question about the sheet cannot be answered on the surface the ruling replaced. The swap is a wiring line (Deferred).
  - The Reel card is measured at 160 by 96 px at a laptop and 144 by 96 in a hand (`sm:w-40`), so the door step's stage moves only 1.2 percent: the card IS one percent of a 1440 page, and the caption carries the difference.
- The help articles this lane makes stale: none (no shipped surface changed).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `/design/lab/reel-studio?session=reel-studio.door` at 1440 (the hub with its four cards, the second one wearing the host's own cut), then `?session=reel-studio.wait` on option 3 (the stack's ghost edges and its reading strip), then `/design/lab/export-flow?session=export-flow.wait` on option 2 at 1440 AND at 375 (the same sheet as a side panel and as a bottom sheet).

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-21). The overtaken audit's studio-and-export lane reshaped all sixteen
badged questions on `reel-studio` and `export-flow` and removed none: every ruling a badge named was folded into its
question's own context, `reel-studio.door` was redrawn onto the event hub's Reel card (the surface its three options
lived on had been deleted by `event=hub`), `wait` gained the reel's own frame stacking and counting down on
`UploadStackTile`'s idiom, `styles` moved its recommendation from the rail to the wall, and `export-flow` dropped the
five options a ruling forbids outright and was redrawn on the one responsive sheet `guest-shape` r1 ruled the guest's
dialogs onto. The sixteen entries left `overtaken.ts` with its file, type, test and badge intact, and that test's
glossed floor became a proportion so the rest of the audit can empty the map without touching it again.
