# Partyreel — Pricing & tiers

> ROLE: the plans: their prices, limits and model, Pro's case, the unit economics, and the Stripe and email setup a
> human runs, the test-to-live cutover included. · NOT HERE: the product why (→ [`PRD.md`](PRD.md) "Monetization and
> anti-abuse (the why behind the schema)" and "Data retention and lifecycle"), the engineering (cap enforcement, the
> webhook and provisioning: → [`systems/billing-caps.md`](systems/billing-caps.md)), the lifecycle sweeps
> (→ [`systems/lifecycle-recovery.md`](systems/lifecycle-recovery.md)).
> GROWS BY: refined in place; [`src/lib/constants/tiers.ts`](../src/lib/constants/tiers.ts) is the source of every
> number, and where this doc and the code disagree, the code wins.

Stripe runs in TEST mode (account `acct_1TcStrPtjqmVkBwk`); going live is a launch switch ("Test to live cutover"
below).

## Model

- **Storage-based, not item counts.** A plan is a total stored-bytes cap. `profiles.tier` is the **billing category**
  (`free | pro | event_pass`); the granted cap lives in `profiles.storage_cap_bytes` (set by the Stripe webhook from
  the purchased plan), so Pro's storage selector is just different caps under `tier="pro"`.
- **Stripe Prices are the billing truth**, referenced by env key; `tiers.ts` carries the plan shape and the display
  labels, and `tier_limits()` in SQL mirrors its limits. A price change is a new Stripe Price, its env value (a
  redeploy) and the label, together.
- **Pro's case is what one big event needs (videos, more storage, the longer reel), never only hosting again:** most
  paid hosts hold one event, a wedding above all, so a line that sells Pro as "for your next event" loses them.
- **The monthly ingress meter** (bytes uploaded per month; never refunded on delete; unmarketed) is the anti-abuse
  guard, because storage caps alone don't stop delete-and-re-upload bandwidth burn. Free's bound is a flat 20 GB; a
  paid plan's is a multiple of its effective storage cap (`INGRESS_CAP_MULTIPLIER`, 3), so the bound scales with
  what the host pays for, needs no new figure per plan and stays silently tunable. It is generous by design (3× is a
  full extra refill of headroom), because the one outcome worth engineering against is a false positive quietly
  blocking a paying host; nothing in `/admin` shows a host's meter, and there is no manual override.
- **A marketed number can only ever move UP.** Grandfathering makes every published limit sticky, so each one lands at
  the conservative-but-generous end: raising a limit later is a gift, lowering it is a broken promise. That asymmetry,
  not precision, is what picks these numbers.
- **No watermarks on photos or the album, any tier** (only the free reel carries a small mark).
- **The universal per-file limit** (every plan) lives in `lib/media/limits.ts`: **10 GB per file, photos and videos
  alike.** Size is the only per-file gate (a host may set a lower one per event), and there is no duration cap.

## Tiers

| Plan           | Price                      | Storage | ≈ holds                              | Events                      |
| -------------- | -------------------------- | ------- | ------------------------------------ | --------------------------- |
| **Free**       | $0                         | 2 GB    | 512 photos (photos only)             | 1                           |
| **Pro 100 GB** | $9/mo or $90/yr            | 100 GB  | 25,600 photos or 11 hours of video   | unlimited                   |
| **Pro 500 GB** | $19/mo or $190/yr          | 500 GB  | 128,000 photos or 57 hours of video  | unlimited                   |
| **Pro 2 TB**   | $39/mo or $390/yr          | 2 TB    | 524,288 photos or 233 hours of video | unlimited                   |
| **Event Pass** | $24 one-time, $15 to renew | 75 GB   | 19,200 photos or 9 hours of video    | 1 per pass, each for a year |

The ≈ column is `formatCapacity` in `tiers.ts` (about 4 MB a photo and 150 MB a minute of 1080p video), the phrase
/pricing and the app print; the site derives it from the GB and never types it.

