---
track: home-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "20cc9b5f"          # the launch-prep SHA the branch was cut from
board: app-shape       # wiring; the board itself is round two's, another lane
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/page.tsx
  - src/app/(app)/dashboard/loading.tsx
  - src/app/(app)/dashboard/actions.ts
  - src/app/(app)/dashboard/upgraded-toast.tsx
  - src/components/app/dashboard/following-section.tsx
  - src/components/app/dashboard/storage-meter.tsx
  - src/components/app/dashboard/dashboard-feed.test.tsx
  - src/components/app/dashboard/events-section.tsx
  - src/components/app/dashboard/filter-chips.tsx
  - src/components/app/dashboard/empty-section-teaser.tsx
  - src/components/app/dashboard/trash-section.tsx
  - src/components/app/dashboard/feed-section.tsx
  - src/components/app/dashboard/dashboard-feed.tsx
  - src/lib/dashboard/
  - src/lib/db/queries/profile.ts
  - src/lib/db/queries/pulse.ts
  - src/app/(app)/layout.tsx
  - src/components/app/user-menu.tsx
  - src/components/app/manage-billing-button.tsx
  - src/components/app/checkout-button.tsx
  - src/app/(app)/account/
  - src/app/(guest)/u/
  - src/components/social/profile-actions-menu.test.tsx
  - src/components/social/profile-actions-menu.tsx
  - src/components/social/guest-list.test.tsx
  - src/components/social/attended-events-visibility.tsx
  - src/components/social/connection-buttons.tsx
  - src/components/social/profile-slug-control.tsx
  - src/components/social/profile-bio-form.tsx
  - src/components/social/follow-button.tsx
  - src/components/ui/table.tsx
  - src/components/ui/toggle-group.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/shared/app-shell.tsx
  - docs/reviews/app-shape.json
  - src/app/(dev)/design/sandbox/app-shape/
  - src/lib/constants/tiers.ts
  - docs/systems/billing-caps.md
  - docs/systems/profiles-social.md
  - src/components/app/event-share-dialog.tsx
  - src/lib/event/
  - src/components/app/dashboard/events-empty-teaser.tsx
  - src/components/social/guest-list.tsx
---

# lp/home-wiring

**Goal.** Will's fifth batch (2026-09-19, build `69a9a17`) answered the four boards at the head of the desk; this lane is one of ten
cut from it. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- Owns: `src/app/(app)/dashboard/page.tsx`, `dashboard/loading.tsx` (mirrors the pulse, not the chips), `dashboard/actions.ts`,
  `dashboard/upgraded-toast.tsx` (by file: a `dashboard/` prefix would overlap `hub-wiring`'s `[eventId]/`),
  `src/components/app/dashboard/` (the pulse composed from the existing sections: `storage-meter`, `feed-section`, the
  review counts per event, `events-section` with the toggle and the new table view, `trash-section` folded into the
  list's filters; `events-empty-teaser.tsx` is `voice-wiring`'s and is composed untouched; `feed-section.tsx` and
  `empty-section-teaser.tsx` keep exactly one heading-tag label each, the type policy's existing entries; the lab imports
  `filter-chips`, `trash-section`, `storage-meter`, `feed-section`, `empty-section-teaser`: kept on disk, props intact),
  `src/components/app/event-card.tsx` and `event-card-qr.tsx` (the card keeps opening `EventShareDialog` by name; it opens
  the sheet the moment `hub-wiring` lands, no swap), `src/lib/dashboard/` (`filters.ts` is imported by the lab: its exports
  stay), one NEW query file under `src/lib/db/queries/` for the last hour's photographs (never `events.ts`, whose
  `getEventCardStats` the settings page shares), `src/app/(app)/layout.tsx` (the `UserMenu` props gain the slug from
  `getProfileMenu`), `src/lib/db/queries/profile.ts` (by file: `getProfileMenu` gains the slug; `hub-wiring` touches
  `(app)/layout.tsx` only on the `<AppShell` line under its own exception), `src/components/app/manage-billing-button.tsx`
  and `checkout-button.tsx` (by file: they live in `components/app/`, not under `account/`), `src/components/app/user-menu.tsx` (the rows: Your profile, Account; the theme submenu and Sign out kept;
  the `initial` and `ThemeSubmenu` exports kept for `guest-account-menu.tsx`), `src/app/(app)/account/` (a Plan card on
  `manage-billing-button.tsx` / `checkout-button.tsx`, the storage line, the tier; profile management stays),
  `src/app/(guest)/u/[slug]/` (the owner mode: when the viewer is the person, private sections for your uploads, your
  likes, the people you follow; the 11 px label at `page.tsx:348` moves to the label pair), `my-uploads-gallery.tsx` and
  `my-likes-gallery.tsx` (kept at their paths or re-exported from `social/`: the lab imports the first),
  `src/components/social/` (except `guest-list.tsx`, unowned, `hub-wiring` composes it), the new `src/components/ui/table.tsx`
  and `toggle-group.tsx` (shadcn radix-nova, hand-checked), `docs/systems/host-app.md` (its three sections only),
  `auth-accounts.md` (the account page's Plan card), `profiles-social.md` (the owner mode; the graph never counted or
  shown to anyone else). Reads: `shared/app-shell.tsx` (`hub-wiring`'s), the app-shape ledger, `sandbox/app-shape/` (never
  edits: round two's), `tiers.ts`, `billing-caps.md`, `event-share-dialog.tsx`, `lib/event/` (`hub-wiring`'s).
