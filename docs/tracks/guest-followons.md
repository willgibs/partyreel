---
track: guest-followons
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "6d27b17a"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/
  - src/app/(guest)/
  - src/lib/guest/
  - src/app/api/guests/
  - src/lib/events/
  - src/lib/validation/event.ts
  - src/lib/validation/event.test.ts
  - src/lib/db/mutations/events.ts
  - src/lib/db/mutations/events.test.ts
  - src/lib/db/mutations/guest.ts
  - src/lib/db/mutations/guest.test.ts
  - src/lib/db/queries/guest-events.ts
  - src/lib/db/queries/guest-events-admin.ts
  - src/lib/db/queries/guest-events-admin.test.ts
  - src/lib/media/uploader-identity.ts
  - src/lib/media/uploader-identity.test.ts
  - src/lib/event/gallery-items.ts
  - src/lib/event/gallery-items.test.ts
  - src/lib/r2/grid-items.ts
  - src/lib/r2/grid-items.test.ts
  - src/lib/r2/grid-items.email-safety.test.ts
  - src/components/shared/media-lightbox.tsx
  - src/components/shared/media-lightbox.test.tsx
  - src/components/app/media-grid.tsx
  - src/components/app/event-settings-form.tsx
  - src/components/app/event-settings-form.test.tsx
  - src/components/app/event-feed/gallery-actions.tsx
  - src/components/app/event-feed/event-feed.tsx
  - src/components/app/event-feed/event-feed-action-bar.tsx
  - src/app/(app)/dashboard/actions.ts
  - src/app/(app)/dashboard/actions.test.ts
  - src/components/likes/likes-provider.tsx
  - src/components/likes/likes-provider.test.tsx
  - src/components/auth/google-icon.tsx
  - src/components/marketing/sections/how-it-works/guest-pictures.tsx
  - src/lib/constants/tiers.ts
  - src/lib/constants/tiers.test.ts
  - src/lib/db/migration-guards.test.ts
  - src/lib/social/public-profile-visibility.test.ts
  - src/lib/moderation/escalation-guards.test.ts
  - src/lib/reel/build-reel-props.test.ts
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
  - src/app/(dev)/design/sandbox/host-curation/fixtures.ts
  - src/app/(dev)/design/sandbox/host-storage/fixtures.ts
  - src/app/(dev)/design/sandbox/media-viewer/fixtures.ts
  - src/app/(dev)/design/sandbox/reel-cut/fixtures.ts
  - src/app/(dev)/design/sandbox/reel-host/fixtures.ts
  - scripts/seed-demo-event.mjs
  - supabase/migrations/20260923150000_identity_contract.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/PROGRAM.md
  - docs/systems/guest-flow.md
  - docs/systems/database-security.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/testing-verification.md
  - src/lib/db/types.ts
  - src/lib/db/queries/social.ts
  - src/lib/lifecycle/recently-deleted.ts
  - supabase/migrations/20260921150000_identity_require_verified_email.sql
  - supabase/migrations/20260922003000_require_upload_to_view.sql
  - supabase/migrations/20260922200000_identity_sql_gaps.sql
  - supabase/migrations/20260923120000_guest_by_upload.sql
---

# lp/guest-followons

**Goal.** The rulings round's guest-side loose ends, in order: first a live defect (a one-field event save, such as a QR style or the review switch, resets every other event setting to its default: a password or private album opens, paused uploads reopen, held uploads are approved), then the identity round's contract (the code that still names `allow_anonymous_uploads` and `isAnonymous`, and one SQL file merged UNAPPLIED), then the round's guest ROADMAP lines and the demo's named guests. Production code, verified locally; the Orchestrator red-teams it on the alias and ships it in milestone 27.

## The brief

**Will's words (2026-09-23), verbatim.** "please complete any pending items related to this round from the roadmap, then let's get main current." The Orchestrator ships milestone 27 (partyreel.com) after this lane merges and the alias is red-teamed, so everything here reaches production within hours. Before launch there are no real users (`docs/PROGRAM.md`, "Before launch"): no compatibility work for test data.

