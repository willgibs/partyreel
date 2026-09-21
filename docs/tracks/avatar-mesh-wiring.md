---
track: avatar-mesh-wiring
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ece02b97"          # the launch-prep SHA the branch was cut from
board: seed-avatar     # wired by this lane; the board retires unless his verdicts keep it open
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/avatar/
  - src/components/ui/avatar.tsx
  - src/app/(dev)/design/sandbox/seed-avatar/
  - docs/systems/auth-accounts.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/social/guest-list.tsx
  - docs/reviews/seed-avatar.json
  - docs/design/rulings.md
---

# lp/avatar-mesh-wiring

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- THE REVIEW SHEET FIRST: his verdicts beside the option pictures, `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b97eafa6-025b-4736-847b-48f80c42ec24/scratchpad/review-sheets/c75734b9-second.html` (open it in a browser; your board's section); the plan's words for this lane are in `/Users/gibby/.claude/plans/let-s-put-a-pause-gentle-widget.md` (the second batch); his notes verbatim in `docs/design/rulings.md` ("the closing sitting's second batch").
- The condition holds (`look=mesh`). `src/lib/avatar/gradient.ts` grows the mesh register from the board's `looks.ts`
  (one identity hue at four tonal depths, diffused and blended; the board's own construction copied, credited as the
  generator's header credits hashvatar); `background(orbFor(seed), "mesh")` becomes what `Avatar` draws for a seeded
  account (the `seed` prop and every consumer unchanged); the stricter centre-pixel measurement the board used lands
  in `gradient.test.ts` as the contract (the letter 4.5:1 under the initial at 24, 32, 40 and 80 across a thousand
  UUID-shaped seeds; the two grounds; the ring; the board's `centreLuminance` compositor, which reads the exact colour
  under a centred initial, moved beside the generator as `measure.ts` and used by the test) or the Handoff says why
  not; `ui/avatar.tsx` hardcodes `background(orb, "diagonal")` at its line 56, so that ONE line becomes `"mesh"`
  (the file's props and exports untouched; eleven lab files import it); the board retires under the retirement
  exception (the house convention; its `gradient.ts` shim and `looks.ts` go with it); `auth-accounts.md`'s avatar line
  refined. Owns: `src/lib/avatar/`, `src/components/ui/avatar.tsx`, `src/app/(dev)/design/sandbox/seed-avatar/`,
  `docs/systems/auth-accounts.md`. Reads: `social/guest-list.tsx`, the ledger, rulings.md, the sheet. His to overrule: the diffusion's strength at 24 px.

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

- None new. The brief's one open point ("his to overrule: the diffusion's strength at 24 px") is not a decision to
  relay: the recommended `mesh` construction ships unchanged at every size, and the point is carried below under
  "Calls his to overrule" for his eye on the alias, not blocked on here.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/auth-accounts.md`, the "Avatars are deterministic + orphan-free" bullet: the seeded-colour sentence
  now names the shipped `mesh` look (one identity hue at four diffused, blended tonal depths, hashvatar's own
  register read from its source) and `src/lib/avatar/measure.ts` (the contrast floors held at the disc's true
  composited centre), replacing the round-one wording that just said "hashvatar's register, zero dependencies,
  three contrast floors" with no look named.

## Deferred (ROADMAP one-liners, bucket named)

- Bucket "Now": ROADMAP.md's `avatar-look` line ("measured with real compositing at the exact centre pixel, EVERY
  avatar look including the wired diagonal misses the letter floor on some seeds... the winner's wiring lands the
  stricter measurement in the production contract or names why not") is RESOLVED and can be removed at the record:
  `src/lib/avatar/measure.ts` lands the board's `centreLuminance` compositor beside the generator, and
  `gradient.test.ts` + `measure.test.ts` hold `mesh` to 4.5:1 at the disc's TRUE composited centre across a
  thousand real UUIDs (100% clearing it, worst 4.69:1; `diagonal`, the look it replaced, is kept failing on the
  same measure as the record, never re-asserted as a floor).
- Bucket "Now", new: jsdom's `cssstyle` silently drops an ENTIRE `background-image` value when one layer pairs a
  percentage-sized radial-gradient ending shape with an `in <color-space>` prefix
  (`radial-gradient(in oklab 122% 118% at 22% 14%, ...)`, `mesh`'s own shape) — a real browser (the one that
  rendered Will's approved screenshot, and this lane's own local dev server, checked live) parses it correctly;
  dropping `in oklab` or adding an explicit `circle`/`ellipse` keyword also parses fine in jsdom, so the gap is
  narrow and specific. `src/components/ui/avatar.test.tsx`'s two affected assertions moved off `backgroundImage`
  readback onto `backgroundBlendMode` and the fallback's `ink` colour (both of which jsdom parses correctly).
  Worth a line in `testing-verification.md`'s blind spots if a future CSS-gradient contract test hits the same gap.
- Cosmetic only, not urgent: ROADMAP.md's `guest-verify` lab-bug line (the pinned stage's head crushing at 375 with
  one config row) reproduces it "on `seed-avatar.look`", a board this lane retired; the underlying bug is
  `src/components/lab/`'s own and untouched by this lane, so only the repro example's board name is now stale.

## Handoff (replaces the chat report)

- Board commit `af9af05c` ("avatar: hashvatar's mesh register wired, seed-avatar retires"), pushed to
  `lp/avatar-mesh-wiring`. `origin/launch-prep` had moved since the cut (overtaken-4, app-pricing-wiring and
  others integrated); synced by merge commit `f9d17a02`, pushed. Real conflicts were exactly the ones expected
  from a sibling lane touching the same mechanism (`overtaken-4` also retired `seed-avatar.look`'s held badge,
  independently, in `src/app/(dev)/design/sandbox/overtaken.ts` + `overtaken.test.ts`): resolved by keeping
  `overtaken-4`'s fuller version (it also adds `guest-verify.unproven`/`guest-verify.allowance` citations this
  lane has no basis to judge); `rules.generated.json`'s conflict resolved by regenerating fresh with
  `pnpm design:rules` on the merged tree rather than hand-merging, per the sync rule.
- Every claim below names its artifact so the Orchestrator checks rather than believes.
- Gates on the synced tree (commit `f9d17a02`), each its own exit code, all 0: `pnpm design:rules` ok (188
  components, 95 indexed, 1355 contracts on 123 components, 90 contract tests, 18 policies); the specimen
  collector ok (140 specimens on 101 entries, unchanged); `pnpm typecheck` ok; `pnpm lint` ok (8 known warnings,
  0 errors — one new warning appeared mid-lane, `gradient.ts`'s unused `hue` in `diagonalStops`, fixed before
  this count); `pnpm test` ok (300 files, 3127 passed, 1 skipped); `pnpm build` ok (255 pages); `pnpm lab:smoke
  --base http://localhost:3131` ok (419 checks, 0 failing, run twice: once before the sync, once after). No
  `lab:demo`: this is a production lane wiring `ui/avatar.tsx`/`src/lib/avatar/*` directly, and its one board
  retires in this same lane, so there is no standing board left to demo by the time the retirement lands (the
  manifest's own "Verify on" names `lab:demo` for a lab lane only).
- Live verification (local, since the avatar's CSS carries no responsive variant to check separately at 375):
  `pnpm dev -p 3131`, `/u/willg` (a real profile with no photograph) rendered the mesh orb at its 80px identity
  row; `getComputedStyle` on `[data-slot="avatar"]` showed all four layers and `backgroundBlendMode: "overlay,
  soft-light, normal, normal"` exactly matching `background()`/`blendMode()`'s output; a hand-built 24/32/40/80px
  strip of the identical CSS, screenshotted, reads as a rich warm orb at every size with the letter legible,
  matching the texture in Will's approved review screenshot (`seed-avatar.look.mesh-1440.png` in the sheet's
  captures) rather than the flat two-tone `diagonal` beside it in the same folder.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` (after the sync) = owned paths
  (`docs/systems/auth-accounts.md`; `src/app/(dev)/design/sandbox/seed-avatar/*`, deleted; `src/components/ui/avatar.tsx`;
  `src/lib/avatar/gradient.ts`, `gradient.test.ts`, and the new `measure.ts`/`measure.test.ts`) plus this manifest,
  plus six retirement-exception files, each below with why. `overtaken.ts`/`overtaken.test.ts` do NOT appear in
  the post-sync diff at all: this lane's edit there ended up superseded by `overtaken-4`'s fuller one during the
  merge, so the final tree carries no net difference from `origin/launch-prep` in those two files.
  - `src/app/(dev)/design/touchpoints.ts`: removed `seed-avatar` from the `SandboxId` union and `DESK_ORDER`;
    the `seed-avatar` `RULINGS` row lost its `board` block and gained the final `ruled`/`shipped`/`lives` text
    (the house retirement convention, `RulingId` kept).
  - `src/app/(dev)/design/(shell)/lab/boards.ts`: removed the `SeedAvatarBoard` import and its `BOARD_COMPONENTS`
    entry (same convention, atomic with the above per that file's own header comment).
  - `src/app/(dev)/design/sandbox/registry.ts`: removed the `SEED_AVATAR` import and its `REGISTERED` entry
    (same convention, third of the three files that file's own header names as atomic).
  - `src/app/(dev)/design/rules/component-notes.ts`: removed the deleted `sandbox/seed-avatar/looks.ts` note,
    added one for the new `src/lib/avatar/measure.ts` (an ownership rule every lane follows: a new component
    earns its `for` line).
  - `docs/design/library.md`, `src/app/(dev)/design/rules/rules.generated.json`: regenerated by
    `pnpm design:rules` after the above (never hand-edited).
  - `src/components/ui/avatar.test.tsx`: NOT in my `owns`, edited under the single-line exception. Necessary,
    not optional: jsdom cannot store `mesh`'s `backgroundImage` at all (the jsdom finding above), so the two
    tests asserting on it failed outright; fixed by asserting `backgroundBlendMode` (mesh-specific, jsdom-safe)
    and the fallback's `ink` colour instead. Every other test in the file is untouched.
- The items, one line each: `look`: `mesh`, matching the board's own recommendation and his verdict exactly (no
  override); the register lands in `src/lib/avatar/gradient.ts`'s `background()`/`meshDepths()`/`blendMode()` and
  `src/lib/avatar/measure.ts` (the generator itself, not a separate component, so no new Library entry beyond the
  `for` lines already on `gradient.ts` and the new one on `measure.ts`).
- Calls his to overrule on the alias, one line each:
  - The diffusion's strength at 24 px (his own note): shipped the same `meshDepths()` formula at every size,
    unconditionally; if the guest list's 24px chips read muddy or too subtle in person, the fix is the depth/
    chroma constants in `meshDepths()`, not a size-conditional branch.
  - Blend modes kept, not approximated away: `ui/avatar.tsx` sets `backgroundBlendMode` alongside
    `backgroundImage` (a second style property, via the new `blendMode(look)` export) so the shipped avatar
    matches the exact blend-mode-driven texture the board measured and he approved, rather than a flatter
    normal-compositing-only reading that would have kept `ui/avatar.tsx`'s edit to strictly one changed token
    (the brief's own words: "that ONE line becomes mesh"). Judged necessary for visual fidelity to the approved
    screenshot; flagged since it is a real, if small, deviation from the brief's literal framing.
- The help articles this lane makes stale: none. Checked both mentions of "avatar" in `content/help/`
  (`your-dashboard-explained.mdx:51`, `display-name-and-profile-photo.mdx:13`); both are functional ("your avatar
  opens the account menu", a keyword tag) and name no specific look, so neither goes stale from a colour-register
  change.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: any signed-in, no-photo account's avatar — `/u/willg` (his own profile, no photo, the 80px
  identity row) or a real event's guest list (24px chips); the account menu (32px) is the same generator at a
  third size.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). `seed-avatar` r2 ruled `look=mesh` (overrules the wired `diagonal`);
`avatar-mesh-wiring` grew a mesh register in `src/lib/avatar/gradient.ts` (one identity hue read at four diffused,
blended tonal depths, hashvatar's own register read from its source) and swapped `ui/avatar.tsx`'s one
`background(orb, "diagonal")` call for `"mesh"` plus its now-required `backgroundBlendMode`. The board's stricter
centre-pixel compositor moved beside the generator as `src/lib/avatar/measure.ts` (its own contract test) and
`gradient.test.ts` now holds the shipped look to 4.5:1 at the disc's true centre across a thousand real UUIDs,
closing the `avatar-look` ROADMAP line. The board retired under the retirement exception (its sandbox directory,
`touchpoints.ts`'s `SandboxId`/`DESK_ORDER`/board block, `boards.ts`'s and `registry.ts`'s registration lines,
`component-notes.ts`'s note all gone with it); `auth-accounts.md`'s avatar line refined. Found live: a narrow
jsdom/cssstyle CSS-parsing gap on a percentage-sized radial-gradient paired with a colour-interpolation-method
prefix (real browsers parse it fine), worked around in `avatar.test.tsx`, a candidate line for
`testing-verification.md`.
