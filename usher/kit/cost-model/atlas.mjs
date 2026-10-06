// usher/kit/cost-model/atlas.mjs: the atlas's events (2026-10-03), the source of PRICING.md's once-costs (the reference
// party, the 2,000-guest wedding), a confirmed guest at scale and the always-open screen. Its later sections (today's
// plans, the ladders, the expensive host lever by lever) predate Ladder A: `plans.mjs` re-runs those. Run: node
// atlas.mjs. Every ≈ is ours; the prices are model.mjs's.
import { CALL, DERIVED_PHOTO, FIXED, FIXED_TOTAL, M, OPS, P, perGbCap, stripeFee } from "./model.mjs";

const $ = (x, d = 2) =>
  Math.abs(x) >= 100 ? `$${Math.round(x).toLocaleString("en-US")}` : `$${x.toFixed(d)}`;
const n = (x) => Math.round(x).toLocaleString("en-US");
const KB = 1 / (1024 * 1024);

// ─── Per-guest constants, marginal at scale (past 100,000 MAU and Resend Pro's 50,000) ────────
// ≈ the guest walk on the wire: 96 B a guest-upload row and 135 B a guest row of JSON, 28 and 37
// gzipped (measured on 5,000 and 2,000 synthetic rows, 2026-10-03); WALK_RAW=1 for the raw ceiling.
const WALK_A = process.env.WALK_RAW ? 96 : 28;
const WALK_G = process.env.WALK_RAW ? 135 : 37;
const GUEST = P.supa.mau + 1.1 * P.resend.over; // ≈ 1.1 code emails a confirmation

// ─── A page load of /e/<token> at full access (the Explore read: ~18 round trips, ~150
// presigns, ~60 KB of HTML and RSC), plus a first visit's ~0.85 MB of static assets and ~48 tile
// GETs from R2.
function pageLoad({ firstVisit = true } = {}) {
  const fn =
    P.vercel.inv * 2 +
    (0.003 + (150 * 0.17) / 1000) * P.vercel.cpuS +
    2 * (0.03 + 18 * 0.004) * P.vercel.memGBs +
    P.vercel.cdnReq +
    60 * KB * (P.vercel.fdtGB + P.vercel.fotGB);
  const assets = firstVisit ? 0.85 / 1024 * P.vercel.fdtGB + 50 * P.vercel.cdnReq : 0;
  return fn + assets + 48 * P.r2.B;
}

// ─── The live album over one event (model.mjs's liveEvent, re-stated so it can be imported) ──
function live({ hours, uploads, sockets, visibleShare = 0.75, guestUploads, guests, attrBumps = 0, interest = 300, mode }) {
  const T = hours * 3600;
  const r = uploads / T;
  const visible = sockets * visibleShare;
  const listeners = mode === "today" ? sockets : visible;
  const w = mode === "today" ? 2.2 : 15;
  const firesPerTab = (T * r) / (1 + r * w);
  const syncTabs = mode === "today" ? sockets : visible;
  const pollSyncs = syncTabs * hours * 60;
  const deltaSyncs = syncTabs * firesPerTab;
  const avgA = guestUploads / 2;
  const avgG = guests / 2;
  const walk = mode !== "levers";
  const walkRts = walk ? 2 + Math.ceil(avgA / 1000) + Math.ceil(avgG / 1000) : 0;
  const walkGB = walk ? (avgA * WALK_A + avgG * WALK_G) / 1024 ** 3 : 0;
  const pings = mode === "levers" ? Math.min(uploads, T / 15) : uploads;
  const messages = pings * (1 + listeners);
  const linksNew = mode === "today" ? deltaSyncs * 0.6 : 0;
  const remintHourly = syncTabs * hours * (interest / 200);
  const remintAttr = mode === "levers" ? 0 : Math.min(attrBumps, T / w) * syncTabs * (interest / 200);
  const deltaCall =
    P.vercel.inv * 2 +
    0.004 * P.vercel.cpuS +
    2 * (0.003 + (6 + walkRts) * 0.004) * P.vercel.memGBs +
    P.vercel.cdnReq +
    3 * KB * (P.vercel.fdtGB + P.vercel.fotGB);
  const vercel = pollSyncs * CALL.sync304 + deltaSyncs * deltaCall + (linksNew + remintHourly + remintAttr) * CALL.links600;
  const egress = deltaSyncs * walkGB;
  return {
    syncs: pollSyncs + deltaSyncs,
    links: linksNew + remintHourly + remintAttr,
    messages,
    egressGB: egress,
    vercel,
    egress$: egress * P.supa.egressGB,
    realtime$: messages * P.supa.rtMsg,
    peakSockets: listeners,
    total: vercel + egress * P.supa.egressGB + messages * P.supa.rtMsg,
  };
}

