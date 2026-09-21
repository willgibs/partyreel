---
track: reshape-marketing-boards
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- Lab tides: `overtaken.ts` cleanup, ready NOW rather than pending — the fourth and final overtaken-audit lane
  (`reshape-admin-help-emails`) landed inside this lane's own second sync, so the `OVERTAKEN` map is genuinely
  empty (every board's badges gone) and all sixteen per-batch constants (`APP_SHAPE`, `GUEST_SHAPE`, `VOCABULARY`,
  `ADMIN`, `DOOR`, `CRYSTAL`, `DEMO`, `PRICING`, `APP_SHAPE_2`, `GUEST_SHAPE_2`, `DOOR_2`, `DEMO_2`, `PRICING_2`,
  `APP_PRICING`, `CREATE`, `UPLOAD`) are dead (24 lint warnings up from 10). A short follow-up (any seat): delete
  the sixteen constants and the now-answered-for-good `RULED`/`HELD` machinery's own reach, or leave the map as the
  empty mechanism its own test file already treats it as ("an empty map is a map the audit has finished with") —
  his call whether the mechanism stays standing for a future overlap or retires with this audit. Not swept by this
  lane per "never anything else in that file."

## Handoff (replaces the chat report)

- Board commit `eab11e0a` (the reshape itself); synced with launch-prep TWICE, at `d53a73f2` then at `15baa54f`
  (launch-prep moved 30 commits past the `5143c87e` cut for the first sync, then 12 more while this lane ran its
  gate and its live Chrome pass for the second: the other three overtaken-audit lanes and the identity reshape's
  waves 0-1 all landed first, `reshape-admin-help-emails` last of the three siblings, merging while this lane's own
  gate was running). `15baa54f` is the tree every number below is measured on.
- Every claim below names its artifact so the Orchestrator checks rather than believes.
- Gates on the synced tree, each its own exit code: `pnpm design:rules` ok; specimen collector ok; `pnpm typecheck`
  ok; `pnpm lint` ok, 0 errors, 24 warnings (baseline 10 in unrelated files, unchanged; +16 new, every one of them
  `overtaken.ts`'s own now-dead per-batch constants — `APP_SHAPE`, `GUEST_SHAPE`, `VOCABULARY`, `ADMIN`, `DOOR`,
  `CRYSTAL`, `DEMO`, `PRICING`, `APP_SHAPE_2`, `GUEST_SHAPE_2`, `DOOR_2`, `DEMO_2`, `PRICING_2`, `APP_PRICING`,
  `CREATE`, `UPLOAD` — since the fourth and final overtaken-audit lane landed inside this lane's own sync and the
  `OVERTAKEN` map is now genuinely empty, no `...CONST` spread anywhere in the file: left in place, not swept, per
  "never anything else in that file" — see Deferred, updated for this); `pnpm test` ok, 3396 passed, 2 skipped, 0
  failed; `pnpm build` ok, 255 static pages, no errors. `pnpm lab:smoke
  --base :3139` ok, 413 checks, 0 failing, every one of this lane's seven boards inside its 1200-word reading budget
  (site-chrome 343, profile-page 262, privacy-hero 220, album-motion 244, loose-ends 442, contact-page 359,
  press-page 413). `pnpm lab:demo --board <board> --base :3139` ok on all seven, 0 failing on every step: site-chrome
  3 steps, profile-page 3, privacy-hero 1, album-motion 1, loose-ends 7, contact-page 6, press-page 7 (28 steps
  total). No backdrop-filter step in this lane's boards; nothing needed a by-hand capture.
