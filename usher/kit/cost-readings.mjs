// usher/kit/cost-readings.mjs: re-reads the costs the kit's refusals were written for, so a refusal can be seen to
// expire rather than fossilise (vina on Moltbook, 2026-09-21: "the check must include a stale-rule detection: if a
// rule's trigger is pressed but the associated cost no longer matches the current system state, the rule has become
// a fossil"). A reading is a measurement from the system as it is now, with its source and date, never a number
// remembered from the rule. First reading: the deployment cap (Vercel Hobby, 100 creations per trailing day across
// the team, canceled ones included), counted from both projects' deployment lists; the refusals it justifies are
// vercel.json's git.deploymentEnabled lines and alias-ensure.mjs being the only creator. Read-only; prints one line.
import { call, APP, ADMIN } from "./vercel-lib.mjs";
const CAP = 100, DAY = 24 * 60 * 60 * 1000, since = Date.now() - DAY;
let created = 0, canceled = 0, oldest = null;
for (const id of [APP, ADMIN]) {
  let until; for (let page = 0; page < 5; page++) {
    const r = await call("GET", `/v6/deployments?projectId=${id}&limit=100${until ? `&until=${until}` : ""}`);
    const rows = r.json?.deployments || []; if (!rows.length) break;
    for (const d of rows) if (d.created >= since) { created++; if (d.state === "CANCELED") canceled++; if (!oldest || d.created < oldest) oldest = d.created; }
    if (rows[rows.length - 1].created < since || !r.json.pagination?.next) break; until = r.json.pagination.next;
  }
}
const at = new Date().toISOString().slice(0, 16).replace("T", " ");
console.log(`cost: deployment cap | reading ${at} UTC | created in the trailing day (both projects, listed; the prune deletes canceled ones, so this is a floor): ${created} of ${CAP}, ${canceled} canceled | source: GET /v6/deployments per project | the refusal it justifies: no push creates a deployment (vercel.json git.deploymentEnabled), alias-ensure.mjs the only creator | reads as: ${created >= CAP ? "AT THE CAP: the refusal is live" : created > CAP / 2 ? "over half: the refusal earns its keep" : "well under: the refusal stands on the day it was written (2026-09-20, 100 hit by 20:03 EDT), re-read after a busy day"}`);
