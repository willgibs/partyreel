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
 * An lp/<track> push is unchanged: it builds when the branch has NO manifest yet (the pre-model
 * default, so a branch that predates docs/tracks keeps its every-push preview), when its manifest
 * docs/tracks/<track>.md says `preview: true` or `status: handed-off`, or when the commit message
 * carries `[preview]`. A manifest with `preview: false` and `status: open` skips, so the
 * integration preview never queues behind work in progress on the one-at-a-time Hobby plan (the
 * operating model, 2026-09-02). A missing/empty VERCEL_GIT_COMMIT_REF means a manual
 * `vercel deploy` with no git ref, which must never be silently canceled, so it builds.
 * Everything else skips.
 *
 * vercel.json's "ignoreCommand" points here and overrides the project-settings field; keep the
 * policy in THIS file. Rollback: delete the vercel.json key (the dashboard field, if still set,
 * takes back over). See CLAUDE.md "Git" + docs/PROGRAM.md for the branch protocol this serves.
 */

import { readFileSync } from "node:fs";

const ref = process.env.VERCEL_GIT_COMMIT_REF ?? "";
const message = process.env.VERCEL_GIT_COMMIT_MESSAGE ?? "";

function manifestDecision(track) {
  let head;
  try {
    head = readFileSync(`docs/tracks/${track}.md`, "utf8").split("\n---")[0];
  } catch {
    return { hasManifest: false, wants: false };
  }
  return {
    hasManifest: true,
    wants:
      /^preview:\s*true\b/m.test(head) || /^status:\s*handed-off\b/m.test(head),
  };
}

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
  const { hasManifest, wants } = manifestDecision(ref.slice(3));
  if (!hasManifest) {
    build = true;
    why =
      "an lp/ branch without a manifest builds every push (the pre-model default)";
  } else if (wants) {
    build = true;
    why =
      "its manifest asks for a preview (preview: true or status: handed-off)";
  } else if (message.includes("[preview]")) {
    build = true;
    why = "the commit message says [preview]";
  } else {
    build = false;
    why =
      "its manifest is open with preview: false (say [preview] or flip the flag)";
  }
} else {
  build = false;
  why = "not main, launch-prep or lp/*";
}

console.log(
  `[ignore-build] ref "${ref || "(none)"}": ${build ? "building" : "skipping"}, ${why}`,
);

process.exit(build ? 1 : 0);
