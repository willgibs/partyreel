/**
 * THE ALBUM'S ORDER, AS ARITHMETIC (`album-order.ts`): when an album turns (and the edge cases the lane was cut to
 * pin: undated and never closed, a range turning the morning after its LAST day, a disposable turning at its develop,
 * the zone, the clock changing that night), the night in order's key (a capture time where an item carries one, else
 * its arrival), her remembered choice, and her lens.
 */
import { describe, expect, it } from "vitest";

import { toManifestEntry, type ManifestEntry } from "@/lib/events/album-wire";
import {
  albumTurnAt,
  ALBUM_SORT_KEEP,
  entriesInOrder,
  guestAlbumOrder,
  happenedAt,
  inOrder,
  nightKeys,
  lensAlbum,
  readChosenSort,
  shownSort,
  sortAt,
  takenAtOf,
  TURN_HOUR,
  wallTimeIn,
  withChosenSort,
} from "@/lib/shared/album-order";

const at = (iso: string) => Date.parse(iso);

describe("the turn", () => {
  it("turns at 9 am the morning after a one-day party, in the zone it is read in", () => {
    expect(TURN_HOUR).toBe(9);
    // Saturday 3 October 2026 in Los Angeles (PDT, UTC-7): Sunday 9 am there is 16:00 UTC.
    expect(
      albumTurnAt({ eventDate: "2026-10-03" }, "America/Los_Angeles"),
    ).toBe(at("2026-10-04T16:00:00Z"));
    // The same party read in London (BST, UTC+1) turns on London's Sunday morning.
    expect(albumTurnAt({ eventDate: "2026-10-03" }, "Europe/London")).toBe(
      at("2026-10-04T08:00:00Z"),
    );
    // And in Auckland (NZDT, UTC+13), half a day earlier than either.
    expect(albumTurnAt({ eventDate: "2026-10-03" }, "Pacific/Auckland")).toBe(
      at("2026-10-03T20:00:00Z"),
    );
  });

  it("a weekend turns the morning after its LAST day, never its first", () => {
    expect(
      albumTurnAt(
        { eventDate: "2026-10-02", eventEndDate: "2026-10-04" },
        "America/New_York",
      ),
    ).toBe(at("2026-10-05T13:00:00Z"));
  });

  it("an end that is no range reads as the one day", () => {
    expect(
      albumTurnAt(
        { eventDate: "2026-10-03", eventEndDate: "2026-10-01" },
        "UTC",
      ),
    ).toBe(at("2026-10-04T09:00:00Z"));
  });

  it("an undated album never turns, whenever it is read: it stays newest first", () => {
    const turn = albumTurnAt({ eventDate: null }, "America/Chicago");
    expect(turn).toBeNull();
    expect(sortAt(turn, at("2030-01-01T00:00:00Z"))).toBe("newest");
  });

  it("a disposable turns AT its develop, whatever its date says", () => {
    expect(
      albumTurnAt(
        { eventDate: "2026-10-03", developsAt: "2026-10-03T23:30:00.000Z" },
        "America/Los_Angeles",
      ),
    ).toBe(at("2026-10-03T23:30:00Z"));
    // An undated disposable still turns at its develop.
    expect(
      albumTurnAt(
        { eventDate: null, developsAt: "2026-10-04T16:00:00+00:00" },
        "UTC",
      ),
    ).toBe(at("2026-10-04T16:00:00Z"));
  });

  it("a develop time that is no time falls back to the days", () => {
    expect(
      albumTurnAt({ eventDate: "2026-10-03", developsAt: "soon" }, "UTC"),
    ).toBe(at("2026-10-04T09:00:00Z"));
  });

  it("holds 9 am through the clock changing that night, both ways", () => {
    // The party on Halloween; the clocks fall back at 2 am on 1 November (PDT to PST, UTC-8).
    expect(
      albumTurnAt({ eventDate: "2026-10-31" }, "America/Los_Angeles"),
    ).toBe(at("2026-11-01T17:00:00Z"));
    // A party on 7 March; the clocks spring forward at 2 am on the 8th (PST to PDT, UTC-7).
    expect(
      albumTurnAt({ eventDate: "2026-03-07" }, "America/Los_Angeles"),
    ).toBe(at("2026-03-08T16:00:00Z"));
    // Europe springs forward at 1 am UTC on 29 March 2026: 9 am in Berlin is 07:00 UTC.
    expect(albumTurnAt({ eventDate: "2026-03-28" }, "Europe/Berlin")).toBe(
      at("2026-03-29T07:00:00Z"),
    );
  });

  it("reads a zone it cannot read as UTC rather than throwing", () => {
    expect(albumTurnAt({ eventDate: "2026-10-03" }, "Mars/Olympus")).toBe(
      at("2026-10-04T09:00:00Z"),
    );
  });

  it("is newest first until the turn's own moment, then the night in order", () => {
    const turn = at("2026-10-04T16:00:00Z");
    expect(sortAt(turn, turn - 1)).toBe("newest");
    expect(sortAt(turn, turn)).toBe("oldest");
    expect(sortAt(turn, turn + 86_400_000 * 400)).toBe("oldest");
  });

  it("wallTimeIn names an hour in a zone's own wall clock", () => {
    expect(wallTimeIn("2026-07-01", 9, "Asia/Kolkata")).toBe(
      at("2026-07-01T03:30:00Z"),
    );
    expect(wallTimeIn("2026-01-15", 9, "Australia/Sydney")).toBe(
      at("2026-01-14T22:00:00Z"),
    );
  });
});

