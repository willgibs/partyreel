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
 * Policy: build main (production) always. launch-prep builds ON REQUEST: only when the commit
 * message carries `[preview]` (the Vercel cost round, 2026-09-11 — Will: "deployments are only
 * needed for reviewable rounds"). It used to build on every push, which alone accounted for 176
 * of the 381 retained deployments and most of the storage overage; a docs commit or a
 * mid-round checkpoint needs no preview, and the round's LAST push before a walk says
 * `[preview]`. Nothing is lost but the preview itself: CI (GitHub Actions) runs typecheck,
 * lint, test and build on every push to main, launch-prep and lp/** regardless of this file.
 *
 * An lp/<track> push builds ONLY when the commit message carries `[preview]` (the storage round,
 * 2026-09-15: with fourteen tracks handing off in one day, "build at handed-off" put the project
 * at 40 GB of its 10 GB monthly deployment storage and over on function storage, and Will's
 * review surface for a round is the launch-prep alias after integration, not fourteen branch
 * aliases). A manifest's `status` and `preview:` fields no longer build anything, and a branch
 * without a manifest builds nothing either. The Orchestrator builds the launch-prep alias once
 * per round close, and prunes (`scripts/prune-vercel-deployments.mjs`) after every integration.
 * A missing/empty VERCEL_GIT_COMMIT_REF means a manual `vercel deploy` with no git ref, which
 * must never be silently canceled, so it builds. Everything else skips.
 *
 * vercel.json's "ignoreCommand" points here and overrides the project-settings field; keep the
 * policy in THIS file. Rollback: delete the vercel.json key (the dashboard field, if still set,
 * takes back over). See CLAUDE.md "Git" + docs/PROGRAM.md for the branch protocol this serves.
 */

const ref = process.env.VERCEL_GIT_COMMIT_REF ?? "";
const message = process.env.VERCEL_GIT_COMMIT_MESSAGE ?? "";

let build;
let why;
if (ref === "") {
  build = true;
  why = "no git ref (manual deploy), never silently canceled";
} else if (ref === "main") {
  build = true;
  why = "production";
} else if (ref === "launch-prep") {
  build = message.includes("[preview]");
  why = build
    ? "the commit message says [preview]"
    : "the integration branch builds on request (say [preview] when a walk needs it)";
} else if (ref.startsWith("lp/")) {
  build = message.includes("[preview]");
  why = build
    ? "the commit message says [preview]"
    : "an agent branch builds no preview (the alias is built once per round; say [preview] only when the Orchestrator asks for one)";
} else {
  build = false;
  why = "not main, launch-prep or lp/*";
}

console.log(
  `[ignore-build] ref "${ref || "(none)"}": ${build ? "building" : "skipping"}, ${why}`,
);

process.exit(build ? 1 : 0);
