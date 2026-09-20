---
track: overtaken
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "20cc9b5f"          # the launch-prep SHA the branch was cut from
board: none            # lab infrastructure: the overtaken mechanism and the judgment lines; no board of its own
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/(shell)/lab/_desk/
  - src/app/(dev)/design/(shell)/lab/[board]/
  - src/components/lab/
  - src/app/(dev)/design/sandbox/overtaken.ts
  - src/app/(dev)/design/sandbox/overtaken.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - scripts/lab-review.mjs
  - docs/reviews/README.md
  - docs/reviews/
  - docs/design/rulings.md
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/review/ledger.ts
  - src/app/(dev)/design/review/status.ts
---

# lp/overtaken

**Goal.** Will's fifth batch (2026-09-19, build `69a9a17`) answered the four boards at the head of the desk; this lane is one of ten
cut from it. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- The mechanism, per his contract: an ask that an earlier ruling reaches carries a badge in place at its step ("drawn
  before app-shape r1: share=sheet") and the lane's one line ("stands: <why this option may beat the ruling>" or
  "concedes: the ruling covers it"); it stays answerable, and an answer is recorded as the ruling that stands (an
  override, the normal `<ask>=<option>` clause); a trash button beside the options kills it, recorded through the same
  paste as a `stands` clause (`<ask>=stands "the earlier ruling stands"`, proposed verbatim in the Handoff), and a stood
  ask counts as answered everywhere the desk counts (`queue.ts`, the desk page, "Copy so far", `review-message`).
  The annotations live in ONE new typed, spec-free file the lane owns in the sandbox,
  `src/app/(dev)/design/sandbox/overtaken.ts` (`board.ask` → `{ by, since, line, outcome }`; `docs/reviews/` is never a
  lane's), read by the desk and the board page and merged with the ledgers; the boards' specs are never edited. The
  `stands` token is a reserved choice validated in the `?` branch of `validate()` and stored as `{ choice: "stands" }`,
  never `null`; the grammar change to `scripts/lab-review.mjs` and `docs/reviews/README.md` is PROPOSED verbatim in the
  Handoff and landed by the Orchestrator at the merge (as `lab-tides`' `call:` clause is). The desk shows a count per board.
- The judgment pass, one line per ask for the ~25 listed above, written by this lane from each option set read against
  the ruling and the drawings (it opens each board), never a redraw; the four answered outright treated like the rest.
  The line is exactly "stands: <why this option may beat the ruling>" or "concedes: <what the ruling covers>", nothing
  longer; a concession pre-selects the dock's new button so one key records that the ruling stands.
- The shape (the reviewer's improvement, taken): his "trash" is an ANSWER, so it is drawn as one: a third dashed button
  in the dock beside "Not clear to me", "The ruling stands", recorded as `<ask>=stands "the earlier ruling stands"`
  (never `kill`, which is the catalog verdict word and would read as killing the options). The badge speaks plain words
  with the date, not the clause: "Ruled since app-shape r1, 19 Sep: sharing is a sheet", and adds "'as today' here means
  before that ruling" wherever an option says "as today", since specs are never edited. When an answer OVERRIDES, the
  transcriber appends a `_window.json` note `on: "<the overtaking board>"` ("overridden by guest-shape.dialogs=drawer,
  <date>") so the lane that wired the earlier ruling reads it where it already reads window notes, and
  `_overtaken.json` gains `outcome: stood | overrode`. The desk's count says what it counts ("3 overtaken") and the
  ruling draft lists them under "answered by an earlier ruling", never silently as answered.
- Owns: `src/app/(dev)/design/(shell)/lab/_desk/`, `(shell)/lab/[board]/`, `src/components/lab/` (the step template's
  badge and the new dock button), `src/app/(dev)/design/sandbox/overtaken.ts` and its test (all but the last `lab-tides`'
  files: this lane is cut AFTER that merge and builds on its carried-calls row and sent marker). READS `scripts/lab-review.mjs`
  and `docs/reviews/README.md` (the grammar proposed, never edited).
  Reads: every affected board's spec and ledger, rulings.md, `touchpoints.ts`.
- Verify: `lab:smoke` whole, `lab:demo` on one affected board pressing a badged step and the trash, the review store's
  "Copy so far" carrying a `kill`, the transcript tool's dry run accepting it, the gate.

## The verdict map (every answer of the batch; this lane wires only its own board's)

**`voice` r1 (eight; the board RETIRES at its wiring, its voice written up from the wins):**
- `absence=named` + his rewrite: bible 20 is ruled PERMISSIVE (naming an absence a guest is wary of is allowed; the rule
  forbids defining Partyreel against something else, "we're not cloud storage, we're not vsco") AND the line changes
  everywhere: "No app, no account." becomes "No app required." because accounts may be required. The Orchestrator
  rewrites bible 20's `statement` and `why` in `rules/bible.ts` at the batch record (his words); the lane sweeps the 66 lines
  (every "no account" promise goes; "no app" stays as a benefit).
- `hero-sub=?` with his line: `SITE_SUBHEAD` becomes "Your guests took the best photos and videos at your event. Partyreel
  collects them with one easy link. No more chasing group chats the next day." (verbatim). `SITE_DESCRIPTION` (thesis +
  subhead) would reach ~200 characters: the lane gives the meta description its own line under 160 and says so.
- `feature-h1=today`: nothing moves; his "I do not like three-line headings on desktop" becomes a measurement on the
  alias of all six feature h1s at 1440 (`PageHero` `lg` = `text-title`, 80 px in `max-w-3xl`, likely two to three lines)
  and a proposal in the Handoff for any that wrap to three (shorter h1 copy, never the load-bearing width).
- `pro-line=video` with his line: "For videos and unlimited events." at `plan-cards.tsx:316`, single-sourced beside the
  other ruled lines in `marketing-voice.ts`; the four sibling one-liners (`pricing-teaser.tsx:37`, `faq-data.ts:47`,
  `how-much-fits.tsx:154`, `llms.ts:133,233`) aligned to the same order (videos first, unlimited events); two or three
  "slightly more engaging" phrasings offered in the Handoff for his overrule on the alias.
- `host-empty=album`: "Your first album starts here" in `events-empty-teaser.tsx:41-43`; its body line loses "No app, no
  account"; the CTA stays "Create your first event" into the wizard.
- `gate=ask` with his adjustment: the body of `enter-event-prompt.tsx:56-59` becomes "For safety, the host has requested
  you confirm your email. One tap and you're in." (verbatim; the eyebrow, the title and the password path unchanged). His
  "big one" (skip confirmation for a badge) is the `guest-verify` exploration below, not this lane.
- `empty=starts`: "The album starts with you" in `gallery-empty-state.tsx:69-76`; the CTA "Be the first to add a photo" stays.
- `moment=today`: `guest-upload.tsx:77` unchanged. His "redesign our toasts" is the `toasts` exploration below.
- The finding to write up (the lane, in `marketing-voice.ts`'s head comment and `docs/systems/`): the two deliberately
  identical questions (`host-empty`, `empty`) got one voice, the album noun and "starts".

**`body-type` r1 (seven; six wire now, `buttons` goes to round two on the same board):**
- `reading=16` (every guest-facing sentence; the 26 `text-[15px]` go), `working=14` (the app's body; the admin "can break
  away" toward density, so the admin's own sizes are mapped where equal and otherwise left for the `admin` board),
  `marketing=fluid` (16 at a phone to 18 at a desk, a clamp like the heading steps), `caption=10` read with his note as
  TWO bottom steps: the caption step stays 12 (the labels he named) and a `micro` step at 10 is the FLOOR (the event
  cards' metadata chips, count pips; nothing under 10 outside depicted type), `label=12-08` (every uppercase label,
  marketing and app, at 12 px on 0.08em; the Eyebrow atom and the 75 `tracking-[0.14em]` literals move; he may drop to 11
  later), `leading=length` (2 x size - 8: 10/12, 12/16, 14/20, 16/24, 18/28; the marketing clamp's leading a clamp too).
- `buttons=ladder` "not a direct selection, more work required": round two on `buttons` alone (below); the wiring lane
  leaves Button's sizes as today (the `sm` literal stays until the rung is ruled).
- The write-up: the steps as tokens with leading and tracking companions in `theme.css` beside the heading steps,
  `TYPE_STEPS` and `cn()` knowing them, the policy test extended from headings to body sizes (stock classes that equal a
  step are on the ladder; px literals and off-step stock sizes fail; depicted type and the named exceptions exempt), the
  Library's foundations page, `design-system.md`'s type section refined in place.

**`glass` r1 (seven; the recipe goes to round two FIRST, the wiring follows it in one lane):**
- `recipe=frost` with "worth a second round ... so we can nail our glass from the start", `reel=white` with "may be worth
  exploring making this the standard - I don't want to have separate glass treatments and would prefer to find a global
  that works everywhere": round two asks the ONE material (Frost, Crystal, White-on-Frost) on every glass surface at once.
- `grades=one`, `behind=album` (the album blurred at half brightness behind the lightbox), `row=bar` (one pane holding the
  host's three controls), `paper=dark` (dark glass over media whatever the theme): rulings that wire with the material.
- `tiles=?` with his rule: on a mobile image card nothing but an active like mark, a video play mark and a subtle like
  count (state, never a control); every action (like, download, select, hide) lives in the lightbox's controls, select
  handling multi-item. A standing ruling for `media-viewer`, `app-vocabulary`, `guest-shape` and `host-curation` (the
  carried call below), wired by the glass lane on the tiles it owns and by `media-viewer`'s wiring in the lightbox.

**`app-shape` r1 (eight; two wiring lanes now, round two on the home across host states; the board stays):**
- `home=pulse`: `/dashboard` becomes the front page ("what needs you, then what just arrived": the waiting queues and the
  storage line first, the photographs of the last hour, then your events); the five-chip inbox (`dashboard-feed.tsx`,
  `filter-chips.tsx`) goes. His "worth more dashboard explorations ... across all host states" is round two (below).
- `density=cover` + "let's do both": the events list keeps the cover cards AND gains a row/table view behind a toggle
  aligned right opposite "Your events" (sorting and filtering in the table); the choice persists per host; the board's
  `lands` says every list of events in the app (the bin, saved events, the hosts you follow) shares the shape.
- `event=hub` + his three additions: a row of cards (Review, Reel, Guests, Settings LAST; the board's "Album" card becomes
  Settings), the gallery BELOW the cards by default in most-recent order, a clickable QR code horizontally centred to the
  left of the title + metadata stack that opens the share mini-modal.
- `nav=crumbs`: a trail in the bar (Partyreel / the event / the room), the cards row going sticky as the album scrolls
  ("could pick up sticky-style from the cards"), and a creative way to keep Share reachable from the sticky row.
- `share=room` overridden by his `settings` note: sharing gets ONE comprehensive surface as a SHEET (the code, the link,
  the posters, the invite, the custom link claim, anything future), reached from the event's menu and from the mini-modal;
  the QR at the left of the title opens a view-transition-style mini-modal (a bigger scannable code, view/copy the link,
  a door to the sheet); a third, subtler event link with a copy button sits under the metadata line.
- `settings=sheet`: the settings page of cards becomes a sheet over the album (the album stays behind it); the photo bin
  joins the album as a filter; "Deleted" names one thing.
- `you=?` with his answer: a person's own photos, likes and connections live on the PROFILE page (an owner mode of
  `/u/[slug]`), where the avatar and profile settings can also be changed; plans, billing and profile management live on
  the ACCOUNT page (billing gets its first door: a Plan card); the avatar may be changed in both places. The user menu
  gets the two doors. The personal feeds leave the home.
- `phone=same`: one shape at both sizes, the crumb header narrowed, the cards row scrolling sideways with a conditional
  gradient at either edge, sticky after the page scrolls past the cards.

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

- none: every call the goal left open was taken on its recommendation and is listed in the Handoff.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none: the mechanism's facts live in `sandbox/overtaken.ts`'s head comment and `step.tsx`'s, which are this
  lane's own files. The grammar's one home is `docs/reviews/README.md`, and the paragraph for it is PROPOSED
  below rather than written, as `lab-tides`' `call:` clause was.

## Deferred (ROADMAP one-liners, bucket named)

- The lab and the kit: `.lab-dock`'s one-row grid at 1280 and up gives the note column its 14rem floor whenever a
  board's option row is long, so the note field ran to 26 px with two dashed answers beside it; the row now wraps,
  and the column patch is in the Handoff.
- The lab and the kit: `sandbox/overtaken.ts` carries no `@contract-for:` marker because the collector would then
  demand a `for` line in `rules/component-notes.ts`, which is not a lane's; the line is in the Handoff.

## Handoff (replaces the chat report)

- Head `03f99905`, pushed; synced with `launch-prep` at `e9e3d25e` (the `call:` grammar's merge), merge `1828bf79`, zero conflicts.
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` 0 (137 components, 86 indexed, 920
  contracts, 18 policies) · specimens 0 (131 specimens on 94 entries) · `pnpm typecheck` 0 · `pnpm lint` 0 (8 known
  warnings) · `pnpm test` 0 (256 files, 2,741 passed, 1 skipped) · `pnpm build` 0 (255 pages). `pnpm lab:smoke
  --base http://localhost:3136` 0 (435 checks, 0 failing; no board over its reading budget, because the badge rides
  the step and not the board page). `pnpm lab:demo --board first-event --base http://localhost:3136` 0 (8 steps, 0
  failing, the four badged ones among them; tallest `style` at 1.7 screens, wordiest `hand` at 417 words).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =

      docs/design/library.md                                          <- exception
      src/app/(dev)/design/rules/rules.generated.json                 <- exception
      src/app/(dev)/design/sandbox/overtaken.ts
      src/app/(dev)/design/sandbox/overtaken.test.ts
      src/app/(dev)/design/(shell)/lab/_desk/queue.ts
      src/app/(dev)/design/(shell)/lab/_desk/queue.test.ts
      src/app/(dev)/design/(shell)/lab/_desk/session-step.ts
      src/app/(dev)/design/(shell)/lab/_desk/review-store.ts
      src/app/(dev)/design/(shell)/lab/_desk/copy-so-far.test.ts
      src/app/(dev)/design/(shell)/lab/_desk/staging.test.ts
      src/app/(dev)/design/(shell)/lab/page.tsx
      src/components/lab/step.tsx
      src/components/lab/step.test.tsx

  The two exceptions and why: both are `pnpm design:rules` output, which the gate mandates. The step's contract
  test grew eight guards (36 to 44), which moves a count in `library.md` and a block in the artifact; and the
  `call:` grammar's merge shifted ten lines in `registry.test.ts` without regenerating the artifact, which
  `rules-registry.test.ts` fails on. No contract, policy, `for` line or `touchpoints.ts` line changed. Nothing
  else outside `owns` was touched: `scripts/lab-review.mjs` was copied to the scratchpad, patched and tested
  there, and the copy restored with `git checkout --` (the tree is clean).

### The judgment lines: 29 asks, 13 boards, 23 stand and 6 concede

  app-vocabulary 5 · first-event 4 · admin 3 · app-door 3 · guest-upload 2 · host-curation 2 · media-viewer 2 ·
  profile-page 2 · reel-studio 2 · app-pricing 1 · export-flow 1 · guest-shape 1 · seed-avatar 1.

  The six that concede are the four his notes answered outright (`app-pricing.doors`, `guest-shape.dialogs`,
  `host-curation.peek`, `export-flow.object`) plus `first-event.style` (the share sheet is where the designer
  lands) and `reel-studio.door` (the hub's Reel card is the door, and it is none of the three drawn). Every other
  option set still holds something the ruling does not settle, and the line says what. `overtaken.test.ts` joins
  all 29 keys to a real ask on a standing board in its current round, so a reworded or retired question fails the
  gate rather than leaving a badge that lies.

### The proposed grammar, verbatim (this lane never edits `scripts/lab-review.mjs`)

  Modelled on the `call:` clause landed at `e9e3d25e`, but smaller in kind: `stands` is not a new clause, it is a
  reserved VALUE in the ask clause, so nothing downstream learns a third state. Built against the merged file,
  applied to a scratchpad copy and PROVEN there: the 46 tests in `_desk/lab-review.test.ts` pass against it; a
  `stands` clause on a mapped ask transcribes; on an unmapped ask it is refused by name with the list; without its
  note it is refused; an override transcribes AND echoes into `_window.json` at the overtaking board; standing by
  the ruling echoes nothing; every older form is untouched. Apply with `patch -p0 scripts/lab-review.mjs < it`.

```diff
@@ -12,6 +12,7 @@
  *
  *   review <board> r<n>: <ask>=<option> "a note"; item:<id>=keep|refine|kill "a note"; call:<id>=yes|no "a note"; note: "a board note"
  *   review <board> r<n>: <ask>=? "what was unclear"     (not answered: the question needs rewording)
+ *   review <board> r<n>: <ask>=stands "the earlier ruling stands"   (an overtaken question, left to its ruling)
  *   review library: <entry-id>=keep|redesign|retire "a note"
  *
  * `?` is the reviewer's own answer, "this question is not clear to me" (Will's
@@ -71,9 +72,23 @@
 
 /** The two ladders, mirrored from board-spec.ts's ITEM_VERDICTS / LIBRARY_VERDICTS. */
 const ITEM_VERDICTS = ["keep", "refine", "kill"];
+/**
+ * THE RESERVED ANSWER (Will, 2026-09-19): a question a later ruling reached,
+ * left to that ruling. "I'd still like to see the explorations that were
+ * voided by my decisions ... add an optional trash button to kill the question
+ * in the board if no answer"; what that press actually says is that the
+ * earlier ruling holds, so it is recorded as the answer it is rather than as a
+ * deletion. Mirrored from sandbox/overtaken.ts, which is the desk's side of
+ * the mechanism, and read off that file below so the word is only ever
+ * accepted on a question the map actually names.
+ */
+const STANDS = "stands";
+const OVERTAKEN = ["src", "app", "(dev)", "design", "sandbox", "overtaken.ts"];
 const LIBRARY_VERDICTS = ["keep", "redesign", "retire"];
 /** The Library's line carries no round; the ledger stores one ruling per entry. */
 export const LIBRARY_LEDGER = "_library";
+/** The round's own notes, where an override on an overtaken question is echoed. */
+export const WINDOW_LEDGER = "_window";
 
 /** A refusal the reader can act on: what was wrong, and where in the paste. */
 export class ReviewError extends Error {
@@ -407,6 +422,48 @@
     ? candidateIdsIn(masked, source, top.get("candidates"))
     : null;
   return { id, round, asks, catalog, items, calls };
+}
+
+/**
+ * THE ASKS A LATER RULING REACHED, by board, each naming the board that
+ * reached it (Will, 2026-09-19).
+ *
+ * `sandbox/overtaken.ts` is a flat map keyed "<board>.<ask>" whose entries
+ * carry a `by`, so the ids come out by the same regex reading the rest of this
+ * script uses on a spec: the script never imports TypeScript, and both are
+ * quoted literals. A missing file is not an error, it is a round in which
+ * nothing was overtaken, and `stands` is then refused everywhere, which is
+ * correct.
+ */
+function readOvertaken(root) {
+  const file = join(root, ...OVERTAKEN);
+  const out = new Map();
+  if (!existsSync(file)) return out;
+  const src = readFileSync(file, "utf8");
+  const body = /OVERTAKEN[^=]*=\s*\{([\s\S]*)\n\};/.exec(src);
+  if (!body) return out;
+  const entry =
+    /^\s*"([a-z0-9-]+)\.([a-z0-9-]+)":\s*\{([\s\S]*?)^\s*\},$/gm;
+  for (const m of body[1].matchAll(entry)) {
+    const by =
+      /\bby:\s*"([a-z0-9-]+)"/.exec(m[3])?.[1] ??
+      /\.\.\.([A-Z_]+)/.exec(m[3])?.[1] ??
+      null;
+    const asks = out.get(m[1]) ?? new Map();
+    asks.set(m[2], by);
+    out.set(m[1], asks);
+  }
+  // A shorthand spread (`...APP_SHAPE`) names a const rather than a board, so
+  // resolve it to the board id that const declares.
+  const consts = new Map(
+    [...src.matchAll(/const\s+([A-Z_]+)\s*=\s*\{\s*by:\s*"([a-z0-9-]+)"/g)].map(
+      (m) => [m[1], m[2]],
+    ),
+  );
+  for (const asks of out.values())
+    for (const [ask, by] of asks)
+      if (by && consts.has(by)) asks.set(ask, consts.get(by));
+  return out;
 }
 
 /** Every standing board's spec, by id. An unreadable spec is a loud failure. */
@@ -421,10 +478,13 @@
   } catch {
     throw new ReviewError(`no sandbox directory at ${dir}`);
   }
+  const overtaken = readOvertaken(root);
   for (const id of boards.sort()) {
     const file = join(dir, id, "spec.ts");
     if (!existsSync(file)) continue;
-    out.set(id, readSpec(id, readFileSync(file, "utf8")));
+    const spec = readSpec(id, readFileSync(file, "utf8"));
+    spec.overtaken = overtaken.get(id) ?? new Map();
+    out.set(id, spec);
   }
   return out;
 }
@@ -950,6 +1010,26 @@
             `${e.board}.${a.ask}=? needs a note saying what was unclear`,
           );
         }
+      } else if (a.choice === STANDS) {
+        // ★ THE RESERVED WORD IS CHECKED BEFORE THE OPTIONS, so a board that
+        // ever names an option "stands" cannot shadow the answer that leaves a
+        // question to the ruling that reached it. It owes its reason for the
+        // same reason "?" does: a ledger row nobody can read back has to be
+        // reconstructed from memory.
+        const reached = spec.overtaken ?? new Map();
+        if (!reached.has(a.ask)) {
+          at(
+            e.line,
+            a.choiceAt,
+            `${e.board}.${a.ask} is not a question an earlier ruling reached, so nothing can stand over it (sandbox/overtaken.ts names ${list([...reached.keys()])})`,
+          );
+        } else if (!a.note || !a.note.trim()) {
+          at(
+            e.line,
+            a.choiceAt,
+            `${e.board}.${a.ask}=stands needs a note saying which ruling stands`,
+          );
+        }
       } else if (!ask.options.includes(a.choice)) {
         at(
           e.line,
@@ -1137,6 +1217,9 @@
   const seen = new Map();
   const changed = new Map();
   const summary = [];
+  // The map, and the overrides this message records against it (below).
+  const reached = readOvertaken(root);
+  const overrides = [];
   for (const e of entries) {
     if (e.kind === "library") {
       const ledger = seen.get(LIBRARY_LEDGER) ?? readLibraryLedger(root);
@@ -1219,6 +1302,8 @@
       }
       // "?" lands as a null choice: the ask stays open on the desk, flagged as
       // waiting on a clearer question, with the reviewer's words beside it.
+      // ★ `stands` LANDS AS ITSELF, never null: it is a decision, and the desk
+      // counts it as one (sandbox/overtaken.ts, `outcomeOf`).
       const entry = { ask: a.ask, choice: a.choice === "?" ? null : a.choice };
       if (a.note) entry.note = a.note;
       entry.by = by;
@@ -1232,6 +1317,17 @@
         a.choice,
         was < 0 ? "new" : "replaced",
       ]);
+      // ★ AN ANSWER TO AN OVERTAKEN QUESTION IS THE NEW RULING (Will,
+      // 2026-09-19), and the lane that wired the earlier one has to hear about
+      // it. It hears where it already reads: a window note aimed at the board
+      // whose ruling was overridden.
+      const over = reached.get(e.board)?.get(a.ask);
+      if (over && a.choice !== STANDS && a.choice !== "?") {
+        overrides.push({
+          on: over,
+          text: `overridden by ${e.board}.${a.ask}=${a.choice}, ${at.slice(0, 10)}`,
+        });
+      }
     }
     // One verdict per item per round: ruling again in the same round
     // overwrites, exactly as answering an ask again does.
@@ -1296,7 +1392,53 @@
       summary.push([`${e.board} r${e.round}`, "note", n.text, "added"]);
     }
   }
+  echoOverrides(root, overrides, { by, at, seen, changed, summary });
   return { ledgers: changed, summary };
+}
+
+/**
+ * EVERY OVERRIDE, ECHOED INTO THE WINDOW (Will, 2026-09-19).
+ *
+ * ★ WHY A WINDOW NOTE AND NOT A NEW FILE. When he answers a question a later
+ * ruling had already reached, the answer IS the new ruling, and the lane that
+ * wired the earlier one is usually already open. A window note aimed at the
+ * overtaken board lands where that lane already looks (the desk prints them on
+ * the board's row, and `windowNotesFor` hands them to the board page), so the
+ * mechanism needs no second place to look and no ledger of its own.
+ *
+ * ★ AND IT IS IDEMPOTENT, like every other note this script writes: the same
+ * sentence twice would read as two separate overrides. Nothing is appended to
+ * the window unless something genuinely new was recorded, so a stale re-send
+ * still writes no file at all.
+ */
+function echoOverrides(root, overrides, { by, at, seen, changed, summary }) {
+  if (overrides.length === 0) return;
+  const ledger = seen.get(WINDOW_LEDGER) ?? readLedger(root, WINDOW_LEDGER);
+  seen.set(WINDOW_LEDGER, ledger);
+  if (!Array.isArray(ledger.rounds)) ledger.rounds = [];
+  let round = ledger.rounds.reduce(
+    (a, b) => (a === null || Number(b.n) > Number(a.n) ? b : a),
+    null,
+  );
+  if (!round) {
+    round = { n: 1, opened: at.slice(0, 10), answers: [], notes: [] };
+    ledger.rounds.push(round);
+  }
+  if (!Array.isArray(round.notes)) round.notes = [];
+  let wrote = false;
+  for (const o of overrides) {
+    const held = round.notes.some(
+      (n) => n.on === o.on && flat(n.text) === flat(o.text),
+    );
+    if (held) {
+      summary.push([`${WINDOW_LEDGER} r${round.n}`, o.on, o.text, "unchanged"]);
+      continue;
+    }
+    round.notes.push({ on: o.on, text: o.text, by, at });
+    summary.push([`${WINDOW_LEDGER} r${round.n}`, o.on, o.text, "added"]);
+    wrote = true;
+  }
+  if (wrote) changed.set(WINDOW_LEDGER, ledger);
 }
 
 export function writeLedgers(root, ledgers) {
@@ -1345,6 +1487,7 @@
   review <board> r<n>: <ask>=? "what was unclear"      (not answered; needs the note)
   review <board> r<n>: item:<id>=keep|refine|kill "a note"   (one catalog card)
   review <board> r<n>: call:<id>=yes|no "a note"   (a call the lane carried)
+  review <board> r<n>: <ask>=stands "the earlier ruling stands"   (an overtaken question)
   review library: <entry-id>=keep|redesign|retire "a note"   (a Library entry)
 
   A line that merely repeats what the ledger already holds is a no-op
```

  And `docs/reviews/README.md`, one paragraph directly after the `call:` one:

```markdown
`<ask>=stands "a note"` -- a question an EARLIER RULING REACHED, left to that ruling (Will, 2026-09-19: "I'd still
like to see the explorations that were voided by my decisions ... add an optional trash button to kill the question
in the board if no answer"). `stands` is a reserved word, not an option: it may only be given on an ask that
`src/app/(dev)/design/sandbox/overtaken.ts` names, it owes a note exactly as `?` does, and it lands as
`{ choice: "stands" }` rather than `null`, so the desk counts it as answered:

    review first-event r1: hand=stands "the earlier ruling stands"

Answering such a question with one of its real options is an OVERRIDE, and IS the new ruling; the transcriber then
appends a note to `_window.json` aimed at the board whose ruling was overridden ("overridden by
first-event.hand=show, 2026-09-20"), so the lane wiring that ruling reads it where it already reads window notes.
```

  And, if the Orchestrator wants the map's contract published, `rules/component-notes.ts` (this lane deliberately
  left the `@contract-for:` marker off, because an indexed file owes a `for` line in a file no lane owns):

```ts
  "src/app/(dev)/design/sandbox/overtaken.ts": {
    for: "The questions a later ruling reached: which ruling, when, in plain words, and the lane's one line about whether the options may still beat it. The desk badges from it; the ledger says what became of each.",
  },
```

### Calls his to overrule on the alias, one line each

- The reached-ask list was the Orchestrator's, relayed mid-lane; the lane wrote the 29 lines and took every
  judgment itself. `app-door.surfaces` says so in its own line: it is a name collision with the `you` question
  (auth surfaces, not the profile split), so the badge is there and the line says the ruling passes it by.
- `outcome` is DERIVED from the ledger (`outcomeOf`), not a field beside the note: the ledger is the one home of
  what was answered, and a stored copy would drift the first time he changed his mind.
- The note carries a `ruling` field the brief's four did not name, because a badge in plain words cannot be derived
  from an ask id; `by` stayed the board id, which is what the window echo's `on:` needs.
- The "as today" gloss is one line on the badge, detected from the options rather than listed, since a board's spec
  is never edited by another lane. It fires on 19 of the 29.
- No `_overtaken.json`: `docs/reviews/` is never a lane's. The typed file is the one home and the override echo
  rides `_window.json`, which the desk and the board page already read.
- The badge rides the WALK only, not the board's section view: his words ("in place in the board's walk, badged"),
  and a block above the sections on ten boards would spend their `lab:smoke` reading budget.
- `s` is the key, beside `?`, and only on a badged step. The seeded note is "the earlier ruling stands",
  overwritable; the button is primed where the lane conceded, so agreeing costs one press.
- `DESIGN_PREVIEW_KEY` reached this transcript once, in a URL composed for the browser pane. Will's standing ruling
  is that it does not matter and is not rotated; saying so rather than leaving it unsaid.

### The help articles this lane makes stale

- none: no production byte moved, and nothing a help article describes changed.

### Assets requested from Will

- none.

### Proposed migrations / Worker / Vercel / Stripe / env changes

- none.

### Look at first

- `/design/lab/first-event?session=first-event.hand` at 1440 and 375: the badge under the question ("Ruled since
  app-shape r1, 19 Sep: sharing is a sheet, with a QR mini-modal for a bigger scannable code", the lane's line, the
  "as today" gloss, and the line saying it is still his to answer), then the dock's third dashed button. Press it
  and the desk counts it answered; press it again and it clears.
- Then `/design/lab`: "29 of 29 overtaken, still open" beside the answered figure, "overtaken" on 29 queue rows
  with the badge in the title, and "N overtaken by an earlier ruling" on thirteen board cards.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-20). Will's ruling that a later decision must never delete an idea
drawn earlier became a mechanism: `sandbox/overtaken.ts`, one typed spec-free map keyed `<board>.<ask>`, naming the
ruling that reached each question, when, in plain words, and the lane's one line; the step badges it in place in
the board's walk, glosses every option still saying "as today", and offers a third dashed answer, "The ruling
stands", recorded as `<ask>=stands` and counted everywhere the desk counts. The outcome is derived from the ledger,
never stored. 29 lines across thirteen boards, 23 standing and 6 conceding, each written from the board's own
option set; the boards' specs were never touched. The `stands` grammar and the `_window.json` override echo were
proposed verbatim, proven on a scratchpad copy of the transcriber against its own 46 tests, and landed by the
Orchestrator at the merge. Found on the way: the dock's one-row grid starved the note field to 26 px beside two
dashed answers, so the note row wraps.
