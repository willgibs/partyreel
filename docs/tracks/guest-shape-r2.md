---
track: guest-shape-r2
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "f7075a73"          # the launch-prep SHA the branch was cut from
board: guest-shape     # round two on the same board id: the chrome, the welcome, where a guest finds theirs
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/guest-shape/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/guest-shape.json
  - docs/reviews/demo-event.json
  - docs/design/rulings.md
  - src/components/guest/event-experience.tsx
  - src/components/guest/live-gallery.tsx
  - src/components/guest/entry-modal.tsx
  - src/components/guest/entry-shell.tsx
  - src/components/guest/guest-masonry.tsx
  - src/components/shared/floating-add-button.tsx
  - src/app/(dev)/design/sandbox/demo-event/
---

# lp/guest-shape-r2

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- His three asks by name on `guest-shape` r1 (2026-09-20): `chrome=dock` "This likely warrants a second round of
  exploration" (the dock is the best of three "but having the actions tucked in the bottom right is one of the last
  places a guest's eye will reach ... Having the actions above felt more actionable when landing ... also appreciate
  that the actions docked are always accessible, no matter how deep into the album you get"); `door=today` "not this
  sheet design" (the sequence is ruled, the shell and the welcome's design are not) with the demo's `arrival=role`
  note "This welcome screen could be redesigned"; and the plan's third ask, where a guest finds their own photographs
  now that Remove lives in the lightbox (the board's `mine` strip was that).
- A `defineExploration` round two on the SAME board id (`round.n: 2`; the ledger exists), THREE decisions drawn on
  the WIRED guest album (`guest-wiring` merged `7f4f2ffe`: Save gone from the row, Invite and Report on the sheet, the
  arrival rim; `glass-wiring` merged `a2a0d973`: the marks-only tiles), phone first at 375, 1440 the knob:
  `chrome` (where Add and Invite live so they are FOUND on landing and REACHABLE deep in the album: `column` the
  row as wired plus the floating Add pill on scroll (today); `dock` the two actions in one bar at the foot at every
  scroll position; `both` the row on landing and a dock that appears once the row scrolls away, the pill retired;
  `header` Add in the sticky header beside the event, Invite in the dock; the tile-size control's guest mount drawn
  in each), `welcome` (the door's shell and the welcome screen's design, drawn for a real gated event AND for the
  demo's role screen: `today` the drawer below 640 and the centred dialog above with today's copy; `page` the
  welcome is the page, the album beneath it, the gate a second step in place; `card` a compact card over the album's
  top with the album visible behind; `sheet` the responsive Sheet's look on the door's engine; every option keeps
  vaul's input handling on a phone, said on the frame), `theirs` (where a guest finds their own photographs in a
  thousand: `none` the lightbox's Remove is enough; `chip` a "Yours" filter chip in the album's control row; `strip`
  their own photographs as a strip above the album; `mark` their own tiles carry a subtle mark and a tap on it
  filters). The criterion is his: the most important action found first, and reachable always. Round one's seven
  ruled asks named as ruled in the RULINGS row's `ruled` (wired at `7f4f2ffe`), the row's `variants` set to three.
- Owns `src/app/(dev)/design/sandbox/guest-shape/` and the board's own lines in `registry.ts`, `boards.ts`,
  `touchpoints.ts` (the RULINGS row rewritten for round two) under the registration exception. Reads the wired guest
  files (`event-experience.tsx`, `live-gallery.tsx`, `entry-modal.tsx`, `entry-shell.tsx`, `guest-masonry.tsx`,
  `floating-add-button.tsx`), the demo's welcome, `sandbox/demo-event/`, the guest-shape and demo-event ledgers,
  rulings.md; never edits them. `lab:smoke` whole; `lab:demo --board guest-shape` pressing every step; the gate.

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

- none yet (the board's own three asks carry every open call; see "Calls his to overrule" below for the ones this lane took building it)

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet (a lab-only round; nothing wired, `docs/systems/guest-flow.md` untouched)

## Deferred (ROADMAP one-liners, bucket named)

- The lab and the kit: `ui/sheet.tsx` never gained the `desk="center"` prop rulings.md named for the door (still side-panel-only at a desk, `sm:right-0`); `welcome` measured the shipped posture honestly rather than an unbuilt one and picked `card` partly because of it. Worth a line if a later consumer wants a centred desk posture besides a side panel.

## Handoff (replaces the chat report)

- Board commit `e8b299b6`, pushed; synced with launch-prep twice as it moved under the lane (first at `1c8f7eca`, finally at `9e4b694d`, both stable merges with zero conflicts each time: `git diff --stat <merge-base> origin/launch-prep` touched nothing in `reads`, `owns` or the registration files either sync, only `docs/design/library.md`, regenerated fresh after both).
- Gates on the synced tree, each its own exit code: `pnpm design:rules` ok · specimens ok · `pnpm typecheck` ok · `pnpm lint` ok (8 known warnings, the baseline, none new) · `pnpm test` 3024 passed, 1 skipped, **1 known-failing, not this lane's to fix** (below) · `pnpm build` ok, 255 pages · `pnpm lab:smoke --base :3133` ok, 435 checks, 0 failing (`guest-shape` itself: 355 words against a 1200 budget) · `pnpm lab:demo --board guest-shape --base :3133` ok, 3 steps, 0 failing, every step draws its options.
- **The one test failure is cross-lane, outside `owns`, and left exactly as found**: `overtaken.test.ts` fails `guest-shape.dialogs: guest-shape declares no ask "dialogs" in round 2`, because `overtaken-2`'s own `sandbox/overtaken.ts` (cut from the same base commit, still an open lane at handoff, `lp/overtaken-2`) carries a badge naming round one's `dialogs` ask, which this round correctly drops with the rest of round one's seven (the `profile-page` precedent: a round replaces its questions rather than accreting them). Per the ownership rules, a second lane's edit in another lane's file rides the lane-check exception only after syncing past that file's OWNER's merge, and `overtaken-2` has not merged; this lane made no edit to `overtaken.ts`. Whichever of `guest-shape-r2` and `overtaken-2` integrates second will need the one-line reconciliation (drop or re-point the `guest-shape.dialogs` entry).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = every file under `owns` (including four round-one files this round deletes: `account.tsx`, `dialogs.tsx`, `door.tsx`, `yours.tsx`) + `touchpoints.ts` (the registration exception: the `guest-shape` RULINGS row rewritten for round two, `ruled`/`why`/`board.note`/`board.variants`) + `docs/design/library.md` (exception: `pnpm design:rules` regenerates it after any `touchpoints.ts` edit, per CLAUDE.md). Nothing else; `registry.ts` and `boards.ts` needed no line changes (the board id and component export are unchanged from round one).
- The items, one line each:
  - `chrome`: recommended `both` (the row on landing, a dock once it scrolls away); a kept one becomes the guest album's action-block pattern, replacing the shipped column + floating pill.
  - `welcome`: recommended `card` (a compact float, the album or its locked backdrop visible behind); a kept one becomes the door's shell on `entry-shell.tsx`, replacing the vaul-quoted drawer/dialog, and the demo's own arrival wears the same shell.
  - `theirs`: recommended `mark` (a subtle badge on a guest's own tiles, tap to filter); a kept one becomes a new prop on the shared grid (`shared/masonry.tsx`'s `renderOverlay`, already public) plus the "Yours" filter state, no new surface.
- Calls his to overrule, one line each (the brief's "take the recommended answer, list every call"):
  - `welcome`'s recommendation is `card`, not `sheet`, even though `sheet` reuses the primitive `dialogs=stands` just promoted to every other guest surface: the real `sheet` posture at a desk is a right-edge panel (`ui/sheet.tsx`'s own `sm:right-0`, no `desk` prop exists to centre it, see Deferred), which is the exact "a door is not a side panel" shape his note flagged, so recommending it back felt like recommending the same problem in new clothes. `sheet` is still drawn as it really is, not an invented centred version, so the choice is his to make on equal evidence.
  - `chrome`'s recommendation is `both`, not the plainer always-docked `dock`, reading his own words as praising two different traits (the row's first-look actionability, the dock's permanence) rather than one that subsumes the other; `dock` alone is the simpler object if he reads it differently.
  - `theirs`'s recommendation is `mark`, the option easiest to miss on a first glance (a badge, not a labelled control), because it is the only one that answers "which of the 68 is mine, wherever it falls" without a tap, for the cost of zero new chrome; `chip` is the safer, more legible alternative.
  - `theirs`'s big-album fixture (68 photographs, ten a guest's own) is invented for this board only (the shipped album has no size that makes the question real); the ten are spread by a fixed, arbitrary index list, not a searched order like the small album's.
- The help articles this lane makes stale: none (lab-only; nothing shipped changes what a help article describes).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `chrome`, `position=Scrolled deep into the album`, cycling all four options: it is the one frame where `column` (today) visibly loses Invite while `both`/`dock`/`header` all keep it, which is his own criterion made a picture rather than a sentence.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Round two of `guest-shape` answered the two he flagged by name and the
plan's third, all three on the wired album and the demo's own arrival: `chrome`, where Add and Invite live, `both`
recommended (his own two-part criterion read as two traits, not one subsuming the other); `welcome`, the door's shell,
`card` recommended over reusing the just-unified responsive Sheet, whose real desk posture is the side panel his note
flagged; `theirs`, where a guest finds their own photographs at scale, `mark` recommended, reusing the shared grid's
own `renderOverlay`. Round one's seven now-ruled asks and the four files that only answered them retired with it. One
test stays red on the integrated tree: `overtaken.test.ts`'s `guest-shape.dialogs` badge is `overtaken-2`'s file to
fix, not this lane's; resolved at whichever of the two integrates second.
