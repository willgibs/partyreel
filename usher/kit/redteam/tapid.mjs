// node tapid.mjs <key> <selectorExpr> : scrolls the element into view, waits for it to stand still, then taps its centre.
import { call, ev, sleep } from "./lib.mjs";
const [key, expr] = process.argv.slice(2);
const at = (scroll) => ev(key, `(() => { const e = ${expr}; if (!e) return null; ${scroll ? "e.scrollIntoView({ block: 'center' });" : ""} const r = e.getBoundingClientRect(); return r.width ? { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } : null; })()`);
let p = await at(true); if (!p) { console.log("NOT FOUND"); process.exit(0); }
for (let i = 0; i < 20; i++) { await sleep(150); const q = await at(false); if (q && q.x === p.x && q.y === p.y) break; p = q; }
await call({ key, method: "Input.dispatchMouseEvent", params: { type: "mouseMoved", ...p } });
await call({ key, method: "Input.dispatchMouseEvent", params: { type: "mousePressed", ...p, button: "left", buttons: 1, clickCount: 1 } });
await sleep(90);
await call({ key, method: "Input.dispatchMouseEvent", params: { type: "mouseReleased", ...p, button: "left", buttons: 0, clickCount: 1 } });
console.log("tapped", JSON.stringify(p));
