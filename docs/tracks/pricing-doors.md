---
track: pricing-doors
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "4c11a0ad"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/auth/return-path
  - src/components/app/checkout-button
  - src/components/app/manage-billing-button
  - src/components/app/pricing/
  - src/app/(dev)/design/(shell)/library/compositions/pricing-demos.tsx
  - src/app/(app)/account/page.tsx
  - src/components/app/dashboard/storage-meter.tsx
  - src/app/(marketing)/(cinema)/pricing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/api/stripe/checkout/route.ts
  - src/components/ui/popup-back.ts
  - docs/systems/billing-caps.md
---

# lp/pricing-doors

**Goal.** The doors to Stripe and back: a signed-out Get Pro returns to /pricing after sign-in, Back from Stripe is one press, and checkout and manage-billing go through PricingDoors' verbs.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3136 is yours; 3000 is Will's desk. Stripe is TEST mode: a checkout you open is never paid; the alias's Ladder walk stays Will's.

From ROADMAP "Now" (provenance in git). Each fix pinned by a test that fails on the old code:
1. **A signed-out Get Pro on `/pricing` lands on the dashboard after sign-in**, since the return allow-list (`APP_RETURNS`, `src/lib/auth/return-path.ts`) holds only app pages: return her to `/pricing` (with whatever mark reopens her Get Pro), keeping every open-redirect refusal (a foreign host, a protocol-relative path, an encoded slash, each a test). The pricing page changes only its plumbing; nothing visible moves there.
2. **On a phone, leaving the plan sheet for Stripe by `window.location.href` (Checkout, change-plan, the portal) leaves the sheet's same-URL entry behind, so Back from Stripe takes two presses:** leave without that entry (taking it first as `popup-back.ts` does, or replacing it), so one Back returns to the page.
3. **`checkout-button.tsx` and `manage-billing-button.tsx` fetch inline:** move both behind `PricingDoors`' verbs (`components/app/pricing/pricing-doors.tsx`) and delete the Library's two stand-in buttons (`library/compositions/pricing-demos.tsx`).

Wiring rigor: the whole gate; each door walked on your port signed out and in (the chooser, `willg97@gmail.com`), up to Stripe's TEST page and Back, at 375 and 1440.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
