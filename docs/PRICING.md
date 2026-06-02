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
| **Free**       | $0                        | 2 GB    | ~500 photos (no video)        | 1            |
| **Pro 100 GB** | $9/mo                     | 100 GB  | ~25k photos / ~10 hrs video   | unlimited    |
| **Pro 500 GB** | $19/mo                    | 500 GB  | ~125k photos / ~50 hrs video  | unlimited    |
| **Pro 2 TB**   | $39/mo                    | 2 TB    | ~500k photos / ~200 hrs video | unlimited    |
| **Event Pass** | $24 one-time, ~$15/yr ren | 75 GB   | ~37k photos / ~15 hrs video   | 1 event/~1yr |

- **Free** also gates features by tier: `require_email` + password-protected albums are
  locked on Free, and **video is Pro-only** (Phase 2 — a free event is photos-only for guests
  AND the host; video comes with Pro + Event Pass, enforced at upload in `create_media`/
  `create_media_as_host`, mirrored client-side by `videosAllowedForTier`). The first-event
  experience must still shine; it sells the upgrade. **Primary upgrade triggers:** a 2nd event,
  outgrowing event #1's storage, wanting video, or password/verified-email access controls.
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

## Stripe setup (Cut 4b)

Most of this is **automated via the Stripe MCP** (the agent creates the products, prices,
webhook endpoint, and Billing Portal config). The human only pastes the env values the
agent can't set. **Build in TEST mode; re-create in live + swap keys before launch.**

**Mode caveat (learned 2026-05-29):** the Stripe MCP connector is bound to one mode by its
key — there's no per-call mode flag. The first connector was **live** (`create_product`
returned `livemode:true`), so test-mode automation needs a **test-mode connector/key**.
Always check the mode before creating resources.

