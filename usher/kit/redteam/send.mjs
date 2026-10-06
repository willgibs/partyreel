// node send.mjs <key> <label> <file,file,...> [--dismiss] [--tracker] [--ms 90000] [--shots]
// Through the cover's Add: Add > "Choose from your album" (the real chooser, intercepted) > the files > "Send N".
// The recorder (inflight.js) runs from before the press to past the complete-upload that answers for the last file;
// --dismiss presses "Maybe later" the moment the keep rises (else the keep stays open); --tracker opens her uploads after
// the press.
import { call, ev, rtDir, sleep } from "./lib.mjs";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
const argv = process.argv.slice(2);
const [key, label, filesArg] = argv;
const opt = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const DISMISS = argv.includes("--dismiss"); const DOCK = argv.includes("--dock"); const TRACKER = argv.includes("--tracker"); const SHOTS = argv.includes("--shots");
const MS = +opt("--ms", 120000);
// Media: RT_MEDIA, else $RT_DIR/media/ (unique copies of the test media, each with random bytes appended where the
// format allows, so no two uploads share a hash).
const RT = rtDir();
const MEDIA = (process.env.RT_MEDIA || `${RT}/media`).replace(/\/?$/, "/");
const files = filesArg.split(",").map((f) => (f.startsWith("/") ? f : MEDIA + f));
const mouse = async (p) => { for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await call({ key, method: "Input.dispatchMouseEvent", params: { type, x: p.x, y: p.y, button: "left", clickCount: 1 } }); };
const at = (expr) => ev(key, `(() => { const e = ${expr}; if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); if (r.width === 0) return null; return { x: r.x + r.width / 2, y: r.y + r.height / 2, t: (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 40) }; })()`);
const btn = (re, scope = "document") => `[...${scope}.querySelectorAll('button, [role=menuitem], a')].find(b => ${re}.test(((b.innerText || '') + ' ' + (b.getAttribute('aria-label') || '')).trim()) && b.getBoundingClientRect().width > 0)`;
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);

