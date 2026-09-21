---
track: verified-email-server
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

None stopped the lane. Every open point was taken on the brief's recommended answer and is listed under
"Calls his to overrule" below, with the three that are genuinely product-shaped marked there.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/guest-flow.md` "Joining + identity" REWRITTEN in place (this lane's exception line; the
  guest lane owns the file): the switch and its legacy twin, the join's three 422s and why the route owns
  them, the `verified_at`-never-`user_id` rule and the one precedence rule, the rename door, the per-upload
  re-check, and the guest list's two halves. The old "Guest display names were REMOVED (cut 2b);
  `create_guest` is 2-arg" line and the `allow_anonymous_uploads` paragraph are DELETED, not appended to.
- Same file, THREE more lines outside that block (flagged in the lane check): the `open` bullet under
  "State follows visibility" and the `full` / `teaser` bullets under "Gallery access" now name
  `require_verified_email`, because `resolveGalleryAccess` is this lane's module and its key changed. They
  would have been false the moment this lane landed.
- `docs/systems/database-security.md` needed NOTHING: wave 0 already recorded `set_guest_display_name` in
  the server-mediated inventory and `sync_event_verified_email_flags` in the trigger-only list.

## Deferred (ROADMAP one-liners, bucket named)

- Trust & safety: the rename route accepts a `qr_token` that does not match the session's event. Nothing is
  gained by it (the RPC renames the token's OWN row and nothing else, verified live), but it lets a caller
  choose its own per-(IP, event) limiter scope; the breadth ceiling is what catches token rotation today. A
  one-read check of the guest row's event id would close it if the rename ever gets busier.
- Cleanup: `events.allow_anonymous_uploads` and the `events_sync_verified_email_flags` twin-keeper retire
  together once `main` is past the reshape, and that change must re-point `get_public_profile`'s QA #36
  attended-arm clause in the same breath (it is still written on the legacy flag). `validation/event.ts`
  and `mutations/events.ts` drop their legacy arm with it.
- Trust & safety: `upload_forensics.guest_display_name` is captured but no ADMIN SURFACE renders it yet
  (the export route's `select("*")` carries it into a lawful-process record, which is the case that
  mattered). A per-media identity row on /admin/forensics is the follow-up.

## Handoff (replaces the chat report)

- Board commit `912880e4` (the whole lane, one commit); synced with `origin/launch-prep` at merge commit
  `7e504bb6` (it had moved six commits: `reshape-studio-export` plus the usher journal, none of it in my
  `reads`, no conflicts). No board: this lane is the route, the identity and the queries.
- **Gates on the synced tree**, each on its own exit code: `pnpm design:rules` 0 (no artifact churn) ·
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` 0 · `pnpm typecheck` 0 · `pnpm lint` 0
  (10 warnings, the 2026-09-21 baseline exactly; none in a file this lane touched) · `pnpm test` 0
  (321 files, 3370 passed / 1 skipped) · `pnpm build` 0 (255 static pages, and `ƒ /api/guests/name` in the
  route table) · `pnpm lab:smoke --base http://localhost:3131` 0 (417 checks, 0 failing). Logs in the
  lane's scratch as `s-*.log`. Port 3131 killed before each build, each test run and this handoff.
- **Lane check** `git diff --name-only origin/launch-prep...HEAD` = 36 files, every one under `owns`
  EXCEPT three, each listed with why:
  - `src/lib/errors/codes.ts` + `src/lib/errors/codes.test.ts` (no lane owns them this round): the error
    taxonomy is COMPILER-ENFORCED — `codes.test.ts` holds `IsSubtype` assertions per result union and per
    route, so a new code that is not in `ErrorCode` + `FALLBACK_MESSAGES` fails `pnpm typecheck`, not
    review. `email_required` is REPLACED by `verification_required` (its only two callers were mine) and
    `name_required` / `name_invalid` added, with their copy; the mirrors for the join, presign, complete
    and the new name route follow. There was no version of this lane that did not touch that file.
  - `docs/systems/guest-flow.md`: my brief's own exception line for the "Joining + identity" block, plus
    three lines elsewhere in the file (see System-doc edits above). The guest lane owns the file and should
    sync past this merge before its own edits.
