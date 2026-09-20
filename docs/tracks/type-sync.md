---
track: type-sync
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "a2025ba0"          # the launch-prep SHA the branch was cut from
board: none            # production follow-up: the ladder's body scan closes and the step names land; no board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/type-ladder-policy.test.ts
  - src/components/marketing/chrome/marketing-footer.tsx
  - src/components/guest/enter-event-prompt.tsx
  - src/components/marketing/sections/home/pricing-teaser.tsx
  - src/components/marketing/sections/features/album/how-much-fits.tsx
  - src/components/marketing/sections/home/no-app.tsx
  - src/components/marketing/sections/events/event-statement.tsx
  - src/components/marketing/sections/features/qr/qr-hero.tsx
  - src/components/marketing/sections/reel/reel-hero.tsx
  - src/components/marketing/sections/reel/wysiwyg-section.tsx
  - src/components/app/
  - src/app/(app)/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/theme.css
  - docs/systems/design-system.md
  - docs/reviews/body-type.json
  - docs/design/rulings.md
  - src/lib/utils.ts
---

# lp/type-sync

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- The ladder landed six body steps as tokens beside the heading steps (`ladder-wiring`, merged `59345bc8`: `reading`
  16/24, `working` 14/20, `copy` a clamp, `caption` 12/16, `micro` 10/12, `label` 12/16 on 0.08em) with the policy's
  body scan as a COUNT-PINNED ALLOW-LIST that only shrinks (`src/lib/type-ladder-policy.test.ts`), because four lanes
  were open and the app-shape lanes built on stock classes that EQUAL a step rather than the announced names. Those
  lanes are on the tree. This lane finishes the ladder: (1) run the scan in its report mode and, for every entry
  still in the allow-list (the off-step sizes and the `pending` entries the app lanes were to remove), move the
  element onto a ladder step in the file it names (the step's own utility where the token exists, `text-working`,
  `text-caption`, `text-label` with its tracking; the stock class equal to a step is also on the ladder); (2) swap
  the stock classes on BODY copy in the files the app-shape lanes touched onto the step names where a name exists,
  a mechanical swap with no visual change (a size that equals a step stays that size); (3) shrink the allow-list to
  nothing and flip the body scan to a hard failure, the one-line follow-up the ladder's Handoff named; (4) leave
  depicted type (the picture components the policy exempts) and `ui/button.tsx` alone (the button rung is
  `buttons-pairs`' round; its sizes wait for his answer). Every move is a single class change; nothing is redesigned.
- Owns `src/lib/type-ladder-policy.test.ts` and EXACTLY the files the allow-list names at the cut (the Orchestrator
  lists them by file in the manifest from the test's own entries; never a prefix another open lane sits under). Reads
  `src/app/theme.css` (the tokens; never edited), `docs/systems/design-system.md`'s type section, the body-type
  ledger, rulings.md. `two-faces-policy` and the contract tests of every touched component green; the gate.
- Handoff: the count of entries before and after (zero), the files moved, the swap's file list, and any element that
  could not take a step without a redesign (left on the allow-list with why, if any: then the flip waits).

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

- None escalated: nothing in this lane was a genuinely new one-way-door decision. Every judgment call (a
  role read where the size actually moved, not just a tracking swap) was decided from the brief's own
  words or from an existing precedent already wired elsewhere, and is listed under the Handoff's "Calls
  his to overrule" rather than escalated here.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/design-system.md`, the type section's "way 6" paragraph (the one under "Six ways the
  ladder fails SILENTLY"), refined in place, nothing appended: it named `lane` and `pending` as live,
  shrinking allow-list kinds and promised a one-line flip to `{}` once the list emptied; both are now
  stale (this lane closed the two kinds instead of emptying the whole list, since `depicted` / `relative`
  / `board` are structural and were never going to reach zero). The paragraph now says `type-sync`
  (2026-09-20) closed `lane` and `pending`, that `BodyException.kind` dropped both names so one coming
  back fails typecheck, and that the three structural kinds remain named, counted and reasoned rather
  than emptied on a deadline.

## Deferred (ROADMAP one-liners, bucket named)

- No new lines. Two of `ladder-wiring`'s own five ROADMAP lines (the design system bucket) are now DONE
  and ready to retire at the record: "flip the body scan to a hard fail... once the allow-list is empty"
  (line 182) and "a `type-sync` follow-up (Sonnet) sweeps the... `lane` sites... and the four unowned
  marketing ledes" (line 183) — both this lane's work, detailed in the Handoff below. The other three (the
  76 `text-[10px]` -> `text-micro` rename, `src/components/admin/` unowned, `rules.generated.json`
  regeneration) are untouched by this lane; checked directly against the synced tree, all seven `board`-kind
  entries (the admin's three, plus export-flow's, site-chrome's and buttons-pairs' own) still sit in
  `BODY_EXCEPTIONS` exactly as `ladder-wiring` left them, so line 185's premise still reads true.

## Handoff (replaces the chat report)

- Board commits (stable): `19a59ef7` (the sweep: 12 files, the lane and pending entries moved onto a step)
  and `b639bad0` (`docs/systems/design-system.md`'s stale paragraph refined in place). Both pushed. Synced:
  `origin/launch-prep` had moved (help-sync, home-states and demo-doors landed since the cut) — merged
  (never rebased) at `a577edd2`, clean, no conflicts, zero file overlap between the incoming commits and
  this lane's twelve owned files (checked by diff before merging, not just hoped).
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` **0** (no artifact drift:
  `rules.generated.json` and `docs/design/library.md` both byte-identical) · specimen collector **0**
  (`specimens.generated.json` unchanged) · `pnpm typecheck` **0** · `pnpm lint` **0** (8 problems, 0 errors,
  8 warnings = the known baseline) · `pnpm test` **0** (**3047 passed**, 1 skipped, 290 files) · `pnpm build`
  **0** (255 pages) · `pnpm lab:smoke --base http://localhost:3133` **0** (442 checks, 0 failing). Dev
  server on **:3133** only, killed by port before the build, the test run and this handoff.
- Lane check — `git diff --name-only origin/launch-prep...HEAD` = **13 files**: the twelve this manifest
  owns outright, plus **one exception**: `docs/systems/design-system.md` (the type section's own stale
  paragraph, refined in place — the "System-doc edits" section above; the convention that a systems doc
  is never in a lane's frontmatter `owns` but can still be refined in place is `ladder-wiring`'s own
  precedent, confirmed by the Orchestrator on that lane).
- **The count, before and after**: `BODY_EXCEPTIONS` held **38 entries / 95 elements** at the cut across
  five kinds; it holds **27 entries / 78 elements** now, across **three**. `lane` (9 entries, 15 elements)
  and `pending` (2 entries, 2 elements) are both zero, and `BodyException.kind` dropped both names from its
  union, so a `lane` or `pending` entry coming back fails typecheck rather than passing a review unnoticed
  — the hard fail `ladder-wiring`'s Handoff deferred, for the half that was ever a lane boundary rather than
  a structural exception. `depicted` (15/58), `relative` (5/7) and `board` (7/13) are untouched, exactly as
  cut.
- **The eleven files moved, one line each** (a mechanical class swap; nothing redesigned):
  - `marketing-footer.tsx` (6 elements): the two footer-nav-link constants onto `text-reading` (one counted,
    `FOOTER_LINK` itself is not — see the bonus fix below); the "Start free" CTA and the "Open the demo
    album" link onto `text-working` (a control, matching `DemoCtaLink`'s own `text-sm` = `working`
    precedent); the "Scan the code..." lede and the `SITE_THESIS` paragraph onto `text-copy` (a marketing
    paragraph); the assistant-row note onto `text-caption` (a hint); the "We're hiring" badge onto
    `text-label`, growing 10 -> 12 like the ladder's own eleven small chips did.
  - `enter-event-prompt.tsx` (1): the gate's uppercase eyebrow onto `text-label` (12 stays 12; only the
    hand `tracking-[0.14em]` goes, for the step's own 0.08em).
  - `pricing-teaser.tsx` (2): the "Most popular" badge and the plan-name eyebrow onto `text-label`; the
    badge also gained `whitespace-nowrap` (see "look at first").
  - `how-much-fits.tsx` (1): the plan-name eyebrow onto `text-label`.
  - `no-app.tsx` (1): the ledger row's body sentence onto `text-copy`, its hand `leading-7` dropped (the
    step carries its own).
  - `event-statement.tsx`, `qr-hero.tsx`, `reel-hero.tsx` (1 each): the flat `text-lg` lede onto `text-copy`.
  - `wysiwyg-section.tsx` (1): the aria-hidden "=" glyph's flat `text-lg` onto `text-copy`, per
    `ladder-wiring`'s own Handoff naming this exact file "exactly what `copy` is for" alongside the three
    ledes above.
  - `feed-section-header.tsx` (1): the section label onto `text-label`, its `tracking-wide` dropped.
  - `event-feed-action-bar.tsx` (1): the "N uploading" chip onto `text-micro` (a count, matching the sibling
    count-pill in `feed-section-header.tsx`'s own file family) — the closest call in the lane; see below.
  - A twelfth file, not counted: `FOOTER_LINK`'s own `text-[15px]` (used at the nav links, invisible to the
    scan because it rides a shared constant rather than an inlined literal) moved to `text-reading` too, for
    consistency with the sibling link text in the same file the scan did flag. Left alone, it would have
    been the one nav link still on a stale one-off beside three just corrected.
