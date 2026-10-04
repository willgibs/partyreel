/**
 * THE LIMITS WATCH'S RULES (admin-observability.md, "Plan limits"), pure. Red first for each direction: a limit
 * climbing toward its ceiling warns weeks before it is hit, however low its share; a steady meter never warns on its
 * days left, since a rolling window drops the days it adds; a missing reading is never a zero and never a calm level;
 * a crossing is mailed once and a hovering meter is not mailed again; and the real week Will saw on 2026-10-04
 * (Active CPU at 3 h 56 m of 4 h) reads Critical.
 */
import { describe, expect, it } from "vitest";

import {
  METERS,
  meterById,
  type MeterId,
} from "@/lib/jobs/limits-watch-limits";
import {
  CRITICAL_DAYS,
  CRITICAL_SHARE,
  WARN_DAYS,
  WARN_SHARE,
  assessAll,
  assessMeter,
  crossingKey,
  dayKey,
  daysLeftWords,
  formatDaysLeft,
  formatDecimalBytes,
  formatSeconds,
  formatShare,
  gaugeHistory,
  gaugeRate,
  levelCounts,
  levelOf,
  nextTold,
  parseStoredLimits,
  planCrossings,
  projectRolling,
  rateWords,
  storedLimits,
  toldFrom,
  usedWords,
  type Assessed,
  type DayValue,
  type MeterTaken,
  type ReadAssessed,
} from "@/lib/jobs/limits-watch";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-10-04T16:52:00.000Z");

function def(id: MeterId) {
  const d = meterById(id);
  if (!d) throw new Error(`no meter ${id}`);
  return d;
}

/** Thirty-one ascending UTC days ending at `NOW`'s, each `value(i)` for i from 0 (the oldest). */
function series(value: (i: number) => number, count = 31): DayValue[] {
  return Array.from({ length: count }, (_, i) => ({
    day: dayKey(NOW - (count - 1 - i) * DAY),
    value: value(i),
  }));
}

function read(a: Assessed): ReadAssessed {
  if (a.state !== "read") throw new Error(`expected a reading, got ${a.state}`);
  return a;
}

describe("the thresholds", () => {
  it("warns at 60% and is critical at 85%, by share alone", () => {
    expect(levelOf(0.59, null)).toBe("ok");
    expect(levelOf(WARN_SHARE, null)).toBe("warn");
    expect(levelOf(0.84, null)).toBe("warn");
    expect(levelOf(CRITICAL_SHARE, null)).toBe("critical");
    expect(levelOf(1.4, null)).toBe("critical");
  });

  it("warns at 30 days left and is critical at 7, however low the share", () => {
    expect(levelOf(0.02, WARN_DAYS + 0.1)).toBe("ok");
    expect(levelOf(0.02, WARN_DAYS)).toBe("warn");
    expect(levelOf(0.02, CRITICAL_DAYS + 0.1)).toBe("warn");
    expect(levelOf(0.02, CRITICAL_DAYS)).toBe("critical");
    expect(levelOf(0.02, 0)).toBe("critical");
  });
});

