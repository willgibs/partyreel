---
track: guest-by-upload
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "8d1f66fd"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/
  - src/lib/db/migration-guards.test.ts
  - src/lib/social/public-profile-visibility.test.ts
  - src/lib/db/queries/social.ts
  - src/lib/db/queries/social.guest-identity.test.ts
  - src/lib/db/queries/saved-events.ts
  - src/lib/db/queries/guest-events-admin.ts
  - src/lib/db/queries/guest-gate.ts
  - src/lib/db/queries/claims.ts
  - src/lib/db/queries/claims.test.ts
  - src/lib/db/mutations/social.ts
  - src/lib/saved-events/
  - src/lib/events/
  - src/lib/guest/
  - src/lib/dashboard/
  - src/components/guest/
  - src/components/social/
  - src/components/auth/
  - src/components/shared/unverified-mark.tsx
  - src/components/shared/unverified-mark.test.tsx
  - src/components/shared/claim-uploads-on-auth.tsx
  - src/components/shared/media-lightbox.tsx
  - src/components/app/event-card.tsx
  - src/components/app/event-card.test.tsx
  - src/components/app/unsave-button.tsx
  - src/components/app/dashboard/events-section.tsx
  - src/components/app/dashboard/events-section.test.tsx
  - src/components/app/dashboard/events-row-list.tsx
  - src/components/app/dashboard/empty-section-teaser.tsx
  - src/components/app/dashboard/events-empty-teaser.tsx
  - src/components/app/dashboard/filter-chips.tsx
  - src/components/app/dashboard/claims-card.tsx
  - src/components/app/dashboard/claims-card.test.tsx
  - src/components/app/dashboard/trash-section.tsx
  - src/app/(app)/dashboard/
  - src/app/(guest)/
  - src/app/api/guests/capture-email/
  - src/lib/content/help-redirects.ts
  - src/lib/constants/legal-privacy.tsx
  - src/app/(dev)/design/(shell)/library/compositions/gallery-demos.tsx
  - src/app/(dev)/design/rules/component-notes.ts
  - content/help/save-an-event-and-find-your-uploads.mdx
  - content/help/find-your-uploads-and-events.mdx
  - content/help/how-guests-join-and-upload.mdx
  - content/help/profiles-guest-lists-and-following.mdx
  - content/help/report-a-problem-as-a-guest.mdx
  - content/help/require-verified-emails-explained.mdx
  - content/help/sign-in-options-and-passwords.mdx
  - content/help/why-an-event-asks-for-your-email.mdx
  - content/help/your-dashboard-explained.mdx
  - content/help/your-public-profile-following-and-blocking.mdx
  - content/help/display-name-and-profile-photo.mdx
  - content/help/require-an-upload-to-view-explained.mdx
  - content/help/AUTHORING.md
  - content/blog/scanned-a-qr-code-where-your-photos-go.mdx
  - content/blog/AUTHORING.md
  - docs/systems/guest-flow.md
  - docs/systems/profiles-social.md
  - docs/systems/host-app.md
  - docs/systems/notifications-analytics-growth.md
  - docs/systems/auth-accounts.md
  - docs/systems/database-security.md
  - docs/SYSTEMS.md
  - docs/PRD.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/db/types.ts
  - src/lib/constants/tiers.ts
  - docs/systems/uploads-and-r2.md
  - src/app/(dev)/design/touchpoints.ts
---

# lp/guest-by-upload

**Goal.** Save dies and "guest" gets one definition: a person is a guest of an event only through an upload of theirs, the upload is the save (the events you added to appear on your dashboard as Guest cards), every guest count reads one function, a profile's "guest at" line follows the album's Require an upload to view door, and a guest's own deletes close that door again. Two migration files (function bodies now; the save tables and the dead `profile_hidden_events` dropped after alias build 2's red-team), the three confirm doors claim-only with a redirect return that lands the follow moment, and the help, legal line, PRD and system docs made true.

## The brief

**Will's words (2026-09-22), verbatim.** On the save feature: "we should kill the event 'save' feature. Most of our product choices are meant to encourage guest participation for the host's benefit, so saving an event without participating is useless. This likely creates some conflict with some of our save flows leading to email capture, but the only way to be attached to an event as a guest should be via upload. Password entry, veryify account, but no upload? Not listed as a guest. Delete all of your uploads? Removed as a guest. Uploaded 1 photo? You're a guest. The new email capture after upload should incentivize the email to save the event under the account for the future, but uploading to an event is now effectively saving. No attendance reward; must upload to be guest." On signing in from the name menu: "now that 'save' as a feature is being removed, I think this question has become stale. As a rough equivalent, in events that don't require verified emails, a name-only or unverified email guest logging in would carry their uploads into their verified account." On the host's credit keeping a confirmed guest's email: "Yes ... because this is the safety advantage when a host toggles on require verified accounts for events. Otherwise, if we don't display verified emails, anyone could verify any email account, and there's no real verified identity tied to the safety feature. If I'm a verified guest on 'fakeemail@domain.com' but the host only sees a verified badge, it implies far more safety than it should." His two follow-up picks: a profile's "guest at this event" line FOLLOWS THE ALBUM (on an event set to Require an upload to view, only the host and signed-in people who have passed that event's door see it), and on that door, "OWN DELETES CLOSE IT" (a guest's own deletes close the album again; a host's or the system's removal never re-closes it). And: "we have no real users on Partyreel, so everything is test data right now. Don't have to dance around anything like save tables in the database before launch - big reason we're delaying it, so we can have a perfect product before rather than try to adapt new features to existing users' data."

