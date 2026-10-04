/**
 * THE EVENT MODEL (compute-model): what real events cost Vercel, from the measured scenarios (`run.mjs`) and stated
 * assumptions about how people behave. Every assumption is a named number with its reason; change one and the
 * projection follows. Pure: `project(results)` takes a run's results and returns rows.
 *
 * WE SCALE BY THE EVENT. One host brings a room: a 100-guest wedding, then 100 hosts with 10,000 guests on one
 * Sunday. So the unit costs are per guest action (a join, a burst of ten photos, an hour of a lit album), and an
 * event is guests x actions.
 *
 * Two prices for a call, because neither is exact:
 *   - AT 44 MS A CALL, the team's own measurement (`usher/kit/vercel-usage.mjs`: 3h 56m of Active CPU over 320,789
 *     calls, 2026-10-04). A blunt average of a red-team-heavy mix (host and lab pages, cold starts), so it over-prices
 *     a cheap call (a quiet poll, a proxy run with no session) and under-prices a page render.
 *   - CALIBRATED: each call's own local CPU times the ratio of 44 ms to this machine's average CPU per call over the
 *     measured mix. It keeps a poll cheap and a page dear; the ratio carries Vercel's slower cores, cold starts and
 *     Sentry (off locally), and is only as good as the measured mix resembles the one that spent the 3h 56m.
 *
 * THE LEVERS (`LEVERS`) are what-ifs on the same measured ledger: each says which measured calls it removes or
 * shrinks, so its saving is the ledger's own number, never a guess about a build that does not exist yet.
 */

/** Vercel's prices and Hobby's allowance (vercel.com/pricing, /docs/functions/usage-and-pricing, /docs/limits/fair-use-guidelines; read 2026-10-04). */
export const VERCEL = {
  observedMsPerCall: 44.1, // 14,160 s / 320,789 calls
  hobby: {
    cpuHours: 4,
    invocations: 1_000_000,
    memoryGbHours: 360,
    cdnRequests: 1_000_000,
  },
  pro: {
    seatUsd: 20, // a month, with $20 of usage credit included
    creditUsd: 20,
    cpuHourUsd: 0.128, // iad1 (Washington, D.C., the default region); others up to $0.221
    invocationsPerMillionUsd: 0.6,
    memoryGbHourUsd: 0.0106, // iad1
    memoryGb: 2, // billed while a request is in flight: an upper bound, since Fluid shares an instance
    cdnRequestsIncluded: 10_000_000,
    cdnRequestsPerMillionUsd: 2,
  },
};

/** Cloudflare Workers (developers.cloudflare.com/workers/platform/pricing, read 2026-10-04). */
export const WORKERS = {
  free: { requestsPerDay: 100_000, cpuMsPerInvocation: 10 },
  paid: {
    usd: 5,
    requestsIncluded: 10_000_000,
    requestsPerMillionUsd: 0.3,
    cpuMsIncluded: 30_000_000,
    cpuMsPerMillionUsd: 0.02,
  },
};

