---
track: glass-material
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e271729a"          # the launch-prep SHA the branch was cut from (it had moved on from the 20cc9b5f the brief named)
board: glass           # round two on the same board id
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/glass/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/glass.json
  - docs/design/rulings.md
  - src/components/shared/media-lightbox.tsx
  - src/components/app/host-media-grid.tsx
  - src/components/guest/guest-reel-overlay.tsx
  - src/components/ui/floating-layer.ts
  - src/components/guest/guest-bar.tsx
  - src/components/likes/like-button.tsx
  - src/components/guest/guest-masonry.tsx
---

# lp/glass-material

**Goal.** Will's fifth batch (2026-09-19, build `69a9a17`) answered the four boards at the head of the desk; this lane is one of ten
cut from it. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- A `defineExploration` round two on the SAME board id (`round.n: 2`; the ledger exists after transcription), ONE
  decision `material` with three options drawn on all six real surfaces in one frame per option (the lightbox action
  pill, the mobile card's three permitted marks, the reel's controls over playing video, the host's row bar, a chip on
  the paper posture, the guest bar's upload button), on the dark and bright grounds, at 1440 and 375: `frost` (the
  recipe as ruled), `crystal` (its double edge), `white` (today's white tint carried on Frost's filter, the reel's class,
  MEASURED for the first time: contrast at its worst twelfth on the three photographs, frame cost across a phone scroll,
  as `measured.ts` does); every option draws an ACTIVE icon state ("keeps an active icon a bit more visible" was his
  first criterion) and White is drawn on the mobile card's marks too ("It probably would have looked better on the mobile
  media card icon background glass as well"). His notes quoted in the brief ("It was between this and Crystal ... keeps an active icon a
  bit more visible ... liked the Crystal's double edge for more contrast in any situation"; "find a global that works
  everywhere"). A second decision only if the drawings argue for it (e.g. `edge`: the bright top lip on the winner or
  not). Round one's seven asks are replaced on the board (the six ruled ones named as ruled in the RULINGS row's
  `ruled`, wired after this round). The tiles ask is NOT re-asked: his rule stands (the carried call).
- `lab:demo` cannot picture backdrop-filter in headless Chrome (four glass steps report UNPAINTED after `lab-tides`): the
  lane captures the frames in headed Chrome by hand (the pane) and says so; `lab:smoke` whole; the gate.
- His `grades` note carried into the frame: "With our guest/profile work, the bottom uploader credit UI may become
  clickable soon too." The lightbox's attribution capsule is drawn as a PRESSABLE surface in every option (one grade
  means it wears the full material), and the brief names `profile-page` round two's quick-look as the thing it will
  open, so the glass wiring and the profile wiring meet on one surface.
- Owns `src/app/(dev)/design/sandbox/glass/` and the board's own lines in `registry.ts`, `boards.ts`, `touchpoints.ts`
  (the RULINGS row rewritten for round two) under the registration exception. Reads the four `lives` files, never edits.
- The glass WIRING lane is cut at this round's ruling, after the app-shape lanes land: one lane, the material as one
  token set (`--glass-*`) and one utility, the lightbox's backdrop (`behind=album`), the tiles' three marks and the
  removed chips, the host's row as a bar, dark on paper, the reel's controls; then `glass` retires.

## The verdict map (every answer of the batch; this lane wires only its own board's)

**`voice` r1 (eight; the board RETIRES at its wiring, its voice written up from the wins):**
- `absence=named` + his rewrite: bible 20 is ruled PERMISSIVE (naming an absence a guest is wary of is allowed; the rule
  forbids defining Partyreel against something else, "we're not cloud storage, we're not vsco") AND the line changes
  everywhere: "No app, no account." becomes "No app required." because accounts may be required. The Orchestrator
  rewrites bible 20's `statement` and `why` in `rules/bible.ts` at the batch record (his words); the lane sweeps the 66 lines
  (every "no account" promise goes; "no app" stays as a benefit).
- `hero-sub=?` with his line: `SITE_SUBHEAD` becomes "Your guests took the best photos and videos at your event. Partyreel
  collects them with one easy link. No more chasing group chats the next day." (verbatim). `SITE_DESCRIPTION` (thesis +
  subhead) would reach ~200 characters: the lane gives the meta description its own line under 160 and says so.
- `feature-h1=today`: nothing moves; his "I do not like three-line headings on desktop" becomes a measurement on the
  alias of all six feature h1s at 1440 (`PageHero` `lg` = `text-title`, 80 px in `max-w-3xl`, likely two to three lines)
  and a proposal in the Handoff for any that wrap to three (shorter h1 copy, never the load-bearing width).
