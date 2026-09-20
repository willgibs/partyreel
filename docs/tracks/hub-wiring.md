---
track: hub-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "20cc9b5f"          # the launch-prep SHA the branch was cut from
board: app-shape       # wiring; the board itself is round two's, another lane
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/[eventId]/
  - src/lib/event/
  - src/components/app/host-command-strip.tsx
  - src/components/app/event-feed/
  - src/components/app/share/
  - src/components/app/event-share-dialog.tsx
  - src/components/app/event-qr.tsx
  - src/components/app/copy-share-link.tsx
  - src/components/app/qr-designer-dialog.tsx
  - src/components/app/qr-preset-picker.tsx
  - src/components/app/styled-qr.tsx
  - src/components/app/event-settings/
  - src/components/app/event-slug-control.tsx
  - src/components/app/recently-deleted-grid.tsx
  - src/components/shared/app-shell.tsx
  - src/components/shared/crumbs.tsx
  - src/components/ui/sheet.tsx
  - src/components/ui/floating-layer.ts
  - src/components/ui/floating-layer.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/social/guest-list.tsx
  - src/components/app/host-media-grid.tsx
  - src/components/shared/masonry.tsx
  - src/components/shared/media-lightbox.tsx
  - src/components/app/reel-panel.tsx
  - src/components/reel/
  - src/components/app/export/
  - src/lib/constants/tiers.ts
  - docs/reviews/app-shape.json
  - src/app/(dev)/design/sandbox/app-shape/
  - src/components/marketing/system/morph-delegate.tsx
  - src/app/(app)/layout.tsx
  - docs/systems/host-app.md
---

# lp/hub-wiring

