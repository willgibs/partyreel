---
track: compute-model
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Each lever's saving is a what-if on run1's measured ledger (`model.mjs` `LEVERS`; the heavy wedding is 84,588 calls
and 1.39 CPU-hours calibrated today, the month at 100 events 5.8M calls). None is built (the brief).

- **Q1 The proxy only where a session matters.** Recommended: build first. The matcher keeps the pages that render a
  session (`/dashboard`, `/account`, `/me`, `/welcome`, `/login`, `/auth`, `/e`, `/u`, `/report`, `/admin`, `/design`
  for its key) plus a `has: host` entry taking every path on the admin host (the surface rule must still see them
  all); API routes (they refresh their own session: `setAll` works in a route handler), prefetches and static paths
  (marketing, `/manifest.webmanifest`) go; `prefetch={false}` on the guest page's footer links (6 to 14 proxy runs a
  load). Saves 52% of a heavy wedding's calls and 54% of the month's, little CPU (≈1 ms a run without a session).
  Small, auth-adjacent: red-team a refresh across an expired token and the admin host's 404s.
- **Q2 Polls that rest.** Recommended: the 60 s safety net to 5 min after 10 lit minutes and none after 2 h without a
  touch (the doorbell still rings); the 12 s fallback to 60 s while nothing changes. A tab lit 8 h goes from 480 polls
  to 32; −31% of the heavy wedding's calls. Small (`use-live-poll.ts`). Will's call: how stale a screen on a wifi that
  refuses websockets may grow while nothing changes.
- **Q3 The album's version from the CDN.** Recommended: yes, after Q1 (its path must be off the proxy, which runs
  before the cache): a per-event version on a GET with a few seconds of `s-maxage`, the POST sync only when it moved.
  −46% of the heavy wedding's calls; tabs left open for days cost nothing. Medium.
- **Q3b And a burst's change shared per event.** Today every lit album pays its own sync for every burst (≈20 calls a
  burst heard, half of a wedding's calls); a delta cached per event and version is one origin call per event per tick.
  −40% of the month's calls and −42% of its CPU, the largest CPU lever. ★ Will's call (privacy): a cached answer
  reaches anyone holding its URL, so recommended only for an open album's full access, never a password album or a
  blocked viewer (those keep today's per-viewer POST).
- **Q4 Batched presign and complete.** Recommended: yes: one presign and one complete a burst, the complete carrying
  the new rows' links so the uploader's album syncs once: 92 calls a burst to ≈16; −13% of the month's calls, −11% of
  its CPU. Medium (the upload queue's pinned tests).
- **Q5 Marketing and the lab served static.** Recommended: marketing is already prerendered and costs only its proxy
  runs, which Q1 ends; the lab stays dynamic (a `lab:demo` is 9.2 calls and ≈110 ms local a step), its checks stay
  local under the kit's Vercel guard, and a static lab waits until Will's desk views on the alias prove frequent.
- **Q6 The guest API on a Cloudflare Worker.** Recommended: not now. It takes the month to 716,000 Vercel calls for
  ≈$10.65 of Workers Paid ($5 with 10M requests and 30M CPU-ms), but costs weeks and re-homes the capability and RLS
  checks in a second runtime (a one-way door); after Q1 to Q4 the guest API is a small share. Revisit near 1,000
  events a month.
- **Q7 The guest page's render, the next CPU lever.** It is the dearest call (418 ms local in run1, 160 to 330 warm:
  a 463 KB document carrying 257 presigned links for 1,000 photos) and over half of what a wedding spends after the
  levers. Recommended: a lighter first paint (fewer server-drawn tiles and links, the rest by the manifest), PRICING.md
  lever 5's hand-rolled SigV4 (the SDK's presigning is ≈13% of the render's main thread in a warm profile), and Node 24
  on Vercel (AsyncLocalStorage's promise hooks are ≈8%; a project setting, the Orchestrator's).
- **Q8 PRICING.md's atlas prices a call at ≈3 ms of CPU.** Measured: a quiet poll 18 ms local, the guest page 418,
  and Vercel averaged 44 ms a call. Recommended: re-price its Vercel lines from `model.mjs`'s units (PRICING.md is not
  this lane's).
- **Q9 The standing budget's line in `usher/kit/README.md` (Milestone).** Proposed: "`pnpm compute:model --port <yours>`
  (about 20 minutes with its build): exit 1 is a scenario past `scripts/compute-model/budget.json`; lower a line when a
  lever lands." The kit is the Orchestrator's.

## System-doc edits (in place, owned facts only)

- `docs/systems/architecture.md`: a "Compute budget" section (what counts as a call, the rule and `pnpm compute:model`,
  the headline), and its open-when line for a poll, prefetch, client fetch or matcher change.

## Deferred (ROADMAP one-liners, bucket named)

- Now: the host's dashboard session in `pnpm compute:model` (`--host-cookie-env NAME`, the session cookie from the
  environment, copied fresh): measured once on the Orchestrator's desk; until then `model.mjs` prices a session as
  five guest-page loads (host sessions are 0.4% of a wedding's calls).

## Handoff (replaces the chat report)

- **Commits:** the work `56e8832da` and this manifest's handoff commit, pushed to `lp/compute-model` (the head is in
  the chat line). launch-prep moved to `cf1e060fe` (limits-watch, crumbs-65, records), touching none of this lane's
  paths or reads: no sync.
