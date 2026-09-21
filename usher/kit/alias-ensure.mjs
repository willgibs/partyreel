import fs from "node:fs";
import { call, sleep, err, APP, ADMIN } from "./vercel-lib.mjs";
// SHA=<short> FULL=<full> node usher/kit/alias-ensure.mjs
// Since 2026-09-20 no push to launch-prep creates a Vercel deployment (vercel.json's git.deploymentEnabled), so
// this script IS the deployment: one per project (partyreel, partyreel-admin) for the record commit, created by
// API, waited to READY, then each project's launch-prep alias assigned by hand. The commit must say [preview]: the
// Ignored Build Step runs on an API-created git deployment too (2026-09-19) and cancels one without it. A
// deployment that already exists for the sha (a retry after the cap's 402) is reused, never duplicated. Exit 1
// when the app's alias did not move; an admin failure is printed in capitals and does not stop the chain.
const SHORT = process.env.SHA, FULL = process.env.FULL;
if (!SHORT || !FULL) { console.error("SHA=<short> FULL=<full> are required"); process.exit(2); }
const envFile = fs.readFileSync("/Users/gibby/local/ai/partyreel/.env.local", "utf8");
const KEY = envFile.match(/^DESIGN_PREVIEW_KEY=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const TARGETS = [
  { label: "app", id: APP, name: "partyreel", alias: "partyreel-git-launch-prep-partyreel.vercel.app" },
  { label: "admin", id: ADMIN, name: "partyreel-admin", alias: "partyreel-admin-git-launch-prep-partyreel.vercel.app" },
];
const find = async (t) => ((await call("GET", `/v6/deployments?projectId=${t.id}&limit=10`)).json?.deployments || []).find((d) => (d.meta?.githubCommitSha || "").startsWith(SHORT) && d.meta?.githubCommitRef === "launch-prep");
// DRY=1: report what exists for the sha and where each alias points, create nothing, exit 0 (2026-09-21: the window
// after a cap is checked without spending a creation on the check itself).
const DRY = Boolean(process.env.DRY);
// 1. Find or create, both projects (a creation is the only thing the cap counts; nothing is retried).
for (const t of TARGETS) {
  t.dpl = await find(t);
  if (DRY) { const rec = (await call("GET", `/v4/aliases/${t.alias}`)).json; console.log(`${t.label}: ${t.dpl ? `deployment exists ${t.dpl.uid} (${t.dpl.state})` : `no deployment for ${SHORT}; a run would create one`}; the alias record names ${rec?.deploymentId || "nothing"}${t.dpl && rec?.deploymentId === t.dpl.uid ? " (this build)" : ""}`); continue; }
  if (t.dpl) { console.log(`${t.label}: deployment exists ${t.dpl.uid} (${t.dpl.state})`); continue; }
  const proj = (await call("GET", `/v9/projects/${t.id}`)).json;
  const c = await call("POST", `/v13/deployments`, { name: t.name, project: t.id, gitSource: { type: "github", repoId: proj?.link?.repoId, ref: "launch-prep", sha: FULL } });
  console.log(`${t.label}: created by API:`, c.status, c.status < 300 ? c.json.id : err(c.json));
  if (c.status < 300) t.dpl = { uid: c.json.id, state: c.json.readyState || "QUEUED" }; else t.failed = `creation refused (${c.status} ${err(c.json)})`;
}
if (DRY) { console.log("dry run: nothing created, nothing aliased"); process.exit(0); }
// 2. Wait for READY (both builds run at once; a build takes about four minutes).
const t0 = Date.now();
for (const t of TARGETS) {
  if (!t.dpl) continue;
  let state = t.dpl.state;
  while (!["READY", "ERROR", "CANCELED"].includes(state) && Date.now() - t0 < 50 * 60 * 1000) { await sleep(30000); const d = (await call("GET", `/v13/deployments/${t.dpl.uid}`)).json; state = d?.readyState || d?.state || state; }
  console.log(`${t.label}: state ${state} after ${Math.round((Date.now() - t0) / 60000)} min`);
  if (state !== "READY") t.failed = `state ${state}`;
}
// 3. The alias RECORD, never aliasAssigned (2026-09-18: that flag lied while the record named the previous build).
await sleep(10000);
for (const t of TARGETS) {
  if (t.failed) continue;
  let rec = (await call("GET", `/v4/aliases/${t.alias}`)).json;
  if (!rec || rec.deploymentId !== t.dpl.uid) { const a = await call("POST", `/v2/deployments/${t.dpl.uid}/aliases`, { alias: t.alias }); console.log(`${t.label}: alias assigned by hand:`, a.status); await sleep(8000); rec = (await call("GET", `/v4/aliases/${t.alias}`)).json; }
  const ok = Boolean(rec && rec.deploymentId === t.dpl.uid);
  console.log(`${t.label}: alias record ->`, ok ? "this build" : "NOT this build");
  if (!ok) t.failed = "the alias record names another build";
}
// 4. The served stamp (the app only: the admin surface serves no lab page).
const app = TARGETS[0];
if (!app.failed) {
  const html = await (await fetch(`https://${app.alias}/design/lab?key=${KEY}`, { headers: { "Cache-Control": "no-cache" } })).text();
  console.log("app page serves", (html.match(/sentry-release=([0-9a-f]{8})/) || [])[1], "| image-trail listed:", html.includes("/design/lab/image-trail"), "| gallery-width listed:", html.includes("/design/lab/gallery-width"));
}
for (const t of TARGETS) if (t.failed) console.log(`${t.label.toUpperCase()} ALIAS NOT MOVED: ${t.failed}`);
process.exit(app.failed ? 1 : 0);
