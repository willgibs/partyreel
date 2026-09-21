# Partyreel — Pricing & tiers

Canonical home for the tier/pricing model. The product **why** is in
[`PRD.md`](PRD.md) ("Monetization & anti-abuse" + "Data retention & lifecycle"); the
**engineering** (cap enforcement, the Stripe webhook/provisioning) is in
[`systems/billing-caps.md`](systems/billing-caps.md). Prices were **decided** (2026-05-29) and the
storage-cap model + Stripe billing (Pro subs, Event Pass, portal) are **shipped + live** (currently TEST
mode; the live cutover is a launch task).

## Model

- **Storage-based, not item counts.** A tier is a total stored-bytes cap. `profiles.tier`
  is the **billing category** (`free | pro | event_pass`); the granted cap lives in
  `profiles.storage_cap_bytes` (set by the Stripe webhook from the purchased option),
  so Pro's storage selector is just different caps under `tier="pro"`.
- **Prices live in Stripe** (env-referenced Price IDs) so they change without a deploy;
  GB amounts + structure live in `tiers.ts` and are mirrored in `tier_limits()` SQL.
- **Monthly ingress meter** (bytes uploaded per month; never refunds on delete;
  unmarketed) is the anti-abuse guard — storage caps alone don't stop delete→re-upload
  egress burn. It is a MULTIPLIER of the effective storage cap rather than a static number, so the
  abuse bound scales with revenue instead of needing a new figure per plan. It stays unmarketed and
  silently tunable, and it carries admin visibility plus a manual override, because the one outcome
  worth engineering against is a false positive quietly blocking a paying host.
- **A marketed number can only ever move UP.** Grandfathering makes every published limit sticky, so each
  one lands at the conservative-but-generous end: raising a limit later is a gift, lowering it is a
  broken promise. That asymmetry, not precision, is what picks these numbers.
- **No watermarks on photos or the album, any tier** (only the free reel carries a small mark).
  The universal per-file limit (all tiers) stays in `lib/media/limits.ts`: **10 GB per file,
  photos and videos alike — size is the ONLY per-file gate, there is no duration cap** (the old
  5-min/2-GB/50-MB trio was retired there long ago; this doc had drifted).

## Tiers (locked 2026-05-29)

| Plan           | Price                     | Storage | ≈ holds                       | Events       |
| -------------- | ------------------------- | ------- | ----------------------------- | ------------ |
| **Free**       | $0                        | 2 GB    | ~500 photos (no video)        | 1            |
| **Pro 100 GB** | $9/mo or $90/yr           | 100 GB  | ~25k photos / ~10 hrs video   | unlimited    |
| **Pro 500 GB** | $19/mo or $190/yr         | 500 GB  | ~125k photos / ~50 hrs video  | unlimited    |
| **Pro 2 TB**   | $39/mo or $390/yr         | 2 TB    | ~500k photos / ~200 hrs video | unlimited    |
| **Event Pass** | $24 one-time, $15/yr ren  | 75 GB   | ~19k photos / ~8.5 hrs video  | 1 per pass/~1yr |

- **Annual Pro (ruled 2026-08-27, built same day): exactly ×10 the monthly, marketed as "two months
  free"** (a Vitest pin holds each yearly label at 10× its sibling). Why 2-months-free and not
  deeper: the 2 TB tier's worst-case full-use cost (~$372/yr) sits AT a 20% discount, so 16.7% is
  the deepest uniform discount the catalog carries without the top tier going underwater; and under
  the only-move-in-the-customer's-favor rule, starting conservative leaves deepening as a free
  future win. Yearly Stripe prices live on the SAME products as monthly (portal
  monthly↔yearly switching rides same-product active prices, `proration_behavior:
  always_invoice`); env keys `STRIPE_PRICE_PRO_{100,500,2TB}_YR`. Note: a pass holder's prorated
  credit lands as customer balance, which applies to the NEXT invoice — on yearly
  that's a year out (never lost; special-case only if it ever feels wrong in practice).

