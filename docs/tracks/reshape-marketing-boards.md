---
track: reshape-marketing-boards
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5143c87e"          # the launch-prep SHA the branch was cut from
board: site-chrome     # and profile-page, privacy-hero, album-motion, loose-ends, contact-page, press-page: reshaped in place inside their open rounds; no retirement, no new board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/site-chrome/
  - src/app/(dev)/design/sandbox/profile-page/
  - src/app/(dev)/design/sandbox/privacy-hero/
  - src/app/(dev)/design/sandbox/album-motion/
  - src/app/(dev)/design/sandbox/loose-ends/
  - src/app/(dev)/design/sandbox/contact-page/
  - src/app/(dev)/design/sandbox/press-page/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/overtaken.ts
  - src/components/lab/exploration.ts
  - src/components/lab/board-spec.ts
  - src/app/(dev)/design/touchpoints.ts
  - docs/design/rulings.md
  - docs/STATUS.md
  - docs/reviews/site-chrome.json
  - docs/reviews/profile-page.json
  - docs/reviews/privacy-hero.json
  - src/components/marketing/chrome/
  - src/components/shared/arrival.css
---

# lp/reshape-marketing-boards

**Goal.** A lane of the overtaken audit (Will, 2026-09-21, verbatim in `docs/design/rulings.md` under "the overtaken audit: reshape or remove, and the stacking rule"): "For any open questions that have been 'overtaken', please evaluate whether they should be reshaped or removed", with his criteria (reshape a question that could still offer a better solution than the earlier selection that overtook it, with updated context; remove only a question with zero potential value; "I'd rather you lean into reshape if you aren't confident in removal"; "everything is unprotected and anything may be re-litigated"). The Orchestrator read every badged question against the ruling its badge names and judged each: the verdicts for this lane's boards are the brief below, one line per question, and are the whole reading. This is lab work on the boards' own folders: no production byte.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `5143c87e`)

- What this is: as Lane 62's first line, for these seven boards (the same rules). Three of them hold a ledger (`site-chrome` round 2, `profile-page` round 2, `privacy-hero` round 3) with no answer on any badged ask: the reshape stays inside the open round.
- site-chrome.foot-after (redraw): the demo's door is one framed photograph with the code in its corner (demo-event r2), so today's photo pile register is already redrawn. Ask what the footer shows under a page that closed on its own invitation, with the framed object as today's register.
- site-chrome.foot-alone: one more page closes on questions (pricing-page r2). Ask as before.
- site-chrome.foot-phone: a code's real home is printed stock (first-event r1), so a phone code is decoration. Ask hidden vs none, with `small` weakened and said so.
- profile-page.view-all: the sheet is the primitive (guest-shape r1), no centred float at a desk (r2) but a centred object is alive at a laptop (app-pricing r1). Ask sheet vs page vs the centred list, with inline as the cheap fourth.
- profile-page.quick-look: both halves of adaptive are ruled objects (app-shape r1's sheet and mini-modal); every guest has a face (seed-avatar r1); the sheet at a desk is a right-edge panel (guest-shape r2). Ask which one a look is.
- profile-page.way-back: crumbs ride the host bar (app-shape r1); the guest's chrome had its second round (guest-view-menu landed); the account menu took a standing row (app-pricing r1). Ask the pill vs the menu row vs nothing, for a signed-out guest too.
- privacy-hero.concept (new): frosted is a named material (glass r2); the welcome runs copy over bespoke pictures (app-door r2); one pass of light across a tile is the product's own arrival (guest-upload r1). Ask the mechanism, with the access grid's tiles clearing by the product's own sweep as a concept.
- album-motion.fall (redraw): the real arrival is ruled (a new photograph grows into its column under a glow; one arrival everywhere: guest-shape r1, guest-upload r1). Re-cut the three against the ruled arrival and ask which tells it truly on the hero.
- loose-ends.chart-light and chart-dark: the charts lead the portal's home now (admin r1). Ask the cast as before with that daily reader named.
- loose-ends.faq-look: the pricing page's questions are folded and last (pricing-page r1 and r2). Ask the look with that page as one of the two.
- loose-ends.review-photo: his legibility test (demo-event r2) and the waiting tile's frame (guest-upload r1). Ask the ranking as before.
- loose-ends.everywhere-pill (dropped `hover`; new): a tile's marks are ruled and the hover pill is a desk verb (app-vocabulary r1); the newest tile takes one pass of light (guest-upload r1). Ask none vs a corner mark vs the product's own sweep on the newest tile.
- contact-page.page: a paper hero softened that seam on pricing (pricing-page r1 and r2). Ask as before with that read named.
- contact-page.topic: a door that asks one field and defers the rest is ruled (first-event r1), the picker kept up front (style=step). Ask as before.
- contact-page.urgency: a failure at a live party is the product's worst hour (guest-upload r1). Ask as before with the premise confirmed.
- contact-page.receipt: a confirmation worth feeling opens a modal (app-pricing r1). Ask as before with that lean.
- press-page.the-sheet: the product prints its own stock (first-event r1), so the kit has real objects. Ask with `brand-in-use` holding them.
- press-page.the-arc: overview, detail, questions (pricing-page r2). Ask as before with that precedent.
- Owns: `src/app/(dev)/design/sandbox/site-chrome/`, `src/app/(dev)/design/sandbox/profile-page/`, `src/app/(dev)/design/sandbox/privacy-hero/`, `src/app/(dev)/design/sandbox/album-motion/`, `src/app/(dev)/design/sandbox/loose-ends/`, `src/app/(dev)/design/sandbox/contact-page/`, `src/app/(dev)/design/sandbox/press-page/`. Reads: `src/app/(dev)/design/sandbox/overtaken.ts`, `src/components/lab/exploration.ts`, `src/components/lab/board-spec.ts`, `src/app/(dev)/design/touchpoints.ts`, `docs/design/rulings.md`, `docs/STATUS.md`, `docs/reviews/site-chrome.json`, `docs/reviews/profile-page.json`, `docs/reviews/privacy-hero.json`, `src/components/marketing/chrome/`, `src/components/shared/arrival.css`.
- Verify: the registry tests and `overtaken.test.ts` green (the nineteen entries deleted); `lab:smoke` whole; `lab:demo` on each board that has steps; the boards at 375 and 1440; the gate.
- His to overrule: every reshaped framing; the dropped `hover`; the two new concepts; the two redraws.

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
