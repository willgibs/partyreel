---
track: door-steps
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "8d83ec75"          # the launch-prep SHA the branch was cut from
board: none            # production: the door as three steps and the upload gate's guest side; no board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/
  - src/lib/guest/
  - src/lib/events/gallery-access.ts
  - src/lib/events/gallery-access.test.ts
  - src/lib/events/gallery-access.server.ts
  - src/lib/events/gallery-fingerprint.ts
  - src/lib/events/gallery-fingerprint.test.ts
  - src/lib/db/queries/guest-events.ts
  - src/lib/db/queries/guest-gate.ts
  - src/app/(guest)/
  - src/app/api/guests/
  - src/app/api/export/guest/
  - src/app/api/reel/download/
  - src/app/api/r2/complete-upload/
  - src/lib/upload/server-pipeline.ts
  - src/lib/security/telemetry-redaction.ts
  - src/lib/security/telemetry-redaction.test.ts
  - src/lib/constants/legal-privacy.tsx
  - src/components/marketing/sections/features/qr/entry-flow.tsx
  - src/components/marketing/sections/features/album/entry-phone.tsx
  - src/components/marketing/sections/how-it-works/guest-pictures.tsx
  - src/lib/constants/how-it-works.ts
  - src/components/marketing/mock-parity.test.ts
  - content/help/how-guests-join-and-upload.mdx
  - content/help/browse-the-album.mdx
  - content/help/what-guests-can-and-cant-see.mdx
  - content/help/messages-guests-might-see.mdx
  - content/help/why-an-event-asks-for-your-email.mdx
  - content/help/require-verified-emails-explained.mdx
  - content/help/show-the-album-live-on-a-screen.mdx
  - content/help/save-an-event-and-find-your-uploads.mdx
  - content/help/turn-off-uploads-or-cap-file-size.mdx
  - docs/systems/guest-flow.md
  - docs/systems/database-security.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - supabase/migrations/20260922003000_require_upload_to_view.sql
  - src/lib/db/types.ts
  - src/components/ui/sheet.tsx
  - src/lib/upload/uploader.ts
  - src/app/api/r2/presign-upload/route.ts
  - src/lib/errors/codes.ts
  - src/app/(dev)/design/touchpoints.ts
  - docs/design/rulings.md
---

# lp/door-steps

**Goal.** The guest side of Will's door ruling (2026-09-21, verbatim in `docs/design/rulings.md` under \"the door as three steps: the name before the album, the first upload asked, Require an upload to view\"; read it first, every sentence binds): the door becomes one held sheet with no exit (the welcome, the password when there is one, the name, the email held until confirmed when the host requires verified emails, the first upload asked inside the sheet), then the album; the new switch's gate is enforced server-side through the decision with a reason and the cookie the join sets. Wave 0 landed the schema (`events.require_upload_to_view`, `get_event_by_qr_token` returning it, `get_upload_gate` service-role only), so code against real types. No board, no new ruling: the plan Will approved (its two fresh-context reviews folded in) is the brief below; read it end to end before the first edit, build every line of it, and list every call you took under \"his to overrule\".

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `8d83ec75`)