**The context.** The rulings round is merged and red-teamed: save is gone; a person is a guest of an event only through an upload of theirs; a guest's own deletes close a require-upload album again, a host's removal never does. This lane carries that round's guest-side ROADMAP lines, the identity round's contract, and a live defect the Orchestrator's maps found. Work in this order and commit each part on its own, the defect first.

### 1. The partial-save defect (its own commit, first)

zod 4.4.3's `.partial()` keeps each `.default()`: `updateEventSchema = createEventSchema.partial()` (`src/lib/validation/event.ts:82`) fills every defaulted key on a partial input (verified: `{qr_style: "x"}` parses to `{visibility: "open", moderation_mode: "live", qr_style: "x", ...}`), and `updateEvent` (`src/lib/db/mutations/events.ts`) patches every key that is defined. So the QR designer (`qr-designer-dialog.tsx:58`, `{qr_style}`) and the review room (`review-room.tsx:37`, `{moderation_mode}`) also write `visibility: "open"` (a password or private album opens to anyone with the link), `accepting_uploads: true` (paused uploads reopen), both door switches at their defaults, and `moderation_mode: "live"`, which makes `updateEventAction` (`src/app/(app)/dashboard/actions.ts:105-125`) approve every held upload. The settings form (`event-settings-form.tsx:75-85`) omits `qr_style`, so every settings save also resets a custom QR to classic.
- The fix: a base object schema with NO defaults; `createEventSchema` adds the defaults a create needs (so a create with only a name still lands the column defaults); `updateEventSchema` is the base's `.partial()`, so an update carries exactly the keys sent. Keep the exported type names; fix any consumer the types move (the settings form's resolver).
- Contract tests (function, never look): `updateEventSchema.parse({})` is `{}`; `{qr_style}` parses to `{qr_style}` alone and `updateEvent` patches exactly one column; a `{qr_style}` save on a review event approves nothing (an `updateEventAction` test with the mutations mocked); a settings save keeps a custom QR; `createEventSchema.parse({name})` still carries every default.
- `event-feed.tsx` and `event-feed-action-bar.tsx` (`src/components/app/event-feed/`) have no importer and one of them is a partial caller: delete both (a ROADMAP line: "Host: `event-feed/event-feed.tsx` and `event-feed/event-feed-action-bar.tsx` have no importer; delete them").

### 2. The identity contract: the code, and one SQL file merged UNAPPLIED

