---
track: kit-streamline
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "5b17e8f3"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - usher/kit/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/PROGRAM.md
  - scripts/build-lock.sh
---

# lp/kit-streamline

**Goal.** The Orchestrator's kit does each check once: an integration gates only what the lane never gated, the lab steps run only when the lab could change, and nothing runs by habit.

## The brief

**The ask.** Will wants every needless bottleneck in the agent workflow cut: do a thing once instead of several times, drop a step that adds nothing, and move work to where it is cheapest. No measure that protects the product goes; faster passes mean more iterations.

**What the kit does twice today** (confirm each in the scripts before changing it):
1. **The gate runs twice per lane.** A lane gates its own work before its handoff, then `integrate.sh` merges and `gate-lane.sh` runs the full gate again on nearly the same tree. The second gate earns its cost only for what the lane never gated: the difference between the merged tree and the lane's head (`git diff --name-only <lane-head> <merge>`).
   - If that difference is docs only (`docs/`, markdown, `usher/`), run a light gate: `pnpm test`.
   - If it touches code, run the full gate.
   - PROGRAM.md "Sync" (launch-prep at 50ab2e52) now says lanes skip syncs that would only bring records, so this difference is often just the Orchestrator's record commits.
2. **Lab steps run for lanes that change nothing the lab renders.** Run `lab:smoke` and `lab:demo` only when the merge touches UI code or the lab, never for a docs-only lane.
3. **`merge-lane.sh` typechecks before the merge commit, and the gate's `next build` typechecks again.** Keep one of the two, if one covers the other.
4. **`negative.sh` runs at every cut.** It is meant for kit changes and a day's first integration; the runbook should say so and nothing should run it by habit.
5. **`record.py`'s cap check counts the trailing newline**, so it reports STATUS "81 of 80 (OVER)" when `wc -l` and `record-depth-policy.test.ts` both say 80: make the two agree.
6. **Anything else that repeats without adding protection.** Look for it and cut it, or list it with why it stays.

**Keep.**
- Every refusal (the counting rule; `negative.sh` proves each still fires).
- The build lock (`scripts/build-lock.sh`).
- `set -e` step discipline, where each result is read from its own exit code.

Test the new branching against both cases, a docs-only merge and a code merge, using the kit's fixtures or a scratch repo.

**Hand off with:** each duplication found, whether it was cut and why, the time an integration saves on each path (docs-only and code, measured), and the runbook lines changed.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** `zsh usher/kit/negative.sh` green; a docs-only merge and a code merge each take their branch (logs); `pnpm test` green.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Take the build's own TypeScript pass out of the kit's gate?** `pnpm typecheck` covers it: the same tsconfig program
  plus the test files whose errors `next build` drops (`node_modules/next/dist/lib/typescript/runTypeCheck.js`,
  `regexIgnoredFile`), and merge-lane.sh now runs it for exactly the merges that take the full gate, 4 to 7 s warm.
  The build's pass took 18.7 to 28.4 s of each 46 to 74 s build (the `build: Finished TypeScript in` lines in
  `$S/kit-streamline/fx/s-new-*/gate1.log` and `logs/final-build.log`), and its only switch is
  `typescript.ignoreBuildErrors` in `next.config.ts`, outside this lane. Recommended: yes, as
  `ignoreBuildErrors: process.env.GATE_TYPECHECKED === "1"`, which gate-lane.sh sets only when merge-lane.sh's green
  typecheck stamped HEAD's tree (`$S/typechecked-<tree sha>`), so Vercel's and every lane's build keep the check;
  about 20 s off each code integration.

## System-doc edits (in place, owned facts only)

- none: the kit's facts live in its runbook, `usher/kit/README.md`, inside this lane

## Deferred (ROADMAP one-liners, bucket named)

- Now, "The lab and the kit": the gate's lab steps run on a dev server that compiles again what the gate's build just
  compiled (lab:smoke 66 s, lab:demo 86 s on one board); `next start` over that build, which lab-smoke.mjs's own header
  prescribes before a merge, drops the cold compiles and the demo's warm retry, once a local production server stops
  reporting to Sentry as production (`@sentry/nextjs` falls back to NODE_ENV without SENTRY_ENVIRONMENT).

## Handoff (replaces the chat report)

- Work: `e717cbd9` (the scoped gate), `f057ba3a` (seconds per step), `4eb08628` (your mid-lane ask: the spawn prompt's
  helper line), `a0f67e23` (the capture port), `657acd04` (FULL=1 forces the typecheck), `f96f68f5` (the gated sha
  checked), then this manifest. No sync: since this lane's base `75631277` launch-prep moved by records and a cut alone
  (`git diff --name-only 75631277 origin/launch-prep`: docs/STATUS.md, docs/tracks/orchestrator.md,
  docs/tracks/refresh-identity.md).
- Gates at `f96f68f5` (the head adds this manifest alone): typecheck 0, lint 0, test 0 (427 files, 4584 tests), build 0
  (`$S/kit-streamline/logs/final-*.log`); `zsh usher/kit/negative.sh` 0, 15 ok (`logs/negative-final.log`), and its
  two new checks read FAIL with scope.sh classing public/ as docs and record.py counting the old way (mutated, restored).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = 14 files under `usher/kit/` + this file; no exceptions.
