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
- **Guest**: contributes; a person is a guest of an event by adding a photo or video to it, and only by that (a
  password entered, an email confirmed, nothing uploaded: not a guest; every upload removed: no longer one). Will's
  principle behind it: product choices favour the host's benefit, which is guests participating, so there is no
  reward for attending without contributing. A guest wants to contribute in seconds from a phone with nothing to
  install. By default a guest confirms an email with a code, and that confirmed email is their account; where the host
  turns verified emails off, a guest types a display name and uploads under it with an "Unverified" mark. Every upload
  carries a name, and the events a guest added to are what their account keeps.
- **Who it is built to delight**: hosts and guests from about 18 (a party) to about 50 (a wedding, a conference). The
  product aims to feel modern and cool to them rather than designed down to the least technical guest; the core path
  (scan, add, view) stays plain enough for anyone, grandparents included. A host is designed for with 1 to about 10
  events first, and everything she manages still scales to hundreds.

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
   for a signed-out visitor; after a guest's first upload, a one-time offer invites them to confirm an email, which
   keeps their photos in an account and brings the event with them onto their dashboard, then offers the host to
   follow. There is no separate save: uploading to an event is what keeps it.
5. **Reel**: from the album's second photo, the event plays as its own highlight reel on every viewer's phone and on
   the room's screen, taking in uploads as they land with nothing for the host to make; anyone with the album makes a
   clip of it on their own device to keep or send, and on a paid event can add it to the album.

## Monetization and anti-abuse (the why behind the schema)

Pricing is **storage-based**, shaped so Partyreel cannot be abused as unlimited cloud storage. The canonical numbers
live in `src/lib/constants/tiers.ts`, mirrored for enforcement in the `tier_limits()` and `upload_allowance()` SQL
functions; the plan table (Ladder A), Pro's case and the Stripe setup are in [`PRICING.md`](PRICING.md).

- **Total storage caps, not item counts**: a plan is total stored bytes against a cap; the pricing page shows the GB
  with a friendly translation into photos and hours of video.
- **Events persist until the host deletes them; nothing ends them.** An event's dates (a day, or a range of days)
  only say when it happens and never expire it. An "ended" event that kept its media
  would let a user fill, end, create, repeat; only leaving Deleted for good (the lifecycle below) frees space, and a
  deletion ends in the media's destruction once its recovery window closes.
- **An uploads allowance, published per plan**, against fill, delete, re-upload churn: each plan's own number in the
  pricing table (Free and Pro a month, a pass its own year), gracious for a real event, never refunded on delete, and
  sized with the plan's price so no plan's worst month costs more than it pays. Only circuit breakers no real host
  meets stay unpublished.
- **No watermark on any uploaded photo or video, on the album, or on the live reel, on any plan.** The one mark is on a
  free event's clips: the free levers are never quality.
- **Plans**: Free is one event, photos only, the whole album; the first-event experience must still shine, since it
  sells the upgrade. The Event Pass is one payment, no subscription, for one big event kept a year, with video and clips
  with no mark, renewable, and passes stack. Pro is a subscription (monthly or yearly) with unlimited events and a size
  for each next use (a season of parties, a planner's year, a venue's year), its prices set by Stripe Price IDs. The upgrade triggers are video, outgrowing Free's
  storage, and a second event. Universal per-file limits live in `src/lib/media/limits.ts`.

## Data retention and lifecycle

One lifecycle across every plan, and media is never hard-deleted at once. **A plan's storage holds everything a host
keeps, her albums and her Deleted together**: one number under one cap, so deleting frees nothing until an item leaves
Deleted for good, and nobody can store past their plan by parking it in Deleted. Three triggers move media into
Deleted:

- **The host deletes** an event or an item.
- **Over capacity**: a lapsed paid grant (a downgrade, a subscription that ends after failed payments, an expired
  Event Pass) opens a 45-day grace on what she keeps by choice, with a warning email and a reminder 7 days before it
  ends; then what she already deleted leaves for good first, and her largest files go to Deleted until she is under
  her cap.
- **Free-plan inactivity**: an event 180 days past its last activity (the host signing in or using the app, an edit to
  the event, a new upload) is removed, with a warning email 14 days before.

Every trigger lands in the same recoverable tail: 30 days in Deleted, restorable by the host in the app (restoring her
own always fits, since it already counts; a system removal's email names the date; a deletion the host made is never
emailed), then hard-deleted by the daily purge cron (`events.deleted_at`, `events.purge_at`). An item leaves Deleted
early only for good: her Delete permanently or Empty Deleted, or, when an upload needs room and her account's **Make
room from Deleted** is on (the default), the oldest items first, as many as the upload needs. With it off, an upload
that does not fit is refused with the room it needs. Uploads block at the cap plus a 10% buffer. A guest's own delete
leaves at once, for the host too, and purges that night. The windows live in `src/lib/lifecycle/`.

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

**Will's product principles**, each a reason and never a law:
- **Cost is designed like the architecture.** We scale by events, not users (one wedding is a hundred guests at once),
  so before choosing a path verify where the bytes and requests really bill (Vercel, R2's operations, Supabase,
  Workers) at the vendors' current prices, and name each option's cost. The win-win, a change that improves the
  experience and cuts the cost, is prized; a limit that bounds cost is designed as a feature; every free tier is watched
  before it is hit, the foundation fixed rather than an upgrade bought; no paying host costs more than she pays.
- **Adapt to every host's workflow, never enforce one:** deep control that stays simple, met where she acts, with an
  opinionated default a newcomer never has to touch (Linear is the reference).
- **Permission at the moment of need:** sign-up asks only what sign-in needs; Drive, a device or any later grant is
  asked at its first use, after our own words say why.
- **One moment for every guest:** anything an album does at a time (its turn, a develop, a reveal) happens at one
  instant, the party's; a reader's zone only formats it.
- **Privacy first on leaving:** a deletion takes what anyone can see at once and the purge follows that night; the short
  recovery window stays a private failsafe, never advertised; an account held for a report stays blocked; no refund on
  a cancel.
- **Images carry no rights machinery:** no credit, source, licence or release questions and no AI label; the one
  disclosure is a sentence in the Terms.
- **Help tracks shipped reality; marketing presents the product as complete** (punchy, never pedantic:
  `systems/marketing-content.md`); the Terms and the Privacy Policy are rewritten once, right before launch, and no
  milestone waits on them.
- **A one-way door waits for him:** what defines the product's core output or identity is asked first (build now, or
  research first); well-bounded infrastructure and features are built without asking.