// ─── Events ───────────────────────────────────────────────────────────────────────────────────
const REF = {
  name: "the reference party",
  guests: 200,
  confirm: 100,
  photos: 2000,
  clips: 100,
  hours: 5,
  sockets: 20,
  attrBumps: 10,
  loads: 200 * 3 + 400,
};
const WED = {
  name: "the 2,000-guest wedding",
  guests: 2000,
  confirm: 1000,
  photos: 9500,
  clips: 500,
  hours: 5,
  sockets: 200,
  attrBumps: 50,
  loads: 2000 * 3 + 2000,
};
const FREE_EVENT = {
  name: "a Free event at its cap",
  guests: 20,
  confirm: 10,
  photos: 29,
  clips: 0,
  hours: 3,
  sockets: 4,
  attrBumps: 0,
  loads: 60,
};

function storedGiB(e) {
  return (e.photos * (M.photo + M.phone + M.preview) + e.clips * (M.clip30 + M.preview));
}
function eventOnce(e, mode) {
  const uploads = e.photos * OPS.photo + e.clips * OPS.clip;
  const lv = live({
    hours: e.hours,
    uploads: e.photos + e.clips,
    sockets: e.sockets,
    guestUploads: Math.round((e.photos + e.clips) * 0.95),
    guests: e.guests,
    attrBumps: e.attrBumps,
    mode,
  });
  const pages = e.loads * pageLoad({ firstVisit: true }) * 0.6 + e.loads * pageLoad({ firstVisit: false }) * 0.4;
  const guests = e.confirm * GUEST;
  const zip = (e.photos + e.clips) * P.r2.B; // the host's one download, streamed by the Worker
  return { uploads, live: lv, pages, guests, zip, total: uploads + lv.total + pages + guests + zip };
}

function storageMonth(gib, { binShare = 0 } = {}) {
  // stored GiB already includes derived copies; primary + backup of what is live
  return gib * (1 + binShare) * (P.r2.std + P.r2.ia);
}

// ─── Print: the events ────────────────────────────────────────────────────────────────────────
console.log("## Events (once)\n");
console.log("| event | stored | uploads | live album | page loads | guests (at scale) | total once |\n| --- | --- | --- | --- | --- | --- | --- |");
for (const e of [FREE_EVENT, REF, WED]) {
  for (const mode of ["today", "calm", "levers"]) {
    const o = eventOnce(e, mode);
    console.log(
      `| ${e.name} [${mode}] | ${storedGiB(e).toFixed(1)} GiB | ${$(o.uploads)} | ${$(o.live.total)} (syncs ${n(o.live.syncs)}, links ${n(o.live.links)}, msgs ${n(o.live.messages)}, egress ${o.live.egressGB.toFixed(1)} GiB) | ${$(o.pages)} | ${$(o.guests)} | ${$(o.total)} |`,
    );
  }
}
console.log(`\nper confirmed guest at scale: ${$(GUEST, 4)}; a first page load ${$(pageLoad(), 5)}, a repeat ${$(pageLoad({ firstVisit: false }), 5)}`);

// ─── The always-open screen, a month ──────────────────────────────────────────────────────────
{
  const hours = 720;
  const polls = hours * 60 * CALL.sync304;
  const remint = hours * 3 * CALL.links600; // ≤600 ids an hour (links.ts:124)
  const reel = hours * 1200 * P.r2.B; // a still every 3 s past the 48-bitmap cache (asset-cache.ts:25)
  const video = hours * 40 * 3 * P.r2.B; // ≈ clips' range reads
  console.log(
    `\n## The always-open screen, a month: polls ${$(polls)}, re-mints ${$(remint)}, reel GETs ${$(reel + video)}, total ${$(polls + remint + reel + video)}, plus one peak connection (${$(P.supa.rtConn)} if it sets the peak)`,
  );
}