**Agent creates via MCP (DONE in test mode 2026-05-29):** the 3 Pro products + recurring
monthly USD prices — Partyreel Pro 100 GB ($9) `price_1TcTbgPtjqmVkBwk7qfplvly`, 500 GB
($19) `price_1TcTbtPtjqmVkBwkIT8mPznE`, 2 TB ($39) `price_1TcTbwPtjqmVkBwkHQpJuYOr`.
(Separate products so the storage shows in Checkout + the portal's plan-switcher.) _Note:
the MCP can NOT create webhook endpoints or portal configs — those are dashboard tasks
below._

**Human does in the Stripe dashboard (test mode):**

- **Webhook endpoint** (Developers/Workbench → Webhooks) → `https://partyreel.com/api/stripe/webhook`,
  events: `checkout.session.completed`, `customer.subscription.created` / `.updated` /
  `.deleted`, `invoice.payment_failed`. Copy the signing secret (`whsec_…`).
- **Billing Portal** (Settings → Billing → Customer portal): enable payment-method update +
  subscription cancellation + (optional) plan switching across the 3 Pro products; **Save**.

**Human pastes into `.env.local` + Vercel, then redeploys** (the agent can't set Vercel env
or read the secret key):

- `STRIPE_SECRET_KEY` — the **test** secret key (Stripe dashboard → API keys; `sk_test_…`).
- `STRIPE_WEBHOOK_SECRET` — the `whsec_…` from the webhook endpoint above.
- `STRIPE_PRICE_PRO_100` / `_PRO_500` / `_PRO_2TB` — the 3 price IDs above.

**Verified in production — test mode (2026-05-29):** a live checkout (Pro 500 GB, card
`4242 4242 4242 4242`) flipped `tier='pro'` + `storage_cap_bytes=500 GB` via the webhook;
the portal opened; an immediate `cancel_subscription` downgraded back to Free.

**Cut 4c — Event Pass (wired, test mode):** one-time price
`price_1TcUcDPtjqmVkBwkJCypwyVb` ($24, `type: one_time`) → set
`STRIPE_PRICE_EVENT_PASS` in `.env.local` + Vercel. Checkout uses `mode:"payment"`;
provisioned from `checkout.session.completed` (`metadata.plan_id="event_pass"`) →
`tier='event_pass'`, 75 GB, `tier_expires_at = session.created + 365 d`; the purge cron's
expiry sweep downgrades lapsed passes to Free. No new webhook event (it already listens to
`checkout.session.completed`) and no portal change. (Live cutover: see "Test → Live" — it
already lists `_EVENT_PASS`.)

## Test → Live cutover (reference guide)

**The code needs ZERO changes to go live** — keys, the webhook secret, and the Price IDs
are all env-referenced (`STRIPE_*`), the `apiVersion` pin is mode-independent, and URLs come
from `getSiteUrl()`. Going live is purely: **re-create the Stripe resources in LIVE mode +
swap the env values.** Test and live are fully separate in Stripe — products, prices,
webhook endpoints, portal config, coupons, and API keys all exist **independently per
mode**, so NONE of the test-mode setup carries over.

**Prerequisite:** activate the Stripe account for live payments (business details + bank
account) — live mode is inert until the account is activated.

**Steps (repeat the test-mode setup, but in LIVE):**

1. **Switch to live mode.** Point the Stripe MCP connector at a **live** key (or use the
   dashboard in live mode). **Verify first:** `retrieve_balance` → `livemode:true` (or a
   created object's `livemode`). _(The connector has no per-call mode flag — wrong mode =
   resources in the wrong place; this bit us once.)_
2. **Re-create the 3 Pro products + recurring prices in LIVE** (Stripe MCP `create_product`
   + `create_price`, or the dashboard): 100 GB $9/mo, 500 GB $19/mo, 2 TB $39/mo. Capture
   the new **live** `price_…` IDs (they differ from the test IDs above). _(Cut 4c: also the
   one-time Event Pass price.)_
3. **Create the webhook endpoint in LIVE** (dashboard → Webhooks, live mode) →
   `https://partyreel.com/api/stripe/webhook`, events `checkout.session.completed` +
   `customer.subscription.created`/`.updated`/`.deleted` + `invoice.payment_failed`. Copy
   the **live** signing secret (`whsec_…`). _(MCP can't create webhook endpoints.)_
4. **Configure the Billing Portal in LIVE** (Settings → Billing → Customer portal, live
   mode): payment-method update + cancellation + plan switching across the 3 **live** Pro
   products; Save. _(Per-mode — the test portal config does NOT carry over; MCP can't do
   this.)_
5. **Swap the env values** in `.env.local` + **Vercel** → redeploy: `STRIPE_SECRET_KEY` =
   `sk_live_…`, `STRIPE_WEBHOOK_SECRET` = the **live** `whsec_…`, and
   `STRIPE_PRICE_PRO_100/_500/_2TB` (+ `_EVENT_PASS`) = the **live** price IDs.
6. **Smoke-test carefully — real cards charge real money.** Do one real upgrade with a real
   card, confirm `tier='pro'` (Supabase MCP), then cancel/refund. The flow itself is already
   proven in test mode (identical code), so this is just a keys/resources sanity check.

**Rollback:** revert the 5 env values to the test ones in Vercel + redeploy. (Live Stripe
data persists but is unused while keys are test.)

## Fast-follows — email (Resend) + over-capacity retention + Event Pass renewal

**Provider = Resend** (free tier 3,000 emails/mo; $20/mo = 50k). All lifecycle email goes
through `sendOnce()` (deduped via `sent_emails`) so the daily cron sends at most once per
state — stays well under the free tier early. **Human setup:** create a Resend API key +
**verify a sending domain** (DNS) → set `RESEND_API_KEY` + `EMAIL_FROM`
(e.g. `Partyreel <noreply@partyreel.com>`) in `.env.local` + Vercel.

**Event Pass renewal:** a cheaper **$15 one-time renewal price** (test
`price_1TcVuOPtjqmVkBwkTCXTKOIs`) on the same Event Pass product → set
`STRIPE_PRICE_EVENT_PASS_RENEWAL`. Gated to current/recent pass holders; the dashboard
"Renew Event Pass" button + the 14-day pre-expiry nudge email point at it. Live cutover:
re-create the $15 price in live + set the env var (add to the cutover checklist above).

**Over-capacity retention:** a lapsed account over its cap gets a **45-day grace** (media
stays fully accessible + warning emails), then **auto-reduce** (largest-first) into the
Phase-3 7-day removed tail → hard-delete reclaims the bytes.

**Cold storage — evaluated + rejected (2026-05-29).** R2 Infrequent Access is only ~33%
cheaper ($0.015→$0.01/GB-mo) and adds a $0.01/GB retrieval fee + a 30-day minimum-duration
charge — not worth it on a short tail. True archival (S3 Glacier, ~15×) is a separate
cross-cloud project with slow, paid retrieval. **Future lever (if tail cost grows):**
transition tail objects to IA via an R2 object-lifecycle rule — near-zero app code.
