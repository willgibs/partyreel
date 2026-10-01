/**
 * THE ALBUM-LOG SWEEP ON THE CLAMPING FAKE (crumbs-37): `album_prune_tombstones` written over the fake's own
 * tables as 20261001150000 defines it (the albums the next window of the log touches, each whole; per album,
 * its tombstones deleted and its watermarks raised to their versions), and the sweep walking it: the whole log
 * in one run, a deadline that stops it on an album boundary with what it left counted, the next run carrying on
 * and wrapping round, and a failed or unknown answer failing the run rather than reading as a quiet night.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  FakeRpcError,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";
import type { Deadline } from "@/lib/lifecycle/sweep-budget";

vi.mock("server-only", () => ({}));

const { parsePruneAnswer, sweepAlbumLog } =
  await import("@/lib/lifecycle/sweeps/album-log");

const album = (n: number) =>
  `e0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const item = (a: number, i: number) =>
  `${String(a).padStart(8, "0")}-0000-4000-8000-${String(i).padStart(12, "0")}`;

type World = {
  fake: FakePostgrest;
  client: ReturnType<typeof asSupabase>;
  /** Each call's `p_after`, in order. */
  calls: (string | null)[];
  /** The tombstones the world began with, by album. */
  tombstones: Map<
    string,
    { media_id: string; host: number; album: number | null }[]
  >;
};

/**
 * `albums` albums; album n holds 3 + (n % 9) items, every fourth item purged (its change row a tombstone,
 * its versions its removal's: host 100 + i, album 50 + i on even items, never crossed approved on odd).
 */
function world(albums: number, opts: { fails?: boolean } = {}): World {
  const state: FakeRow[] = [];
  const changes: FakeRow[] = [];
  const media: FakeRow[] = [];
  const tombstones: World["tombstones"] = new Map();
  for (let a = 1; a <= albums; a++) {
    const id = album(a);
    state.push({
      event_id: id,
      version: 1_000,
      album_max: 1_000,
      host_watermark: 0,
      album_watermark: 0,
    });
    for (let i = 1; i <= 3 + (a % 9); i++) {
      const mediaId = item(a, i);
      const gone = i % 4 === 0;
      changes.push({
        event_id: id,
        media_id: mediaId,
        host_version: 100 + i,
        album_version: i % 2 === 0 ? 50 + i : null,
      });
      if (gone) {
        const list = tombstones.get(id) ?? [];
        list.push({
          media_id: mediaId,
          host: 100 + i,
          album: i % 2 === 0 ? 50 + i : null,
        });
        tombstones.set(id, list);
      } else {
        media.push({ id: mediaId, event_id: id });
      }
    }
  }
  const calls: (string | null)[] = [];
  const tables = { album_state: state, album_changes: changes, media };
  const fake = createFakePostgrest({
    tables,
    rpc: {
      album_prune_tombstones: (args) => {
        if (opts.fails)
          throw new FakeRpcError(
            "57014",
            "canceling statement due to statement timeout",
          );
        const after = (args.p_after as string | null) ?? null;
        const limit = Math.min(
          Math.max(Number(args.p_limit ?? 5000), 1),
          50_000,
        );
        calls.push(after);
        const ordered = [...tables.album_changes].sort((x, y) =>
          String(x.event_id) === String(y.event_id)
            ? String(x.media_id) < String(y.media_id)
              ? -1
              : 1
            : String(x.event_id) < String(y.event_id)
              ? -1
              : 1,
        );
        const window = ordered
          .filter((c) => after === null || String(c.event_id) > after)
          .slice(0, limit);
        const taken = [
          ...new Set(window.map((c) => String(c.event_id))),
        ].sort();
        const live = new Set(tables.media.map((m) => String(m.id)));
        let examined = 0;
        let pruned = 0;
        let prunedAlbums = 0;
        for (const id of taken) {
          const rows = tables.album_changes.filter((c) => c.event_id === id);
          examined += rows.length;
          const gone = rows.filter((c) => !live.has(String(c.media_id)));
          if (gone.length === 0) continue;
          const s = tables.album_state.find((r) => r.event_id === id)!;
          s.host_watermark = Math.max(
            Number(s.host_watermark),
            ...gone.map((c) => Number(c.host_version)),
          );
          s.album_watermark = Math.max(
            Number(s.album_watermark),
            ...gone.map((c) => Number(c.album_version ?? 0)),
          );
          const drop = new Set(gone);
          tables.album_changes.splice(
            0,
            tables.album_changes.length,
            ...tables.album_changes.filter((c) => !drop.has(c)),
          );
          pruned += gone.length;
          prunedAlbums += 1;
        }
        return {
          albums: taken.length,
          examined,
          pruned,
          pruned_albums: prunedAlbums,
          last: taken.length ? taken[taken.length - 1] : null,
        };
      },
    },
  });
  return { fake, client: asSupabase(fake), calls, tombstones };
}

function passesAfter(n: number): Deadline {
  let asked = 0;
  return { at: 0, passed: () => asked++ >= n };
}

function tombstonesLeft(w: World): number {
  const live = new Set(w.fake.tables.media.map((m) => String(m.id)));
  return w.fake.tables.album_changes.filter(
    (c) => !live.has(String(c.media_id)),
  ).length;
}

let w: World;
beforeEach(() => {
  w = world(300);
});

