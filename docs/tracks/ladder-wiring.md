---
track: ladder-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "20cc9b5f"          # the launch-prep SHA the branch was cut from
board: body-type       # six rungs wired here; the buttons rung is round two's, another lane
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/theme.css
  - src/app/globals.css
  - src/lib/utils.ts
  - src/lib/type-ladder-policy.test.ts
  - src/components/marketing/system/eyebrow.tsx
  - src/components/marketing/system/caption.tsx
  - src/app/admin/
  - src/components/reel/
  - src/lib/reel/engine/player.tsx
  - src/app/(dev)/design/(shell)/library/foundations/type-ladder.tsx
  - src/app/(guest)/e/[token]/page.tsx
  - src/app/(marketing)/(cinema)/about/page.tsx
  - src/app/(marketing)/(cinema)/blog/[slug]/page.tsx
  - src/app/(marketing)/(cinema)/blog/blog-list.tsx
  - src/app/(marketing)/(cinema)/careers/[slug]/page.tsx
  - src/app/(marketing)/(cinema)/help/[slug]/page.tsx
  - src/app/(marketing)/(cinema)/help/page.tsx
  - src/app/(marketing)/(cinema)/press/page.tsx
  - src/components/app/create-event-wizard.tsx
  - src/components/guest/event-experience.tsx
  - src/components/guest/guest-reel-overlay.tsx
  - src/components/guest/password-gate.tsx
  - src/components/guest/save-account-prompt.tsx
  - src/components/marketing/chrome/mega-panel.tsx
  - src/components/marketing/help/help-facts-band.tsx
  - src/components/marketing/help/help-palette.tsx
  - src/components/marketing/legal/legal-blocks.tsx
  - src/components/marketing/legal/legal-document.tsx
  - src/components/marketing/marketing-not-found.tsx
  - src/components/marketing/reading/chip-toc.tsx
  - src/components/marketing/sections/events/event-artifacts.tsx
  - src/components/marketing/sections/events/event-object.tsx
  - src/components/marketing/sections/features/album/attribution-stage.tsx
  - src/components/marketing/sections/features/album/quality-section.tsx
  - src/components/marketing/sections/features/album/review-switch.tsx
  - src/components/marketing/sections/features/album/take-home-section.tsx
  - src/components/marketing/sections/features/curation/reversibility.tsx
  - src/components/marketing/sections/features/curation/review-queue-demo.tsx
  - src/components/marketing/sections/features/guests/attribution-hero.tsx
  - src/components/marketing/sections/features/guests/credited-album.tsx
  - src/components/marketing/sections/features/guests/guest-list-card.tsx
  - src/components/marketing/sections/features/shared/feature-door.tsx
  - src/components/marketing/sections/features/sharing/downloads-section.tsx
  - src/components/marketing/sections/home/cinema-hero.tsx
  - src/components/marketing/sections/home/decomposition.tsx
  - src/components/marketing/sections/home/live-demo.tsx
  - src/components/marketing/sections/how-it-works/demo-door.tsx
  - src/components/marketing/sections/how-it-works/picture-parts.tsx
  - src/components/marketing/sections/pricing/calculator.tsx
  - src/components/marketing/sections/pricing/comparison-table.tsx
  - src/components/marketing/sections/reel/style-switcher-fallback.tsx
  - src/components/marketing/system/demo-ticket.tsx
  - src/components/marketing/system/eyebrow.tsx
  - src/components/marketing/system/stat-band.tsx
  - src/components/shared/floating-add-button.tsx
  - src/components/shared/kbd.tsx
  - src/components/shared/media-lightbox.tsx
  - src/lib/reel/engine/player.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/body-type.json
  - docs/design/rulings.md
  - src/app/(dev)/design/sandbox/body-type/
  - src/components/ui/button.tsx
  - docs/systems/design-system.md
---

# lp/ladder-wiring