/** HOW PEOPLE BEHAVE (each a guess with its reason; the Advisor and Will should move them). */
export const ASSUMPTIONS = {
  wedding: {
    guests: 100,
    hours: 4,
    // Every guest opens the link and passes the door once.
    joinsPerGuest: 1,
    // Ten photos at a time (the scenario's unit), once each: 1,000 photos, a full wedding album.
    burstsPerGuest: 1,
    // A phone's album open AND lit, in total over the event: phones live in pockets, and a hidden tab polls nothing.
    visibleHoursPerGuest: 0.5,
    // Each time a guest opens the link again (the QR, a text) or reloads: a returning guest's full load.
    reopensPerGuest: 3,
    // Each time she brings the tab back from the background: one catch-up sync (`use-live-poll.ts`).
    tabReturnsPerGuest: 6,
    // The viewer, twenty photos (the scenario's unit), once each.
    viewerSessionsPerGuest: 1,
    // One guest in five takes everything home (Select, All, Save); the host takes it once.
    downloadsPerGuest: 0.2,
    // A laptop or TV with the album up and lit for the whole event (a slideshow, a guest's laptop).
    screens: 2,
    // The host's dashboard sessions on the day.
    hostSessions: 4,
    // The week after: each guest opens the album once more and keeps it lit ten minutes (the doorbell quiet).
    afterReopensPerGuest: 1,
    afterVisibleHoursPerGuest: 10 / 60,
  },
  // Will's warning, as numbers: tabs left open for hours, and the doorbell down where a venue's wifi refuses
  // websockets (the 12 s fallback poll).
  heavy: { tabsOpenFraction: 0.2, tabHours: 8, screensDown: 2 },
  month: {
    events: 100,
    // Marketing: people reading the site (five pages each, the visitor scenario) and crawlers (search and AI bots).
    visitors: 5_000,
    crawlerPages: 30_000,
    // Each host's sessions over the month beyond the day itself (setup, curation, the reel, sharing).
    hostSessionsPerEvent: 10,
  },
  // Until a host session is measured (`--host-cookie-env`), a session is priced as five returning loads of the guest's
  // album, the heaviest page measured (the host's pages render the same album and more).
  hostSessionStandInLoads: 5,
};

// ── Arithmetic over a ledger's sums ─────────────────────────────────────────────────────────────
const WHERE = ["page", "api", "prefetch", "cdn"];
const FIELDS = [
  "calls",
  "proxyCalls",
  "fnCalls",
  "vercelCpuMs",
  "requests",
  "fnWallMs",
];
const r2 = (n) => Math.round(n * 100) / 100;

/**
 * A ledger's records, summed: calls (a proxy run and a function each count one), the CPU Vercel would bill, and
 * WHERE THE PROXY RAN: a page or its RSC rendering on a function (`page`, where a session can matter), an API route
 * or Server Function (`api`), a prefetch (`prefetch`), and what the CDN serves anyway (`cdn`: a static page, a public
 * file). The last three are what a narrower matcher saves. `api` also carries the API routes' own function calls and
 * CPU (`apiFn`), what a Worker would take over.
 */
export function summarize(recs) {
  const s = {
    requests: recs.length,
    calls: 0,
    proxyCalls: 0,
    fnCalls: 0,
    vercelCpuMs: 0,
    proxyCpuMs: 0,
    localCpuMs: 0,
    fnWallMs: 0,
    proxyOn: {},
    apiFn: { calls: 0, cpuMs: 0 },
    byRoute: {},
  };
  for (const k of WHERE) s.proxyOn[k] = { calls: 0, cpuMs: 0 };
  for (const r of recs) {
    s.calls += r.calls;
    s.proxyCalls += r.proxy ? 1 : 0;
    s.fnCalls += r.fn ? 1 : 0;
    s.vercelCpuMs += r.vercelCpuMs;
    s.proxyCpuMs += r.proxy ? r.proxyCpuMs : 0;
    s.localCpuMs += r.cpuMs;
    s.fnWallMs += r.fn ? r.wallMs : 0;
    const isApi = r.kind === "api" || r.kind === "action";
    if (r.proxy) {
      const where =
        r.kind === "prefetch"
          ? "prefetch"
          : isApi
            ? "api"
            : r.fn
              ? "page"
              : "cdn";
      s.proxyOn[where].calls += 1;
      s.proxyOn[where].cpuMs = r2(s.proxyOn[where].cpuMs + r.proxyCpuMs);
    }
    if (isApi && r.fn) {
      s.apiFn.calls += 1;
      s.apiFn.cpuMs = r2(
        s.apiFn.cpuMs + r.vercelCpuMs - (r.proxy ? r.proxyCpuMs : 0),
      );
    }
    if (!r.calls) continue;
    const key = `${r.method} ${r.kind} ${r.route ?? r.path}`;
    const b = (s.byRoute[key] ??= { count: 0, calls: 0, vercelCpuMs: 0 });
    b.count += 1;
    b.calls += r.calls;
    b.vercelCpuMs = r2(b.vercelCpuMs + r.vercelCpuMs);
  }
  for (const k of ["vercelCpuMs", "proxyCpuMs", "localCpuMs"]) s[k] = r2(s[k]);
  return s;
}