describe("sweepAlbumLog", () => {
  it("★ walks the whole log in one run: every tombstone pruned, each album's watermarks at what it lost, every live row kept", async () => {
    const before = w.fake.tables.album_changes.length;
    const totalTombs = [...w.tombstones.values()].reduce(
      (s, l) => s + l.length,
      0,
    );
    const tally = await sweepAlbumLog(w.client, { window: 40 });

    expect(tally).toMatchObject({
      albums: 300,
      examined: before,
      pruned: totalTombs,
      pruned_albums: w.tombstones.size,
    });
    expect(tally.stopped_early).toBeUndefined();
    expect(tally.resume_after).toBeUndefined();
    expect(tombstonesLeft(w)).toBe(0);
    expect(w.fake.tables.album_changes).toHaveLength(before - totalTombs);
    for (const s of w.fake.tables.album_state) {
      const lost = w.tombstones.get(String(s.event_id)) ?? [];
      expect(s.host_watermark).toBe(Math.max(0, ...lost.map((t) => t.host)));
      expect(s.album_watermark).toBe(
        Math.max(0, ...lost.map((t) => t.album ?? 0)),
      );
    }
    // One window after another, each from the album the last one ended on.
    expect(w.calls[0]).toBeNull();
    expect(new Set(w.calls).size).toBe(w.calls.length);
  });

  it("★ a deadline stops it on an album boundary, counts the albums left and keeps its cursor; the next run carries on and wraps round", async () => {
    const first = await sweepAlbumLog(w.client, {
      window: 40,
      deadline: passesAfter(3),
    });
    expect(first.stopped_early).toBe(true);
    const cursor = first.resume_after!;
    expect(cursor).toMatch(/^e0000000-/);
    // What it left: the albums after the album it stopped on.
    expect(first.remaining).toBe(
      w.fake.tables.album_state.filter((s) => String(s.event_id) > cursor)
        .length,
    );
    expect(tombstonesLeft(w)).toBeGreaterThan(0);

    // The next run starts after the cursor, reaches the end, then wraps to the albums before it.
    w.calls.length = 0;
    const second = await sweepAlbumLog(w.client, {
      window: 40,
      resumeAfter: cursor,
    });
    expect(w.calls[0]).toBe(cursor);
    expect(w.calls).toContain(null);
    expect(second.stopped_early).toBeUndefined();
    expect(second.resume_after).toBeUndefined();
    expect(tombstonesLeft(w)).toBe(0);
    expect(first.pruned + second.pruned).toBe(
      [...w.tombstones.values()].reduce((s, l) => s + l.length, 0),
    );
  });

  it("stopped in the wrapped half, it counts only the albums up to where the run began", async () => {
    const start = album(200);
    // Windows of 400 rows: two calls reach the log's end from the cursor, a third finds nothing after it
    // (the wrap), and a fourth starts again from the top; the deadline stops the fifth.
    const tally = await sweepAlbumLog(w.client, {
      window: 400,
      resumeAfter: start,
      deadline: passesAfter(4),
    });
    expect(w.calls.slice(0, 1)).toEqual([start]);
    expect(w.calls.at(-1)).toBeNull();
    expect(tally.stopped_early).toBe(true);
    const cursor = tally.resume_after!;
    expect(cursor < start).toBe(true);
    expect(tally.remaining).toBe(
      w.fake.tables.album_state.filter(
        (s) => String(s.event_id) > cursor && String(s.event_id) <= start,
      ).length,
    );
  });

  it("stopped before its first call, it keeps the cursor it was given", async () => {
    const tally = await sweepAlbumLog(w.client, {
      resumeAfter: album(7),
      deadline: passesAfter(0),
    });
    expect(tally).toMatchObject({
      albums: 0,
      pruned: 0,
      stopped_early: true,
      resume_after: album(7),
      remaining: 300,
    });
    expect(w.calls).toEqual([]);
  });

  it("★ a failed call fails the run (its card goes red), never a quiet night", async () => {
    w = world(5, { fails: true });
    await expect(sweepAlbumLog(w.client)).rejects.toThrow(
      /album_prune_tombstones: canceling statement/,
    );
  });

  it("before 20261001150000 stands, PostgREST's not-found fails the run too", async () => {
    const fake = createFakePostgrest({ tables: { album_state: [] } });
    await expect(sweepAlbumLog(asSupabase(fake))).rejects.toThrow(
      /Could not find the function public\.album_prune_tombstones/,
    );
  });
});

describe("parsePruneAnswer", () => {
  it("reads the five fields, the cursor lower-cased", () => {
    expect(
      parsePruneAnswer({
        albums: 2,
        examined: 9,
        pruned: 1,
        pruned_albums: 1,
        last: album(2).toUpperCase(),
      }),
    ).toEqual({
      albums: 2,
      examined: 9,
      pruned: 1,
      pruned_albums: 1,
      last: album(2),
    });
    expect(
      parsePruneAnswer({
        albums: 0,
        examined: 0,
        pruned: 0,
        pruned_albums: 0,
        last: null,
      }).last,
    ).toBeNull();
  });

  it("throws on an answer it does not know, rather than reading it as nothing to prune", () => {
    expect(() => parsePruneAnswer(null)).toThrow();
    expect(() => parsePruneAnswer([])).toThrow();
    expect(() =>
      parsePruneAnswer({
        albums: 1,
        examined: 1,
        pruned: "1",
        pruned_albums: 0,
        last: null,
      }),
    ).toThrow(/pruned/);
    expect(() =>
      parsePruneAnswer({
        albums: 1,
        examined: 1,
        pruned: 0,
        pruned_albums: 0,
        last: "x",
      }),
    ).toThrow(/last/);
    expect(() =>
      parsePruneAnswer({
        albums: -1,
        examined: 1,
        pruned: 0,
        pruned_albums: 0,
        last: null,
      }),
    ).toThrow(/albums/);
  });
});
