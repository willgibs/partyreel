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
- **Every event's guest list is always on** (Will, `room=always`: no host turns it on or learns special handling,
  and no switch exists): every named guest who
  added photos is listed, confirmed or wearing the unverified mark, with no per-guest opt-in, and a person the host
  blocked from the event is on no list. A per-guest opt-in leaves lists
  near-empty (a disappointed host, a starved social side, one more thing for a new guest to read before uploading),
  while attribution is already public by name on the same album. A guest who wants no linkage can decline to upload,
  and a host can turn off Require verified emails, which trades a confirmed identity for a marked name, never for no
  name. So the GDPR posture rests on legitimate interest over already-public attribution, not opt-in consent.
- **A guest's own profile publishes no event until chosen:** `profile_shown_events` is an opt-in (never backfilled,
  which would publish what must stay private until chosen), while the guest stays on each event's own list either
  way. An empty page says only how many it keeps private, of the events the visitor could already see her on through
  that list (The public profile, below). A person is on a list, a count or a profile line only through an approved upload of theirs.
  Choosing is one control, the cover picker (`attended-events-visibility.tsx`), in Account and in the setup wizard;
  the wizard's Show all / Keep all private applies once, to the events she has at Finish, and later ones start private.
- **Follows are open any-to-any, and the graph is owner-private:** lists and counts render only to their owner (as on
  VSCO), `get_public_profile` returns no follow data, and no public count exists. Blocking is mutual severance,
  private, and prevents a re-follow.

## Who is listed and counted

- **One count, one list** (`queries/social.ts`, on the admin client). `getEventGuests` answers who is a guest:
  approved uploaders; a PROVED identity once per person, keyed on `verified_at`, never on `user_id` alone; a named
  unverified row once per row; never the host, never a nameless row. It reads twice, keyed on `event_id` and paged past
  the row cap, never an `.in()` of guest ids (that URL grows with the party). The hub's Guests card and header and the
  album's header count it; `getEventGuestList` lists it. ★ The rows a block holds (`event_blocked_guest_ids`) leave
  before the rows become people, so a blocked person is in no count and on no list, even with a photograph the host
  restored. Every caller runs these AFTER its own access gate (the host: ownership; the album: full access, never
  demo).