- **Calls his to overrule**, one line each (every size that actually MOVED, not the tracking-only swaps,
  which are his own already-ruled `label=12-08`):
  - The footer's "Start free" and "Open the demo album" (15 -> 14, `working`): neither is a `<Button>`
    (the button rung waits for `buttons-pairs`), so the call was role, not the button round; `working` reads
    as "marketing's own UI chrome: a control", matching `DemoCtaLink`'s existing `text-sm`.
  - The footer's demo lede (17 -> copy) and `SITE_THESIS` (15 -> copy): both are marketing sentences, not
    controls, so `copy` over `working`/`reading`.
  - The footer's assistant note (13 -> 12, `caption`): a hint under the brand block, not a label or a lede.
  - `event-feed-action-bar.tsx`'s "N uploading" chip (11 -> 10, `micro`): read as a count/pip (the sibling
    pattern in `feed-section-header.tsx`, and it opens with a number). The other honest reading is
    `caption` (12): Will's own body-type note named "started/job/took category label" at 12, and this chip
    is arguably a job-status label wearing a number, not bare metadata — `job-controls.tsx`'s status label
    already sits on `caption`. Genuinely the closest call in the lane; flip it to `text-caption` if `micro`
    reads too quiet once he sees it live.
  - `pricing-teaser.tsx`'s "Most popular" badge gained `whitespace-nowrap`: at 12px/0.08em the words wrapped
    inside the pill (screenshotted, then fixed) where the old 10px/0.14em never had to; a one-utility
    consequence of the size the role calls for, not a redesign.
