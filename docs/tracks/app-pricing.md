---
track: app-pricing
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **The eighth decision was cut from the goal's list and replaced.** The goal suggested eight areas; this board
  asks eight questions, and one of them ("what Checkout comes back to") is the goal's AFTER while the goal's
  THE DOORS and THE WORDS AT THE GATE are both kept whole. Nothing was dropped. **Recommended answer:** keep the
  eight as cut; carried.
- **The object decision is asked at 375, not at the window knob.** The first `lab:demo` run reported the dialog
  and the sheet as the same picture at a laptop, which they are by definition (the sheet's own claim is that it
  IS the dialog there). The step is pinned to a phone, the window knob is off its strip, and the other seven
  decisions carry it so every shape is still read at 1440. **Recommended answer:** keep the pin; carried.
- **Whether /account grows a plan card is `app-shape`'s `you` question, still open on the desk.** The doors
  decision's third option draws that card so the two questions can be answered together, and names the overlap in
  its own words rather than re-asking it. **Recommended answer:** if `you` lands on One You, `doors=page` is
  already implied and only the menu row is a new call; carried.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none: the round is lab-only and touched no system fact.

## Deferred (ROADMAP one-liners, bucket named)

- **Later / DX:** `defineExploration` could dedupe its flattened `configs` by control id; every board that shares
  a knob across decisions writes the same filter by hand (app-shape, gallery-width and now app-pricing have all
  filed it).
- **Later / DX:** `lab:demo` defaults `--base` to `http://localhost:3000`, which is the Orchestrator's port, so a
  lane that forgets `--base` silently measures the wrong tree and reports "found no open step to press".

## Handoff (replaces the chat report)

- Code commit `d54f8a19`, merge commit `8b67a8ff`, this manifest on top; all pushed on `lp/app-pricing`. Synced with `origin/launch-prep` at `57e3bc9f` (it moved twice:
  `f2cfa26f` fast-forwarded, then `57e3bc9f` conflicted on all three registration files plus RULINGS because
  `contact-page` and `press-page` register at the same heads). Both sides' added lines kept everywhere; the union
  resolver swallowed this board's RULINGS closing lines (album-page's went the same way at the river-card merge)
  and they were put back by hand, which is why the merge is its own commit `8b67a8ff`.
- Gates on the synced tree, each its own exit code: `pnpm design:rules` ok (123 components, 733 contracts, 18
  policies), `pnpm typecheck` ok, `pnpm lint` ok (the 8 known warnings, 0 errors), `pnpm test` ok (2,521 in 241
  files), `pnpm build` ok (254 pages), `pnpm lab:smoke --base http://localhost:3136` ok (315 checks, 0 failing;
  the board reads 481 words of 1,200), `pnpm lab:demo --board app-pricing --base http://localhost:3136` ok
  (8 steps, 0 failing, every step draws its options, tallest 1.6 screens).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the five files under
  `src/app/(dev)/design/sandbox/app-pricing/` plus the registration exception (`sandbox/registry.ts`,
  `(shell)/lab/boards.ts`, `touchpoints.ts`) and `docs/design/library.md` as `pnpm design:rules` writes it.
  This manifest is the only other file. No production byte.
- The decisions, one line each (three options each; every option drawn on the shipped chrome with four host
  fixtures, at 1440 and 375, every number read from `tiers.ts`):
  - `object`: what a pricing click opens; a centred dialog / **a sheet in a hand and a dialog at a laptop** /
    the door's own surface opening in place. Recommendation: `sheet`. Asked at 375, where the three separate.
  - `first` (after `object`): what it opens on; the plans every time / **the reason they clicked** / your plan
    today. Recommendation: `trigger`. The one thing a static `/pricing` can never do.
  - `carry` (after `first`): how much it holds; the plans and a price / **both toggles and the lines this
    trigger makes matter** / everything the marketing page says. Recommendation: `fitted`. Measured: 58 percent
    of a laptop window against parity's 95 percent, and 100 percent at a phone where parity scrolls.
  - `learn` (after `carry`): how `/pricing` stays one click away; **a quiet line under the buttons** / a second
    button of equal weight / the comparison as a second screen inside. Recommendation: `foot`.
  - `pass`: how much Event Pass belongs inside; its own card / **one line and a button** / not at all.
    Recommendation: `line`. The button reads "Add a pass" for a holder, because passes stack.
  - `doors`: where the app opens it from; the eleven doors retargeted / **plus a plan row in the user menu** /
    plus a plan card on `/account`. Recommendation: `menu`. The third option is `app-shape`'s `you`, drawn.
  - `words` (after `first`): how a locked control asks; each site keeps its own sentence (the shipped
    components, three wordings) / one sentence one source / **a lock chip, and the surface explains**.
    Recommendation: `chip`.
  - `back` (after `object`): what Checkout returns to; a receipt on the dashboard / the surface reopened over an
    unlocked control / **the control itself, open, with the receipt above it**. Recommendation: `finish`.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. No preview reaches Stripe by construction:
  every buy button is a plain `Button` and the shipped `StorageMeter` is drawn with `hasBilling` and
  `isEventPass` false, the two flags its `CheckoutButton` and `ManageBillingButton` hang on.
- Captures: 48 PNGs (every option at 1440 and at 375) at
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad/captures`.
  Reading them against their own words caught five defects, all fixed: the dialog and the sheet were one picture
  at a laptop; `data-surface` on the unlocked password field made the caption report an 82 px "surface" on the
  option whose claim is that nothing is in the way; `/account` showed one host's profile slug under another's
  email; the receipt sat over a dashboard still reading the Free cap; and the events line pluralised on the
  count rather than on the limit ("1 of unlimited event used").
- Look at first: **`carry`, at the phone knob.** It is the only decision whose cost is a measured number rather
  than a preference, and the caption says it outright: parity takes the whole 812 px screen and scrolls, while
  the fitted surface takes just over half. Then **`first` on the "Already on Pro" knob**, which is the case the
  live `/pricing` gets wrong today and the clearest argument for keeping any of this in the app.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). Round one of pricing inside the app landed as eight decisions
on the shipped host chrome: what a pricing click opens, and staged behind it what it opens on, how much it
carries, how the marketing page stays one click away and what a locked control says; plus how much of the Event
Pass belongs inside, where the app opens it from, and what Checkout comes back to. Two knobs rode every step, the
window and which of four hosts clicked, so each surface was judged at its worst moment; every price, plan name,
cap and capacity sentence was read from `tiers.ts`, the cap gate resolved through the marketing calculator's own
`smallestProFor`, and no preview could reach Stripe. Today was the shipped code throughout, so the four wordings
for one lock were read off `EventPasswordControl` and `EventSlugControl` rather than described. Reading the 48
captures against their own words caught five real defects before handoff, including two options that drew the
same picture at a laptop.
