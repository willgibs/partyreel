#!/usr/bin/env node
/**
 * Vercel "Ignored Build Step" gate: which git branches get deployments.
 *
 * Why this exists (2026-08-28, the exec round): during the elevation program, Agents work on
 * lp/<track> branches and Will reviews their work LIVE on per-branch preview aliases
 * (partyreel-git-lp-<track>-partyreel.vercel.app) before the Orchestrator integrates. Before
 * this script, the gate was an untracked dashboard-only command that built main + launch-prep
 * and silently skipped everything else, so agent work was unreviewable until integration.
 *
 * Contract (Vercel semantics): exit 1 = PROCEED with the build; exit 0 = SKIP (the deployment
 * shows as canceled). Runs BEFORE install with the repo checked out, so: node stdlib only,
 * never import from node_modules.
 *
 * Policy: build main (production), launch-prep (the integration preview), and lp/* (agent
 * review previews; UI-review only, deliberately in no auth/CORS allow-list). A missing/empty
 * VERCEL_GIT_COMMIT_REF means a manual `vercel deploy` with no git ref, which must never be
 * silently canceled, so it builds. Everything else skips.
 *
 * vercel.json's "ignoreCommand" points here and overrides the project-settings field; keep the
 * policy in THIS file. Rollback: delete the vercel.json key (the dashboard field, if still set,
 * takes back over). See CLAUDE.md "Git" + docs/PROGRAM.md for the branch protocol this serves.
 */

const ref = process.env.VERCEL_GIT_COMMIT_REF ?? "";

const build =
  ref === "" || // manual/CLI deploy with no git ref: never silently cancel
  ref === "main" ||
  ref === "launch-prep" ||
  ref.startsWith("lp/");

console.log(
  build
    ? `[ignore-build] ref "${ref || "(none)"}" is deployable, proceeding with the build`
    : `[ignore-build] ref "${ref}" is not main/launch-prep/lp/*, skipping the build`,
);

process.exit(build ? 1 : 0);
