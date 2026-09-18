# Billing, tiers & storage caps

> ROLE: the entitlement engine — how a tier maps to limits, how uploads are gated against them, and how Stripe provisions tiers.
> BELONGS HERE: the cap model (`host_active_bytes`, monthly ingress, the `tiers.ts`↔SQL parity), video gating, the Stripe checkout/portal/webhook + provisioning, the Stripe-MCP runbook gotchas. · NOT HERE: the tier *numbers* + the human setup/cutover runbook (→ [`../PRICING.md`](../PRICING.md)), the upload pipeline itself (→ [uploads-and-r2.md](uploads-and-r2.md)), lapsed-pass/over-cap sweeps (→ [lifecycle-recovery.md](lifecycle-recovery.md)).
> GROWS BY: integrate-in-place.

## The cap model (account-level bytes, not item counts)

A tier = a total stored-bytes cap. **Single source** [`tiers.ts`](../../src/lib/constants/tiers.ts) (Free
2 GB; Pro 100/500/2048 GB; Event Pass 75 GB) MUST mirror the SQL `tier_limits()`, guarded by
[`tier-limits-parity.test.ts`](../../src/lib/constants/tier-limits-parity.test.ts) — it PARSES the newest
committed migration that defines the fn and compares every tier's every number, and throws rather than
passing when it cannot read a redefinition. (The block in `tiers.test.ts` that used to claim this only
re-asserted the TS constants against themselves and could detect no drift at all; it survives, honestly
relabelled, as marketed-number pins.) `create_media` enforces the cap against **ACTIVE bytes** (`host_active_bytes()` = non-removed
media in non-deleted events) **+ a 10% overflow buffer**, plus a **monthly ingress meter**
(`storage_ledger.cumulative_bytes` for the period). Per-event item caps are **gone**.

- **`host_active_bytes()`** is SECURITY DEFINER, REVOKED from anon/authenticated (internal-only — must
  NEVER appear in the 0028/0029 advisor lists), and is the SINGLE source the 4 upload fns + the over-cap
  sweep share. *(Cross-cutting landmine — echoed in CLAUDE.md.)*
- **`storage_used_bytes` is now the PHYSICAL meter ONLY** (++ on create, −− only in `purge_media_rows`); it
  NO LONGER gates uploads. So deleting frees cap room immediately (the "Recently deleted" model).
- **The monthly meter is INGRESS BYTES, not counts**, and `cumulative_bytes` **never decrements** — it is
  both the meter and the delete/re-upload churn defense.
- Free's 2 GB default comes from `tier_limits()` (so null `storage_cap_bytes` is fine — no backfill); the
  Stripe webhook writes `storage_cap_bytes` for paid tiers.

## Where it lives

- App-side limits (client-safe, secret-free): [`tiers.ts`](../../src/lib/constants/tiers.ts) (`MAX_EVENTS`,
  `MONTHLY_INGRESS_BYTES`, `DEFAULT_STORAGE_CAP_BYTES`, `videosAllowedForTier`, `toBillingTier`,
  `EVENT_PASS_RENEWAL_PRICE_LABEL`).
- The Event Pass LEDGER: pure window math in [`billing/passes.ts`](../../src/lib/billing/passes.ts)
  (`activeNowPasses` / `passChainExpiry` / `passWindowForPurchase` / `passProCreditCents` /
  `derivePassEntitlement`, fixture-tested); DB access in
  [`db/queries/event-passes.ts`](../../src/lib/db/queries/event-passes.ts) +
  [`db/mutations/event-passes.ts`](../../src/lib/db/mutations/event-passes.ts)
  (`insertPassPurchase` / `consumeLivePassesForProCredit` / `recomputePassEntitlement`).
