/**
 * THE SPEND WATCH'S RULES (lane `spend-watch`, 2026-10-03; admin-observability.md, "The spend watch").
 *
 * Supabase has no budget alert and no ceiling but its on/off spend cap, Cloudflare has no cap at all, and Will wants
 * alerts with a ceiling that extreme growth passes but a runaway loop cannot. So the guards are circuit breakers, not
 * budgets: each run reads our own counters, and a reading past TEN TIMES the busiest reading of the past week (never
 * below a floor a quiet week cannot reach) alerts, and, where a false alarm costs no guest's moment, pauses the switch
 * that stops its vector. Growth is never a 10x day; a looped function is.
 *
 * PURE on purpose (no env, no DB, no `server-only`): the run (`spend-watch-run.ts`) takes the readings and acts, the
 * jobs console reads a run back through `parseStoredRun`, and everything that decides is tested next door.
 *
 * ★ A MISSING READING IS NEVER A ZERO. A reading that could not be taken is `missing` (the card says "No reading" and
 * the run closes as an error); one with no baseline yet is `warming` (a first run, or a gap past two days). Neither
 * trips and neither feeds a ceiling.
 *
 * ★ A TRIP NEVER RAISES ITS OWN CEILING. The busiest reading of the week leaves out every reading that tripped, so a
 * runaway is never the new normal and the same loop trips again next week.
 */
import { LIFECYCLE_KINDS } from "@/lib/email/send-kinds";
import { formatCount } from "@/lib/format/count";
import { formatBytes } from "@/lib/utils";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const GB = 1024 ** 3;

/** The ceiling is this many times the busiest reading of the trailing week. */
export const CEILING_MULTIPLIER = 10;

/** How far back the busiest reading is looked for. */
export const TRAILING_MS = 7 * DAY_MS;

/**
 * A reading diffed against the last one needs at least an hour between them: a Run now ten minutes after the cron
 * reads against the reading before it, so a party's busiest ten minutes are never scaled up into an hour's runaway.
 */
export const MIN_WINDOW_MS = HOUR_MS;

/** A baseline older than this is not diffed against (an average over days would hide a spike): the run warms again. */
export const MAX_BASELINE_AGE_MS = 2 * DAY_MS;

/**
 * Resend's free plan stops at 100 mails a day, Supabase Auth's sign-in codes included (they ride Resend's SMTP). A
 * reading of Resend's own count is never let past 80% of it, so we hear before the stop silences the alert mail
 * itself. ★ A LAUNCH SWITCH: null at the Resend Pro cutover, which has no daily quota (only the monthly one).
 */
export const RESEND_DAILY_QUOTA: number | null = 100;

/** How many pages of Resend's sent-mail list one run reads at most (100 a page); past it the count is a floor. */
export const RESEND_MAX_PAGES = 30;

export type ReadingId =
  | "uploads"
  | "upload_bytes"
  | "album_changes"
  | "lifecycle_mail"
  | "resend_mail"
  | "sign_ins"
  | "downloads"
  | "purge_runs"
  | "drive_bytes";

/** The `ops_flags` rows a trip can act on, each failing in its own direction (admin-observability.md). */
export type SwitchKey =
  | "uploads_enabled"
  | "lifecycle_mail_enabled"
  | "export_enabled"
  | "purge_cron_enabled"
  | "drive_export_enabled";

export const SWITCH_KEYS: readonly SwitchKey[] = [
  "uploads_enabled",
  "lifecycle_mail_enabled",
  "export_enabled",
  "purge_cron_enabled",
  "drive_export_enabled",
];

/** Each switch in the console's and the alert's words. */
export const SWITCH_LABEL: Record<SwitchKey, string> = {
  uploads_enabled: "Guest uploads",
  lifecycle_mail_enabled: "Lifecycle mail",
  export_enabled: "Download all",
  purge_cron_enabled: "The purge sweep",
  drive_export_enabled: "Send to Google Drive",
};

