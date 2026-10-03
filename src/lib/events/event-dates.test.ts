import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  daysBetween,
  endDateOf,
  endForNewStart,
  endToStore,
  eventDays,
  isRange,
  lastDayOf,
  shiftDay,
} from "@/lib/events/dates";
import { runAsGermanRuntime } from "@/lib/test-utils/german-runtime";
import { formatEventDate } from "@/lib/utils";

/**
 * AN EVENT'S OPTIONAL END DATE (lane `event-dates`, Will 2026-10-03): a range of days, no times, read everywhere a
 * date is. Pinned here: the one shape a range takes (`lib/events/dates.ts`), the words every head, door and card says
 * (`formatEventDate`), the migration's facts, and ★ the invariant the whole lane stands on: an end date only says
 * when an event happens, and never ends, locks, archives or purges anything.
 */

describe("an event's days", () => {
  it("are one day, a range, or none", () => {
    expect(eventDays("2026-10-03")).toEqual({
      first: "2026-10-03",
      last: "2026-10-03",
    });
    expect(eventDays("2026-10-03", "2026-10-05")).toEqual({
      first: "2026-10-03",
      last: "2026-10-05",
    });
    expect(eventDays(null)).toBeNull();
    expect(eventDays(undefined, "2026-10-05")).toBeNull();
  });

  it("★ never guess past a wrong end: one said twice, an earlier one or an unreadable one reads as one day", () => {
    for (const end of ["2026-10-03", "2026-10-02", "soon", "", null]) {
      expect(eventDays("2026-10-03", end), String(end)).toEqual({
        first: "2026-10-03",
        last: "2026-10-03",
      });
      expect(isRange("2026-10-03", end), String(end)).toBe(false);
    }
  });

  it("name their last day: the end of a range, else the date", () => {
    expect(lastDayOf("2026-10-03", "2026-10-05")).toBe("2026-10-05");
    expect(lastDayOf("2026-10-03")).toBe("2026-10-03");
    expect(lastDayOf(null, "2026-10-05")).toBeNull();
    expect(isRange("2026-10-30", "2026-11-02")).toBe(true);
  });

  it("count and move by the date parts, across a clock change and a year's turn", () => {
    expect(shiftDay("2026-10-24", 2)).toBe("2026-10-26");
    expect(shiftDay("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-10-30", "2026-11-02")).toBe(3);
  });

  it("store one spelling: a range said twice is one day", () => {
    expect(endToStore("2026-10-03", "2026-10-05")).toBe("2026-10-05");
    expect(endToStore("2026-10-03", "2026-10-03")).toBeNull();
    expect(endToStore("2026-10-03", "")).toBeNull();
    expect(endToStore("2026-10-03", null)).toBeNull();
    // An earlier end is kept for the database's CHECK to refuse in its own name, never dropped in silence.
    expect(endToStore("2026-10-03", "2026-10-01")).toBe("2026-10-01");
  });

  it("★ follow a moved first day: an end still after it stays, one it reaches or passes keeps the range's length", () => {
    // Friday 2 to Sunday 4, the first day moved a day earlier: Sunday stays.
    expect(endForNewStart("2026-10-01", "2026-10-02", "2026-10-04")).toBe(
      "2026-10-04",
    );
    // Moved inside the range: the end stays.
    expect(endForNewStart("2026-10-03", "2026-10-02", "2026-10-04")).toBe(
      "2026-10-04",
    );
    // Rescheduled a week on: still a weekend.
    expect(endForNewStart("2026-10-09", "2026-10-02", "2026-10-04")).toBe(
      "2026-10-11",
    );
    // Moved onto its own last day: the weekend moves with it.
    expect(endForNewStart("2026-10-04", "2026-10-02", "2026-10-04")).toBe(
      "2026-10-06",
    );
    // A cleared date takes its end with it; one day stays one day.
    expect(endForNewStart("", "2026-10-02", "2026-10-04")).toBe("");
    expect(endForNewStart("2026-10-09", "2026-10-02", "")).toBe("");
  });

  it("read the row's end through the seam: a calendar day or nothing", () => {
    expect(endDateOf({ event_end_date: "2026-10-05" })).toBe("2026-10-05");
    // Before the migration is applied the column is absent: every event reads as one day.
    expect(endDateOf({ event_date: "2026-10-03" })).toBeNull();
    expect(endDateOf({ event_end_date: null })).toBeNull();
    expect(endDateOf({ event_end_date: 20261005 })).toBeNull();
    expect(endDateOf(null)).toBeNull();
  });
});

