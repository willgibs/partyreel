/**
 * THE PARTY'S MORNING AFTER (album-order's `guestAlbumOrder` and `zone-morning.ts`'s develop): the album turns at 9 am the morning after the party's LAST day in the
 * party's own zone, one instant whoever reads it; a develop time wins; and the develop's default is that same morning.
 *
 * ★ Each case reads the party's zone and never a reader's: nothing here takes one, which is the lane's whole promise
 * (Will, 2026-10-05: "It feels unfair to unlock the album at different times for certain guests based on geographical
 * location").
 */
import { describe, expect, it } from "vitest";

import { defaultDevelopAt } from "@/lib/disposable/reveal";
import { developDefaultIn, developToKeep } from "@/lib/event/zone-morning";
import { guestAlbumOrder, openingTurnAt } from "@/lib/shared/album-order";

const at = (iso: string) => Date.parse(iso);

describe("guestAlbumOrder: the turn, read once in the party's zone", () => {
  it("★ a party in Auckland turns at 9 am the morning after, in Auckland, for everyone", () => {
    const opening = guestAlbumOrder({
      facts: { eventDate: "2026-10-03" },
      zone: "Pacific/Auckland",
      chosen: null,
      now: at("2026-10-01T00:00:00Z"),
    });
    // Sunday 4 October, 9:00 NZDT (UTC+13).
    expect(opening.morningAfter).toBe(at("2026-10-03T20:00:00Z"));
    expect(opening.own).toBe("newest");
  });

  it("a range turns the morning after its LAST day", () => {
    expect(
      guestAlbumOrder({
        facts: { eventDate: "2026-10-02", eventEndDate: "2026-10-04" },
        zone: "America/Mexico_City",
        chosen: null,
      }).morningAfter,
    ).toBe(at("2026-10-05T15:00:00Z")); // Monday 9:00 CST (UTC-6)
  });

  it("★ both clock changes in the party's zone: the morning after is 9 am by its own wall clock", () => {
    const turn = (eventDate: string, zone: string) =>
      guestAlbumOrder({ facts: { eventDate }, zone, chosen: null })
        .morningAfter;
    // Los Angeles: falls back on 1 November 2026, springs forward on 14 March 2027.
    expect(turn("2026-10-31", "America/Los_Angeles")).toBe(
      at("2026-11-01T17:00:00Z"),
    );
    expect(turn("2027-03-13", "America/Los_Angeles")).toBe(
      at("2027-03-14T16:00:00Z"),
    );
    // Auckland: springs forward on 27 September 2026, falls back on 4 April 2027.
    expect(turn("2026-09-26", "Pacific/Auckland")).toBe(
      at("2026-09-26T20:00:00Z"),
    );
    expect(turn("2027-04-03", "Pacific/Auckland")).toBe(
      at("2027-04-03T21:00:00Z"),
    );
  });

  it("a party with no zone, or one the runtime cannot read, turns in the one fallback (UTC)", () => {
    for (const zone of [null, "Mars/Olympus", "+13:00"]) {
      expect(
        guestAlbumOrder({
          facts: { eventDate: "2026-10-03" },
          zone,
          chosen: null,
        }).morningAfter,
        String(zone),
      ).toBe(at("2026-10-04T09:00:00Z"));
    }
  });

  it("the album's own order at the render is the turn's, in the party's zone", () => {
    const facts = { eventDate: "2026-10-03" };
    const zone = "Pacific/Auckland";
    expect(
      guestAlbumOrder({
        facts,
        zone,
        chosen: null,
        now: at("2026-10-03T19:59:59Z"),
      }).own,
    ).toBe("newest");
    expect(
      guestAlbumOrder({
        facts,
        zone,
        chosen: null,
        now: at("2026-10-03T20:00:00Z"),
      }).own,
    ).toBe("oldest");
    // Her choice rides beside it, untouched.
    expect(
      guestAlbumOrder({
        facts,
        zone,
        chosen: "newest",
        now: at("2026-10-05T00:00:00Z"),
      }).chosen,
    ).toBe("newest");
  });

  it("★ a disposable: the develop instant decides the order, as today; the morning after stands beside it for when it goes", () => {
    const facts = {
      eventDate: "2026-10-03",
      developsAt: "2026-10-05T18:00:00.000Z",
    };
    const after = guestAlbumOrder({
      facts,
      zone: "Pacific/Auckland",
      chosen: null,
      now: at("2026-10-04T12:00:00Z"),
    });
    // Past the morning after, before the develop: the album waits for its develop.
    expect(after.own).toBe("newest");
    expect(after.morningAfter).toBe(at("2026-10-03T20:00:00Z"));
    expect(
      guestAlbumOrder({
        facts,
        zone: "Pacific/Auckland",
        chosen: null,
        now: at("2026-10-05T18:00:00Z"),
      }).own,
    ).toBe("oldest");
  });

  it("an undated album and the demo never turn", () => {
    const undated = guestAlbumOrder({
      facts: { eventDate: null },
      zone: "Pacific/Auckland",
      chosen: null,
    });
    expect(undated.morningAfter).toBeNull();
    expect(undated.own).toBe("newest");
    const demo = guestAlbumOrder({
      facts: { eventDate: "2026-10-03" },
      zone: "Pacific/Auckland",
      chosen: null,
      isDemo: true,
      now: at("2027-01-01T00:00:00Z"),
    });
    expect(demo.morningAfter).toBeNull();
    expect(demo.own).toBe("newest");
  });
});