describe("a rolling window's projection", () => {
  it("★ never warns on days left for a steady meter: the window drops what it adds", () => {
    const flat = Array.from({ length: 31 }, () => 100);
    // 3,100 of 10,000 at 100 a day: each day adds 100 and drops 100.
    expect(projectRolling(flat, 10_000, 100)).toBeNull();
    const a = read(
      assessMeter(
        def("vercel_invocations"),
        {
          kind: "days",
          days: series(() => 16_000),
        },
        { nowMs: NOW },
      ),
    );
    expect(a.share).toBeCloseTo(0.496, 3);
    expect(a.daysLeft).toBeNull();
    expect(a.level).toBe("ok");
  });

  it("counts the days that roll off: a climb crosses when the new days outweigh the old", () => {
    // Twenty quiet days (10 each) then ten busy ones (100 each): 1,200 now, and each day adds 100 and drops a quiet 10.
    const values = [...Array(21).fill(10), ...Array(10).fill(100)];
    const days = projectRolling(values, 2_000, 100);
    expect(days).not.toBeNull();
    // 1,210 + 90k reaches 2,000 on the ninth day: 8 whole days and 70 of the ninth's 90.
    expect(days).toBeCloseTo(8 + (2_000 - (1_210 + 90 * 8)) / 90, 6);
  });

  it("says 0 over the limit, and null when the limit is out of the window's reach", () => {
    expect(projectRolling([600, 600], 1_000, 1)).toBe(0);
    expect(projectRolling([1, 1, 1], 1_000_000, 1)).toBeNull();
  });

  it("★ reads the week Will saw on 2026-10-04 as Critical: Active CPU at 3 h 56 m of 4 h", () => {
    // The usage API's real daily function calls, 2026-09-04 to 2026-10-04 (the first day clipped to its last 7 hours).
    const calls = [
      698, 4055, 3030, 3715, 2034, 2595, 3387, 4221, 4539, 2091, 8153, 20211,
      2946, 7918, 5600, 7488, 4300, 7324, 6089, 10013, 7239, 11623, 5160, 12620,
      11265, 27611, 20011, 20216, 20675, 57400, 16454,
    ];
    const days = calls.map((n, i) => ({
      day: dayKey(Date.parse("2026-09-04T00:00:00Z") + i * DAY),
      value: n * 0.044,
    }));
    const a = read(
      assessMeter(
        def("vercel_active_cpu"),
        { kind: "days", days },
        { nowMs: NOW },
      ),
    );
    expect(formatSeconds(a.used)).toBe("3 h 55 m");
    expect(a.share).toBeGreaterThan(0.97);
    expect(a.level).toBe("critical");
    expect(a.daysLeft).toBeLessThan(1);
    expect(usedWords(def("vercel_active_cpu"), a)).toBe(
      "3 h 55 m of 4 h (98%)",
    );
    expect(daysLeftWords(def("vercel_active_cpu"), a)).toBe(
      "Under a day to the limit at that rate",
    );
  });
});

describe("a gauge's climb comes from our own readings", () => {
  const history = (daysAgo: number, used: number) => ({
    atMs: NOW - daysAgo * DAY,
    used,
  });

  it("has no climb until a reading is two days old, and never from one older than eight", () => {
    expect(gaugeRate(500, NOW, [])).toBeNull();
    expect(gaugeRate(500, NOW, [history(1, 400)])).toBeNull();
    expect(gaugeRate(500, NOW, [history(9, 0)])).toBeNull();
    expect(gaugeRate(500, NOW, [history(5, 0)])).toBeCloseTo(100, 6);
  });

  it("takes the oldest reading of the week, so one busy day is averaged over it", () => {
    const rate = gaugeRate(1_000, NOW, [
      history(7, 300),
      history(3, 400),
      history(1, 900),
    ]);
    expect(rate).toBeCloseTo(100, 6);
  });

  it("★ warns a climb weeks before its share would: 8% of the bucket, 23 days from full", () => {
    // 0.8 GB now, nothing two days ago: +0.4 GB a day against 9.2 GB of room.
    const a = read(
      assessMeter(
        def("r2_storage"),
        { kind: "gauge", used: 0.8e9, atLeast: true },
        {
          nowMs: NOW,
          gauge: [history(2, 0)],
        },
      ),
    );
    expect(a.share).toBeCloseTo(0.08, 2);
    expect(a.atLeast).toBe(true);
    expect(a.rate).toBeCloseTo(0.4e9, -6);
    expect(a.daysLeft).toBeCloseTo(23, 6);
    expect(a.daysLeft).toBeLessThan(WARN_DAYS);
    expect(a.level).toBe("warn");
  });

  it("is calm by share alone while it warms, and calm while it shrinks", () => {
    const warming = read(
      assessMeter(
        def("supabase_db_size"),
        { kind: "gauge", used: 25e6 },
        { nowMs: NOW },
      ),
    );
    expect(warming.rate).toBeNull();
    expect(warming.daysLeft).toBeNull();
    expect(warming.level).toBe("ok");
    const shrinking = read(
      assessMeter(
        def("supabase_db_size"),
        { kind: "gauge", used: 25e6 },
        {
          nowMs: NOW,
          gauge: [history(5, 125e6)],
        },
      ),
    );
    expect(shrinking.rate).toBeLessThan(0);
    expect(shrinking.daysLeft).toBeNull();
    expect(shrinking.level).toBe("ok");
  });

  it("is at the limit past it", () => {
    const a = read(
      assessMeter(
        def("supabase_db_size"),
        { kind: "gauge", used: 9e9 },
        { nowMs: NOW },
      ),
    );
    expect(a.daysLeft).toBe(0);
    expect(a.level).toBe("critical");
  });
});

