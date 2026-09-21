---
track: guest-upload-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "40e2c2c1"          # the launch-prep SHA the branch was cut from
board: guest-upload    # wired by this lane; the board retires (its eight asks ruled whole)
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/
  - src/lib/guest/use-upload-queue.ts
  - src/lib/guest/arrival-glow.ts
  - src/lib/shared/arrival.ts
  - src/lib/shared/arrival.test.ts
  - src/lib/shared/use-live-poll.ts
  - src/components/shared/masonry.tsx
  - src/components/shared/masonry.test.tsx
  - src/components/shared/arrival.css
  - src/components/shared/lit-edge-contract.test.ts
  - src/app/(dev)/design/sandbox/guest-upload/
  - docs/systems/guest-flow.md
  - docs/systems/uploads-and-r2.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/upload/uploader.ts
  - src/lib/upload/server-pipeline.ts
  - src/app/api/r2/
  - src/lib/media/limits.ts
  - src/lib/media/validators.ts
  - src/lib/guest/reconcile-gallery-items.ts
  - src/lib/db/queries/guest-events.ts
  - src/components/ui/sheet.tsx
  - src/components/ui/sonner.tsx
  - src/components/shared/legal-consent-line.tsx
  - src/lib/constants/legal-terms.tsx
  - src/lib/type-ladder-policy.test.ts
  - src/components/marketing/mock-parity.test.ts
  - docs/reviews/guest-upload.json
  - docs/design/rulings.md
---

# lp/guest-upload-wiring

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- THE REVIEW SHEET FIRST: `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b97eafa6-025b-4736-847b-48f80c42ec24/scratchpad/review-sheets/c75734b9-third.html` (16 verdicts pictured from the fresh capture of `c75734b9`): open your board's section first, each of his verdicts beside the picture of the option he chose, his sentence verbatim.
- **The sheet and the review** (`tap=sheet`, `warning=both`): the Add tap (all three mounts: the row, the dock, the empty
  state) opens `guest/upload/intent-sheet.tsx` on the product's responsive Sheet (no text inputs, so Radix is safe on a
  phone; the board's `.gu-*` CSS never ships): two rows, Use the camera (a hidden input INSIDE `SheetContent` with
  `capture="environment"` and `accept="image/*"`: iOS ignores `multiple` under `capture` and Android shows a Camera/Camcorder
  chooser when video is accepted, so the camera row takes a photograph and the album row takes both kinds) and Choose from
  your album (a hidden input without `capture`, `accept="image/*,video/*"`, `multiple`), each `.click()`ed SYNCHRONOUSLY
  from the row's tap (never after an `await`: Safari drops the gesture); the TERMS LINE beneath them redesigned as one quiet
  line: this round it states the product's limits from `limits.ts` ("Photos and videos up to 10 GB", the accepted kinds),
  because the host's own `max_upload_bytes` never reaches the guest (the `get_event_by_qr_token` RPC does not return it: a
  migration, the types regeneration and `guest-events.ts` are the Orchestrator's, banked as a ROADMAP line; the option's
  "in the host's own number" lands then); nothing about rights or ownership (the no-rights-tracking rule and
  `legal-terms.tsx:138` bind). When the picker returns, the same sheet shows the REVIEW step (his note): the picked files
  as small tiles (object URLs; an undrawable file, an iPhone clip, drawn as the named stand-in tile with its name and
  size), an accidental one removed with one tap, "Send N" the primary with the terms line beneath it, then the sheet
  closes and `addFiles(kept)` runs. The `openPicker` handle becomes `openAdd` (the sheet); `guest-upload.test.tsx`'s
  hidden-input pin becomes the two inputs and the sheet. A real iPhone and an Android are the only proof of the camera
  row; the pane's emulation cannot open one: listed for Will.
