---
track: overtaken-4
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "ece02b97"          # the launch-prep SHA the branch was cut from
board: none            # lab infrastructure: the judgment lines for the closing sitting's second batch; no board of its own
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

# lp/overtaken-4

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- THE REVIEW SHEET FIRST: his verdicts beside the option pictures, `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b97eafa6-025b-4736-847b-48f80c42ec24/scratchpad/review-sheets/c75734b9-second.html` (open it in a browser; your board's section); the plan's words for this lane are in `/Users/gibby/.claude/plans/let-s-put-a-pause-gentle-widget.md` (the second batch); his notes verbatim in `docs/design/rulings.md` ("the closing sitting's second batch").
- The judgment pass for the thirteen verdicts (the list above is the starting point): every reached ask on the 17
  standing boards opened and read against the ruling and the drawings, one line each ("stands: ..." or
  "concedes: ..."); the seven overrides this batch recorded (the `_window.json` echoes) reconciled in the map: an ask
  answered is no longer overtaken, its entry removed or closed as `overrode` per the mechanism's own convention; an
  ask reached only by a HELD ruling keeps the held grammar. Owns `src/app/(dev)/design/sandbox/overtaken.ts` and its
  test only. Reads the five specs and ledgers, rulings.md, `touchpoints.ts`, `node usher/kit/board-card.mjs --desk`.
  Verify: the test green; `lab:smoke` whole; `lab:demo` on one affected board pressing a badged step; the gate.

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

- **The one cross-wire this pass found, and the five wiring lanes all sit on it.** `app-pricing.object=sheet` is,
  in the option's own words, "a sheet in a hand, a dialog at a laptop"; `guest-shape` r2 ruled that no centred
  float survives at a desk and the one responsive Sheet is a right-edge panel there. Both are his, four days
  apart, and they describe different objects at 1440. **Recommended:** the one Sheet's desk posture wins (a
  right-edge panel) and `object=sheet` is read as "the one responsive Sheet, in its own two postures", which is
  what every other dialog on the product now wears; the pricing surface is then the same primitive as the guest's
  four dialogs, `profile-page`'s quick look and the door's shell. Recorded in the map on the two asks that turn on
  it (`media-viewer.opening`, `profile-page.view-all`) so the walk sees it, and NOT resolved here: this lane wires
  nothing, and `app-pricing-wiring` and `hub-wiring` need one answer between them.
- **The date a badge wears for this batch.** His sitting was 2026-09-20, ~22:45 EDT; the ledgers stamp UTC, so
  `seed-avatar` r2 and `app-pricing` r1 opened "2026-09-21" in `docs/reviews/`. **Taken:** "20 Sep" on all five
  constants, matching `rulings.md`'s section and the closing sitting's first batch, with the UTC drift named in a
  comment above them. A reader following a badge to the record lands in the right section.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none: this lane owns two files in the sandbox and no `docs/systems/` fact moved.

## Deferred (ROADMAP one-liners, bucket named)

- none.

## Handoff (replaces the chat report)

- Board commit `6451ad3a` (the judgment pass, both owned files plus the regenerated rules artifact); sync-merge
  `fbe2030f` (`origin/launch-prep` had moved four commits, to `6a8bf56e`; the merge was clean, no conflict).
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` ok (0), specimens ok (0, 140 specimens
  on 101 entries), `pnpm typecheck` ok (0), `pnpm lint` ok (0, "8 problems (0 errors, 8 warnings)", the known
  baseline), `pnpm test` ok (0, 300 files, 3137 passed / 1 skipped), `pnpm build` ok (0, 255 static pages).
  `pnpm lab:smoke --base http://localhost:3136` ok (0, 422 checks, 0 failing). `pnpm lab:demo --board press-page
  --base http://localhost:3136` ok (0, 7 steps, 0 failing) on the board this pass reached for the first time, its
  badged step `press-page.the-arc` among them. Logs in the lane's scratch dir, `s-*.log`.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/overtaken.ts`,
  `src/app/(dev)/design/sandbox/overtaken.test.ts` (both owned) and `src/app/(dev)/design/rules/rules.generated.json`
  (the exception: a generated index, regenerated by `pnpm design:rules` because the test file's length moved twelve
  line numbers; never hand-edited, and `docs/design/library.md` came out identical).
