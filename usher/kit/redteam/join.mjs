// node join.mjs <key> <qr> <name> : welcome > Continue > Continue as guest > name > Continue > Skip for now
import { APP, call, ev, sleep } from "./lib.mjs";
const [key, qr, name] = process.argv.slice(2);
const A = APP; // the desk by default (APP moves it); never the alias or partyreel.com
const mouse = async (p) => { for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await call({ key, method: "Input.dispatchMouseEvent", params: { type, x: p.x, y: p.y, button: "left", clickCount: 1 } }); };
const find = (re) => ev(key, `(() => { const re = ${re}; const e = [...document.querySelectorAll('button, a, [role=button]')].find(b => re.test(((b.innerText || '') + ' ' + (b.getAttribute('aria-label') || '')).trim()) && b.getBoundingClientRect().width > 0); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
const press = async (re, label, tries = 30) => { for (let i = 0; i < tries; i++) { const p = await find(re); if (p) { await sleep(350); const q = await find(re); await mouse(q || p); console.log("pressed", label); return true; } await sleep(200); } console.log("NOT FOUND", label, await ev(key, "document.body.innerText.slice(0,300)")); return false; };
await call({ key, method: "Network.enable", params: { maxTotalBufferSize: 300000000, maxResourceBufferSize: 50000000 } });
const t0 = Date.now();
await call({ key, method: "Page.navigate", params: { url: `${A}/e/${qr}` } });
for (;;) { await sleep(250); if ((await ev(key, "document.readyState")) === "complete" || Date.now() - t0 > 30000) break; }
await sleep(1200);
console.log("welcome:", (await ev(key, "document.body.innerText.slice(0, 260)")).replace(/\s+/g, " "));
await press("/^Continue$/", "Continue");
await sleep(1500);
await press("/^Continue as guest/", "Continue as guest");
await sleep(900);
await ev(key, "(() => { const i = document.querySelector('[role=dialog] input'); i && i.focus(); return !!i; })()");
await call({ key, method: "Input.insertText", params: { text: name } });
await sleep(300);
await press("/^Continue$/", "Continue (name)");
await sleep(1800);
console.log("step:", (await ev(key, "[...document.querySelectorAll('[role=dialog]')].map(d => d.innerText.replace(/\\s+/g,' ').slice(0,240)).join(' || ')")));
await press("/^Skip for now$/", "Skip for now");
await sleep(1500);
console.log("after:", JSON.stringify(await ev(key, "({ dlg: document.querySelectorAll('[role=dialog]').length, tiles: document.querySelectorAll('[data-album-grid] [data-media-tile]').length, sheet: document.querySelector('[data-contact-sheet]')?.getAttribute('data-contact-sheet') ?? null, text: document.body.innerText.replace(/\\s+/g,' ').slice(0, 500) })")));
console.log("t0", t0);