// ─── Plans: worst and typical ─────────────────────────────────────────────────────────────────
function planWorstMonth(capGiB, m, opts = {}) {
  return capGiB * perGbCap({ m, ...opts }).total;
}
function verdict(net, cost) {
  return `${(net / cost).toFixed(2)}x`;
}

console.log("\n## Today's plans at their worst month (photos; the bin full; uploads at 3x)\n");
console.log("| plan | price | net of Stripe | worst, prune keeping up | x | worst, a year of no prune | typical |\n| --- | --- | --- | --- | --- | --- | --- |");
const TODAY = [
  { name: "Pro 100 GB", cap: 100, price: 9, typical: 36 },
  { name: "Pro 500 GB", cap: 500, price: 19, typical: 100 },
  { name: "Pro 2 TB", cap: 2048, price: 39, typical: 300 },
  { name: "Pro 100 GB yearly", cap: 100, price: 90 / 12, annual: 90, typical: 36 },
  { name: "Pro 2 TB yearly", cap: 2048, price: 390 / 12, annual: 390, typical: 300 },
];
for (const p of TODAY) {
  const net = p.annual ? (p.annual - stripeFee(p.annual)) / 12 : p.price - stripeFee(p.price);
  const w = planWorstMonth(p.cap, 3);
  const wNo = planWorstMonth(p.cap, 3, { pruneKeepsUp: false });
  const typ = storageMonth(p.typical * 1.21 / 1.0) / 1.21 * 1.0; // typical GiB given in stored terms below
  console.log(`| ${p.name} | ${$(p.price)} | ${$(net)} | ${$(w)} | ${verdict(net, w)} | ${$(wNo)} | ${$(storageMonth(p.typical))} + events |`);
}
{
  const pass = 75;
  const netPass = 24 - stripeFee(24, { subscription: false });
  const wYear = 12 * planWorstMonth(pass, 3);
  const fullYear = 12 * pass * perGbCap({ m: 0, bin: 0 }).total;
  console.log(`| Event Pass 75 GB (a year) | $24 | ${$(netPass)} | ${$(wYear)} | ${verdict(netPass, wYear)} | full, no churn: ${$(fullYear)} | the reference party: ${$(12 * storageMonth(12.1))} |`);
  const renewNet = 15 - stripeFee(15, { subscription: false });
  console.log(`| Event Pass renewal (a year) | $15 | ${$(renewNet)} | ${$(wYear)} | ${verdict(renewNet, wYear)} | full, no churn: ${$(fullYear)} | |`);
}