- **The items, one line each** (no board, so these are the surfaces):
  - `POST /api/guests`: takes `{qr_token, display_name?}`, answers 422 `verification_required` |
    `name_required` | `name_invalid`, mints with the name, returns `{display_name, verified}` from the
    MINT (never echoed from the request, so a verified joiner who sent a name gets null + true back).
  - `POST /api/guests/name`: new, over `set_guest_display_name`, own limiter kind `rename`
    (breadth 15/60min, per-(IP, event) 60/15min — six times tighter than join and still venue-sized; the
    number is a tunable, reasoned in the file).
  - presign + complete: 403 `verification_required` read from `get_upload_context`, each with a
    `captureWarning("security", "upload_refused_unverified", {event_id, stage})` so a flip's fallout is
    visible (R1.14); `mapCheckViolation` splits the DB's "not accepting uploads without a verified email"
    back out ABOVE the `not accepting` branch it was deliberately worded to match on `main`.
  - `resolveUploaderIdentity`: the one precedence rule, host → `verified_at` → typed name → "A guest",
    with `isAnonymous` narrowed to that last case so the lab's fixtures still compile.
  - `GridMedia.isVerified` through both builders and the ETag (`g1` → `g2`, so a client cannot 304 past a
    mark appearing); `getEventGuestList(id, {includeUnverified})` + the union split in `social/cards.ts`;
    `getHostCard(eventId)` for the follow moment; `upload_forensics.guest_display_name` at capture;
    `require_verified_email` on `GuestEvent`, `resolveGalleryAccess`, `createEvent` (default true) and the
    seed script.
- **Verified LIVE against the real project on :3131** (disposable data, all removed; the throwaway event
  `38290e85` restored to `require_verified_email=false` / `allow_anonymous_uploads=true`):
  every 422 and 403 above by hand; a typed name cannot buy past the switch; an injected `email` on the join
  is stripped (the minted row's `email` was null); a posted `guest_id` and a foreign `qr_token` both rename
  only the caller's OWN row; a presigned URL that outlived a flip is refused at COMPLETE with no `media`
  and no `upload_forensics` row written; a real completed upload recorded `guest_display_name`, and a later
  rename did NOT rewrite it; the gallery poll returned `isVerified:false` with a name, no email anywhere in
  the payload, ETag `"g2-…"`, and a re-poll 304'd. The guest page loads clean at 1440 and 375.
- **Calls his to overrule on the alias**, one line each:
  - ★ The rename door refuses a VERIFIED guest with 403 `unauthorized` and the RPC's sentence ("Your name
    comes from your account.") rather than a fourth error code. The status is right; the word is generic.
  - ★ The `rename` limiter at 60 per (IP, event) per 15 minutes. Sized so thirty people on one venue WiFi
    fixing a typo are never blocked; tighten it if he would rather risk the party than the spammer.
  - ★ On a name-only event a CONFIRMED visitor is asked for NO name (their profile name is the identity,
    and `create_guest` nulls a typed one beside a confirmed account). A guest who wanted a different name
    for this party cannot have one.
  - The legacy label "A guest" for nameless pre-reshape rows (his, already flagged at the ruling).
  - The guest list lists unverified names ONE PER GUEST ROW, so two people who both typed "Sam" are two
    entries (his, already flagged); a nameless legacy row is listed by neither half.
  - `createEvent` now sends ONLY `require_verified_email`; `updateEvent` sends the new flag alone when it
    is present and falls back to the legacy twin, so the host lane's form works before AND after its rename.
- **The help articles this lane makes stale** (a `help-sync` lane rewrites them; `content/help/` belongs to
  `voice-wiring`): any article describing "Require guest accounts", anonymous uploads, or what a guest needs
  before uploading. The host lane's sweep for the word is the authority on the list; this lane changed the
  behaviour those articles describe, not the articles.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none**. Wave 0 wrote the schema; this lane
  codes against it and wrote no SQL.
- **Look at first**: `src/lib/media/uploader-identity.ts` (the one precedence rule, and the `verified_at`
  never `user_id` comment that every other file in this lane defers to), then
  `src/lib/db/mutations/guest.ts`'s `mapCheckViolation` (the branch ORDER is the whole behaviour of a
  switch flipped mid-party), then `src/app/api/guests/route.ts`.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-21). Wave 1's server half of the identity reshape: `POST
/api/guests` took the name a guest types at the door and answered 422 `verification_required` /
`name_required` / `name_invalid`, because the database deliberately still accepts a nameless mint and
profanity cannot be checked in SQL; `POST /api/guests/name` named or renamed a row over
`set_guest_display_name` behind its own `rename` limiter; presign and complete both re-read the gate from
`get_upload_context` and refused 403 with a warning, so a switch flipped mid-party stopped the next upload
visibly rather than silently. `resolveUploaderIdentity` became the one precedence rule keyed on
`guests.verified_at`, never a user id, with `isAnonymous` narrowed to a nameless pre-reshape row;
`isVerified` reached the guest and host tiles and the gallery ETag (`g1` → `g2`); `getEventGuestList` grew
an opt-in union that splits before hydration; `getHostCard` landed for the follow moment; the forensic row
began recording the typed name. Verified live on the project, every refusal by hand, with the test data
removed after.
