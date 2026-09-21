---
track: verified-email-lab
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "bc28580b"          # the launch-prep SHA the branch was cut from
board: guest-verify    # retires at this lane's merge (its five asks ruled on his words); the desk pass rides in the same seat
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/guest-verify/
  - src/app/(dev)/design/sandbox/overtaken.ts
  - src/app/(dev)/design/sandbox/overtaken.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/guest-verify.json
  - docs/ROADMAP.md
  - docs/design/rulings.md
  - src/components/lab/exploration.ts
  - src/components/lab/board-spec.ts
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/touchpoints.ts
  - docs/tracks/orchestrator.md
---

# lp/verified-email-lab

**Goal.** Wave 1 of the identity reshape: Will's `address=none` on `guest-verify` round two and his note (2026-09-21, build `5e210ef`), verbatim in `docs/design/rulings.md` under "the identity reshape", with his four answers at approval: anonymity leaves the product; the host's switch becomes Require verified emails (on by default); off, a guest types a display name at the door and uploads under it with a small unverified mark; the capture flow after a name-only guest's first upload is wired as the working version. This lane retires `guest-verify` (every ask ruled on his words) and runs the desk pass across the fourteen standing boards. The brief below is the whole reading.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `bc28580b`)

- The board RETIRES (his answer 4) under the retirement exception, its lines in `registry.ts`, `lab/boards.ts` and
  `touchpoints.ts` as Handoff exception lines (RulingId kept; the RULINGS row rewritten as shipped with its `lives`
  list; no `board` block; R2.13); `sandbox/guest-verify/` deleted; the board's three `guest-verify.*` entries removed
  from `overtaken.ts` in the same commit (the test refuses a key naming a retired board); the ledger deleted at the
  record by the Orchestrator. Its gate is green only after syncing past `verified-email-guest`'s merge if that lane's
  manifest still reads anything it deletes (it does not: the reads were dropped); the lane syncs before handoff anyway.
- The desk pass in the same lane, after the retirement commit, is ONE paragraph and NO new badge: `overtaken.ts` gains
  "a hold can be superseded by his own next shape" in the HELD comment (`gate=after` fell to `address=none` and the
  renamed switch; recorded in rulings.md, never as a badge). The reach of "every upload carries a name" across the
  fourteen standing boards is NOT badged: the overtaken audit's reshape lanes (Lanes 62 to 65, cut 2026-09-21 on Will's
  cleanup) fold that context into the questions themselves and delete every existing badge on those boards as exception
  lines in this file; this lane deletes only the three `guest-verify` entries with the board. When the reshape lanes have
  merged the map holds no entry; the file, its type, its test and the desk's badge stay as the mechanism for a future
  overlap, which the stacking rule (PROGRAM.md) is to avoid.
- Owns: `src/app/(dev)/design/sandbox/guest-verify/` (deleted), `src/app/(dev)/design/sandbox/overtaken.ts`,
  `src/app/(dev)/design/sandbox/overtaken.test.ts`. Reads: `docs/reviews/guest-verify.json`, `docs/ROADMAP.md`,
  `docs/design/rulings.md`, `src/components/lab/exploration.ts`, `src/components/lab/board-spec.ts`,
  `src/app/(dev)/design/sandbox/registry.ts`, `src/app/(dev)/design/touchpoints.ts`, `docs/tracks/orchestrator.md`.
  Verify: `overtaken.test.ts`, `queue.test.ts` and the registry tests green; `lab:smoke` whole; the gate.

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

- None for Will: the brief's four answers cover the board, and nothing here was a one-way door. Three calls
  taken inside the lane are listed under the Handoff ("Calls his to overrule") with what each one cost.
- One for the Orchestrator, not a question but a hazard found by measurement, so it is written where it will
  be read: `src/app/(dev)/design/(shell)/lab/_desk/queue.test.ts:392` crashes at import when `OVERTAKEN` is
  empty (`const SPEC = BOARDS.find(...)!` is `undefined`, then `SPEC.id`), which is exactly the state the
  audit's four reshape lanes leave the map in after the last of them merges. Verified by emptying the map on
  this tree: `TypeError: Cannot read properties of undefined (reading 'id')`, one test file failing. It is
  nobody's `owns` today. The fix is one line by the lane that empties it: `describe.runIf(SPEC)` around the
  block at line 375, or a `BOARDS[0]`-shaped fallback. `overtaken.test.ts` is already safe (proved below).

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none: this lane owns no `docs/systems/` fact. The identity reshape's system doc is the wiring lanes'
  (`guest-flow.md`, `auth-accounts.md`), and `docs/design/library.md` is regenerated, never written.

