// node h.mjs <cmd> <key> ...  (talks to drv.mjs on $DRV, default 9996): eval <expr> | nav <url> [settleMs] | shot <file>
// [clipJSON] | files <selector> <file...> | click <x> <y> | key <key> [code] [vk] | cdp <method> [paramsJSON] |
// events <filterRegex> [sinceMs] [urlRegex] | ct <text|/regex/> [nth] (a real click on the visible control) | type <text>
// | text [chars].
import { writeFileSync } from "node:fs";
const [cmd, key, ...rest] = process.argv.slice(2);
const call = async (b) => (await fetch(`http://127.0.0.1:${process.env.DRV || 9996}/`, { method: "POST", body: JSON.stringify(b) })).json();
const ev = async (expr, timeout) => { const r = await call({ key, eval: expr, timeout }); if (r.result?.exceptionDetails) return { EXC: r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text }; return r.result?.result?.value ?? r; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
if (cmd === "eval") { const v = await ev(rest[0], rest[1] ? +rest[1] : undefined); console.log(typeof v === "string" ? v : JSON.stringify(v)); }
else if (cmd === "nav") {
  const t0 = Date.now(); await call({ key, method: "Page.navigate", params: { url: rest[0] } });
  for (;;) { await sleep(300); const s = await ev("document.readyState"); if (s === "complete" || Date.now() - t0 > 30000) break; }
  await sleep(+(rest[1] || 1500)); console.log(await ev("location.href + ' | ' + document.title"));
}
else if (cmd === "shot") { const r = await call({ key, method: "Page.captureScreenshot", params: { format: "png", ...(rest[1] ? { clip: JSON.parse(rest[1]) } : {}) } }); writeFileSync(rest[0], Buffer.from(r.result.data, "base64")); console.log("saved", rest[0]); }
else if (cmd === "files") {
  const sel = rest[0]; const files = rest.slice(1);
  const r = await call({ key, method: "Runtime.evaluate", params: { expression: `document.querySelector(${JSON.stringify(sel)})` } });
  const objectId = r.result?.result?.objectId; if (!objectId) { console.log("no element", JSON.stringify(r)); process.exit(1); }
  console.log(JSON.stringify(await call({ key, method: "DOM.setFileInputFiles", params: { objectId, files } })));
}
else if (cmd === "click") { const [x, y] = rest.map(Number); for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await call({ key, method: "Input.dispatchMouseEvent", params: { type, x, y, button: "left", clickCount: 1 } }); console.log("clicked", x, y); }
else if (cmd === "key") { for (const type of ["keyDown", "keyUp"]) await call({ key, method: "Input.dispatchKeyEvent", params: { type, key: rest[0], code: rest[1] || rest[0], windowsVirtualKeyCode: +(rest[2] || 0) } }); console.log("key", rest[0]); }
else if (cmd === "cdp") { console.log(JSON.stringify(await call({ key, method: rest[0], params: rest[1] ? JSON.parse(rest[1]) : {} }))); }
else if (cmd === "events") { console.log(JSON.stringify(await call({ key, events: true, filter: rest[0], since: +(rest[1] || 0), urlFilter: rest[2] }))); }
if (cmd === "ct") {
  // click the visible button/link/role=button whose text (or aria-label) matches exactly (or /regex/), with real mouse events
  const want = rest[0]; const nth = +(rest[1] || 0);
  const expr = `(() => { const want = ${JSON.stringify(want)}; const re = want.startsWith('/') ? new RegExp(want.slice(1, -1)) : null; const els = [...document.querySelectorAll('button, a, [role=button], [role=menuitem], [role=menuitemradio], [role=menuitemcheckbox], [role=tab], [role=option], label, [role=radio], [role=switch]')].filter(e => { const t = (e.innerText || '').trim(); const a = e.getAttribute('aria-label') || ''; const ok = re ? (re.test(t) || re.test(a)) : (t === want || a === want); if (!ok) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }); const e = els[${nth}]; if (!e) return {found: els.length}; e.scrollIntoView({block: 'center', inline: 'center'}); const r = e.getBoundingClientRect(); return {x: r.x + r.width / 2, y: r.y + r.height / 2, n: els.length, t: (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 40)}; })()`;
  const p = await ev(expr);
  if (p.x === undefined) { console.log("NOT FOUND", JSON.stringify(p)); process.exit(0); }
  for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await call({ key, method: "Input.dispatchMouseEvent", params: { type, x: p.x, y: p.y, button: "left", clickCount: 1 } });
  console.log("clicked", JSON.stringify(p));
}
if (cmd === "type") { await call({ key, method: "Input.insertText", params: { text: rest[0] } }); console.log("typed"); }
if (cmd === "text") { console.log(await ev(`document.body.innerText.slice(0, ${rest[0] || 800})`)); }
