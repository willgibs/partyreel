---
track: scratch-synthesis
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "613ad790"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/systems/
  - docs/PRD.md
  - docs/PRICING.md
  - docs/calls.md
  - usher/kit/
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/scratch-synthesis

**Goal.** Everything a future Orchestrator needs from the local scratch folder lives in the repo, the reusable tools in the kit, and what cannot be public in one private doc for Will to hand the cloud Orchestrator.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3131 is yours; 3000 is Will's desk.

**Will's ask (2026-10-06):** the program is moving to a cloud-seated Orchestrator, which sees only the repo. "Synthesize anything relevant from /_scratch into the repo. Anything that cannot make it into the public repo should be written into a single doc, which I can save locally and upload directly to the first cloud orchestrator chat." Agent memory was already folded in (CLAUDE.md's rule: memory holds nothing the repo lacks); `../partyreel-wt/_scratch/` (about 30 folders, mostly lanes' captures and logs) is the last place knowledge lives outside the repo.

1. **Survey every folder of `/Users/gibby/local/ai/partyreel-wt/_scratch/`** by its `.md`, `.json`, `.sh` and `.mjs` files (never read captures or logs whole). For each, decide: (a) knowledge a future agent needs and the repo lacks: synthesize it into its ONE home, per CLAUDE.md's "Keeping the docs healthy" (synthesized, never transcribed; no history; a decision's reason, never its story; a deferred task is one ROADMAP line); (b) a reusable tool: move it into `usher/kit/` with a line in the runbook's "The scripts" (the desk refresh, `desk/desk-refresh.sh`, at least; a red-team brief template distilled from `redteam-54/brief.md` and `redteam-56/brief.md`, with what is generic kept and the round's specifics as placeholders); (c) history or a lane's spent artifacts: leave it (the merge commits hold what shipped). Expect to place: the calls lab (`calls/calls-lab.md`, Will's review queue, as `docs/calls.md`, its form kept, its two stale lines fixed: AH3's "the app keeps no capture time" and S1's line about the bell's link, which crumbs-69 made untrue); the Drive design note's next versions (`drive-export/`, which the ROADMAP's Drive v2 lines cite by a scratch path: point them at the repo home); the desk plans' remaining desks (`desk/round-15-plan.md`, `desk-3-plan.md`: what is still ahead, as proposed lines for the Orchestrator's pickup, not edited by you); Will's inspiration notes (`inspiration/`) where a design brief would need them; the pricing and cost research's lasting facts and sources (`pricing-research/`, `pricing/`, `cost-atlas/`, `compute-model/report.md`) only where PRICING.md or a system doc lacks them.
2. **Every pointer into `_scratch/` from the repo** (`grep -rn "_scratch" docs usher CLAUDE.md`) is repointed to its repo home, or kept only where the scratch file is a lane's working area by design (the spawn prompt's `{scratch}`, a lane's own captures), said so where it stands.
3. **The private doc:** anything that must not go into a PUBLIC repo but a cloud Orchestrator needs goes into ONE file outside the repo, `/Users/gibby/local/ai/partyreel-wt/CLOUD-ORCHESTRATOR-PRIVATE.md`, written for that Orchestrator to read first. ★ NEVER a secret's value (an API key, a token, a password, a cookie, a session): a secret is named with where it lives (`.env.local` on Will's Mac, the Vercel env, Will's connectors), never copied. Expect it to be short: what is private but not secret (a person's details beyond the public account names, a local path's meaning, anything you judge should not be public), and the local-only facts a cloud session cannot reach (the desk at `localhost:3000` and its refresh, the test media folder, the agent transcripts' paths). If nothing qualifies in a category, say so in one line.
4. **Also place three lanes' leftovers:** guest-requests' proposed doc lines and its two Deferred lines (`git show 1cdbcaed5^2:docs/tracks/guest-requests.md`), and crumbs-84's proposed ROADMAP Help line (`git show 3bc74d23d^2:docs/tracks/crumbs-84.md`, "Proposed for the Orchestrator").

The repo is public: before committing, read every added line as a stranger would. Docs only (and the kit files you move); no production code. `docs/PROGRAM.md`, `docs/ROADMAP.md`, `docs/ASSETS.md`, `docs/STATUS.md` and `docs/tracks/` are the Orchestrator's: write the lines they need under your Handoff's proposed lines. The whole gate is light here: typecheck, lint and `pnpm test` (the docs and kit tests read these files), each on its own exit code. In your Handoff, list each scratch folder with its verdict (placed where, moved where, or left as history), and the private doc's path.

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
