---
track: controls-home-wiring
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c75734b9"          # the launch-prep SHA the branch was cut from
board: app-vocabulary  # wired by this lane; the board retires unless his verdicts keep it open
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-feed/event-gallery.tsx
  - src/components/shared/tile-size-control.tsx
  - src/components/shared/view-menu.tsx
  - src/lib/shared/use-tile-size.ts
  - src/lib/shared/tile-size-cookie.ts
  - src/app/(dev)/design/sandbox/app-vocabulary/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/ui/dropdown-menu.tsx
  - src/components/app/dashboard/events-section.tsx
  - src/components/app/event-feed/event-cards-row.tsx
  - src/components/ui/floating-layer.ts
  - docs/reviews/app-vocabulary.json
  - docs/design/rulings.md
---

# lp/controls-home-wiring

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- THE REVIEW SHEET FIRST: his verdicts beside the option pictures, `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b97eafa6-025b-4736-847b-48f80c42ec24/scratchpad/review-sheets/fe056e62.html` (open it in a browser; your board's section); the plan's words for this lane are in `/Users/gibby/.claude/plans/let-s-put-a-pause-gentle-widget.md`.
- Owns: `src/components/app/event-feed/event-gallery.tsx`, `src/components/shared/tile-size-control.tsx` (unmounted,
  kept: the lab imports it), `src/lib/shared/use-tile-size.ts`, `src/lib/shared/tile-size-cookie.ts`, the NEW
  `src/components/shared/view-menu.tsx` and its `// @contract-for:` test, `src/app/(dev)/design/sandbox/app-vocabulary/`
  and the board's registration lines under the retirement exception, `docs/systems/host-app.md`'s gallery lines,
  `rules/component-notes.ts`'s `for` line for `ViewMenu` (inserted beside its neighbours; `pnpm design:rules`).
  Reads: `ui/dropdown-menu.tsx`, `events-section.tsx` (the radio-group precedent), `event-cards-row.tsx`, the
  app-vocabulary ledger, rulings.md, the review sheet.
- `ViewMenu` props: `groups` (each a radio group with a label, options and the current value; the host passes tile
  size, sort, filter; the guest passes tile size and Yours), `trigger` label "View", `floating-layer.ts` read for its
  surface. The tile-size cookie persists as today; the sort and filter live in the URL or component state (the lane's
  call, said in the Handoff); the Deleted toggle becomes the Filter group's lens (the bin loads only when chosen, as
  today). Tests: the contract (the groups render as radio groups with accessible names; a change calls the group's
  handler; the menu closes on choose), `event-hub.test.tsx` green, `lab:smoke` whole, the gate. Red-team: the hub
  gallery is Will's (signed in); signed out nothing of this lane shows.
