---
track: guest-chrome-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c75734b9"          # the launch-prep SHA the branch was cut from
board: guest-shape     # wired by this lane; the board retires unless his verdicts keep it open
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/
  - src/components/shared/masonry.tsx
  - src/components/shared/masonry.test.tsx
  - src/components/shared/floating-add-button.tsx
  - src/app/(dev)/design/sandbox/guest-shape/
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/guest/
  - src/app/api/guests/mine/route.ts
  - src/components/ui/sheet.tsx
  - src/components/ui/dialog.tsx
  - src/components/app/media-grid.tsx
  - docs/reviews/guest-shape.json
  - docs/design/rulings.md
---

# lp/guest-chrome-wiring

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- THE REVIEW SHEET FIRST: his verdicts beside the option pictures, `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b97eafa6-025b-4736-847b-48f80c42ec24/scratchpad/review-sheets/fe056e62.html` (open it in a browser; your board's section); the plan's words for this lane are in `/Users/gibby/.claude/plans/let-s-put-a-pause-gentle-widget.md`.
- Owns: `src/components/guest/` (by prefix; no other lane owns a guest file this sitting), `src/components/shared/masonry.tsx`
  and `masonry.test.tsx` (the mark as a tile state: a `mineIds` prop, `data-mine` on the tile box, the mark element
  beside the like mark; `MasonryColumns`, `GALLERY_COLUMNS`, `distributeColumns`' behaviour and every existing prop
  unchanged: the lab and four host grids import it), `src/components/shared/floating-add-button.tsx` (and its test),
  `src/app/(dev)/design/sandbox/guest-shape/` and the board's registration lines under the retirement exception,
  `docs/systems/guest-flow.md`. Reads: `src/lib/guest/`, `src/app/api/guests/mine/route.ts`, `ui/sheet.tsx` (the
  posture's classes, copied not imported), `ui/dialog.tsx`, the guest-shape ledger, rulings.md, the review sheet,
  and `shared/view-menu.tsx` once `controls-home-wiring` lands.
- The dock: a `role="group"` of the two actions fixed at the foot, appearing when the row's sentinel leaves the
  viewport (the row's existing `IntersectionObserver` pattern), the house entrance from `floating-layer.ts`, a
  gradient scrim over the album, safe-area padding; the pill's mount removed. The door: `entry-shell.tsx`'s two
  halves restyled to the Sheet's posture (phone: `max-h-[85svh]`, the top edge, `rounded-t-float`, the overlay
  blurring the album above; desk: `inset-y-0 right-0 w-3/4 max-w-md` with the edge entrance), vaul's handle kept on
  the phone, the dismissability table untouched. The mark: the glass mark from the board's `theirs.tsx` becomes
  production (the marks' lighter blur token, 4.5:1 over the brightest photograph, the harness re-run), a tap on the
  mark sets a `yours` filter in `live-gallery.tsx` (the list filtered to `ownIds`; a "Showing yours · Show all" line
  above the album; the count), `ownIds` computed for any guest with an identity. The View menu mount with Yours and
  tile size on the guest row after `controls-home-wiring` lands (`--album-column` on the guest grid's wrapper as the
  host does), else the follow-up. Tests: the dock (appears on the sentinel, both actions, keyboard reachable), the
  shell's two postures (classes present per half; vaul still the phone engine), `masonry.test.tsx` (the mark renders
  only on `mineIds`; nothing else changes), the yours filter (pure), `entry-modal.test.tsx` green, `lab:smoke` whole,
  the gate. Red-team on the alias at 375 and 1440 signed out on the disposable event: the row, the dock after a
  scroll, the door's two postures, an own upload's mark and its filter, another's tile without it.
- His to overrule: the desk posture of the door (a right panel); the dock's scrim; the mark's glyph; "Showing yours"
  as a line rather than a chip.

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

- none raised. Every call the brief left open was taken on its recommended answer and is listed under
  "Calls his to overrule" below; nothing here was a one-way door.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/guest-flow.md`, "Flow (top to bottom, contiguous)": the action-block paragraph now ends in
  the dock rather than the floating pill (the sentinel, the scrim, the safe area, `inert` not unmounted, the
  reserved height, and the pill's retirement with the three lab surfaces that keep it on disk).
- `docs/systems/guest-flow.md`, same section, the responsive-Sheet ★: the door is ON the one Sheet from 640
  up now; the sentence that said it was not is gone.
- `docs/systems/guest-flow.md`, "The ARRIVAL": the shell paragraph names the right-edge panel and why the
  phone half stays vaul; the welcome bullet says the `55svh` rule stays drawer-scoped.
- `docs/systems/guest-flow.md`, "Live gallery: the hybrid doorbell": one new bullet under the removal one,
  for the fourth mark, its corner, the Yours filter's line and the rule that it cannot stay live empty.

## Deferred (ROADMAP one-liners, bucket named)

- Now: `content/help/` still describes the guest album's chrome as "a floating Add button appears as you
  scroll" wherever it does; `help-sync` rewrites it (see "help articles" below).
- Now: the ROADMAP's own guest-upload line ("the hold-for-approval toast and the floating Add pill both sit
  at the foot of a phone and the toast covers the pill") now reads against the DOCK, which is taller than
  the pill was; the stacking rule is still owed and is bigger. It belongs with `toasts` (recommended `top`,
  unruled), which would dissolve it outright.
- Next: `yours-filter.ts` sits in `src/components/guest/` because this lane does not own `src/lib/guest/`;
  move it beside `merge-gallery-items` and `reconcile-gallery-items` when a lane owns that directory.
- Next: the Yours filter's mount inside the View menu (`controls-home=view-menu`, his `theirs` note: "combine
  this new filter with the tile size filter ... rather than just adding more and more configs"). Blocked at
  cut time: `shared/view-menu.tsx` is `controls-home-wiring`'s and did not exist on this tree. A small
  follow-up mounts the menu on the guest row with Yours and tile size in it (`--album-column` on the guest
  grid's wrapper, as the host does); the "Showing yours · Show all" line stays as the state's receipt.
## Handoff (replaces the chat report)

- The BOARD commit is `206cb7bf` (the whole wiring and the board's retirement); the SYNC-MERGE is `456a973d`
  (`origin/launch-prep` at `224049d6`: buttons-wiring merged, `body-type` retired, guest-verify round two and
  the record). An earlier sync, `b162d563`, carried the two `usher/` commits before it. The head is in the
  chat line, not here.
- The second sync had TWO conflicts, both the three-lanes-retiring-at-once one this lane predicted, and both
  resolved as "keep EVERY deletion":
  - `sandbox/registry.ts`: the `BODY_TYPE` and `GUEST_SHAPE` spec imports are adjacent lines and each lane
    deleted the other's, so git saw one hunk. Neither board survives and both imports are gone. `DESK_ORDER`
    and `(shell)/lab/boards.ts` merged clean with both rows already removed.
  - `docs/design/library.md`: generated, so it was regenerated (`pnpm design:rules`) rather than merged, as
    was `rules.generated.json`.
  And ONE CORRECTION the merge exposed, in this lane's own board lines: retiring `guest-shape` I had deleted
  its `TOUCHPOINTS` row and both union members outright, and `body-type` arriving retired shows the house
  convention `glass` and `voice` already followed. A retired board KEEPS its `RulingId` member and its
  touchpoint row, with `ruled` and `shipped` filled in and no `board` block, and leaves `SandboxId` and
  `DESK_ORDER` (`boards.ts` holds `Record<SandboxId, BoardEntry>` TOTAL, so a member with no component is a
  type error, measured). `guest-shape`'s row is restored in that shape, naming what its two rounds ruled and
  what this lane shipped. `entry-modal.tsx` and `password-gate.tsx` carry buttons-wiring's five `size="cta"`
  changes verbatim (this lane never touched either file); both lanes' work is on the tree, checked by hand.
- Gates on the synced tree (`456a973d`), each on its own exit code: `pnpm design:rules` 0 · the specimen
  collector 0 (140 specimens on 101 entries) · `pnpm typecheck` 0 · `pnpm lint` 0 (the 8 known warnings,
  unchanged) · `pnpm test` 0 (3099 passing, 1 skipped, 294 files) · `pnpm build` 0 (255 static pages, 130
  routes) · `pnpm lab:smoke --base http://localhost:3134` 441 checks / 0 failing ·
  `pnpm lab:demo --board guest-shape --base http://localhost:3134` reported "0 steps, 0 failing", run BEFORE
  the retirement, because this board declared no step to press.
- Lane check, `git diff --name-only origin/launch-prep...HEAD` (re-run on the second sync): everything under
  `src/components/guest/`, `src/components/shared/masonry.tsx` + `masonry.test.tsx`,
  `src/components/shared/floating-add-button.tsx`, `src/app/(dev)/design/sandbox/guest-shape/` (deleted) and
  `docs/systems/guest-flow.md` is owned, plus this file. Six files outside the `owns` list, with why:
  - `src/app/(dev)/design/sandbox/registry.ts`, `src/app/(dev)/design/(shell)/lab/boards.ts` and
    `src/app/(dev)/design/touchpoints.ts`: the RETIREMENT exception, this board's lines only. Two lines in
    each registry; in touchpoints its `SandboxId` member and its `DESK_ORDER` row removed, and its `RulingId`
    member and `TOUCHPOINTS` row kept in the retired shape. `app-shape` is still an adjacent `DESK_ORDER` row
    and its lane retires it too, so expect the same one-hunk conflict once more; the resolution is "keep every
    deletion", nothing else.
  - `src/app/(dev)/design/rules/component-notes.ts`: the ownership rule ("every new component gets its `for`
    line"). Three added (`guest-action-dock.tsx`, `entry-shell.tsx`, `yours-filter.ts`), placed in the GUEST
    block rather than at the head so the four lanes adding lines this round stay line-disjoint; plus one
    retuned, `floating-add-button.tsx`'s, which now says it is retired from the product and why it is on disk.
  - `src/app/(dev)/design/rules/rules.generated.json` and `docs/design/library.md`: both generated by
    `pnpm design:rules`, never hand-edited.
- The items, one line each:
  - `chrome=both`: the row is untouched, and `guest/guest-action-dock.tsx` (new, contract-tested) takes its
    place at the foot on the row's own sentinel. A `role="group"` of Add beside Invite, a gradient scrim
    instead of a hairline, `env(safe-area-inset-bottom)`, and `inert` while hidden so the bar travels rather
    than appears. It carries exactly what the row carries (`onAdd` omitted means no Add; nothing to dock
    renders null). The pill's mount is gone from `event-experience.tsx`; `shared/floating-add-button.tsx`
    keeps its props and gains a head comment naming the three surfaces still drawing it (`guest-upload`,
    `toasts`, the Library's interactive demo). The page root reserves the dock's height while it is MOUNTED,
    never only while it is visible. Lands in the Library as **GuestActionDock**.
  - `welcome=sheet`: `entry-shell.tsx`'s desk half is `SheetContent responsive` now (the same primitive
    Invite, Report and the settings sheet wear), a full-height right-edge panel with the album blurred beside
    it; the phone half stays vaul and took the Sheet's `max-h-[85svh]` with `overflow-y-auto`. The
    dismissability table, the step machine, the success hold and the 55svh welcome presence are untouched;
    `entry-modal.test.tsx` is green unchanged and now exercises the Sheet branch. Lands in the Library as
    **EntryShell**, its first `for` line.
  - `theirs=mark`: `shared/masonry.tsx` gained `mineIds` / `onSelectMine` / `mineSelected`, writes `data-mine`
    on the tile box and renders a fourth mark beside the like mark in `GLASS_MARK` + `GLASS_MARK_LIT` (the
    play mark's exact recipe). `GALLERY_COLUMNS`, `MasonryColumns`, `distributeColumns` and every existing
    prop are untouched, so the lab and the four host grids that import them are unaffected and their pins are
    green. The tap toggles a Yours filter in `live-gallery.tsx` under a "Showing yours · Show all" line with
    the count, on the same server-read own-uploads set `canDelete` already gates Remove with.
    `guest/yours-filter.ts` is the pure half and lands in the Library as **yours-filter**.
  - The board: `guest-shape` retired. The directory is deleted, the registries are clean and `/design/lab`
    renders with no guest-shape link (measured in the browser); its touchpoint row stays in the retired shape
    (`ruled` + `shipped`, no `board` block), the way `glass`, `voice` and now `body-type` do.
- Calls his to overrule on the alias, one line each:
  - **The mark's corner.** The board drew it top-RIGHT on a phone, where nothing else sits; I put it top-LEFT
    at every width, because from `md` up the top right is the desk hover row's own pane (`row=bar`) and that
    pane opens over the mark. The two bottom corners are the play and like marks'. A guest's roughly 2.5s
    just-landed check shares the top left and paints over it, which is the right order: the news, then the mark.
  - **The mark's glyph** is the board's white dot, unchanged: deliberately quiet, which is the risk his own
    overrule line named and he chose `mark` anyway. The aria-label and the desk `title` carry the meaning.
  - **The dock's scrim** is a 40px gradient into the page's paper rather than the board's `border-t` +
    `bg-background/85 backdrop-blur-sm`: a hairline across a full-bleed album reads as a crop, and glass is
    media chrome, never page chrome (bible 15, `lib/glass.ts`).
  - **The dock at a desk** right-aligns its pair (`sm:justify-end`) inside a full-width bar, exactly as the
    board drew it at 1440: the bar runs the window, only the buttons sit where a cursor already is.
  - **"Showing yours" is a LINE, not a chip** (his `theirs` note), and the mark is a TOGGLE, so tapping a
    marked tile again clears the filter and the mark is never a one-way door with a link as its only exit.
  - **The door's content sits at the desk panel's top**, the way Invite, Report and the settings sheet all do,
    rather than the board wrapper's bottom-pinned CTA: a 900px panel with one button at the very bottom
    separates it from the words it answers, and the consent line would be marooned under it.
  - **The dock's button rung is `size="lg"` (h-9)**, the rung the shipped row already uses (Add is `lg`, the
    Invite trigger is forced to `h-9`), so `buttons-wiring`'s retune reaches the dock with everything else.
- The help articles this lane makes stale, one line each (a `help-sync` lane rewrites them):
  - Any guest how-to describing the floating Add pill ("a floating Add photos button appears as you scroll"):
    it is a dock now, and it carries Invite beside Add.
  - Any article describing the welcome or the gate as a centred box on a laptop: it is a panel from the right
    edge, with the album blurred beside it.
  - Any article about removing your own photograph: it can be FOUND now, by the mark on your own tiles and the
    Yours filter, rather than only by scrolling until you recognise it.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. No SQL, no schema and no RPC: the
  own-uploads set is the one `yours` already shipped (`listAccountMediaIds` and `POST /api/guests/mine`), read
  twice instead of once.
- Verified locally at 375 and 1440, signed out, on the disposable open event `Gallery width (disposable)` (30
  photographs): the row on landing at both widths; the dock arriving on a real scroll with both actions and
  the scrim (measured at the top of the page: `data-hidden`, `inert`, `opacity: 0`, `translate: 0px 16px`, and
  all four cleared at scrollY 1200); the door's phone posture (a bottom sheet with the album blurred above it)
  and its DESK posture (a full-height right-edge panel, the album blurred to its left); `/design/lab` with the
  board gone. ONE REAL BUG FOUND AND FIXED IN THE BROWSER: the dock's first transition named `transform`, and
  Tailwind v4's translate utilities set the STANDALONE `translate` property, so the bar teleported instead of
  travelling (computed `transform: none`, `translate: 0px 16px`). It is `transition-[translate,opacity]` now,
  with the travel `motion-safe:` only so reduced motion keeps the cross-fade and drops the distance.
  NOT exercised locally, and why: the gated door's two steps (every event in the test data is `open`, and the
  one-boolean DB flip that would have made an account gate was refused by the sandbox), and the mark and its
  filter against a REAL own upload (localhost cannot upload). The mark's material and placement were checked
  over the real photographs at both widths by injecting the exact element (the source's own class string) onto
  four tiles; the wiring's behaviour is pinned in `masonry.test.tsx` and `yours-filter.test.ts`. Both belong to
  the alias pass.
- The mark's contrast: no new measurement was taken, and none is owed. It is the SHIPPED white-glyph recipe,
  `GLASS_MARK` + `glass-mark-lit`, byte for byte the `CornerPlayBadge`'s; the 4.4:1 failure the glass round
  measured was the rose `--like` colour, and this mark carries no colour of its own.
- Look at first: on a phone, land on the album and scroll until the row leaves. The dock should ARRIVE rather
  than appear, and Invite should be as reachable as Add at the bottom of a long album. Then the door at a
  laptop: a panel from the right edge with the album blurred beside it, not a box in the middle of the screen.
  Then, signed in as a guest who has uploaded, the small disc on your own tiles and what a tap on it does.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-20). `guest-shape` round two wired whole and the board retired.
`chrome=both`: the full-width row under the event's name stands, and a new `GuestActionDock` takes its place
at the foot on the row's own IntersectionObserver sentinel, carrying Add beside Invite over a gradient scrim
inside the safe area, inert rather than unmounted so it travels; the floating Add pill lost its only product
mount and stayed on disk for three lab surfaces. `welcome=sheet`: the door's desk half became the one
responsive Sheet as a right-edge panel with the album blurred beside it, the phone half kept vaul for the
keyboard and took the Sheet's 85svh ceiling, and the dismissability table never moved. `theirs=mark`: the one
grid gained a fourth mark on a guest's own tiles whose tap toggles a pure Yours filter under a
"Showing yours · Show all" line, on the same server-read set the lightbox's Remove already gates.
