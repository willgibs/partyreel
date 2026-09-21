---
track: third-batch-fixes
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "8dcdaee2"          # the launch-prep SHA the branch was cut from
board: none            # production follow-up: the alias red-team's two defects and one polish item on the third batch's wiring; no board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/upload/
  - src/components/guest/guest-upload.tsx
  - src/components/guest/guest-upload.test.tsx
  - src/components/guest/event-experience.tsx
  - src/lib/guest/use-upload-queue.ts
  - src/components/app/print/
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/guest/live-gallery.tsx
  - src/components/guest/guest-masonry.tsx
  - src/components/ui/sheet.tsx
  - src/app/(print)/
  - src/app/globals.css
  - src/lib/media/validators.ts
  - docs/systems/host-app.md
  - docs/design/rulings.md
---

# lp/third-batch-fixes

**Goal.** A production follow-up cut by the Orchestrator from the red-team on the `launch-prep` alias (2026-09-21, build `5e210ef8`, the third batch whole): the defects it found in the third batch's wiring, fixed in place. No board, no new ruling, nothing reopened: the rulings this wiring answers are in `docs/design/rulings.md` under "the closing sitting's third batch", and every one stands as wired. The lane's brief follows; read it end to end before the first edit. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the The brief is the next section; read it end to end before the first edit, build the recommended answer wherever it says "his to overrule", and list every such call in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- What this is: the red-team on the alias at `5e210ef8` (12:07 to 12:22 EDT 2026-09-21; signed out in the pane at 375 and 1440 on the disposable events, signed in as willg97 in Chrome) found two defects and one polish item in the third batch's wiring. This lane fixes them and nothing else: NO new board, nothing in the two retired boards' lanes reopens, every ruling stands as wired.
- DEFECT 1, the failure sheet re-opens with a dismissed failure: `src/components/guest/guest-upload.tsx:107-115` opens `UploadFailureSheet` when the run ends and `items.some((it) => it.status === "error")`; "Not now" closes the sheet but the errored item stays in the queue, so EVERY later run's end re-opens the sheet listing the old failure. Reproduced on the alias: a run with `notes.txt` refused ("That file type isn't supported."), Not now, then a clean twelve-file run ended on "1 file did not go · notes.txt" again. Fix: the sheet lists only failures the guest has not dismissed: `src/lib/guest/use-upload-queue.ts` gains `dismiss(ids)` (drops those errored items from the queue; Retry on the sheet still re-queues the listed ones through `retry(id)`), Not now and the sheet's close call it for every listed id; the run-end opening counts only errors still in the queue. Contract tests: a dismissed failure does not re-open the sheet at the next run's end; Retry all still re-queues every listed file; a run with no failure never opens it (the existing pin).
- DEFECT 2, the table card's link line overflows the card: on `src/components/app/print/print-stock.tsx`'s table cards the short link is one unbreakable token at 8.67 px ("partyreel-git-launch-prep-partyreel.vercel.app/e/<32 hex>" on the alias, 61 characters; "partyreel.com/e/<32 hex>" in production, 48; longer under a custom link) and it measured 255 px wide inside a 234 px card, running into the neighbouring card on the printed sheet (the alias, 12:19 EDT, nine cards). Fix: `overflow-wrap: anywhere` on the link line of every piece (the cards, the sign, the poster), the line bound to the piece's inner width, and the face one step smaller only if the wrapped line would take a third row at 70 characters; a contract test renders the card with a 70-character link and asserts the line carries the wrap rule and sits inside the card's box (jsdom does not measure: assert the rule, and put the alias measurement in the Handoff).
- POLISH, the sheet flashes the two rows on Send: `src/components/guest/upload/intent-sheet.tsx` returns to the intent step (Take a photo / Choose from your album) the moment Send is pressed, so the sheet's closing transition shows the two rows instead of the review (captured in the pane at 375, 12:11 EDT). Fix: keep the review step mounted until the Sheet has closed (reset the step when `open` becomes false after the exit transition, or on the content's animation end), never on Send itself; a test: after Send with `open` still true, the review step is what renders.
- ONE MORE LINE IF IT IS ONE LINE: the guest page's header says "from 1 guest" after an own upload while the server says "from 2 guests" on reload (`src/components/guest/event-experience.tsx:508`, `stats.contributorCount`): bump the contributor count on the first own landing when this guest was not yet counted; if it is more than a line, a Deferred line in the Handoff instead.
- Owns: `src/components/guest/upload/`, `src/components/guest/guest-upload.tsx`, `src/components/guest/guest-upload.test.tsx`, `src/components/guest/event-experience.tsx` (the count line only), `src/lib/guest/use-upload-queue.ts`, `src/components/app/print/`, `docs/systems/guest-flow.md` (the failure sheet's line, refined in place). Reads, never edits: `src/components/guest/live-gallery.tsx`, `src/components/guest/guest-masonry.tsx`, `src/components/ui/sheet.tsx`, `src/app/(print)/`, `src/app/globals.css` (the print block), `src/lib/media/validators.ts`, `docs/systems/host-app.md`, `docs/design/rulings.md` (the section "the closing sitting's third batch": `failed=sheet`, `tap=sheet`, `venue=sheet`).
- Tests: the contracts above; `guest-upload.test.tsx`, `failure-sheet.test.tsx`, `intent-sheet.test.tsx`, the print stock's test, `lab:smoke` whole; the gate with every exit code. The red-team on the alias after the merge is the Orchestrator's (the pane at 375: a refused file, Not now, then a clean run; the print page's nine cards measured on the alias hostname).
- His to overrule: dismissed failures dropped from the queue (rather than kept and hidden); the link line wrapping anywhere (rather than a shorter link printed on the card); the review step held through the close.

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
`node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` with the 8 known warnings, `pnpm test`,
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