The ROADMAP line: "The identity round's contract migration ...: drop the sync trigger and `events.allow_anonymous_uploads`, recreate `get_event_by_qr_token` without the old column (keeping `require_upload_to_view`), add `create_guest`'s 'Add your name to upload.' raise, retire `isAnonymous` and the seed script's old flag, and delete `get_public_profile`'s QA #36 clause (the confirmed-viewer gate beside it implies it), moving `public-profile-visibility.test.ts`'s pin to the gate." HEAD reads `allow_anonymous_uploads` only through dead paths; `main` (partyreel.com) still writes and reads it, which is why the Orchestrator applies your file only after milestone 27 has shipped this tree.
- **Code.** `allow_anonymous_uploads` leaves `validation/event.ts` and its test, `mutations/events.ts`'s fallback write, `queries/guest-events.ts`'s mapping, `sandbox/gallery-fixtures.ts`, `scripts/seed-demo-event.mjs`'s flag and the comments that name it (`e/[token]/page.tsx`, `enter-event-prompt.tsx`, `lib/events/share-urls.ts`, `constants/tiers.ts`, `tiers.test.ts`). `isAnonymous` and its "A guest" legacy label leave `lib/media/uploader-identity.ts`, `components/app/media-grid.tsx`, `components/shared/media-lightbox.tsx`, `lib/event/gallery-items.ts`, `lib/r2/grid-items.ts`, `lib/events/gallery-access.server.ts`, `lib/events/gallery-fingerprint.ts` (bump its version, the tuple changes), `lib/db/queries/guest-events-admin.ts`, their tests (`uploader-identity.test.ts`, `gallery-fingerprint.test.ts`, `media-lightbox.test.tsx`, `grid-items.email-safety.test.ts`, `build-reel-props.test.ts`) and the five board fixtures (`sandbox/{host-curation,host-storage,media-viewer,reel-cut,reel-host}/fixtures.ts`). A nameless legacy row still resolves to something honest (never "A guest" invented as a person).
- **SQL**, one file `supabase/migrations/20260923150000_identity_contract.sql`: drop the trigger `events_sync_verified_email_flags` and its function `sync_event_verified_email_flags()`; drop `events.allow_anonymous_uploads`; recreate `get_event_by_qr_token` without it (drop-and-create if the return shape needs it; the redaction logic, `require_verified_email` and `require_upload_to_view` kept; grants to `anon` and `authenticated` restated); `create_guest` raises "Add your name to upload." on a nameless mint by an unconfirmed caller (after the name normalisation, before the insert; `mutations/guest.ts` maps it ahead of the `verification_required` fallback, whose substring match catches any unknown check violation); `get_public_profile` without the QA #36 clause (its confirmed-viewer gate implies it; keep `create or replace`, `public-profile-visibility.test.ts` finds only that form; restate its grants). No CASCADE anywhere. The header names the apply order (after milestone 27), what the older build would lose, and the expected advisor delta (none). A rolled-back check at the foot, ending in a deliberate raise: the column and the trigger are gone; a nameless unconfirmed mint raises the new words; a named one and a confirmed one still mint; `get_event_by_qr_token` returns no `allow_anonymous_uploads` key and keeps the others; `get_public_profile` still hides a require-upload album's line from a stranger and shows an open one; the grants. Pre-flight it on a throwaway local cluster (database-security.md, Workflow) if you can; lanes never call `apply_migration`.
- **Pins.** Every `migration-guards.test.ts` pin or comment that cites a deployed build is judged (:271-297, :329-335, :345, :427-437, :454, :476, :840, :928, :952): what only `main`'s old build needed is dropped by your file and its pin becomes "dropped and never recreated" (the :1057-1079 pattern; `latestDefinition` finds only `create` statements, so a dropped object's old pin would stay green while false); what HEAD relies on keeps its assertion with a comment that cites no deployed build. `public-profile-visibility.test.ts`'s QA #36 pin (:96-101) moves to the gate and its twin-keeper pin (:148-163) inverts; `src/lib/moderation/escalation-guards.test.ts:212-221` pins the clause to an old file, so reshape it to assert nothing false.

### 3. The round's guest lines (each ROADMAP line quoted in your Handoff with its fix)

