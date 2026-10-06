// usher/kit/cost-model/plans.mjs: PRICING.md's plan-named lines (Ladder A, pricing-wiring 2026-10-04) with Deleted
// inside the cap (bin 0): a GB of cap a month, each plan's worst month against its price net of Stripe, the archetypes,
// the breakeven and the expensive host lever by lever, over model.mjs (atlas.mjs's event functions restated). Run: node
// plans.mjs. A plan change edits its line here, then the numbers it prints go into PRICING.md.
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
console.log("| event | stored | uploads | live album | page loads | guests (at scale) | total once |\n| --- | --- | --- | --- | --- | --- | --- |");

const IN = { bin: 0 }; // Deleted inside the cap (trash-in-storage): the cap holds albums and Deleted together
const worst = (cap, m, o = {}) => cap * perGbCap({ m, ...IN, ...o }).total;
const netM = (p) => p - stripeFee(p);
const netY = (a) => (a - stripeFee(a)) / 12;
const netOnce = (p) => p - stripeFee(p, { subscription: false });
const x = (net, cost) => `${(net / cost).toFixed(2)}x`;
const D = 0.3;
function passYear(capGiB, U, { backupDerived = true } = {}) {
  const liveMonths = 1.1 * 12;
  const primary = liveMonths * capGiB * (1 + D) * P.r2.std;
  const backupMonths = liveMonths + 1.43 * (U / capGiB);
  const backup = backupMonths * capGiB * (1 + (backupDerived ? D : 0)) * P.r2.ia;
  const ops = (U * (backupDerived ? OPS.photo : OPS.photoOriginalsBackup)) / M.photo;
  return primary + backup + ops;
}

console.log("## A GB of cap a month (Deleted inside)\n");
for (const [label, o] of [
  ["full, nothing deleted or re-uploaded, photos", { m: 0 }],
  ["full, nothing deleted or re-uploaded, video", { m: 0, photoShare: 0 }],
  ["re-uploaded 2x (Pro 50 GB's allowance), photos", { m: 2 }],
  ["re-uploaded 2x, the prune dry, a year in", { m: 2, pruneKeepsUp: false }],
  ["re-uploaded 1x (Pro 200 GB's), photos", { m: 1 }],
  ["re-uploaded 1x, video", { m: 1, photoShare: 0 }],
  ["re-uploaded 0.49x (Pro 1 TB's), photos", { m: 500 / 1024 }],
  ["re-uploaded 1x, the backup holding originals only", { m: 1, backupDerived: false }],
  ["Free: 3x a month", { m: 3 }],
]) {
  const r = perGbCap({ ...IN, ...o });
  console.log(`${label}: $${r.total.toFixed(4)} (primary ${r.primary.toFixed(4)}, backup ${r.backup.toFixed(4)}, ops ${r.churn.toFixed(4)})`);
}

console.log("\n## Each plan's worst month (photos, Deleted inside, the prune keeping up)\n");
for (const p of [
  { name: "Pro 50 GB", cap: 50, m: 2, price: 9, annual: 90 },
  { name: "Pro 200 GB", cap: 200, m: 1, price: 29, annual: 290 },
  { name: "Pro 1 TB", cap: 1024, m: 500 / 1024, price: 99, annual: 990 },
]) {
  const w = worst(p.cap, p.m);
  const wl = worst(p.cap, p.m, { backupDerived: false });
  const wd = worst(p.cap, p.m, { pruneKeepsUp: false });
  console.log(`${p.name}: worst ${$(w)} (prune dry a year in ${$(wd)}; levers ${$(wl)}); net ${$(netM(p.price))} monthly -> ${x(netM(p.price), w)}, yearly ${$(netY(p.annual))} -> ${x(netY(p.annual), w)}; levers ${x(netM(p.price), wl)} / ${x(netY(p.annual), wl)}`);
}
{
  const w = passYear(25, 50);
  const wl = passYear(25, 50, { backupDerived: false });
  console.log(`Event Pass 25 GB, 50 GB over its year: worst ${$(w)} a year; net ${$(netOnce(29))} -> ${x(netOnce(29), w)}; levers ${x(netOnce(29), wl)}`);
  console.log(`renewal $19, its own 50 GB: worst ${$(w)}; net ${$(netOnce(19))} -> ${x(netOnce(19), w)}; levers ${x(netOnce(19), wl)}`);
  console.log(`a full pass kept a year, no uploads: ${$(passYear(25, 0))}`);
  console.log(`Free 100 MB at 3x: ${$(worst(0.09765625, 3), 3)} a month`);
}

