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
- **A profile is public by existence:** claiming a handle is the consent act, and no `discoverable` flag exists. A
  handle buys a page, not invisibility: `profiles-section.tsx` and the help articles say so in one sentence, so they
  move with the guest list's membership.
- **Every event's guest list is always on,** with no host switch: every named guest who added photos is listed,
  confirmed or wearing the unverified mark, with no per-guest opt-in, and a person the host blocked from the event is
  on no list. A per-guest opt-in leaves lists near-empty, while attribution is already public by name on the same
  album. A guest who wants no linkage can decline to upload, and a host can turn off Require verified emails, which
  trades a confirmed identity for a marked name, never for no name. So the GDPR posture rests on legitimate interest
  over already-public attribution, not opt-in consent.
- **A guest's own profile publishes no event until chosen:** `profile_shown_events` is an opt-in (never backfilled,
  which would publish what must stay private until chosen), while the guest stays on each event's own list either
  way. Choosing is the cover picker (`attended-events-visibility.tsx`), in Account and in the setup wizard, whose Show
  all and Keep all private apply once, to the events she has at Finish: later ones start private.
- **Follows are open any-to-any, and the graph is owner-private:** lists and counts render only to their owner,
  `get_public_profile` returns no follow data, and no public count exists. Blocking is mutual severance, private, and
  prevents a re-follow.

## Who is listed and counted

- **One count, one list** (`queries/social.ts`, on the admin client). `getEventGuests` answers who is a guest, by
  [guest-flow.md](guest-flow.md)'s definition (`lib/events/event-guests.ts` turns rows into people). It reads keyed on
  `event_id` and paged past the row cap, never an `.in()` of guest ids (that URL grows with the party). The hub's
  Guests card and header and the album's header count it; `getEventGuestList` lists it. ★ The rows a block holds
  (`event_blocked_guest_ids`) leave before the rows become people, so a blocked person is in no count and on no list,
  even with a photograph the host restored. Every caller runs these AFTER its own access gate (the host: ownership;
  the album: full access, never demo).
- **Profile cards hydrate by an explicit id list** (the PGRST201 landmine:
  [database-security.md](database-security.md)) through `inChunks`, selecting exactly the card's columns (the row also
  holds the account's email). Nothing in `queries/social.ts` reads an address, and its outputs are pinned
  address-free; only the host's Guests room shows a confirmed guest's address ([guest-flow.md](guest-flow.md)).
- **Every card paints its person's colour** from `seedFor(card.id)` (`withAvatarUrls`), never a raw id
  ([auth-accounts.md](auth-accounts.md) holds the rule).
- ★ **A name-only guest is painted too, in the colour of her own guest row**: `seedFor(guests.id)`, hashed on the server
  like every seed and never her name (nobody can choose a colour by typing one, and two guests who type "Sam" are two
  colours). It reaches every place she is drawn through the one hash: the list's unverified entries
  (`splitGuestList`) and their look, the credit (`faceOwner: { kind: "row" }`, `uploader-faces.ts`, no read), At the
  door for a newcomer with no account, the Blocked list, and her own header's disc, which asks the server because her
  browser holds her ticket and never the row's id (`/api/guests/mine`'s `seed`, `lib/avatar/ticket-seed.server.ts`).
  The disc keeps the answer per ticket (`pr_guest_seed_<album>` in `localStorage`, `guest-header.tsx`): the value is a
  hash of the ticket beside the colour, never the ticket, so a later load paints it at once and asks nothing, and a
  phone handed to the next guest, with a new ticket, finds no entry of its own and never wears the last guest's colour.
  A first load holds the disc back (its place kept) and fades it in already coloured, plain only where no answer comes
  within 2 s, rather than flashing it plain first.
  No raw id reaches a browser that did not already hold it: the entry's row id already rode the list, and the hash is
  all that is new. A colour is never a claim: no photograph, no door, and the Unverified mark still stands beside her
  name; a blocked row keeps the plain disc on a guest's view like any blocked face.
  - **One colour per ticket.** A name-only guest returning on another device is a new row and so a new colour, which
    only an account cures.
  - **A claim switches the colour once.** When she confirms and claims, the row is proved (`verified_at`) and every
    surface turns to her account's colour, the rule for a proved person (`resolveUploaderIdentity`'s case 2, the
    guest list's cards, `ticketSeed`); it never switches back.