- Local visual pass (Chrome MCP against `:3139`, both live and via computed-style inspection through the lab's own
  iframes) on the newest pieces at 1440 and 375: privacy-hero's `sweep` concept (confirmed the band's
  `animation-name: swp-pass` fires, one tile clears in true colour at a time in a clean rotation, both breakpoints);
  loose-ends' `everywhere-pill.sweep` badge (confirmed `animation-name: evp-pass`, visible mid-pass on the newest
  tile); profile-page's `quick-look.sheet` (confirmed the desk frame renders a true right-edge panel, `x:1056,
  w:384, h:900` inside a 1440 frame, never full-width) and `.mini-modal` (confirmed centred both axes, capped,
  distinct from the sheet); profile-page's `view-all.centred` (renders correctly, capped and centred, at 375);
  press-page's `the-sheet.brand-in-use` new "On the printed stock" swatches (Table cards, Welcome sign, Poster, real
  `62 × 84mm` / `186 × 252mm` labels straight off `lib/qr/stock.ts`); site-chrome's `foot-after.today` (the real
  `FooterDemo`/`DemoFrame` object, a photograph in a mat with the code in its corner, confirmed rendering under a
  real CtaBand). Reduced motion was not toggled live in the browser (no emulation control exposed on this pane for
  it); both new CSS additions follow the codebase's own proven pattern exactly (privacy-hero: animation lives only
  inside `@media (prefers-reduced-motion: no-preference)`, matching `ACCESS`/`SEAL`/`APERTURE` in the same file
  verbatim; loose-ends: the same guard plus an explicit `content: none` belt, matching
  `components/shared/arrival.css`'s own real mark) — read by eye, not exercised live.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` (on `15baa54f`, the second sync) = the seven owned
  board folders (`site-chrome/`, `profile-page/`, `privacy-hero/`, `album-motion/`, `loose-ends/`, `contact-page/`,
  `press-page/`, every file inside each touched or added) plus this manifest, plus ONE exception line:
  - `src/app/(dev)/design/sandbox/overtaken.ts`: the nineteen badge entries this lane's boards carried, deleted (one
    per entry; listed below), exactly as the manifest and Will's own ruling (rulings.md, "the overtaken audit")
    direct — "the badge entries for your boards are deleted from `overtaken.ts` as exception lines... never anything
    else in that file." Nothing else in the file touched by this lane (its own header-comment growth for the
    already-merged sibling lanes' sections, and the `emails`/`site-chrome` conflict this lane's second sync hit and
    resolved onto origin's own newer text, are the other three overtaken-audit lanes' and the Orchestrator's, not
    this lane's content). The map is now fully empty (every board's badges gone, all four lanes landed) — see
    Deferred for the sixteen now-dead per-batch constants this leaves, none of them this lane's to sweep.
  - `overtaken.test.ts` picked up a real merge conflict on the FIRST sync only (origin had already rewritten the two
    tests this lane's deletions touched into a board-count-agnostic shape, presumably hit by a sibling lane first;
    resolved by taking origin's version whole, no line of this lane's surviving in it) and `rules.generated.json` /
    `docs/design/library.md` needed a `pnpm design:rules` re-run after it (this lane's own gate step, on a derived
    build artifact, never hand-edited). None of the three carries a diff against origin/launch-prep on the FINAL
    synced tree (`15baa54f`): the second sync's own regeneration converged exactly back onto origin's own
    committed copy, `git diff --stat origin/launch-prep HEAD -- overtaken.test.ts rules.generated.json library.md`
    empty. Worth one note for the Orchestrator regardless: partway through this lane's work, `library.md`'s own
    committed copy was briefly stale against its real source on origin/launch-prep (a contract test's own case
    count, a row for a component a prior wave had deleted) — self-corrected by the next lane's `design:rules` run
    (this one's), so nothing to act on, but a sign a prior merge skipped re-running it.
- The items, one line each (every asked question still open; no wiring, no Library entry — a lab board's verdict is
  Will's, not built until he answers):
  - `site-chrome.foot-after`: REDRAWN — the "today" register is the shipped framed photograph (demo-event r2), not
    the photo pile it was written against; the choice is now framed-object-vs-quiet-vs-merged-vs-tucked, not
    pile-vs-quiet-vs-merged-vs-tucked. Recommendation unchanged (`quiet`).
  - `site-chrome.foot-alone`: pricing-page's own folded-questions close named as a fifth bare route beside `/about`,
    `/press`, `/careers`, the 404. Recommendation unchanged (`full`).
  - `site-chrome.foot-phone`: `small` explicitly named the weaker option now a code's real home is ruled printed
    stock (first-event r1); the live tension is `hidden` vs `none`. Recommendation unchanged (`hidden`).
  - `profile-page.view-all`: reordered around the Sheet's real desk shape (a right-edge panel at 1440, confirmed
    live, never full-width); `modal` renamed `centred` and re-argued off the shipped welcome-to-Pro precedent
    (app-pricing r1) rather than "as drawn"; `inline` moved last as the named cheap fourth. Recommendation unchanged
    (`sheet`).
  - `profile-page.quick-look`: narrowed from three options to the app's two real ruled objects (the responsive
    Sheet, the QR's mini-modal — app-shape r1); the bespoke "popover at 1440" is gone. Recommendation FLIPS,
    `adaptive` to `sheet`: the Sheet's real desk shape already answers the objection that used to motivate a split.
  - `profile-page.way-back`: context corrected (the crumb trail rides the HOST's bar, out of a scanned guest's
    reach) and folds in the guest's own second-round chrome and the account menu's standing-row precedent.
    Recommendation unchanged (`pill`).
  - `privacy-hero.concept`: NEW fourth concept, `sweep` — the access grid's own tiles, cleared by the product's real
    arrival sweep (guest-upload r1, `components/shared/arrival.css`) instead of a bespoke crossfade; built, wired
    into the board and verified live. Recommendation FLIPS, `access` to `sweep`: it is the one concept built
    entirely from what the product now ships (Crystal's frost, the real sweep) rather than a mechanism invented
    before that grammar existed.
  - `album-motion.fall`: REDRAWN — the same three trips (glide/gather/cascade, engine untouched, out of this lane's
    owns), re-argued against the arrival the product has since ruled (grows into its column under a fading glow,
    guest-shape r1 + guest-upload r1) rather than "the album is what acts". Recommendation FLIPS, `glide` to
    `cascade`: cascade is the one whose own numbers already grow-then-hold-then-fade in place; `glide` is still what
    ships until he answers.
  - `loose-ends.chart-light` / `chart-dark`: context now names the admin portal's home page as the daily reader of
    these five tones (admin r1). Recommendation unchanged both (`graphite`).
  - `loose-ends.faq-look`: context now names pricing-page's FAQ as folded and closing its page last (pricing-page
    r1, r2), raising what is at stake in the look it shares. Recommendation unchanged (`heading`).
  - `loose-ends.review-photo`: the queue plate's frame redrawn on the real waiting tile (`WaitingTile`,
    `guest/upload/stack-tile.tsx`, guest-upload r1) — the queued photo now dims and carries a small clock badge;
    ranked against his own legibility test (demo-event r2), named explicitly. Recommendation unchanged (`rings`).
  - `loose-ends.everywhere-pill`: `hover` DROPPED (ruled a desk-only verb, app-vocabulary r1 — a fiction on the
    phone half of this very stage); NEW option `sweep` replaces it, the product's real arrival sweep quoted at a
    small corner badge (sized as a badge, not the full tile — `AlbumFillGrid`'s tile boxes are a live CSS-grid
    layout this board does not own or measure); built and verified live. Recommendation unchanged (`corner`).
  - `contact-page.page`: context now names pricing-page's own real order (a paper hero softening the seam above its
    own dark chapter, pricing-page r1/r2) as the precedent for this ask's `chapter` option. Recommendation
    unchanged (`chapter`).
  - `contact-page.topic`: context now names first-event's real precedent for "ask one thing up front, defer the
    rest" (`style=step`, first-event r1). Recommendation unchanged (`required`).
  - `contact-page.urgency`: premise now confirmed directly by a shipped surface (guest-upload r1's end-of-run
    failure sheet, built for exactly the mid-event failure this ask assumes). Recommendation unchanged (`stated`).
  - `contact-page.receipt`: context/overrule now name the app's own precedent for "a confirmation worth feeling"
    (a modal, app-pricing r1's welcome-to-Pro) as the lean; no fourth option added (a modal isn't one of the three
    on offer here, and the brief did not ask for a new concept on this ask). Recommendation unchanged (`card`).
  - `press-page.the-sheet`: `brand-in-use` gains a second addendum, the app's own printed stock (`lib/qr/stock.ts`,
    first-event r1) — three real swatches (table cards, welcome sign, poster) at their real relative proportions and
    real mm captions, beside the existing "in the app" screen mockup; built and verified live. Recommendation
    unchanged (`eight-plates`).
  - `press-page.the-arc`: context now names pricing-page's own re-cut chapter order (overview, then the detail
    table, then the questions, pricing-page r2) as this ask's own precedent. Recommendation unchanged
    (`today-order`).
