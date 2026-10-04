---
track: pricing-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "31b7c652"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/constants/tiers
  - src/lib/stripe/plans.ts
  - src/lib/validation/checkout
  - src/app/(marketing)/(cinema)/pricing/
  - src/components/marketing/sections/pricing/
  - src/components/app/pricing/
  - src/components/marketing/jsonld
  - src/components/marketing/mdx/spec-shared
  - src/lib/constants/marketing-voice
  - src/lib/constants/press
  - src/lib/content/llms
  - src/lib/content-policy.test.ts
  - content/help/
  - content/blog/
  - supabase/migrations/20261004100000_
  - docs/PRICING.md
  - docs/systems/billing-caps.md
  - docs/PRD.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/env.ts
  - src/lib/db/types.ts
  - docs/systems/database-security.md
  - docs/systems/marketing-content.md
---

# lp/pricing-wiring

**Goal.** Will's Ladder A everywhere a price or a limit is said or enforced: Free 100 MB, the Event Pass $29 for 25 GB with 50 GB of uploads over its year and a $19 renewal, Pro 50 GB / 200 GB / 1 TB at $9 / $29 / $99 a month (x10 a year) with 100 / 200 / 500 GB of uploads a month; the published rows with their hover lines and the fair-use line; tiers.ts and tier_limits() by migration; the Stripe prices written for the Orchestrator to create.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's pricing, decided (2026-10-03 23:58Z and 2026-10-04 02:50Z): Ladder A, "send it on pricing tier A with $99", the renewal at $19.** The ladder, its reasons and its published rows are `../partyreel-wt/_scratch/cost-atlas/ladders.md` ("Ladder A", "The published limits, row by row", "The fair-use line"); the market around it is `../partyreel-wt/_scratch/pricing-research/summary.md`. Read both whole. What ships:

| | Free | Event Pass | Pro 50 GB | Pro 200 GB | Pro 1 TB |
| --- | --- | --- | --- | --- | --- |
| Price | $0 | $29 once; renew $19 a year | $9 a month, $90 a year | $29 a month, $290 a year | $99 a month, $990 a year |
| Storage | 100 MB | 25 GB | 50 GB | 200 GB | 1 TB |
| Uploads | 300 MB a month | 50 GB over its year | 100 GB a month | 200 GB a month | 500 GB a month |
| Events | 1 | 1 a pass (passes stack) | Unlimited | Unlimited | Unlimited |
| Guests | No limit on every plan | | | | |

Free keeps photos only and clips with the mark; every paid plan has video and no mark; 10 GB the largest file everywhere; Deleted 30 days and counted in storage (trash-in-storage, merged before you: the cap holds albums and Deleted together, and Make room from Deleted, on by default, frees the oldest of Deleted when an upload needs room).

**What it reaches:**
1. **The single source.** `src/lib/constants/tiers.ts` and its mirror `public.tier_limits()` under the parity test: the plans (the Pro steps become 50 GB, 200 GB and 1 TB; rename their ids and env keys if a name would lie, a Question with your answer), the pass at 25 GB, its renewal label at $19. The uploads allowance stops being one multiplier of the cap (`INGRESS_CAP_MULTIPLIER`, `monthlyIngressCap`): each plan publishes its own number, and the pass's is counted over its year, a new window for the meter (`storage_ledger` and the SQL that refuses an upload past the allowance). The migration under your reserved prefix, written for the Orchestrator: the Advisor reads it, then it is applied by protocol (drift read, the rolled-back check red then green at its foot, the bodies restated from their newest definitions in `supabase/migrations/`, the holders of any function it replaces restated exactly). Nothing live holds real data (Stripe in TEST, zero real users), but partyreel.com shares the database: say what milestone 35 meets between the apply and the next milestone, or make it an expand.
2. **Stripe.** Never touch Stripe yourself: the Orchestrator creates the TEST prices through the Stripe MCP after confirming livemode is false and sets the Vercel env. Write the exact prices to create (product, amount, interval, the env key each fills) under your Handoff's Proposed changes, and make the code read the new keys. Say what happens to a test subscription on an old price (there are a few, test accounts only).
3. **The pricing page and the plan sheet** (`src/app/(marketing)/(cinema)/pricing`, `src/components/marketing/sections/pricing/`, `src/components/app/pricing/`): the table's published rows, each with its hover line in a host's words (Storage, Uploads, Events, Guests, Largest file, Deleted, Kept: `ladders.md`'s table, with Deleted's line rewritten for "counts in your storage" and the setting that makes room); the fair-use line in the fine print (its draft in `ladders.md`, the Terms it rests on); cards that lead with the events each holds ("a 200-guest wedding, twice over"), Pro's sizes labelled by use (a season of parties, a planner's year, a venue's year) with the GB in its row; "one payment, no subscription" on the pass. The word "ingress" stays off the site: the row is "Uploads", and the content fence (`src/lib/content-policy.test.ts`) is refined on purpose, its scar kept, so the published allowances are legal and an unpublished breaker's number still is not.
4. **Every marketed number, everywhere:** `marketing-voice.ts`, `jsonld.tsx`, `src/lib/content/llms.ts`, `press.ts`, the MDX spec table, the help and the blog (`content/help/`, `content/blog/`), the pricing FAQ. "No guest limit" and "unlimited events" stay true and stay said. And trash-in-storage's help follow-ups, which promise that deleting frees room at once: its Handoff lists them (its manifest at its merge commit's second parent on `launch-prep`): `content/help/storage-plans-and-limits.mdx`, `what-happens-when-storage-fills-up.mdx`, `hide-remove-and-restore.mdx`, `upgrade-downgrade-or-cancel.mdx`, `messages-guests-might-see.mdx`, `how-long-media-is-kept.mdx`, `how-long-an-event-pass-lasts.mdx`, and `pricing-faq-data.ts`'s "space frees immediately").
5. **The docs, in place:** PRICING.md's Tiers table and every line its numbers move (the worst-month table re-run for the new sizes, which `ladders.md` already computed), `billing-caps.md` (the allowances per plan, the pass's year), the PRD's pricing lines.

**Questions** (each with your recommended answer, built on it): the plan ids; the pass's year as the meter's window (from its purchase, or its event's date); a test subscription on an old price; anything a one-way door (every marketed number only moves up after launch: `ladders.md` names them).

**Verify** beyond the gate: `/pricing` and the plan sheet at 375 and 1440, light and the room, every hover line read; a rolled-back MCP check of the migration's refusal (an upload past each allowance refused, the pass's year counted, Free's month); the parity test. Checkout itself is walked on the alias after the Orchestrator sets the prices (a card is Will's to type; never yours).

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
