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
 * Policy: build main (production) always. launch-prep and lp/<track>: NO PUSH CREATES A DEPLOYMENT
 * (vercel.json's `git.deploymentEnabled`: `lp/*` off since 2026-09-19, `launch-prep` off since
 * 2026-09-20). Vercel's Hobby cap is 100 deployment CREATIONS per rolling day across the team, a
 * canceled one counts, and two projects build this repository, so every push cost two creations
 * even when this script canceled both at once: six lanes pushing working states filled the cap on
 * 2026-09-19, and the Orchestrator's own pushes (about forty by the evening of 2026-09-20, most of
 * them journal and kit commits) filled it again and pinned the review alias for a day. Now the
 * Orchestrator creates one deployment per project by API for each record commit
 * (`usher/kit/alias-ensure.mjs`) and assigns the two launch-prep aliases by hand, so the only
 * launch-prep deployment this script ever sees was asked for. It still requires `[preview]` on
 * that commit: the Ignored Build Step runs on an API-created git deployment too (2026-09-19: one
 * created for a commit without it was canceled here), so a record commit says `[preview]` and an
 * accidental creation of any other commit costs one canceled deployment, never a build. The same
 * word gates `lp/*` should that line ever leave vercel.json. Nothing is lost but the preview
 * itself: CI (GitHub Actions) runs typecheck, lint, test and build on every push to main,
 * launch-prep and lp/** regardless of this file. Lanes never had a preview to lose: they work on
 * their own dev servers, and the alias is Will's review surface and the Orchestrator's live
 * red-team (the storage round, 2026-09-15: fourteen "build at handed-off" previews put the project
 * at 40 GB of its 10 GB deployment storage). The cost round before it (2026-09-11, Will:
 * "deployments are only needed for reviewable rounds") had taken launch-prep from "build every
 * push" (176 of 381 retained deployments) to "build on `[preview]`", the rule the cap then outran.
 * A missing/empty VERCEL_GIT_COMMIT_REF means a manual `vercel deploy` with no git ref, which
 * must never be silently canceled, so it builds. Everything else skips.
 *
 * TWO PROJECTS RUN THIS FILE, and the policy is deliberately IDENTICAL on both (the admin split,
 * 2026-09-18): `partyreel` (NEXT_PUBLIC_SURFACE=app) and `partyreel-admin`
 * (NEXT_PUBLIC_SURFACE=admin, admin.partyreel.com) build the same commit of the same repository, so
 * this script sees the same ref and the same message twice and answers the same way twice. Do NOT
 * add a "the admin only builds when a push touches admin paths" shortcut: the portal renders the
 * shared tokens, the shared components, the auth seam and the db layer, so a push that names no
 * /admin path still changes what the admin serves, and a skipped admin build would leave the two
 * deployments on different commits with nothing saying so. The cost is one extra build per
 * reviewable push; the alternative is a silent drift between surfaces. The knob that IS per-project
 * is the surface variable itself.
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