- **Free** also gates features by tier: **password-protected albums + custom slugs** are locked on
  Free (`GATED_EVENT_SETTINGS` in `tiers.ts`; "Require verified emails" (renamed from "require accounts
  to upload" in the identity reshape, 2026-09-21) became FREE + default-on 2026-06-21 — allowing a
  typed, unverified name is the opt-in), and **video is Pro-only** (a free event is
  photos-only for guests AND the host; enforced at upload in `create_media`/`create_media_as_host`,
  mirrored client-side by `videosAllowedForTier`). **Reel length is tier-capped** (`MAX_REEL_SECONDS`:
  30s Free / 60s paid); reel generation itself is free for every tier (watermark on Free). 30s is the
  free-tier category norm and still holds a real 12 to 15 moment montage: 15s reads stingy, and past 60s a
  montage sags while losing its Reels and TikTok reach.
  The first-event experience must still shine; it sells the upgrade. **Primary upgrade triggers:** a
  2nd event, outgrowing event #1's storage, wanting video, or password/custom-slug controls.
- **Saving events is FREE** (Phase 3): any signed-in visitor can save an event to
  their dashboard. Deliberately ungated — it's the account-creation growth driver (a saved event
  is the reason a guest makes a free account, whether they arrive with one or confirm the email
  behind a typed name later, on the identity reshape's capture flow), not a paid perk.
- **Event Pass economics v2 (ruled + BUILT 2026-08-27):** passes **STACK** (each purchase
  is a ledger row granting +1 event slot and +75 GB for its own ~1-yr window; `event_passes` +
  `profiles.event_slots`), and moving to Pro converts every live pass as **PRORATED CREDIT**
  (unused fraction of what was actually paid becomes Stripe customer balance that pays down
  upcoming Pro invoices; nothing banked, nothing lost). Renewal ($15,
  `STRIPE_PRICE_EVENT_PASS_RENEWAL`) chains a new window onto the
  soonest-expiring active pass: extends, never resets, and an unopened renewal year credits at
  100%. The renewal price holds at $15 because a typical album costs us $3 to $5 a year and a renewal adds
  almost no ingress, so it is priced as an easy yes; revisit only if full-utilization renewals cluster. At expiry without renewal the account recomputes down (eventually Free + the over-capacity
  retention flow). The renewal price is SURFACED on /pricing (the pass card + table + FAQ) via
  `EVENT_PASS_RENEWAL_PRICE_LABEL` in `tiers.ts`.
- ≈ figures assume ~4 MB/photo and ~150 MB/min 1080p video — illustrative; the in-app
  "≈ X photos / Y video" is derived from the GB.

## Grandfathering (policy, ruled — not yet built)

When prices ever change: a **paid subscription keeps its join-time rate for as long as the plan stays
active**. Grandfathered plans additionally **inherit beneficial changes** (price drops, storage bumps)
but never adverse ones. A lapse to Free **breaks** grandfathering — re-subscribing pays current
pricing. Mechanically this means **multiple historical Stripe Price IDs per plan**: `planForPriceId`
must map every historical Price ID to its plan (the newest = the public offer), and Price IDs stay
out of the client-safe `tiers.ts`. The build lands with the first real price change
([`ROADMAP.md`](ROADMAP.md) "Billing follow-ons").

## Unit economics (sanity check)

R2 storage ≈ **$0.015/GB/mo, zero egress**. Full-use storage cost ≈ $1.50 (100 GB),
$7.50 (500 GB), **~$31 (2 TB)**, ~$1.13/mo (75 GB Event Pass). Healthy except the
**Pro 2 TB at $39 is thin if fully used** — most won't fill it, but price the top tier
assuming someone does (consider $49 or a 1 TB cap if margins matter).

## `tiers.ts` — the live source (snapshot removed)

The shape lives in [`src/lib/constants/tiers.ts`](../src/lib/constants/tiers.ts) — **the file is the
source of truth; read it, don't trust a doc copy** (an embedded snapshot here went stale and was
removed 2026-08-27). What the file holds beyond the tables above: the `Plan` records + Stripe price
env keys, `MAX_EVENTS`, the ingress model (`MONTHLY_INGRESS_BYTES.free = 20 GB`; paid tiers DERIVE
`INGRESS_CAP_MULTIPLIER (3) x storage cap`), `GATED_EVENT_SETTINGS` (password +
custom_slug), `MAX_REEL_SECONDS` (30/60), and the `friendlyCapacity` display helper. The DB
`tier_type` enum still lists `max` (retired; coerced by `toBillingTier()`), and the SQL
`tier_limits()` fn must mirror the file (a Vitest parity test guards it).

