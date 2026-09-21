---
track: verified-email-server
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "bc28580b"          # the launch-prep SHA the branch was cut from
board: none            # the identity reshape, wave 1: the route, the identity, the queries; no board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/guests/
  - src/app/api/r2/
  - src/lib/db/queries/
  - src/lib/db/mutations/
  - src/lib/validation/
  - src/lib/security/
  - src/lib/forensics/
  - src/app/admin/forensics/
  - src/lib/social/cards.ts
  - src/lib/media/uploader-identity.ts
  - src/lib/media/uploader-identity.test.ts
  - src/lib/events/gallery-access.ts
  - src/lib/events/gallery-access.test.ts
  - src/lib/events/gallery-access.server.ts
  - src/lib/events/gallery-fingerprint.ts
  - src/lib/events/gallery-fingerprint.test.ts
  - src/lib/r2/grid-items.ts
  - src/lib/r2/grid-items.email-safety.test.ts
  - src/lib/event/gallery-items.ts
  - src/lib/reel/build-reel-props.test.ts
  - src/components/app/media-grid.tsx
  - scripts/seed-demo-event.mjs
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/guest/claim-uploads.ts
  - src/lib/guest/session-tokens.ts
  - src/components/guest/enter-event-prompt.tsx
  - src/components/auth/email-sign-in.tsx
  - src/components/app/event-settings/uploads-section.tsx
  - src/lib/constants/tiers.ts
  - supabase/migrations/
  - docs/systems/database-security.md
  - docs/systems/guest-flow.md
  - docs/design/rulings.md
---

# lp/verified-email-server

**Goal.** Wave 1 of the identity reshape: Will's `address=none` on `guest-verify` round two and his note (2026-09-21, build `5e210ef`), verbatim in `docs/design/rulings.md` under "the identity reshape", with his four answers at approval: anonymity leaves the product; the host's switch becomes Require verified emails (on by default); off, a guest types a display name at the door and uploads under it with a small unverified mark; the capture flow after a name-only guest's first upload is wired as the working version. The schema is applied and the types regenerated on the tree you were cut from: the flag is `events.require_verified_email`, the name `guests.display_name`, the proof `guests.verified_at`. This lane is the route, the identity and the queries. The brief below is the whole reading.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `bc28580b`)

- Against the applied schema and regenerated types: `POST /api/guests` (`joinSchema` gains
  `display_name: displayNameSchema.optional()`; `containsProfanity` server-side; 422 `name_required` | `name_invalid`
  | `verification_required`), `mutations/guest.ts` (`displayName` → `p_display_name`; `mapCheckViolation` gains the
  "verified email" branch before the generic ones), the rename route `POST /api/guests/name {qr_token, session_token,
  display_name}` (the same zod and profanity gate; its own limiter kind `rename` with a tight per-IP-and-event cap in
  `abuse-rate-limit.ts`, R1.7; the token in the body) over `set_guest_display_name`, presign and complete (403
  `verification_required` from the context, with a `captureWarning("security", …)` so a flip's fallout is visible,
  R1.14), `uploader-identity.ts` (`UploaderIdentity { displayName, email, isHost, isVerified }` on the one precedence
  rule AS WAVE 0 CORRECTED IT: `guests.verified_at` set means the profile's name and verified; else a typed
  `guests.display_name`, unverified; else "A guest"; NEVER `user_id` alone, since an unconfirmed session still
  carries a uid and keeps its typed name; `isAnonymous` kept only as "nameless legacy row" so the lab's fixtures keep compiling), `grid-items.ts` and
  `GridMedia` (`isVerified`), the admin embed's select (`guest-events-admin.ts:208` gains `display_name`,
  `verified_at`), the forensics capture (`forensics/capture.ts` stores `guest_display_name`) and its admin view,
  `gallery-access.ts` (`require_verified_email`), `validation/event.ts` (default true; `createEvent` sends only the
  new flag), `mutations/events.ts`, `getEventGuestList(eventId, { includeUnverified = false })` (a second admin read
  of named unverified guests with approved media, one entry per guest row, appended after the profile cards as
  `{ kind: "unverified", id, displayName }`; the default keeps the host hub and `withAvatarUrls` green, and the guest
  page opts in; `social/cards.ts` owned here so the union splits before it; R2.2), the host's card for the follow
  moment (`getHostCard(eventId)` in `queries/social.ts`: `{ id, slug, displayName, avatarUrl } | null`, public fields
  only), the seed script's flag line (`scripts/seed-demo-event.mjs:440` writes both columns until the contract).
  Tests: the fixture flips (`gallery-access`, `uploader-identity` with unverified-named, legacy and claimed cases,
  `upload` (trims, refuses >60 and reserved, a lone qr_token still parses; the rename schema), `event` (default true),
  `gallery-fingerprint`, `grid-items.email-safety`, `build-reel-props`), the rename route's test on the `mine`
  route's pattern, the host-card query's shape, the guest list's union. `guest-flow.md`'s "Joining + identity" block
  refined in place (this lane's exception line; the guest lane owns the file).
- Owns (files under `src/lib/events/` because the host lane owns the summary there): `src/app/api/guests/`,
  `src/app/api/r2/`, `src/lib/db/queries/`, `src/lib/db/mutations/`, `src/lib/validation/` (`profile.ts` inside it
  stays untouched), `src/lib/security/`, `src/lib/forensics/`, `src/app/admin/forensics/`, `src/lib/social/cards.ts`,
  `src/lib/media/uploader-identity.ts` (+ test), `src/lib/events/gallery-access.ts` (+ test, + `.server.ts`),
  `src/lib/events/gallery-fingerprint.ts` (+ test), `src/lib/r2/grid-items.ts` (+ `grid-items.email-safety.test.ts`),
  `src/lib/event/gallery-items.ts`, `src/lib/reel/build-reel-props.test.ts`, `src/components/app/media-grid.tsx`,
  `scripts/seed-demo-event.mjs`. Reads: `src/lib/guest/claim-uploads.ts`, `src/lib/guest/session-tokens.ts`,
  `src/components/guest/enter-event-prompt.tsx`, `src/components/auth/email-sign-in.tsx`,
  `src/components/app/event-settings/uploads-section.tsx`, `src/lib/constants/tiers.ts`, `supabase/migrations/`,
  `docs/systems/database-security.md`, `docs/systems/guest-flow.md`, `docs/design/rulings.md`.
- His to overrule: the legacy label "A guest"; the 403 after a flip ON; the claim naming a profile; the rename door.

## The verdict map (every answer of the batch; this lane wires only its own board's)

(no verdict map: one verdict and a note, verbatim in docs/design/rulings.md under "the identity reshape", and his four answers at approval; the brief above is the Orchestrator's whole reading)

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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Every claim below (a retirement, a migration, a gate, a fix) names its artifact (a commit hash, a log line, a file path), so
  the Orchestrator checks rather than believes; a claim with no artifact is read as unverified.
- Gates on the synced tree: design:rules ok, specimens ok, typecheck ok, lint ok (8 known), test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board <board>` ok (a board)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each: `<id>: <the builder's verdict>; a kept one becomes <the Library entry it lands as>`
- Calls his to overrule on the alias, one line each
- The help articles this lane makes stale, one line each (a `help-sync` lane rewrites them)
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
