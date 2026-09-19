---
track: app-pricing
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e442fc55"         # the launch-prep SHA the branch was cut from
board: app-pricing      # round one: pricing inside the app, the marketing page a "learn more" second layer
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/app-pricing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/PRICING.md
  - docs/systems/billing-caps.md
  - docs/systems/host-app.md
  - src/lib/constants/tiers.ts
  - src/lib/stripe/entitlement.ts
  - src/app/api/stripe/checkout/route.ts
  - src/app/api/stripe/portal/route.ts
  - src/components/app/checkout-button.tsx
  - src/components/app/manage-billing-button.tsx
  - src/components/app/dashboard/storage-meter.tsx
  - src/app/(app)/dashboard/page.tsx
  - src/app/(app)/dashboard/upgraded-toast.tsx
  - src/components/app/create-event-wizard.tsx
  - src/components/app/event-password-control.tsx
  - src/components/app/event-slug-control.tsx
  - src/components/app/event-settings/visibility-section.tsx
  - src/components/app/event-settings/uploads-section.tsx
  - src/components/app/user-menu.tsx
  - src/app/(app)/account/page.tsx
  - src/app/(marketing)/(cinema)/pricing/page.tsx
  - src/components/marketing/sections/pricing/
  - src/app/(dev)/design/sandbox/app-shape/spec.ts
---

# lp/app-pricing

**Goal.** Round one of `app-pricing`: PRICING INSIDE THE APP. Will (2026-09-19, `docs/design/rulings.md`, "stack the
lab", verbatim): "an in-app pricing modal so we don't take users out of the app to the marketing site by default
every pricing click, would prefer to keep them within the app. The marketing site can be a more comprehensive
'Learn More' second-layer resource that's a click away from the more minimal in-app pricing if needed." Six to
eight decisions with `defineExploration`, each drawn on the REAL app components with fixtures (a Free host at the
storage cap, a Free host at a gated feature, a Pro host, an Event Pass holder; the numbers read from `tiers.ts`,
never retyped) at 1440 and 375, a recommendation each, every number measured. "Modal" is his word for the ask,
not the answer: the board asks the object. **Not in this round:** any production byte; the prices, caps and
plans themselves; Checkout and the portal (the surface ends where `CheckoutButton` begins); the marketing pricing
page's own design (ruled in the earlier revamp; here it is the second layer).

**What is measured (the tree at the cut).** Every pricing click in the app leaves the app: the gated feature
links ("Upgrade to enable/allow X", worded differently per file, on the password control, the slug control, the
visibility and uploads sections), the refusal toasts' "Upgrade" action (the wizard's event limit, restore and the
bin's insufficient space), the dashboard's over-cap and at-cap banners ("See plans", "upgrade for more") all
navigate to `/pricing`, a static, tier-blind marketing page that cannot tell a signed-in Pro they already
subscribe. Billing's only in-app home is the storage meter's popover ("Need more?" to `/pricing`; "Renew Event
Pass" and "Manage billing" POST straight to Stripe); the user menu, the account page, the welcome and the free
reel's watermark carry no billing door at all. The marketing page carries what the app never shows: the plan
pair with a size selector and a cadence toggle, the pass card, the unlock grid, a calculator (a storage slider,
video, once or again), a five-group comparison table, a shared band, an FAQ that settles pass-to-Pro conversion,
stacking, the cap's consequence and cancellation. The tiers: Free ($0, 2 GB, one event, no card, no trial); Pro
in three sizes and two cadences (100 GB $9 or $90, 500 GB $19 or $190, 2 TB $39 or $390; annual exactly ten
months); the Event Pass ($24 once, 75 GB, one event, about a year, renews at $15, stacks, converts unused time
to credit toward Pro). Six seams are listed in the Orchestrator's map (`docs/tracks/orchestrator.md`, "The app
round's map", the pricing paragraph); read them. The behaviour pins: `tiers.test.ts` (PLANS' integrity, the
annual times ten, marketed numbers only move up), `tier-limits-parity.test.ts` (`tiers.ts` in lockstep with the
SQL), `entitlement.test.ts` (one Pro at a time, passes stack), `provision.test.ts`, `passes.test.ts`; the
`app-shape` board's `you` decision ("One You: plan, profile...") is adjacent, on the desk, not a substitute.

**The decisions (suggested; yours to recut, never forced apart).** THE OBJECT (what a pricing click opens: a
centred dialog everywhere; a sheet in a hand and a dialog at a laptop; a panel in place, the door's own surface
expanding); THE FIRST VIEW (what it opens on: the plans, generic, Pro monthly; the trigger's context, a feature
gate naming the feature and a cap gate opening on the smallest plan that clears it; the host's own plan and what
changes); HOW MUCH (what it carries: the plan cards alone; the cards with the size and cadence toggles and the
two or three rows the trigger makes relevant; parity with the marketing page, the anti-option, drawn so its cost
shows); LEARN MORE (how the marketing page is one click away: a line at the foot; a "compare every plan" door
that leaves the app on purpose; the comparison pulled into the surface as a second step, `after` the first
view); THE PASS (Event Pass inside the surface: full parity; one line and Buy, the rest a click away; absent, the
meter's Renew the only pass door); THE DOORS (where it opens from: every existing door retargeted and nothing
added; a Plan row in the user menu too; a plan card on the account page too, app-shape's You question left
open); THE WORDS AT THE GATE (copy for gated features: each surface's own sentence as today; one shared source;
the surface explains and the inline sites shrink to one word); AFTER (Checkout returns: the receipt toast as
today; the surface reopens on "you're on Pro" and the thing they wanted; the gated feature completes itself).
The `app-shape` board is the worked example for a board on real app components with fixtures; copy its approach,
import nothing from another board's directory.

**Binds.** The bible; `tiers.ts` is the single source of every number and name (the board reads `PLANS`, never a
literal; the parity test stays green); the webhook is the sole writer of tier and caps, the client never decides
a price id or a tier, a held Pro is refused with 409 and routed to the portal (`billing-caps.md`); the annual
ruling (exactly ten months); the earlier pricing rulings on the marketing plan cards and the calculator
(`touchpoints.ts`: `pricing-plan-cards`, `pricing-calculator`) are precedent for the second layer, not for the
surface; cost frugality; no em-dashes; the copy is open (bible 21). Mobbin is encouraged, never required:
in-app upgrade sheets, paywalls, plan pickers, "you've hit your limit" moments.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3136`,
  `pnpm lab:demo --board app-pricing` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 1440 and 375 on the real components with fixtures, no request to Stripe from a preview; a
  capture of every option beside its words, the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board app-pricing` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