/**
 * What a trip does about its vector.
 *  - `pause`: the watch pauses the switch itself, on a new trip, because a false alarm there delays a reminder, a
 *    zip or a night's reclamation and never a guest's moment.
 *  - `offer`: it alerts and the card offers the switch, because a false alarm would stop a real party (PRICING.md's
 *    rule that blocking a paying host by mistake is the one failure worth engineering against).
 *  - `alert`: nothing of ours stops it without hurting someone; the alert is the guard.
 */
export type StopPolicy =
  | { kind: "pause"; switch: SwitchKey }
  | { kind: "offer"; switch: SwitchKey }
  | { kind: "alert" };

export type ReadingDef = {
  id: ReadingId;
  label: string;
  /** What one reading is a rate of. */
  unit: "hour" | "day";
  /**
   * `since_last`: a cumulative counter (the uploads meter, the album versions) diffed against the last reading at
   * least an hour old, as a rate an hour. `last_day`: a count of the last 24 hours, read whole each run, so an
   * hourly cadence never scales one scheduled run up to 24 a day.
   */
  window: "since_last" | "last_day";
  measure: "count" | "bytes";
  /** The ceiling's least value: what a quiet week cannot reach. Ours to change. */
  floor: number;
  /** The ceiling's greatest value, where a vendor's own hard stop binds. */
  cap?: number;
  stop: StopPolicy;
  /** Where the number comes from, in the card's words. */
  source: string;
  /** What a trip most likely means and what to look at, said where it shows. */
  remedy: string;
};

/**
 * THE READINGS, in the card's order. Every floor is the size of a big night at today's scale, so nothing short of a
 * runaway reaches it before real traffic raises the week's peak; past launch the 10x peak takes over.
 */
export const READINGS: readonly ReadingDef[] = [
  {
    id: "uploads",
    label: "Uploads",
    unit: "hour",
    window: "since_last",
    measure: "count",
    // A 200-guest party adds about 2,100 items over five hours; a 2,000-guest one peaks past this.
    floor: 1_000,
    stop: { kind: "offer", switch: "uploads_enabled" },
    source: "the monthly uploads meter (storage_ledger), deletes included",
    remedy:
      "A real party reads like this too. Look at /admin/metrics and the album it comes from before pausing guest uploads.",
  },
  {
    id: "upload_bytes",
    label: "Bytes uploaded",
    unit: "hour",
    window: "since_last",
    measure: "bytes",
    // The reference party stores about 12 GB over five hours.
    floor: 10 * GB,
    stop: { kind: "offer", switch: "uploads_enabled" },
    source: "the monthly uploads meter (storage_ledger), deletes included",
    remedy:
      "Big videos read like this too. A loop that uploads and deletes shows here and not in storage, since the meter never refunds.",
  },
  {
    id: "album_changes",
    label: "Album changes",
    unit: "hour",
    window: "since_last",
    measure: "count",
    // About one change an upload, so twice the uploads floor.
    floor: 2_000,
    stop: { kind: "alert" },
    source: "every album's change counters (album_state)",
    remedy:
      "Each change pings every open album. Changes without uploads behind them are a loop of approvals, removals or attributions.",
  },
  {
    id: "lifecycle_mail",
    label: "Lifecycle mail",
    unit: "day",
    window: "last_day",
    measure: "count",
    // Half of Resend's free day.
    floor: 50,
    stop: { kind: "pause", switch: "lifecycle_mail_enabled" },
    source: "the mail the nightly sweeps sent hosts (sent_emails)",
    remedy:
      "The sweeps mail each host once a state, so a jump is a dedupe key that changes every night, or the sweep run over and over.",
  },
  {
    id: "resend_mail",
    label: "Mail through Resend",
    unit: "day",
    window: "last_day",
    measure: "count",
    floor: 50,
    ...(RESEND_DAILY_QUOTA === null
      ? {}
      : { cap: Math.floor(RESEND_DAILY_QUOTA * 0.8) }),
    stop: { kind: "alert" },
    source:
      "Resend's own list of sent mail, every sender: sign-in codes, lifecycle and operator mail",
    remedy:
      "Supabase Auth's hourly email limit bounds the sign-in codes. Past Resend's daily quota every mail stops, the alerts included.",
  },
  {
    id: "sign_ins",
    label: "Accounts signed in",
    unit: "day",
    window: "last_day",
    measure: "count",
    floor: 200,
    stop: { kind: "alert" },
    source: "accounts whose last sign-in falls in the day (auth.users)",
    remedy:
      "Each one is a monthly active user and usually a sign-in code. Supabase Auth's rate limits bound them per address and per network.",
  },
  {
    id: "downloads",
    label: "Download all",
    unit: "day",
    window: "last_day",
    measure: "count",
    floor: 100,
    stop: { kind: "pause", switch: "export_enabled" },
    source: "the zips minted (export_log)",
    remedy:
      "Each zip reads every object once. A client minting over and over is the shape; /admin/exports shows who and which album.",
  },
  {
    id: "purge_runs",
    label: "Purge sweep runs",
    unit: "day",
    window: "last_day",
    measure: "count",
    // One scheduled run and a few Run nows.
    floor: 4,
    stop: { kind: "pause", switch: "purge_cron_enabled" },
    source: "the purge sweep's runs that did work (job_runs)",
    remedy:
      "The cron fires once a day. More is a Run now pressed again and again, a schedule set too often, or the cron secret in someone else's hands.",
  },
  {
    id: "drive_bytes",
    label: "Sent to Google Drive",
    unit: "day",
    window: "last_day",
    measure: "bytes",
    // More than one account at its whole day (we stop each at 700 GB, under Google's 750): a crowd, not a host.
    floor: 1024 * GB,
    stop: { kind: "pause", switch: "drive_export_enabled" },
    source: "what every connection's lanes uploaded, an hour a row (cloud_export_sent_hours)",
    remedy:
      "Each send reads every original once. The vector is an album sent, deleted from Drive and sent again; the account breaker stops one account, this a crowd. Paused sends wait and lose nothing. /admin/exports#drive shows who.",
  },
];