- **Not visually confirmed locally, and why**: `enter-event-prompt.tsx`'s gate eyebrow and both
  `event-feed/*` app-prefix fixes are host-signed-in surfaces (a gated event's account step, the event
  feed's action bar) and this lane's dev server cannot reach OAuth on its port (the ownership rules' own
  note); the one local disposable gated event ("Test Wedding") is owned by `willg97@gmail.com`, and this
  browser session is already authenticated as him, so `resolveGalleryAccess`'s owner check shows the full
  album before the account gate ever renders. The change itself is size-neutral (12 stays 12, only the
  tracking moves) and identical in shape to three other `text-label` swaps confirmed live in this same pass
  (the footer's badge, the pricing cards' badge and eyebrow, `how-much-fits`' eyebrow) — worth a ten-second
  human look on the alias signed out, not a redraw.
- Visually spot-checked at 1440 and 375 (this dev server, not the alias): home (the ledger, the pricing
  cards, the footer's demo invitation and brand block), `/about`'s footer (the "We're hiring" badge), `/reel`
  (the hero lede, the "=" glyph), `/features/qr` (the hero lede), `/events/weddings` (the statement
  paragraph). No overflow, no clipped element, no unintended wrap once the badge fix landed.
- The help articles this lane makes stale: **none.** Every change is a class name; no word of copy moved.
- Assets requested from Will: **none**.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none**.
- **Look at first**: `pricing-teaser.tsx`'s "Most popular" badge (confirm the `whitespace-nowrap` fix reads
  right at every card width, not just 1440/375), then the two host-signed-in surfaces named above (the gate
  eyebrow, the "N uploading" chip's `micro` vs. `caption` call), then `docs/systems/design-system.md`'s
  refined paragraph for tone.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Closed the body ladder's transitional allow-list: every
`lane` entry (nine files, mostly voice-wiring's own leftover copy the ladder's own sweep could not touch)
and `pending` entry (`feed-section-header.tsx`, `event-feed-action-bar.tsx`) moved onto the step its role
called for, a mechanical class swap with the size itself shifting only where the role called for it (small
uppercase badges growing a rung to `label`, four flat-18 marketing ledes landing on the fluid `copy` clamp).
`BodyException.kind` dropped `lane` and `pending` from its union, so either kind returning is a typecheck
failure rather than a silent allow-list widen; `depicted`, `relative` and `board` are untouched, still
named and counted. `docs/systems/design-system.md`'s stale paragraph on the mechanism refined in place.
Gate green on the synced tree (3047 tests, 255 pages, lab:smoke 442); two of `ladder-wiring`'s own five
ROADMAP lines retire.
