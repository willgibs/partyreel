---
track: welcome-film-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "ece02b97"          # the launch-prep SHA the branch was cut from
board: app-door        # wired by this lane; the board retires unless his verdicts keep it open
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/welcome-flow.tsx
  - src/components/app/welcome-flow.css
  - src/app/(app)/welcome/
  - src/app/(dev)/design/sandbox/app-door/
  - docs/systems/host-app.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/constants/how-it-works.ts
  - src/components/marketing/sections/how-it-works/
  - src/app/(app)/actions.ts
  - docs/reviews/app-door.json
  - docs/design/rulings.md
---

# lp/welcome-film-wiring

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- THE REVIEW SHEET FIRST: his verdicts beside the option pictures, `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b97eafa6-025b-4736-847b-48f80c42ec24/scratchpad/review-sheets/c75734b9-second.html` (open it in a browser; your board's section); the plan's words for this lane are in `/Users/gibby/.claude/plans/let-s-put-a-pause-gentle-widget.md` (the second batch); his notes verbatim in `docs/design/rulings.md` ("the closing sitting's second batch").
- The condition holds (`tour=film`): five screens on the real `/welcome`: the name step untouched, three of the
  marketing site's bespoke how-it-works pictures in motion with the copy overlapping each, a fourth closing on the
  primary "Create my first event" and the skippable "I'll look around first" (both untouched in words). THE FACTS:
  the twelve pictures are static JSX mocks (`sections/how-it-works/host-pictures.tsx`, `guest-pictures.tsx`, the
  shared `picture-parts.tsx`, mounted by id through `step-picture.tsx`'s `StepPicture`), with no motion of their own
  on the marketing page; the "in motion" is the board's own drawing: `.ad-film-live` in `sandbox/app-door/app-door.css`
  (a 16 s drift, scale 1 to 1.045, `ease-in-out` alternate, gated on `prefers-reduced-motion: no-preference`) around
  `StepPicture` for `create`, `share`, `fill`, and `ReelPicture` closing. The lane imports `StepPicture` and
  `ReelPicture` from the marketing folder (reads, never edits), lands the drift as the flow's own small stylesheet
  (`src/components/app/welcome-flow.css`, the house easing, under 300 ms is not the rule here: it is an ambient
  breath, bible 12's exception named in a comment), the copy plate overlapping each picture as the board drew it;
  `markWelcomedAction` stays in `src/app/(app)/actions.ts` (read, not owned). The board retires under the retirement
  exception; `host-app.md`'s welcome line refined. Owns: `src/components/app/welcome-flow.tsx`, the new
  `src/components/app/welcome-flow.css`, `src/app/(app)/welcome/`, `src/app/(dev)/design/sandbox/app-door/`,
  `docs/systems/host-app.md`. Reads: `src/lib/constants/how-it-works.ts`, `src/components/marketing/sections/how-it-works/`,
  `src/app/(app)/actions.ts`, the ledger, rulings.md, the sheet. His to overrule: the three pictures (create, share,
  fill); the drift's 16 s.

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

- none: the two items the brief named as his to overrule (the three pictures, the drift's 16s) were both taken exactly as
  recommended; they are echoed under Handoff's "Calls his to overrule" rather than asked here, since nothing was left open.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/host-app.md`, "## First-time host welcome": refined in place for the five-screen film tour (the untouched
  name step, then a four-screen tour: `StepPicture` for `create`/`share`/`fill` breathing under an overlapping copy plate,
  a closing beat on `ReelPicture` into the unchanged primary-and-skippable pair); the drift's mechanics and its bible-12/14
  reasoning named; the single-source note widened to cover the pictures as well as the copy.

## Deferred (ROADMAP one-liners, bucket named)

- none: `tour` was the board's one ask and it is now ruled and wired whole; no round three is open on this board.

## Handoff (replaces the chat report)

- Board commit `edc5a5a7`, pushed; synced with `launch-prep` via merge commit `cf363ee2` (five sibling lanes' adjacent
  `DESK_ORDER`/registry deletions merged clean, no conflict; `overtaken-4` landed first and had already reconciled the
  app-door lines in the desk's overtaken map, so nothing here touches `sandbox/overtaken.ts`). One follow-up commit
  regenerated `rules.generated.json` after the merge (`pnpm design:rules`, never merged by hand) and is pushed on top of
  the merge; the branch tip is whatever `origin/lp/welcome-film-wiring` shows, not cited by its own sha per the house rule.
- Every claim below names its artifact, so the Orchestrator checks rather than believes.
- Gates on the synced tree, each its own exit code, all 0: `pnpm design:rules` ok (regenerated, committed); the specimen
  collector ok (no diff: no Library gallery entry names this board); `pnpm typecheck` ok; `pnpm lint` ok (8 known warnings,
  0 errors, unchanged baseline); `pnpm test` ok (301 files, 3140 passed, 1 skipped); `pnpm build` ok (255 pages, matching
  the pre-lane baseline); `pnpm lab:smoke --base http://localhost:3132` ok (420 checks, 0 failing). No `lab:demo`: this is
  a production lane and the board it wires is retired (deleted from `sandbox/`), so there is nothing left to demo.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` is exactly: the owned paths (`welcome-flow.tsx`,
  `welcome-flow.css`, the 8 deleted `sandbox/app-door/*` files, `docs/systems/host-app.md`) + the retirement exception
  (`touchpoints.ts`: the `app-door` line off `SandboxId`, off `DESK_ORDER`, and its `RULINGS` row rewritten with `board`
  dropped, nothing else touched, 16 lines total; `sandbox/registry.ts` and `(shell)/lab/boards.ts`: 2 lines removed each,
  `APP_DOOR`/`AppDoorBoard` only) + one new `for` line in `rules/component-notes.ts` at the head (the "several lanes add
  `for` lines this round" convention, since the new contract test names `welcome-flow.tsx`) + the generated
  `docs/design/library.md` and `rules.generated.json` (`pnpm design:rules`) + this manifest. One file outside the LETTER
  of `owns` (written as exact paths, "no globs"): `src/components/app/welcome-flow.test.tsx`, a contract test co-located
  with the exact file `owns` already names, the standing component/test pairing this whole codebase follows; flagged here
  for transparency rather than silently assumed.
- The item, one line: `app-door.tour=film`: shipped as five real screens on `/welcome` (verified end to end, see below);
  no Library entry, since `/welcome` is the production route itself and not a Library primitive — the `RULINGS` row in
  `touchpoints.ts` is where the ruling now lives, `shipped` filled, `board` gone.
- Calls his to overrule on the alias, one line each:
  - The three pictures (create, share, fill) and the drift's 16s: both pre-flagged by the brief; both taken exactly as
    the board drew and he confirmed (`app-door.tour.film-1440.png`), unchanged.
  - The dots-and-Skip header (4 dots, a ghost Skip button) rides across all four tour screens, including the close,
    matching the ORIGINAL shipped tutorial's own chrome — though the lab's `film.tsx`/`welcome.tsx` drew no header at all
    (only a reviewer's own "n of 5" numbering caption, lab-only chrome). Dropping it would leave a host no way out until
    the fourth screen; keeping it is the more conservative read of a ruling that redesigned the screens, not the exits.
  - The closing screen's body copy ("Create your first event and share the code.") is the board's own shorter line,
    replacing the old production sentence ("...share the QR with your guests. They'll start adding photos in seconds."):
    copy is open (bible 21) and this is what he confirmed on screen.
- The help articles this lane makes stale, one line: `content/help/create-your-first-event.mdx` line 25, "offers a
  three-screen tour you can skip", is now a FOUR-screen tour (the name step was never counted in that three); the rest of
  the article (the wizard's own three steps, Details/Design/Share) is untouched and still accurate.
- Assets requested from Will: none. Every picture is quoted from the marketing site's own `sections/how-it-works/`;
  nothing new was drawn.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `/welcome` signed in as a brand-new, unwelcomed account (no display name, `welcomed_at` null) on the
  alias, at 1440 and 375: the name step (untouched), then Continue through the three live beats and the close; confirm
  the drift reads as a breath and not a jitter, and Skip/Back behave as `welcome-flow.test.tsx` pins. Verified locally
  end to end (all four tour screens, both widths, the drift's computed animation confirmed live: `welcome-film-drift`,
  16s, linear, infinite, alternate) via a throwaway, never-committed preview route rendering `WelcomeFlow` directly
  (`(dev)/zz-preview-welcome`, deleted after use, never in any commit) since the real `/welcome` sits behind `getUser()`
  and sign-in is an allow-list-gated flow local dev cannot complete; the gated route itself was not click-tested
  signed in this round, so a quick real pass on the alias is worth the two minutes.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). app-door round two ruled `tour=film` (Will, confirming the recommendation):
the welcome tour became five real screens on `/welcome` in place of the old three-card tutorial, the required name step
untouched, three of the marketing site's own bespoke how-it-works pictures (`StepPicture` for create/share/fill, quoted
rather than redrawn) breathing under an overlapping copy plate under a slow 16s linear drift (`welcome-flow.css`, a
bible-12 exception named in its own comment; linear per the house's `mkt-kenburns`/`mkt-wall-drift` ambient-drift rule,
not the lab board's ad-hoc ease-in-out), closing on `ReelPicture` into the unchanged primary-and-skippable pair. The
app-door board retired: `sandbox/app-door` deleted, its registry/boards/`SandboxId`/`DESK_ORDER` lines gone, the
`RULINGS` row rewritten as shipped combining both rounds. `docs/systems/host-app.md`'s welcome section refined in place.
A new contract test (`welcome-flow.test.tsx`, `component-notes.ts`'s first `for` line this round) pins the tour's
screens-and-exits function. Gate green on the synced tree (301 files, 3140 tests; build 255 pages; `lab:smoke` 420
checks); `create-your-first-event.mdx` line 25 ("a three-screen tour") is now stale, flagged for `help-sync`.
