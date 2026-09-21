---
track: pricing-split-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "ece02b97"          # the launch-prep SHA the branch was cut from
board: pricing-page    # wired by this lane; the board retires unless his verdicts keep it open
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/sections/pricing/
  - src/app/(marketing)/(cinema)/pricing/page.tsx
  - src/app/(dev)/design/sandbox/pricing-page/
  - docs/systems/marketing-content.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/constants/tiers.ts
  - src/lib/constants/marketing-voice.ts
  - docs/reviews/pricing-page.json
  - docs/design/rulings.md
---

# lp/pricing-split-wiring

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- THE REVIEW SHEET FIRST: his verdicts beside the option pictures, `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b97eafa6-025b-4736-847b-48f80c42ec24/scratchpad/review-sheets/c75734b9-second.html` (open it in a browser; your board's section); the plan's words for this lane are in `/Users/gibby/.claude/plans/let-s-put-a-pause-gentle-widget.md` (the second batch); his notes verbatim in `docs/design/rulings.md` ("the closing sitting's second batch").
- `fit=split` with his note; `phone=stack` changes nothing at 375 (the stack ships today). The wall becomes the
  split: the slider and switches in a recessed panel on the left, one elevated photographed plan card on the right
  as the live result (the board's `Split` in `sandbox/pricing-page/fit.tsx` is the drawing), placed DIRECTLY BENEATH
  the plan pair and the Pass ticket; `UnlockGrid` ("Where Free ends and paid begins.") moves below it to open the
  dark chapter as its overview, then `ComparisonTable`, then the FAQ, then the band (the page's chapter comment
  rewritten with his words; his round-one line "tiles above Find your plan size" is superseded by this note, said in
  the record). The phone row stays the stack; the swipe row is banked for future gallery-type sections (a ROADMAP
  line). The board retires under the retirement exception (the dangling `docs/tracks/pricing-fit.md` reference in
  `fit.tsx` goes with it); `marketing-content.md`'s pricing lines refined. Owns: `src/components/marketing/sections/pricing/`,
  `src/app/(marketing)/(cinema)/pricing/page.tsx`, `src/app/(dev)/design/sandbox/pricing-page/`,
  `docs/systems/marketing-content.md` (owned here; `demo-frame-wiring`'s demo line is that lane's exception). Reads: `src/lib/constants/tiers.ts` (never edited), `marketing-voice.ts`,
  the ledger, rulings.md, the sheet. The split is built from the board's `Split` (`sandbox/pricing-page/fit.tsx`:
  the recessed panel with the storage slider on `STOP_GB`, the video switch and the once-or-again toggle; the
  elevated half with the recommended plan card, its price, the room bar, `StatRow`, the annual note and Buy) on the
  real `recommendPlan` (`recommend.ts`); `calculator.tsx` becomes it or a new `configurator.tsx` replaces it with
  `STOP_GB` still exported; `pricing-page.test.ts`'s chapter-order assertions (its lines 43 to 73) rewritten to the
  new order in the same commit; `PRICING_FAQ_ITEMS` keeps its export (`loose-ends`' board imports it). Tests: the
  FAQ count and the JSON-LD parity, the Pro card's slider against `tiers.ts` (`plan-cards-contract`), the chapter
  order, `marketing-h1-policy`, `content-policy`; the gate. Red-team on the
  alias signed out at 1440 and 375: the whole page, the configurator's live card, the chapter transitions. His to
  overrule: the result card's photograph; the recessed panel's depth.

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

- none. Every open call was taken on the brief's recommendation and is listed under "Calls his to overrule" below.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/marketing-content.md`, the `/pricing` bullet, rewritten in place: the paper chapter names the
  configurator as its close and the dark room loses the calculator from its run; his order and its reason recorded
  with the test that pins it; the configurator's two planes and why Pearl leaves no other way to draw them;
  `recommend.ts` named as the only thing that picks a plan; `phone=stack` said once; `shared-band.tsx` now "stays on
  disk, unimported" rather than "the lab's `pricing-page` board still draws it", which the retirement made false.

## Deferred (ROADMAP one-liners, bucket named)

- Marketing (Next): the swipe row is banked for future gallery-type sections, his words: "we could use swipe cards
  for mobile elsewhere in the marketing site, such as future gallery-type sections". The drawing is in git at the
  retired board's `sandbox/pricing-page/phone.tsx` (`ece02b97`), repaired and `lab:demo`-pressed.
- Marketing (Later): `src/lib/content/llms.ts` calls the block "a find-your-size calculator" in the /pricing line of
  `llms.txt`. Still true in substance, one word behind the file's new name; left alone because the file is outside
  this lane and nobody owns it this batch.

## Handoff (replaces the chat report)

- BOARD commit `d3d796b7` (the wiring and the retirement); `743edf42` (the doc and the two stale records) and
  `d73fbadb` (the live region) after it. SYNC-MERGE `ef893383` (the second; `b4789a3e` was the first).
  `origin/launch-prep` moved twice while the lane ran and both merges were clean, with no conflict on the
  retirement lines: `overtaken-4` added no `pricing-page.*` badge, so nothing of the board's was left in
  `overtaken.ts` to retire with it.
- Gates on the synced tree (`ef893383`), each on its own exit code: design:rules 0, specimens 0 (140 specimens on
  101 entries), typecheck 0, lint 0 (8 known warnings), test 0 (301 files, 3138 passed, 1 skipped), build 0 (255
  pages). `pnpm lab:smoke --base http://localhost:3134` 0 (420 checks, 0 failing; one board fewer than the 421 of
  the pre-merge run, which is the retirement showing up in the smoke's own count). No `lab:demo`: the board is gone.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/systems/marketing-content.md`,
  `src/app/(marketing)/(cinema)/pricing/page.tsx`, `src/components/marketing/sections/pricing/{calculator.tsx ->
  configurator.tsx, configurator-contract.test.tsx, plan-cards.tsx, pricing-page.test.ts}`,
  `src/app/(dev)/design/sandbox/pricing-page/*` (all six deleted) + this file. EXCEPTIONS, four, each with why:
  `src/app/(dev)/design/sandbox/registry.ts`, `src/app/(dev)/design/(shell)/lab/boards.ts` and
  `src/app/(dev)/design/touchpoints.ts` are the retirement exception (the import and the list entry in each, the
  `SandboxId` member and the `DESK_ORDER` entry, the row keeping `ruled` + `shipped` and losing its `board` block);
  `src/app/(dev)/design/rules/component-notes.ts` gains ONE `for` line at the head, because a file with a
  `@contract-for` test enters the component index and `gallery.test.ts` fails without it (the round's own ownership
  rule asks for it); `src/lib/type-ladder-policy.test.ts` LOSES one body exception, because its `calculator.tsx`
  entry named a timecode chip inside the album wall and both are gone (the list only ever shrinks, and the test
  fails on a reason for a file that has left). `docs/design/library.md` and
  `src/app/(dev)/design/rules/rules.generated.json` are the generator's, regenerated, never merged.
  One line NOT in the diff and worth his eye: `touchpoints.ts`'s 2026-08-27 `pricing-calculator` row still said
  "V1 Album fill" ships, which the Library renders as current truth; it now names its successor. It is not this
  board's row, so it is called out here rather than taken silently.
- The items, one line each:
  - `fit=split`: the album wall is gone and Find your size is one bordered panel of two planes. The recess
    (`bg-muted`) holds the storage slider on `STOP_GB`, the video switch and the once-or-again fork, each control on
    the page's own white; the elevated half is the frame and the column inside it is the card (the prints, the plan,
    the price, the reason, the expected-room bar, `StatRow`, the annual and runner-up lines, the plan's own door).
    Lands in the Library as `sections/pricing/configurator.tsx` with its `for` line and a five-clause contract.
  - `fit=split`, the chapter half of his note: the configurator CLOSES the paper chapter directly under the pair and
    the ticket, and `UnlockGrid` opens the dark one as its overview, then the matrix, then the questions. His
    round-one line about the tiles standing above Find your size is superseded, as his note says it would be. Both
    halves pinned in `pricing-page.test.ts` (its chapter assertions rewritten in the same commit).
  - `phone=stack`: nothing changed at 375. The pair's grid already collapses to one column and the ticket sits under
    it; the configurator's panel stacks the same way, the recess above the card with the hairline between them.
  - The delight, and the one thing `split` otherwise traded away: the result card's deck FANS as the slider climbs,
    one print at 1 GB and four at 2 TB, under a 300ms transform. That is the wall's "watch your album fill up" kept
    rather than lost, and it is the pair's own `PhotoStack` (now exported beside `StatRow`, three props all
    defaulting to what the pair has always drawn) rather than a second copy of the grammar. The price re-pops its
    digits through the shipped `PricePop`, keyed on the label.
  - The board retires in the house convention: the row keeps `ruled` and `shipped`, the `RulingId` member stays, the
    `SandboxId` member, the `DESK_ORDER` entry, the registry line, the lab map line and the directory go. The
    dangling `docs/tracks/pricing-fit.md` reference went with `fit.tsx`. `PRICING_FAQ_ITEMS` and `StatRow` keep
    their exports; `loose-ends`' board still imports the first and `pass-card.tsx` the second.
- Calls his to overrule on the alias, one line each:
  - THE RESULT CARD'S PHOTOGRAPH is the pair's stack of prints on its own deck of four (wedding-rings,
    reception-hall, party-dj, festival-lights: none of them the pair's or the ticket's), not a single framed
    picture. The reason to keep it: it makes the answer a member of the family and gives the slider something to
    move. The reason to overrule: at a glance a fourth stack of prints on the same page can read as a fourth plan.
  - THE RECESSED PANEL'S DEPTH is `bg-muted` (Pearl's 0.963 against the page's 0.995) with each control on the
    page's own white, and NOT a card fill or a shadow: on paper `--card` and `--background` are the same white, so
    `bg-muted` is the only real step the palette offers. If he wants the recess deeper it is a token change, not a
    structure change.
  - THE FIGURE'S SIZE: `text-prose` (24 at 375, 34 at 1440), a step under the section's own h2. The board drew
    `text-subsection` and the first wiring tried `text-section`, which came out exactly level with "Find your size."
  - THE PANEL'S WIDTH is `max-w-5xl`, wider than the wall's `max-w-3xl` (two halves need it) and narrower than the
    pair above.
  - THE SUBHEAD is new copy, because the board's ("Set the shape of your event on the left ... on the right") is
    false at 375 where the halves stack. It now reads "Set what your event will collect, and the plan that fits
    takes shape as you go."
  - THE LIVE REGION is the verdict alone, not the whole card: a polite region around the bar and the stat trio
    reads four numbers out on every step of a slider someone is dragging.
- The help articles this lane makes stale: none. The five help articles that mention plans and storage describe
  tiers and caps, never the /pricing page's furniture; `help-sync` (2026-09-20) had already taken them against the
  tree and nothing it wrote names the calculator or the page's chapter order.
- Assets requested from Will: none. Every photograph is an existing `MARKETING_IMAGES` id.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. The checkout doors' targets are untouched:
  `CheckoutButton` for anything paid, a `/login` link for Free, both carrying `trackAttrs` as the round's rule asks.
- Verified, and how. Local only: the alias is still capped, so the Orchestrator's is the alias pass. At 1440 and
  375, headless Chrome against `:3134` (captures in the lane's scratch, not the repo): the whole page top to
  bottom, the chapter order on screen (h1, pair, ticket, configurator, one cut, tiles, matrix, FAQ, band), the
  panel at both widths, and the card at three points of the ladder (1 print at 2 GB Free, 2 at 50 GB Event Pass, 4
  at 2 TB Pro 2 TB). Keyboard, driven with real CDP key events: five ArrowRight on the focused slider moved 50 GB
  to 500 GB, flipped Event Pass to Pro 500 GB and fanned the deck from two prints to three. Under
  `prefers-reduced-motion: reduce`, measured off computed styles: the prints, the room bar and the price digits all
  resolve to no motion. Server HTML carries the whole default state (50 GB, Event Pass, the stats, Buy a pass), so
  the block is never blank before hydration. Console on /pricing: zero exceptions and one Next DEV advisory about
  the Event Pass ticket's photograph and LCP, which is `pass-card.tsx`'s and pre-existing (nothing moved above it).
- Look at first: `/pricing` at 1440, the configurator directly under the Event Pass ticket. Drag the slider from
  end to end and watch three things at once: the prints laying one on another, the room bar, and the price popping
  its digits. Then the same block at 375, where the recess sits above the card.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-21). `pricing-page` r2 wired whole and the board retired: the album
wall became the split configurator, the controls recessed on `bg-muted` beside one photographed plan card on the
page's own white, its deck of prints fanning as the slider climbs so the wall's own delight survived the wall. The
other half of his verdict was the page: the configurator now closes the paper chapter directly under the pair and
the ticket, and the upgrade tiles open the dark one as its overview, then the matrix, then the questions, which he
said himself overrides his round-one line. `calculator.tsx` became `configurator.tsx`, `PhotoStack` joined `StatRow`
as an export of the pair, and the page's chapter assertions and a new five-clause contract hold both halves.
`phone=stack` changed nothing at 375; the swipe row is banked on the ROADMAP for future gallery-type sections.
