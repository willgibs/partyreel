// page-console.mjs <base> [path] [--probe]: load one page of the dev tree in headless Chrome and print the browser's console errors and
// exceptions. The preview key is read from .env.local (a light guard, not a secret). Modeled on scripts/lab-demo.mjs.
import { spawn } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const base = process.argv[2] || "http://localhost:3140"; const path = process.argv[3] || "/design/library"; const probe = process.argv.includes("--probe");
const env = readFileSync(".env.local", "utf8");
const key = (env.match(/^DESIGN_PREVIEW_KEY=(.*)$/m)?.[1] ?? "").trim().replace(/^"|"$/g, "");
if (!key) { console.error("no key in .env.local"); process.exit(2); }
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9400 + Math.floor(Math.random() * 100);
const profile = mkdtempSync(join(tmpdir(), "lib-console-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let list = null;
for (let i = 0; i < 40 && !list; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await sleep(250); } }
if (!list) { chrome.kill("SIGKILL"); throw new Error("Chrome never opened its port"); }
const page = list.find((t) => t.type === "page") ?? list[0];
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const pending = new Map(); const events = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else if (d.method) events.push(d); };
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");
await send("Page.navigate", { url: `${base}${path}?key=${key}` });
await sleep(12000);
if (probe) { await send("Runtime.evaluate", { expression: "console.error('Encountered two children with the same key, `probe`. (a control: the collector must see this)')" }); await sleep(500); }
const errors = events.filter((e) => e.method === "Runtime.consoleAPICalled" && (e.params.type === "error" || e.params.type === "warning")).map((e) => e.params.args.map((a) => a.value ?? a.description ?? "").join(" "));
const thrown = events.filter((e) => e.method === "Runtime.exceptionThrown").map((e) => e.params.exceptionDetails.exception?.description ?? e.params.exceptionDetails.text);
const title = (await send("Runtime.evaluate", { expression: "document.title + ' | rows=' + document.querySelectorAll('[role=search] ~ div ul li').length + ' | groups=' + document.querySelectorAll('[role=search] ~ div > div').length", returnByValue: true })).result?.result?.value;
console.log("page:", title);
console.log("console errors/warnings:", errors.length); for (const e of errors) console.log("  -", String(e).slice(0, 220));
console.log("exceptions:", thrown.length); for (const t of thrown) console.log("  -", String(t).slice(0, 900));
console.log("duplicate-key error present:", errors.some((e) => e.includes("same key")) ? "YES" : "no");
ws.close(); chrome.kill("SIGKILL"); await sleep(300); try { rmSync(profile, { recursive: true, force: true }); } catch {}
