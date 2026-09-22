---
track: guest-email-migration
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "f27c6b6a"          # the launch-prep SHA the branch was cut from
board: none            # production, wave 0 of the guest identity round: the schema (pending_email, the claim RPCs, profile_shown_events) as SQL files the Orchestrator applies; no board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20260922120000_guest_pending_email.sql
  - supabase/migrations/20260922122000_profile_shown_events.sql
  - src/lib/db/migration-guards.test.ts
  - src/lib/social/public-profile-visibility.test.ts
  - src/lib/validation/profile.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - supabase/migrations/20260921150000_identity_require_verified_email.sql
  - supabase/migrations/20260609120000_claim_anonymous_uploads.sql
  - supabase/migrations/20260919140000_profile_rpc_anon_viewer_gate.sql
  - supabase/migrations/20260920090000_remove_my_upload_by_session.sql
  - supabase/migrations/20260729180000_qa_q3_escalation_guards.sql
  - src/lib/db/types.ts
  - docs/systems/database-security.md
  - docs/design/rulings.md
---

# lp/guest-email-migration

**Goal.** Wave 0 of the guest identity round, cut by the Orchestrator from Will's ruling of 2026-09-22 (rulings.md "guest identity: name only, unconfirmed email, verified account", every sentence his): the schema the three wave-1 lanes code against, written as SQL files with their pins and rolled-back checks; the Orchestrator applies them. No board, no production TypeScript beyond the tests named. The lane's brief follows; read it end to end before the first edit.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `f27c6b6a`)

