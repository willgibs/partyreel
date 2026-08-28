# ADR-0025: Event Pass economics v2 — stacking + prorated Pro credit

**Status:** Accepted (2026-08-27, Will's rulings during the pricing-round planning) ·
**Supersedes:** ADR-0023 ruling 1a's banked-term fallback (the pass's remaining term no longer
waits behind Pro; it converts). **Amends:** ADR-0023 ruling 1's "one plan at a time" (Pro keeps it;
Event Passes now stack). Related: ADR-0021 (the ruled prices, unchanged: $24 pass / $15 renewal).
**Scope:** one additive migration (`20260827210000_event_pass_ledger.sql`), the checkout/webhook
paths, the expiry sweeps, and the pricing-page copy that markets both behaviors.

## Context

The pricing-page rebuild forced the open question the wireframe had dodged: what does moving from
an Event Pass to Pro actually do, and why can a free account never hold two passes? The pass was a
single profile-level entitlement (`tier` + `tier_expires_at`), so a second purchase 409'd and a
Pass→Pro upgrade charged full price while the pass term sat "banked" behind Pro as a lapse
fallback (ADR-0023 1a), value most upgraders would never see again.

## Rulings (Will, verbatim in intent)

1. **Prorated credit is the Pass→Pro path.** "The one I'd expect from a great company, as a paying
   user, would be the prorated credit option, where I only pay for what I've used, and everything
   else goes toward what I get moving forward. Nothing gets lost, nothing gets banked. The benefit
   happens immediately." Banked-term (what shipped) and a 30-day credit window were both
   considered and rejected: banking makes the credit worthless at the tail end of a long Pro life,
   and a 30-day window disincentivizes months 2-12.
2. **Passes stack.** "For any reason imaginable, users may want to buy a second or multiple event
   passes on a free plan. We should support that as well."

## Decision — the mechanics

**The ledger.** `public.event_passes`: one row per PURCHASE with its own `[start_at, expires_at)`
window and `price_cents` = what Stripe actually charged (promo purchases prorate off the real
payment). RLS deny-all (service-role only). Replay-safety rides a partial unique index on
`stripe_session_id` — stronger than the second-resolution event-time guard the old accumulating
extension needed.

**Stacking.** Active-now count (windows containing now) IS the entitlement: count × 75 GB
(`storage_cap_bytes`), count event slots (`profiles.event_slots`, a new webhook-written column that
`enforce_event_limit`/`restore_event` read via `coalesce(event_slots, tier_limits.max_events)` —
the `storage_cap_bytes` override pattern applied to the event wall). Pro holders still cannot buy a
pass, and a second Pro subscription is still refused: one-plan-at-a-time survives FOR PRO.

**Renewal extends, never resets (preserved from ADR-0023 1) — now per-window.** A renewal inserts
its own row whose window STARTS at the soonest-expiring active pass's expiry, so it never grants a
second concurrent slot, and an unopened renewal year credits at 100%. With nothing active it
degrades to a fresh term (never fail a paid purchase).

**The prorated credit.** At a Pro checkout, `passProCreditCents` sums
`floor(price_cents × remaining/total)` per live pass and stamps it in session metadata. On
completion the webhook (idempotently, keyed `pass-credit-<sessionId>`) grants that amount as
**Stripe customer balance**, consumes every live pass (`consumed_reason = 'pro_credit'`), and
clears the chain fields. Customer balance auto-applies to upcoming invoices and is excluded from
Checkout's own first invoice, so the first month charges normally and the credit pays down the
following ones: nothing is ever lost to an `amount_off` coupon bigger than one invoice (the
mechanism a coupon design would have leaked money through, and why `allow_promotion_codes` also
survives on credited checkouts).

**Derived state, one writer.** `recomputePassEntitlement` re-derives
`tier / storage_cap_bytes / event_slots / tier_expires_at` from the ledger for non-Pro profiles
(`.neq("tier","pro")` in the WHERE, atomic against a concurrent Pro provision). The webhook calls
it on pass purchases and on subscription downgrades (uncredited live passes resurface as
entitlement instead of evaporating); the nightly sweep recomputes every holder (natural expiry, a
stacked pass lapsing 150 GB→75 GB into the existing 45-day grace machinery, renewal windows
opening, drift healing). Subscription writes null `event_slots` + `tier_expires_at` always — a
stale slot count would cap a Pro host in SQL, and nothing banks behind Pro.

## Consequences

- The pricing page may honestly market both: "Passes stack" and "unused pass time converts to
  credit, prorated to the day" (it does, since 2026-08-27).
- The credit is visible as account credit in Stripe (portal/invoices), not as a discounted first
  charge. FAQ copy states it plainly.
- `resolveEntitlement`'s pass arm no longer gates checkout (the ledger does); it still answers the
  Pro gate.
- Per-pass dashboard management (choosing WHICH pass a renewal extends, per-pass expiry rows in
  the storage meter) is deliberately v2: renewal targets the soonest-expiring pass, deterministic
  and documented. ROADMAP one-liner.
- Invariants live on in [`docs/systems/billing-caps.md`](../systems/billing-caps.md); the pure math
  in `src/lib/billing/passes.ts` (14 fixture tests) + `passProCreditCents` edges.
