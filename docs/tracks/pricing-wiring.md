---
track: pricing-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **Q1 The plan ids and env keys: renamed, since the old names would lie** (built). `pro_100` / `pro_500` / `pro_2tb`
  (and `_yr`) become `pro_50` / `pro_200` / `pro_1tb`, and `STRIPE_PRICE_PRO_100` / `_500` / `_2TB` (and `_YR`)
  become `STRIPE_PRICE_PRO_50` / `_200` / `_1TB`: a key named 100 GB holding a 50 GB price misleads every log, test and
  Stripe metadata line for good. The pass's two keys keep their names (they name no size) and change value. The new
  keys also let both generations live side by side in every Vercel environment: milestone 35 keeps reading the old
  keys until the next milestone, so nothing about partyreel.com moves before it.
- **Q2 The pass's year as the meter's window: from its purchase, counted on the pass** (built). Each `event_passes` row
  already owns its paid window `[start_at, expires_at)`; its uploads count on the row itself
  (`event_passes.uploaded_bytes`), so the year is exactly the one she paid for (a renewal's year opens on its own row at
  zero), and a month's uploads never ration her event's night. The event's date is the wrong anchor: it can be any day
  (or none, or a range), move, or come after the purchase, and a pass is bought for an account, not an event. A stack
  counts each upload on the live pass that ends soonest, so a pass that ends takes its count with it: generous at the
  edge (a stack's later pass can see up to a pass's worth more), never a false refusal, inside the pass's cost room
  (its 50 GB carries ≈356 GB a year at 1.2x).
- **Q3 A test subscription on an old price** (one exists: a Pro profile on the retired 500 GB monthly price, TEST).
  After the env swap its price maps to no plan, so its renewals and updates leave the profile untouched (500 GB; its
  uploads take the smallest Ladder A size holding it, 500 GB a month), a deletion still drops it to Free, and the plan
  sheet's change refuses it (`foreign_price`). Recommended: the Orchestrator cancels it in Stripe TEST once the new
  prices exist (the webhook drops the profile to Free whatever its price), and Will's checkout walk subscribes on a
  Ladder A price; the change-plan portal configuration takes the six new prices beside the six old until the next
  milestone, then drops the old.
- **Q4 The one-way doors** (nothing crosses before launch; nothing is sold): at launch every number here closes:
  each price, each storage size, each uploads allowance (published now), the pass's year and its $19 renewal once
  sold, Free's 100 MB and 180-day rest, the yearly x10, "no guest limit" and "unlimited events". Built as decided.
