# Profiles & social

> ROLE: the profiles + social layer — public creator profiles (`/u/[slug]`), the follow/block graph, the host-controlled guest list, notification-pref storage.
> BELONGS HERE: the slug/handle system, `display_in_profile`/`show_guest_list`, follows/blocks + their RPCs, the guest-list surfaces, `notification_prefs`' shape. · NOT HERE: the cross-cutting advisor/grant model (→ [database-security.md](database-security.md)), auth/avatars/display names (→ [auth-accounts.md](auth-accounts.md)).
> GROWS BY: integrate-in-place.

## What it does

The model: profiles are **public by existence** (claiming a handle is the consent act; NO `discoverable`
flag); the event guest list is **host-controlled** (`events.show_guest_list`; when on, every named guest
who added photos is listed, a confirmed name or one wearing the small unverified mark, with no per-guest
opt-in); the guest's control lives on their **own profile**, which **publishes NOTHING UNTIL CHOSEN**:
`profile_shown_events` is an **opt-in**, so an attended event appears on `/u/[slug]` only once the guest
turns it on (the switches on `/account`'s Public profile card), while they stay on the event's own guest
list either way (the host's key, not theirs);
follows are **open any-to-any with an owner-private graph** (lists + counts visible only to the account
owner, the VSCO shape); **blocking** is mutual severance, private, and prevents re-follow.

**Why the guest list has ONE key, not two:** a per-guest opt-in leaves lists near-empty (a disappointed
host, a starved social side, one more thing for a new guest to digest before uploading). Attribution is
ALREADY public by name on the same album, so one list of the uploaders adds little exposure the captions did
not. A guest who does not want the linkage can decline to upload, or the host can turn off Require verified
emails, which trades a confirmed identity for a marked unverified name, never for no name: the escape
hatches exist at the right layer. So the GDPR posture rests on legitimate interest over already-public
attribution rather than opt-in consent, and the `/privacy` and ToS wording is what has to hold up.

Surfaces: `/u/[slug]` (ONE grid of event cards, hosted and attended together with a Host or Guest
marker on each, the person's bio under the name row, indexable, on the album's own `GuestHeader` in
its event-less mode, plus the OWNER MODE below); the Account page (slug claim, bio, attended-event
visibility switches, Connections card); event settings (`ProfileSocialCard`, both keys persist per
flip, LOUD permanent consent copy on `show_guest_list`); the host's Guests room
(`/dashboard/[eventId]/guests`; the hub's Guests card counts only the proved profile cards, while the room
also lists the named unverified, so the two numbers can differ) and the guest album's post-gallery
"Guests" section; the dashboard's **claim card** (a confirmed caller's rows waiting under an email typed
before it was proved, claimed or released per event — see [host-app.md](host-app.md) "Dashboard landing").

**The owner mode.** When the viewer IS the person, `/u/[slug]` grows three PRIVATE sections under the
public grid ([`owner-sections.tsx`](../../src/app/(guest)/u/[slug]/owner-sections.tsx)): your uploads
(`get_my_uploads`, with the lightbox's delete-own through `remove_my_upload`), your likes
(`get_my_likes`, where the heart UNLIKES and drops the item), and Connections - **the people you
follow, never your followers**, since the graph stays owner-private. They live here, not on the
dashboard, which is a hosting surface. The per-event like COUNT is HOST-ONLY on the event's management
gallery and appears on no profile.
- ★ **The owner mode's gate is the QUERY, not the boolean.** Every read is `auth.uid()`-scoped, and the component
  **takes no parameters at all**, so there is no id it could be pointed at. If the page's `isSelf`
  check were ever wrong, the worst it could render is the VIEWER'S OWN media on somebody else's page,
  never the page owner's: on a public surface anonymous strangers read all day, only a gate that can
  fail safely will do. [owner-mode.test.ts](../../src/app/(guest)/u/[slug]/owner-mode.test.ts) pins the empty signature.
- The sections stream behind their **own in-page `<Suspense>`**, never a `loading.tsx` (see the gotcha
  below - a loading file would make a dead handle answer 200), and a visitor's render is unchanged:
  nothing is constructed and not one of the three queries runs.
- `removeMyUploadAction` revalidates `/dashboard` **and** `/u/[slug]`, since the delete-own it serves
  lives on the profile.

## Where it lives

- Schema: [`20260708120000_profiles_social_foundation.sql`](../../supabase/migrations/20260708120000_profiles_social_foundation.sql) — `profiles.slug`, `events.display_in_profile` + `events.show_guest_list`, `user_follows`, `user_blocks`, `notification_prefs`, `profile_hidden_events`, the `follow_user`/`block_user`/`get_public_profile` RPCs, the `enforce_follow_not_blocked` trigger; its header holds the rolled-back contract check + the expected advisor delta. [`20260922122000_profile_shown_events.sql`](../../supabase/migrations/20260922122000_profile_shown_events.sql) — `profile_shown_events` (the opt-in that replaced `profile_hidden_events` in `get_public_profile`'s attended arm; deliberately NO backfill, which would publish what must stay private until chosen) and the `verified_at` belt. [`20260922200000_identity_sql_gaps.sql`](../../supabase/migrations/20260922200000_identity_sql_gaps.sql) — the newest `get_public_profile` (the attended arm's confirmed-viewer gate). `profile_hidden_events` stays on disk: this tree neither reads nor writes it, but the deployed `main` build still reads it and writes it through the Account hide toggle, so `migration-guards.test.ts` refuses a migration that drops it until a milestone ships this tree.
- Data layer: [`src/lib/db/queries/social.ts`](../../src/lib/db/queries/social.ts) + [`src/lib/db/mutations/social.ts`](../../src/lib/db/mutations/social.ts); pure logic in [`src/lib/social/`](../../src/lib/social) (notification-pref defaults/resolve, profile cards) + [`src/lib/validation/profile.ts`](../../src/lib/validation/profile.ts) (slug schema + reserved words).
- UI: [`src/components/social/`](../../src/components/social) (guest list, follow button, report/block menu, slug control, bio form, visibility switches, connections) + [`profile-social-card.tsx`](../../src/components/app/event-settings/profile-social-card.tsx); routes `src/app/(guest)/u/[slug]/` and the Account/event-settings/Guests-room integrations.

## Invariants (don't revert)

- **`profiles.slug` is service-role-write-only** (outside the authenticated column grant); format is a
  DB CHECK (lowercase 3-30 `[a-z0-9-]`, no edge hyphen) + a PLAIN partial unique index (the CHECK
  already forces lowercase, and the RPC's `slug = lower(trim(input))` predicate can only use a plain
  index, not a `lower()` expression index). **The handle is FREE for everyone**: no tier check in
  `setProfileSlug`, no locked branch in the control. Custom EVENT slugs stay paid (any paid tier:
  `GATED_EVENT_SETTINGS`, `isSettingLocked`); do not confuse the two.
- **`profiles.bio` is the same write class**: service-role only, never in the authenticated grant, so
  the account action is its only writer and a PostgREST PATCH cannot skip the rules. `bioSchema`
  (validation/profile.ts) collapses it to one line, caps it at 160 (mirrored by the
  `profiles_bio_len` CHECK), refuses links and bare domains, and empties to null;
  `containsProfanity` runs server-side in the action, exactly as the display name's does.
  `get_public_profile` returns it.
- **The graph is owner-private.** `get_public_profile` returns no follow data; follower/following lists
  and counts render only to the owner (Connections card). Never add public counts.
- **Attendance is not a capability grant.** The attended arm returns NO `qr_token`/`custom_slug`, and is
  gated on `show_guest_list` + `profile_shown_events` (the guest's own opt-in) + **`visibility = 'open'`**
  + a **PROVED identity** (`guests.verified_at is not null`: a name-only or pending-email row publishes
  nothing, chosen or not) + an approved upload + **the album's own viewer gate**: on a Require verified
  emails event only the event's host or a viewer with a CONFIRMED email (`auth.users.email_confirmed_at`,
  the page's `isAuthed`) sees the line, because the album holds anyone else, anonymous or an unconfirmed
  sign-up, at the teaser, which never renders its Guests list. The anonymous-viewer clause beside it
  still reads the legacy `allow_anonymous_uploads` (kept in sync by the `events_sync_verified_email_flags`
  trigger); the gate implies it, so dropping the column deletes that clause.
  The open-only gate is the consent scope (the album-side list renders only to viewers who can OPEN the
  album, preserving "locked pages leak name + count only"). A migration-text Vitest guard
  ([public-profile-visibility.test.ts](../../src/lib/social/public-profile-visibility.test.ts)) pins it.
- **The hosted arm is deliberately UNgated on visibility**: `display_in_profile` is the host publishing
  their OWN album link (link-in-bio; discovery decoupled from access) and includes the link; a gated
  event still hits its lock at `/e/`. Don't "fix" it to match the attended arm.
- **One guest-list read** (`getEventGuestList`, admin client): every caller runs it AFTER its own access
  gate (host = ownership: the hub and the Guests room; guest album = `access === "full"`, never demo), and
  it returns null when `show_guest_list` is off. Profile cards cover approved uploaders with a PROVED
  identity (keyed on `verified_at`, never on `user_id` alone, so an unconfirmed sign-up never passes as a
  proven person), deduped by user; `includeUnverified` (the Guests room and the guest album) appends named
  unverified guest rows, one per row. Explicit id-list joins (the PGRST201 embed landmine), no `select(*)`
  on media. `GuestList` draws chips at or under `GUEST_LIST_FACES_THRESHOLD` (12) and a row of six faces
  plus "N guests added photos" above it, expanding in place 24 at a time (a stand-in until the View-all
  design lands); since that row says the count, the album drops its heading pill above the threshold.
- **Every `ProfileCardItem` carries a colour, not just an avatar URL.** `withAvatarUrls`
  ([`lib/social/cards.ts`](../../src/lib/social/cards.ts)) hydrates `seed: seedFor(card.id)`
  (`src/lib/avatar/seed.ts`, a server-side SHA-256) alongside `avatarUrl`, so every card surface (the
  guest list, the owner mode's Connections, the account page's Following/Blocked rows) paints the same
  per-person colour through `Avatar`'s `seed` prop, never from the raw id. The avatar system is
  [auth-accounts.md](auth-accounts.md)'s.
- **The attended arm's covers re-prove their own scope.** `getPublicProfileAttendedCoverUrls` takes
  ids the RPC already gated and checks `show_guest_list` + `visibility = 'open'` + the owner's own
  opt-in (`profile_shown_events`) again before presigning: a presign turns an id into someone else's
  photograph, so it proves the scope rather than inheriting it from a payload. The VIEWER's gate is the
  RPC's alone (the cover read takes no viewer), so the covers inherit it through the ids it returned.
- **A person can be reported** (`reports.profile_id`; `event_id` is nullable under a CHECK that one
  subject is set). The menu on `/u/[slug]` holds Report this person and Block; the route arm is SIGNED IN
  (`getUser()`, no capability token exists for a profile) and rate-limited per profile, the write is
  service-role over the deny-all table, and `/admin/reports` renders a People section above the album
  queue. No reporter is stored. Reporting never blocks, never hides and never tells the reported person
  who reported them.
- **Blocks shape the follow graph only** (not profile reads — the viewer may be anonymous). The
  `follow_user` RPC is block-silent (privacy) AND `enforce_follow_not_blocked` (BEFORE INSERT,
  SECURITY DEFINER — owner-RLS can't see "they blocked me") is the hard backstop; a block severs both
  directions atomically. The block menu stays visible even when they blocked me (a vanishing menu would
  leak the block); only the follow button hides on either-way blocks.
- **`notification_prefs`** is shaped by the consent tiers: **transactional** always sends and has
  NO column by design; **relationship and service** mail defaults ON with a per-category opt-out, and only
  for ACCOUNT holders; a guest without an account (a typed name, and at most an unconfirmed address that is
  never mailed on its own) receives none of it; **marketing** stays explicit opt-in. Every send must stay within those four rules, resolving
  prefs through `resolveNotificationPrefs`. Rows are lazy (absent = `NOTIFICATION_PREF_DEFAULTS`, a parity
  test pins TS↔SQL); `user_id` is insertable never updatable, so `setNotificationPrefs` is
  update-then-insert (a PostgREST upsert would `SET user_id`). The `/account` Email preferences card edits
  them; no send path reads them yet.
- `follow_user`/`block_user` are authenticated-only (advisor 0029, never 0028); `get_public_profile` is
  one of the five accepted anon-read RPCs (0028). Inventory: [database-security.md](database-security.md).

## Gotchas

- `getMyAttendedEvents` (the Account show-toggles list) deliberately ignores `show_guest_list` AND
  visibility: the toggle is the guest's own key and must be settable whether or not the host has
  turned theirs on at all.
- The dashboard has no Following section: a lens on other people's events is not a hosting job. The
  owner mode's Connections lists PEOPLE (`getMyFollowing`), not their events; `getFollowedHostEventCards`
  in `queries/social.ts` has no caller.
- `checkProfileSlugAction` requires `getUser()` (no anon RPC for profile-slug availability — keeps it
  off the anonymous enumeration surface; it reveals only what a save's 23505 already would).
- ★ **`/u/[slug]` must never get a `loading.tsx`.** A loading file wraps the route in Suspense, so
  Next flushes the shell before the page runs and a dead handle answers 200 instead of 404 (in dev and
  under `next start` alike, while `/e/<bad token>` next door answers 404). Throwing from
  `generateMetadata` does not help either. The page decides the 404 at the top and streams only the
  card grid, behind its own in-page `<Suspense>`.
- The handle is offered right after an upload lands: `ClaimHandlePrompt` owns the post-upload slot
  and renders ONE card by state (signed out = the save-account offer; just confirmed = the follow moment,
  with the handle line folded in; signed in without a handle = the claim line; signed in with one =
  nothing), with a per-event dismissal. Its door is `/account#public-profile`, the id on the Public
  profile card.
- The marketing promise matches the product: a handle buys a PAGE, not invisibility.
  `profiles-section.tsx` and the two help articles say the same sentence; if the guest list's membership
  ever changes, all three move together.
- The event-settings `ProfileSocialCard` lives OUTSIDE the RHF form (each key flip is its own consented
  act, persisted instantly) and hides entirely when `getEventSocialSettings` returns null.

Related: [auth-accounts.md](auth-accounts.md) · [guest-flow.md](guest-flow.md) · [database-security.md](database-security.md).
