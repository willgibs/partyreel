#!/usr/bin/env node
/**
 * THE ALBUM'S PERF HARNESS (the album-window lane, 2026-09-25): real Chrome over
 * its DevTools protocol, driving `/design/album-scale` (the real grid over a
 * synthetic 1,145-photograph album) and reading back what the album costs.
 *
 *   zsh scripts/build-lock.sh pnpm build && pnpm start -p 3136
 *   node scripts/album-perf.mjs --base http://localhost:3136
 *   node scripts/album-perf.mjs --base ... --layouts rows --viewports 375x812 --cpu 4
 *   node scripts/album-perf.mjs --base ... --out /tmp/after.json --label after
 *
 * Measure a PRODUCTION build (`next start`), never `next dev`: dev renders
 * twice, ships unminified React with its checks, and times nothing honestly.
 *
 * WHY IT EXISTS. Will: "Even our test event with 1000+ lightweight items gets
 * laggy on my MBP fast." A lag has causes you can count (animations nobody can
 * see, tiles re-rendered by a like, nodes that are off screen) and a symptom you
 * can time (frames over budget in a fling). This reads both, per layout and per
 * screen, so a fix is a number that moved rather than a feeling:
 *
 *   - the album's DOM nodes (at rest and the most at any point of the fling),
 *     layout and style-recalc counts and time, the JS heap after a GC;
 *   - every running animation once the images in view have loaded, by name;
 *   - a frame-delta histogram over a scripted fling top to bottom and back,
 *     its p50/p95/max, and every long animation frame (over 50ms);
 *   - bytes transferred on load and during the fling, first-row image timing,
 *     CLS and LCP;
 *   - renders, read off the grid's own probe (`setAlbumRenderProbe`): a like, a
 *     progress tick of the in-flight tile, a poll that changed nothing;
 *   - a head arrival while the reader is deep in the album: the synchronous
 *     work it cost and how far any tile on screen moved.
 *
 * The page's key rides `--key`, `DESIGN_PREVIEW_KEY`, or `.env.local` (a light
 * guard, not a secret). It runs in a throwaway Chrome profile, new-headless so
 * animation frames run as in a foreground tab. Exit 1 when `--budgets` is set
 * and a budget is missed.
 */
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const argv = process.argv.slice(2);
const opt = (name, fallback) =>
  argv.includes(name) ? (argv[argv.indexOf(name) + 1] ?? fallback) : fallback;

// No default base: a lane measuring someone else's port is measuring someone else's tree (lab-demo's rule).
const rawBase = opt("--base", process.env.LAB_BASE ?? "");
if (!rawBase) {
  console.error(
    "album-perf needs the server to measure: --base http://localhost:<your port>",
  );
  process.exit(2);
}
const base = rawBase.replace(/\/+$/, "");

function envKey() {
  try {
    const m = readFileSync(".env.local", "utf8").match(
      /^DESIGN_PREVIEW_KEY=(.*)$/m,
    );
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
  } catch {
    return "";
  }
}
const key = opt("--key", process.env.DESIGN_PREVIEW_KEY ?? envKey());
const layouts = opt("--layouts", "rows,masonry").split(",").filter(Boolean);
const viewports = opt("--viewports", "1440x900,375x812")
  .split(",")
  .filter(Boolean)
  .map((v) => {
    const [w, h] = v.split("x").map(Number);
    return { w, h, mobile: w < 768 };
  });
const count = Number(opt("--n", 1145));
const cpu = Number(opt("--cpu", 1));
const flingMs = Number(opt("--fling-ms", 10_000));
const label = opt("--label", "");
const out = opt("--out", "");
const extra = opt("--query", "");
const checkBudgets = argv.includes("--budgets");
const headed = argv.includes("--headed");
// `--profile`: a CPU profile of each fling, its heaviest functions by self time printed under the run.
const profileFling = argv.includes("--profile");
const callTimeout = 120_000;

