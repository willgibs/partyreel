---
track: app-pricing-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "ece02b97"          # the launch-prep SHA the branch was cut from
board: app-pricing     # wired by this lane; the board retires (its eight asks ruled whole)
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/pricing/
  - src/components/app/user-menu.tsx
  - src/components/app/checkout-button.tsx
  - src/components/app/manage-billing-button.tsx
  - src/app/(app)/dashboard/upgraded-toast.tsx
  - src/app/(app)/dashboard/page.tsx
  - src/app/(app)/account/page.tsx
  - src/app/(app)/account/plan-card.test.ts
  - src/components/app/event-settings/event-password-control.tsx
  - src/components/app/event-settings/event-settings-form.tsx
  - src/components/app/event-settings/visibility-section.tsx
  - src/components/app/event-settings/uploads-section.tsx
  - src/components/app/event-slug-control.tsx
  - src/components/app/event-share-sheet.tsx
  - src/components/app/create-event-wizard.tsx
  - src/components/app/restore-event-button.tsx
  - src/components/app/recently-deleted-grid.tsx
  - src/components/app/dashboard/storage-meter.tsx
  - src/app/api/stripe/checkout/route.ts
  - src/app/(dev)/design/sandbox/app-pricing/
  - docs/systems/billing-caps.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/constants/tiers.ts
  - src/lib/constants/marketing-voice.ts
  - src/components/ui/sheet.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/tooltip.tsx
  - src/lib/stripe/
  - src/app/(dev)/design/sandbox/overtaken.ts
  - docs/reviews/app-pricing.json
  - docs/design/rulings.md
---