export function readingById(id: string): ReadingDef | undefined {
  return READINGS.find((r) => r.id === id);
}

/** The lifecycle kinds the SQL counts, from mail's own registry (never retyped here). */
export const LIFECYCLE_MAIL_KINDS: readonly string[] = LIFECYCLE_KINDS;

// ── A reading as taken ────────────────────────────────────────────────────────────────────────────

/** One reading as the run took it, before it is judged. */
export type Taken =
  | { kind: "value"; value: number; atLeast?: boolean }
  /** No baseline to diff against yet: a first run, or a gap past MAX_BASELINE_AGE_MS. */
  | { kind: "warming"; why: string }
  /** Could not be read. Never a zero. */
  | { kind: "missing"; why: string };

export type VerdictState = "ok" | "tripped" | "warming" | "missing";

export type Verdict = {
  id: ReadingId;
  state: VerdictState;
  /** The reading, a rate in its unit; null when warming or missing. */
  value: number | null;
  /** A count that hit its page cap: the true number is at least this. */
  atLeast: boolean;
  /** The busiest untripped reading of the trailing week, or null with no week yet. */
  peak: number | null;
  ceiling: number;
  /** What set the ceiling: ten times the peak, the floor, or a vendor's cap. */
  basis: "peak" | "floor" | "cap";
  why?: string;
};

/** The ceiling a reading is judged against. */
export function ceilingOf(
  def: ReadingDef,
  peak: number | null,
): { ceiling: number; basis: Verdict["basis"] } {
  const fromPeak = peak === null ? 0 : CEILING_MULTIPLIER * peak;
  let ceiling = Math.max(fromPeak, def.floor);
  let basis: Verdict["basis"] = fromPeak > def.floor ? "peak" : "floor";
  if (def.cap !== undefined && ceiling > def.cap) {
    ceiling = def.cap;
    basis = "cap";
  }
  return { ceiling, basis };
}

// ── The record a run keeps, and reading it back ───────────────────────────────────────────────────

/** The monthly uploads meter's platform totals: period ('YYYY-MM') -> [bytes, items]. */
export type LedgerSnap = Record<string, [number, number]>;