## Stripe setup (Cut 4b)

The catalog is **automated via the Stripe MCP** (the agent creates the products and prices).
The two dashboard-only jobs (webhook endpoint, Billing Portal) and the env values are the
human's. **Built in TEST mode; the live re-creation is the cutover below.**

**Mode caveat (learned 2026-05-29):** the Stripe MCP connector is bound to one mode by its
key — there's no per-call mode flag. The first connector was **live** (`create_product`
returned `livemode:true`), so test-mode automation needs a **test-mode connector/key**.
Always check the mode before creating resources.

**The catalog: 4 products, 8 prices** (agent-created via MCP; the ids below re-verified
against the test account 2026-09-02). Separate products per storage size so the size shows
in Checkout and in the portal's plan switcher, and **the yearly price rides the SAME product
as its monthly sibling** — same-product active prices are what the portal's monthly↔yearly
switch walks. _Note: the MCP can NOT create webhook endpoints or portal configs; those are
the dashboard tasks below._

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

_The three Pro products are named with an em-dash in Stripe today ("Partyreel Pro — 100 GB"),
and those names render in Checkout and in the portal: user-facing copy, so the live catalog
should be created without one (and the test names renamed when convenient)._

**Human does in the Stripe dashboard (test mode):**

- **Webhook endpoint** (Developers/Workbench → Webhooks) → `https://partyreel.com/api/stripe/webhook`,
  events: `checkout.session.completed`, `customer.subscription.created` / `.updated` /
  `.deleted`, `invoice.payment_failed`. Copy the signing secret (`whsec_…`).
- **Billing Portal** (Settings → Billing → Customer portal): payment-method update +
  subscription cancellation + plan switching across **all six Pro prices** (both intervals on
  each of the three products), `proration_behavior: always_invoice`; **Save**. Six, not three:
  the portal is the ONLY route between monthly and yearly (checkout refuses a second
  subscription for an active Pro), so a portal listing monthly prices alone strands every
  annual plan the moment someone subscribes.

**The ten env values** (the whole Stripe surface, and therefore the whole cutover). The human
pastes them into `.env.local` + Vercel, then redeploys; only the first two are secrets, the
eight price IDs are public ids.

- `STRIPE_SECRET_KEY` — the mode's secret key (Stripe dashboard → API keys; `sk_test_…` today).
- `STRIPE_WEBHOOK_SECRET` — the `whsec_…` from the webhook endpoint above.
- `STRIPE_PRICE_PRO_100` / `_500` / `_2TB` — the three monthly Pro prices.
- `STRIPE_PRICE_PRO_100_YR` / `_500_YR` / `_2TB_YR` — the three annual Pro prices.
- `STRIPE_PRICE_EVENT_PASS` and `STRIPE_PRICE_EVENT_PASS_RENEWAL` — the two one-time prices.

Only five are hard-asserted at request time (`assertStripeEnv()`: the key, the webhook secret
and the three monthly Pro prices). The annual trio and the two pass prices are validated
lazily by `priceIdForPlan()` / `eventPassRenewalPriceId()`, so a missing one breaks exactly
that checkout instead of the whole app — which also means an unset annual price fails only
when a host picks yearly. `.env.example` lists all ten (a Vitest parity test keeps it honest).

**Verified in production — test mode (2026-05-29):** a live checkout (Pro 500 GB, card
`4242 4242 4242 4242`) flipped `tier='pro'` + `storage_cap_bytes=500 GB` via the webhook;
the portal opened; an immediate `cancel_subscription` downgraded back to Free.