- What this is: Will's door ruling (2026-09-21, verbatim in `docs/design/rulings.md` "the door as three steps: the name before the album, the first upload asked, Require an upload to view"; read it first, every sentence of his binds). The guest door becomes ONE held sheet with NO exit that a guest passes through BEFORE the album: the welcome, then the password when the event has one, then "what should we call you", then (when the host requires verified emails) the email step held until the code confirms, then "add your photos" with the first upload asked actively inside the sheet, then the album. The nine-tile teaser sits blurred behind it the whole way. A host switch `events.require_upload_to_view` (wave 0 landed it: the column, `get_event_by_qr_token` returning it, `get_upload_gate(p_event_id, p_session_token, p_user_id)` service-role only) means, ON, the upload step has no skip until one upload of this guest's has completed (approved or held for review), the gate failing open while uploads are closed or the album is full; OFF, the album opens after the name or the confirmed email with a soft skip on the upload step. Everyone but the host is gated, verified guests included. The demo asks no name and offers the upload with "Look around" as its skip. No unique name is claimed at the door. The host lane (`upload-gate-host`) builds the switch itself; this lane never touches the settings UI.
- THE STEP MACHINE (`src/lib/guest/entry-steps.ts`): `computeEntry` becomes `computeDoor`, deriving the ordered itinerary `welcome → password → name → email → upload` from the server's decision `{level, gate, hasContributed}` (per render and per poll) plus the client's facts (welcome seen, a name, a contribution, "returning" snapshotted at hydration). Rules, in order: the owner gets no sheet; `!welcomeSeen` → welcome; `level === "none"` → password and stop; `!hasName` → name; `level === "teaser" && gate === "account"` → email; `uploadsOpen && !contributed && !skipped && (requireUpload || !returning)` → upload. `autoOpen` is true whenever a step exists (the account gate's "browse the teaser first" exemption is retired by "No exit"). Every step is held: no X, no handle, Escape and the backdrop inert (`dismissMode` is `held` whenever the sheet is open; only the album menu's "Change name" edit door stays free and dismissible). The Back chevron survives as today's transient view over the machine: password, name and email go back to the welcome; upload goes back to the name. `openToGate` (the teaser's "See all N") re-asserts the sheet at its current step. The server steps (password, email) land through the RSC drop as today; the client steps (name, upload) land through client flags. `useSuccessHold` plays the "You're in" beat ONLY on the step whose exit is the album (the itinerary's last step); every other step hands forward with no celebration, as the welcome does today. The cases: password-only `[welcome?, password]` then after the refresh `[name?, upload?]`; names mode `[welcome?, name, upload?]`; verified mode `[welcome?, name, email]` then after the confirmation's refresh `[upload?]`; both: the welcome, then the password, then the rest; the demo `[welcome (the role step), upload]`; a returning guest with a session, a name and (when required) a contribution `[]`; the mid-visit flip (a names-mode session on an event now requiring verified emails) `[email]`, held, then the verified re-join and the upload rule.
- THE NAME STEP (`guest-name-step.tsx`, on top of `identity-fixes`' rename-first submit): modes `join` (names mode: `renameGuest` first when a token is held, else `joinEvent` with the name; the stored name written; the machine advances), `edit` (unchanged), `hold` (verified mode before confirmation: the join would answer 422, so the step validates locally with `checkDisplayName`, keeps `typedName` in modal state, writes only `pr_guest_name_last`, never the per-event key, and advances to the email step) and `profile` (a confirmed account with no profile name: `updateDisplayNameAction`, replacing the inline `SetNameStep` panel in `event-experience.tsx`). After the code confirms, the modal's `handleEmailVerified` owns the sequence (`EnterEventPrompt.onVerified` becomes a plain callback and stops calling `router.refresh()` itself): claim anonymous uploads → `joinEvent` (a verified, nameless mint; the token stored) → one own-row read of `profiles.display_name` → when null and a `typedName` exists, `updateDisplayNameAction(typedName)` → `onUnlocked()` → `router.refresh()`; the hold masks it. A signed-in confirmed viewer with a profile name SKIPS the name step (a fact, not a question); one whose account name differs from a typed name is credited by the account's name, and one line at the email step says so: "If you have a Partyreel account, its name is the one that shows." A magic-link round trip that loses `typedName` recovers as the `profile` mode prefilled from the last name.
- THE UPLOAD STEP INSIDE THE SHELL: lift `useUploadQueue` from `GuestUpload` into `event-experience.tsx` (one queue for the door's step and the album's Add; `identity-fixes`' deferred-refresh wrapper around the queue moves with it). `intent-sheet.tsx` exports its body (`UploadIntentBody`: the two hidden inputs, the two rows, the terms line, the review swap) and the sheet wraps it; the door's `UploadStep` renders the same body inside `EntryShell`, so the inputs live inside the open dialog on both engines and the Safari-synchronous `.click()` stays. `failure-sheet.tsx` exports its list the same way for the in-step failure view (never a sheet over a sheet). Views: pick → review ("Send this one?" / "Send these N?") → sending (each pick with a progress strip; "Sending your photos") → the first completed item, approved or held for review, fires the hold, writes `pr_contributed_<qr>` and `router.refresh()`; the step drops, the sheet exits into the album with the arrival sweep; the rest of the run continues in the shared queue and the album's head draws the stack. `GuestUpload` keeps the album's intent sheet, the failure sheet, the hold-for-approval notice and the post-upload slot (the offer card and the follow moment with their props untouched: the `guest-capture` board draws on them). THE FAIL-OPEN IS SERVER-OWNED, never a local skip (a local `skipped` would loop: the server still answers teaser/upload and "See all N" re-asserts the sheet): when a run ends with no completed item and every refusal is one the guest cannot fix, the step shows the server's sentence and a primary "Continue without adding" that calls `router.refresh()` and trusts the decision that comes back. The refusal classes (`src/lib/errors/codes.ts`, the presign ladder): `uploads_closed`, `cap_reached`, `event_gone`, `unlock_required` → refresh; `invalid_session` → drop the session and return to the name step, never Retry inside a sheet with no exit; `verification_required` → the existing flip path (the email step); `too_large`, `invalid_file`, `bad_key`, `complete_failed` and code-less transport or R2 failures → the list stays with Retry and "Choose other photos"; `video_not_allowed` and `unsupported_type` → "Choose other photos" only. The failure view never carries the soft skip; the OFF-state skip on the pick view is a ghost "Skip for now", once per pass ("returning" skips the step when OFF). On an empty album the step's line reads "Nothing here yet. Add the first photo and the album opens." The demo: "Look around" as the skip, `simulateUpload` unchanged, no post-upload prompts.
- THE FLIP AND THE DRIFT: the refresh at the first completion is the flip (the cookie below is set by the completion route before it); `key={access}` remounts the gallery under the curtain and it rises as the sheet exits. The poll is not the flip: `LiveGallery` parses the poll's `access` and `gate` and calls a new `onAccessDrift` once per changed decision. A LOOSER drift (a contribution from another tab) refreshes at once. A STRICTER drift (the host turned the switch ON while this guest was inside) never yanks an open album out from under a thumb: the refresh waits for the guest's next act (their next Add, or the sheet's reopen). Two tabs at the upload step: the second drops its picks when the first completes and lands on the album at its next act. The teaser's tiles stay visible and blurred behind the sheet; the curtain holds only during the beat.
- THE SERVER'S DECISION (`src/lib/events/gallery-access.ts`): `GalleryGate = "password" | "account" | "upload"`, `resolveGalleryDecision(event, ctx) → { access, gate }` in the order owner → full; password and not unlocked → none/password; verified emails required and not confirmed → teaser/account; `require_upload_to_view && canContribute && !hasContributed` → teaser/upload; else full/null. The pure resolver's context REQUIRES `hasContributed` and `canContribute`; `resolveGalleryAccess` is RETIRED, not wrapped, so every caller is a type error until it learns the gate: the page, the poll, `/api/export/guest` (`src/app/api/export/guest/route.ts:82-91`, which would otherwise zip every original for a held guest) and `/api/reel/download` (`src/app/api/reel/download/route.ts:97-105`), and `getGuestReelContext`. One server entry, `resolveViewerDecision(event, {isOwner, isAuthed, isUnlocked, userId, sessionToken})` in `gallery-access.server.ts`, replaces the block duplicated in the page and the poll: resolve once assuming a contribution; only when that lands on full with the flag ON and uploads open, call `getUploadGate()` (new, `src/lib/db/queries/guest-gate.ts`, the admin client, FAILS OPEN on an error to `{contributed: false, albumFull: true}` with a captured warning) and resolve again. `canContribute = accepting_uploads && !albumFull`. The demo's short-circuit to full stays; the host is the owner. The empty album holds the gate (no count condition). `entry-steps.ts` maps `gate` to the step; the poll's JSON carries `access` and `gate`.
- THE COOKIE (`src/lib/guest/session-cookie.ts`, server-only): `pr_guest_<eventId>` carrying the raw session token (64 hex, read-guarded by `/^[0-9a-f]{64}$/`; unsigned, the database verifies it by its unique index), HttpOnly, Secure in production, SameSite=Lax, path `/`, 60 days; set only when absent or different by `POST /api/guests` on a mint, `POST /api/guests/name` on success, `POST /api/r2/complete-upload` on a created row (through `src/lib/upload/server-pipeline.ts`: `CreateRecordOutcome`'s ok branch gains an optional `setCookies` the engine applies to the success response), and the gallery poll when the body's token differs (the heal), on the 304 response too (a bare `new Response(null, {status: 304})` carries no cookie). The RSC reads the cookie only; the poll takes an optional `session_token` in the body (zod) and falls back to the cookie. The write routes (name, mine, remove, presign, complete) keep reading the token from the BODY only and never from the cookie, pinned by a source test, so the CSRF surface does not move. The immediate heal: when the RSC's gate is `upload` and the client holds a localStorage token, `EventExperience` POSTs the poll once BEFORE the arrival beat (no `If-None-Match`), holds the sheet's auto-open until the answer, and refreshes when the decision came back changed; the heal writes only a token that resolved to a row. A small `POST /api/guests/leave {qr_token}` expires the cookie for the event, called from the guest's sign-out and leave paths (`use-stored-session.ts`, `guest-header.tsx`), so a shared phone never renders the full album on the last contributor's ticket. The privacy page's cookie table (`src/lib/constants/legal-privacy.tsx`, "Two cookies, both essential") gains its row and the Privacy version moves to 1.4. The telemetry redaction's token shape widens from 32 to 64 hex (`src/lib/security/telemetry-redaction.ts`, its test) before any new token-handling path ships.
- THE ETAG (`gallery-fingerprint.ts`): the tuple becomes `[access, gate, teaserTotal, bucketId, items]`, version `g3`; `galleryEtagFor(decision, gallery)`. The route re-runs the decision before comparing validators, so a gate change never answers 304.
- COPY (plain, no em-dashes; his to overrule): the welcome's rows unchanged ("No app required." stays), the primary "Continue" alone, "View the album" and "Just browsing" deleted, the consent line stays; the demo's role step keeps its copy with "Continue" and the ghost "Start your own". Password unchanged. Name (join and hold): "What should we call you?" / "Your name goes on the photos you add, so {host} knows who to thank." / the field "Your name" / the hint "Just a name. Nobody has to prove a name." / "Continue"; profile mode: "Your name goes on the photos you add. It becomes your Partyreel name too."; edit unchanged. Email unchanged plus the account-name line above. Upload: "Add your photos" / OFF "Add one now and the album opens." / ON "{host} asked everyone to add a photo before the album opens." / the demo "Add a photo the way a guest would. Nothing you add is saved." / the rows and the terms line unchanged / the skips "Skip for now" and "Look around" / "Sending your photos" / "Continue without adding" / "You're in", "Welcome to the party", "Opening the album" unchanged.
- THE SURFACES THAT DRAW THE DOOR: `src/components/marketing/sections/features/qr/entry-flow.tsx` (step 01 "Continue", the ghost line dropped), `album/entry-phone.tsx` (the "Just browsing" row dropped, `ENTRY_SCREENS` stays three), `src/components/marketing/sections/how-it-works/guest-pictures.tsx` (the door picture draws the name and the upload), `src/lib/constants/how-it-works.ts` (the `door` body in place: "A welcome screen names the event and asks what to call you, then for a first photo, and the album opens. When the host asks guests to verify, a one-time code by email is the whole sign-in."; step 03 "Add your photos" gains its new job, keep adding, under the six-a-side contract, never a new step); `src/components/marketing/mock-parity.test.ts` retargeted in the same commit ("qr entry flow browse-in button" → "Continue"; "album entry phone browse-out" deleted). `DEMO_CTA_LABEL` and demo-door stay true (no sign-up). Help: `how-guests-join-and-upload.mdx` (the steps, "What should we call you?"), `why-an-event-asks-for-your-email.mdx` (the "Just browsing" paragraph goes; the name comes before the email), `browse-the-album.mdx` and `what-guests-can-and-cant-see.mdx` (the preview sits behind the door), `messages-guests-might-see.mdx` ("Continue without adding"), `require-verified-emails-explained.mdx` (no browsing the preview without confirming), `show-the-album-live-on-a-screen.mdx` (a venue screen signs in as the host; with the switch ON a signed-out screen would be held), `save-an-event-and-find-your-uploads.mdx` (the offer card appears at the album's opening; its quoted `Keep these photos` heading is one word stale since `identity-fixes`, whose card reads "Keep this photo" for one: quote what the card constantly says, never a heading that varies by count), `turn-off-uploads-or-cap-file-size.mdx` (the fail-open). `help-ui-labels.test.ts` pins every quoted label to a shipped string.
- DOCS: `docs/systems/guest-flow.md` "The ARRIVAL" and "Joining + identity" rewritten to the itinerary (the flip paragraph included); `docs/systems/database-security.md` gains the cookie beside the unlock cookie and `get_upload_gate` in the service-role list.
- NOTHING RENAMED ON DISK: the lab's registries key on the paths of `entry-modal.tsx`, `entry-shell.tsx`, `guest-name-step.tsx`, `guest-upload.tsx`, `intent-sheet.tsx`, `review-step.tsx`, `failure-sheet.tsx` and `enter-event-prompt.tsx` (`src/app/(dev)/design/touchpoints.ts`, `rules/component-notes.ts`); props may change, files may not move. A lane never breaks the props of a module the lab imports (`GuestMasonry`, `ReportDialog`, the offer card, the follow moment).
- Owns: `src/components/guest/`, `src/lib/guest/`, `src/lib/events/gallery-access.ts`, `src/lib/events/gallery-access.test.ts`, `src/lib/events/gallery-access.server.ts`, `src/lib/events/gallery-fingerprint.ts`, `src/lib/events/gallery-fingerprint.test.ts`, `src/lib/db/queries/guest-events.ts`, `src/lib/db/queries/guest-gate.ts`, `src/app/(guest)/`, `src/app/api/guests/`, `src/app/api/export/guest/`, `src/app/api/reel/download/`, `src/app/api/r2/complete-upload/`, `src/lib/upload/server-pipeline.ts`, `src/lib/security/telemetry-redaction.ts`, `src/lib/security/telemetry-redaction.test.ts`, `src/lib/constants/legal-privacy.tsx`, `src/components/marketing/sections/features/qr/entry-flow.tsx`, `src/components/marketing/sections/features/album/entry-phone.tsx`, `src/components/marketing/sections/how-it-works/guest-pictures.tsx`, `src/lib/constants/how-it-works.ts`, `src/components/marketing/mock-parity.test.ts`, `content/help/how-guests-join-and-upload.mdx`, `content/help/browse-the-album.mdx`, `content/help/what-guests-can-and-cant-see.mdx`, `content/help/messages-guests-might-see.mdx`, `content/help/why-an-event-asks-for-your-email.mdx`, `content/help/require-verified-emails-explained.mdx`, `content/help/show-the-album-live-on-a-screen.mdx`, `content/help/save-an-event-and-find-your-uploads.mdx`, `content/help/turn-off-uploads-or-cap-file-size.mdx`, `docs/systems/guest-flow.md`, `docs/systems/database-security.md`. Reads, never edits: `supabase/migrations/20260922003000_require_upload_to_view.sql`, `src/lib/db/types.ts`, `src/components/ui/sheet.tsx`, `src/lib/upload/uploader.ts`, `src/app/api/r2/presign-upload/route.ts`, `src/lib/errors/codes.ts`, `src/app/(dev)/design/touchpoints.ts`, `docs/design/rulings.md`.
- Tests: `entry-steps.test.ts` rewritten against `computeDoor` (every permutation; `autoOpen` true whenever steps exist; "returning" skipping the OFF upload; ON never skipping; the flip case `[email]`; the demo `[welcome, upload]`); `entry-modal.test.tsx` (the affordance table becomes "held everywhere, no X, no Just browsing, Escape inert"; the demo's role step → the upload step → "Look around" closes; the hold pins kept; the name block: the step arrives on its own, the hold mode POSTs nothing, the verified sequence calls the join then the name action); `guest-upload.test.tsx` mounting with a queue prop (the queue pins move to a new `use-upload-queue.test.tsx`); a new `upload-step.test.tsx` (the inputs inside the entry sheet, Send enqueues, the first done releases, the fail-open shows "Continue without adding", ON hides "Skip for now"); `gallery-access.test.ts` (the flag ON gates a name-only viewer, contributed or closed or full → full, account before upload, the flag OFF ignores the context); a fingerprint test for `gate` and `g3`; a gallery route test (the body token, the cookie heal, the 304 with the cookie); `api/guests/route.test.ts` (Set-Cookie on a mint); the body-only source test for the write routes; the redaction test at 64 hex; `mock-parity.test.ts`, `help-ui-labels.test.ts`, `lab:smoke` whole; the gate with every exit code. Its own red-team on :3132 before handoff: every case of the itinerary at 375 and 1440 with reduced motion; the fail-open by forcing `accepting_uploads` off and `storage_cap_bytes` to one on a disposable event; the ETag never 304ing across a gate change and the export and reel routes refusing a non-contributor (curl). The alias red-team after the merge is the Orchestrator's.
- His to overrule: a contribution punched once (hidden or removed later still counts); a stricter drift waiting for the next act; the cookie carrying the capability; the empty album holding the gate; the Back chevron on every step after the first; "Skip for now"; "Continue without adding"; the ON line naming the host; the name before the email in verified mode with the account's name winning; the venue-screen article telling hosts to sign in on the screen.

## The verdict map (every answer of the batch; this lane wires only its own board's)

(no verdict map: Will's three points, his addition and his three answers, verbatim in docs/design/rulings.md under "the door as three steps"; the brief above is the whole ruling as the approved plan carried it)

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

- none. Every open point was a call in the brief's own "his to overrule" list, taken and listed below.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/guest-flow.md` "Gallery access" rewritten to the DECISION (`resolveGalleryDecision` → `{access, gate}`,
  `resolveViewerDecision` as the one server entry with its two-pass read, the upload gate's fail-open, and the
  `pr_guest_<eventId>` cookie's whole contract including which four doors write it).
- `docs/systems/guest-flow.md` "The ARRIVAL" retitled and rewritten to the itinerary (the seven cases, a server gate
  being terminal for the steps behind it, the one-row affordance table, the upload step inside the sheet, the flip,
  the drift and the heal).
- `docs/systems/guest-flow.md` "Joining + identity" gains the name-before-the-album paragraph (four modes) and the
  confirmation sequence's four writes in order.
- `docs/systems/database-security.md` the `guests` table invariant gains the cookie beside the unlock cookie, with
  its attributes, its four writers, its one expiry and the body-only rule for the write routes. (`get_upload_gate`
  was already in the service-role list from wave 0; nothing to add there.)

## Deferred (ROADMAP one-liners, bucket named)

- Now: the queue pins live in `guest-upload.test.tsx` through a harness that owns `useUploadQueue` exactly as the
  page shell does, rather than in a separate `use-upload-queue.test.tsx`. Splitting them would test the hook alone
  where production now composes hook and component; a follow-up may split it if the file grows.
- Now: `content/help/how-guests-join-and-upload.mdx` still describes two surfaces `guest-upload-wiring` retired
  before this lane (a dimmed "Tap to retry" tile and a "Sent, waiting for host approval" toast). Outside this
  round's reach; `help-sync` should take them with the rest.

## Handoff (replaces the chat report)

- Pushed on `lp/door-steps`; synced with `launch-prep` at `63556332` (it had moved by nine commits, the host lane's
  own switch among them; merged, never rebased). The three build commits are `c040b52b` (the server core, the step
  machine, the two exported sheet bodies), `c83d8c86` (the heal, the drift, the leave path, every pin) and
  `77edc301` (the marketing surfaces, nine help articles, the two system docs).
- Every claim below names its artifact.
- Gates on the synced tree, each on its own exit code: design:rules ok, specimens ok, typecheck ok, lint ok
  (0 errors, 10 known warnings), test ok (3485 passed, 2 skipped), build ok (257 pages); `pnpm lab:smoke --base
  http://localhost:3132` ok (420 checks, 0 failing). No board, so no `lab:demo`.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = 62 files, all under `owns` except five, each a
  minimum edit in another lane's file: `src/app/(dev)/design/rules/component-notes.ts` (ONE `for` line for the new
  `upload-step.tsx`, which is the round's own rule for a new component); `docs/design/library.md` and
  `src/app/(dev)/design/rules/rules.generated.json` (generated by `pnpm design:rules`, which the gate requires, and
  the diff is only that component); `src/lib/constants/legal.ts` (the Privacy version 1.3 → 1.4 and its changelog
  comment, which the brief asks for and which cannot live in `legal-privacy.tsx`); `src/lib/type-ladder-policy.test.ts`
  (two `depicted` COUNTS, for two marketing files this lane owns: guest-pictures 18 → 22, entry-phone 6 → 5).
- The items, one line each:
  - `the decision`: `resolveGalleryAccess` RETIRED, `resolveGalleryDecision(event, ctx) → {access, gate}` in its place
    with `hasContributed` and `canContribute` required, so the page, the poll, `/api/export/guest` and
    `/api/reel/download` were each a type error until they learned the gate. Verified live: on an ON event an
    anonymous viewer's poll answers `teaser`/`upload` with 9 of 54, the guest export summary answers 9 photos where
    it would have zipped 54 originals before this change, and the reel download answers 403.
  - `the one server entry`: `resolveViewerDecision` resolves twice, the first pass assuming a contribution, so a
    locked event and an unconfirmed viewer cost no `get_upload_gate` read at all.
  - `the gate read`: `lib/db/queries/guest-gate.ts` on the admin client, failing open to `{contributed:false,
    albumFull:true}` with a captured warning. Verified live both ways: uploads closed → full/null with 54 items;
    `storage_cap_bytes` set to 1 → full/null with 54 items (both restored after).
  - `no identity is an answer, not an error`: the early fail-open on "neither a session nor an account" was removed
    before it shipped. It would have opened the album for every first-time visitor, i.e. the gate would never have
    applied at all.
  - `the cookie`: `pr_guest_<eventId>`, the raw 64-hex token, HttpOnly, Secure in production, SameSite=Lax, path `/`,
    60 days, shape-guarded, unsigned (the unique index verifies it). Written by the mint, the rename, a created media
    row (through `CreateRecordOutcome.setCookies`, applied to the 200 alone) and the poll's heal, on its 304 too.
    Pinned in `route.test.ts` and `gallery/route.test.ts`; the body-only rule for the five write routes is pinned by
    a source test in `session-cookie.test.ts`.
  - `the leave path`: `POST /api/guests/leave` + `leaveGuestSession`, called by the guest sign-out. Verified live: after
    it, the same browser's poll drops from full/54 back to teaser/upload/9 and the door returns.
  - `the ETag`: the gate joined the tuple at `g3`. Verified live: the same decision re-polled with its own validator
    answers 304; the same validator across a gate change answers 200.
  - `the itinerary`: `computeDoor` replaces `computeEntry`, 18 pins over every permutation. A server gate is TERMINAL
    for the steps behind it (the resolver has no opinion past an unmet gate), and `skipped`/`returning` are ignored
    outright when the switch is ON, so a stale flag cannot open an album.
  - `no exit`: every step held, the affordance table down to one row, "Just browsing" and "View the album" gone from
    the app and from both marketing mocks. Verified on :3132 at 1440 and 375: no Close in the dialog, Escape inert,
    the vaul handle absent.
  - `the name step`: four modes. Verified live at both widths: the step arrives on its own, the hold mode POSTs
    nothing and writes only `pr_guest_name_last`, the account-name line shows at the email step, and the
    confirmation's four writes are pinned in order.
  - `the upload step in the sheet`: both file inputs inside the open dialog (verified in the DOM at both widths), the
    queue lifted to the page shell, the OFF ghost skip present and the ON state offering none, the host named in the
    ON line, "Nothing here yet..." on an empty album, "Look around" as the demo's skip. The demo asks no name.
  - `the fail-open in the step`: `classifyRun` over the refusal ladder; a run of unfixable refusals shows the server's
    own sentence and "Continue without adding" (a refresh), never a local skip, and the failure view never carries the
    soft skip. Seen for real on :3132: the local R2 PUT fails (localhost is not allow-listed), and the step correctly
    classified it `retry` and showed "1 file did not go" with Try again and "Choose other photos" in place.
  - `the flip, the heal and the drift`: verified live end to end apart from the R2 PUT. A punched ticket + the cookie
    the rename wrote → the door gone, the album whole, the name chip right. A browser holding ONLY the localStorage
    token, cookie expired (every session minted before this round) → the one-poll heal lands it on the full album with
    no door flash, because the sheet's auto-open waits on it.
  - `the exit flash` (the Orchestrator's note from the alias at `8d83ec75`): fixed rather than deferred. The failure
    sheet's content latches while open and the latch is what the ~200 ms exit renders, so "0 files did not go" can no
    longer show on the way out.
  - `the redaction`: the token shape widened from 32 to 32-64 hex. `\b[0-9a-f]{32}\b` never matched a session token
    at all (no word boundary at character 33 of a 64-hex run), so the LONGER capability was the one leaking through
    every Sentry hook. Corrected before any of this lane's new token paths shipped, and pinned.
- Calls his to overrule on the alias, one line each:
  - A contribution is punched once: hidden or removed later still counts (the RPC's own rule, carried).
  - A STRICTER drift waits for the guest's next act; a looser one refreshes at once.
  - The cookie carries the capability itself rather than a signed derivative (the database is the verifier).
  - The empty album holds the gate, with "Nothing here yet. Add the first photo and the album opens."
  - The Back chevron on every step after the first; the upload step goes back to the name, the rest to the welcome.
  - "Skip for now" (OFF, once per pass) and "Continue without adding" (the server-owned fail-open).
  - The ON line names the host: "{host} asked everyone to add a photo before the album opens."
  - The name before the email in verified mode, with the account's own name winning and one line saying so.
  - The venue-screen article now tells hosts to sign in ON the screen (a signed-out screen would be held all night).
  - The demo's role step keeps "Continue"; "Look around" moved one step on, to its upload step's skip.
  - The name step's VISIBLE label is the question ("What should we call you?"), with the field's own label sr-only
    as "Your name": the two were the same eight words once the title became the question.
  - `mock-parity`'s browse-out pair was DELETED rather than retargeted (the string is gone from both files; a pin
    retargeted to a string that never disagreed guards nothing), and the browse-in pair now pins "Continue".
- The help articles this lane makes stale, one line each (a `help-sync` lane rewrites them):
  - `content/help/how-guests-join-and-upload.mdx` still describes two retired surfaces from BEFORE this lane (the
    dimmed "Tap to retry" tile and the "Sent, waiting for host approval" toast). Left alone deliberately: not this
    round's reach, and both are `guest-upload-wiring`'s.
  - `content/help/add-your-own-photos.mdx` (not owned) still says a panel opens where you drop files or browse for
    them, which is neither the intent sheet nor the door.
  - `content/help/a-photo-is-missing-from-the-album.mdx` (not owned) explains "You're seeing the preview" with only
    the email cause; there are two now.
  - `content/help/day-of-checklist-for-hosts.mdx` (not owned) tells a host to open the link in a private window to see
    what a guest sees, which is right, but does not mention that the door now asks a name first.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. Wave 0's migration is the whole schema this
  lane needed; `get_advisors` (security) after the pass is the accepted set unchanged (5 anon, 31 authenticated, 14
  rls_enabled_no_policy), and `get_upload_gate` is in neither client list.
- Look at first: the door at 375 on a real phone, end to end on an event with Require an upload to view ON, because
  the one thing localhost cannot do is the R2 PUT and therefore the first completion's own beat: the sweep into the
  album, the offer card arriving at the album's opening rather than after an Add, and whether the held sheet at a
  venue reads as a welcome or as a wall. Then the same door on the OFF state, where the ghost "Skip for now" is the
  whole difference. Then the verified-emails path's held name: type a name, confirm the code, and check the
  photograph you add is credited to the account's name and not the typed one.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-21). The guest door became one held sheet with no exit on Will's
ruling: the welcome, the password, the name, the email held until confirmed, the first upload asked, then the album,
derived by `computeDoor` from a server DECISION (`{access, gate}`) plus the browser's own facts. Require an upload to
view is enforced server-side through `resolveViewerDecision` and the service-role `get_upload_gate`, failing open
whenever a contribution is impossible, and the server learned WHICH guest is asking through a new HttpOnly
`pr_guest_<eventId>` cookie that four doors write, one route expires and no write route reads. `resolveGalleryAccess`
was retired rather than wrapped, which is what forced the guest export and the reel download to learn the gate; the
ETag carries it at `g3`. The upload queue lifted to the page shell so a run started at the door outlives it, the
intent sheet's body and the failure sheet's list are exported so the step lives inside the entry sheet, and the
telemetry redaction was corrected from 32 to 32-64 hex, having never matched a session token at all.
