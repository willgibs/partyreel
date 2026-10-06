/**
 * ★ HER SENDS ARE THIS CONNECTION'S OR HISTORY, AND EVERY PLACE SAYS THE SAME (crumbs-82; the Drive re-walk's finding).
 * After a Disconnect and a connect again, Account's Sent still counted the first walk's albums and the dashboard's
 * tiles still lit "In your Drive" for the ones closed within a day, while Your events' list, which the database answers
 * per connection, showed those albums with no state. The numbers below are the walk's own: its first sends (before the
 * Disconnect) and its re-walk's (after the connect again).
 */
import { describe, expect, it } from "vitest";

import type { SendView } from "@/lib/drive/moments";
import type { DriveStatus } from "@/lib/drive/status";

import {
  madeOnThisConnection,
  type MadeSentRow,
  onThisConnection,
  sentHistoryOf,
} from "./this-connection";

const RT = "c895c09d-b618-4b85-a2c8-41dadd1aaf6a";
const REWALK = "d1bc95ba-111b-4337-9e95-36d2f2389ca1";
const CANCEL = "a799e009-3622-4dcb-b897-6b9a0d29589c";

/** The connection she has now: made at the second connect, after the Disconnect. */
const CONNECTED = "2026-10-05T20:50:30.000Z";
/** A send of the first connection (before the Disconnect) and one of this. */
const BEFORE = "2026-10-05T16:39:00.000Z";
const AFTER = "2026-10-05T20:51:51.000Z";

const send = (id: string, eventId: string, createdAt: string): SendView => ({
  id,
  eventId,
  albumName: "Album",
  status: "done",
  pauseReason: null,
  stopReason: null,
  resumeAt: null,
  includeHidden: false,
  itemsTotal: 5,
  itemsSent: 5,
  itemsKept: 0,
  itemsSkipped: 0,
  itemsFailed: 0,
  bytesTotal: 1_679_247,
  bytesSent: 1_679_247,
  folderUrl: null,
  createdAt,
  startedAt: createdAt,
  lastProgressAt: createdAt,
  closedAt: createdAt,
  flagDue: false,
});

const status = (
  sends: SendView[],
  connectedAt: string | null = CONNECTED,
): DriveStatus => ({
  configured: true,
  connection: connectedAt
    ? {
        email: "p3@example.com",
        status: "connected",
        connectedAt,
        folderUrl: null,
        free: null,
      }
    : null,
  sends,
  now: "2026-10-05T21:00:00.000Z",
});

describe("a send made on this connection", () => {
  it("is one made at or after the connection's own start; an earlier one is history", () => {
    expect(madeOnThisConnection(AFTER, CONNECTED)).toBe(true);
    expect(madeOnThisConnection(CONNECTED, CONNECTED)).toBe(true);
    expect(madeOnThisConnection(BEFORE, CONNECTED)).toBe(false);
  });

  it("hides nothing on a date that cannot be read: a send she can see is never lost to a bad timestamp", () => {
    expect(madeOnThisConnection("", CONNECTED)).toBe(true);
    expect(madeOnThisConnection(AFTER, "")).toBe(true);
    expect(madeOnThisConnection("not a date", "also not")).toBe(true);
  });
});

describe("what the poll's answer holds for the connection she has now", () => {
  it("★ keeps this connection's sends and drops an earlier connection's, so no tile or strip lights for it", () => {
    const answer = onThisConnection(
      status([send("old", RT, BEFORE), send("new", REWALK, AFTER)]),
    );
    expect(answer.sends.map((s) => s.id)).toEqual(["new"]);
  });

  it("keeps a same-account reconnect's own sends: its row, and so its start, never moved", () => {
    // The connection was made on the first day; every send since is its own, however old.
    const answer = onThisConnection(
      status(
        [send("a", RT, "2026-10-05T16:39:00.000Z"), send("b", RT, AFTER)],
        "2026-10-05T10:00:00.000Z",
      ),
    );
    expect(answer.sends.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("holds no send for no connection: after a Disconnect every one is an earlier connection's", () => {
    expect(
      onThisConnection(status([send("old", RT, BEFORE)], null)).sends,
    ).toEqual([]);
  });

  it("changes nothing else the answer says", () => {
    const whole = status([send("new", REWALK, AFTER)]);
    expect(onThisConnection(whole)).toEqual(whole);
  });
});

/** A send that ended having landed something, as Account reads it. */
const sentRow = (
  eventId: string,
  albumName: string,
  bytesSent: number,
  itemsSent: number,
  createdAt: string,
  closedAt: string,
): MadeSentRow => ({
  eventId,
  albumName,
  bytesSent,
  itemsSent,
  createdAt,
  closedAt,
});

describe("what Account says it has sent", () => {
  // The walk: the first connection sent RT (5 files) and a 14-file canceled send of an album; the re-walk's connection
  // sent REWALK twice (the second kept all 5) and CANCEL (a canceled 25 of 60, then the whole 60).
  const rows: MadeSentRow[] = [
    sentRow(RT, "RT-Drive walk", 1_679_247, 5, BEFORE, "2026-10-05T16:54:42Z"),
    sentRow(RT, "RT-Drive walk", 1_679_247, 5, BEFORE, "2026-10-05T16:59:35Z"),
    sentRow("arrival", "Arrival", 375_200, 14, BEFORE, "2026-10-05T17:05:40Z"),
    sentRow(
      REWALK,
      "RT-Drive rewalk",
      1_679_247,
      5,
      AFTER,
      "2026-10-05T20:52:15Z",
    ),
    sentRow(
      REWALK,
      "RT-Drive rewalk",
      1_679_247,
      5,
      "2026-10-05T20:55:13Z",
      "2026-10-05T20:55:22Z",
    ),
    sentRow(
      CANCEL,
      "RT-Drive rewalk cancel",
      1_102_410,
      25,
      "2026-10-05T20:59:04Z",
      "2026-10-05T21:00:04Z",
    ),
    sentRow(
      CANCEL,
      "RT-Drive rewalk cancel",
      3_890_062,
      60,
      "2026-10-05T21:01:31Z",
      "2026-10-05T21:03:26Z",
    ),
  ];

  it("★ counts only this connection's sends in Sent, each file once: the two albums its Drive knows", () => {
    expect(sentHistoryOf(rows, CONNECTED).now).toEqual({
      albums: 2,
      bytes: 1_679_247 + 3_890_062,
      lastAt: "2026-10-05T21:03:26Z",
    });
  });

  it("★ says the connections before it apart, as history, with their own albums and bytes", () => {
    expect(sentHistoryOf(rows, CONNECTED).before).toEqual({
      albums: 2,
      bytes: 1_679_247 + 375_200,
      lastAt: "2026-10-05T17:05:40Z",
    });
  });

  it("says nothing earlier for a connection that has always been the only one", () => {
    const only = rows.filter(
      (r) => Date.parse(r.createdAt) >= Date.parse(CONNECTED),
    );
    expect(sentHistoryOf(only, CONNECTED).before).toEqual({
      albums: 0,
      bytes: 0,
      lastAt: null,
    });
  });

  it("reads Nothing yet on this connection while the earlier ones keep their line", () => {
    const earlier = rows.filter(
      (r) => Date.parse(r.createdAt) < Date.parse(CONNECTED),
    );
    const history = sentHistoryOf(earlier, CONNECTED);
    expect(history.now).toEqual({ albums: 0, bytes: 0, lastAt: null });
    expect(history.before.albums).toBe(2);
  });
});
