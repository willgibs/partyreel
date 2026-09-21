---
track: reshape-admin-help-emails
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5143c87e"          # the launch-prep SHA the branch was cut from
board: admin-triage    # and help-center, emails: reshaped in place, unanswered, at their round; no retirement, no new board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/admin-triage/
  - src/app/(dev)/design/sandbox/help-center/
  - src/app/(dev)/design/sandbox/emails/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/overtaken.ts
  - src/components/lab/exploration.ts
  - src/components/lab/board-spec.ts
  - src/app/(dev)/design/touchpoints.ts
  - docs/design/rulings.md
  - docs/STATUS.md
  - src/app/admin/reports/
  - content/help/
---

# lp/reshape-admin-help-emails

**Goal.** A lane of the overtaken audit (Will, 2026-09-21, verbatim in `docs/design/rulings.md` under "the overtaken audit: reshape or remove, and the stacking rule"): "For any open questions that have been 'overtaken', please evaluate whether they should be reshaped or removed", with his criteria (reshape a question that could still offer a better solution than the earlier selection that overtook it, with updated context; remove only a question with zero potential value; "I'd rather you lean into reshape if you aren't confident in removal"; "everything is unprotected and anything may be re-litigated"). The Orchestrator read every badged question against the ruling its badge names and judged each: the verdicts for this lane's boards are the brief below, one line per question, and are the whole reading. This is lab work on the boards' own folders: no production byte.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `5143c87e`)

- What this is: as Lane 62's first line, for these three boards (the same rules).
- admin-triage.look (dropped `card`): a prose inbox is a list beside the message (admin r1). Ask the one inbox where the thing judged is a picture: the ruled list carrying the frame beside the reason, or the picture leading full width with a caption.
- admin-triage.reason (dropped `same` and `quiet`, the latter as ruled): an empty block is absent, never drawn hollow (app-shape r2), so a wordless report draws nothing. Ask only the ranking half: do wordless reports fall under reports with words, or keep their place.
- admin-triage.verdict (dropped `required`): only a permanent act makes an operator type (admin r1). Ask two buttons vs a verdict with a note if you want one, and what the record holds.
- admin-triage.closed (dropped `card`): the portal's data is a table (admin r1). Ask a line vs a line with a day's Undo.
- admin-triage.escalate: the preserve panel is a sheet sized to the damage (admin r1). Ask whether the report carries the door.
- admin-triage.phone (dropped `none`): the portal's bar is measured for a thumb (admin r1). Ask act vs all at 375.
- admin-triage.idiom: the inboxes share one shape (admin r1); the album folds its sort and filter behind one button (app-vocabulary r2). Ask the words and the statuses, not the furniture.
- admin-triage.notice: a host meets one silent gap already (guest-shape r1) and he refuses a gap a person has to notice themselves (guest-upload r1); every upload carries a name now (the identity reshape). Ask whether the portal tells anyone, with the two leans named.
- help-center.from-product: the guest's action block is ruled (guest-shape r2: a row on landing, a dock once it scrolls); a surface opens on the reason it was opened (app-pricing r1); a failure has a surface of its own at a run's end (guest-upload r1). Ask a standing Help row vs a link at the moment of trouble, with the failure sheet as that moment's home.
- help-center.hub: he took the short surface with the rest one click away (app-pricing r1) and the shortest front door (first-event r1). Ask doors vs doors-then-sheet.
- help-center.article: the tour is bespoke pictures, not real screens (app-door r2); teaching moved inside the act (first-event r1). Ask prose vs checklist vs the real screen beside each step, with that analogy weighed.
- help-center.feedback: the portal's home is numbers (admin r1). Ask beacon vs routed with the KPI page as the beacon's home.
- help-center.search: the portal builds on the help palette (admin r1). Ask local vs sitewide vs a visible trigger with the second tenant named.
- emails.shell: a repeated control becomes one component with props (app-vocabulary r1; his note leaves unification discretionary). Ask unified vs plain for mail.
- emails.code (dropped `button`): the code is the product's one door (app-door r1) and the product typesets a code to be read off an object (first-event r1). Ask digits alone vs digits with a button beneath.
- emails.moments (dropped `today`): a switch with nothing behind it is absent (app-shape r2), so the four dormant rows leave; the capture flow now confirms an email as an account (the identity reshape). Ask which moments should really send a mail now, the four as drawn or a set the new door implies.
- emails.guest: the address is taken on a promise to keep the album (guest-shape r1) and confirming makes the account (the identity reshape). Ask the album link once vs the link and one after the party, on the new door.
- Owns: `src/app/(dev)/design/sandbox/admin-triage/`, `src/app/(dev)/design/sandbox/help-center/`, `src/app/(dev)/design/sandbox/emails/`. Reads: `src/app/(dev)/design/sandbox/overtaken.ts`, `src/components/lab/exploration.ts`, `src/components/lab/board-spec.ts`, `src/app/(dev)/design/touchpoints.ts`, `docs/design/rulings.md`, `docs/STATUS.md`, `src/app/admin/reports/`, `content/help/`.
- Verify: the registry tests and `overtaken.test.ts` green (the seventeen entries deleted); `lab:smoke` whole; `lab:demo` on each of the three boards; the boards at 375 and 1440; the gate.
- His to overrule: every reshaped framing; the eight dropped options.

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
