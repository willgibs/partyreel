// kit-capture.mjs <outDir>: the brand kit's three 1440 captures from the live site (no dev badge, no toolbar).
// hero: the home's first viewport. demo: the home's live-demo section, reached by real wheel scrolls (its reveal
// listens for scroll events) and clipped to the section. pricing: /pricing down to the foot of the plan cards.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = process.argv[2];
const SITE = process.env.SITE || "https://partyreel.com";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9400 + Math.floor(Math.random() * 100);
const profile = mkdtempSync(join(tmpdir(), "kit-capture-"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
let list;
for (let i = 0; i < 40 && !list; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await sleep(250); } }
if (!list) { chrome.kill("SIGKILL"); throw new Error("Chrome never opened its port"); }
const ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map(); const waiters = [];
ws.onmessage = (ev) => { const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method) for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].method === m.method) { waiters[i].res(m); waiters.splice(i, 1); } };
const send = (method, params = {}) => new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
const waitFor = (method) => new Promise((res) => waiters.push({ method, res }));
const evalJs = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
async function open(path, height) {
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height, deviceScaleFactor: 1, mobile: false });
  const loaded = waitFor("Page.loadEventFired");
  await send("Page.navigate", { url: SITE + path });
  await loaded; await evalJs("document.fonts.ready.then(() => true)"); await sleep(2000);
}
async function shoot(file, clip) {
  const r = await send("Page.captureScreenshot", { format: "jpeg", quality: 82, captureBeyondViewport: !!clip, ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
  const buf = Buffer.from(r.result.data, "base64"); writeFileSync(join(OUT, file), buf); console.log(file, buf.length, "bytes");
}
await send("Page.enable"); await send("Runtime.enable");

// The hero: the first viewport as a visitor meets it.
await open("/", 900);
await shoot("partyreel-hero.jpg");

// The live demo: wheel down to it like a visitor, let it fill, then clip to the section.
const top = await evalJs(`(() => { const h = [...document.querySelectorAll("h2,h1")].find((e) => /fill up/i.test(e.textContent));
  const s = h && (h.closest("section") || h.parentElement); if (!s) return null; const r = s.getBoundingClientRect(); return r.top + scrollY; })()`);
if (top == null) throw new Error("the live demo section was not found");
for (let y = 0; y < top; y += 400) { await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: 720, y: 450, deltaX: 0, deltaY: 400 }); await sleep(120); }
await sleep(4500);
// The sticky header would sit over the clip: hidden for this shot only. The clip runs from above the eyebrow to
// below the Replay row, so no neighbouring section shows.
const rect = await evalJs(`(() => { document.querySelectorAll("header").forEach((e) => e.style.setProperty("visibility", "hidden"));
  const h = [...document.querySelectorAll("h2,h1")].find((e) => /fill up/i.test(e.textContent));
  const s = h.closest("section") || h.parentElement; const eyebrow = h.previousElementSibling || h;
  const replay = [...s.querySelectorAll("button,a")].find((e) => /replay/i.test(e.textContent));
  const top = eyebrow.getBoundingClientRect().top + scrollY - 56; const bottom = (replay || s).getBoundingClientRect().bottom + scrollY + 56;
  return { y: top, h: bottom - top }; })()`);
await sleep(300);
await shoot("partyreel-live-demo.jpg", { x: 0, y: Math.max(0, Math.round(rect.y)), width: 1440, height: Math.round(rect.h) });

// Pricing: the page's head down to the foot of the plan cards.
await open("/pricing", 1300);
// Down to the foot of the two plan cards: the card that holds "Get Pro", plus a margin.
const foot = await evalJs(`(() => { const b = [...document.querySelectorAll("a,button")].find((e) => /get pro/i.test(e.textContent));
  let c = b; while (c && c.parentElement && c.getBoundingClientRect().height < 500) c = c.parentElement;
  return c ? c.getBoundingClientRect().bottom + scrollY : null; })()`);
await shoot("partyreel-pricing.jpg", { x: 0, y: 0, width: 1440, height: Math.round((foot || 1172) + 16) });

ws.close(); chrome.kill("SIGKILL"); await sleep(300); try { rmSync(profile, { recursive: true, force: true }); } catch {}