**Goal.** Will's fifth batch (2026-09-19, build `69a9a17`) answered the four boards at the head of the desk; this lane is one of ten
cut from it. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- The steps, as tokens beside the heading steps in `theme.css` (each with `--line-height` and `--letter-spacing`
  companions, the rule 2 x size - 8): `reading` 16/24, `working` 14/20, `copy` clamp(16 at 375 to 18 at 1440) with a
  clamped leading, `caption` 12/16, `micro` 10/12 (the floor), `label` 12/16 on 0.08em uppercase (an `@utility` or the
  step plus `uppercase`; the lane picks one and the Eyebrow atom wears it). `TYPE_STEPS` gains the six names in ladder
  order; `extendTailwindMerge` unchanged in shape; `type-ladder-policy.test.ts` extended: the body scan (stock classes
  that equal a step are ON the ladder and may stay; `text-[Npx]` literals, `text-[0.8rem]`, off-step stock sizes and
  hand-set trackings on labels fail; depicted type exempt by the existing list plus the picture components named in the
  map; Button exempt until round two rules).
- The policy lands as a COUNT-PINNED ALLOWLIST THAT ONLY SHRINKS (the heading table's own shape), never a hard fail
  while four other lanes are open: the body scan resolves every size to a number and passes iff it equals a flat step (`text-xs` 12, `text-sm` 14, `text-base` 16, a px
  literal of 10/12/14/16); it fails 7/8/9/11/13/15/17 px, `text-[0.8rem]`, `text-lg` and up on body copy, and on an
  uppercase label any tracking but `tracking-[0.08em]`; depicted files stay exempt through the existing count-pinned
  table. Five pre-existing off-step elements sit in the app-shape lanes' files (`event-feed/feed-section-header.tsx:29`,
  `event-feed/event-feed-action-bar.tsx:69`, `dashboard/feed-section.tsx:16`, `dashboard/empty-section-teaser.tsx:28`,
  `(guest)/u/[slug]/page.tsx:348`): if the ladder lands before those lanes, exactly those five go in as count-pinned
  entries of a new kind `pending` ("hub-wiring rebuilds it on the label step"), red by design once the element is gone
  and deleted by the Orchestrator at that merge; if the app-shape lanes land first, zero entries. The `text-[15px]` on
  Button overrides (`entry-modal.tsx:385,496`, `enter-event-prompt.tsx:66,193`, `marketing-footer.tsx:220`) are button
  text, `buttons` round two's, not this sweep's.
