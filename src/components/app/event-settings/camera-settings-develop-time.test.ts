/**
 * A DEVELOP TIME IS SAVED ONLY WHEN IT IS PLAINLY MEANT (crumbs-60): the judgement of a time she has finished, whole, and
 * the two things it mirrors, held to their homes: the database's own minute (`events_reveal_stamp`) and the hub's
 * Develop now question.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DEVELOP_MAX_AHEAD_DAYS } from "@/lib/disposable/reveal";
import { DATE_OUT_OF_RANGE } from "@/lib/validation/event";

import {
  DEVELOP_NOW_QUESTION,
  DEVELOPS_NOW_WITHIN_MS,
  judgeDevelopTime,
  TIME_HAS_PASSED,
  TIME_OUT_OF_REACH,
  TIME_UNFINISHED,
} from "./camera-settings-develop-time";

/** A moment in the machine's own zone, as a `datetime-local` holds it: no case reads the zone it runs in. */
const local = (y: number, mo: number, d: number, h = 9, mi = 0) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${String(y).padStart(4, "0")}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}`;
};
const NOW = new Date(2026, 9, 2, 20, 0, 0, 0).getTime();
const DAY = 86_400_000;
/** The album waits for tomorrow 9 am; the field shows it. */
const AHEAD = new Date(2026, 9, 3, 9, 0).toISOString();
const SHOWN = local(2026, 10, 3);
/** An album that developed yesterday at 9 am. */
const DEVELOPED = new Date(2026, 9, 1, 9, 0).toISOString();
const DEVELOPED_SHOWN = local(2026, 10, 1);

const judge = (
  typed: string,
  over: { developsAt?: string | null; shown?: string; nowMs?: number } = {},
) =>
  judgeDevelopTime({
    typed,
    shown: over.shown ?? SHOWN,
    developsAt: over.developsAt === undefined ? AHEAD : over.developsAt,
    nowMs: over.nowMs ?? NOW,
  });

describe("judgeDevelopTime: a time ahead saves, once, as the field holds it", () => {
  it("saves a finished time ahead as an instant", () => {
    expect(judge(local(2026, 10, 5, 10, 30))).toEqual({
      kind: "save",
      iso: new Date(2026, 9, 5, 10, 30).toISOString(),
    });
  });

  it("is the time it already was: nothing to save, nothing to say", () => {
    expect(judge(SHOWN)).toEqual({ kind: "same" });
    expect(judge("", { shown: "" })).toEqual({ kind: "same" });
  });

  it("reads a typed time that carries seconds too", () => {
    const typed = `${local(2026, 10, 5, 10, 30)}:15`;
    expect(judge(typed)).toEqual({
      kind: "save",
      iso: new Date(typed).toISOString(),
    });
  });
});

describe("★ a year left half typed is no time, whatever the album is doing", () => {
  const YEARS = [
    ["0002", "the first stop on the way to 2027"],
    ["0020", "the second"],
    ["0202", "the third, where a field left behind saved a develop"],
    ["1899", "a century back, in the window's last year before it"],
    ["2101", "the window's first year past it"],
  ] as const;

  for (const [year, why] of YEARS) {
    it(`${year} (${why}) is refused in the date's own words`, () => {
      const typed = `${year}-10-03T09:00`;
      for (const developsAt of [AHEAD, DEVELOPED, null]) {
        expect(judge(typed, { developsAt })).toEqual({
          kind: "refuse",
          words: DATE_OUT_OF_RANGE,
        });
      }
    });
  }

  it("refuses a fifth digit past the year the same way", () => {
    expect(judge("20267-10-03T09:00")).toEqual({
      kind: "refuse",
      words: DATE_OUT_OF_RANGE,
    });
  });

  it("the window's own edge is a time, and a past one: 1900 asks on an album that waits", () => {
    expect(judge(local(1900, 1, 1, 0, 0))).toEqual({ kind: "ask" });
    expect(
      judge(local(1900, 1, 1, 0, 0), {
        developsAt: DEVELOPED,
        shown: DEVELOPED_SHOWN,
      }),
    ).toEqual({
      kind: "refuse",
      words: TIME_HAS_PASSED,
    });
  });
});

describe("a blank or half filled field is no time", () => {
  it("refuses with the sentence that says to finish it", () => {
    expect(judge("")).toEqual({ kind: "refuse", words: TIME_UNFINISHED });
  });
});

describe("★ a time the database would store as now asks Develop now's question, on an album that waits", () => {
  it("any time already past asks", () => {
    expect(judge(local(2026, 10, 1, 9, 0))).toEqual({ kind: "ask" });
    expect(judge(local(2026, 10, 2, 19, 59))).toEqual({ kind: "ask" });
    expect(judge(local(2026, 10, 2, 20, 0))).toEqual({ kind: "ask" });
  });

  it("so does a time under the database's minute ahead, and a time exactly a minute ahead is ahead", () => {
    const typed = local(2026, 10, 2, 20, 1);
    const at = new Date(typed).getTime();
    expect(judge(typed, { nowMs: at - 1 })).toEqual({ kind: "ask" });
    expect(judge(typed, { nowMs: at - (DEVELOPS_NOW_WITHIN_MS - 1) })).toEqual({
      kind: "ask",
    });
    // `events_reveal_stamp` stores a time strictly under now() + 1 minute as now: this one is not.
    expect(judge(typed, { nowMs: at - DEVELOPS_NOW_WITHIN_MS })).toEqual({
      kind: "save",
      iso: new Date(typed).toISOString(),
    });
  });

  it("an album that has already developed is asked nothing: a past time is refused, not asked", () => {
    for (const developsAt of [DEVELOPED, null]) {
      expect(
        judge(local(2026, 9, 30), { developsAt, shown: DEVELOPED_SHOWN }),
      ).toEqual({
        kind: "refuse",
        words: TIME_HAS_PASSED,
      });
    }
  });

  it("a time ahead still saves on a developed album: it can wait again", () => {
    expect(
      judge(local(2026, 10, 5), {
        developsAt: DEVELOPED,
        shown: DEVELOPED_SHOWN,
      }),
    ).toEqual({
      kind: "save",
      iso: new Date(2026, 9, 5, 9, 0).toISOString(),
    });
  });
});

