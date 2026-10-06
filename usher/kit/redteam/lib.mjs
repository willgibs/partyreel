// Shared helpers over drv.mjs (127.0.0.1:$DRV, default 9996). rtDir() is the walk's own folder (RT_DIR, the red-team's
// scratch folder), where every script writes its state and records: never the repo.
export const rtDir = () => { const d = process.env.RT_DIR; if (!d) { console.error("set RT_DIR to your red-team's scratch folder"); process.exit(2); } return d.replace(/\/$/, ""); };
export const APP = process.env.APP || "http://localhost:3000";
export const call = async (b) => (await fetch(`http://127.0.0.1:${process.env.DRV || 9996}/`, { method: "POST", body: JSON.stringify(b) })).json();
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const ev = async (key, expr, timeout) => { const r = await call({ key, eval: expr, timeout }); if (r.result?.exceptionDetails) return { EXC: r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text }; if (r.result?.result) return r.result.result.value ?? null; return r; };
export const cdp = (key, method, params = {}) => call({ key, method, params });
export async function nav(key, url, settle = 1500) {
  await cdp(key, "Page.navigate", { url });
  const t0 = Date.now();
  for (;;) { await sleep(250); const s = await ev(key, "document.readyState"); if (s === "complete" || Date.now() - t0 > 30000) break; }
  await sleep(settle);
}
export async function setView(key, { w, h, mobile = false, dsf = 1, scheme = "light", motion = "no-preference" }) {
  await cdp(key, "Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: dsf, mobile });
  await cdp(key, "Emulation.setTouchEmulationEnabled", { enabled: mobile, maxTouchPoints: mobile ? 5 : 0 });
  await cdp(key, "Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }, { name: "prefers-reduced-motion", value: motion }] });
}
export async function shot(key, file, clip) { try {
  const { writeFileSync } = await import("node:fs");
  const r = await cdp(key, "Page.captureScreenshot", { format: "png", ...(clip ? { clip } : {}) });
  writeFileSync(file, Buffer.from(r.result.data, "base64")); } catch (e) { console.log("shot failed", file); }
}
export async function consoleSince(key, since) {
  const evs = await call({ key, events: true, since, filter: "Runtime.consoleAPICalled|Runtime.exceptionThrown|Log.entryAdded", limit: 500 });
  return evs.map((e) => e.method === "Runtime.consoleAPICalled" ? `${e.params.type}: ${e.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 300)}` : e.method === "Log.entryAdded" ? `log.${e.params.entry.level}: ${e.params.entry.text.slice(0, 200)} ${e.params.entry.url || ""}` : `EXC: ${JSON.stringify(e.params.exceptionDetails).slice(0, 300)}`);
}
export async function netSince(key, since, re) {
  const evs = await call({ key, events: true, since, filter: "Network.responseReceived|Network.requestWillBeSent|Network.loadingFailed", limit: 2000 });
  return evs.filter((e) => !re || JSON.stringify(e.params).match(re));
}
