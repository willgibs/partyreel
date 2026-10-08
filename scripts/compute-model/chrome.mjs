/**
 * A headless Chrome of the model's own, over its DevTools protocol (album-perf's and lab-demo's pattern: Node's own
 * WebSocket, no dependency). Each `device()` is a fresh browser context: its own cookies, storage and cache, the way
 * a guest's phone is a new device to the app.
 *
 * ★ LOCAL ONLY. Every device blocks Vercel's hosts and Partyreel's live origins before its first navigation, and
 * `goto` refuses anything but the measuring server: a stray absolute link (a share URL, an OG image) must never
 * become a function call on the team's Hobby allowance.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { devToolsPort } from "../../usher/kit/kit-env.mjs";
import { keepVersionAsksTrue } from "./true-clock.mjs";

const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/** URL patterns no device may reach (Network.setBlockedURLs wildcards). */
export const BLOCKED = [
  "*://*.vercel.app/*",
  "*://vercel.app/*",
  "*://*.vercel.com/*",
  "*://vercel.com/*",
  "*://vercel.live/*",
  "*://*.vercel.live/*",
  "*://partyreel.com/*",
  "*://*.partyreel.com/*",
];

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launchChrome({ headed = false } = {}) {
  if (!existsSync(CHROME))
    throw new Error(`no Chrome at ${CHROME} (set CHROME_PATH)`);
  const profile = mkdtempSync(join(tmpdir(), "compute-model-"));
  const proc = spawn(
    CHROME,
    [
      ...(headed ? [] : ["--headless=new"]),
      // Port 0: Chrome binds a free one and writes it in this profile alone, so the model can never attach to
      // another lane's Chrome (a port from the pid could land on one).
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      // A measured tab must never be throttled as a background one: the album polls only while visible.
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
      "--window-size=1440,900",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  const port = await devToolsPort(profile, proc).catch((e) => {
    proc.kill();
    throw e;
  });
  let wsUrl = null;
  for (let i = 0; i < 100 && !wsUrl; i++) {
    try {
      wsUrl = (
        await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()
      ).webSocketDebuggerUrl;
    } catch {
      await sleep(150);
    }
  }
  if (!wsUrl) throw new Error("Chrome never opened its debugging port");
  const browser = await connect(wsUrl);
  return {
    browser,
    port,
    async close() {
      try {
        await browser.send("Browser.close");
      } catch {
        // already closing
      }
      proc.kill();
      await sleep(300);
      try {
        rmSync(profile, { recursive: true, force: true });
      } catch {
        // Chrome still closing its profile: the OS reaps its temp dir.
      }
    },
  };
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let seq = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(`${p.method}: ${msg.error.message}`));
      else p.resolve(msg.result);
    } else if (msg.method) for (const l of listeners) l(msg);
  };
  const ready = new Promise((r, j) => {
    ws.onopen = r;
    ws.onerror = j;
  });
  const api = {
    async send(method, params = {}, sessionId) {
      await ready;
      return new Promise((resolve, reject) => {
        const id = ++seq;
        const timer = setTimeout(() => {
          if (!pending.has(id)) return;
          pending.delete(id);
          reject(new Error(`${method} did not answer in 60s`));
        }, 60_000);
        pending.set(id, {
          method,
          resolve: (v) => (clearTimeout(timer), resolve(v)),
          reject: (e) => (clearTimeout(timer), reject(e)),
        });
        ws.send(
          JSON.stringify({
            id,
            method,
            params,
            ...(sessionId ? { sessionId } : {}),
          }),
        );
      });
    },
    on(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
  return api;
}

/**
 * A fresh device (its own browser context) with one page, on `base` only. `init` scripts run before the page's own
 * (a clock shim, seeded storage).
 */
export async function device(
  browser,
  {
    base,
    name = "",
    viewport = { width: 390, height: 844, mobile: true },
    init = [],
    block = [],
    cookies = [],
    trueClockAsks = false,
  },
) {
  const { browserContextId } = await browser.send(
    "Target.createBrowserContext",
    {
      disposeOnDetach: true,
    },
  );
  const { targetId } = await browser.send("Target.createTarget", {
    url: "about:blank",
    browserContextId,
  });
  const { sessionId } = await browser.send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  const send = (method, params) => browser.send(method, params, sessionId);
  const inflight = new Map();
  let lastActivity = Date.now();
  browser.on((msg) => {
    if (msg.sessionId !== sessionId) return;
    const p = msg.params ?? {};
    if (msg.method === "Network.requestWillBeSent") {
      inflight.set(p.requestId, p.request.url);
      lastActivity = Date.now();
    } else if (
      msg.method === "Network.loadingFinished" ||
      msg.method === "Network.loadingFailed"
    ) {
      inflight.delete(p.requestId);
      lastActivity = Date.now();
    }
  });
  await send("Network.enable");
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.setBlockedURLs", { urls: [...BLOCKED, ...block] });
  // The measuring server tells two devices apart by this cookie (localhost only); a signed-in host rides theirs.
  for (const [n, value] of [...(name ? [["cm_device", name]] : []), ...cookies])
    await send("Network.setCookie", { name: n, value, url: base });
  await send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.mobile ? 3 : 1,
    mobile: Boolean(viewport.mobile),
  });
  if (viewport.mobile) {
    await send("Emulation.setUserAgentOverride", {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    });
  }
  // The page reads as visible and focused, as a phone in a guest's hand.
  await send("Emulation.setFocusEmulationEnabled", { enabled: true });
  for (const source of init)
    await send("Page.addScriptToEvaluateOnNewDocument", { source });
  // ★ A shimmed phone asks the window its TRUE clock would (`true-clock.mjs`: why, and how).
  if (trueClockAsks) await keepVersionAsksTrue({ browser, send, sessionId });

  const origin = new URL(base).origin;
  const page = {
    send,
    async goto(path) {
      const url = new URL(path, base);
      if (url.origin !== origin)
        throw new Error(`refused: ${url.origin} is not the measuring server`);
      const loaded = new Promise((r) => {
        const off = browser.on((m) => {
          if (m.sessionId === sessionId && m.method === "Page.loadEventFired") {
            off();
            r();
          }
        });
      });
      await send("Page.navigate", { url: url.href });
      await Promise.race([loaded, sleep(30_000)]);
    },
    async eval(expression) {
      const r = await send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (r.exceptionDetails)
        throw new Error(
          r.exceptionDetails.exception?.description ?? r.exceptionDetails.text,
        );
      return r.result.value;
    },
    /** Waits until `expression` is truthy (polled), or throws naming it. */
    async waitFor(expression, { timeout = 20_000, every = 100 } = {}) {
      const until = Date.now() + timeout;
      while (Date.now() < until) {
        try {
          const v = await page.eval(expression);
          if (v) return v;
        } catch {
          // the page is navigating
        }
        await sleep(every);
      }
      throw new Error(`timed out waiting for: ${expression.slice(0, 120)}`);
    },
    /** No request in flight for `quiet` ms (the page has settled), or `max` ms passed. */
    async idle({ quiet = 1_500, max = 30_000 } = {}) {
      const until = Date.now() + max;
      while (Date.now() < until) {
        if (inflight.size === 0 && Date.now() - lastActivity >= quiet)
          return true;
        await sleep(100);
      }
      return false;
    },
    inflight: () => [...inflight.values()],
    /**
     * A real click at the centre of the first VISIBLE, ENABLED match no wider than the screen (a sheet mid-animation
     * draws a scaled copy), whose text holds `text` when given: React's delegated handlers see a trusted event.
     */
    async click(selector, { text = "", timeout } = {}) {
      const box = await page.waitFor(
        `(() => { const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.width <= innerWidth && !e.disabled && getComputedStyle(e).visibility !== "hidden" && ((e.getAttribute("aria-label") || "") + " " + e.textContent).includes(${JSON.stringify(text)}); }); if (!el) return null; el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`,
        timeout ? { timeout } : {},
      );
      for (const type of ["mousePressed", "mouseReleased"])
        await send("Input.dispatchMouseEvent", {
          type,
          x: box.x,
          y: box.y,
          button: "left",
          clickCount: 1,
        });
    },
    /** A real click at the centre of the element `expression` evaluates to (waited for until it is one). */
    async clickEl(expression, { timeout } = {}) {
      const box = await page.waitFor(
        `(() => { const el = (${expression}); if (!el) return null; el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect(); return r.width && r.height ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null; })()`,
        timeout ? { timeout } : {},
      );
      for (const type of ["mousePressed", "mouseReleased"])
        await send("Input.dispatchMouseEvent", {
          type,
          x: box.x,
          y: box.y,
          button: "left",
          clickCount: 1,
        });
    },
    async type(text) {
      await send("Input.insertText", { text });
    },
    async key(key, code = key) {
      for (const type of ["keyDown", "keyUp"])
        await send("Input.dispatchKeyEvent", {
          type,
          key,
          code,
          windowsVirtualKeyCode:
            key === "Enter"
              ? 13
              : key === "Escape"
                ? 27
                : key === "ArrowRight"
                  ? 39
                  : 0,
        });
    },
    async setFiles(selector, files) {
      const { root } = await send("DOM.getDocument", { depth: 1 });
      const { nodeId } = await send("DOM.querySelector", {
        nodeId: root.nodeId,
        selector,
      });
      if (!nodeId) throw new Error(`no file input at ${selector}`);
      await send("DOM.setFileInputFiles", { nodeId, files });
    },
    async screenshot(file) {
      // CDP's answer, not a query: a failed capture rejects, it never resolves empty.
      const shot = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(file, Buffer.from(shot.data, "base64"));
    },
    async close() {
      try {
        await browser.send("Target.disposeBrowserContext", {
          browserContextId,
        });
      } catch {
        // already gone
      }
    },
  };
  return page;
}

