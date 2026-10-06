/**
 * ★ ACCOUNT'S "SENT", EACH FILE ONCE: the walk's six sends as the database held them (2026-10-05). The card read
 * "4 albums · 5.9 MB" (every done send's bytes added, a re-send's kept files counted again) with 4,488,290 bytes in
 * P3's Drive; an album's largest send is what is there, and the canceled send's landed files count while a later send
 * of the album holds more.
 */
import { describe, expect, it } from "vitest";

import { sentTotalsOf, type SentRow } from "@/lib/drive/sent-totals";

const RT = "c895c09d-b618-4b85-a2c8-41dadd1aaf6a";
const CAMERA = "crumbs-76-camera-first";
const FREE = "crumbs-76-free-first";
const ARRIVAL = "20aa4944-554c-40a7-8f20-1f91ae74fa09";

const row = (
  eventId: string | null,
  bytesSent: number,
  itemsSent: number,
  closedAt: string,
  albumName = "album",
): SentRow => ({ eventId, albumName, bytesSent, itemsSent, closedAt });

/** The walk's sends, oldest first: RT-Drive walk twice (the second kept all 5), two crumbs albums, Arrival canceled at
 * 14 and sent again (14 kept, 46 new). */
const WALK: SentRow[] = [
  row(RT, 1_679_247, 5, "2026-10-05T16:54:42Z"),
  row(RT, 1_679_247, 5, "2026-10-05T16:59:35Z"),
  row(CAMERA, 278_134, 6, "2026-10-05T16:59:50Z"),
  row(FREE, 824_550, 3, "2026-10-05T16:59:58Z"),
  row(ARRIVAL, 375_200, 14, "2026-10-05T17:05:40Z"),
  row(ARRIVAL, 1_706_359, 60, "2026-10-05T17:09:04Z"),
];

describe("what Account says she has sent", () => {
  it("★ counts each file once: the walk's 4,488,290 bytes in her Drive, never its sends added up (the card's 5.9 MB)", () => {
    expect(sentTotalsOf(WALK)).toEqual({
      albums: 4,
      bytes: 4_488_290,
      lastAt: "2026-10-05T17:09:04Z",
    });
  });

  it("counts what a canceled send landed when nothing later holds more", () => {
    expect(
      sentTotalsOf([row(ARRIVAL, 375_200, 14, "2026-10-05T17:05:40Z")]),
    ).toEqual({
      albums: 1,
      bytes: 375_200,
      lastAt: "2026-10-05T17:05:40Z",
    });
  });

  it("keeps a purged album's line by its name, and leaves out a send that landed nothing", () => {
    expect(
      sentTotalsOf([
        row(null, 500, 2, "2026-10-01T10:00:00Z", "Maya & Jay"),
        row(null, 500, 2, "2026-10-02T10:00:00Z", "Maya & Jay"),
        row(RT, 0, 0, "2026-10-03T10:00:00Z"),
      ]),
    ).toEqual({ albums: 1, bytes: 500, lastAt: "2026-10-02T10:00:00Z" });
  });

  it("says nothing yet for none", () => {
    expect(sentTotalsOf([])).toEqual({ albums: 0, bytes: 0, lastAt: null });
  });
});
