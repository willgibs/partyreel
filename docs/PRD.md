# Partyreel — Product Requirements

> ROLE: the product's why: the vision, who it serves, the core loop, and the reasoning behind the pricing model, the
> anti-abuse rules, retention and safety. · NOT HERE: the plans and their numbers (→ [`PRICING.md`](PRICING.md)), how
> each system works (→ [`SYSTEMS.md`](SYSTEMS.md)), what might be next (→ [`ROADMAP.md`](ROADMAP.md)).
> GROWS BY: refined in place; where this doc and the code disagree, the code wins and the doc is corrected.

## Vision

Capture **every** photo and video from an event, not just the handful that trickle into a group chat the next day.
The host runs the event; the **guests** are the camera crew. Friction is the enemy: a guest contributes with **no app
required**, from a scan of the QR code, a name and, by default, an email confirmed with a code. The product is its
own growth engine: every QR code and every shared album is an ad, and a guest who loved how easy it was becomes the
next host. **North-star metric: a host creates a second event.**

## Personas

- **Host**: throws the event (wedding, birthday, conference, trip); wants all the media in one place, light curation
  control and an easy way to share the result; has an account; pays, if anyone does. An event has one owner
  (`events.host_id`), its billing and storage anchor.
- **Guest**: attends; wants to contribute in seconds from a phone with nothing to install. By default a guest
  confirms an email with a code, and that confirmed email is their account; where the host turns verified emails
  off, a guest types a display name and uploads under it with an "Unverified" mark. Every upload carries a name.

## The core loop

1. **Create**: the host makes an event; one `qr_token` (`/e/[qr_token]`) becomes the QR code and the link (a paid
   custom link, `/e/<slug>`, opens the same event).
2. **Join and upload**: a guest scans, gives a name (and confirms an email while the host requires verified emails,
   the default), and uploads straight from the phone: browser to storage, direct, with photo metadata stripped in the
   browser first.
3. **Curate**: uploads land in the host's album, visible at once (`live`) or held in Review until approved
   (`hold_for_approval`); the host approves, hides or removes any upload, closes or reopens uploads, and sets who can
   see the album.
4. **Share**: the same link is the album, and with uploads closed it reads as a view-only album. It unfurls with a
   per-event preview card (`noindex`; the token is a private capability) and carries a quiet "Start for free" link
   for a signed-out visitor; after a guest's first upload, a one-time offer invites them to keep the album on an
   account (a guest who typed a name confirms an email to do it).
5. **Reel**: a highlight reel stitched from the best clips (host curation, the canvas engine,
   on-device export, guest surfacing).

## Monetization and anti-abuse (the why behind the schema)

Pricing is **storage-based**, shaped so Partyreel cannot be abused as unlimited cloud storage. The canonical numbers
live in `src/lib/constants/tiers.ts`, mirrored for enforcement in the `tier_limits()` SQL function; the plan table,
Pro's case and the Stripe setup are in [`PRICING.md`](PRICING.md).

- **Total storage caps, not item counts**: a plan is total stored bytes against a cap; the pricing page shows the GB
  with a friendly translation into photos and hours of video.
- **Events persist until the host deletes them; there is no event end date.** An "ended" event that kept its media
  would let a user fill, end, create, repeat; only deletion (or the lifecycle below) frees space, and a deletion ends
  in the media's destruction once its recovery window closes.
- **A monthly upload meter, unmarketed**, against fill, delete, re-upload bandwidth burn: generous, never refunded on
  delete, and seen only as a monthly upload limit when an upload is refused.
- **No watermark on any uploaded photo or video, or on the album, on any plan.**
- **Plans**: Free is one event, photos only, the whole album; the first-event experience must still shine, since it
  sells the upgrade. The Event Pass is one-time and per event, with video and every paid control for a year,
  renewable, and passes stack. Pro is a subscription (monthly or yearly) with a storage selector and unlimited events,
  its prices set by Stripe Price IDs. The upgrade triggers are video, a password lock or custom link, outgrowing the
  storage, and a second event. Universal per-file limits live in `src/lib/media/limits.ts`.

## Data retention and lifecycle

One lifecycle across every plan, and media is never hard-deleted at once. Three triggers move media out:

- **Over capacity**: a lapsed paid grant (a downgrade, a subscription that ends after failed payments, an expired
  Event Pass) opens a 45-day grace with a warning email and a reminder 7 days before it ends; then the largest files
  go first until the account is under its cap. Uploads block at the cap plus a 10% buffer.
- **The host deletes** an event or an item: its room frees at once.
- **Free-plan inactivity**: an event 180 days past its last activity (the host signing in or using the app, an edit to
  the event, a new upload) is removed, with a warning email 14 days before.

Every trigger lands in the same recoverable tail: 30 days in Deleted, restorable by the host in the app (a system
removal's email names the date; a deletion the host made is never emailed), then hard-deleted by the daily purge cron
(`events.deleted_at`, `events.purge_at`). Deleted-but-kept bytes are capped at one storage cap per account, oldest
evicted first, so a restore and re-delete cycle cannot hoard. The windows live in `src/lib/lifecycle/`.

## Safety and moderation

A per-event moderation mode (`live` or `hold_for_approval`) gates visibility, not safety; uploads happen only while
`accepting_uploads` is true. Anyone who opens an event's link can report the event anonymously, and a signed-in member
can report a person from their profile; reports land in the operator queue (`/admin/reports`, on
`admin.partyreel.com`) and never hide anything on their own (an anonymous report is trivially spammable, so an
operator decides). There is no NSFW filter and no upload-time scanning. The host's access controls run through the
capability-token RPCs: the album's visibility (open, password-locked on a paid plan, or private), Require verified
emails (free, on by default) and Require an upload to view (free, off by default; it fails open while uploads are
closed or the album is full, so no guest is ever held at a step they cannot pass).

## Platform principles

One domain for everything a guest, a host or a future host sees: a scanned QR, a shared album and the marketing site
are one recognizable origin (the ops portal on `admin.partyreel.com` is the one exception). RLS is the security
boundary; guests act through capability-token security-definer RPCs. Media is never exposed at a raw storage URL. The
server is the source of truth for entitlements; the Stripe webhook sets the tier. Media-first, understated UI: neutral
chrome in light and dark with no accent, so the photographs carry the colour (the action hues aside); the design law
is the Library's bible. Native mobile apps are a non-goal: guests use the mobile web, which is the whole point.