const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!existsSync(CHROME)) {
  console.error(`album-perf needs Chrome at ${CHROME} (set CHROME_PATH).`);
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Chrome, over its DevTools protocol (lab-demo.mjs's pattern: Node's own WebSocket, no dependency)
const port = 9900 + (process.pid % 90);
const profile = mkdtempSync(join(tmpdir(), "album-perf-"));
const chrome = spawn(
  CHROME,
  [
    ...(headed ? [] : ["--headless=new"]),
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    // A measured tab must never be throttled as a background one.
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
    "--window-size=1440,900",
    "about:blank",
  ],
  { stdio: "ignore" },
);

let seq = 0;
const pending = new Map();
const listeners = new Set();
function send(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      reject(new Error(`${method} did not answer in ${callTimeout}ms`));
    }, callTimeout);
    pending.set(id, {
      resolve: (v) => (clearTimeout(timer), resolve(v)),
      reject: (e) => (clearTimeout(timer), reject(e)),
    });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function connect() {
  for (let i = 0; i < 80; i++) {
    try {
      const list = await (
        await fetch(`http://127.0.0.1:${port}/json/list`)
      ).json();
      const page = list.find((t) => t.type === "page");
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((r) => (ws.onopen = r));
        ws.onmessage = (m) => {
          const msg = JSON.parse(m.data);
          if (msg.id && pending.has(msg.id)) {
            const p = pending.get(msg.id);
            pending.delete(msg.id);
            if (msg.error) p.reject(new Error(msg.error.message));
            else p.resolve(msg.result);
          } else if (msg.method) for (const l of listeners) l(msg);
        };
        return ws;
      }
    } catch {
      // Chrome is still opening its port.
    }
    await sleep(150);
  }
  throw new Error("Chrome never opened its debugging port");
}
async function evaluate(ws, expression) {
  const r = await send(ws, "Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails)
    throw new Error(
      r.exceptionDetails.exception?.description ?? r.exceptionDetails.text,
    );
  return r.result.value;
}
async function metrics(ws) {
  const { metrics: list } = await send(ws, "Performance.getMetrics");
  return Object.fromEntries(list.map((m) => [m.name, m.value]));
}

// ── In the page, before anything else runs: the observers whose entries are only honest when
// buffered from the first paint (LCP, CLS, long animation frames).
const OBSERVERS = `
  window.__perf = { lcp: null, cls: 0, loaf: [] };
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        const el = e.element;
        window.__perf.lcp = { t: e.startTime, size: e.size, tag: el ? el.tagName : null };
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries())
        window.__perf.loaf.push({ t: e.startTime, d: e.duration, block: e.blockingDuration });
    }).observe({ type: "long-animation-frame", buffered: true });
  } catch (e) { window.__perf.error = String(e); }
`;

// ── In the page, on demand.
const LIB = `
  window.__ap = {
    grid() { return document.querySelector("[data-album-grid]"); },
    nodes() { const g = this.grid(); return g ? g.getElementsByTagName("*").length + 1 : 0; },
    docNodes() { return document.getElementsByTagName("*").length; },
    tiles() { return document.querySelectorAll("[data-album-grid] [data-media-tile][data-media-id]"); },
    inView() {
      const out = [];
      for (const t of this.tiles()) {
        const r = t.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight && r.width > 0) out.push([t.dataset.mediaId, r.left, r.top, r.width, r.height]);
      }
      return out;
    },
    /** Every mounted image in view has decoded (or failed). */
    settled() {
      const pending = [];
      for (const t of this.tiles()) {
        const r = t.getBoundingClientRect();
        if (!(r.bottom > 0 && r.top < innerHeight)) continue;
        const img = t.querySelector("img");
        if (img && !img.complete) pending.push(img.currentSrc || img.src);
      }
      return pending.length;
    },
    animations() {
      const by = {};
      let running = 0;
      for (const a of document.getAnimations()) {
        if (a.playState !== "running") continue;
        running++;
        const name = a.animationName || (a.transitionProperty ? "transition:" + a.transitionProperty : a.constructor.name);
        by[name] = (by[name] || 0) + 1;
      }
      return { running, by };
    },
    /** The first row's photographs: the tiles at the album's smallest top. */
    firstRow() {
      const tiles = [...this.tiles()].map((t) => [t, Math.round(t.getBoundingClientRect().top + scrollY)]);
      if (!tiles.length) return null;
      const top = Math.min(...tiles.map(([, y]) => y));
      const row = tiles.filter(([, y]) => y <= top + 1).map(([t]) => t.querySelector("img")).filter(Boolean);
      const ends = row.map((img) => {
        const e = performance.getEntriesByName(new URL(img.currentSrc || img.src, location.href).href)[0];
        return e ? { start: e.startTime, end: e.responseEnd } : null;
      }).filter(Boolean);
      return {
        count: row.length,
        eager: row.filter((img) => img.loading === "eager").length,
        high: row.filter((img) => img.fetchPriority === "high").length,
        requestStart: ends.length ? Math.min(...ends.map((e) => e.start)) : null,
        responseEnd: ends.length ? Math.max(...ends.map((e) => e.end)) : null,
      };
    },
    /**
     * THE FLING: top to bottom and back over ms, on a cosine profile (still at
     * both ends, fastest mid-way), one scroll a frame; every frame's delta, and
     * the album's node count sampled as it goes.
     */
    fling(ms) {
      return new Promise((resolve) => {
        const max = document.documentElement.scrollHeight - innerHeight;
        const deltas = [];
        let maxNodes = 0;
        let t0 = null;
        let last = null;
        let frame = 0;
        const step = (now) => {
          if (t0 === null) t0 = now;
          if (last !== null) deltas.push(now - last);
          last = now;
          const t = (now - t0) / ms;
          if (t >= 1) {
            scrollTo(0, 0);
            resolve({ deltas, maxNodes, height: max, start: t0, end: now });
            return;
          }
          const leg = t < 0.5 ? t * 2 : (1 - t) * 2;
          scrollTo(0, max * (1 - Math.cos(Math.PI * leg)) / 2);
          if (frame++ % 6 === 0) maxNodes = Math.max(maxNodes, this.nodes());
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    },
    frames(n) {
      return new Promise((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
    },
  };
`;

// ── Per run
/** A CPU profile's heaviest functions by self time: where a janky frame's milliseconds went. */
function selfTimes(profile, top = 14) {
  const dt = new Map();
  const { samples, timeDeltas, nodes } = profile;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (let i = 0; i < samples.length; i++)
    dt.set(samples[i], (dt.get(samples[i]) ?? 0) + (timeDeltas[i] ?? 0));
  const parent = new Map();
  for (const n of nodes) for (const c of n.children ?? []) parent.set(c, n.id);
  const name = (id) => {
    const f = byId.get(id).callFrame;
    const file = f.url.split("/").pop() || "(native)";
    return `${f.functionName || "(anonymous)"} ${file}:${f.lineNumber + 1}`;
  };
  const byFn = new Map();
  for (const [id, us] of dt) {
    // A native call is named with its caller: "getBoundingClientRect" alone
    // says nothing about which code forced the layout.
    const f = byId.get(id).callFrame;
    const via = !f.url && parent.has(id) ? ` <- ${name(parent.get(id))}` : "";
    const k = name(id) + via;
    byFn.set(k, (byFn.get(k) ?? 0) + us);
  }
  return [...byFn.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([k, us]) => `${(us / 1000).toFixed(0)}ms ${k}`);
}

function histogram(deltas) {
  const edges = [8.5, 17.5, 25, 34, 50, Infinity];
  const names = ["<=8", "<=17", "<=25", "<=34", "<=50", ">50"];
  const counts = edges.map(() => 0);
  for (const d of deltas) counts[edges.findIndex((e) => d <= e)]++;
  const sorted = [...deltas].sort((a, b) => a - b);
  const q = (p) =>
    sorted.length
      ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]
      : 0;
  return {
    frames: deltas.length,
    p50: +q(0.5).toFixed(1),
    p95: +q(0.95).toFixed(1),
    p99: +q(0.99).toFixed(1),
    max: +(sorted.at(-1) ?? 0).toFixed(1),
    buckets: Object.fromEntries(names.map((n, i) => [n, counts[i]])),
  };
}

