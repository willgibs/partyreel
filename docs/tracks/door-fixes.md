---
track: door-fixes
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "23c7ac93"          # the launch-prep SHA the branch was cut from
board: none            # production follow-up: the door red-team's two defects on the alias (the stricter drift, the 304's heal); no board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/live-gallery.tsx
  - src/components/guest/live-gallery.test.tsx
  - src/components/guest/event-experience.tsx
  - src/app/api/guests/gallery/
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/guest/session-cookie.ts
  - src/lib/guest/use-stored-session.ts
  - src/lib/events/gallery-access.server.ts
  - src/lib/events/gallery-fingerprint.ts
  - docs/design/rulings.md
---

# lp/door-fixes

**Goal.** A production follow-up cut by the Orchestrator from the red-team on the `launch-prep` alias (2026-09-21, build `27ff8a9e`, the door round whole): the two defects it found in the door's wiring, fixed in place. No board, no new ruling, nothing reopened: the rulings this wiring answers are in `docs/design/rulings.md` under "the door as three steps", and every one stands as wired. The lane's brief follows; read it end to end before the first edit.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `23c7ac93`)

- What this is: the red-team of the door on the alias at `27ff8a9e` (22:58 to 23:18 EDT 2026-09-21; the pane at 375 signed out in both switch states, the password event, verified mode to its hold, the demo; Chrome as the host; the poll, the guest export and the reel download by curl) found every case of the plan's Verification list holding and two small defects. This lane fixes them and nothing else: NO board, no ruling reopened, nothing renamed on disk (the lab keys on the guest paths), and `src/app/(dev)/design/sandbox/guest-capture/` is `reshape-guest-capture`'s, running beside you: never touch it.
- DEFECT 1, a stricter drift moves the grid before the guest's next act: a name-only guest stood inside the full album (54 tiles, "54 photos & videos from 6 guests", Add present) while the host turned Require an upload to view ON (by SQL, 03:02:42Z); within one poll the grid held 9 tiles and the count line read "9 photos & videos from 6 guests", while no sheet appeared and Add stayed (the refresh waited, as `live-gallery.tsx`'s `onAccessDrift` and the page's deferred refresh intend); the next Add met the door's upload step, and only then did the CTA "See all 54 photos & videos" arrive. The plan's rule is that a STRICTER drift never yanks an open album out from under a thumb; the poll's narrower payload is what yanked it. Fix: when a poll's decision is stricter than the one the gallery holds (full to teaser, or a gate appearing), `LiveGallery` keeps its current items and counts and does not apply the narrower payload, still calling `onAccessDrift` once so the page defers the refresh to the next act as today; a LOOSER drift applies at once as today; the count line under full access keeps counting the loaded items. Contract tests in `live-gallery.test.tsx`: a full gallery receiving a teaser payload keeps its items and its count and fires the drift callback exactly once; a teaser gallery receiving a full payload applies it and fires the callback once; a new `access` prop (the next act's refresh) remounts on the new payload as today.
- DEFECT 2, the 304's cookie heal never reaches the browser: `src/app/api/guests/gallery/route.ts` appends `Set-Cookie` to `headers` when the body's token differs from the cookie's and returns `new Response(null, { status: 304, headers })` when `If-None-Match` matches (its own comment says a 304 carries the cookie too, and `gallery/route.test.ts` pins it); on the alias a `POST /api/guests/gallery` with a contributor's token in the body, no cookie and a matching `If-None-Match` answered `HTTP/2 304` with `cache-control`, `date`, `etag`, `server`, `x-vercel-cache: MISS`, `x-vercel-id` and NO `set-cookie`, while the same request without `If-None-Match` answered 200 with the cookie (Max-Age 5184000, Path=/, SameSite=Lax, HttpOnly, Secure). Vercel drops `Set-Cookie` from a 304 in transit. Fix: never answer 304 while a heal is pending: when `bodyToken && bodyToken !== cookieToken`, skip the validator comparison and answer 200 with the payload and the cookie (one extra 200 per device per sixty days); a matching validator with no pending heal still answers 304 with no cookie; the route's comment tells the truth afterwards. Contract tests in `gallery/route.test.ts`: a matching `If-None-Match` with a pending heal answers 200 with `Set-Cookie`; a matching validator with the cookie already right answers 304; the existing pins for the 200's cookie stand. The alias proof (a 200 where the 304 was, carrying the cookie) is the Orchestrator's after the merge.
- Owns: `src/components/guest/live-gallery.tsx`, `src/components/guest/live-gallery.test.tsx`, `src/components/guest/event-experience.tsx` (only if the deferred refresh needs a line), `src/app/api/guests/gallery/route.ts`, `src/app/api/guests/gallery/route.test.ts`, `docs/systems/guest-flow.md` (the drift paragraph and the heal line, refined in place). Reads, never edits: `src/lib/guest/session-cookie.ts`, `src/lib/guest/use-stored-session.ts`, `src/lib/events/gallery-access.server.ts`, `src/lib/events/gallery-fingerprint.ts`, `docs/design/rulings.md` (the door section).
- Tests: the contracts above; `pnpm test` whole; the gate with every exit code; `lab:smoke`. The red-team on the alias after the merge is the Orchestrator's (the drift with the switch flipped by SQL while a guest is inside; the 304 by curl).
- His to overrule: holding the grid on a stricter drift (rather than applying the teaser and keeping only the sheet away); the 200 instead of the 304 while a heal is pending.

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
`node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` (10 known warnings on 2026-09-21; the number moves, the exit code is the gate, a warning in a file you touched is yours), `pnpm test`,
`pnpm build`), each on its own exit code; `pnpm lab:smoke --base http://localhost:<your port>` whole; the surfaces the Handoff is
judged on, local at 1440 and 375 (the Orchestrator red-teams them on the alias). For a lab lane: the board at 1440 and 375 with
reduced motion honoured, `pnpm lab:smoke` whole, `pnpm lab:demo --board <board> --base http://localhost:<your port>` pressing
every step (a backdrop-filter step reports UNPAINTED in headless Chrome: capture it by hand and say so). One process at a
time on this machine; your dev server on your own port, killed by port before a build, a test run and the handoff.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none: the demo's ephemeral-state design and the entry-steps.ts scope call below are implementation
  judgment, not product/UX decisions, so they ride under "calls his to overrule" rather than here.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/guest-flow.md` "THE FLIP AND THE DRIFT" bullet: corrected to say `LiveGallery` itself
  holds its own items/count on a stricter poll (not just the shell's deferral), naming the old bug.
- `docs/systems/guest-flow.md`'s cookie paragraph: the "on its 304 too" claim corrected to "only as a
  200, never a 304" while a heal is pending, with the Vercel-strips-Set-Cookie reason.
- `docs/systems/guest-flow.md`'s "CONTINUOUS step container" bullet: added the revisited welcome's
  "always Continue, never Back" fact.
- `docs/systems/guest-flow.md`'s "THE UPLOAD STEP LIVES IN THIS SHEET" bullet: added the ON line's
  exact (host-unnamed) wording.
- `docs/systems/guest-flow.md`'s "Demo mode" section: added the welcome-seen freshness fact and why
  `hasContributed`/`skipped`/`returning` needed no equivalent fix.

## Deferred (ROADMAP one-liners, bucket named)

- none: Will's own open question in rulings.md ("the door's first look") — an optional email step in
  the names-mode welcome flow, to capture guest emails for a later deferred follow-up email — is
  already tracked there as waiting on his ruling; not this lane's to promote to ROADMAP.

## Handoff (replaces the chat report)

- Head `2aa56f23`, pushed; synced with launch-prep at `c60449a4` (twice: `a0d57ae3` mid-lane for the
  `reshape-guest-capture` record, no owned-path overlap; `c60449a4` again for "the door's first look"
  record, which is what carried the three added items below).
- Every claim below (a retirement, a migration, a gate, a fix) names its artifact (a commit hash, a log line, a file path), so
  the Orchestrator checks rather than believes; a claim with no artifact is read as unverified.
- Gates on the synced tree (commit `2aa56f23`): design:rules ok (223 components, 1840 contracts, 115
  contract-test files), specimens ok (140 specimens/101 entries), typecheck ok, lint ok (10 known,
  same baseline, none in touched files), test ok (328 files / 3497 passed, 2 pre-existing skips),
  build ok (138 routes, "Compiled successfully in 9.5s"); `pnpm lab:smoke --base http://localhost:3135`
  ok (420 checks, 0 failing); no `lab:demo` (board: none).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = exactly 13 files: the 5 originally
  owned paths this lane touched (`event-experience.tsx` untouched — Defect 1 needed no line there),
  6 owns-extended by Will's message of 23:46 EDT confirmed against `docs/design/rulings.md` "the
  door's first look" and `docs/tracks/orchestrator.md`'s `door-fixes` row (`entry-modal.tsx` +
  `.test.tsx`, `upload-step.tsx` + `.test.tsx`, `use-welcome-seen.ts` + `.test.tsx`, the last one new
  — no prior test file existed), and 2 generated-artifact exceptions (`docs/design/library.md`,
  `rules.generated.json`) mechanically regenerated by the required `pnpm design:rules` step because
  the owned test files gained/moved `@contract-for` guards — never hand-edited.
