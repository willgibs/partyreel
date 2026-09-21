---
track: reshape-viewer-curation
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- none. Every call the brief left open was taken on its own line and is listed under "his to overrule" below.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. Lab-only: no production byte, no `docs/systems/` fact inside this lane.

## Deferred (ROADMAP one-liners, bucket named)

- Now: `overtaken.test.ts`'s remaining CENSUS assertions die when the other three audit lanes land. `appended.length > 0`, the two-clause and three-clause counts, `conceded.length > 0`, `overtakenOn("admin-triage") === 8` and `overtakenOn("press-page") === 2` all read a map the audit is emptying; the three-clause count in particular is down to two entries (`export-flow.object`, `help-center.from-product`), one in each of the other two Opus and Sonnet lanes, so the second of them to merge turns the file red. They want the treatment the HELD grammar already has in that file: proved on a literal note rather than on a live entry.
- Now: the `media-viewer` board's chrome is a grade behind production. It hand-copies the pre-glass material (`bg-black/55 backdrop-blur-sm` on both capsules, `bg-black/45` on the close circle) while the shipped lightbox wears Crystal with the double edge and `GLASS_MARK_LIT` on its glyphs. Every option on the board is therefore drawn on a material nothing ships, which is the same drift the audit just fixed in words. One sweep, in a lane that owns the board.
- Now (lab workflow): `lab:demo` reads a decision of PLACE as a near-still step. `media-viewer.who` moves the stage by 1.01 percent and `host-curation.peek` by 1.22 percent, and both are real decisions: the credit changes corner, the verdict changes surface. The movement number measures area, so a board that moves a small thing a long way reads like a board that moved nothing. Worth a second reading (a centroid, or the moved box's distance) beside the percentage.

## Handoff (replaces the chat report)

- The board commit is `9ff57acf` (every reshape is in it); synced with `origin/launch-prep` at `18b63b31` (it had moved, from the `5143c87e` cut), merged at `632ef464`, never rebased. Pushed.
- Gates on the SYNCED tree, each on its own exit code: `pnpm design:rules` 0 · specimens (`node "src/app/(dev)/design/gallery/collect-specimens.mjs"`) 0 · `pnpm typecheck` 0 · `pnpm lint` 0 (10 warnings, the known baseline: it read 12 after the badge deletion orphaned two handles in `overtaken.ts`, and deleting those two with their entries put it back at 10; none of the 10 is in a file this lane touched) · `pnpm test` 0 (3,309 passed, 1 skipped, 318 files) · `pnpm build` 0 (255 static pages). `pnpm lab:smoke --base http://localhost:3136` 0 (418 checks, 0 failing; media-viewer 720 words and host-curation 491 against the 1,200 budget). `pnpm lab:demo --board media-viewer` 0 and `--board host-curation` 0, eight steps each, 0 failing, "Every step draws its options" on both. Logs in the lane's scratch dir (`smoke2.log`, `demo-mv2.log`, `demo-hc2.log`, `test2.log`, `build2.log`). The dev server ran on :3136 alone and was killed by port before every test run, the build and this handoff.
- No backdrop-filter step reported UNPAINTED: `opening` paints the ruled ground in headless Chrome and the three captures are in the scratch dir (`shots/media-viewer.opening.{fade,grow,sheet}-1440.png`), read by eye as well.
- Lane check, `git diff --name-only origin/launch-prep...HEAD`: `sandbox/media-viewer/{spec.ts,board.tsx,viewer.tsx,fixtures.ts}` and `sandbox/host-curation/spec.ts` (owned), this file, plus THREE exceptions: (1) `sandbox/overtaken.ts`, the fourteen badge entries deleted as the brief instructs, listed below; (2) `sandbox/overtaken.test.ts`, which named `media-viewer.opening` in two assertions and went red on the deletion, de-named rather than re-pointed at another lane's board; (3) `design/rules/rules.generated.json`, which is generated and records the line numbers of the tests in `overtaken.test.ts`, so `pnpm design:rules` rewrote four of them.
- The fourteen badges deleted from `overtaken.ts`, and why, one per entry. The why is the same sentence fourteen times and it is the audit's: the badge's context now lives inside the question, and a fact said twice is a fact whose second copy rots. `media-viewer.opening` (glass r1 + three clauses: the ground it named is now the ground all three options stand on) · `media-viewer.holds` (glass r1 + app-vocabulary r1 and r2: the phone narrowing and the one-button fold are the question's first sentence) · `media-viewer.who` (seed-avatar r1 and r2 + guest-upload r1: the face and the reading size are what the question now asks about) · `media-viewer.next` (pricing-page r2 + guest-upload r1: the gallery exemption and the review step's strip) · `media-viewer.video` (app-vocabulary r1: the tile's play mark, which is now the option's own name) · `media-viewer.link` (first-event r1: the share sheet, now the surface the question names) · `media-viewer.wayout` (guest-shape r1 + pricing-page r2: the sheet that teaches the drag) · `host-curation.queue` (app-vocabulary r1 + guest-upload r1: one tile, and the guest's waiting tile) · `host-curation.verb` (guest-shape r2: the fourth mark a tile carries) · `host-curation.peek` (glass r1 + app-vocabulary r1; the only CONCEDE on these boards, and the narrowing reopened it at a desk) · `host-curation.undo` (app-vocabulary r1 + guest-upload r1: the one bar, and one surface at a run's end) · `host-curation.arrivals` (guest-shape r1 + app-shape r2 + first-event r1: the hub is live, so this is manners) · `host-curation.count` (app-shape r1 and r2 + first-event r1: the pulse, the refusal, the live header) · `host-curation.told` (guest-shape r1 and r2 + guest-upload r1: ownership, the mark, one surface). Two handles the deletion orphaned went with them (`GLASS`, `AVATAR`); `VOCABULARY_2` and `VERIFY` were already unused before this lane and were left alone.
- The items, one line each. Every reshaped question, its new framing:
- `media-viewer.opening` (REDRAWN): "How should a photograph arrive on the ground the album makes behind it?" The ground is ruled and shipped, so all three options stand on it and only the arrival is asked.
- `media-viewer.holds`: "What shape should the chrome take at rest, now that it carries every action?" The phone rule and the one-button fold are the pressure the shape has to survive.
- `media-viewer.who`: "Where should the name, the face and the unverified mark sit on an open photograph?" Three facts now, not one word.
- `media-viewer.next`: unchanged in question, reshaped in ground: he kept the swipe for galleries by name, and the upload act draws a thumbnail strip, so `film` has house furniture.
- `media-viewer.video`: "How should a video meet a guest: playing, waiting, or wearing the browser's bar?" The badge is named as the tile's own glyph grown up.
- `media-viewer.wayout`: unchanged in question, reshaped in ground: the product teaches the drag back down now, so `down` is a gesture the product has rather than one it would invent.
- `media-viewer.link`: "Should an open photograph have an address of its own, and what should Share hand on?" The share sheet is named as the surface a photograph's own link would ride.
- `host-curation.queue`: unchanged in question, reshaped in ground: one tile draws every other grid, so the 4:5 crop is the exception to build, and the guest's waiting tile is the shape it answers.
- `host-curation.verb`: unchanged in question, reshaped in ground: a tile carries a fourth mark now, so the Hidden chip has a precedent and a place.
- `host-curation.peek`: "What should a tap on a waiting photograph open AT A DESK?" The phone's half is ruled; the desk's half never was.
- `host-curation.undo`: unchanged in question, reshaped in ground: the review bar and the gallery's bulk bar are one component, so the answer lands on both.
- `host-curation.arrivals`: "A photograph lands while the host is reviewing WITH A SELECTION HELD: what should the queue do?" The hub is live, so this is manners rather than capability.
- `host-curation.count`: unchanged in question, reshaped in ground: the pulse answers the aggregate and a single event's prompt on the dashboard is refused, so the chip and the bell are what is left.
- `host-curation.told`: unchanged in question, reshaped in ground: ownership, the own-tile mark, the one surface a guest is told on, and a profile a name-only guest may keep.
- The one option dropped: `media-viewer.who=none`, "No name on the photograph". Anonymity left the product on his own words, so an upload with no name is a state the product cannot produce; the option would have asked him to rule on something that no longer exists.
- The one concept added: `media-viewer.who=face`, a credit led by the seeded avatar with the unproven mark on its corner, pressable as the door to that person's page, at the top edge opposite the close circle. `seed-avatar` r1 and r2 gave every account the face; the identity reshape gave every name a proof state; the shipped capsule's own comment already says it is waiting to become a door.
- `closeup` (media-viewer) and `keys` (host-curation) were never badged and are untouched, question, options and drawing.
- Calls his to overrule on the alias, one line each:
- The `opening` option that read "The dark room, as today" is renamed `fade` and drawn on the ruled ground; the ledger token changes from `dialog` to `fade` (no ledger exists for this board, so nothing is orphaned).
- All three `opening` options now share the ruled ground, which makes the question the arrival alone rather than the arrival plus the backdrop.
- `who` recommends the new `face` over `foot`, which was the old recommendation: a face reads three facts at a glance where a line reads two.
- The face-led credit sits at the TOP edge opposite the close circle rather than at the foot with the other two, so the three options are three PLACES.
- The unproven mark is `guest-verify`'s dot quoted verbatim (a subtle corner dot, his "rather than a warning icon"), not a second mark; over a photograph its ring is black rather than `bg-background`.
- The fixture's one anonymous guest becomes a typed name ("Nina"), and Priya, who took the photograph the board opens on, is drawn unverified so the mark is on the stage rather than three tiles down it.
- "as today" is relabelled "as wired" on eight options whose shape shipped, so the phrase stops meaning a baseline that has moved.
- `host-curation.peek` is asked only about a desk. The phone's answer is taken as ruled rather than re-put to him.
- `host-curation.queue`'s `uniform` is relabelled "The 4:5 grid, the exception to build".
- No `today` was declared on any ask, so a staged question still draws inside its parent's RECOMMENDATION rather than inside the shipped surface. Both boards argue for that in their own comments and the constructor's `today` doc argues the other way; changing it would silently redraw six steps, which is more than a reshape.
- The two orphaned ruling handles deleted from `overtaken.ts`, and the two assertions de-named in `overtaken.test.ts`, are both consequences of the badge deletion rather than choices of their own.
- The help articles this lane makes stale: none. Lab-only, no production byte, no shipped behaviour described anywhere changes.
- Assets requested from Will: none new. The board's existing ask stands (a real party clip in place of the 85 KB stand-in at `public/lab/media-viewer/clip.mp4`, ASSETS row 23).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: the three `opening` frames at 375 on the ruled ground, in order (`fade`, `grow`, `sheet`), which is the one redraw and the one place where a dead option was being drawn; then `who` at `face` on the same photograph, which is the lane's one new concept and the only place the unverified mark appears on a photograph anywhere in the lab. Then, before merging the other three audit lanes, the first Deferred line: `overtaken.test.ts` still counts a map they are emptying.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-21). The overtaken audit's first lane read the fourteen badges on
`media-viewer` and `host-curation` against the ruling each named and reshaped all fourteen questions in place, with
the ruling written into the question as the ground its answer stands on; no question was removed, both boards stayed
at round one and unanswered, and the badges left `overtaken.ts` with a note in its own grammar. `media-viewer.opening`
was redrawn on the ruled ground (`glass-behind`, the production utility) and its "dark room, as today" option became
`fade`, a centred arrival; `who` dropped `none` on the identity reshape and gained `face`, a seeded-avatar credit
carrying the unverified mark and pressable as a door to a person's page; `host-curation.peek`, the batch's one
conceded question, reopened at a desk where his own narrowing of the lightbox rule had left it.