- Two honesty lines: "Add photos" is the hub's own door, not a gallery control, and stays where the board's
  `controls-home.tsx` drew it (the lane reads that file first; "Download and Select the only two verbs" counts the
  gallery's controls); Sort is a real client sort only if the gallery holds the whole approved list in the client,
  else it stays a reserved entry INSIDE the menu (said in the Handoff), never a sort of one page.
- His to overrule: Sort's two orders; the Deleted lens inside Filter; the trigger's word "View".

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

- `docs/systems/host-app.md`, "## The event page", the "**The album**" bullet: rewritten in place for the View
  menu (`app-vocabulary` r2, `controls-home=view-menu`) in place of the r1 tile-size cluster; names `ViewMenu`,
  its three groups, the honesty reason Sort ships disabled, and that `TileSizeControl` is retired from
  production and kept for the lab. No heading touched.

## Deferred (ROADMAP one-liners, bucket named)

- Launch checkpoint / later polish: Sort (newest/oldest) ships disabled in the View menu because
  `event-gallery.tsx` holds its album as an opaque RSC-presigned slot, never the approved list — wiring a
  real sort needs the gallery to hold (or the server to accept) an order, which is bigger than this lane;
  same root cause blocks a Photos/Videos option inside Filter (`app-vocabulary` r2's own `lands` line: "the
  shape a future view control... joins", already built for it — a future lane only adds a group).

## Handoff (replaces the chat report)

- Board commit `89911d49`, pushed; synced with launch-prep via merge commit `fb80e5b0`, pushed (`origin/
  launch-prep` moved by two `[skip ci]` orchestrator/journal commits, `usher/journal/2026-09-20.md` and
  `usher/kit/spawn-prompt.txt`, neither touching this lane's `owns` or `reads`; merged clean, no conflicts).
- Every claim below names its artifact so the Orchestrator checks rather than believes.
- Gates on the synced tree (`fb80e5b0`), each its own exit code: `pnpm design:rules` ok (825 contracts on 116
  components, 26 standing boards); the specimen collector ok (140 specimens on 101 entries, unchanged by this
  lane — `ViewMenu` is `unspecimened`, said below); `pnpm typecheck` ok; `pnpm lint` ok (8 known warnings, 0
  errors, none in this lane's files); `pnpm test` ok (291 files, 3061 passed, 1 pre-existing skip); `pnpm build`
  ok (255/255 static pages, exit 0); `pnpm lab:smoke --base http://localhost:3132` ok (438 checks, 0 failing;
  the one non-200 line, `/design/boom` at 500, is that tool's own deliberate crash). No `lab:demo` run: this is
  a production lane whose board retires whole (no round two left standing to demo) — the "Verify on" split in
  this lane's own brief calls that step for a lab lane, not this shape.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` (17 files) = this manifest (added next commit) +
  owned paths (`src/components/app/event-feed/event-gallery.tsx`; the NEW `src/components/shared/view-menu.tsx`
  + `view-menu.test.tsx`; `src/lib/shared/tile-size-cookie.ts`; `src/app/(dev)/design/sandbox/app-vocabulary/`,
  deleted whole) + exceptions:
  - `docs/systems/host-app.md` — named in this lane's own brief ("Owns: ... `docs/systems/host-app.md`'s
    gallery lines"), not in the frontmatter `owns` list; listed under System-doc edits above.
  - `src/app/(dev)/design/touchpoints.ts`, `src/app/(dev)/design/sandbox/registry.ts`,
    `src/app/(dev)/design/(shell)/lab/boards.ts` — the registration/retirement exception, this board's own
    lines only: `app-vocabulary` dropped from `SandboxId` and `DESK_ORDER` (kept in `RulingId` forever, its
    `RULINGS` row rewritten as shipped, its `board` field removed); the board's directory removal is
    `registry.ts`'s own documented rule ("its directory goes with it").
  - `src/app/(dev)/design/rules/component-notes.ts` — named in this lane's own brief ("`rules/component-
    notes.ts`'s `for` line for `ViewMenu`"); also refreshed `tile-size-control.tsx`'s existing entry (a file
    this lane owns) to say it is retired from production.
  - `src/app/(dev)/design/rules/rules.generated.json`, `docs/design/library.md` — mechanical output of
    `pnpm design:rules` after the two edits above; never hand-edited.
  - `src/app/(dev)/design/sandbox/gallery-fixtures.ts` (NEW) and
    `src/app/(dev)/design/sandbox/host-curation/fixtures.ts` (one import line + one clarifying sentence in its
    own docblock) — deleting `app-vocabulary/`'s directory (this board's own retirement) broke
    `host-curation`'s fixtures, which reused its four media pools verbatim; lifted the pools into a new,
    board-less file directly under `sandbox/` (never registered: `registry.test.ts`'s own scan only requires
    registration for a directory holding a `spec.ts`, and this one holds none) and repointed host-curation's
    one import at it, since leaving its import broken would have failed `pnpm typecheck` on this lane's own
    change. No other file references the retired board's `board.tsx` / `controls-home.tsx` / `scene.tsx`
    (checked: `grep -rn "app-vocabulary/(fixtures|scene|board|controls-home)"` across `src`, one hit, fixed).
- The items, one line each: `controls-home: view-menu` wired as `src/components/shared/view-menu.tsx`, one
  shared radio-group dropdown (`ui/dropdown-menu.tsx`'s `DropdownMenuGroup` + `DropdownMenuRadioGroup`,
  `events-section.tsx`'s own precedent) behind a single "View" button holding Tile size (three steps, real),
  Sort (two orders, reserved/disabled) and Filter (All / Deleted, real); Download and Select stay the row's
  other two verbs, Add photos stays the hub's own door. Lands in the Library as `ViewMenu`
  (`src/components/shared/view-menu.tsx`, `for` line in `component-notes.ts`); `TileSizeControl` is superseded
  in production and kept, unmounted, for its three lab importers.
- Calls his to overrule (from this lane's own brief, built as the brief's recommendation; none reached a
  genuinely new one-way-door decision, so nothing is in Questions):
  - Sort's two orders: labelled "Newest first" / "Oldest first", but shipped fully DISABLED (every option,
    not just the wording) with a "Coming soon" hint, because `event-gallery.tsx` receives its album as an
    opaque, server-rendered `children` slot — never the approved media array — so there is no client-held
    list to honestly reorder. This is the brief's own contingency ("it stays a reserved entry INSIDE the
    menu... never a sort of one page"), executed once confirmed true; his to overrule if he would rather see
    Sort disappear entirely than sit inert, or wants the gallery re-architected to hold its list client-side.
  - The Deleted lens inside Filter: built as one of Filter's two options ("All", "Deleted"), replacing the
    standalone toggle; the bin still loads only on demand and caches, unchanged.
  - The trigger's word "View": used literally, with a `SlidersHorizontal` icon (the lab exploration's own
    choice).
  - One beyond the three named: Filter offers only All / Deleted, never a Photos/Videos split, for the
    identical client-list reason Sort is disabled — the ruling's own words made that split conditional ("if
    the list carries the kind"), and it does not, honestly, on this component today. Recorded under Deferred.
- The help articles this lane makes stale: `content/help/your-event-page-explained.mdx` line 33 ("a control
  for tile size, Select for batch actions, and a Deleted toggle...") still describes the r1 row; a `help-sync`
  lane rewrites it to name the View menu.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: the hub gallery's View menu itself, signed in (`willg97`, an event with photographs) — this
  lane could not reach it locally or on the alias (sign-in is an allow-list-gated flow no agent can drive
  locally, and `docs/STATUS.md`'s own closing-sitting row already names "the hub gallery's View menu" among
  the signed-in surfaces no lane can reach, Will's on the alias); the automated cover is the new
  `view-menu.test.tsx` contract (opens on pointerdown, three groups by accessible name, a pick calls the right
  group's own handler, a disabled group never fires and says "Coming soon", the menu closes on a real choice)
  plus `event-hub.test.tsx` unchanged and green. Also worth his eye: whether "Coming soon" is the right word
  for Sort, and whether an inert-but-visible Sort row is preferable to no row at all.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). `app-vocabulary` retired: its round two
(`controls-home=view-menu`, "Tile size, Sort and Filter move behind one button; Download and Select stay the
row's only two verbs") wired as one shared `ViewMenu` (`src/components/shared/view-menu.tsx`, arbitrary radio
`groups`, so the guest album can mount the same object later) replacing the r1 tile-size cluster on the host
gallery's header; the Deleted lens folded into Filter, Sort shipped honestly disabled (the gallery holds no
client-side list to reorder), `TileSizeControl` retired from production and kept for the lab. Retiring the
board's sandbox directory broke `host-curation`'s reused fixtures; lifted them into a new board-less
`sandbox/gallery-fixtures.ts`. One help article now stale (`your-event-page-explained.mdx`). Gate green on the
synced tree; `lab:smoke` whole; no `lab:demo` (the board retires whole). Signed-in verification of the real
hub gallery is Will's on the alias.
