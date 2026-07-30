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
  `MONTHLY_INGRESS_BYTES`, `DEFAULT_STORAGE_CAP_BYTES`, `videosAllowedForTier`, `toBillingTier`).
- Stripe (server-only): [`stripe/provision.ts`](../../src/lib/stripe/provision.ts) (pure
  `resolveSubscriptionUpdate` / `resolveEventPassCheckout` / `deliveryCreatedAt`),
  [`stripe/entitlement.ts`](../../src/lib/stripe/entitlement.ts) (pure `resolveEntitlement` — the
  one-plan-at-a-time gate; client-safe, but only ever called server-side),
  [`stripe/plans.ts`](../../src/lib/stripe/plans.ts) (Price-ID↔plan map),
  [`stripe/dashboard.ts`](../../src/lib/stripe/dashboard.ts), [`stripe/revenue.ts`](../../src/lib/stripe/revenue.ts);
  routes [`/api/stripe/`](../../src/app/api/stripe) `checkout` / `portal` / `webhook`.
- Env: `assertStripeEnv()` + the memoized `getStripe()` in [`env.ts`](../../src/lib/env.ts) / `stripe/`.

## Invariants (don't break)

- **The Stripe webhook is the SOLE writer of `tier` / `storage_cap_bytes` / `stripe_subscription_id`** —
  always via the service-role admin client. Never set tier from the client or the checkout route (checkout
  only creates/persists `stripe_customer_id` so events map back). *(Cross-cutting landmine.)*
- **The webhook MUST read `await req.text()`** for `getStripe().webhooks.constructEvent(body, sig, secret)`
  — `req.json()` mutates the bytes and the signature check fails. Bad/missing signature → 400.
  `runtime="nodejs"` + `dynamic="force-dynamic"`. *(Cross-cutting landmine.)*
- **`tier_limits()` MUST mirror `tiers.ts`** (`max_events`, `monthly_ingress_bytes`,
  `default_storage_cap_bytes`). Changing its return columns needs **DROP + CREATE** (create-or-replace can't
  change a function's return type).
- **`tiers.ts` is client-import-safe — keep it secret-free** (no env, no Stripe Price IDs). The Price-ID↔plan
  mapping lives in `stripe/plans.ts` (reads env via `assertStripeEnv()`), NEVER in `tiers.ts`.
- `profiles.tier` / `storage_cap_bytes` / `tier_expires_at` / `stripe_event_created_at` are
  service-role/webhook-write-only (never client-writable). → [database-security.md](database-security.md).
- **ONE PLAN AT A TIME (ADR-0023).** `/api/stripe/checkout` refuses a session whenever the caller already
  holds a live entitlement, resolved server-side by `resolveEntitlement()` from `profiles` (never the
  request body). Active Pro → refuse everything, the portal owns upgrades/downgrades/cancellation. Active
  Event Pass → refuse everything EXCEPT its own renewal. Without this a host could stack a second
  subscription, or buy a pass that writes `storage_cap_bytes = 75 GB` over their 2 TB while Stripe keeps
  billing Pro, feeding the over-capacity sweep media that is legitimately inside their paid cap.
- **Every entitlement write asserts EXACTLY ONE matched row** (`applyEntitlement` in the webhook route) and
  throws otherwise, so a paid-but-unprovisioned host 5xxs into a Stripe retry instead of a silent 200. There
  is still nothing that reconciles Stripe against `profiles` after the retry window, so the assertion plus
  its Sentry capture IS the reconciliation.
- **Deliveries are ordered by `profiles.stripe_event_created_at`**, compared IN THE WHERE CLAUSE (atomic
  under concurrent delivery, not a read-then-write). `<=` for the absolute subscription patch (a replay is a
  no-op, and two distinct same-second events must not be dropped); `<` for the accumulating Event Pass
  extension (a replay would gift a second year). Zero matched rows is ambiguous by construction and is
  disambiguated with a follow-up select: guard declined → 200, no such profile → 5xx. The customer-binding
  write deliberately leaves NO stamp, because `customer.subscription.created` can carry an earlier
  `created` than the checkout session that produced it.

## Gotchas (why it's like this — don't revert)

- **Video is Pro-only.** The AUTHORITATIVE gate is `if p_type='video' and tier='free' then raise` at the
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
- **Event Pass is a ONE-TIME payment, not a subscription** — checkout uses `mode:"payment"` (from
  `plan.billing === "one_time"`), so NO `customer.subscription.*` fires; it's provisioned from
  **`checkout.session.completed`** via `session.metadata.plan_id === "event_pass"`
  (`resolveEventPassCheckout`). **`tier_expires_at` = `max(session.created, current expiry) + termDays`** —
  renewal EXTENDS, never resets (ADR-0023; the old `session.created + term` made an early renewal throw away
  the remaining paid months). Still keyed off `session.created` rather than `now()` so the value is a pure
  function of the event, but that is NOT replay-safety on its own: this patch accumulates, so replay-safety
  comes from the strict `<` ordering guard above. Renewal = a cheaper one-time price
  (`STRIPE_PRICE_EVENT_PASS_RENEWAL`) mapped to the SAME `event_pass` plan; checkout `{ renewal: true }`
  requires an UNEXPIRED pass (the old "current or recent" gate keyed on `tier_expires_at != null`, which is
  never cleared, so every past holder kept the discount forever). The purge cron's `sweepExpiredPasses`
  downgrades lapsed passes, and `resolveEntitlement` reads the TIMESTAMP rather than the label so a host is
  not blocked from re-buying for the up-to-a-day gap before that cron runs.
  → [lifecycle-recovery.md](lifecycle-recovery.md).

## Stripe MCP runbook (who does what — full cutover in [`../PRICING.md`](../PRICING.md))

- **The agent (via Stripe MCP) creates products + prices in TEST mode. ALWAYS verify the mode FIRST** via
  `retrieve_balance` → `livemode` — the connector is bound to ONE mode by its key, with no per-call flag (a
  LIVE connector once created 3 products by mistake → archived).
- **The human creates the webhook endpoint + the Billing Portal config in the Stripe dashboard** (the MCP
  catalog can't), and pastes the env values the agent can't set: `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, the `STRIPE_PRICE_*` IDs — into `.env.local` + Vercel, then redeploy.
- **Checkout/webhook can't run on localhost** — verify on partyreel.com with test card `4242 4242 4242
  4242`. The Chrome MCP BLOCKS interaction on Stripe-hosted pages, so the card entry / Subscribe click is
  human-driven; verify the result via the Supabase MCP (read `profiles.tier`/`storage_cap_bytes`). To
  exercise the downgrade webhook without waiting, use the Stripe MCP `cancel_subscription` (immediate).
- **Re-create everything in LIVE + swap the 5 env vars before launch** (test and live data are separate).

## See also

[`../PRICING.md`](../PRICING.md) (tier numbers, unit economics, the test→live cutover) · [uploads-and-r2.md](uploads-and-r2.md) (the cap enforcer) · [lifecycle-recovery.md](lifecycle-recovery.md) (over-cap + lapsed-pass sweeps) · [database-security.md](database-security.md).
