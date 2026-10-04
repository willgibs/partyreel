/**
 * THE LIMITS WATCH'S RULES (lane `limits-watch`, 2026-10-04; admin-observability.md, "Plan limits").
 *
 * The spend watch is a circuit breaker for a runaway loop (ten times the busiest reading of the week). Nothing watched
 * the slow climb toward a plan's hard ceiling, and on Vercel Hobby a broken limit pauses every function: Will's
 * "always hate seeing us break limits without catching them scaling". So each run also reads every meter of
 * `limits-watch-limits.ts`, judges its share of the plan's limit and its days left at the trailing week's rate, and
 * mails one crossing at a time.
 *
 * PURE on purpose (no env, no DB, no `server-only`): the run (`limits-watch-run.ts`) reads and acts, the jobs console
 * reads a run back through `parseStoredLimits`, and everything that decides is tested next door.
 *
 * THE THRESHOLDS: a WARNING at 60% of the limit or 30 days left, CRITICAL at 85% or 7 days left.
 *
 * ★ A MISSING READING IS NEVER A ZERO (the spend watch's rule). A meter that could not be read says why and has no
 * share, no level and no bar; it never trips and never calms. Only a read that FAILED fails the run: a meter whose
 * credential the app does not hold yet (`needs`) or whose vendor reports none (`unavailable`) is a known gap the card
 * prints in words, because a run red forever over a Question would hide the day it is red for a real reason.
 *
 * ★ A CROSSING IS MAILED ONCE. A meter is mailed only when its level rises above the level it was last TOLD, and it
 * forgets that only when it falls clearly back (`nextTold`), so a meter that sits at a level mails nothing more and
 * one that hovers on a threshold mails nothing more either.
 */
import { formatCount } from "@/lib/format/count";
import {
  METERS,
  VENDORS,
  type Measure,
  type MeterDef,
  type MeterId,
} from "@/lib/jobs/limits-watch-limits";

const MS_DAY = 24 * 60 * 60 * 1000;

export type Level = "ok" | "warn" | "critical";

export const LEVEL_RANK: Record<Level, number> = {
  ok: 0,
  warn: 1,
  critical: 2,
};

export const LEVEL_WORD: Record<Level, string> = {
  ok: "OK",
  warn: "Warning",
  critical: "Critical",
};

/** A share of the limit at which a meter warns, and at which it is critical. */
export const WARN_SHARE = 0.6;
export const CRITICAL_SHARE = 0.85;
/** The days left to the ceiling, at the trailing week's rate, at which a meter warns and is critical. */
export const WARN_DAYS = 30;
export const CRITICAL_DAYS = 7;

/** The rate is the mean of this many complete days (a new meter's fewer, from `MIN_RATE_DAYS`). */
export const RATE_DAYS = 7;
export const MIN_RATE_DAYS = 3;
/** A level is forgotten only once it holds with this much more of the limit used (5 points), or this much fewer days. */
const REARM_SHARE_MARGIN = 0.05;
const REARM_DAYS_FACTOR = 0.8;

/** A gauge's climb is taken from our own earlier readings: none older than this, the oldest one at least this far back. */
const GAUGE_WINDOW_MS = 8 * MS_DAY;
export const MIN_GAUGE_SPAN_MS = 2 * MS_DAY;

/** A rolling window is this many days long, and its projection looks as far ahead. */
const ROLLING_DAYS = 30;

/** A reading older than this when the card draws it is stale: the watch has not run (twice the daily cadence). */
export const LIMITS_STALE_MS = 2 * MS_DAY;

// ── What a reader hands over ──────────────────────────────────────────────────────────────────────

/** One UTC day's amount, `day` as "YYYY-MM-DD". A reader's days are ascending and gap-free to today. */
export type DayValue = { day: string; value: number };

export type NoneCause = "needs" | "unavailable" | "failed";

/**
 * One meter as a reader took it.
 *  - `days`: a daily series (the `rolling`, `month` and `day` shapes), the last of them today and partial;
 *  - `gauge`: a level now (`atLeast` when the reader can only undercount it);
 *  - `none`: no reading, and why.
 */
export type MeterTaken =
  | { kind: "days"; days: DayValue[]; atLeast?: boolean }
  | { kind: "gauge"; used: number; atLeast?: boolean }
  | { kind: "none"; cause: NoneCause; why: string };

/** Our own earlier readings of a gauge, oldest first. */
export type GaugePoint = { atMs: number; used: number };

