---
track: guest-email-server
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "ae89033a"          # the launch-prep SHA the branch was cut from
board: none            # production, wave 1 of the guest identity round: the wire, the identity, the crack closed, the forensics, the profile queries; merges first; no board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/guests/
  - src/lib/validation/upload.ts
  - src/lib/validation/upload.test.ts
  - src/lib/db/mutations/guest.ts
  - src/lib/db/queries/social.ts
  - src/lib/db/queries/social.guest-identity.test.ts
  - src/lib/db/mutations/social.ts
  - src/app/(app)/account/social-actions.ts
  - src/lib/social/cards.ts
  - src/lib/media/uploader-identity.ts
  - src/lib/media/uploader-identity.test.ts
  - src/lib/r2/grid-items.ts
  - src/lib/r2/grid-items.email-safety.test.ts
  - src/lib/forensics/capture.ts
  - src/lib/forensics/capture.test.ts
  - src/app/admin/forensics/
  - src/lib/errors/codes.ts
  - src/lib/security/abuse-rate-limit.ts
  - docs/systems/database-security.md
  - docs/systems/admin-observability.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/db/types.ts
  - src/lib/guest/session-cookie.ts
  - supabase/migrations/20260922120000_guest_pending_email.sql
  - supabase/migrations/20260922122000_profile_shown_events.sql
  - docs/design/rulings.md
---

# lp/guest-email-server

**Goal.** Wave 1 of the guest identity round, cut by the Orchestrator at wave 0's record from Will's ruling of 2026-09-22 (rulings.md "guest identity: name only, unconfirmed email, verified account", every sentence his): the wire (the optional email through the join, the attach route, the identity that never reads it, the crack closed, the forensics, the profile queries), announced in the Handoff for the door lane and merged first. No board, no new ruling. The lane's brief follows; read it end to end before the first edit.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `ae89033a`)

