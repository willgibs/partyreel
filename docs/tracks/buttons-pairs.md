---
track: buttons-pairs
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "af7ec784"          # the launch-prep SHA the branch was cut from
board: body-type       # round two on the same board id, the buttons rung alone
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/body-type/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/body-type.json
  - docs/design/rulings.md
  - src/components/ui/button.tsx
  - src/components/app/export/download-all-button.tsx
  - src/components/app/event-feed/gallery-actions.tsx
  - src/components/guest/live-gallery.tsx
---

# lp/buttons-pairs

**Goal.** Will's fifth batch (2026-09-19, build `69a9a17`) answered the four boards at the head of the desk; this lane is one of ten cut from it. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- His note verbatim in the brief: "I'd like the button text sizes to be on the ladder so they aren't one-offs, but
  directly applying what exists on the ladder ... did not feel perfectly matched. In particular, the download and select
  buttons felt mismatched between their icon sizes and new font size". A round two on the same board id (`round.n: 2`),
  ONE decision `pairs` (how a button's icon and height follow its text step) with three options drawn on the REAL
  buttons at every size in the real rows (the host feed's Download and Select at `sm`, the guest album's raw Download at
  14, a `default` action, a `cta`, the icon-only sizes) at 1440 and 375: `text` (the icon equals the text step: 12/12,
  14/14, 16/16), `step-up` (the icon one notch over the text: 12/14, 14/16, 16/18, heights on the 4 px grid), `today`
  (today's `size-3`/`3.5`/`4` icons under the new text steps, what he saw). Each option measured in the frame (icon px,
  text px, height, the optical gap). Round one's six ruled asks named as ruled in the RULINGS row. Owns
  `sandbox/body-type/` and the board's own lines; reads `ui/button.tsx`, `download-all-button.tsx`, `gallery-actions.tsx`,
  `live-gallery.tsx`, never edits. The wiring of the winner rides `ladder-wiring`'s successor or a small follow-up.

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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none (a lab round: no production byte shipped; `button.tsx` untouched, the `pairs` winner wires at its cva table in a follow-up)

## Deferred (ROADMAP one-liners, bucket named)

- Now: from `buttons-pairs` (2026-09-20, the lab): a board-page measurement effect keyed only on a module-constant probe array (`[probes]`) freezes its caption the instant the board's own control swaps which option is drawn without remounting the tree (`BoardSection` hands a single unkeyed child to `evidence()`, so React updates props in place rather than remounting) — the stepped review never shows it, since `StageViews` mounts every option once in its own keyed div and never swaps a live one. Fixed here with a per-swap change token (the frame's own id) added to the deps; the same shape (a stable-reference dependency beside board-state-driven content) could recur in any board built this way, and `measure.ts`'s hooks read the tuner store's own subscription rather than this pattern, so nothing there catches it either. Worth a shared note in the kit or a `measure.ts` helper that makes the token opt-out rather than opt-in.

## Handoff (replaces the chat report)

- Board commit `41770ef9`, pushed; synced with launch-prep at merge `556c3d6b` (it had moved 27 commits: the sixth batch's further landings — `vocab-wiring`, `pricing-fit`, `avatar-look`, `demo-wiring`, `demo-doors` — and the morning's resume record, `37f9345b`, Will's own words on this exact resumption; `touchpoints.ts` merged clean, no conflicts, `docs/design/library.md` regenerated and byte-identical after)
- Resumed exactly where the dead session (killed by the weekly limit, 07:30 EDT) left it: its six uncommitted files were a coherent, complete round-two board (spec, fixtures, board, surfaces, the touchpoints.ts registration, library.md), committed whole first (`c1facebc`); its own diagnosed bug — the measurement effect's `[probes]` dependency never re-firing on a board-page swap — fixed second (`41770ef9`), verified live rather than taken on faith (below)
- Gates on the synced tree: design:rules ok (no diff), specimens ok (no diff), typecheck ok, lint ok (8 known, none in this lane's files), test ok (3053 passed, 1 skipped, 290 files), build ok (255 pages); `pnpm lab:smoke --base :3134` ok (434 checks, 0 failing, `body-type` 172 words against a 1200 budget); `pnpm lab:demo --board body-type --base :3134` ok (1 step, 0 failing: `pairs` options differ by up to 0.65%, consistent with "height never moves")
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/body-type/{board,fixtures,spec,surfaces}.{ts,tsx}` (owned) plus `src/app/(dev)/design/touchpoints.ts` and `docs/design/library.md` (the registration exception: round two's single-decision entry and its generated line) — nothing else
- The items, one line each:
  - `pairs`: recommended `step-up` (icon one Tailwind notch over its text: 12/14, 14/16, 16/18; moves the least, since sm/default/lg/cta's shipped icons already sit at these numbers, turning his "mismatched" pairing into a stated rule); `text` (icon equals the text, the flattest reading) and `today` (only the text moves, literally what he saw) drawn as real contenders on the same real `<Button>` at every size plus the guest's raw Download, 1440 and 375; height never moves under any option (each size's own shipped `h-*`, measured not assumed); the winner wires at `button.tsx`'s cva table in a follow-up (`ladder-wiring`'s successor or a small lane)
- Calls his to overrule:
  - the caption measures five probes (`sm Download`, `xs Approve`, `default Share`, `cta`, `icon-sm`) rather than every button on the frame (the guest's `lg` block, review's Hide, the other three icon-only sizes are drawn and visible but not printed); one representative pair per tier was judged enough to read the pattern without a wall of numbers
  - the fix itself is not a design call (a frozen caption is a bug, not a reading), listed here only so its verification is not taken on faith: switching `pairs` on the plain board page now re-measures and updates every time (confirmed live, all three options, both widths; exact numbers in the Handoff's gates line)
- The help articles this lane makes stale: none (a lab round; no production copy or component changed)
- Assets requested from Will: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: the `sm Download` / `xs Approve` pair his note named directly (both now read cleanly at every pairing); the fact that the caption changes at all when you press between the three options on the board page, which is the whole bug

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). `body-type` round two on the button rung: resumed after the weekly-limit kill, the prior session's uncommitted board (spec, fixtures, board, surfaces) committed whole (`c1facebc`), then its own diagnosed bug fixed (`41770ef9`) — `MeasuredButtons`' measurement effect depended only on `[probes]`, a module constant, so it never re-ran when the board page's own control swapped `pairs` without remounting the tree, and the three options' shared box height meant the ResizeObserver never rescued it either; a per-swap change token (the frame's own id, unique per pairing and width) now forces a re-read. Three pairings (`text`, `step-up` recommended, `today`) drawn on the real Button at xs/sm/default/lg/cta and the four icon-only sizes, plus the guest's raw Download, at 1440 and 375, every number measured in the frame; height never moves under any option. Gate green on the synced tree (3053 tests, 255 pages, smoke 434, demo 1/1, 0 failing). The winner wires at `button.tsx`'s cva table in a follow-up.
