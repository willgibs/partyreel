// usher/kit/cost-model/model.mjs: the dollar model behind PRICING.md's "What it costs us" (the cost atlas, 2026-10-03;
// Deleted inside the cap since trash-in-storage). Every vendor price is PRICING.md's table, read raw from each vendor's
// page and dated there: re-read a page and change its line here and there together. Every "≈" constant is OURS to
// change and says so. `plans.mjs` prints each plan's worst month, the archetypes and the breakeven; `atlas.mjs` the
// events' once-costs, a confirmed guest and the always-open screen. Run: node model.mjs (its unit costs).
//
// Units: dollars, GiB (the site's binary GB), seconds.

const MIB = 1 / 1024; // GiB per MiB
const KB = 1 / (1024 * 1024); // GiB per KiB

// ─── Vendor prices (PRICING.md's table) ────────────────────────────────────────────────────────────────
export const P = {
  r2: { std: 0.015, ia: 0.01, A: 4.5e-6, B: 0.36e-6, iaA: 9.0e-6, iaB: 0.9e-6 },
  queues: { op: 0.4e-6 }, // 3 ops a message
  workers: { base: 5, req: 0.3e-6, cpuMs: 0.02e-6 },
  doReq: 0.15e-6,
  vercel: {
    seat: 20,
    inv: 0.6e-6,
    cpuS: 0.128 / 3600,
    memGBs: 0.0106 / 3600,
    cdnReq: 2.0e-6,
    fdtGB: 0.15,
    fotGB: 0.06,
  },
  supa: {
    pro: 25,
    mau: 0.00325,
    egressGB: 0.09,
    rtMsg: 2.5e-6,
    rtConn: 0.01, // $10 per 1,000 peak
    diskGB: 0.125,
  },
  resend: { pro: 20, over: 0.9e-3 },
  sentryTeam: 26,
  cfPro: 25,
  stripe: { pct: 0.029, fixed: 0.3, billing: 0.007, intl: 0.015 },
};

// ─── ≈ The media (tiers.ts's iPhone basis; the derived copies measured in uploads-and-r2.md) ──
export const M = {
  photo: 3.5 * MIB, // AVG_PHOTO_BYTES
  phone: 1.0 * MIB, // ≈ a 2048 px JPEG (measured 0.57 MiB at 12 MP; 1.0 is the reference party's)
  preview: 60 * KB, // ≈ ~640 px WebP (measured 46 KB)
  clip30: 32.5 * MIB, // 30 s at VIDEO_BYTES_PER_MIN (65 MiB)
};
export const DERIVED_PHOTO = (M.phone + M.preview) / M.photo; // ≈ 0.30

// ─── Per-call costs (Vercel, iad1, on demand) ─────────────────────────────────────────────────
// ≈ a call's CPU and wall: 3 ms of CPU and 4 ms a database round trip (pg_stat_statements read
// 1.4 to 2.8 ms an RPC on 2026-10-03, plus the network), 20 ms an Auth round trip; 2 GB memory
// held for the wall time with no Fluid sharing (conservative). The proxy is its own invocation.
function vercelCall({ rts = 4, authRts = 0, presigns = 0, presignMs = 0.17, outKB = 2 } = {}) {
  const cpuS = 0.003 + (presigns * presignMs) / 1000;
  const wallS = cpuS + rts * 0.004 + authRts * 0.02;
  const proxy = P.vercel.inv + 0.001 * P.vercel.cpuS + 2 * 0.002 * P.vercel.memGBs;
  return (
    P.vercel.inv +
    cpuS * P.vercel.cpuS +
    2 * wallS * P.vercel.memGBs +
    proxy +
    P.vercel.cdnReq +
    outKB * KB * (P.vercel.fdtGB + P.vercel.fotGB)
  );
}
export const CALL = {
  sync304: vercelCall({ rts: 3, outKB: 0.3 }),
  syncDelta: vercelCall({ rts: 6, outKB: 3 }),
  links600: vercelCall({ rts: 5, presigns: 600, outKB: 60 }), // 200 ids x 3 links
  upload: vercelCall({ rts: 4, outKB: 2 }), // presign or complete; 7 RTs over the two
};

// ─── One upload's operations ──────────────────────────────────────────────────────────────────
// uploads-and-r2.md + the backup Worker (workers/backup/src/index.ts:96-107): every object is
// HEADed on the backup (IA B), read from the primary (B) and PUT into the backup (IA A), through
// three Queue operations; photos are three objects (original, preview, phone), videos two.
function uploadOps(objects, heads, backupDerived = true) {
  const backed = backupDerived ? objects : 1;
  return (
    objects * P.r2.A + // PUTs
    heads * P.r2.B + // complete's HEADs
    backed * (P.r2.iaB + P.r2.B + P.r2.iaA) + // backup copy
    backed * 3 * P.queues.op +
    2 * CALL.upload // presign + complete
  );
}
export const OPS = {
  photo: uploadOps(3, 2),
  clip: uploadOps(2, 1),
  photoOriginalsBackup: uploadOps(3, 2, false),
};