describe("the first paint's order (the page's)", () => {
  const facts = { eventDate: "2026-10-03" };
  const after = at("2026-10-05T12:00:00Z");
  const during = at("2026-10-03T20:00:00Z");

  it("is the album's own at the render, and hers where she chose one", () => {
    const morning = guestAlbumOrder({
      facts,
      zone: "UTC",
      chosen: null,
      now: after,
    });
    expect(morning).toEqual({
      morningAfter: at("2026-10-04T09:00:00Z"),
      own: "oldest",
      chosen: null,
    });
    expect(shownSort(morning)).toBe("oldest");
    const hers = guestAlbumOrder({
      facts,
      zone: "UTC",
      chosen: "newest",
      now: after,
    });
    expect(shownSort(hers)).toBe("newest");
    expect(
      guestAlbumOrder({ facts, zone: "UTC", chosen: null, now: during }).own,
    ).toBe("newest");
  });

  it("the demo never turns: it is the party in progress", () => {
    expect(
      guestAlbumOrder({
        facts,
        zone: "UTC",
        chosen: null,
        isDemo: true,
        now: after,
      }).own,
    ).toBe("newest");
  });
});

/** A manifest entry at arrival `t` (microseconds), newest first as the wire keeps them. */
const e = (id: string, t: number, c?: number): ManifestEntry =>
  c === undefined ? [id, 640, 480, 4, t] : [id, 640, 480, 4, t, null, c];