describe("a month's meter", () => {
  const month = (
    daysOfOctober: (n: number) => number,
    now = Date.parse("2026-10-20T12:00:00Z"),
  ) => ({
    nowMs: now,
    days: Array.from({ length: 31 }, (_, i) => {
      const at = now - (30 - i) * DAY;
      return {
        day: dayKey(at),
        value:
          dayKey(at) < "2026-10-01"
            ? 5
            : daysOfOctober(Number(dayKey(at).slice(8))),
      };
    }),
  });

  it("counts since the 1st and tells days left only when the limit comes before the calendar resets it", () => {
    // 120 a day through October's first 20 days: 2,400 of 3,000 by the 20th.
    const { nowMs, days } = month(() => 120);
    const a = read(
      assessMeter(def("resend_month"), { kind: "days", days }, { nowMs }),
    );
    expect(a.used).toBe(120 * 20);
    expect(a.share).toBeCloseTo(0.8, 2);
    // 600 left at 120 a day is 5 days, before the month's 11.5 are out.
    expect(a.daysLeft).toBeCloseTo(5, 0);
    expect(a.level).toBe("critical");
  });

  it("says nothing of days left when the month resets it first", () => {
    const { nowMs, days } = month(() => 20);
    const a = read(
      assessMeter(def("resend_month"), { kind: "days", days }, { nowMs }),
    );
    expect(a.used).toBe(400);
    expect(a.daysLeft).toBeNull();
    expect(daysLeftWords(def("resend_month"), a)).toBe(
      "The month resets it first at that rate",
    );
    expect(a.level).toBe("ok");
  });
});

describe("a daily limit", () => {
  it("reads the busiest day of the week, today's partial one included, and tells no days left", () => {
    const days = series((i) => (i === 27 ? 70 : 5), 31);
    const a = read(
      assessMeter(def("resend_day"), { kind: "days", days }, { nowMs: NOW }),
    );
    expect(a.used).toBe(70);
    expect(a.level).toBe("warn");
    expect(a.daysLeft).toBeNull();
    expect(rateWords(def("resend_day"), a)).toBe("Resets every midnight UTC");
    expect(daysLeftWords(def("resend_day"), a)).toBeNull();
  });

  it("is no reading, not a quiet day, when the series is empty", () => {
    expect(
      assessMeter(def("resend_day"), { kind: "days", days: [] }, { nowMs: NOW })
        .state,
    ).toBe("none");
  });
});

describe("★ a missing reading is never a zero", () => {
  it("passes its cause and words through, with no share and no level", () => {
    const a = assessMeter(
      def("vercel_fast_origin"),
      { kind: "none", cause: "unavailable", why: "no API" },
      { nowMs: NOW },
    );
    expect(a).toEqual({ state: "none", cause: "unavailable", why: "no API" });
  });

  it("refuses a series for a gauge and a gauge for a series, as a failed read", () => {
    expect(
      assessMeter(
        def("supabase_db_size"),
        { kind: "days", days: series(() => 1) },
        { nowMs: NOW },
      ).state,
    ).toBe("none");
    expect(
      assessMeter(
        def("resend_month"),
        { kind: "gauge", used: 1 },
        { nowMs: NOW },
      ),
    ).toMatchObject({
      state: "none",
      cause: "failed",
    });
  });

  it("answers every meter, a failed read for any a reader said nothing of", () => {
    const all = assessAll({}, { nowMs: NOW });
    expect(Object.keys(all).sort()).toEqual(METERS.map((m) => m.id).sort());
    for (const a of Object.values(all)) {
      expect(a).toMatchObject({ state: "none", cause: "failed" });
    }
  });

  it("sorts the meters into warn, critical, failed and gaps", () => {
    const taken: Partial<Record<MeterId, MeterTaken>> = {
      vercel_invocations: { kind: "days", days: series(() => 30_000) },
      supabase_db_size: { kind: "gauge", used: 1 },
      vercel_fast_origin: { kind: "none", cause: "unavailable", why: "x" },
      supabase_egress: { kind: "none", cause: "needs", why: "y" },
    };
    const counts = levelCounts(assessAll(taken, { nowMs: NOW }));
    expect(counts.critical).toEqual(["vercel_invocations"]);
    expect(counts.gaps).toEqual(["vercel_fast_origin", "supabase_egress"]);
    // Every meter nothing was taken for is a failed read.
    expect(counts.failed).toContain("resend_month");
    expect(counts.failed).not.toContain("supabase_db_size");
  });
});