**Rising Tides (Will, 2026-09-22):** "the library's purpose is more our working rules to keep consistency across what we've built and new builds, but not hard rules that can't be reshaped. Working guidelines, not hard rules ... everything is unprotected, anything may be relitigated for better solutions despite any past decisions." A rule that blocks better work is reshaped deliberately and named in your Handoff.

**The rules these lanes stand on (tonight's rulings, the current model):**
- A person is a GUEST of an event only through an upload of theirs. A LIVE upload is one whose `media.status` is not `removed` (pending, approved or hidden). What other people see needs an APPROVED one: the guest list, the Guests room, every guest count, a profile's "guest at" line. The account's own events list takes any live one. A `guests` row stays what it is, the device's upload ticket minted at the door, and nothing reads a row as attendance. A cut added to the album (the reel round) is an upload like any other.
- SAVE IS GONE: no Save button, no saved list, no separate save step anywhere. The events a person added to appear on their dashboard marked "Guest" (the profile's own word), so "this event stays in your account" becomes true through the upload and the claim. Confirming an email claims the uploads (the existing claim: a name-only or typed-address guest's uploads on the same browser; a typed address's rows on any device once that address is confirmed).
- REQUIRE AN UPLOAD TO VIEW: an upload the guest removed themselves (`removed_by_uploader`, a disown included) no longer opens the door; a host's, an admin's or the system's removal still does.
- A profile's "guest at" line on a require-upload event, while uploads are open, shows only to the host and to signed-in viewers who have passed that event's door.
- The host keeps seeing a confirmed guest's address under the name in the host's viewer (Will's reason above).
- Before launch nothing waits for partyreel.com's older build (PROGRAM.md, "Before launch").

**What exists (two read-only maps, verified against the code; line numbers from `8d1f66fd`).**
- Save is contained: `saved_events` (`20260602162326`), `save_event(p_qr_token)` and `get_saved_events()` (current bodies `20260602183720_one_link_consolidation.sql:106-202`); no other SQL reads them. App: `src/lib/events/save-event.ts`, `src/lib/db/queries/saved-events.ts`, `src/lib/saved-events/card.ts`, `src/components/guest/save-event-button.tsx` (`SaveEventButton` + `CompletePendingSave`; the button mounts only inside the post-upload offer card, `save-account-prompt.tsx`, whose `onSaved={dismiss}` dismisses it), `src/components/app/unsave-button.tsx`; the dashboard's `kind: "saved"` rows (`dashboard/page.tsx:96-101,232-250`, `events-view.ts:72-157`, `events-section.tsx`, `events-row-list.tsx`, `event-card.tsx`'s `saved` variant); the three confirm doors that claim THEN save (the offer card; the Unverified mark's `ConfirmEmailDoor` + `UnverifiedMarkEvent` provider, `unverified-mark.tsx:82-164`; the name menu's Confirm your email, `guest-name-menu.tsx:92-210`, with `guest-header.tsx:207-209` passing `eventId` and `add-email-dialog.tsx:169-180`'s "Confirm it now instead"); `event-experience.tsx` (`saveable` :203-210, `CompletePendingSave` :642-649, the provider :1040-1062). The per-tile "Save" in the album is save-photo-to-device: leave it.
- The newsletter opt-in ("Send me occasional Partyreel updates") lives only inside `SaveEventButton` (`:270-285`), posting `/api/guests/capture-email`.
- The claim (`claim_anonymous_uploads`, `claim_guest_rows_by_email`, `list_guest_rows_by_email`, all `20260922120000_guest_pending_email.sql`) never touches saves; `ClaimUploadsOnAuth` runs silent on `/e/` (`event-experience.tsx:638-641`) only so it would not stack on the "Saved" toast.
- Listing: `getEventGuestList` (`social.ts:650-745`) already needs an approved upload, but keeps the host's own guest rows and skips nameless unverified rows; the hub's Guests card counts confirmed guests only (`dashboard/[eventId]/page.tsx:148,185,219-224`); the hub header counts approved AND hidden uploads by row plus the host (`:173-185,286-296`); the album header "N photos & videos from M guests" (`getGalleryStats`, `guest-events-admin.ts:109-132`, shown `event-experience.tsx:826-831`) counts rows and the host. `getMyAttendedEvents` (`social.ts:548-598`) skips `verified_at`, which the public arm requires.
- `get_public_profile`'s attended arm (latest: `20260922200000_identity_sql_gaps.sql:278-327`) needs `show_guest_list`, `visibility='open'`, the album's confirmed-email gate, an approved upload by a VERIFIED row, and the `profile_shown_events` opt-in; it ignores Require an upload to view.
- `get_upload_gate` (`20260922003000_require_upload_to_view.sql:125-170`) counts ANY upload ever made ("punched ONCE", pinned by `migration-guards.test.ts:540`: `not.toContain("m.status")`); `resolveViewerDecision` (`gallery-access.server.ts:81-122`) consults it only when uploads are open. `media` carries `removed_by_uploader`, `removed_by_admin`, `removed_by_system`.

**Build (the plan, with two reviews folded in):**
1. SQL, TWO files (you write them; the Orchestrator applies each by the protocol with a rolled-back contract check in a comment at its foot):
   - `<ts>_guest_by_upload.sql`, expand, FUNCTION BODIES ONLY (no signature changes, so no type regeneration and the running alias keeps working):
     - `get_public_profile`: the attended arm adds `and (not e.require_upload_to_view or not e.accepting_uploads or e.host_id = (select auth.uid()) or exists (the viewer's own guest row at e.id with an upload that is not self-removed))`. It is deliberately stricter than the album in two corners, never looser: a full album opens for its viewers but not here, and a name-only uploader known only by a cookie is not recognised (the function never sees a session token); say so in its comment. Keep `create or replace` (`public-profile-visibility.test.ts:54` finds only that form) and every existing attended pin in `migration-guards.test.ts`.
     - `get_upload_gate`: the contributed EXISTS adds `and not (m.status = 'removed' and m.removed_by_uploader)`. Invert the pin at `:540` to assert exactly that; rewrite guest-flow.md's "The ticket is punched ONCE" paragraph (:229-231) to the new rule with Will's words; follow through `guest-gate.ts:24`, `gallery-access.ts:75`, `host-app.md:108` and the help line "they're in for good" (`require-an-upload-to-view-explained.mdx:29`).
     - `list_guest_rows_by_email` and `claim_guest_rows_by_email`'s claim-all (NULL) path skip rows with no live upload (the pin at `:665` requires the literal `create function public.list_guest_rows_by_email()`: drop-and-create, or reshape the pin, and say which).
   - `<ts>_drop_saves.sql`, contract: drop functions before tables, all `if exists`: `save_event(text)`, `get_saved_events()`, `saved_events`, and `profile_hidden_events` (dead in this tree; remove the pin at `:786-790` that held it for prod and add one that the drop landed). Its header says it is applied only after alias build 2's red-team, and names what partyreel.com's older build loses (its dashboard throws on every load via `get_saved_events`; its profile hide toggle errors; its Save buttons fail).
2. The events you added to: an ADMIN-CLIENT query beside `getMyAttendedEvents`, sharing one "my live guest rows" helper, NOT a new RPC (you cannot type-check an RPC whose types regenerate only after the merge). The account's rows with any live upload, excluding deleted events and events you host; masked by reusing `saved-events/card.ts` (move it if its name no longer fits): a private event blank and locked, a password event linked with no cover, covers through `adminCoverUrls` (`social.ts:445-452`), never `get_saved_events`' unfiltered cover; sorted by your latest live upload. The dashboard lists them as kind `guest` rows marked "Guest", under the filter where "Saved" was (a stored `saved` cookie value resolves to "all"); a card leaves when your last live upload does. `EventCard`'s `saved` variant becomes `guest` (the bookmark glyph becomes the profile's Guest marker); `recheck-by-upload` moves `identity-claims` off the old variant, and you move the Library's `gallery-demos.tsx` specimen. `UnsaveButton`, the saved query and `save-event.ts` go; `layout.ts`'s dead `resolveDashboardLayout` and the unmounted `dashboard/trash-section.tsx` go with the saved count (their ROADMAP lines close).
3. The doors. All three confirm doors claim only (`SaveEventButton` and `CompletePendingSave` go; the `UnverifiedMarkEvent` context and the menu's `keep`/`eventId` go). The `save` wear's reason must hold BEFORE an upload, since the name menu offers it the moment a name is typed: "Confirm your email and this event stays in your account, with every photo you added" becomes words like "Confirm your email and every photo you add here stays in your account, with this event. Confirming makes a free account." The `like` wear's "find them again on your dashboard" is false (likes live in the profile's owner mode, which needs a handle): fix it in the same edit. The newsletter switch STAYS in the post-upload card's door (the wear's children slot) when `SaveEventButton` goes, still posting `/api/guests/capture-email` on an in-page verify. `save-account-prompt.tsx` keeps its file name (`touchpoints.ts` lists it; `links.test.ts:319-329` checks it exists); its hide check stops reading `saved_events`.
4. The return. The carrier across a Google or code redirect, now that the pending-save key goes: EVERY confirm door writes `pr_pending_offer_<qr_token>` when it opens (the offer card already does). On return, the event page's mount-time claim consumes it: when it claims this event's rows, the follow moment plays in the post-upload slot with no upload needed this visit (closes the ROADMAP line "the follow moment never plays after a Google or magic-link confirm"; following the host is the capture's payoff and the host's benefit), and a toast ("We added your uploads to your account.") plays only when the claim covered other events too.
5. Never stranded: a guest who removes their only upload on a require-upload event gets the door back WITH its upload step. `entry-steps.ts:121-122` offers the step only when `!hasContributed && !contributed`, and `contributed` (`event-experience.tsx:291`, `queue.some(done)`) stays true all visit: let the server's `upload` gate win after a refresh. A test for "uploaded, then removed". On such an event, removing your LAST upload says in its confirm that the album closes until you add another.
6. One count, one word. One function returns `{verifiedUserIds, unverifiedRows}` from two queries keyed on `event_id` (never an `.in()` of guest ids, whose URL grows with the party): approved uploaders, a confirmed guest once per person, a named unverified guest once per row, never the host and never a nameless row. The hub's Guests card, the hub header and the album header all read it and say "guests" (the hub says "contributors" today). Closes ROADMAP "the hub's Guests card counts profile-backed guests only"; the album header's stale count after your own first upload is its own line (it needs the count on the poll) and stays open. Check the demo's header once the host no longer counts.
7. The Account page's "Events you joined" (three lines in `src/app/(app)/account/page.tsx`, which is `storage-guard`'s file: change only those lines, as a listed exception, after syncing) and `attended-events-visibility.tsx` become the events you added photos to; the switches list and the attended covers re-check the proved identity (`verified_at`) and the guest's own upload.
8. Words and docs. The save article becomes `content/help/find-your-uploads-and-events.mdx` ("Find your uploads, and the events you added to"), with a redirect from the old slug in `help-redirects.ts`; the seven other articles lose their save lines (how-guests-join-and-upload, profiles-guest-lists-and-following, report-a-problem-as-a-guest, require-verified-emails-explained, sign-in-options-and-passwords, why-an-event-asks-for-your-email, your-dashboard-explained, whose billing line also follows the new change-plan path: sizes and intervals move to the plan sheet, the portal keeps the card, invoices and cancelling); "Events you joined" in your-public-profile-following-and-blocking, profiles-guest-lists-and-following and display-name-and-profile-photo; the help and blog AUTHORING lines and the blog post's line. Every `<UiLabel>` a removed string leaves behind is found (`help-ui-labels.test.ts`). Privacy's "Likes, saved events, follows and blocks" (`legal-privacy.tsx:166`) drops saved events (its version bump in `legal.ts` is the Orchestrator's one line at your record; `legal.ts` is `storage-guard`'s). `PRD.md`'s "Guest: attends" line gains his participation principle: a person is a guest by contributing, and product choices favour the host's benefit. System docs, facts inside your lane only: guest-flow.md (the definition as an invariant; the capture flow's paragraphs; the gate; and the host seeing a confirmed guest's address, with his reason), profiles-social.md, host-app.md, notifications-analytics-growth.md (its "Saved events" section goes; the newsletter capture paragraph follows), auth-accounts.md, database-security.md (the inventory: the saves objects go with the contract file), `SYSTEMS.md`. The Library's saved specimen and its component notes (`component-notes.ts`: yours; `storage-guard` lists one pricing-sheet note for the Orchestrator).
9. Keep every export the lab imports (`UNVERIFIED_LABEL`, `ClaimableEventRow`, `EventCard`): a lane never breaks a module the lab imports.