async function waitFor(ws, expression, ms = 30_000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (await evaluate(ws, expression).catch(() => false)) return true;
    await sleep(100);
  }
  return false;
}

async function measure(ws, layout, vp) {
  const net = new Map(); // requestId -> { type, bytes }
  const onNet = (msg) => {
    if (msg.method === "Network.responseReceived") {
      net.set(msg.params.requestId, {
        type: msg.params.type,
        bytes: 0,
        url: msg.params.response.url,
      });
    } else if (msg.method === "Network.loadingFinished") {
      const r = net.get(msg.params.requestId);
      if (r) r.bytes = msg.params.encodedDataLength;
    }
  };
  listeners.add(onNet);
  const bytes = () => {
    const by = {};
    let images = 0;
    for (const r of net.values()) {
      by[r.type] = (by[r.type] || 0) + r.bytes;
      if (r.type === "Image") images++;
    }
    return { by, images, total: Object.values(by).reduce((a, b) => a + b, 0) };
  };

  await send(ws, "Page.navigate", { url: "about:blank" });
  await send(ws, "Network.clearBrowserCache");
  await send(ws, "Emulation.setDeviceMetricsOverride", {
    width: vp.w,
    height: vp.h,
    deviceScaleFactor: vp.mobile ? 3 : 2,
    mobile: vp.mobile,
  });
  await send(
    ws,
    "Emulation.setTouchEmulationEnabled",
    vp.mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false },
  );
  await send(ws, "Emulation.setCPUThrottlingRate", { rate: cpu });
  await send(ws, "Emulation.setFocusEmulationEnabled", { enabled: true });
  net.clear();

  const url = new URL("/design/album-scale", base);
  if (key) url.searchParams.set("key", key);
  url.searchParams.set("layout", layout);
  url.searchParams.set("n", String(count));
  for (const [k, v] of new URLSearchParams(extra)) url.searchParams.set(k, v);
  const navAt = Date.now();
  await send(ws, "Page.navigate", { url: url.toString() });
  if (
    !(await waitFor(
      ws,
      "!!(window.__albumScale && window.__albumScale.ready && document.readyState === 'complete')",
      60_000,
    ))
  )
    throw new Error(
      `the scale page never became ready at ${url.pathname} (is the key right?)`,
    );
  await evaluate(ws, LIB);
  // The images in view decoded, and a quiet beat after (the entrance, the fade-in).
  const until = Date.now() + 20_000;
  while (Date.now() < until && (await evaluate(ws, "__ap.settled()")) > 0)
    await sleep(150);
  await sleep(1200);
  const loadMs = Date.now() - navAt;

  const perf = await evaluate(ws, "window.__perf");
  await send(ws, "HeapProfiler.collectGarbage");
  const m0 = await metrics(ws);
  const load = {
    ms: loadMs,
    albumNodes: await evaluate(ws, "__ap.nodes()"),
    docNodes: await evaluate(ws, "__ap.docNodes()"),
    tilesMounted: await evaluate(ws, "__ap.tiles().length"),
    animations: await evaluate(ws, "__ap.animations()"),
    heapMB: +(m0.JSHeapUsedSize / 1048576).toFixed(1),
    layouts: m0.LayoutCount,
    styleRecalcs: m0.RecalcStyleCount,
    layoutMs: +(m0.LayoutDuration * 1000).toFixed(0),
    styleMs: +(m0.RecalcStyleDuration * 1000).toFixed(0),
    scriptMs: +(m0.ScriptDuration * 1000).toFixed(0),
    transfer: bytes(),
    firstRow: await evaluate(ws, "__ap.firstRow()"),
    lcp: perf.lcp,
    cls: +perf.cls.toFixed(4),
    longFrames: perf.loaf.filter((e) => e.d > 50).map((e) => Math.round(e.d)),
  };

  // The fling.
  const netBefore = bytes().total;
  const loafBefore = (await evaluate(ws, "window.__perf.loaf.length")) ?? 0;
  if (profileFling) {
    await send(ws, "Profiler.enable");
    await send(ws, "Profiler.setSamplingInterval", { interval: 200 });
    await send(ws, "Profiler.start");
  }
  const f = await evaluate(ws, `__ap.fling(${flingMs})`);
  const hot = profileFling
    ? selfTimes((await send(ws, "Profiler.stop")).profile)
    : null;
  const m1 = await metrics(ws);
  const loaf =
    (await evaluate(ws, `window.__perf.loaf.slice(${loafBefore})`)) ?? [];
  await sleep(600);
  const fling = {
    ...histogram(f.deltas),
    scrollPx: f.height,
    peakPxPerS: Math.round(((Math.PI / 2) * f.height) / (flingMs / 2000)),
    maxAlbumNodes: f.maxNodes,
    longFrames: loaf.filter((e) => e.d > 50).map((e) => Math.round(e.d)),
    layouts: m1.LayoutCount - m0.LayoutCount,
    styleRecalcs: m1.RecalcStyleCount - m0.RecalcStyleCount,
    layoutMs: +((m1.LayoutDuration - m0.LayoutDuration) * 1000).toFixed(0),
    styleMs: +(
      (m1.RecalcStyleDuration - m0.RecalcStyleDuration) *
      1000
    ).toFixed(0),
    scriptMs: +((m1.ScriptDuration - m0.ScriptDuration) * 1000).toFixed(0),
    bytes: bytes().total - netBefore,
    ...(hot ? { hot } : {}),
  };

  // At rest, back at the top, once the images in view are in.
  const until2 = Date.now() + 15_000;
  while (Date.now() < until2 && (await evaluate(ws, "__ap.settled()")) > 0)
    await sleep(150);
  await sleep(1500);
  const rest = {
    animations: await evaluate(ws, "__ap.animations()"),
    albumNodes: await evaluate(ws, "__ap.nodes()"),
  };

  // Renders, off the grid's probe: a like, progress ticks, a quiet poll.
  const renders = {};
  await evaluate(ws, "__albumScale.resetRenders()");
  const liked = await evaluate(ws, "__albumScale.like()");
  renders.like = {
    id: liked,
    ...(await evaluate(ws, "__albumScale.renders()")),
  };
  await evaluate(ws, "__albumScale.tick()"); // mounts the in-flight tile
  await evaluate(ws, "__ap.frames(2)");
  await evaluate(ws, "__albumScale.resetRenders()");
  for (let i = 0; i < 10; i++) await evaluate(ws, "__albumScale.tick()");
  const ticks = await evaluate(ws, "__albumScale.renders()");
  renders.tick = { tile: ticks.tile / 10, mark: ticks.mark / 10 };
  await evaluate(ws, "__albumScale.resetRenders()");
  await evaluate(ws, "__albumScale.poll()");
  renders.poll = await evaluate(ws, "__albumScale.renders()");

  // A head arrival while deep: half-way down, settled, then one photograph lands at the head.
  await evaluate(
    ws,
    "scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2)",
  );
  await sleep(1500);
  const before = await evaluate(ws, "__ap.inView()");
  await evaluate(ws, "__albumScale.resetRenders()");
  const cost = await evaluate(ws, "__albumScale.arrive(1)");
  await evaluate(ws, "__ap.frames(2)");
  const soon = await evaluate(ws, "__ap.inView()");
  await sleep(900);
  const settledView = await evaluate(ws, "__ap.inView()");
  const arrivalRenders = await evaluate(ws, "__albumScale.renders()");
  const moved = (after) => {
    const at = new Map(after.map(([id, x, y, w, h]) => [id, [x, y, w, h]]));
    let max = 0;
    let movedTiles = 0;
    for (const [id, x, y, w, h] of before) {
      const a = at.get(id);
      if (!a) continue;
      const d = Math.max(
        Math.abs(a[0] - x),
        Math.abs(a[1] - y),
        Math.abs(a[2] - w),
        Math.abs(a[3] - h),
      );
      if (d > 1) movedTiles++;
      max = Math.max(max, d);
    }
    return { maxPx: +max.toFixed(1), movedTiles, of: before.length };
  };
  const arrival = {
    syncMs: +cost.syncMs.toFixed(1),
    layoutMs: +cost.layoutMs.toFixed(1),
    renders: arrivalRenders,
    afterTwoFrames: moved(soon),
    settled: moved(settledView),
  };

  listeners.delete(onNet);
  return {
    layout,
    viewport: `${vp.w}x${vp.h}`,
    cpu,
    count,
    load,
    fling,
    rest,
    renders,
    arrival,
  };
}