- The table: sortable by date, items, waiting, status; filters for saved and deleted; the same card anatomy at two sizes
  is NOT required (a row is a row). A host without a handle: "Your profile" opens the claim card on `/account` (the handle
  is free). The saved events and the bin become list filters, never a chip row.
- His worry, verbatim in the brief: the inbox existed "to make the full app feel more available & ready to action than a
  more limited and empty surface that doesn't feel actionable until more things start to happen (which creates a very
  boring and bland initial host experience sometimes)". The pulse for a host with nothing waiting must still read as a
  place with things to do: the first band is the NEXT BEST STEP per event, one pure function over real state in this
  order (a queue waiting; uploads paused; a live event with no reel, "Make the reel"; an event dated tomorrow, "Print the
  code"; no events, the wizard teaser, `voice-wiring`'s line; storage over 85 percent), never a queue that may be empty;
  "just arrived" widens its window until it holds twelve (the last hour, then today, then the newest across events) and
  says which ("newest, 3 days ago"); the storage line and the create door are always there; the arrivals keep the tile
  arrival fade (drop `data-static` there: it is the one place the fade tells the truth). `home-states` inherits these
  rules rather than re-inventing them; the lane lists what it chose for the three states.
- The list toggle persists in a COOKIE set by a server action (an honest first paint: a local preference would render
  cards on the server and swap to the table after hydration on every load); a `profiles.events_view` column for
  cross-device is a Question in the manifest (a migration is the Orchestrator's). The second view is the board's ruled
  `row` shape (the cover behind at 12 percent, the counts in columns) with a small sort menu ("Newest · Most waiting ·
  Name") and the saved/deleted filters, which lines up like a table without header chrome; a headed `ui/table.tsx` only
  if rows cannot carry the sort, his to overrule on the alias (he wrote "table"; the admin board may own the headed one).
  The DEFAULT view is the cover cards (his expectation for fewer events); the toggle remembers. "Connections" in the
  owner mode means the people you follow, as the dashboard's Following section is today; followers are never listed.
- The Plan card: the tier, the storage line, the event cap ("3 of 3 used" is the upgrade trigger), a pass's expiry,
  Manage billing, and the single-sourced Pro line from `voice-wiring` ("For videos and unlimited events."). The menu's
  header row (your name and avatar) is the profile door and "Account" stays a row: two doors, no third row, the phone
  measurement holds.
- Tests: `// @contract-for:` tests for the toggle's persistence and the table's sort, the owner mode's gate (a visitor never
  sees the private sections; `public-profile-visibility.test.ts` green), the Plan card's tier read (never trusting the
  client). Red-team on the alias: the pulse as `willg97` (Pro, events, a queue) and as `hi@willgibs` (Free, none) at
  1440 and 375, the toggle both ways and its persistence across a reload, the sort and the filters, the two menu doors,
  the Plan card, the owner mode on `/u/willg` signed in and its absence signed out and as another account.
- His to overrule: the pulse's four bands and their order, the next-best-step rule; the toggle's persistence (a cookie)
  and the default view; the second view's shape and its sort menu; the bin and saved events as list filters and "Deleted"
  naming one thing (the board's words, not his); the handle-less door; the Plan card's contents; connections as follows.

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

- **`profiles.events_view` for cross-device persistence.** A migration is the Orchestrator's, so this is a
  written proposal only: `alter table public.profiles add column events_view text not null default 'cards'
  check (events_view in ('cards','rows'));` plus the column on the authenticated write allowlist (it is a
  preference, not an entitlement). **Recommended: do not.** The cookie is per-browser, which is where a
  layout preference belongs, and it costs no row, no RLS surface and no write path. Revisit if Will asks for
  the view to follow him from laptop to phone.
- **No headed `ui/table.tsx` shipped.** He wrote "table"; the rows carry the sort and the filters above the
  list, which lines up like one without header chrome. **Recommended: leave it.** The admin board favours
  density and may own the headed table; building a second one here would pre-empt it.
- **Inline avatar editing in the owner mode.** His note allows the avatar to be changed in two places.
  **Recommended: the existing "Edit profile" door to `/account` is the whole fix now**; inline editing on the
  profile is a ROADMAP line, not this lane.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `host-app.md` `## Dashboard landing` — rewritten: the four bands, the next-best-step order, the widening
  window, the arrival fade as the one host exception, and why `pulse.ts` is not `events.ts`.
- `host-app.md` `## Events & the create flow` — one bullet added: the two views, the sort, the bin and saved
  as lenses, and why the view is a cookie rather than localStorage.
- `host-app.md` `## First-time host welcome` — one paragraph: where a host with no events lands, and why the
  first band is suppressed at zero events.
- `auth-accounts.md` "Where it lives" — the Plan card as billing's only front door, and that every fact on it
  is server-derived.
- `profiles-social.md` "Surfaces" — the owner mode, the gate-is-the-query argument, the Suspense rule, the
  revalidation fix; and the stale "Following dashboard chip" gotcha rewritten (the chip is gone;
  `getFollowedHostEventCards` keeps its home with no caller).

## Deferred (ROADMAP one-liners, bucket named)

- **The app and the kit** — `trackAttrs` is INERT on `(app)` surfaces: only the marketing layout mounts the
  delegated listener (`analytics/events.ts` says so in its own head). This lane added the attributes on its
  new doors because the round's ownership rules ask every new door to carry them. Either the rule means
  marketing doors, or `(app)` needs its own listener. Nothing fires today either way.
- **The lab and the kit** — `ui/toggle-group.tsx` ships `unspecimened` (the `sonner.tsx` precedent): it has
  one product call site and no Library mount. It earns a gallery entry when a lane owns `design/gallery/`.
- **Now** — `getFollowedHostEventCards` in `queries/social.ts` now has no caller. Kept (it is a real, tested
  read) for whoever wants a followed-hosts feed; delete it if nobody does by launch.
- **Now** — the row view shows date, items and waiting. The board's fixture also drew a guest count and a
  view count; neither has a cheap honest source (a distinct-uploader count needs an unbounded media scan,
  and views need analytics), so they were dropped rather than approximated.

## Handoff (replaces the chat report)

- Head `5bf00a42`, pushed; synced with `launch-prep` at `e9e3d25e` (merge `9d6398ca`, clean, no conflicts;
  it moved twice during the lane and carries only `PartyreelAI/`, the lab-review grammar and two test files,
  none of which this lane reads).
- Gates on the synced tree, each on its own exit code: design:rules ok (0), specimens ok (0), typecheck ok (0),
  lint ok (0, the 8 known warnings), test ok (0, 2753 passed / 1 skipped), build ok (0, 255 pages);
  `pnpm lab:smoke --base http://localhost:3133` ok (0, 442 checks, 0 failing). Lab-only demo: n/a (a production lane).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = 36 paths, all owned, **plus four exceptions**:
  - `src/app/(dev)/design/rules/component-notes.ts` — the round's ownership rules require a `for` line per new
    component, and the file's own head comment tells lanes to land at the top so the merges stay apart. Seven
    entries added there.
  - `src/components/shared/lit-edge-contract.test.ts` — the gate failed until the new arrivals strip was
    registered in its HOSTS table with its kind. The contract is closed by design; adding a host is the
    sanctioned way through it.
  - `src/components/ui/toggle-group.tsx` — owned. Named here only because generating it also wrote
    `src/components/ui/toggle.tsx` and a `cn` dependency in `package.json`; both were reverted (see below), so
    neither reaches the diff.
  - `event-card.tsx`, `event-card-qr.tsx`, `my-uploads-gallery.tsx`, `my-likes-gallery.tsx` — named in the
    brief as this lane's, omitted from the YAML `owns`, owned by no other lane. In the event **none of them
    needed an edit**: the card keeps opening `EventShareDialog` by name and the two galleries were composed
    at their existing paths with their props intact, so they do not appear in the diff at all.
- The items, one line each:
  - `home=pulse`: `/dashboard` is four bands. The first is a rule (`next-step.ts`), not a queue, which is the
    literal answer to his worry; an empty result renders a calm line and the storage line and create door are
    unconditional. Lands in the Library as **the next-best-step rule** and **the arrivals window**.
  - `home=pulse` (arrivals): the window widens hour → today → newest until it holds twelve and captions which
    (`arrivals.ts`); the tiles drop `data-static`, the one host surface where the fade is true.
  - `density=cover`: cover cards by default, rows behind a toggle opposite the heading, sort on the rows, bin
    and saved as lenses on one list. Lands as **`events-view.ts`** and **the events section**.
  - the toggle's persistence: a cookie set by a Server Action, verified by its contract test round-trip.
  - `you=?`: the three personal feeds moved to `/u/[slug]`'s owner mode; the component takes no parameters, so
    the gate can only fail safely. Lands as **the owner mode**.
  - `you=?` (money): a Plan card on `/account`, every fact from the webhook-written profile row.
  - the menu: two doors, "Your profile" (the claim card when handle-less) and "Account".
  - the inbox retires: `dashboard-feed.tsx` and `following-section.tsx` deleted (no importer); `filter-chips`
    and `trash-section` kept on disk with head comments, because the lab draws them.
- Calls his to overrule on the alias, one line each:
  - The four bands and their order, and the next-best-step precedence (his list, read as one step per event).
  - The toggle's cookie and cover-cards-as-default; the row shape and its three-item sort menu.
  - The bin and saved events as list filters, with the filter shown in BOTH views (it is the only door to the
    bin, so hiding it in the row view would strand a default-view host).
  - No headed `ui/table.tsx`.
  - **The menu's two doors are two ROWS, not a clickable header.** The brief offered the header as the profile
    door to buy it for zero rows; `DropdownMenuHeader` is a plain `<div>` with no `asChild`, and
    `ui/dropdown-menu.tsx` is another lane's this round. A bare `<a>` inside it is reachable by Tab but not by
    the arrow keys radix gives real menu items, so the one door a keyboard user looks for would be the one
    they could not walk to. The `w-56` measurement is horizontal (the submenu clearing 375) and a row does not
    touch it.
  - The handle-less door goes to `/account#public-profile`; connections mean the people you follow.
  - The Plan card's contents, and its position first on `/account`.
  - **The row does not wear `data-lit`**, though the board's draft did: the bright edge is closed to media,
    players and the QR card, and "a card, a menu and a button already have their step and their ring".
  - `EventsSection` became a client component so the sort and the lens are instant (the FilterChips
    precedent). Presigned URLs cross as props, as they already do for `MyUploadsGallery`; raw R2 keys never do.
- The help articles this lane makes stale, one line each (a `help-sync` lane rewrites them):
  - any article describing the dashboard as tabs/chips, or naming Uploads / Likes / Following / Deleted as
    chips on `/dashboard` — all four are gone.
  - any article telling a host to find their own uploads or likes on the dashboard: they are on their profile.
  - any article routing to a plan through the dashboard storage popover: `/account` has a Plan card now.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none shipped. One migration PROPOSED only
  (`profiles.events_view`, in Questions above), recommended against.
- Look at first: **the pulse for a host with nothing waiting** — that is the whole bet of his note, and the
  band that has to earn it. Then the toggle, flipped and then hard-reloaded (the cookie is the honest first
  paint, and a flip that does not survive the reload is the one failure that matters). Then `/u/willg` signed
  in versus signed out, which is the privacy edge.
- Not verified locally, and why: everything behind the sign-in gate (the pulse, the toggle's persistence, the
  Plan card, the owner mode signed in). Localhost cannot complete the allow-list-gated sign-in, so those are
  covered here by the contract tests, the component test's real-DOM toggle round-trip and a green build, and
  they want the Orchestrator's pass on the alias at 1440 and 375. What WAS verified locally at both widths:
  `/u/willg` signed out (no private section renders, zero personal queries run, the label pair landed) and
  `/u/nope` still answering 404, which is the route's standing landmine.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-20). `home-wiring` wired app-shape r1's four verdicts for the
host's home: `/dashboard` became a pulse whose first band is a RULE over real state rather than a review queue
(his worry about the empty surface, answered in `next-step.ts`), whose arrivals band widens its window until it
holds twelve and says which, and whose storage line and create door are unconditional; the events list gained
the row view behind a toggle remembered in a cookie set by a Server Action, with the bin and the saved events
as lenses rather than a chip row; the personal feeds left the home for an owner mode on `/u/[slug]` whose gate
is the query, not a boolean; `/account` grew the Plan card that is billing's first door; and the user menu grew
its second. The gate caught three real things on the way: shadcn's generated toggle-group imported `cn` from a
package it had added to `package.json`, the row had copied `data-lit` onto a card from the sandbox, and the
arrivals rule's own test proved a half-empty strip under a fresher label was worse than widening.