**Goal.** Will's fifth batch (2026-09-19, build `69a9a17`) answered the four boards at the head of the desk; this lane is one of ten
cut from it. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- Owns: `src/app/(app)/dashboard/[eventId]/` (the page as the hub: the QR at the left of the title + metadata stack, the
  subtle link with its copy button under the metadata, the cards row, the gallery below in most-recent order with the
  Deleted filter; `loading.tsx` reshaped so the old strip never flashes; the `settings/` route redirecting to the event
  with the sheet open so bookmarks survive; `reel/` kept, its `redirect(?section=reel)` re-pointed once sections are
  cards), `src/lib/event/` (`sections.ts` and its test; its consumers are all this lane's), `src/components/app/host-command-strip.tsx`
  (deleted: its only importer is the event page), `src/components/app/event-feed/` (the sections become the cards and the
  gallery; `use-selection`, `FeedSectionEmpty` and `SelectableMediaGrid` keep their paths for `host-selection-provider`,
  `event-uploads` and `host-media-grid`; `feed-section-header`, `event-filter-pills`, `review-section`, `use-review-triage`
  stay on disk for the lab; the three `mock-parity` literals in `review-actions.tsx` and `review-section.tsx` kept), the
  new `src/components/app/share/` (the share sheet on `ui/sheet.tsx`: the code at 320 with `event-qr.tsx`'s downloads and
  the designer, the link with copy, the custom link claim from `event-slug-control.tsx` with its Pro gate untouched,
  posters and the invite as today's pieces allow; the QR mini-modal with a view transition in the house register on the
  marketing `morph-delegate.tsx` pattern, reduced motion honoured; both read `ui/floating-layer.ts` and carry no glass
  and no radius token of their own, `floating-layer.test.ts` refuses either), `event-share-dialog.tsx` KEPT as a thin
  wrapper exporting `EventShareDialog` with all nine of its props over the new sheet (so the dashboard card and `first-event`'s
  `lives` stay true; no import swap anywhere), `event-qr.tsx`, `copy-share-link.tsx`, `qr-designer-dialog.tsx`,
  `qr-preset-picker.tsx`, `styled-qr.tsx`, `src/components/app/event-settings/` (the cards inside the settings sheet;
  `profile-social-card.tsx` stays a card in it; `uploads-section.tsx`'s pinned literal kept), `event-slug-control.tsx`,
  `recently-deleted-grid.tsx` (the bin as the gallery's filter; the file stays for the lab), `src/components/shared/app-shell.tsx`
  and a new `shared/crumbs.tsx` context the event page sets (the crumbs, the rooms row, the phone's narrowed header;
  `data-app-wide` has two production consumers, both this lane's, and two in the lab, `sandbox/app-shape/chrome.tsx` and
  `sandbox/first-event/frame.tsx`, which keep working), `src/components/ui/sheet.tsx` (the responsive side is OPT-IN by
  prop; the default side stays for `marketing/chrome/mobile-menu.tsx` and the design shell; `ui/drawer.tsx` is not
  retired, the lab's gallery demos draw it),
  `docs/systems/host-app.md` (its four sections and the one Reel line; the share surface gets its one home here).
  `src/app/(app)/layout.tsx` is `home-wiring`'s: this lane's only edit there is the `<AppShell` line, as its exception
  after syncing. Reads: `guest-list.tsx`, `host-media-grid.tsx`, `masonry`, `media-lightbox.tsx` (untouched: the glass
  lane's and `media-viewer`'s), the reel panel and studio (the Reel card's door), `export/` (Download stays the
  gallery's own control), `tiers.ts`, `GATED_EVENT_SETTINGS`, `ui/floating-layer.ts`, the app-shape ledger,
  `sandbox/app-shape/` (never edits).
- The creative call he asked for: how Share stays reachable from the sticky cards row. The answer in the brief: the
  cards condense into the existing sticky pill row (`event-filter-pills.tsx` already sticks at `top-14` and condenses on
  its sentinel, ratified motion), and a QR pill appears at the row's end ONLY while the header's code is out of view, so
  nothing is duplicated at rest; the pill carries the view-transition name while stuck. The event's menu holds Share too.
- The hub as one object (the brief's design rules, his to overrule on the alias): the header QR is a live `StyledQr` at
  about 112 px (a 33-module code scans at arm's length), its height the title + metadata + link stack, its left edge on
  the one line the logo, the cards row and the album's first column share; the two header chips leave: "accepting
  uploads" becomes the code's own state (paused = the code dimmed with "Paused" over it, flipped from the settings sheet
  with the door dimming behind it) and visibility rides the Settings card's value line. The subtle link shows the pretty
  URL (the slug when set, else the `/e/` link middle-truncated at 375) and copies the permanent one; Copy is the check
  and the word "Copied" in place, a 90 ms scale pop on `--ease-emphasis`, no toast, announced through `aria-live`. The
  code morph runs 240 ms on `--ease-emphasis`, reduced motion a fade. On a phone the mini-modal is the whole screen,
  white, the code at 80 vw with the event name under it (a host at the door holds the phone up) and the OS share sheet
  its third action (`navigator.share`, the `guest-share.tsx` pattern). The Review card's count ticks down on return
  (tabular figures, 200 ms) and its amber drains at zero. Every new door takes the house press feedback.
- Rooms and sheets: Review, Reel and Guests are ROOMS (routes with a crumb: `review/`, `reel/` as today, `guests/`), the
  board's "a door into each room" and his crumbs "Partyreel / the event / the room"; Settings and Share are SHEETS (his
  override); the gallery is the hub page itself. `?section=review` deep links redirect to the room. `HostUpload` (Add
  photos) leaves the deleted strip for the gallery's header cluster beside Download and Select; the Reel card reads
  "Create reel" until a reel exists (the studio route redirects on a null config today). The sheets ride the URL: one
  client island at the hub root owns `room: share | settings | null`, open pushes `?room=`, close calls `history.back()`
  only when `history.state` carries our marker, `popstate` closes; the mini-modal has no URL; Radix portals keep the
  album mounted and the island survives `router.refresh()` after a settings action. The Deleted filter loads the bin only
  when chosen (never N extra presigns on every hub render). The empty album's "share the QR code" line becomes a door to
  the share sheet, Add photos the second door. The crumb cuts at 375 to the parent step ("‹ Sarah and Tom's…") and the
  h1 carries the name once; `<nav aria-label="Breadcrumb">` with `aria-current`; the cards row is a `role="group"` of
  links, never tabs, and the stuck condensation never remounts it; the QR is a `<button aria-label="Show the code for
  {event}">` beside the h1, never inside it. The view transition needs a sanctioned "no entrance, the transition is the
  entrance" case in `ui/floating-layer.ts` and its test (this lane owns both for that one clause; reduced motion falls
  back to the standard clock).
- The minimum handoff, if the night runs short: the hub with the gallery beneath, the QR door with its mini-modal and
  copy link, the crumbs, the settings sheet, the wrapper; the share sheet's posters and invite and the sticky-Share
  creative may ride a follow-up, said in the Handoff. His "Get the QR and sharing more infusion to the album UI
  visually" is an invitation: the lane may propose more than the QR and the link and lists it. What `front` offered ("On
  the event itself, always there": "I did like your option 3 a lot") is carried by the header's live code, always there.
  At 375 the cards row must sit inside the first viewport on load ("immediately visible at the top of the page"):
  measured, since the QR, the title, the metadata and the link now sit above it.
- Tests: `// @contract-for:` tests for the crumbs (one way back on every route), the sheets (the album stays mounted
  behind; the settings deep link opens the sheet), the QR mini-modal (a real code encoding the event's link; the copy
  control), the phone row (scrollable, the gradients only on overflow), the Deleted filter (the bin's items never in the
  album's count). Red-team on the alias: the disposable event as `willg97` at 1440 (Chrome) and 375 (the pane): the hub,
  every card's door, the QR and its mini-modal, the copy button, the share sheet whole (the code's data read from the SVG,
  never a Copy control in the pane), the settings sheet (a setting changed and the album behind it moving), the crumbs
  from the reel studio and from settings, the sticky row, reduced motion.
- His to overrule: the cards' order and counts; Share's place in the sticky row; the mini-modal's contents; the sheet's
  width; the photo bin as the album's filter and "Deleted" naming one thing (the board's words); the phone's gradients;
  guest-side select (his "select allowing multi-item handling" names the host's mode today; a guest select is a product
  question for the glass wiring, not this lane).

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

- none raised mid-lane. Every open call in the brief was taken as recommended and is listed under "Calls his to
  overrule" below. No new one-way-door decision was reached.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/host-app.md` `## The event page` — rewritten for the hub: the header as one object (the live code,
  the two retired chips, the third subtle link), the cards row and its conditional QR pill, the rooms, the two
  URL-backed sheets with the Next `popstate`/`__NA` landmine written down, the mini-modal's sanctioned entrance, the
  album with the bin as its filter, and the one responsive Sheet.
- `docs/systems/host-app.md` `## Moderation & curation (host side)` — the inline urgency-ordered Review SECTION
  becomes the Review ROOM; the triage machine's owner and the moderation-off confirm's home (the settings sheet)
  corrected; the FLIP sentence dropped with the stack it described.
- `docs/systems/host-app.md` `## QR designer` — the chain ends in the share SHEET, and `StyledQr` is named as the one
  renderer behind the header code and the mini-modal too.
- `docs/systems/host-app.md` `## Custom event link (slug)` — the control's home is the share sheet, not a settings card.
- `docs/systems/host-app.md` `## Reel curation` — one line: the room holds the builder before birth and the Studio
  after it, which is what deleted the `?section=reel` redirect.

## Deferred (ROADMAP one-liners, bucket named)

- **Host app:** the share sheet's POSTERS and INVITE sections. His `share` note asks the sheet to hold "all current and
  any future sharing functionality"; the product ships no poster generator and no invite-by-email, so the sheet holds
  the code, its downloads, the designer, the link and the slug claim. Neither is a stand-in in the UI.
- **Host app:** the hub's header at 375 is unmeasured against his "immediately visible at the top of the page" (see
  "Look at first"). If the cards row does not clear the fold, the header compresses (the code to ~96, the metadata
  folding) before anything is cut.
- **The lab and the kit:** `event-feed.tsx` and `event-feed-action-bar.tsx` are now lab-only with no lab importer of
  their own. They stay on disk untouched this round; a later lane should either give them a head comment naming the
  board that draws them or delete them with it.

## Handoff (replaces the chat report)

- Head `10f3ae18`, pushed; synced with `launch-prep` at `e9e3d25e` (merge `28432d98`; it had moved by one commit,
  `lab-tides`' review grammar, which touched no path of this lane's).
- Gates on the synced tree, each on its own exit code: `design:rules` ok (0) · specimens ok (0, 131 specimens on 94
  entries) · `typecheck` ok (0) · `lint` ok (0, 8 known warnings) · `test` ok (0, **2754 passed**, 1 skipped, 258
  files) · `build` ok (0, **255 pages**) · `pnpm lab:smoke --base http://localhost:3134` ok (**447 checks, 0 failing**).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = 34 files, all under `owns` except four, each expected:
  `src/app/(dev)/design/rules/component-notes.ts` (the eleven `for` lines the ownership rules require, added as ONE
  block at the head so parallel lanes land on distinct hunks), `src/app/(dev)/design/rules/rules.generated.json` and
  `docs/design/library.md` (both generated by `pnpm design:rules`; the second commit is line-number drift only, caused
  by the merge shifting `registry.test.ts`, and is committed because the artifact IS the gate), and
  `docs/systems/host-app.md` (the five section bodies named above). ★ **`src/components/app/event-uploads.tsx` was NOT
  touched** and needs no exception: the empty album's door to sharing is a control in this lane's own
  `event-gallery.tsx`, under that component's copy, rather than an edit to another lane's file.
- The items, one line each:
  - `event=hub`: the page is the code + title/metadata/link header, the cards row, then the album. Kept. Lands in the
    Library as **the event hub** (`event-cards-row`, `event-gallery`).
  - the live code at the left: a real ~112px `StyledQr`, not a glyph. Kept → **`event-code-door`**.
  - the two header chips retired: "accepting uploads" is the code's own dimmed/"Paused" state (with
    `title="Uploads paused"`, which is also what keeps the help centre's `<UiLabel>` honest); visibility rides the
    Settings card's value line. Kept.
  - the third subtle link: shows the pretty URL, copies the permanent one, confirms in place with a 90ms pop and an
    `aria-live` line, no toast. Kept → **`event-link-row`**.
  - the mini-modal on the native View Transitions API, 240ms on `--ease-emphasis`, name-scoped in
    `share/share.css`; whole-screen and white on a phone with `navigator.share` third. Kept → **`event-code-modal`**.
  - `nav=crumbs`: the trail in the bar, cut to the parent step at 375. Kept → **`crumbs`**.
  - `share=room` → a SHEET (his override): one surface holding the code, its downloads, the designer, the link and the
    slug claim. Kept → **`event-share-sheet`**; `event-share-dialog.tsx` survives as a nine-prop wrapper, no import
    swap anywhere.
  - `settings=sheet`: the shipped form over the album, the unsaved guard grown a third door, `/settings` redirecting.
    Kept → **`event-settings-sheet`**.
  - Review / Reel / Guests as ROOMS with crumbs; the Reel room holds the builder pre-birth, which deleted the
    `?section=reel` redirect instead of re-pointing it. Kept.
  - the bin as the album's Deleted filter, fetched on demand through a `getUser()`-gated Server Function. Kept.
  - ONE responsive Sheet, opt-in by prop, on a `data-side` of its own. Kept → **`ui/sheet`**, the sheet `guest-shape`,
    `profile-page` and `app-pricing` inherit.
- Calls his to overrule on the alias, one line each:
  - **The trail is in the BAR and lands at hydration.** A page cannot hand a prop up to its layout and CSS cannot
    carry an event's name, so `CrumbsProvider` lives in `AppShell`. The bar's height is fixed, so nothing shifts. The
    server-perfect alternative (a sticky band below the bar, owned by an event layout) puts the trail somewhere he did
    not draw it. Upside: `(app)/layout.tsx` needed **no edit at all**, so the `home-wiring` exception disappeared.
  - **Share's place in the sticky row** is a QR pill at the row's end that exists only while the header's code is off
    screen, so nothing is duplicated at rest.
  - **The Reel room holds the builder pre-birth.** This deletes a redirect rather than re-pointing it; the card reads
    "Create reel" until a reel exists.
  - **The Deleted filter loads lazily.** Each binned item needs its own presign and the hub must not pay N of them for
    a drawer opened once.
  - **The cards' order and their value lines** (Review's count / "All caught up" / "Off"; Reel's clip count or "Create
    reel"; Guests' contributor count or "Turn on the list"; Settings' visibility word).
  - **The mini-modal's contents** (the code, the name, the pretty URL, then Copy link · Share · Everything).
  - **The sheet's width** (`sm:max-w-md` at a desk, `max-h-[85svh]` as a bottom sheet in a hand).
  - **The phone's gradients** are masks, not overlaid gradients, so they work over any background the row is stuck on.
  - Guest-side select was NOT touched: his "select allowing multi-item handling" names the host's mode today, and a
    guest select is a product question for the glass wiring.
- The help articles this lane makes stale, one line each (a `help-sync` lane rewrites them):
  - `your-event-page-explained` — describes the command strip, the filter pills and the stacked sections; all three are
    gone. Its `<UiLabel>` quotes still resolve, so the gate is green and the PROSE is what is stale.
  - any article routing a host to `/settings` for event settings, the event link or the Deleted bin: the first is a
    sheet, the second moved to the share sheet, the third is the album's filter.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Look at first:**
  1. ★ **The one gap in the verification, named rather than downgraded.** The local signed-in pass could NOT be run:
     the host app is gated by `getUser()`, and Google OAuth will not redirect to `http://localhost:3134` (no entry in
     the allow-list for that port), while the lane is pinned to :3134 and may never type a password or an OTP. What WAS
     verified locally: every new route resolves and the auth gate holds (`/review`, `/guests`, `/reel`, `/settings`,
     `?room=settings`, `?section=review` all 307 to `/login`), plus the whole gate and `lab:smoke`. **The hub, the
     mini-modal's morph, the sticky row, the sheets and the crumbs have not been seen rendered at 1440 or 375** and
     need the Orchestrator's alias pass.
  2. **At 375, whether the cards row sits inside the first viewport on load** (his "immediately visible at the top of
     the page"). The QR, the title, the metadata and the link now sit above it; this is the measurement the lane could
     not take.
  3. **The morph, on a real device.** Whether exactly one of header / pill / modal ever carries the name (a duplicate
     makes the browser skip the transition silently), and the pill's handover as the header's code scrolls away.
  4. **The sheet's Back**, which is where the Next `__NA` landmine lives: open Settings, press Back, confirm the panel
     closes and the page does NOT reload; then land on `?room=settings` from a fresh tab and confirm closing replaces
     the URL instead of leaving the app.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-20). The event page became a HUB on Will's five `app-shape` verdicts: a
live, scannable code as the header's left column with the title, metadata and a third subtle link beside it (the two
status chips retired into the code's own dimmed "Paused" state and the Settings card's value line), a sticky row of
four card-doors that condenses in place and grows a QR pill only while the header's code is off screen, and the album
beneath as the page's subject with the recovery bin as its Deleted filter, fetched on demand. Review, Reel and Guests
became rooms under a crumb trail that lives in `AppShell` (so the app layout needed no edit), the Reel room absorbed
the builder and deleted the `?section=reel` redirect, and Settings and Share became sheets on one island where `?room=`
IS the state and the history marker rides as a field on the state Next merges. The floating contract gained the one
responsive sheet and the one sanctioned "the transition is the entrance" case; `EventShareDialog` survived as a
nine-prop wrapper so nothing imported it differently. Gate green on the synced tree; the signed-in visual pass is the
Orchestrator's, named in the Handoff.