## Deferred (ROADMAP one-liners, bucket named)

- Lab, Next: `HELD` in `sandbox/overtaken.ts` still reads `"held for guest-verify round two: "`, so the next
  hold ever written would badge itself with a board that retired today. Renamed by the lane that writes that
  hold, never before it (a hold's words are his, and there is no hold to rename against yet); the caveat is in
  the file's own HELD note so it cannot be missed.
- Lab, Next: when the audit's last reshape lane empties `OVERTAKEN`, every batch marker above the map
  (`APP_SHAPE`, `GLASS`, `GUEST_SHAPE`, ... `CREATE`, `UPLOAD`) goes unused with it and the gate gains a
  warning per marker. That lane deletes the marker block with the last entry; the batches it names are written
  above it in words either way. Three of them went in this lane's own retirement commit for the same reason.

## Handoff (replaces the chat report)

- BOARD commit `452f1713` (the retirement) and `955a2d46` (the desk pass); SYNC-MERGE `275e1cde`
  (`origin/launch-prep` had moved to `18b63b31`, the journal at wave 1's cut; merged, never rebased). Pushed.
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` ok (0), specimens ok (0; 140
  specimens on 101 entries), `pnpm typecheck` ok (0), `pnpm lint` ok (0; **8** warnings, two BELOW the
  baseline of 10, because two of that baseline's ten were unused markers in a file this lane owns and went
  with the third), `pnpm test` ok (0; 318 files, 3307 passed, 1 skipped), `pnpm build` ok (0; 255 static
  pages). `pnpm lab:smoke --base http://localhost:3134` ok (0; **412 checks, 0 failing**, fourteen boards
  inside the 1200-word reading budget). `pnpm lab:demo --board guest-verify` is NOT runnable and was not run:
  the board it names is what this lane deletes. Dev server on :3134 only, killed by port before each build,
  each test run and the handoff.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the three owned paths
  (`sandbox/guest-verify/` deleted whole, `sandbox/overtaken.ts`, `sandbox/overtaken.test.ts`) plus FOUR
  exception lines, each named with why:
  - `src/app/(dev)/design/sandbox/registry.ts` — the board's import and its line in `REGISTERED`. The
    retirement exception (`docs/tracks/orchestrator.md:19-20`: a lane adds or removes ONLY its own board's
    lines in the board lists).
  - `src/app/(dev)/design/(shell)/lab/boards.ts` — the board's import and its `BOARD_COMPONENTS` entry. Same
    exception; retiring is atomic across these three files plus the directory, which that file's own head
    comment states.
  - `src/app/(dev)/design/touchpoints.ts` — the board's id out of `SandboxId` and out of `DESK_ORDER`, and
    its RULINGS row rewritten as shipped with its `lives` list and no `board` block (`RulingId` kept, R2.13).
    Same exception. Nothing else in that file is touched: not the H1, not another board's line.
  - `docs/design/library.md` and `src/app/(dev)/design/rules/rules.generated.json` — GENERATED, never
    written: `pnpm design:rules` after a `touchpoints.ts` change, per CLAUDE.md. The library's board table
    loses the row and its count reads 14 standing boards; the artifact's only diff is the line numbers of
    `overtaken.test.ts`'s contracts.
  - No record doc touched (`CHANGELOG`, `STATUS`, `ROADMAP`, `ASSETS`, `orchestrator.md`, `rulings.md`,
    `docs/reviews/`). `docs/reviews/guest-verify.json` is left for the Orchestrator to delete at the record,
    as the house convention has it; `ledger.test.ts` iterates standing boards, so a ledger with no board is
    already ignored and the gate is green with it in place.
- The items, one line each:
  - `guest-verify` (the board): RETIRED on his "Retire it". Every ask has his words on it (`address=none`
    verbatim; `gate-switch` on that same note as a fourth shape; `collision` by the capture flow; `unproven`
    "Listed, with the mark"; `allowance` "No cap now"), so nothing was left unruled to carry forward. It
    lands in the Library as its RULINGS row: `ruled` carries the verdict and the fate of round one's four
    held rulings (`gate=after` SUPERSEDED, `expiry=host` moot, `badge=mark` and `host-lens=badge` carried
    onto the unverified name), `shipped` states the shape the three sibling lanes wire, `lives` names the
    three system docs and the four shipped files the ruling now governs.
  - `overtaken.ts`, the three `guest-verify.*` entries: DELETED with the board, replaced by the section
    comment the house uses (`app-vocabulary`, `toasts`, `seed-avatar`): a badge pointing at a question nobody
    is asking any more is worse than an answer left orphaned. The map goes 69 to 66; the desk reads "66 of 66
    overtaken, still open" and "14 standing boards".
  - `overtaken.ts`, the desk pass: ONE paragraph in the HELD note and NO new badge, as the brief has it. It
    names the third way a hold ends, his own next shape superseding it, and says why the reshape's reach
    across the fourteen standing boards is not badged here (the audit folds that context into the questions
    themselves; a badge would tell him a settled thing twice).
  - `overtaken.test.ts`: the mechanism made to outlive the entries (see the calls below). Twelve tests, green
    on today's map and green against an emptied one.
- Calls his to overrule, one line each:
  - **The map's test stops being a census** (the one call worth his eye). Four sibling lanes are deleting
    every badge on their boards; the last one to merge leaves `OVERTAKEN` empty, and the test as written
    pinned `admin-triage` at 8, `press-page` at 2, `media-viewer.opening` by name, a gloss floor of 40 and
    two "a pass appended behind two/three" floors. Every one of those is a true sentence about one afternoon
    rather than a fact about the mechanism, and all of them fail the day the audit lands. They are read off
    the map now (the counter proved against the keys it counts, board by board) and the two grammars they
    were protecting are proved on constructed notes, exactly as the HELD block already did. The failure the
    file exists to catch, a badge on a question nobody asks, is untouched and still per-entry. Measured both
    ways before and after. OVERRULE by pinning the numbers again, and the audit's last lane pays for it.
  - **Three unused batch markers deleted** (`AVATAR_2`, `VERIFY`, `VOCABULARY_2`). `AVATAR_2` went unused
    because this lane deleted the only entry that spread it; the other two were already two of the gate's ten
    known warnings, in a file this lane owns ("a warning in a file you touched is yours"). Lint reads 8. The
    batches they named are written in words in the comments above them, so nothing recorded was lost.
  - **A stale sentence in `overtaken.test.ts` corrected**: it claimed the file is "deliberately NOT a
    published contract", while line one carries `@contract-for:` and `rules/component-notes.ts` has held its
    `for` line since the mechanism landed. Corrected in place to say that a change here moves the Library and
    `pnpm design:rules` belongs in the same commit.
- The help articles this lane makes stale: none. Lab-only, no production byte, and nothing under
  `content/help/` or `content/blog/` is read or written.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Doc-check (Context7, before building): Next 16 App Router, dynamic params and `generateStaticParams`. Found
  nothing binding here: the lab has no `generateStaticParams` at all (`grep` over `src/app/(dev)/design`), so
  removing a board removes no prerendered path and cannot hit the empty-array build error. No Tailwind, zod
  or Supabase surface is touched.
- Look at first: the desk at `/design/lab` (14 standing boards, "66 of 66 overtaken", the head board now
  `media-viewer`), checked at 1440 and 375; `/design/lab/guest-verify` and `/design/c/guest-verify` both a
  clean 404, `/design/lab/media-viewer` and `/design/library/rulings` 200. Then the HELD note in
  `src/app/(dev)/design/sandbox/overtaken.ts` (the one new paragraph), then the RULINGS row in
  `src/app/(dev)/design/touchpoints.ts`. Then the hazard under Questions, which is a sibling lane's gate.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-21). `guest-verify` retired on his "Retire it" with every ask
ruled on his own words: the board left `SandboxId`, `DESK_ORDER`, `sandbox/registry.ts` and
`(shell)/lab/boards.ts` in one commit with its directory, and its RULINGS row was rewritten as shipped (the
switch renamed Require verified emails, a typed name with its unverified mark off it, the capture flow after a
first upload) with `lives` naming the three system docs and four shipped files. Its three badges went with the
asks they named, taking the map from 69 to 66 and the desk to 14 boards. The desk pass was one paragraph and
no badge: a hold can be superseded by his own next shape, which is what `address=none` did to all four of
round one's, and the reshape's reach is left to the audit's questions rather than badged twice. The map's test
stopped being a census so the four reshape lanes can empty the map without a red gate, proved against an
emptied map; the desk's own `queue.test.ts` is not safe that way and was handed over named. Lint fell to 8,
two below the baseline.