- What this is: Will's identity model (rulings.md "guest identity: name only, unconfirmed email, verified account", every sentence his; the plan `~/.claude/plans/great-work-however-1-dapper-twilight.md` is the Orchestrator's record of it and you may read it whole). A names-mode door captures an OPTIONAL email on the name step, stored UNCONFIRMED in `guests.pending_email` and inert (never shown to the host or other guests, never attributed to any account, never mailed on its own, never expiring); a confirmed email later CLAIMS its past rows per event from a card on the dashboard, and what is not claimed is removed after a confirmation; both claims stamp the row verified; the public mark has TWO states and reads "Unverified" (replacing "Name not verified"); only the guest's own menu says "Email not confirmed"; profiles publish nothing until chosen. Wave 0 (`guest-email-migration`) landed the schema, so code against the real types in `src/lib/db/types.ts`. The other two wave-1 lanes run beside you on disjoint owns; never touch their files; the server lane's Handoff announces the JSON wire and merges first. Nothing renamed on disk (the lab keys on the guest paths). Every line of copy is a benefit to the guest or the host, never regulatory, no em-dashes.
- THE JOIN: `src/lib/validation/upload.ts` `joinSchema` gains `email: z.string().optional()` (loose, like `display_name`); new `parseGuestEmail(raw)` (trim, lowercase, `z.email()`, max 254) returning `{ok, email} | {ok: false, code: "email_invalid", message: "Check that email address."}`; new `attachEmailSchema = {qr_token, session_token, email: z.string().nullable()}`; `renameGuestSchema` untouched; tests in a new `src/lib/validation/upload.test.ts`. `src/app/api/guests/route.ts`: in the names-mode branch, after the name, parse the email when present and non-blank → 422 `email_invalid`; pass `pendingEmail` to `createGuest`; a verified session never reads the field (the RPC nulls it anyway); the response gains `email_attached: boolean` and NEVER the address; the existing `join` limiter (still one POST); the cookie unchanged. `src/lib/db/mutations/guest.ts`: `createGuest({..., pendingEmail?})` → `p_pending_email`; the `check_violation` map gains "email address" → `email_invalid`; new `setGuestPendingEmail({sessionToken, email: string | null})` → `invalid_session | email_invalid | unauthorized | unknown`. New `src/app/api/guests/email/route.ts`: the body token only (never the cookie: the write routes read the body, pinned by `session-cookie.test.ts`), limiter kind `attach_email` `{breadthWindowMin 60, breadthMax 15, scopeWindowMin 15, scopeMax 60}` added to `src/lib/security/abuse-rate-limit.ts` (the rename's numbers, the same reasoning), private → 403, dead link → 404, parse → 422 `email_invalid`, `set_guest_pending_email` → 401 `invalid_session`, 403 `unauthorized`; `{ok, email_attached}`; the cookie heal via `guestSessionCookieIfChanged` as the name route. `src/lib/errors/codes.ts`: `email_invalid` ("Check that email address."). Tests: `src/app/api/guests/route.test.ts` (names mode passes `p_pending_email` lowercased; 422 `email_invalid`; a confirmed session ignores the field; the response carries `email_attached` and never the address) and a new `src/app/api/guests/email/route.test.ts` (the body token, 401/403/422, the detach on null, the cookie heal).
- THE ANNOUNCED WIRE (write it in your Handoff under one heading, exactly, for the door lane): the join body `{qr_token, display_name?, email?}`, the response `{ok, session_token, event_id, display_name, verified, email_attached}`, the 422 code `email_invalid` with its sentence, `POST /api/guests/email` body `{qr_token, session_token, email | null}` and response `{ok, email_attached}` with its status codes.
- THE IDENTITY: `src/lib/media/uploader-identity.ts` never reads `pending_email`; case 3 (a typed name, `verified_at` null) returns `email: null` ALWAYS (today it returns `guest.email`, which the newsletter capture can fill from an unconfirmed session: the crack below); the test pins it. `src/lib/r2/grid-items.ts` unchanged except the email-safety test's new pin "never assigns `pending_email`". `src/lib/db/queries/social.ts` `getEventGuestList` never selects `pending_email` (pin it in `social.guest-identity.test.ts`).
- THE CRACK CLOSED: `src/app/api/guests/capture-email/route.ts` checks `user.email` but not `email_confirmed_at`; it gains the confirmed gate (401 otherwise), so `capture_guest_email` never writes an unconfirmed address into `guests.email`.
- THE FORENSICS: `src/lib/forensics/capture.ts` selects and denormalizes `pending_email` into `upload_forensics.guest_pending_email` at the mint of a media row (the `guest_display_name` precedent); `src/app/admin/forensics/` shows the column beside the typed name and the export carries it; the test extended.
- THE PROFILE QUERIES (one owner for `queries/social.ts`): `getMyAttendedEvents` returns `shownOnProfile` (`getMyHiddenEventIds` → `getMyShownEventIds` over `profile_shown_events`); `getPublicProfileAttendedCoverUrls` re-proves against the shown table; `src/lib/db/mutations/social.ts` `showEventOnProfile` (insert) and `hideEventFromProfile` (delete) replace hide/unhide; `src/app/(app)/account/social-actions.ts` renames with them (the Server Functions the attended switch calls; the claims lane rewires the switch after your merge: announce the two action names). Nothing reads or writes `profile_hidden_events` any more (the table stays until a later drop).
- DOCS: `docs/systems/database-security.md` (the guests invariant restated: `email` is only ever a confirmed `auth.users` address written server-side; `pending_email` only ever a typed one; the two claims the one path between them; the new RPCs in the authenticated list, `set_guest_pending_email` in the service-role list) and `docs/systems/admin-observability.md` (the forensics column, one line).
- Owns: `src/app/api/guests/`, `src/lib/validation/upload.ts`, `src/lib/validation/upload.test.ts`, `src/lib/db/mutations/guest.ts`, `src/lib/db/queries/social.ts`, `src/lib/db/queries/social.guest-identity.test.ts`, `src/lib/db/mutations/social.ts`, `src/app/(app)/account/social-actions.ts`, `src/lib/social/cards.ts`, `src/lib/media/uploader-identity.ts`, `src/lib/media/uploader-identity.test.ts`, `src/lib/r2/grid-items.ts`, `src/lib/r2/grid-items.email-safety.test.ts`, `src/lib/forensics/capture.ts`, `src/lib/forensics/capture.test.ts`, `src/app/admin/forensics/`, `src/lib/errors/codes.ts`, `src/lib/security/abuse-rate-limit.ts`, `docs/systems/database-security.md`, `docs/systems/admin-observability.md`. Reads, never edits: `src/lib/db/types.ts`, `src/lib/guest/session-cookie.ts`, `supabase/migrations/20260922120000_guest_pending_email.sql`, `supabase/migrations/20260922122000_profile_shown_events.sql`, `docs/design/rulings.md`.
- Tests: the contracts above; `pnpm test` whole; the gate with every exit code; `lab:smoke`. Your own red-team on :3133 with curl: a join with an address answers `email_attached` and never the address; a junk address 422s; `/api/guests/email` refuses without a body token; the host gallery items carry no address for an unconfirmed row.
- His to overrule: the `attach_email` limiter's numbers; case 3 returning no address at all (rather than a muted one); the forensics column.

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

- none. Every open call was taken on the brief's recommendation or on the nearest shipped precedent, and
  each one is listed under "Calls his to overrule" below. No one-way door was reached.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/database-security.md`, the `guests` bullet under "Invariants": a new paragraph, **TWO EMAIL
  COLUMNS, ONE PATH BETWEEN THEM** - `guests.email` is only ever a confirmed `auth.users` address written
  server-side; `guests.pending_email` is only ever a typed, unproved one, outside every grant; the only path
  across is a claim that proves it, and the code holds the same line three ways (case 3, the guest-list
  SELECT, the capture route's new confirmation gate). `upload_forensics.guest_pending_email` named as the one
  deny-all exception.
- `docs/systems/database-security.md`, the service-role-only RPC list: `set_guest_pending_email` added with
  why it is service-role (the anon EXECUTE grant is the surface; the `attach_email` limiter is part of the gate).
- `docs/systems/database-security.md`, the authenticated RPC list: the three claim-by-address RPCs added with
  the oracle gate stated (the address is never a parameter; an unconfirmed caller gets an empty set), and
  `claim_anonymous_uploads`'s line extended with its new `verified_at` / `email` stamp.
- `docs/systems/admin-observability.md`, the Forensics bullet: `guest_pending_email` beside
  `guest_display_name`, read on the `?what=record` export, rendered on no page.

## Deferred (ROADMAP one-liners, bucket named)

- **Now** - `/admin/forensics` renders no per-upload identity at all: neither the typed name (shipped
  2026-09-21) nor the unproved address reaches a table, so an operator reads both only by downloading a
  held item's Record. An uploader column on the held-media table would need `listHeldMedia` in
  `src/lib/db/queries/forensics.ts`, which no lane owns this round.
- **Now** - `src/lib/guest/session-cookie.test.ts`'s `WRITE_ROUTES` list should gain
  `src/app/api/guests/email/route.ts`. The door lane owns `src/lib/guest/`, so this lane pinned the same
  property in its own `src/app/api/guests/email/route.test.ts` instead; the list is still worth completing.
- **Now** - the deprecated pair kept for exactly one merge (`AttendedEventSetting.hiddenFromProfile` and
  `unhideEventFromProfileAction`) must be deleted when the claims lane rewires the attended switch. Both
  carry `@deprecated` with that sentence.
- (Already on the ROADMAP: dropping `profile_hidden_events`. Nothing in this lane reads or writes it now.)

## Handoff (replaces the chat report)

- **The work commit is `411c45e0`** (every change of this lane, stable); **the sync-merge is `b678b9d4`**
  (`origin/launch-prep` had moved to `5a831353`; merged, never rebased). No board (`board: none`).
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` EXIT=0 (223 components, 1840
  contracts, 18 policies; no diff) · specimens EXIT=0 (140 specimens on 101 entries; no diff) ·
  `pnpm typecheck` EXIT=0 · `pnpm lint` EXIT=0 (10 warnings, the known baseline; none in a file this lane
  touched) · `pnpm test` EXIT=0 (332 files, 3606 passed, 2 skipped) · `pnpm build` EXIT=0 (257 static pages,
  161 routes; `/api/guests/email` present at build.log:54) · `pnpm lab:smoke --base http://localhost:3133`
  EXIT=0 (422 checks, 0 failing). Logs in the lane's scratch directory. No `lab:demo` (no board).
- Lane check, `git diff --name-only origin/launch-prep...HEAD` (25 files): every path under `owns`, plus
  **one exception, `src/lib/errors/codes.test.ts`**. Why: that file is the compile-time tripwire for the
  taxonomy this lane grows, its header says "when you add a code to a route, add it to ITS mirror here", and
  it belongs to no lane this round (neither `guest-email-door` nor `guest-email-claims` lists it). The edit
  is additive only: a `GuestEmailRouteCode` mirror, `email_invalid` on `GuestRouteCode`, and a
  `SetGuestPendingEmailResult` subtype assertion. Nothing existing was changed.

### THE ANNOUNCED WIRE (for `guest-email-door` and `guest-email-claims`)

**`POST /api/guests` (the join).** Body `{ qr_token, display_name?, email? }` - `email` is optional, loose,
and read ONLY on the names-mode branch (a verified session never has it read, and `create_guest` nulls it
beside a confirmed account and on a Require-verified-emails event). Response, 200:
`{ ok: true, session_token, event_id, display_name, verified, email_attached }`. **`email_attached` is a
boolean and the address NEVER comes back.** A typed value that is not an address answers **422
`{ ok: false, code: "email_invalid", message: "Check that email address." }`**; a missing or blank `email`
is not an error at all (the guest simply stays at level 1). Every other status is unchanged.

**`POST /api/guests/email` (attach / change / detach).** Body `{ qr_token, session_token, email }` where
`email` is `string | null`. **`null` is the detach and a MISSING key is a 400** (clearing has to be said out
loud). Response, 200: `{ ok: true, email_attached }`, `Cache-Control: private, no-store`, and the
`pr_guest_<eventId>` cookie heal on the way out. Statuses: **400** `bad_request` (unparseable body, either
token missing, `email` key absent) · **403** `unauthorized` (a private event, or a VERIFIED guest whose
address is their account's) · **404** `not_found` (dead link) · **422** `email_invalid` · **401**
`invalid_session` · **429** `rate_limited` with `Retry-After` · **500** `unknown`. The token comes from the
BODY only; the cookie is never read as identity.

**The two renamed Server Functions** in `src/app/(app)/account/social-actions.ts`, for the claims lane's
attended switch: **`showEventOnProfileAction(eventId)`** (insert: publish) and
**`hideEventFromProfileAction(eventId)`** (delete: take it off). Both return the unchanged
`SocialActionResult`. `getMyAttendedEvents()` now returns **`shownOnProfile: boolean`**, default FALSE.
`unhideEventFromProfileAction` and `AttendedEventSetting.hiddenFromProfile` survive as `@deprecated` aliases
so this tree builds while the switch is still the old one; **delete both in the claims lane's rewire.**

### The items, one line each

- `join-email`: `joinSchema` gains a loose optional `email`; `parseGuestEmail` normalises to trimmed +
  lowercased (the column's CHECK and the claim's equality both need it), caps at 254 before any regex, and
  refuses with one code. The superseded test "never carries an email (the poisoning surface the reshape
  closed)" was rewritten rather than deleted, and says why the surface stays closed: the two columns are not
  the same column.
- `join-route`: the address is parsed only on the names-mode branch, passed as `pendingEmail`, and
  `email_attached` comes back from the MINT (`create_guest`'s payload), never echoed from the request, so a
  confirmed session that sends one is answered `false` because the database said so.
- `attach-route`: `POST /api/guests/email` on the rename door's exact shape, plus its own source-level pin
  that it never reads the session cookie.
- `limiter`: `attach_email` = `{ breadth 15 / 60min, scope 60 / 15min }`, the rename's numbers verbatim,
  with the venue reasoning and the note that nothing is ever mailed to this address so it is not a
  mail-bomb surface.
- `mutations`: `createGuest` gains `pendingEmail` and `emailAttached`; the `check_violation` map gains
  "email address" to `email_invalid`; `setGuestPendingEmail` maps `no_data_found` to 401, "comes from your
  account" to 403, the rest of `check_violation` to 422. `null` crosses the wire as `""` because the
  generated `Args` declares `p_email` required and the RPC's own `nullif(btrim(...))` turns it into SQL NULL.
- `identity`: `resolveUploaderIdentity` case 3 returns `email: null` ALWAYS. This is a real behaviour change
  on the HOST gallery: an unverified row's `guests.email` used to print there. Pinned, plus a source pin
  that the module never reads `pending_email` in any spelling.
- `crack`: `POST /api/guests/capture-email` now requires `email_confirmed_at`, not just `user.email`. Live
  count on the project: `0` unverified guest rows carry an address, so nothing existing was ever poisoned.
- `forensics`: the capture seam selects `pending_email` and writes `guest_pending_email`; a new
  `capture.test.ts` pins the SELECT itself (a column not asked for is a silent null), the host arm, and
  loud-never-fatal. The `?what=record` export already reads the row unnarrowed; a new test pins that, so a
  future "tidy" into a named column list cannot silently drop the newest evidence.
- `profile-queries`: `getMyShownEventIds` over `profile_shown_events`; `getMyAttendedEvents` returns
  `shownOnProfile`; `getPublicProfileAttendedCoverUrls` gate 3 inverts to an INTERSECTION and
  short-circuits on empty; `showEventOnProfile` / `hideEventFromProfile` replace hide / unhide. Nothing in
  `src/` reads or writes `profile_hidden_events` any more.
- `red-team` (local, :3133, against the throwaway event `38290e85`, rows deleted after): a join with an
  address answered `email_attached: true` and the body contained no address; a junk address 422'd and never
  minted; a join without one answered `false`; the attach route refused a body without a token 400 AND
  refused the same request when the token was supplied only as a COOKIE; the token in the body attached,
  detached on `null`, 422'd on junk, 400'd on a missing key, 404'd a dead link, 401'd a forged token, and a
  forged `guest_id` in the body touched only the caller's own row. In the database: the address stored
  lowercased and trimmed, `guests.email` still NULL on both rows, and the host's column-scoped SELECT grant
  on `guests` is still exactly `(created_at, email, event_id, id, user_id)` - `pending_email` is fail-closed.
  The rendered guest page and the gallery poll carried no address.

### Calls his to overrule (on the alias)

- The `attach_email` limiter's numbers: the rename's exactly (15 distinct events an hour, 60 per (IP, event)
  per quarter hour). The brief named this; I took it. Nothing is ever mailed to the address, so the harm
  ceiling is junk in a column.
- Case 3 returns NO address at all, rather than a muted or masked one. The brief named this; I took it. It
  changes what a host sees on their own gallery for a guest who signed up and never confirmed.
- The forensics column: captured and denormalized, rendered on no page, read only on the Record export.
- **One refusal code, not two.** The name has `name_required` and `name_invalid`; the address has only
  `email_invalid`, because a blank one is never an error (optional at the door, the detach on the attach
  route). Alternative: a second code for "you typed only spaces", which I judged a distinction without a
  difference to a guest.
- **The sentence: "Check that email address."** Written as a nudge rather than a verdict, no em-dash, names
  nothing internal.
- **A MISSING `email` key on the attach route is a 400, not a detach.** A client that forgot the field would
  otherwise silently throw away a guest's claim ticket. `null` and `""` both detach.
- **zod's DEFAULT email regex** (roughly Gmail's rules), not `z.regexes.unicodeEmail`. Stricter, so a few
  real international addresses are refused; the alternative accepts more but lets more junk into a column a
  guest has to recognise later. One line to change if he prefers the looser one.
- **The deprecated pair** (`hiddenFromProfile`, `unhideEventFromProfileAction`) kept for one merge so this
  tree builds while the claims lane still owns the switch. The alternative was editing another lane's file.
- The `/admin/forensics` coverage copy now says "the name a guest typed at the door plus any address they
  typed beside it, unconfirmed" and points at Download Record.
- `MAX_GUEST_EMAIL_LENGTH = 254` exported from `validation/upload.ts` so the door's field can cap its input
  against the same number the column holds.

### The help articles this lane makes stale (for `help-sync`)

- `content/help/your-public-profile-following-and-blocking.mdx`, "What shows on your profile": "Events you
  joined appear when you added photos while signed in..." and "the switches on your account page **hide** any
  event from your profile" are both wrong now. Nothing appears until its owner turns it ON, and the guest
  must be VERIFIED. Owned by no lane this round.
- `content/help/messages-guests-might-see.mdx`: the names-mode door now shows an OPTIONAL email field under
  the name, which this article does not describe (it covers only the verified-required one). Owned by no
  lane this round; the door lane's copy is the source for it.
- (`why-an-event-asks-for-your-email`, `how-guests-join-and-upload`, `save-an-event-and-find-your-uploads`,
  `profiles-guest-lists-and-following`, `display-name-and-profile-photo` are the claims lane's owns, and
  `require-verified-emails-explained` / `what-guests-can-and-cant-see` the door lane's; each is stale from
  this lane's behaviour too, and each owner is already briefed to rewrite it.)

### Assets requested from Will

- none.

### Proposed migrations / Worker / Vercel / Stripe / env changes

- none. Everything here codes against wave 0's applied schema; no DDL, no new secret, no config.

### Look at first

1. `src/lib/media/uploader-identity.ts` case 3 - the one behaviour change a HOST will notice, and the only
   place in the lane where an existing surface loses information it used to show.
2. `src/app/api/guests/email/route.ts` - the new door, and the head comment that says why nothing is ever
   mailed to the address it writes.
3. The `guests` paragraph in `docs/systems/database-security.md` - the two-columns-one-path invariant, which
   is the sentence the next four lanes should be able to quote.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
