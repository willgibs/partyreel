// node press.mjs <key> <text|/regex/> [nth] : holds a REAL press (CDP mousePressed, or a touch start at a phone width) on
// the visible control whose text or aria-label matches, reads its computed scale while held (and again 200 ms after
// letting go), then slides off before releasing, so no click fires. Prints the control's aria-haspopup and data-slot.
import { call, ev, sleep } from "./lib.mjs";
const [key, want, nth = "0"] = process.argv.slice(2);
const find = `(() => { const want = ${JSON.stringify(want)}; const re = want.startsWith('/') ? new RegExp(want.slice(1, -1)) : null; const els = [...document.querySelectorAll('button, a, [role=button], [role=radio], [role=tab], [role=switch], [role=menuitem]')].filter(e => { const t = (e.innerText || '').trim(); const a = e.getAttribute('aria-label') || ''; const ok = re ? (re.test(t) || re.test(a)) : (t === want || a === want); const r = e.getBoundingClientRect(); return ok && r.width > 0 && r.height > 0; }); const e = els[${+nth}]; if (!e) return null; window.__pressEl = e; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, popup: e.getAttribute('aria-haspopup'), slot: e.getAttribute('data-slot'), size: e.getAttribute('data-size'), variant: e.getAttribute('data-variant'), w: Math.round(r.width), h: Math.round(r.height) }; })()`;
const p = await ev(key, find);
if (!p) { console.log("NOT FOUND", want); process.exit(0); }
await sleep(250);
const q = (await ev(key, find)) || p;
const read = `(() => { const e = window.__pressEl; const cs = getComputedStyle(e); return { scale: cs.scale, transform: cs.transform, active: e.matches(':active'), dur: cs.transitionDuration.split(',')[0] }; })()`;
await call({ key, method: "Input.dispatchMouseEvent", params: { type: "mouseMoved", x: q.x, y: q.y } });
await call({ key, method: "Input.dispatchMouseEvent", params: { type: "mousePressed", x: q.x, y: q.y, button: "left", clickCount: 1 } });
await sleep(60);
const held = await ev(key, read);
await call({ key, method: "Input.dispatchMouseEvent", params: { type: "mouseMoved", x: 5, y: 5, button: "left", buttons: 1 } });
await call({ key, method: "Input.dispatchMouseEvent", params: { type: "mouseReleased", x: 5, y: 5, button: "left", clickCount: 1 } });
await sleep(200);
const after = await ev(key, read);
console.log(JSON.stringify({ want, ...q, held, after }));