export const ZERO = {
  ...Object.fromEntries(FIELDS.map((f) => [f, 0])),
  proxyOn: Object.fromEntries(WHERE.map((w) => [w, { calls: 0, cpuMs: 0 }])),
  apiFn: { calls: 0, cpuMs: 0 },
};
/** a + b x k, over every summed field (a unit's byRoute is dropped: sums only). */
export function add(a, b, k = 1) {
  const o = {
    ...Object.fromEntries(
      FIELDS.map((f) => [f, (a[f] ?? 0) + (b[f] ?? 0) * k]),
    ),
  };
  o.proxyOn = Object.fromEntries(
    WHERE.map((w) => [
      w,
      {
        calls: (a.proxyOn?.[w]?.calls ?? 0) + (b.proxyOn?.[w]?.calls ?? 0) * k,
        cpuMs: (a.proxyOn?.[w]?.cpuMs ?? 0) + (b.proxyOn?.[w]?.cpuMs ?? 0) * k,
      },
    ]),
  );
  o.apiFn = {
    calls: (a.apiFn?.calls ?? 0) + (b.apiFn?.calls ?? 0) * k,
    cpuMs: (a.apiFn?.cpuMs ?? 0) + (b.apiFn?.cpuMs ?? 0) * k,
  };
  if (a.worker || b.worker)
    o.worker = {
      requests: (a.worker?.requests ?? 0) + (b.worker?.requests ?? 0) * k,
      cpuMs: (a.worker?.cpuMs ?? 0) + (b.worker?.cpuMs ?? 0) * k,
    };
  return o;
}
export const scale = (u, k) => add(ZERO, u, k);

/** The unit costs a run measured (see `run.mjs` for how each is cut from its scenario). */
export function units(results) {
  const s = results.scenarios;
  const need = (name) => {
    const m = s[name];
    return !m || m.skipped || m.error ? null : m;
  };
  const join = need("guest-join-upload")?.units;
  const live = need("guest-hour-live")?.units;
  const down = need("guest-hour-down")?.units;
  const crawler = need("crawler-50");
  const host = need("host-dashboard");
  const u = {
    join: join?.join ?? null,
    burst: join?.upload ?? null,
    // What one burst of uploads costs each OTHER lit album (its doorbell's syncs), measured on a second phone.
    burstHeard: join?.listener ?? null,
    load: live?.load ?? null,
    liveHour: live?.hour ?? null,
    downHour: down?.hour ?? null,
    viewer20: need("guest-viewer-20"),
    download: need("guest-download"),
    crawlerPage: crawler ? scale(crawler, 1 / (crawler.pages || 50)) : null,
    visitor: need("visitor-5-pages"),
    hostSession: host,
    hostEstimated: !host,
  };
  if (!u.hostSession && u.load)
    u.hostSession = scale(u.load, ASSUMPTIONS.hostSessionStandInLoads);
  return u;
}