- Stripe (server-only): [`stripe/provision.ts`](../../src/lib/stripe/provision.ts) (pure
  `resolveSubscriptionUpdate` / `eventPassSession` / `proCreditSession` / `deliveryCreatedAt`),
  [`stripe/entitlement.ts`](../../src/lib/stripe/entitlement.ts) (pure `resolveEntitlement` — the
  Pro one-at-a-time gate; client-safe, but only ever called server-side),
  [`stripe/plans.ts`](../../src/lib/stripe/plans.ts) (Price-ID↔plan map),
  [`stripe/dashboard.ts`](../../src/lib/stripe/dashboard.ts), [`stripe/revenue.ts`](../../src/lib/stripe/revenue.ts);
  routes [`/api/stripe/`](../../src/app/api/stripe) `checkout` / `portal` / `webhook`.
- Env: `assertStripeEnv()` + the memoized `getStripe()` in [`env.ts`](../../src/lib/env.ts) / `stripe/`.

## Invariants (don't break)

- **The Stripe webhook (+ the sweeps' `recomputePassEntitlement`) is the SOLE writer of `tier` /
  `storage_cap_bytes` / `stripe_subscription_id` / `event_slots`** — always via the service-role admin
  client. Never set tier from the client or the checkout route (checkout only creates/persists
  `stripe_customer_id` so events map back, and stamps credit metadata). *(Cross-cutting landmine.)*
- **The webhook MUST read `await req.text()`** for `getStripe().webhooks.constructEvent(body, sig, secret)`
  — `req.json()` mutates the bytes and the signature check fails. Bad/missing signature → 400.
  `runtime="nodejs"` + `dynamic="force-dynamic"`. *(Cross-cutting landmine.)*
- **`tier_limits()` MUST mirror `tiers.ts`** (`max_events`, `monthly_ingress_bytes`,
  `default_storage_cap_bytes`, `max_reel_seconds`). A tier limit that only exists in TypeScript is a
  suggestion: the reel's length cap is mirrored in SQL for exactly that reason, and the server re-derives
  it from the host's own tier at render and mint time rather than trusting the length the client sends. Changing its return columns needs **DROP + CREATE** (create-or-replace can't
  change a function's return type).
- **`tiers.ts` is client-import-safe — keep it secret-free** (no env, no Stripe Price IDs). The Price-ID↔plan
  mapping lives in `stripe/plans.ts` (reads env via `assertStripeEnv()`), NEVER in `tiers.ts`.
- `profiles.tier` / `storage_cap_bytes` / `tier_expires_at` / `stripe_event_created_at` are
  service-role/webhook-write-only (never client-writable). → [database-security.md](database-security.md).
- **ONE PLAN AT A TIME FOR PRO; PASSES STACK.** `/api/stripe/checkout`
  still refuses everything for an active Pro (a second subscription double-bills one cap; the portal owns
  upgrades/downgrades/cancellation), resolved server-side by `resolveEntitlement()` from `profiles` (never
  the request body). Event Passes STACK: a second pass purchase is a normal checkout minting another
  ledger row (+1 event slot, +75 GB for its own year); renewal eligibility reads the LEDGER (an
  active-now window must exist), not the profile label. The old cap-collapse hazard (a pass write
  flattening a Pro cap) is gone structurally: pass state recomputes from the ledger and never touches a
  Pro profile (`.neq("tier","pro")` rides in the recompute's WHERE clause). Cap-stacking for PRO (cap as
  the max, or as the sum) was considered and rejected: both make provisioning resolve two live entitlements
  on every webhook, and both are genuinely ambiguous at the lapse boundary, since "whose media survives when
  one plan ends?" has no honest answer. The rule the gate exists to enforce is narrower than it looks: no
  move may COLLAPSE a cap. Only Pro to Event Pass does that, which is why a live pass MAY start Pro (every
  Pro size exceeds 75 GB) while a Pro holder may not buy a pass, and why a pass holder still cannot buy a
  SECOND pass mid-move.
- **A plan SWITCH routes to the Stripe billing portal, and that is deliberate.** `/pricing` is statically
  generated and tier-blind, so a Pro host tapping a different Pro size reaches checkout and is refused
  there; the button acts on the `already_subscribed` refusal code by opening the portal, which is where
  Stripe applies correct proration. Making the page dynamic to relabel one button was the worse trade. The
  launch consequence: the portal configuration MUST permit switching between the Pro prices, which makes it
  load-bearing rather than cosmetic.
- **The prorated Pass→Pro credit is honored in the webhook, idempotently**: balance grant
  keyed `pass-credit-<sessionId>` (a Stripe idempotency key, so retries never double-grant) → consume all
  live passes (0 rows on replay) → clear `tier_expires_at`/`event_slots`. Customer balance auto-applies
  to upcoming invoices and is EXCLUDED from Checkout's own first invoice — the reason it beats an
  `amount_off` coupon, which silently eats any credit above one invoice's total.
- **Every entitlement write asserts EXACTLY ONE matched row** (`applyEntitlement` in the webhook route) and
  throws otherwise, so a paid-but-unprovisioned host 5xxs into a Stripe retry instead of a silent 200. There
  is still nothing that reconciles Stripe against `profiles` after the retry window, so the assertion plus
  its Sentry capture IS the reconciliation.
- **Subscription deliveries are ordered by `profiles.stripe_event_created_at`**, compared IN THE WHERE
  CLAUSE (atomic under concurrent delivery, not a read-then-write): `<=` for the absolute patch (a replay
  is a no-op, and two distinct same-second events must not be dropped). Zero matched rows is ambiguous by
  construction and is disambiguated with a follow-up select: guard declined → 200, no such profile → 5xx.
  The customer-binding write deliberately leaves NO stamp, because `customer.subscription.created` can
  carry an earlier `created` than the checkout session that produced it. **Pass purchases no longer ride
  this guard at all**: their replay-safety is the ledger's unique `stripe_session_id`, and the
  profile write is a derived-absolute recompute.
- **Subscription writes null `event_slots` + `tier_expires_at` ALWAYS** — a stale stacked-pass slot count
  would cap a Pro host inside SQL's `enforce_event_limit` coalesce, and nothing banks behind Pro. The
  downgrade path then calls `recomputePassEntitlement`, so live UNCREDITED passes resurface as
  entitlement instead of evaporating.

- ★ **Reel artifact bytes are EXEMPT from storage metering, and the bound is structural.** The rendered
  `.mp4` does not decrement the host's cap, because the reel is the product's flagship moment and its
  creation is free on every tier: charging for it would let a Free host near their cap be blocked from the
  one feature that sells the product, and would turn regeneration into user-visible replace-or-add maths.
  The exemption is only safe while **one artifact per event** holds (a re-render overwrites the same stable
  key), so that is pinned by a test rather than assumed. If per-event reels ever become plural, this
  exemption has to be re-decided BEFORE that ships.

## Gotchas (why it's like this — don't revert)

- **Video is a PAID feature (Pro AND Event Pass; the gate is `tier != 'free'`).** The AUTHORITATIVE gate
  is `if p_type='video' and tier='free' then raise` at the
  TOP of the tier-caps block (right after `v_profile`/`tier_limits()` load — NOT the universal-limits block
  above it, where `v_profile.tier` isn't loaded yet → a silent no-op) in BOTH `create_media` AND
  `create_media_as_host`. `get_upload_context`/`get_host_upload_context` return an advisory `video_blocked`
  the presign routes fail fast on (EVENT-framed for the guest so the host's tier never leaks; tier-framed for
  the owner). Client mirror: `videosAllowedForTier(tier) = tier !== 'free'`.
- **`get_upload_context` is a COARSE pre-check** (returns `at_storage_cap`/`at_monthly_cap`, both read
  `host_active_bytes` so it can't drift from the authoritative `create_media`).
- **The `tier_type` enum still carries a retired `max`.** App code uses the 3-value `Tier`
  (`free|pro|event_pass`); coerce a DB `profiles.tier` with `toBillingTier()` (`max`→`pro`, unknown→`free`)
  before indexing the `tiers.ts` records. Don't try to drop the enum value (risky).
- **Provisioning is a PURE fn** (`resolveSubscriptionUpdate`) — unit-tested, returns ABSOLUTE values so
  re-delivered events are idempotent. `customer.subscription.deleted`/non-active → downgrade (`tier=free`,
  `storage_cap_bytes=null` → 2 GB default). `plans.ts` is `server-only` (reads env) → don't import it in
  Vitest; test `provision.ts`. Pin `apiVersion` to the installed SDK's bundled version (`stripe@22.2.0` →
  `"2026-05-27.dahlia"`); bump deliberately on SDK upgrade.
- **Event Pass is a ONE-TIME payment on a LEDGER** — checkout uses `mode:"payment"` (from
  `plan.billing === "one_time"`), so NO `customer.subscription.*` fires; **`checkout.session.completed`**
  (recognized by `eventPassSession` via `session.metadata.plan_id === "event_pass"`) mints one
  `event_passes` row (idempotent on `stripe_session_id`; `price_cents` = `session.amount_total`, so promo
  purchases prorate off the real payment) and `recomputePassEntitlement` derives the profile. Each row
  owns a `[start_at, expires_at)` WINDOW: an initial purchase stacks a fresh year from the purchase
  instant; a **renewal** (the cheaper `STRIPE_PRICE_EVENT_PASS_RENEWAL` price, `metadata.renewal="1"`)
  inserts a row whose window STARTS at the soonest-expiring active pass's expiry: "extends,
  never resets", per-window, and an unopened renewal year credits at 100% on a Pro move. Renewal
  eligibility requires an ACTIVE-NOW window (`activeNowPasses`), read from the ledger at checkout (the
  old label/timestamp gates are gone). `sweepExpiredPasses` is now a full recompute pass over holders
  (expiry, 150 GB→75 GB cap shrink into the 45-day grace, renewal windows opening, drift healing).
  → [lifecycle-recovery.md](lifecycle-recovery.md).

## Stripe MCP runbook (who does what — full cutover in [`../PRICING.md`](../PRICING.md))

- **The agent (via Stripe MCP) creates products + prices in TEST mode. ALWAYS verify the mode FIRST** via
  `retrieve_balance` → `livemode` — the connector is bound to ONE mode by its key, with no per-call flag (a
  LIVE connector once created 3 products by mistake → archived).
- **The human creates the webhook endpoint + the Billing Portal config in the Stripe dashboard** (the MCP
  catalog can't), and pastes the env values the agent can't set: `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, the eight `STRIPE_PRICE_*` IDs — into `.env.local` + Vercel, then redeploy.
  **The portal's plan switcher must list all SIX Pro prices** (monthly + yearly on each of the three
  products): it is the only route between the intervals, since checkout refuses a second subscription
  for an active Pro.
- **Checkout/webhook can't run on localhost** — verify on partyreel.com with test card `4242 4242 4242
  4242`. The Chrome MCP BLOCKS interaction on Stripe-hosted pages, so the card entry / Subscribe click is
  human-driven; verify the result via the Supabase MCP (read `profiles.tier`/`storage_cap_bytes`). To
  exercise the downgrade webhook without waiting, use the Stripe MCP `cancel_subscription` (immediate).
- **Re-create the catalog in LIVE + swap the TEN env values before launch** (test and live data are
  separate): the key, the webhook secret and all eight price IDs, in one redeploy; the rollback is
  reverting those ten. The catalog is **4 products / 8 prices** (3 Pro products carrying 6 recurring
  prices, monthly + yearly on each; the Event Pass product carrying the 2 one-time prices).

## See also

[`../PRICING.md`](../PRICING.md) (tier numbers, unit economics, the test→live cutover) · [uploads-and-r2.md](uploads-and-r2.md) (the cap enforcer) · [lifecycle-recovery.md](lifecycle-recovery.md) (over-cap + lapsed-pass sweeps) · [database-security.md](database-security.md).