describe("the night in order", () => {
  // Arrival order, newest first, the server's own (t desc, then id desc on a tie).
  const wire = [
    e("d", 400),
    e("c2", 300),
    e("c1", 300),
    e("b", 200),
    e("a", 100),
  ];

  it("is arrival's own with no capture time on the wire: the list reversed, the server's tie kept", () => {
    expect(takenAtOf(wire[0])).toBeNull();
    expect(happenedAt(wire[0])).toBe(400);
    expect(entriesInOrder(wire).map((x) => x[0])).toEqual([
      "a",
      "b",
      "c1",
      "c2",
      "d",
    ]);
    expect(inOrder(wire).map((x) => x[0])).toEqual(["a", "b", "c1", "c2", "d"]);
  });

  it("keyed on when each happened, sorts to exactly the reversal when that is arrival", () => {
    expect(inOrder(wire, (x) => x[4]).map((x) => x[0])).toEqual(
      inOrder(wire).map((x) => x[0]),
    );
  });

  it("★ with a capture time, a late upload taken during the party lands mid-album, not at its end", () => {
    // "late" arrived last (t 500) but was taken at 150: between a and b in the night's order.
    const taken = new Map([["late", 150]]);
    const list = [e("late", 500), ...wire];
    const night = inOrder(list, (x) => taken.get(x[0]) ?? x[4]);
    expect(night.map((x) => x[0])).toEqual(["a", "late", "b", "c1", "c2", "d"]);
  });

  it("★ reads the capture time the album's wire carries: a late upload's own `captured_at` puts it mid-album", () => {
    // Built by the wire's own mapper from rows as the manifest reads return them (capture-time, Will's X7): were the
    // wire to stop carrying `captured_at`, the late upload would fall back to its arrival and land at the end.
    const row = (id: string, created: string, captured: string | null) =>
      toManifestEntry(
        {
          id,
          type: "photo",
          width: 640,
          height: 480,
          duration_seconds: null,
          has_preview: true,
          reel_eligible: true,
          created_at: created,
          captured_at: captured,
        },
        "album",
      );
    // Newest first by arrival, the wire's own order: the late one arrived the next morning, taken at 21:10.
    const night = [
      row(
        "late",
        "2026-10-04T09:30:00.000000+00:00",
        "2026-10-03T21:10:00+00:00",
      ),
      row("b", "2026-10-03T21:20:00.000000+00:00", null),
      row("a", "2026-10-03T21:00:00.000000+00:00", null),
    ];
    expect(takenAtOf(night[0])).toBe(at("2026-10-03T21:10:00Z") * 1000);
    expect(takenAtOf(night[1])).toBeNull();
    expect(happenedAt(night[0])).toBe(at("2026-10-03T21:10:00Z") * 1000);
    expect(entriesInOrder(night).map((x) => x[0])).toEqual(["a", "late", "b"]);
  });

  /* ★ A TIME FAR OUTSIDE THE NIGHT IS SEATED AT ITS END EDGE (crumbs-85, capture-time's Deferred line): a throwback, or a
     camera a year off, led the night in order. The wire keeps the true time; the order seats it after the night. */
  it("★ seats a throwback at the night's end, in its own order, never leading the night", () => {
    const row = (id: string, created: string, captured: string | null) =>
      toManifestEntry(
        {
          id,
          type: "photo",
          width: 640,
          height: 480,
          duration_seconds: null,
          has_preview: true,
          reel_eligible: true,
          created_at: created,
          captured_at: captured,
        },
        "album",
      );
    const night = [
      row("c", "2026-10-03T23:00:00.000000+00:00", null),
      // A camera a year behind, and a throwback from the summer, both shared during the night.
      row(
        "year",
        "2026-10-03T22:30:00.000000+00:00",
        "2025-10-03T22:29:00+00:00",
      ),
      row(
        "summer",
        "2026-10-03T22:00:00.000000+00:00",
        "2026-07-14T12:00:00+00:00",
      ),
      row("b", "2026-10-03T21:20:00.000000+00:00", null),
      row("a", "2026-10-03T21:00:00.000000+00:00", null),
    ];
    expect(entriesInOrder(night).map((x) => x[0])).toEqual([
      "a",
      "b",
      "c",
      "year",
      "summer",
    ]);
    // The wire keeps the true time.
    expect(takenAtOf(night[2])).toBe(at("2026-07-14T12:00:00Z") * 1000);
    // And the guest's live album seats it the same way (one key, `nightKeys`).
    const keyOf = nightKeys(night)!;
    expect(inOrder(night, keyOf).map((x) => x[0])).toEqual([
      "a",
      "b",
      "c",
      "year",
      "summer",
    ]);
  });

  it("★ an album made after its trip, or a weekend, keeps its true order: nothing is seated", () => {
    const DAY = 24 * 60 * 60 * 1_000_000;
    // Every capture days before the uploads, a day apart: one run, the night whole.
    const trip = [5, 4, 3, 2, 1].map((d) => e(`d${d}`, 100 * DAY + d, d * DAY));
    expect(entriesInOrder(trip).map((x) => x[0])).toEqual([
      "d1",
      "d2",
      "d3",
      "d4",
      "d5",
    ]);
    // Two runs of equal size (two nights a week apart): neither is the smaller part, so both keep their place.
    const two = [
      e("n2b", 30 * DAY, 10 * DAY + 2),
      e("n2a", 30 * DAY - 1, 10 * DAY + 1),
      e("n1b", 30 * DAY - 2, 1 * DAY + 2),
      e("n1a", 30 * DAY - 3, 1 * DAY + 1),
    ];
    expect(entriesInOrder(two).map((x) => x[0])).toEqual([
      "n1a",
      "n1b",
      "n2a",
      "n2b",
    ]);
    expect(nightKeys([e("x", 1), e("y", 2)])).toBeNull();
  });

  it("a tie goes to the earlier arrival, and one the manifest does not hold yet is the newest of all", () => {
    const list = [e("mine", 0), e("y", 200), e("x", 100)];
    const keys = new Map<string, number | undefined>([
      ["mine", undefined],
      ["y", 100],
      ["x", 100],
    ]);
    expect(inOrder(list, (x) => keys.get(x[0])).map((x) => x[0])).toEqual([
      "x",
      "y",
      "mine",
    ]);
  });
});

