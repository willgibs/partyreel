# Profiles & social

Open this before you:
- change who is listed or counted as a guest, anywhere;
- touch a public profile, `/u/[slug]`, or its owner mode;
- touch follows, blocks or reporting a person;
- touch handles, bios or email preferences.

Elsewhere: who counts as a guest ([guest-flow.md](guest-flow.md) holds the definition), avatars and display names
([auth-accounts.md](auth-accounts.md)), the grants and RPC classes ([database-security.md](database-security.md)).

## The consent model

A one-way door; `/privacy` and the Terms word it, so a change here changes them too.
- **A profile is public by existence:** claiming a handle is the consent act, and no `discoverable` flag exists. The
  marketing promise matches: a handle buys a page, not invisibility (`profiles-section.tsx` and two help articles say
  the same sentence, so all three move with the guest list's membership).
- **The event's guest list has one key, the host's** (`events.show_guest_list`): when on, every named guest who added
  photos is listed, confirmed or wearing the unverified mark, with no per-guest opt-in. A per-guest opt-in leaves lists
  near-empty (a disappointed host, a starved social side, one more thing for a new guest to read before uploading),
  while attribution is already public by name on the same album. A guest who wants no linkage can decline to upload,
  and a host can turn off Require verified emails, which trades a confirmed identity for a marked name, never for no
  name. So the GDPR posture rests on legitimate interest over already-public attribution, not opt-in consent.
- **A guest's own profile publishes nothing until chosen:** `profile_shown_events` is an opt-in (never backfilled,
  which would publish what must stay private until chosen), while the guest stays on each event's own list, the
  host's key, either way. A person is on a list, a count or a profile line only through an approved upload of theirs.
- **Follows are open any-to-any, and the graph is owner-private:** lists and counts render only to their owner (as on
  VSCO), `get_public_profile` returns no follow data, and no public count exists. Blocking is mutual severance,
  private, and prevents a re-follow.

## Who is listed and counted

- **One count, one list** (`queries/social.ts`, on the admin client). `getEventGuests` answers who is a guest:
  approved uploaders; a PROVED identity once per person, keyed on `verified_at`, never on `user_id` alone; a named
  unverified row once per row; never the host, never a nameless row. It reads twice, keyed on `event_id` and paged past
  the row cap, never an `.in()` of guest ids (that URL grows with the party). The hub's Guests card and header and the
  album's header count it; `getEventGuestList` lists it (null when `show_guest_list` is off). Every caller runs these
  AFTER its own access gate (the host: ownership; the album: full access, never demo).