// 1. the recorder
const on = await ev(key, readFileSync(new URL("./inflight.js", import.meta.url), "utf8"));
let on2 = on; if (on === "already") { await ev(key, "window.__if.stop(); delete window.__if; 1"); on2 = await ev(key, readFileSync(new URL("./inflight.js", import.meta.url), "utf8")); }
log("recorder", on, on2);
await call({ key, method: "Page.setInterceptFileChooserDialog", params: { enabled: true } });
const t0 = Date.now();
// 2. the cover's Add
const atNoScroll = (expr) => ev(key, `(() => { const e = ${expr}; if (!e) return null; const r = e.getBoundingClientRect(); if (r.width === 0) return null; return { x: r.x + r.width / 2, y: r.y + r.height / 2, t: (e.getAttribute('aria-label') || e.innerText || '').trim().slice(0, 40) }; })()`);
const add = DOCK ? await atNoScroll(`[...document.querySelectorAll('button[data-slot=shutter]')].find(b => /Add photos/.test(b.getAttribute('aria-label') || '') && b.getBoundingClientRect().width > 0)`) : await at(btn("/^(Add|Take)/", `(document.querySelector('[data-event-head="album"]') || document)`));
if (!add) { log("no cover Add", await ev(key, "document.body.innerText.slice(0, 300)")); process.exit(1); }
log("cover Add", JSON.stringify(add));
await mouse(add);
let item = null;
for (let i = 0; i < 20 && !item; i++) { await sleep(150); item = await at(btn("/^Choose from your album/")); }
if (!item) { log("no menu item", await ev(key, `[...document.querySelectorAll('[role=dialog],[role=menu]')].map(d => d.innerText).join(' | ')`)); process.exit(1); }
const menuWords = await ev(key, `[...document.querySelectorAll('[role=dialog],[role=menu]')].map(d => d.innerText.replace(/\\s+/g, ' ').slice(0, 160)).join(' | ')`);
log("menu", menuWords);
await mouse(item);
// 3. the chooser, intercepted
let chooser = null;
for (let i = 0; i < 40 && !chooser; i++) { await sleep(100); const evs = await call({ key, events: true, since: t0, filter: "Page.fileChooserOpened" }); if (evs.length) chooser = evs[evs.length - 1].params; }
if (!chooser) { log("no chooser"); process.exit(1); }
log("chooser", JSON.stringify({ mode: chooser.mode, node: chooser.backendNodeId }));
log("setFiles", JSON.stringify(await call({ key, method: "DOM.setFileInputFiles", params: { files, backendNodeId: chooser.backendNodeId } })));
// 4. the review, then Send N
let send = null;
for (let i = 0; i < 40 && !send; i++) { await sleep(150); send = await at(btn("/^Send \\d+$/")); }
// the review's entrance: wait until the button stands still (two reads 250 ms apart agree)
for (let i = 0; i < 20 && send; i++) { await sleep(250); const again = await at(btn("/^Send \\d+$/")); if (again && Math.abs(again.x - send.x) < 1 && Math.abs(again.y - send.y) < 1) { send = again; break; } send = again; }
if (!send) { log("no Send", await ev(key, `[...document.querySelectorAll('[role=dialog],[role=alertdialog]')].map(d => d.innerText.replace(/\\s+/g, ' ')).join(' | ')`)); process.exit(1); }
const review = await ev(key, `[...document.querySelectorAll('[role=dialog],[role=alertdialog]')].map(d => d.innerText.replace(/\\s+/g, ' ').slice(0, 200)).join(' | ')`);
log("review", review);
const pressAt = await ev(key, "window.__if.mark('PRESS')");
const pressWall = Date.now();
await mouse(send);
log("PRESS", send.t, "at", pressAt);
// 5. watch until every file has its complete-upload answer
const shotsDir = `${RT}/shots/send-${label}`; if (SHOTS) { rmSync(shotsDir, { recursive: true, force: true }); mkdirSync(shotsDir, { recursive: true }); }
let dismissed = false; let trackerOpened = false; let doneAt = null; let n = 0; const seen = new Map();
for (;;) {
  await sleep(250);
  const evs = await call({ key, events: true, since: pressWall - 50, filter: "Network.responseReceived$|Network.requestWillBeSent$", limit: 5000 });
  for (const e of evs) { const u = e.method === "Network.requestWillBeSent" ? e.params.request.url : e.params.response.url; if (!/\/api\/r2\/(presign|complete)-upload/.test(u)) continue; const r = seen.get(e.params.requestId) || { u: u.replace(/.*\/api\/r2\//, ""), t: e.t - pressWall }; if (e.method === "Network.responseReceived") { r.s = e.params.response.status; r.dt = e.t - pressWall; } seen.set(e.params.requestId, r); }
  // A complete answers for a batch (`{files: [...]}`, one per file it took), so the files are counted inside each
  // answer, read once it has come back; one with no list counts as one file.
  for (const [id, r] of seen) if (r.u.startsWith("complete") && r.s && r.n === undefined) { const b = await call({ key, method: "Network.getResponseBody", params: { requestId: id } }); try { const j = JSON.parse(b.result?.body || "{}"); r.n = Array.isArray(j.files) ? j.files.length : 1; } catch { r.n = 1; } }
  const completes = [...seen.values()].filter((r) => r.u.startsWith("complete") && r.s);
  const answered = completes.reduce((n, r) => n + (r.n ?? 1), 0);
  if (TRACKER && !trackerOpened) { const tb = await at(`document.querySelector('[data-upload-tracker]')`); if (tb) { await ev(key, `window.__if.mark('TRACKER-OPEN')`); await mouse(tb); trackerOpened = true; log("tracker opened"); } }
  if (DISMISS && !dismissed) { const ml = await at(btn("/^Maybe later$/")); if (ml) { await ev(key, `window.__if.mark('DISMISS')`); await mouse(ml); dismissed = true; log("keep dismissed (Maybe later)"); } }
  if (SHOTS && n < 400) { const r = await call({ key, method: "Page.captureScreenshot", params: { format: "jpeg", quality: 40 } }); if (r.result?.data) writeFileSync(`${shotsDir}/${String(n++).padStart(3, "0")}-${Date.now() - pressWall}ms.jpg`, Buffer.from(r.result.data, "base64")); }
  if (answered >= files.length && doneAt === null) { doneAt = Date.now(); log("all complete", answered, "files in", completes.length, "answer(s) at +", doneAt - pressWall, "ms"); }
  if (doneAt !== null && Date.now() - doneAt > 4000) break;
  if (Date.now() - pressWall > MS) { log("TIMEOUT"); break; }
}
await ev(key, "window.__if.mark('END')");
const r = JSON.parse(await ev(key, "JSON.stringify({ cb: window.__if.cb, frames: window.__if.frames, max: window.__if.max(), href: location.href })"));
// the wire: each complete-upload's body
const bodies = [];
for (const [id, x] of seen) if (x.u.startsWith("complete") && x.s) { const b = await call({ key, method: "Network.getResponseBody", params: { requestId: id } }); bodies.push({ dt: x.dt, s: x.s, body: (b.result?.body || "").slice(0, 300) }); }
const out = { label, files: files.map((f) => f.split("/").pop()), pressAt, review, menuWords, wire: [...seen.values()].sort((a, b) => a.t - b.t), completes: bodies.sort((a, b) => a.dt - b.dt), max: r.max, cb: r.cb, frames: r.frames };
mkdirSync(`${RT}/curl`, { recursive: true });
writeFileSync(`${RT}/curl/send-${label}.json`, JSON.stringify(out, null, 1));
const afterPress = r.frames.filter((f) => f.t >= pressAt);
console.log(JSON.stringify({ label, max: r.max, tilesAfterPress: { cbMax: Math.max(0, ...r.cb.filter((c) => c.t >= pressAt && !c.mark).map((c) => c.nested + c.stack + c.direct)), frMax: Math.max(0, ...afterPress.filter((f) => !f.mark).map((f) => f.nested + f.stack + f.direct + f.shown)) } }));
for (const c of bodies) console.log("complete", JSON.stringify(c));
for (const f of afterPress) console.log("frame", JSON.stringify(f));