const refToday = eventOnce(REF, "today");
const refAfter = eventOnce(REF, "levers");
const wedToday = eventOnce(WED, "today");
const wedCalm = eventOnce(WED, "calm");
const wedAfter = eventOnce(WED, "levers");
const freeToday = eventOnce(FREE_EVENT, "today");
const freeAfter = eventOnce(FREE_EVENT, "levers");

console.log("\n## Archetypes, a month (today | after album-calm and the levers)\n");
const rows = [
  ["cheap: a Free event at its cap", freeToday.total + storageMonth(storedGiB(FREE_EVENT)), freeAfter.total + storageMonth(storedGiB(FREE_EVENT)), `then ${$(storageMonth(storedGiB(FREE_EVENT)), 4)} a month`],
  ["typical: Pro 50 GB, three parties kept (36 GiB), one a quarter", storageMonth(36) + refToday.total / 3, storageMonth(36) + refAfter.total / 3, "vs $9 ($8.38 net)"],
  ["expensive: Pro 200 GB full, Deleted inside, re-filled 1x a month (its allowance), a 2,000-guest wedding a month", worst(200, 1) + wedToday.total, worst(200, 1, { backupDerived: false }) + wedAfter.total, `prune dry, a year in: ${$(worst(200, 1, { pruneKeepsUp: false }) + wedToday.total)}; vs $29 ($27.66 net)`],
  ["guest-heavy: the wedding's live album and guests alone", wedToday.live.total + wedToday.guests, wedAfter.live.total + wedAfter.guests, `after album-calm alone ${$(wedCalm.live.total + wedCalm.guests)}`],
  ["video-heavy: Pro 50 GB full of video, re-filled 2x (its allowance)", worst(50, 2, { photoShare: 0 }), worst(50, 2, { photoShare: 0, backupDerived: false }), `full and still ${$(50 * perGbCap({ m: 0, ...IN, photoShare: 0 }).total)}; vs $9`],
  ["churn: Pro 50 GB re-filled 2x a month, photographs", worst(50, 2), worst(50, 2, { backupDerived: false }), `prune dry, a year in: ${$(worst(50, 2, { pruneKeepsUp: false }))}; vs $9`],
  ["photographer or venue: Pro 1 TB full, refreshed at its 500 GB a month, eight parties a month", worst(1024, 500 / 1024) + 8 * refToday.total, worst(1024, 500 / 1024, { backupDerived: false }) + 8 * refAfter.total, "vs $99 ($95.14 net)"],
];
for (const [a, t, af, note] of rows) console.log(`${a}: today ${$(t)} | after ${$(af)} | ${note}`);

console.log("\n## Breakeven and the expensive host, lever by lever\n");
const typicalCost = storageMonth(36) + refAfter.total / 3;
const typNet = netM(9) - typicalCost;
const typPass = 12 * storageMonth(12.1) + refAfter.total;
const passNet = netOnce(29) - typPass;
console.log(`typical Pro 50 host: cost ${$(typicalCost)}, net ${$(typNet)} -> ${Math.ceil(FIXED_TOTAL / typNet)} hosts (${Math.ceil((FIXED_TOTAL + 25) / typNet)} with Cloudflare Pro); typical pass year ${$(typPass)}, net ${$(passNet)} -> ${Math.ceil((12 * FIXED_TOTAL) / passNet)} passes a year`);
const net29 = netM(29);
const steps = [
  ["As built (the prune dry, a year in; its 1x uploads; the live album as built)", worst(200, 1, { pruneKeepsUp: false }) + wedToday.total],
  ["The prune keeps up", worst(200, 1) + wedToday.total],
  ["album-calm", worst(200, 1) + wedCalm.total],
  ["The guest count once a beat; attribution in the sync", worst(200, 1) + wedCalm.total - wedCalm.live.egress$ - (wedCalm.live.vercel - live({ hours: 5, uploads: 10000, sockets: 200, guestUploads: 9500, guests: 2000, attrBumps: 0, mode: "levers" }).vercel)],
  ["One ping a beat", worst(200, 1) + wedAfter.total],
  ["The backup holding originals only", worst(200, 1, { backupDerived: false }) + wedAfter.total],
];
for (const [label, c] of steps) {
  const d = net29 - c;
  console.log(`| ${label} | ${$(c)} | ${d >= 0 ? `+${$(d)}` : `−${$(-d)}`} | ${d >= 0 ? "0" : (-d / typNet).toFixed(1)} |`);
}