describe("formatEventDate says a range", () => {
  const zone = process.env.TZ;
  afterEach(() => {
    process.env.TZ = zone;
  });

  it("says one day as it always has", () => {
    expect(formatEventDate("2026-10-03")).toBe("October 3, 2026");
    expect(formatEventDate("2026-10-03", null)).toBe("October 3, 2026");
    expect(formatEventDate("2026-10-03", "2026-10-03")).toBe("October 3, 2026");
  });

  it("says a range in one month, across months, and across a year's turn", () => {
    expect(formatEventDate("2026-10-03", "2026-10-05")).toBe(
      "October 3 to 5, 2026",
    );
    expect(formatEventDate("2026-10-30", "2026-11-02")).toBe(
      "October 30 to November 2, 2026",
    );
    expect(formatEventDate("2026-12-30", "2027-01-02")).toBe(
      "December 30, 2026 to January 2, 2027",
    );
  });

  it("never prints an end it cannot stand behind: an earlier or unreadable one is the one day", () => {
    expect(formatEventDate("2026-10-03", "2026-10-01")).toBe("October 3, 2026");
    expect(formatEventDate("2026-10-03", "soon")).toBe("October 3, 2026");
  });

  it("★ prints a range's own days in every zone a page renders in, in en-US whatever the runtime", () => {
    runAsGermanRuntime();
    for (const tz of [
      "Pacific/Honolulu",
      "America/New_York",
      "UTC",
      "Asia/Tokyo",
      "Pacific/Kiritimati",
    ]) {
      process.env.TZ = tz;
      expect(formatEventDate("2026-10-30", "2026-11-02"), tz).toBe(
        "October 30 to November 2, 2026",
      );
      expect(formatEventDate("2026-12-31", "2027-01-01"), tz).toBe(
        "December 31, 2026 to January 1, 2027",
      );
    }
  });
});

/* ── the migration's facts ─────────────────────────────────────────────── */

const ROOT = join(__dirname, "..", "..", "..");
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const FILE = "20261003120000_event_end_date.sql";

/** A migration's executable SQL: line comments stripped (prose is not a statement), whitespace collapsed. */
const executable = (file: string) =>
  readFileSync(join(MIGRATIONS, file), "utf8")
    .replace(/--[^\n]*/g, "")
    .replace(/\s+/g, " ");

const migrationFiles = () =>
  readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort();

/** The winning definition of a function, latest file first: its file and its body. */
function latest(name: string): { file: string; body: string } {
  let found: { file: string; body: string } | null = null;
  for (const file of migrationFiles()) {
    const sql = executable(file);
    const at = Math.max(
      sql.lastIndexOf(`create function public.${name}(`),
      sql.lastIndexOf(`create or replace function public.${name}(`),
    );
    if (at === -1) continue;
    const tag = sql.slice(at).match(/as (\$[a-z_]*\$)/)![1]!;
    const open = sql.indexOf(tag, at) + tag.length;
    found = { file, body: sql.slice(at, sql.indexOf(tag, open) + tag.length) };
  }
  expect(found, `${name} defined nowhere`).not.toBeNull();
  return found!;
}

