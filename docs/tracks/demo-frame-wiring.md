---
track: demo-frame-wiring
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ece02b97"          # the launch-prep SHA the branch was cut from
board: demo-event      # wired by this lane; the board retires unless his verdicts keep it open
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/system/demo-ticket.tsx
  - src/components/marketing/sections/home/cinema-hero.tsx
  - src/components/marketing/chrome/marketing-footer.tsx
  - src/components/marketing/chrome/mega-panel.tsx
  - src/components/marketing/system/demo-cta-link.tsx
  - src/components/marketing/chrome/footer-demo.tsx
  - src/app/(dev)/design/sandbox/demo-event/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/marketing/sections/home/live-demo.tsx
  - src/components/marketing/sections/home/hero-stream.ts
  - src/components/shared/album-stream/
  - docs/reviews/demo-event.json
  - docs/design/rulings.md
---

# lp/demo-frame-wiring

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- THE REVIEW SHEET FIRST: his verdicts beside the option pictures, `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b97eafa6-025b-4736-847b-48f80c42ec24/scratchpad/review-sheets/c75734b9-second.html` (open it in a browser; your board's section); the plan's words for this lane are in `/Users/gibby/.claude/plans/let-s-put-a-pause-gentle-widget.md` (the second batch); his notes verbatim in `docs/design/rulings.md` ("the closing sitting's second batch").
- `door=frame` with his note. THE FACTS: `system/demo-ticket.tsx` is retired from the site (only the Library's
  marketing gallery and the site-chrome sandbox import `DemoTicket`), the footer's pile lives in `chrome/footer-demo.tsx`
  (`FooterDemo`, four fanned photographs under a `FooterQr` plate; `FooterQr` is imported by three lab files), the
  hero's plate is `cinema-hero.tsx`'s own `DemoQr` (a bare `FooterQr` over the streaming corridor), the feature page's
  door is `demo-cta-link.tsx` (words and a chevron), and `mega-panel.tsx`'s Features group carries no `FEATURED`
  entry. THE OBJECT: one `DemoFrame` (one photograph in a plain mat, the live code tucked in its corner, the fixture
  the site holds; the board's `FrameObject` in `sandbox/demo-event/doors.tsx` is the drawing) exported from
  `system/demo-ticket.tsx` with `DemoTicket` kept as a re-export of the same object (the lab's import survives and
  the Library's specimen shows the frame), mounted at the four places: `DemoQr` in the hero becomes the frame,
  `FooterDemo` renders the frame (its `FooterQr` export untouched), `DemoCtaLink` gains the object at its small size
  beside its words, and the Features group gets a `FEATURED` entry holding the frame at the nav size. THE NOTE:
  at the hero the object must be NOTICEABLE against the corridor: clearly taller than the corridor's tiles at 1440
  (the board's 163 px against 140 px tiles is not), lifted by the mat's own shadow, and the stream behind it may
  pause or dim under the object (the engine's `hero-stream.ts` read, never edited beyond a prop if one exists); at
  375 it already stands twice the tiles' height. The lane measures the shipped hero (the real tile sizes) and writes
  the numbers in the Handoff. The board retires under the retirement exception; `marketing-content.md`'s demo line
  refined. Owns: `src/components/marketing/system/demo-ticket.tsx`, `sections/home/cinema-hero.tsx`,
  `chrome/marketing-footer.tsx`, `chrome/mega-panel.tsx`, `system/demo-cta-link.tsx`, `src/app/(dev)/design/sandbox/demo-event/`,
  `chrome/footer-demo.tsx`. NOT `docs/systems/marketing-content.md`: `pricing-split-wiring` owns that file this
  batch (the manifest test refuses one path in two manifests), so this lane's demo line there is its one exception,
  applied after syncing past that lane if it lands first, else listed for the Orchestrator. Reads: `sections/home/live-demo.tsx` (illustrative,
  not a door: untouched), `sections/home/hero-stream.ts` and `shared/album-stream/` (the engine), the ledger,
  rulings.md, the sheet. Red-team on the alias signed out at 375 and 1440: the four places. His to overrule: the
  object's size at the hero; the pause in the stream.

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

- **The corner code's size trades scannability for proportion at `hero`/`heroCompact`/`footer`.** The brief named the
  object's SIZE as his to overrule but said nothing about the code's own pixel size within it; building `FrameObject`'s
  reviewed ratio at the hero's real scale first (144px code, a mat sized to hold it "tucked in a corner") produced a
  badge WIDER than the photograph — a QR code with a photo leaking out from behind it, not a photograph with a code in
  its corner. Recommended and built: `hero`/`heroCompact` drop to the RETIRED ticket's own precedent (92px/72px,
  2.24/1.76px per module, under `QR_FLOOR_PX_PER_MODULE`'s 3px floor — a code that reads as a tap target and a symbol,
  never assumed scannable at arm's length, exactly the retired ticket's own stance at its nav size); `footer` keeps a
  bigger badge (108px, 2.63px/module) because its copy explicitly promises a scan ("Scan the code… on your phone") and
  the footer carries none of the hero's tight vertical budget. Full numbers and the measured tiles are in the Handoff.
- **`DemoTicket` is a wrapper around `DemoFrame`, not a literal re-export.** The brief's words ("kept as a re-export of
  the same object") read as `export const DemoTicket = DemoFrame`, but the two lab callers (`gallery-demos.tsx`'s bare
  `<DemoTicket />` / `<DemoTicket layout="column" />`, `site-chrome/chrome.tsx`'s bare `<DemoTicket layout="column" />`)
  need a complete door (a `<Link>`, an aria-label, an env gate) with no surrounding door of their own, while the four
  real mounts each already own a door and would double-nest an `<a>` if `DemoFrame` carried one too. Recommended and
  built: `DemoFrame` stays presentational (no link, no gate); `DemoTicket` is the thin, self-contained wrapper the two
  lab callers need, unchanged in name and its `layout` prop. Same DRY visual, no double anchors.
- **The stream does not pause or dim under the object.** The brief allowed either, "his to overrule" either way, and
  named `hero-stream.ts` read-only "beyond a prop if one exists" — none does, and adding one would mean editing the
  single-source engine this lane only reads. Recommended and built: neither. Noticeability comes from size (past the
  shipped corridor's busiest cluster, measured) and the mat's own `shadow-layer`, which the browser check found
  sufficient without touching the engine.
- **Text-free, no party name printed on the object.** The board's own carried call (`doors.tsx`'s header note,
  inherited into this round's spec): showing the party (`pile`) beat naming it in round one, and "text-free but the
  demo's name" printed on the frame was flagged as a possible alternate reading, never built. Recommended and built:
  text-free, matching every other door on the site and round one's own finding.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/marketing-content.md`, the "Interactive demo (marketing side)" section: the stale `doors=pile`
  paragraph (the footer's pile as the rule every door works toward, the nav pane left empty, round two queued)
  replaced with `door=frame`'s shipped state — one `DemoFrame` at all four places and the corner-code proportion
  trade-off. Applied after syncing past `pricing-split-wiring`'s own merge to this file (landed first, as its brief
  anticipated); commit `6095f7b2`.

## Deferred (ROADMAP one-liners, bucket named)

- Now: the `.mkt-stack` / `.mkt-stack-card` hover-fan recipe in `src/app/(marketing)/marketing.css` has no consumer
  left (`footer-demo.tsx` was its only production caller; the retired pile's own sandbox copy is gone too) — dead CSS,
  harmless, for whoever next owns that sheet to prune.
- Now: the Library's own `gallery-demos.tsx` (`(dev)/design/(shell)/library/marketing/gallery-demos.tsx`, "demo-ticket"
  entry) still describes the retired two-look ticket ("row is the hero's dark glass, column the opaque nav panel's
  card") — outside this lane's `owns`, so left as found; the specimen still renders correctly (verified in the
  browser), only its prose caption is stale.

## Handoff (replaces the chat report)

- Board commit `0f44a93f`, pushed (the actual wiring, gated green on its own before any sync). Synced with
  `launch-prep` across three merges as this batch's sibling lanes landed one after another: `e9320fd4` (past
  `pricing-split-wiring`, `overtaken-4`), `9528267e` (past `welcome-film-wiring`, `app-pricing-wiring`), `d1da0f17`
  (past `avatar-mesh-wiring` — the last of the six sibling lanes cut together). `docs/systems/marketing-content.md`'s
  exception applied at `6095f7b2`, after the first sync. `d1da0f17` is HEAD; `git merge-base --is-ancestor
  origin/launch-prep HEAD` confirms fully caught up as of this Handoff.
- Every claim below names its artifact so the Orchestrator checks rather than believes.
- Gates on the synced tree (all re-run after the third and final sync, `d1da0f17`): `design:rules` ok (194 components,
  95 indexed); the specimen collector ok (140 specimens on 101 entries); `typecheck` ok; `lint` ok (8 known warnings,
  0 errors); `test` ok (3181 passed, 1 skipped, 307 files); `build` ok (255 pages, exit 0); `pnpm lab:smoke --base
  http://localhost:3133` ok (413 checks, 0 failing — the one non-2xx, `/design/lab/tools/boom`, is that tool's own
  deliberate 500 and not counted by the script). This is a production/marketing lane; no `lab:demo` (the board is
  retired, not a standing lab surface).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = exactly `src/components/marketing/system/demo-ticket.tsx`,
  `src/components/marketing/sections/home/cinema-hero.tsx`, `src/components/marketing/chrome/footer-demo.tsx`,
  `src/components/marketing/system/demo-cta-link.tsx`, `src/components/marketing/chrome/mega-panel.tsx`, the five
  deleted `src/app/(dev)/design/sandbox/demo-event/*` files (all `owns`), plus this manifest, and five exceptions with
  why: `src/app/(dev)/design/touchpoints.ts` + `src/app/(dev)/design/sandbox/registry.ts` +
  `src/app/(dev)/design/(shell)/lab/boards.ts` (the board-retirement convention stated in each file's own header
  comment: the RulingId row's `ruled`/`shipped` filled and its `board` block dropped, the id dropped from `SandboxId` /
  `DESK_ORDER` / `REGISTERED` / `BOARD_COMPONENTS` together); `src/app/(dev)/design/rules/component-notes.ts` (the
  standing "every new/changed component gets its `for` line" convention — `demo-ticket.tsx`'s entry rewritten for
  `DemoFrame`); `docs/design/library.md` + `rules.generated.json` regenerated by `pnpm design:rules` rather than
  hand-merged, per the batch-wide instruction; `docs/systems/marketing-content.md` (this lane's one named exception,
  applied after syncing past `pricing-split-wiring`, see System-doc edits above).
- The item: `door=frame`: one `DemoFrame` (a photograph in a plain mat, the code tucked into its corner) at all four
  places, overriding round one's `doors=pile`; it becomes the Library entry at `/design/library/demo-ticket` (still
  named for the file, `demo-ticket.tsx`; the specimen title reads "DemoFrame" from the export order). Measured on the
  shipped hero (`pnpm dev`, a browser console sweep, 2026-09-21): at 1440 the visible corridor tiles run 48-253px tall
  (busiest cluster 60-204) against the frame's own 218×258; at 375 they run 24-137px against 162×191. Axis-to-headline
  clearance left over once the frame stands: 39px at 1440 (was 168px total), 17.5px at 375 (was 113px total) — both
  positive at every viewport height tried down to 680px (the shortest a real laptop window is likely to hit), where
  the frame still clears the sticky header with air to spare (checked at 1440×680 and 1440×750).
- Calls his to overrule, one line each (also in Questions above, in full):
  1. The corner code's size at `hero` (92px) / `heroCompact` (72px) / `footer` (108px) — smaller than the hero's old
     bare-QR pixels (144/128px), traded for a photograph-forward object rather than a QR-forward one.
  2. The stream does not pause or dim under the object (size and shadow alone carry the noticeability the note asked
     for; `hero-stream.ts` stayed untouched, no prop existed to hook this without editing the engine).
  3. `DemoTicket` wraps `DemoFrame` rather than being a literal `=` re-export (function preserved, DRY preserved, no
     double-nested anchors on the two bare lab callers).
  4. Text-free, no party name on the object (round one's own finding, carried forward, never re-opened by round two).
- The help articles this lane makes stale: none found (`grep` across `content/help/` and `content/blog/` for the
  retired fan pile / ticket visuals turned up nothing — no article describes the demo door's look, only its function).
- Assets requested from Will: none (every frame reuses the `wedding-arch` marketing still already on disk, the same
  fixture the board's own reviewed drawing used).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: the home hero at 1440 and 375 (`pnpm dev`, or the alias once this lane is on it) — the object's size
  is the one call most likely to need a second look; then the footer; then a feature page (e.g. `/features`) for the
  small line-side frame; then hover Features in the header nav for the mega-panel pane.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). `demo-frame-wiring` wired round two's `door=frame`: one `DemoFrame`
(a photograph in a plain mat, the code tucked into its corner) replaced four different demo-door treatments — the
hero's bare QR, the footer's four-photo fan, a feature page's bare text line, and the nav mega-panel's empty featured
pane — with a single shared object, sized past the shipped hero's own corridor tiles (measured, not asserted) rather
than the lab board's flat mock. The corner code traded the hero's prior scannable pixel size for proportion (his to
overrule); `DemoTicket` survives as the frame's complete door for the Library specimen and the site-chrome sandbox.
The `demo-event` board retired (touchpoints.ts keeps its `RulingId` with final `ruled`/`shipped` text, no `board`
block); `docs/systems/marketing-content.md`'s demo line refined after syncing past `pricing-split-wiring`. Gate green
throughout three successive syncs as the batch's five sibling lanes landed.