// ── The levers, as what-ifs on the measured units ───────────────────────────────────────────────
/** Drop the proxy's runs of the given kinds from a unit (its calls and its CPU). */
function dropProxy(u, kinds) {
  if (!u) return u;
  const o = scale(u, 1);
  for (const w of kinds) {
    const p = u.proxyOn?.[w] ?? { calls: 0, cpuMs: 0 };
    o.calls -= p.calls;
    o.proxyCalls -= p.calls;
    o.vercelCpuMs -= p.cpuMs;
    o.proxyOn[w] = { calls: 0, cpuMs: 0 };
  }
  return o;
}
/** Take a unit's API routes (and the proxy's runs on them) off Vercel, onto a Worker, keeping their count and CPU. */
function toWorker(u) {
  if (!u) return u;
  const p = u.proxyOn?.api ?? { calls: 0, cpuMs: 0 };
  const o = scale(u, 1);
  o.calls -= u.apiFn.calls + p.calls;
  o.fnCalls -= u.apiFn.calls;
  o.proxyCalls -= p.calls;
  o.vercelCpuMs -= u.apiFn.cpuMs + p.cpuMs;
  o.proxyOn.api = { calls: 0, cpuMs: 0 };
  o.worker = {
    requests: (u.worker?.requests ?? 0) + u.apiFn.calls,
    cpuMs: (u.worker?.cpuMs ?? 0) + u.apiFn.cpuMs,
  };
  o.apiFn = { calls: 0, cpuMs: 0 };
  return o;
}

export const LEVERS = {
  proxy: {
    title: "the proxy only where a session matters",
    how: "the matcher drops API routes, prefetches and CDN-served paths (static pages, public files); it keeps the pages that render a session",
  },
  rest: {
    title: "polls that rest",
    how: "the 60 s safety net stretches to 5 min after 10 min lit, and stops after 2 h without a touch (the doorbell still rings); the 12 s fallback stretches to 60 s while nothing changes",
  },
  cdn: {
    title: "the album's version from the CDN",
    how: "a quiet poll is a CDN hit on a per-event version (s-maxage, its path off the proxy), never a function; a change still costs each lit album its own delta",
  },
  shared: {
    title: "and the change itself shared",
    how: "a burst's delta, cached per event and version, is one origin call per event per tick where each lit album paid its own (modeled at a fifth of today's per-album cost); only for viewers a cached answer may reach (an open album's full access)",
  },
  batch: {
    title: "batched presign and complete",
    how: "one presign and one complete per burst instead of one each per photo, the complete carrying the new rows' links so the uploader's album needs one sync, not one per photo",
  },
  worker: {
    title: "the guest API on a Cloudflare Worker",
    how: "every guest API route (the album's sync and links, presign, complete, the door, her own rows, the export mint) answered by a Worker; its requests priced at Workers Paid",
  },
};

/** One lever applied to the units (`rest` acts on the plan, in `wedding`). */
function applyLever(u, lever) {
  const map = (f) =>
    Object.fromEntries(
      Object.entries(u).map(([k, v]) => [
        k,
        v && typeof v === "object" ? f(v, k) : v,
      ]),
    );
  if (lever === "proxy")
    return map((v) => dropProxy(v, ["api", "prefetch", "cdn"]));
  if (lever === "worker") return map((v) => toWorker(v));
  if (lever === "cdn")
    return {
      ...u,
      // A quiet hour keeps one origin call: the hourly link re-mint (a quiet poll is a CDN hit).
      liveHour: u.liveHour
        ? scale(u.liveHour, 1 / Math.max(1, u.liveHour.calls / 2))
        : u.liveHour,
      downHour: u.downHour
        ? scale(u.downHour, 1 / Math.max(1, u.downHour.calls / 2))
        : u.downHour,
    };
  if (lever === "shared")
    return {
      ...u,
      burstHeard: u.burstHeard ? scale(u.burstHeard, 0.2) : u.burstHeard,
    };
  if (lever === "batch" && u.burst) {
    // Measured: presign and complete are 2 calls each per photo (proxy and function); the uploader's own album syncs
    // and mints links as each lands. Batched: one presign and one complete for the ten, a third of presign's CPU and
    // seven tenths of complete's (its per-row RPC and HEAD stay), and a fifth of the self-syncs.
    const by = (re) =>
      Object.entries(u.burst.byRoute ?? {})
        .filter(([k]) => re.test(k))
        .reduce(
          (s, [, b]) => ({
            calls: s.calls + b.calls,
            cpu: s.cpu + b.vercelCpuMs,
          }),
          { calls: 0, cpu: 0 },
        );
    const presign = by(/presign-upload/);
    const complete = by(/complete-upload/);
    const self = by(/album\/guest\/(sync|media)/);
    const callsCut =
      presign.calls - 2 + (complete.calls - 2) + self.calls * 0.8;
    const cpuCut = presign.cpu * (2 / 3) + complete.cpu * 0.3 + self.cpu * 0.8;
    const b = scale(u.burst, 1);
    b.calls -= callsCut;
    b.fnCalls -= callsCut / 2;
    b.proxyCalls -= callsCut / 2;
    b.vercelCpuMs -= cpuCut;
    b.apiFn = {
      calls: b.apiFn.calls - callsCut / 2,
      cpuMs: b.apiFn.cpuMs - cpuCut,
    };
    b.proxyOn.api = {
      calls: Math.max(0, b.proxyOn.api.calls - callsCut / 2),
      cpuMs: b.proxyOn.api.cpuMs,
    };
    return { ...u, burst: b };
  }
  return u;
}

