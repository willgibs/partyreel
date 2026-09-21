---
track: guest-capture
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- none: the brief's "his to overrule: the five decisions' framing; the board's place on the desk" already authorized
  this lane to pick the framing itself, so there was no genuinely open product decision to escalate. The framing
  calls taken are listed under Handoff below.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none: lab-only, no production byte, no shipped fact changed.

## Deferred (ROADMAP one-liners, bucket named)

- none found while building.

## Handoff (replaces the chat report)

- Head at the commit this manifest is committed in (the chat report names its SHA: "handed off at \<sha\>"), pushed;
  synced with `launch-prep` by fast-forward merge at `1a1d83c0` (`git merge origin/launch-prep --no-edit`, clean, no
  conflicts: the diff showed `origin/launch-prep`'s 17 new commits touched none of this lane's `reads` or the
  registration-exception files before the sync).
- Every claim below names its artifact so the Orchestrator checks rather than believes.
- Gates on the synced tree, each its own exit code: `pnpm design:rules` ok, its artifact the `docs/design/library.md`
  diff in this commit ("14 standing boards" → "15", one new row) · specimens ok (`collect-specimens.mjs`: "140
  specimens on 101 entries", byte-unchanged by this lane, confirmed with `git status` before committing) · `pnpm
  typecheck` ok (exit 0) · `pnpm lint` ok (exit 0, 8 known warnings post-sync, zero in a file this lane touched) ·
  `pnpm test` ok (3396 passed, 2 skipped, 323 files) · `pnpm build` ok (exit 0, 255 pages, `rm -rf .next/dev` first).
  `pnpm lab:smoke --base http://localhost:3135` ok (418 checks, 0 failing, whole lab). `pnpm lab:demo --board
  guest-capture --base http://localhost:3135` ok (5 steps, 0 failing: moment, shape, follow, landing, name each
  "ok", the stage moving 15.5% to 84.25% between options, so every option is genuinely drawn, none frozen).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` (after this manifest's own commit) = exactly
  `src/app/(dev)/design/sandbox/guest-capture/{board,fixtures,parts,scene,spec}.tsx|ts` (owned) +
  `docs/tracks/guest-capture.md` (this file) + the registration exception's three files
  (`src/app/(dev)/design/sandbox/registry.ts`, `src/app/(dev)/design/(shell)/lab/boards.ts`,
  `src/app/(dev)/design/touchpoints.ts`: one import + one head-of-array/union line each, plus the new `RULINGS` entry
  and the `DESK_ORDER` head line in touchpoints.ts) + `docs/design/library.md` (generated by the required
  `pnpm design:rules` step, a direct, mechanical consequence of the touchpoints.ts registration — not hand-edited).
- The five decisions, one line each (no catalog on this board, so no `item:` verdicts; each is an ask in the board's
  own ledger once he answers it): `moment` (when the offer first reaches her) recommends `first`, as shipped, on
  reach over strength · `shape` (card, inline or the sheet's last screen) recommends `inline`, the mark's popover
  idiom extended to the tile · `follow` (the moment card's own row, or folded into the Guests list, or a link)
  recommends `list`, one follow surface instead of two · `landing` (the album, her new profile, or the dashboard)
  recommends `album`, as shipped, staying inside the party rather than redirecting into the app · `name` (silent, a
  confirm step, or name+handle together) recommends `together`, folding the existing handle nudge around the name
  rather than adding a new interruption.
- Calls his to overrule (framing decisions this lane made under the brief's own authorization, never a product
  ruling): the world is Priya at Maya and Jay's wedding, `media-viewer`'s own fixture continuity (she is the
  guest that board's `who.face` tile already marked unproven), rather than a fresh fixture — his to overrule if a
  different guest or event reads better beside that board · the `follow` decision's `list` option marks the host
  inside the Guests section with the same Host/Guest pill `profile-page`'s `EventCard` already wears, rather than
  inventing a new mark · the `shape` decision's `sheet-step` option is drawn riding whichever visit the `moment`
  decision names (its own `because`/`overrule` text states the trade rather than mechanically staging the two asks
  behind each other) · no `COUNT` knob on the dock: each decision holds a representative photo count fixed (1, 10 or
  4 depending on the ask) rather than exposing it as an adjustable control, to keep the dock to one shared knob
  (`Screen`).
- The help articles this lane makes stale: none (lab-only, no shipped behavior or copy changed).
- Assets requested from Will: none (the twelve stock marketing stills, bible 18's existing set, cover every preview).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: the `shape` decision's `sheet-step` option (a quoted, `position: fixed` reproduction of
  `ui/sheet.tsx`'s bottom sheet, never a mounted one — a portalled Radix surface renders on the lab page rather than
  the frame, the same landmine `host-curation`'s own stylesheet documents) and the `follow` decision's `list` option
  (the Guests section forked with a locally-stateful Follow control, never the real `FollowButton`, so a press moves
  a picture and never a database row) are the two places this lane worked hardest to stay honest about what is real
  and what is quoted; worth a second pair of eyes before the board goes in front of Will.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). A new board on Will's word (2026-09-21 approval: "I'd like to get
this in the lab for refinement"), drawn on the shipped capture flow (`save-account-prompt.tsx`,
`claim-handle-prompt.tsx`, `follow-moment-card.tsx`, `unverified-mark.tsx`, `guest-header.tsx`) over one guest,
Priya, continuing `media-viewer`'s own fixture world. Five decisions, `defineExploration`, phone first at 375 with
1440 on the knob: the moment the offer first reaches her (recommended: as shipped, after the first photo), the
offer's shape (recommended: a line under her own tile, not the card), the follow surface (recommended: folded into
the Guests list, one surface instead of two), the landing (recommended: the album, as shipped, never a redirect),
and what the typed name becomes (recommended: name and handle settled together, one step). Lab-only, no production
byte; registers at the head of `DESK_ORDER`, moved into place after `media-viewer` at this merge.
