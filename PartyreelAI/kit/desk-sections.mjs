// desk-sections.mjs: the alias's desk, per section (the key from .env.local, never on a command line).
import fs from "node:fs";
const KEY = fs.readFileSync("/Users/gibby/local/ai/partyreel/.env.local", "utf8").match(/^DESIGN_PREVIEW_KEY=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const html = await (await fetch(`https://partyreel-git-launch-prep-partyreel.vercel.app/design/lab?key=${KEY}`, { headers: { "Cache-Control": "no-cache" } })).text();
console.log("page serves", (html.match(/sentry-release=([0-9a-f]{8})/) || [])[1]);
const heads = ["Waiting on you", "Every standing board", "Your notes this window"];
const pos = heads.map((h) => ({ h, i: html.indexOf(h) })).filter((x) => x.i >= 0).sort((a, b) => a.i - b.i);
for (let k = 0; k < pos.length; k++) {
  const chunk = html.slice(pos[k].i, k + 1 < pos.length ? pos[k + 1].i : undefined);
  const ids = []; for (const m of chunk.matchAll(/\/design\/lab\/([a-z0-9-]+)(?=[?"\/])/g)) if (!ids.includes(m[1])) ids.push(m[1]);
  console.log(`## ${pos[k].h} (${ids.length}) -> ${ids.join(" > ")}`);
}
