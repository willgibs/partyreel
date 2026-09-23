---
track: storage-guard
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

None open. Every call I took without asking is under "Calls his to overrule" below, each with the answer built.

## System-doc edits (in place, owned facts only)

- `docs/systems/billing-caps.md`: the ROLE line; the meter's read pages past `max_rows` (the cap model); Where it lives (the guard, plan facts, change-plan, portal-config, the new routes and sheet files); ONE PLAN AT A TIME (a pass holder starts Pro at a size that fits); ★ the new invariant NO PLAN CHANGE LEAVES A HOST STORING MORE THAN THE NEW CAP, with Will's words and the backstops; the plan-switch invariant rewritten for `/api/stripe/change-plan` and the tagged configuration (the portal's switcher no longer load-bearing); the pricing-surface invariant gains the sheet's own read; the runbook's two portal configurations and the API recipe for verifying a change-plan session.
- `docs/systems/lifecycle-recovery.md`: over-capacity no longer reached by a purchase or switch (what remains: a lapse, a Stripe-dashboard change, storage grown between the check and the confirm); the standby budget shrinks with a smaller cap, said before the switch.
- `docs/PRICING.md`: the yearly paragraph (changes via the plan sheet); a new bullet for the rule (Will, 2026-09-22); pass economics (Pro at a size that fits); "Saving an event is free" deleted; Stripe setup's two configurations (TEST ids); the cutover (zero code changes still true, both configurations per mode, step 4 re-creates the change-plan configuration with the SAME tag, step 6 smokes a Change plan switch).

## Deferred (ROADMAP one-liners, bucket named)

- Billing follow-ons: a SECURITY DEFINER `host_storage_summary()` returning active and Deleted bytes in one aggregate, to replace the paged row read behind the meter and the storage guard for very large albums (a migration, so the Orchestrator's).
- Billing follow-ons: the webhook warns (Sentry) on a subscription item with quantity above 1, the old portal stepper's multiples, which provisioning reads as one cap.

## Handoff (replaces the chat report)

**Commits.** Work `8039bf5b` (the lane in one commit); syncs `b9873880` (launch-prep at `c7c6189f`) and `a3888d36` (launch-prep at `6d1e7a45`, after `recheck-by-upload` merged; `design:rules` regenerated identical artifacts). Both pushed to `origin/lp/storage-guard`.

**Gates on the synced tree `a3888d36`, each on its own exit code** (logs in the lane's scratch `gate2/`): `pnpm design:rules` 0 (1914 contracts on 162 components, 18 policies) · `collect-specimens` 0 (140 specimens on 101 entries) · `pnpm typecheck` 0 · `pnpm lint` 0 (0 errors, 9 warnings, none in a touched file) · `pnpm test` 0 (361 files, 3982 passed, 1 skipped) · `pnpm build` 0 (`/api/stripe/change-plan` and `/api/stripe/plan-facts` dynamic) · `pnpm lab:smoke --base http://localhost:3133` 0 (485 checks, 0 failing). No board, so no `lab:demo`.

**Lane check** (`git diff --name-only origin/launch-prep...HEAD`, 41 files): all inside `owns` except two GATE OUTPUTS, `docs/design/library.md` and `src/app/(dev)/design/rules/rules.generated.json`, regenerated by `pnpm design:rules` because the sheet's contract test gained cases (the counts line and the sheet's guard count). Three new tests sit in owned directories because a file claim covers only its exact path: `src/components/app/pricing/checkout-button.test.tsx`, `src/lib/billing/storage-summary.test.ts` (tests `db/queries/storage.ts`), `src/lib/billing/plan-ids.test.ts` (tests `validation/checkout.ts`). `account/page.tsx`: only the Plan card's buttons changed; the three "Events you joined" lines are untouched (a formatter reflow of them was reverted), so `guest-by-upload`'s exception merges clean.

**The items.**
- One check, `checkPlanChange` (`src/lib/billing/storage-guard.ts`): a Pro purchase or Pro-to-Pro change must fit active bytes under the target's PLAIN cap; an Event Pass is never refused; tier-blind; a 409 `over_new_cap` with `storedBytes`, `capBytes`, `gapBytes`, `fits`, `message`.
- Checkout: the check after `resolveEntitlement` and `planById`, before a customer exists (`route.test.ts` pins no customer created); a Pro session's `expires_at` 31 minutes out; `already_subscribed` words per plan.
- `/api/stripe/change-plan`: zod over the six Pro ids; `getUser()`; theirs, active or trialing, not ending, single-item, our price; the plan you're on refused; the check; a portal session on the tagged configuration, `subscription_update_confirm`, one item at quantity 1, redirect after completion; fails closed (503 plus Sentry) with no tagged configuration; writes nothing (`route.test.ts`, 18 cases).
- `/api/stripe/plan-facts`: the sheet's read when it opens (tier, active and Deleted bytes, cap, a Pro host's price and whether a switch can open); degrades with a Sentry warning when Stripe can't be read.
- The sheet opens on the smallest size that fits whatever the door, names the sizes it skipped, warns before a Deleted-shrinking move, prints a refusal in place; a Pro host gets `pro-price-list.tsx` (six prices, theirs marked "Your plan", too-small rows unswitchable, the numbers sentence).
- Every Pro door reaches change-plan: `CheckoutButton` posts the clicked Pro plan on `already_subscribed` (never the general portal) and shows a refusal's numbers; the account page's Plan card opens the sheet for Pro ("Change plan"); the storage meter's door reads "Change plan" for Pro.
- `getHostStorageSummary` pages past PostgREST's 1000-row cap (keyset by id, exact count first): it undercounted every host over a thousand items, which the guard now reads.
- Words: `/pricing`'s line ("from your account"), the Terms (version 1.6: sizes change from your account; a Pro size must hold what you store), the four help articles, the three docs above.

**Verified.** Local: every route answers 401 unauthenticated and to a forged token claiming willg97's id, 405 on the wrong method; the sheet's five faces (140 GB on Free, stacked passes shrinking, a click refused, the Pro list, a hand-set Pro) drawn on a throwaway local page (deleted, never committed) at 1440 (a 448px side panel flush right, no horizontal scroll) and 375 (the bottom sheet, `scrollWidth` 375), light and dark. Stripe TEST (read, plus one portal-session attempt with the app's `sk_test_` key; nothing else written): the tagged configuration found by the route's own lookup (`bpc_1UIhooPtjqmVkBwkcLe9YgYN`: six prices, `adjustable_quantity` off on all three products, `always_invoice`, anchor unchanged, no period-end scheduling, cancel, invoices and customer update off); a session built in exactly `changePlanSessionParams`'s shape (by a scratch script with the same lookup) passed Stripe's parameter validation and was refused only because TEST holds no ACTIVE subscription (`resource_missing` on `flow_data[subscription_update_confirm][subscription]` for canceled `sub_1U9G7nPtjqmVkBwkzVBh16X7`). Stripe documents that a flow hides the portal's navigation, and the redirect lands on our URL, so no fallback to a direct subscription update was built.

**Not verified, the red-team's** (it needs a live TEST subscription, and creating one was outside my grant and would fire webhooks at a shared test profile): after a TEST checkout on the alias (card 4242), a Pro host's Change plan to a size that fits opens Stripe's confirm page for exactly one price at quantity 1 and lands back on `/account`; the created session's `configuration`, `flow.type`, `flow.subscription_update_confirm.items` and `flow.after_completion` read as billing-caps.md's runbook says; a smaller size than stored is refused with the numbers; and a 10-second human look at what Back from the confirm page shows (it must never be that configuration's home with its switcher; if it is, a direct subscription update for same-interval size changes is the fallback). willg97 is Pro BY HAND in TEST (no customer, no subscription), so it answers `no_subscription` until it checks out for real.

**Assets requested from Will:** none.

**Proposed Stripe change (the Orchestrator's, after alias build 2 is live):** remove `subscription_update` from the general configuration, which closes its switcher and its unbounded quantity stepper in one call: `POST /v1/billing_portal/configurations/bpc_1TcTxWPtjqmVkBwkcAldFEZA` with `features[subscription_update][enabled]=false` (Stripe MCP: `stripe_api_write`, `PostBillingPortalConfigurationsConfiguration`, `{ "id": "bpc_1TcTxWPtjqmVkBwkcAldFEZA", "features": { "subscription_update": { "enabled": false } } }`, `livemode: false`). No migration, Worker, Vercel or env change.

**For the Orchestrator's own files.**
- `component-notes.ts:165` (`guest-by-upload`'s file), the pricing sheet's `for`: "what every pricing click in the host app opens (`app-pricing` r1, `object=sheet`): the ONE responsive Sheet, led by the TRIGGER it was given (a locked feature names itself) and by what the host stores, read from `/api/stripe/plan-facts` when it opens, so every door opens on the smallest Pro size that fits and names the sizes it skipped. A Free or pass host gets Free beside one Pro size and nothing else (`carry=cards` overruled the selector and the cadence toggle), the Event Pass on one line and a quiet foot that opens /pricing in a NEW tab; a Pro host gets the six prices as a list of buttons with theirs marked, each switch going through `/api/stripe/change-plan` and its storage check, and the portal for the card, invoices and cancelling. Pass a trigger child for a door that is a button; drive `open` for a door that is a toast action"; its `unspecimened` gains "...and its facts come from a signed-in read, so the honest demo is the shipped account page".
- ROADMAP, the launch checkpoint's switch line: "the live webhook and portal with six-price switching verified" becomes "the live webhook, the default portal without plan switching and the change-plan configuration re-created with its `partyreel_purpose=change_plan` tag".
- ROADMAP, the `[human]` item "Verify the Stripe Billing Portal permits switching between the six Pro prices" becomes: "Verify a change-plan session `[eng]`, TEST now and live at the cutover: a Pro host's Change plan opens Stripe's confirm page for one price at quantity 1 and returns to the app; read the session back per billing-caps.md's runbook, and look once at what Back from the confirm page shows."
- Terms moved to 1.6 in `legal.ts`; the Privacy bump `guest-by-upload` needs is still your one line there.

**Calls his to overrule.**
- A Pro Checkout session closes 31 minutes out, not 30: Stripe measures its 30-minute floor from its own creation instant.
- `past_due` or `unpaid` subscriptions fix the card in the portal before changing plan; one already set to end is renewed there first; `trialing` counts as active.
- A Pro plan with no subscription (set by hand) is refused with a contact-page line; the sheet shows its prices without switches.
- Choosing your own price at quantity above 1 is allowed, and heals the old stepper's multiples to 1.
- The refusal's stored figure and gap round UP, so doing exactly what it says is enough.
- The sheet paints the door's facts first and swaps when its read lands (no skeleton): a host over 100 GB can see the card change size within the open animation.
- The refusal sentence names the largest size that can't hold what you store and the smallest that can, at the cadence you chose.
- The storage meter's door reads "Change plan" for a Pro host (was "Need more?"); the account page's Plan card shows "Change plan" to Pro as well as to a pass holder.
- A confirmed change returns to the page it started from (the Checkout allow-list, never the welcome marker).
- The sheet's contract reshaped: "tells a subscriber she subscribes, and sells her nothing" is now "... never offers a second subscription" (no checkout card, six price rows), and the no-selector guard covers the Pro face.
- `/pricing` says "Change size or cancel any time from your account" (both live there); the Terms gain one sentence, which is why they are 1.6.

**Look at first:** the Pro face of the sheet (`pro-price-list.tsx` inside `pricing-sheet.tsx`) and the change-plan route's session (`changePlanSessionParams` in `src/lib/stripe/change-plan.ts`, pinned in `change-plan.test.ts`); then the paging fix in `src/lib/db/queries/storage.ts`, which changes what every storage meter shows for a large album.