- **Fourteen questions judged for the first time, one line each** (every one a `stands`; no concession this pass,
  because a marketing-and-pricing batch rarely answers another board's option word for word):
  - `guest-verify.unproven`: the face a mark would ride is a blended mesh now (seed-avatar r2), so a small dot has
    a busier ground to clear.
  - `guest-verify.allowance`: a bound that only refuses is ruled out (app-pricing r1, "Convert, not block"), so a
    cap has to arrive as an offer; its size is still unpicked.
  - `first-event.limit`: a refusal keeps its door in the app and returns to the control it stopped, which kills the
    toast option outright.
  - `media-viewer.next`: he refused a swipe row for plans and kept the gesture for galleries (pricing-page r2),
    which is what the viewer's neighbours are.
  - `reel-studio.wait`: the modal he took is for a moment worth feeling, not a minute of waiting.
  - `reel-studio.guests`: he took a still over a running engine at the site's own door (demo-event r2), the case
    against paying for a player on first paint.
  - `export-flow.cap`: a refusal that names no number is ruled out, so the limit speaks before it bites.
  - `help-center.hub`: the short surface with the rest one click away is this ask's doors option, argued elsewhere.
  - `help-center.article`: he took drawn pictures over the product's real screens for the tour, and a how-to is the
    one place the real screen is the point.
  - `site-chrome.foot-alone`: one more page reaches the footer having closed on questions rather than an invitation.
  - `site-chrome.foot-phone`: the demo is one object now rather than a pile, so a phone takes it whole or keeps a line.
  - `loose-ends.review-photo`: he judges a picture by whether it carries at the size it is drawn, which is the ask.
  - `contact-page.receipt`: a box in the page is ruled the flat way to confirm something worth feeling.
  - `press-page.the-arc`: he re-cut a marketing page into overview, detail, then questions. The desk's LAST board,
    reached for the first time by anything.
- **Fifteen lines gained a clause** behind the judgment an earlier pass wrote, never replacing it:
  `first-event.landing` `.hand` `.empty`, `media-viewer.opening` `.who` `.wayout`, `reel-studio.styles`,
  `export-flow.chips`, `help-center.from-product`, `site-chrome.foot-after`, `profile-page.view-all` `.way-back`,
  `privacy-hero.concept`, `loose-ends.faq-look`, `contact-page.page`. Two now carry three clauses
  (`first-event.landing`, `.empty`), so `MAX_CLAUSES` rises by exactly one, to three.
- **Counts per board after the pass** (`node usher/kit/board-card.mjs --desk`): guest-verify 2, first-event 7,
  guest-upload 8, media-viewer 6, host-curation 7, reel-studio 8, export-flow 6, admin-triage 8, help-center 5,
  emails 4, site-chrome 3, profile-page 3, privacy-hero 1, album-motion 1, loose-ends 5, contact-page 2,
  press-page 1. Seventy-seven entries on seventeen standing boards, up from seventy on sixteen.
- **Stands and concedes:** 14 stands, 0 concedes this pass (map totals: 69 stands, 7 concedes, 1 held).
- **The held list is one:** `first-event.first` (`gate=after`), which keeps the held grammar and no judgment.
  `seed-avatar.look` carried the other (`badge=mark`) and he ANSWERED it outright with `look=mesh`, so that hold
  was spent without round two ever running: the second way a hold ends, now written into the file's contract and
  its test.
- **The seven overrides closed,** each matched to its `_window.json` echo and removed with the ask it named
  (the `app-vocabulary` retirement precedent, since all five boards retire at their wiring): `seed-avatar.look`
  (over guest-verify), `app-pricing.object` (over guest-shape), `.first` (over app-door), `.carry` and `.pass`
  (over pricing-page), `.doors` (over app-shape), `.words` (over app-vocabulary). Both retired sections keep a
  comment block saying what happened, so nothing reads as dropped.
- **Asks dropped against the plan's list** (the plan named no asks; these are the near-misses I read and did not
  badge, so the next pass need not re-read them): `first-event.venue` (the demo's frame is a web affordance, and
  a table card's composition is too thin a reach to spend a badge on; it is also the one ask keeping the desk's
  own join provable, `_desk/queue.test.ts` needs one unreached ask on this board); `profile-page.quick-look` (a
  richer face does not move where a quick look opens); `admin-triage.look` (already conceded to the portal's own
  list-beside-the-message); every ask on `guest-upload` and `host-curation` (a marketing, pricing, onboarding and
  avatar batch reaches neither).
- Calls his to overrule on the alias, one line each:
  - The cross-wire above is recorded, not resolved: `object=sheet` is read as the one responsive Sheet in its two
    postures, and the badge says a centred surface is "alive again at a desk" so he can rule either way.
  - "Convert, not block" is generalised past a host's locked control to a guest's allowance cap and the download
    limit: his note was about a paywall, and these two are the same shape (a refusal that offers the way through).
  - The gloss floor in the test rose from 15 to 40 (the real count is 57 of 77): a floor the map had quadrupled
    past proved nothing.
  - `rules.generated.json` is committed rather than left stale, so the Library's contract links point at the right
    lines.
  - A line carrying three clauses is about seven lines of badge at 375 (verified). That is his own append-never-
    replace contract working; if it reads as too much, the fix is a fold, never a rewrite of the judgments.
- The help articles this lane makes stale: none (nothing shipped changed).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `/design/lab/press-page?session=press-page.the-arc` at 1440, the desk's last board carrying its
  first badge ever, with "The ruling stands" primed in the dock; then
  `/design/lab/first-event?session=first-event.empty` at 375, where a judgment now reads with three rulings stacked
  behind it.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-20). The fourth judgment pass read the closing sitting's second
batch, thirteen verdicts on the five boards that retire with it, against every open ask on the seventeen that
stand: fourteen questions judged for the first time (all `stands`, including the desk's last board, `press-page`,
reached by anything for the first time), fifteen lines gaining a clause behind the judgment an earlier pass wrote,
and the clause cap rising by exactly one to three. The seven badges his own answers closed were removed with the
asks they named, each matched to its `_window.json` echo, and both retired sections keep a comment saying what
happened. `seed-avatar.look` showed the second way a hold ends, spent by an outright answer rather than by round
two, which is now written into the file's contract and its test.
