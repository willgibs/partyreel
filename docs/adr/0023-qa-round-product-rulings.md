# ADR-0023: QA-round product rulings: one plan at a time, gated uploads, reel bytes exempt

**Status:** Accepted (2026-07-29, Will's rulings at the QA planning checkpoint) · **Context:**
the ~590-agent adversarial QA round of 2026-07-28/29 (fix queue:
`~/.claude/plans/please-conduct-a-thorough-staged-pixel.md`) surfaced three findings whose fix
depended on a product decision rather than an engineering one. Related: ADR-0021 (pricing numbers),
ADR-0022 (guest surfacing), ADR-0004 (capability tokens).

## Context

Three QA findings could not be fixed without first settling what the product SHOULD do:

- **#3 / #35 (billing).** Nothing stopped a host with an active Pro subscription from starting a
  second subscription, or from buying an Event Pass that **collapsed their own 2 TB cap to 75 GB**
  while Stripe kept billing Pro. The over-capacity sweep then began deleting their media, composing
  directly into the review's second critical. Separately, Event Pass renewal RESET the term instead
  of extending it, so an early renewal silently destroyed the remaining time.
- **#18 (locked events).** Password-protected and private events gate READING only. Anyone holding
  the link could upload into an album they cannot see.
- **#34 (reel bytes).** Exported reel `.mp4` artifacts (~10-60 MB) live in R2 charged against no
  meter at all.

## Decision

**1. One plan at a time.** Checkout refuses when the caller already holds an active plan, and says
so with a route to the billing portal (the portal owns upgrades, downgrades, and cancellation).
An Event Pass is purchasable only with no active Pro. **Event Pass renewal EXTENDS from the current
expiry**, never resets the term.

*Why:* the cap-collapse class disappears at the source rather than being patched at the sweep. A
host can never be billed for an entitlement they are not receiving, and the "which plan is my cap
from?" question always has one answer. Stacking models (cap = max, or cap = sum) were considered
and rejected: both require provisioning to resolve two live entitlements on every webhook, and both
have genuinely ambiguous behavior at the lapse boundary (whose media survives when one plan ends?).

**1a. Refinement (Will, 2026-07-29, at the Q2 integration): an active Event Pass MAY start Pro.**
The rule this decision exists to enforce is "no move that COLLAPSES a cap", and only one direction
does that: Pro to Event Pass (2 TB down to 75 GB while Stripe keeps billing Pro). Pass to Pro is
the opposite move, since every Pro size (100 GB / 500 GB / 2 TB) exceeds the pass's 75 GB, so the
cap-collapse guarantee is untouched. Refusing it bought no safety and cost the customer up to a
year of waiting or a support ticket. A live pass therefore may start Pro and may renew itself, but
still may not buy a SECOND pass (that stacks one entitlement rather than upgrading it). The
remaining pass term is preserved in `tier_expires_at`, so a later Pro lapse falls back to a pass
that is still inside its term.

**1b. Plan switches route to the Stripe billing portal.** `/pricing` is statically generated and
tier-blind, so a Pro host clicking a different Pro size reaches checkout and is refused there. The
checkout button acts on that refusal code (`already_subscribed`) and opens the billing portal,
which is where Stripe handles a size change with correct proration. Making the static page dynamic
purely to relabel one button was rejected as the worse trade. **Launch-checklist consequence:** the
Stripe Billing Portal configuration must permit switching between the three Pro prices, which is
now load-bearing rather than cosmetic.

**2. Locked events gate uploads too.** Uploading to a `password` or `private` event requires
passing the same unlock as viewing; the upload capability is minted only to unlocked sessions.

*Why:* the host's mental model of a locked event is "strangers cannot participate", and a leaked
link to a private wedding could otherwise be filled with strangers' media. The alternative
(deliberate drop-box semantics, where a locked album still collects from any link-holder) is a
coherent product, but it is not what "private" says to a host, and it would need loud settings copy
to be honest. If drop-box behavior is ever wanted, it should be an explicit, named toggle.

**3. Reel artifact bytes stay exempt from storage metering, bounded by design.** The rendered
`.mp4` does not decrement the host's storage. The bound is structural: **one artifact per event**
(a re-render overwrites the same stable key), which is pinned by a test rather than assumed.

*Why:* the reel is the product's flagship moment and its creation is free by ADR-0021. Charging it
would let a Free host near their cap be blocked from the very feature that sells the product, and
would make regeneration math (replace vs. add) a user-visible concern. The exemption is only safe
while the one-artifact invariant holds, hence the pin.

**4. The reel experience ships as V1 "Marquee in the feed"** (the `/design/c/reel-experience`
round). Will's words: "much more rich and feed-native, provides clear action for the host to
create... can lead to an actual Reel Studio where functionality can live (rather than forcing into
feed), and feels much more visually beautiful for guests on arrival."

Composite reading, binding on the production build: the feed section IS V1's poster card plus its
labeled controls and engine-thumb style rail; deeper editing GRADUATES to a Reel Studio destination
(the round's V2 room, entered from the card, never forced inline); the reel is still BORN by an
explicit Create act (the earlier ruling stands, and it is what the ratified reveal triggers on).
**The quick-add mechanism is re-opened**: "most liked" is not a reliable signal when likes are
sparse, so the production picker blends signals (likes where they exist, plus recency, per-guest
coverage, and photo/video mix) behind an honest label, and never falls back to random selection.

## Consequences

- Checkout gains an entitlement pre-check; provisioning gains a recency guard and a unique index on
  `stripe_customer_id`; renewal arithmetic changes from "now + term" to "max(now, expiry) + term".
- The guest upload capability mint moves behind `resolveGalleryAccess`, so the write path finally
  inherits the read path's gate (the QA's "single clearest structural finding").
- Reel bytes remain off the meter; a new test asserts one artifact per event so the bound stays
  real. If per-event reels ever become plural, this ADR must be revisited before that ships.
- V1 Marquee + Reel Studio is the production target; the three lab directions stay in the lab as
  the design record (`touchpoints.ts` records the decision).
