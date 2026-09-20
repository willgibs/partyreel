---
track: guest-verify
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "af7ec784"          # the launch-prep SHA the branch was cut from
board: guest-verify    # a new board: registers at the head of DESK_ORDER, the Orchestrator moves it after guest-shape
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/guest-verify/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/auth-accounts.md
  - docs/systems/database-security.md
  - src/components/guest/enter-event-prompt.tsx
  - src/components/auth/email-sign-in.tsx
  - src/components/guest/entry-modal.tsx
  - src/components/app/event-settings/uploads-section.tsx
  - src/lib/media/uploader-identity.ts
  - src/components/social/guest-list.tsx
  - src/app/(dev)/design/sandbox/seed-avatar/gradient.ts
  - docs/design/rulings.md
---

# lp/guest-verify

**Goal.** Will's fifth batch (2026-09-19, build `69a9a17`) answered the four boards at the head of the desk; this lane is one of ten cut from it. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- His ask by name (the whole `gate` note verbatim in the brief). A new board on the guest door with the real facts:
  today `events.allow_anonymous_uploads` (default false = accounts required), the account step is Supabase Auth OTP
  (`email-sign-in.tsx:89`, a code and a magic link, `verifyOtp`), the hard gate is Postgres (`create_guest` raises when
  the event requires an account and the caller has none or an unconfirmed email), a failed send is one toast and a
  Resend button, and nothing in the product distinguishes a verified guest from an unverified one (`guests.user_id`
  the only proxy; the "verified-at-join" invariant: the email is read from `auth.users`, never the client). Six
  decisions, drawn on the real guest door, the guest list, the faces row (with `seed-avatar`'s orbs as the fallback) and
  the host's review queue (never `/admin`, the `admin` board's ground), phone first, with one fact every `outage` option
  draws: Supabase Auth OTP is rate-limited per email and per IP and a venue's shared network is ONE IP: `gate` (confirm before the upload, as today / upload now and
  confirm later, the upload marked / upload now, held for the host until confirmed), `badge` (what an unverified account
  shows on its avatar and in the guest list: a mark, a dimmed ring, nothing), `collision` (someone enters an email that
  exists unverified: claim it by confirming, a fresh account, refuse), `outage` (what happens when the code never
  arrives: a bypass the host set, a grace window, a second channel), `host-lens` (what the host sees and controls:
  "require confirmed emails" per event as today, a review filter for unverified, a badge in the queue; what an unverified
  account may not do, caps, rate, no downloads, no claims, is the cost line on every option, not a decision), and `expiry` (media from an account that never
  confirms: held seven days then removed, or kept as anonymous; the one question with a data-loss cost). Every option
  states its security cost against `docs/systems/database-security.md` and the anti-abuse invariants (storage caps, the
  host's setting as the host's protection); the recommended answers explicit. The security picture the board must DRAW
  rather than describe: the collision is about sessions, not emails. If A uploads under bob@x unverified and the real
  Bob later confirms bob@x, Bob must not inherit A's uploads; unverified uploads bind to the session's guest row
  (today's anonymous path, `guests.user_id` null), confirmation by the same session claims them (`claimAnonymousUploads`
  exists), confirmation by another session orphans them: a two-lane flow picture (session-bound against email-bound)
  as the `collision` step's stage. `gate=held` rides the existing `pending` status (auto-approve on confirm when
  moderation is off); `outage`'s strongest option is the host's time-boxed switch on the settings sheet ("let everyone
  in for three hours"), SMS costing money and PII; the `badge` step draws BOTH a guest-visible mark (his words, "on
  avatars") and a host-only one, with the cost written on the frame (an "unverified" mark on a guest album's faces row
  reads as "suspect" to other guests). No production byte; a proposed migration only as a written proposal.
  Registers at the head of `DESK_ORDER` (the Orchestrator moves it after `guest-shape` at the merge: it changes the
  guest door every guest board draws).
- Owns `src/app/(dev)/design/sandbox/guest-verify/` and its registration lines. Reads: `guest-flow.md`, `auth-accounts.md`,
  `database-security.md`, `enter-event-prompt.tsx`, `email-sign-in.tsx`, `entry-modal.tsx`, `uploads-section.tsx`, the
  two migrations named, `uploader-identity.ts`, `guest-list.tsx`, `sandbox/seed-avatar/gradient.ts` (the orb).

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

- None open. Every call the brief left to the lane was taken on its recommendation and is listed in the Handoff
  under "Calls his to overrule". The three that decide what the board MEANS ride the board itself as carried
  calls (`mechanism`, `badge-audience`, `numbers`), above the first step, so Will meets them where he answers
  rather than in a doc he may not open.
