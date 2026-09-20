import fs from "node:fs";
import { call, sleep, err, APP } from "./vercel-lib.mjs";
const SHORT = process.env.SHA; const FULL = process.env.FULL;
const envFile = fs.readFileSync("/Users/gibby/local/ai/partyreel/.env.local", "utf8");
const KEY = envFile.match(/^DESIGN_PREVIEW_KEY=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const ALIAS = "partyreel-git-launch-prep-partyreel.vercel.app";
const find = async () => ((await call("GET", `/v6/deployments?projectId=${APP}&limit=10`)).json.deployments || []).find((d) => (d.meta?.githubCommitSha || "").startsWith(SHORT) && d.meta?.githubCommitRef === "launch-prep");
let dpl = null;
for (let i = 0; i < 8 && !dpl; i++) { dpl = await find(); if (!dpl) await sleep(15000); }
if (!dpl) { const proj = (await call("GET", `/v9/projects/${APP}`)).json; const c = await call("POST", `/v13/deployments`, { name: "partyreel", project: APP, gitSource: { type: "github", repoId: proj.link.repoId, ref: "launch-prep", sha: FULL } }); console.log("no deployment appeared; created by API:", c.status, c.status < 300 ? c.json.id : err(c.json)); if (c.status >= 300) process.exit(1); await sleep(5000); dpl = await find(); }
console.log("deployment", dpl.uid, "state", dpl.state);
let state = dpl.state; const t0 = Date.now();
while (!["READY", "ERROR", "CANCELED"].includes(state) && Date.now() - t0 < 50 * 60 * 1000) { await sleep(30000); const d = (await call("GET", `/v13/deployments/${dpl.uid}`)).json; state = d.readyState || d.state; }
console.log("state", state, "after", Math.round((Date.now() - t0) / 60000), "min");
if (state !== "READY") process.exit(1);
await sleep(10000);
let rec = (await call("GET", `/v4/aliases/${ALIAS}`)).json;
if (!rec || rec.deploymentId !== dpl.uid) { const a = await call("POST", `/v2/deployments/${dpl.uid}/aliases`, { alias: ALIAS }); console.log("alias assigned by hand:", a.status); await sleep(8000); rec = (await call("GET", `/v4/aliases/${ALIAS}`)).json; }
console.log("alias record ->", rec && rec.deploymentId === dpl.uid ? "this build" : "NOT this build");
const html = await (await fetch(`https://${ALIAS}/design/lab?key=${KEY}`, { headers: { "Cache-Control": "no-cache" } })).text();
console.log("page serves", (html.match(/sentry-release=([0-9a-f]{8})/) || [])[1], "| image-trail listed:", html.includes("/design/lab/image-trail"), "| gallery-width listed:", html.includes("/design/lab/gallery-width"));