- **Annual Pro is exactly ×10 the monthly, marketed as "two months free"** (a Vitest pin holds each yearly label at
  10× its sibling). Why not deeper: a full 2 TB plan costs about $369 a year in storage, about what a 20% discount
  would charge ($374), so ×10 (16.7% off) is the deepest uniform discount the catalog carries without the top plan
  going underwater, and starting conservative leaves deepening as a later gift. The yearly Stripe prices live on the
  SAME products as the monthly ones (one product per size, so the size reads the same in Checkout and on Stripe's
  confirm page); env keys `STRIPE_PRICE_PRO_{100,500,2TB}_YR`. A Pro host moves between sizes and cadences from the
  app's plan sheet (`/api/stripe/change-plan`, `proration_behavior: always_invoice`), and a pass holder's prorated
  credit lands as customer balance, which pays the NEXT invoice: on yearly, that is a year out (never lost).
- **A plan change never leaves a host storing more than the new cap** (Will, 2026-09-22). Any Pro purchase or Pro
  size change must hold what the host already stores (active bytes against the plan's plain cap); a smaller one
  is refused with the numbers ("You're storing 140 GB. Pro 100 GB holds 100 GB, so remove 40 GB first, or choose
  Pro 500 GB.") until they remove enough. An Event Pass is never refused (passes stack). So Partyreel never
  removes media, or pays for storage beyond the plan, because of a purchase; the 45-day over-capacity grace
  remains for a plan that ENDS. The mechanism: [`systems/billing-caps.md`](systems/billing-caps.md).
- **What Free gates.** Password locks and custom links are paid (`GATED_EVENT_SETTINGS` in `tiers.ts`, locked on
  Free), and **video is paid** (Pro and the Event Pass; a free event is photos-only for guests AND the host, enforced
  at upload in `create_media` / `create_media_as_host` and mirrored client-side by `videosAllowedForTier`). **Require
  verified emails** and **Require an upload to view** are free on every plan: the first on by default (allowing a
  typed, unverified name is the opt-in), the second off. **Reel length is tier-capped** (`MAX_REEL_SECONDS`:
  30s Free / 60s paid); reel generation itself is free for every tier (watermark on Free). 30s is the
  free-tier category norm and still holds a real 12 to 15 moment montage: 15s reads stingy, and past 60s a
  montage sags while losing its Reels and TikTok reach.
  The first-event experience must still shine; it sells the upgrade. **The upgrade triggers** (each opens the in-app
  pricing sheet on its own reason): a second event, outgrowing the first event's storage, wanting video, or a password
  lock or custom link.
- **Event Pass economics.** Passes **STACK**: each purchase is a ledger row granting +1 event slot and +75 GB for its
  own one-year window (`event_passes` + `profiles.event_slots`). Moving to Pro converts every live pass into
  **PRORATED CREDIT**: the unused fraction of what was actually paid becomes Stripe customer balance that pays down
  upcoming Pro invoices (nothing banked, nothing lost), at a Pro size that holds what the passes store. The renewal ($15, `STRIPE_PRICE_EVENT_PASS_RENEWAL`) is sold
  only to a holder with a pass window active now (read from the ledger at checkout) and chains a new window onto the
  soonest-expiring active pass: it extends, never resets, and an unopened renewal year credits at 100%. The
  dashboard's "Renew Event Pass" button and the pre-expiry nudge email (14 days out) point at it. The renewal holds at
  $15 because a typical album costs us $3 to $5 a year and a renewal adds almost no ingress, so it is priced as an
  easy yes (revisit if full-use renewals cluster). At expiry without renewal the account recomputes down (eventually
  to Free, with the over-capacity grace if it holds more than Free's cap: [`PRD.md`](PRD.md) "Data retention and
  lifecycle"). /pricing surfaces the renewal price (the pass card, the table and the FAQ) through
  `EVENT_PASS_RENEWAL_PRICE_LABEL` in `tiers.ts`.

## Grandfathering

The policy for the first price change: a **paid subscription keeps its join-time rate for as long as the plan stays
active**. Grandfathered plans also **inherit beneficial changes** (price drops, storage bumps) but never adverse ones.
A lapse to Free **breaks** grandfathering; re-subscribing pays current pricing. Mechanically this means **several
historical Stripe Price IDs per plan**: `planForPriceId` (`src/lib/stripe/plans.ts`) must map every historical Price
ID to its plan (the newest is the public offer), and Price IDs stay out of the client-safe `tiers.ts`. Unbuilt:
`planForPriceId` maps one Price ID per plan, and the build lands with the first real price change
([`ROADMAP.md`](ROADMAP.md) "Billing follow-ons").

## Unit economics

R2 storage is **$0.015 a GB-month with zero egress**. Full-use storage cost a month: $1.50 (100 GB), $7.50 (500 GB),
about $31 (2 TB), about $1.13 (the 75 GB Event Pass). Healthy except **Pro 2 TB at $39, which is thin if fully
used**: most hosts won't fill it, but the top plan is priced as if someone does (the levers if margins matter: $49,
or a 1 TB top plan).

**No cold storage.** R2 Infrequent Access is only a third cheaper ($0.01 against $0.015 a GB-month) and adds a
$0.01/GB retrieval fee and a 30-day minimum storage charge, so on a 30-day recovery tail the saving is small and a
single restore costs more than it saved; true archival (S3 Glacier) is a separate cross-cloud project with slow, paid
retrieval. The lever if tail cost grows: an R2 lifecycle rule moving tail objects to Infrequent Access, with next to
no app code.

## `tiers.ts`, the live source

[`src/lib/constants/tiers.ts`](../src/lib/constants/tiers.ts) is the source of truth: read it, never a doc copy.
Beyond the tables above it holds the `Plan` records with their Stripe price env keys, `MAX_EVENTS`, the ingress model
(`MONTHLY_INGRESS_BYTES.free` = 20 GB; paid plans derive `INGRESS_CAP_MULTIPLIER` (3) × the storage cap through
`monthlyIngressCap`), `GATED_EVENT_SETTINGS` (password + custom_slug), `MAX_REEL_SECONDS` (30/60), and the display
helpers `friendlyCapacity` and `formatCapacity`. The DB `tier_type` enum still lists a retired `max` (coerced by
`toBillingTier()`), and the SQL `tier_limits()` must mirror the file (`tier-limits-parity.test.ts` guards it).

## Stripe setup

The catalog lives in TEST mode and is created with the Stripe MCP; the webhook endpoint and the default Billing Portal
configuration are dashboard jobs, the change-plan portal configuration is an API job (the dashboard edits only the
default one), and the env values are the human's to paste.

**Check the mode before any write.** The Stripe MCP reaches one account in one mode: `list_available_accounts_or_orgs`
shows its `livemode` (false today), and every call names a `livemode` that must match it. A write in the wrong mode
lands resources in the wrong catalog.

**The catalog: 4 products, 8 prices.** One product per storage size, so the size shows in Checkout and on Stripe's
confirm page for a plan change, and **each yearly price rides the SAME product as its monthly sibling**, so a size
reads as one product at either cadence.

| Product              | Price      | Type      | Test Price ID                    | Env key                           |
| -------------------- | ---------- | --------- | -------------------------------- | --------------------------------- |
| Partyreel Pro 100 GB | $9 / mo    | recurring | `price_1TcTbgPtjqmVkBwk7qfplvly` | `STRIPE_PRICE_PRO_100`            |
| Partyreel Pro 100 GB | $90 / yr   | recurring | `price_1U9FInPtjqmVkBwkKKmtg9LL` | `STRIPE_PRICE_PRO_100_YR`         |
| Partyreel Pro 500 GB | $19 / mo   | recurring | `price_1TcTbtPtjqmVkBwkIT8mPznE` | `STRIPE_PRICE_PRO_500`            |
| Partyreel Pro 500 GB | $190 / yr  | recurring | `price_1U9FInPtjqmVkBwkcadWJaH3` | `STRIPE_PRICE_PRO_500_YR`         |
| Partyreel Pro 2 TB   | $39 / mo   | recurring | `price_1TcTbwPtjqmVkBwkHQpJuYOr` | `STRIPE_PRICE_PRO_2TB`            |
| Partyreel Pro 2 TB   | $390 / yr  | recurring | `price_1U9FIoPtjqmVkBwkiaviRh0Y` | `STRIPE_PRICE_PRO_2TB_YR`         |
| Partyreel Event Pass | $24 once   | one-time  | `price_1TcUcDPtjqmVkBwkJCypwyVb` | `STRIPE_PRICE_EVENT_PASS`         |
| Partyreel Event Pass | $15 renew  | one-time  | `price_1TcVuOPtjqmVkBwkTCXTKOIs` | `STRIPE_PRICE_EVENT_PASS_RENEWAL` |

The three Pro products are named with an em-dash in the test catalog ("Partyreel Pro — 100 GB"), and those names
render in Checkout and in the portal, which makes them user-facing copy: the live catalog is created without one.

**The webhook endpoint** (dashboard, Developers → Webhooks): `https://partyreel.com/api/stripe/webhook`, sending
`checkout.session.completed`, `customer.subscription.created` / `.updated` / `.deleted` and `invoice.payment_failed`;
its signing secret (`whsec_…`) is `STRIPE_WEBHOOK_SECRET`. The route acts on the first four: a failed payment reaches
it as the subscription's status (`past_due` keeps Pro through dunning; a subscription that ends drops the host to
Free). The test account also carries a temporary endpoint for the `launch-prep` alias, removed in ROADMAP's program
teardown.

**The Billing Portal: two configurations, two jobs.**

- **The default** (dashboard, Settings → Billing → Customer portal): payment-method update, invoice history,
  customer details and cancellation (at the period's end), with **plan switching OFF**. Its switcher cannot know what
  a host stores, and its quantity stepper (no maximum) could bill two or three times for one cap, so sizes and
  cadences never change here. TEST: `bpc_1TcTxWPtjqmVkBwkcAldFEZA`.
- **The change-plan configuration** (API only), tagged `metadata.partyreel_purpose=change_plan`:
  `subscription_update` on over **all six Pro prices** (both cadences on each product),
  `default_allowed_updates: ["price"]`, quantity adjustment off, `proration_behavior: always_invoice`,
  `billing_cycle_anchor: unchanged`, no period-end scheduling; cancellation, invoice history and customer update
  off; payment-method update on (Stripe requires it beside subscription updates). The app finds it by that tag (no
  env value) and only ever opens it as a one-price confirm flow after the storage check. TEST:
  `bpc_1UIhooPtjqmVkBwkcLe9YgYN`.

**The ten env values** are the whole Stripe surface, and therefore the whole cutover: pasted into `.env.local` and
Vercel, then a redeploy. Only the first two are secrets; the eight price IDs are public ids.

- `STRIPE_SECRET_KEY`: the mode's secret key (`sk_test_…` today).
- `STRIPE_WEBHOOK_SECRET`: the `whsec_…` from the webhook endpoint.
- `STRIPE_PRICE_PRO_100` / `_500` / `_2TB`: the three monthly Pro prices.
- `STRIPE_PRICE_PRO_100_YR` / `_500_YR` / `_2TB_YR`: the three annual Pro prices.
- `STRIPE_PRICE_EVENT_PASS` and `STRIPE_PRICE_EVENT_PASS_RENEWAL`: the two one-time prices.

Five are hard-asserted at request time (`assertStripeEnv()`: the key, the webhook secret and the three monthly Pro
prices). The annual trio and the two pass prices are validated lazily by `priceIdForPlan()` /
`eventPassRenewalPriceId()`, so a missing one breaks exactly that checkout rather than the whole app (an unset annual
price fails only when a host picks yearly). `.env.example` lists all ten (`env-example-parity.test.ts` keeps it
honest).

**The Event Pass needs nothing more.** Its checkout is `mode: "payment"`, so no `customer.subscription.*` event ever
fires and the portal never shows a pass; provisioning rides `checkout.session.completed` (the ledger mechanics:
[`systems/billing-caps.md`](systems/billing-caps.md)).

## Test to live cutover

**The code needs ZERO changes to go live**: the keys, the webhook secret and the Price IDs are all env-referenced
(`STRIPE_*`), the change-plan portal configuration is found by its tag, the `apiVersion` pin is mode-independent,
and URLs come from `getSiteUrl()`. Going live is purely **re-creating the Stripe resources in LIVE mode and swapping
the env values**. Test and live are fully separate in Stripe (products, prices, webhook endpoints, both portal
configurations, coupons and API keys all exist per mode), so none of the test setup carries over.

**Prerequisite:** the Stripe account activated for live payments (business details and a bank account); live mode is
inert until then.

1. **Switch to live mode**: the Stripe MCP on the live account, or the dashboard in live mode. **Verify first:**
   `list_available_accounts_or_orgs` → `livemode: true`.
2. **Re-create the 4 products and 8 prices in LIVE** (the Stripe MCP or the dashboard): the three Pro products each
   with **both** a monthly and a yearly price (100 GB $9/$90, 500 GB $19/$190, 2 TB $39/$390), named without the
   em-dash, and the Event Pass product with **both** one-time prices ($24 purchase, $15 renewal). Capture the eight
   new **live** `price_…` IDs. Put each yearly price on the same product as its monthly sibling.
3. **Create the webhook endpoint in LIVE** (dashboard, live mode): the URL and the five events above; copy the
   **live** signing secret (`whsec_…`).
4. **Configure both portal configurations in LIVE**, as above: the default in the dashboard (card, invoices,
   customer details, cancellation; plan switching OFF), and the change-plan configuration through the API over
   **all six live Pro prices** with the SAME tag, `metadata.partyreel_purpose=change_plan`. No env value names it;
   until one live configuration carries the tag, a Pro host's Change plan answers "unavailable" (it fails closed,
   never onto the default).
5. **Swap the ten env values** in `.env.local` and **Vercel**, then redeploy: `STRIPE_SECRET_KEY` = `sk_live_…`,
   `STRIPE_WEBHOOK_SECRET` = the **live** `whsec_…`, and all eight `STRIPE_PRICE_*` IDs = the **live** price IDs.
   Ten values, one redeploy: a half-swapped set means an unswapped plan checks out against the wrong mode's price
   and 500s.
6. **Smoke-test carefully: real cards charge real money.** One real upgrade with a real card, confirm `tier='pro'`
   (Supabase MCP), then cancel and refund. The flow is proven in test mode (identical code), so this is a
   keys-and-resources check; add one **yearly** checkout and one **Change plan** switch (Stripe's confirm page for
   one price at quantity 1, then back in the app), which have never run against live keys.

**Rollback:** revert the ten env values to the test ones in Vercel and redeploy (live Stripe data persists, unused
while the keys are test).

## Email: Resend and Supabase Auth

**The provider is Resend** (the free tier sends 3,000 emails a month, at most 100 a day; the paid tier starts at $20
a month for 50,000, with no daily cap). All lifecycle email goes through `sendOnce()` (deduped on `sent_emails`), so
the daily cron sends at most once per state. Its env is `RESEND_API_KEY` and `EMAIL_FROM`
(`Partyreel <noreply@partyreel.com>`, on the verified `partyreel.com` sending domain), in `.env.local` and Vercel.

**Supabase Auth sends through the same domain over Resend SMTP** (the sign-in code and magic link, the confirm and
reset templates), because Supabase's built-in sender allows only a couple of emails an hour project-wide. It is set
in the dashboard (Authentication → Emails → SMTP Settings) or through the Management API's `config/auth` with a
personal access token; the Supabase MCP has no tool for it:

| Field                     | Value                                                                      |
| ------------------------- | -------------------------------------------------------------------------- |
| Sender email              | `noreply@partyreel.com` (matches `EMAIL_FROM`)                             |
| Sender name               | `Partyreel`                                                                |
| Host                      | `smtp.resend.com`                                                          |
| Port                      | `465` (implicit TLS; `587` STARTTLS also works)                            |
| Username                  | `resend`                                                                   |
| Password                  | the `RESEND_API_KEY` value, so rotating that key means updating this field |
| Minimum interval per user | 60 s (the sign-in form's `RESEND_COOLDOWN_S` matches it)                   |

- **The email rate limit** (Authentication → Rate Limits → "Rate limit for sending emails") is editable only with
  custom SMTP on (Supabase starts it at 30 an hour) and sits at 100 an hour; raising it before a large
  Require-verified-emails event is in ROADMAP's launch checkpoint.
- **The quota is shared**: auth codes and lifecycle email draw on one Resend quota, so a crowd confirming emails in
  one evening can reach the free tier's daily cap; the paid tier lifts it.
- **Verify a change** by requesting a sign-in code at `/login`: it arrives from `noreply@partyreel.com` (never
  `…mail.app.supabase.io`), and the send shows in Resend → Emails.
