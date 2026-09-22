---
track: reshape-guest-capture
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "27ff8a9e"          # the launch-prep SHA the branch was cut from
board: guest-capture   # the board's tiles redrawn on the shipped door; no verdict, no ask moved; the board stays on the desk
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/guest-capture/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/guest/
  - docs/design/rulings.md
  - src/app/(dev)/design/touchpoints.ts
---

# lp/reshape-guest-capture

**Goal.** A lab-only RESHAPE of the `guest-capture` board's tiles after the door ruling (Will, 2026-09-21, verbatim in `docs/design/rulings.md` under \"the door as three steps\") and its wiring (`door-steps`) changed the door the board draws: the previews are redrawn on the shipped components so that Will never judges a picture of a door that no longer exists. NOT a new board: no verdict recorded, no ask removed or added, the five questions stand for his review; `lab:demo --board guest-capture` and the registry tests are the proof. Read the brief end to end before the first edit.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `27ff8a9e`)

- What this is: the `guest-capture` board (five decisions over Priya on the shipped capture flow, on the desk, unasked) draws a door the door ruling (2026-09-21, rulings.md "the door as three steps") replaced: since the wiring merged, the first upload happens INSIDE the welcome sheet, every guest names themselves at the door, and the offer's moment is the album's opening after it. The Orchestrator already folded the ruling into four asks' context (`moment`, `shape`, `landing`, `name`, at the record) without removing any question; this lane redraws the previews that still show the superseded door, on the NEW shipped components, and measures every tile. No verdict is recorded, no ask is removed or added, the board stays at its round number with `round.date` today. `lab:demo --board guest-capture` and `lab:smoke` must pass; the board at 375 and 1440 by eye.
- Redraw: `parts.tsx` (the "Not now, take me to the album" line and any picture of the old first Add, the name step at the first Add, or a "Just browsing" exit), `scene.tsx` and `fixtures.ts` where the door's copy or order is drawn; the `sheet-step` option of `shape` names the welcome sheet's last screen now; the `first` option of `moment` is the album's opening; the `together` option of `name` is where the profile-setup wizard Will named would live. Keep every option; keep the board's `lives` list truthful (the paths of the shipped components).
- Owns: `src/app/(dev)/design/sandbox/guest-capture/`. Reads, never edits: `src/components/guest/` (the shipped door and its copy), `docs/design/rulings.md`, `src/app/(dev)/design/touchpoints.ts`.
- Tests: the registry tests (`registry.test.ts` holds every string inside its limit: an ask's context at most 240 as a lede), `lab:smoke` whole, `lab:demo --board guest-capture`; the gate with every exit code.
- His to overrule: nothing new; the board's five questions stand for his review.

## The verdict map (every answer of the batch; this lane wires only its own board's)

(no verdict map: Will's three points, his addition and his three answers, verbatim in docs/design/rulings.md under "the door as three steps"; the brief above is the whole ruling as the approved plan carried it)

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

- none. The one call the brief left open (the exact word for the sheet-step's dismiss) was taken on its own line
  and is listed under "his to overrule" below.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. Lab-only: no production byte, no `docs/systems/` fact inside this lane.

## Deferred (ROADMAP one-liners, bucket named)

- Now (guest-capture, lab fidelity): `board.tsx`'s `shapeScreen` dims the `sheet-step` peek behind the sheet with a
  manual `opacity-40` rather than the real `entry-shell.tsx` overlay's own `bg-black/10
  supports-backdrop-filter:backdrop-blur-xs` (the mechanism the "nine-tile teaser sits blurred behind it the whole
  way" law names, guest-flow.md "The ARRIVAL"). Left as is this lane: the opacity stand-in is not wrong, only less
  faithful, and a backdrop-filter step reports UNPAINTED in headless Chrome, which is real verification cost for a
  cosmetic gain unrelated to the door ruling this lane was cut to fix. Worth matching next time this board is touched.

## Handoff (replaces the chat report)

- The board commit is `4d5bd4a7` (the one redraw); synced with `origin/launch-prep` at `e6e02136` (it had moved from
  the `ff4a87d1` cut, docs/tracking only: `door-fixes` cut and journaled, no code touching this lane's `owns` or
  `reads`), fast-forwarded, never rebased. Pushed.
- Every claim below names its artifact (a commit hash, a log line, a file path), so the Orchestrator checks rather
  than believes; a claim with no artifact is read as unverified.
- Gates on the SYNCED tree, each its own exit code: `pnpm design:rules` 0 (no diff) · specimens
  (`node "src/app/(dev)/design/gallery/collect-specimens.mjs"`) 0 (no diff) · `pnpm typecheck` 0 · `pnpm lint` 0 (10
  known warnings, none in a file this lane touched) · `pnpm test` 0 (3487 passed, 2 skipped, 327 files) · `pnpm build`
  0 (257 static pages, "Compiled successfully"). `pnpm lab:smoke --base http://localhost:3134` 0 (421 checks, 0
  failing; guest-capture reads 309 words against the 1200 budget). `pnpm lab:demo --board guest-capture --base
  http://localhost:3134` 0 (5 steps, 0 failing: moment/shape/follow/landing/name every one "ok", "Every step draws
  its options"). Logs in the lane's scratch dir (`build.log`, `build2.log`, `dev-server.log`, `dev-server2.log`). The
  dev server ran on :3134 alone and was killed by port before every build, the test run and this handoff.
- No backdrop-filter step was added by this lane's own edit (the killed line was plain text), so headless
  `lab:demo`'s capture is trustworthy here without a by-hand exception; the `shape.sheet-step` tile was still
  eyeballed live at both breakpoints (see "Look at first").
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/guest-capture/parts.tsx`
  alone (owned), plus this manifest. No exceptions.
- The items: none. `GUEST_CAPTURE` declares no `catalog`, so there is nothing to keep, refine or kill; the board is
  five asks only, all five still open, none answered.
- Calls his to overrule on the alias, one line each:
  - The `shape.sheet-step` dismiss now reads "Maybe later" (was "Not now, take me to the album", which stood against
    "No exit" and, once the sheet she sends from became the held welcome sheet itself, was backwards on the facts:
    there is no album yet to send her back to). Chosen to match the same ask's own wording everywhere else it is
    drawn (`OfferCard`'s shipped "Maybe later") rather than coin a new phrase; a different word for a held sheet
    specifically is his call to make.
  - `moment`, `follow`, `landing` and `name` were audited whole against the shipped door (guest-flow.md "The
    ARRIVAL") and drew nothing that contradicts it (the album-already-open card/inline previews for `moment` and
    `shape`, the post-confirmation `follow`/`landing`/`name` screens, `NameStepCard`'s own "you typed this at the
    door" line already correct), so their pictures stand unchanged; only `shape.sheet-step` needed a redraw.
- The help articles this lane makes stale: none. Lab-only, no production byte, no shipped behaviour described
  anywhere changes.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: the `shape` ask's `sheet-step` option at 375 (the one tile this lane redrew: "Maybe later" on the
  held sheet, the dimmed album peeking behind, "Sent · Your photo joined Maya's album" above "Keep these photos"),
  then the same tile at 1440. Every other tile on the board is unchanged pixels; `card` and `inline` (the other two
  `shape` options) are worth a glance only to confirm they still read as they did.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-21). The board's five tiles, drawn before the door ruling existed, were
audited whole against the shipped door ("the door as three steps", rulings.md) the Orchestrator's record had already
folded into four asks' own context (`moment`, `shape`, `landing`, `name`). One real violation stood: the `shape` ask's
`sheet-step` option (`OfferSheet`) still told the pre-ruling story, a guest already standing in the album dismissing a
separate upload sheet with "Not now, take me to the album," which was now both against "No exit" (his words,
verbatim) and backwards on the facts once that sheet became the held welcome sheet itself, shown before the album
ever appears. The dismiss now reads "Maybe later," the same words this ask already wears everywhere else it is
drawn; `moment`, `follow`, `landing` and `name` were found already accurate and left untouched. No verdict recorded,
no ask added or removed: the board's five questions stand at round 1 for Will's review.