export type Assessed =
  | {
      state: "read";
      used: number;
      atLeast: boolean;
      share: number;
      /** The trailing rate a day, in the meter's base unit; null while it warms or has no rate (a daily limit). */
      rate: number | null;
      /** Days until the limit at that rate: 0 over it, null when it is not reached in the horizon. */
      daysLeft: number | null;
      level: Level;
    }
  | { state: "none"; cause: NoneCause; why: string };

export type ReadAssessed = Extract<Assessed, { state: "read" }>;

// ── Days ──────────────────────────────────────────────────────────────────────────────────────────

/** "2026-10-04" for an instant, in UTC. */
export function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function endOfMonthMs(nowMs: number): number {
  const d = new Date(nowMs);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
}

const sum = (xs: readonly number[]): number => xs.reduce((n, x) => n + x, 0);

/** The mean of the last RATE_DAYS complete days (today excluded: it is partial), or null with fewer than MIN_RATE_DAYS. */
function trailingRate(days: readonly DayValue[], today: string): number | null {
  const complete = days.filter((d) => d.day < today).slice(-RATE_DAYS);
  if (complete.length < MIN_RATE_DAYS) return null;
  return sum(complete.map((d) => d.value)) / complete.length;
}

// ── Projecting ────────────────────────────────────────────────────────────────────────────────────

/**
 * WHEN A ROLLING WINDOW REACHES ITS LIMIT, if the coming days look like the trailing week: each day adds `rate` and
 * drops the oldest day of the window, which is known (the series is the window), so a steady meter never counts as
 * climbing. Days to the limit (fractional), 0 when already at it, null when it is not reached within the window.
 */
export function projectRolling(
  values: readonly number[],
  limit: number,
  rate: number,
): number | null {
  let total = sum(values);
  if (total >= limit) return 0;
  for (let k = 1; k <= ROLLING_DAYS; k++) {
    const dropped = values[k - 1] ?? rate;
    const next = total + rate - dropped;
    if (next >= limit) return k - 1 + (limit - total) / (next - total);
    total = next;
  }
  return null;
}

/** A gauge's rate a day from our own earlier readings, or null while there are none far enough back. */
export function gaugeRate(
  used: number,
  nowMs: number,
  history: readonly GaugePoint[],
): number | null {
  const from = history
    .filter((h) => nowMs - h.atMs <= GAUGE_WINDOW_MS)
    .sort((a, b) => a.atMs - b.atMs)[0];
  if (!from || nowMs - from.atMs < MIN_GAUGE_SPAN_MS) return null;
  return (used - from.used) / ((nowMs - from.atMs) / MS_DAY);
}

// ── Judging ───────────────────────────────────────────────────────────────────────────────────────

/** The level of a share of the limit and the days left at the trailing rate. */
export function levelOf(share: number, daysLeft: number | null): Level {
  if (
    share >= CRITICAL_SHARE ||
    (daysLeft !== null && daysLeft <= CRITICAL_DAYS)
  ) {
    return "critical";
  }
  if (share >= WARN_SHARE || (daysLeft !== null && daysLeft <= WARN_DAYS)) {
    return "warn";
  }
  return "ok";
}

/**
 * ONE METER, ASSESSED from what its reader took. A shape decides what the climb means: `rolling` projects with the
 * window's own roll-off, `gauge` takes the slope of our earlier readings, `month` counts since the 1st and says days
 * left only when the limit would be reached before the calendar resets it, and `day` is the week's busiest day with no
 * days left to tell (it resets every midnight).
 */