describe("a time past what a develop may reach", () => {
  it("is refused beyond a year and a day ahead, and saved at the reach", () => {
    const edge = new Date(NOW + DEVELOP_MAX_AHEAD_DAYS * DAY);
    const typed = local(
      edge.getFullYear(),
      edge.getMonth() + 1,
      edge.getDate(),
      edge.getHours(),
      edge.getMinutes(),
    );
    // The typed minute is the edge's own, whole: at the reach it saves, a minute past it does not.
    expect(judge(typed).kind).toBe("save");
    expect(judge(typed, { nowMs: NOW - 120_000 })).toEqual({
      kind: "refuse",
      words: TIME_OUT_OF_REACH,
    });
    expect(judge(local(2100, 12, 31))).toEqual({
      kind: "refuse",
      words: TIME_OUT_OF_REACH,
    });
  });

  it("a time no clock holds (a day the calendar has, an hour it has not) is refused, never thrown", () => {
    expect(judge("2026-10-05T99:99")).toEqual({
      kind: "refuse",
      words: TIME_OUT_OF_REACH,
    });
  });
});

/* ── what it mirrors ────────────────────────────────────────────────────────────────────────────────────────────── */

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

/** The winning body of `public.events_reveal_stamp`, comments stripped, whitespace collapsed (the roll's own reader). */
function stampBody(): string {
  let found: string | null = null;
  for (const file of readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    const sql = readFileSync(join(MIGRATIONS, file), "utf8").replace(
      /--[^\n]*/g,
      "",
    );
    const re = /create (?:or replace )?function public\.events_reveal_stamp\(/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql))) {
      const close = sql.indexOf("$$;", sql.indexOf("as $$", m.index) + 5);
      found = sql.slice(m.index, close).replace(/\s+/g, " ");
    }
  }
  expect(found, "events_reveal_stamp is defined nowhere").not.toBeNull();
  return found!;
}

describe("what the judgement mirrors, held to its homes", () => {
  it("the minute is the database's: a develop time under now() + 1 minute is stored as now()", () => {
    const m =
      /new\.develops_at < now\(\) \+ interval '(\d+) (second|minute)s?'/.exec(
        stampBody(),
      );
    expect(
      m,
      "events_reveal_stamp stopped storing a near develop time as now()",
    ).not.toBeNull();
    const ms = Number(m![1]) * (m![2] === "minute" ? 60_000 : 1_000);
    expect(DEVELOPS_NOW_WITHIN_MS).toBe(ms);
  });

  it("the question is the hub's own, word for word: Settings and the hub's cover ask Develop now one way", () => {
    const hub = readFileSync(
      join(
        process.cwd(),
        "src/components/app/event-feed/event-hub-head-cover.tsx",
      ),
      "utf8",
    ).replace(/\s+/g, " ");
    expect(hub).toContain(DEVELOP_NOW_QUESTION);
  });
});

/* ★ A PARTY FAR FROM HOME (event-zone): the field holds the party's wall clock, so what she finished is read on it, and the
   same judgement stands (a half-typed year, reach, the past). Every case names its zone: none reads the machine's. */
describe("judgeDevelopTime on the party's clock (a party far from home)", () => {
  const MX = "America/Mexico_City";
  const NOW_UTC = Date.parse("2026-10-02T20:00:00Z");

  it("★ reads what she finished as the party's wall time: 9:00 typed is 9 am in Mexico City", () => {
    expect(
      judgeDevelopTime({
        typed: "2026-10-04T09:00",
        shown: "",
        developsAt: null,
        nowMs: NOW_UTC,
        zone: MX,
      }),
    ).toEqual({ kind: "save", iso: "2026-10-04T15:00:00.000Z" });
  });

  it("keeps every refusal it had: a half-typed year, a time out of reach, a time passed", () => {
    const at = (typed: string) =>
      judgeDevelopTime({
        typed,
        shown: "",
        developsAt: null,
        nowMs: NOW_UTC,
        zone: MX,
      });
    expect(at("0202-10-04T09:00")).toEqual({
      kind: "refuse",
      words: DATE_OUT_OF_RANGE,
    });
    expect(at("2028-10-04T09:00")).toEqual({
      kind: "refuse",
      words: TIME_OUT_OF_REACH,
    });
    // 13:59 in Mexico City is 19:59 UTC: before now, on an album with nothing waiting.
    expect(at("2026-10-02T13:59")).toEqual({
      kind: "refuse",
      words: TIME_HAS_PASSED,
    });
  });
});
