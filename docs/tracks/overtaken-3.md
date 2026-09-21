---
track: overtaken-3
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c75734b9"          # the launch-prep SHA the branch was cut from
board: none            # lab infrastructure: the judgment lines for the closing sitting's first batch; no board of its own
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/overtaken.ts
  - src/app/(dev)/design/sandbox/overtaken.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/reviews/
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/(shell)/lab/_desk/
  - src/components/lab/
---

# lp/overtaken-3

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- THE REVIEW SHEET FIRST: his verdicts beside the option pictures, `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b97eafa6-025b-4736-847b-48f80c42ec24/scratchpad/review-sheets/fe056e62.html` (open it in a browser; your board's section); the plan's words for this lane are in `/Users/gibby/.claude/plans/let-s-put-a-pause-gentle-widget.md`.
- The judgment pass for the fourteen verdicts (the list above is the starting point, not the lines): every reached
  ask opened on its board and read against the ruling and the drawings; one line each, "stands: ..." or
  "concedes: ...", the badge in plain words with the date 2026-09-20; an ask reached by one of `guest-verify`'s four
  HELD rulings carries a badge that names the hold and NO line ("held for guest-verify round two: gate=after"), so
  nothing concedes to a ruling he may relitigate. An ask already badged keeps its first entry and gains "also reached
  by ...". Owns `src/app/(dev)/design/sandbox/overtaken.ts` and `overtaken.test.ts` only. Reads the five specs and
  ledgers, rulings.md, `touchpoints.ts`, `node usher/kit/board-card.mjs --desk`. Verify: the test green (every key a
  standing board's ask; every line in the two words or the hold form), `lab:smoke` whole, `lab:demo` on one affected
  board pressing a badged step, the gate. Handoff: the counts per board, the tally, the held list.

## The verdict map (every answer of the batch; this lane wires only its own board's)

**`guest-shape` r1 (seven; five wire now, `chrome` goes to round two, `dialogs` follows the sheet ruling):**
- `door=today` (overrules `one`): the welcome, then the gate: two screens on a gated event stay. "To be clear, this is
  directly approving the welcome then gate, not this sheet design": the SEQUENCE is ruled, the shell is not; with
  `dialogs=stands` the shell is the one responsive Sheet the hub landed (a bottom sheet in a hand). At a desk a door is
  not a side panel: the Sheet gains a `desk` prop (`side` | `center`) so the door wears the same primitive centred.
- `nothing=river`: the river, at one depth, on both the locked page and the empty album (nine local stand-in frames,
  never the event's own; a locked page leaks exactly what it leaks today).
- `chrome=dock` with "warrants a second round": NOT wired now. Round two on `chrome` alone, drawn with Save already
  moved (his `account=after`) and the dock's two remaining actions (Add, Invite): where a guest's actions live so they
  are FOUND on landing ("one of the last places a guest's eye will reach") and REACHABLE deep in the album ("always
  accessible, no matter how deep"). The floating Add pill's fate rides this round.
- `live=land`: a new photograph grows into its column under a glow that fades, the album re-flows around it, nothing
  else moves. The tile's arrival state is the tile's (the glass lane's file); the guest's live gallery sets it.
- `yours=?` with his rule, verbatim: "A guest can delete any photo they've personally uploaded, ever." A product
  feature that does not exist today (the board's options were never / a window / a 'yours' strip): the viewer's Remove
  on a guest's own photographs, forever, under an account; on the same device session for an anonymous guest (the
  only identity there is). A SECURITY-DEFINER RPC that deletes only the caller's own media (the guest row or the
  account, never a client claim), the same purge path as a host delete, never restorable by the host (a person's
  withdrawal is theirs). His to confirm at approval: whether a guest's removal is final for the host too.
- `account=after` (overrules `one`): the account is asked once, at the door; keeping the album becomes a one-tap
  offer after a guest's first photograph lands, not a form above the album. Save leaves the chrome (round two draws
  the chrome without it).
- `dialogs=stands`: Invite, Save, Report and Download all wear the one responsive Sheet (the desk lane conceded it).

**`app-vocabulary` r1 (seven; four wire now, two stand, `gallery-controls` gets a narrow round two):**
- `empty-states=stands`: the earlier ruling (the pulse's designed empty state) decides; nothing new is wired.
- `loading=asneeded`: one shared skeleton primitive wired to exactly the routes with a real pre-paint wait (the
  dashboard, the event hub, the Studio); the dashboard's and the hub's `loading.tsx` become the one component, the
  Studio gains its first (the ROADMAP line closes).
- `tile-grammar=stands` + "If unifying components or keeping them distinct also helps, that's your call": the earlier
  ruling (glass's tiles rule) decides what a tile shows; the CALL is taken: ONE `MediaTile` for every album grid (guest,
  host, bin, profile feeds, selection) with the three marks as state, the desktop hover actions as a per-surface prop
  and select as a mode; the admin's moderation tile stays its own (a report, not an album). Owned by the glass lane,
  which rewrites every tile's marks anyway.
- `bulk-toolbar=icon` + his three notes: icons on both bars (ReviewActions and GalleryBulkBar become one `BulkBar`
  with an actions prop); tooltips open IMMEDIATELY on hover, never delayed; "every action on a photograph lives in the
  lightbox" was a MOBILE rule and the desk keeps hover controls on cards; and the side-by-side tooltip: moving across
  the bar's icons slides one tooltip panel between them (the transitions.dev "page side by side" shape), the delight of
  this lane, reduced motion a plain swap.
- `gallery-controls-home=cluster` + "Am I overriding anything with this answer, or does this work with the glass?":
  NO override, and the desk badge's reasoning was a slip: glass's `row=bar` ruled the host TILE's hover row (like,
  download, hide as one pane of the material); the cluster is the gallery's section header on paper, and wears no
  glass at all. Both hold, in different places. His crowding worry (download,
  tile size, sort, filter, select) is a narrow round two on this board: where the host gallery's five controls live (a
  View menu holding tile size, sort and filter beside the two verbs; the sticky pill row; a control sheet at 375).
- `gallery-controls-persistence=device`: localStorage, per browser, no profile column.
- `confirm-switch=primitive`: one `ConfirmSwitch` owns the glyph and the deferred-open dance; the two hand-rolled
  copies in the settings sheet's uploads section retire into it.

**`seed-avatar` r1 (seven; all wire now, with a bug fixed first and `look` re-asked in round two):**
- The BUG, before anything: "the avatar doesn't fully fill its container, and you can see horizontal edges within";
  "reveals the color underneath the photograph on the edges". Found and fixed in the production `Avatar` (the drawing
  the board reuses), with a contract test that the image covers the disc at 24, 32 and 40 with no gap.
- `look=diagonal` (overrules `orb`): two hues on a diagonal is the working version. His question ("is this the best
  that hashvatar had to offer? The preview ones ... felt much more alive and rich") is round two on `look` alone: three
  richer looks measured against the same three floors (hashvatar's own multi-stop gradient mode as it renders on its
  site, a two-throw mesh, the diagonal with a lit seam), drawn on the wired avatar.
- `the-crowd=full`, `palette=wheel`, `letter=always`: every guest full colour, all 360 degrees, the initial at every
  size in a fitted ink.
- `seed=account` + "ensure the account ID randomness leads to a variety across the color wheel": the account id is
  the seed; the generator's crowd test (a thousand ids fill every 30-degree bucket) becomes the contract on the
  production path, fed real id shapes (UUIDs), so a concentration is a red test.
- `after-upload=under`: the colour waits underneath and the photograph paints over it; `motion=none`: still, always.

**`admin` r1 (seven; all wire now):** the portal opens on the numbers (four figures, a fortnight's trend, the queue
beneath); a rail plus a command palette (the help palette's primitive if it is one); hybrid density (a table for data
on `ui/table.tsx`, a list beside the message for prose inboxes); a state's colour reaches the row (a failed run tints
its row with a leading edge: "Makes it a bit harder to miss"); every destructive act opens one sheet sized to the
damage (the responsive Sheet; only the permanent act makes you type); the health band under the bar on every page with
a chip in the bar, gone on a good day; a 44 px tool bar with a breadcrumb, a live tag, the health chip and an initial.
His three answers on badged asks (`home`, `density`, `chrome`) override app-shape's reach and are echoed there; the
desk lane had written "stands" on all three.

**`app-door` r1 (seven; all wire now, `welcome` re-asked in round two, `return` flagged):**
- `lead=code`: one email field; the same address signs in or creates the account; Google beside it; a password drops
  to a quiet link.
- `surfaces=one` + "any login components that feel similar could be unified into one object worn 4ways": one account
  object with the methods as props and one consent line, each wear passing the reason it asks (the /login page, the
  guest gate's step, the keep-the-album offer after upload, the create-account moment a like opens). The admin's
  second factor stays its own step after the object (a different purpose).
- `welcome=tour` (overrules `first`): the name, then the tour; event creation becomes the tour's closing primary CTA
  (skippable, as in the preview) so the wizard stays its own focused thing. "Could use a huge redesign to feel more
  alive" is round two on `welcome` alone: three tours drawn on the real screens.
- `page=beside`: /login with the product beside it (real photographs on the right half of a laptop, a band above the
  door in a hand).
- `existing=tell` + his note: the same single step, one line naming the address and saying we signed you into the
  account it already had; dismissible; with an action if it was a mistake ("Not you? Sign out" / "Use another email").
- `failure=paths`: the line, shorter, with the recoveries as real buttons under it; a visual redesign inside the lane.
- `return=tap` + "If this is a bad idea, please flag it": FLAGGED, in one sentence: a press that signs anyone in
  without a credential is never acceptable, and a passkey IS a credential, so the option is right exactly as far as
  passkeys reach. The lane wires it as: a passkey registered on the account page ("Sign in faster on this device"),
  offered once after a code sign-in; the /login door shows the one-press button when this device holds one, the Google
  one-press when a Google session is live, and `back`'s welcome-back line with one field otherwise. If Supabase Auth
  has no passkey factor on this tree (the doc check decides), the lane ships `back` and lists passkeys as the follow-up.

**`glass` r2 (two; the board retires at its wiring):** `material=crystal` (overrules the lane's Frost: 4 percent black,
the pane separating by its edges), `edge=double` (a 28 percent lip and a 10 percent hairline all round). The wiring
lane: the `--glass-*` token set and one `.glass` utility; the lightbox's backdrop (the album blurred at half
brightness); the tiles' three marks and the removed chips (with the rose mark carrying its own contrast: no material
saves it over a bright photograph); the host's row as one bar; dark glass on paper; the reel's controls in the one
material (round one's white on the reel is superseded by "one material everywhere", his own words); then `glass`
retires and the material lands in the Library.

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

- None needing an answer to proceed. Four calls were taken on the brief's recommendation and are listed in the
  Handoff under "his to overrule"; none is a one-way door, and every one of them is a line he can press through.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none (this lane owns no `docs/systems/` fact; the mechanism's own home is the head comment of `overtaken.ts`)

## Deferred (ROADMAP one-liners, bucket named)

- none. The one line this lane had proposed (de-pin the desk's proof of the overtaken join) was granted as an
  exception instead and is done in this lane, at `d69da9ba`; nothing is left for the ROADMAP to carry.

## Handoff (replaces the chat report)

*Second handoff. The first is in git at `2ec5dffa`; what changed is the granted exception on the desk's queue test,
the two badges it had kept out, and a sync past `guest-verify` round two and the button rung.*

- Board commits `1d8af324` (the judgment pass) and `d69da9ba` (the granted exception and the two badges);
  sync-merges `05498a8a` (the first, past `436ef3d3`) and `cc8cd50b` (the second). The manifest rides one plain
  commit after them.
- **`cc8cd50b` merged the LOCAL `launch-prep` (`224049d6`), not `origin/launch-prep`**: origin was still at
  `436ef3d3` at both fetches, and the tree the Orchestrator named (`d68ef23f` guest-verify round two, the record on
  top, and `224049d6` buttons-wiring on top of that) exists only on the shared local ref. It brought `body-type`'s
  retirement and the identity board's five new asks. Two generated files conflicted (`docs/design/library.md`,
  `rules.generated.json`); both were resolved by taking launch-prep's and re-running `pnpm design:rules`, so they
  are the generator's output on the merged tree and nothing was hand-merged.
- Re-read after the sync, as asked: `guest-verify`'s round-two spec (`address`, `allowance`, `unproven`,
  `collision`, `gate-switch`). No line in this map names a `guest-verify` ask, and none ever did. The hold's words
  are still exact: round two's `unproven` option `shown-marked` is his two held rulings drawn, so
  "held for guest-verify round two" is the board that will relitigate them.
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` 0 (182 components, 1305 contracts on 116,
  18 policies) · specimen collector 0 (140 specimens on 101 entries) · `pnpm typecheck` 0 · `pnpm lint` 0
  (8 problems, 0 errors, 8 warnings: the baseline) · `pnpm test` 0 (3080 passed, 1 skipped) · `pnpm build` 0
  (255/255 pages) · `pnpm lab:smoke --base http://localhost:3136` 0 (440 checks, 0 failing) ·
  `pnpm lab:demo --board first-event --base http://localhost:3136` 0 (8 steps, 0 failing, six of them badged,
  pressing BOTH new badges). Logs in the lane's scratch dir.
- Read by eye on :3136: `first-event.asks` at 1440 ("Ruled since app-vocabulary r2, 20 Sep: ...") and
  `first-event.first` at 375 ("held for guest-verify round two: gate=after"); earlier, the held badge on
  `seed-avatar.look` at both widths and the three-clause line on `media-viewer.holds`.
- Lane check, `git diff --name-only origin/launch-prep...HEAD`, owned paths plus four:
  ```
  src/app/(dev)/design/(shell)/lab/_desk/queue.test.ts
  src/app/(dev)/design/rules/rules.generated.json
  src/app/(dev)/design/sandbox/overtaken.test.ts
  src/app/(dev)/design/sandbox/overtaken.ts
  docs/design/library.md                (+ everything the sync merge carried)
  ```
  **The exceptions, and why.**
  1. `_desk/queue.test.ts` is the **granted exception**, in the Orchestrator's own words: "the queue test's
     first-event pin is yours to lift as a GRANTED exception, then add the two badges it kept out". It is one
     `describe` block: the count and the unreached ask are derived from `OVERTAKEN`, two guards refuse the
     degenerate cases, one assertion is added (the row badges exactly the map's keys for the board and no others),
     and every other assertion is untouched, including the `hand` badge and the ledger-derived standing test.
  2. `rules.generated.json` and `docs/design/library.md` are generated, and `pnpm design:rules` is a gate step;
     the owned contract test gained assertions and the exception's file gained one. Same precedent as `ca9bc121`.
     `library.md` shows in the range only because the sync merge carried launch-prep's own edits to it.
  3. Everything else in the range is the sync merge's, not this lane's.

### The items, one line each (29 asks reached; the map 62 keys to 72)

**New judgments (8).**
- `toasts.where`: stands; every guest album gains a fixed foot, so the bottom band is a strip a dock stands in.
- `toasts.stack`: stands; the dashboard's own pile shows three and folds the rest, which is neither drawn option.
- `host-curation.verb`: stands; a tile is ruled to carry a fourth mark, so the Hidden chip has its precedent.
- `reel-studio.styles`: stands; a sheet at a desk is a side panel, so the wall stops covering the reel.
- `export-flow.chips`: stands; the rule kills the chip that renders a zero, and two answers are left.
- `first-event.asks`: stands; he refuses a top level that shows everything at once, which is the case against
  three fields, and where the two that leave go is still open. *(Back, by the granted exception.)*
- `admin-triage.reason`: concedes; "absent, never empty" IS this ask's nothing-drawn option.
- `emails.moments`: concedes; a switch with nothing behind it is ruled absent, which is retiring the four.

**Held, the badge and no judgment (2).**
- `seed-avatar.look`: `held for guest-verify round two: badge=mark`; four backgrounds may not be weighed against a
  mark round two may withdraw.
- `first-event.first`: `held for guest-verify round two: gate=after`; the photograph is live before anything is
  confirmed. *(Back, by the granted exception.)*

**Lines gaining a clause, the earlier judgment untouched (19).**
- by `welcome=sheet` (no centred float survives at a desk): `app-pricing.object`, `first-event.hand`,
  `media-viewer.opening`, `profile-page.view-all`, `profile-page.quick-look`.
- by `chrome=both` (the row on landing, then a dock): `guest-upload.tap`, `guest-upload.words`,
  `help-center.from-product`.
- by `theirs=mark` (a fourth mark on a tile, its tap a filter): `guest-upload.landing`, `host-curation.told`,
  `export-flow.means`, `loose-ends.everywhere-pill`.
- by `empty=wizard` (absent, never empty): `first-event.empty`.
- by `first=pulse` (never a single event's prompt on the dashboard): `first-event.landing`, `host-curation.count`.
- by `busy=collapsed` (three, then one chip that expands in place): `host-curation.arrivals`.
- by `controls-home=view-menu` (a crowded top level folds behind one button): `media-viewer.holds`,
  `export-flow.object`, `admin-triage.idiom`.

### The counts

- Per ruling board: `body-type` r2 **0** · `app-shape` r2 **8** (empty 4, first 2, busy 2) · `guest-shape` r2 **15**
  (chrome 4, welcome 6, theirs 5) · `app-vocabulary` r2 **4** · `guest-verify` r1 **2 drawn** (six more reaches
  recorded below, not drawn).
- Per board reached: first-event 5 · host-curation 4 · guest-upload 3, export-flow 3 · toasts 2, media-viewer 2,
  admin-triage 2, profile-page 2 · seed-avatar 1, app-pricing 1, reel-studio 1, help-center 1, emails 1,
  loose-ends 1.
- Stands and concedes, on the new judgments only: **6 stands, 2 concedes**, 2 held. The whole map after this pass:
  **72 keys**, two of them held, across 14 boards; `first-event` reads 6.
- `body-type` r2 reaching nothing is a finding, not a miss: a rung that pairs an icon with its text is mechanical,
  it landed inside `buttons-wiring` (merged, the board retired in this lane's sync), and round one reached nothing
  either. No entry has ever credited that board.

### The held list (his four `guest-verify` rulings, reaching asks a standing ruling already badges)

Recorded here and NOT written into the map, because an appended clause rides inside a judgment and a held ruling
gets none. Round two can relitigate all four with nothing leaning on the walk.
- `badge=mark` reaches `media-viewer.who` (badged by seed-avatar r1), `profile-page.quick-look` and
  `profile-page.view-all` (both took a standing clause this pass). Drawn on `seed-avatar.look`.
- `host-lens=badge` reaches `host-curation.queue` (badged by app-vocabulary r1) and `host-curation.count`.
- `gate=after` reaches `guest-upload.held`, `guest-upload.warning`, `emails.code` and `emails.guest`, all badged.
  Drawn on `first-event.first`.
- `expiry=host` reaches `admin-triage.notice`, badged by guest-shape r1. It reached no unbadged ask at all.

### Asks added or dropped against the plan's list

- Added: none beyond the fourteen verdicts' own reach. The brief named them as "the starting point, not the lines",
  and every line here was written from a board's own option set read against the ruling.
- Dropped: **none any more.** The two the desk's pin had kept out (`first-event.asks`, `first-event.first`) are in,
  and the pin that kept them out is gone.

### Calls his to overrule on the alias, one line each

- The hold's grammar: a held badge carries the fact and no judgment, and `badgeText` says "Ruled and held since ..."
  so the walk cannot read one as law. The dock's "The ruling stands" is still pressable on it (that button lives in
  `step.tsx`, not this lane); pressing it is HIS lift of the hold, which is the only way a hold should ever lift.
- `export-flow.chips` judged **stands**, not concedes: the ruling kills the chip that can only ever render a zero,
  but a chip that is dimmed and says why is not a hollow band, so two answers survive it.
- `body-type` r2 badged nowhere (above), rather than reaching for the one button an open ask still draws.
- `media-viewer.holds` now carries two clauses from the same board (app-vocabulary r1 and r2). Accurate, and the
  first pass's judgment is untouched; a reader meets the narrowing and the fold in the order they happened.
- The sync took the local `launch-prep` because origin had not caught up (above). Worth the Orchestrator's eye
  before the merge, since it means this lane already holds `224049d6`.

### The rest

- Finding 1 of the first handoff (the desk's `first-event` pin): **resolved in this lane** by the granted
  exception, at `d69da9ba`. It had cost two judgment passes five badges; it costs none now, and the ROADMAP line
  this lane had proposed is withdrawn.
- Help articles this lane makes stale: none (no shipped surface changed).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `first-event.asks` and `first-event.first` on the lab at 1440, then `seed-avatar.look`.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-20). The desk's third judgment pass read every open ask on the
standing boards against the closing sitting's first batch (14 verdicts on five boards) and the drawings his verdicts
sat beside: 29 reached, the map from 62 keys to 72. Eight new judgments (6 stands, 2 concedes), nineteen lines
gaining a clause behind the one they had, and a third grammar for a ruling he may relitigate, which carries the hold
and no judgment at all (`seed-avatar.look` and `first-event.first`). `guest-shape` r2 did the most work: no centred
float survives at a desk, a guest album gains a fixed foot, and a tile gains a fourth mark, so glass's three-marks
rule has already moved. `body-type` r2 reached nothing, as its round one had. The desk's own queue test now derives
its `first-event` numbers from the map instead of restating them, so a judgment pass stops paying for the join it
proves.
