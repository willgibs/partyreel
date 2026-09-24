/**
 * A BULK SELECTION RIDES THE URL IN CHUNKS (M13, the 1,000-row round, 2026-09-23).
 *
 * Every bulk write puts its selection in the request URL as `id=in.(...)`, about 39 characters an
 * id, so one request carrying a "Select all" on a big album outgrew postgrest-js's 8,000-character
 * limit and failed WHOLE: the host's Hide, Delete or Approve did nothing. The purge's reads had it
 * worse: a clipped read of the selection would have freed only some of the objects its RPC then
 * dropped the rows of. The fake (`src/lib/db/testing/fake-postgrest.ts`) fails a URL past 8,000
 * characters the way a failed fetch resolves, so an unchunked list fails here as it failed live, and
 * a 2,500-id selection passes only in chunks.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { IN_CHUNK } from "@/lib/db/read-all";
import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

let fake: FakePostgrest;
const deleted: string[][] = [];

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => asSupabase(fake),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));
vi.mock("@/lib/r2/delete", () => ({
  deleteR2Objects: async (keys: string[]) => {
    deleted.push(keys);
    return { deleted: keys.length, errored: [] };
  },
}));

const {
  approveBulk,
  hideBulk,
  purgeMediaNow,
  removeMediaBulk,
  setMediaStatusBulk,
} = await import("./media");

const uuid = (i: number) =>
  `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const URL_LIMIT = 8000;

function row(i: number, fields: FakeRow = {}): FakeRow {
  return {
    id: uuid(i),
    event_id: "ev-1",
    status: "approved",
    removed_at: null,
    original_key: `events/ev-1/photo/${uuid(i)}/original.jpg`,
    preview_key:
      i % 2 === 0 ? `events/ev-1/photo/${uuid(i)}/preview.webp` : null,
    legal_hold_at: null,
    ...fields,
  };
}

function useAlbum(rows: FakeRow[], rpc: FakePostgrest["functions"] = {}) {
  fake = createFakePostgrest({
    user: { id: "host-1" },
    tables: { media: rows },
    rpc,
  });
}

/** Every request stayed inside the URL limit and none failed. */
function expectChunked(count: number) {
  expect(fake.requests).toHaveLength(count);
  expect(fake.requests.every((r) => !r.failed)).toBe(true);
  expect(Math.max(...fake.requests.map((r) => r.urlLength))).toBeLessThan(
    URL_LIMIT,
  );
}

const ids = (n: number, from = 0) =>
  Array.from({ length: n }, (_, i) => uuid(from + i));
const chunksOf = (n: number) => Math.ceil(n / IN_CHUNK);

beforeEach(() => {
  deleted.length = 0;
});

describe("the review queue's bulk approve and hide", () => {
  it("approves a 2,500-item selection whole, in chunks under the URL limit", async () => {
    useAlbum(ids(2500).map((_, i) => row(i, { status: "pending" })));
    const result = await approveBulk("ev-1", ids(2500));
    expect(result).toEqual({ ok: true, data: { count: 2500 } });
    expectChunked(chunksOf(2500));
    expect(fake.tables.media.every((m) => m.status === "approved")).toBe(true);
  });

  it("acts on pending items alone, and a foreign id matches nothing", async () => {
    useAlbum([
      row(0, { status: "pending" }),
      row(1, { status: "approved" }),
      row(2, { status: "removed" }),
      row(3, { status: "pending", event_id: "ev-2" }),
    ]);
    const result = await hideBulk("ev-1", ids(4));
    expect(result).toEqual({ ok: true, data: { count: 1 } });
    expect(fake.tables.media.map((m) => m.status)).toEqual([
      "hidden",
      "approved",
      "removed",
      "pending",
    ]);
  });

  it("reports a failed chunk as a failure, never as success", async () => {
    useAlbum(ids(300).map((_, i) => row(i, { status: "pending" })));
    delete fake.tables.media;
    const result = await approveBulk("ev-1", ids(300));
    expect(result).toMatchObject({ ok: false, code: "unknown" });
  });
});

