import { describe, expect, it } from "vitest";

import {
  CEILING_MULTIPLIER,
  MAX_BASELINE_AGE_MS,
  MIN_WINDOW_MS,
  READINGS,
  RESEND_DAILY_QUOTA,
  SWITCH_KEYS,
  TRAILING_MS,
  baselineRun,
  carryPaused,
  ceilingOf,
  formatReading,
  judge,
  judgeAll,
  ledgerGrowth,
  parseDbReadings,
  parseStoredRun,
  planActions,
  readingById,
  runCounts,
  takeReadings,
  trailingPeak,
  type ReadingDef,
  type ReadingId,
  type StoredReading,
  type StoredRun,
  type Taken,
  type Verdict,
} from "@/lib/jobs/spend-watch";

/**
 * THE SPEND WATCH'S RULES, red first: the ceiling (ten times the week's busiest, never under the floor, never past a
 * vendor's stop), a missing reading that is never a zero, a runaway that never raises its own ceiling, and each
 * switch's direction (the watch pauses mail, downloads and the purge; it only ever offers uploads).
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const NOW = Date.parse("2026-10-03T05:00:00.000Z");

function def(id: ReadingId): ReadingDef {
  const found = readingById(id);
  if (!found) throw new Error(`no reading ${id}`);
  return found;
}

function run(
  agoMs: number,
  readings: Partial<Record<ReadingId, StoredReading>> = {},
  extra: Partial<StoredRun> = {},
): StoredRun {
  return {
    readAtMs: NOW - agoMs,
    fromMs: null,
    readings,
    snap: {},
    pausedAt: {},
    ...extra,
  };
}

const ok = (value: number): StoredReading => ({ state: "ok", value });
const tripped = (value: number): StoredReading => ({ state: "tripped", value });
const value = (v: number, atLeast = false): Taken => ({
  kind: "value",
  value: v,
  atLeast,
});

describe("the ceiling", () => {
  it("is ten times the week's busiest reading when that clears the floor", () => {
    expect(CEILING_MULTIPLIER).toBe(10);
    expect(ceilingOf(def("uploads"), 400)).toEqual({
      ceiling: 4_000,
      basis: "peak",
    });
  });

  it("never sits under the floor, so a quiet week cannot page on noise", () => {
    expect(ceilingOf(def("uploads"), 30)).toEqual({
      ceiling: def("uploads").floor,
      basis: "floor",
    });
    // No week at all yet: the floor alone.
    expect(ceilingOf(def("uploads"), null)).toEqual({
      ceiling: def("uploads").floor,
      basis: "floor",
    });
  });

  it("never passes a vendor's own hard stop, so we hear before it silences the alert mail", () => {
    const resend = def("resend_mail");
    expect(RESEND_DAILY_QUOTA).toBe(100);
    expect(resend.cap).toBe(80);
    // Ten quiet days at 9 a day would put the ceiling at 90, past the point where Resend's free day stops at 100.
    expect(ceilingOf(resend, 9)).toEqual({ ceiling: 80, basis: "cap" });
    expect(ceilingOf(resend, 2)).toEqual({ ceiling: 50, basis: "floor" });
  });
});

describe("judging a reading", () => {
  it("trips strictly past the ceiling, never at it", () => {
    const uploads = def("uploads");
    const at = judge(uploads, value(uploads.floor), [], NOW);
    expect(at.state).toBe("ok");
    const past = judge(uploads, value(uploads.floor + 1), [], NOW);
    expect(past.state).toBe("tripped");
    expect(past).toMatchObject({ ceiling: uploads.floor, basis: "floor" });
  });

  it("★ reads a missing reading as missing, never as a zero that passes", () => {
    const v = judge(
      def("downloads"),
      { kind: "missing", why: "export_log: permission denied" },
      [],
      NOW,
    );
    expect(v.state).toBe("missing");
    expect(v.value).toBeNull();
    expect(v.why).toBe("export_log: permission denied");
  });

  it("never trips a reading that is warming (no baseline yet)", () => {
    const v = judge(
      def("uploads"),
      { kind: "warming", why: "a first reading" },
      [],
      NOW,
    );
    expect(v).toMatchObject({ state: "warming", value: null });
  });

  it("trips an 'at least' count that is already past the ceiling, and says it is a floor", () => {
    const v = judge(def("resend_mail"), value(3_000, true), [], NOW);
    expect(v).toMatchObject({ state: "tripped", atLeast: true });
  });

  it("judges every reading in the card's order", () => {
    const taken = Object.fromEntries(
      READINGS.map((r) => [r.id, value(0)]),
    ) as Record<ReadingId, Taken>;
    expect(judgeAll(taken, [], NOW).map((v) => v.id)).toEqual(
      READINGS.map((r) => r.id),
    );
  });
});

describe("the week's busiest reading", () => {
  it("is the largest untripped reading of the trailing seven days", () => {
    const history = [
      run(2 * DAY, { uploads: ok(300) }),
      run(3 * DAY, { uploads: ok(500) }),
      run(6 * DAY, { uploads: ok(450) }),
    ];
    expect(trailingPeak("uploads", history, NOW)).toBe(500);
  });

  it("leaves out readings older than the week, and any at or after now", () => {
    const history = [
      run(TRAILING_MS + HOUR, { uploads: ok(9_000) }),
      run(0, { uploads: ok(8_000) }),
      run(-HOUR, { uploads: ok(7_000) }),
      run(DAY, { uploads: ok(120) }),
    ];
    expect(trailingPeak("uploads", history, NOW)).toBe(120);
  });

  it("is no evidence of a quiet hour when a reading was missing or warming", () => {
    const history = [
      run(DAY, { uploads: { state: "missing", value: null } }),
      run(2 * DAY, { uploads: { state: "warming", value: null } }),
    ];
    expect(trailingPeak("uploads", history, NOW)).toBeNull();
  });

  it("★ never takes a tripped reading, so a runaway does not raise its own ceiling", () => {
    // Tuesday's loop read 60,000 an hour and tripped. A week of 300s around it.
    const history = [
      run(1 * DAY, { uploads: ok(300) }),
      run(2 * DAY, { uploads: tripped(60_000) }),
      run(3 * DAY, { uploads: ok(280) }),
    ];
    expect(trailingPeak("uploads", history, NOW)).toBe(300);
    // So the same loop, back on Friday, trips again rather than reading as 10x-of-itself normal.
    const again = judge(def("uploads"), value(60_000), history, NOW);
    expect(again.state).toBe("tripped");
    expect(again.ceiling).toBe(3_000);
  });
});

describe("the window a counter is diffed over", () => {
  it("measures from the newest reading at least an hour old", () => {
    const daily = run(DAY);
    const runNow = run(10 * 60 * 1000);
    expect(baselineRun([daily, runNow], NOW)).toBe(daily);
    expect(MIN_WINDOW_MS).toBe(HOUR);
  });

  it("warms again rather than averaging a spike away over days", () => {
    expect(baselineRun([run(MAX_BASELINE_AGE_MS + HOUR)], NOW)).toBeNull();
    expect(baselineRun([], NOW)).toBeNull();
  });
});

describe("the ingress meter's growth", () => {
  it("counts what each period grew by, a new month whole", () => {
    expect(
      ledgerGrowth(
        { "2026-09": [1_000, 10] },
        { "2026-09": [1_500, 14], "2026-10": [200, 2] },
      ),
    ).toEqual({ bytes: 700, items: 6 });
  });

  it("never lets a period that fell (an account deleted) cancel another's growth", () => {
    expect(
      ledgerGrowth(
        { "2026-10": [5_000, 50] },
        { "2026-10": [4_000, 45], "2026-11": [300, 3] },
      ),
    ).toEqual({ bytes: 300, items: 3 });
  });
});

describe("taking the readings", () => {
  const db = {
    ledger: { "2026-10": [10 * 1024 ** 3, 2_400] as [number, number] },
    album: 9_000,
    lifecycle_mail: 3,
    sign_ins: 2,
    downloads: 4,
    purge_runs: 1,
    errors: {},
  };
  const resendOk = { ok: true as const, count: 7, atLeast: false };

  it("turns the meter's growth since the baseline into a rate an hour", () => {
    const baseline = run(
      4 * HOUR,
      {},
      {
        snap: { ledger: { "2026-10": [2 * 1024 ** 3, 400] }, album: 8_600 },
      },
    );
    const taken = takeReadings({ nowMs: NOW, db, resend: resendOk, baseline });
    expect(taken.uploads).toEqual({ kind: "value", value: 500 });
    expect(taken.upload_bytes).toEqual({ kind: "value", value: 2 * 1024 ** 3 });
    expect(taken.album_changes).toEqual({ kind: "value", value: 100 });
    expect(taken.lifecycle_mail).toEqual({ kind: "value", value: 3 });
    expect(taken.resend_mail).toEqual({
      kind: "value",
      value: 7,
      atLeast: false,
    });
  });

  it("warms the counters on a first run, and still takes every day count", () => {
    const taken = takeReadings({
      nowMs: NOW,
      db,
      resend: resendOk,
      baseline: null,
    });
    expect(taken.uploads.kind).toBe("warming");
    expect(taken.album_changes.kind).toBe("warming");
    expect(taken.downloads).toEqual({ kind: "value", value: 4 });
  });

  it("★ makes every DB reading missing, never zero, when the reading RPC failed whole", () => {
    const taken = takeReadings({
      nowMs: NOW,
      db: null,
      dbError: "function spend_watch_readings does not exist",
      resend: resendOk,
      baseline: run(DAY, {}, { snap: { album: 1 } }),
    });
    for (const id of [
      "uploads",
      "upload_bytes",
      "album_changes",
      "lifecycle_mail",
      "sign_ins",
      "downloads",
      "purge_runs",
    ] as const) {
      expect(taken[id]).toEqual({
        kind: "missing",
        why: "function spend_watch_readings does not exist",
      });
    }
    // Resend is read apart, and stands.
    expect(taken.resend_mail.kind).toBe("value");
  });

  it("makes one section missing alone when the RPC could not read it", () => {
    const taken = takeReadings({
      nowMs: NOW,
      db: {
        ...db,
        sign_ins: undefined,
        errors: { sign_ins: "permission denied for table users" },
      },
      resend: { ok: false, why: "Resend is not configured here" },
      baseline: null,
    });
    expect(taken.sign_ins).toEqual({
      kind: "missing",
      why: "permission denied for table users",
    });
    expect(taken.resend_mail).toEqual({
      kind: "missing",
      why: "Resend is not configured here",
    });
    expect(taken.downloads.kind).toBe("value");
  });

  it("never reads the album counters falling as negative change", () => {
    const baseline = run(2 * HOUR, {}, { snap: { album: 10_000 } });
    const taken = takeReadings({
      nowMs: NOW,
      db: { ...db, album: 9_000 },
      resend: resendOk,
      baseline,
    });
    expect(taken.album_changes).toEqual({ kind: "value", value: 0 });
  });
});

function verdict(id: ReadingId, state: Verdict["state"]): Verdict {
  return {
    id,
    state,
    value: state === "tripped" ? 1e9 : 1,
    atLeast: false,
    peak: null,
    ceiling: 1,
    basis: "floor",
  };
}

const allOn = Object.fromEntries(
  SWITCH_KEYS.map((k) => [k, { enabled: true, updatedAtMs: NOW - DAY }]),
);

describe("what a trip does (each switch's direction)", () => {
  it("★ pauses lifecycle mail, downloads and the purge sweep on a new trip", () => {
    const plan = planActions({
      verdicts: [
        verdict("lifecycle_mail", "tripped"),
        verdict("downloads", "tripped"),
        verdict("purge_runs", "tripped"),
      ],
      previous: run(DAY, {
        lifecycle_mail: ok(2),
        downloads: ok(3),
        purge_runs: ok(1),
      }),
      switches: allOn,
      mayPause: true,
    });
    expect(plan.pause).toEqual([
      "lifecycle_mail_enabled",
      "export_enabled",
      "purge_cron_enabled",
    ]);
  });

  it("★ never pauses uploads itself: it offers the switch, since a false alarm would stop a real party", () => {
    const plan = planActions({
      verdicts: [
        verdict("uploads", "tripped"),
        verdict("upload_bytes", "tripped"),
      ],
      previous: null,
      switches: allOn,
      mayPause: true,
    });
    expect(plan.pause).toEqual([]);
    expect(plan.offer).toEqual(["uploads_enabled"]);
  });

  it("acts on nothing for a reading whose vector no switch of ours stops", () => {
    const plan = planActions({
      verdicts: [
        verdict("sign_ins", "tripped"),
        verdict("resend_mail", "tripped"),
        verdict("album_changes", "tripped"),
      ],
      previous: null,
      switches: allOn,
      mayPause: true,
    });
    expect(plan).toEqual({ pause: [], offer: [], alreadyOff: [], ongoing: [] });
  });

  it("does not pause again while the same trip goes on: an operator's resume wins until it clears", () => {
    const plan = planActions({
      verdicts: [verdict("downloads", "tripped")],
      previous: run(HOUR, { downloads: tripped(900) }),
      switches: allOn,
      mayPause: true,
    });
    expect(plan.pause).toEqual([]);
    expect(plan.ongoing).toEqual(["export_enabled"]);
  });

  it("leaves a switch that is already off as it is", () => {
    const plan = planActions({
      verdicts: [verdict("purge_runs", "tripped")],
      previous: null,
      switches: {
        ...allOn,
        purge_cron_enabled: { enabled: false, updatedAtMs: NOW - 3 * DAY },
      },
      mayPause: true,
    });
    expect(plan.pause).toEqual([]);
    expect(plan.alreadyOff).toEqual(["purge_cron_enabled"]);
  });

  it("alerts and offers instead of pausing when it may not act or cannot read the switches", () => {
    const tripping = [verdict("lifecycle_mail", "tripped")];
    expect(
      planActions({
        verdicts: tripping,
        previous: null,
        switches: allOn,
        mayPause: false,
      }),
    ).toMatchObject({ pause: [], offer: ["lifecycle_mail_enabled"] });
    expect(
      planActions({
        verdicts: tripping,
        previous: null,
        switches: null,
        mayPause: true,
      }),
    ).toMatchObject({ pause: [], offer: ["lifecycle_mail_enabled"] });
  });

  it("does nothing on a quiet night, a missing reading or a warming one", () => {
    const plan = planActions({
      verdicts: [
        verdict("downloads", "ok"),
        verdict("purge_runs", "missing"),
        verdict("uploads", "warming"),
      ],
      previous: null,
      switches: allOn,
      mayPause: true,
    });
    expect(plan).toEqual({ pause: [], offer: [], alreadyOff: [], ongoing: [] });
  });
});

describe("a pause the watch made stays its own until a person touches it", () => {
  const at = "2026-10-02T05:00:01.234Z";
  const history = [run(DAY, {}, { pausedAt: { export_enabled: at } })];

  it("stands while the switch is off with the instant the watch wrote", () => {
    expect(
      carryPaused({
        history,
        switches: {
          export_enabled: { enabled: false, updatedAtMs: Date.parse(at) },
        },
        justPaused: {},
      }),
    ).toEqual({ export_enabled: at });
  });

  it("ends when a person turned it back on, or touched it since", () => {
    expect(
      carryPaused({
        history,
        switches: {
          export_enabled: { enabled: true, updatedAtMs: Date.parse(at) + 5 },
        },
        justPaused: {},
      }),
    ).toEqual({});
    expect(
      carryPaused({
        history,
        switches: {
          export_enabled: {
            enabled: false,
            updatedAtMs: Date.parse(at) + 60_000,
          },
        },
        justPaused: {},
      }),
    ).toEqual({});
  });

  it("keeps its record while the switches cannot be read, and adds tonight's", () => {
    expect(
      carryPaused({
        history,
        switches: null,
        justPaused: { purge_cron_enabled: "2026-10-03T05:00:00.500Z" },
      }),
    ).toEqual({
      export_enabled: at,
      purge_cron_enabled: "2026-10-03T05:00:00.500Z",
    });
  });
});

describe("the run's record", () => {
  const verdicts: Verdict[] = [
    {
      id: "uploads",
      state: "ok",
      value: 42.5,
      atLeast: false,
      peak: 50,
      ceiling: 1_000,
      basis: "floor",
    },
    {
      id: "downloads",
      state: "tripped",
      value: 400,
      atLeast: false,
      peak: 12,
      ceiling: 120,
      basis: "peak",
    },
    {
      id: "resend_mail",
      state: "missing",
      value: null,
      atLeast: false,
      peak: null,
      ceiling: 50,
      basis: "floor",
      why: "Resend answered 401",
    },
  ];

  it("reads back what it wrote", () => {
    const counts = runCounts({
      nowMs: NOW,
      baseline: run(DAY),
      verdicts,
      snap: { ledger: { "2026-10": [5, 1] }, album: 7 },
      pausedAt: { export_enabled: "2026-10-03T05:00:00.100Z" },
    });
    const back = parseStoredRun(JSON.parse(JSON.stringify(counts)), 0);
    expect(back).toEqual({
      readAtMs: NOW,
      fromMs: NOW - DAY,
      readings: {
        uploads: {
          state: "ok",
          value: 42.5,
          ceiling: 1_000,
          basis: "floor",
          peak: 50,
          at_least: false,
          why: undefined,
        },
        downloads: {
          state: "tripped",
          value: 400,
          ceiling: 120,
          basis: "peak",
          peak: 12,
          at_least: false,
          why: undefined,
        },
        resend_mail: {
          state: "missing",
          value: null,
          ceiling: 50,
          basis: "floor",
          peak: null,
          at_least: false,
          why: "Resend answered 401",
        },
      },
      snap: { ledger: { "2026-10": [5, 1] }, album: 7 },
      pausedAt: { export_enabled: "2026-10-03T05:00:00.100Z" },
    });
  });

  it("flags attention (the orphan breaker's key) while a trip or a pause of its own stands, and only then", () => {
    const base = {
      nowMs: NOW,
      baseline: null,
      snap: {},
    };
    expect(runCounts({ ...base, verdicts, pausedAt: {} })).toMatchObject({
      tripped: 1,
      missing: 1,
      paused: 0,
      breaker_tripped: true,
    });
    expect(
      runCounts({
        ...base,
        verdicts: [verdicts[0]],
        pausedAt: { export_enabled: "2026-10-03T05:00:00.100Z" },
      }),
    ).toMatchObject({ breaker_tripped: true, paused: 1 });
    expect(
      runCounts({ ...base, verdicts: [verdicts[0]], pausedAt: {} }),
    ).not.toHaveProperty("breaker_tripped");
  });

  it("reads nothing it does not recognise as a reading or a baseline", () => {
    expect(parseStoredRun(null, 0)).toBeNull();
    expect(parseStoredRun({ swept: 3 }, 0)).toBeNull();
    const odd = parseStoredRun(
      {
        readings: {
          uploads: { state: "ok" },
          downloads: { state: "exploded", value: 1 },
          sign_ins: { state: "tripped", value: 9 },
        },
        snap: { ledger: { october: [1, 2] }, album: "lots" },
        paused_at: {
          export_enabled: "not a date",
          nonsense_enabled: "2026-10-03T00:00:00Z",
        },
      },
      1234,
    );
    expect(odd).toEqual({
      readAtMs: 1234,
      fromMs: null,
      readings: {
        sign_ins: {
          state: "tripped",
          value: 9,
          ceiling: undefined,
          basis: undefined,
          peak: null,
          at_least: false,
          why: undefined,
        },
      },
      snap: {},
      pausedAt: {},
    });
  });
});

describe("the reading RPC's answer", () => {
  it("keeps each section's error beside the sections that stand", () => {
    expect(
      parseDbReadings({
        ledger: { "2026-10": [10, 2] },
        album: 5,
        downloads: 3,
        errors: { sign_ins: "permission denied" },
      }),
    ).toEqual({
      ledger: { "2026-10": [10, 2] },
      album: 5,
      downloads: 3,
      errors: { sign_ins: "permission denied" },
    });
  });

  it("makes a section it cannot read an error of that section, never a zero", () => {
    const parsed = parseDbReadings({
      ledger: "nope",
      purge_runs: -1,
      downloads: "4",
      errors: {},
    });
    expect(parsed.ledger).toBeUndefined();
    expect(parsed.purge_runs).toBeUndefined();
    expect(parsed.downloads).toBeUndefined();
    expect(Object.keys(parsed.errors).sort()).toEqual([
      "downloads",
      "ledger",
      "purge_runs",
    ]);
  });

  it("refuses an answer that is not an object", () => {
    expect(() => parseDbReadings(null)).toThrow(TypeError);
    expect(() => parseDbReadings([1])).toThrow(TypeError);
  });
});

describe("the readings themselves", () => {
  it("only ever offer guest uploads, and pause only the three switches whose false alarm costs no guest", () => {
    const paused = READINGS.filter((r) => r.stop.kind === "pause").map((r) =>
      r.stop.kind === "pause" ? r.stop.switch : null,
    );
    expect(paused.sort()).toEqual([
      "export_enabled",
      "lifecycle_mail_enabled",
      "purge_cron_enabled",
    ]);
    for (const r of READINGS) {
      if (r.stop.kind !== "alert" && r.stop.switch === "uploads_enabled") {
        expect(r.stop.kind).toBe("offer");
      }
    }
  });

  it("gives every reading a positive floor, unique ids and a remedy", () => {
    const ids = READINGS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of READINGS) {
      expect(r.floor).toBeGreaterThan(0);
      expect(r.remedy.length).toBeGreaterThan(20);
      if (r.cap !== undefined) expect(r.cap).toBeGreaterThanOrEqual(r.floor);
    }
  });

  it("measures a counter since the last reading as a rate an hour, and a day's count whole", () => {
    for (const r of READINGS) {
      expect(r.window === "since_last").toBe(r.unit === "hour");
    }
  });

  it("words a reading in its unit", () => {
    expect(formatReading(def("uploads"), 1240)).toBe("1,240 an hour");
    expect(formatReading(def("uploads"), 0.42)).toBe("0.4 an hour");
    expect(formatReading(def("downloads"), 35)).toBe("35 a day");
    expect(formatReading(def("upload_bytes"), 2.5 * 1024 ** 3)).toBe(
      "2.5 GB an hour",
    );
  });
});