- No one-way door was hit: the board proposes and applies nothing. The migration below is written out and run by
  nobody, and the six answers are Will's to give on the desk.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- None. A lab board changes no shipped behaviour, and all three system docs in `reads` belong to other owners.
  Two facts the lane PROVED are worth folding into `docs/systems/auth-accounts.md` by whoever wires the ruling
  (they are not true of the tree until then, so they are not written now): (a) `/auth/v1/verify`, typing the
  code, is limited BY IP and is the one row Supabase's table marks not customizable, so a venue's single Wi-Fi is
  one bucket for every phone on it, while `/auth/v1/otp`, sending it, is capped PROJECT-WIDE and shared with
  every other host; (b) GoTrue creates the `auth.users` row at SEND time, not at confirmation, which is what
  makes an email-bound claim a real takeover rather than a race.

## Deferred (ROADMAP one-liners, bucket named)

- Now: the lab's pinned stage crushes its own head at 375 when a step has ONE config row. The recommended-option
  line and the knob row share a line and the label truncates to "the board s... O...", so the phone reviewer
  cannot read which option the board recommends without scrolling the dock. Reproduced outside this lane on
  `seed-avatar.look`, so it is the kit (`src/components/lab/`), not a board; `lab:demo` passes it because it
  measures reach and clipping, not the head. A step with two config rows (this board's `badge`) wraps correctly.
- Now: read this project's CONFIGURED Supabase Auth rate limits (Dashboard, Authentication -> Rate Limits) and
  record them beside the defaults in `auth-accounts.md`. The board draws Supabase's documented defaults and says
  so on the frame; only the send cap can be raised, and knowing the real number is what decides how bad an
  `outage` actually is at 120 phones.

## Handoff (replaces the chat report)

- The board is `31ca8573` and its refinement `8bebbc8b`, pushed on `lp/guest-verify`; synced with
  `origin/launch-prep` twice, at `104cfb90` (the avatar-look and demo-wiring records) and at `129796d8` (the
  morning record and the PartyreelAI journal). Every gate below is the second, synced tree.
- Gates on the synced tree, each on its own exit code: `design:rules` 0 (182 components, 1299 contracts, 18
  policies), specimens 0 (140 specimens on 101 entries), `typecheck` 0, `lint` 0 (8 known warnings, none this
  lane's), `test` 0 (290 files, 3055 passed, 1 skipped), `build` 0 (255 pages); `pnpm lab:smoke` 0 (441 checks, 0
  failing); `pnpm lab:demo --board guest-verify` 0 (6 steps, 0 failing, every step draws its options; tallest and
  wordiest is `collision` at 1.6 screens and 297 words). Verified by eye at 1440 and 375 with reduced motion
  emulated, after the sync.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the nine files under
  `src/app/(dev)/design/sandbox/guest-verify/` and this manifest, plus four exceptions. Three are the board's own
  registration lines under the registration exception (`touchpoints.ts`: the `RulingId`, the `SandboxId`, the
  RULINGS row and the head of `DESK_ORDER`; `sandbox/registry.ts`; `(shell)/lab/boards.ts`). The fourth is
  `docs/design/library.md`, which is `pnpm design:rules`'s own output and carries one new row in the
  standing-boards table with the count 25 -> 26; no rule, policy or contract moved.
- `gate`: three phone screens one second after Add, on the same door and the same code, with what an unproven
  guest may not do drawn identically under all three so the comparison is the gate and not the allowance;
  recommended `held`, which keeps both halves of his own sentence (the upload is never blocked, nothing unproven
  reaches the party). A kept `held` lands as the existing `pending` status carrying a second reason, "waiting on
  a code", auto-approved on confirmation when moderation is off: no new media status is invented.
- `badge`: his own idea drawn literally, with its cost on the frame (five faces of twenty-three marked in the
  album's guest list, which reads as "suspect" to the other eighteen), the quietest guest-visible form beside it,
  and the same fact moved to the host; the gate rides this step's own strip because the mark's job changes with
  it. Recommended `host`. A kept `host` lands as a state in the host's guest list with a count, and nothing on a
  guest's screen.
- `collision`: not a screen but the flow, because all three answers look like an ordinary door to the person
  standing at it; the two lanes drawn side by side with the second person's screen beside them. Recommended
  `session`. `email` is a real takeover and the board draws why: GoTrue mints the `auth.users` row at SEND time,
  so the real Bob's code opens the row a stranger's five photographs already hang off, and `claimAnonymousUploads`
  never re-stamps an owned row. A kept `session` lands as one nullable claimed-address column and no new
  mechanism at all.
- `outage`: the wall measured rather than imagined, under all three options; recommended `window`, the only
  remedy that is both reachable at the moment it fails and temporary. A kept `window` lands as a time-boxed
  control on the settings sheet (let everyone in for three hours, closing itself) plus the open-door strip the
  host and the door both read.
- `host-lens`: nine real queue items, four of them waiting on a code no tap of the host's can hurry; recommended
  `split`, the only one that answers "how much of this is mine", which is the question a host opens the queue
  with. A kept `split` lands as two counted piles in the review room, the second emptying itself.
- `expiry`: the only question with a data-loss cost, drawn as the pair that decides it (the sentence the guest is
  told at the upload, and what day seven does to a Free host's two gigabytes); recommended `host`, which invents
  no policy and applies the answer the host already gave when they set the event up. A kept `host` lands as one
  branch in the purge cron, on the host's own switch.
- Calls his to overrule on the alias, one line each:
  - What an unverified account IS: this browser's anonymous guest row plus ONE nullable claimed-address column
    that authorises nothing, never an unconfirmed auth session. A real unconfirmed session would mean turning
    Supabase's Confirm-email off platform-wide, which un-proves every HOST too and breaks auth-js's own refusal
    to link an unverified identity.
  - The badge's audience: his note put it "on avatars", and the board recommends host-only, with both
    guest-visible forms drawn and their cost written on the frame.
  - The numbers on the `outage` wall are Supabase's documented defaults, labelled as such; the shapes (per IP,
    project-wide, not customizable) are exact and are the part that decides the answer.
  - The ruled gate SENTENCE ("For safety, the host has requested you confirm your email. One tap and you're in.")
    is wired and untouched: this board asks the question underneath it, never the copy.
  - What an unproven guest may NOT do (download, save the event, appear in the guest list, add more than a
    handful) is drawn as a cost line under every `gate` option rather than as a seventh decision, per the brief.
  - `gate=held` rides `pending` rather than a new media status, and `outage=window` rides the settings sheet
    rather than a new room.
- The help articles this lane makes stale: none. No production byte changed, so every how-to still tracks the
  tree. If `gate`, `outage` or `expiry` is ruled, the wiring lane makes `how-guests-join-and-upload`,
  `require-accounts-to-upload-explained`, `review-uploads-before-they-appear` and
  `save-an-event-and-find-your-uploads` stale in the same change (a held upload, a time-boxed open door and a
  deadline are all sentences those four articles state as facts today).
- Assets requested from Will: none. Every frame draws the product's own components over `MARKETING_IMAGES`.
- Proposed migrations / Worker / Vercel / Stripe / env changes: one migration, WRITTEN ONLY and applied by
  nobody, and it is the whole cost of `gate=after|held` with `collision=session`:

      -- the claimed address: a label on an anonymous guest row, authorising nothing.
      alter table public.guests add column claimed_email text;
      comment on column public.guests.claimed_email is
        'Typed by an anonymous guest and NEVER proven. Authorises nothing: only guests.email,
         written from auth.users under definer privilege, is a verified address.';

  Insert, update and delete on `public.guests` are already revoked from `anon` and `authenticated`
  (`20260604175656`), and SELECT is COLUMN-locked to five columns for `authenticated`
  (`20260729180000:328`), so the new column is added and then LEFT OUT of that grant on purpose: nothing but a
  definer RPC ever reads it, which is the whole point of a label that authorises nothing. `create_guest` would
  take the address as an argument and write it beside the session token instead of raising; `claim_anonymous_uploads`
  (`src/lib/guest/claim-uploads.ts`) runs unchanged on confirmation, and it stamps only rows whose `user_id` is
  still null (`20260609120000`: "an already-owned row is NEVER stolen or re-assigned"), which is what keeps a
  stranger's uploads off the real Bob. Nothing on `media`, nothing on Supabase
  Auth, and `guests.email` keeps its verified-at-join meaning exactly.
- Look at first: `collision` at 1440. It is the security question drawn rather than described, and the only step
  whose answer the other five rest on. Then `gate` at 375, which is the board's actual question in one screen.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-20). `guest-verify` answered his `gate=ask` note by name with six
decisions on the shipped door, album, guest list and review queue, phone first at 375 with 1440 on the knob, every
frame drawn on the real components and measured out of the laid-out DOM: when the address gets proven (`held`),
what an unproven account shows and to whom (`host`), where five photographs land when two people type one address
(`session`, with the email lane drawn as the takeover it is, since GoTrue mints the auth row at send time), what
rescues a party when the codes stop arriving (`window`, against a wall measured on Supabase's own table where
typing a code is capped per IP and a venue is one IP), what the host's queue says (`split`), and what day seven
does to a photograph nobody confirmed (`host`). No production byte: the one nullable column it would cost is
written out in the Handoff and applied by nobody.
