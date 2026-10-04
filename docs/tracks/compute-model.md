---
track: compute-model
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "623332fc"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - scripts/compute-model/
  - docs/systems/architecture.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - usher/kit/vercel-usage.mjs
  - src/proxy.ts
  - src/lib/shared/use-live-poll.ts
---

# lp/compute-model

**Goal.** Measure what Partyreel costs Vercel per user action, project it onto real events, and turn it into a standing budget so a scaling regression fails loudly; then recommend the architecture changes, each with its cost and savings.

## The brief

**Why (Will, 2026-10-04):** with zero real users we used 3h 56m of Hobby's 4 Active CPU-hours (a rolling 30 days; past it Vercel pauses every function, and it unlocked his account once already). It was our own red-teams, desk checks on the alias and a few album tabs left open, about 320,000 function calls at about 44 ms of CPU each. His words: we don't scale by one user, we scale by one event, so the first host may bring 100 wedding guests, the first 100 hosts 10,000+ guests on one Super Bowl Sunday. They bring bulk downloads, hundreds of tabs open for hours or days, concurrent uploads, refreshes, and clicking in and out of albums. He wants it fixed at the foundation, never answered with "Pro would cover it". Cost is designed like the architecture (`feedback`: every upload, view and download multiplies at scale; name each option's cost; prize the win-win).

**★ Nothing of yours touches Vercel.** Every request goes to a local production build: `zsh scripts/build-lock.sh pnpm build`, then `pnpm start -p <your port>`. Refuse any non-localhost target in your scripts. The alias and partyreel.com are off limits; `usher/kit/vercel-usage.mjs` reads the team's load if you need it.

**What to build** (in `scripts/compute-model/`):
1. **A measuring server.** Next's custom server around the production build, or an equivalent, that records for every request its route, its status, the CPU it spent (`process.cpuUsage()` across the handler, the proxy included) and whether it was a function call on Vercel (a page render, an API route, a Server Function, the proxy; a static file or an ISR hit served by the CDN is not). The proxy runs on every matched request: count it as its own call, as Vercel does.
2. **Scenarios, scripted** (a headless Chrome of your own against your port, reduced to what the real client does):
   - a guest's hour with the album open and visible, with the doorbell live and with it down (`use-live-poll.ts`: 60 s and 12 s);
   - a guest joining and uploading 10 photos;
   - a host's dashboard session: in and out of five events, the Display menu, the hub;
   - opening 20 photos in the viewer;
   - a bulk download's Vercel side (the export Worker is Cloudflare's);
   - a crawler reading 50 marketing pages;
   - one `lab:demo` of a board.

   Sign-in works locally on port 3000 (Supabase allows `http://localhost:3000/**`; build with `NEXT_PUBLIC_SITE_URL=http://localhost:3000`; R2's CORS now lists localhost 3000 and 3131 to 3139). If a signed-in scenario can't be driven, measure the route directly with a test account's session the way `docs/systems/testing-verification.md` says, and say which.
3. **The table:** for each scenario, the function calls and CPU-ms. Then the projections at 44 ms a call on Vercel (calibrate your local CPU against it and say the ratio):
   - a 100-guest wedding over 4 hours;
   - 100 hosts with 10,000 guests on one Sunday;
   - a month at 100 events.

   Set each against Hobby's 4 CPU-hours and Pro's price (read Vercel's current pricing page; never guess).
4. **A standing budget:** `scripts/compute-model/budget.json` (calls and CPU per scenario) and `pnpm compute:model`, which fails when a scenario exceeds its budget. Not in the gate (it builds), run at milestones; write its line in `usher/kit/README.md`'s Milestone section as a proposal in your Handoff (the kit is the Orchestrator's).

**What to recommend** (Questions, each with its cost to build and its savings, measured where you can):
- the proxy run only where a session matters (today `updateSession` runs `getUser()` on every page, prefetch, poll and bot hit);
- polls that rest (idle back-off, the doorbell first, stop after a long idle);
- the album's sync answered from a per-event CDN-cached version, so a change costs one call, not one per guest;
- batched upload presign and complete;
- marketing and the lab served static;
- the hottest guest endpoints on a Cloudflare Worker (its free and paid tiers named).

Build none of these; a one-way door or a design call is a question. `docs/systems/architecture.md` takes a short "Compute budget" section: the rule, the table's headline and where the model lives.

The report goes to `../partyreel-wt/_scratch/compute-model/report.md`. It is the Advisor's to read, then Will's.

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
