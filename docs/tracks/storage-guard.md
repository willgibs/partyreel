---
track: storage-guard
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "8d1f66fd"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/stripe/
  - src/lib/stripe/
  - src/lib/billing/
  - src/lib/validation/checkout.ts
  - src/components/app/checkout-button.tsx
  - src/components/app/manage-billing-button.tsx
  - src/components/app/pricing/
  - src/components/app/dashboard/storage-meter.tsx
  - src/app/(app)/account/
  - src/lib/db/queries/storage.ts
  - src/components/marketing/sections/pricing/plan-cards.tsx
  - src/lib/constants/legal-terms.tsx
  - src/lib/constants/legal.ts
  - content/help/upgrade-downgrade-or-cancel.mdx
  - content/help/pro-vs-event-pass.mdx
  - content/help/payments-receipts-and-invoices.mdx
  - content/help/what-happens-when-storage-fills-up.mdx
  - docs/systems/billing-caps.md
  - docs/systems/lifecycle-recovery.md
  - docs/PRICING.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/constants/tiers.ts
  - src/lib/lifecycle/recently-deleted.ts
  - src/lib/lifecycle/over-cap.ts
  - src/components/marketing/sections/pricing/recommend.ts
---

# lp/storage-guard

**Goal.** No plan change leaves a host storing more than the new cap (Will): every purchase that replaces the cap (a Pro checkout, a Pro-to-Pro size or interval change) is checked against what the host stores and refused with the numbers until they fit; Event Passes are never refused; Pro changes leave the general billing portal for a change-plan route that confirms exactly one price on a tagged portal configuration; the portal's quantity stepper closes; the plan sheet opens on the smallest size that fits; and the billing words and docs stop promising the portal's switcher.

## The brief

**Will's words (2026-09-22), verbatim.** "when a user with multiple event passes attempts to purchase a pro plan with less storage than their current active storage total, we should show them their total storage used now and ask them to delete media to get under the storage cap of their selected pro plan before being able to switch. Believe this is roughly what you recommended. This eliminates our need to remove any of their media or cover excess storage costs ourselves." Then: "Downgrading pro plan should follow event pass with checking the storage and ensuring it fits. Cancellation as normal." And: "we have no real users on Partyreel, so everything is test data right now."

**Rising Tides (Will, 2026-09-22):** "the library's purpose is more our working rules to keep consistency across what we've built and new builds, but not hard rules that can't be reshaped. Working guidelines, not hard rules ... everything is unprotected, anything may be relitigated for better solutions despite any past decisions." A rule that blocks better work is reshaped deliberately and named in your Handoff.