// ─── Archetypes, a month ──────────────────────────────────────────────────────────────────────
console.log("\n## Archetypes, a month (today | after: album-calm, the levers, the prune keeping up)\n");
const refToday = eventOnce(REF, "today");
const refAfter = eventOnce(REF, "levers");
const wedToday = eventOnce(WED, "today");
const wedCalm = eventOnce(WED, "calm");
const wedAfter = eventOnce(WED, "levers");
const freeToday = eventOnce(FREE_EVENT, "today");
const freeAfter = eventOnce(FREE_EVENT, "levers");
const rows = [];
rows.push(["cheap: a Free event at its cap (its month; kept after)", freeToday.total + storageMonth(storedGiB(FREE_EVENT)), freeAfter.total + storageMonth(storedGiB(FREE_EVENT)), 0, `then ${$(storageMonth(storedGiB(FREE_EVENT)), 4)} a month`]);
rows.push(["typical: Pro, 3 parties kept (36 GiB), one a quarter", storageMonth(36) + refToday.total / 3, storageMonth(36) + refAfter.total / 3, 9, ""]);
rows.push([
  "expensive: Pro 100 GB full, the bin full, 3x uploads, a 2,000-guest wedding a month",
  planWorstMonth(100, 3) + wedToday.total,
  planWorstMonth(100, 1) + wedAfter.total,
  9,
  `today with no prune, a year in: ${$(planWorstMonth(100, 3, { pruneKeepsUp: false }) + wedToday.total)}`,
]);
rows.push(["guest-heavy: the wedding's live album and guests alone", wedToday.live.total + wedToday.guests, wedAfter.live.total + wedAfter.guests, 0, `after album-calm alone ${$(wedCalm.live.total + wedCalm.guests)}`]);
rows.push(["video-heavy: Pro 100 GB full of video, 3x uploads", planWorstMonth(100, 3, { photoShare: 0 }), planWorstMonth(100, 1, { photoShare: 0 }), 9, `full, no churn: ${$(100 * perGbCap({ m: 0, bin: 0, photoShare: 0 }).total)}`]);
rows.push(["churn: Pro 100 GB re-filled 3x a month (photos)", planWorstMonth(100, 3), planWorstMonth(100, 1), 9, `today with no prune, a year in: ${$(planWorstMonth(100, 3, { pruneKeepsUp: false }))}`]);
{
  const hours = 720;
  const screen = hours * 60 * CALL.sync304 + hours * 3 * CALL.links600 + hours * 1320 * P.r2.B;
  const screenAfter = hours * 12 * CALL.sync304 + hours * 1 * CALL.links600 + hours * 1320 * P.r2.B;
  rows.push(["always-open: one screen on the reel all month", screen, screenAfter, 0, "plus a socket slot at the peak"]);
}
rows.push([
  "photographer or venue: Pro 2 TB full, refreshed 1x, eight parties a month",
  planWorstMonth(2048, 1) + 8 * refToday.total,
  planWorstMonth(2048, 1, { backupDerived: false }) + 8 * refAfter.total,
  39,
  `with 3x uploads today: ${$(planWorstMonth(2048, 3) + 8 * refToday.total)}`,
]);
console.log("| archetype | today | after | price | note |\n| --- | --- | --- | --- | --- |");
for (const [a, t, af, pr, note] of rows) console.log(`| ${a} | ${$(t)} | ${$(af)} | ${pr ? $(pr) : "-"} | ${note} |`);

// ─── Breakeven and light-per-heavy ────────────────────────────────────────────────────────────
console.log(`\n## Fixed ${$(FIXED_TOTAL)} a month: ${Object.entries(FIXED).map(([k, v]) => `${k} ${$(v)}`).join(", ")}`);
const typicalCost = storageMonth(36) + refAfter.total / 3;
const typicalNet = 9 - stripeFee(9) - typicalCost;
console.log(`typical Pro host today: cost ${$(typicalCost)}, net ${$(typicalNet)} -> breakeven ${Math.ceil(FIXED_TOTAL / typicalNet)} hosts (${Math.ceil((FIXED_TOTAL + 25) / typicalNet)} with Cloudflare Pro)`);
for (const [label, worst, price] of [
  ["Pro 100 GB at today's worst (3x, the bin full)", planWorstMonth(100, 3), 9],
  ["Pro 100 GB at 1x", planWorstMonth(100, 1), 9],
  ["Pro 2 TB at today's worst", planWorstMonth(2048, 3), 39],
  ["Pro 2 TB at 1x", planWorstMonth(2048, 1), 39],
  ["the expensive archetype today", planWorstMonth(100, 3) + wedToday.total, 9],
  ["the expensive archetype after", planWorstMonth(100, 1) + wedAfter.total, 9],
]) {
  const loss = worst - (price - stripeFee(price));
  console.log(`${label}: worst ${$(worst)} vs net ${$(price - stripeFee(price))}: ${loss > 0 ? `loses ${$(loss)}, covered by ${(loss / typicalNet).toFixed(1)} typical hosts` : "covers itself"}`);
}