export function assessMeter(
  def: MeterDef,
  taken: MeterTaken,
  ctx: { nowMs: number; gauge?: readonly GaugePoint[] },
): Assessed {
  if (taken.kind === "none") {
    return { state: "none", cause: taken.cause, why: taken.why };
  }
  const today = dayKey(ctx.nowMs);
  let used: number;
  let rate: number | null = null;
  let daysLeft: number | null = null;
  const atLeast = taken.atLeast === true;

  if (taken.kind === "gauge") {
    if (def.shape !== "gauge") {
      return {
        state: "none",
        cause: "failed",
        why: "a gauge for a meter that is not one",
      };
    }
    used = taken.used;
    rate = gaugeRate(used, ctx.nowMs, ctx.gauge ?? []);
    if (used >= def.limit) daysLeft = 0;
    else if (rate !== null && rate > 0) daysLeft = (def.limit - used) / rate;
  } else {
    if (def.shape === "gauge") {
      return { state: "none", cause: "failed", why: "a series for a gauge" };
    }
    const days = taken.days;
    if (def.shape === "rolling") {
      used = sum(days.map((d) => d.value));
      rate = trailingRate(days, today);
      if (used >= def.limit) daysLeft = 0;
      else if (rate !== null && rate > 0) {
        daysLeft = projectRolling(
          days.map((d) => d.value),
          def.limit,
          rate,
        );
      }
    } else if (def.shape === "month") {
      const monthStart = `${today.slice(0, 8)}01`;
      used = sum(days.filter((d) => d.day >= monthStart).map((d) => d.value));
      rate = trailingRate(days, today);
      if (used >= def.limit) daysLeft = 0;
      else if (rate !== null && rate > 0) {
        const until = (def.limit - used) / rate;
        // The calendar resets the meter first: nothing to tell.
        daysLeft =
          until <= (endOfMonthMs(ctx.nowMs) - ctx.nowMs) / MS_DAY
            ? until
            : null;
      }
    } else {
      // day: the week's busiest day, today's partial one included.
      const week = days.slice(-RATE_DAYS);
      if (week.length === 0) {
        return {
          state: "none",
          cause: "failed",
          why: "the series held no days",
        };
      }
      used = Math.max(...week.map((d) => d.value));
    }
  }

  const share = used / def.limit;
  return {
    state: "read",
    used,
    atLeast,
    share,
    rate,
    daysLeft,
    level: levelOf(share, daysLeft),
  };
}

/** Every meter, assessed. A reader that answered nothing for a meter is a failed read of it. */
export function assessAll(
  taken: Partial<Record<MeterId, MeterTaken>>,
  ctx: {
    nowMs: number;
    gauge?: Partial<Record<MeterId, readonly GaugePoint[]>>;
  },
): Partial<Record<MeterId, Assessed>> {
  const out: Partial<Record<MeterId, Assessed>> = {};
  for (const def of METERS) {
    const t: MeterTaken = taken[def.id] ?? {
      kind: "none",
      cause: "failed",
      why: "the reader answered nothing for it",
    };
    out[def.id] = assessMeter(def, t, {
      nowMs: ctx.nowMs,
      gauge: ctx.gauge?.[def.id],
    });
  }
  return out;
}

// ── Crossings: what is mailed, and when it is forgotten ───────────────────────────────────────────

/** The level each meter was last TOLD to the operator, as the earlier runs stored it. */
export type Told = Partial<Record<MeterId, Level>>;

export type Crossing = {
  id: MeterId;
  level: Exclude<Level, "ok">;
  assessed: ReadAssessed;
};

/**
 * WHAT IS NEW SINCE THE LAST TELLING: a meter whose level now outranks the one it was last told. A meter the history
 * never named was told nothing (`ok`). `previous` null means the history could not be read: nothing is sent, because
 * a duplicate of a mail already sent is worse than one a day late, and the run says so (`held`).
 */
export function planCrossings(
  assessed: Partial<Record<MeterId, Assessed>>,
  previous: Told | null,
): { fresh: Crossing[]; held: boolean } {
  const over: Crossing[] = [];
  for (const def of METERS) {
    const a = assessed[def.id];
    if (!a || a.state !== "read" || a.level === "ok") continue;
    over.push({ id: def.id, level: a.level, assessed: a });
  }
  if (previous === null) return { fresh: [], held: over.length > 0 };
  return {
    fresh: over.filter(
      (c) => LEVEL_RANK[c.level] > LEVEL_RANK[previous[c.id] ?? "ok"],
    ),
    held: false,
  };
}

/**
 * THE LEVEL A METER IS NOW TOLD AT, carried into its stored record. It rises only when its mail went; it falls only
 * when the meter has CLEARLY fallen (judged as if it were 5 points busier with a fifth fewer days, still lower), so
 * one that hovers on a threshold is mailed once, not at every crossing of it; and a meter that was not read keeps
 * what it knew.
 */
export function nextTold(
  prev: Level,
  assessed: Assessed | undefined,
  mailed: boolean,
): Level {
  if (!assessed || assessed.state !== "read") return prev;
  const pessimistic = levelOf(
    assessed.share + REARM_SHARE_MARGIN,
    assessed.daysLeft === null ? null : assessed.daysLeft * REARM_DAYS_FACTOR,
  );
  if (LEVEL_RANK[pessimistic] < LEVEL_RANK[prev]) return assessed.level;
  if (LEVEL_RANK[assessed.level] > LEVEL_RANK[prev]) {
    return mailed ? assessed.level : prev;
  }
  return prev;
}