- "Copy: the guest's delete confirm says 'permanently deleted after a short grace period' (`media-lightbox.tsx`) where Deleted keeps an upload for `RECENTLY_DELETED_WINDOW_DAYS`; say the window." The guest's own delete (never restorable, `removed_by_uploader`) says it is permanently deleted after the window's days; the host's Remove confirm (`media-lightbox.tsx:957-961`) and bulk Delete (`event-feed/gallery-actions.tsx:86`) say it moves to Deleted for that many days. Read the constant (`src/lib/lifecycle/recently-deleted.ts`), never a literal 30.
- "Guest: after deleting one of this visit's uploads, the post-upload handle card still counts it ... count the live uploads, not the visit's queue." The same number feeds the offer card (`save-account-prompt.tsx`). Pass the removed id up through `onOwnRemoved` (`live-gallery.tsx`), keep the removed ids in `event-experience.tsx`, count finished queue items whose `mediaId` is not among them (`guest-upload.tsx:166`), and unmount the slot at zero. A signed-in guest's own-id set (`canDeleteIds`) never learns this visit's adds or deletes today (`live-gallery.tsx:598` handles only anonymous guests; `removeMyUploadGuestAction` does not revalidate), so teach it both, which also keeps the last-removal warning true.
- "Copy: the door's upload step on an event without Require an upload to view says 'Add one now and the album opens.' though that album is already open; the line belongs to the require-upload door alone." `upload-step.tsx`'s `uploadStepReason`: "the album opens" only when the event requires an upload; the OFF door, the empty-album line (`:290-291`) and the failure line (`:193`) get their own honest words; `upload-step.test.tsx` pins follow; the how-it-works mock (`marketing/sections/how-it-works/guest-pictures.tsx:175`) follows if it shows an OFF event.
- "Guest: on a require-upload event whose album is FULL, the last-removal confirm says the album closes, but the gate fails open on a full album ... say it only when the gate's `album_full` is false." `resolveViewerDecision` also returns `albumFull` (false when the gate was not read); `page.tsx` passes it to `EventExperience`, which turns the consequence flag off when it is true (`event-experience.tsx:406-410`). Optionally carry it on the poll and in the ETag tuple.
- "Guest: the album's header holds `stats.guestCount` from the render, so a guest's own first upload under-counts the guests by one until a reload ... a small server signal on the gallery poll fixes it, never a client heuristic." The gallery poll (`src/app/api/guests/gallery/route.ts`) returns `guestCount` after its 304 check (so the steady poll stays cheap) and never when the page is locked; `LiveGallery` reports it up; the header reads it.
- "Code hygiene: `e/[token]/page.tsx`'s `socialSeam` cast ... and its unused `requireVerifiedEmail`", and "two identity seams read the server's names through narrow casts ... collapse them onto the merged types": import `getEventGuestList`, `getHostCard`, `getMyFollowing` and `splitGuestList` by name (the host's Guests page, `dashboard/[eventId]/guests/page.tsx:47-57`, does it cleanly), drop the local `HostCard` type and its guard, delete the unused block, and read `item.isVerified` in the lightbox without a cast (its test too).
- `getUploaderIdentities` (`guest-events-admin.ts:182-223`) is unpaged, so an album past 1,000 items loses identities in the host's gallery: page it (keyset, like `storage.ts` did).
- "The lab: `sandbox/gallery-fixtures.ts` ... still mints a nameless `isAnonymous` uploader and puts the host's own uploads in `REVIEW_ITEMS`, neither of which the product can do now." Fix both halves; `lab:demo` on `host-curation`, `reel-front`, `reel-cut`, `reel-host` and `reel-screen` (the boards that read it) stays green and truthful.
- "Code hygiene: comments that still name save": `likes-provider.tsx` (:26, :31, :160, :258, :299), `queries/guest-events.ts:19`, `components/auth/google-icon.tsx:2`. (The voice-guest board's save comments are `lab-scene-kit`'s.) Leave Will's own quoted words, the dropped-object pins and the help keyword alone.
- `docs/systems/guest-flow.md` says the defenses include "a host's ability to rotate", and nothing rotates the link: state the current fact.

### 4. The demo's guests

"Guest, the demo: every demo upload is the host's and the host never counts, so its header reads '9 photos & videos' with no guests clause; seed a few guest uploads (real uploads, `seed-demo-event.mjs`) to bring back 'from N guests'." Add a guest mode to `scripts/seed-demo-event.mjs` that attributes some of the folder's files to named guests (a flag or a mapping, no new media files): once per name, `create_guest` with the demo's QR token and the name (a name-only row; the RPC returns its session token), then the SAME pipeline with each row written by `create_media` under that token (both are service-role, which the script already holds). The demo event stays name-only (Require verified emails off) and live (no review), so the rows land approved; a re-run replaces the album as today and reuses each name's row (no duplicate rows, no uploads piling up). Document the command in the script's header and `docs/systems/testing-verification.md`'s reseeding line. You do not run it against the shared database: the Orchestrator runs it once after your merge (the demo is shared by partyreel.com and the alias).

### Boundaries

- **Other lanes run now; never edit their files.** `host-followons` owns `src/app/(app)/dashboard/[eventId]/guests/`, `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/welcome/`, `src/app/(app)/actions.ts`, `src/components/app/welcome-flow.tsx`, `src/lib/welcome.ts`, `src/components/social/guest-list.tsx`, `src/lib/db/queries/{social,storage,accounts,guest-addresses}.ts`, `src/app/api/stripe/webhook/`, `src/lib/stripe/provision.ts`, and `docs/systems/guest-flow.md` lines 400-405 (the confirmed-address invariant): import their exports exactly as they are today (`getEventGuestList`, `getHostCard`, `getMyFollowing`, `getEventGuests`, `needsDisplayName`, `HostStorageSummary`). `lab-scene-kit` owns `src/components/lab/` and the boards' `scene.tsx` files. `event-safety` owns its new board folder.
- The exported shapes `host-followons` and unowned tests import from your files stay as they are unless the retirement above removes a field nobody else reads.
- No `apply_migration`, no Vercel, Stripe or Supabase config: the Orchestrator's.
- Say in your Handoff which ROADMAP Now lines your work closes (quote each), and anything you found and did not fix as a Deferred line.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`, and `pnpm lab:demo --board <id>` on `host-curation`, `host-storage`, `media-viewer`, `reel-cut`, `reel-host`, `reel-front` and `reel-screen` (their fixtures change). Local at 1440 and 375: the door's upload step on an event with and without Require an upload to view, the album's header count, the lightbox's delete confirms (guest and host), the settings sheet saving with a custom QR. The SQL file's rolled-back check run inside `begin; ... rollback;` through the Supabase MCP `execute_sql` if you can (database-security.md, Workflow: an unapplied migration proved on the live schema), never `apply_migration`.

## Questions (a recommended answer each; the Orchestrator relays them)

- none: no one-way door came up. Every call taken is listed under "Calls his to overrule" in the Handoff.

## System-doc edits (in place, owned facts only)

- `guest-flow.md`: the lightbox credit (a row with no name credits nobody, the counter alone); the identity switch
  paragraph (the legacy twin is read by no code and the contract drops it); the confirmation sequence, the precedence
  rule and the rename rule without "A guest"; the join bullet (the route's 422 first, `create_guest`'s nameless raise
  the belt); Stats (M rides the poll's 200); the bearer-credential invariant (nothing rotates the link: the switches
  are the defense); the upload step's OFF line; the own-removal paragraph (the visit's adds and removals, the window,
  the card's count, a full album). Clear of `host-followons`' lines (the address invariant).
- `database-security.md`: the 0028 note (the confirmed-viewer gate carries QA #36; the contract drops the clause),
  the trigger-only list (the twin-keeper and its drop), the `events` writable columns, the cascade gotcha's example.
- `host-app.md`: `event-feed.tsx` gone (only `event-filter-pills.tsx` is dead now); the `events` row's identity
  switch.
- `design-system.md`: the contextual floating action bar as a pattern (its file is gone).
- `profiles-social.md`: the attended arm's anonymous-viewer clause (the gate carries it; the contract drops it).
- `uploads-and-r2.md`: `toGridItems`' three identity fields; the resolver's nameless case.
- `testing-verification.md`: the reseeding line's guest mode (the brief names it).

## Deferred (ROADMAP one-liners, bucket named)

- The app: Host: `lib/shared/use-active-section.ts` and `event-feed/event-filter-pills.tsx` lost their last importer with `event-feed.tsx`; delete them, and the comments that still name `event-feed-action-bar.tsx` (`bulk-tools.tsx`, `bulk-select-mock.tsx`, `floating-layer.ts`, `type-ladder-policy.test.ts`).
- The app: Guest: `get_event_media_by_qr_token` and `getApprovedMediaForUnlock` read an album unpaged, so past 1,000 approved items the guest album and its poll hold only the newest 1,000 (PostgREST's `max_rows`).
- The app: Guest: the last-removal line reads the album's fullness at render (`albumFull`, the page's second gate read); an album that fills or frees mid-visit keeps the old line until a refresh, and the poll could carry it at one gate read per poll.
- The app: Social: `social/guest-list.tsx:216` draws "A guest" for a null `displayName`, a label the product retired (a nameless credit shows nothing).
- The lab: three boards still draw "A guest" for a null uploader name (`media-viewer/viewer.tsx:194,296`, `host-curation/queue.tsx:490`, `profile-page/album.tsx:149`), and `host-storage/spec.ts:49` still says `gallery-fixtures.ts` mints a nameless anonymous uploader, which it no longer does.

## Handoff (replaces the chat report)

- **Work commits** (pushed, in the brief's order, each its own): `37b8897b` the partial-save defect · `d3f929ed` the
  identity contract (code + the UNAPPLIED SQL file) · `fd419305` the round's guest lines · `c22f0203` the demo's
  guests. **Sync merges:** `57770b5b`, `86a2ad0c` (host-followons and lab-scene-kit) and `26c6c67b` (event-safety);
  the only conflict each time was `docs/design/library.md`, generated, regenerated from the merged tree. The head is
  in the chat line.
- **Gates on the synced tree (`26c6c67b`), each on its own exit code:** `pnpm design:rules` 0 · `collect-specimens`
  0 (no diff) · `pnpm typecheck` 0 · `pnpm lint` 0 (8 warnings, none in a file this lane touched) · `pnpm test` 0
  (372 files, 4,150 passed, 1 skipped) · `pnpm build` 0 · `pnpm lab:smoke --base http://localhost:3131` 0 (519
  checks, 0 failing) · `pnpm lab:demo --board` 0 on each board whose fixtures changed or that reads the shared pool:
  `host-curation` (8 steps), `host-storage` (5), `media-viewer` (8), `reel-cut` (9), `reel-host` (6), `reel-front`
  (7), `reel-screen` (8), `reel-story` (7), 0 failing each. Logs:
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/guest-followons/g3-*.log`.
- **Typecheck on BOTH sides of the regeneration:** with `allow_anonymous_uploads` struck from a scratch copy of
  `types.ts` (the post-apply shape), `tsc --noEmit` exits 0; `types.ts` itself is untouched.
- **The SQL, `supabase/migrations/20260923150000_identity_contract.sql` (UNAPPLIED):** pre-flighted VERBATIM on a
  throwaway PG 17 cluster loaded with the live column shapes, grants and the four current bodies (each body's
  `md5(prosrc)` matched its repo source first): applied with every statement ok; `pg_get_functiondef` before/after is
  exactly the intended diff; the foot's contract check reaches its deliberate raise; a probe of HEAD's paths as
  `authenticated` (create an event naming only the new flag, a one-field save, the switch) and `anon` (the RPC, the
  profile) passes, and milestone-26's save naming the dropped column fails, as the header says. Then proved on the
  LIVE schema in one `execute_sql` inside `begin; … rollback;` (the file's 12 statements, comments stripped, each
  trapped into a temp `proof` table, `lock_timeout` 3s): all 12 ok and the check's own raise reached ("ROLLED BACK: every identity-contract
  fact held", riding `create_media` for a confirmed guest on a disposable names-mode event); afterwards the live
  column, trigger and both bodies' md5s were unchanged and no row was left.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, run at `26c6c67b`): 71 paths (72 with this
  manifest), all inside `owns` except exactly these nine, pasted:
  ```
  docs/design/library.md
  docs/systems/database-security.md
  docs/systems/design-system.md
  docs/systems/guest-flow.md
  docs/systems/host-app.md
  docs/systems/profiles-social.md
  docs/systems/testing-verification.md
  docs/systems/uploads-and-r2.md
  src/app/(dev)/design/rules/rules.generated.json
  ```
  The seven system docs are the edits listed above (facts inside this lane's paths; `testing-verification.md`'s line
  is the brief's own ask). The two GENERATED files are rewritten by the gate's `pnpm design:rules`, because contract
  tests this lane owns (`media-lightbox`, `live-gallery`, `guest-upload`, `upload-step`) changed their titles.
- **ROADMAP Now lines this closes** (quoted), each with its fix:
  - "Copy: the guest's delete confirm says "permanently deleted after a short grace period" (`media-lightbox.tsx`)
    where Deleted keeps an upload for `RECENTLY_DELETED_WINDOW_DAYS`; say the window." → the uploader's own delete
    reads "permanently deleted after 30 days"; the host's Remove and bulk Delete read "moves to Deleted, where you can
    restore it for 30 days"; all three read the constant.
  - "Guest: after deleting one of this visit's uploads, the post-upload handle card still counts it ("Your 2 photos
    are on this album" with one left); count the live uploads, not the visit's queue." → `onOwnRemoved(id,
    remaining)`, the page keeps the ids, `GuestUpload` counts finished items not among them and unmounts at zero; the
    gallery's own-id set learns the visit's adds and removals on both identities.
  - "Copy: the door's upload step on an event without Require an upload to view says "Add one now and the album
    opens." though that album is already open; the line belongs to the require-upload door alone." → OFF says "Add
    one now, or look around first." (empty: "Nothing here yet. Add the first photo."), the OFF failure line "Pick
    something else to add."; the how-it-works mock follows.
  - "Guest: on a require-upload event whose album is FULL, the last-removal confirm says the album closes, but the
    gate fails open on a full album, so it does not; say it only when the gate's `album_full` is false (the lightbox
    would need that fact)." → `resolveViewerDecision` returns `albumFull`; the page passes it; `closesOnLastRemoval`
    (pure, pinned) turns the line and the refresh off.
  - "Guest, the demo: every demo upload is the host's and the host never counts, so its header reads "9 photos &
    videos" with no guests clause; seed a few guest uploads (real uploads, `seed-demo-event.mjs`) to bring back "from
    N guests"." → `--guests` on the seed script; closes when the Orchestrator runs it.
  - "Code hygiene: `e/[token]/page.tsx`'s `socialSeam` cast (its own comment says collapse it once the server lane
    is on the tree, which it is) and its unused `requireVerifiedEmail` (a lint warning)." → named imports; the block
    is gone.
  - "Guest: two identity seams read the server's names through narrow casts (`socialSeam` and the guest list's second
    argument in `(guest)/e/[token]/page.tsx`; `isVerified` in `media-lightbox.tsx`); collapse them onto the merged
    types." → `splitGuestList` and the typed list; `item.isVerified` read directly, its test too.
  - "Code hygiene: comments that still name save: `likes-provider.tsx:26` (SaveEventButton),
    `queries/guest-events.ts:19` (`save_event` among the anon-client RPCs)." → both, plus `likes-provider` :31,
    :160, :258, :299 and `google-icon.tsx:2`.
  - "The lab: `sandbox/gallery-fixtures.ts` (shared by `host-curation` and four reel boards) still mints a nameless
    `isAnonymous` uploader and puts the host's own uploads in `REVIEW_ITEMS`, neither of which the product can do
    now." → a named, marked guest; Review holds guests' uploads only.
  - "Guest: the album's header holds `stats.guestCount` from the render, so a guest's own first upload under-counts
    the guests by one until a reload (`event-experience.tsx`); a small server signal on the gallery poll fixes it,
    never a client heuristic (a returning contributor would over-count)." → `guestCount` on the poll's 200.
  - "Host: `event-feed/event-feed.tsx` and `event-feed/event-feed-action-bar.tsx` have no importer; delete them." →
    deleted.
  - "The identity round's contract migration, once the alias's build no longer reads what it drops (…): drop the
    sync trigger and `events.allow_anonymous_uploads`, recreate `get_event_by_qr_token` without the old column
    (keeping `require_upload_to_view`), add `create_guest`'s "Add your name to upload." raise, retire `isAnonymous`
    and the seed script's old flag, and delete `get_public_profile`'s QA #36 clause (…), moving
    `public-profile-visibility.test.ts`'s pin to the gate." → the code is done; the line closes at the apply.
  - "Migrations: the remaining `migration-guards.test.ts` pins that hold an object for the deployed `main` build are
    judged by PROGRAM.md's "Before launch" principle: each contract lands once the alias's build stops calling what
    it drops." → every pin citing a deployed build judged: the twin's become dropped-and-never-recreated, the rest
    keep their assertion with a comment that cites no build.
- **Also in the brief, not a Now line:** `getUploaderIdentities` walks keyset pages past the 1,000-row clamp (a
  recording-fake test); `guest-flow.md` states that nothing rotates the link.
- **Verified locally at 1440 and 375** (`pnpm dev -p 3131`, real Supabase): the door's upload step OFF ("guest-view-menu
  QA", "Personal Testing Throwaway") and ON ("Gallery width (disposable)"), both widths; the album header ("7 photos &
  videos from 1 guest", "57 … from 7 guests"); the poll carries `guestCount` on a 200 (full and teaser), answers a
  matching `g4` validator 304, and carries none on a locked page or a missing event. The lightbox's two confirms were
  read off a jsdom render ("…permanently deleted after 30 days. This is your last upload here, so the album closes
  until you add another." / "…moves to Deleted, where you can restore it for 30 days. Guests won't see it."). Test
  data: one name-only guest row "Followons check" (no upload) on each of those three disposable events.
- **Not drivable on localhost (sign-in and upload are allow-list-gated), for the alias red-team:** the settings sheet
  saving a name with a custom QR (the QR stays custom); a QR-style save on a review event (held uploads stay held);
  the host's Remove confirm; a signed-in guest's new photo showing its Trash and mark at once; one of two uploads
  deleted (the card says 1) and the last on a require-upload album (the album closes; on a full one it does not and
  the line is silent); the header's guest count moving on a guest's first upload.
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** apply
  `supabase/migrations/20260923150000_identity_contract.sql` AFTER milestone 27 has shipped this tree (its header
  names what the milestone-26 build would lose: every signed-out guest held at the teaser, event create and settings
  save failing on the dropped column), then `get_advisors` (expected delta: none) and regenerate `types.ts` (the
  `events` row and `get_event_by_qr_token` lose the column, which no code reads; typecheck already proved on that
  shape). Then run the demo's guest mode once, e.g. `node scripts/seed-demo-event.mjs <the demo's folder> --guests
  "Maya J.,Tom R.,Priya S."` (a dry run against the demo read the plan correctly: nothing written). No Worker,
  Vercel, Stripe or env change.
- **Calls his to overrule:**
  - A row with no name (legacy) credits nobody, the counter alone, rather than any stand-in label.
  - The OFF door's words: "Add one now, or look around first." / "Nothing here yet. Add the first photo." / "Pick
    something else to add." (the voice board may win better ones).
  - The host confirms name the place and the window ("moves to Deleted, where you can restore it for 30 days"); the
    uploader's own says "permanently deleted after 30 days" and promises no way back.
  - `albumFull` rides the page render only, bought with one identity-less `get_upload_gate` read for a guest who has
    contributed (the gate reads the caps only for one who has not); the poll and its ETag do not carry it, so the
    steady poll pays nothing new (the Deferred line names the gap).
  - The guest count rides a 200 and stays outside the ETag (anything that moves it changes the hashed payload);
    a teaser viewer's M can lag until the payload changes.
  - The seed's guest mode assigns files in turn, host first, then each named guest; the names are the Orchestrator's
    at the run.
  - The contract file also rewords comments in the two replaced bodies that described the older build and the
    dropped twin (no behaviour but the raise and the deleted clause).
  - The ETag version moves g3 → g4, so every open album re-pulls once after the deploy.
  - `escalation-guards.test.ts` keeps a test that asserts only what its own Q3 file wrote (retitled), rather than
    losing the file's QA #36 half.
- **Look at first:** the SQL file's header and foot, then `src/lib/validation/event.ts` (the defect's fix and why),
  then `src/components/guest/live-gallery.tsx`'s own-id set and `src/components/guest/upload-step.tsx`'s two lines.