**Event Pass (wired, test mode):** the two one-time prices above. Checkout uses
`mode:"payment"`, so no `customer.subscription.*` ever fires; provisioning rides
`checkout.session.completed` (`metadata.plan_id="event_pass"`), which mints an `event_passes`
LEDGER row and recomputes the profile from the ledger: +1 event slot and +75 GB for
that row's own ~1-year window, stacking with any other live pass. The renewal price carries
`metadata.renewal="1"` and opens its window at the soonest-expiring active pass's expiry
(extends, never resets); the daily sweep recomputes holders down as windows lapse. No new
webhook event (it already listens to `checkout.session.completed`) and no portal change: a
pass is not a subscription, so the portal never shows one.

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
2. **Re-create the 4 products + 8 prices in LIVE** (Stripe MCP `create_product` +
   `create_price`, or the dashboard): the three Pro products each with **both** a monthly and
   a yearly price (100 GB $9/$90, 500 GB $19/$190, 2 TB $39/$390), and the Event Pass product
   with **both** one-time prices ($24 purchase, $15 renewal). Capture the eight new **live**
   `price_…` IDs (they differ from the test IDs above). Put each yearly price on the same
   product as its monthly sibling, or the portal's monthly↔yearly switch has nothing to walk.
3. **Create the webhook endpoint in LIVE** (dashboard → Webhooks, live mode) →
   `https://partyreel.com/api/stripe/webhook`, events `checkout.session.completed` +
   `customer.subscription.created`/`.updated`/`.deleted` + `invoice.payment_failed`. Copy
   the **live** signing secret (`whsec_…`). _(MCP can't create webhook endpoints.)_
4. **Configure the Billing Portal in LIVE** (Settings → Billing → Customer portal, live
   mode): payment-method update + cancellation + plan switching across **all six live Pro
   prices**, `proration_behavior: always_invoice`; Save. _(Per-mode — the test portal config
   does NOT carry over; MCP can't do this.)_
5. **Swap the ten env values** in `.env.local` + **Vercel** → redeploy: `STRIPE_SECRET_KEY` =
   `sk_live_…`, `STRIPE_WEBHOOK_SECRET` = the **live** `whsec_…`, and all eight
   `STRIPE_PRICE_*` IDs (`_PRO_100/_500/_2TB`, `_PRO_100_YR/_500_YR/_2TB_YR`, `_EVENT_PASS`,
   `_EVENT_PASS_RENEWAL`) = the **live** price IDs. Ten values, one redeploy: a half-swapped
   set means the unswapped plan checks out against the wrong mode's price and 500s.
6. **Smoke-test carefully — real cards charge real money.** Do one real upgrade with a real
   card, confirm `tier='pro'` (Supabase MCP), then cancel/refund. The flow itself is already
   proven in test mode (identical code), so this is just a keys/resources sanity check. Add
   one **yearly** checkout and one **portal switch** to the pass: the annual prices and the
   six-price portal have never run against live keys.

**Rollback:** revert the ten env values to the test ones in Vercel + redeploy. (Live Stripe
data persists but is unused while keys are test.)

## Fast-follows — email (Resend) + over-capacity retention + Event Pass renewal

**Provider = Resend** (free tier 3,000 emails/mo; $20/mo = 50k). All lifecycle email goes
through `sendOnce()` (deduped via `sent_emails`) so the daily cron sends at most once per
state — stays well under the free tier early. **Human setup:** create a Resend API key +
**verify a sending domain** (DNS) → set `RESEND_API_KEY` + `EMAIL_FROM`
(e.g. `Partyreel <noreply@partyreel.com>`) in `.env.local` + Vercel.

**Custom SMTP for Supabase Auth emails (reuse Resend) — runbook.** Supabase's built-in
email service (`noreply@mail.app.supabase.io`) is rate-limited (project-wide ~2 emails/hour,
Pro-locked) and not production-grade — it's the real ceiling on the verified-email OTP flow.
Point Supabase Auth at the SAME Resend sending domain so the OTP code / magic
link + the confirm/reset templates send via Resend. **Dashboard-only (no MCP/API path);
Will pastes the credentials.**

- _Prereq:_ `partyreel.com` must be **verified** in Resend (DNS) — custom SMTP bounces on an
  unverified sender domain. (Same domain as `EMAIL_FROM`; verify it's green in Resend → Domains.)
- _Supabase Dashboard → Authentication → Emails → **SMTP Settings** → enable custom SMTP, then:_
  | Field | Value |
  | --- | --- |
  | Sender email | `noreply@partyreel.com` (matches `EMAIL_FROM`) |
  | Sender name | `Partyreel` |
  | Host | `smtp.resend.com` |
  | Port | `465` (implicit SSL/TLS; `587` STARTTLS also works) |
  | Username | `resend` |
  | Password | the `RESEND_API_KEY` value (the `re_…` key — Resend's SMTP password) |
- _Then raise the email cap:_ Authentication → **Rate Limits** → "Rate limit for sending emails"
  becomes editable once custom SMTP is on (Supabase defaults it to 30/hr; the built-in service
  locked it to ~2/hr). Set it to **~100/hr** — enough to cover one event's guest-verification burst
  in an hour, while Resend's ~100/day (free tier) stays the real ceiling (see the cost caveat); raise
  to 500–1000/hr at launch on paid Resend. **This step is what actually lifts the OTP bottleneck** —
  enabling SMTP alone doesn't.
- _Verify (live, partyreel.com):_ request a sign-in OTP at `/login`; confirm the email arrives
  **from `noreply@partyreel.com`** (not `…mail.app.supabase.io`) with the 6-digit code; re-run the
  account-required ("Enter event") sign-in on a guest `/e/[token]` event (the crowd path); cross-check the send
  in Resend → Emails.
- _Caveat (cost):_ with custom SMTP the real ceiling becomes **Resend's** free tier (3,000/mo and a
  daily cap, ~100/day) — auth OTP now shares that quota with the lifecycle email. An event crowd all
  verifying email in one evening could hit the daily cap; size up to Resend's paid tier ($20/mo = 50k)
  if launch volume needs it. Keep "Email OTP Length" = **6** (already set; mirrors `OTP_LENGTH`).
- _Status (2026-06-02):_ custom SMTP **configured** — host `smtp.resend.com:465`, username `resend`,
  sender `Partyreel <noreply@partyreel.com>`, **minimum interval 60 s per user**. _To close out:_ set
  the email rate limit (above) + run the live OTP check. **Follow-up (code):** the "Resend code" button
  ([email-sign-in.tsx](../src/components/auth/email-sign-in.tsx)) has no cooldown — add a 60 s countdown
  so an early re-tap doesn't silently hit the 60 s min-interval.

**Event Pass renewal:** a cheaper **$15 one-time renewal price** on the same Event Pass
product (`STRIPE_PRICE_EVENT_PASS_RENEWAL`; the id is in the catalog table above). Gated to
holders with an active-now pass window, read from the ledger at checkout; the dashboard "Renew
Event Pass" button + the 14-day pre-expiry nudge email point at it. It is one of the eight
prices the cutover re-creates in live.

**Over-capacity retention:** a lapsed account over its cap gets a **45-day grace** (media
stays fully accessible + warning emails), then **auto-reduce** (largest-first) into the
Phase-3 7-day removed tail → hard-delete reclaims the bytes.

**Cold storage — evaluated + rejected (2026-05-29).** R2 Infrequent Access is only ~33%
cheaper ($0.015→$0.01/GB-mo) and adds a $0.01/GB retrieval fee + a 30-day minimum-duration
charge — not worth it on a short tail. True archival (S3 Glacier, ~15×) is a separate
cross-cloud project with slow, paid retrieval. **Future lever (if tail cost grows):**
transition tail objects to IA via an R2 object-lifecycle rule — near-zero app code.