// ─── Ladders ──────────────────────────────────────────────────────────────────────────────────
// A pass's uploads are an allowance over its YEAR (U), not a month: the event and a refill.
// Its worst year: the cap full all year, the bin either kept full by restore-and-re-delete
// ("cycling") or only by real deletions (at most 1.1 x cap + U over the year), U uploaded.
function passYear(capGiB, U, { cycling = true, backupDerived = true } = {}) {
  const d = 0.3;
  // trash-in-storage: Deleted is inside the cap, so restore-and-re-delete cycling stores nothing past it; what remains is
  // each refill's day of peak (+1.1 cap a day per cap's worth uploaded).
  const binMonths = ((U / capGiB) * 1.1) / 30 + (cycling ? 0 : 0);
  const liveMonths = 1.1 * 12 + binMonths; // in cap-months
  const primary = liveMonths * capGiB * (1 + d) * P.r2.std;
  const backupMonths = liveMonths + 1.43 * (U / capGiB);
  const backup = backupMonths * capGiB * (1 + (backupDerived ? d : 0)) * P.r2.ia;
  const ops = U * (backupDerived ? OPS.photo : OPS.photoOriginalsBackup) / M.photo;
  return primary + backup + ops;
}

export const LADDERS = {
  A: {
    title: "Ladder A, room to grow (recommended)",
    plans: [
      { name: "Free", cap: 0.1, m: 3, price: 0 },
      { name: "Event Pass", cap: 25, U: 50, pass: 29, renewal: 15, renewalU: 25 },
      { name: "Pro 50 GB", cap: 50, m: 2, price: 9, annual: 90, typicalGiB: 24 },
      { name: "Pro 200 GB", cap: 200, m: 1, price: 29, annual: 290, typicalGiB: 90 },
      { name: "Pro 1 TB", cap: 1024, m: 0.5, price: 99, annual: 990, typicalGiB: 400 },
    ],
  },
  B: {
    title: "Ladder B, two rooms",
    plans: [
      { name: "Free", cap: 0.1, m: 3, price: 0 },
      { name: "Event Pass", cap: 50, U: 100, pass: 39, renewal: 19, renewalU: 50 },
      { name: "Pro 100 GB", cap: 100, m: 1, price: 12, annual: 120, typicalGiB: 36 },
      { name: "Pro 500 GB", cap: 500, m: 1, price: 59, annual: 590, typicalGiB: 200 },
    ],
  },
  C: {
    title: "Ladder C, today's shape, repriced",
    plans: [
      { name: "Free", cap: 0.1, m: 3, price: 0 },
      { name: "Event Pass", cap: 75, U: 150, pass: 49, renewal: 25, renewalU: 75 },
      { name: "Pro 100 GB", cap: 100, m: 2, price: 15, annual: 150, typicalGiB: 36 },
      { name: "Pro 500 GB", cap: 500, m: 1, price: 59, annual: 590, typicalGiB: 150 },
      { name: "Pro 2 TB", cap: 2048, m: 0.5, price: 199, annual: 1990, typicalGiB: 500 },
    ],
  },
};

const typPass = 12 * storageMonth(12.1) + refAfter.total;
for (const L of Object.values(LADDERS)) {
  console.log(`\n## ${L.title}\n`);
  console.log("| plan | price | worst (rules) | net | x | worst, levers | x | typical | margin at typical |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const p of L.plans) {
    if (p.pass) {
      const net = p.pass - stripeFee(p.pass, { subscription: false });
      const w = passYear(p.cap, p.U);
      const wNc = passYear(p.cap, p.U, { cycling: false });
      const wL = passYear(p.cap, p.U, { cycling: false, backupDerived: false });
      console.log(`| ${p.name} ${p.cap} GB, uploads ${p.U} GB over its year | $${p.pass} once | ${$(w)} a year (no cycling ${$(wNc)}) | ${$(net)} | ${verdict(net, w)} (${verdict(net, wNc)}) | ${$(wL)} | ${verdict(net, wL)} | ${$(typPass)} a year | ${((1 - typPass / net) * 100).toFixed(0)}% |`);
      const rnet = p.renewal - stripeFee(p.renewal, { subscription: false });
      const rw = passYear(p.cap, p.renewalU);
      const rwNc = passYear(p.cap, p.renewalU, { cycling: false });
      const rwL = passYear(p.cap, p.renewalU, { cycling: false, backupDerived: false });
      const rtyp = 12 * storageMonth(12.1);
      console.log(`| renewal, uploads ${p.renewalU} GB | $${p.renewal} once | ${$(rw)} (no cycling ${$(rwNc)}) | ${$(rnet)} | ${verdict(rnet, rw)} (${verdict(rnet, rwNc)}) | ${$(rwL)} | ${verdict(rnet, rwL)} | ${$(rtyp)} a year | ${((1 - rtyp / rnet) * 100).toFixed(0)}% |`);
      continue;
    }
    if (!p.price) {
      console.log(`| ${p.name} 100 MB, uploads 300 MB a month | $0 | ${$(planWorstMonth(p.cap, p.m), 3)} a month | - | - | | | its guests: ${$(GUEST, 4)} each at scale | |`);
      continue;
    }
    const w = planWorstMonth(p.cap, p.m);
    const wL = planWorstMonth(p.cap, p.m, { backupDerived: false });
    const net = p.price - stripeFee(p.price);
    const typ = storageMonth(p.typicalGiB) + refAfter.total / 3;
    console.log(`| ${p.name}, uploads ${Math.round(p.m * p.cap)} GB a month | $${p.price}/mo | ${$(w)} | ${$(net)} | ${verdict(net, w)} | ${$(wL)} | ${verdict(net, wL)} | ${$(typ)} | ${((1 - typ / net) * 100).toFixed(0)}% |`);
    if (p.annual) {
      const anet = (p.annual - stripeFee(p.annual)) / 12;
      console.log(`| ${p.name} yearly | $${p.annual}/yr | ${$(w)} | ${$(anet)} | ${verdict(anet, w)} | ${$(wL)} | ${verdict(anet, wL)} | ${$(typ)} | ${((1 - typ / anet) * 100).toFixed(0)}% |`);
    }
  }
}

