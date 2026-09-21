---
track: overtaken-5
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "40e2c2c1"          # the launch-prep SHA the branch was cut from
board: none            # lab infrastructure: the judgment lines for the closing sitting's third batch; merges first; no board of its own
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

# lp/overtaken-5

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- THE REVIEW SHEET FIRST: `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b97eafa6-025b-4736-847b-48f80c42ec24/scratchpad/review-sheets/c75734b9-third.html` (16 verdicts pictured from the fresh capture of `c75734b9`): open your board's section first, each of his verdicts beside the picture of the option he chose, his sentence verbatim.
- This lane merges BEFORE either retirement (`overtaken.test.ts:108-116` refuses a key naming a board no longer in
  `registry.ts`; the house precedent removed the `app-vocabulary.*` keys in `195f0596` before the retirement merged); a
  wiring lane that hands off earlier waits for it, and each wiring lane removes its own board's entries under the
  retirement exception so its branch's gate is green meanwhile (identical deletions merge clean).
- The judgment pass for the sixteen verdicts: every open ask on the FIFTEEN standing boards (the desk after these two
  retire: `guest-verify`, `media-viewer`, `host-curation`, `reel-studio`, `export-flow`, `admin-triage`, `help-center`,
  `emails`, `site-chrome`, `profile-page`, `privacy-hero`, `album-motion`, `loose-ends`, `contact-page`, `press-page`) read
  against the ruling and the drawings, one line each ("stands: ..." or "concedes: ..."), the badge with the date; the
  fifteen overrides his answers made closed and their entries removed with the retiring boards (the `app-vocabulary`
  precedent), the two boards' comment blocks saying what happened; the SPENT hold (`first-event.first`, `gate=after`)
  recorded as the second way a hold ends (the `seed-avatar.look` precedent), so the identity board's held rulings now
  reach nothing and the file's contract says so. The starting list: `media-viewer.opening`/`.next` (the sweep and the
  glow as the album's arrival grammar; the review step's thumbnails), `host-curation.arrivals`/`.queue` (the live hub, the
  waiting tile's host side), `reel-studio.guests`/`.wait` (the stack tile's idiom for a wait), `export-flow.means`/`.cap`
  (the terms line states a limit before it bites; the print stock as an export), `help-center.hub`/`.article` (the
  wizard's two steps, the print page: how-tos to rewrite), `emails.moments`/`.code` (the beat's Share door, the printed
  code), `site-chrome.foot-phone` (the print door), `profile-page` (nothing), `guest-verify` round two (`allowance`,
  `unproven`: the waiting tile is drawn now; the review step is where an allowance could be said). Owns
  `src/app/(dev)/design/sandbox/overtaken.ts` and `overtaken.test.ts` only. Reads the two specs, the two ledgers, rulings.md,
  `touchpoints.ts`, `node usher/kit/board-card.mjs --desk`. Verify: the test green; `lab:smoke` whole; `lab:demo` on one
  affected board pressing a badged step; the gate.

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

- none for Will. One for the Orchestrator, answered in the lane and listed under "Calls his to overrule" below: the
  brief's deletion of the fifteen badges fires `_desk/queue.test.ts`'s own guard, because that block proved the desk's
  real join on `first-event` BY NAME and a board answered whole loses every badge at once. Repaired in place rather
  than handed back, on the `overtaken-3` precedent (that lane held a granted exception on this same file, for this
  same reason); both wiring lanes inherit the repair through their pre-handoff sync and neither has to find it.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. This lane owns no `docs/systems/` fact: the desk's mechanism documents itself in `overtaken.ts`'s head, which
  is where the two findings below are written.

## Deferred (ROADMAP one-liners, bucket named)

- Now: the desk's overtaken join is proved against a real board picked from the map (`_desk/queue.test.ts`), and it
  needs a board with a badge, an unreached ask and an "as today" option. Seven qualify today; when the desk closes
  there will be none, and that block moves to the fixture every other test there already uses.

## Handoff (replaces the chat report)