// ── Budgets (the manifest's), read against a run
function budgets(r) {
  return [
    [
      "album nodes <= 2,000 at any scroll",
      Math.max(r.load.albumNodes, r.fling.maxAlbumNodes, r.rest.albumNodes) <=
        2000,
    ],
    // At rest = loaded and looking at the top, images in view decoded (the fling loads every image, so the
    // count after it would flatter any album): what is still running then runs for nobody.
    ["0 running animations at rest", r.load.animations.running === 0],
    ["p95 frame <= 16.7ms", r.fling.p95 <= 17.5],
    ["no long frame > 50ms in the fling", r.fling.longFrames.length === 0],
    // One photograph's parts (its heart mark, its like glyph), and its tile body at most once.
    [
      "a like re-renders <= 1 tile",
      (r.renders.like.ids ?? r.renders.like.tile) <= 1 &&
        r.renders.like.tile <= 1,
    ],
    [
      "a progress tick re-renders 0",
      r.renders.tick.tile === 0 && r.renders.tick.mark === 0,
    ],
    [
      "a quiet poll re-renders 0",
      r.renders.poll.tile === 0 && r.renders.poll.mark === 0,
    ],
    [
      "a head arrival while deep moves nothing",
      r.arrival.settled.maxPx <= 1 && r.arrival.afterTwoFrames.maxPx <= 1,
    ],
    ["a head arrival costs <= 16ms", r.arrival.layoutMs <= 16],
  ];
}

