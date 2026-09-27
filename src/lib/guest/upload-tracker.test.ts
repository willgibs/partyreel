import { describe, expect, it } from "vitest";

import {
  buildTrackerRows,
  trackerShows,
  waitingCount,
  type OwnUploadWire,
  type TrackerQueueItem,
} from "@/lib/guest/upload-tracker";

/**
 * HER TRACKER, AS RULES (`guest-capture` r1, Will's `tracker=button`). Three sources, each the
 * truth for what it can see: this visit's queue (live), the album's own sync (every approval, and
 * anything of hers taken down again), and her own rows read on demand (the one place a refusal is
 * learned). The badge counts what waits for the host, the number only.
 */
const EMPTY: ReadonlySet<string> = new Set();

const q = (
  id: string,
  status: TrackerQueueItem["status"],
  extra: Partial<TrackerQueueItem> = {},
): TrackerQueueItem => ({ id, status, kind: "photo", ...extra });

function rows(input: {
  queue?: TrackerQueueItem[];
  own?: OwnUploadWire[] | null;
  album?: string[];
  approvedOnce?: string[];
  removed?: string[];
}) {
  return buildTrackerRows({
    queue: input.queue ?? [],
    own: input.own ?? null,
    album: new Set(input.album ?? []),
    approvedOnce: new Set(input.approvedOnce ?? []),
    removed: new Set(input.removed ?? []),
  });
}

describe("buildTrackerRows", () => {
  it("lists this visit's files newest first: in the air, waiting, in the album", () => {
    const out = rows({
      queue: [
        q("q1", "done", { mediaId: "m1", mediaStatus: "pending" }),
        q("q2", "uploading"),
        q("q3", "queued"),
      ],
    });
    expect(out.map((r) => [r.key, r.status])).toEqual([
      ["q3", "sending"],
      ["q2", "sending"],
      ["m1", "waiting"],
    ]);
  });

  it("never lists a file that did not go: the failure sheet owns it", () => {
    expect(rows({ queue: [q("q1", "error")] })).toEqual([]);
  });

  it("★ an approval reaches her live through the album: the id turns up, the row is in", () => {
    const out = rows({
      queue: [q("q1", "done", { mediaId: "m1", mediaStatus: "pending" })],
      album: ["m1"],
    });
    expect(out[0].status).toBe("approved");
  });

  it("★ a refusal is learned from her own rows, never from the album", () => {
    const out = rows({
      queue: [q("q1", "done", { mediaId: "m1", mediaStatus: "pending" })],
      own: [{ id: "m1", status: "refused" }],
    });
    expect(out[0].status).toBe("refused");
  });

  it("one that was in the album and left it while still hers was taken down", () => {
    const out = rows({
      own: [{ id: "m1", status: "approved" }],
      approvedOnce: ["m1"],
    });
    expect(out[0].status).toBe("refused");
  });

  it("the album is live and her rows' read a moment old: an id in the album is in it", () => {
    const out = rows({ own: [{ id: "m1", status: "pending" }], album: ["m1"] });
    expect(out[0].status).toBe("approved");
  });

  it("brings back what an earlier visit sent, after this visit's files and never twice", () => {
    const out = rows({
      queue: [q("q1", "done", { mediaId: "m9", mediaStatus: "pending" })],
      own: [
        { id: "m9", status: "pending" },
        { id: "m2", status: "approved" },
        { id: "m1", status: "pending" },
      ],
    });
    expect(out.map((r) => r.key)).toEqual(["m9", "m2", "m1"]);
    expect(out[0].queueId).toBe("q1");
    expect(out[1].queueId).toBeNull();
  });

  it("never lists what she removed herself: it is hers to forget", () => {
    const out = rows({
      queue: [q("q1", "done", { mediaId: "m1", mediaStatus: "approved" })],
      own: [{ id: "m2", status: "pending" }],
      removed: ["m1", "m2"],
    });
    expect(out).toEqual([]);
  });
});

describe("waitingCount", () => {
  it("counts only what waits for the host: never a file still in the air", () => {
    const out = rows({
      queue: [
        q("q1", "done", { mediaId: "m1", mediaStatus: "pending" }),
        q("q2", "uploading"),
      ],
      own: [
        { id: "m2", status: "pending" },
        { id: "m3", status: "approved" },
        { id: "m4", status: "refused" },
      ],
    });
    expect(waitingCount(out)).toBe(2);
  });
});

describe("trackerShows", () => {
  const some = rows({ own: [{ id: "m1", status: "pending" }] });

  it("only where she has something sent at a moderated event", () => {
    expect(
      trackerShows({
        moderated: true,
        isDemo: false,
        isOwner: false,
        rows: some,
      }),
    ).toBe(true);
    expect(
      trackerShows({
        moderated: false,
        isDemo: false,
        isOwner: false,
        rows: some,
      }),
    ).toBe(false);
    expect(
      trackerShows({
        moderated: true,
        isDemo: false,
        isOwner: false,
        rows: [],
      }),
    ).toBe(false);
  });

  it("never in the demo, never for the host", () => {
    expect(
      trackerShows({
        moderated: true,
        isDemo: true,
        isOwner: false,
        rows: some,
      }),
    ).toBe(false);
    expect(
      trackerShows({
        moderated: true,
        isDemo: false,
        isOwner: true,
        rows: some,
      }),
    ).toBe(false);
  });
});

describe("the empty sets it is handed", () => {
  it("reads an empty album and no rows as nothing to say", () => {
    expect(
      buildTrackerRows({
        queue: [],
        own: [],
        album: EMPTY,
        approvedOnce: EMPTY,
        removed: EMPTY,
      }),
    ).toEqual([]);
  });
});
