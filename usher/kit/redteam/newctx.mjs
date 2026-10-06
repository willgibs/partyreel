// node newctx.mjs <key> [w] [scheme] [tz] : a fresh browser context and page (a fresh device: no cookies, no storage),
// attached under <key> and recorded in $RT_DIR/ctx.json. Under 768 wide it is a phone (touch, an Android user agent,
// 812 tall, 2x); `tz` emulates a time zone (Emulation.setTimezoneOverride, e.g. Pacific/Kiritimati). Downloads land in
// $RT_DIR/downloads, never Will's Downloads (it syncs to his cloud).
// ★ LOCAL ONLY: every page blocks Vercel's hosts and Partyreel's live origins before its first navigation (the list of
// `scripts/compute-model/chrome.mjs`), so a stray absolute link can never spend the Hobby allowance.
import { call, rtDir, setView } from "./lib.mjs";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
const [key, w = "1440", scheme = "light", tz = ""] = process.argv.slice(2);
const RT = rtDir();
const BLOCKED = ["*://*.vercel.app/*", "*://vercel.app/*", "*://*.vercel.com/*", "*://vercel.com/*", "*://vercel.live/*", "*://*.vercel.live/*", "*://partyreel.com/*", "*://*.partyreel.com/*"];
const ctx = await call({ method: "Target.createBrowserContext", params: { disposeOnDetach: false } });
const t = await call({ method: "Target.createTarget", params: { url: "about:blank", browserContextId: ctx.result.browserContextId } });
await call({ attach: t.result.targetId, key });
await call({ key, method: "Log.enable" });
await call({ key, method: "Network.enable", params: { maxTotalBufferSize: 300000000, maxResourceBufferSize: 50000000 } });
const blocked = await call({ key, method: "Network.setBlockedURLs", params: { urls: BLOCKED } });
const mobile = +w < 768;
await setView(key, { w: +w, h: mobile ? 812 : 900, mobile, dsf: mobile ? 2 : 1, scheme });
if (mobile) await call({ key, method: "Emulation.setUserAgentOverride", params: { userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36", platform: "Android" } });
if (tz) await call({ key, method: "Emulation.setTimezoneOverride", params: { timezoneId: tz } });
await call({ key, method: "Emulation.setFocusEmulationEnabled", params: { enabled: true } });
mkdirSync(`${RT}/downloads`, { recursive: true });
await call({ method: "Browser.setDownloadBehavior", params: { behavior: "allow", downloadPath: `${RT}/downloads`, browserContextId: ctx.result.browserContextId, eventsEnabled: true } });
const f = `${RT}/ctx.json`;
const all = existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : {};
const sess = (await call({ sessions: true }))[key];
all[key] = { targetId: t.result.targetId, ctx: ctx.result.browserContextId, sessionId: sess, w: +w, tz: tz || null, blocked: !blocked.error };
writeFileSync(f, JSON.stringify(all, null, 1));
console.log(JSON.stringify({ key, ...all[key] }));