/**
 * THE CLOCK SHIM: the page's hour runs `k` times faster, so a real client's own long cadence (its polls, the doorbell's
 * batch tick, the link re-mint, Realtime's heartbeat, a prefetch going stale) plays out in 60/k minutes and is counted
 * request by request. Date runs k times fast and every timer OVER ten seconds fires k times sooner; timers of ten
 * seconds and under keep real time (a slot's give-up, a join's reply timeout), because network round trips do, and
 * performance.now stays real (React's scheduler, animation). A timer re-armed by its own callback (setTimeout chains)
 * stays scaled. ★ A page on this clock needs `device`'s `trueClockAsks` too: its version asks would otherwise name the
 * shimmed clock's window and be told the server's (the model measures a phone with a true clock).
 */
export function clockShim(k) {
  return `(() => {
    const K = ${Number(k)};
    if (K === 1 || window.__computeClock) return;
    window.__computeClock = K;
    const RealDate = Date, realNow = RealDate.now.bind(RealDate), start = realNow();
    const vnow = () => start + (realNow() - start) * K;
    function VDate(...a) {
      if (!new.target) return new RealDate(vnow()).toString();
      return a.length ? new RealDate(...a) : new RealDate(vnow());
    }
    VDate.prototype = RealDate.prototype;
    VDate.now = vnow;
    VDate.parse = RealDate.parse;
    VDate.UTC = RealDate.UTC;
    window.Date = VDate;
    const scale = (ms) => { const n = Number(ms) || 0; return n > 10000 ? n / K : n; };
    const st = window.setTimeout.bind(window), si = window.setInterval.bind(window);
    window.setTimeout = (fn, ms, ...a) => st(fn, scale(ms), ...a);
    window.setInterval = (fn, ms, ...a) => si(fn, scale(ms), ...a);
  })();`;
}