describe("the migration (20261003120000)", () => {
  const sql = executable(FILE);

  it("adds a nullable date under a CHECK: on or after the date, and nothing without one", () => {
    expect(sql).toContain(
      "alter table public.events add column event_end_date date;",
    );
    expect(sql).toContain(
      "add constraint events_end_date_on_or_after check (event_end_date is null or (event_date is not null and event_end_date >= event_date));",
    );
  });

  it("grants it as the date is granted, additively: insert and update to authenticated, and no table-level revoke", () => {
    expect(sql).toContain(
      "grant insert (event_end_date), update (event_end_date) on public.events to authenticated;",
    );
    expect(sql).not.toMatch(/revoke [a-z, ]+ on (table )?public\.events /);
  });

  it("returns it from the album's read LAST, under the date's own redaction, with the four holders restated", () => {
    const { file, body } = latest("get_event_by_qr_token");
    expect(file).toBe(FILE);
    expect(body).toContain(
      "capture text, roll_size integer, event_end_date date) language sql stable security definer set search_path to ''",
    );
    expect(body).toContain(
      "case when r.hide_meta then null else e.event_date end,",
    );
    expect(body).toContain(
      "e.roll_size, case when r.hide_meta then null else e.event_end_date end from public.events e",
    );
    expect(sql).toContain(
      "drop function public.get_event_by_qr_token(text); create function public.get_event_by_qr_token(",
    );
    expect(sql).toContain(
      "revoke all on function public.get_event_by_qr_token(text) from public; grant execute on function public.get_event_by_qr_token(text) to anon, authenticated, service_role;",
    );
  });

  it("carries it on the profile's cards beside the date: the hosted cards and the attended lines", () => {
    const { file, body } = latest("get_public_profile");
    expect(file).toBe(FILE);
    expect(
      body.match(/'event_date', e\.event_date, 'event_end_date', e\.event_end_date/g),
    ).toHaveLength(2);
    expect(sql).toContain(
      "revoke execute on function public.get_public_profile(text) from public; grant execute on function public.get_public_profile(text) to anon, authenticated;",
    );
  });
});

/* ── ★ the lifecycle ───────────────────────────────────────────────────── */

describe("★ an end date never touches the lifecycle (no end, no lock, no archive, no purge)", () => {
  it("no executable SQL names the column but its own statements and the two reads that say it", () => {
    const allowed = [
      "alter table public.events add column event_end_date date;",
      "add constraint events_end_date_on_or_after",
      "comment on column public.events.event_end_date",
      "grant insert (event_end_date), update (event_end_date) on public.events to authenticated;",
    ];
    const readers = ["get_event_by_qr_token", "get_public_profile"].map(
      (name) => latest(name).body,
    );
    const offenders: string[] = [];
    for (const file of migrationFiles()) {
      let sql = executable(file);
      if (!sql.includes("event_end_date")) continue;
      for (const body of readers) sql = sql.split(body).join(" ");
      // Only the winning bodies are cut out: an older or later definition naming it is a new reader, and fails.
      for (const statement of sql.split(";")) {
        if (!statement.includes("event_end_date")) continue;
        if (allowed.some((a) => statement.includes(a.replace(/;$/, ""))))
          continue;
        offenders.push(`${file}: ${statement.trim().slice(0, 140)}`);
      }
    }
    expect(
      offenders,
      "an end date only says when an event happens: never end, lock, archive or purge anything with it",
    ).toEqual([]);
  });

  it("no lifecycle home in the app reads an end date: the purge, the crons, the develop, the seal, deletion", () => {
    const SRC = join(ROOT, "src");
    const homes = [
      "app/api/cron",
      "lib/lifecycle",
      "lib/disposable/develop.server.ts",
      "lib/disposable/seal.ts",
      "lib/disposable/waiting.server.ts",
      "lib/r2/delete.ts",
      "lib/db/mutations/account.ts",
    ].map((p) => join(SRC, p));
    const files: string[] = [];
    const walk = (path: string) => {
      if (!statSync(path).isDirectory()) return void files.push(path);
      for (const e of readdirSync(path)) walk(join(path, e));
    };
    for (const home of homes) walk(home);
    const named = files
      .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
      .filter((f) =>
        /event_end_date|eventEndDate|lastDayOf|eventDays|endDateOf/.test(
          readFileSync(f, "utf8"),
        ),
      )
      .map((f) => relative(SRC, f));
    expect(files.length).toBeGreaterThan(5);
    expect(named).toEqual([]);
  });
});