- **Profile cards hydrate by an explicit id list** (the PGRST201 landmine: [database-security.md](database-security.md)) through `inChunks`,
  selecting exactly the four card columns (the row also holds the account's email). Nothing in `queries/social.ts`
  reads an address, and its outputs are pinned address-free; only the host's Guests room shows a confirmed guest's
  address ([guest-flow.md](guest-flow.md)).
- **Every card paints its person's colour** from `seedFor(card.id)` (`withAvatarUrls`), a server-side hash, so one
  person is one colour everywhere and no raw id reaches a browser ([auth-accounts.md](auth-accounts.md)).
- **`getMyAttendedEvents`** (the account page's show-on-profile switches) takes an approved upload on a PROVED row and
  deliberately ignores `show_guest_list`, visibility and the album's viewer gates: the switch is the guest's own key,
  settable whatever the host chose.

## The public profile

- **Attendance is not a capability grant.** The attended arm of `get_public_profile` returns no `qr_token` or
  `custom_slug`, and a line shows only with `show_guest_list` on, the owner's opt-in, `visibility = 'open'`, a PROVED
  identity (`guests.verified_at`; a name-only or pending-email row publishes nothing) and an approved upload, plus the
  album's own viewer gates. On a Require verified emails event only the host or a viewer with a confirmed email sees
  it, because the album holds anyone else at the teaser, which never renders its Guests list. ★ On a Require an upload
  to view event with uploads open, only the host or a signed-in viewer whose own row there holds an upload they did not
  remove sees it (`get_upload_gate`'s rule): stricter than the album in two corners, never looser (a full album opens
  while the line stays hidden, and a cookie-only uploader is not recognised, since the function sees `auth.uid()`,
  never a session token). The open-only gate is the consent scope: a locked page leaks a name and a count, nothing
  more. A choice survives the owner's last removal (the missing upload hides the line meanwhile).
  `public-profile-visibility.test.ts` pins it.
- **The hosted arm is deliberately ungated on visibility:** `display_in_profile` is the host publishing their own album
  link (discovery decoupled from access), and a gated event still meets its lock at `/e/`. Matching it to the attended
  arm would be a regression.
- **The attended covers re-prove their scope** (`getPublicProfileAttendedCoverUrls` checks `show_guest_list`,
  `open`, the opt-in and the approved upload on a proved row again before presigning): a presign turns an id into
  someone else's photograph. The viewer's gate is the RPC's alone, inherited through the ids it returned.
- **Every card's cover is `event_covers`:** the newest approved, non-removed photo, as a small preview where one
  exists, the same rule as the dashboard's cards.
- ★ **The owner mode's gate is the query, not the boolean.** Every owner read is `auth.uid()`-scoped and
  `owner-sections.tsx` takes no parameters at all, so if the page's `isSelf` check were ever wrong, the worst it could
  render is the VIEWER's own media on somebody else's page; `owner-mode.test.ts` pins the empty signature. The
  sections (your uploads, your likes, the people you follow, never your followers) stream behind their own in-page
  `<Suspense>`, and a visitor's render runs none of their queries. A like count is the host's alone and appears on no
  profile.
- ★ **`/u/[slug]` never gets a `loading.tsx`.** A loading file wraps the route in Suspense, so Next flushes the shell
  before the page runs and a dead handle answers 200 instead of 404 (throwing from `generateMetadata` does not help).
  The page decides the 404 at the top and streams only the card grid.

## Handles, bios, reports, blocks, preferences

- **`profiles.slug` is service-role-write-only;** its format is a CHECK (lowercase, 3 to 30 of `[a-z0-9-]`, no edge
  hyphen) plus a PLAIN partial unique index, since the CHECK already forces lowercase and the RPC's
  `slug = lower(trim(input))` can use only a plain index. The handle is free on every tier; custom EVENT slugs are the
  paid ones. `checkProfileSlugAction` requires `getUser()` (no anon availability check, so it stays off the
  enumeration surface).
- **`profiles.bio` is the same write class:** one line, at most 160 (mirrored by the `profiles_bio_len` CHECK), no
  links or bare domains, empty becomes null, and `containsProfanity` runs server-side in the action.
- **A person can be reported** (`reports.profile_id`, under a CHECK that one subject is set): signed in, rate-limited
  per profile, no reporter stored; a report never blocks, hides or tells ([admin-observability.md](admin-observability.md)).
- **Blocks shape the follow graph only,** never profile reads (the viewer may be anonymous). `follow_user` is
  block-silent, for privacy, and the `enforce_follow_not_blocked` trigger (DEFINER, since owner RLS cannot see "they
  blocked me") is the hard backstop; a block severs both directions atomically. The block menu stays visible even when
  they blocked me (a vanishing menu would leak the block); only the follow button hides.
- **Email preferences follow the consent tiers:** transactional mail always sends and has no column by design;
  relationship and service mail default on with a per-category opt-out, for account holders only (a guest without an
  account receives none of it); marketing stays explicit opt-in. Every send resolves them through
  `resolveNotificationPrefs`. Rows are lazy (absent means `NOTIFICATION_PREF_DEFAULTS`; a parity test pins TypeScript
  to SQL), and `user_id` is insertable, never updatable, so `setNotificationPrefs` updates then inserts (a PostgREST
  upsert would `SET user_id`). No send path reads them.
- **The event settings' `ProfileSocialCard` sits outside the settings form:** each switch is its own consented act,
  saved the moment it flips.
