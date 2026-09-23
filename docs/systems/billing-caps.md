# Billing, tiers & storage caps

> ROLE: the entitlement engine — how a tier maps to limits, how uploads are gated against them, and how Stripe provisions tiers.
> BELONGS HERE: the cap model (`host_active_bytes`, monthly ingress, the `tiers.ts`↔SQL parity), the storage guard on plan changes, video gating, the Stripe checkout/change-plan/portal/webhook + provisioning, the in-app pricing surface and its return path, the Stripe-MCP runbook gotchas. · NOT HERE: the tier *numbers* + the human setup/cutover runbook (→ [`../PRICING.md`](../PRICING.md)), the upload pipeline itself (→ [uploads-and-r2.md](uploads-and-r2.md)), lapsed-pass/over-cap sweeps (→ [lifecycle-recovery.md](lifecycle-recovery.md)).
> GROWS BY: integrate-in-place.

## The cap model (account-level bytes, not item counts)

A tier = a total stored-bytes cap; there is no per-event item cap. **Single source**
[`tiers.ts`](../../src/lib/constants/tiers.ts) (every price and limit) MUST mirror the SQL `tier_limits()`,
guarded by [`tier-limits-parity.test.ts`](../../src/lib/constants/tier-limits-parity.test.ts), which PARSES
the newest migration defining the fn, compares every number, and throws on anything it cannot read.
`create_media` enforces the cap against **ACTIVE bytes** (`host_active_bytes()` = non-removed media in
non-deleted events) **+ a 10% write headroom** (`capWithWriteHeadroom` mirrors it, so the over-cap sweep
engages at the same line), plus a **monthly ingress meter** (`storage_ledger.cumulative_bytes` for the
period) bounded by `monthly_ingress_cap()`: static for Free, `INGRESS_CAP_MULTIPLIER` × the effective
storage cap for paid tiers, so the abuse bound scales with the plan.

