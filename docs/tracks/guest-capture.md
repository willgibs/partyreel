---
track: guest-capture
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c7817102"          # the launch-prep SHA the branch was cut from
board: guest-capture   # a new board on his word: registers at the head of DESK_ORDER; the Orchestrator moves it after media-viewer at the merge
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/guest-capture/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/guest/save-account-prompt.tsx
  - src/components/guest/follow-moment-card.tsx
  - src/components/guest/claim-handle-prompt.tsx
  - src/components/guest/guest-header.tsx
  - src/components/shared/unverified-mark.tsx
  - src/components/social/follow-button.tsx
  - src/components/social/guest-list.tsx
  - src/components/auth/account-door.tsx
  - src/app/(guest)/u/[slug]/
  - src/components/lab/
  - docs/design/rulings.md
  - docs/reviews/README.md
---

# lp/guest-capture

**Goal.** A NEW BOARD on Will's word at approval (2026-09-21, verbatim: "You can wire it now as you recommended, but I'd like to get this in the lab for refinement."): the capture flow shipped by `verified-email-guest` (the offer after a name-only guest's first upload, the follow moment, the profile the guest lands on) refined as a lab catalog for his next sitting, drawn on the SHIPPED components; lab-only, no production byte. The brief below is the whole reading.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `c7817102`)

- What this is: the capture flow lands as a working version in Lane 58; this board is its refinement catalog for
  his next sitting, drawn on the SHIPPED components (the offer card, the follow moment, the profile the guest lands
  on, the guest's own menu with its unverified name), lab-only ("NO PRODUCTION BYTE"), a `defineExploration` with
  three to five decisions at 375 and 1440, each a catalog of two or three options with a recommendation and its
  cost: the MOMENT (after the first photo, as shipped; at the tenth; when the guest returns to the album; when they
  tap Yours; the album's end), the OFFER'S SHAPE (the card in the album's slot, as shipped; a line under the guest's
  own tile; a step inside the upload sheet after Send), the FOLLOW SURFACE (the one moment card, as shipped; the
  Guests section with Follow on every handled chip; the host's profile as the landing after saving), the LANDING
  (the album, as shipped; the new profile with the event on it; the dashboard's saved events), and WHAT THE NAME
  BECOMES (the profile takes the typed name, as shipped; the guest is asked to confirm it; the handle claim in the
  same breath, as shipped on the card's second line). It registers at the HEAD of `DESK_ORDER` under the registration
  exception (its lines in `registry.ts`, `lab/boards.ts`, `touchpoints.ts` as Handoff exception lines; the
  Orchestrator moves it into its leverage place at the merge: after `media-viewer`, since the capture flow lives
  under the album's shape), with a RULINGS row and a `for` line; its ledger is opened by the Orchestrator when it is
  first reviewed.
- Owns: `src/app/(dev)/design/sandbox/guest-capture/` (new). Reads (every one on disk at the wave-2 cut, after the
  guest lane's merge): `src/components/guest/save-account-prompt.tsx`, `src/components/guest/follow-moment-card.tsx`,
  `src/components/guest/claim-handle-prompt.tsx`, `src/components/guest/guest-header.tsx`,
  `src/components/shared/unverified-mark.tsx`, `src/components/social/follow-button.tsx`,
  `src/components/social/guest-list.tsx`, `src/components/auth/account-door.tsx`, `src/app/(guest)/u/[slug]/`,
  `src/components/lab/`, `docs/design/rulings.md`, `docs/reviews/README.md`. Verify: the registry tests; `lab:smoke`
  whole; `lab:demo --board guest-capture`; the board at 375 and 1440; the gate.
- His to overrule: the five decisions' framing; the board's place on the desk.

## The verdict map (every answer of the batch; this lane wires only its own board's)

(no verdict map: one verdict and a note, verbatim in docs/design/rulings.md under "the identity reshape", and his four answers at approval; the brief above is the Orchestrator's whole reading)

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