- `pro-line=video` with his line: "For videos and unlimited events." at `plan-cards.tsx:316`, single-sourced beside the
  other ruled lines in `marketing-voice.ts`; the four sibling one-liners (`pricing-teaser.tsx:37`, `faq-data.ts:47`,
  `how-much-fits.tsx:154`, `llms.ts:133,233`) aligned to the same order (videos first, unlimited events); two or three
  "slightly more engaging" phrasings offered in the Handoff for his overrule on the alias.
- `host-empty=album`: "Your first album starts here" in `events-empty-teaser.tsx:41-43`; its body line loses "No app, no
  account"; the CTA stays "Create your first event" into the wizard.
- `gate=ask` with his adjustment: the body of `enter-event-prompt.tsx:56-59` becomes "For safety, the host has requested
  you confirm your email. One tap and you're in." (verbatim; the eyebrow, the title and the password path unchanged). His
  "big one" (skip confirmation for a badge) is the `guest-verify` exploration below, not this lane.
- `empty=starts`: "The album starts with you" in `gallery-empty-state.tsx:69-76`; the CTA "Be the first to add a photo" stays.
- `moment=today`: `guest-upload.tsx:77` unchanged. His "redesign our toasts" is the `toasts` exploration below.
- The finding to write up (the lane, in `marketing-voice.ts`'s head comment and `docs/systems/`): the two deliberately
  identical questions (`host-empty`, `empty`) got one voice, the album noun and "starts".

**`body-type` r1 (seven; six wire now, `buttons` goes to round two on the same board):**
- `reading=16` (every guest-facing sentence; the 26 `text-[15px]` go), `working=14` (the app's body; the admin "can break
  away" toward density, so the admin's own sizes are mapped where equal and otherwise left for the `admin` board),
  `marketing=fluid` (16 at a phone to 18 at a desk, a clamp like the heading steps), `caption=10` read with his note as
  TWO bottom steps: the caption step stays 12 (the labels he named) and a `micro` step at 10 is the FLOOR (the event
  cards' metadata chips, count pips; nothing under 10 outside depicted type), `label=12-08` (every uppercase label,
  marketing and app, at 12 px on 0.08em; the Eyebrow atom and the 75 `tracking-[0.14em]` literals move; he may drop to 11
  later), `leading=length` (2 x size - 8: 10/12, 12/16, 14/20, 16/24, 18/28; the marketing clamp's leading a clamp too).
- `buttons=ladder` "not a direct selection, more work required": round two on `buttons` alone (below); the wiring lane
  leaves Button's sizes as today (the `sm` literal stays until the rung is ruled).
- The write-up: the steps as tokens with leading and tracking companions in `theme.css` beside the heading steps,
  `TYPE_STEPS` and `cn()` knowing them, the policy test extended from headings to body sizes (stock classes that equal a
  step are on the ladder; px literals and off-step stock sizes fail; depicted type and the named exceptions exempt), the
  Library's foundations page, `design-system.md`'s type section refined in place.

**`glass` r1 (seven; the recipe goes to round two FIRST, the wiring follows it in one lane):**
- `recipe=frost` with "worth a second round ... so we can nail our glass from the start", `reel=white` with "may be worth
  exploring making this the standard - I don't want to have separate glass treatments and would prefer to find a global
  that works everywhere": round two asks the ONE material (Frost, Crystal, White-on-Frost) on every glass surface at once.
- `grades=one`, `behind=album` (the album blurred at half brightness behind the lightbox), `row=bar` (one pane holding the
  host's three controls), `paper=dark` (dark glass over media whatever the theme): rulings that wire with the material.
- `tiles=?` with his rule: on a mobile image card nothing but an active like mark, a video play mark and a subtle like
  count (state, never a control); every action (like, download, select, hide) lives in the lightbox's controls, select
  handling multi-item. A standing ruling for `media-viewer`, `app-vocabulary`, `guest-shape` and `host-curation` (the
  carried call below), wired by the glass lane on the tiles it owns and by `media-viewer`'s wiring in the lightbox.

**`app-shape` r1 (eight; two wiring lanes now, round two on the home across host states; the board stays):**
- `home=pulse`: `/dashboard` becomes the front page ("what needs you, then what just arrived": the waiting queues and the
  storage line first, the photographs of the last hour, then your events); the five-chip inbox (`dashboard-feed.tsx`,
  `filter-chips.tsx`) goes. His "worth more dashboard explorations ... across all host states" is round two (below).
- `density=cover` + "let's do both": the events list keeps the cover cards AND gains a row/table view behind a toggle
  aligned right opposite "Your events" (sorting and filtering in the table); the choice persists per host; the board's
  `lands` says every list of events in the app (the bin, saved events, the hosts you follow) shares the shape.
- `event=hub` + his three additions: a row of cards (Review, Reel, Guests, Settings LAST; the board's "Album" card becomes
  Settings), the gallery BELOW the cards by default in most-recent order, a clickable QR code horizontally centred to the
  left of the title + metadata stack that opens the share mini-modal.
- `nav=crumbs`: a trail in the bar (Partyreel / the event / the room), the cards row going sticky as the album scrolls
  ("could pick up sticky-style from the cards"), and a creative way to keep Share reachable from the sticky row.
- `share=room` overridden by his `settings` note: sharing gets ONE comprehensive surface as a SHEET (the code, the link,
  the posters, the invite, the custom link claim, anything future), reached from the event's menu and from the mini-modal;
  the QR at the left of the title opens a view-transition-style mini-modal (a bigger scannable code, view/copy the link,
  a door to the sheet); a third, subtler event link with a copy button sits under the metadata line.
- `settings=sheet`: the settings page of cards becomes a sheet over the album (the album stays behind it); the photo bin
  joins the album as a filter; "Deleted" names one thing.
- `you=?` with his answer: a person's own photos, likes and connections live on the PROFILE page (an owner mode of
  `/u/[slug]`), where the avatar and profile settings can also be changed; plans, billing and profile management live on
  the ACCOUNT page (billing gets its first door: a Plan card); the avatar may be changed in both places. The user menu
  gets the two doors. The personal feeds leave the home.
- `phone=same`: one shape at both sizes, the crumb header narrowed, the cards row scrolling sideways with a conditional
  gradient at either edge, sticky after the page scrolls past the cards.

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

Every one of these was taken, built and is live on the board; none stopped the lane. The first two are
also drawn on the board as carried calls (`call:sheet`, `call:add-pill`) so he can answer them in the
same paste as the two decisions.

- **A second decision, `edge`, staged behind `material`.** His note is two judgements about two
  independent properties ("this one because it's a bit darker" is the body; "I also liked the Crystal's
  double edge" is the edge), and one set of options forces the compromise he already said he did not
  want. Taken: ask them separately, so Frost's darkness wearing Crystal's double edge is two presses
  away. Overrule: fold the edge back into the material and the winner keeps its native hairlines.
- **Three options, not four.** No invented hybrid: the hybrid his note describes is reachable through
  `edge`, and a fourth body would have made the one-variable Frost/White comparison unreadable.
- **One frame holding all six surfaces** rather than round one's six screens (`call:sheet`). A material
  that wins on the lightbox and loses on a card is not the global he asked for, and a screen at a time
  is the shape that let white win on the reel and never be drawn anywhere else.
- **The guest's Add photos pill is drawn IN the material** in every option (`call:add-pill`). It ships
  solid (`bg-primary`); drawing it as glass is a proposal, not a ruling, and it is there because a
  global material has to be judged carrying the app's loudest action over the album's own scroll.
- **`ground` opens on the darkest photograph** (round one's world, so his memory of those tiles holds),
  with the brightest named in the step and in "Look at first" as the one that separates the three.
- **`veil`, `quietOf`, `flatOf` and the paper material are deleted**, not kept: `grades=one` killed the
  second grade, `paper=dark` killed the light material, and `veil` went with the recipe he ruled out. A
  board carries only what is still open; the answers live for ever in the ledger.
- **No `tile` declaration**, so the step arranges its options as a flip. Three materials appearing in
  exactly the same position is the instrument: a 12 percent tint turning white is invisible across a
  gutter and unmissable in place.
- **The manifest's `reads` names `guest-bar.tsx` for "the guest bar's upload button"**; that file is the
  session-less failure wordmark row. The upload button is `src/components/shared/floating-add-button.tsx`,
  which is what the sixth surface draws (read, never edited). Its path is now in the RULINGS row's `lives`.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. A lab-only round rules nothing: the material's facts land in `docs/systems/design-system.md`
  when `glass-wiring` writes the token set.

## Deferred (ROADMAP one-liners, bucket named)

- **The lab and the kit**: a `Page.captureScreenshot` with a `clip` makes Chrome recomposite at a new
  surface size and a backdrop-filter layer does not survive it (every clipped pane came back pure black,
  reading 20.49:1 against white on all nine states). Any harness that measures glass must capture the
  viewport and crop in Node, and `lab:demo`'s UNPAINTED report is the same disease one layer up.
- **The lab and the kit**: a HEADED Chrome window drops composited layers from a capture where headless
  does not. Twice, deterministically, the headed shot lost the paused reel and two tiles of the host's
  row while the DOM measured them present and complete; the identical state captured headless and
  unclipped paints everything. The record captures are therefore headless, with a live headed reading
  beside them.
- **Glass (the wiring)**: the rose `--like` active mark fails over a bright photograph on EVERY material
  (1.44:1 Frost, 1.01 Crystal, 1.01 White, measured). No material can save it, so the wiring needs the
  mark itself to carry its own contrast; it reaches `media-viewer`, `host-curation` and `app-vocabulary`,
  which all inherit his tiles rule.

## Handoff (replaces the chat report)

- The board at `56a9381e`, the sync merge at `700f7ad3`, this manifest the head; all pushed. Synced with `launch-prep` at `45cb36e1` (it had moved from the `e271729a` cut;
  merged, never rebased, and the gate below is the synced tree).
- Gates on the synced tree, each on its own exit code: `design:rules` ok (157 components, 1101 contracts,
  18 policies), specimens ok (131 specimens on 94 entries), typecheck ok, lint ok (9 warnings, 0 errors:
  the 8 known plus one that arrived with `home-wiring`'s `events-section.test.tsx`; none of the nine is
  in a file this lane touched), test ok (2807 passed, 1 skipped, 264 files), build ok (255 pages);
  `pnpm lab:smoke --base http://localhost:3135` ok (450 checks, 0 failing; the glass board reads 556
  words against the 1200 budget); `pnpm lab:demo --board glass --base http://localhost:3135` ok (2 steps,
  0 failing, every step draws its options; `material` moves the stage by up to 5.39 percent between
  options and `edge` by 0.49 percent, which is what three 1px hairlines across fifteen small panes is).
- **On UNPAINTED**: it did not recur. Round one's four glass steps reported UNPAINTED; round two's two
  steps painted in `lab:demo` on every run. The frames were still captured by hand at 1440 and 375, and
  doing it found the cause one layer down: the clip is what breaks it, not the renderer (see Deferred).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the seven files of
  `src/app/(dev)/design/sandbox/glass/`, plus two exceptions: `src/app/(dev)/design/touchpoints.ts`
  (the `glass` RULINGS row alone, rewritten for round two under the registration exception; the diff
  touches no other row) and `docs/design/library.md` (that row's generated twin, which `pnpm design:rules`
  writes and the gate requires; the diff is the one glass line).
- The items, one line each:
  - `material`: **Frost**, and for his own reason rather than despite it. The rose active mark on a
    mobile card reads 5.30:1 on Frost, 4.44 on Crystal and 3.61 on White over the darkest photograph
    (5.52 / 4.72 / 3.83 over the middling one); all three carry white text on every photograph and all
    three cost the same to scroll, so the active icon is the only axis left, and it is the axis he named
    first. A kept Frost lands in the Library as the `--glass-*` token set and one `.glass` utility.
  - `edge`: **the double edge**, his own second reading, measured. Over the middling photograph a pane
    with no hairline loses 41 percent of its outline into the picture, one lip recovers it to 81 percent
    and the double edge holds 97; the lip itself stands 37.1 off the pane's interior against 17.0 for
    the single lip, and neither costs a millisecond, because an inset shadow is not a filter.
- Calls his to overrule on the alias, one line each: all eight are under Questions above; the two he can
  answer in the same paste are on the board as `call:sheet` (one frame for six surfaces) and
  `call:add-pill` (the guest's Add pill drawn in the material rather than left solid).
- The help articles this lane makes stale: none. No production byte moved.
- Assets requested from Will: none new. ASSETS row 14 (the dark, low-key menu ground) still stands from
  round one and would raise the darkest ground's honesty; the board says so on its own step rather than
  faking one with a filter.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Captures (headless, unclipped, the whole sheet in one frame per option), in
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad/glass-material/captures/`:
  `material-{frost,crystal,white}-{dark,bright}-375.png`, `material-{frost,crystal,white}-bright-1440.png`,
  `material-frost-mid-1440.png`, `edge-{lip,double,none}-frost-mid-375.png`,
  `edge-double-frost-bright-1440.png`. The measuring harness and its output sit beside them
  (`contrast.mjs`, `cost.mjs`, `cdp.mjs`, `contrast.json`, `cost.json`); they are tools, not board files,
  so nothing of them is committed.
- Look at first: **the material step at 375 on the brightest photograph**, flipping Frost to White. The
  rose mark on the mobile card is the whole round in one glance: it holds on Frost and disappears on
  White, and the caption under the frame carries both numbers. Then the same step on the darkest
  photograph, where White is at its most persuasive and still reads the mark two points lower.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-20). Glass round two asked the ONE material his notes
asked for: Frost, Crystal and the reel's white on Frost's filter, drawn on all six glass surfaces in a
single frame per option at 375 and 1440 over the darkest, middling and brightest photographs, with the
edge freed from the body as a second decision so his two judgements stopped competing. Every number was
re-measured off the rendered pane, and the active icon was measured for the first time: Frost keeps the
rose mark 0.9 clear of Crystal and 1.7 clear of White, no material saves it over a bright photograph,
white text survives on all three, and the three cost the same to scroll. Round one's rulings were spent
subtractively (`veil`, the quiet grade, the flat control and the paper material all deleted), the RULINGS
row was rewritten for round two, and the harness found the cause of the lab's UNPAINTED reports: a
clipped capture, not a renderer.