- **In flight** (`sending=strip`, `batch=one`): the queue's items collapse into ONE object in the masonry's `prefix`
  slot, `guest/upload/stack-tile.tsx`: a stacked tile (the current file's image behind, two ghost edges for the rest)
  wearing the silent strip from the first byte (the current file's progress; the strip's scrim darker: the marks' blur
  token at an alpha measured 4.5:1 for white over the brightest photograph, the harness re-run) and a count ("9 to go") at
  the reading rung on that scrim; a single file is a stack of one without the count; as each file completes it leaves the
  stack for the album (the optimistic prepend as today, the blob re-key kept). The dock's "N uploading" badge stays (a
  badge, not a sentence) and its test.
- **The landing** (`landing=sweep`): the green check retires; the guest's own tile at the moment its bytes land takes ONE
  sweep of light (the board's `@keyframes gu-sweep` with its reduced-motion guard, promoted into a shared arrival
  stylesheet), once, only the newest; the arrival grammar UNIFIED: `data-arrived` (the glow for an arriving tile, anyone's,
  both surfaces) and `data-landed` (the sweep for one's own) written by the masonry, the glow's CSS moved from the guest's
  `live-gallery.css` to `src/components/shared/arrival.css` (imported by `masonry.tsx`; component stylesheets are house
  precedent and the CSS-source policy pins only the two Tailwind entries), and the TIMING travelling with it:
  `src/lib/shared/arrival.ts` exports `ARRIVAL_GLOW_MS` and a `useArrivalMarks(ids, ms)` hold (the per-id timers that
  `live-gallery.tsx:244-266` keeps today, so a surface that only passes ids never replays a glow on a re-render, the failure
  `arrival-glow.ts:6-9` names), and `src/lib/shared/use-live-poll.ts` carries the hybrid cadence (12 s fast, 60 s slow,
  `visibilitychange`) out of `live-gallery.tsx:72-73, 345-368` so the host lane can share it; `src/lib/guest/arrival-glow.ts`
  retires into the shared module. The exclusivity filter at `live-gallery.tsx:305` stays (one's own never glows, it sweeps).
  `masonry.test.tsx` gains the `data-landed` pin beside the `data-arrived` one; the `renderOverlay` slot stays (the like
  mark uses it). These three names are ANNOUNCED in the Orchestrator's manifest the day they land.
- **Held** (`held=tile`): on a hold-for-approval event a completed upload draws a WAITING tile at the album's head on this
  device only (`PendingTile.status` gains `held`; the `approved`-only gate at `live-gallery.tsx:512` admits it; its blob is
  kept, not revoked): the photograph lightly dimmed under a small clock mark and one line at the reading rung ("Waiting
  for the host"), clean, no button; it stays until the poll shows the item approved (then it is an ordinary tile) or the
  session ends. The "Sent, waiting for host approval" toast retires (the tile says it; the test pin changes). The
  identity board is untouched: this is the moderation hold; if `guest-verify` round two rules `held`, the same tile serves.
- **Failed** (`failed=sheet`): no tile is drawn for a file that did not go and no toast fires; when the run ends (the
  queue empties of queued and uploading) with at least one error, `guest/upload/failure-sheet.tsx` opens itself on the
  responsive Sheet: one short line per file (the file's name, the reason from the queue's `error`: the presign's or the
  PUT's own sentence, the house's failure grammar) with a real Retry on the line and Retry all above; Retry re-queues
  through `retry(id)` as today; the sheet's lines are what `words=read` resizes. `toast.error` for uploads retires
  (`guest-upload.test.tsx:197-220` rewritten to the sheet).
- **Words** (`words=read`): the moderation banner (kept: he declined `tiles`) and every sentence the act says (the terms
  line, the stack's count, the waiting line, the sheet's lines) at the ladder's reading rung, `text-reading` (16 px: the
  board said 15, the ladder has no 15; his to overrule to the 14 rung).
- The board retires under the retirement exception (the house convention; the board's eight `guest-upload.*` entries in
  `sandbox/overtaken.ts` removed in the same commit, as Lane 52 does for its own, so the lane's gate stays green);
  `guest-flow.md`'s upload sections ("Upload lives IN the gallery", the empty state, the hybrid doorbell's arrival lines)
  and `uploads-and-r2.md`'s guest lines refined in place. Exception lines listed with why: the `for` lines at the head of
  `rules/component-notes.ts`; the two marketing mocks that `mock-parity.test.ts:52-58, 105-112` pins to the retiring toast
  strings (`marketing/sections/features/album/review-switch.tsx` and the "add that photo" mock: the mock follows the
  product, the parity test its proof). `lit-edge-contract.test.ts` is OWNED here this batch (the stack tile joins its closed
  `HOSTS` table; the host lane's two `qr` hosts are that lane's exception lines, so the two never edit it at once). New `for` lines (the intent sheet, the review step, the stack tile, the failure sheet,
  `guest-upload.tsx`, `guest-masonry.tsx`, `use-upload-queue.ts`) with `// @contract-for:` tests: the sheet (two inputs, capture on one; the review lists the picks;
  a removed pick is not queued; Send queues the rest), the stack (N queued draw one prefix object with the count; one draws
  no count; a completed file leaves it), the waiting tile (held draws, only from this device's queue), the failure sheet
  (opens once per run end with the errors; Retry re-queues; none when the run is clean), the terms line (the host's number
  formatted; the kinds), the arrival states (pure: which ids glow, which sweep).
- Owns: `src/components/guest/` (by prefix: the uploader, the masonry, the gallery, the dock, the experience, the new
  `upload/` folder and their tests and stylesheets; the door files under it are untouched), `src/lib/guest/use-upload-queue.ts`,
  `src/lib/guest/arrival-glow.ts` (retiring), `src/lib/shared/arrival.ts` (new), `src/lib/shared/use-live-poll.ts` (new),
  `src/components/shared/masonry.tsx`, `src/components/shared/masonry.test.tsx`, `src/components/shared/arrival.css` (new),
  `src/components/shared/lit-edge-contract.test.ts`, `src/app/(dev)/design/sandbox/guest-upload/`, `docs/systems/guest-flow.md`,
  `docs/systems/uploads-and-r2.md`. Reads, never edits (every one exists on disk): `src/lib/upload/uploader.ts` (the
  never-rejects contract), `src/lib/upload/server-pipeline.ts`, `src/app/api/r2/`, `src/lib/media/limits.ts`,
  `src/lib/media/validators.ts`, `src/lib/guest/reconcile-gallery-items.ts`, `src/lib/db/queries/guest-events.ts` (why the
  host's number is not there), `src/components/ui/sheet.tsx`, `src/components/ui/sonner.tsx`,
  `src/components/shared/legal-consent-line.tsx`, `src/lib/constants/legal-terms.tsx`, `src/lib/type-ladder-policy.test.ts`,
  `src/components/marketing/mock-parity.test.ts`, the ledger, rulings.md, the review sheet.
- Tests: the contracts above; `guest-upload.test.tsx` (the untouched pins kept: endpoints, one at a time, progress, JIT
  join, the lifted queue, a rejected upload errors only its own item and the batch carries on), `guest-action-dock.test.tsx`,
  `masonry.test.tsx`, `reconcile-gallery-items.test.ts`, `lit-edge-contract.test.ts` (the stack carries `data-lit=""`),
  the ladder policy, `lab:smoke` whole; the gate. Red-team on the alias signed out at 375 and 1440 on the disposable
  event: the sheet's two rows, the review with a removed pick, a twelve-file batch's stack and each landing's sweep, a
  refused file's end-of-run sheet and its Retry (a file over the event's cap), the terms line's number; the held tile needs
  a hold-for-approval event (the Orchestrator sets the disposable event's moderation as its host) and another device's view
  (nothing).
- His to overrule: the review step itself; the terms line's words; the stack's ghost edges and count wording; the
  waiting line's words; failures never drawn as tiles; the "Sent, waiting" toast retired; 16 px.

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

- **The host's own per-event cap still never reaches the guest.** `get_event_by_qr_token` does not return
  `events.max_upload_bytes`, so the terms line states the universal 10 GB ceiling (true for every event,
  never over-promising a bigger one) rather than "in the host's own number" as the option's own words ask.
  The seam is BUILT and contract-tested: `uploadTermsLine(capBytes)` takes it, the sheet passes it through.
  Recommended, and taken: ship the universal number now, and bank the migration + types + `guest-events.ts`
  line as the Orchestrator's (a ROADMAP line below). One call site changes when it lands.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/guest-flow.md`, "Flow": the action-block line now says every Add opens the ADD SHEET
  (`uploadRef.openAdd()`), not the OS picker.
- `docs/systems/guest-flow.md`, "Flow": "Upload lives IN the gallery" rewritten as **"The upload act"** with
  its three surfaces (the add sheet and its two inputs, the review step and the named stand-in, the
  end-of-run failure sheet), the blob re-key kept, and the one-owner object-URL rule stated.
- `docs/systems/guest-flow.md`, "Flow": the empty state's CTA line says it opens the same add sheet.
- `docs/systems/guest-flow.md`, "Live gallery": the ARRIVAL bullet rewritten as ONE grammar for both
  surfaces (`data-arrived` / `data-landed`, the shared sheet and module, the exclusive sweep and why, the
  green check retired, the "only that column re-flows" warning removed because the explicit columns landed).
- `docs/systems/guest-flow.md`, "Live gallery": a new bullet, **"What THIS DEVICE draws at the album's
  head"** (the stack, the waiting tile, nothing for a failure; the `data-lit` binding; the measured pane).
- `docs/systems/uploads-and-r2.md`, the per-event cap bullet: the guest page never LEARNS the number, and
  `capBytes` is the seam that closes it.
- `docs/systems/uploads-and-r2.md`, "Where it lives": a refusal's sentence is now printed verbatim on the
  guest's failure sheet, so its precision is user-facing copy rather than a log line.

## Deferred (ROADMAP one-liners, bucket named)

- **Now** — the guest RPC returns the host's per-event cap: a migration adding `max_upload_bytes` to
  `get_event_by_qr_token`, the types regeneration, one field in `guest-events.ts`, and one prop through
  `GuestUpload` -> `UploadIntentSheet` -> `uploadTermsLine(capBytes)`, which is already built and tested.
  The terms line then says the host's own number, which is what `warning=both`'s option asked for.
- **Now** — the camera row needs a REAL iPhone and a REAL Android. The pane's mobile emulation cannot open
  a camera, so `capture="environment"` and the synchronous `.click()` are held by the source and by the
  contract test alone. One tap on each device is the whole check.
- **Later** — `shared/upload-thumbnail.tsx` (the host upload list) still HIDES a file the browser cannot
  draw where the guest now NAMES it, and still mints its own object URL in a render initializer (the
  StrictMode hazard `use-pick-urls.ts` documents). Folding it into `PickPreview` is one small change in the
  host lane.

## Handoff (replaces the chat report)

- **Board commit `321813b2`**, pushed. **Synced BEFORE the retirement commit as announced**: `git fetch` +
  a FAST-FORWARD to `origin/launch-prep` `34dae086` (overtaken-5's landing), so there is no sync-merge
  commit to name; the work was re-applied on top of it and every gate below ran on that tree. The one
  conflict was `sandbox/overtaken.ts` (upstream had already removed the eight `guest-upload.*` entries and
  written the board's departure note) and it was resolved to UPSTREAM outright: the file is byte-identical
  to `34dae086`'s and is not in the lane check. `_desk/queue.test.ts` was never touched.
- Gates on the synced tree, each on its own exit code: `design:rules` ok (0) · specimens ok (0, 140 on 101)
  · `typecheck` ok (0) · `lint` ok (0, **10 warnings**, the real baseline you named, none of them in this
  lane's files) · `test` ok (0, **313 files, 3,222 passed, 1 skipped**) · `build` ok (0, **255 static
  pages**) · `pnpm lab:smoke --base http://localhost:3132` ok (**405 checks, 0 failing**). `pnpm lab:demo`
  NOT run and cannot be: the board it would press retires in this commit.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the 46 paths below, every one owned except
  the five exceptions, each with its why:
  - `src/app/(dev)/design/rules/component-notes.ts` - the nine new `for` lines, prepended at the HEAD of
    the table exactly as the round's other lanes do, so the hunks stay disjoint.
  - `src/app/(dev)/design/{sandbox/registry.ts,(shell)/lab/boards.ts,touchpoints.ts}` - the board's own
    lines only (the retirement exception): the spec import and its `BOARDS` row, the board component's
    import and its row, the two `SandboxId` members, the `TOUCHPOINTS` entry and the `DESK_ORDER` member.
  - `src/components/marketing/sections/features/album/how-much-fits.tsx` - ONE string: the cap mock's toast
    title becomes the failure sheet's heading, because the toast it quoted retired.
  - `src/components/marketing/sections/features/album/review-switch.tsx` - ONE string and its glyph: the
    guest's toast becomes the waiting tile's line, because that toast retired too.
  - `src/components/marketing/mock-parity.test.ts` - TWO `literal` values (and their labels/appFiles)
    following both, which is that file's own documented procedure ("change the app copy and the marketing
    mock's copy TOGETHER, then update the `literal` here"). Without it the suite is red, so the lane could
    not have handed off green.
  - Generated, not authored: `rules.generated.json`, `docs/design/library.md`, `specimens.generated.json`
    (unchanged) - the output of `pnpm design:rules`, which a `for` line and a contract make mandatory.
- The items, one line each:
  - `tap=sheet`: KEPT. `guest/upload/intent-sheet.tsx` on the responsive Sheet, two rows, two hidden inputs
    inside `SheetContent` (camera: `accept="image/*" capture="environment"`, one photograph; album:
    `image/*,video/*` + `multiple`), each `.click()`ed synchronously from its row. Lands in the Library as
    **the add sheet**.
  - `warning=both`: KEPT. The review step (`review-step.tsx`) inside the same sheet, one-tap remove, `Send
    N`; `pick-preview.tsx` names a file the browser cannot draw; `upload-terms.ts` is the line. Lands as
    **the review step** and **the terms line**.
  - `batch=one` + `sending=strip`: KEPT. `upload/stack-tile.tsx`: one object per pick, the file in the air
    on top, two ghost edges, and one pane at the foot carrying "N to go" and the bar. Lands as **the stack
    tile**.
  - `held=tile`: KEPT, in the same file: the photograph lightly dimmed, a clock mark, "Waiting for the
    host", no button; it goes when the poll shows the item approved (`QueueItem.mediaId`). Lands as **the
    waiting tile**.
  - `failed=sheet`: KEPT. `upload/failure-sheet.tsx` opens itself at the END of a run, one line per file
    with the server's own sentence and a Retry, over one Retry all. Lands as **the failure sheet**.
  - `landing=sweep`: KEPT, and made ONE grammar as his note asks: `lib/shared/arrival.ts` +
    `components/shared/arrival.css`, `data-arrived` / `data-landed` written by the one grid. Lands as **the
    arrival grammar**.
  - `words=read`: KEPT. Every sentence the act says at `text-reading`.
  - The board retires: its directory, its `registry`/`boards`/`touchpoints` lines. Its eight
    `sandbox/overtaken.ts` entries were already gone upstream.
- Calls his to overrule on the alias, one line each:
  - **The review step at all.** It is a whole extra tap between picking and sending; his words asked for it
    ("It may be helpful to preview the photos before upload") but he has not seen it.
  - **The terms line's words** ("Photos and videos, up to 10 GB each."), and whether it earns its place at
    all - his own note was "Terms either need a better design or to be scrapped", and this is the smallest
    true thing that line can say.
  - **The stack's ghost edges and its count wording** ("N to go", and no count at all for a single file).
  - **The waiting line's words** ("Waiting for the host"): the board said "Waiting for Maya". The host's
    name would need a new prop chain through the album for one word; his call.
  - **Failures are never drawn as tiles**, and the "Sent, waiting for host approval" toast is gone.
  - **16 px** for every sentence the act says (the board said 15; the ladder has no 15 rung). His to drop to
    the 14 rung.
  - **The failure sheet's shape**: Retry all ABOVE the list (the brief's word) rather than paired with "Not
    now" in the footer as the board drew it, and only ONE retry when a single file failed.
  - **The reading pane's darkness** on the stack and the waiting tile: glass at the marks' blur with its
    tint re-pointed to 0.34, measured 4.78:1 for white over a pure-white photograph. His "maybe a darker
    overlay" is satisfied by measurement rather than by eye.
- The help articles this lane makes stale, one line each (a `help-sync` lane rewrites them): any article
  describing the guest upload as "tap Add and the phone's picker opens" (the sheet and its review step are
  new), and any describing a failed upload as a toast or an in-tile "Tap to retry" (it is an end-of-run
  sheet now). `content/help/` belongs to `voice-wiring`, so nothing here was touched.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none in this lane. ONE is proposed for the
  Orchestrator, under Deferred: `get_event_by_qr_token` returning `max_upload_bytes` so the terms line can
  say the host's own number.
- Verified locally, at 375 and at 1440, on `pnpm dev -p 3132` (captures in the lane's scratchpad):
  - Demo event: the sheet's two rows and the terms line; six picks reviewed with an undrawable `.mov` drawn
    as the named stand-in (name + size); one pick removed and the header recounting to "Send these 5?"; a
    twelve-file batch drawing exactly ONE stack with "8 to go" and the dock badge at "8 uploading"; at
    1440 the same sheet as a right-hand side panel with the review grid at five columns.
  - The sweep, measured rather than eyeballed: `data-landed` carried by **at most one tile at a time**
    across a ten- and a twelve-file batch (it was **two** before the hold was made exclusive), the
    pseudo-element running `pr-arrival-sweep` for `0.9s` off `--arrival-sweep-ms`, and everything clear at
    the run's end.
  - A REAL disposable event (`guest-view-menu QA`): a real upload run failing at the PUT (localhost is not
    allow-listed for R2, which is exactly the failure this needed) opened the failure sheet by itself -
    "2 files did not go", the host's name, Retry all, a thumbnail + name + "Network error during upload."
    + Retry per line, "Not now" - and Retry all re-queued both (the stack returned, the dock read "2
    uploading") and the sheet re-opened when that run ended. No orphan `media` rows were left (checked).
  - NOT exercised locally, and why: the WAITING tile (needs a `hold_for_approval` event with anonymous
    uploads allowed; the Orchestrator sets the disposable event's moderation as its host) and the GLOW
    (needs a second device's arrival through the poll). Both are contract-tested; the glow's CSS is a
    verbatim move of the shipped rule.
- Look at first: the add sheet at 375 on a real phone (the camera row is the one thing no emulator can
  prove), then a twelve-file batch's single stack and its one sweep, then a file over the event's cap so
  the failure sheet says the server's real sentence.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-21). The upload act was rebuilt at both ends: every Add now
opens our own sheet naming the two intents (two inputs, because `capture` cannot be both, each clicked
inside the gesture Safari requires), the picker returns into that sheet as a review step where an
accidental pick costs one tap, and a run that refuses anything ends on a sheet listing each file with the
server's own sentence and a Retry. In the album, a pick in flight became ONE stacked tile with everything
it says on a pane measured at 4.78:1 for white, a held upload finally draws a tile that waits instead of
vanishing, a refused file draws nothing at all, and both upload toasts retired. The arrival became one
grammar for a guest and a host alike - `data-arrived` and `data-landed` written by the one grid off
`lib/shared/arrival.ts` and `shared/arrival.css` - with the sweep made exclusive after two tiles were
measured carrying it at once. The `guest-upload` board retired with its files.