describe("★ a crossing is mailed once", () => {
  const warnA = {
    state: "read",
    used: 6,
    share: 0.6,
    rate: null,
    daysLeft: null,
    atLeast: false,
    level: "warn",
  } as const;
  const critA = { ...warnA, share: 0.9, level: "critical" } as const;
  const okA = { ...warnA, share: 0.1, level: "ok" } as const;

  it("mails what outranks what it was last told, and nothing it was already told", () => {
    const assessed = {
      vercel_invocations: warnA,
      vercel_cdn_requests: critA,
      resend_month: okA,
    };
    const none = planCrossings(assessed, {});
    expect(none.fresh.map((c) => c.id)).toEqual([
      "vercel_invocations",
      "vercel_cdn_requests",
    ]);
    const told = planCrossings(assessed, {
      vercel_invocations: "warn",
      vercel_cdn_requests: "warn",
    });
    expect(told.fresh.map((c) => `${c.id}:${c.level}`)).toEqual([
      "vercel_cdn_requests:critical",
    ]);
    expect(
      planCrossings(assessed, {
        vercel_invocations: "critical",
        vercel_cdn_requests: "critical",
      }).fresh,
    ).toEqual([]);
  });

  it("holds the mail, and says so, when the history could not be read", () => {
    expect(planCrossings({ vercel_invocations: warnA }, null)).toEqual({
      fresh: [],
      held: true,
    });
    expect(planCrossings({ vercel_invocations: okA }, null)).toEqual({
      fresh: [],
      held: false,
    });
  });

  it("is told only what went: a failed mail asks again next run", () => {
    const a = (share: number, level: "ok" | "warn" | "critical"): Assessed => ({
      ...warnA,
      share,
      level,
    });
    expect(nextTold("ok", a(0.7, "warn"), true)).toBe("warn");
    expect(nextTold("ok", a(0.7, "warn"), false)).toBe("ok");
    expect(nextTold("warn", a(0.9, "critical"), true)).toBe("critical");
    // A meter that was not read keeps what it knew.
    expect(
      nextTold("critical", { state: "none", cause: "failed", why: "x" }, false),
    ).toBe("critical");
    expect(nextTold("warn", undefined, false)).toBe("warn");
  });

  it("★ forgets a level only when the meter has clearly fallen, so a hovering one is mailed once", () => {
    const a = (
      share: number,
      level: "ok" | "warn" | "critical",
      daysLeft: number | null = null,
    ): Assessed => ({
      ...warnA,
      share,
      level,
      daysLeft,
    });
    // 59% after a warning at 60%: still told.
    expect(nextTold("warn", a(0.59, "ok"), false)).toBe("warn");
    // 54%: even 5 points busier it would read ok, so it is forgotten and the next rise mails again.
    expect(nextTold("warn", a(0.54, "ok"), false)).toBe("ok");
    // 84% after a critical: still told critical; 78% is warn even 5 points busier.
    expect(nextTold("critical", a(0.84, "warn"), false)).toBe("critical");
    expect(nextTold("critical", a(0.78, "warn"), false)).toBe("warn");
    // Days left hover too: 31 days (24.8 at a fifth fewer) keeps a warning, 40 days does not.
    expect(nextTold("warn", a(0.1, "ok", 31), false)).toBe("warn");
    expect(nextTold("warn", a(0.1, "ok", 40), false)).toBe("ok");
  });

  it("keys a mail by its day and the crossings it names, in any order", () => {
    const fresh = planCrossings(
      { vercel_invocations: warnA, vercel_cdn_requests: critA },
      {},
    ).fresh;
    expect(crossingKey(NOW, fresh)).toBe(
      "limits:2026-10-04:vercel_cdn_requests:critical+vercel_invocations:warn",
    );
    expect(crossingKey(NOW, [...fresh].reverse())).toBe(
      crossingKey(NOW, fresh),
    );
  });
});

