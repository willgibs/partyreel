---
track: reshape-admin-help-emails
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- none: the brief carried a line per question and every call it left open was taken and is listed under "his to overrule" below.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none: lab work on three board folders, no production byte and no `docs/systems/` fact inside the lane.

## Deferred (ROADMAP one-liners, bucket named)

- none: the one piece of debt this lane could have left behind (`overtaken.test.ts`'s fixed floor and named glossed keys) is resolved in the merge below by adopting `reshape-viewer-curation`'s fix wholesale, so the audit's fourth lane inherits nothing fragile.

## Handoff (replaces the chat report)

- BOARD commit `718a47fa` (the three boards, the seventeen badges, the test's floor); the head is the merge above it,
  `6b21ecfc`. Synced: `origin/launch-prep` had moved (to `7f1017fb`: `reshape-studio-export`'s merge, then the identity
  reshape's wave-0 and wave-1 cut), merged clean apart from one real conflict in `overtaken.test.ts`'s "as today"
  floor assertion (both `reshape-studio-export` and this lane had touched the same line; resolved below).
- Every claim below (a retirement, a migration, a gate, a fix) names its artifact (a commit hash, a log line, a file path), so
  the Orchestrator checks rather than believes; a claim with no artifact is read as unverified.
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` 0 (215 components, 1650 contracts, 18
  policies) · specimen collector 0 (140 specimens on 101 entries) · `pnpm typecheck` 0 · `pnpm lint` 0 (13 known
  warnings: the 10 baseline, `DOOR_2` orphaned by `help-center.article`'s badge leaving in this lane's own commit,
  `DOOR` and `APP_SHAPE_2` orphaned by `reshape-studio-export`'s merged-in deletions; none in a file this lane wrote
  new logic in) · `pnpm test` 0 (318 files, 3,307 passed, 1 pre-existing skip) · `pnpm build` 0 (255 static pages) ·
  `pnpm lab:smoke --base http://localhost:3138` 0 (417 checks, 0 failing; admin-triage 632 words, help-center 415,
  emails 547, budget 1200) · `pnpm lab:demo --board admin-triage` 0 (8 steps, 0 failing) · `--board help-center` 0 (7
  steps, 0 failing) · `--board emails` 0 (8 steps, 0 failing); every step draws its options on all three (`lab:demo`'s
  own pixel-diff, reduced motion honoured). Spot-checked by hand in the browser pane too, on the structurally
  changed asks specifically: `admin-triage.look` both options at 1440, `admin-triage.reason` both options at 1440,
  `admin-triage.phone` at its forced 375, `emails.moments` option 3 (the new `identity` roster row) at its default
  375.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `admin-triage/{board.tsx,report.tsx,spec.ts}`,
  `emails/{board.tsx,code.tsx,moments.tsx,spec.ts}`, `help-center/spec.ts` (all under `owns`), plus three exceptions:
  `sandbox/overtaken.ts` (the seventeen badge entries deleted, one comment block per board naming why, nothing else
  in the file touched), `sandbox/overtaken.test.ts` (the `admin-triage` count assertion, 8 to 0, the only board
  here a pre-existing assertion named; the "as today" gloss floor, adopted verbatim from
  `reshape-viewer-curation`'s same-day, not-yet-merged fix on the identical line rather than reinvented, so the two
  lanes' hunks read alike), `design/rules/rules.generated.json` (regenerated by the gate's own `pnpm design:rules`
  step; only the two touched test files' line numbers moved).
- The one real merge conflict, and how it resolved: `overtaken.test.ts`'s "as today" floor line was touched by both
  `reshape-studio-export` (already merged: `glossed.length * 2 >= KEYS.length`, two named keys kept) and this lane
  (adopted from `reshape-viewer-curation`'s unmerged branch: the same proportion behind an `if (KEYS.length >= 10)`
  guard, the two named keys dropped because one of them, `media-viewer.opening`, is one of `reshape-viewer-curation`'s
  own badges and will not survive its merge). Resolved in favour of the guarded version: a strict superset of
  `reshape-studio-export`'s fix, and the one the audit's fourth lane will not need to touch a third time.
- The items, one line each. **admin-triage** (8 asks, all badged) · `look`: the ruled row (admin r1) vs the
  full-width frame; `card` dropped. · `reason`: narrowed to the ranking half; `same` and `quiet` both dropped, a new
  `chrono` option ("keeps its place") recommended over `last`. · `verdict`: two buttons vs an optional note;
  `required` dropped, the destructive sheet already reserving typing for the permanent act. · `closed`: a line vs a
  line with a day's Undo; `card` dropped. · `escalate`: reworded on the now-ruled preserve panel, option set
  unchanged, `door` still recommended. · `phone`: act vs the whole act at 375; `none` dropped, the shell itself now
  ruled to reach 375. · `idiom`: reworded onto the words/status axis, option set unchanged, `shape` still
  recommended. · `notice`: reworded, option set unchanged, recommendation MOVED from `silence` to `host` (guest-shape
  r1's precedent plus guest-upload r1's case against an unnoticed gap). **help-center** (5 of 7 badged) ·
  `from-product`, `hub`, `feedback`, `search`: reworded, no option dropped, each ruling now a concrete surface
  rather than a hope for one. · `article`: reworded to weigh the app-door r2 tour analogy directly, no option
  dropped. `who-first` and `dead-end` carried no badge, untouched. **emails** (4 of 8 badged) · `code`: digits vs
  digits-with-button; `button` dropped, app-door r1 making the code everybody's door. · `moments`: `today` dropped
  (a dead switch is ruled absent); a new option, `identity`, the moment the identity reshape's capture flow implies,
  now the board's OWN recommendation over `shipped`. · `shell`, `guest`: reworded, no option dropped. `brand`,
  `sender`, `foot`, `dark` carried no badge, untouched. None of the seventeen is a Library entry: every board stays
  unanswered in the lab.
- Calls his to overrule on the alias, one line each:
  - `admin-triage.notice`'s recommendation, silence to host: both reached rulings argue against a second silent
    gap, but the doctrine's whole point (a hold must never read differently from an ordinary removal) is a reason
    to keep it silent that neither ruling touches; if that risk outweighs a host's ignorance, this should revert.
  - `admin-triage.idiom` and `escalate` keep three options each rather than trim toward the "eight dropped options"
    the brief's backtick count names: none of their remaining options is incoherent under a ruling the way the
    eight actually-dropped ones are, so "reshape, don't remove" reads as keeping the field open and rewording the
    framing instead.
  - `emails.moments` recommends the new `identity` option over `shipped`: it is the moment the identity reshape
    most clearly justifies today, but its exact shape depends on `guest-capture`'s own board, which has not run
    yet; `shipped` is the shovel-ready fallback if he'd rather not wait on it.
  - `admin-triage.reason`'s new `chrono` option is a genuinely new concept, not a reworded survivor: the brief's
    "or keep its place" had nothing left to reuse once `same` and `quiet` both left, so this lane wrote one.
  - The merge conflict resolution above (favouring `reshape-viewer-curation`'s unmerged fix over
    `reshape-studio-export`'s already-merged one): a judgment call between two valid same-day fixes, made because
    this lane could see the unmerged branch and knew the simpler one would need a second fix later.
- The help articles this lane makes stale: none (no shipped surface changed; this is lab work only).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `/design/lab/admin-triage?session=admin-triage.notice` (the recommendation flip, silence to host)
  and `?session=admin-triage.reason` (the new `chrono` concept, both options drawn), then
  `/design/lab/emails?session=emails.moments` on option 3 (the new `identity` roster row, tied to today's identity
  reshape).

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-21). The overtaken audit's admin-help-emails lane reshaped all
seventeen badged questions across `admin-triage`, `help-center` and `emails`, removing none: every ruling a badge
named folded into its question's own context. `admin-triage.reason` narrowed to the ranking half with a new
`chrono` option ("keeps its place"); `admin-triage.notice` moved silence to telling the host; `emails.moments`
gained a new option, `identity` (the identity reshape's own implied moment), now its recommendation. Eight options
were dropped where a ruling made them incoherent (`look.card`, `reason.same`/`quiet`, `verdict.required`,
`closed.card`, `phone.none`, `code.button`, `moments.today`); the rest kept their options and reworded only the
question. The seventeen entries left `overtaken.ts` otherwise intact; the merge past `reshape-studio-export`
resolved the one real conflict (the glossed floor) for `reshape-viewer-curation`'s unmerged, more defensive fix.