// ─── The lever progression for the expensive host (Pro 100 GB at $9) ──────────────────────────
console.log("\n## The expensive host, lever by lever (Pro 100 GB at $9: full, the bin full, re-filled at the multiplier, a 2,000-guest wedding a month)\n");
const net9 = 9 - stripeFee(9);
const steps = [
  ["today (the prune dry, a year in; 3x; the live album as built)", planWorstMonth(100, 3, { pruneKeepsUp: false }) + wedToday.total],
  ["+ the prune keeps up (PRUNE_MODE live, a cursor, caps sized to deletions)", planWorstMonth(100, 3) + wedToday.total],
  ["+ album-calm", planWorstMonth(100, 3) + wedCalm.total],
  ["+ the guest count once a beat, attribution in the sync", planWorstMonth(100, 3) + wedCalm.total - wedCalm.live.egress$ - (wedCalm.live.vercel - live({ hours: 5, uploads: 10000, sockets: 200, guestUploads: 9500, guests: 2000, attrBumps: 0, mode: "levers" }).vercel)],
  ["+ one ping a beat", planWorstMonth(100, 3) + wedAfter.total],
  ["+ uploads published at 1x", planWorstMonth(100, 1) + wedAfter.total],
  ["+ originals-only backup (after a remake job)", planWorstMonth(100, 1, { backupDerived: false }) + wedAfter.total],
];
const typNet = 9 - stripeFee(9) - (storageMonth(36) + refAfter.total / 3);
console.log("| step | the host's month | vs $8.38 net | typical hosts to cover it |\n| --- | --- | --- | --- |");
for (const [label, c] of steps) {
  const loss = c - net9;
  console.log(`| ${label} | ${$(c)} | ${loss > 0 ? `-${$(loss)}` : `+${$(-loss)}`} | ${loss > 0 ? (loss / typNet).toFixed(1) : "0"} |`);
}
console.log(`\ntypical Pro host's net (today's $9 plan, after album-calm): ${$(typNet)}; breakeven on ${$(FIXED_TOTAL)} fixed: ${Math.ceil(FIXED_TOTAL / typNet)} hosts`);
{
  const a50 = 9 - stripeFee(9) - (storageMonth(24) + refAfter.total / 3);
  const a200 = 29 - stripeFee(29) - (storageMonth(90) + refAfter.total / 3);
  const passNetYear = 29 - stripeFee(29, { subscription: false }) - typPass;
  console.log(`Ladder A: Pro 50 net ${$(a50)} a month, Pro 200 net ${$(a200)}, a pass net ${$(passNetYear)} a year; breakeven ${Math.ceil(FIXED_TOTAL / a50)} Pro 50 hosts, or ${Math.ceil((12 * FIXED_TOTAL) / passNetYear)} passes a year`);
}
