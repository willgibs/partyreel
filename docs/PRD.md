# Partyreel — Product Requirements

_Written for the v1 build (last full pass 2026-05-29); the product has since shipped WELL past this
document — the reel, profiles+social, exports, and the marketing identity are all live. The vision,
monetization/anti-abuse reasoning, and retention model below still hold; for what exists today trust
[SYSTEMS.md](SYSTEMS.md) over any "v1"/"Phase N" scoping here. A full refresh is roadmapped
([ROADMAP.md](ROADMAP.md) "Billing follow-ons")._

## Vision

Capture **every** photo and video from an event — not just the handful that
trickle into a group chat the next day. The host runs the event; the **guests**
are the camera crew. Friction is the enemy: guests contribute with **no app and
no account**, just a tap on a QR code and a display name.

The product is also its own growth engine: every QR code and every shared album
is an ad. A guest who loved how easy it was becomes the next host. **North-star
success metric: a host creates a _second_ event.**

## Personas

- **Host** — throws the event (wedding, birthday, conference, trip). Wants all
  the media in one place, light curation control, and an easy way to share the
  result. Has an account (email / OAuth). Pays, if anyone does.
- **Guest** — attends the event. Wants to contribute photos in seconds from a
  phone without installing or signing up. Has **no account**; identified only by
  a display name (and optional email if the host requires it).

_Planned (v2+ — see ROADMAP "Multi-account events"): an event can link multiple
accounts — **co-hosts** who share management (a **paid-only** feature: the owner must be
Pro or hold an Event Pass; co-hosts need no plan of their own), and **invite-only
guests** by email. The single-owner `host_id` stays the billing/storage anchor; an
additive `event_members` table adds the rest._

## The core loop

1. **Create** — host makes an event; the system issues a single `qr_token` (→
   `/e/[qr_token]`) and renders a QR code (one link per event, ADR-0010).
2. **Join + upload** — a guest scans the QR and uploads photos/videos straight from
   their phone (browser → storage, direct; no app/account, an account only when the host turns off anonymous uploads).
3. **Curate** — uploads land live in the host's gallery. Depending on the
   event's moderation mode they're visible immediately (`live`) or wait in a
   queue (`hold_for_approval`). The host can hide/remove, lock uploads, and
   toggle public visibility.
4. **Share** — the host shares the one event link; with uploads closed it reads as a
   view-only album (approved media only). The link carries a "start for free" CTA → growth loop, and
   unfurls with a branded, per-event preview card (but stays `noindex`, the `qr_token` is a private
   capability). After a guest's first upload, a soft, one-time prompt invites them to create a free
   account to save the event (with an optional newsletter opt-in), feeding the guest → future-host loop.
