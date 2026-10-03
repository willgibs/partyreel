---
track: cost-atlas
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "4c23717e"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/PRICING.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/PRD.md
  - docs/systems/billing-caps.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/durability-backups.md
  - docs/systems/admin-observability.md
  - docs/systems/guest-flow.md
  - src/lib/constants/tiers.ts
---

# lp/cost-atlas

**Goal.** Will's pricing rethink, grounded: a cost atlas that names every way a host can make us spend and proves the invariant (no plan's worst-case month above its price), the archetypes from the cheapest Free event to the 2,000-guest wedding, the breakeven and the light-per-heavy math, each vendor's guard posture, and two or three complete ladders (Free, the Event Pass, the Pro steps, their prices) with one recommended, for Will to pick.

## The brief

**Will's words (2026-10-03), in full:** "Thanks for looking into our costs. If I'm being honest, our current pricing was sloppily thrown together with not a ton of thought behind it. Mostly wanted to see where we landed as a product across features and everything before getting closer to finalizing. However, looking at it now, it feels like our first tier starts too generous where most hosts will never need to upgrade (100GB is a ton, and they can export off to cheaper cloud storage easily to reset), then each tier going up tries to justify itself even more while killing our margins. I think we need to rethink what each tier should be entirely, both in terms of storage (what storage tiers actually justify each step along the way, starting with a first tier that could support at least one big event or multiple small for a good initial experience, then expecting hosts who enjoyed it to begin creating more and more [or bigger] events to buy into more tiers along the way) and the pricing to match it. I haven't checked out your cost report yet, but I'd like to get a very clear idea of every way we could stack expenses across our app. Uploads, downloads, page refreshes, keeping a page open indefinitely, event-heavy dashboards, huge media dashboards, endless reels, deleting & reuploading full capacity repeatedly, storage fees, email costs, hosting bills, functions, etc. We should have a clear idea what an expensive user could cost, what a cheap user costs, what a massive guest-heavy or video-heavy or any-edge-case-heavy-thing could cost to anticipate and mitigate spikes ahead of time. We'll be able to address lots of this as we grow - can check usage near daily as users grow to see what could run away from us, but I'd like us to come in with as strong of a system as possible. Ideally, no pro user can ever exceed our costs to support them, but worst case we should do the math on how many light pro users are needed to cover heavy users. ... For the 2TB costing more than it earns, that should be addressed in our total rethink of pricing. ... This is very important to get right, and elegant mental models tend to be the cleanest rather than trying to get too complex across everything. "It's not a bug, it's a feature!""

