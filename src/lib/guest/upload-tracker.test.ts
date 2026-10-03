import { describe, expect, it } from "vitest";

import {
  buildTrackerRows,
  newlyInAlbum,
  TRACKER_WORDS,
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

describe("the words each status wears", () => {
  // voice-guest r2, Will's `status=approval`: both lines name the review she read about when she
  // sent them. One state, one name: the badge's spoken count and the keep's Sent line say it too.
  it("names the review for a held photograph and for one the host left out", () => {
    expect(TRACKER_WORDS.waiting).toBe("Waiting for approval");
    expect(TRACKER_WORDS.refused).toBe("Not approved");
    expect(TRACKER_WORDS.approved).toBe("In the album");
  });
});

describe("newlyInAlbum", () => {
  const input = (over: Partial<Parameters<typeof newlyInAlbum>[0]> = {}) => ({
    queue: [],
    own: null,
    album: EMPTY,
    approvedOnce: EMPTY,
    ...over,
  });

  it("★ one of hers let in out of waiting is an arrival, and its re-read learns the rest of the pick", () => {
    const out = newlyInAlbum(
      input({
        queue: [q("q1", "done", { mediaId: "m1", mediaStatus: "pending" })],
        album: new Set(["m1"]),
      }),
    );
    expect(out).toEqual({ ids: ["m1"], arrived: true });
    // Pending on her rows when they were read, in the album now: an arrival too.
    expect(
      newlyInAlbum(
        input({
          own: [{ id: "m2", status: "pending" }],
          album: new Set(["m2"]),
        }),
      ),
    ).toEqual({ ids: ["m2"], arrived: true });
  });

  it("what her rows already said was in the album is remembered, never an arrival", () => {
    const out = newlyInAlbum(
      input({
        own: [{ id: "m3", status: "approved" }],
        album: new Set(["m3"]),
      }),
    );
    expect(out).toEqual({ ids: ["m3"], arrived: false });
  });

  it("says nothing of what this device has already seen in the album, or what is not in it", () => {
    expect(
      newlyInAlbum(
        input({
          queue: [q("q1", "done", { mediaId: "m1", mediaStatus: "pending" })],
          own: [{ id: "m1", status: "pending" }],
          album: new Set(["m1"]),
          approvedOnce: new Set(["m1"]),
        }),
      ),
    ).toEqual({ ids: [], arrived: false });
    expect(
      newlyInAlbum(
        input({
          queue: [q("q1", "done", { mediaId: "m1", mediaStatus: "pending" })],
        }),
      ),
    ).toEqual({ ids: [], arrived: false });
  });

  it("names an id once, whichever source knew it", () => {
    const out = newlyInAlbum(
      input({
        queue: [q("q1", "done", { mediaId: "m1", mediaStatus: "pending" })],
        own: [{ id: "m1", status: "pending" }],
        album: new Set(["m1"]),
      }),
    );
    expect(out.ids).toEqual(["m1"]);
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

/* ★ A ROW SEALED UNTIL ITS ALBUM DEVELOPS (build 43's red-team, the upload half): it waits in her tracker as a held one
   does, listed, counted on the badge and hers to take back, in its own word; never "In the album". */
describe("a sealed upload", () => {
  it("waits as Developing, from this visit's landing", () => {
    const out = rows({
      queue: [q("q1", "done", { mediaId: "m1", mediaStatus: "sealed" })],
    });
    expect(out[0].status).toBe("developing");
    expect(TRACKER_WORDS[out[0].status]).toBe("Developing");
  });

  it("★ waits as Developing from her own rows' read, which says it approved and sealed (never In the album)", () => {
    const out = rows({
      queue: [q("q1", "done", { mediaId: "m1", mediaStatus: "approved" })],
      own: [
        { id: "m1", status: "approved", sealed: true },
        { id: "m2", status: "approved", sealed: true },
      ],
    });
    expect(out.map((r) => [r.key, r.status])).toEqual([
      ["m1", "developing"],
      ["m2", "developing"],
    ]);
  });

  it("is in the album once it develops (its id turns up in the album's sync)", () => {
    const out = rows({
      queue: [q("q1", "done", { mediaId: "m1", mediaStatus: "sealed" })],
      own: [{ id: "m1", status: "approved", sealed: true }],
      album: ["m1"],
    });
    expect(out[0].status).toBe("approved");
  });

  it("counts on the badge beside what waits for the host", () => {
    const out = rows({
      queue: [
        q("q1", "done", { mediaId: "m1", mediaStatus: "sealed" }),
        q("q2", "done", { mediaId: "m2", mediaStatus: "pending" }),
      ],
    });
    expect(waitingCount(out)).toBe(2);
  });
});
