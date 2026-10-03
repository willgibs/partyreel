import { describe, expect, it } from "vitest";

import {
  buildTrackerRows,
  developTimeWords,
  newlyInAlbum,
  TRACKER_SEALED_WORDS,
  TRACKER_WORDS,
  trackerShows,
  uploadsWait,
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
  sealing?: boolean;
}) {
  return buildTrackerRows({
    queue: input.queue ?? [],
    own: input.own ?? null,
    album: new Set(input.album ?? []),
    approvedOnce: new Set(input.approvedOnce ?? []),
    removed: new Set(input.removed ?? []),
    sealing: input.sealing,
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

/* ★ A SHOT SEALED UNTIL THE ALBUM DEVELOPS WAITS (red-team 43's MEDIUM: on an album with a develop time ahead, her
   shots read as joined and vanished on a reload, with no tracker). Approved and sealed is in nobody's album yet:
   it waits, in its own words, counted by the badge and hers to take back like anything waiting. */
describe("buildTrackerRows: the develop", () => {
  it("★ her rows' read says sealed: waiting for the develop, never in the album", () => {
    const out = rows({ own: [{ id: "m1", status: "approved", sealed: true }] });
    expect(out).toEqual([
      expect.objectContaining({ key: "m1", status: "waiting", sealed: true }),
    ]);
    expect(waitingCount(out)).toBe(1);
  });

  it("★ this visit's file on an album that seals what is added waits before her rows are read again", () => {
    const sent = q("q1", "done", { mediaId: "m1", mediaStatus: "approved" });
    expect(rows({ queue: [sent], sealing: true })[0]).toMatchObject({
      status: "waiting",
      sealed: true,
    });
    // Where nothing is sealed, an approved file is simply in.
    expect(rows({ queue: [sent] })[0]).toEqual(
      expect.objectContaining({ status: "approved" }),
    );
    expect(rows({ queue: [sent] })[0].sealed).toBeUndefined();
  });

  it("her rows' read is the truth for her own: a file the read says is unsealed is in", () => {
    const out = rows({
      queue: [q("q1", "done", { mediaId: "m1", mediaStatus: "approved" })],
      own: [{ id: "m1", status: "approved" }],
      sealing: true,
    });
    expect(out[0].status).toBe("approved");
  });

  it("once the album develops and shows it, it is in", () => {
    const out = rows({
      own: [{ id: "m1", status: "approved", sealed: true }],
      album: ["m1"],
    });
    expect(out[0]).toEqual(expect.objectContaining({ status: "approved" }));
    expect(out[0].sealed).toBeUndefined();
  });

  it("a sealed one turning up in the album is an arrival out of waiting", () => {
    expect(
      newlyInAlbum({
        queue: [],
        own: [{ id: "m1", status: "approved", sealed: true }],
        album: new Set(["m1"]),
        approvedOnce: EMPTY,
      }),
    ).toEqual({ ids: ["m1"], arrived: true });
  });

  it("names its wait apart from the host's: the develop is nobody's decision", () => {
    expect(TRACKER_SEALED_WORDS).toBe("Waiting to develop");
    expect(TRACKER_SEALED_WORDS).not.toBe(TRACKER_WORDS.waiting);
  });
});

describe("uploadsWait: whether what she adds waits, and for what", () => {
  const NOW = Date.parse("2026-10-02T20:00:00Z");
  const AHEAD = "2026-10-03T13:00:00Z";
  const PAST = "2026-10-01T13:00:00Z";

  it("★ a develop time ahead: it waits, for the develop (red on the approve-only reading)", () => {
    expect(
      uploadsWait({ moderation_mode: "live", develops_at: AHEAD }, NOW),
    ).toEqual({ waits: true, developsAt: AHEAD });
  });

  it("the host's approval: it waits, with no develop to say", () => {
    expect(
      uploadsWait(
        { moderation_mode: "hold_for_approval", develops_at: null },
        NOW,
      ),
    ).toEqual({ waits: true, developsAt: null });
  });

  it("both: the develop is the promise said (the stronger), and it waits", () => {
    expect(
      uploadsWait(
        { moderation_mode: "hold_for_approval", develops_at: AHEAD },
        NOW,
      ),
    ).toEqual({ waits: true, developsAt: AHEAD });
  });

  it("a develop time reached has developed: what is added shows at once", () => {
    expect(
      uploadsWait({ moderation_mode: "live", develops_at: PAST }, NOW),
    ).toEqual({ waits: false, developsAt: null });
    expect(uploadsWait({ moderation_mode: "live" }, NOW)).toEqual({
      waits: false,
      developsAt: null,
    });
  });

  it("says the develop time in a guest's words, or nothing for a time it cannot read", () => {
    expect(developTimeWords(AHEAD)).toMatch(
      /^\w{3}, \w{3} \d{1,2}, \d{1,2}:\d{2}\s?[AP]M$/,
    );
    expect(developTimeWords("not a time")).toBeNull();
    expect(developTimeWords(null)).toBeNull();
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

/* ★ A LANDING THE QUEUE TOLD SEALED (disposable-camera, red-team 43's upload half): the server answered `sealed` and
   the queue said so, so it waits for the develop from the moment it lands, before her rows' next read, whatever the
   page read of the album. */
describe("a landing the queue told sealed", () => {
  it("waits to develop at once, counted and hers to take back", () => {
    const out = buildTrackerRows({
      queue: [
        {
          id: "q1",
          status: "done",
          kind: "photo",
          mediaId: "m1",
          mediaStatus: "sealed",
        },
      ],
      own: null,
      album: new Set(),
      approvedOnce: new Set(),
      removed: new Set(),
    });
    expect(out).toEqual([
      expect.objectContaining({
        mediaId: "m1",
        status: "waiting",
        sealed: true,
      }),
    ]);
    expect(waitingCount(out)).toBe(1);
  });

  it("is in the album once it develops (its id turns up in the album's sync)", () => {
    const out = buildTrackerRows({
      queue: [
        {
          id: "q1",
          status: "done",
          kind: "photo",
          mediaId: "m1",
          mediaStatus: "sealed",
        },
      ],
      own: [{ id: "m1", status: "approved", sealed: true }],
      album: new Set(["m1"]),
      approvedOnce: new Set(),
      removed: new Set(),
    });
    expect(out[0].status).toBe("approved");
  });
});