/** The dedupe key of one mail: the day and the crossings it names, so the same set never goes out twice in a day. */
export function crossingKey(nowMs: number, fresh: readonly Crossing[]): string {
  const tokens = fresh.map((c) => `${c.id}:${c.level}`).sort();
  return `limits:${dayKey(nowMs)}:${tokens.join("+")}`;
}

// ── The record a run keeps, and reading it back ───────────────────────────────────────────────────

export type StoredMeter =
  | {
      state: "read";
      used: number;
      share: number;
      level: Level;
      rate: number | null;
      daysLeft: number | null;
      atLeast: boolean;
      told?: Level;
    }
  | { state: "none"; cause: NoneCause; why: string; told?: Level };

export type StoredLimits = {
  /** When the readings were taken. */
  atMs: number;
  meters: Partial<Record<MeterId, StoredMeter>>;
};

/** `job_runs.counts.limits` for a run, in the shape `parseStoredLimits` reads back. */
export function storedLimits(input: {
  nowMs: number;
  assessed: Partial<Record<MeterId, Assessed>>;
  told: Told;
  /** False when the history could not be read: the record then carries no `told`, so the next run asks further back. */
  toldKnown: boolean;
}): Record<string, unknown> {
  const meters: Record<string, unknown> = {};
  for (const def of METERS) {
    const a = input.assessed[def.id];
    if (!a) continue;
    const told = input.toldKnown ? { told: input.told[def.id] ?? "ok" } : {};
    meters[def.id] =
      a.state === "read"
        ? {
            state: "read",
            used: a.used,
            share: a.share,
            level: a.level,
            rate: a.rate,
            days_left: a.daysLeft,
            ...(a.atLeast ? { at_least: true } : {}),
            ...told,
          }
        : {
            state: "none",
            cause: a.cause,
            why: a.why.slice(0, 200),
            ...told,
          };
  }
  return { at: new Date(input.nowMs).toISOString(), meters };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const LEVELS: readonly Level[] = ["ok", "warn", "critical"];
const CAUSES: readonly NoneCause[] = ["needs", "unavailable", "failed"];

function levelOfRaw(value: unknown): Level | undefined {
  return LEVELS.find((l) => l === value);
}

/**
 * A run's limits block (`job_runs.counts.limits`), read back defensively: anything this code does not recognise reads as
 * absent, never as a zero and never as a calm level. Null when it is not a limits block at all (a run from before the
 * watch had one has none).
 */
export function parseStoredLimits(raw: unknown): StoredLimits | null {
  if (!isRecord(raw) || !isRecord(raw.meters)) return null;
  const atMs = typeof raw.at === "string" ? Date.parse(raw.at) : NaN;
  if (!Number.isFinite(atMs)) return null;
  const meters: StoredLimits["meters"] = {};
  for (const def of METERS) {
    const m = raw.meters[def.id];
    if (!isRecord(m)) continue;
    const told = levelOfRaw(m.told);
    if (m.state === "none") {
      const cause = CAUSES.find((c) => c === m.cause);
      if (!cause || typeof m.why !== "string") continue;
      meters[def.id] = {
        state: "none",
        cause,
        why: m.why,
        ...(told ? { told } : {}),
      };
      continue;
    }
    if (m.state !== "read") continue;
    const used = finite(m.used);
    const share = finite(m.share);
    const level = levelOfRaw(m.level);
    // A reading that says ok, warn or critical without its numbers is not one this code wrote.
    if (used === null || share === null || !level) continue;
    meters[def.id] = {
      state: "read",
      used,
      share,
      level,
      rate: finite(m.rate),
      daysLeft: finite(m.days_left),
      atLeast: m.at_least === true,
      ...(told ? { told } : {}),
    };
  }
  return { atMs, meters };
}

/** What the earlier runs last told, newest first: the newest record that names a `told` for a meter decides it. */
export function toldFrom(history: readonly StoredLimits[]): Told {
  const out: Told = {};
  for (const block of history) {
    for (const def of METERS) {
      if (out[def.id] !== undefined) continue;
      const told = block.meters[def.id]?.told;
      if (told) out[def.id] = told;
    }
  }
  return out;
}

/** A meter's earlier readings, oldest first, for its gauge's climb. */
export function gaugeHistory(
  history: readonly StoredLimits[],
  id: MeterId,
): GaugePoint[] {
  const out: GaugePoint[] = [];
  for (const block of history) {
    const m = block.meters[id];
    if (m?.state === "read") out.push({ atMs: block.atMs, used: m.used });
  }
  return out.sort((a, b) => a.atMs - b.atMs);
}

// ── Words ─────────────────────────────────────────────────────────────────────────────────────────

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/** Bytes in the vendors' own decimal units: "29.4 GB", "812 MB". */
export function formatDecimalBytes(bytes: number): string {
  if (!(bytes > 0)) return "0 B";
  const last = BYTE_UNITS.length - 1;
  let i = Math.min(Math.floor(Math.log10(bytes) / 3), last);
  const shownAt = (unit: number) => {
    const value = bytes / 1000 ** unit;
    return Number(value.toFixed(value >= 100 || unit === 0 ? 0 : 1));
  };
  let shown = shownAt(i);
  // 999.96 KB rounds to 1000: it reads as the next unit.
  if (shown >= 1000 && i < last) {
    i += 1;
    shown = shownAt(i);
  }
  return `${shown} ${BYTE_UNITS[i]}`;
}

/** CPU seconds as a person reads them: "3 h 56 m", "18 m", "12 h". */
export function formatSeconds(seconds: number): string {
  const total = Math.round(seconds / 60);
  if (total < 1) return seconds > 0 ? "under a minute" : "0 m";
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} m`;
  if (h >= 10 || m === 0) return `${h} h`;
  return `${h} h ${m} m`;
}

/** An amount in a measure: a count grouped, bytes in decimal units, seconds as hours and minutes. */
export function formatMeasure(measure: Measure, value: number): string {
  if (measure === "bytes") return formatDecimalBytes(value);
  if (measure === "seconds") return formatSeconds(value);
  return formatCount(Math.round(value));
}

/** A share as a percentage: "98%", "under 1%". */
export function formatShare(share: number): string {
  if (share > 0 && share < 0.01) return "under 1%";
  return `${Math.round(share * 100)}%`;
}

/** The days left, in words. */
export function formatDaysLeft(days: number): string {
  if (days <= 0) return "none left";
  if (days < 1) return "under a day";
  if (days < 1.5) return "about a day";
  return `about ${Math.round(days)} days`;
}

/** "3 h 56 m of 4 h (98%)", with "at least" where the reading can only undercount. */
export function usedWords(def: MeterDef, a: ReadAssessed): string {
  return `${a.atLeast ? "at least " : ""}${formatMeasure(def.measure, a.used)} of ${formatMeasure(def.measure, def.limit)} (${formatShare(a.share)})`;
}

/** The trailing rate in words: "+24,257 a day", "shrinking", or why there is none yet. */
export function rateWords(def: MeterDef, a: ReadAssessed): string {
  if (def.shape === "day") return "Resets every midnight UTC";
  if (a.rate === null) {
    return def.shape === "gauge"
      ? "Climb: warming up (it needs two days of readings)"
      : "Climb: warming up (it needs three complete days)";
  }
  if (a.rate <= 0) return "Not climbing this week";
  return `+${formatMeasure(def.measure, a.rate)} a day this week`;
}

/** What is left at that rate, in words, or null when there is nothing to tell. */
export function daysLeftWords(def: MeterDef, a: ReadAssessed): string | null {
  if (def.shape === "day") return null;
  if (a.daysLeft !== null) {
    if (a.daysLeft <= 0) return "At the limit";
    const left = formatDaysLeft(a.daysLeft);
    return `${left.charAt(0).toUpperCase()}${left.slice(1)} to the limit at that rate`;
  }
  if (a.rate === null || a.rate <= 0) return null;
  return def.shape === "month"
    ? "The month resets it first at that rate"
    : "Not reached within 30 days at that rate";
}

/** The meters a set of assessments names at each level, for the run's note and the badge. */
export function levelCounts(assessed: Partial<Record<MeterId, Assessed>>): {
  warn: MeterId[];
  critical: MeterId[];
  failed: MeterId[];
  gaps: MeterId[];
} {
  const out = {
    warn: [] as MeterId[],
    critical: [] as MeterId[],
    failed: [] as MeterId[],
    gaps: [] as MeterId[],
  };
  for (const def of METERS) {
    const a = assessed[def.id];
    if (!a) continue;
    if (a.state === "none") {
      if (a.cause === "failed") out.failed.push(def.id);
      else out.gaps.push(def.id);
    } else if (a.level === "warn") out.warn.push(def.id);
    else if (a.level === "critical") out.critical.push(def.id);
  }
  return out;
}

/** A meter's label with its vendor, for a note or a subject: "Vercel Active CPU". */
export function meterName(def: MeterDef): string {
  return `${VENDORS[def.vendor].label} ${def.label}`;
}