He also said yes to calming the live album (`album-calm` is building it: model its after-state as the baseline), wants Supabase on alerts with a ceiling at launch and a hard stop before it (`spend-watch` builds our guards: you record each vendor's posture), and is open to more levers that improve the experience and cut our cost together.

**The model to start from:** the Advisor's Q15, `../partyreel-wt/_scratch/pricing/q15-advisor.md`: three rules (one marketed axis, storage; the invariant; guards as circuit breakers), the four places the invariant breaks today, the vectors the atlas lacks, the archetypes, the ladder's principles and ten corrections. Verify every number in it against the code and the vendors' own pages; never transcribe it.

**Deliverables:**
1. **`PRICING.md`'s "What it costs us", rewritten in place** (its one home; facts only, dated):
   - the three rules;
   - the atlas: every vector with its unit price, its class (cap-priced bytes-months, a tiny per-request constant, or an unmarketed ceiling), what bounds it today (file:line) or that nothing does, its worst case per host-month, and its mitigation. At least Will's list: uploads, downloads and zips, page refreshes, a page open indefinitely, a wall screen, event-heavy dashboards, huge media albums, endless reels, delete-and-re-upload at full cap, storage and its backup, email, MAU, hosting, functions and the proxy, Realtime connections and messages, Stripe's fee, the fixed costs. Plus the Advisor's;
   - the archetypes, each costed: cheap, typical, expensive, guest-heavy, video-heavy, churn, always-open, the 2,000-guest wedding, and a photographer or venue at the top tier;
   - the breakeven (paying hosts needed to cover the fixed costs) and the light-per-heavy math, today and after each lever;
   - each vendor's guard posture before launch and at launch;
   - the ten corrections made.
   The Tiers table stays as it is until Will picks.
2. **The ladders**, in your scratch (`../partyreel-wt/_scratch/cost-atlas/ladders.md`), never in a repo doc: two or three complete ladders, each with:
   - its plans: caps, prices monthly and yearly, and the Event Pass's size, price and renewal;
   - each step's ingress multiplier;
   - its margin at the worst case and at typical use;
   - who each step is for, in one line (a host's next natural use);
   - what Free is.
   Mark one recommended, with why. Name the one-way doors: every marketed number only moves up, and "no guest limit" and "unlimited events" are published. Draft the fair-use line the pricing page's fine print needs.
3. **The win-win levers**, ranked: changes that improve the experience and cut our cost together, beyond album-calm, each with its saving, its effort and what a guest or host notices.
4. **Will's one page**, `../partyreel-wt/_scratch/cost-atlas/summary.md`: plain words, under 600 words, for chat: the model in three lines, the cheapest and dearest hosts, where we lose money today and the fix, the recommended ladder, and his decisions.

**Rules.** Read-only: no code, no service change, no Stripe. Every vendor price is read from the vendor's own page today and dated: a WebFetch summary invented a price once, so read the raw page. Every count comes from the code at file:line, and every ≈ is marked as ours to change. Verify on the vendors' docs, never from memory:
- Supabase Auth's email rate-limit setting;
- whether Supabase's Management API exposes usage;
- Vercel Pro's Spend Management actions;
- Cloudflare's billing notifications.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** `pnpm typecheck`, `pnpm lint` and `pnpm test` green on the synced tree (a doc lane still runs them: the record-depth and doc policies read PRICING.md); every price with its URL and date; every count with its file:line; the ladders and the summary in your scratch, named in your Handoff.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The ladder** (`../partyreel-wt/_scratch/cost-atlas/ladders.md`): A, B or C? Recommended **A**: Free 100 MB; the
  Event Pass $29 once, 25 GB, 50 GB of uploads over its year, renewed for $15; Pro 50 GB $9 or $90 a year with 100 GB of
  uploads a month; Pro 200 GB $29 or $290 with 200 GB; Pro 1 TB $99 or $990 with 500 GB. Every plan covers its own
  worst month at its published limits (1.02x to 1.86x net of Stripe), typical margins run 84 to 91%, and each step is a
  host's next natural use. Its cost: Pro's first step halves at $9, the pass shrinks from 75 to 25 GB and rises to $29,
  the 2 TB plan goes. A one-way door at launch.
- **The pass's uploads counted over its year, not a month** (A: 50 GB)? Recommended: more room in the event's own month,
  less where nobody needs it, and the only way a one-time price carries a year; the meter reads the trailing year.
- **Deleted stays "up to your plan's size, for 30 days"**, published as a row, and a re-delete within 30 days keeps its
  first date (an unpublished breaker)? Recommended. Counting Deleted inside the plan instead cuts a fifth of the worst
  month, but a delete would no longer free room at once.
- **"No guest limit" and "unlimited events" kept?** Recommended: a confirmed guest is ≈$0.004 at scale and an event
  costs nothing until it holds media; unpublished breakers (≈100 events a day an account, an account's uploads an hour)
  stop scripts, never hosts.
- **The launch guard postures** (PRICING.md, "Each vendor's guard"; `spend-watch` builds ours): Supabase's cap off with
  `spend-watch` at 10x the trailing peak; Auth's email limit at ≈2,000 an hour (10x the trailing peak hour, never under
  the largest door expected); Vercel Pro with Spend Management at ≈10x the trailing month's on-demand, its webhook to
  `spend-watch` and the pause on as the ceiling; Cloudflare budget alerts at $25, $100 and $500; Resend Pro with overage
  on; Sentry Team with on-demand off. Recommended; each is the Orchestrator's or Will's to set.
- **The levers' order:** the preconditions first (the prune's cursor and caps with `PRUNE_MODE=live`, presigned bytes
  counted, a preview never heavier than its original, the re-delete's first date, the upload and event breakers); then
  the guest count once a beat and the proxy off the API routes (small, and both faster for guests); then one ping a
  beat, a lean presigner, attribution in the sync, the dashboard and storage list paged, the resting screen; the
  Durable Object push and the media domain at the DNS move; originals-only backup after a remake job; an Auth-less
  confirm near 70,000 MAU. Recommended.

## System-doc edits (in place, owned facts only)

- None: this lane owns `docs/PRICING.md` alone. The wiring of the picked ladder refines, together with the table's row:
  `docs/systems/billing-caps.md:27-28` ("never marketed"), `docs/PRD.md:64` ("unmarketed") and the fence at
  `src/lib/content-policy.test.ts:164`.

## Deferred (ROADMAP one-liners, bucket named)

- Billing follow-ons: the ladder Will picks, wired (`tiers.ts` and `tier_limits()`, the Stripe prices, the pricing
  table's Uploads and Deleted rows with their hover lines, the fair-use line, the ingress fence and "unmarketed" lines).
- Launch checkpoint: Supabase Auth's email limit at ≈2,000 an hour; Vercel Spend Management at ≈10x the trailing month
  with the pause on; Cloudflare budget alerts at $25, $100, $500; Resend Pro with overage on.
- Durability: the prune's cursor and caps sized to the deletions before `PRUNE_MODE=live` (rule 2's precondition); the
  orphan sweep's and the reconcile's cursors; the `db/` dumps pruned past 35 days.
- Uploads: a presign's declared bytes counted against the month's uploads; a preview never heavier than its original;
  an account's uploads-an-hour breaker.
- Live album: the guest count once a beat (a counter beside `album_state`'s version, or a cache keyed by it);
  attribution in the sync; one ping a beat in the doorbell trigger, then one push per album (a Durable Object).
- Platform: the proxy off the API routes and one `getUser()` a request (auth-adjacent review); a lean SigV4 presigner.
- Dashboard: the dashboard, the bell and the storage list paged; the hub's Reel card from the take's head; an
  events-a-day breaker.
- Lifecycle: a re-delete within 30 days keeps its first date.
- Guest door: the join limiter's 400 a quarter-hour per address and event can refuse a big event's arrival on one
  venue Wi-Fi.

## Handoff (replaces the chat report)

- Work commits `cf62d5c3` (PRICING.md rewritten) and `16ee5f58` (Realtime's two ceilings), on `afcd2875`. No sync:
  launch-prep moved (crumbs-57, crumbs-58, records) but touched no read and no owned path
  (`git diff --name-only afcd2875 origin/launch-prep` names none). The head is in the chat line.
- Gates on `16ee5f58`, each on its own exit code: `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 0 (849 files, 10,065
  tests); logs `../partyreel-wt/_scratch/cost-atlas/{typecheck,lint,test}.log`. After this manifest,
  `track-manifests.test.ts` and `docs.test.ts` again: 0.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/PRICING.md`, `docs/tracks/cost-atlas.md`.
- PRICING.md "What it costs us", rewritten in place: the three rules (class (c) now Will's published limit, or a breaker
  no real host meets); every price read raw on 2026-10-03 (the pages and `fetch.sh` in `_scratch/cost-atlas/vendors/`,
  the digest `prices.md`); the atlas, each vector with its price, class, bound at file:line, worst and what bounds it
  better; the worst month per GB of cap and every plan's against its price; the archetypes from a Free event to the
  2,000-guest wedding and a venue; the breakeven (14 typical Pro hosts on ≈$98 fixed) and light-per-heavy lever by
  lever (12.4 typical hosts per heavy one as built, 1.1 after the levers at $9); each vendor's guard before and at
  launch; the levers (preconditions, then the win-wins ranked, each with saving, effort and what a guest or host feels);
  what breaks first. Refined beside it: the Model's ingress line (published, Will's relay), the annual line's pointer,
  the renewal line (a full 75 GB pass ≈$32 a year against $15) and the email limit line (verified).
- The ten corrections: (1) re-uploading in the worst month; (2) Stripe on every price, margins net of it; (3) Supabase
  has no budget alert, so ours (the guard table); (4) fixed costs and the breakeven; (5) the 2,000-guest wedding as its
  own row, the push its fix; (6) events per account and the always-open screen as vectors; (7) every vendor's posture,
  Hobby non-commercial; (8) the published promises beside the Terms' clause; (9) originals-only backup still gated on a
  remake job, the prune's cursor moved up as the precondition; (10) Auth's email limit verified (project-wide, an hour)
  as the code emails' bound.
- Verified on the vendors' docs: Auth's email limit (`rate_limit_email_sent`, per project an hour); the Management API
  reads request counts and Prometheus metrics, never billable usage or the cap; Vercel Pro's Spend Management (a
  budget, notices at 50, 75 and 100%, a webhook, pause every project); Cloudflare's budget alerts (informational) and
  usage notifications (Pro zones), no cap.
- Beyond the Advisor's model: the guest count walks every guest upload on every sync and page load (the wedding's
  biggest live cost); attribution's re-mint storm; uploads never completed are unmetered yet backed up; a preview's
  2 MB at no ratio to its original; restore-and-re-delete holds Deleted full; the orphan sweep and the reconcile never
  pass their first-page caps; `db/` dumps are never pruned; a signed-in album request asks Auth three times; the join
  limiter at a venue's Wi-Fi.
- The ladders: `../partyreel-wt/_scratch/cost-atlas/ladders.md` (A recommended), each with its plans, multipliers,
  margins at the worst and typical, who each step is for, Free, the published limits row by row with hover lines, the
  promises kept, the one-way doors and the fair-use line. The model: `model.mjs`, `atlas.mjs`, `ladders.mjs` and their
  outputs, beside it.
- Will's one page: the harness refused the scratch file `summary.md` (a subagent may not write report files), so its
  text travels in this lane's handback report to the Orchestrator.
- Assets requested from Will: none.
- Board ideas: the pricing table with its Uploads and Deleted rows and their hover lines (the picked ladder's wiring).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none in code; the launch vendor settings are Question
  five's.
- Calls his to overrule: the worst month counts Deleted full and the month's whole allowance at once (the rules' worst,
  not a real host's); the live album rests on ≈20 tabs at the reference party and ≈200 at the wedding (75% visible) and
  the guest walk counted gzipped (28 B a row; raw doubles the wedding's live cost to $65); per-guest costs are priced at
  scale (past 100,000 MAU and Resend Pro's 50,000), $0 below; "a month at scale" gave way to the archetypes and the
  breakeven; the levers are renumbered (`orchestrator.md:109`'s "lever 2a" is now win-win 10, and `album-calm`'s
  before and after lands in win-win 1; on a conflict, keep this section and put its numbers in that line); the fixed
  costs assume Sentry Team and Resend Pro at launch.
- Look at first: PRICING.md "The worst month" and "Each vendor's guard"; `ladders.md`, Ladder A.
