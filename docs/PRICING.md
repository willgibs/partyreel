# Partyreel — Pricing & tiers

Canonical home for the tier/pricing model. The product **why** is in
[`PRD.md`](PRD.md) ("Monetization & anti-abuse" + "Data retention & lifecycle"); the
**build** is [`ROADMAP.md`](ROADMAP.md) Phase 4. Prices here are **decided**
(2026-05-29) and the storage-cap model is now **wired in code** (`tiers.ts` /
`tier_limits()` SQL / `create_media`) as of **Cut 4a** — Stripe billing (Pro = 4b, Event
Pass = 4c) is what remains.

## Model

- **Storage-based, not item counts.** A tier is a total stored-bytes cap. `profiles.tier`
  is the **billing category** (`free | pro | event_pass`); the granted cap lives in
  `profiles.storage_cap_bytes` (set by the Stripe webhook from the purchased option),
  so Pro's storage selector is just different caps under `tier="pro"`.
- **Prices live in Stripe** (env-referenced Price IDs) so they change without a deploy;
  GB amounts + structure live in `tiers.ts` and are mirrored in `tier_limits()` SQL.
- **Monthly ingress meter** (bytes uploaded per month; never refunds on delete;
  unmarketed) is the anti-abuse guard — storage caps alone don't stop delete→re-upload
  egress burn.
- **No watermarks.** Universal per-file limits (all tiers) stay in `lib/media/limits.ts`:
  video ≤ 5 min and ≤ 2 GB, photo ≤ 50 MB.

## Tiers (locked 2026-05-29)

| Plan           | Price                     | Storage | ≈ holds                       | Events       |
| -------------- | ------------------------- | ------- | ----------------------------- | ------------ |
| **Free**       | $0                        | 2 GB    | ~500 photos / ~10 min video   | 1            |
| **Pro 100 GB** | $9/mo                     | 100 GB  | ~25k photos / ~10 hrs video   | unlimited    |
| **Pro 500 GB** | $19/mo                    | 500 GB  | ~125k photos / ~50 hrs video  | unlimited    |
| **Pro 2 TB**   | $39/mo                    | 2 TB    | ~500k photos / ~200 hrs video | unlimited    |
| **Event Pass** | $24 one-time, ~$15/yr ren | 75 GB   | ~37k photos / ~15 hrs video   | 1 event/~1yr |

- **Free** also gates host event-settings by tier (`require_email` is the first gated
  toggle — locked on Free). The first-event experience must still shine; it sells the
  upgrade. **Primary upgrade triggers:** a 2nd event, or outgrowing event #1's storage.
- **Event Pass** is per-event, fixed ~1-yr term, with a cheap renewal near the end; at
  expiry without renewal it enters the over-capacity retention flow (PRD).
- ≈ figures assume ~4 MB/photo and ~150 MB/min 1080p video — illustrative; the in-app
  "≈ X photos / Y video" is derived from the GB.

## Unit economics (sanity check)

R2 storage ≈ **$0.015/GB/mo, zero egress**. Full-use storage cost ≈ $1.50 (100 GB),
$7.50 (500 GB), **~$31 (2 TB)**, ~$1.13/mo (75 GB Event Pass). Healthy except the
**Pro 2 TB at $39 is thin if fully used** — most won't fill it, but price the top tier
assuming someone does (consider $49 or a 1 TB cap if margins matter).

## Shaped `tiers.ts` (WIRED in Cut 4a)

This shape is now live in [`src/lib/constants/tiers.ts`](../src/lib/constants/tiers.ts)
(Cut 4a) — the snapshot below is kept for reference; the file is the source of truth. The
DB `tier_type` enum still lists `max` (retired — folded into Pro storage options); it's
left unused, and app code coerces it with `toBillingTier()` (`max`→`pro`).