export type Snapshot = {
  ledger?: LedgerSnap;
  /** Every album's change counters, summed. */
  album?: number;
};

export type StoredReading = {
  state: VerdictState;
  value: number | null;
  ceiling?: number;
  basis?: Verdict["basis"];
  peak?: number | null;
  at_least?: boolean;
  why?: string;
};

/** One run of the watch, as the next run and the console read it back from `job_runs.counts`. */
export type StoredRun = {
  /** When the readings were taken. */
  readAtMs: number;
  /** Where the `since_last` readings' window began (null: they warmed). */
  fromMs: number | null;
  readings: Partial<Record<ReadingId, StoredReading>>;
  snap: Snapshot;
  /** Switches the watch paused itself, with the instant it wrote (its `ops_flags.updated_at`). */
  pausedAt: Partial<Record<SwitchKey, string>>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const STATES: readonly VerdictState[] = ["ok", "tripped", "warming", "missing"];

function parseLedger(value: unknown): LedgerSnap | undefined {
  if (!isRecord(value)) return undefined;
  const out: LedgerSnap = {};
  for (const [period, pair] of Object.entries(value)) {
    if (!/^\d{4}-\d{2}$/.test(period) || !Array.isArray(pair)) return undefined;
    const bytes = finiteOrNull(pair[0]);
    const items = finiteOrNull(pair[1]);
    if (bytes === null || items === null) return undefined;
    out[period] = [bytes, items];
  }
  return out;
}

/**
 * A run's counts, read back defensively: anything this code does not recognise reads as absent (no reading, no
 * baseline), never as a zero. Null when the counts are not a watch run's at all.
 */
export function parseStoredRun(
  counts: unknown,
  startedAtMs: number,
): StoredRun | null {
  if (!isRecord(counts) || !isRecord(counts.readings)) return null;
  const window = isRecord(counts.window) ? counts.window : {};
  const to = typeof window.to === "string" ? Date.parse(window.to) : NaN;
  const from = typeof window.from === "string" ? Date.parse(window.from) : NaN;

  const readings: Partial<Record<ReadingId, StoredReading>> = {};
  for (const def of READINGS) {
    const raw = counts.readings[def.id];
    if (!isRecord(raw)) continue;
    const state = STATES.find((s) => s === raw.state);
    if (!state) continue;
    const value = finiteOrNull(raw.value);
    // A judged reading carries its number; one that says ok or tripped without it is not one this code wrote.
    if ((state === "ok" || state === "tripped") && value === null) continue;
    readings[def.id] = {
      state,
      value,
      ceiling: finiteOrNull(raw.ceiling) ?? undefined,
      basis:
        raw.basis === "peak" || raw.basis === "floor" || raw.basis === "cap"
          ? raw.basis
          : undefined,
      peak: finiteOrNull(raw.peak),
      at_least: raw.at_least === true,
      why: typeof raw.why === "string" ? raw.why : undefined,
    };
  }

  const snapRaw = isRecord(counts.snap) ? counts.snap : {};
  const snap: Snapshot = {};
  const ledger = parseLedger(snapRaw.ledger);
  if (ledger) snap.ledger = ledger;
  const album = finiteOrNull(snapRaw.album);
  if (album !== null) snap.album = album;

  const pausedAt: Partial<Record<SwitchKey, string>> = {};
  if (isRecord(counts.paused_at)) {
    for (const key of SWITCH_KEYS) {
      const at = counts.paused_at[key];
      if (typeof at === "string" && Number.isFinite(Date.parse(at))) {
        pausedAt[key] = at;
      }
    }
  }

  return {
    readAtMs: Number.isFinite(to) ? to : startedAtMs,
    fromMs: Number.isFinite(from) ? from : null,
    readings,
    snap,
    pausedAt,
  };
}

// ── Taking the `since_last` readings ──────────────────────────────────────────────────────────────

/**
 * The run whose snapshot a `since_last` reading diffs against: the newest earlier reading at least MIN_WINDOW_MS
 * old and at most MAX_BASELINE_AGE_MS. Null warms the reading (it is taken whole next time).
 */
export function baselineRun(
  history: readonly StoredRun[],
  nowMs: number,
): StoredRun | null {
  let best: StoredRun | null = null;
  for (const run of history) {
    const age = nowMs - run.readAtMs;
    if (age < MIN_WINDOW_MS || age > MAX_BASELINE_AGE_MS) continue;
    if (!best || run.readAtMs > best.readAtMs) best = run;
  }
  return best;
}

/**
 * What the uploads meter grew by between two snapshots. The meter never refunds, so this counts every upload,
 * deleted or not; a period's total that fell (an account deleted, its ledger rows with it) contributes nothing
 * rather than cancelling another's growth.
 */
export function ledgerGrowth(
  from: LedgerSnap,
  to: LedgerSnap,
): { bytes: number; items: number } {
  let bytes = 0;
  let items = 0;
  for (const [period, [b, i]] of Object.entries(to)) {
    const [b0, i0] = from[period] ?? [0, 0];
    bytes += Math.max(0, b - b0);
    items += Math.max(0, i - i0);
  }
  return { bytes, items };
}

/** A count over a window, as a rate in the reading's unit. */
export function ratePer(
  unit: ReadingDef["unit"],
  amount: number,
  windowMs: number,
): number {
  const unitMs = unit === "hour" ? HOUR_MS : DAY_MS;
  return (amount * unitMs) / windowMs;
}

/** The current DB snapshot and counts, as the reading RPC answers them (`spend_watch_readings`). */
export type DbReadings = {
  ledger?: LedgerSnap;
  album?: number;
  lifecycle_mail?: number;
  sign_ins?: number;
  downloads?: number;
  purge_runs?: number;
  drive_bytes?: number;
  /** Per section, the error that section met: that reading is missing, the rest stand. */
  errors: Record<string, string>;
};

/** The RPC's jsonb, read defensively: a section this code cannot read is an error of that section, never a zero. */
export function parseDbReadings(data: unknown): DbReadings {
  if (!isRecord(data))
    throw new TypeError("spend_watch_readings: not an object");
  const errors: Record<string, string> = {};
  if (isRecord(data.errors)) {
    for (const [section, message] of Object.entries(data.errors)) {
      errors[section] = typeof message === "string" ? message : "unknown error";
    }
  }
  const out: DbReadings = { errors };
  if ("ledger" in data) {
    const ledger = parseLedger(data.ledger);
    if (ledger) out.ledger = ledger;
    else errors.ledger ??= "the ledger totals were not a period map";
  }
  for (const key of [
    "album",
    "lifecycle_mail",
    "sign_ins",
    "downloads",
    "purge_runs",
    "drive_bytes",
  ] as const) {
    if (!(key in data)) continue;
    const value = finiteOrNull(data[key]);
    if (value === null || value < 0) {
      errors[key] ??= `${key} was not a count`;
    } else {
      out[key] = value;
    }
  }
  return out;
}

/** What Resend's own list answered for the last day. */
export type ResendTaken =
  | { ok: true; count: number; atLeast: boolean }
  | { ok: false; why: string };

/**
 * EVERY READING, TAKEN. `db` null means the reading RPC failed whole (each DB reading is then missing with its
 * reason); a section the RPC could not read is missing alone.
 */
export function takeReadings(input: {
  nowMs: number;
  db: DbReadings | null;
  dbError?: string;
  resend: ResendTaken;
  baseline: StoredRun | null;
}): Record<ReadingId, Taken> {
  const { nowMs, db, baseline } = input;
  const whole = input.dbError ?? "the readings could not be read";
  const missing = (why: string): Taken => ({ kind: "missing", why });

  const dayCount = (section: keyof DbReadings & ReadingId): Taken => {
    if (!db) return missing(whole);
    const error = db.errors[section];
    if (error) return missing(error);
    const value = db[section];
    return typeof value === "number"
      ? { kind: "value", value }
      : missing(`${section} was not answered`);
  };

  const windowMs = baseline ? nowMs - baseline.readAtMs : null;
  const warming = (what: string): Taken => ({
    kind: "warming",
    why: baseline
      ? `the last reading kept no ${what} to compare against`
      : "a first reading: the next run measures from this one",
  });

  let uploads: Taken;
  let uploadBytes: Taken;
  if (!db) {
    uploads = missing(whole);
    uploadBytes = missing(whole);
  } else if (db.errors.ledger || !db.ledger) {
    uploads = missing(db.errors.ledger ?? "the ledger was not answered");
    uploadBytes = uploads;
  } else if (!baseline?.snap.ledger || windowMs === null) {
    uploads = warming("ledger totals");
    uploadBytes = uploads;
  } else {
    const grown = ledgerGrowth(baseline.snap.ledger, db.ledger);
    uploads = { kind: "value", value: ratePer("hour", grown.items, windowMs) };
    uploadBytes = {
      kind: "value",
      value: ratePer("hour", grown.bytes, windowMs),
    };
  }

  let albumChanges: Taken;
  if (!db) albumChanges = missing(whole);
  else if (db.errors.album || db.album === undefined) {
    albumChanges = missing(
      db.errors.album ?? "the album counters were not answered",
    );
  } else if (baseline?.snap.album === undefined || windowMs === null) {
    albumChanges = warming("album counters");
  } else {
    albumChanges = {
      kind: "value",
      // Counters only fall when an album's event is purged for good; that never reads as negative change.
      value: ratePer(
        "hour",
        Math.max(0, db.album - baseline.snap.album),
        windowMs,
      ),
    };
  }

  const resend: Taken = input.resend.ok
    ? {
        kind: "value",
        value: input.resend.count,
        atLeast: input.resend.atLeast,
      }
    : missing(input.resend.why);

  return {
    uploads,
    upload_bytes: uploadBytes,
    album_changes: albumChanges,
    lifecycle_mail: dayCount("lifecycle_mail"),
    resend_mail: resend,
    sign_ins: dayCount("sign_ins"),
    downloads: dayCount("downloads"),
    purge_runs: dayCount("purge_runs"),
    drive_bytes: dayCount("drive_bytes"),
  };
}

// ── Judging ───────────────────────────────────────────────────────────────────────────────────────

/**
 * The busiest reading of the trailing week, leaving out every reading that tripped (a runaway is never the new
 * normal) and every one that was not taken (a missing or warming reading is no evidence of a quiet hour).
 */
export function trailingPeak(
  id: ReadingId,
  history: readonly StoredRun[],
  nowMs: number,
): number | null {
  let peak: number | null = null;
  for (const run of history) {
    if (run.readAtMs >= nowMs || nowMs - run.readAtMs > TRAILING_MS) continue;
    const reading = run.readings[id];
    if (!reading || reading.state !== "ok" || reading.value === null) continue;
    if (peak === null || reading.value > peak) peak = reading.value;
  }
  return peak;
}

/** One reading, judged. Strictly past the ceiling trips; at it does not. */
export function judge(
  def: ReadingDef,
  taken: Taken,
  history: readonly StoredRun[],
  nowMs: number,
): Verdict {
  const peak = trailingPeak(def.id, history, nowMs);
  const { ceiling, basis } = ceilingOf(def, peak);
  if (taken.kind !== "value") {
    return {
      id: def.id,
      state: taken.kind,
      value: null,
      atLeast: false,
      peak,
      ceiling,
      basis,
      why: taken.why,
    };
  }
  return {
    id: def.id,
    // An "at least" count past the ceiling is past it for certain; one under it may be under or over, and reads ok
    // with its "at least" said on the card.
    state: taken.value > ceiling ? "tripped" : "ok",
    value: taken.value,
    atLeast: taken.atLeast === true,
    peak,
    ceiling,
    basis,
  };
}

export function judgeAll(
  taken: Record<ReadingId, Taken>,
  history: readonly StoredRun[],
  nowMs: number,
): Verdict[] {
  return READINGS.map((def) => judge(def, taken[def.id], history, nowMs));
}

// ── Acting ────────────────────────────────────────────────────────────────────────────────────────

export type SwitchState = {
  enabled: boolean;
  /** `ops_flags.updated_at`; null for a row not seeded yet (which reads as on). */
  updatedAtMs: number | null;
};

export type SwitchStates = Partial<Record<SwitchKey, SwitchState>>;

export type ActionPlan = {
  /** Switches to pause now: a NEW trip of a `pause` reading, its switch on, and the watch allowed to act. */
  pause: SwitchKey[];
  /** Switches the alert and the card offer (an `offer` reading tripped and its switch is still on). */
  offer: SwitchKey[];
  /** `pause` switches a trip would have paused that were already off (an operator's, or an earlier trip's). */
  alreadyOff: SwitchKey[];
  /** `pause` switches a trip did not pause because the trip is not new (an operator's resume wins until it clears). */
  ongoing: SwitchKey[];
};

/**
 * WHAT THE TRIPS DO. A trip pauses its switch only when it is NEW (the run before did not trip that reading): a
 * runaway still inside the window reads tripped for a while, and an operator who turned the switch back on in the
 * meantime made a decision the watch must not undo every hour. Once a reading clears, its next trip is new again.
 * `mayPause` false (the watch's own switch unreadable, or the switches unreadable) alerts without acting.
 */
export function planActions(input: {
  verdicts: readonly Verdict[];
  previous: StoredRun | null;
  switches: SwitchStates | null;
  mayPause: boolean;
}): ActionPlan {
  const plan: ActionPlan = {
    pause: [],
    offer: [],
    alreadyOff: [],
    ongoing: [],
  };
  const add = (list: SwitchKey[], key: SwitchKey) => {
    if (!list.includes(key)) list.push(key);
  };
  for (const verdict of input.verdicts) {
    if (verdict.state !== "tripped") continue;
    const def = readingById(verdict.id);
    if (!def || def.stop.kind === "alert") continue;
    const key = def.stop.switch;
    const state = input.switches?.[key];
    // An unread switch is treated as on: offering a switch that is already off costs a line, never a pause.
    const on = state ? state.enabled : true;
    if (def.stop.kind === "offer") {
      if (on) add(plan.offer, key);
      continue;
    }
    if (!on) {
      add(plan.alreadyOff, key);
      continue;
    }
    const wasTripped =
      input.previous?.readings[verdict.id]?.state === "tripped";
    if (wasTripped) {
      add(plan.ongoing, key);
      continue;
    }
    if (input.mayPause && input.switches && state) add(plan.pause, key);
    else add(plan.offer, key);
  }
  // A switch one reading pauses is not also offered by another.
  plan.offer = plan.offer.filter((key) => !plan.pause.includes(key));
  return plan;
}

/**
 * THE SWITCHES THE WATCH PAUSED THAT ARE STILL ITS PAUSE. A pause it made stays its own until a person touches the
 * switch: still off, and `updated_at` still the instant the watch wrote. While one stands, the watch's run reads
 * attention (the bell), because an auto-pause is a person's call to keep or undo, never the watch's to lift. An
 * unreadable switch keeps its record (the next readable run decides).
 */
export function carryPaused(input: {
  history: readonly StoredRun[];
  switches: SwitchStates | null;
  justPaused: Partial<Record<SwitchKey, string>>;
}): Partial<Record<SwitchKey, string>> {
  const latest: Partial<Record<SwitchKey, string>> = {};
  for (const run of input.history) {
    for (const key of SWITCH_KEYS) {
      const at = run.pausedAt[key];
      if (!at) continue;
      const current = latest[key];
      if (!current || Date.parse(at) > Date.parse(current)) latest[key] = at;
    }
  }
  const out: Partial<Record<SwitchKey, string>> = {};
  for (const key of SWITCH_KEYS) {
    const at = latest[key];
    if (!at) continue;
    if (!input.switches) {
      out[key] = at;
      continue;
    }
    const state = input.switches[key];
    if (!state) {
      out[key] = at;
      continue;
    }
    if (!state.enabled && state.updatedAtMs === Date.parse(at)) out[key] = at;
  }
  for (const key of SWITCH_KEYS) {
    const at = input.justPaused[key];
    if (at) out[key] = at;
  }
  return out;
}

/**
 * The switches a run's trips left for a person (an `offer` reading that tripped), so the console can say so beside
 * the switch itself, where the one press is.
 */
export function offeredSwitches(run: StoredRun): {
  key: SwitchKey;
  readings: ReadingId[];
}[] {
  const out: { key: SwitchKey; readings: ReadingId[] }[] = [];
  for (const def of READINGS) {
    if (def.stop.kind !== "offer") continue;
    if (run.readings[def.id]?.state !== "tripped") continue;
    const key = def.stop.switch;
    const entry = out.find((o) => o.key === key);
    if (entry) entry.readings.push(def.id);
    else out.push({ key, readings: [def.id] });
  }
  return out;
}

// ── The run's own record ──────────────────────────────────────────────────────────────────────────

/** `job_runs.counts` for a run, in the shape `parseStoredRun` reads back. */
export function runCounts(input: {
  nowMs: number;
  baseline: StoredRun | null;
  verdicts: readonly Verdict[];
  snap: Snapshot;
  pausedAt: Partial<Record<SwitchKey, string>>;
  /**
   * Guest uploads are off, whoever paused them. Every guest is refused while it lasts, so a pause nobody remembers
   * must keep ringing: it holds the watch at attention until a person turns uploads back on.
   */
  uploadsPaused?: boolean;
}): Record<string, unknown> {
  const readings: Record<string, StoredReading> = {};
  for (const v of input.verdicts) {
    readings[v.id] = {
      state: v.state,
      value: v.value,
      ceiling: v.ceiling,
      basis: v.basis,
      peak: v.peak,
      ...(v.atLeast ? { at_least: true } : {}),
      ...(v.why ? { why: v.why.slice(0, 200) } : {}),
    };
  }
  const tripped = input.verdicts.filter((v) => v.state === "tripped").length;
  const missing = input.verdicts.filter((v) => v.state === "missing").length;
  const paused = Object.keys(input.pausedAt).length;
  return {
    // The three numbers the console's generic line prints; zero on a quiet night, so nothing prints.
    tripped,
    missing,
    paused,
    // The orphan breaker's flag, shared: a trip, a pause of the watch's still standing, or guest uploads off is a
    // person's call, and `jobHealth` reads it as attention (the bell and the band).
    ...(input.uploadsPaused ? { uploads_paused: true } : {}),
    ...(tripped > 0 || paused > 0 || input.uploadsPaused
      ? { breaker_tripped: true }
      : {}),
    window: {
      from: input.baseline
        ? new Date(input.baseline.readAtMs).toISOString()
        : null,
      to: new Date(input.nowMs).toISOString(),
    },
    readings,
    snap: input.snap,
    paused_at: input.pausedAt,
  };
}

// ── Words ─────────────────────────────────────────────────────────────────────────────────────────

/** A reading's number alone, in its measure: "1,240", "2.4 GB", "0.4". */
export function formatAmount(def: ReadingDef, value: number): string {
  if (def.measure === "bytes") return formatBytes(value);
  // A rate under ten keeps one decimal (a quiet hour reads 0.4, not 0); a day's count is whole.
  const rounded =
    def.window === "since_last" && value < 10
      ? Math.round(value * 10) / 10
      : Math.round(value);
  return formatCount(rounded);
}

/** A reading's number in its own words: "1,240 an hour", "2.4 GB an hour", "35 a day". */
export function formatReading(def: ReadingDef, value: number): string {
  return `${formatAmount(def, value)} ${def.unit === "hour" ? "an hour" : "a day"}`;
}

/** What set a ceiling, in the card's and the alert's words. */
export const BASIS_WORDS: Record<Verdict["basis"], string> = {
  peak: `${CEILING_MULTIPLIER}x the week's busiest`,
  floor: "its floor",
  cap: "under the vendor's own daily stop",
};