/**
 * Polls in `hours` of a lit tab under the rest lever: the 60 s net at full cadence for 10 min, then every 5 min, and
 * nothing after 2 h without a touch. Returns the multiplier on an hour of today's net.
 */
function restedLiveFactor(hours) {
  if (hours <= 0) return 0;
  const polls =
    Math.min(hours, 1 / 6) * 60 + Math.max(0, Math.min(hours, 2) - 1 / 6) * 12;
  return polls / (hours * 60);
}

/** A 100-guest wedding (the base case), with Will's heavy tabs when `heavy` is given, under the given levers. */
/** Levers apply in this order: `batch` reads the burst's own routes, which the sums of the others no longer carry. */
const ORDER = ["batch", "cdn", "shared", "proxy", "worker", "rest"];
const applyAll = (u, levers) =>
  [...levers]
    .sort((x, y) => ORDER.indexOf(x) - ORDER.indexOf(y))
    .reduce(applyLever, u);

export function wedding(
  units0,
  { a = ASSUMPTIONS.wedding, heavy = null, levers = [] } = {},
) {
  const u = applyAll(units0, levers);
  const rest = levers.includes("rest");
  let t = ZERO;
  const parts = {};
  const put = (name, unit, k) => {
    if (!unit || !k) return;
    parts[name] = scale(unit, k);
    t = add(t, unit, k);
  };
  const g = a.guests;
  put("joins", u.join, g * a.joinsPerGuest);
  put("uploads (10 a burst)", u.burst, g * a.burstsPerGuest);
  // A lit album during the event hears every burst (its doorbell's syncs) and keeps the 60 s net under it.
  const burstsPerHour = (g * a.burstsPerGuest) / a.hours;
  const phoneHours = g * a.visibleHoursPerGuest;
  const screenHours = a.screens * a.hours;
  const net = (perTabHours, tabs) =>
    (rest ? restedLiveFactor(perTabHours) : 1) * perTabHours * tabs;
  put(
    "lit albums: the 60 s net",
    u.liveHour,
    net(a.visibleHoursPerGuest, g) + net(a.hours, a.screens),
  );
  put(
    "lit albums: hearing bursts",
    u.burstHeard,
    (phoneHours + screenHours) * burstsPerHour,
  );
  put("reopens", u.load, g * a.reopensPerGuest);
  // A quiet hour is sixty polls of the 60 s net: one of them is a tab's return.
  put(
    "tab returns (a catch-up sync)",
    u.liveHour && scale(u.liveHour, 1 / 60),
    g * a.tabReturnsPerGuest,
  );
  put("viewer (20 photos)", u.viewer20, g * a.viewerSessionsPerGuest);
  put("downloads", u.download, g * a.downloadsPerGuest + 1);
  put("host sessions", u.hostSession, a.hostSessions);
  put("the week after: reopens", u.load, g * a.afterReopensPerGuest);
  put(
    "the week after: lit, quiet",
    u.liveHour,
    net(a.afterVisibleHoursPerGuest, g),
  );
  if (heavy) {
    put(
      "heavy: tabs left lit (doorbell live)",
      u.liveHour,
      net(heavy.tabHours, g * heavy.tabsOpenFraction),
    );
    // Resting the 12 s fallback to 60 s while nothing changes: the event's half keeps changing, the quiet half rests.
    put(
      "heavy: screens on refusing wifi (12 s poll)",
      u.downHour,
      heavy.screensDown * heavy.tabHours * (rest ? 0.5 + 0.5 / 5 : 1),
    );
  }
  return { total: t, parts };
}

