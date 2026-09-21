---
track: reshape-viewer-curation
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5143c87e"          # the launch-prep SHA the branch was cut from
board: media-viewer    # and host-curation: both reshaped in place, unanswered, at their round; no retirement, no new board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/media-viewer/
  - src/app/(dev)/design/sandbox/host-curation/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/overtaken.ts
  - src/components/lab/exploration.ts
  - src/components/lab/board-spec.ts
  - src/app/(dev)/design/touchpoints.ts
  - docs/design/rulings.md
  - docs/STATUS.md
  - src/components/guest/live-gallery.tsx
  - src/components/shared/media-lightbox.tsx
  - src/components/app/event-feed/event-gallery.tsx
---

# lp/reshape-viewer-curation

**Goal.** A lane of the overtaken audit (Will, 2026-09-21, verbatim in `docs/design/rulings.md` under "the overtaken audit: reshape or remove, and the stacking rule"): "For any open questions that have been 'overtaken', please evaluate whether they should be reshaped or removed", with his criteria (reshape a question that could still offer a better solution than the earlier selection that overtook it, with updated context; remove only a question with zero potential value; "I'd rather you lean into reshape if you aren't confident in removal"; "everything is unprotected and anything may be re-litigated"). The Orchestrator read every badged question against the ruling its badge names and judged each: the verdicts for this lane's boards are the brief below, one line per question, and are the whole reading. This is lab work on the boards' own folders: no production byte.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `5143c87e`)

- What this is: Will's cleanup of the badged questions (2026-09-21, verbatim in rulings.md "the overtaken audit: reshape or remove"; his flow chart: an early question picks a better option, a later question can still give the best outcome, and those opportunities are not to be dropped). Every badged ask on these two boards is RESHAPED into a current question with the rulings that reached it folded into its context, so it can still reach its best answer; a dead option (one a ruling forbids outright) is dropped; a new concept is added where a ruling made one possible; and each ask's badge is DELETED from `src/app/(dev)/design/sandbox/overtaken.ts` (an exception line per entry, listed in the Handoff with why: the context now lives in the question). Nothing is answered by precedent, nothing is recorded in a ledger; the boards stay at their round number, unanswered, with `round.date` today and `round.changed` saying what moved and why. Redraw an option's picture only where the line says (redraw); elsewhere the change is the spec's words and the frame's copy. The identity reshape (rulings.md "the identity reshape": every upload carries a name, verified or marked; the host's switch is Require verified emails; the capture flow after a name-only guest's upload; `guest-verify` retiring) is context for `who`, `queue` and `told`. The reshaped questions may bring new or improved concepts within their explorations: say so in the Handoff, one line each.
- media-viewer.opening (redraw): the ground behind a photograph is ruled (the album blurred at half brightness, glass r1), no centred float survives at a desk for a dialog (guest-shape r2) but a centred object is alive at a laptop (app-pricing r1), and a tile is where a photograph's own moment is said (guest-upload r1). Ask how a photograph OPENS from its tile onto that ruled ground: grows from the tile, rises as a sheet, or fades in centred; `dialog` redrawn on the ruled ground rather than "as today".
- media-viewer.holds: every action lives in the lightbox's controls on a phone (glass r1, narrowed to a phone by app-vocabulary r1) and a crowded top level folds behind one button (app-vocabulary r2). Ask the chrome's shape AT REST under those two rules: two capsules, nothing until a tap, one strip.
- media-viewer.who (dropped `none`): every upload carries a name now, verified or marked, and the lightbox pill wears the mark (the identity reshape); every account has a face (seed-avatar r1 and r2); what a guest most needs reads at reading size (guest-upload r1). Ask where the name, the face and the mark sit on the open photograph: the capsule as wired, or on the chrome's line. `none` contradicts the ruling and goes.
- media-viewer.next: the marketing swipe refusal exempts galleries (pricing-page r2, his own note); the upload act's review step draws a thumbnail strip (guest-upload r1), so `film` has house furniture. Ask as before with that context.
- media-viewer.video: the play mark is one tile glyph (app-vocabulary r1), so `badge` is the tile's own glyph grown up. Ask autoplay-muted vs play-on-tap vs native controls.
- media-viewer.link: the host's share sheet carries the event's link and a guest can pass it on (first-event r1). Ask whether an open photograph has an address of its own and what Share hands on, with the sheet as the place a photograph's own link would ride.
- media-viewer.wayout: the product teaches a drag back down in a hand (guest-shape r1's sheet). Ask which exits survive with that gesture in the product.
- host-curation.queue: one tile draws every grid (app-vocabulary r1); the guest's waiting tile is drawn (guest-upload r1 held=tile: dimmed under a clock, "Waiting for the host"). Ask the host's queue's shape, masonry vs one at a time, the square crop as the exception, with the waiting tile's guest side as the shape it answers.
- host-curation.verb: a tile carries a fourth mark now (guest-shape r2), the Hidden chip's precedent. Ask the word as before.
- host-curation.peek: on a phone the verdict lives in the viewer's controls (ruled); at a desk hover actions on cards are allowed (app-vocabulary r1). Ask what a tap on a waiting photograph opens AT A DESK: a look, a look you can act in, the viewer curating.
- host-curation.undo: the review bar and the bulk bar are one component (app-vocabulary r1); a run's outcome is read on one surface at its end (guest-upload r1). Ask as before, with that home named.
- host-curation.arrivals: the host's hub is LIVE now (first-event r1 first=live: a new tile arrives under the glow, the count moves), the Review room is not. Ask the queue's manners when a photograph lands mid-review with a selection held: nothing, a line that says how many, straight in.
- host-curation.count: the dashboard's aggregate is the pulse (app-shape r1), a single event's prompt on the dashboard is refused (app-shape r2), the header's count moves live (first-event r1). Ask the per-event chip and whether the three agree and lead somewhere.
- host-curation.told: a guest owns their photographs (guest-shape r1), their own tiles carry a mark (r2), a guest is told on one surface what did not upload (guest-upload r1), and a name-only guest may hold a profile after the capture flow (the identity reshape). Ask whether a refused photograph is ever told, with the guest's own feed and a profile as the places it could be said.
- Owns: `src/app/(dev)/design/sandbox/media-viewer/`, `src/app/(dev)/design/sandbox/host-curation/`. Reads: `src/app/(dev)/design/sandbox/overtaken.ts`, `src/components/lab/exploration.ts`, `src/components/lab/board-spec.ts`, `src/app/(dev)/design/touchpoints.ts`, `docs/design/rulings.md`, `docs/STATUS.md`, `src/components/guest/live-gallery.tsx`, `src/components/shared/media-lightbox.tsx`, `src/components/app/event-feed/event-gallery.tsx`.
- Verify: the registry tests and `overtaken.test.ts` green (the fourteen entries deleted); `lab:smoke` whole; `lab:demo --board media-viewer` and `--board host-curation`; both boards at 375 and 1440; the gate.
- His to overrule: every reshaped framing; the dropped `none`; the redraw of `opening`.

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