- **`getMyAttendedEvents`** (the picker's events) takes an approved upload on a PROVED row and deliberately ignores
  visibility and the album's viewer gates: the choice is the guest's own key, settable whatever the host chose. An
  event that blocked her keeps the tile it had, locked as a private album's (`blocked_events_for`), because the block
  moved her uploads to Deleted and a vanished tile would tell her what the door hides. `getMyAttendedEventPicks` masks
  each tile by the album's own rules (`guestEventCardProps`, as her dashboard's Guest card).

## The public profile

- **Attendance is not a capability grant.** The attended arm of `get_public_profile` returns no `qr_token` or
  `custom_slug`, and a line shows only with the owner's opt-in, no block holding the owner or the viewer there (a
  blocked viewer also reads a host's event as private), `visibility = 'open'`, a PROVED identity
  (`guests.verified_at`; a name-only or pending-email row publishes nothing) and an approved upload, plus the album's
  own viewer gates. On a Require verified emails event only the host or a viewer with a confirmed email sees it,
  because the album holds anyone else at the teaser, which never renders its Guests list. ★ On a Require an upload to
  view event with uploads open, only the host or a signed-in viewer whose own row there holds an upload they did not
  remove sees it (`get_upload_gate`'s rule): stricter than the album in two corners, never looser (a full album opens
  while the line stays hidden, and a cookie-only uploader is not recognised, since the function sees `auth.uid()`,
  never a session token). The open-only gate is the consent scope: a locked page leaks a name and a count, nothing
  more. A choice survives the owner's last removal (the missing upload hides the line meanwhile).
  `public-profile-visibility.test.ts` pins it.
- **The hosted arm is deliberately ungated on visibility:** `display_in_profile` is the host publishing their own
  album link (discovery decoupled from access), and a gated event still meets its lock at `/e/`, so matching it to the
  attended arm would take away what the host chose to publish.
- **The attended covers re-prove their scope** (`getPublicProfileAttendedCoverUrls` checks `open`, the opt-in, the
  approved upload on a proved row and that no block holds the owner there again before presigning): a presign turns
  an id into someone else's photograph. The viewer's gate is the RPC's alone, inherited through the ids it returned.
- **Every card's cover is `event_covers`** (the newest approved, non-removed photo), the dashboard cards' rule.
- ★ **The owner mode's gate is the query, not the boolean.** Every owner read is `auth.uid()`-scoped and
  `owner-sections.tsx` takes no parameters at all, so if the page's `isSelf` check were ever wrong, the worst it could
  render is the VIEWER's own media on somebody else's page; `owner-mode.test.ts` pins the empty signature. The
  sections (your uploads, your likes, the people you follow, never your followers) stream behind their own in-page
  `<Suspense>`, and a visitor's render runs none of their queries. The two feeds page on a keyset through a Server
  Function that takes a cursor and nothing else (`feed-actions.ts`), so Show more too pages only the caller's own. A
  like count is the host's alone and appears on no profile.
- **`/me` is her page before it is public** (`(app)/me`): the public page's own head (`u/[slug]/profile-head.tsx`: her
  photo, name and joined month, no handle) marked "Only you can see this page.", then the standing invitation (no Not
  now) and the same `OwnerSections`, in the app shell behind the sign-in gate and the name gate (`name-gate.test.ts`
  holds every (app) route to one). Going public changes who sees the page, never what it is. It names nobody (no
  segment, no param), so there is no `isSelf` to get wrong, and `owner-mode.test.ts` reads it beside the profile. Once
  a handle exists it redirects to `/u/<handle>`, a real 307, so it has no `loading.tsx` either (a stream would start
  before the redirect), and it is noindex. The line that marks the private half ("Only you can see the sections
  below.") is the public page's (`OwnerNote`), not the sections': `/me`'s head already says the whole page is hers.
- **An empty page says how many events it keeps private** (`private_event_count`): the attended arm's predicate with
  only the owner's choice inverted, so a viewer counts only what she could confirm (a Require-an-upload-to-view album
  she has not passed stays out). The RPC returns it only while the page shows nothing; `profile.private-count.test.ts`
  holds the two predicates equal.
