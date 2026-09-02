---
track: ci-workflow
status: handed-off
cut: "efe8118"
preview: false
owns:
  - .github/workflows/ci.yml
reads:
  - package.json
  - .nvmrc
  - scripts/vercel-ignore-build.mjs
---
# lp/ci-workflow

**Goal.** The four-step gate (`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`) runs on
GitHub Actions on every push to `launch-prep` and `lp/*` and on every pull request to `main`, on the
pinned toolchain (Node from `.nvmrc`, pnpm 9.14.4, `pnpm install --frozen-lockfile`), each step its own
step so a failure names itself, the pnpm store cached, superseded runs of the same ref cancelled. If
`pnpm build` needs environment values, use repository variables for the `NEXT_PUBLIC_*` ones and propose
the rest in Handoff; never write a secret into the workflow. This is the program's prerequisite for
wider fan-out: an agent's push turns red before the Orchestrator's integration window, not inside it.
Size S; merges alone the same day.

**Rulings in force.** none.

**Verify on.** The Actions tab: a green run on this branch's own push; a throwaway commit with a
deliberately failing test turns the run red (then a revert commit, both kept on the branch as the
proof); the run on `launch-prep` after integration.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/testing-verification.md`, "## The gate": one paragraph, CI runs the same four steps on
  every push, how to read a failed run (`gh run list --branch lp/<track>`, `gh run view <id>
  --log-failed`), and the two repository variables the build step waits on. Placed directly after the
  "two ways the gate lies" note and BEFORE the deploy-poll paragraph that landed on `launch-prep`
  mid-round (the merge conflicted there; both sides kept, see `20f60a3`).

## Deferred (ROADMAP one-liners, bucket named)

- **Now:** CI does not cover `main`. The triggers are the goal's (push to `launch-prep` + `lp/*`, PR to
  `main`), so a milestone merge pushed straight to `main` with no PR runs no CI at all; add `main` to
  the push branches (one line in `.github/workflows/ci.yml`) if milestone merges keep landing without a
  pull request.
- **Now:** only the pnpm store is cached, so every run compiles cold (2m16s to 2m46s with the build step
  skipped). If the wall time starts to bite, cache `.next/cache` too, keyed on the lockfile plus a
  source hash.

## Handoff

- Head `20f60a3`, pushed. `status: handed-off` makes `scripts/vercel-ignore-build.mjs` build the branch
  preview at `partyreel-git-lp-ci-workflow-partyreel.vercel.app`; there is nothing visual to look at,
  the Actions tab is the deliverable.
- Synced: `launch-prep` HAD moved (2 commits, tip `cd8da95`). Merged, never rebased. One conflict, in
  `docs/systems/testing-verification.md`: both sides appended a paragraph to the end of "## The gate".
  Resolved by keeping both, CI first (it is about the gate itself), then the deploy-poll and zsh notes.
- Gates on the synced tree, each run to its own log and checked on its own exit code: typecheck ok,
  lint ok (0 errors, the 1 pre-existing react-compiler warning in `contact-form.tsx`), test ok
  (1519 passed, 176 files), build ok (244 static pages, 107 route entries).
- Lane check, `git diff --name-only origin/launch-prep...HEAD`:
  - `.github/workflows/ci.yml` (owned)
  - `docs/systems/testing-verification.md` (the one listed system-doc edit)
  - `docs/tracks/ci-workflow.md` (this file)
  - Exception, netting to zero: `9b08417` added `src/lib/ci-red-path.test.ts` (outside `owns`) and
    `a8ad291` reverted it. That pair IS the red-path proof this manifest's "Verify on" asks for, so
    both stay on the branch; the diff against `launch-prep` shows no trace of the file. `9b08417` is
    also the one commit on this track pushed with `pnpm test` knowingly red, which was its point.
- **Needed from the Orchestrator, and the one thing this track could not verify itself: two repository
  variables.** `src/lib/env.ts` validates the public schema eagerly at import, so `next build` dies
  collecting page data without them (measured with a genuinely empty environment, `.env.local` moved
  aside, 2026-09-02). They are `NEXT_PUBLIC_*`, so Next inlines them into the client bundle and they are
  public by construction: repository VARIABLES, not secrets.
  - `NEXT_PUBLIC_SUPABASE_URL` (must parse as a URL)
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (non-empty string)
  - No value is proposed here on purpose. Use the same two values the Vercel project env carries.
    Set at Settings > Secrets and variables > Actions > Variables, or
    `gh variable set NEXT_PUBLIC_SUPABASE_URL --repo willgibs/partyreel --body '<value>'`.
  - Nothing else is needed: every other var in `env.ts` is `.optional()` behind a lazy assert, the
    build performs no network calls (it built green on placeholder values), and typecheck, lint and
    test need NO environment at all (also measured). That is why the guard gates only the build.
  - Until they exist the build step SKIPS with a `::warning::` naming them, rather than failing: a red
    run has to mean broken code, not unfinished setup. Watch the first run after setting them, since
    `pnpm build` is the only step that has never executed on a Linux runner in CI (Vercel builds the
    same command on Linux every deploy, and `pnpm install --frozen-lockfile` already passes there, so
    the residual risk is the two-line `vars` plumbing, whose expression the guard step already
    exercises).
  - Repository variables are NOT masked in logs the way secrets are. Never move a real secret into
    `vars` to make some future step convenient.
- No migrations, Workers, Vercel, Stripe or Supabase changes proposed or made.
- Runs, all on `lp/ci-workflow` (`gh run view <id>`):
  - `33672606250` green, 2m16s: the first push. Every step ran, build skipped with the annotation.
  - `33672961978` RED, 2m46s: the deliberately failing test. Failed at the named `pnpm test` step, the
    assertion annotated on `src/lib/ci-red-path.test.ts:12`, the guard and build steps skipped behind
    it. `gh run view 33672961978 --log-failed` prints only that step.
  - `33673346622` green: the revert. Red to green in one push.
  - `33673680608` CANCELLED by `33673698070`: two `workflow_dispatch` runs seconds apart on the same
    ref proved `cancel-in-progress`. The survivor went green.
  - The pnpm store cache is real: run 3 restored a 248 MB store on a lockfile-keyed hit and installed
    1105 packages with `downloaded 0`.
- Two facts worth keeping: `gh workflow run ci.yml --ref lp/ci-workflow` works even though `ci.yml` is
  not yet on the default branch (the UI's "Run workflow" button is what needs it on `main`); and the
  action majors current as of 2026-09-02 are `actions/checkout@v7`, `actions/setup-node@v7`,
  `pnpm/action-setup@v6`, all of which run on Node 24, so `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` (set in
  `db-backup.yml` before the June cutover) is not needed here.
- Look at first: `.github/workflows/ci.yml`, top comment. It records the env measurement and why the
  build step is guarded rather than failing.

## Record

Merged into `launch-prep` at `<sha>` (2026-09-02). Added `.github/workflows/ci.yml`: the four-step
gate now runs on GitHub Actions for every push to `launch-prep` and `lp/*` and every pull request to
`main`, on the pinned toolchain (Node from `.nvmrc`, pnpm 9.14.4, `--frozen-lockfile`), with the pnpm
store cached and superseded runs of the same ref cancelled. `pnpm typecheck`, `pnpm lint`, `pnpm test`
and `pnpm build` are four separately named steps, so the red step title is the diagnosis. Measuring the
build against a genuinely empty environment showed it needs exactly two values,
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, both public by construction and
therefore repository variables; the other three steps need no environment at all. The build step is
guarded on those variables and skips with an annotation naming them until they are set, so a red run
means broken code rather than unfinished setup. The gate was proven in both directions on the branch: a
deliberately failing test turned a push red at the named `pnpm test` step and the revert turned it green
again, and both commits stay on the branch as the proof. An agent's break now surfaces on its own push
instead of inside the Orchestrator's integration window, which is what wider fan-out was waiting on.