- **`host_active_bytes()`** is SECURITY DEFINER, REVOKED from anon/authenticated (internal-only — must
  NEVER appear in the 0028/0029 advisor lists), and is the one SQL definition every cap check reads (the
  upload fns, `get_upload_gate`, the restore RPCs). The over-cap sweep computes the same definition in
  TypeScript. ★ The dashboard meter, the account page, the plan sheet's facts and the storage guard read
  **`host_storage_summary(uuid)`** (`getHostStorageSummary` → `readHostStorageSummary`,
  [`queries/storage.ts`](../../src/lib/db/queries/storage.ts)): one SUM each for active and Deleted bytes, whatever
  the album's size, SECURITY DEFINER and service-role only like its sibling, called on the admin client with the
  `getUser()` id (the admin's account view passes the account it shows, and counts its items with a HEAD count).
  Its active filter is `host_active_bytes`' own and its Deleted filter the exact negation, which
  [`storage-summary.test.ts`](../../src/lib/billing/storage-summary.test.ts) reads off both migrations; a failed
  read throws, because the guard would read a swallowed failure as an empty account and sell any size.
- **`storage_used_bytes` is the PHYSICAL meter ONLY** (++ on create, −− only in `purge_media_rows`); it
  never gates uploads, so deleting frees cap room immediately (the "Recently deleted" model).
- **The monthly meter is INGRESS BYTES, not counts**, and `cumulative_bytes` **never decrements** — it is
  both the meter and the delete/re-upload churn defense.
- A Free profile's null `storage_cap_bytes` falls back to the `tier_limits()` default; the Stripe webhook
  (and the pass recompute) write `storage_cap_bytes` for paid tiers.

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
- The STORAGE GUARD: pure [`billing/storage-guard.ts`](../../src/lib/billing/storage-guard.ts)
  (`replacesCap` / `checkPlanChange` / `fittingProPlans` / `refusalSentence`, client-safe, so the sheet and
  both routes share one rule) and [`billing/plan-facts.ts`](../../src/lib/billing/plan-facts.ts) (the
  sheet's facts shape and parser).
- Stripe (server-only): [`stripe/provision.ts`](../../src/lib/stripe/provision.ts) (pure
  `resolveSubscriptionUpdate` / `eventPassSession` / `proCreditSession` / `deliveryCreatedAt`),
  [`stripe/entitlement.ts`](../../src/lib/stripe/entitlement.ts) (pure `resolveEntitlement` — the
  Pro one-at-a-time gate; client-safe, but only ever called server-side),
  [`stripe/change-plan.ts`](../../src/lib/stripe/change-plan.ts) (pure `assessSubscription` /
  `changePlanSessionParams` / `pickChangePlanConfiguration`, and the refusal sentences),
  [`stripe/portal-config.ts`](../../src/lib/stripe/portal-config.ts) (the tagged configuration, cached),
  [`stripe/plans.ts`](../../src/lib/stripe/plans.ts) (Price-ID↔plan map),
  [`stripe/dashboard.ts`](../../src/lib/stripe/dashboard.ts), [`stripe/revenue.ts`](../../src/lib/stripe/revenue.ts);
  routes [`/api/stripe/`](../../src/app/api/stripe) `checkout` / `change-plan` / `plan-facts` / `portal` / `webhook`.
- The IN-APP surface: [`components/app/pricing/`](../../src/components/app/pricing) —
  `pricing-sheet.tsx` (the one responsive Sheet every pricing click opens), `pro-price-list.tsx` (a Pro
  host's six prices), `change-plan-button.tsx` + `change-plan-request.ts` (the one client for
  `/api/stripe/change-plan`), `use-plan-facts.ts` (the sheet's read when it opens), `lock-chip.tsx` (the one
  component behind every gated control), `welcome-to-pro.tsx` (the post-Checkout receipt), `triggers.ts` (why
  it opened, the opening size, the gated-feature record, the three Pro benefit lines) and `return-path.ts`
  (the `success_url` allow-list).
- Env: `assertStripeEnv()` in [`env.ts`](../../src/lib/env.ts); the memoized `getStripe()` in
  [`stripe/client.ts`](../../src/lib/stripe/client.ts).

## Invariants (don't break)

- **The Stripe webhook (+ the sweeps' `recomputePassEntitlement`) is the SOLE writer of `tier` /
  `storage_cap_bytes` / `stripe_subscription_id` / `event_slots`** — always via the service-role admin
  client. Never set tier from the client or the checkout route (checkout only creates/persists
  `stripe_customer_id` so events map back, and stamps credit metadata). These columns, `tier_expires_at`
  and `stripe_event_created_at` are never client-writable → [database-security.md](database-security.md).
- **Stripe Checkout's `consent_collection` stays off.** The Terms consent line rides the account door
  (`/login`) and the guest door's welcome step, so every paying host has met it before Checkout.
- **The webhook MUST read `await req.text()`** for `getStripe().webhooks.constructEvent(body, sig, secret)`
  — `req.json()` mutates the bytes and the signature check fails. Bad/missing signature → 400.
  `runtime="nodejs"` + `dynamic="force-dynamic"`.
- **`tier_limits()` MUST mirror `tiers.ts`** (`max_events`, `monthly_ingress_bytes`,
  `default_storage_cap_bytes`, `ingress_cap_multiplier`, `max_reel_seconds`). A limit only TypeScript knows
  is a suggestion: the reel's length cap is mirrored in SQL, and the server re-derives it from the host's
  own tier at render and mint time, never from the length the client sends. Changing the return columns
  needs **DROP + CREATE** (create-or-replace can't change a function's return type).
- **`tiers.ts` is client-import-safe — keep it secret-free** (no env, no Stripe Price IDs). The Price-ID↔plan
  mapping lives in `stripe/plans.ts` (reads env via `assertStripeEnv()`), NEVER in `tiers.ts`.
- **ONE PLAN AT A TIME FOR PRO; PASSES STACK.** `/api/stripe/checkout` refuses everything, a pass included,
  for an active Pro (a second subscription double-bills one cap; a size or cadence change is the
  change-plan route's, cancelling the portal's), resolved server-side by `resolveEntitlement()` from
  `profiles`, never the request body. Another pass is a normal checkout minting another ledger row (+1 event
  slot and another pass's storage, for its own year), and a pass holder may start Pro (the prorated credit
  consumes their passes) at a size that holds what the passes store (the storage guard, below). A pass
  write never flattens a Pro cap: pass state recomputes from the ledger with `.neq("tier","pro")` in the
  WHERE clause. Never stack Pro caps (as the max or the sum): provisioning would resolve two live
  entitlements on every webhook, and "whose media survives when one plan ends?" has no honest answer.
- ★ **NO PLAN CHANGE LEAVES A HOST STORING MORE THAN THE NEW CAP** (Will, 2026-09-22: "we should show them
  their total storage used now and ask them to delete media to get under the storage cap of their selected
  pro plan before being able to switch ... This eliminates our need to remove any of their media or cover
  excess storage costs ourselves." And: "Downgrading pro plan should follow event pass with checking the
  storage and ensuring it fits. Cancellation as normal."). ONE check, `checkPlanChange`, for every purchase
  that REPLACES the cap: any Pro checkout (a pass holder's included) and any Pro-to-Pro size or cadence
  change. An Event Pass is never refused (passes stack, so a pass only adds room). It compares ACTIVE bytes
  (`getHostStorageSummary`, never re-derived) with the target plan's PLAIN cap from `tiers.ts`, never
  `capWithWriteHeadroom` (the 10% is a courtesy at upload time, not room to buy into), and it is tier-blind,
  so a Free host in the over-cap grace meets the same line. A refusal is a 409 `over_new_cap` carrying
  `storedBytes`, `capBytes`, `gapBytes`, `fits` (the plan ids that hold it, at the target's cadence) and a
  `message` naming the smallest size that fits; the stored figure and the gap round UP so doing exactly
  what it says is enough. Checkout runs it after `resolveEntitlement` and `planById` and before a Stripe
  customer exists; change-plan runs it after the subscription checks and before any session. A Pro Checkout
  session closes 31 minutes out (Stripe's floor is 30 from ITS clock; the default is a day), so the check
  it passed stays true. **The backstops stay:** the webhook remains the sole writer and does no usage
  check, and the 45-day over-cap grace ([lifecycle-recovery.md](lifecycle-recovery.md)) catches what the
  rule cannot reach: a cancellation, a pass running out, a change made in the Stripe dashboard, storage that
  grew between the check and Stripe's confirm.
- **A plan SWITCH goes through `/api/stripe/change-plan`, never the general portal.** `/pricing` is static
  and tier-blind, so a Pro host tapping a Pro size is refused at checkout with `already_subscribed`; the
  button acts on that code by posting the SAME plan id to change-plan (a pass click keeps checkout's
  sentence). The plan sheet's price list, the account page's Plan card and the storage meter's popover all
  reach the same route. It takes a zod enum of the six Pro ids; verifies `getUser()`, that the profile's
  subscription is the profile's customer's, `active` or `trialing`, not set to end, single-item and on one
  of our Pro prices (`past_due` fixes the card first; a hand-set Pro with no subscription is referred to
  the contact page); refuses the plan the host is on (unless the old stepper left quantity above 1); runs
  the storage check; then creates a portal session on the TAGGED configuration with `flow_data.type =
  "subscription_update_confirm"` for exactly one item (the target price, `quantity: 1`) and
  `after_completion: { type: "redirect" }`, so the host lands on Stripe's confirm page and then back on the
  allow-listed app path (`safeReturnPath`, no welcome marker), never on that configuration's home page and
  its switcher. Proration, payment and 3DS stay Stripe's; the route writes nothing to the profile and the
  webhook applies the new cap. The configuration carries metadata `partyreel_purpose=change_plan` and NO
  env value names it: `changePlanConfigurationId()` lists the account's active configurations once per warm
  instance, caches the id in module scope, fails CLOSED (503 plus a Sentry capture, never the default
  configuration) when none carries the tag, and forgets a stale id and looks once more when Stripe rejects
  it. The general portal keeps the card, the invoices and cancelling; its `subscription_update` (the
  switcher, and a quantity stepper with no maximum that could bill two or three times for one cap) is
  switched off once this path is live.
- **The prorated Pass→Pro credit is honored in the webhook, idempotently**: balance grant
  keyed `pass-credit-<sessionId>` (a Stripe idempotency key, so retries never double-grant) → consume all
  live passes (0 rows on replay) → clear `tier_expires_at`/`event_slots`. Customer balance auto-applies
  to upcoming invoices and is EXCLUDED from Checkout's own first invoice — the reason it beats an
  `amount_off` coupon, which silently eats any credit above one invoice's total.
- **A subscription billed more than once for one cap is a warning, never a bigger cap.** A created or updated
  subscription with any item's quantity above 1 (the old portal stepper's multiples) raises a Sentry warning
  (`billing`, `stripe_subscription_quantity_above_1`, with the subscription, customer and quantity:
  `subscriptionQuantityWarning` in `provision.ts`), and provisioning writes one plan's cap exactly as it would at a
  quantity of 1; the operator settles the extra billing in Stripe.
- **Every entitlement write asserts EXACTLY ONE matched row** (`applyEntitlement` in the webhook route) and
  throws otherwise, so a paid-but-unprovisioned host 5xxs into a Stripe retry instead of a silent 200.
  Nothing reconciles Stripe against `profiles` after the retry window, so the assertion plus its Sentry
  capture IS the reconciliation.
- **Subscription deliveries are ordered by `profiles.stripe_event_created_at`**, compared IN THE WHERE
  CLAUSE (atomic under concurrent delivery, not a read-then-write): `<=` for the absolute patch (a replay
  is a no-op, and two distinct same-second events must not be dropped). Zero matched rows is ambiguous by
  construction and is disambiguated with a follow-up select: guard declined → 200, no such profile → 5xx.
  The customer-binding write deliberately leaves NO stamp, because `customer.subscription.created` can
  carry an earlier `created` than the checkout session that produced it. **Pass purchases skip this
  guard**: the ledger's unique `stripe_session_id` makes them replay-safe, and the profile write is a
  derived-absolute recompute.
- ★ **Nothing in the app's pricing surface may DECIDE an entitlement, and the split is deliberate.** The sheet, the
  chip and the receipt modal take a server-derived `tier` (the RLS-scoped `profiles` row) only as CONTEXT for
  which sentence to render; the checkout and change-plan routes re-resolve everything from `profiles` and
  Stripe before they open a session, and the RPCs enforce the gate again. The sheet's own read when it opens
  (`GET /api/stripe/plan-facts`: tier, active and Deleted bytes, the cap in force and, for Pro, the current
  price and whether a switch can open) is context too: it picks the smallest size that fits and marks rows,
  and it replaces the door's facts only because it is fresher. A failed read keeps the door's facts; a Stripe
  read failure inside it degrades with a Sentry warning, never an error. So a forged prop or a hand-typed `?welcome=pro` changes a
  headline and never a permission. The receipt's `applied` flag is `tier !== "free"` read
  at RENDER time, never the URL marker, because Stripe redirects the instant payment succeeds and routinely beats
  the webhook by a second or two; the modal re-reads a BOUNDED number of times and flips to the real receipt when
  the write lands. Every price on the surface comes from `tiers.ts`, so the sheet carries no hand-written plan.
- ★ **Checkout's `success_url` is built from an exact-shape ALLOW-LIST, never a sanitized input**
  ([`return-path.ts`](../../src/components/app/pricing/return-path.ts)). The buy buttons send a `next` path so a
  purchase finishes the job it started (`/dashboard/<uuid>?room=settings` reopens the very sheet the locked control
  lives in); the route accepts only `/dashboard`, `/dashboard/<uuid>` with an optional `room=share|settings`, and
  `/account`, and answers with `/dashboard` for everything else, so no client value can leave the origin. The list
  is also the set of pages that MOUNT `WelcomeToPro`: adding a shape means mounting the modal there in the same
  change, or a purchase returns to a page that says nothing. Stripe validates none of this itself.
- **Subscription writes null `event_slots` + `tier_expires_at` ALWAYS** — a stale stacked-pass slot count
  would cap a Pro host inside SQL's `enforce_event_limit` coalesce, and nothing banks behind Pro. The
  downgrade path then calls `recomputePassEntitlement`, so live UNCREDITED passes resurface as
  entitlement instead of evaporating.
- ★ **Reel artifact bytes are EXEMPT from storage metering, and the bound is structural.** The rendered
  `.mp4` does not count against the host's cap: the reel is free on every tier, and charging for it would
  block a Free host near their cap from the one feature that sells the product. The exemption is only safe
  while **one artifact per event** holds (a re-render overwrites the same stable key), so a test pins it; if
  per-event reels ever become plural, re-decide the exemption BEFORE that ships.

## Gotchas (why it's like this — don't revert)

- **Video is a PAID feature (Pro AND Event Pass; the gate is `tier != 'free'`).** The AUTHORITATIVE gate
  is `if p_type='video' and tier='free' then raise` at the TOP of the tier-caps block (right after the
  `v_profile`/`tier_limits()` load — NOT the universal-limits block above it, where `v_profile.tier` isn't
  loaded yet → a silent no-op) in BOTH `create_media` AND `create_media_as_host`.
  `get_upload_context`/`get_host_upload_context` return an advisory `video_blocked` the presign routes fail
  fast on (EVENT-framed for the guest so the host's tier never leaks; tier-framed for the owner). Client
  mirror: `videosAllowedForTier(tier) = tier !== 'free'`.
- **`get_upload_context` is a COARSE pre-check**: `at_storage_cap` reads `host_active_bytes` and
  `at_monthly_cap` reads `monthly_ingress_cap()`, the same derivations as the authoritative `create_media`,
  so it can't drift.
- **The `tier_type` enum still carries a retired `max`.** App code uses the 3-value `Tier`
  (`free|pro|event_pass`); coerce a DB `profiles.tier` with `toBillingTier()` (`max`→`pro`, unknown→`free`)
  before indexing the `tiers.ts` records. Don't try to drop the enum value (risky).
- **Provisioning is a PURE fn** (`resolveSubscriptionUpdate`) — unit-tested, returns ABSOLUTE values so
  re-delivered events are idempotent. `customer.subscription.deleted` (whatever its status) and the non-active
  states (`incomplete_expired`, `canceled`, `unpaid`, `paused`) → downgrade (`tier=free`,
  `storage_cap_bytes=null` → the Free default); `active`, `trialing` and `past_due` grant. ★ **`incomplete`
  changes nothing** (null: no write, no recency stamp): Checkout's subscription is created `incomplete` and turns
  `active` once its first invoice is paid, the recency guard admits same-second deliveries in either order, and two
  TEST endpoints (the alias's and partyreel.com's) write the one database, so an `incomplete` that downgraded could
  land after the `active` and leave a paying host on Free. `plans.ts` is `server-only` (reads env) → don't import it in
  Vitest; test `provision.ts`. Pin `apiVersion` to the installed SDK's bundled version (`stripe@22.2.0` →
  `"2026-05-27.dahlia"`); bump deliberately on SDK upgrade.
- **Event Pass is a ONE-TIME payment on a LEDGER** — checkout uses `mode:"payment"` (from
  `plan.billing === "one_time"`), so NO `customer.subscription.*` fires; **`checkout.session.completed`**
  (recognized by `eventPassSession` via `session.metadata.plan_id === "event_pass"`) mints one
  `event_passes` row (idempotent on `stripe_session_id`; `price_cents` = `session.amount_total`, so promo
  purchases prorate off the real payment) and `recomputePassEntitlement` derives the profile. Each row
  owns a `[start_at, expires_at)` WINDOW: an initial purchase stacks a fresh year from the purchase
  instant; a **renewal** (the cheaper `STRIPE_PRICE_EVENT_PASS_RENEWAL` price, `metadata.renewal="1"`)
  starts at the soonest-expiring active pass's expiry ("extends, never resets", per-window), and an
  unopened renewal year credits at 100% on a Pro move. Renewal needs an ACTIVE-NOW window
  (`activeNowPasses`) read from the ledger at checkout, never the profile label. `sweepExpiredPasses`
  recomputes every holder (expiry, a stacked cap shrinking into the over-cap grace, renewal windows
  opening, drift healing). → [lifecycle-recovery.md](lifecycle-recovery.md).

## Stripe MCP runbook (who does what — full cutover in [`../PRICING.md`](../PRICING.md))

- **The agent (via Stripe MCP) creates products + prices in TEST mode. ALWAYS verify the mode FIRST**:
  `list_available_accounts_or_orgs` → `livemode`, and pass that same mode on every call, because a
  wrong-mode write lands in the other account's catalog.
- **The human creates the webhook endpoint + the default Billing Portal config in the Stripe dashboard** and
  supplies the env values: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, the eight `STRIPE_PRICE_*` IDs —
  into `.env.local` + Vercel, then redeploy. **Two portal configurations, two jobs:** the DEFAULT one keeps
  the card, invoice history, customer details and cancellation, with `subscription_update` OFF (no
  switcher, no quantity stepper); the CHANGE-PLAN one is API-only (the dashboard edits only the default),
  tagged `metadata.partyreel_purpose=change_plan`, with `subscription_update` on over all SIX Pro prices,
  `default_allowed_updates: ["price"]`, quantity adjustment off, `proration_behavior: always_invoice`,
  `billing_cycle_anchor: unchanged`, no period-end scheduling, cancellation, invoice history and customer
  update off, and payment-method update on (Stripe requires it beside subscription updates). The app finds
  it by the tag, so it needs no env value; read one back with
  `GET /v1/billing_portal/configurations/<id>?expand[]=features.subscription_update.products`, since the
  list omits the products.
- **Verify a change-plan session through the API, not a browser** (the Chrome MCP cannot drive Stripe's
  pages): create one for a TEST customer with a live subscription and read back `configuration` (the tagged
  id), `flow.type` (`subscription_update_confirm`), `flow.subscription_update_confirm.items` (one item, the
  target price, quantity 1) and `flow.after_completion.type` (`redirect`). Stripe documents that a flow hides
  the portal's navigation; a session URL expires 5 minutes after creation if unused.
- **Checkout/webhook can't run on localhost** — verify on the launch-prep alias (allow-listed like prod)
  with test card `4242 4242 4242 4242`. The Chrome MCP BLOCKS interaction on Stripe-hosted pages, so the
  card entry / Subscribe click is human-driven; verify the result via the Supabase MCP (read
  `profiles.tier`/`storage_cap_bytes`). To exercise the downgrade webhook without waiting, cancel the
  subscription immediately through the Stripe MCP (`stripe_api_write`).
- **Re-create the catalog in LIVE + swap the TEN env values before launch** (test and live data are
  separate): the key, the webhook secret and all eight price IDs, in one redeploy; the rollback is
  reverting those ten. The catalog is **4 products / 8 prices** (3 Pro products carrying 6 recurring
  prices, monthly + yearly on each; the Event Pass product carrying the 2 one-time prices).

## See also

[`../PRICING.md`](../PRICING.md) (tier numbers, unit economics, the test→live cutover) · [uploads-and-r2.md](uploads-and-r2.md) (the cap enforcer) · [lifecycle-recovery.md](lifecycle-recovery.md) (over-cap + lapsed-pass sweeps) · [database-security.md](database-security.md).
