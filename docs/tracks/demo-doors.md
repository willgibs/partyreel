---
track: demo-doors
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "68276391"          # the launch-prep SHA the branch was cut from
board: demo-event      # round two on the same board id: the door
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/demo-event/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/demo-event.json
  - docs/design/rulings.md
  - src/components/marketing/chrome/marketing-footer.tsx
  - src/components/marketing/system/demo-ticket.tsx
  - src/components/marketing/sections/home/live-demo.tsx
  - src/components/shared/album-stream/
---

# lp/demo-doors

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- His note on `doors=pile` (2026-09-20): "I'd be curious to see better designs of this. Looks like we're just reusing
  what's in the footer. However, labeling the QR (option 2) doesn't look very polished in the otherwise text-free
  visuals." The pile is wired as the rule by `demo-wiring` (one object skinned per place; the nav's ticket gone).
- A `defineExploration` round two on the SAME board id `demo-event` (`round.n: 2`), ONE decision `door` with four
  options, each the ONE object drawn in its three places (the home, a feature page, the footer) at 375 and 1440, all
  text-free but the demo's name: `pile` as wired; `frame` one photograph in a frame with the live code in its corner;
  `stage` the album's own falling engine (the shipped variant) as the door, the code over it; `ticket` the retired nav
  ticket redrawn as a single object for every place. The recommended option named; a cost line each (the engine costs
  a frame budget on the home; a photograph needs the fixtures the site holds). Round one's six ruled asks named as
  ruled, the row's `variants` set to one.
- Owns `src/app/(dev)/design/sandbox/demo-event/` and the board's own lines under the registration exception. Reads
  the wired demo door pieces (`marketing-footer.tsx`, `demo-ticket.tsx`, `live-demo.tsx`), `album-stream/`, the
  demo-event ledger, rulings.md; never edits them. `lab:smoke` whole; `lab:demo --board demo-event`; the gate.
- ALSO (from `demo-wiring`'s Handoff, 2026-09-20): the Features nav mega-panel's featured pane is EMPTY since the
  ticket retired (the panel's own no-card fallback); it is the object's fourth place: every option says what, if
  anything, stands there (the same object at a fourth size, or nothing and the pane stays a clean column), drawn.

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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head `8d958180`, pushed; synced with launch-prep at `8d958180` (origin/launch-prep had moved 17 commits: type-sync, guest-verify and buttons-pairs landed; none touched `sandbox/demo-event/`, so the merge carried no conflicts)
- Gates on the synced tree: design:rules ok, specimens ok (140 specimens on 101 entries), typecheck ok, lint ok (8 known), test ok (3053, 1 skipped), build ok (255 pages); `pnpm lab:smoke` ok (442 checks, 0 failing); `pnpm lab:demo --board demo-event` ok (1 step, 0 failing: `demo-event.door`, 4 options, the stage moves by up to 20.10%, proving the board gives the gate its one new step to press)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/design/library.md`, `src/app/(dev)/design/touchpoints.ts` (both the registration exception: the regenerated artifact and this board's own RULINGS row) + every file under `src/app/(dev)/design/sandbox/demo-event/` (three round-one files deleted: `arrival.tsx`, `page-parts.tsx`, `scan.tsx`, which served only the six now-ruled asks this round drops)
- The items, one line each:
  - `door`: four options built, text-free, drawn at all four places (the home hero, the footer, a feature page's line, the nav panel's pane) at 375 and 1440 — `pile` (the footer's real fan, proposed at the hero and the line where today is bare/words-only), `frame` (one photograph in a mat, the code in its corner; **recommended**), `stage` (the falling engine's own rest frame, sketched rather than the live rAF loop; nothing drawn in the nav pane), `ticket` (a redrawn die-cut stub, no label). None wired: a lab round two, his verdict decides what lands in the Library.
- Calls his to overrule on the alias, one line each:
  - "Text-free but the demo's name" was read as: the object itself never carries added words in any option (killing round one's `named` idiom for good); the page's own surrounding copy (the footer's heading, the line's CTA sentence) is untouched furniture, not part of what is judged. If he meant the party's own name may print ON the object instead, that is a different, smaller ask on the winning shape.
  - `stage` draws the falling engine's own REST FRAME (the same photographs, overlap and tilt a settled stack leaves) rather than mounting the real `AlbumStream` loop, at every place including the home hero: the real engine's geometry is anchored to the hero's own measured height (cards hang off the layer's foot, hundreds of px up) and does not have a smaller version: a nav pane or a line's edge is a different composition, not a scaled one. The cost line in its `means` says what picking it for real would spend.
  - The nav pane's fourth place draws something for `pile`, `frame` and `ticket` but nothing for `stage` (the clean column, its own honest option): a call made per option rather than uniformly, on the reasoning that a frozen thumbnail of a "falling" idea shows none of what makes it worth picking, so spending nothing there reads truer than a static stand-in.
  - Research finding, not a build choice: `doors=pile`'s ruling reads as "one object skinned per place", but `demo-wiring`'s own diff touched only `mega-panel.tsx` and `demo-ticket.tsx`. The footer's fan (`FooterDemo`) predates this round entirely; the home hero's plate (`cinema-hero.tsx`'s `DemoQr`) is still bare on its own real photograph corridor, and a feature page's line (`DemoCtaLink`) is still words and a chevron with no image at all. So `pile` in this round's pictures is itself a proposal at the hero and the line, which the board's own captions say plainly rather than silently drawing today as if it already matched the ruling's language.
- The help articles this lane makes stale: none (a lab-only round; nothing shipped changed).
- Assets requested from Will: none (every option is built from the twelve marketing stills already in the manifest).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: the board's one step (`/design/lab/demo-event`) at 1440, cycling `Which place` under each of the four `door` options; the nav pane specifically (the fourth place, new since round one) contrasting `stage`'s clean column against the other three's new card.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Round two on `demo-event`'s doors: round one's other six decisions (arrival, framing, try, next, phone, event) confirmed ruled and wired whole by `demo-wiring`, so this round dropped them and asked the one Will flagged on `doors=pile` ("I'd be curious to see better designs of this... labeling the QR doesn't look very polished in the otherwise text-free visuals"): one decision, `door`, four text-free options (`pile` as wired, `frame`, `stage`, `ticket`; `frame` recommended) drawn at all four places including the nav panel's pane the retired ticket left empty, at 375 and 1440. Found in the research: only the footer ever really built an object before this round; the hero and a feature page's line are proposals in every option here, not today. Gate green on the synced tree (3053 tests, 255 pages, `lab:smoke` 442, `lab:demo` 1 step).
