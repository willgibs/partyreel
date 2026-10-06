// node tap.mjs <key> <x> <y> [holdMs] : a real tap (mouse events, touch-emulated at a phone width) with a finger's hold.
import { call, sleep } from "./lib.mjs";
const [key, x, y, hold = "80"] = process.argv.slice(2);
const p = { x: +x, y: +y };
await call({ key, method: "Input.dispatchMouseEvent", params: { type: "mouseMoved", ...p } });
await call({ key, method: "Input.dispatchMouseEvent", params: { type: "mousePressed", ...p, button: "left", buttons: 1, clickCount: 1 } });
await sleep(+hold);
await call({ key, method: "Input.dispatchMouseEvent", params: { type: "mouseReleased", ...p, button: "left", buttons: 0, clickCount: 1 } });
console.log("tap", x, y);