```ts
export const BILLING_TIERS = ["free", "pro", "event_pass"] as const;
export type Tier = (typeof BILLING_TIERS)[number];
export const DEFAULT_TIER: Tier = "free";

export const GIGABYTE = 1024 ** 3;
export const TERABYTE = 1024 ** 4;

/** A purchasable plan = billing tier + storage cap + (Stripe) price. */
export type Plan = {
  id: string; // "free" | "pro_100" | "pro_500" | "pro_2tb" | "event_pass"
  tier: Tier;
  name: string;
  storageBytes: number;
  priceLabel: string; // display only — Stripe Prices are the billing truth
  billing: "free" | "subscription" | "one_time";
  stripePriceEnvKey?: string; // env var holding the Stripe Price ID
  termDays?: number; // Event Pass only
};

export const PLANS: Plan[] = [
  {
    id: "free",
    tier: "free",
    name: "Free",
    storageBytes: 2 * GIGABYTE,
    priceLabel: "$0",
    billing: "free",
  },
  {
    id: "pro_100",
    tier: "pro",
    name: "Pro 100 GB",
    storageBytes: 100 * GIGABYTE,
    priceLabel: "$9/mo",
    billing: "subscription",
    stripePriceEnvKey: "STRIPE_PRICE_PRO_100",
  },
  {
    id: "pro_500",
    tier: "pro",
    name: "Pro 500 GB",
    storageBytes: 500 * GIGABYTE,
    priceLabel: "$19/mo",
    billing: "subscription",
    stripePriceEnvKey: "STRIPE_PRICE_PRO_500",
  },
  {
    id: "pro_2tb",
    tier: "pro",
    name: "Pro 2 TB",
    storageBytes: 2 * TERABYTE,
    priceLabel: "$39/mo",
    billing: "subscription",
    stripePriceEnvKey: "STRIPE_PRICE_PRO_2TB",
  },
  {
    id: "event_pass",
    tier: "event_pass",
    name: "Event Pass",
    storageBytes: 75 * GIGABYTE,
    priceLabel: "$24 one-time",
    billing: "one_time",
    stripePriceEnvKey: "STRIPE_PRICE_EVENT_PASS",
    termDays: 365,
  },
];

/** Events that may exist per tier — the free→paid wall. null = unlimited. */
export const MAX_EVENTS: Record<Tier, number | null> = {
  free: 1,
  pro: null,
  event_pass: 1,
};

/** Monthly uploaded-bytes (ingress) cap — anti-abuse, unmarketed, never refunds. null = unmetered. */
export const MONTHLY_INGRESS_BYTES: Record<Tier, number | null> = {
  free: 20 * GIGABYTE, // generous; only catches extreme churn
  pro: null, // revisit — likely a high multiple of the storage cap
  event_pass: null,
};

/** Host event-settings gated to paid tiers (locked + upgrade hint on Free). */
export const GATED_EVENT_SETTINGS = ["require_email"] as const;
export function isSettingLocked(
  _setting: (typeof GATED_EVENT_SETTINGS)[number],
  tier: Tier,
) {
  return tier === "free";
}

export function withinStorage(usedBytes: number, capBytes: number): boolean {
  return usedBytes <= capBytes;
}

/** "≈ X photos or Y min of video" for the pricing page, from a byte cap. */
const AVG_PHOTO_BYTES = 4 * 1024 ** 2; // ~4 MB
const VIDEO_BYTES_PER_MIN = 150 * 1024 ** 2; // ~150 MB/min @ 1080p
export function friendlyCapacity(bytes: number) {
  return {
    photos: Math.round(bytes / AVG_PHOTO_BYTES),
    videoMinutes: Math.round(bytes / VIDEO_BYTES_PER_MIN),
  };
}
```

## Stripe dashboard setup (guide for Will — TO WRITE in Phase 4)

When Phase 4 starts, this section becomes a step-by-step of what to do in the Stripe
dashboard. It will cover:

- **Products + Prices** to create: 3 Pro subscription Prices (100 GB / 500 GB / 2 TB)
  and 1 one-time Event Pass Price — copy each Price ID into the env vars below.
- **Env vars** to set (`.env.local` + Vercel): `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PRICE_PRO_100` / `_PRO_500` / `_PRO_2TB` /
  `_EVENT_PASS`.
- **Webhook endpoint** to register (the raw-body route) + which events to send.
- **Billing Portal** configuration (so hosts can manage/cancel).

_(Left as a stub on purpose — written when Phase 4 is the active phase.)_
