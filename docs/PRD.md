# Partyreel — Product Requirements

_The vision, the monetization and anti-abuse reasoning and the retention model, which still hold. For
what exists today trust [SYSTEMS.md](SYSTEMS.md); the product has shipped well past any "v1" scoping._

## Vision

Capture **every** photo and video from an event, not just the handful that trickle into a group chat
the next day. The host runs the event; the **guests** are the camera crew. Friction is the enemy:
guests contribute with **no app and no account**, just a tap on a QR code and a display name. The
product is its own growth engine: every QR code and every shared album is an ad, and a guest who loved
how easy it was becomes the next host. **North-star metric: a host creates a second event.**

## Personas

- **Host**: throws the event (wedding, birthday, conference, trip); wants all the media in one place,
  light curation control and an easy way to share the result; has an account; pays, if anyone does.
- **Guest**: attends; wants to contribute in seconds from a phone without installing or signing up;
  has no account, only a display name (and an email when the host requires one).
- Planned: co-hosts sharing management (a paid-only feature; the single-owner `host_id` stays the
  billing and storage anchor) and invite-only guests by email.

## The core loop

1. **Create**: the host makes an event; one `qr_token` (`/e/[qr_token]`) becomes the QR code.
2. **Join and upload**: a guest scans and uploads straight from the phone (browser to storage,
   direct; an account only when the host turns off anonymous uploads).
3. **Curate**: uploads land live in the host's gallery, visible at once (`live`) or waiting in a queue
   (`hold_for_approval`); the host can hide, remove, lock uploads and toggle public visibility.
4. **Share**: the same link, with uploads closed, reads as a view-only album; it carries a "start for
   free" CTA and unfurls with a per-event preview card (`noindex`; the token is a private capability);
   after a guest's first upload a one-time prompt invites a free account to save the event.
5. **Reel**: a highlight reel stitched from the best clips (host curation, the canvas engine,
   on-device export, guest surfacing).

## Monetization and anti-abuse (the why behind the schema)

Pricing is **storage-based**, shaped so Partyreel cannot be abused as unlimited cloud storage. The
canonical numbers live in `src/lib/constants/tiers.ts`, mirrored for enforcement in the
`tier_limits()` SQL function; the tier table and the Stripe setup are in [`PRICING.md`](PRICING.md).

- **Total storage caps, not item counts**: a tier is total stored bytes against a cap; the pricing page
  shows the GB with a friendly translation.
- **Events persist until the host deletes them; there is no event end date.** An "ended" event that
  kept its media would let a user fill, end, create, repeat; only deletion (or the lifecycle below)
  frees space, and deletion destroys the media.
- **A monthly ingress meter, unmarketed**, against fill, delete, re-upload bandwidth burn; generous,
  never refunded on delete, surfaced only as a soft "you've hit this month's upload limit".
- **No watermarks**; a clean growth badge on shared albums is a later design.
- **Tiers**: Free (one event, modest storage, tier-gated event settings; the first-event experience
  must still shine), Pro (a subscription with a storage selector and unlimited events; prices driven
  by Stripe Price IDs), Event Pass (one-time, per event, high storage, a fixed term with a cheap
  renewal). Upgrade triggers: a second event, or outgrowing the first one's storage. Universal
  per-file limits live in `src/lib/media/limits.ts`.

## Data retention and lifecycle

One lifecycle across every tier; media is never hard-deleted at once. Triggers: **over capacity** (a
lapsed grant: a downgrade, a failed payment, an expired Event Pass) opens a ~30-day in-app grace, then
the largest files go first until under cap, with a ~10% overflow buffer before uploads block; **the
host deletes an event** (the slot frees at once); **free-tier inactivity** after 6 months (activity is
signing in, any host use or a recent upload; a warning email ~14 days before). The recoverable tail is
the same for every trigger: ~60 days recoverable behind the scenes with an emailed download link and a
deletion date, then hard-deleted (`events.deleted_at`, `events.purge_at`, the purge cron).

## Safety and moderation

A per-event moderation mode (`live` or `hold_for_approval`) gates visibility, not safety; uploads
happen only while `accepting_uploads` is true. Anyone viewing a public album can report it or an item
anonymously; reports land in the operator queue at `/admin` and never auto-hide (an anonymous report
is trivially spammable; a human decides). No NSFW filtering; proactive hash-matching is a later stage.
Host access options (a passphrase; require-upload-to-view) are a fast-follow, since they touch the
capability-token RPCs.

## Platform principles

One domain, one app (shared links stay clean). RLS is the security boundary; guests act through
capability-token security-definer RPCs. Media is never exposed at a raw storage URL. The server is the
source of truth for entitlements; the Stripe webhook sets tier. Media-first, understated UI: neutral
chrome, colour punctuates; guest galleries render on an always-dark surface so the media is the hero.
Native mobile apps are a non-goal: guests use the mobile web, which is the whole point.