- What this is: Will's identity model (rulings.md "guest identity: name only, unconfirmed email, verified account", every sentence his): a names-mode door captures an OPTIONAL email on the name step, stored UNCONFIRMED and inert (never shown to the host or other guests, never attributed to any account, never mailed on its own, never expiring); a confirmed email later CLAIMS its past rows per event or all, and what is not claimed is removed; both claims stamp the row verified; profiles publish nothing until chosen. This lane writes the SQL and its pins ONLY; the Orchestrator applies each file by `apply_migration`, runs your rolled-back check by `execute_sql`, runs `get_advisors`, regenerates `src/lib/db/types.ts`, then cuts three lanes that code against the real types. No production TypeScript here beyond the tests named. Nothing renamed on disk.
- THE REPRESENTATION: a separate `pending_email` column, never `email`. `guests.email` carries the invariant "confirmed, copied from `auth.users` at the mint" and three host-facing readers depend on it (the host's column-scoped PostgREST SELECT grant `(id, event_id, user_id, email, created_at)` in `20260729180000`, `resolveUploaderIdentity` case 3, `upload_forensics.guest_email`); a typed stranger's address must never travel any of them. A new column is fail-closed (not in the grant); the claim moves it into `email` only when proved.
- FILE 1, `supabase/migrations/20260922120000_guest_pending_email.sql` (expand-only; the `20260921150000_identity_require_verified_email.sql` pattern: the apply protocol in the header, the advisor delta, the rolled-back `DO $$` check at the foot ending in `raise exception 'ROLLED BACK ...'`): (1) the backfill FIRST: `update public.guests g set verified_at = coalesce(g.verified_at, g.created_at), display_name = null from auth.users u where u.id = g.user_id and u.email_confirmed_at is not null and g.verified_at is null` (rows claimed by token since the reshape carry `user_id` and no `verified_at`; the 0921 backfill's own rule, re-run once). (2) `alter table public.guests add column pending_email text, add column pending_email_at timestamptz;` a CHECK `guests_pending_email_shape` (`pending_email is null or (pending_email = lower(btrim(pending_email)) and char_length(pending_email) between 3 and 254 and position('@' in pending_email) > 1)`), a partial index `guests_pending_email_idx on public.guests (pending_email) where pending_email is not null`; NOT granted to `authenticated`; column comments stating the rule (typed, unproved, never rendered, never mailed on its own, never copied into `email` except by a claim). (3) `alter table public.upload_forensics add column guest_pending_email text;` with a comment (the 0921 `guest_display_name` precedent; captured by the server lane later). (4) `create_guest`: drop the 4-arg, create `create_guest(p_qr_token text, p_user_id uuid default null, p_unlock_proven boolean default false, p_display_name text default null, p_pending_email text default null) returns jsonb`, the body verbatim from 20260921150000 plus `v_pending := lower(nullif(btrim(coalesce(p_pending_email, '')), ''))`, nulled beside a confirmed account and nulled when the event requires verified emails, a belt (`char_length(v_pending) <= 254 and position('@' in v_pending) > 1` else `raise exception 'That email address does not look right.' using errcode = 'check_violation'`), the insert carrying `pending_email` and `pending_email_at = case when v_pending is not null then now() end`, the payload gaining `'email_attached', (v_pending is not null)`; the address never returned; `revoke all ... from public, anon, authenticated; grant execute ... to service_role`. (5) `set_guest_pending_email(p_session_token text, p_email text) returns jsonb`: by token (`length >= 16`), unknown token → `raise ... 'no_data_found'`-class refusal the route maps to 401; a verified row → `raise exception 'Your email comes from your account.' using errcode = 'check_violation'`; null or blank DETACHES (both columns null); else sets lowercased and stamps `pending_email_at = now()`; returns `{guest_id, email_attached}`; service_role only. (6) `list_guest_rows_by_email() returns table (guest_id uuid, event_id uuid, event_name text, event_date date, display_name text, upload_count integer, last_upload_at timestamptz, pending_email_at timestamptz)`: `v_uid := auth.uid()`, the caller's own `email, email_confirmed_at` from `auth.users`, nothing when unconfirmed; rows where `g.pending_email = lower(v_email) and g.user_id is null and g.verified_at is null and e.deleted_at is null`; `event_date` null for a password event; never `qr_token` or `custom_slug`; `stable`; granted to `authenticated`, revoked from `public, anon`. (7) `claim_guest_rows_by_email(p_event_ids uuid[] default null) returns integer`: confirmed caller only (else 0); `cardinality(p_event_ids) <= 200` else raise; before the update, name a NAMELESS profile (`profiles.display_name is null`) from the most recently created row AMONG THOSE BEING CLAIMED; then `update public.guests set user_id = v_uid, verified_at = now(), email = v_email, pending_email = null, pending_email_at = null, display_name = null where pending_email = lower(v_email) and user_id is null and verified_at is null and (p_event_ids is null or event_id = any(p_event_ids))`; returns the row count; granted to `authenticated`, revoked from `public, anon`. (8) `disown_guest_rows_by_email(p_event_ids uuid[]) returns integer`: confirmed caller; a non-empty array, at most 200; for every matching row (`pending_email = lower(v_email) and user_id is null and event_id = any(p_event_ids)`): `update public.media set status = 'removed', removed_at = coalesce(removed_at, now()), removed_by_uploader = true where guest_id = g.id and (status <> 'removed' or removed_by_uploader = false)`, then null `pending_email, pending_email_at`; the row survives; returns the rows detached; granted to `authenticated`, revoked from `public, anon`. (9) `claim_anonymous_uploads(p_session_tokens text[])`: same signature, `create or replace`, grants unchanged; read `email, email_confirmed_at` for `auth.uid()`; when confirmed the update also sets `verified_at = now(), email = v_email, pending_email = null, pending_email_at = null, display_name = null` (a typed address that differs from the caller's is dropped: the device is the proof) and names a nameless profile from the most recently created row being claimed; an unconfirmed session stamps `user_id` only, as today; the `user_id is null` filter unchanged. (10) The check arms (rolled back): a names-mode mint stores a trimmed lowercased address unconfirmed and returns `email_attached` true; a confirmed mint nulls it; a require-verified mint nulls it before the insert; the 4-arg call still mints; a junk address refused; `set_guest_pending_email` sets, detaches, refuses a verified row and an unknown token; `list_` returns the caller's rows (with counts) and nothing for a stranger's address and nothing for an unconfirmed caller; `claim_` for one event then for all stamps `user_id`/`verified_at`/`email`, clears both pending columns, names a nameless profile and never a named one, and the 201-id call raises; `disown_` marks the media removed with `removed_by_uploader`, leaves a host-binned item unrestorable (`restore_media` refuses it), clears the address, the row surviving; `claim_anonymous_uploads` stamps `verified_at` and `email` for a confirmed caller, drops a differing typed address, stamps `user_id` only for an unconfirmed caller, never re-stamps an owned row; the backfill stamps a token-claimed row and never an unconfirmed user's; `pending_email` NOT selectable by `authenticated` (`has_column_privilege`); the function privileges (anon has none of the six; `authenticated` has exactly `list_`, `claim_`, `disown_`, `claim_anonymous_uploads`); ending in the deliberate raise. Expected advisor delta: the anon set stays five; three new authenticated-callable definers beside `claim_anonymous_uploads`; `set_guest_pending_email` and the 5-arg `create_guest` in neither client list. Say it in the header.
- FILE 2, `supabase/migrations/20260922122000_profile_shown_events.sql`: `create table public.profile_shown_events (user_id uuid not null references public.profiles(id) on delete cascade, event_id uuid not null references public.events(id) on delete cascade, created_at timestamptz not null default now(), primary key (user_id, event_id))` with RLS enabled, the identical policies and grants as `profile_hidden_events` (owner select, owner insert of `(user_id, event_id)`, owner delete; read the migration that created `profile_hidden_events` and mirror it exactly), an index on `event_id`; NO backfill (the product has zero real users; "nothing until chosen" applies from the first day); `get_public_profile` recreated (the current body from `20260919140000_profile_rpc_anon_viewer_gate.sql`, its grants re-stated) with the attended arm's `not exists (... profile_hidden_events ...)` clause replaced by `and exists (select 1 from public.profile_shown_events s where s.user_id = p.id and s.event_id = e.id)` plus the belt `and g.verified_at is not null`; `profile_hidden_events` is NOT dropped (the deployed app reads and writes it until wave 1 is live; a later migration drops it). The check arm: a shown event lists, an unshown one hides, a row without `verified_at` hides even when shown, the owner can insert and delete their own row and not another's, the policies exist.
- The pins: `src/lib/db/migration-guards.test.ts` gains a describe for this round: the 5-arg `create_guest` service-role; the CHECK and the partial index substrings; `set_guest_pending_email` service-role only; `list_`/`claim_`/`disown_` granted to `authenticated` and revoked from `anon`; the `claim_anonymous_uploads` pin at :328 ("never writes email") INVERTED on purpose, its comment saying why (a confirmed caller's claim is the one path from a typed address to a confirmed one); the attended arm reads `profile_shown_events` and `g.verified_at is not null`; no function named `expire_` exists; the forensics column. `src/lib/social/public-profile-visibility.test.ts` and `src/lib/validation/profile.test.ts`: the `profile_hidden_events` pins become `profile_shown_events` pins (read them first; they pin the four attended-arm clauses). `docs/systems/database-security.md` is the server lane's; you touch no doc.
- Owns: `supabase/migrations/20260922120000_guest_pending_email.sql`, `supabase/migrations/20260922122000_profile_shown_events.sql`, `src/lib/db/migration-guards.test.ts`, `src/lib/social/public-profile-visibility.test.ts`, `src/lib/validation/profile.test.ts`. Reads, never edits: `supabase/migrations/20260921150000_identity_require_verified_email.sql`, `supabase/migrations/20260609120000_claim_anonymous_uploads.sql`, `supabase/migrations/20260919140000_profile_rpc_anon_viewer_gate.sql`, `supabase/migrations/20260920090000_remove_my_upload_by_session.sql`, `supabase/migrations/20260729180000_qa_q3_escalation_guards.sql`, `src/lib/db/types.ts`, `docs/systems/database-security.md`, `docs/design/rulings.md` (the head section).
- Tests: the guards and the two pin files green; `pnpm test` whole; the gate with every exit code (`pnpm build` included); `lab:smoke`. You cannot apply SQL (the Orchestrator does); dry-run nothing against the live database. Write the check so the Orchestrator can paste it whole into `execute_sql` after each apply.
- His to overrule: the separate column; both claims stamping `verified_at` and `email`; the removal at the disown through the uploader path; the profile belt on `verified_at`; no backfill of shown events.

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

- **None stopped the lane.** Ten calls were taken on the brief's recommended answers and are listed
  under the Handoff's "Calls his to overrule"; none is a one-way door (every one is a line of SQL in
  a file nobody has applied yet). The two worth his eye before the apply are the disown's loud
  refusal of an unnamed event set and the reduction of `validation/profile.test.ts`'s duplicated
  consent-scope guard.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- **None.** `docs/systems/database-security.md` is `guest-email-server`'s (the brief); this lane
  touches no doc. What that lane must add when it lands: the three new 0029 members
  (`list_guest_rows_by_email`, `claim_guest_rows_by_email`, `disown_guest_rows_by_email`),
  `set_guest_pending_email` in the service-role-only list beside `set_guest_display_name`, and the
  `pending_email` fail-closed column as the newest instance of the QA #41 column-grant lesson.

## Deferred (ROADMAP one-liners, bucket named)

- **Cleanup:** retire `public.profile_hidden_events` once wave 1 is live and nothing reads or writes
  it (one migration: drop the table; the attended arm already reads `profile_shown_events`).
- **Cleanup:** when `guest-email-door` lands the zod schema for the optional address, give it a
  parity guard against this migration's CHECK the way `guests_display_name_len` is pinned to
  `DISPLAY_NAME_MAX_LENGTH` (the two numbers, 3 and 254, drift the moment one moves alone).
- **Cleanup:** fold `escalation-guards.test.ts`'s remaining file-pinned guards into
  `db/migration-guards.test.ts`'s latest-wins resolver, the way this lane folded the duplicated
  `get_public_profile` consent scope into one home.

## Handoff (replaces the chat report)

- Work commit `29f86fbe`; sync-merge `96540d4b` (launch-prep HAD moved, to `b99713e8` — `heal-validator`
  merged; the merge was clean, no conflicts, and every gate below ran AFTER it).
- Gates on the synced tree, each on its own exit code: design:rules ok (223 components, 1840 contracts,
  18 policies) · specimens ok (140 specimens on 101 entries) · typecheck ok · lint ok (10 known warnings,
  none in a file this lane touched) · test ok (328 files, 3520 passed, 2 skipped) · build ok (257 pages) ·
  `pnpm lab:smoke --base http://localhost:3132` ok (420 checks, 0 failing). No board, so no `lab:demo`.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` =
  `supabase/migrations/20260922120000_guest_pending_email.sql`,
  `supabase/migrations/20260922122000_profile_shown_events.sql`,
  `src/lib/db/migration-guards.test.ts`, `src/lib/social/public-profile-visibility.test.ts`,
  `src/lib/validation/profile.test.ts`. Owned paths only; no exceptions, nothing in another lane's file.
- **★ PRE-FLIGHTED, not claimed** (database-security.md's "throwaway local cluster" step). PostgreSQL
  17.10 (Homebrew), socket at `/private/tmp/pgpr17`, a stand-in carrying the real column types,
  defaults, constraints, the QA #41 guests grant state, the three media triggers, and the CURRENT
  bodies of `create_guest` (4-arg, from 20260921150000), `claim_anonymous_uploads` (20260609120000)
  and `get_public_profile` (20260919140000) extracted from the migration files rather than retyped —
  plus `alter default privileges in schema public grant execute on functions to anon, ...`, so
  Supabase's anon default-grant landmine is reproduced rather than assumed away. Results:
  both migrations apply clean (exit 0); CHECK 1 passes all 25 arms and ends in
  `ROLLED BACK — every guest-identity contract held`; CHECK 2 passes all 7 and ends in
  `ROLLED BACK — every profile-shown contract held`; the adversarial role probe (inside explicit
  transactions, `set local role authenticated` / `anon`) proves anon reaches NONE of the six functions,
  `authenticated` reaches exactly the four claim RPCs and neither server-mediated write, the host role
  can neither SELECT nor UPDATE `pending_email` while its five granted columns still work, and `anon`
  cannot read `profile_shown_events`; the deployed 3-arg AND 4-arg `create_guest` conventions both
  still mint; the backfill stamps a seeded token-claimed row at its `created_at`. The pre-flight
  found one real defect — the check block compared `guests.email` against a lowercased address while
  the function writes the form `auth.users` holds — which is fixed in the file.
- The items, one line each:
  - `pending_email` + `pending_email_at`: a separate column with a CHECK, a partial index and NO
    grant, so the host sees a badge and never the address (QA #41 fail-closed by construction).
  - `create_guest` (5-arg, drop + create): normalises the typed address, nulls it beside a confirmed
    account or a require-verified event, belts the WHOLE constraint, returns `email_attached` and
    never the address itself.
  - `set_guest_pending_email`: attach, change or DETACH by session token; a verified row is refused;
    service-role-only.
  - `list_guest_rows_by_email`: the claim preview, and the round's one oracle risk — closed by taking
    NO address parameter and returning nothing to an unconfirmed caller, even for their own address.
  - `claim_guest_rows_by_email`: stamps `user_id` / `verified_at` / `email`, clears both pending
    columns, and names a NAMELESS profile from the most recent row among those being claimed.
  - `disown_guest_rows_by_email`: removes through the uploader path (the host's bin and
    `restore_media` never see it), leaves the row and its forensic trail, detaches the address.
  - `claim_anonymous_uploads`: a confirmed arm that stamps the row whole (the device plus a proved
    address is more proof than an address alone); the unconfirmed arm byte-for-byte as today.
  - `profile_shown_events` + the attended arm's opt-IN and `verified_at` belt: nothing until chosen,
    and only a proved identity attends in public.
  - The pins: a new round describe in `migration-guards.test.ts` (the CHECK, the index, the
    fail-closed grant, no `expire_` function, the forensics column, the five RPC postures, the
    profile arm), the `claim_anonymous_uploads` pin inverted into a two-arm pin, and the profile
    guards repointed. Three negative controls run and reverted: re-pointing the arm back to
    `profile_hidden_events` fails 2 tests, naming `pending_email` in the guests SELECT grant fails 1,
    dropping the verified belt fails 2.
- Calls his to overrule on the alias (none is a one-way door; all are SQL in unapplied files):
  1. The mapped belt covers the CHECK's FLOOR as well as its ceiling (`between 3 and 254`, not just
     `<= 254`): otherwise `a@` passes `position('@') > 1` and lands as a raw 23514 the route cannot map.
  2. `disown_guest_rows_by_email` RAISES on a null or empty array instead of returning 0. `claim_`
     reads null as "all of mine"; on the destructive twin that shorthand would delete every upload the
     caller ever made from an unclaimed row.
  3. `upload_count` in the preview counts non-`removed` media: a row the guest already withdrew is
     not part of the offer.
  4. The preview nulls `event_date` for a `password` event and KEEPS the event name, mirroring QA
     #40's hide_meta / hide_name split (a `private` event never mints a guest at all).
  5. `guests.email` is written in the form `auth.users` holds it (trimmed, not case-folded, exactly as
     `create_guest` does) while `pending_email` is matched on `lower()`. Two forms of one address,
     deliberately: case-folding the stored form would drift the confirmed-address column from its readers.
  6. `claim_anonymous_uploads` re-states its revoke + grant although `create or replace` preserves the
     ACL — a belt against the MCP default-grant landmine if it is ever dropped and recreated.
  7. A blank at `set_guest_pending_email` DETACHES rather than erroring: "clear it" and "set it to
     nothing" are one intent.
  8. The disown does not exclude a legally-held row, mirroring `remove_my_upload_by_session`; the hold
     still blocks the purge, so the item goes off live and the bytes survive for the hold.
  9. `src/lib/validation/profile.test.ts`'s duplicated `get_public_profile` consent-scope describe was
     REDUCED to the bio's own zod-vs-SQL parity (resolved latest-wins) rather than repointed. That copy
     was pinned to migration 20260919120000, which 20260922122000 makes two generations stale, and its
     own comment already called the duplication a finding. The consent scope now has one home,
     `social/public-profile-visibility.test.ts`, which resolves the winning body latest-wins.
  10. The `claim_anonymous_uploads` pin is inverted into a TWO-arm pin (the brief asked for the
      inversion; splitting it so the unconfirmed arm stays pinned unchanged is this lane's shape).
- Help articles this lane makes stale: none. No shipped surface changes; the help how-tos that will go
  stale belong to the wave-1 lanes that build the door, the dashboard card and the claim screen.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: TWO MIGRATIONS TO APPLY, in order —
  `20260922120000_guest_pending_email.sql` then `20260922122000_profile_shown_events.sql`. Each carries
  its apply protocol in the header, its expected advisor delta, and a rolled-back `DO $$` check at the
  foot to uncomment and paste whole into `execute_sql`. Expected advisors: 0028 stays FIVE with the
  same members; 0029 grows by THREE; `set_guest_pending_email` and the 5-arg `create_guest` appear in
  neither. Regenerate `src/lib/db/types.ts` before wave 1 is cut. No Worker, Vercel, Stripe or env change.
- Look at first: `supabase/migrations/20260922120000_guest_pending_email.sql` section 8
  (`claim_anonymous_uploads`) — it is the one place this round INVERTS a standing invariant, and the
  header comment argues why a confirmed caller's token claim is a proved claim. Then the header of
  section 5 (`list_guest_rows_by_email`), which is the round's oracle gate.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-22). Wave 0 of the guest identity round landed as two
migrations for the Orchestrator to apply: `guests.pending_email` and `pending_email_at` in their own
fail-closed column (a CHECK, a partial index, no grant, so the host sees a badge and never the
address), `upload_forensics.guest_pending_email`, a 5-arg `create_guest` that normalises the typed
address and reports only whether one is attached, `set_guest_pending_email`, and the three claim RPCs
(`list_` with no address parameter and nothing for an unconfirmed caller, `claim_` stamping the row
whole and naming a nameless profile, `disown_` removing through the uploader path and refusing an
unnamed event set); `claim_anonymous_uploads` gained a confirmed arm that deliberately inverts the
"never writes email" rule; and `profile_shown_events` turned the profile's attended arm into an opt-in
with a `verified_at` belt. Pre-flighted on a throwaway PostgreSQL 17.10 cluster: both migrations
applied clean, both rolled-back checks passed every arm, and a role probe proved the grant split.
