---
track: guest-view-menu
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "9faf4218"          # the launch-prep SHA the branch was cut from
board: none            # a production follow-up of guest-chrome-wiring (guest-shape retired at fd42c759); no board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/live-gallery.tsx
  - src/app/(guest)/e/[token]/page.tsx
  - src/app/(guest)/e/[token]/actions.ts
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/shared/view-menu.tsx
  - src/lib/shared/tile-size-cookie.ts
  - src/components/app/event-feed/event-gallery.tsx
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/components/shared/masonry.tsx
  - src/components/guest/guest-masonry.tsx
  - docs/design/rulings.md
---

# lp/guest-view-menu

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- What this is: `guest-chrome-wiring` (merged `fd42c759`) handed off before `controls-home-wiring`'s `ViewMenu` reached the tree, and its follow-up mount was lost with its worktree. This lane lands that one mount, and nothing else. His words behind it (guest-shape r2 `theirs=mark`, 2026-09-20): "We could likely combine this new filter with the tile size filter to create a new parent dropdown, rather than just adding more and more configs here. This would be more scalable as we progress."
- The mount, as the guest lane had built it: the shared `ViewMenu` (`src/components/shared/view-menu.tsx`, the host gallery's own object, its groups as props) in the guest album's control row in `live-gallery.tsx` beside Download all, with two groups: Tile size (the three steps from `src/lib/shared/tile-size-cookie.ts`, disabled below 640 with the hint "Wider screens", because `masonry.tsx` forces two columns there and the control would otherwise be dead) and Showing (Everyone's / Yours (n), present only when the guest owns something on this album); `--album-column` on a wrapper around `GuestMasonry`, exactly as `event-gallery.tsx` does for the host; the mark's own tap and the "Showing yours · Show all" line both kept (the menu's Yours and the mark's tap set the same filter).
- The cookie, HONESTLY: the guest page's server component reads `pr_tile_size` (`tile-size-cookie.ts`'s `resolveTileSize`, the host page's precedent) and passes the initial size down, and the write goes through a server action in the guest page's `actions.ts` (the host's `setTileSize` precedent), so the first paint is right and no client pre-measure frame exists. Never a client-only cookie read.
- Owns: `src/components/guest/live-gallery.tsx`, `src/app/(guest)/e/[token]/page.tsx`, `src/app/(guest)/e/[token]/actions.ts`, `docs/systems/guest-flow.md` (the control row's line). Reads, never edits: `src/components/shared/view-menu.tsx`, `src/lib/shared/tile-size-cookie.ts`, `src/components/app/event-feed/event-gallery.tsx`, `src/app/(app)/dashboard/[eventId]/page.tsx` (the host's cookie read), `src/components/shared/masonry.tsx`, `src/components/guest/guest-masonry.tsx`, `docs/design/rulings.md`.
- Tests: the existing guest gallery tests green; a test for the server read (the cookie's value reaches the album's wrapper; a missing cookie gives the default); `lab:smoke` whole; the gate. Red-team on the alias at 375 and 1440 signed out on the disposable event: the menu beside Download all, Tile size disabled at 375 with its hint, Yours present only with an own upload (a second tab uploads), the first paint at the chosen size after a reload.
- His to overrule: the group names ("Tile size", "Showing"); the hint's words; Yours hidden when nothing is yours.

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

- none: every open call the brief left (the group names, the hint's words, Yours hidden when nothing is
  owned) already carried a recommended answer to build; built as recommended, listed below under Handoff's
  "Calls his to overrule" rather than re-asked here.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/guest-flow.md`, the `theirs=mark` bullet: refined its closing sentence from the
  forward-looking "Yours joins tile size inside the View menu... when that lands on the guest row" to the
  landed fact (the View menu's two groups, the mount point, the 640 gate, the cookie round-trip through
  `initialTileSize` / `setTileSizeAction`), since `controls-home=view-menu` has now landed on this row.

## Deferred (ROADMAP one-liners, bucket named)

- none: no new one-way-door or product-shaping gap surfaced building the one mount the brief scoped.

## Handoff (replaces the chat report)

- Head `62555b56`, pushed; synced with launch-prep at `902935ed` (`lp/home-states-wiring`'s merge + its
  record commit; a clean merge, `docs/design/library.md`'s summary counts the only conflict, resolved by
  regenerating rather than hand-editing).
- Every claim below (a retirement, a migration, a gate, a fix) names its artifact (a commit hash, a log line, a file path), so
  the Orchestrator checks rather than believes; a claim with no artifact is read as unverified.
- Gates on the synced tree (commit `62555b56`): design:rules ok (188 components, 122 contracted), specimens
  ok (140 specimens), typecheck ok, lint ok (8 known warnings, 0 errors), test ok (3118 passed, 1 skipped,
  297 files, incl. this lane's 14 new in `live-gallery.test.tsx`), build ok (255 pages); `pnpm lab:smoke
  --base http://localhost:3134` ok (433 checks, 0 failing). No board this round (`board: none`), so no
  `lab:demo`.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/systems/guest-flow.md`,
  `src/app/(guest)/e/[token]/actions.ts`, `src/app/(guest)/e/[token]/page.tsx`,
  `src/components/guest/live-gallery.tsx` (all owned) plus four exceptions:
  - `src/components/guest/live-gallery.test.tsx`: new, colocated with the owned file it contract-tests
    (`live-gallery.tsx` is a single-file `owns` entry, not a directory prefix, but the brief's own Tests
    line required a test and this codebase's universal convention is one contract test per file it guards).
  - `src/components/guest/event-experience.tsx`: one small additive prop (`initialTileSize`, threaded
    straight through to `LiveGallery`) — no open track currently owns this file (checked every manifest
    under `docs/tracks/`), and it is the only file that mounts `LiveGallery`, so the cookie's value has no
    other path down from `page.tsx`.
  - `src/app/(dev)/design/rules/component-notes.ts`: one new entry (`live-gallery.tsx`'s `for` line) —
    the round's own documented convention ("every new component gets its `for` line...", this manifest's
    "ownership rules every lane follows this round"), needed because `gallery.test.ts` fails on a
    contract-tested file with no entry.
  - `docs/design/library.md` + `src/app/(dev)/design/rules/rules.generated.json`: generated output of
    `pnpm design:rules`, regenerated after the component-notes.ts addition; never hand-edited.
- The items: none (no board this round).
- Calls his to overrule on the alias, one line each:
  - The View menu's two group names, "Tile size" and "Showing" (brief's own words, built verbatim).
  - The disabled hint's words, "Wider screens" (brief's own words, built verbatim).
  - Yours hidden from the menu entirely (not shown-disabled) when the guest owns nothing on the album,
    mirroring the existing mark/line's own rule exactly (never a filter with nothing behind it).
  - The View menu shares the Download-all row's exact visibility gate (`!isDemo && access !== "none" &&
    items.length > 0`) rather than its own — an edge case the brief didn't name (zero approved items with
    an upload still in flight leaves neither control on screen); recommended as the more honest state
    (nothing to size or filter yet) and built that way.
- The help articles this lane makes stale: `content/help/browse-the-album.mdx` — describes the guest
  album's controls (the gallery, the photo viewer, Download all, Invite) with no mention of the new View
  menu (Tile size, Showing); a `help-sync` lane folds it in alongside the pre-existing gaps there (the
  two-column claim, the Yours mark) that predate this lane.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first:
  - The mount itself: `/e/<token>` beside "Download all" at 1440, then the View menu open (both groups,
    the "Wider screens" hint at 375) — screenshotted locally; raw `curl` of the SSR HTML confirmed
    `--album-column` is baked in from the cookie with no client JS at all (the "no pre-measure frame"
    claim, at its strongest).
  - The one piece of the brief's own red-team this lane could NOT run locally: "Yours present only with
    an own upload." Local dev's guest upload PUTs straight to R2, and R2's CORS allow-list does not include
    `localhost` (confirmed live: every PUT failed preflight, `net::ERR_FAILED`, distinct from a product
    bug) — this is the allow-list-gated upload flow CLAUDE.md already names as untestable off the alias.
    Verified instead by construction: the View menu's Showing group and the pre-existing "Showing yours /
    Show all" line both read the identical `yours.on` / `yours.count` values in the same render (one
    expression, not two), and `live-gallery.test.tsx` exercises the same wiring with a simulated
    `canDeleteIds` in place of a real upload. The alias's own upload (a second tab, per the brief) is the
    one confirmation this lane could not produce itself.
  - Real Chrome MCP note (not a product bug, a tooling one worth knowing for the next lane touching a
    Radix `DropdownMenu` trigger locally): the Browser pane's plain `left_click` never opened this trigger
    or selected a radio item in it (`data-state` stayed `closed` through several retries) — a direct
    `dispatchEvent(new PointerEvent("pointerdown", ...))` on the element opened and drove it reliably every
    time. `view-menu.test.tsx`'s own jsdom pins already use `fireEvent.pointerDown` for the same reason.
  - `event-experience.tsx`'s one exception hunk (four small pieces: an import, a prop, a JSDoc line, a
    pass-through) — everything else in that file is untouched.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Mounted the shared `ViewMenu` in the guest album's control row
beside "Download all" (`live-gallery.tsx`): a Tile size group (the three steps, disabled below 640 with a
"Wider screens" hint, since `masonry.tsx` forces two columns there) and a Showing group (Everyone's / Yours
(n)) joining the existing `theirs=mark` filter, present only once the guest owns something on the album — the
"Showing yours / Show all" line stays as the state's own receipt. The size is server-resolved from the shared
`pr_tile_size` cookie (`page.tsx`, the host dashboard's own precedent) and threaded through
`event-experience.tsx` as `initialTileSize`, so the first paint carries a returning guest's chosen size with
no client pre-measure frame (confirmed via a raw curl of the SSR HTML); the write rides `setTileSizeAction`
(`actions.ts`), mirroring the host's own action onto the one shared cookie. `buildGuestViewGroups` is the
pure seam under the wiring, with its own 14-case contract (`live-gallery.test.tsx`). Gate green on the synced
tree (3118 tests, 433 smoke checks); the "Yours after a real upload" leg of the brief's red-team needs the
alias (R2's CORS allow-list excludes localhost).