5. **Reel** — a highlight reel stitched from the best clips. **SHIPPED** (host curation + the canvas
   engine + on-device `.mp4` export + guest surfacing/download — [SYSTEMS.md](SYSTEMS.md) "Highlight
   reel").

## Where this maps in the build

The build that shipped this loop is **complete — all five steps are live**. What exists today is
mapped in [SYSTEMS.md](SYSTEMS.md) (→ the `systems/` deep docs); the
dated build history is in [CHANGELOG.md](CHANGELOG.md); [STATUS.md](STATUS.md) is the live "you are here"
and [ROADMAP.md](ROADMAP.md) is what might be next.

## Monetization & anti-abuse (the WHY behind the schema)

Pricing is **storage-based** and shaped so Partyreel can't be abused as unlimited
cloud storage (model decided 2026-05-29 — the per-event item-cap model is replaced in
Phase 4). Canonical numbers live in
[`src/lib/constants/tiers.ts`](../src/lib/constants/tiers.ts), mirrored for
enforcement in the `tier_limits()` SQL fn — but `tiers.ts` still encodes the OLD
item-cap model until the Phase 4 rework lands. Full tier table, the shaped target
`tiers.ts`, and the Stripe setup guide live in [`PRICING.md`](PRICING.md). The model:

- **Total storage caps, not item counts.** A tier is defined by total stored bytes
  (`profiles.storage_used_bytes` vs a cap), not photo/video counts — simpler to reason
  about and market, and it scales naturally with file size. The pricing page shows the
  GB plus a friendly translation ("≈ X photos or X one-minute videos").
- **Events persist until the host deletes them — there is NO event end date.** If an
  event could be "ended" while keeping its media, a user could fill → end →
  create-new → repeat for unlimited storage. Only deletion (or the lifecycle below)
  frees space; deletion destroys the media.
- **Monthly ingress meter, unmarketed.** A monthly _bytes-uploaded_ meter guards
  against fill → delete → re-upload bandwidth/egress burn — storage caps alone don't
  stop that (you never exceed the cap but keep burning transfer). Generous, never
  refunds on delete, surfaced only as a soft "you've hit this month's upload limit —
  upgrade or wait for next cycle."
- **No watermarks** (dropped 2026-05-29 — they'd hurt the first-event experience, and
  we have enough growth levers). A clean "growth badge" on shared albums is a later
  design (Phase 6).

**Tiers (structure decided; GB + prices set in Phase 4):**

- **Free** — 1 event, modest storage, plus **tier-gated event settings** (the
  host-settings UI locks toggles by tier; e.g. **`allow_anonymous_uploads` is ON for all, but turning it
  OFF (require an account to upload) is gated** — locked on Free, unlocked on Pro/Event Pass). The first-event
  experience must still shine; it sells the upgrade.
- **Pro** — subscription with a **storage selector** (**3 storage tiers** to start, at
  rising prices; the top is the premium anchor), unlimited events sharing that storage.
  Replaces the old Pro + Max. Prices are driven by **Stripe Price IDs** so they're easy
  to change without a deploy.
- **Event Pass** — one-time, **per-event**, high storage, fixed term (~1 yr) with a
  cheap renewal near the end; lets a free user pay once for a big event without
  subscribing.

**Primary upgrade triggers:** creating a **2nd event** (Free = 1) or **outgrowing
event #1's storage** — both map straight to the north-star. Universal per-file limits
(all tiers): video ≤ **5 min** and ≤ **2 GB**, photo ≤ **50 MB**.

## Data retention & lifecycle

**One standardized lifecycle across all tiers** (Free, Pro, Event Pass) — media is
**never hard-deleted immediately.** Only the _trigger_ and any pre-removal grace
differ; the recoverable tail is identical everywhere.

**Triggers (the per-case catches):**

- **Over capacity** — usage exceeds your storage grant because a paid grant lapsed: a
  downgrade, a failed payment, or an **Event Pass expiring** without renewal. A
  **~30-day in-app grace** opens — everything stays visible and downloadable and you
  pick what to remove to get back under cap; if you don't, we auto-reduce by deleting
  the **largest files first** until under cap (those files then enter the tail below). We
  allow a small **~10% overflow buffer** over the cap before blocking new uploads —
  crossing the _base_ cap is what opens this grace (a little extra room is endearing and
  bounds our risk). Pure-free accounts can't reach this by topping up — they're simply
  blocked at upload once full.
- **Host deletes an event** — frees the slot immediately (anti-abuse); the event flows
  straight into the tail.
- **Free-tier inactivity** — after **6 months** of no host activity, the event is
  removed from the account (then flows into the recoverable tail below). **"Activity" =
  signing in OR any host use** (the host's `last_active_at` is bumped on every gated-app
  request) **OR** recent event touches/uploads — concretely the freshness clock is
  `max(profiles.last_active_at, event.created_at/updated_at, newest media.created_at)`, so
  a still-collecting or recently-edited event never trips it. We email a **warning ~14
  days before** removal ("open or sign in to keep it"); using the event in that window
  resets the clock. Free accounts only — Pro/Event-Pass events don't expire this way.
  Fair vs. e.g. Supabase pausing free projects after ~1 week; surfaced in the legal terms
  from launch so it's never a surprise.

**The recoverable tail (identical for every trigger):** once media leaves the account
view it's **kept recoverable behind the scenes for ~60 days** — the host gets an email
with a download link and a clear deletion date ("…your event was removed because X;
download the album here until {date}…") — then it's **hard-deleted** (DB rows and R2
objects).

_Future idea (out of scope): AI triages "I lost my media" support emails, matches
sender → account/event, and auto-sends that time-boxed download link._ Schema hooks:
`events.deleted_at` (left-the-account) and `events.purge_at` (≈ +60 days, hard-delete),
plus the purge cron (Phase 3); the over-capacity grace is an account-level state tied
to billing (Phase 4).

## Safety & moderation

- **Per-event moderation mode (host toggle) — `live` vs `hold_for_approval`.** These
  are the two values of `moderation_mode`: `live` = review OFF (uploads appear
  immediately) and `hold_for_approval` = review ON (uploads wait as `pending` for the
  host before they're public). It's the host's per-event choice and gates _visibility_,
  not _safety_. (Uploads happen only while `accepting_uploads` is true — a separate
  switch.)
- **Reports & operator review — report/takedown at launch; proactive filtering is
  v2+.** Anyone viewing a public album can **report** the album (or a specific item)
  through a discreet, anonymous link. Reports land in an **internal operator review
  queue** (`/admin`, gated by `profiles.is_admin`) where an operator dismisses them or
  takes the item down; actioning soft-removes the media and the purge cron reclaims it.
  Reports **never auto-hide** content — anonymous reports are trivially spammable, so
  auto-hide would be a griefing DoS on a legit host; a human decides. **No upload-time
  scanning in v1.** Proactive hash-matching is on the **v2+ docket**, built as the
  extensible root of a filter system (Cloudflare's free CSAM tool is CDN-cache-only and
  does **not** cover our private R2 objects, so the tool + approach are chosen later).
- **No NSFW filtering.** Skipped on purpose — costly (especially video) for little
  early benefit, and lawful adult content is fine on Cloudflare/R2 anyway. Hosts manage
  their event instead with the **review flow** above and **protected events** below.
- **Host access options (deferred to a fast-follow).** Per-event settings that gate
  guest access: (a) a **passphrase** to upload and/or view — _fun_, not a wifi-password
  hunt (accept emoji or short phrases); (b) **require-upload-to-view** (optionally an item
  minimum) to incentivize participation. Each needs an event-settings field,
  RPC/guest-flow changes, and settings UI. **Deferred out of Phase 3** — they touch the
  security-critical capability-token RPCs, so they ship as a focused fast-follow.

## Platform constraints / principles

- **One domain, one app.** Marketing, host app, and guest links share a domain so
  shared links stay clean (ADR-0002).
- **RLS is the security boundary.** Guests have no JWT; they act through
  capability-token security-definer RPCs (ADR-0004).
- **Media is never exposed at a raw storage URL** — always short-lived presigned
  links (ADR-0003).
- **The server is the source of truth for entitlements** — never the client; the
  Stripe webhook sets tier.
- **Media-first, understated UI.** Neutral chrome; color punctuates (logo,
  primary CTA, active state). Guest galleries render on an always-dark surface so
  photos/videos are the hero.

## v1 non-goals — historical; most have since shipped

Original v1 exclusions, kept for the record: highlight-reel processing (**since SHIPPED** — the
canvas engine), per-guest accounts + social features (**since SHIPPED** — profiles/follows/guest
lists, ADR-0019), native mobile apps (**still a non-goal** — guests use the mobile web; that's the
whole point), comments/reactions (**still unbuilt**). Free-event inactivity removal and the safety
report/review flow were promoted into the build long ago. Proactive upload scanning stays a
later-stage non-goal (ADR-0020's reactive posture).