// ─── Realtime and the live album ──────────────────────────────────────────────────────────────
// The doorbell: one broadcast per guest-visible media change (20261002200000:477), billed
// 1 + 1 per listener. TODAY every subscribed socket listens (use-gallery-doorbell.ts:19) and syncs
// on a ping within ~2.2 s (refresh-coalescer.ts:38-39, no visibility check), each delta then asks
// links for its new ids, and every 200 sync walks the event's guest uploads and guest rows
// (sync/route.ts:201 -> social.ts:955-989). AFTER album-calm: visible tabs only, one sync per
// ~15 s beat, the delta carries its links.
// ≈ the guest walk's bytes: ~92 B a guest-upload row and ~120 B a guest row of PostgREST JSON.
function liveEvent({
  hours,
  uploads,
  sockets, // connected album tabs on average (today's listeners)
  visibleShare = 0.75, // ≈ of those, visible
  guestUploads, // final count of guest uploads (the walk's A)
  guests, // final guest rows (the walk's G)
  attrBumps = 0, // confirmations after an upload: each stales every held link (links.ts:154)
  interest = 600, // links.ts:124
  mode = "today", // today | calm | levers
}) {
  const T = hours * 3600;
  const r = uploads / T;
  const visible = sockets * visibleShare;
  const listeners = mode === "today" ? sockets : visible;
  const w = mode === "today" ? 2.2 : 15;
  // A leading-edge coalescer: every ping fires when sparse, one fire per window when dense.
  const firesPerTab = (T * r) / (1 + r * w);
  const syncTabs = mode === "today" ? sockets : visible;
  const pollSyncs = syncTabs * hours * 60; // the 60 s safety net (use-live-poll.ts:21)
  const deltaSyncs = syncTabs * firesPerTab;
  // the guest walk on every 200 sync, averaged over the album's growth
  const avgA = guestUploads / 2;
  const avgG = guests / 2;
  const walkRts = mode === "levers" ? 0 : 2 + Math.ceil(avgA / 1000) + Math.ceil(avgG / 1000);
  const walkGB = mode === "levers" ? 0 : (avgA * 92 + avgG * 120) / 1024 ** 3;
  const pings = mode === "levers" ? T / 15 : uploads; // levers: one ping per album a beat
  const messages = pings * (1 + listeners);
  const linksNew = mode === "today" ? deltaSyncs * 0.6 : 0; // the second call (0.6 of deltas carried new ids)
  const remintHourly = syncTabs * hours * (interest / 200);
  const remintAttr = mode === "levers" ? 0 : Math.min(attrBumps, (T / w) * 0.5) * syncTabs * (interest / 200);
  const vercel =
    pollSyncs * CALL.sync304 +
    deltaSyncs * vercelCall({ rts: 6 + walkRts, outKB: 3 }) +
    (linksNew + remintHourly + remintAttr) * CALL.links600;
  const egress = deltaSyncs * walkGB;
  return {
    syncs: Math.round(pollSyncs + deltaSyncs),
    linksCalls: Math.round(linksNew + remintHourly + remintAttr),
    messages: Math.round(messages),
    egressGB: egress,
    vercel,
    supaEgress: egress * P.supa.egressGB,
    realtime: messages * P.supa.rtMsg,
    total: vercel + egress * P.supa.egressGB + messages * P.supa.rtMsg,
  };
}

// ─── Storage per GiB of cap, the worst case by the rules ──────────────────────────────────────
// active ≤ 1.1 x cap (capWithWriteHeadroom, phone_copy.sql:236); Deleted ≤ 1 x cap (the standby
// budget, recently-deleted.ts:22); uploads ≤ m x cap a month (INGRESS_CAP_MULTIPLIER, tiers.ts:224);
// the backup keeps every object ≥ 36 days (prune-strategy.ts:16) and, today, forever (PRUNE_MODE
// dryrun, 500 media a week once live: prune-strategy.ts:27).
export function perGbCap({
  m = 3,
  // trash-in-storage: Deleted is inside the cap, so the bin is no cap of its own; what remains is a refill day's peak
  // (an asked item's object waits for the night's purge), R2 billing each day's peak averaged: m refills a month each
  // add one day at +1.1 cap. Pass bin explicitly to read the old rules.
  bin = (1.1 * m) / 30,
  derived = DERIVED_PHOTO,
  pruneKeepsUp = true,
  monthsAccrued = 12, // when the prune does not keep up: the backup holds every upload
  photoShare = 1,
  backupDerived = true,
}) {
  const d = derived * photoShare;
  const primary = (1.1 + bin) * (1 + d) * P.r2.std;
  const db = backupDerived ? d : 0;
  // The backup holds every live object (active + Deleted) and everything uploaded in the trailing
  // ~43 days (the 36-day gate plus the weekly cadence): with no churn that is the live set; a churner
  // keeps a core and 43 days of uploads. Without a prune that keeps up, every upload stays.
  const backupGB = pruneKeepsUp
    ? Math.max(1.1 + bin, 1.0 + 1.43 * m) * (1 + db)
    : (1.1 + bin + m * monthsAccrued) * (1 + db);
  const backup = backupGB * P.r2.ia;
  const photosPerGb = 1 / M.photo;
  const opsPerGbUploaded =
    photoShare * photosPerGb * (backupDerived ? OPS.photo : OPS.photoOriginalsBackup) +
    (1 - photoShare) * (1 / M.clip30) * OPS.clip;
  const churn = m * opsPerGbUploaded;
  return { primary, backup, churn, total: primary + backup + churn };
}

