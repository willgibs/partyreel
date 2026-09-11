#!/usr/bin/env node
/**
 * Deletes the Vercel deployments nobody can reach any more.
 *
 * Why this exists (the Vercel cost round, 2026-09-11): the project had 381 retained deployments,
 * far past the storage the plan allows. 183 of them belonged to 45 `lp/*` branches that had been
 * merged and deleted weeks earlier, 76 were canceled or errored, and 176 were `launch-prep`
 * previews of which only the newest is ever opened. Retention was already set to 30 days and
 * working; the program simply produced deployments faster than the window cleared them. Deleting a
 * branch now deletes its deployments too: this runs as the last step of the per-track integration
 * checklist in docs/PROGRAM.md.
 *
 * Usage (dry run prints the full classification and changes nothing):
 *
 *     node scripts/prune-vercel-deployments.mjs
 *     node scripts/prune-vercel-deployments.mjs --apply
 *     node scripts/prune-vercel-deployments.mjs --apply --keep 20
 *
 * A deployment is DELETED when its git branch no longer exists on origin, when it is CANCELED or
 * ERRORED, or when it is past the keep count for its own live branch. Three guards outrank all of
 * that and are never overridden by a flag:
 *
 *   1. the deployment currently serving production, whatever its age;
 *   2. the newest deployment on any live branch, so an alias never loses its target;
 *   3. anything created in the last 24 hours, so a running review is never pulled out from under
 *      whoever is looking at it.
 *
 * `main` keeps everything by ruling (Will, 2026-09-11): production deployments are the
 * instant-rollback targets, and retention expires them on its own schedule.
 *
 * Auth: VERCEL_TOKEN from the environment, or from .env.local, the same team-scoped token the rest
 * of the program uses. Never printed, never committed.
 */

import { execFileSync } from "node:child_process";

const PROJECT_ID = "prj_9jMOBYmlxMtjNOuWXthVIcwAjWaB";
const TEAM_ID = "team_ht9qAVBQVZf60dpGNJUwmaj5";
const API = "https://api.vercel.com";

/** How many of a LIVE branch's deployments to keep, newest first. Infinity keeps the lot. */
const KEEP_PER_BRANCH = { main: Infinity, "launch-prep": 10 };
const DEFAULT_KEEP = 10;

/** Nothing younger than this is ever deleted, however it classifies. */
const MIN_AGE_MS = 24 * 60 * 60 * 1000;

/** Courtesy pause between deletes so a long prune cannot look like a hammering client. */
const DELETE_DELAY_MS = 150;

try {
  process.loadEnvFile(new URL("../.env.local", import.meta.url).pathname);
} catch {
  // No .env.local (real env vars already exported) - proceed with process.env as-is.
}

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error("Missing VERCEL_TOKEN (set it in .env.local). Aborting.");
  process.exit(1);
}

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const keepFlag = args.indexOf("--keep");
const keepOverride = keepFlag >= 0 ? Number(args[keepFlag + 1]) : null;
if (keepOverride !== null && !Number.isFinite(keepOverride)) {
  console.error("--keep needs a number. Aborting.");
  process.exit(1);
}

async function api(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    throw new Error(
      `${init.method ?? "GET"} ${path} -> ${res.status} ${await res.text()}`,
    );
  }
  return res.status === 204 ? null : res.json();
}

/** Branches that still exist on origin; everything else is a dead branch. */
function liveBranches() {
  const out = execFileSync("git", ["ls-remote", "--heads", "origin"], {
    encoding: "utf8",
  });
  return new Set(
    out
      .split("\n")
      .map((line) => line.split("refs/heads/")[1])
      .filter(Boolean),
  );
}

async function allDeployments() {
  const rows = [];
  let until;
  for (;;) {
    const q = new URLSearchParams({
      projectId: PROJECT_ID,
      teamId: TEAM_ID,
      limit: "100",
    });
    if (until) q.set("until", String(until));
    const page = await api(`/v6/deployments?${q}`);
    const batch = page.deployments ?? [];
    if (batch.length === 0) break;
    rows.push(...batch);
    until = page.pagination?.next;
    if (!until) break;
  }
  return rows;
}

