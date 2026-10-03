---
track: pricing-research
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "4c25f9af"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/research/pricing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/PRICING.md
  - docs/PRD.md
  - src/lib/constants/tiers.ts
---

# lp/pricing-research

**Goal.** Context for Will's pricing decision, so it is made once: what the market charges for what Partyreel does, what a host compares us to, fresh ideas, and each ladder supported or knocked down, all redone with Deleted counted in storage (his decision today).

## The brief

**Will's words (2026-10-03):** "I'll revisit the pricing ladder later. Really want to put time into thinking about this one so we aren't flip-flopping later on. If you can think of any more ideas, feel free to. If you'd like to add any more context to support or knock down an option. Please defer both questions. Will also review the 'what it costs' doc." The two questions he deferred: which ladder (A, B or C, in `../partyreel-wt/_scratch/cost-atlas/ladders.md`; A recommended, with the Advisor's 1 TB at $109), and the Event Pass renewal ($15 or $19).

**Settled since:**
- the pass counts its uploads over its year;
- Deleted counts in storage (`trash-in-storage` is building it), so a plan's worst month loses the bin's doubling and the re-delete guard is gone;
- published limits, never hidden ones;
- "no guest limit" and "unlimited events" kept.

**Research, every price read from the vendor's own page today and dated (read the raw page: a WebFetch summary once invented a price):**
1. **The market for event photo sharing:** QR guest-upload apps, wedding photo-sharing apps, disposable-camera apps and live photo walls. Find their prices, how they charge (per event, a subscription, by guests, by storage, by retention), their limits and what they leave out. At least eight, named, with links.
2. **What a host compares us to:**
   - consumer cloud storage (Google One, iCloud+, Dropbox) per GB;
   - photographers' client galleries (Pixieset, Pic-Time, ShootProof, SmugMug) and their storage tiers.
   Say plainly where pricing by storage invites a per-GB comparison we lose, and how a plan's name and table can sell the event instead.
3. **Each ladder (A, B, C) supported and knocked down,** against the market and against Will's brief: a first tier that holds one big event or several small; each step a host's next natural use; no paying host costing more than she pays. Recompute every worst month and margin with Deleted inside the cap (PRICING.md's method; `../partyreel-wt/_scratch/cost-atlas/model.mjs` and `ladders.mjs` may be copied into your scratch and changed there).
4. **New ideas worth his time,** each with its case and its risk: a per-event price beside the subscription, retention as the paid axis (keep forever), video as the premium, storage add-ons, annual-only Pro, a first-event discount, and what a host who exports and cancels does to each.
5. **The renewal at $15 or $19,** with the market's own renewal and archive prices.

Write it for Will in `../partyreel-wt/_scratch/pricing-research/`: a summary under 800 words, plain, to read in one sitting, then the detail and the sources. Read-only: no code, no service, no Stripe, no repo doc but your own manifest (your `owns` is a claim you never write to: everything goes to your scratch). Your chat report stays one line.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** `pnpm test` green on your tree (the manifest policies read your file); every price with its URL and the date read; every recomputed number reproducible from your scratch scripts; the summary and the detail named in your Handoff.

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