- The sweep, by surface, in the lane's owned FILES only: guest (`(guest)/e/`, `guest/event-experience.tsx`,
  `password-gate.tsx`, `save-account-prompt.tsx`, `guest-reel-overlay.tsx`, and the rest of the grep's list; `text-[15px]`
  to `reading`), marketing copy (the fluid step on ledes and paragraphs; captions on `caption`; eyebrows on `label`;
  depicted type untouched; the nine files `voice-wiring` owns swept as exceptions after its merge), shared and ui (`kbd`,
  `media-lightbox` credit lines to `caption`/`micro`), `components/reel/` (eight files, about 25 off-step sites, in no
  other lane) and `lib/reel/engine/player.tsx`, `create-event-wizard.tsx`, `notification-bell`, admin (mapped where
  equal; its 13 px and density left for the `admin` board, said in the Handoff). NEVER `event-card.tsx`,
  `feed-section-header.tsx`, the filter pills or the action bar (the app-shape lanes').
- Owns (explicit files, from the grep, never a prefix another lane sits under; the grep yields about 99 files, 47 of them
  marketing): `src/app/theme.css` (released for the six steps and their companions only), `src/app/globals.css` (released
  for the label `@utility` only: `@utility` lives there, not in theme.css), `src/lib/utils.ts` (`TYPE_STEPS`),
  `src/lib/type-ladder-policy.test.ts`, `src/components/marketing/system/eyebrow.tsx`, `caption.tsx`, the swept files
  listed one by one in the manifest including each `src/app/(guest)/e/` file by name, `src/app/admin/` (a prefix nobody
  else owns; it holds no 13 px today, so "the admin's density" is a note, not a sweep), `docs/systems/design-system.md` (the type
  section in place; the component index gains `table.tsx`, `toggle-group.tsx` and the sheet's size as Handoff lines the
  Orchestrator adds), the Library's foundations page data (`pnpm design:rules`). Reads: the body-type ledger,
  `sandbox/body-type/` (never edits: round two's), rulings.md, `ui/button.tsx`.
- Tests: `type-ladder-policy` (the body scan green with the exception list), `two-faces-policy`, the contract tests of
  every touched component, `pnpm build`.
- Red-team on the alias: a guest album's reading copy measured at 16 on a phone (the pane at 375), the dashboard's body at
  14, marketing copy at 16 (375) and 18 (1440) with the leading on the 4 px grid, the event cards' chips at 10, every
  eyebrow at 12 on 0.08em, the admin untouched in density, reduced motion irrelevant.
- His to overrule: reading at 16 ("I'll test this in production once we implement it and may change later": provisional,
  said in STATUS); the two bottom steps (12 and 10) and which surfaces wear 10; the label at 12 (he may drop to 11); the
  fluid step's endpoints; the allowlist. The hard-fail flip is a one-line follow-up after the app-shape lanes merge.

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

- None escalated: every open call was taken on the brief's recommendation and is listed under "Calls his to
  overrule" below. One manifest discrepancy worth a line at the record: `docs/systems/design-system.md` sits in
  this manifest's `reads` while the brief's Owns paragraph names it ("the type section in place"). I followed the
  brief and refined the type section only; the convention (docs/systems files never sit in `owns`) is the one the
  Orchestrator confirmed mid-lane.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/design-system.md`, the **Type** section, refined in place, nothing appended:
  - the ladder's opening line reads "sixteen steps, one set" and names the two halves (ten heading, six body);
    the order law's sentence gains "and the body steps' own order with the FLOOR at the bottom".
  - a new block, **THE BODY HALF**, under the heading table: the count it replaces (372 `text-sm`, 244 `text-xs`,
    98 `text-[11px]`, 76 `text-[10px]`, 26 `text-[15px]`, 20 `text-[9px]`, 80 hand-set trackings), the face (Inter),
    the leading rule (`2 x size - 8`), a six-row table of what wears what, and the three rules the body half adds
    (`copy` never inside a `card-title` block; an uppercase label carries no tracking of its own; `working`'s name
    is its origin, not a fence, and the admin may break away for density).
  - "Five ways the ladder fails SILENTLY" becomes six, with the body scan written out: resolve to a number, pass on
    10/12/14/16 or a declared step, the allow-list that only shrinks and its five kinds, the `pending` red, and the
    blind spot both scans share (a class string that never reaches a JSX attribute).
  - the TWO FACES paragraph: `Caption` is "on the caption step".
- The component index's three additions (`table.tsx`, `toggle-group.tsx` and the sheet's size) are **not** in this
  lane's diff: they belong to `home-wiring` and `hub-wiring`, and the Orchestrator adds them at their merge.

## Deferred (ROADMAP one-liners, bucket named)

- **The design system** — flip the body scan to a hard fail (`BODY_EXCEPTIONS` to `{}`) once the allow-list is empty:
  one line, after the app-shape lanes merge and the `pending` entries go red.
- **The design system** — a `type-sync` follow-up (Sonnet) sweeps the 21 `lane` sites the boundary kept this lane out
  of: voice-wiring's eleven files after its merge, and the four unowned marketing ledes still on a flat `text-lg`
  (`event-statement`, `qr-hero`, `reel-hero`, `wysiwyg-section`) which are exactly what `copy` is for.
- **The design system** — the mechanical rename of the 76 surviving `text-[10px]` to `text-micro`: they are ON the
  step and pass the scan, so this is naming, not sizing, and it rides any lane that opens those files.
- **The design system** — `src/components/admin/` is owned by no manifest; the `admin` board's wiring should claim it
  (three of its sizes sit in this lane's allow-list under `board`).
- **The lab and the kit** — `rules.generated.json` was 36 contract line numbers stale on `launch-prep`; the gate's own
  `pnpm design:rules` corrects it in whichever lane runs next, which makes every lane's diff touch a file it does not
  own. A post-merge regeneration by the Orchestrator would stop that recurring.

## Handoff (replaces the chat report)

- Work head `d693dc81`, with this manifest committed alone on top of it; pushed. Cut at `e271729a`; **synced**: `origin/launch-prep` had moved to `e9e3d25e` (the `call:`
  grammar and PartyreelAI), merged at `4aa4edfc`, clean, no conflicts.
- **Gates on the synced tree**, each on its own exit code: `pnpm design:rules` **0** · specimen collector **0**
  (artifact unchanged: no `gallery-demos.tsx` was touched) · `pnpm typecheck` **0** · `pnpm lint` **0**
  (8 problems, 0 errors, 8 warnings = the baseline) · `pnpm test` **0** (**2722 passed**, 1 skipped) ·
  `pnpm build` **0** (126 routes) · `pnpm lab:smoke --base http://localhost:3132` **0** (435 checks, 0 failing).
  Dev server on **:3132** only, killed by port before each build, the test run and this handoff.
- **Lane check** — `git diff --name-only origin/launch-prep...HEAD` = **64 files, 60 of them owned outright**. The
  four outside `owns`, each declared:
  - `docs/systems/design-system.md` — the type section refined in place (the brief's Owns paragraph names it).
  - `docs/design/library.md` and `src/app/(dev)/design/rules/rules.generated.json` — **regenerated by
    `pnpm design:rules`, which is a gate step**. Mine in them is 4 lines (the policy's own `@policy` / `@refuses`
    header, which had to change to stop lying about what the file refuses) + 36 contract line numbers the merge
    moved, which were already stale on `launch-prep`. Drop the 36 with one `git checkout` if you would rather own
    them at the record.
  - `src/app/(dev)/design/(shell)/library/foundations/page.tsx` — **three blurb strings**, no logic: they said "one
    ten-step ladder" and "Ten steps, one set", which the page now contradicts on screen.
- **The items, one line each** (the board's seven; six wired, one round two's):
  - `reading=16`: every guest-facing sentence on `--text-reading` (16/24). The 26 `text-[15px]` are gone. Lands as the Library's **Reading** rung.
  - `working=14`: `--text-working` (14/20) for the app, the admin and marketing's own UI chrome. Lands as **Working**.
  - `marketing=fluid`: `--text-copy`, `clamp(1rem, 0.956rem + 0.19vw, 1.125rem)` with a clamped leading byte-identical to `--text-page` — both printed by the retired board's own `fluid()`, recovered from `41dcd591^`. Lands as **Copy**.
  - `caption=10` read as TWO rungs, per his note: `--text-caption` 12/16 for the labels he named, `--text-micro` 10/12 as **the floor**. Lands as **Caption** and **Micro**.
  - `label=12-08`: `--text-label` 12/16 on 0.08em; the Eyebrow atom wears it and the 38 hand-set `tracking-[0.14em]` (plus the 0.16/0.24/0.1em strays on labels) are **deleted**, not paired, because a tracking utility beats a step silently. Lands as **Label**.
  - `leading=length`: every rung on `2 x size - 8` (12/16/20/24/28), pinned by a new test that reads it off the tokens at both ends.
  - `buttons=ladder` "more work required": **untouched**. `ui/button.tsx` and the five `text-[15px]` Button overrides sit in the allow-list under `board` for `buttons-pairs`.
  - The policy: a sixth silent-failure way, a **count-pinned allow-list that only shrinks** (five kinds, 101 survivors named and reasoned), plus two new laws read off the tokens (the body order with micro on the floor; the leading rule).
  - The sweep: the scan found **213** off-ladder sentences; **112 moved** in this lane's own files; 101 are named in the allow-list, 78 of them for a reason that is not fixable here (drawn in a picture, sized in em, another lane's, another board's).
- **Calls his to overrule on the alias**, one line each:
  - **The six names** — `copy` / `reading` / `working` / `caption` / `label` / `micro`. The board deliberately did not ask (its spec: "a decision whose options look identical is a paragraph pretending to be a step"), so these are the brief's and mine.
  - **`label` is a step in theme.css, not an `@utility` in globals.css** — so **globals.css was not touched at all**. Reason, measured and already written in the tree: Tailwind v4 emits a custom `@utility` in the font-* position, *ahead* of the size utilities, so any `text-sm` on the same element would beat it; and tailwind-merge cannot see an `@utility`, so `cn()` would keep both. Those are two of the five ways this policy exists to stop.
  - **The trackings** — 0 / 0 / 0 / +0.005em / +0.08em / +0.01em. They follow the retired board's OPTICS table where it reaches (12 -> +0.005) and its written law below it. **The two 16px steps take 0, not `card-title`'s -0.006em**, because that value is Urbanist's correction at 16 and these steps are read in Inter.
  - **`copy` never goes inside a `card-title` block** — it reaches 18 at 1440 and `card-title` is a flat 16, so an FAQ answer on `copy` would outrank its own question. Those blocks keep `reading`. It is the same order law that made 17 the wrong answer for `reading`. Written into design-system.md.
  - **The 11px mass split by ROLE, not arithmetic**, straight from his note: a label to 12 (`caption` / `label`), metadata over a photograph to 10 (`micro`). 98 sites, judged one at a time.
  - **The sub-floor rises** — 7/8/9px in real UI went to the floor at 10; 7/8/9px inside a picture stayed and is named `depicted`. **Eleven small overlay chips grew from 8 or 9px to 12** because they are uppercase word-labels and his label ruling is 12: the reel's vertical style rail (`style-rail.tsx`, `[writing-mode:vertical-rl]`), the studio's "The studio" and sheet labels, the moments picker's "Suggested" strip, the poster card's "REEL" badge. **These are the likeliest to want overruling**, and the reel studio needs a host session so I could not put eyes on them in situ — the rest measured clean.
  - **`working`'s name is its origin, not a fence** — a blog rail row and a dashboard row are the same job at 14, so marketing's own UI chrome takes `working` rather than inventing a second 14.
  - **Two hero subs moved to `subhead`** (`blog/[slug]`, `careers/[slug]`): they were a flat `text-lg` with a `sm:text-xl` ramp, and `subhead` is the step his own `the-ladder=reading` ruling tuned to 20 -> 22.
  - **A price numeral took `subsection`** (`calculator.tsx`): `text-section` is the documented home for a stat numeral but runs 24 -> 52, far too loud for a recommendation chip; `subsection` (18 -> 20) is the rung it already wore.
  - **The admin was mapped where equal and nowhere else** — its `text-sm` / `text-xs` were already on the ladder, its two uppercase labels took `text-label`, and **its three health numerals were left alone** on his own words ("our internal admin portal favors information density and can break away from this if helpful"). It holds no 13px today. The `admin` board gets the rest.
  - **Every hand-set `leading-*` beside a new step was deleted** (`leading-7`, `leading-8`, `leading-relaxed`, `leading-[1.7]`, `leading-4`, `leading-none`), because a leading utility beats the step. That is the rhythm change most likely to read as "something moved" on a paragraph.
- **Measured** (computed style, headless Chrome over CDP, both widths, every swept page): `copy` **16.01/24.02 at 375 and 18/28 at 1440** (the 0.0085px is `fluid()`'s 2dp rounding, shared with `page`, `subsection` and `subhead` — not new) · `reading` **16/24** on the guest album at 375 · `working` **14/20** · `caption` **12/16/0.005em** · `label` **12/16/0.96px = 0.08em** · `micro` **10/12/0.01em**. **No horizontal overflow and no clipped element** on `/`, `/about`, `/help`, `/press`, `/pricing`, `/how-it-works`, the four feature pages, `/blog`, `/careers`, `/reel`, `/events`, `/terms` and the guest album, at 1440 and at 375. The Library draws sixteen rungs with the body six in Inter and the `label` row in caps, every number read back off the live token.
- **The help articles this lane makes stale: none.** The sweep changed sizes and not one word of copy; no help article describes a type size.
- Assets requested from Will: **none**.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none**.
- **Look at first**: the eleven small uppercase chips that grew to 12 (the reel studio's rail and sheet labels above all, which need a host session), then a marketing paragraph's new rhythm where a `leading-*` was removed (`/about`'s two columns are the clearest), then `/design/library/foundations#ladder` for the whole ladder in one screen.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-20). Six of `body-type` r1's seven rungs became tokens beside the
heading ladder in `theme.css`, printed by the same `fluid()` that printed the headings: `copy` 16 -> 18, `reading`
16, `working` 14, `caption` 12, `label` 12 on 0.08em, `micro` 10 and the floor, every leading `2 x size - 8`.
`label` landed as a STEP rather than an `@utility` because Tailwind emits an `@utility` ahead of the size utilities
and tailwind-merge cannot see one, so `globals.css` went untouched. `type-ladder-policy` gained a sixth silent-
failure way (the body scan: every size resolved to a number, passing only on a rung or a declared step, and an
uppercase label carrying no tracking but 0.08em) as a count-pinned allow-list that only shrinks, plus two laws read
off the tokens. The sweep moved 112 of the scan's 213 sites; the Library draws sixteen rungs with the body six in
Inter, and `design-system.md`'s type section carries the table and the three rules the body half adds.