/** Calls and CPU against Hobby and Pro (and Workers Paid for what a Worker took over). */
export function price(total, ratio) {
  const at44 = (total.calls * VERCEL.observedMsPerCall) / 3_600_000;
  const calibrated = (total.vercelCpuMs * ratio) / 3_600_000;
  const p = VERCEL.pro;
  const memoryGbHours = (total.fnWallMs * p.memoryGb) / 3_600_000;
  const pro = (cpuHours) => {
    const usage =
      cpuHours * p.cpuHourUsd +
      (total.calls / 1e6) * p.invocationsPerMillionUsd +
      memoryGbHours * p.memoryGbHourUsd +
      (Math.max(0, total.requests - p.cdnRequestsIncluded) / 1e6) *
        p.cdnRequestsPerMillionUsd;
    return { usage, bill: p.seatUsd + Math.max(0, usage - p.creditUsd) };
  };
  const w = total.worker;
  const workerUsd = w
    ? WORKERS.paid.usd +
      (Math.max(0, w.requests - WORKERS.paid.requestsIncluded) / 1e6) *
        WORKERS.paid.requestsPerMillionUsd +
      (Math.max(0, w.cpuMs * ratio - WORKERS.paid.cpuMsIncluded) / 1e6) *
        WORKERS.paid.cpuMsPerMillionUsd
    : 0;
  return {
    calls: Math.round(total.calls),
    fnCalls: Math.round(total.fnCalls),
    proxyCalls: Math.round(total.proxyCalls),
    requests: Math.round(total.requests),
    workerRequests: Math.round(w?.requests ?? 0),
    cpuHoursAt44: at44,
    cpuHoursCalibrated: calibrated,
    hobbyCpuShareAt44: at44 / VERCEL.hobby.cpuHours,
    hobbyCpuShareCalibrated: calibrated / VERCEL.hobby.cpuHours,
    hobbyInvocationShare: total.calls / VERCEL.hobby.invocations,
    hobbyCdnShare: total.requests / VERCEL.hobby.cdnRequests,
    memoryGbHours,
    proAt44: pro(at44),
    proCalibrated: pro(calibrated),
    workerUsd,
  };
}

function month(u, w) {
  const m = ASSUMPTIONS.month;
  let t = scale(w.total, m.events);
  if (u.visitor) t = add(t, u.visitor, m.visitors);
  if (u.crawlerPage) t = add(t, u.crawlerPage, m.crawlerPages);
  if (u.hostSession)
    t = add(t, u.hostSession, m.events * m.hostSessionsPerEvent);
  return t;
}