**Tests die and are born.** Whole-file save tests go (`save-event.test.ts`, `save-event-button.test.tsx`, `saved-events/card.test.ts` if the helper moves, `layout.test.ts`); the contracts that pin claim-then-save are rewritten to claim-only (`unverified-mark.test.tsx`, `guest-header.test.tsx`, `save-account-prompt.test.tsx`, `claim-handle-prompt.test.tsx`, `guest-upload.test.tsx`, `events-section.test.tsx`, `events-view.test.ts`, `account-door.test.tsx`, `event-card.test.tsx`, `session-tokens.test.ts`). Born: the live-upload helper and the guest-events read; the one count; the attended viewer gate and the gate's self-removal rule as migration-text guards; the claim card and claim-all skipping an empty row; the redirect carrier landing the follow moment; "uploaded, then removed".

**Calls already made (take them; list any you would overrule):** a live upload is not removed, in any review state; the host removing all of a guest's uploads takes the guest off every list, and a restore puts them back; the account's list takes held uploads too; a guest's `profile_shown_events` choice survives a last removal (a later upload shows the event again without asking twice); the profile line errs stricter in the two corners above.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

None open. Every call I took without asking is under "Calls his to overrule" below, each with the answer built.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: BELONGS HERE names who a guest is; the row's "there is no save"; THE OFFER IS THE CAPTURE FLOW (its newsletter switch); THREE CONFIRM DOORS, ONE OBJECT, AND THEY CLAIM ONLY; THE RETURN (the marker, `holdAlbum`, `useConfirmReturn`, here and elsewhere); the overlays line (the confirm door); the header's stats from the one count; the gate's "punched ONCE" rewritten as OWN DELETES CLOSE IT with Will's words; `contributionAnswered`; the last-removal line; the claim paragraph; the header menu; two invariants, a person is a guest only through an upload of theirs (Will's words) and the host sees a confirmed guest's address (his reason).
- `docs/systems/profiles-social.md`: `profile_shown_events` as the opt-in that survives a last removal; a person on a list, a count or a profile line only through an approved upload; the attended arm's upload door and its two stricter corners; the Guests room and the hub counting through the one count; `profile_hidden_events` gone from the schema line.
- `docs/systems/host-app.md`: the dashboard's Guest cards (the read, the mask, a card leaving with its last live upload, `RoleMarker`); the Show menu (All events · Guest · Deleted); the hub's header and Guests card counts; the upload door's own-deletes rule.
- `docs/systems/notifications-analytics-growth.md`: the "Saved events" section deleted; the newsletter opt-in lives in the offer card's confirm door; ROLE and BELONGS HERE follow.
- `docs/systems/auth-accounts.md`: the account door's asks (the one confirm door, claim only); the `keep` and `like` wears' words and why; every guest-side wear awaits the claim.
- `docs/systems/database-security.md`: the attended arm's upload door; `get_upload_gate`'s read; the claim card and Claim all skip a row with no live upload; the token claim's count; `save_event`/`get_saved_events`/`saved_events` out of the inventory (true from the contract's apply).
- `docs/SYSTEMS.md`: the guest-flow, host-app and notifications rows. `docs/PRD.md`: the Guest persona (contributes; Will's participation principle) and the core loop's offer step.

## Deferred (ROADMAP one-liners, bucket named)

- Now: Guest: on a require-upload event whose album is FULL, the last-removal confirm says the album closes, but the gate fails open on a full album, so it does not; say it only when the gate's `album_full` is false (the lightbox would need that fact).
- Now: Guest, the demo: every demo upload is the host's and the host never counts, so its header reads "9 photos & videos" with no guests clause; seed a few guest uploads (real uploads, `seed-demo-event.mjs`) to bring back "from N guests".
- Now: Social: `getProfileCards` hydrates the guest list by one `.in()` of user ids, so a party with several hundred confirmed guests builds a long URL; chunk it (the counts themselves are event-keyed).
- Now: Code hygiene: `e/[token]/page.tsx`'s `socialSeam` cast (its own comment says collapse it once the server lane is on the tree, which it is) and its unused `requireVerifiedEmail` (a lint warning).
- Now: Code hygiene: comments that still name save: `likes-provider.tsx:26` (SaveEventButton), `queries/guest-events.ts:19` (`save_event` among the anon-client RPCs), voice-guest `parts.tsx:425,473` and `lines.ts:148` (`save-event-button.tsx`, the `save` wear), voice-guest `spec.ts`'s keep `lands` ("the door's save words").

## Handoff (replaces the chat report)

**Commits.** Work, in order: `425f64a8` (the two migration files and their guards), `61701cd8` (save dies in the app; one count; the doors claim only), `cda8a989` (the confirm dialog's contract, the notes, the regenerated library), `f7abbdd2` (the help, the blog line, the legal line, the account's words), `cbde8a24` (the PRD and the system docs), `df276bf4` (the one count read once per request), `5800ae4c` (the dashboard article's billing line follows the storage guard), `414435e6` (the migrations' after-apply md5s and their order), `9812e94b` and `a81152c7` (the voice board's two lines). Syncs: `b4c83f9b` (recheck-by-upload), `8f735522` (storage-guard and host-storage) and `f0cc9d68` (voice-guest; launch-prep at `0c95387e`, 0 behind at handoff); each conflicted only on `docs/design/library.md`'s generated count line, resolved by regenerating. All pushed to `origin/lp/guest-by-upload`.

**Gates on the synced tree `a81152c7`, each on its own exit code** (logs `gate3-*.log` in the lane's scratch): `pnpm design:rules` 0 (1976 contracts on 168 components from 125 contract tests, 18 policies) · `collect-specimens` 0 (140 specimens on 101 entries) · `pnpm typecheck` 0 · `pnpm lint` 0 (0 errors, 9 warnings, none in a touched file) · `pnpm test` 0 (362 files, 4026 passed, 1 skipped: `strip-metadata.test.ts`'s own) · `pnpm build` 0 · `pnpm lab:smoke --base http://localhost:3132` 0 (504 checks, 0 failing).

**Lane check** (`git diff --name-only origin/launch-prep...HEAD`, 105 paths before this file): all inside `owns` except
- three GATE OUTPUTS, regenerated: `docs/design/library.md`, `rules.generated.json`, `specimens.generated.json`;
- `src/app/(app)/account/page.tsx`, storage-guard's file: the brief's three lines ("Events you joined" becomes "Events you added photos to"), after syncing;
- `content/help/how-partyreel-works.mdx:50`, one line: its dashboard bullet promised "any you've saved as a guest";
- `src/app/api/cron/purge/route.ts:969`, one comment line: it named `saved_events` as the table sharing the FK, now `profile_shown_events`;
- `src/app/(dev)/design/sandbox/voice-guest/lines.ts:167` and `spec.ts:355`, one line each (the board merged mid-lane): its `today` register is the shipped string by its own rule, and the keep door's reason is this lane's; the `today` option's meaning said the door does not hold before an upload, which this lane fixes.

```
content/blog/AUTHORING.md
content/blog/scanned-a-qr-code-where-your-photos-go.mdx
content/help/AUTHORING.md
content/help/display-name-and-profile-photo.mdx
content/help/find-your-uploads-and-events.mdx
content/help/how-guests-join-and-upload.mdx
content/help/how-partyreel-works.mdx
content/help/profiles-guest-lists-and-following.mdx
content/help/report-a-problem-as-a-guest.mdx
content/help/require-an-upload-to-view-explained.mdx
content/help/require-verified-emails-explained.mdx
content/help/save-an-event-and-find-your-uploads.mdx
content/help/sign-in-options-and-passwords.mdx
content/help/why-an-event-asks-for-your-email.mdx
content/help/your-dashboard-explained.mdx
content/help/your-public-profile-following-and-blocking.mdx
docs/PRD.md
docs/SYSTEMS.md
docs/design/library.md
docs/systems/auth-accounts.md
docs/systems/database-security.md
docs/systems/guest-flow.md
docs/systems/host-app.md
docs/systems/notifications-analytics-growth.md
docs/systems/profiles-social.md
src/app/(app)/account/page.tsx
src/app/(app)/dashboard/[eventId]/page.tsx
src/app/(app)/dashboard/page.tsx
src/app/(dev)/design/(shell)/library/compositions/gallery-demos.tsx
src/app/(dev)/design/gallery/specimens.generated.json
src/app/(dev)/design/rules/component-notes.ts
src/app/(dev)/design/rules/rules.generated.json
src/app/(dev)/design/sandbox/voice-guest/lines.ts
src/app/(dev)/design/sandbox/voice-guest/spec.ts
src/app/(guest)/u/[slug]/page.tsx
src/app/api/cron/purge/route.ts
src/app/api/guests/capture-email/route.ts
src/components/app/dashboard/events-row-list.tsx
src/components/app/dashboard/events-section.test.tsx
src/components/app/dashboard/events-section.tsx
src/components/app/dashboard/filter-chips.tsx
src/components/app/dashboard/trash-section.tsx
src/components/app/event-card.test.tsx
src/components/app/event-card.tsx
src/components/app/unsave-button.tsx
src/components/auth/account-door.test.tsx
src/components/auth/account-door.tsx
src/components/auth/confirm-email-dialog.test.tsx
src/components/auth/confirm-email-dialog.tsx
src/components/guest/claim-handle-prompt.test.tsx
src/components/guest/claim-handle-prompt.tsx
src/components/guest/enter-event-prompt.tsx
src/components/guest/event-experience.tsx
src/components/guest/follow-moment-card.tsx
src/components/guest/guest-header.test.tsx
src/components/guest/guest-header.tsx
src/components/guest/guest-name-menu.tsx
src/components/guest/guest-upload.test.tsx
src/components/guest/guest-upload.tsx
src/components/guest/live-gallery.tsx
src/components/guest/save-account-prompt.test.tsx
src/components/guest/save-account-prompt.tsx
src/components/guest/save-event-button.test.tsx
src/components/guest/save-event-button.tsx
src/components/shared/claim-uploads-on-auth.tsx
src/components/shared/media-lightbox.tsx
src/components/shared/unverified-mark.test.tsx
src/components/shared/unverified-mark.tsx
src/components/social/attended-events-visibility.tsx
src/lib/constants/legal-privacy.tsx
src/lib/content/help-redirects.ts
src/lib/dashboard/events-view.test.ts
src/lib/dashboard/events-view.ts
src/lib/dashboard/guest-events.test.ts
src/lib/dashboard/guest-events.ts
src/lib/dashboard/layout.test.ts
src/lib/dashboard/layout.ts
src/lib/db/migration-guards.test.ts
src/lib/db/queries/claims.test.ts
src/lib/db/queries/claims.ts
src/lib/db/queries/guest-events-admin.ts
src/lib/db/queries/guest-gate.ts
src/lib/db/queries/saved-events.ts
src/lib/db/queries/social.guest-identity.test.ts
src/lib/db/queries/social.ts
src/lib/events/event-guests.test.ts
src/lib/events/event-guests.ts
src/lib/events/gallery-access.ts
src/lib/events/save-event.test.ts
src/lib/events/save-event.ts
src/lib/guest/album-return.ts
src/lib/guest/claim-uploads.test.tsx
src/lib/guest/claim-uploads.ts
src/lib/guest/delete-consequence.ts
src/lib/guest/entry-steps.test.ts
src/lib/guest/entry-steps.ts
src/lib/guest/session-tokens.test.ts
src/lib/guest/session-tokens.ts
src/lib/guest/use-confirm-return.test.tsx
src/lib/guest/use-confirm-return.ts
src/lib/saved-events/card.test.ts
src/lib/saved-events/card.ts
src/lib/social/public-profile-visibility.test.ts
supabase/migrations/20260923120000_guest_by_upload.sql
supabase/migrations/20260923130000_drop_saves.sql
```

**The items.**
- The expand file, `supabase/migrations/20260923120000_guest_by_upload.sql`: five bodies carried verbatim with ★ deltas, signatures and grants unchanged: a profile's "guest at" line follows the album's upload door (`get_public_profile`); own deletes close the gate (`get_upload_gate`); the claim card and Claim all skip a row with no live upload (`list_guest_rows_by_email`, `claim_guest_rows_by_email`); the token claim counts the claimed rows that carry a live upload (`claim_anonymous_uploads`).
- The contract file, `supabase/migrations/20260923130000_drop_saves.sql`: drops `save_event`, `get_saved_events`, `saved_events` and the dead `profile_hidden_events`, functions first, all `if exists`.
- Guards: `migration-guards.test.ts` (the gate's pin inverted; the list pin reshaped to accept `create or replace`; the `profile_hidden_events` keep-pin removed; a "guest by upload" block for every delta, the drop order and no revival) and a consent pin in `public-profile-visibility.test.ts`.
- The one count: `getEventGuests` (`social.ts`: two event-keyed, paged reads, `cache()`d per request) over the pure `resolveEventGuests`/`guestCount` (`src/lib/events/event-guests.ts`): approved uploaders, a confirmed guest once per person, a named unverified row once, never the host, never a nameless row. The hub's header and Guests card and the album's header all say "guests" from it; `getEventGuestList` is built on it.
- The events you added to: `getMyGuestEventCards` (admin client; the account's live uploads through one paged helper; not deleted, not hosted), masked by `guestEventCardProps` (`src/lib/dashboard/guest-events.ts`) and sorted by the latest upload; the dashboard's `guest` rows under the Show menu's "Guest" (a stored `saved` resolves to All events); `EventCard`'s `guest` variant with the shared `RoleMarker`; the rows' "Guest".
- Save removed: `SaveEventButton`, `CompletePendingSave`, `UnsaveButton`, `save-event.ts`, the saved query and card, the `UnverifiedMarkEvent` context, the name menu's `keep`/`eventId`, `layout.ts`'s dead `resolveDashboardLayout`, the unmounted `trash-section.tsx`, and their tests.
- The doors: `ConfirmEmailDialog` (`src/components/auth/confirm-email-dialog.tsx`), one object for the offer card, the Unverified mark and the name menu's Confirm your email and Sign in: the account door in `keep` or `signin`, the claim awaited, then the opener's own follow-through; the newsletter switch stays in the offer card's door.
- The return: every door writes `pr_pending_offer_<qr_token>` on open (`markPendingOffer`, the album held by `holdAlbum`, `src/lib/guest/album-return.ts`); `useConfirmReturn` claims at mount, this album's token first, plays the follow moment when the marker was there and this album's uploads moved (no upload needed this visit), and toasts only for other events.
- Never stranded: `contributionAnswered` (`entry-steps.ts`) lets the server's gate win once it has answered; on a require-upload event the lightbox's delete confirm for your last upload says the album closes until you add another, and the page refreshes to the door with its upload step.
- The Account page's "Events you added photos to"; the attended switches and covers re-check the proved identity and the owner's approved upload.
- Words: the save article becomes `find-your-uploads-and-events.mdx` (a redirect from the old slug), ten more articles, both AUTHORING files and the blog line; Privacy's "Likes, follows and blocks"; the PRD's participation principle; seven system docs.
- The Library's Guest specimen (`gallery-demos.tsx`) and `for` lines for the six new contract targets.

**Verified.** Both migrations, rolled back on 2026-09-23 against the shared database: the expand file applied in full, then its foot check (own deletes close the door while hidden and host-removed uploads keep it; the attended line admits host, passed and host-removed viewers and refuses anonymous, never-uploaded and self-removed ones, and opens with uploads closed or the switch off; the card and Claim all skip the empty row and leave it untouched; the token claim stamps both rows and counts only the one with a live upload; the grants), ending `ROLLED BACK — every guest-by-upload contract held` with the five after-apply md5s read inside that transaction, equal to the header's. The contract file applied on the expand's `get_public_profile`, ending `ROLLED BACK — every drop-saves contract held`. Read-only afterwards: the five live bodies still read their before-md5s, and all four save objects stand. Local, dev on :3132 in the Browser pane: the album header "57 photos & videos from 7 guests" on Gallery width (a SQL count said 7; the old count said 9); the name menu's Sign in and Confirm doors open the one dialog and write the marker, at 1440 and 375; `/u/willg`'s Host marker; the Library's Guest specimen; the voice board's keep door showing the shipped line; the demo header (see the calls).

**Not verified, the red-team's** (localhost cannot mint a session): every signed-in surface, listed under "Look at first".

**Assets requested from Will:** none.

**Proposed migrations (the Orchestrator's; no Worker, Vercel, Stripe or env change).**
1. `20260923120000_guest_by_upload.sql`, with this merge: the drift check (the before-md5s in its header) → apply verbatim → the same query reads the after-md5s in its header → `get_advisors` (expected delta none) → the rolled-back check at its foot. No type change.
2. `20260923130000_drop_saves.sql`, after alias build 2's red-team: step 0, the expand is applied; confirm the alias calls none of the four objects → apply → `get_advisors` (0029 goes 34 → 32) → the rolled-back check → regenerate `src/lib/db/types.ts`. Until a milestone ships this tree, partyreel.com's main build loses its dashboard (it throws via `get_saved_events`), its profile hide toggle and its Save buttons.

**For the Orchestrator's own files.**
- `legal.ts`: Privacy 1.5 → 1.6 (2026-09-23), a comment like "the guest-by-upload round: saved events are no longer kept; the list reads Likes, follows and blocks."
- ROADMAP closes: the follow moment after Google or a magic link (`:31`); `trash-section.tsx` (`:32`, and its half of `:155`); the profile's attended line following the album (`:33`); the hub's Guests card counting the named unverified (`:149`). Retarget `:174` (`stats.contributorCount` is `stats.guestCount`; the line stays open) and `:176` (Save's dialog is gone; the confirm door, `ConfirmEmailDialog`, is the centred Dialog beside `ExportDialog`).
- `touchpoints.ts:1181` (read-only to me): "Save" among AccountDoor's asks is now the confirm door (`keep`).
- `database-security.md` lists 0029 without `save_event`/`get_saved_events`, true from the contract's apply; between the two applies it is two ahead.
- storage-guard's pricing-sheet note in `component-notes.ts` is still yours; this lane left that block untouched, so it lands without a conflict.

**Calls his to overrule.**
- `claim_anonymous_uploads` returns the claimed rows that carry a live upload (the stamp itself unchanged), so "We added your uploads to your account." and the follow moment play only when an upload moved.
- The `save` wear is renamed `keep` (heading "Keep your photos"); its reason holds before an upload: "Confirm your email and every photo you add here stays in your account, with this event. Confirming makes a free account."
- The `like` wear promises no place: "Confirm your email and your likes stay in your account. Confirming makes a free account."
- One `ConfirmEmailDialog` for the three doors, still the centred Dialog each of them was.
- The album the mark's door writes its marker for comes from a module registry (`holdAlbum`, the `name-door.ts` shape), not a React context, so the mark needs no provider.
- The name menu's Sign in writes the marker too: a sign-in that carries this album's uploads plays the follow moment.
- With nothing uploaded this visit, the follow moment reads "They are in your account now, and this event came with them." (no number).
- On the album the toast plays only when a claim reached other events; the (app) layout keeps its own toast.
- The last-removal confirm adds "This is your last upload here, so the album closes until you add another.", and the page refreshes as soon as that removal lands.
- The Show menu says "Guest"; the Guest view's empty line is "Nothing here yet. Add a photo to someone else's album and it shows up here."
- A Guest card wears the profile's Guest marker top-right with no item count; in rows, "Guest" fills the right column and a private event shows a lock.
- The hub's Guests card reads "N guests" with the list on and "Turn on the list" with it off; the hub header reads "N guests".
- `list_guest_rows_by_email`'s pin was reshaped to accept `create or replace` rather than dropping and recreating the function, which keeps its ACL.
- The offer card's glyph is `MailCheck` (the bookmark belonged to Save).
- The demo's header reads "9 photos & videos" with no guests clause (the host never counts); seeding guest uploads brings the clause back (deferred).
- The dashboard article's billing line follows storage-guard: a Pro host's meter link reads "Change plan" and lists every Pro size; the portal keeps the card, invoices and cancelling.

**Look at first** (alias build 2, after the expand applies):
1. Signed in as a guest, add one photo to someone else's album: a Guest card on the dashboard (and under Show › Guest); delete it: the card leaves, and on the next load the album header and the hub's Guests card drop by one (the count needs an APPROVED upload, so use an event without review).
2. A require-upload event: add a photo, then delete your own last one: the confirm names the closing, and the door returns WITH its upload step; a host's removal of a guest's upload keeps the album open for them.
3. The return: signed out, add a photo under a typed name, tap Confirm your email, take Google (the account chooser), come back: the follow moment plays with no upload this visit, and no toast unless another event's uploads moved.
4. The hub counts a named unverified guest and never the host; the Guests room lists exactly that count.
5. `/account` reads "Events you added photos to"; on a require-upload event with uploads open, a profile's "guest at" line is hidden from a signed-in viewer who never uploaded there.