- **Profile cards hydrate by an explicit id list** (the PGRST201 landmine: [database-security.md](database-security.md)) through `inChunks`,
  selecting exactly the four card columns (the row also holds the account's email). Nothing in `queries/social.ts`
  reads an address, and its outputs are pinned address-free; only the host's Guests room shows a confirmed guest's
  address ([guest-flow.md](guest-flow.md)).
- **Every card paints its person's colour** from `seedFor(card.id)` (`withAvatarUrls`), a server-side hash, so one
  person is one colour everywhere and no raw id reaches a browser ([auth-accounts.md](auth-accounts.md)).
- **`getMyAttendedEvents`** (the picker's events) takes an approved upload on a PROVED row and deliberately ignores
  visibility and the album's viewer gates: the choice is the guest's own key, settable whatever the host chose. An
  event that blocked her keeps the tile it had, locked as a private album's (`blocked_events_for`), because the block
  moved her uploads to Deleted and a vanished tile would tell her what the door hides. `getMyAttendedEventPicks` masks each tile by the album's own rules through `guestEventCardProps`, as her
  dashboard's Guest card is: an open album's cover, a password album's name with no cover, a private album neither;
  a tile chosen at an album that is not open says it cannot show (`albumOpen`), since only an open album's line
  reaches the page.

## The public profile

- **Attendance is not a capability grant.** The attended arm of `get_public_profile` returns no `qr_token` or
  `custom_slug`, and a line shows only with the owner's opt-in, no block holding the owner or the viewer there (a
  blocked viewer also reads a host's event as private), `visibility = 'open'`, a PROVED
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
- **The attended covers re-prove their scope** (`getPublicProfileAttendedCoverUrls` checks `open`, the opt-in, the
  approved upload on a proved row and that no block holds the owner there again before presigning): a presign turns an id into
  someone else's photograph. The viewer's gate is the RPC's alone, inherited through the ids it returned.
- **Every card's cover is `event_covers`:** the newest approved, non-removed photo, as a small preview where one
  exists, the same rule as the dashboard's cards. ★ An attended card has no link, never a lock: one whose gates all
  held with no photograph is a party of video alone and wears that face (`EventCard`'s `empty`), where the lock read
  off its missing link told visitors an open album was closed.
- ★ **The owner mode's gate is the query, not the boolean.** Every owner read is `auth.uid()`-scoped and
  `owner-sections.tsx` takes no parameters at all, so if the page's `isSelf` check were ever wrong, the worst it could
  render is the VIEWER's own media on somebody else's page; `owner-mode.test.ts` pins the empty signature. The
  sections (your uploads, your likes, the people you follow, never your followers) stream behind their own in-page
  `<Suspense>`, and a visitor's render runs none of their queries. The two feeds page 200 at a time on a keyset
  (`get_my_uploads` on `(created_at, id)`, `get_my_likes` on `(liked_at, media_id)`), a Show more through a Server
  Function that takes a cursor and nothing else (`feed-actions.ts`), so it too pages only the caller's own. ★ A delete
  or an unlike leaves every page she was shown, the first one too, at once and for good on the page's own word
  (`my-feed-more.tsx`'s `drop`), never on the action's revalidation: the viewer's close writes the address just
  before its Delete, and Next commits that write over the answer, so the old first page stands until the next router
  action. A like count is the host's alone and appears on no profile.
- **`/me` is the owner mode for an account with no handle** (`(app)/me`): the same `OwnerSections`, in the app shell
  behind the sign-in gate and the name gate (`name-gate.test.ts` holds every (app) route to one). It names nobody (no
  segment, no param), so there is no `isSelf` to get wrong, and `owner-mode.test.ts` reads it beside the profile. Its
  head is the setup's invitation with no Not now, since it is the user menu's only profile door for an account without a
  handle; the dashboard's card points at the setup directly, not through it. Once a handle exists it redirects to
  `/u/<handle>`, a real 307, so it has no `loading.tsx` either, and it is noindex.
- **An empty page says how many events it keeps private** ("2 private events", `private_event_count`, migration
  20260927100000): the attended arm's predicate with only the owner's choice inverted, so a viewer counts only what
  she could confirm (a Require-an-upload-to-view album she has not passed stays out). The RPC returns it only while the
  page shows nothing, null otherwise, since the page reads it only then; `profile.private-count.test.ts` holds the two
  predicates equal.
- ★ **`/u/[slug]` never gets a `loading.tsx`.** A loading file wraps the route in Suspense, so Next flushes its
  skeleton before the page runs: a dead handle would paint it before its not-found. The page draws its not-found at
  the top, at 200 and noindex (a soft 404: marketing-content.md, "The 404 pages"), and only the card grid and the
  owner mode stream.

## Handles, bios, reports, blocks, preferences

- **A page is set up once, at `/account/profile`**: the handle, then name and photo, then which events show. Set up
  means a claimed handle, and Finish writes her choices before it claims the handle (the page's existence), so an
  abandoned setup leaves nothing public; a set-up account is sent to Account's card, which before a handle is the
  wizard's door, while event settings' claim line opens the setup itself and the user menu's handle-less Your profile
  opens `/me`, whose head is the same invitation. The dashboard invites the setup (`shouldInviteToPage`) once no claim
  waits, to an account with an event its page could show (which proves a confirmed address) and no handle; Not now is
  an httpOnly cookie holding the account's seed, per device.
- **`profiles.slug` is service-role-write-only;** its format is a CHECK (lowercase, 3 to 30 of `[a-z0-9-]`, no edge
  hyphen) plus a PLAIN partial unique index, since the CHECK already forces lowercase and the RPC's
  `slug = lower(trim(input))` can use only a plain index. The handle is free on every tier, and `profileSlugSchema` is
  its only reserved-word gate: both reserved lists and the brand's whole family ([host-app.md](host-app.md)).
  `checkProfileSlugAction` requires `getUser()` (no anon availability check, so it stays off the enumeration surface).
- **`profiles.bio` is the same write class:** one line, at most 160 (mirrored by the `profiles_bio_len` CHECK), no
  links or bare domains, empty becomes null, and `containsProfanity` runs server-side in the action.
- **A person can be reported** (`reports.profile_id`, under a CHECK that one subject is set): signed in, rate-limited
  per profile, no reporter stored; a report never blocks, hides or tells ([admin-observability.md](admin-observability.md)).
- **Blocks shape the follow graph only,** never profile reads (the viewer may be anonymous). `follow_user` is
  block-silent, for privacy, and the `enforce_follow_not_blocked` trigger (DEFINER, since owner RLS cannot see "they
  blocked me") is the hard backstop; a block severs both directions atomically. The block menu stays visible even when
  they blocked me (a vanishing menu would leak the block); only the follow button hides. Every face of a follow or a
  block (the profile's Follow, the quieter one by an album, the menu's row, Account's Connections) is one control on
  one contract (`relation-toggle.tsx`): it flips at once, a block asks first, and the four Server Functions revalidate
  every profile and Account, so the page re-reads in their own response and no face refreshes by hand.
- **Email preferences follow the consent tiers:** transactional mail always sends and has no column by design;
  relationship and service mail default on with a per-category opt-out, for account holders only (a guest without an
  account receives none of it); marketing stays explicit opt-in. Every send resolves them through
  `resolveNotificationPrefs`, and one send has a switch today: the renewal nudge, Event Pass reminders
  (`notify_pass_renewal`). The card draws only switches with a mail behind them, and the table holds no others. Rows
  are lazy (absent means `NOTIFICATION_PREF_DEFAULTS`; a parity test pins
  TypeScript to SQL), and `user_id` is insertable, never updatable, so `setNotificationPrefs` updates then inserts (a
  PostgREST upsert would `SET user_id`).
- **The event settings' `ProfileSocialCard` sits outside the settings form:** its one switch (Show on my profile) is
  its own consented act, saved the moment it flips.