describe("the record a run keeps", () => {
  const assessed = assessAll(
    {
      vercel_invocations: { kind: "days", days: series(() => 30_000) },
      r2_storage: { kind: "gauge", used: 0.87e9, atLeast: true },
      supabase_egress: { kind: "none", cause: "needs", why: "needs a token" },
    },
    { nowMs: NOW },
  );

  it("round-trips through jsonb as what it said, a floor flagged and a gap worded", () => {
    const stored = storedLimits({
      nowMs: NOW,
      assessed,
      told: { vercel_invocations: "critical" },
      toldKnown: true,
    });
    const back = parseStoredLimits(JSON.parse(JSON.stringify(stored)));
    expect(back?.atMs).toBe(NOW);
    expect(back?.meters.vercel_invocations).toMatchObject({
      state: "read",
      level: "critical",
      told: "critical",
    });
    expect(back?.meters.r2_storage).toMatchObject({
      state: "read",
      atLeast: true,
      level: "ok",
      told: "ok",
    });
    expect(back?.meters.supabase_egress).toEqual({
      state: "none",
      cause: "needs",
      why: "needs a token",
      told: "ok",
    });
  });

  it("carries no `told` when the history was unreadable, so the next run asks further back", () => {
    const stored = storedLimits({
      nowMs: NOW,
      assessed,
      told: {},
      toldKnown: false,
    });
    const back = parseStoredLimits(stored);
    expect(back?.meters.vercel_invocations?.told).toBeUndefined();
  });

  it("reads what it does not recognise as absent, never as a zero or a calm level", () => {
    expect(parseStoredLimits(null)).toBeNull();
    expect(parseStoredLimits({ meters: {} })).toBeNull();
    expect(parseStoredLimits({ at: "nope", meters: {} })).toBeNull();
    const at = new Date(NOW).toISOString();
    const parsed = parseStoredLimits({
      at,
      meters: {
        vercel_invocations: { state: "read", level: "ok" },
        vercel_cdn_requests: {
          state: "read",
          used: 5,
          share: 0.1,
          level: "fine",
        },
        vercel_fast_data: { state: "none", cause: "weird", why: "x" },
        resend_month: {
          state: "read",
          used: 5,
          share: 0.1,
          level: "ok",
          rate: "fast",
          days_left: Infinity,
        },
        not_a_meter: { state: "read", used: 1, share: 1, level: "ok" },
      },
    });
    expect(Object.keys(parsed?.meters ?? {})).toEqual(["resend_month"]);
    expect(parsed?.meters.resend_month).toMatchObject({
      rate: null,
      daysLeft: null,
    });
  });

  it("takes each meter's told from the newest record that names one", () => {
    const rec = (atMs: number, told: Record<string, string | undefined>) =>
      parseStoredLimits({
        at: new Date(atMs).toISOString(),
        meters: Object.fromEntries(
          Object.entries(told).map(([id, t]) => [
            id,
            {
              state: "read",
              used: 1,
              share: 0.1,
              level: "ok",
              ...(t ? { told: t } : {}),
            },
          ]),
        ),
      })!;
    const history = [
      rec(NOW - DAY, { vercel_invocations: undefined }),
      rec(NOW - 2 * DAY, {
        vercel_invocations: "warn",
        resend_month: "critical",
      }),
      rec(NOW - 3 * DAY, { vercel_invocations: "critical" }),
    ];
    expect(toldFrom(history)).toEqual({
      vercel_invocations: "warn",
      resend_month: "critical",
    });
  });

  it("lists a gauge's own earlier readings, oldest first, reads only", () => {
    const rec = (atMs: number, used: number) =>
      parseStoredLimits({
        at: new Date(atMs).toISOString(),
        meters: {
          r2_storage: { state: "read", used, share: 0.1, level: "ok" },
        },
      })!;
    const none = parseStoredLimits({
      at: new Date(NOW).toISOString(),
      meters: { r2_storage: { state: "none", cause: "failed", why: "x" } },
    })!;
    expect(
      gaugeHistory(
        [rec(NOW - DAY, 2), none, rec(NOW - 3 * DAY, 1)],
        "r2_storage",
      ),
    ).toEqual([
      { atMs: NOW - 3 * DAY, used: 1 },
      { atMs: NOW - DAY, used: 2 },
    ]);
  });
});

