/**
 * THE HIGHLIGHT REEL CARD, READ OFF THE MANIFEST (album-host-wiring). The card used to be planned
 * over the whole album, presigned; now the manifest's flags say what can play, only the pool's rows
 * are read for the take's signals, and only the stills the card shows are presigned.
 *
 * What is pinned: the state and the pips follow the flags; the pool reads approved rows of this event
 * and no other; the answer carries presigned stills and never an object key; nothing is read for a
 * card that is off.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
} from "@/lib/db/testing/fake-postgrest";
import {
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  ENTRY_PREVIEW,
  ENTRY_REEL,
  ENTRY_VIDEO,
  type ManifestEntry,
} from "@/lib/events/album-wire";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/queries/album-state", () => ({ readAlbumChanges: vi.fn() }));
vi.mock("@/lib/db/queries/album-host", () => ({
  readHostManifestPage: vi.fn(),
}));
const readMediaLikeCounts = vi.fn();
vi.mock("@/lib/db/queries/likes", () => ({
  readMediaLikeCounts: (...a: unknown[]) => readMediaLikeCounts(...a),
}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({ key }: { key: string }) =>
    `https://r2.test/${key}?sig`,
}));

const { readHubReel } = await import("@/lib/event/host-album.server");

const EVENT = "e0000000-0000-4000-8000-000000000001";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const entry = (
  n: number,
  flags = ENTRY_REEL | ENTRY_PREVIEW,
): ManifestEntry => [id(n), 400, 300, flags, 2_000_000_000_000_000 - n];
const row = (n: number, over: Record<string, unknown> = {}) => ({
  id: id(n),
  event_id: EVENT,
  type: "photo",
  status: "approved",
  guest_id: n % 2 ? `g-${n % 3}` : null,
  original_key: `events/e/photo/${n}/original.jpg`,
  preview_key: `events/e/photo/${n}/preview.webp`,
  width: 400,
  height: 300,
  duration_seconds: null,
  created_at: `2026-09-25T12:00:${String(n % 60).padStart(2, "0")}.000000+00:00`,
  ...over,
});

let fake: FakePostgrest;

beforeEach(() => {
  vi.clearAllMocks();
  readMediaLikeCounts.mockResolvedValue(new Map([[id(3), 5]]));
  fake = createFakePostgrest({
    tables: {
      media: [
        ...Array.from({ length: 12 }, (_, i) => row(i + 1)),
        row(20, { status: "hidden" }),
        // Another event's row sharing nothing but a shape.
        row(40, { event_id: "e-other" }),
      ],
    },
  });
});

describe("readHubReel", () => {
  it("goes live off the flags, reads only the pool, and presigns only the stills it shows", async () => {
    const entries = [
      ...Array.from({ length: 12 }, (_, i) => entry(i + 1)),
      entry(20, ENTRY_REEL | ENTRY_HIDDEN),
      entry(21, ENTRY_REEL | ENTRY_PENDING),
      entry(22, ENTRY_REEL | ENTRY_VIDEO),
    ];
    const face = await readHubReel(
      asSupabase(fake),
      { id: EVENT, showReel: true },
      entries,
      true,
    );
    expect(face.state).toBe("live");
    expect(face.have).toBe(2);
    expect(face.stills).toHaveLength(4);
    expect(face.stillIds).toHaveLength(4);
    for (const [i, still] of face.stills.entries()) {
      expect(still).toBe(
        `https://r2.test/events/e/photo/${Number(face.stillIds[i].slice(-2))}/preview.webp?sig`,
      );
    }
    // The take's likes were read for the pool alone, and no key rides the answer bare.
    expect(readMediaLikeCounts).toHaveBeenCalledTimes(1);
    const [eventId, asked] = readMediaLikeCounts.mock.calls[0];
    expect(eventId).toBe(EVENT);
    expect(asked).toHaveLength(12);
    expect(JSON.stringify(face)).not.toMatch(/"events\//);
    // One read of the pool's rows, scoped to this event and to approved.
    const read = fake.requests.find((r) => r.name === "media")!;
    expect(read.filters).toEqual(
      expect.arrayContaining([
        { column: "event_id", op: "eq", value: EVENT },
        { column: "status", op: "eq", value: "approved" },
      ]),
    );
  });

  it("counts at one, the one still presigned, and reads no likes", async () => {
    const face = await readHubReel(
      asSupabase(fake),
      { id: EVENT, showReel: true },
      [entry(1)],
      true,
    );
    expect(face).toEqual({
      state: "counting",
      have: 1,
      stills: ["https://r2.test/events/e/photo/1/preview.webp?sig"],
      stillIds: [id(1)],
    });
    expect(readMediaLikeCounts).not.toHaveBeenCalled();
  });

  it("reads nothing for a card that is off, by the host's switch or the platform's lever", async () => {
    const entries = Array.from({ length: 12 }, (_, i) => entry(i + 1));
    for (const [showReel, lever] of [
      [false, true],
      [true, false],
    ] as const) {
      const face = await readHubReel(
        asSupabase(fake),
        { id: EVENT, showReel },
        entries,
        lever,
      );
      expect(face).toEqual({ state: "off", have: 2, stills: [], stillIds: [] });
    }
    expect(fake.requests).toHaveLength(0);
    expect(readMediaLikeCounts).not.toHaveBeenCalled();
  });

  it("draws a plain counting card on an album with nothing to play", async () => {
    const face = await readHubReel(
      asSupabase(fake),
      { id: EVENT, showReel: true },
      [entry(20, ENTRY_REEL | ENTRY_HIDDEN)],
      true,
    );
    expect(face).toEqual({
      state: "counting",
      have: 0,
      stills: [],
      stillIds: [],
    });
    expect(fake.requests).toHaveLength(0);
  });
});