- Board commit `ba309d04` (the whole pass, one commit); sync-merge `59bc51f0`. Synced past `origin/launch-prep`: its
  message names `3dcdda15` (what the fetch a moment earlier reported) and it merged `508979bd`, which is what the
  parent list says and what `git rev-list --count HEAD..origin/launch-prep` = 0 confirms. The head is in the chat line.
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` 0 (194 components, 1400 contracts, 18
  policies) · specimens 0 (140 on 101 entries) · `pnpm typecheck` 0 · `pnpm lint` 0, **10 warnings not 8** (the brief's
  baseline is stale by two; none of the ten is in a file this lane touched: `album-fill-grid.tsx`, `review-switch.tsx`,
  `contact-form.tsx`, `jobs.ts`, `use-flip.ts`) · `pnpm test` 0 (307 files, 3186 passed, 1 skipped) · `pnpm build` 0
  (255 pages) · `pnpm lab:smoke --base http://localhost:3133` 0 (399 checks, 0 failing) · `pnpm lab:demo --board
  media-viewer` 0 (8 steps, 0 failing, including the badge written this pass on `media-viewer.link`). Logs in the
  lane's scratch. Port 3133 killed before each build, each test run and this handoff.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =
  `sandbox/overtaken.ts`, `sandbox/overtaken.test.ts` (both owned) + two exceptions, and NOT this file (its own commit):
  - `(shell)/lab/_desk/queue.test.ts`: one `describe` block, ~35 lines. WHY: it proved the desk's real join on
    `first-event` by name, so deleting that board's badges fired its own guard ("no ruling has reached this board at
    all"). It now derives the board it proves on from the map (the first standing one with a badged ask, an unreached
    ask and an option the badge must gloss: `media-viewer` today, seven candidates behind it) and asserts against the
    map's own values rather than literals. Nothing else in the file moved; the other 17 tests there still run on the
    fixture. Both wiring lanes need this the moment they drop their board from `registry.ts`, and they get it free by
    syncing past this merge. The `overtaken-3` precedent is a granted exception on this same file for this same reason.
  - `design/rules/rules.generated.json`: twelve line numbers, every one of them pointing into
    `sandbox/overtaken.test.ts`, which this lane owns. Regenerating is the gate's own first step; leaving it out would
    hand the next lane a spurious diff.
- The items, one line each:
  - `first-event` (7 badges) and `guest-upload` (8) removed whole, on the `app-vocabulary` precedent; each leaves a
    comment block saying what happened. 77 entries -> 69. Both boards are now RULERS in the test's `RULED` list.
  - Seven questions badged for the first time: `guest-verify.gate-switch` (the uploads section's other switch has a
    drawn guest side), `media-viewer.link` (he took the surface a guest can pass a link on from), `export-flow.hollow`
    (he refuses a gap a person has to check for), `export-flow.phone` (our own surface beat the system's going in),
    `contact-page.topic` (a door that asks one field and defers the rest), `contact-page.urgency` (a failure at a live
    party as the product's worst hour), `press-page.the-sheet` (the product prints its own stock now).
  - Thirty-one lines gained a clause behind the judgment they carried; the earlier judgments are word for word intact.
    Three lines now carry three clauses (`media-viewer.opening`, `export-flow.object`, `help-center.from-product`).
  - THE LAST HOLD IS SPENT. `first-event.first` carried `gate=after`, he answered `first=live`, and the badge retired
    with the ask: the second hold in two nights to end by his own answer rather than by round two, and the map now
    holds none. The grammar (`HELD`, `isHeld`, the badge's "Ruled and held since") is untouched and its test proves the
    shape on the note that hold wrote, because `guest-verify`'s four rulings are still held and the next question one
    of them reaches is badged this way and no other.
  - FINDING, recorded in the test: the clause cap did NOT rise to four. The only two lines that ever carried three
    clauses were `first-event`'s, so they left with the board rather than taking a fourth; this pass refilled the cap
    from lines that had two. `MAX_CLAUSES` stays 3 and its comment now says the cap is a measurement, not a count of
    passes.
  - `profile-page` was read and left alone, as the brief predicted: nothing in this batch reaches its three asks.
    `media-viewer.closeup`, `host-curation.keys`, `guest-verify.address`/`.collision`, `help-center.who-first`/
    `.dead-end`, `emails.brand`/`.sender`/`.foot`/`.dark`, `loose-ends.hero-tablet`/`.phone-cycle`,
    `contact-page.reach`/`.beside` and five of `press-page`'s were read against all sixteen and left unbadged: a badge
    that does not really reach is the same lie as one pointing at a retired ask.
- Calls his to overrule on the alias, one line each:
  - The `since` on both rulers reads **21 Sep**, not 20: the ledger stamps `2026-09-21T06:33:51Z` and rulings.md's own
    heading is `## 2026-09-21`. The second batch used 20 Sep because it was 22:45 EDT; this sitting ran past midnight.
  - The seven new badges are seven judgments that a ruling really reaches a question nobody had badged. The two
    furthest from his literal words: `guest-verify.gate-switch` (reached through the uploads section they share, not
    through the account switch itself) and `press-page.the-sheet` (his "full gallery of printable QR designs" read as
    the product owning real branded objects a kit could show).
  - `reel-studio.guests` is judged against the album's HEAD being ruled to carry a guest's waiting tile, which is a
    consequence of `held=tile` rather than a sentence of his.
  - `queue.test.ts` repaired in the lane rather than handed back (above).
- The help articles this lane makes stale: none. This lane changes no product surface, no copy and no route; it writes
  the desk's judgment data and two contract tests.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `/design/lab/media-viewer?session=media-viewer.opening` at 1440, where the fourth ruling to reach that
  question now rides behind the three that already had, then `/design/lab/contact-page?session=contact-page.urgency` at
  375, where a badge written this pass sits over a question nothing had reached. Captured at both sizes in the lane.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-21). The closing sitting's third batch was read against the fifteen
boards left on the desk: seven questions were badged for the first time and thirty-one judgments gained a clause
behind the one they already carried, while `first-event` and `guest-upload` left the map with the fifteen badges they
had been carrying, each behind a comment block saying what happened. The last held badge in the file, `gate=after` on
`first-event.first`, was spent by his own `first=live`, so the map holds no hold at all and its test proves the
grammar on the note that one wrote. Two findings were recorded in place: the clause cap did not rise, because the only
two lines that had ever carried three clauses retired with their board, so the cap is read off the map rather than off
a count of passes; and `_desk/queue.test.ts`, which proved the desk's real join on `first-event` by name, now derives
the board it proves on, so the next board answered whole takes nothing with it.
