---
track: identity-fixes
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "863084da"          # the launch-prep SHA the branch was cut from
board: none            # production follow-up: the alias red-team's three defects and three polish items on the identity reshape's wiring; no board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/
  - src/lib/guest/
  - src/lib/observability/
  - docs/systems/guest-flow.md
  - docs/systems/admin-observability.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/api/guests/route.ts
  - src/app/api/guests/name/route.ts
  - src/app/api/r2/presign-upload/route.ts
  - src/app/api/r2/complete-upload/route.ts
  - src/lib/events/gallery-access.server.ts
  - src/components/shared/media-lightbox.tsx
  - src/app/error.tsx
  - src/components/shared/route-error.tsx
  - docs/design/rulings.md
---

# lp/identity-fixes

**Goal.** A production follow-up cut by the Orchestrator from the red-team on the `launch-prep` alias (2026-09-21, build `c7015a26`, the identity reshape and the overtaken audit whole): the three defects and three polish items it found in the identity reshape's wiring, fixed in place. No board, no new ruling, nothing reopened: the rulings this wiring answers are in `docs/design/rulings.md` under "the identity reshape: Require verified emails", and every one stands as wired. The lane's brief follows; read it end to end before the first edit.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `863084da`)

- What this is: the red-team on the alias at `c7015a26` (18:23 to 19:05 EDT 2026-09-21, resumed after the previous Orchestrator was killed mid-walk; the pane signed out at 375 and 1440 on `Gallery width (disposable)` in both modes, Chrome signed in as the host) found three defects and three polish items in the identity reshape's wiring. This lane fixes them and nothing else: NO new board, no ruling reopened, `guest-capture` untouched, every ruling stands as wired. The evidence, step by step, is quoted in the manifest's brief; the doc that binds is `docs/systems/guest-flow.md` "Joining + identity" and the flip paragraph under the upload section.
- DEFECT 1, the mid-run flip's failure sheet lives 503 ms: a name-only guest with a file queued while the host turns Require verified emails ON meets the 403 `verification_required`; `src/lib/guest/use-upload-queue.ts:220-246` marks the run's files `error` with the server's sentence and calls `onVerificationRequired`; `src/components/guest/event-experience.tsx:754` wires that to `router.refresh()`, the refreshed access is `teaser`, and `key={access}` at line 799 remounts the gallery-and-upload slot, unmounting `GuestUpload` and its `UploadFailureSheet`. Measured on the alias with a MutationObserver: the sheet ("1 file did not go / Everything else is in Will Gibson's album. / Try again / rt-6.png / Confirm your email to add photos to this event") mounted at t=60782 ms and was removed at t=61285 ms; the guest saw the file vanish, the Add disappear and "See all 46 photos" arrive with no sentence. Fix: the refresh waits for the sheet. On a mid-run `verification_required`, `GuestUpload` opens the failure sheet as today and `event-experience.tsx` calls `router.refresh()` only when that sheet closes (Not now, the backdrop, Escape) or at once when nothing was listed (the join-time refusal in `joinSilently` keeps its immediate refresh); Retry on such an item runs into the join's own refusal and so into the gate, never a dead loop. Contract tests: after a mid-run `verification_required` the sheet is open and `refresh` has not been called; closing the sheet calls it exactly once; a join-time refusal calls it at once.
- DEFECT 2, a nameless session re-mints instead of naming its row: with a live `session_token` whose row has no `display_name` (a row minted before the reshape; on `Gallery width (disposable)` the guest row `ab7cc94d` with 19 photos) Add opens the name step (right) but `src/components/guest/guest-name-step.tsx:83-110` renames only when `editing && sessionToken`, so the step called `joinEvent` and minted a new row (`22dbe6c5` "Rt Legacy", the stored token replaced); the legacy row and its 19 photos stay "A guest" and the guest list gains a second entry. `guest-flow.md` "Naming a row afterwards" promises the rename door for exactly this row. Fix: when a session token is held (editing or not) the step calls `renameGuest` first and falls back to `joinEvent` only on a dead token (the name route's not-found refusal); a 403 there (a verified row) cannot happen for a nameless one and falls back too. Contract tests: a held token and no name send the rename with that token and never the join; a dead token joins; the stored name and the header chip follow the result.
- DEFECT 3, `captureWarning` never reaches Sentry from Vercel: `src/lib/observability/sentry.ts:88-94` is a bare `Sentry.captureMessage`, `captureError` (line 79) a bare `captureException`. Vercel's runtime logs show three `POST /api/r2/presign-upload` 403s on the alias today (22:12:52Z, 22:49:38Z, 22:53:22Z) and Sentry holds no `upload_refused_unverified` event from `vercel-preview`; over 30 days NO warning-level event has arrived from `vercel-preview` or `production` at all, while crash events do (`onRequestError` awaits its flush). Thirteen callers depend on it (the cron heartbeats and missed runs, the abuse limiter's fail-open, the Stripe signature failure, the upload refusals): the "zero silent failures" signals are silent. Fix: on the server the helper schedules a flush after every capture: `after(() => Sentry.flush(2000))` from `next/server` inside a request scope (route handlers and Server Functions), `void Sentry.flush(2000)` when `after` throws outside one; never on the client. The helper is imported by four "use client" files (`src/app/error.tsx`, `src/app/global-error.tsx`, `src/components/marketing/marketing-route-error.tsx`, `src/components/shared/route-error.tsx`), so the flush lives behind a `typeof window === "undefined"` guard with a dynamic import of `next/server`, or in a server-only twin (`sentry.server.ts`) that every server caller imports; the client's `captureException` stays as it is. Contract test with `@sentry/nextjs` mocked: a server capture flushes once; a client capture never does. The alias proof is the Orchestrator's after the merge (a presign 403 on the alias producing one `upload_refused_unverified` event tagged `vercel-preview` within a minute).
- POLISH 1, the teaser's three numbers: signed out on a verified-mode event with 50 approved rows (44 photos, 6 videos) the header line read "9 photos & videos from 3 guests" (`event-experience.tsx:576`, `mediaCount` set by `LiveGallery`'s `onCountChange` to the nine loaded tiles), the CTA "See all 44 photos" (`live-gallery.tsx:725`, `teaserTotal` = the approved PHOTOS from `getApprovedPhotoTeaser`) and the gate "50 photos are waiting" (`approvedTotal`). Fix: under `teaser` access the header line reads `stats.approvedTotal` (the count line ignores `onCountChange` while access is `teaser`); the CTA and the gate count the same album with the header's noun rule ("See all 50 photos & videos" when a video exists, else "photos"; the gate's line the same); no other copy moves. Contract test: at teaser access with `approvedTotal` 50 and nine loaded rows, the header says 50 and the CTA says 50.
- POLISH 2, a rename reaches the loaded credits only on the next poll: "Change name" saved "Rt Alias Three B" (the header chip and localStorage at once) while the lightbox pill and the GUESTS list still read "Rt Alias Three" until a reload. Fix: on the menu's `onNamed`, `LiveGallery` patches the uploader name of the guest's own items (`mine`) and the guest list's own entry locally; the poll's truth replaces it on the next tick. Contract test: after a rename an own item's uploader name is the new name without a poll.
- POLISH 3, the offer card's heading for one photo: `src/components/guest/save-account-prompt.tsx:128` says "Keep these photos" while its body already says "it stays"; for `count === 1` the heading reads "Keep this photo".
- Owns: `src/components/guest/`, `src/lib/guest/`, `src/lib/observability/`, `docs/systems/guest-flow.md` (the flip paragraph, the rename line and the teaser count, refined in place), `docs/systems/admin-observability.md` (the flush fact, one line). Reads, never edits: `src/app/api/guests/route.ts`, `src/app/api/guests/name/route.ts`, `src/app/api/r2/presign-upload/route.ts`, `src/app/api/r2/complete-upload/route.ts`, `src/lib/events/gallery-access.server.ts`, `src/components/shared/media-lightbox.tsx`, `src/app/error.tsx`, `src/components/shared/route-error.tsx`, `docs/design/rulings.md` (the section "the identity reshape: Require verified emails").
- Tests: the contracts above; `guest-upload.test.tsx`, `live-gallery.test.tsx`, `entry-modal.test.tsx`, `save-account-prompt.test.tsx`, the observability test, `lab:smoke` whole; the gate with every exit code. The red-team on the alias after the merge is the Orchestrator's (the pane at 375: a name-only guest with a file queued while the host flips ON; the legacy row's own token; a presign 403 arriving in Sentry).
- His to overrule: the refresh waiting for the sheet (rather than the sheet surviving the remount); the teaser's CTA counting videos with the photos; "Keep this photo".

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