- **`/u/[slug]` has no `loading.tsx`:** a loading file wraps the route in Suspense, so Next flushes its skeleton
  before the page runs and a dead handle would paint it before its not-found. The page draws its not-found at the
  top, at 200 and noindex (a soft 404: marketing-content.md, "The 404 pages"), and only the card grid and the owner
  mode stream behind their own boundaries (`owner-mode.test.ts` refuses the file).

## Handles, bios, reports, blocks, preferences

- **A page is set up once, at `/account/profile`**: the handle, then name and photo, then which events show. Set up
  means a claimed handle, and Finish writes her choices before it claims the handle (the page's existence), so an
  abandoned setup leaves nothing public. Where setup lives and when the app invites it (`shouldInviteToPage`) is
  `account/profile/invite.ts`.
- **`profiles.slug` is service-role-write-only;** its format is a CHECK (lowercase, 3 to 30 of `[a-z0-9-]`, no edge
  hyphen) plus a PLAIN partial unique index, since the CHECK already forces lowercase and the RPC's
  `slug = lower(trim(input))` can use only a plain index. The handle is free on every tier, and `profileSlugSchema` is
  its only reserved-word gate: both reserved lists and the brand's whole family ([host-app.md](host-app.md)).
  `checkProfileSlugAction` requires `getUser()` (no anon availability check, so it stays off the enumeration surface).
- **`profiles.bio` is the same write class:** one line, at most 160 (mirrored by the `profiles_bio_len` CHECK), no
  links or bare domains, empty becomes null, and `containsProfanity` runs server-side in the action.
- **A person can be reported** (`reports.profile_id`, under a CHECK that one subject is set): signed in,
  rate-limited per profile, no reporter stored; a report never blocks, hides or tells
  ([admin-observability.md](admin-observability.md)).
- **A person's block shapes the follow graph only,** never profile reads (the viewer may be anonymous). `follow_user`
  is block-silent, for privacy, and the `enforce_follow_not_blocked` trigger (DEFINER, since owner RLS cannot see
  "they blocked me") is the hard backstop; a block severs both directions atomically. The block menu stays visible
  even when they blocked me (a vanishing menu would leak the block); only the follow button hides. ★ **Follow is offered
  nowhere a block stands either way,** since the write answers ok and nothing lands, and the button would read Following
  over nothing: the album's guest list asks `getBlockedAmong` (the viewer's own relations, a yes or no for the names it
  already holds, never which side blocked and never an id it did not ask about) and Connections' Blocked rows carry
  `followBarred`, so an Unblock offers a Follow only where one could land. Where Follow stood
  on a page she blocked, a quiet well says so on every visit, with Unblock beside it (`u/[slug]/blocked-well.tsx`):
  drawn for `hasBlocked` alone, her own block, and never when only they blocked her. Every face of a follow or a
  block is one control (`relation-toggle.tsx`), whose Server Functions revalidate every profile and Account, so no
  face refreshes by hand; a flip that never answers (offline) is a refusal with a toast, not a trip to the error
  boundary.
- ★ **Account's Connections ignore the server's re-render by design** (`account/page-connections.tsx`, an island): a
  row she turns off stays, turned back (Follow on an unfollowed row, Block on an unblocked one), until she leaves
  Account, so the lists are read once from props and kept by the island, one answer per person for every control that
  shows it (a row's button, the look's Follow). Deriving them from props after mount would take the row out from
  under her again. A name opens `GuestPeek` (never a second card), whose Follow is offered only where the row's own
  action is not the Follow, she does not block them and they have not blocked her (`followBarred`); a follow from it
  joins Following, and a block that lands takes the person's Following row (it severs the follow).
- **Email preferences follow the consent tiers:** transactional mail always sends and has no column by design;
  relationship and service mail default on with a per-category opt-out, for account holders only (a guest without an
  account receives none of it); marketing stays explicit opt-in. Every send resolves them through
  `resolveNotificationPrefs`. A switch exists only for a mail that sends, such as Event Pass reminders
  (`notify_pass_renewal`, the renewal nudge), so none promises a choice nothing honours. Rows are lazy (absent means
  `NOTIFICATION_PREF_DEFAULTS`; a parity test pins TypeScript to SQL), and `user_id` is insertable, never updatable,
  so `setNotificationPrefs` updates then inserts (a PostgREST upsert would `SET user_id`).
- **The event settings' `ProfileSocialCard` sits outside the settings form:** its one switch (Show on my profile) is
  its own consented act, saved the moment it flips.