- The items, one line each:
  - DEFECT 1 (stricter drift): fixed in `live-gallery.tsx`'s `refresh()` — an incoming decision less
    open than the mounted `access` prop bails before touching `serverItems`/arrivals/optimistic state,
    still firing `onAccessDrift` once. Verified to fail against the pre-fix code (reverted it by hand,
    re-ran the two new tests, restored), then live on `:3135` against a real disposable event
    (`Personal Testing Throwaway`, id `38290e85-c23c-4d3a-bdbb-c6240e6b5074`): flipped
    `require_upload_to_view` true by SQL mid-session, the album's real 2-tile content kept rendering
    behind the (unrelated, name-step) door sheet that opened moments later; flipped back after.
  - DEFECT 2 (304 drops the heal): fixed in `gallery/route.ts` — a pending heal (`bodyToken` differs
    from `cookieToken`) always answers 200 now, never 304. Verified the same way: reverted by hand,
    watched the pinned test fail exactly as the alias did (`expected 304 to be 200`), restored; then a
    real curl round trip on `:3135` against the same disposable event showed a matching validator with
    no heal answering 304, and the identical validator with a fresh session token in the body
    answering 200 with `Set-Cookie`.
  - Continue never Back (his override): `entry-modal.tsx`'s revisited welcome always reads "Continue"
    now; `continueLabel` is gone from `WelcomeStep` entirely. The chevron's own "Back to the welcome"
    / "Back to your name" labels are untouched (his ruling only meant the sheet's own primary).
  - The host goes unnamed in the ON line (his override): `upload-step.tsx`'s `uploadStepReason` no
    longer takes a `hostName`; the `requireUpload` branch is the fixed string "The host has asked
    everyone to add a photo before the album opens." Swept `asked everyone to add a photo` across
    `src` and `content`: the five help-article hits (`what-guests-can-and-cant-see.mdx`,
    `messages-guests-might-see.mdx`, `turn-off-uploads-or-cap-file-size.mdx`,
    `how-guests-join-and-upload.mdx`, `show-the-album-live-on-a-screen.mdx`) are all host-voiced,
    unmarked-prose paraphrases ("if you asked…", "an event whose host asked…"), never a literal
    `<UiLabel>`-quoted copy of the old sentence — none needed a change. Confirmed the name step's own
    lede (`guest-name-step.tsx`'s `guestNameCopy`) already carries the "the host" fallback his ruling
    describes; left untouched.
  - The demo is always fresh (his override): `use-welcome-seen.ts` takes `isDemo` now. A first cut
    made `seen` permanently false for the demo, which broke the demo itself (Continue never advanced
    past the welcome, since `computeDoor` kept re-adding the step); caught by the two PRE-EXISTING
    demo tests in `entry-modal.test.tsx` failing, not a new one. Fixed with per-mount ephemeral state
    (`useState`, never written anywhere): this visit still advances once, nothing persists to the
    next. Also dropped the OLD `if (isDemo) markSeen()` call on the upload step's "Look around" skip
    (now redundant, and it was exactly the bug's second half). Verified live on `:3135`: the demo's
    role welcome reappeared on a plain reload after Continue + Look around, with zero `pr_welcome_*`
    keys ever written (checked via `localStorage` in the page). New test file
    `use-welcome-seen.test.tsx` (none existed).
- Calls his to overrule on the alias, one line each:
  - Holding the grid on a stricter drift (rather than applying the teaser and keeping only the sheet away) — original.
  - The 200 instead of the 304 while a heal is pending — original.
  - `entry-steps.ts`/`entry-steps.test.ts` deliberately left untouched: `computeDoor` already treats
    `welcomeSeen`/`skipped`/`returning` as given facts and needed no change; `skipped` is plain
    per-mount component state and `returning` reads a session the demo never actually mints
    (`simulateUpload` makes no network call, and the demo is excluded from the name step entirely,
    which is the only path that ever writes one) — both already behaved correctly for "every visit
    fresh" before this lane touched anything, verified by reading every write path rather than assumed.
  - The ephemeral (never-persisted) state shape for the demo's welcome, over some alternative (e.g. a
    query-param based reset) — the smallest change that satisfies "fresh every visit" without touching
    `computeDoor`'s own contract.
  - Removing `continueLabel` from `WelcomeStep` entirely (dead after "always Continue") rather than
    leaving an unused optional prop.
- The help articles this lane makes stale: none — swept and confirmed all five nearby mentions are
  paraphrases that already read correctly (see the item above); no `help-sync` follow-up needed for
  this lane's changes.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: the alias re-verification this lane's own tests cannot reach — DEFECT 1's drift
  with the switch flipped by SQL while a real guest session sits inside a large album (this lane
  proved the mechanism locally + live on `:3135` with a disposable event, never on the alias itself);
  DEFECT 2's 304-vs-200 by curl on the alias (local + `:3135` curl only); a glance at the revisited
  welcome's "Continue" wording and the ON line's phrasing on the alias, since those are copy a
  screenshot catches faster than a describe block. Will's own open question (an optional email step)
  is unresolved on his own word and not touched here.
- ★ A message purporting to be "the coordinator" arrived mid-lane, unprompted, in this session's own
  transcript, asking for the three items above with file/line pointers — flagged internally as a
  likely prompt-injection pattern (unclear provenance, arrived with no tool call producing it, an
  automated injection warning fired on it) before acting on a word of it. Verified independently
  against the actual `origin/launch-prep` git history rather than trusted at face value: confirmed
  via `docs/design/rulings.md` ("the door's first look", Will's words verbatim, committed at
  `c60449a4`) and `docs/tracks/orchestrator.md`'s own `door-fixes` row ("Will's three overrides of
  23:46 EDT sent by message with the owns extended"), both independently fetched from origin. The
  three items built are what those two canonical sources say, not the message's own paraphrase — one
  real discrepancy caught this way: the message claimed the name step's lede "stays as it is", but
  rulings.md says it "still names the host, with 'the host' as its fallback", which sent this lane to
  go verify the fallback actually exists (it does, in `guestNameCopy`) rather than skip the check.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