describe("the words", () => {
  it("prints bytes in the vendors' decimal units, rolling a rounded-up unit into the next", () => {
    expect(formatDecimalBytes(0)).toBe("0 B");
    expect(formatDecimalBytes(999)).toBe("999 B");
    expect(formatDecimalBytes(1_500)).toBe("1.5 KB");
    expect(formatDecimalBytes(999_960)).toBe("1 MB");
    expect(formatDecimalBytes(812_253_648)).toBe("812 MB");
    expect(formatDecimalBytes(29.38e9)).toBe("29.4 GB");
    expect(formatDecimalBytes(2.5e12)).toBe("2.5 TB");
  });

  it("prints CPU seconds as hours and minutes", () => {
    expect(formatSeconds(14_160)).toBe("3 h 56 m");
    expect(formatSeconds(14_400)).toBe("4 h");
    expect(formatSeconds(36_000)).toBe("10 h");
    expect(formatSeconds(1_067)).toBe("18 m");
    expect(formatSeconds(20)).toBe("under a minute");
    expect(formatSeconds(0)).toBe("0 m");
  });

  it("prints a share and the days left", () => {
    expect(formatShare(0)).toBe("0%");
    expect(formatShare(0.004)).toBe("under 1%");
    expect(formatShare(0.984)).toBe("98%");
    expect(formatShare(1.12)).toBe("112%");
    expect(formatDaysLeft(0)).toBe("none left");
    expect(formatDaysLeft(0.3)).toBe("under a day");
    expect(formatDaysLeft(1.2)).toBe("about a day");
    expect(formatDaysLeft(9.4)).toBe("about 9 days");
  });

  it("words a floor as 'at least' and a meter with no climb yet as warming up", () => {
    const a = read(
      assessMeter(
        def("r2_storage"),
        { kind: "gauge", used: 870e6, atLeast: true },
        { nowMs: NOW },
      ),
    );
    expect(usedWords(def("r2_storage"), a)).toBe(
      "at least 870 MB of 10 GB (9%)",
    );
    expect(rateWords(def("r2_storage"), a)).toBe(
      "Climb: warming up (it needs two days of readings)",
    );
    expect(daysLeftWords(def("r2_storage"), a)).toBeNull();
  });
});

describe("the meter catalog", () => {
  it("holds a limit and its own words for every meter, none a zero", () => {
    for (const m of METERS) {
      expect(m.limit, m.id).toBeGreaterThan(0);
      expect(m.source.length, m.id).toBeGreaterThan(10);
      expect(m.past.length, m.id).toBeGreaterThan(10);
    }
    expect(new Set(METERS.map((m) => m.id)).size).toBe(METERS.length);
  });

  it("★ takes Resend's daily limit from the spend watch's own constant, never a second copy", () => {
    expect(meterById("resend_day")?.limit).toBe(100);
  });

  it("names a gap on exactly the meters no reader can answer", () => {
    const gaps = METERS.filter((m) => m.gap)
      .map((m) => m.id)
      .sort();
    expect(gaps).toEqual(
      [
        "vercel_fast_origin",
        "vercel_image_transforms",
        "supabase_egress",
        "supabase_realtime",
        "r2_class_a",
        "r2_class_b",
        "workers_requests",
      ].sort(),
    );
  });
});