const live = liveBranches();
const deployments = await allDeployments();
const production = await api(
  `/v6/deployments?projectId=${PROJECT_ID}&teamId=${TEAM_ID}&limit=1&target=production&state=READY`,
);
const productionId = production.deployments?.[0]?.uid ?? null;

const now = Date.now();
const branchOf = (d) => d.meta?.githubCommitRef ?? "";
const newestPerBranch = new Map();
for (const d of [...deployments].sort(
  (a, b) => (b.created ?? 0) - (a.created ?? 0),
)) {
  const b = branchOf(d);
  if (b && !newestPerBranch.has(b)) newestPerBranch.set(b, d.uid);
}

// Newest first within each branch, so "past the keep count" means "older than the ones we keep".
const seenOnBranch = new Map();
const keep = [];
const drop = [];
for (const d of [...deployments].sort(
  (a, b) => (b.created ?? 0) - (a.created ?? 0),
)) {
  const branch = branchOf(d);
  const isLive = live.has(branch);
  const seen = (seenOnBranch.get(branch) ?? 0) + 1;
  seenOnBranch.set(branch, seen);
  const limit = keepOverride ?? KEEP_PER_BRANCH[branch] ?? DEFAULT_KEEP;

  let verdict = null;
  if (d.uid === productionId) verdict = ["keep", "serves production"];
  else if (now - (d.created ?? 0) < MIN_AGE_MS)
    verdict = ["keep", "younger than 24h"];
  else if (newestPerBranch.get(branch) === d.uid && isLive)
    verdict = ["keep", `newest on ${branch}`];
  else if (!isLive)
    verdict = ["drop", `branch "${branch || "(none)"}" no longer exists`];
  else if (d.state === "CANCELED" || d.state === "ERROR")
    verdict = ["drop", d.state.toLowerCase()];
  else if (seen > limit)
    verdict = ["drop", `#${seen} on ${branch}, past keep ${limit}`];
  else verdict = ["keep", `#${seen} on ${branch}, within keep ${limit}`];

  (verdict[0] === "keep" ? keep : drop).push({ d, why: verdict[1] });
}

const day = (ms) => new Date(ms ?? 0).toISOString().slice(0, 10);
console.log(`live branches: ${[...live].sort().join(", ") || "(none)"}`);
console.log(
  `deployments: ${deployments.length} | keep ${keep.length} | delete ${drop.length}`,
);
console.log(`production deployment: ${productionId ?? "(none found)"}\n`);

console.log("KEEPING:");
for (const { d, why } of keep) {
  console.log(`  ${day(d.created)}  ${d.uid.slice(0, 24).padEnd(26)} ${why}`);
}

const byReason = new Map();
for (const { why } of drop) {
  const bucket = why.replace(/"[^"]*"/, '"…"').replace(/#\d+ on/, "# on");
  byReason.set(bucket, (byReason.get(bucket) ?? 0) + 1);
}
console.log("\nDELETING, by reason:");
for (const [reason, n] of [...byReason].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${reason}`);
}

if (!apply) {
  console.log(
    "\nDry run. Nothing was deleted. Re-run with --apply to perform it.",
  );
  process.exit(0);
}

console.log(`\nDeleting ${drop.length} deployments...`);
let done = 0;
let failed = 0;
for (const { d } of drop) {
  try {
    await api(`/v13/deployments/${d.uid}?teamId=${TEAM_ID}`, {
      method: "DELETE",
    });
    done += 1;
    if (done % 25 === 0) console.log(`  ${done}/${drop.length}`);
  } catch (err) {
    failed += 1;
    console.error(`  failed ${d.uid}: ${err.message.slice(0, 140)}`);
  }
  await new Promise((r) => setTimeout(r, DELETE_DELAY_MS));
}
console.log(`\nDeleted ${done}, failed ${failed}, kept ${keep.length}.`);
