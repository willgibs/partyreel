# Partyreel — Product Requirements (v1)

_Last meaningful update: 2026-05-29 (core loop live through Phase 2; added build-phase map)._

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

1. **Create** — host makes an event; the system issues a `qr_token` (→
   `/e/[token]`) and a `share_token` (→ `/a/[token]`), and renders a QR code.
2. **Join + upload** — a guest scans the QR, enters a display name, and uploads
   photos/videos straight from their phone (browser → storage, direct).
3. **Curate** — uploads land live in the host's gallery. Depending on the
   event's moderation mode they're visible immediately (`live`) or wait in a
   queue (`hold_for_approval`). The host can hide/remove, lock uploads, and
   toggle public visibility.
4. **Share** — the host shares the public album (`/a/[token]`, approved media
   only). Each share surface carries a "make your own" CTA → growth loop.
5. **Reel** _(scaffold only in v1)_ — a highlight reel is stitched from the best
   clips. The schema supports it (`highlight_reels`, media reel fields); no
   processing ships in v1.

## Where this maps in the build

The [roadmap](ROADMAP.md) ships the loop in order — **Phase 1** host auth + create ·
**Phase 2** guest join + upload (steps 1–2, the core loop) · **Phase 3** curate +
lifecycle (step 3) · **Phase 4** payments/tiers · **Phase 5** the highlight reel
(step 5) · **Phase 6** growth/polish (the step-4 share CTA). ROADMAP carries the
per-phase execution detail and the "how to pick up a phase" loop;
[STATUS.md](STATUS.md) is the live "you are here."

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
  host-settings UI locks toggles by tier; **`require_email` is the first gated toggle**
  — locked on Free, unlocked on Pro/Event Pass; more added as we go). The first-event
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
- **Free-tier inactivity** — after **6 months** of no host activity (with **email
  alerts near the end**), the event is removed from the account. Fair vs. e.g. Supabase
  pausing free projects after ~1 week; outlined in the legal terms.

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
- **CSAM — legal-floor MVP at launch; stronger filtering on the v2+ docket.** Note
  (researched 2026-05-29): Cloudflare's free CSAM tool is CDN-cache-only and does
  **not** cover our private R2 objects. We're **not locking in a scanner yet** — a
  data-privacy and legal review (what users upload, what we're permitted to scan, and
  how) comes first, then we pick the best tool (PhotoDNA Cloud Service is one
  candidate). **v1 ships the legal floor:** a clear report/takedown flow, an NCMEC
  CyberTipline reporting workflow, and an **internal account flag for human review** on
  any reported or suspected match — never an auto-shutdown (a false positive can't nuke
  a legit user). Proactive hash-scanning at upload is **v2+**, built as the extensible
  root of the filter system. (Real legal review before public marketing.)
- **No NSFW filtering.** Skipped on purpose — costly (especially video) for little
  early benefit, and lawful adult content is fine on Cloudflare/R2 anyway. Hosts manage
  their event instead with the **review flow** above and **protected events** below.
- **Host access options (planned).** Per-event settings that gate guest access:
  (a) a **passphrase** to upload and/or view — _fun_, not a wifi-password hunt (accept
  emoji or short phrases); (b) **require-upload-to-view** (optionally an item minimum) to
  incentivize participation. Each needs an event-settings field, RPC/guest-flow changes,
  and settings UI; slot into Phase 3 or a fast-follow.

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

## v1 non-goals (explicitly out of scope)

- Highlight-reel **processing** (schema scaffold only; real pipeline is Phase 5).
- Native mobile apps (guests use the mobile web; that's the whole point).
- Per-guest accounts, social features, comments/reactions.

_Promoted out of non-goals:_ free-event inactivity removal is now planned (6 months —
see "Data retention & lifecycle"), and safety scanning is now planned (see "Safety &
moderation").