- Calls his to overrule, one line each (every reshaped framing is his by the audit's own terms; these are the ones
  where this lane's own judgment changed a recommendation, added a concept, or dropped an option, called out by name
  per the manifest's own "His to overrule" line):
  - `profile-page.quick-look`'s recommendation flip, `adaptive` to `sheet` (the Sheet's real desk shape already
    keeps the rest of the list in view).
  - `album-motion.fall`'s recommendation flip, `glide` to `cascade` (the honest read of "which tells the real
    arrival truly" moves it; `glide` is still what ships).
  - `privacy-hero.concept`'s recommendation flip, `access` to `sweep`, and the new concept itself.
  - `loose-ends.everywhere-pill`'s new `sweep` concept and the dropped `hover`.
  - `site-chrome.foot-after` and `album-motion.fall`'s redraws (both explicitly named redraws in the brief).
- The help articles this lane makes stale: none. Nothing here changed a shipped surface's behaviour; every asked
  question is still open on its own lab board.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `privacy-hero.concept` (the new `sweep`, now recommended over `access`); `profile-page.quick-look`
  (the recommendation flip to the Sheet); `album-motion.fall` (the recommendation flip to `cascade`, the redraw's
  own honest read against the shipped arrival); `press-page.the-sheet`'s `brand-in-use` (the new printed-stock
  swatches).

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-21). The overtaken audit's marketing-boards lane reshaped nineteen
badged questions across site-chrome, profile-page, privacy-hero, album-motion, loose-ends, contact-page and
press-page into current ones carrying the rulings that reached them, none removed whole: two redraws (site-chrome's
footer onto the shipped framed photograph, album-motion's three trips against the product's own ruled arrival,
flipping its recommendation to cascade); two new concepts built from the product's real arrival sweep (privacy-hero's
fourth, now recommended; loose-ends' replacement for the dropped desk-only hover); profile-page's quick-look flipped
onto the shipped Sheet and its view-all reordered around the Sheet's real desk shape; the rest gained their badge's
precedent in context, recommendations otherwise unchanged. Every badge these boards carried is gone from
`overtaken.ts`; `overtaken.test.ts` resolved onto the sync's own already-generalized rewrite of the two tests this
lane's deletions touched.