describe("openingTurnAt: the turn as the page holds it", () => {
  it("a develop time wins; one that is no time, or none, leaves the party's morning after", () => {
    const morning = at("2026-10-03T20:00:00Z");
    expect(openingTurnAt(morning, "2026-10-05T18:00:00.000Z")).toBe(
      at("2026-10-05T18:00:00Z"),
    );
    expect(openingTurnAt(morning, "soon")).toBe(morning);
    expect(openingTurnAt(morning, null)).toBe(morning);
    expect(openingTurnAt(null, null)).toBeNull();
    expect(openingTurnAt(null, "2026-10-05T18:00:00.000Z")).toBe(
      at("2026-10-05T18:00:00Z"),
    );
  });
});

describe("developDefaultIn: the develop's 9 am is the party's", () => {
  it("★ a party ahead develops at 9 am the morning after its last day there: the very instant its album turns", () => {
    const zone = "Pacific/Auckland";
    const facts = { eventDate: "2026-10-09", eventEndDate: "2026-10-11" };
    const develop = developDefaultIn(zone, {
      ...facts,
      nowMs: at("2026-10-05T22:00:00Z"),
    });
    expect(develop.toISOString()).toBe("2026-10-11T20:00:00.000Z"); // Monday 9:00 NZDT
    expect(develop.getTime()).toBe(
      guestAlbumOrder({ facts, zone, chosen: null }).morningAfter,
    );
  });

  it("a party passed, or undated, develops at 9 am tomorrow by the PARTY's calendar", () => {
    // 22:00 UTC on 5 October: already 6 October, 11:00, in Auckland; still 5 October, 15:00, in Los Angeles.
    const nowMs = at("2026-10-05T22:00:00Z");
    expect(
      developDefaultIn("Pacific/Auckland", {
        eventDate: null,
        nowMs,
      }).toISOString(),
    ).toBe("2026-10-06T20:00:00.000Z"); // 7 October, 9:00 NZDT
    expect(
      developDefaultIn("America/Los_Angeles", {
        eventDate: "2026-09-12",
        nowMs,
      }).toISOString(),
    ).toBe("2026-10-06T16:00:00.000Z"); // 6 October, 9:00 PDT
  });

  it("a party today, in its zone, develops the morning after today", () => {
    expect(
      developDefaultIn("Pacific/Auckland", {
        eventDate: "2026-10-06",
        nowMs: at("2026-10-05T22:00:00Z"),
      }).toISOString(),
    ).toBe("2026-10-06T20:00:00.000Z");
  });
});

describe("developToKeep: the develop a style keeps", () => {
  const nowMs = at("2026-10-05T22:00:00Z");

  it("keeps a time still ahead, whatever the zone", () => {
    expect(
      developToKeep("2026-10-20T01:00:00.000Z", "Pacific/Auckland", {
        eventDate: null,
        nowMs,
      }),
    ).toBe("2026-10-20T01:00:00.000Z");
  });

  it("★ offers the party's own 9 am for a time passed or none, never the browser's", () => {
    for (const developsAt of [null, "2026-10-01T09:00:00.000Z"]) {
      expect(
        developToKeep(developsAt, "Pacific/Auckland", {
          eventDate: null,
          nowMs,
        }),
      ).toBe("2026-10-06T20:00:00.000Z");
    }
  });

  it("where no zone can be named at all, keeps the browser's own clock (as before the party kept a zone)", () => {
    expect(developToKeep(null, null, { eventDate: "2026-10-09", nowMs })).toBe(
      defaultDevelopAt({
        eventDate: "2026-10-09",
        now: new Date(nowMs),
      }).toISOString(),
    );
  });
});
