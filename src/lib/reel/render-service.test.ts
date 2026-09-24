/**
 * THE REEL'S TIMELINE, AS THE SERVER RESOLVES IT (C14, the 1,000-row round, 2026-09-23).
 *
 * `resolveReelRenderContext` is the render identity every client-encode phase and the password
 * event's guest reel read: the ordered, approved members of the reel, at most MAX_RENDER_CLIPS
 * (150) of them, hashed with the config. It read the reel's members and EVERY approved photo of the
 * event, each in one PostgREST request (so each stopped at 1,000 rows), and threw away the three
 * errors a Promise.all destructure left unbound. It now reads the members with their media
 * embedded, filtered to approved BEFORE the 150 slice, in one bounded request.
 *
 * On the clamping fake (`src/lib/db/testing/fake-postgrest.ts`), so an unbounded read would come back
 * cut at 1,000 exactly as it would live.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    throw new Error("the context reads through the client it is handed");
  },
}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({ key }: { key: string }) => `signed:${key}`,
  headObject: async () => null,
  presignUpload: async () => ({}),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: () => {},
  captureError: () => {},
}));
vi.mock("@/lib/security/abuse-rate-limit-store", () => ({
  abuseHashes: () => ({ ipHash: "ip", scopeHash: "scope" }),
  checkAbuseRate: async () => ({ allowed: true }),
  recordAbuseEvent: async () => {},
}));

const { resolveReelRenderContext } = await import("./render-service");

let fake: FakePostgrest;

const uuid = (i: number) =>
  `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const at = (second: number) =>
  `2026-09-23T12:${String(Math.floor(second / 60) % 60).padStart(2, "0")}:${String(second % 60).padStart(2, "0")}.000000+00:00`;

/** A member whose `media` embed is the live media row, or null once the row is purged. */
function member(mediaId: string, position: number, addedAt: string): FakeRow {
  const row: FakeRow = {
    event_id: "ev-1",
    media_id: mediaId,
    position,
    added_at: addedAt,
  };
  Object.defineProperty(row, "media", {
    enumerable: false,
    get: () => fake.tables.media.find((m) => m.id === mediaId) ?? null,
  });
  return row;
}

/**
 * A reel of `n` members in position order over an event of `n` media. The status of each is
 * `statusOf(i)`, so a test can put hidden, pending and removed members where the slice would fall.
 */
function useReel(
  n: number,
  statusOf: (i: number) => string = () => "approved",
): FakeRow[] {
  const media = Array.from({ length: n }, (_, i) => ({
    id: uuid(i),
    event_id: "ev-1",
    status: statusOf(i),
  }));
  const members = media.map((m, i) => member(m.id, i, at(i % 3600)));
  fake = createFakePostgrest({
    tables: {
      events: [
        {
          id: "ev-1",
          host_id: "host-1",
          name: "Garden party",
          deleted_at: null,
        },
      ],
      profiles: [{ id: "host-1", tier: "pro" }],
      highlight_reels: [
        {
          event_id: "ev-1",
          style_id: "classic",
          theme: "classic",
          orientation: "portrait",
          seed: 7,
          length_seconds: null,
          cover_media_id: null,
          guest_visible: true,
          status: "pending",
          output_key: null,
        },
      ],
      media,
      // Stored out of order: the read's ORDER BY decides, never the table's.
      reel_items: [...members].reverse(),
    },
  });
  return media;
}

beforeEach(() => {
  useReel(3);
});

describe("the reel's render timeline", () => {
  it("is the reel's approved members in position order", async () => {
    useReel(5, (i) => (i === 1 ? "hidden" : i === 3 ? "removed" : "approved"));
    const ctx = await resolveReelRenderContext(asSupabase(fake), "ev-1");
    expect(ctx?.orderedApprovedIds).toEqual([uuid(0), uuid(2), uuid(4)]);
  });

  it("filters to approved BEFORE the 150 slice, so a skipped member never costs a clip", async () => {
    // A 1,300-member reel whose first 400 members are one approved in four: slicing first and then
    // filtering would leave 38 clips; filtering first fills all 150 from further down the reel.
    const media = useReel(1300, (i) =>
      i < 400 && i % 4 !== 0
        ? i % 4 === 1
          ? "hidden"
          : "pending"
        : "approved",
    );
    const ctx = await resolveReelRenderContext(asSupabase(fake), "ev-1");

    const approved = media
      .filter((m) => m.status === "approved")
      .map((m) => m.id);
    expect(ctx?.orderedApprovedIds).toEqual(approved.slice(0, 150));
    // One request for the timeline, bounded at 150, returning 150 rows: the event's photos are
    // never read in full to find them.
    const timeline = fake.requests.filter((r) => r.name === "reel_items");
    expect(timeline).toHaveLength(1);
    expect(timeline[0]).toMatchObject({ limit: 150, returned: 150 });
    expect(fake.requests.some((r) => r.name === "media")).toBe(false);
  });

  it("drops a purged photo's surviving curation row", async () => {
    useReel(3);
    fake.tables.media.splice(1, 1);
    const ctx = await resolveReelRenderContext(asSupabase(fake), "ev-1");
    expect(ctx?.orderedApprovedIds).toEqual([uuid(0), uuid(2)]);
  });

  it("breaks a position tie by id, the order the Studio shows", async () => {
    useReel(3);
    for (const row of fake.tables.reel_items) {
      row.position = 0;
      row.added_at = at(0);
    }
    const ctx = await resolveReelRenderContext(asSupabase(fake), "ev-1");
    expect(ctx?.orderedApprovedIds).toEqual([uuid(0), uuid(1), uuid(2)]);
  });

  it("hashes the same reel the same way on every phase", async () => {
    const first = await resolveReelRenderContext(asSupabase(fake), "ev-1");
    const second = await resolveReelRenderContext(asSupabase(fake), "ev-1");
    expect(first?.hash).toBe(second?.hash);
    expect(first?.styleId).toBe("classic");
  });
});

describe("a failed read is an error, never an empty or default reel", () => {
  it("throws when the timeline read fails", async () => {
    delete fake.tables.reel_items;
    await expect(
      resolveReelRenderContext(asSupabase(fake), "ev-1"),
    ).rejects.toThrow(/reel render: timeline/);
  });

  it("throws when the config read fails, rather than hashing the default config", async () => {
    delete fake.tables.highlight_reels;
    await expect(
      resolveReelRenderContext(asSupabase(fake), "ev-1"),
    ).rejects.toThrow(/reel render: config/);
  });

  it("answers null for a deleted event, as before", async () => {
    fake.tables.events[0].deleted_at = at(1);
    expect(await resolveReelRenderContext(asSupabase(fake), "ev-1")).toBeNull();
  });
});