export function stripeFee(price, { subscription = true, intl = false } = {}) {
  return (
    price * (P.stripe.pct + (subscription ? P.stripe.billing : 0) + (intl ? P.stripe.intl : 0)) +
    P.stripe.fixed
  );
}

// ─── Fixed costs a month at launch ────────────────────────────────────────────────────────────
export const FIXED = {
  vercelPro: P.vercel.seat, // one deploying seat; the $20 credit absorbs the first usage
  supabasePro: P.supa.pro, // Micro covered by the $10 credit
  workersPaid: P.workers.base,
  resendPro: P.resend.pro,
  sentryTeam: P.sentryTeam,
  domain: 2, // ≈ partyreel.com's renewal, a month
};
export const FIXED_TOTAL = Object.values(FIXED).reduce((a, b) => a + b, 0);

// ─── Print ────────────────────────────────────────────────────────────────────────────────────
const $ = (x, d = 2) => (x >= 100 ? `$${Math.round(x).toLocaleString("en-US")}` : `$${x.toFixed(d)}`);
const n = (x) => Math.round(x).toLocaleString("en-US");

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("## Unit costs\n");
  console.log(`derived photo share ≈ ${(DERIVED_PHOTO * 100).toFixed(0)}%`);
  for (const [k, v] of Object.entries(CALL)) console.log(`call ${k}: $${(v * 1e6).toFixed(2)} a million`);
  for (const [k, v] of Object.entries(OPS)) console.log(`upload ${k}: $${(v * 1e6).toFixed(1)} a million (${$(v * 1e3, 3)} a thousand)`);
  const perGbPhotos = OPS.photo / M.photo;
  console.log(`ops per GiB of photos uploaded: ${$(perGbPhotos, 4)}; of 30 s clips: ${$(OPS.clip / M.clip30, 5)}`);

  console.log("\n## Per GiB of cap a month (worst case by the rules)\n");
  console.log("| case | primary | backup | churn ops | total |\n| --- | --- | --- | --- | --- |");
  const cases = [
    ["full, no churn, empty bin (a real full host), photos", { m: 0, bin: 0 }],
    ["full, no churn, empty bin, video", { m: 0, bin: 0, photoShare: 0 }],
    ["today's rules: 3x churn, bin full, prune keeping up, photos", { m: 3 }],
    ["today's rules, prune NOT keeping up (a year of accrual), photos", { m: 3, pruneKeepsUp: false }],
    ["2x churn, bin full, photos", { m: 2 }],
    ["1x churn, bin full, photos", { m: 1 }],
    ["1x churn, bin full, originals-only backup, photos", { m: 1, backupDerived: false }],
    ["1x churn, bin full, video", { m: 1, photoShare: 0 }],
  ];
  for (const [label, o] of cases) {
    const r = perGbCap(o);
    console.log(`| ${label} | ${$(r.primary, 4)} | ${$(r.backup, 4)} | ${$(r.churn, 4)} | ${$(r.total, 4)} |`);
  }

  console.log("\n## Live events\n");
  const ref = { hours: 5, uploads: 2100, sockets: 20, guestUploads: 2000, guests: 200, attrBumps: 50 };
  const wed = { hours: 5, uploads: 10000, sockets: 200, guestUploads: 9500, guests: 2000, attrBumps: 500 };
  for (const [label, ev] of [["reference party", ref], ["2,000-guest wedding", wed]]) {
    for (const mode of ["today", "calm", "levers"]) {
      const r = liveEvent({ ...ev, mode });
      console.log(
        `${label} [${mode}]: syncs ${n(r.syncs)}, links calls ${n(r.linksCalls)}, messages ${n(r.messages)}, ` +
          `egress ${r.egressGB.toFixed(1)} GiB -> vercel ${$(r.vercel)}, egress ${$(r.supaEgress)}, realtime ${$(r.realtime)}, total ${$(r.total)}`,
      );
    }
  }

  console.log("\n## Fixed\n");
  console.log(FIXED, "total", FIXED_TOTAL);
  for (const p of [9, 12, 15, 19, 24, 29, 39, 49, 90, 99, 120, 190, 290, 390]) {
    console.log(`stripe on $${p}: sub ${$(stripeFee(p))} (${((stripeFee(p) / p) * 100).toFixed(1)}%), one-time ${$(stripeFee(p, { subscription: false }))}`);
  }
}
