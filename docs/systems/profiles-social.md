# Profiles & social

> ROLE: the profiles + social layer — public creator profiles (`/u/[slug]`), the follow/block graph, the host-controlled guest list, notification-pref storage.
> BELONGS HERE: the slug/handle system, `display_in_profile`/`show_guest_list`, follows/blocks + their RPCs, the guest-list surfaces, `notification_prefs`' shape. · NOT HERE: the cross-cutting advisor/grant model (→ [database-security.md](database-security.md)), auth/avatars/display names (→ [auth-accounts.md](auth-accounts.md)).
> GROWS BY: integrate-in-place.

## What it does

The ruled model: profiles are **public by existence** (claiming a handle
is the consent act; NO `discoverable` flag); the event guest list is **host-controlled**
(`events.show_guest_list`; when on, ALL signed-in uploaders render named, no per-guest opt-in); the
guest's control lives on their **own profile** (`profile_hidden_events` hides an attended event from
`/u/[slug]` while they stay on the event's guest list); follows are **open any-to-any with an
owner-private graph** (lists + counts visible only to the account owner, the VSCO shape); **blocking
ships in-slice** (mutual severance, private, prevents re-follow).

**Why the guest list has ONE key, not two** (Will's ruling, and the part worth keeping): a per-guest
opt-in lands guest lists near-empty, which disappoints the host, starves the social side and adds one more
thing for a new guest to digest between signing up and uploading. Attribution is ALREADY public by name on
the same album surface, so gathering the uploaders into one list adds little exposure that the captions did
not. A guest who does not want the linkage can decline to upload, or the host can allow anonymous uploads:
the escape hatches already exist at the right layer. The consequence to carry: the GDPR posture rests on
legitimate interest over already-public attribution rather than on opt-in consent, so the `/privacy` and ToS
wording is what has to hold up, not a consent checkbox.

Surfaces: `/u/[slug]` (ONE grid of event cards, hosted and attended together with a Host or Guest
marker on each, the person's bio under the name row, indexable, on the album's own `GuestHeader` in
its event-less mode, plus the OWNER MODE below); the Account page (slug claim, bio, attended-event
visibility switches, Connections card); event settings (`ProfileSocialCard`, both keys persist per
flip, LOUD permanent consent copy on `show_guest_list`); the host feed's "Guests" section + pill and
the guest album's post-gallery "Guests" section.

**The owner mode** (`you=?`, Will 2026-09-20: "Your own photos, likes, connections, etc should be on
your profile page"). When the viewer IS the person, `/u/[slug]` grows three PRIVATE sections under the
public grid ([`owner-sections.tsx`](../../src/app/(guest)/u/[slug]/owner-sections.tsx)): your uploads
(`get_my_uploads`, with the lightbox's delete-own through `remove_my_upload`), your likes
(`get_my_likes`, where the heart UNLIKES and drops the item), and Connections - **the people you
follow, never your followers**, since the graph stays owner-private. They left the dashboard, which is
a hosting surface. The per-event like COUNT remains HOST-ONLY on the event's management gallery and
appears on no profile.
- ★ **The gate is the QUERY, not the boolean.** Every read is `auth.uid()`-scoped, and the component
  **takes no parameters at all**, so there is no id it could be pointed at. If the page's `isSelf`
  check were ever wrong, the worst it could render is the VIEWER'S OWN media on somebody else's page,
  never the page owner's. On a public surface anonymous strangers read all day, a gate that can only
  fail safely is the only kind worth having; [owner-mode.test.ts](../../src/app/(guest)/u/[slug]/owner-mode.test.ts) pins the empty signature.
- The sections stream behind their **own in-page `<Suspense>`**, never a `loading.tsx` (see the gotcha
  below - a loading file would make a dead handle answer 200), and a visitor's render is unchanged:
  nothing is constructed and not one of the three queries runs.
- `removeMyUploadAction` revalidates `/dashboard` **and** `/u/[slug]`; it used to revalidate only the
  former, which after the move meant a delete reconciled a route the user was no longer on.

## Where it lives

- Schema: [`20260708120000_profiles_social_foundation.sql`](../../supabase/migrations/20260708120000_profiles_social_foundation.sql) — `profiles.slug`, `events.display_in_profile` + `events.show_guest_list`, `user_follows`, `user_blocks`, `notification_prefs`, `profile_hidden_events`, the `follow_user`/`block_user`/`get_public_profile` RPCs, the `enforce_follow_not_blocked` trigger. The rolled-back contract check + the exact expected advisor delta live in its header.
- Data layer: [`src/lib/db/queries/social.ts`](../../src/lib/db/queries/social.ts) + [`src/lib/db/mutations/social.ts`](../../src/lib/db/mutations/social.ts); pure logic in [`src/lib/social/`](../../src/lib/social) (notification-pref defaults/resolve, profile cards) + [`src/lib/validation/profile.ts`](../../src/lib/validation/profile.ts) (slug schema + reserved words).
- UI: [`src/components/social/`](../../src/components/social) (guest list, follow button, block menu, slug control, visibility switches, connections) + [`profile-social-card.tsx`](../../src/components/app/event-settings/profile-social-card.tsx) + [`following-section.tsx`](../../src/components/app/dashboard/following-section.tsx); routes `src/app/(guest)/u/[slug]/` and the Account/event-settings/feed integrations.

## Invariants (don't revert)

- **`profiles.slug` is service-role-write-only** (outside the authenticated column grant); format is a
  DB CHECK (lowercase 3-30 `[a-z0-9-]`, no edge hyphen) + a PLAIN partial unique index (the CHECK
  already forces lowercase, and the RPC's `slug = lower(trim(input))` predicate can only use a plain
  index, not a `lower()` expression index). **The handle is FREE for everyone** (Will, 2026-09-19:
  "handles for everyone incentivizes guests to get deeper into our ecosystem"): no tier check in
  `setProfileSlug`, no locked branch in the control. Custom EVENT slugs stay Pro
  (`GATED_EVENT_SETTINGS`); do not confuse the two again.
- **`profiles.bio` is the same write class**: service-role only, never in the authenticated grant, so
  the account action is its only writer and a PostgREST PATCH cannot skip the rules. `bioSchema`
  (validation/profile.ts) collapses it to one line, caps it at 160 (mirrored by the
  `profiles_bio_len` CHECK), refuses links and bare domains, and empties to null;
  `containsProfanity` runs server-side in the action, exactly as the display name's does.
  `get_public_profile` returns it (migration 20260919120000, which REPLACES the function).
- **The graph is owner-private.** `get_public_profile` returns no follow data; follower/following lists
  and counts render only to the owner (Connections card). Never add public counts.
- **Attendance is not a capability grant.** The attended arm returns NO `qr_token`/`custom_slug`, and is
  gated on `show_guest_list` + `profile_hidden_events` + **`visibility = 'open'`** — the open-only gate
  is the consent scope (the album-side list renders only to viewers who can OPEN the album, which
  preserves "locked pages leak name + count only" for capability holders). A migration-text Vitest guard
  ([public-profile-visibility.test.ts](../../src/lib/social/public-profile-visibility.test.ts)) pins it.
- **The hosted arm is deliberately UNgated on visibility**: `display_in_profile` is the host publishing
  their OWN album link (link-in-bio; discovery decoupled from access) and includes the link; a gated
  event still hits its lock at `/e/`. Don't "fix" it to match the attended arm.
- **One guest-list read** (`getEventGuestList`, admin client): BOTH surfaces call it AFTER their own
  access gate (host page = ownership; guest album = `access === "full"`, never demo); returns null when
  `show_guest_list` is off; approved signed-in uploaders only, deduped by user; explicit id-list joins
  (the PGRST201 embed landmine), no `select(*)` on media. `GuestList` draws chips at or under
  `GUEST_LIST_FACES_THRESHOLD` (12) and a row of six faces plus "N guests added photos" above it,
  expanding in place 24 at a time; because the row says the count, both callers drop the count from
  their own heading above the threshold (the album's pill, the feed's `guestsCountInList`). HOW View
  all opens is round two's (`profile-reach`); the in-place paging is the interim.
- **Every `ProfileCardItem` carries a colour, not just an avatar URL.** `withAvatarUrls`
  ([`lib/social/cards.ts`](../../src/lib/social/cards.ts)) hydrates `seed: seedFor(card.id)`
  (`src/lib/avatar/seed.ts`, a server-side SHA-256) alongside `avatarUrl`, so the guest list's chips
  and faces row, the profile owner mode's Connections, and the account page's Following/Blocked rows
  all paint the same deterministic per-person colour a Server Component just passes to `Avatar`'s
  `seed` prop — never the raw id (avatar-wiring, 2026-09-20). The generator and its contract live in
  `src/lib/avatar/`; the fuller avatar-system writeup (upload, storage, the "Hosted by" byline) is
  [auth-accounts.md](auth-accounts.md)'s, still owed a line for this.
- **The attended arm's covers re-prove their own scope.** `getPublicProfileAttendedCoverUrls` takes
  ids the RPC already gated and checks `show_guest_list` + `visibility = 'open'` + the owner's
  `profile_hidden_events` again before presigning: a presign turns an id into someone else's
  photograph, so it proves the scope rather than inheriting it from a payload.
- **A person can be reported** (`reports.profile_id`, migration 20260919130000; `event_id` relaxed to
  nullable under a CHECK that one subject is set). The menu on `/u/[slug]` holds Report this person
  and Block; the route arm is SIGNED IN (`getUser()`, no capability token exists for a profile) and
  rate-limited per profile, the write is service-role over the deny-all table, and `/admin/reports`
  renders a People section above the album queue. No reporter is stored. Reporting never blocks,
  never hides and never tells the reported person who reported them.
- **Blocks shape the follow graph only** (not profile reads — the viewer may be anonymous). The
  `follow_user` RPC is block-silent (privacy) AND `enforce_follow_not_blocked` (BEFORE INSERT,
  SECURITY DEFINER — owner-RLS can't see "they blocked me") is the hard backstop; a block severs both
  directions atomically. The block menu stays visible even when they blocked me (a vanishing menu would
  leak the block); only the follow button hides on either-way blocks.
- **`notification_prefs`** is shaped by the ruled consent tiers: **transactional** always sends and has
  NO column by design; **relationship and service** mail defaults ON with a per-category opt-out, and only
  for ACCOUNT holders; an anonymous email-only guest receives nothing beyond the one-shot they explicitly
  asked for; **marketing** stays explicit opt-in. R5 must send within those four rules. Rows are lazy
  (absent = `NOTIFICATION_PREF_DEFAULTS`, a parity test pins TS↔SQL); `user_id`
  is insertable never updatable, so `setNotificationPrefs` is update-then-insert (a PostgREST upsert
  would `SET user_id`). No sends yet; no prefs UI yet either.
- `follow_user`/`block_user` are authenticated-only (advisor 0029, never 0028); `get_public_profile` is
  the 4th accepted anon-read RPC (0028). Inventory: [database-security.md](database-security.md).

## Gotchas

- `getMyAttendedEvents` (the Account hide-toggles list) deliberately ignores `show_guest_list` AND
  visibility: the hide toggle is the guest's key and must be settable BEFORE the host flips theirs.
- The dashboard's "Following" chip and its section are **gone** (the pulse, 2026-09-20): a lens on
  other people's events was never a hosting job. "Connections" in the profile's owner mode is the
  surviving half and lists PEOPLE (`getMyFollowing`), not their events; `getFollowedHostEventCards`
  keeps its home in `queries/social.ts` with no caller, for whoever wants that feed next.
- `checkProfileSlugAction` requires `getUser()` (no anon RPC for profile-slug availability — keeps it
  off the anonymous enumeration surface; it reveals only what a save's 23505 already would).
- ★ **`/u/[slug]` must never get a `loading.tsx`.** A loading file wraps the route in Suspense, so
  Next flushes the shell before the page runs and a dead handle answers 200 instead of 404 (measured
  in dev and against `next start`; `/e/<bad token>` next door answers 404). Throwing from
  `generateMetadata` does not help either. The page decides the 404 at the top and streams only the
  card grid, behind its own in-page `<Suspense>`.
- The handle is offered right after an upload lands: `ClaimHandlePrompt` owns the post-upload slot
  and renders ONE card by state (signed out = the save-account prompt, as before; signed in without a
  handle = the claim line; signed in with one = nothing), with a per-event dismissal. Its door is
  `/account#public-profile`, the id on the Public profile card.
- The marketing promise matches the product since 2026-09-19 (`named=everyone`): a handle buys a
  PAGE, not invisibility. `profiles-section.tsx` and the two help articles say the same sentence; if
  the guest list's membership ever changes, all three move together.
- The event-settings `ProfileSocialCard` lives OUTSIDE the RHF form (each key flip is its own consented
  act, persisted instantly) and hides entirely pre-apply (`getEventSocialSettings` → null).

Related: [auth-accounts.md](auth-accounts.md) · [guest-flow.md](guest-flow.md) · [database-security.md](database-security.md).