- **Gates on `56e8832da`** (`../partyreel-wt/_scratch/compute-model/gate2.log`, each on its own exit code): typecheck 0, lint 0, test 0 (900 files,
  10,979 tests), build 0.
  `lab:smoke` not run: no `src/` change.
- **The standing budget, end to end:** `pnpm compute:model --port 3131` built through the lock, measured every scenario
  and exited 0 within `budget.json` (`../partyreel-wt/_scratch/compute-model/run2.log`); a tightened budget exits 1
  ("crawler-50 OVER: calls 50 > 10", `budget-fail.log`). `budget.json` is written from run1
  (`run1/results.json`, `run1/requests.jsonl`: every request of the run).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): `docs/systems/architecture.md`, `package.json`,
  `scripts/compute-model/{budget.json,chrome.mjs,model.mjs,run.mjs,server.mjs}`, this file. Exception: `package.json`,
  the one `compute:model` script line the brief names.
- **Items:**
  - `scripts/compute-model/server.mjs`: the measuring server (Next's custom server, one request at a time; the proxy
    timed in `runMiddleware`; `after()` awaited through `@next/request-context`; CDN or function from the build's
    manifests; binds 127.0.0.1, refuses port 3000).
  - `chrome.mjs`: devices (fresh browser contexts) that block Vercel's and Partyreel's hosts; the clock shim.
  - `run.mjs`: the eight scenarios (the host's when given a cookie), the unit cuts, the budget check and writer,
    `--reproject`.
  - `model.mjs`: the prices (vercel.com/pricing and its docs, read 2026-10-04), the assumptions, the projections and
    the levers as what-ifs.
  - `budget.json`; `package.json`'s `compute:model`; `architecture.md`'s "Compute budget".
  - Test data: the event "Compute model (test)" (`2f31c708-164a-4564-be10-d144995c8a68`, willg97's, name-only, live),
    1,000 photos seeded by `scripts/seed-demo-event.mjs`; the runs left 47 guest rows and 35 more photos. Kept: the
    budget's runs need it (a re-seed resets its media).
- **The report:** this agent's harness refuses a report file, so the report is the text of the handback message (for
  `../partyreel-wt/_scratch/compute-model/report.md`, the Advisor's, then Will's).
- Assets requested from Will: none.
- Board ideas: none (the levers are Questions).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (Q7's Node 24 is a later Vercel setting).
- **Calls his to overrule:** the assumptions (`model.mjs` `ASSUMPTIONS`: a phone lit 30 minutes, two screens all
  event, three re-opens and six tab returns a guest, one in five downloading; heavy adds a fifth lit 8 hours and two
  screens on refusing wifi); the two prices (44 ms a call, and calibrated ×3.9); the standing test event; the CPU
  headroom (×2, scenarios under 10 calls held to their calls alone); the lab demo held per step on the desk's first
  open board; the host priced as five guest-page loads until measured.
- **Look at first:** Q1 and Q3b (half of every call count, and half of a wedding's calls), then `model.mjs`
  `ASSUMPTIONS`.