export function project(results) {
  const u = units(results);
  const measured = Object.values(results.scenarios).filter(
    (m) => !m.skipped && !m.error && m.calls,
  );
  const calls = measured.reduce((n, m) => n + m.calls, 0);
  const cpu = measured.reduce((n, m) => n + m.vercelCpuMs, 0);
  const localMsPerCall = calls ? cpu / calls : 0;
  const ratio = localMsPerCall ? VERCEL.observedMsPerCall / localMsPerCall : 1;
  if (!u.join || !u.burst || !u.load || !u.liveHour || !u.burstHeard)
    return {
      u,
      ratio,
      localMsPerCall,
      rows: [],
      levers: [],
      missing: "the guest scenarios (join-upload, hour-live) are needed",
    };
  const w = wedding(u);
  const wHeavy = wedding(u, { heavy: ASSUMPTIONS.heavy });
  const rows = [
    {
      name: "a 100-guest wedding, 4 hours",
      ...price(w.total, ratio),
      parts: w.parts,
    },
    {
      name: "the same wedding, heavy tabs",
      ...price(wHeavy.total, ratio),
      parts: wHeavy.parts,
    },
    {
      name: "100 hosts, 10,000 guests, one Sunday",
      ...price(scale(w.total, 100), ratio),
    },
    {
      name: "a month at 100 events (+ site, hosts)",
      ...price(month(u, w), ratio),
    },
  ];
  // Each lever alone, then all but the Worker, then all: on the heavy wedding and on the month.
  const sets = [
    ...Object.keys(LEVERS).map((l) => [l]),
    ["proxy", "rest", "batch"],
    ["proxy", "rest", "batch", "cdn"],
    ["proxy", "rest", "batch", "cdn", "shared"],
    Object.keys(LEVERS),
  ];
  const levers = sets.map((set) => {
    const uw = applyAll(u, set);
    const heavy = wedding(u, { heavy: ASSUMPTIONS.heavy, levers: set });
    const base = wedding(u, { levers: set });
    return {
      set,
      heavy: price(heavy.total, ratio),
      month: price(month(uw, base), ratio),
    };
  });
  return { u, ratio, localMsPerCall, rows, levers };
}

const pct = (x) => `${(x * 100).toFixed(x < 0.1 ? 1 : 0)}%`;
const n = (x) => Math.round(x).toLocaleString("en-US");

export function printProjections(p) {
  if (p.missing) {
    console.log(`\nprojections: ${p.missing}`);
    return;
  }
  console.log(
    `\ncalibration: ${p.localMsPerCall.toFixed(2)} ms of local CPU a call over the measured mix; 44.1 ms on Vercel, so x${p.ratio.toFixed(1)}` +
      (p.u.hostEstimated
        ? "; host sessions ESTIMATED (no session measured)"
        : ""),
  );
  console.log(
    `${"projection".padEnd(40)} ${"calls".padStart(10)} ${"CPU-h@44".padStart(9)} ${"Hobby".padStart(7)} ${"CPU-h cal".padStart(9)} ${"Hobby".padStart(7)} ${"invoc.".padStart(7)} ${"Pro $@44".padStart(9)} ${"Pro $cal".padStart(9)}`,
  );
  for (const r of p.rows) {
    console.log(
      `${r.name.padEnd(40)} ${n(r.calls).padStart(10)} ${r.cpuHoursAt44.toFixed(2).padStart(9)} ${pct(r.hobbyCpuShareAt44).padStart(7)} ${r.cpuHoursCalibrated.toFixed(2).padStart(9)} ${pct(r.hobbyCpuShareCalibrated).padStart(7)} ${pct(r.hobbyInvocationShare).padStart(7)} ${r.proAt44.bill.toFixed(2).padStart(9)} ${r.proCalibrated.bill.toFixed(2).padStart(9)}`,
    );
  }
  console.log(
    `\n${"lever (what-if on the ledger)".padEnd(40)} ${"heavy wedding".padStart(14)} ${"CPU-h cal".padStart(9)} ${"month calls".padStart(12)} ${"CPU-h cal".padStart(9)} ${"Pro $cal".padStart(9)} ${"Worker $".padStart(9)}`,
  );
  for (const l of p.levers) {
    console.log(
      `${l.set.join(" + ").padEnd(40)} ${n(l.heavy.calls).padStart(14)} ${l.heavy.cpuHoursCalibrated.toFixed(2).padStart(9)} ${n(l.month.calls).padStart(12)} ${l.month.cpuHoursCalibrated.toFixed(2).padStart(9)} ${l.month.proCalibrated.bill.toFixed(2).padStart(9)} ${l.month.workerUsd.toFixed(2).padStart(9)}`,
    );
  }
}