**What exists (read-only maps, verified; line numbers from `8d1f66fd`).**
- The cap is checked against ACTIVE bytes (`host_active_bytes()`: non-removed media in non-deleted events); the meter's `getHostStorageSummary` (`src/lib/db/queries/storage.ts:37-68`, RLS-scoped, already called by the dashboard and the account page) computes the same in TypeScript. A Remove frees room at once. Pro is 100 GB / 500 GB / 2 TB, monthly or yearly (six prices); an Event Pass is 75 GB and passes STACK (`tiers.ts:89-168`, `billing/passes.ts`).
- `/api/stripe/checkout/route.ts` refuses only an active Pro (`already_subscribed`, :96-103) and compares no sizes (:122-144): stacked passes above the chosen Pro size shrink into the 45-day over-cap grace, after which the largest files are removed automatically (`lifecycle-recovery.md:93-98`).
- A Pro size or interval change goes through the Stripe billing portal: `checkout-button.tsx:67-76` sends `already_subscribed` to `/api/stripe/portal` (default configuration `bpc_1TcTxWPtjqmVkBwkcAldFEZA`: all six prices, `always_invoice`, immediate, AND a quantity stepper with no maximum, so a host could pay two or three times for one cap; `provision.ts:66-67` reads only the price). The portal cannot know our storage, so it cannot refuse. `billing-caps.md:83-87,170-172` calls its switcher load-bearing (the only route between monthly and yearly).
- The plan sheet (`src/components/app/pricing/pricing-sheet.tsx`) knows only tier, billing and pass expiry; to a Pro host it shows only Manage billing (:236-241) and says "Change your storage size, switch to yearly or cancel in the billing portal." (:107). Four doors open it on Pro 100 GB whatever the host stores (the create wizard, the restore button, the recently-deleted grid, the dashboard's event-limit line); `triggers.ts:79-85` picks the smallest fitting size only when a door passes bytes; `recommend.ts`'s `smallestProFor` only recommends. The account page renders the sheet only for `tier !== "pro"` (`account/page.tsx:276`); the storage meter's popover offers Manage billing (`storage-meter.tsx:134-139`).
- The webhook (`webhook/route.ts`, `provision.ts:35-76`) is the sole writer of `profiles.tier` and `storage_cap_bytes` and does no usage check; keep it that way. The deleted-items budget is one cap (`recently-deleted.ts`), so after a shrink the oldest deleted items purge early.

**Done by the Orchestrator before your cut:** a SECOND portal configuration in Stripe TEST, `bpc_1UIhooPtjqmVkBwkcLe9YgYN`, metadata `partyreel_purpose=change_plan`: `subscription_update` on with the six Pro prices, `default_allowed_updates: ["price"]`, no quantity adjustment, `always_invoice`, the billing anchor unchanged, no period-end scheduling; cancel, invoice history and customer update off; card updates on (Stripe requires it beside subscription updates). There is NO env value for it: your code finds it by that metadata (list the account's active portal configurations once, cache it in module scope, fail closed with a clear error if none carries the tag). The general configuration loses `subscription_update` only after alias build 2 is live (the Orchestrator's, from your Handoff's exact call), so the running alias keeps its path meanwhile.

**Build:**
1. ONE server check, for every purchase that REPLACES the cap: any Pro checkout and any Pro-to-Pro change. An Event Pass is never refused (passes stack). It compares active bytes (`getHostStorageSummary`, never re-derived) with the target plan's PLAIN cap from `tiers.ts` (not the 10% write headroom); a Free host in grace meets it too. A refusal is a 409 with a code and the numbers: stored, the target's cap, the gap, and the sizes that fit.
2. Checkout: the check runs after `resolveEntitlement` and `planById`, before the customer is created (`route.ts:96-163`); a Pro checkout session gets `expires_at` 30 minutes out (Stripe's default is 24 hours). `checkout-button` shows the refusal's numbers instead of a bare toast.
3. The plan sheet learns what the host stores from the server when it opens (one small authenticated read beside the checkout route, e.g. `/api/stripe/plan-facts`), so no door has to pass it: it opens on the smallest size that fits, marks the sizes that don't, and shows a Pro host the six prices in a plain list with the current one marked. Its designed faces (the refusal; a Pro host's prices) come later from the `host-storage` board; ship them plain and honest now: "You're storing 140 GB. Pro 100 GB holds 100 GB, so remove 40 GB first, or choose Pro 500 GB." Before a switch that fits but shrinks the cap, one line says Deleted keeps items only up to the new size.
4. A change-plan route (`/api/stripe/change-plan`): a zod enum of the six Pro plan ids (sizes and intervals alike). It verifies the signed-in user (`getUser()`), that the subscription is theirs, active, single-item, and that its current price is one of ours; runs the check on the target's cap; then creates a portal session on the change-plan configuration with `flow_data.type = "subscription_update_confirm"` for exactly one item (`quantity: 1`, the target price) and `after_completion: { type: "redirect", redirect: { return_url } }`, so the host never lands on that configuration's home and its switcher. Proration and 3DS stay Stripe's; the route writes nothing to the profile (the webhook applies the new cap). Every Pro door reaches it: `already_subscribed` posts the clicked plan id there instead of opening the general portal; the plan sheet's Pro list; the account page's Plan card (you own `account/page.tsx`; `guest-by-upload` changes its three "Events you joined" lines as a listed exception, so leave those); the storage meter's popover. Verify in TEST, reading the created session and configuration through the API (the Chrome tools cannot drive Stripe-hosted pages), that the flow session reaches no plan switcher or quantity stepper; if it can, fall back to a direct subscription update for same-interval size changes and say so in the Handoff.
5. The backstops stay and are documented: the webhook as sole writer; the 45-day grace for what the rule cannot reach (cancelling, a pass running out, a change made in the Stripe dashboard, storage that grew between the check and the confirm).
6. Words, facts inside your lane: `billing-caps.md` (the invariant with Will's words; the plan-switch and runbook paragraphs that call the portal's switcher load-bearing; the change-plan configuration found by its tag); `lifecycle-recovery.md` (stacked passes into a smaller Pro no longer happens at checkout); `PRICING.md` (the switch; its LIVE step: the change-plan configuration re-created in live with the same tag; delete the line "Saving an event is free", since save is gone); the help: `upgrade-downgrade-or-cancel.mdx`, `pro-vs-event-pass.mdx`, `payments-receipts-and-invoices.mdx` (the portal keeps the card, the invoices and cancelling; sizes and intervals move to the plan sheet) and `what-happens-when-storage-fills-up.mdx` ("after a downgrade you get 45 days" becomes a cancellation or a lapse); in code, the pricing sheet's line, the checkout route's `already_subscribed` message, `/pricing`'s "Change size or cancel any time in the billing portal." (`plan-cards.tsx:522-523`), and the Terms' "change its size through the billing portal" (`legal-terms.tsx:259`) with the Terms version (`legal.ts`; the Privacy bump `guest-by-upload` needs is the Orchestrator's one line at its record). List in your Handoff: the exact Stripe call that removes `subscription_update` from the general configuration; the pricing sheet's component note (`component-notes.ts:165` is `guest-by-upload`'s file); the ROADMAP launch lines to rewrite ("six-price switching verified" and the `[human]` portal check).

**Tests born:** the check (a pass never refused; a Pro checkout refused over the cap with the numbers; a Free host in grace refused; the plain cap, never the headroom); the change-plan route's refusals (not signed in, not their subscription, not single-item, a foreign price, over the cap) and its session shape (one item, quantity 1, the tagged configuration, redirect after completion); the sheet opening on the smallest fitting size. The refusal itself is pinned by tests; nobody holds 100 GB of test media.

**Calls already made (take them; list any you would overrule):** the plain cap, never the headroom; passes never refused; the sheet opens on the smallest size that fits; a refusal names the size that does fit; the portal's quantity stepper closes with the general configuration's switcher.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
