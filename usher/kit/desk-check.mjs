// desk-check.mjs: fetch the alias's desk (the key read from .env.local, never on a command line) and print
// the served stamp plus the board ids in document order, so the desk's leverage order can be read off the page.
import fs from "node:fs";
const envFile = fs.readFileSync("/Users/gibby/local/ai/partyreel/.env.local", "utf8");
const KEY = envFile.match(/^DESIGN_PREVIEW_KEY=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const ALIAS = process.env.ALIAS || "partyreel-git-launch-prep-partyreel.vercel.app";
const html = await (await fetch(`https://${ALIAS}/design/lab?key=${KEY}`, { headers: { "Cache-Control": "no-cache" } })).text();
console.log("page serves", (html.match(/sentry-release=([0-9a-f]{8})/) || [])[1]);
const seen = []; for (const m of html.matchAll(/\/design\/lab\/([a-z0-9-]+)/g)) if (!seen.includes(m[1])) seen.push(m[1]);
console.log(seen.length, "boards ->", seen.join(" > "));
const lib = await (await fetch(`https://${ALIAS}/design/library?key=${KEY}`, { headers: { "Cache-Control": "no-cache" } })).text();
console.log("library:", /The design recipe/.test(lib) ? "the recipe is served" : "NO RECIPE on the served Library", "| catalog:", (lib.match(/(\d+) of (\d+)/) || [])[0] ?? "no index count");
