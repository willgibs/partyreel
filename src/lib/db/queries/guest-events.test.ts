/**
 * THE OPEN ALBUM, WHOLE (the whole-album read). `getEventMediaByQrToken` is the one read behind
 * the guest album, the gallery poll and the guest export. A single call of the set-returning RPC
 * is cut at 1,000 rows with no error, so a 1,145-photo album (the scale probe's) would show its
 * newest 1,000 and never its oldest. These pin the paging on the fake PostgREST, which clamps where
 * PostgREST does: every approved item comes back past 2,000, in the album's display order
 * (`created_at desc, id desc`, the order the grid, the reconcile and the ETag keep), paged on the
 * last row's RAW `(created_at, id)` with `p_limit` on every page.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_ROWS } from "@/lib/db/read-all";
import {
  asSupabase,
  createFakePostgrest,
  FakeRpcError,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/events/unlock-cookie", () => ({ isUnlocked: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

/** The fake the server client answers from; each test builds its own. */
let fake: FakePostgrest;
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => asSupabase(fake),
}));

const { getEventMediaByQrToken, olderThan } =
  await import("@/lib/db/queries/guest-events");

const OPEN_QR = "d02631f1bfb3455188d224e41bf9510f";

function uid(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

/** Postgres's own timestamp text, microseconds and all. */
function stamp(second: number, micro: number): string {
  const at = new Date(Date.UTC(2026, 8, 23, 23, 0, 0) + second * 1000);
  return `${at.toISOString().slice(0, 19)}.${String(micro).padStart(6, "0")}+00:00`;
}

/**
 * The probe's shape, larger: `n` photos, the oldest first in the array, the oldest `pending`
 * pending and the next `removed` removed (the probe's own states), and pairs sharing one
 * timestamp down to the microsecond wherever `tieAt` says, so only the id orders them.
 */
function album(
  n: number,
  opts: { pending?: number; removed?: number; tieAt?: number[] } = {},
): FakeRow[] {
  const ties = new Set(opts.tieAt ?? []);
  const pending = opts.pending ?? 0;
  const removed = opts.removed ?? 0;
  return Array.from({ length: n }, (_, i) => ({
    id: uid(i + 1),
    type: i % 9 === 0 ? "video" : "photo",
    original_key: `events/probe/photo/${i}/original.jpg`,
    preview_key: i % 4 === 0 ? null : `events/probe/photo/${i}/preview.webp`,
    width: 320,
    height: 240,
    duration_seconds: i % 9 === 0 ? 4.5 : null,
    // A clip saved to the album now and then (the live reel's `reel_eligible`).
    reel_eligible: i % 7 !== 3,
    created_at: ties.has(i - 1) ? stamp(i - 1, 644108) : stamp(i, 644108),
    status:
      i < pending ? "pending" : i < pending + removed ? "removed" : "approved",
  }));
}

function newestFirst(rows: FakeRow[]): FakeRow[] {
  return [...rows].sort((a, b) => {
    const at = String(b.created_at).localeCompare(String(a.created_at));
    return at !== 0 ? at : String(b.id).localeCompare(String(a.id));
  });
}

/**
 * The RPC as the SQL writes it (20260924010000_row_cap_album.sql): approved rows of the open event
 * only, strictly after the cursor, newest first, `least(p_limit, 1000)` when a limit is given and
 * every row when it is not (the fake's clamp then cuts that at 1,000, as PostgREST does live).
 */
function albumRpc(media: FakeRow[]) {
  const calls: Record<string, unknown>[] = [];
  const handler = (args: Record<string, unknown>) => {
    calls.push({ ...args });
    if (args.p_qr_token !== OPEN_QR) return [];
    const at = (args.p_before_created_at as string | undefined) ?? null;
    const before = (args.p_before_id as string | undefined) ?? null;
    let rows = newestFirst(media.filter((r) => r.status === "approved"));
    if (at !== null) {
      rows = rows.filter(
        (r) =>
          String(r.created_at) < at ||
          (r.created_at === at && before !== null && String(r.id) < before),
      );
    }
    const limit =
      typeof args.p_limit === "number"
        ? Math.min(args.p_limit, MAX_ROWS)
        : rows.length;
    return rows.slice(0, limit).map((r) => {
      const { status: _status, ...shown } = r;
      return shown;
    });
  };
  return { handler, calls };
}

beforeEach(() => {
  fake = createFakePostgrest();
});

describe("getEventMediaByQrToken: the open album, read whole", () => {
  it("the platform's own behaviour: one unpaged call is cut at 1,000 (why the read pages)", async () => {
    const { handler } = albumRpc(album(2345));
    fake = createFakePostgrest({
      rpc: { get_event_media_by_qr_token: handler },
    });
    const { data, error } = await fake.rpc("get_event_media_by_qr_token", {
      p_qr_token: OPEN_QR,
    });
    // No error and no flag: a clipped read looks exactly like a complete one.
    expect(error).toBeNull();
    expect(data).toHaveLength(MAX_ROWS);
  });

  it("returns every approved item past 2,000, newest first, the oldest approved last", async () => {
    // 2,400 photos: the oldest 20 pending and the next 30 removed, as on the scale probe.
    const media = album(2400, { pending: 20, removed: 30, tieAt: [700, 1500] });
    const { handler, calls } = albumRpc(media);
    fake = createFakePostgrest({
      rpc: { get_event_media_by_qr_token: handler },
    });
    const expected = newestFirst(media.filter((r) => r.status === "approved"));
    expect(expected).toHaveLength(2350);

    const rows = await getEventMediaByQrToken(OPEN_QR);

    expect(rows.map((r) => r.id)).toEqual(expected.map((r) => r.id));
    // The oldest approved item (the 51st, past the 20 pending and the 30 removed) is reached, and
    // no pending or removed one is.
    expect(rows.at(-1)?.id).toBe(uid(51));
    expect(rows.some((r) => r.id === uid(1) || r.id === uid(50))).toBe(false);
    // Three pages, each asking for MAX_ROWS in the POST body; none failed.
    expect(calls.map((c) => c.p_limit)).toEqual([MAX_ROWS, MAX_ROWS, MAX_ROWS]);
    expect(fake.requests.every((r) => r.method === "POST" && !r.failed)).toBe(
      true,
    );
  });

  it("pages on the last row's RAW (created_at, id), never a Date", async () => {
    const media = album(2100);
    const { handler, calls } = albumRpc(media);
    fake = createFakePostgrest({
      rpc: { get_event_media_by_qr_token: handler },
    });
    const expected = newestFirst(media);

    await getEventMediaByQrToken(OPEN_QR);

    // The first page reads from the newest item: no cursor at all.
    expect(calls[0].p_before_created_at).toBeUndefined();
    expect(calls[0].p_before_id).toBeUndefined();
    // Each later page resumes strictly after the row the page before ended on, microseconds
    // intact (a Date would have kept `.644` and re-read or skipped rows).
    expect(calls[1]).toMatchObject({
      p_before_created_at: expected[999].created_at,
      p_before_id: expected[999].id,
    });
    expect(calls[1].p_before_created_at).toMatch(/\.644108\+00:00$/);
    expect(calls[2]).toMatchObject({
      p_before_created_at: expected[1999].created_at,
      p_before_id: expected[1999].id,
    });
  });

  it("hands the next page the rest of a timestamp tie the first page ended inside", async () => {
    const n = 2050;
    // Display positions 999 and 1,000 share one timestamp: only the id carries the tie across.
    const media = album(n, { tieAt: [n - 1 - 1000] });
    const { handler } = albumRpc(media);
    fake = createFakePostgrest({
      rpc: { get_event_media_by_qr_token: handler },
    });
    const expected = newestFirst(media);
    expect(expected[999].created_at).toBe(expected[1000].created_at);

    const rows = await getEventMediaByQrToken(OPEN_QR);

    expect(rows.map((r) => r.id)).toEqual(expected.map((r) => r.id));
    expect(new Set(rows.map((r) => r.id)).size).toBe(n);
  });

  it("carries created_at and honest nulls on every row", async () => {
    const media = album(5);
    const { handler } = albumRpc(media);
    fake = createFakePostgrest({
      rpc: { get_event_media_by_qr_token: handler },
    });

    const rows = await getEventMediaByQrToken(OPEN_QR);

    expect(rows[0]).toEqual({
      id: uid(5),
      type: "photo",
      original_key: "events/probe/photo/4/original.jpg",
      preview_key: null,
      width: 320,
      height: 240,
      duration_seconds: null,
      reel_eligible: true,
      created_at: stamp(4, 644108),
    });
  });

  it("carries reel_eligible through, and reads it as eligible when an older RPC omits it", async () => {
    const media = album(5);
    const { handler } = albumRpc(media);
    fake = createFakePostgrest({
      rpc: { get_event_media_by_qr_token: handler },
    });
    const rows = await getEventMediaByQrToken(OPEN_QR);
    // uid(4) is index 3: the fixture's clip.
    expect(rows.find((r) => r.id === uid(4))?.reel_eligible).toBe(false);

    const bare = album(3).map((row) => {
      const { reel_eligible: _dropped, ...rest } = row;
      void _dropped;
      return rest;
    });
    const older = albumRpc(bare);
    fake = createFakePostgrest({
      rpc: { get_event_media_by_qr_token: older.handler },
    });
    const legacy = await getEventMediaByQrToken(OPEN_QR);
    expect(legacy.every((r) => r.reel_eligible === true)).toBe(true);
  });

  it("an album the RPC will not show (not open, deleted, a wrong token) is empty, in one request", async () => {
    const { handler } = albumRpc(album(30));
    fake = createFakePostgrest({
      rpc: { get_event_media_by_qr_token: handler },
    });
    expect(await getEventMediaByQrToken("not-an-open-album")).toEqual([]);
    expect(fake.requests).toHaveLength(1);
  });

  it("throws a labelled error on a failed page, never a shorter album", async () => {
    let call = 0;
    const { handler } = albumRpc(album(1500));
    fake = createFakePostgrest({
      rpc: {
        get_event_media_by_qr_token: (args) => {
          call += 1;
          if (call === 2)
            throw new FakeRpcError(
              "57014",
              "canceling statement due to statement timeout",
            );
          return handler(args);
        },
      },
    });
    await expect(getEventMediaByQrToken(OPEN_QR)).rejects.toThrow(
      "guest album: get_event_media_by_qr_token",
    );
  });
});

describe("olderThan: the table-read twin of the RPC's cursor", () => {
  it("is the composite PostgREST logic tree, the raw timestamp unquoted", () => {
    expect(
      olderThan({ at: "2026-09-23T23:13:38.122749+00:00", id: uid(7) }),
    ).toBe(
      `created_at.lt.2026-09-23T23:13:38.122749+00:00,and(created_at.eq.2026-09-23T23:13:38.122749+00:00,id.lt.${uid(7)})`,
    );
  });
});
