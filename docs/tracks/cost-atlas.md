---
track: cost-atlas
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

## Where I am

- Booted on `lp/cost-atlas` at `afcd2875`. Scratch: `../partyreel-wt/_scratch/cost-atlas/` (`vendors/` holds every
  vendor page read raw on 2026-10-03, with `fetch.sh`). The code facts are gathered (uploads, the live album, the
  dashboards, the reel and the screen, zips, the backup, jobs, email, every limiter and every published promise).
- Will's relay (17:25Z) taken in: a limit a host could meet is a published, gracious row with a hover explainer;
  PRICING.md's "unmarketed" ingress line gets refined in place.
- Next: prices out of the raw pages, the model (`model.mjs` in scratch), then PRICING.md, the ladders, the summary.

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