# lp/app-pricing-wiring

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- THE REVIEW SHEET FIRST: his verdicts beside the option pictures, `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b97eafa6-025b-4736-847b-48f80c42ec24/scratchpad/review-sheets/c75734b9-second.html` (open it in a browser; your board's section); the plan's words for this lane are in `/Users/gibby/.claude/plans/let-s-put-a-pause-gentle-widget.md` (the second batch); his notes verbatim in `docs/design/rulings.md` ("the closing sitting's second batch").
- The eight rulings above, built as one object and its doors. THE OBJECT: `src/components/app/pricing/` (new):
  `pricing-sheet.tsx` on the responsive Sheet (a bottom sheet in a hand, a right-edge panel at a desk) opening on the
  TRIGGER (`trigger: { kind: "locked", feature } | { kind: "room", needed } | { kind: "plan" }`: a locked feature names
  it, running out of room opens on the smallest plan that clears it, a Pro host is told she subscribes already with
  Manage billing), carrying the two cards (Free beside one Pro size at one cadence, a button each, the Pro card's
  three short benefit lines from the ruled voice), the Pass line with Buy, and the quiet foot ("See every plan",
  `/pricing` in a new tab); `lock-chip.tsx` (the one component behind the four gated sentences: a button showing a
  lock, the control's name and the plan, a tooltip saying why and what, opening the sheet on its trigger; the app
  vocabulary's rule); `welcome-to-pro.tsx` (the modal after a purchase: the receipt's facts, the plan's name, one
  primary door: "Back to what you were doing" or "Go to your dashboard"). THE DOORS: the user menu gains "Plan and
  storage" above Account carrying the plan's name (a door to the account page's Plan card); the Plan card on
  `/account` gains Upgrade (opens the sheet) and the pass line (the card is billing's home; no dedicated page, his
  test answered in the Handoff); the four gated sites wear the chip (password-protected albums, the custom link, the
  password setting, video uploads) and the events cap's refusal opens the sheet on `room`; the checkout return: the
  Stripe success URL carries `next` as an allow-listed same-origin app path (the locked control's page with a
  `?welcome=pro` marker), the page reads the tier from the server after the webhook wrote it and shows the modal once
  (the existing `upgraded-toast.tsx` folds into it), a purchase started anywhere else returns to the dashboard with
  the modal. THE INVARIANTS THAT BIND (from `billing-caps.md`): the Stripe webhook is the sole writer of `tier` and
  `storage_cap_bytes`; nothing in the sheet or the modal trusts the client or the URL for entitlement; the prices come
  from `tiers.ts` (one source); Stripe stays TEST; `next` is validated against a same-origin app path allow-list
  (never an open redirect); the pass purchase goes through the existing checkout with the pass's price id.
- THE FACTS the lane builds on: the Free event cap is ONE (`MAX_EVENTS.free = 1`), so "running out of room" is a
  second event; the pass is sold in the app only as a RENEWAL today (`CheckoutButton planId="event_pass" renewal` on
  the Plan card and the storage meter's popover), a first pass purchase exists only on `/pricing`: the pass line's
  Buy goes through the same checkout route with the pass's plan id; the checkout route's `success_url` is
  `/dashboard?upgraded=1` (`src/app/api/stripe/checkout/route.ts:175`) and `dashboard/page.tsx` renders
  `UpgradedToast` from `?upgraded=1`; the four gated sentences live at `event-settings/event-password-control.tsx:78-90`
  (threaded from `event-settings-form.tsx:65` through `visibility-section.tsx:90`), `event-slug-control.tsx:172-186`
  (locked by `create-event-wizard.tsx:307` and `event-share-sheet.tsx:160`), `event-settings/uploads-section.tsx:190-219`
  ("Upgrade to allow video"); the cap refusals are toasts with an Upgrade action at `create-event-wizard.tsx:107-110`,
  `restore-event-button.tsx:26-31`, `recently-deleted-grid.tsx:67`; `isSettingLocked` is a flat free-or-paid rule;
  the storage meter's popover links "Need more?" to `/pricing` (`dashboard/storage-meter.tsx:94-99`): it opens the
  sheet on `room` now. The reel's watermark gate (`reel-panel.tsx`, the studio page) is `reel-studio.blocked`'s open
  ask: untouched. `plan-card.test.ts` pins the Plan card's read path and its `searchParams` type: extended, never
  loosened.
- Owns, BY FILE: `src/components/app/pricing/` (new), `src/components/app/user-menu.tsx`, `src/components/app/checkout-button.tsx`,
  `src/components/app/manage-billing-button.tsx`, `src/app/(app)/dashboard/upgraded-toast.tsx`, `src/app/(app)/dashboard/page.tsx`
  (the `?upgraded` read and the modal's mount only), `src/app/(app)/account/page.tsx` and `src/app/(app)/account/plan-card.test.ts`,
  `src/components/app/event-settings/event-password-control.tsx`, `event-settings-form.tsx`, `visibility-section.tsx`,
  `uploads-section.tsx`, `src/components/app/event-slug-control.tsx`, `src/components/app/event-share-sheet.tsx`,
  `src/components/app/create-event-wizard.tsx`, `src/components/app/restore-event-button.tsx`, `src/components/app/recently-deleted-grid.tsx`,
  `src/components/app/dashboard/storage-meter.tsx`, `src/app/api/stripe/checkout/route.ts`, `src/app/(dev)/design/sandbox/app-pricing/`,
  `docs/systems/billing-caps.md` (the surface's facts in place; one home). Reads: `src/lib/constants/tiers.ts`, `marketing-voice.ts`, `ui/sheet.tsx`,
  `ui/dialog.tsx`, `ui/tooltip.tsx`, `src/lib/stripe/*`, the ledger, rulings.md, the overtaken lines for its seven
  asks, the sheet.
- Tests (`// @contract-for:`): the sheet opens on each trigger kind with the right first view (locked names the
  feature; room picks the smallest clearing plan; a Pro host sees Manage billing); the chip is a button with an
  accessible name naming the feature and the plan, and opens the sheet; `next` validation refuses an off-origin or
  non-app path; the modal renders once from the server's tier; the four gated sites render the chip (the four
  sentences gone); `lab:smoke` whole; the gate. Red-team: the checkout itself is Will's on the alias (Stripe TEST,
  his card); signed out nothing shows. His to overrule: the Pro card's three lines; "Plan and storage" as the row's
  words; the modal's door; the chip's tooltip words; no Billing page.

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

- None blocked the build. Every open call was taken on the brief's recommendation and is listed under "Calls his to
  overrule" below, with the reasoning, so he can reverse any of them on the alias in one line.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/billing-caps.md`, the ROLE line: the in-app pricing surface and its return path are now facts this doc owns.
- `docs/systems/billing-caps.md`, "Where it lives": one bullet for `src/components/app/pricing/`, naming all five modules.
- `docs/systems/billing-caps.md`, "Invariants": TWO new ★ bullets. (1) Nothing in the surface may DECIDE an entitlement:
  the tier is context for which sentence renders, the receipt's `applied` is `tier !== "free"` read at render (never the
  URL marker), the route re-resolves from `profiles`, the RPCs gate again. (2) `success_url` is an exact-shape ALLOW-LIST
  whose members are exactly the pages that mount `WelcomeToPro`, so adding a shape means mounting the modal there.
- `docs/systems/billing-caps.md`, the video-gate gotcha: the client mirror line now names `LockChip feature="video"` and
  records that the three gated capabilities are worded in exactly one place (`pricing/triggers.ts`).

## Deferred (ROADMAP one-liners, bucket named)

- Now: `RestoreEventButton` and `RecentlyDeletedGrid` accept an optional `tier` that no caller passes yet (their parents,
  `dashboard/events-section.tsx`, `dashboard/trash-section.tsx` and `event-feed/event-gallery.tsx`, are outside this lane).
  Until threaded, an Event Pass holder hitting a cap refusal reads the Free-host headline rather than the pass one. Three
  one-line props.
- Now: the pricing sheet, the chip and the welcome modal have `for` lines and 31 contract guards but no Library SPECIMEN
  (`src/components/app/pricing/` is not a `COMPONENT_DIRS` directory, and a live demo would put a real Checkout door in
  the lab). If Will wants to judge the object without signing in, a lab stage is a small follow-up.
- Now: the sheet's Pro card offers ONE size at ONE cadence by his `carry` ruling, so the yearly price (two months free)
  is reachable only through /pricing or the portal. Worth watching once real hosts buy.

## Handoff (replaces the chat report)

- BOARD commit `6191ba2b` (the contracts, the board's retirement, billing-caps' two invariants); SYNC-MERGE commit
  `5a636358` (merged `origin/launch-prep` at `a368d0a0`; one conflict, `sandbox/overtaken.ts`, resolved to THEIRS:
  `overtaken-4` had already removed the six `app-pricing.*` badges and left the tombstone that records why, which is
  better than this lane's bare deletion). Pushed.
- **Gates on the synced tree**, each on its own exit code: `pnpm design:rules` exit 0 (192 components, 1395 contracts,
  18 policies) · specimen collector exit 0 (140 specimens on 101 entries) · `pnpm typecheck` exit 0 · `pnpm lint`
  exit 0, 8 warnings (the known baseline, unchanged) · `pnpm test` exit 0, **305 files, 3195 passed, 1 skipped** ·
  `pnpm build` exit 0, **255 pages** · `pnpm lab:smoke --base http://localhost:3135` exit 0, **423 checks, 0 failing**
  (`app-pricing` gone from its board list, which is the retirement showing). No `lab:demo`: this is a production lane
  and its board no longer exists. Logs in the lane's scratch directory.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`) = the owned paths, the house-convention
  registration files, and FOUR exceptions, each listed with why:
  - `src/app/(app)/layout.tsx` — ONE line: `planName={TIER_NAMES[toBillingTier(menu.tier ?? DEFAULT_TIER)]}` on
    `<UserMenu>`. His `doors=menu` ruling is "the row carries the plan's NAME", and the layout is the only place that
    renders the menu.
  - `src/lib/db/queries/profile.ts` — three lines: `getProfileMenu` selects and returns `tier`, so the line above has
    a value. The narrow menu read the whole host app already makes on every page; no new query.
  - `src/app/(app)/dashboard/[eventId]/page.tsx` — one searchParam and one mount. `back=finish` is not built without
    it: the four locked controls all live on this page, so it is the page Checkout returns to.
  - `content/help/custom-event-link.mdx` — one sentence. It quoted two strings this lane deleted inside `<UiLabel>`,
    and `help-ui-labels.test.ts` (the mock-fidelity gate) went red. Rewritten to the shipped chip; still listed for
    `help-sync` below.
  - NOTE, a manifest path drift rather than an exception: `event-password-control.tsx` and `event-settings-form.tsx`
    are at `src/components/app/`, not `src/components/app/event-settings/`, and `event-share-sheet.tsx` is at
    `src/components/app/share/`. The manifest's tree was `69a9a177`; the files moved before the cut. The real paths
    were edited (`event-settings-form.tsx` needed nothing).
- **The items, one line each:**
  - `object=sheet`: the ONE responsive `Sheet` (`responsive`, so a bottom sheet in a hand and a right-edge panel at a
    desk), both postures seen at 375 and 1440; lands as `src/components/app/pricing/pricing-sheet.tsx`.
  - `first=trigger`: three trigger kinds, and each was read on the real surface. A locked control leads with its own
    feature ("Video is on every paid plan"); `room` resolves through the SAME `smallestProFor` the marketing
    calculator uses, so 300 GB opened on Pro 500 GB and never higher; a Pro host gets "You are on Pro already" with
    Manage billing and NO card to buy.
  - `carry=cards`: Free beside one Pro size, one cadence, a button each, and the absence is pinned (no slider, no
    switch, no radios). His note's "couple of benefits" is three lines on the Pro card, every number from `tiers.ts`.
  - `learn=foot`: "See every plan" opens `/pricing` in a new tab, quiet, under the buttons.
  - `pass=line`: one line and a button, at every tier that may buy one; "Add a pass" for a holder, because passes stack.
  - `doors=menu`: "Plan and storage" above Account carrying the plan's name, pointing at `/account#plan`; the Plan card
    gained Upgrade, the pass line and that anchor. Billing had no door in the app that was not a refusal.
  - `words=chip`: `lock-chip.tsx`, one component behind all four sentences, a real button with a tooltip saying why and
    what. His "Convert, not block" is the contract test: it is pressable at every feature, never disabled.
  - `back=finish`: `success_url` now carries the caller's `next`, validated by an exact-shape allow-list; the locked
    control's page reopens its own sheet (`?room=settings`) with `welcome-to-pro.tsx` above it; a purchase with nothing
    to finish lands on the dashboard with the same modal. `upgraded-toast.tsx` is retired into it.
  - The eleven `/pricing` doors in the host app are now zero: `git grep '/pricing' -- 'src/app/(app)' src/components/app`
    returns only comments explaining why they left.
- **Calls his to overrule on the alias, one line each:**
  - The Pro card's three benefit lines: "Video from you and every guest", "Unlimited events, not just the one",
    "Password locks, custom links, 60-second reels" (his "phrased better"; the events line branches on `MAX_EVENTS.free`).
  - "Plan and storage" as the menu row's words, with the plan name as a trailing muted label and a `CreditCard` glyph.
  - The modal's door: "Back to what you were doing" on the event page (a close, the reopened sheet is behind it),
    "Go to your dashboard" on the dashboard and on `/account`.
  - The chip's tooltip words, three of them, in `pricing/triggers.ts` (`why` + `unlocks`), e.g. "On Free, anyone holding
    the link can open the album. Password locks are on every paid plan."
  - The chip's face: a lock, the control's name, and "Pro" in a fainter ink. It says Pro rather than "any paid plan"
    because the row is two inches wide; the tooltip carries the fuller truth.
  - **The Free card is dropped for an Event Pass holder** (found by eye, not by test): his `carry` pair is the FREE
    host's moment, and a pass holder cannot move TO Free (it is what happens when the pass lapses), so drawing it
    beside Pro sold them a downgrade. They see the Pro card full width with the pass line under it.
  - Two doors on the dashboard page that the brief scoped narrowly ("the `?upgraded` read and the modal's mount only")
    were converted anyway: the at-cap banner's "upgrade for more" and the over-capacity banner's "See plans" are
    literally the `room` trigger, and leaving two `/pricing` links on the home would have been the one visible
    inconsistency. Both are inside a file this lane owns. Easy to revert.
  - No Library specimen for the three components (see Deferred): a live demo would put a real Checkout door in the lab.
- **What a dedicated Billing page would need to justify itself** (his `doors` note: "If we're going to have a dedicated
  'Billing' page (better name), we need to ensure the page has enough settings to justify it. Else we can drop it back
  into the account page."). It is dropped back into the account page, and here is the honest list of what exists today
  versus what a page would need. TODAY the Plan card holds five things: the plan and its capacity, events used of the
  cap, storage used of the cap, Upgrade / Change plan, Manage billing, Renew Event Pass, and the pass line. That is one
  card, and the Stripe Billing Portal already owns the six moves a billing page would otherwise exist for (the payment
  method, the size change, monthly-to-yearly, cancellation, invoices, the billing address). A page earns itself when
  Partyreel owns state Stripe does not, and there are exactly four candidates: (1) a purchase and pass LEDGER rendered
  in-app (`event_passes` rows with their windows, which nobody can see today and which the pass-to-Pro credit depends
  on); (2) a storage BREAKDOWN by event, so "you are at 97 percent" becomes actionable rather than alarming; (3)
  spending and cap ALERTS a host can configure (an email at 80 percent, say), which is a preference we would store;
  (4) a team or second-seat notion, if one ever exists. One of those is not a page. Three are. Recommendation: keep it
  on the account page until the pass ledger exists, then revisit, and call it "Plan and billing" rather than "Billing",
  which is the word the menu row already uses.
- **The help articles this lane makes stale**, one line each (a `help-sync` lane rewrites them):
  - `custom-event-link.mdx` — FIXED here because it broke the gate (the two dead `<UiLabel>` quotes); re-read it anyway.
  - `password-protect-your-event.mdx` — describes the Free wall on the password panel, which is now a chip.
  - `event-settings-explained.mdx` — the settings sheet's video row and password line both changed shape.
  - `what-you-can-upload.mdx` — the video gate's wording in the settings sheet.
  - `upgrade-downgrade-or-cancel.mdx` — EIGHT references to "the pricing page" as the place buying happens; it is now
    the sheet, from a lock chip, the Plan card, the storage meter or a cap refusal. This is the big one.
  - `what-the-free-plan-includes.mdx` — "Upgrading is instant from the pricing page".
  - `what-happens-when-storage-fills-up.mdx` — "Move up a plan or a Pro size from the pricing page".
  - `payments-receipts-and-invoices.mdx` — "Checkout opens when you pick a plan on the pricing page", and its
    `<UiLabel>Manage billing</UiLabel>` paragraph says the meter is where it appears; it is also on the Plan card now.
  - `pro-vs-event-pass.mdx` — its card action still sends people out to compare.
  - `your-dashboard-explained.mdx` and `storage-plans-and-limits.mdx` — the meter's "Need more?" no longer leaves.
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none. No migration, no new price, no env. The
  checkout route's only change is `success_url`, and the Stripe TEST catalog is untouched.
- **Look at first** (all of it signed in on the alias; localhost cannot pass the (app) gate, so the eye below was taken
  on a bare uncommitted stage and the rest is carried by 60 contract assertions):
  1. THE CHECKOUT ROUND TRIP, which is the one thing no test can reach. From a Free host's event settings, press the
     Password lock chip, buy Pro with the TEST card, and land back on that same event with the settings sheet reopened
     and "Welcome to Pro" above it. Then repeat from `/account` (Upgrade) and confirm the dashboard modal for a
     purchase with nothing to finish.
  2. The webhook race, deliberately: the modal should say "Payment received" for a beat and then turn itself into the
     real receipt without a reload. If it never turns, the bounded poll gave up after four tries and the sentence is
     still true, which is the designed failure.
  3. The four chips at 375, in the settings sheet and the share sheet, with a thumb: they are 28 px tall, and the
     tooltip is a hover affordance a phone does not have (the accessible name carries the same words, and the press
     opens the sheet, so nothing is lost; worth his eye anyway).
  4. The user menu's new row at 375: the panel is w-56 by a measurement (the theme submenu clearing a 375 screen), and
     the plan name is a trailing label inside it.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-21). `app-pricing-wiring` wired all eight of the closing sitting's second
batch rulings and retired the board. Pricing now opens INSIDE the app: one responsive Sheet led by the reason it opened
(a locked feature names itself, running out of room resolves through the marketing calculator's own `smallestProFor`, a
subscriber is told she subscribes and handed the portal), carrying Free beside one Pro size with three benefit lines,
the Event Pass on a line, and a quiet foot to `/pricing` in a new tab. One `LockChip` replaced four sentences that
worded one rule four ways, as a pressable button with a tooltip rather than a dead end ("Convert, not block"). Billing
got a door that is not a refusal (Plan and storage above Account, the account page's Plan card as its home, no
dedicated page), and Checkout now returns to the control that refused you with a welcome-to-Pro modal, through an
exact-shape same-origin allow-list on `success_url`. The eleven `/pricing` doors in the host app are zero.