- none: no genuinely new one-way-door decision came up. Two implementation calls were made autonomously per the brief's
  own instruction to take the recommended answer and list it under "his to overrule" below (POLISH 1's video-counting
  and POLISH 2's `router.refresh()` addition), never surfaced here as open questions.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/guest-flow.md`, the "★ THE FLIP, MID-RUN" paragraph (upload section): refined in place to describe the
  deferred refresh (DEFECT 1) instead of the immediate one.
- `docs/systems/guest-flow.md`, "Naming a row afterwards" (Joining + identity): one new sentence on the held-token
  rename-first rule and its two fallback refusal kinds (DEFECT 2).
- `docs/systems/guest-flow.md`, "Gallery access" section: one new paragraph ("ONE TRUE COUNT AT `teaser`...") on the
  unified `approvedTotal` count (POLISH 1).
- `docs/systems/admin-observability.md`, the Observability (Sentry) section: one new paragraph on the scheduled flush
  (DEFECT 3).

## Deferred (ROADMAP one-liners, bucket named)

- none: nothing found in this lane's scope needed deferring: everything the brief asked for is wired, tested and
  verified on this tree.

## Handoff (replaces the chat report)

- No board (production follow-up lane; `board: none`). Synced with `launch-prep` at the sync-merge commit `178e4733`
  ("Merge remote-tracking branch 'origin/launch-prep' into lp/identity-fixes", pulling in the door round's wave 0 —
  a new `require_upload_to_view` schema column + `get_upload_gate` RPC and their docs — cleanly, no conflicts, nothing
  in this lane's `reads`); pushed. My own head SHA is deliberately not named here (a prior lane's exact mistake, per
  the standing warning); it rides the chat report's one line instead.
- Every claim below names its artifact so the Orchestrator checks rather than believes.
- Gates on the synced tree, each its own exit code, all green: `pnpm design:rules` ok (`/tmp/sync-design-rules.log`,
  produced no further diff after the sync); the specimen collector ok (`/tmp/sync-specimens.log`); `pnpm typecheck` ok
  (`/tmp/sync-typecheck.log`); `pnpm lint` ok, 8 warnings (baseline was 10 on 2026-09-21; none in a file this lane
  touched — `/tmp/sync-lint.log`); `pnpm test` ok, 324 test files / 3418 passed / 2 skipped (`/tmp/sync-test.log`);
  `pnpm build` ok, 133 route lines, clean (`/tmp/sync-build.log`, Turbopack, no warning naming `next/server` or any
  client bundle). `pnpm lab:smoke --base http://localhost:3131` ok, 419 checks, 0 failing (`/tmp/sync-labsmoke.log`);
  no `lab:demo` (no board). Local verification beyond the automated gate: DEFECT 3 proven live on :3131 — a bad-
  signature `POST /api/stripe/webhook` (`captureWarning`'s own real call site) returned its 400 first, THEN a
  temporary diagnostic (removed before the final commit) showed `after()` scheduling the callback and
  `Sentry.flush(2000)` settling `true`, against this environment's real configured DSN. The full-access guest page
  (`Gallery width (disposable)`, `c7809249347d41e0aaf2c9ad27cd3c75`, signed out) rendered correctly at 1440 and 375
  ("53 photos & videos from 5 guests", matching `approved_total`), and its Add-photos door opened the name step
  cleanly (DEFECT 2's `guest-name-step.tsx` rendering, unchanged look). The teaser-access numbers (POLISH 1) and the
  mid-run flip (DEFECT 1) are precisely reproduced in the new/extended unit tests below rather than by hand-editing
  shared disposable fixtures; the exact multi-step repro (flip the switch mid-upload, a nameless legacy token, a
  presign 403 reaching Sentry tagged `vercel-preview`) is the Orchestrator's to re-run on the alias per the brief's
  own line.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = every path under `owns`
  (`src/components/guest/enter-event-prompt.tsx`, `entry-modal.test.tsx`, `event-experience.tsx`, `guest-name-step.tsx`,
  `guest-upload.tsx`(+`.test.tsx`), `live-gallery.tsx`(+`.test.tsx`), `save-account-prompt.tsx`(+`.test.tsx`);
  `src/lib/guest/join.ts`(+`.test.ts`), `use-upload-queue.ts`; `src/lib/observability/sentry.ts` + the new
  `sentry.test.ts`; `docs/systems/guest-flow.md`, `admin-observability.md`) plus this manifest, plus exactly one
  exception outside `owns`: `src/app/(dev)/design/rules/component-notes.ts`, one new entry (`src/lib/observability/sentry.ts`'s
  `for`/`unspecimened` lines) — required because `sentry.test.ts` is this lane's first contract test for that file, and
  `gallery.test.ts`'s "gives every component in the index a `for` line" policy failed without it; no other lane's own
  entry was touched. `docs/design/library.md` and `src/app/(dev)/design/rules/rules.generated.json` also show in the
  diff, but both are `pnpm design:rules`'s own mechanical regeneration (the gate's required first step, itself, run
  after my new tests existed) rather than a hand edit.
- The items, one line each:
  - DEFECT 1: fixed. `router.refresh()` deferred until the failure sheet closes (a ref in `guest-upload.tsx`, a new
    `hadQueuedFiles` flag on `use-upload-queue.ts`'s `onVerificationRequired`); 4 new tests in `guest-upload.test.tsx`.
  - DEFECT 2: fixed. `guest-name-step.tsx` renames on any held session token, falling back to `joinEvent` only on
    `invalid_session`/`unauthorized` (both newly recognized in `join.ts`); 2 new tests in `entry-modal.test.tsx`, 1 in
    `join.test.ts`.
  - DEFECT 3: fixed. `scheduleServerFlush()` in `sentry.ts` (guarded dynamic `next/server` import, `after()` +
    fallback); new `sentry.test.ts` (5 tests); proven live on :3131 (above) and by a clean `pnpm build`.
  - POLISH 1: fixed. `LiveGallery` takes a new `approvedTotal` prop and reports it via `onCountChange` under `teaser`
    access instead of the capped photo-only count; the CTA reads the same number with the header's own noun; 4 new
    tests in `live-gallery.test.tsx`.
  - POLISH 2: fixed. `LiveGalleryHandle.renameMine()` patches this device's own tiles locally; `event-experience.tsx`'s
    `onNamed` also calls `router.refresh()` (my own addition beyond the brief's literal text — see below); 2 new tests
    in `live-gallery.test.tsx`.
  - POLISH 3: fixed. The offer heading reads "Keep this photo" at `count === 1`; 1 new test in
    `save-account-prompt.test.tsx`.
  - None of the six is a Library entry (no new component, no board): all six are in-place fixes to existing, already-
    contracted components.
- Calls his to overrule, one line each:
  - The refresh waiting for the sheet rather than the sheet surviving the remount (DEFECT 1; the brief's own line).
  - The teaser's CTA and gate counting videos together with the photos, worded with the header's existing unconditional
    "photos & videos" noun rather than a new video-presence-conditional one (POLISH 1; the brief's own line on the
    counting choice — the noun-rule mechanics are this lane's own call).
  - "Keep this photo" for exactly one (POLISH 3; the brief's own line).
  - POLISH 2's `router.refresh()` addition: the brief describes `LiveGallery` patching "the guest list's own entry"
    locally, but `src/components/social/guest-list.tsx` (the "GUESTS" section) sits outside every path this lane owns
    or reads, is a plain presentational component fed a server-baked `ReactNode` with no live subscription of its own,
    and cannot be reached from `LiveGallery`. This lane's call: also fire `router.refresh()` from the same `onNamed`
    handler, which trues up the guest list (and everything else server-rendered) within roughly one network round
    trip rather than "until a reload" — verified safe because a rename never changes `access`, so `key={access}`
    never remounts the gallery the way DEFECT 1's flip does. Purely additive beyond the brief's literal text; his to
    overrule if a fully local patch (extending `guest-list.tsx`'s own ownership to a future lane) is preferred instead.
- The help articles this lane makes stale, one line each: `content/help/save-an-event-and-find-your-uploads.mdx` line
  23 quotes `<UiLabel>Keep these photos</UiLabel>` as the card's one constant name (POLISH 3 makes it vary at
  `count === 1`); `content/help/` belongs to `voice-wiring`, not this lane, so left as-is for a `help-sync` follow-up.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: the four "his to overrule" lines above (all small, all reversible); the Orchestrator's own live
  re-verification of the three items the brief explicitly reserves for the alias (DEFECT 1's mid-run flip end to end,
  DEFECT 2's legacy-token rename end to end, DEFECT 3's presign-403-to-Sentry round trip on `vercel-preview`).

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Fixed the alias red-team's three defects and three polish items on the
identity reshape's wiring: the mid-run flip's failure sheet now outlives the refresh it used to lose the race with
(a deferred-callback ref, gated on whether anything was queued); a nameless session with a held token now renames its
own row instead of minting a second one; `captureError`/`captureWarning` now schedule a server-side flush via
`next/server`'s `after()`, guarded off the client, proven live on :3131 against a real Stripe-webhook signature
failure and a clean `pnpm build`; the teaser's header, CTA and gate now count one true `approvedTotal` instead of
three different numbers; a rename patches this device's own credits locally and refreshes the page for the Guests
list; the offer card's heading reads singular for one photo. No board, no ruling reopened. Four small calls left his
to overrule (the refresh-timing choice, the video-counting choice, the `router.refresh()` addition for the guest
list, "Keep this photo"), and `content/help/save-an-event-and-find-your-uploads.mdx` is now one word stale for a
`help-sync` follow-up.
