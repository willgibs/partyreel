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

Pricing is shaped so Partyreel can't be abused as unlimited cloud storage. The
canonical numbers live in [`src/lib/constants/tiers.ts`](../src/lib/constants/tiers.ts)
(and are mirrored for enforcement in the `tier_limits()` SQL function). The model:

- **Events persist until the host deletes them — there is NO event end date.**
  Hosts toggle visibility and uploads while an event exists. If an event could be
  "ended" while keeping its media, a user could fill → end → create-new → repeat
  for unlimited storage. That loophole is closed by having no end state: only
  **deletion** frees a slot, and deletion destroys the media.
- **`maxEvents` counts events that EXIST** (`deleted_at IS NULL`), not active/
  concurrent ones. `maxEvents × per-event caps` = the hard ceiling on
  simultaneously-stored files for free / event_pass / pro.
- **Monthly upload caps** (free/pro) stop delete-and-re-upload churn from
  draining bandwidth — they count uploads made that month and deletes never
  refund them.
- **Max** removes per-event and event-count limits and instead constrains by
  **total stored bytes** (`profiles.storage_cap_bytes`, tracked via
  `storage_used_bytes`).

Tiers at a glance (authoritative source is tiers.ts): **Free** (1 event, small
caps, watermark) · **Event Pass** ($9 one-time, one big event kept ~1yr) ·
**Pro** ($12/mo, 10 events) · **Max** (subscription, unlimited events, storage
you pick: 500 GB / 2 TB / 5 TB). Universal per-file limits (all tiers): video ≤
**5 min** and ≤ **2 GB**, photo ≤ **50 MB**.

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
- NSFW / safety scanning (must be chosen before public launch — see STATUS open
  questions).
- Native mobile apps (guests use the mobile web; that's the whole point).
- Time-based purge of free events (free events persist, bounded by caps; an
  inactivity purge may be added later).
- Per-guest accounts, social features, comments/reactions.
