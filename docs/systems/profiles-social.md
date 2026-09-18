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

Surfaces: `/u/[slug]` (hosted-events grid + link-less "Also at" attended list, indexable, minimal
guest-side chrome); the Account page (slug claim, attended-event visibility switches, Connections
card); event settings (`ProfileSocialCard`, both keys persist per flip, LOUD permanent consent copy on
`show_guest_list`); the host feed's "Guests" section + pill and the guest album's post-gallery
"Guests (N)" section; the dashboard "Following" chip.

## Where it lives

- Schema: [`20260708120000_profiles_social_foundation.sql`](../../supabase/migrations/20260708120000_profiles_social_foundation.sql) — `profiles.slug`, `events.display_in_profile` + `events.show_guest_list`, `user_follows`, `user_blocks`, `notification_prefs`, `profile_hidden_events`, the `follow_user`/`block_user`/`get_public_profile` RPCs, the `enforce_follow_not_blocked` trigger. The rolled-back contract check + the exact expected advisor delta live in its header.
- Data layer: [`src/lib/db/queries/social.ts`](../../src/lib/db/queries/social.ts) + [`src/lib/db/mutations/social.ts`](../../src/lib/db/mutations/social.ts); pure logic in [`src/lib/social/`](../../src/lib/social) (notification-pref defaults/resolve, profile cards) + [`src/lib/validation/profile.ts`](../../src/lib/validation/profile.ts) (slug schema + reserved words).
- UI: [`src/components/social/`](../../src/components/social) (guest list, follow button, block menu, slug control, visibility switches, connections) + [`profile-social-card.tsx`](../../src/components/app/event-settings/profile-social-card.tsx) + [`following-section.tsx`](../../src/components/app/dashboard/following-section.tsx); routes `src/app/(guest)/u/[slug]/` and the Account/event-settings/feed integrations.

## Invariants (don't revert)

- **`profiles.slug` is service-role-write-only** (outside the authenticated column grant); format is a
  DB CHECK (lowercase 3-30 `[a-z0-9-]`, no edge hyphen) + a PLAIN partial unique index (the CHECK
  already forces lowercase, and the RPC's `slug = lower(trim(input))` predicate can only use a plain
  index, not a `lower()` expression index). The **Pro gate is APP-side only** (`setProfileSlug` locks on
  `tier === "free"`, same rule as password/custom_slug); `/u/[slug]` renders for ANY profile with a
  slug; a downgraded account keeps its handle + Remove.
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
  (the PGRST201 embed landmine), no `select(*)` on media.
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
- The "Following" dashboard chip is **chip-only** (never stacked into "All" — it's a lens on other
  people's events, not the user's own media scroll) and a full-fetch, not a paginated feed.
- `checkProfileSlugAction` requires `getUser()` (no anon RPC for profile-slug availability — keeps it
  off the anonymous enumeration surface; it reveals only what a save's 23505 already would).
- The event-settings `ProfileSocialCard` lives OUTSIDE the RHF form (each key flip is its own consented
  act, persisted instantly) and hides entirely pre-apply (`getEventSocialSettings` → null).

Related: [auth-accounts.md](auth-accounts.md) · [guest-flow.md](guest-flow.md) · [database-security.md](database-security.md).