- Measured in one scratch repo (a bare origin and a clone at this lane's kit, `$S/kit-streamline/fx/drive.sh`): the old
  kit (`fx/oldkit/`, only its repo path and port patched) against the new on the same fixture merges, whole
  `integrate.sh` in wall seconds (`fx/times.txt`; each run's logs in `fx/s-<kit>-<state>-<track>/`):
  - docs lane, launch-prep moved by a record: old 221 s, new 35 s (SCOPE light: typecheck skipped, `pnpm test` alone)
  - code lane on a board, launch-prep moved by a record (the common case, now that lanes skip record-only syncs): new
    47 s (SCOPE light), where the old kit runs its full gate with the lab whatever moved (282 s on the same lane)
  - code lane on a board, launch-prep moved by code: old 282 s, new 263 s (SCOPE full, LAB on, `HARNESS sees: 6
    step(s) moved`): the specimen rerun and the sight check (5 to 8 s by the old logs' timestamps)
  - docs lane, launch-prep moved by code: new 160 s (SCOPE full, LAB off) at a load of 54, against the old kit's 221 s
  - a record pushing STATUS to 81 lines under a code lane: SCOPE light, `pnpm test` red on record-depth-policy.test.ts,
    `INTEGRATE DONE red`, exit 1 (`fx/s-new-p-bad-fx-code/`)
  - `FULL=1` on the docs lane: SCOPE full forced, LAB on, the merge's typecheck forced (`fx/s-new-p-rec-fx-docs-full/`,
    `fx/s-merge-full/merge.log`)
  - loads ran 7 to 54 (other lanes' builds), so a pair can carry 20 s of noise; every step now prints its own seconds
- 1, the gate twice: cut. gate-lane.sh reads the merge's parents through the new `scope.sh`: `pnpm test` alone when the
  merge differs from the lane's head (HEAD^2) in docs only (docs/, usher/, kit/, markdown outside content/ and src/),
  otherwise lint, test and the build. pnpm test holds the docs the lab reads (docs.test.ts, tracks.test.ts,
  ledger.test.ts, track-manifests.test.ts), and every /design route builds dynamic (ƒ in the route table,
  `fx/warm-build.log`), so no doc reaches the build.
- 2, the lab for lanes that change nothing it renders: cut. The lab runs only when the lane's own diff (HEAD^1 to HEAD)
  holds a path it could render (all but the docs class, tests, supabase/ and workers/), and lab:demo only for a board:
  with `none` it pressed nothing (lab-demo.mjs filters the desk's steps by `<board>.`).
- 3, two typechecks: merge-lane.sh's `pnpm typecheck` covers the build's and stays, now only for code the lane never
  gated or on FULL=1; the build's pass needs next.config.ts, the Question above.
- 4, negative.sh at every cut: cut from the runbook's cut step and cut-lane.py's docstring; it runs after a kit change
  and before a day's first integration (runbook Integrate 4 and its own header), in 4 s.
- 5, record.py's cap: counts as record-depth-policy.test.ts does (one trailing newline dropped, then split), so STATUS
  reads 80 of 80; negative.sh check 8 holds it.
- 6, cut as well: the gate's specimen rerun (the merge scripts regenerate and stage it before their commit, and a
  standalone rerun hid a stale artifact from specimens.test.ts); the seed-avatar sight check, which reads "skip" since
  its board closed and so printed HARNESS BLIND at all 66 gates in your logs from gate93 to gate158 (the sight now comes
  free from the demo's own moved steps); the record step's three lab tests, now only when a record touched the desk.
- 6, kept, and why: the registry tests before the merge commit (1 to 2 s; the commit's refusal, though pnpm test runs
  them again); the demo's warm retry (only on a red); the merge's fetch; the build lock; negative.sh's cost readings
  (they run only with it).
- The light gate trusts the lane's gate for its code, so the trust is checked: the Handoff names the sha its gates ran
  on (cut-lane.py's template) and the lane check confirms it reaches the head by docs alone, or the integration takes
  `FULL=1` (runbook Integrate 2).
- Also: the kit runs against the tree it sits in, so a kit lane tests it in its own worktree and negative.sh never
  touches your checkout from a lane (`GATE_PORT` moves the gate's port); capture-all.sh no longer evaluates
  gate-lane.sh's line 7 by number (the rewrite would have made it run another line); demo-rerun.sh requires S (it
  defaulted to a dead session's scratchpad), proved by negative.sh 1c; a fresh $S no longer prints a no-match error at
  its first integration.
- Runbook lines changed: Cut a lane 2; Integrate a handoff 2, 4, 5 and 6; Milestone; The scripts (integrate.sh,
  gate-lane.sh, scope.sh).
- Assets requested from Will: none
- Board ideas: none
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (the next.config.ts line is the Question)
- Calls his to overrule:
  - a wiring lane that changes `src/` now runs lab:smoke itself (cut-lane.py's Verify line): the integration crawls the
    lab only when launch-prep brought code the lane never saw, so the crawl moved to the lane, which runs in parallel;
    `docs/tracks/README.md`'s template mirrors cut-lane.py's Verify and Handoff lines and is yours to align
  - the lab steps follow the lane's own diff (the brief's "never for a docs-only lane"), so a board edited in one of
    your cut or record commits is lab-checked at the next lane whose diff touches the lab, or by `FULL=1`
  - kit/ is in the docs class: nothing in the build, the lab or the tests reads it (git grep), so a brand refresh at a
    record never forces a full gate
  - capture.sh and capture-all.sh default to :3140 (page-console.mjs reads it), outside the gate's 3130 and the lanes'
    3131 to 3139, because they kill whatever holds their port
- Look at first: gate-lane.sh's scope block and scope.sh's classes; then `reel-guest-wiring`: cut before the lab crawl
  joined a wiring lane's Verify line, and it touches src/, so integrate it with `FULL=1` unless its Handoff shows a
  lab:smoke run.