- **Q5 The meter's wire names stay** (`at_monthly_cap`, the meter's `'monthly'` reason): they now mean the uploads
  allowance whatever its window, a pass's year included. Milestone 35 reads them by name, so renaming them now would
  move its refusals from the presign to the complete; a ROADMAP line renames them after the next milestone. The two
  presign refusals lose "for the month" (a pass's window is its year).

## System-doc edits (in place, owned facts only)

- `docs/systems/billing-caps.md`: the mirror is `tier_limits()` and `upload_allowance()` under the parity test; the
  uploads allowance is each plan's own published number against `uploads_used()`; ★ its window (a calendar month for
  Free and Pro, a pass's own year counted on `event_passes.uploaded_bytes`, the lapsed pass refused at the completes);
  the allowance published and only the breakers fenced, the meter's wire names kept; four counters (a pass's
  `uploaded_bytes` beside the ledger's); the pass ledger's uploads; the Pro sheet's holds line (`holdsPhrase`).
- Owned docs moved in place too: `PRICING.md` (Ladder A with its Uploads column and uses, the fees, the worst month
  re-run, the archetypes, the breakeven, the catalog and its env keys) and `PRD.md`'s pricing lines.
- Proposed for the reads (not mine to edit):
  - `database-security.md:90`: "`tier_limits` and `monthly_ingress_cap` (INVOKER;" becomes "`tier_limits`,
    `upload_allowance` and `uploads_used` (INVOKER;".
  - `database-security.md:118`: "`storage_ledger` (the monthly ingress meter: its readers are" becomes
    "`storage_ledger` (Free's and Pro's monthly uploads meter; a pass's year counts on its own
    `event_passes.uploaded_bytes`: their readers are".
  - `database-security.md:180-184`: "The cap, ingress and event-slot checks" becomes "The cap, uploads and event-slot
    checks"; "so no deadlock is constructible;" becomes "so none of them can deadlock another (the one cycle outside
    them: a pass consumed for Pro credit takes `event_passes` before `profiles`, the Deferred F2 line);".
  - `marketing-content.md:105`: "(`tiers.ts`, which defines the ingress backstop)" becomes "(none today: the uploads
    allowance is published, and the fence reads the breakers' numbers from the SQL that enforces them)".

## Deferred (ROADMAP one-liners, bucket named)

- Now `[eng]`: consume passes for Pro credit through an RPC that takes the host's `profiles` row first (the Advisor's
  Q26 F2: `consumePassesForProCredit`, `src/lib/db/mutations/event-passes.ts:64`, writes `event_passes` then `profiles`
  while the completes take `profiles` then the pass's row; a cycle Postgres detects, one side retried, never corruption).
- Now `[eng]`: the presign's meter refuses a lapsed pass up front, as the completes do (F1's clause lives in the two
  writers, so until the nightly recompute a lapsed pass's upload is presigned and sent, then refused at the complete).
- Now `[eng]`, after the next milestone: rename the uploads meter's wire names to window-neutral ones (`at_monthly_cap`,
  the presign meter's `'monthly'` reason), which milestone 35 reads by name today.
- Now `[eng]`, after the next milestone ships Ladder A: archive the six retired Pro prices (100 GB, 500 GB, 2 TB) and
  the two old pass prices in Stripe TEST, drop `STRIPE_PRICE_PRO_100` to `_2TB_YR` from Vercel, and take the old six out
  of the change-plan portal configuration.
- ROADMAP edits proposed (Launch checkpoint): delete "Revisit the paid-ingress `INGRESS_CAP_MULTIPLIER`" (resolved: the
  multiplier is gone, each plan publishes its own allowance, the worst month re-run in PRICING.md); the meter's
  operator line becomes "The uploads meter's operator surface `[eng]`: nothing in `/admin` shows a host's uploads
  against her allowance (this month's ledger, or her live passes' `uploaded_bytes`) and nothing can lift it, while
  `PRICING.md`'s posture is that a false positive must never quietly block a paying host."

## Handoff (replaces the chat report)

- **Commits**, pushed to `lp/pricing-wiring`: `b6bcfe59d` (the single source, the env keys, the parity guards, the
  migration for the Advisor), `8ad147fef` (F1 folded, the migration final), `11812e45a` (every surface, the help and
  the blog, llms, press, the spec components, the docs), `f91e334d8` (sync: launch-prep at `f3708569e`, clean, no
  shared path). The head is in the chat line.
- **Gates on the synced tree at `f91e334d8`**, each on its own exit code (logs: `_scratch/pricing-wiring/gate/synced/`):
  typecheck 0, lint 0, test 0 (877 files, 10,585 tests), build 0, `lab:smoke --base http://localhost:3131` 0 (179
  checks, 0 failing). No board, so no `lab:demo`.
- **The migration's proof**, rolled back with nothing persisted (its foot): RED 0/11 on the live schema without the
  file, GREEN 11/11 with it: each allowance refused past its number at both writers and the presign's meter, a pass's
  year counted on the pass and opened at zero by a renewal, stacked passes, Free's month, and 7b, the lapsed pass (RED
  on the `b6bcfe59` writers). The parity test holds `tier_limits()` and `upload_allowance()` to tiers.ts. The Advisor's
  Q26: safe to apply as written.
- **Seen on the dev server** (`_scratch/pricing-wiring/captures/`, `report.txt`): `/pricing` at 375 and 1440, whose
  plans chapter is paper and whose matrix and FAQ are the room whatever the session's theme (the light and dark
  captures are byte-identical); the three Pro stops' labels, values, parties lines and prices; all 17 hover lines read
  off the open tooltip; the fair-use line and the basis note; the configurator recommending a pass at 10 GB with video.
  The plan sheet's Pro sizes (the Library's storage-list) at 375 and 1440, light and dark: Too small with its over-by
  line, Your plan, Switch, each holds line led by its use.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths, this file and 33 exceptions:
  - The renamed env keys (Q1): `src/lib/env.ts`, a read, because the brief's rename lands in its schema (the six Pro
    keys and `assertStripeEnv()`'s three, nothing else), and `.env.example`.
  - The presign refusals' words, window-neutral (Q5): `src/app/api/host/r2/presign-upload/route.ts` and
    `src/app/api/r2/presign-upload/route.ts`, one string each.
  - Tests that pinned the old ids, sizes or words, reshaped with their scars: `src/app/api/stripe/{change-plan,checkout,
    plan-facts,webhook}/route.test.ts`, `src/app/api/r2/presign-upload/route.test.ts`, `src/lib/stripe/{change-plan,
    entitlement,provision}.test.ts`, `src/lib/billing/{plan-ids,storage-guard}.test.ts`,
    `src/components/app/storage/{storage-list.test.tsx,storage-list-rules.test.ts}`, `src/lib/upload/server-pipeline.test.ts`;
    and the mirror's guards, `src/lib/constants/tier-limits-parity.test.ts` (the brief's parity test),
    `src/lib/db/migration-guards.test.ts` and `src/lib/upload/server-pipeline-meter-migration.test.ts` (latest-wins
    pins now naming `ladder_a`).
  - Comments that stated the old sizes as the mechanism, made size-free or rescaled, no code:
    `src/app/api/stripe/checkout/route.ts`, `src/components/app/storage/{goal-strip,refusal-face}.tsx`,
    `src/lib/billing/{passes,plan-facts,storage-guard}.ts`, `src/lib/lifecycle/sweeps/passes.ts`,
    `src/lib/stripe/entitlement.ts`, `src/components/marketing/pricing-jsonld.ts`,
    `src/components/marketing/sections/features/album/how-much-fits.tsx`.
  - The Library's specimens drawn on retired sizes: `src/app/(dev)/design/(shell)/library/compositions/{composition-demos,
    gallery-demos}.tsx` and the regenerated `src/app/(dev)/design/gallery/specimens.generated.json`.
- **The items:**
  - tiers.ts on Ladder A: ids `pro_50`, `pro_200`, `pro_1tb` and their `_yr`, each plan's `uploadsBytes` and `use`,
    `uploadAllowance`, `uploadsLabel`, the big-party unit (`BIG_PARTY`, `partiesHeld`); the multiplier gone.
  - `20261004100000_ladder_a.sql`, final: `tier_limits()` with `uploads_bytes`, `upload_allowance()`, `uploads_used()`,
    `event_passes.uploaded_bytes`, the six bodies restated with the allowance and the pass's count, F1,
    `monthly_ingress_cap()` dropped; an expand for milestone 35.
  - `/pricing`: cards that lead with the events each holds, Pro's stops named by use with the parties line, the pass's
    "One payment, no subscription" at $29 with its $19 renewal, the matrix's published rows with their hover lines
    (Deleted's rewritten), the fair-use line, the configurator's stops on the new sizes, the FAQ.
  - The plan sheet and the Pro size list: holds lines led by use (`holdsPhrase`), the pass's line.
  - Every marketed number from the single source: llms.txt, the press kit, the spec components (`PlanUploads`,
    `ProUploads`), ten help articles, four blog posts and both AUTHORING briefs, trash-in-storage's follow-ups; the
    content fence refined (the breakers' numbers read from their SQL, nothing exempt).
  - PRICING.md, billing-caps.md and the PRD, in place.
- **Assets requested from Will:** none.
- **Board ideas:** a Library specimen of the whole plan sheet for a Free host and a pass holder (only a Pro host's size
  list is drawn today, and the sheet needs a sign-in, which localhost cannot do, so its pass line and cards are seen
  nowhere before the alias).
- **Proposed changes, in this order:**
  1. Apply `supabase/migrations/20261004100000_ladder_a.sql` by protocol (the drift read against its header's eight
     hashes, the proof at its foot RED then GREEN, apply verbatim, `get_advisors`, regenerate `src/lib/db/types.ts`),
     before this build deploys.
  2. Stripe TEST, after `livemode` reads false: three products, "Partyreel Pro 50 GB", "Partyreel Pro 200 GB" and
     "Partyreel Pro 1 TB", each with two recurring USD prices: $9 a month and $90 a year; $29 a month and $290 a year;
     $99 a month and $990 a year. On the existing "Partyreel Event Pass" product, two one-time prices: $29 (the pass)
     and $19 (the renewal). The six Pro prices join the change-plan portal configuration (`bpc_1UIhooPtjqmVkBwkcLe9YgYN`)
     beside the six old ones until the next milestone.
  3. Vercel env before the deploy (`assertStripeEnv()` hard-asserts the three new monthly keys, so without them every
     Stripe route on the alias refuses): `STRIPE_PRICE_PRO_50`, `_200`, `_1TB`, `_50_YR`, `_200_YR` and `_1TB_YR`
     (non-sensitive public ids) in every environment, which Production does not read yet; `STRIPE_PRICE_EVENT_PASS` and
     `STRIPE_PRICE_EVENT_PASS_RENEWAL` take the $29 and $19 ids in Preview and Development only, Production
     (milestone 35) keeping its old ids until the next milestone ships this code. The same eight in `.env.local`.
  4. Cancel the one TEST subscription on the retired Pro 500 GB monthly price once the new prices exist (Q3); Will's
     checkout walk on the alias subscribes on a Ladder A price.
  5. ROADMAP: the four Deferred lines, the multiplier's line deleted and the meter's operator line refined (Deferred).
  6. The reads' four edits under System-doc edits.
- **Calls his to overrule:**
  - Q1 to Q5 as built: ids and env keys renamed; the pass's year from its purchase, counted on the pass; the old TEST
    subscription cancelled; the one-way doors; the meter's wire names kept until after the next milestone.
  - The uses: Free "A small gathering", the pass "One big event", Pro "A season of parties", "A planner's year", "A
    venue's year" (at 375 the first stop wraps to two lines, as its comment allows).
  - The big-party unit: 200 guests at about 2,000 photos and 100 clips of 30 s, so "a 200-guest wedding, twice over"
    and "room for about 5, 20 or 100 parties", rounded to fives past ten, its basis said once under the cards.
  - The fair-use line under the table, and the refusals' "for now" ("You've hit this plan's upload limit for now.",
    "This album has hit its upload limit for now.").
- **Look at first:**
  - The order: the migration, then Stripe and the env, then the deploy.
  - Between the apply and the next milestone, both deployments' webhooks provision a pass bought on the alias (one
    ledger row, the session's unique index) but each recompute writes its own constant, and partyreel.com's nightly
    sweep (milestone 35) re-derives every pass holder at 75 GB a pass: a $29 pass walked on the alias can read 75 GB the
    next day. Test accounts only, more room never less; the next milestone ends it.
  - `/pricing`'s matrix with its hover lines, and the pass card.
  - Not this lane's: a headless Chrome from a `lab:demo` run (pid 45014, port 9413, started 2026-10-03 12:44) is
    still running, orphaned to launchd.

## Where I am

- Handed off: the gate green on the synced tree at `f91e334d8`; the Handoff above is the whole report.