const kb = (n) => `${Math.round(n / 1024)}KB`;
function report(r) {
  const lines = [
    `\n■ ${r.layout} @ ${r.viewport}${r.cpu > 1 ? ` (cpu ${r.cpu}x)` : ""}, ${r.count} photographs`,
    `  load     ${r.load.ms}ms · album nodes ${r.load.albumNodes} (doc ${r.load.docNodes}) · tiles ${r.load.tilesMounted} · heap ${r.load.heapMB}MB`,
    `           layouts ${r.load.layouts} (${r.load.layoutMs}ms) · style ${r.load.styleRecalcs} (${r.load.styleMs}ms) · script ${r.load.scriptMs}ms`,
    `           transfer ${kb(r.load.transfer.total)} (images ${r.load.transfer.images}, ${kb(r.load.transfer.by.Image ?? 0)}) · LCP ${r.load.lcp ? Math.round(r.load.lcp.t) + "ms " + r.load.lcp.tag : "n/a"} · CLS ${r.load.cls}`,
    `           first row: ${r.load.firstRow ? `${r.load.firstRow.count} images, ${r.load.firstRow.eager} eager, ${r.load.firstRow.high} high, in by ${Math.round(r.load.firstRow.responseEnd ?? -1)}ms` : "n/a"}`,
    `           animations running ${r.load.animations.running} ${JSON.stringify(r.load.animations.by)} · long frames ${JSON.stringify(r.load.longFrames)}`,
    `  fling    ${r.fling.frames} frames over ${r.fling.scrollPx}px (peak ${r.fling.peakPxPerS}px/s): p50 ${r.fling.p50} · p95 ${r.fling.p95} · p99 ${r.fling.p99} · max ${r.fling.max}ms`,
    `           ${JSON.stringify(r.fling.buckets)} · long frames ${r.fling.longFrames.length} ${JSON.stringify(r.fling.longFrames.slice(0, 12))}`,
    `           max album nodes ${r.fling.maxAlbumNodes} · layouts ${r.fling.layouts} (${r.fling.layoutMs}ms) · style ${r.fling.styleRecalcs} (${r.fling.styleMs}ms) · script ${r.fling.scriptMs}ms · ${kb(r.fling.bytes)} fetched`,
    ...(r.fling.hot
      ? [`           hot: ${r.fling.hot.join("\n                ")}`]
      : []),
    `  after    animations running ${r.rest.animations.running} ${JSON.stringify(r.rest.animations.by)} · album nodes ${r.rest.albumNodes}`,
    `  renders  like ${r.renders.like.tile} tiles + ${r.renders.like.mark} marks${r.renders.like.ids === undefined ? "" : ` (${r.renders.like.ids} photograph${r.renders.like.ids === 1 ? "" : "s"})`} · tick ${r.renders.tick.tile} + ${r.renders.tick.mark} · poll ${r.renders.poll.tile} + ${r.renders.poll.mark}`,
    `  arrival  sync ${r.arrival.syncMs}ms, to layout ${r.arrival.layoutMs}ms · renders ${r.arrival.renders.tile} tiles · moved: after 2 frames ${r.arrival.afterTwoFrames.maxPx}px (${r.arrival.afterTwoFrames.movedTiles}/${r.arrival.afterTwoFrames.of}), settled ${r.arrival.settled.maxPx}px (${r.arrival.settled.movedTiles}/${r.arrival.settled.of})`,
  ];
  if (checkBudgets)
    for (const [name, ok] of budgets(r))
      lines.push(`  ${ok ? "PASS" : "MISS"} ${name}`);
  console.log(lines.join("\n"));
}

let failed = false;
const results = [];
try {
  const ws = await connect();
  await send(ws, "Page.enable");
  await send(ws, "Runtime.enable");
  await send(ws, "Network.enable");
  await send(ws, "Performance.enable", { timeDomain: "timeTicks" });
  await send(ws, "Page.addScriptToEvaluateOnNewDocument", {
    source: OBSERVERS,
  });
  for (const layout of layouts)
    for (const vp of viewports) {
      const r = await measure(ws, layout, vp);
      results.push(r);
      report(r);
      if (checkBudgets && budgets(r).some(([, ok]) => !ok)) failed = true;
    }
  if (out) {
    writeFileSync(
      out,
      JSON.stringify(
        { label, at: new Date().toISOString(), base, results },
        null,
        2,
      ),
    );
    console.log(`\nwrote ${out}`);
  }
  ws.close();
} catch (e) {
  console.error(e);
  failed = true;
} finally {
  chrome.kill();
  await sleep(500);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    // Chrome still closing its profile: the OS reaps its temp dir.
  }
}
process.exit(failed ? 1 : 0);
