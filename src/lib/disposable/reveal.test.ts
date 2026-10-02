/**
 * WHEN EVERYONE SEES WHAT'S ADDED (20261002200000): the three answers over two columns, where a develop stands, the
 * default develop time in the host's own zone, and the write's reach.
 */
import { describe, expect, it } from "vitest";

import {
  DEFAULT_DEVELOP_HOUR,
  defaultDevelopAt,
  DEVELOP_MAX_AHEAD_DAYS,
  developState,
  developTimeWithinReach,
  revealOf,
} from "@/lib/disposable/reveal";

describe("revealOf: three answers over two columns", () => {
  it("no develop time: right away, or once she approves each", () => {
    expect(revealOf({ review: false, developsAt: null })).toBe("right-away");
    expect(revealOf({ review: true, developsAt: null })).toBe("approve");
  });

  it("a develop time is the develop, ahead or reached, and wins over approval (the stronger promise)", () => {
    expect(revealOf({ review: false, developsAt: "2026-10-03T09:00:00Z" })).toBe("develop");
    expect(revealOf({ review: true, developsAt: "2026-10-03T09:00:00Z" })).toBe("develop");
  });
});

describe("developState", () => {
  const now = Date.parse("2026-10-02T20:00:00Z");

  it("none, waiting for a time ahead, developed at a time reached", () => {
    expect(developState(null, now)).toEqual({ kind: "none" });
    expect(developState("2026-10-03T09:00:00Z", now)).toEqual({
      kind: "waiting",
      developsAt: "2026-10-03T09:00:00Z",
    });
    expect(developState("2026-10-02T20:00:00Z", now)).toEqual({
      kind: "developed",
      developsAt: "2026-10-02T20:00:00Z",
    });
  });

  it("a time it cannot read is none, never a seal", () => {
    expect(developState("soon", now)).toEqual({ kind: "none" });
  });
});

describe("defaultDevelopAt: 9 am the day after the party, in her own zone", () => {
  it("the day after the party's date when it is today or ahead", () => {
    const now = new Date(2026, 9, 2, 20, 0);
    const at = defaultDevelopAt({ eventDate: "2026-10-10", now });
    expect([at.getFullYear(), at.getMonth(), at.getDate(), at.getHours(), at.getMinutes()]).toEqual([
      2026, 9, 11, DEFAULT_DEVELOP_HOUR, 0,
    ]);
    const tonight = defaultDevelopAt({ eventDate: "2026-10-02", now });
    expect([tonight.getDate(), tonight.getHours()]).toEqual([3, 9]);
  });

  it("the day after today when the party is past, has no date, or a date it cannot read", () => {
    const now = new Date(2026, 9, 2, 20, 0);
    for (const eventDate of ["2026-09-01", null, "next saturday"]) {
      const at = defaultDevelopAt({ eventDate, now });
      expect([at.getMonth(), at.getDate(), at.getHours()]).toEqual([9, 3, 9]);
    }
  });

  it("crosses a month's end", () => {
    const at = defaultDevelopAt({ eventDate: "2026-10-31", now: new Date(2026, 9, 2) });
    expect([at.getMonth(), at.getDate()]).toEqual([10, 1]);
  });
});

describe("developTimeWithinReach", () => {
  const now = Date.parse("2026-10-02T20:00:00Z");

  it("any real time up to a year and a day ahead (one past is Develop now, the database's own now)", () => {
    expect(developTimeWithinReach("2026-10-03T09:00:00Z", now)).toBe(true);
    expect(developTimeWithinReach("2026-10-01T09:00:00Z", now)).toBe(true);
    expect(developTimeWithinReach(new Date(now + DEVELOP_MAX_AHEAD_DAYS * 86_400_000).toISOString(), now)).toBe(true);
  });

  it("never past the reach, nor a time it cannot read", () => {
    expect(developTimeWithinReach(new Date(now + (DEVELOP_MAX_AHEAD_DAYS + 1) * 86_400_000).toISOString(), now)).toBe(false);
    expect(developTimeWithinReach("whenever", now)).toBe(false);
  });
});
