/**
 * THE ALBUM'S ORDER, AS ARITHMETIC (`album-order.ts`): when an album turns (its host's close, a develop reached, a
 * reopen turning it back, and never a date: Will's AY1), the night in order's key (a capture time where an item carries
 * one, else its arrival), her remembered choice, and her lens.
 *
 * ★ RESHAPED ON PURPOSE (crumbs-91, call AY1; scar kept: newest first while the party is on, the night in order after
 * it, a develop turning a Disposable at its moment, the demo never turning). The expired reason: the date as the end of
 * the party. "Let's say I create an event for a trip with friends and I simply put in a single date on there, but
 * wanted to stay open for the entire week" (Will, 2026-10-07): the album turned at 9 am the morning after that one
 * date, mid-trip, and an undated one never did. The end is her close, so these cases hold her word, never a day or a
 * zone; the party's 9 am is the default develop's alone (`zone-morning.test.ts`).
 */
import { describe, expect, it } from "vitest";

import { toManifestEntry, type ManifestEntry } from "@/lib/events/album-wire";
import {
  albumOwnSort,
  ALBUM_SORT_KEEP,
  developMoment,
  entriesInOrder,
  guestAlbumOrder,
  happenedAt,
  inOrder,
  nightKeys,
  lensAlbum,
  readChosenSort,
  shownSort,
  takenAtOf,
  withChosenSort,
} from "@/lib/shared/album-order";

const at = (iso: string) => Date.parse(iso);

describe("the turn: the album's own state, never its date", () => {
  const now = at("2026-10-05T12:00:00Z");

  it("★ newest first while it takes uploads, the night in order once its host closes adding, newest again on a reopen", () => {
    expect(albumOwnSort({ acceptingUploads: true }, now)).toBe("newest");
    expect(albumOwnSort({ acceptingUploads: false }, now)).toBe("oldest");
    // A reopen is the same album taking uploads again: the live feed leads once more.
    expect(
      albumOwnSort({ acceptingUploads: true, developsAt: null }, now),
    ).toBe("newest");
  });

  it("★ nothing about it waits on a day: an open album stays newest first for as long as it is open", () => {
    // The facts carry no date at all: a trip dated on its first day, a weekend, an undated album and a party a year on
    // all read alike, by her word alone.
    for (const later of [now, now + 7 * 86_400_000, now + 400 * 86_400_000])
      expect(albumOwnSort({ acceptingUploads: true }, later)).toBe("newest");
  });

  it("★ a Disposable turns at its develop, her own chosen moment, whether or not she has closed it", () => {
    const develop = "2026-10-05T09:00:00.000Z";
    const moment = at(develop);
    expect(
      albumOwnSort({ acceptingUploads: true, developsAt: develop }, moment - 1),
    ).toBe("newest");
    expect(
      albumOwnSort({ acceptingUploads: true, developsAt: develop }, moment),
    ).toBe("oldest");
    // Closed before the develop: her close turns it already.
    expect(
      albumOwnSort(
        { acceptingUploads: false, developsAt: develop },
        moment - 1,
      ),
    ).toBe("oldest");
  });

  it("a develop that is no time turns nothing: the album follows her word alone", () => {
    expect(developMoment("soon")).toBeNull();
    expect(developMoment(null)).toBeNull();
    expect(developMoment(undefined)).toBeNull();
    expect(developMoment("2026-10-04T16:00:00+00:00")).toBe(
      at("2026-10-04T16:00:00Z"),
    );
    expect(
      albumOwnSort({ acceptingUploads: true, developsAt: "soon" }, now),
    ).toBe("newest");
  });
});

describe("the first paint's order (the page's)", () => {
  it("is the album's own at the render, and hers where she chose one", () => {
    const closed = guestAlbumOrder({
      facts: { acceptingUploads: false },
      chosen: null,
    });
    expect(closed).toEqual({ own: "oldest", chosen: null });
    expect(shownSort(closed)).toBe("oldest");
    const hers = guestAlbumOrder({
      facts: { acceptingUploads: false },
      chosen: "newest",
    });
    expect(shownSort(hers)).toBe("newest");
    expect(
      guestAlbumOrder({ facts: { acceptingUploads: true }, chosen: null }).own,
    ).toBe("newest");
  });

  it("reads a develop at the render's own moment", () => {
    const facts = {
      acceptingUploads: true,
      developsAt: "2026-10-05T09:00:00.000Z",
    };
    expect(
      guestAlbumOrder({ facts, chosen: null, now: at("2026-10-05T08:59:59Z") })
        .own,
    ).toBe("newest");
    expect(
      guestAlbumOrder({ facts, chosen: null, now: at("2026-10-05T09:00:00Z") })
        .own,
    ).toBe("oldest");
  });

  it("the demo never turns: it is the party in progress", () => {
    expect(
      guestAlbumOrder({
        facts: { acceptingUploads: false, developsAt: "2026-10-01T09:00:00Z" },
        chosen: null,
        isDemo: true,
        now: at("2027-01-01T00:00:00Z"),
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
    // Built by the wire's own mapper from rows as the manifest reads return them (uploads-and-r2.md): were the
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
