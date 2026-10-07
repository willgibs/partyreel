/**
 * ★ A DRIVE COPY IS NAMED AND DATED BY WHEN IT WAS TAKEN (uploads-and-r2.md). The lease carries each original's
 * `captured_at` (`cloud_export_lease`, 20261005200000; read by `leaseWork`), and the one naming function prefers it
 * (`driveMoment`), so a lane's file says the moment the shutter fired, in her zone, in its name, its description and
 * Drive's own `modifiedTime`; an upload that kept none says when it arrived, as before. Fails on the code before the
 * lane, which named every file by its arrival (`capturedAt: null`).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const readSenders = vi.fn();
const nameItems = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: (...args: unknown[]) => rpc(...args) }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/env", () => ({
  assertDriveEnv: () => ({}),
  env: {},
  serverEnv: {},
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: vi.fn(),
  captureWarning: vi.fn(),
}));
vi.mock("@/lib/db/queries/drive", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/db/queries/drive")>()),
  readSenders: (...args: unknown[]) => readSenders(...args),
  nameItems: (...args: unknown[]) => nameItems(...args),
}));

const { leaseWork } = await import("@/lib/db/queries/drive");
const { leaseItemsFor } = await import("@/lib/drive/service.server");

const TAKEN = "a0000000-0000-4000-8000-000000000001";
const PLAIN = "a0000000-0000-4000-8000-000000000002";

beforeEach(() => {
  rpc.mockReset();
  readSenders.mockReset().mockResolvedValue(
    new Map([
      [TAKEN, "Priya"],
      [PLAIN, "Sam"],
    ]),
  );
  nameItems
    .mockReset()
    .mockImplementation(
      async (
        _lease: string,
        items: { mediaId: string; stem: string; ext: string }[],
      ) => new Map(items.map((i) => [i.mediaId, `${i.stem}.${i.ext}`])),
    );
});

/** A lease answer as `cloud_export_lease` builds it: one item taken at 21:14 New York, one that kept no time. */
function leaseAnswer() {
  return {
    state: "work",
    lease: "b0000000-0000-4000-8000-000000000001",
    until: "2026-10-05T12:15:00+00:00",
    job_id: "c0000000-0000-4000-8000-000000000001",
    user_id: "d0000000-0000-4000-8000-000000000001",
    event_id: "e0000000-0000-4000-8000-000000000001",
    album_name: "Maya & Jay",
    tz: "America/New_York",
    folder_id: "folder-1",
    items: [
      {
        media_id: TAKEN,
        key: `events/e/photo/${TAKEN}/original.jpg`,
        bytes: 1000,
        type: "photo",
        created_at: "2026-10-04T13:30:00+00:00",
        captured_at: "2026-10-04T01:14:05+00:00",
        name: null,
        attempts: 1,
        session_uri: null,
        session_offset: null,
        prior_file_id: null,
      },
      {
        media_id: PLAIN,
        key: `events/e/video/${PLAIN}/original.mp4`,
        bytes: 2000,
        type: "video",
        created_at: "2026-10-04T13:31:00+00:00",
        captured_at: null,
        name: null,
        attempts: 1,
        session_uri: null,
        session_offset: null,
        prior_file_id: null,
      },
    ],
    access: { state: "cached" },
  };
}

describe("★ the lease carries each original's capture time, and its copy says it", () => {
  it("leaseWork reads `captured_at` off the lease, none as null", async () => {
    rpc.mockResolvedValue({ data: leaseAnswer(), error: null });
    const lease = await leaseWork("f0000000-0000-4000-8000-000000000001");
    if (lease.state !== "work") throw new Error(`state ${lease.state}`);
    expect(lease.items.map((i) => [i.mediaId, i.capturedAt])).toEqual([
      [TAKEN, "2026-10-04T01:14:05+00:00"],
      [PLAIN, null],
    ]);
  });

  it("names, describes and dates the copy by when it was taken, in her zone; one with none by its arrival", async () => {
    rpc.mockResolvedValue({ data: leaseAnswer(), error: null });
    const lease = await leaseWork("f0000000-0000-4000-8000-000000000001");
    if (lease.state !== "work") throw new Error(`state ${lease.state}`);
    const items = await leaseItemsFor({
      lease: lease.lease,
      eventId: lease.eventId,
      albumName: lease.albumName,
      tz: lease.tz,
      folderFound: lease.folderFound,
      items: lease.items,
    });
    const taken = items.find((i) => i.mediaId === TAKEN)!;
    expect(taken.name).toBe("2026-10-03 21.14.05 · Priya.jpg");
    expect(taken.modifiedTime).toBe("2026-10-04T01:14:05.000Z");
    expect(taken.description).toBe(
      "From Priya at Maya & Jay, 3 Oct 2026, 21:14. Sent from Partyreel.",
    );
    const plain = items.find((i) => i.mediaId === PLAIN)!;
    expect(plain.name).toBe("2026-10-04 09.31.00 · Sam.mp4");
    expect(plain.modifiedTime).toBe("2026-10-04T13:31:00.000Z");
  });
});
