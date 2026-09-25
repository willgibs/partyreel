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
 *
 * THE PAGE MODE (album-guest-wiring, 2026-09-25): the same instrument on the
 * real albums, a guest's `/e/<token>` and a host's, where no `__albumScale`
 * answers, so everything is read off the DOM, the Network and Performance
 * domains and CDP. One run per viewport (`--layouts` is the lab's), each on a
 * clean device: cookies, storage and cache cleared, then seeded.
 *
 *   node scripts/album-perf.mjs --base http://localhost:3131 --page /e/<token> --guest
 *   node scripts/album-perf.mjs --base ... --page /e/<token> --guest --budgets \
 *     --arrive --event-id <the event's uuid>
 *   node scripts/album-perf.mjs --base ... --page <the host's album> --cookie "<name>=$VALUE"
 *
 *   --guest          walks a guest past the door with no steps: `pr_welcome_<token>`
 *                    1, `pr_guest_name_<token>` Perf, `pr_session_<token>` a fixed
 *                    fake ticket (the shape, no row): welcome seen, a name held,
 *                    a returning device.
 *   --storage k=v    (repeatable) into the origin's localStorage before any of the
 *                    page's own scripts run.
 *   --cookie n=v     (repeatable) for the base's host before the page: a signed-in
 *                    host rides their session cookie. ★ A COOKIE VALUE IS A
 *                    CREDENTIAL: pass it from the environment (never typed into
 *                    shell history), never commit it; this prints names only. Copy
 *                    it fresh: a session old enough to refresh here rotates under
 *                    the browser it was copied from.
 *   --arrive --event-id <uuid>
 *                    a head arrival while deep, on real rows: half-way down, the
 *                    album's newest approved photograph is hidden through PostgREST
 *                    and approved again (the service key from the environment or
 *                    `.env.local`, never printed). ★ It is restored in every exit
 *                    path, Ctrl-C included, and its id printed: the scale probe is
 *                    disposable test data, but the restore is non-negotiable.
 *
 * A phone's viewport sends a phone's user agent (still HeadlessChrome, so link
 * analytics skip it): the server lays its first paint out for the class it
 * guesses, and a desktop guess on a phone is a jump this would blame on the
 * page. Past the scale mode's load, fling and rest, a page run reads THE
 * DOCUMENT'S OWN TRANSFER (the navigation's bytes on the wire, headers in, and
 * decoded: the App Router inlines the first RSC payload in it, so this is the
 * first load's HTML and RSC) with any further RSC requests, and A QUIET POLL: a
 * hide and a show (the live poll's catch-up), repeated to a 304 or three polls,
 * because a first poll holds no validator yet and one that heals the ticket
 * cookie is answered without one (the sync route's rule).
 *
 * Its budgets: album nodes <= 2,000 at any point; 0 running animations at rest;
 * the document <= 150 KB on the wire; the quiet poll answered 304 (when one was
 * seen); a head arrival while deep moves nothing (<= 1px, with --arrive); CLS
 * <= 0.02. The `/e/` token is masked in everything printed or written: the link
 * takes uploads, so it never lands in a doc.
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
/** Every `name=value` a repeatable flag was given, split at the first "=" (a cookie's value may hold more). */
const pairs = (flag) =>
  argv.flatMap((a, i) => {
    if (a !== flag) return [];
    const s = argv[i + 1] ?? "";
    const at = s.indexOf("=");
    if (at < 1) {
      // Never echoed: a malformed --cookie is still somebody's credential.
      console.error(`album-perf: ${flag} takes name=value`);
      process.exit(2);
    }
    return [[s.slice(0, at), s.slice(at + 1)]];
  });

// No default base: a lane measuring someone else's port is measuring someone else's tree (lab-demo's rule).
const rawBase = opt("--base", process.env.LAB_BASE ?? "");
if (!rawBase) {
  console.error(
    "album-perf needs the server to measure: --base http://localhost:<your port>",
  );
  process.exit(2);
}
const base = rawBase.replace(/\/+$/, "");

/** A value from the worktree's `.env.local` (beside this script's folder, wherever it runs from), or "". */
function envLocal(name) {
  try {
    const m = readFileSync(
      new URL("../.env.local", import.meta.url),
      "utf8",
    ).match(new RegExp(`^${name}=(.*)$`, "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
  } catch {
    return "";
  }
}
const key = opt(
  "--key",
  process.env.DESIGN_PREVIEW_KEY ?? envLocal("DESIGN_PREVIEW_KEY"),
);
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

// ── The page mode's flags (the head note has each)
const pagePath = opt("--page", "");
const guest = argv.includes("--guest");
const arrive = argv.includes("--arrive");
const eventId = opt("--event-id", "");
const cookies = pairs("--cookie");
const guestToken = pagePath.match(/^\/e\/([^/?#]+)/)?.[1] ?? null;
// The shape of a ticket (64 hex, `session-cookie.ts`) that no guest row holds: a returning device
// to the door, and nothing to the database.
const FAKE_TICKET = "0".repeat(63) + "1";
const storage = [
  ...(guest && guestToken
    ? [
        [`pr_welcome_${guestToken}`, "1"],
        [`pr_guest_name_${guestToken}`, "Perf"],
        [`pr_session_${guestToken}`, FAKE_TICKET],
      ]
    : []),
  ...pairs("--storage"),
];
// Read only for --arrive: the service key goes nowhere else, and is never printed.
const supabase = arrive
  ? {
      url: (
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        envLocal("NEXT_PUBLIC_SUPABASE_URL")
      ).replace(/\/+$/, ""),
      // This repo's service-role key is SUPABASE_SECRET_KEY (`src/lib/env.ts`); the older name is a fallback.
      key:
        process.env.SUPABASE_SECRET_KEY ||
        envLocal("SUPABASE_SECRET_KEY") ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        envLocal("SUPABASE_SERVICE_ROLE_KEY"),
    }
  : null;

const refuse = (why) => {
  console.error(`album-perf: ${why}`);
  process.exit(2);
};
if (!pagePath && (guest || arrive || storage.length || cookies.length))
  refuse(
    "--guest, --storage, --cookie and --arrive are the page mode's: give --page",
  );
if (pagePath && !pagePath.startsWith("/"))
  refuse("--page takes a path on the base, like /e/<token>");
if (guest && !guestToken)
  refuse("--guest seeds a guest's door, so --page must be /e/<token>");
if (
  arrive &&
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    eventId,
  )
)
  refuse("--arrive needs --event-id <the album's event uuid>");
if (arrive && !(supabase.url && supabase.key))
  refuse(
    "--arrive needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env.local or the environment",
  );
const origin = pagePath ? new URL(base).origin : "";
/**
 * The guest link's token, shown by its first four characters in everything printed or written:
 * the link takes uploads, and a report gets pasted into docs (testing-verification.md keeps the
 * scale probe's out of every one).
 */
const mask = (s) =>
  guestToken ? s.split(guestToken).join(`${guestToken.slice(0, 4)}…`) : s;

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
    /** The album's size, as the window writes it on every mounted tile (aria-setsize); null with none mounted. */
    setSize() {
      const el = document.querySelector("[data-album-grid] [aria-setsize]");
      return el ? Number(el.getAttribute("aria-setsize")) : null;
    },
    /**
     * THE PAGE MODE'S ARRIVAL WATCH: resolves two frames after the album's size
     * moves past from (dir -1 below it, a hide; +1 above it, an arrival), or id's
     * tile, mounted when this began, leaves the DOM. Checked every frame, so the
     * two frames count from the commit that wrote the size, give or take one.
     * The view then and the ms since this began; null after ms.
     */
    sizeChange(from, dir, ms, id) {
      const sel = id ? '[data-media-id="' + CSS.escape(id) + '"]' : null;
      const had = sel ? !!document.querySelector(sel) : false;
      const t0 = performance.now();
      return new Promise((resolve) => {
        let done = false;
        const timer = setTimeout(() => { done = true; resolve(null); }, ms);
        const tick = () => {
          if (done) return;
          const size = this.setSize();
          const past = size !== null && (dir < 0 ? size < from : size > from);
          if (past || (had && !document.querySelector(sel))) {
            done = true;
            clearTimeout(timer);
            const at = Math.round(performance.now() - t0);
            this.frames(2).then(() => resolve({ size, at, view: this.inView() }));
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
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

/** The images in view decoded (or `ms` spent waiting), then a quiet beat (the entrance, the fade-in). */
async function settle(ws, ms, beat) {
  const until = Date.now() + ms;
  while (Date.now() < until && (await evaluate(ws, "__ap.settled()")) > 0)
    await sleep(150);
  await sleep(beat);
}

/** The screen, the CPU and a foreground tab, as every run is measured. */
async function emulate(ws, vp) {
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
}

/** The load, read once the images in view are in; `transfer` is each mode's own byte count. */
async function readLoad(ws, ms, transfer) {
  const perf = await evaluate(ws, "window.__perf");
  await send(ws, "HeapProfiler.collectGarbage");
  const m0 = await metrics(ws);
  const load = {
    ms,
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
    transfer: transfer(),
    firstRow: await evaluate(ws, "__ap.firstRow()"),
    lcp: perf.lcp,
    cls: +perf.cls.toFixed(4),
    longFrames: perf.loaf.filter((e) => e.d > 50).map((e) => Math.round(e.d)),
  };
  return { m0, load };
}

/** The fling, against the load's metrics; `total` is the bytes on the wire so far. */
async function readFling(ws, m0, total) {
  const netBefore = total();
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
  return {
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
    bytes: total() - netBefore,
    ...(hot ? { hot } : {}),
  };
}

/** At rest, back at the top, once the images in view are in. */
async function readRest(ws) {
  await settle(ws, 15_000, 1500);
  return {
    animations: await evaluate(ws, "__ap.animations()"),
    albumNodes: await evaluate(ws, "__ap.nodes()"),
  };
}

/** How far any tile in `before` (an `inView()`) moved by `after`: the most, and how many past a pixel. */
function moved(before, after) {
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
  await emulate(ws, vp);
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
  await settle(ws, 20_000, 1200);
  const { m0, load } = await readLoad(ws, Date.now() - navAt, bytes);

  // The fling.
  const fling = await readFling(ws, m0, () => bytes().total);

  // At rest, back at the top, once the images in view are in.
  const rest = await readRest(ws);

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
  const arrival = {
    syncMs: +cost.syncMs.toFixed(1),
    layoutMs: +cost.layoutMs.toFixed(1),
    renders: arrivalRenders,
    afterTwoFrames: moved(before, soon),
    settled: moved(before, settledView),
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

// ── The page mode

/**
 * A page run's requests in the order they started: what each cost on the wire (its
 * `loadingFinished` bytes, headers in), decoded (the `dataReceived` lengths), and how it answered.
 */
function netLog() {
  const all = new Map();
  let order = 0;
  const lower = (h) =>
    Object.fromEntries(
      Object.entries(h ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
    );
  const on = ({ method, params: p }) => {
    if (method === "Network.requestWillBeSent") {
      const had = all.get(p.requestId);
      if (had) {
        had.url = p.request.url; // a redirect: the same request, followed
        return;
      }
      const h = lower(p.request.headers);
      all.set(p.requestId, {
        id: p.requestId,
        order: ++order,
        url: p.request.url,
        method: p.request.method,
        type: p.type ?? null,
        // An App Router flight: the router's header, or its cache-busting param.
        rsc: h.rsc === "1" || /[?&]_rsc=/.test(p.request.url),
        // The album store presents its validator by hand (a POST has no HTTP cache to do it).
        validator: "if-none-match" in h,
        t0: p.timestamp,
        status: null,
        etag: false,
        encoding: null,
        bytes: 0,
        decoded: 0,
        done: false,
        failed: null,
        ms: null,
      });
      return;
    }
    const r = all.get(p?.requestId);
    if (!r) return;
    if (method === "Network.responseReceived") {
      const h = lower(p.response.headers);
      r.type = p.type;
      r.status = p.response.status;
      r.etag = "etag" in h;
      r.encoding = h["content-encoding"] ?? null;
      // The bytes so far (its headers): all a response ends with when its load is cancelled.
      r.bytes = p.response.encodedDataLength ?? 0;
    } else if (method === "Network.dataReceived") {
      r.decoded += p.dataLength;
    } else if (
      method === "Network.loadingFinished" ||
      method === "Network.loadingFailed"
    ) {
      r.done = true;
      r.ms = Math.round((p.timestamp - r.t0) * 1000);
      if (method === "Network.loadingFinished") r.bytes = p.encodedDataLength;
      // ★ A 304 to fetch() arrives, then its load is cancelled (net::ERR_ABORTED: a null-body
      // status leaves nothing to read), and the album store's is exactly that. Answered is
      // answered: only a request with no response failed.
      else if (r.status === null) r.failed = p.errorText;
    }
  };
  return {
    on,
    clear: () => all.clear(),
    get: (id) => all.get(id),
    list: () => [...all.values()],
    mark: () => order,
    since: (mark) => [...all.values()].filter((r) => r.order > mark),
    /** The scale mode's shape: bytes by resource type over everything that answered. */
    bytes() {
      const by = {};
      let images = 0;
      for (const r of all.values()) {
        if (r.status === null) continue;
        by[r.type] = (by[r.type] || 0) + r.bytes;
        if (r.type === "Image") images++;
      }
      return {
        by,
        images,
        total: Object.values(by).reduce((a, b) => a + b, 0),
      };
    },
  };
}

const pathOf = (u) => {
  try {
    return new URL(u).pathname;
  } catch {
    return u;
  }
};

/** The UA strings a run sends, read off this Chrome once it is up (`main`). */
const agents = { desktop: "", phone: "" };
/** A phone's user agent from this Chrome's own: still HeadlessChrome, so link analytics skip it. */
const phoneAgent = (ua) =>
  ua
    .replace(/\([^)]*\)/, "(Linux; Android 10; K)")
    .replace(/ Safari\//, " Mobile Safari/");

/**
 * The origin's storage, seeded before the page's own scripts: a same-origin document that runs
 * none of them (robots.txt) clears sessionStorage (tab-scoped, so no CDP call clears it and a
 * second viewport would inherit the first's) and localStorage, writes the seeds, and the page
 * then navigates in the same tab.
 */
async function seedStorage(ws) {
  const nav = await send(ws, "Page.navigate", { url: `${origin}/robots.txt` });
  if (nav.errorText)
    throw new Error(`nothing answered at ${origin}: ${nav.errorText}`);
  if (
    !(await waitFor(
      ws,
      `location.origin === ${JSON.stringify(origin)} && document.readyState === "complete"`,
      15_000,
    ))
  )
    throw new Error(`${origin}/robots.txt never loaded to seed the storage`);
  await evaluate(
    ws,
    `(() => {
      sessionStorage.clear();
      localStorage.clear();
      for (const [k, v] of ${JSON.stringify(storage)}) localStorage.setItem(k, v);
      return localStorage.length;
    })()`,
  );
}

/** The navigation's own response: on the wire (headers in) and decoded. */
async function readDocument(ws, net, loaderId) {
  // A navigation's request id is its loader id; the first document is the fallback.
  const doc =
    net.get(loaderId) ?? net.list().find((r) => r.type === "Document");
  if (!doc) return null;
  let decoded = doc.decoded;
  if (!decoded) {
    try {
      const { body, base64Encoded } = await send(
        ws,
        "Network.getResponseBody",
        { requestId: doc.id },
      );
      decoded = Buffer.byteLength(body, base64Encoded ? "base64" : "utf8");
    } catch {
      // Out of the buffer: the decoded size stays unknown (0).
    }
  }
  return {
    status: doc.status,
    encoding: doc.encoding ?? "identity",
    bytes: doc.bytes,
    decoded,
  };
}

// The live poll, a guest's or a host's (the album store's sync routes).
const SYNC = /^\/api\/album\/(?:guest|host\/.+)\/sync$/;
// A hide and a show, as a returning tab has them: the poll hook (`use-live-poll.ts`) stops on the
// hide and polls once on the show. Emulated in the page, because no CDP call flips a foreground
// tab's visibility; the real getters return once the show has been heard.
const HIDE_AND_SHOW = `(async () => {
  const set = (hidden) => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
    document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
  };
  set(true);
  await new Promise((r) => setTimeout(r, 250));
  set(false);
  delete document.hidden;
  delete document.visibilityState;
})()`;

/** The first sync request started after `mark`, once it answers; null when none starts in `ms`. */
async function syncAfter(net, mark, ms = 5000) {
  let r = null;
  const until = Date.now() + ms;
  while (!r && Date.now() < until) {
    r = net.since(mark).find((x) => SYNC.test(pathOf(x.url))) ?? null;
    if (!r) await sleep(50);
  }
  if (!r) return null;
  const answered = Date.now() + 15_000;
  while (!r.done && Date.now() < answered) await sleep(50);
  return {
    status: r.status,
    bytes: r.bytes,
    ms: r.ms,
    validator: r.validator,
    etag: r.etag,
    failed: r.failed,
  };
}

/**
 * A QUIET POLL: hide and show until the poll answers 304, three at most. The first may hold no
 * validator (the store has had no 200 to take one from), and one that heals the ticket cookie
 * is answered without one, so the steady state is the last.
 */
async function quietPoll(ws, net) {
  const polls = [];
  for (let i = 0; i < 3; i++) {
    const mark = net.mark();
    await evaluate(ws, HIDE_AND_SHOW);
    const p = await syncAfter(net, mark);
    if (!p) {
      const others = net
        .since(mark)
        .filter((r) => r.type !== "Image")
        .map((r) => `${r.method} ${pathOf(r.url)} ${r.status ?? "…"}`)
        .slice(0, 8);
      return { polls, none: { after: polls.length, others } };
    }
    polls.push(p);
    if (p.status === 304) break;
    await sleep(500);
  }
  return { polls, none: null };
}

// ── The head arrival's rows, through PostgREST with the service key (read above, only for --arrive).
async function postgrest(path, init = {}) {
  const res = await fetch(`${supabase.url}/rest/v1/${path}`, {
    ...init,
    // A new-format key (`sb_secret_…`, this repo's) rides `apikey` alone: it is no JWT, and
    // Supabase's key docs keep it out of `Authorization` (the gateway puts the role's JWT there).
    // A legacy JWT key still carries both.
    headers: {
      apikey: supabase.key,
      ...(supabase.key.startsWith("sb_")
        ? {}
        : { Authorization: `Bearer ${supabase.key}` }),
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok)
    throw new Error(
      `PostgREST ${init.method ?? "GET"} /${path.split("?")[0]} answered ${res.status}: ${(await res.text()).slice(0, 200)}`,
    );
  return res;
}
async function newestApproved() {
  const rows = await (
    await postgrest(
      `media?event_id=eq.${eventId}&status=eq.approved&order=created_at.desc,id.desc&limit=1&select=id`,
    )
  ).json();
  return rows[0]?.id ?? null;
}
async function readStatus(id) {
  const rows = await (
    await postgrest(`media?id=eq.${id}&select=status`)
  ).json();
  return rows[0]?.status ?? null;
}
// The write in flight, so an interrupt waits it out before restoring: a hide that lands after the
// restore read "approved" would stay.
let writing = Promise.resolve();
function setStatus(id, status) {
  const p = postgrest(`media?id=eq.${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ status }),
  });
  writing = p.catch(() => {});
  return p;
}
/** A media id hidden by --arrive and not yet read back approved. */
let flipped = null;
/** The row reads approved again, or is set so (three tries), or a human is told exactly how. */
async function ensureApproved(id) {
  for (let tries = 0; tries < 4; tries++) {
    if (tries) await sleep(1000);
    try {
      if ((await readStatus(id)) === "approved") {
        console.log(`  arrival: media ${id} reads approved again`);
        return true;
      }
      if (tries < 3) await setStatus(id, "approved");
    } catch (e) {
      console.error(`  arrival: restoring media ${id}: ${e.message}`);
    }
  }
  console.error(
    `\n★ MEDIA ${id} (event ${eventId}) MAY STILL BE HIDDEN. Restore it by hand: update public.media set status = 'approved' where id = '${id}';`,
  );
  return false;
}
/** Arms the page's watch without awaiting it: the write it waits for comes next. */
const watchSize = (ws, from, dir, id = null) =>
  evaluate(
    ws,
    `void (window.__sizeWatch = __ap.sizeChange(${from}, ${dir}, 15000, ${JSON.stringify(id)}))`,
  );

/**
 * A HEAD ARRIVAL WHILE DEEP, on real rows: half-way down and settled, the album's newest approved
 * photograph is hidden and, once the page has it, approved again, which lands it back at the head
 * (the doorbell or the poll delivers each). Measured as the scale mode's is: how far every tile
 * that was on screen moved two frames after the page had it, and once settled.
 */
async function headArrival(ws) {
  let id = null;
  try {
    id = await newestApproved();
    if (!id) return { id, error: `no approved media on event ${eventId}` };
    console.log(
      `  arrival: hiding media ${id} (the album's newest) and approving it again`,
    );
    await evaluate(
      ws,
      "scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2)",
    );
    await settle(ws, 15_000, 1500);
    const size = await evaluate(ws, "__ap.setSize()");
    if (size === null)
      return { id, error: "no mounted tile carries the album's aria-setsize" };
    await watchSize(ws, size, -1, id);
    flipped = id;
    await setStatus(id, "hidden");
    const hid = await evaluate(ws, "window.__sizeWatch");
    if (!hid) return { id, error: "the hide did not reach the page in 15s" };
    await sleep(1500);
    const before = await evaluate(ws, "__ap.inView()");
    if (!before.length)
      return { id, error: "no tile was in view half-way down" };
    const hidden = await evaluate(ws, "__ap.setSize()");
    if (hidden === null)
      return { id, error: "no mounted tile carries the album's aria-setsize" };
    await watchSize(ws, hidden, 1);
    await setStatus(id, "approved");
    const back = await evaluate(ws, "window.__sizeWatch");
    if (!back)
      return {
        id,
        hideMs: hid.at,
        error: "the arrival did not reach the page in 15s",
      };
    await sleep(900);
    const settledView = await evaluate(ws, "__ap.inView()");
    return {
      id,
      hideMs: hid.at,
      arriveMs: back.at,
      afterTwoFrames: moved(before, back.view),
      settled: moved(before, settledView),
    };
  } catch (e) {
    // A refused write or an unreachable PostgREST is this measurement's miss, not the run's end.
    return { id, error: e.message };
  } finally {
    if (flipped) {
      await ensureApproved(flipped);
      flipped = null;
    }
  }
}

async function measurePage(ws, vp) {
  const net = netLog();
  listeners.add(net.on);
  try {
    // A clean device each run: an earlier run's cookies (a width class, a healed ticket), storage
    // and cache would make this viewport a returning visit to the last one's layout.
    await send(ws, "Page.navigate", { url: "about:blank" });
    await send(ws, "Network.clearBrowserCache");
    await send(ws, "Network.clearBrowserCookies");
    await send(ws, "Storage.clearDataForOrigin", {
      origin,
      storageTypes: "all",
    });
    await seedStorage(ws);
    for (const [name, value] of cookies)
      await send(ws, "Network.setCookie", {
        name,
        value,
        url: `${origin}/`,
        path: "/",
      });
    await send(ws, "Emulation.setUserAgentOverride", {
      userAgent: vp.mobile ? agents.phone : agents.desktop,
    });
    await emulate(ws, vp);
    net.clear();

    const url = new URL(pagePath, base);
    for (const [k, v] of new URLSearchParams(extra)) url.searchParams.set(k, v);
    const navAt = Date.now();
    const nav = await send(ws, "Page.navigate", { url: url.toString() });
    if (nav.errorText)
      throw new Error(`${mask(pagePath)} did not load: ${nav.errorText}`);
    if (
      !(await waitFor(
        ws,
        `document.readyState === "complete" && !!document.querySelector("[data-album-grid] [data-media-tile][data-media-id]")`,
        60_000,
      ))
    )
      throw new Error(
        `the album never showed at ${mask(pagePath)} (document ${net.get(nav.loaderId)?.status ?? "unanswered"}): is the path right, and the door open (--guest, --cookie)?`,
      );
    await evaluate(ws, LIB);
    await settle(ws, 20_000, 1200);
    const { m0, load } = await readLoad(ws, Date.now() - navAt, () =>
      net.bytes(),
    );
    load.albumSize = await evaluate(ws, "__ap.setSize()");
    load.document = await readDocument(ws, net, nav.loaderId);
    const rsc = net.list().filter((r) => r.rsc);
    load.rsc = {
      requests: rsc.length,
      bytes: rsc.reduce((a, r) => a + r.bytes, 0),
      paths: rsc.map((r) => pathOf(r.url)),
    };

    const fling = await readFling(ws, m0, () => net.bytes().total);
    const rest = await readRest(ws);
    const poll = await quietPoll(ws, net);
    const arrival = arrive ? await headArrival(ws) : null;
    return {
      page: pagePath,
      viewport: `${vp.w}x${vp.h}`,
      cpu,
      load,
      fling,
      rest,
      poll,
      arrival,
    };
  } finally {
    listeners.delete(net.on);
  }
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

/** The page mode's (the lane's manifest); null is "not measured this run", never a pass or a miss. */
function pageBudgets(r) {
  const a = r.arrival;
  const lastPoll = r.poll.polls.at(-1);
  return [
    [
      "album nodes <= 2,000 at any point",
      Math.max(r.load.albumNodes, r.fling.maxAlbumNodes, r.rest.albumNodes) <=
        2000,
    ],
    // Both rests: loaded at the top, and back there after the fling, which mounts rows the load
    // never did (whatever they start has to stop too).
    [
      "0 running animations at rest",
      r.load.animations.running === 0 && r.rest.animations.running === 0,
    ],
    [
      "the document <= 150 KB on the wire",
      !!r.load.document && r.load.document.bytes <= 150 * 1024,
    ],
    ["the quiet poll answered 304", lastPoll ? lastPoll.status === 304 : null],
    [
      "a head arrival while deep moves nothing",
      a
        ? !a.error && a.settled.maxPx <= 1 && a.afterTwoFrames.maxPx <= 1
        : null,
    ],
    ["CLS <= 0.02", r.load.cls <= 0.02],
  ];
}

const kb = (n) => `${Math.round(n / 1024)}KB`;
/** A small response (a 304, a delta) in tenths of a KB, where whole KB would read 0. */
const kb1 = (n) => (n < 10_240 ? `${(n / 1024).toFixed(1)}KB` : kb(n));
function flingLines(f) {
  return [
    `  fling    ${f.frames} frames over ${f.scrollPx}px (peak ${f.peakPxPerS}px/s): p50 ${f.p50} · p95 ${f.p95} · p99 ${f.p99} · max ${f.max}ms`,
    `           ${JSON.stringify(f.buckets)} · long frames ${f.longFrames.length} ${JSON.stringify(f.longFrames.slice(0, 12))}`,
    `           max album nodes ${f.maxAlbumNodes} · layouts ${f.layouts} (${f.layoutMs}ms) · style ${f.styleRecalcs} (${f.styleMs}ms) · script ${f.scriptMs}ms · ${kb(f.bytes)} fetched`,
    ...(f.hot ? [`           hot: ${f.hot.join("\n                ")}`] : []),
  ];
}
function report(r) {
  const lines = [
    `\n■ ${r.layout} @ ${r.viewport}${r.cpu > 1 ? ` (cpu ${r.cpu}x)` : ""}, ${r.count} photographs`,
    `  load     ${r.load.ms}ms · album nodes ${r.load.albumNodes} (doc ${r.load.docNodes}) · tiles ${r.load.tilesMounted} · heap ${r.load.heapMB}MB`,
    `           layouts ${r.load.layouts} (${r.load.layoutMs}ms) · style ${r.load.styleRecalcs} (${r.load.styleMs}ms) · script ${r.load.scriptMs}ms`,
    `           transfer ${kb(r.load.transfer.total)} (images ${r.load.transfer.images}, ${kb(r.load.transfer.by.Image ?? 0)}) · LCP ${r.load.lcp ? Math.round(r.load.lcp.t) + "ms " + r.load.lcp.tag : "n/a"} · CLS ${r.load.cls}`,
    `           first row: ${r.load.firstRow ? `${r.load.firstRow.count} images, ${r.load.firstRow.eager} eager, ${r.load.firstRow.high} high, in by ${Math.round(r.load.firstRow.responseEnd ?? -1)}ms` : "n/a"}`,
    `           animations running ${r.load.animations.running} ${JSON.stringify(r.load.animations.by)} · long frames ${JSON.stringify(r.load.longFrames)}`,
    ...flingLines(r.fling),
    `  after    animations running ${r.rest.animations.running} ${JSON.stringify(r.rest.animations.by)} · album nodes ${r.rest.albumNodes}`,
    `  renders  like ${r.renders.like.tile} tiles + ${r.renders.like.mark} marks${r.renders.like.ids === undefined ? "" : ` (${r.renders.like.ids} photograph${r.renders.like.ids === 1 ? "" : "s"})`} · tick ${r.renders.tick.tile} + ${r.renders.tick.mark} · poll ${r.renders.poll.tile} + ${r.renders.poll.mark}`,
    `  arrival  sync ${r.arrival.syncMs}ms, to layout ${r.arrival.layoutMs}ms · renders ${r.arrival.renders.tile} tiles · moved: after 2 frames ${r.arrival.afterTwoFrames.maxPx}px (${r.arrival.afterTwoFrames.movedTiles}/${r.arrival.afterTwoFrames.of}), settled ${r.arrival.settled.maxPx}px (${r.arrival.settled.movedTiles}/${r.arrival.settled.of})`,
  ];
  if (checkBudgets)
    for (const [name, ok] of budgets(r))
      lines.push(`  ${ok ? "PASS" : "MISS"} ${name}`);
  console.log(lines.join("\n"));
}

function pollLine(p) {
  const one = (x) =>
    x.failed
      ? `failed (${x.failed})`
      : `${x.status ?? "unanswered"} ${kb1(x.bytes)} ${x.ms ?? "?"}ms${x.validator ? "" : " (no validator held)"}${x.status === 200 && !x.etag ? " (no ETag back)" : ""}`;
  const seen = p.polls.map(one).join(" → ");
  if (!p.none) return seen;
  const none = `no poll ${p.none.after ? "on the next hide and show" : "within 5s of a hide and show"}${p.none.others.length ? ` (fetched: ${p.none.others.join(", ")})` : ""}`;
  return seen ? `${seen} → ${none}` : none;
}
function arrivalLine(a) {
  if (a.error) return `${a.id ? `media ${a.id}: ` : ""}${a.error}`;
  return `media ${a.id}: gone ${a.hideMs}ms after its write, back ${a.arriveMs}ms after its write · moved: after 2 frames ${a.afterTwoFrames.maxPx}px (${a.afterTwoFrames.movedTiles}/${a.afterTwoFrames.of}), settled ${a.settled.maxPx}px (${a.settled.movedTiles}/${a.settled.of})`;
}
function reportPage(r) {
  const d = r.load.document;
  const lines = [
    `\n■ ${r.page} @ ${r.viewport}${r.cpu > 1 ? ` (cpu ${r.cpu}x)` : ""}, ${r.load.albumSize ?? "?"} in the album`,
    `  load     ${r.load.ms}ms · album nodes ${r.load.albumNodes} (doc ${r.load.docNodes}) · tiles ${r.load.tilesMounted} · heap ${r.load.heapMB}MB`,
    `           layouts ${r.load.layouts} (${r.load.layoutMs}ms) · style ${r.load.styleRecalcs} (${r.load.styleMs}ms) · script ${r.load.scriptMs}ms`,
    `           document ${d ? `${kb1(d.bytes)} on the wire (${d.encoding}, headers in), ${d.decoded ? kb1(d.decoded) : "?"} decoded, ${d.status}` : "n/a"} · rsc after it ${r.load.rsc.requests} (${kb1(r.load.rsc.bytes)})`,
    `           transfer ${kb(r.load.transfer.total)} (images ${r.load.transfer.images}, ${kb(r.load.transfer.by.Image ?? 0)}) · LCP ${r.load.lcp ? Math.round(r.load.lcp.t) + "ms " + r.load.lcp.tag : "n/a"} · CLS ${r.load.cls}`,
    `           first row: ${r.load.firstRow ? `${r.load.firstRow.count} images, ${r.load.firstRow.eager} eager, ${r.load.firstRow.high} high, in by ${Math.round(r.load.firstRow.responseEnd ?? -1)}ms` : "n/a"}`,
    `           animations running ${r.load.animations.running} ${JSON.stringify(r.load.animations.by)} · long frames ${JSON.stringify(r.load.longFrames)}`,
    ...flingLines(r.fling),
    `  after    animations running ${r.rest.animations.running} ${JSON.stringify(r.rest.animations.by)} · album nodes ${r.rest.albumNodes}`,
    `  poll     ${pollLine(r.poll)}`,
    ...(r.arrival ? [`  arrival  ${arrivalLine(r.arrival)}`] : []),
  ];
  if (checkBudgets)
    for (const [name, ok] of pageBudgets(r))
      lines.push(`  ${ok === null ? "n/a " : ok ? "PASS" : "MISS"} ${name}`);
  console.log(mask(lines.join("\n")));
}

// An interrupt mid-arrival restores the row before it goes (a second Ctrl-C forces the exit).
if (arrive)
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, async () => {
      if (flipped) {
        console.error(`\n${signal}: restoring media ${flipped} first`);
        await writing;
        await ensureApproved(flipped);
      }
      chrome.kill();
      await sleep(300);
      try {
        rmSync(profile, { recursive: true, force: true });
      } catch {
        // Chrome still closing its profile: the OS reaps its temp dir.
      }
      process.exit(signal === "SIGINT" ? 130 : 143);
    });

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
  if (pagePath) {
    agents.desktop = await evaluate(ws, "navigator.userAgent");
    agents.phone = phoneAgent(agents.desktop);
    const seeded = [
      ...storage.map(([k]) => k),
      ...cookies.map(([n]) => `cookie ${n}`),
    ];
    console.log(
      mask(
        `album-perf: ${pagePath} on ${base}${seeded.length ? `, seeded ${seeded.join(", ")} (values not shown)` : ""}`,
      ),
    );
    for (const vp of viewports) {
      const r = await measurePage(ws, vp);
      results.push(r);
      reportPage(r);
      if (checkBudgets && pageBudgets(r).some(([, ok]) => ok === false))
        failed = true;
    }
  } else
    for (const layout of layouts)
      for (const vp of viewports) {
        const r = await measure(ws, layout, vp);
        results.push(r);
        report(r);
        if (checkBudgets && budgets(r).some(([, ok]) => !ok)) failed = true;
      }
  if (out) {
    const at = new Date().toISOString();
    writeFileSync(
      out,
      pagePath
        ? mask(
            JSON.stringify(
              {
                label,
                at,
                base,
                page: pagePath,
                // Names only: a cookie's value is a credential.
                seeded: {
                  storage: storage.map(([k]) => k),
                  cookies: cookies.map(([n]) => n),
                },
                results,
              },
              null,
              2,
            ),
          )
        : JSON.stringify({ label, at, base, results }, null, 2),
    );
    console.log(`\nwrote ${out}`);
  }
  ws.close();
} catch (e) {
  console.error(pagePath ? mask(String(e?.stack ?? e)) : e);
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
