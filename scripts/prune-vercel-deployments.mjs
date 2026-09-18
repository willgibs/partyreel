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
 *   0. any deployment an alias of the project currently points at (the branch alias is not always
 *      on the newest build: see the note at `aliased` below);
 *   1. the deployment currently serving production, whatever its age;
 *   2. the newest deployment on any live branch, so an alias never loses its target;
 *   3. anything still in flight (queued, building, initializing), so a build is never deleted
 *      under itself.
 *
 * Three per branch by ruling (Will, 2026-09-18, replacing "main keeps everything" of 2026-09-11):
 * "We definitely don't need every main deployment. The last in the launch prep. The three most
 * recent at any time should be more than enough." The team is on Hobby, whose deployment storage
 * cap (10 GB) a kept-everything policy blew through (45 GB on 2026-09-18, and Vercel's queue held
 * a build for eighty minutes that evening); a finished deployment past its keep count goes
 * whatever its age.
 *
 * Auth: VERCEL_TOKEN from the environment, or from .env.local, the same team-scoped token the rest
 * of the program uses. Never printed, never committed.
 */

import { execFileSync } from "node:child_process";

const PROJECT_ID = "prj_9jMOBYmlxMtjNOuWXthVIcwAjWaB";
const TEAM_ID = "team_ht9qAVBQVZf60dpGNJUwmaj5";
const API = "https://api.vercel.com";

/** How many of a LIVE branch's deployments to keep, newest first. Infinity keeps the lot. */
const KEEP_PER_BRANCH = { main: 3, "launch-prep": 3 };
const DEFAULT_KEEP = 3;

/** A deployment younger than this is kept only while it is still in flight (see guard 3). */
const MIN_AGE_MS = 24 * 60 * 60 * 1000;
const TERMINAL = new Set(["READY", "CANCELED", "ERROR"]);

/**
 * Courtesy pause between deletes. Vercel rate-limits deletion hard: the first run of this script
 * managed 213 before every remaining call came back 429, so the pause is generous and the client
 * waits out a 429 rather than burning the attempt (see deleteOne).
 */
const DELETE_DELAY_MS = 900;

/** How many times one deployment may be re-tried after a 429 before we give up on it. */
const MAX_RETRIES = 6;

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(
      `${init.method ?? "GET"} ${path} -> ${res.status} ${body}`,
    );
    err.status = res.status;
    // Vercel answers a 429 with the epoch-seconds (or ms) at which the window resets, either in
    // the standard header or inside the error body. Prefer whichever is present over guessing.
    const header = Number(res.headers.get("retry-after"));
    let reset = null;
    try {
      const raw = JSON.parse(body)?.error?.limit?.reset;
      if (raw) reset = raw > 1e12 ? raw - Date.now() : raw * 1000 - Date.now();
    } catch {
      // Body was not the shape we expected; the header or the default carries it.
    }
    err.retryAfterMs =
      Number.isFinite(header) && header > 0 ? header * 1000 : (reset ?? null);
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

/** One delete, waiting out any rate limit rather than counting it as a failure. */
async function deleteOne(uid) {
  for (let attempt = 0; ; attempt++) {
    try {
      await api(`/v13/deployments/${uid}?teamId=${TEAM_ID}`, {
        method: "DELETE",
      });
      return true;
    } catch (err) {
      if (err.status !== 429 || attempt >= MAX_RETRIES) throw err;
      // Cap the wait so a wrong reset value cannot park the run for an hour.
      const wait =
        Math.min(err.retryAfterMs ?? 0, 90_000) ||
        Math.min(2 ** attempt * 2000, 60_000);
      console.log(`  rate limited, waiting ${Math.round(wait / 1000)}s...`);
      await sleep(wait);
    }
  }
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
// Guard 0: every deployment an alias of this project points at RIGHT NOW. The branch alias is not
// always on the newest build: Vercel reported `aliasAssigned: true` for a build whose alias still
// targeted the previous one, and the first run of the three-per-branch policy (2026-09-18) deleted
// that target, so the desk answered DEPLOYMENT_NOT_FOUND until the alias was reassigned by hand.
const aliased = new Set();
for (let next = null, i = 0; i < 10; i++) {
  const page = await api(
    `/v4/aliases?projectId=${PROJECT_ID}&teamId=${TEAM_ID}&limit=100${next ? `&until=${next}` : ""}`,
  );
  for (const a of page.aliases ?? []) if (a.deploymentId) aliased.add(a.deploymentId);
  next = page.pagination?.next ?? null;
  if (!next) break;
}

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
  else if (aliased.has(d.uid)) verdict = ["keep", "an alias points at it"];
  else if (now - (d.created ?? 0) < MIN_AGE_MS && !TERMINAL.has(d.state))
    verdict = ["keep", "in flight, younger than 24h"];
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
    await deleteOne(d.uid);
    done += 1;
    if (done % 25 === 0) console.log(`  ${done}/${drop.length}`);
  } catch (err) {
    failed += 1;
    console.error(`  failed ${d.uid}: ${err.message.slice(0, 140)}`);
  }
  await sleep(DELETE_DELAY_MS);
}
console.log(`\nDeleted ${done}, failed ${failed}, kept ${keep.length}.`);
