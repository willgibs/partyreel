# ADR-0021: Reel length caps (30s/60s), ingress as a cap multiplier, Event Pass renewal held

**Status:** Accepted (2026-07-05, Will's T1 ruling; numbers adjustable pre-launch, these are the base)
· **Context:** PRICING.md (the locked tier model), the client-render pivot (renders cost $0 at scale),
the T1 options-doc (git history: `docs/decisions/t1-pricing-numbers.md`)

## Context

Three numbers were open: reel length caps by tier, `MONTHLY_INGRESS_BYTES.pro` (null = an unmetered
transfer pipe on a paid plan), and the Event Pass renewal sanity check. With client rendering, length
carries no render cost; every number is a product lever. Marketed numbers can only safely move UP
later (grandfathering makes them sticky), so each lands at the conservative-but-generous end.

## Decision

1. **Reel length: Free 30s max, Pro + Event Pass 60s max.** `MAX_REEL_SECONDS: Record<Tier, number>`
   in `tiers.ts` {free: 30, pro: 60, event_pass: 60}, mirrored in `tier_limits()` (the parity test
   extends to it). The composer offers 15s/30s to everyone and a paid-locked 60s option; Auto clamps
   to the tier cap; the server clamps `p_length_seconds` in the reel-config RPC AND re-derives the
   cap from the host's tier at render/mint time (never trust the client).
2. **Ingress: a multiplier, not static bytes.** `INGRESS_CAP_MULTIPLIER = 3` of the effective storage
   cap per month for Pro AND Event Pass (300 GB / 1.5 TB / 6 TB / 225 GB); Free stays 20 GB. The
   abuse bound scales with revenue; unmarketed and silently tunable; admin visibility + a manual
   override path so a false positive never silently blocks a paying host.
3. **Event Pass renewal stays $15/yr.** Typical albums cost us $3-5/yr; renewals add near-zero
   ingress; priced as an easy yes. Revisit only if full-utilization renewals cluster.

## Why 30/60 and 3x

30s is the free-tier category norm (GoPro Quik, Canva) and holds a real 12-15 moment montage; 15s
reads stingy and 90s montages sag while losing Reels/TikTok reach. 3x-cap ingress leaves a full extra
refill cycle of legitimate headroom while capping transfer-pipe abuse at roughly $10-15/month of
write-op + backup cost on the worst plan; the cost of being wrong is asymmetric (too high = mild
abuse headroom; too low = a blocked paying customer), so 3x over 2x.

## Consequences

All three ship as ONE slice: tiers.ts + the `tier_limits()` migration + parity test + composer gate +
server clamps + the pricing-page copy touch, with `get_advisors` after the DDL. Stripe PRICES are
untouched (renewal already exists); price-point changes pre-launch remain a Stripe-plus-tiers.ts
operation with no schema impact.