describe("the album's bulk Hide, Show and Delete", () => {
  it("hides a 2,500-item selection whole and leaves the bin alone", async () => {
    useAlbum([
      ...ids(2500).map((_, i) => row(i)),
      row(2500, { status: "removed" }),
    ]);
    const result = await setMediaStatusBulk("ev-1", ids(2501), "hidden");
    expect(result).toEqual({ ok: true, data: { count: 2500 } });
    expectChunked(chunksOf(2501));
    expect(fake.tables.media.at(-1)?.status).toBe("removed");
  });

  it("deletes a 2,500-item selection whole, every chunk under ONE removal stamp", async () => {
    useAlbum(ids(2500).map((_, i) => row(i)));
    const result = await removeMediaBulk("ev-1", ids(2500));
    expect(result).toEqual({ ok: true, data: { count: 2500 } });
    expectChunked(chunksOf(2500));
    const stamps = new Set(fake.tables.media.map((m) => m.removed_at));
    expect(stamps.size).toBe(1);
    expect(fake.tables.media.every((m) => m.status === "removed")).toBe(true);
  });

  it("an empty selection writes nothing", async () => {
    useAlbum([row(0)]);
    expect(await removeMediaBulk("ev-1", [])).toEqual({
      ok: true,
      data: { count: 0 },
    });
    expect(fake.requests).toHaveLength(0);
  });
});

describe("the bin's Delete forever", () => {
  it("frees every object of a 2,500-item selection, held ones kept, before the rows go", async () => {
    const purgeCalls: unknown[] = [];
    useAlbum(
      [
        ...ids(2500).map((_, i) =>
          row(i, {
            status: "removed",
            removed_at: "2026-09-20T12:00:00.000000+00:00",
            // Three items are under legal hold: their objects must survive this delete.
            legal_hold_at:
              i === 7 || i === 1200 || i === 2499
                ? "2026-09-21T12:00:00.000000+00:00"
                : null,
          }),
        ),
        // A live item among the selection is not the bin's to delete.
        row(2500, { status: "approved" }),
      ],
      {
        purge_media_now: (args) => {
          purgeCalls.push(args);
          return { ok: true };
        },
      },
    );

    const result = await purgeMediaNow("ev-1", ids(2501));

    expect(result).toEqual({ ok: true, data: { purged: 2497 } });
    // The selection read and the hold check both chunked, and none failed.
    expect(
      fake.requests.filter((r) => r.target === "table").every((r) => !r.failed),
    ).toBe(true);
    expect(Math.max(...fake.requests.map((r) => r.urlLength))).toBeLessThan(
      URL_LIMIT,
    );
    const keys = deleted.flat();
    const held = new Set([uuid(7), uuid(1200), uuid(2499)]);
    const expected = fake.tables.media
      .filter((m) => m.status === "removed" && !held.has(String(m.id)))
      .flatMap((m) => [m.original_key, m.preview_key].filter(Boolean));
    expect(keys.sort()).toEqual((expected as string[]).sort());
    // The RPC re-validates every id itself, in the POST body, where length is no problem.
    expect(purgeCalls).toEqual([{ p_media_ids: ids(2501) }]);
  });

  it("fails before any object is deleted when the hold check cannot be read", async () => {
    useAlbum(ids(10).map((_, i) => row(i, { status: "removed" })));
    // The selection read succeeds; the hold check (the second table read) is refused.
    const original = fake.from.bind(fake);
    let reads = 0;
    fake.from = (table: string) => {
      reads += 1;
      return reads > 1 ? original("missing_table") : original(table);
    };
    const result = await purgeMediaNow("ev-1", ids(10));
    expect(result).toMatchObject({ ok: false, code: "unknown" });
    expect(deleted).toHaveLength(0);
  });
});