describe("her remembered choice (`pr_album_sort`)", () => {
  const A = "11111111-1111-4111-8111-111111111111";
  const B = "22222222-2222-4222-8222-222222222222";

  it("reads hers on this album and nobody else's", () => {
    const raw = withChosenSort(withChosenSort(null, A, "oldest"), B, "newest");
    expect(readChosenSort(raw, A)).toBe("oldest");
    expect(readChosenSort(raw, B)).toBe("newest");
    expect(readChosenSort(raw, "33333333-3333-4333-8333-333333333333")).toBe(
      null,
    );
    expect(readChosenSort(undefined, A)).toBeNull();
  });

  it("keeps the newest choice first, forgets one on request, and keeps at most a dozen albums", () => {
    let raw = withChosenSort(null, A, "oldest");
    raw = withChosenSort(raw, B, "newest");
    expect(raw.startsWith(`${B}:n`)).toBe(true);
    raw = withChosenSort(raw, A, null);
    expect(readChosenSort(raw, A)).toBeNull();
    expect(readChosenSort(raw, B)).toBe("newest");
    let many = "";
    for (let i = 0; i < ALBUM_SORT_KEEP + 5; i++)
      many = withChosenSort(
        many,
        `${String(i).padStart(8, "0")}-0000-4000-8000-000000000000`,
        "oldest",
      );
    expect(many.split(",")).toHaveLength(ALBUM_SORT_KEEP);
  });

  it("drops what is malformed rather than throwing (a cookie is the browser's to garble)", () => {
    expect(readChosenSort(`<script>:o,${A}:x,${A}:n`, A)).toBe("newest");
    expect(readChosenSort(":::,,", A)).toBeNull();
  });
});

type Item = { id: string; type: "photo" | "video" };
const p = (id: string): Item => ({ id, type: "photo" });
const v = (id: string): Item => ({ id, type: "video" });

describe("her lens", () => {
  const album = [p("1"), v("2"), p("3"), v("4"), p("5")];

  it("Photos and Videos each show their kind, counted, the album's kinds beside them", () => {
    const videos = lensAlbum(album, new Set(), "videos");
    expect(videos.filter).toBe("videos");
    expect(videos.items.map((i) => i.id)).toEqual(["2", "4"]);
    expect(videos.count).toBe(2);
    expect(videos.kinds).toEqual({ photos: 3, videos: 2 });
    expect(lensAlbum(album, new Set(), "photos").items).toHaveLength(3);
  });

  it("is no lens on an album of one kind: Photos over photos is the album", () => {
    const photos = lensAlbum([p("1"), p("2")], new Set(), "photos");
    expect(photos.filter).toBe("all");
    expect(photos.items).toHaveLength(2);
    expect(lensAlbum([p("1")], new Set(), "videos").filter).toBe("all");
  });

  it("Yours shows hers, counted over the whole album, and stands only while she owns one", () => {
    const yours = lensAlbum(album, new Set(["3", "4"]), "yours");
    expect(yours.filter).toBe("yours");
    expect(yours.items.map((i) => i.id)).toEqual(["3", "4"]);
    expect(yours.owned).toBe(2);
    const none = lensAlbum(album, new Set(), "yours");
    expect(none.filter).toBe("all");
    expect(none.items).toHaveLength(5);
  });

  it("All is the album whole, with her count still said", () => {
    const all = lensAlbum(album, new Set(["1"]), "all");
    expect(all.filter).toBe("all");
    expect(all.count).toBe(5);
    expect(all.owned).toBe(1);
  });
});
