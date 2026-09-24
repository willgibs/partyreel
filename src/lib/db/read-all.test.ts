/**
 * THE READ REACHES ITS LAST ROW. `readAllPages` and `inChunks` are what every 1,000-row fix in the
 * round calls, so their edges are pinned here against a stand-in that clamps exactly as PostgREST
 * does: a page never returns more than `MAX_ROWS` rows, whatever it was asked for.
 */
import type { PostgrestError } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { QueryFailedError } from "@/lib/db/must-query";
import {
  IN_CHUNK,
  inChunks,
  MAX_ROWS,
  readAllPages,
  type PageResult,
} from "@/lib/db/read-all";

type Row = { id: string };

/** `n` rows whose ids sort as strings, the way Postgres orders a uuid's text. */
function table(n: number): Row[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `r${String(i).padStart(6, "0")}`,
  }));
}

/** A keyset page over `rows` by id, clamped at MAX_ROWS, recording every request it answers. */
function pager(
  rows: Row[],
  requests: { after: string | null; limit: number }[] = [],
) {
  return (
    after: string | null,
    limit: number,
  ): PromiseLike<PageResult<Row>> => {
    requests.push({ after, limit });
    const rest = rows.filter((r) => after === null || r.id > after);
    return Promise.resolve({
      data: rest.slice(0, Math.min(limit, MAX_ROWS)),
      error: null,
    });
  };
}

const pgError = {
  message: "canceling statement due to statement timeout",
  details: "",
  hint: "",
  code: "57014",
} as PostgrestError;

describe("readAllPages", () => {
  it("reads an exact multiple of MAX_ROWS whole, and the empty page after it ends the read", async () => {
    const rows = table(2 * MAX_ROWS);
    const requests: { after: string | null; limit: number }[] = [];
    const result = await readAllPages(
      "test: whole",
      pager(rows, requests),
      (r) => r.id,
    );
    expect(result.rows).toHaveLength(2000);
    expect(result).toMatchObject({ more: false, after: null });
    expect(requests).toEqual([
      { after: null, limit: MAX_ROWS },
      { after: rows[999].id, limit: MAX_ROWS },
      { after: rows[1999].id, limit: MAX_ROWS },
    ]);
  });

  it("reads zero rows in one request", async () => {
    const requests: { after: string | null; limit: number }[] = [];
    const result = await readAllPages(
      "test: none",
      pager([], requests),
      (r) => r.id,
    );
    expect(result).toEqual({ rows: [], more: false, after: null });
    expect(requests).toHaveLength(1);
  });

  it("reads one short page in one request", async () => {
    const requests: { after: string | null; limit: number }[] = [];
    const result = await readAllPages(
      "test: short",
      pager(table(12), requests),
      (r) => r.id,
    );
    expect(result.rows.map((r) => r.id)).toEqual(table(12).map((r) => r.id));
    expect(requests).toHaveLength(1);
  });

  it("reads 2,500 rows in order, each once, past two full pages", async () => {
    const rows = table(2500);
    const result = await readAllPages("test: 2500", pager(rows), (r) => r.id);
    expect(result.rows).toEqual(rows);
  });

  it("turns an error mid-way into a QueryFailedError that carries the label and the code", async () => {
    let calls = 0;
    const failing = (
      after: string | null,
      limit: number,
    ): PromiseLike<PageResult<Row>> =>
      ++calls === 2
        ? Promise.resolve({ data: null, error: pgError })
        : pager(table(3000))(after, limit);
    const error = await readAllPages("album: media", failing, (r) => r.id).then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(QueryFailedError);
    expect(error).toBeInstanceOf(Error);
    expect((error as QueryFailedError).message).toBe(
      "album: media: canceling statement due to statement timeout",
    );
    expect((error as QueryFailedError).code).toBe("57014");
  });

  it("stops at a budget with more and the cursor, and resumes from that cursor to the end", async () => {
    const rows = table(2500);
    const requests: { after: string | null; limit: number }[] = [];
    const first = await readAllPages(
      "sweep",
      pager(rows, requests),
      (r) => r.id,
      { budget: 1500 },
    );
    expect(first.rows).toHaveLength(1500);
    expect(first.more).toBe(true);
    expect(first.after).toBe(rows[1499].id);
    // The last page asks only for what the budget has left.
    expect(requests.map((r) => r.limit)).toEqual([MAX_ROWS, 500]);

    const second = await readAllPages("sweep", pager(rows), (r) => r.id, {
      budget: 1500,
      after: first.after,
    });
    expect(second).toMatchObject({ more: false, after: null });
    expect([...first.rows, ...second.rows]).toEqual(rows);
  });

  it("asks a small budget for exactly that many rows", async () => {
    const requests: { after: string | null; limit: number }[] = [];
    const result = await readAllPages(
      "sweep",
      pager(table(900), requests),
      (r) => r.id,
      { budget: 200 },
    );
    expect(requests).toEqual([{ after: null, limit: 200 }]);
    expect(result).toMatchObject({ more: true, after: "r000199" });
  });

  it("refuses a page longer than it asked for (the page forgot .limit(limit))", async () => {
    const unlimited = (): PromiseLike<PageResult<Row>> =>
      Promise.resolve({ data: table(MAX_ROWS), error: null });
    await expect(
      readAllPages("sweep", unlimited, (r) => r.id, { budget: 10 }),
    ).rejects.toThrow(/1000 rows for a limit of 10/);
  });

  it("refuses a cursor that did not advance (the page ignored after), instead of looping forever", async () => {
    const stuck = (): PromiseLike<PageResult<Row>> =>
      Promise.resolve({ data: table(MAX_ROWS), error: null });
    await expect(readAllPages("stuck", stuck, (r) => r.id)).rejects.toThrow(
      /cursor did not advance/,
    );
  });

  it("carries a composite cursor as the raw strings the rows hold", async () => {
    type Media = { id: string; created_at: string };
    // Two rows share a timestamp to the microsecond, which only the id tiebreaker orders.
    const media: Media[] = Array.from({ length: 1001 }, (_, i) => ({
      id: `m${String(1000 - i).padStart(4, "0")}`,
      created_at:
        i < 1000
          ? `2026-09-23T12:00:${String(59 - Math.floor(i / 20)).padStart(2, "0")}.123456+00:00`
          : "2026-09-23T11:00:00.000001+00:00",
    }));
    const cursors: ({ at: string; id: string } | null)[] = [];
    const page = (
      after: { at: string; id: string } | null,
      limit: number,
    ): PromiseLike<PageResult<Media>> => {
      cursors.push(after);
      const rest = media.filter(
        (m) =>
          after === null ||
          m.created_at < after.at ||
          (m.created_at === after.at && m.id < after.id),
      );
      return Promise.resolve({ data: rest.slice(0, limit), error: null });
    };
    const result = await readAllPages("album", page, (m) => ({
      at: m.created_at,
      id: m.id,
    }));
    expect(result.rows).toHaveLength(1001);
    expect(cursors[1]).toEqual({
      at: media[999].created_at,
      id: media[999].id,
    });
  });

  it("refuses a budget that is not a positive whole number", async () => {
    await expect(
      readAllPages("sweep", pager([]), (r) => r.id, { budget: 0 }),
    ).rejects.toThrow(RangeError);
  });
});

describe("inChunks", () => {
  /** 1,000 ids with every one of the first 50 repeated: 1,050 entries, 1,000 distinct. */
  const ids = [...table(1000).map((r) => r.id), ...table(50).map((r) => r.id)];

  it("dedupes, then chunks 1,000 ids into 7 requests of at most IN_CHUNK", async () => {
    const chunks: string[][] = [];
    const rows = await inChunks("test: chunked", ids, async (chunk) => {
      chunks.push(chunk);
      return chunk.map((id) => ({ id }));
    });
    expect(chunks).toHaveLength(7);
    expect(chunks.every((c) => c.length <= IN_CHUNK)).toBe(true);
    expect(chunks.map((c) => c.length)).toEqual([
      150, 150, 150, 150, 150, 150, 100,
    ]);
    expect(rows).toHaveLength(1000);
    // Flattened in chunk order, whatever order the chunks finished in.
    expect(rows.map((r) => r.id)).toEqual(table(1000).map((r) => r.id));
  });

  it("runs at most four chunks at a time", async () => {
    let inFlight = 0;
    let peak = 0;
    await inChunks("test: concurrency", ids, async (chunk) => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight--;
      return chunk;
    });
    expect(peak).toBe(4);
  });

  it("takes a size and a concurrency", async () => {
    let inFlight = 0;
    let peak = 0;
    const sizes: number[] = [];
    await inChunks(
      "test: options",
      table(10).map((r) => r.id),
      async (chunk) => {
        inFlight++;
        peak = Math.max(peak, inFlight);
        sizes.push(chunk.length);
        await new Promise((resolve) => setTimeout(resolve, 1));
        inFlight--;
        return chunk;
      },
      { size: 3, concurrency: 1 },
    );
    expect(sizes).toEqual([3, 3, 3, 1]);
    expect(peak).toBe(1);
  });

  it("makes no request for an empty list", async () => {
    let calls = 0;
    const rows = await inChunks("test: empty", [], async () => {
      calls++;
      return [];
    });
    expect(rows).toEqual([]);
    expect(calls).toBe(0);
  });

  it("turns a raw PostgREST error into a QueryFailedError with the label, and starts no chunk after it", async () => {
    const started: number[] = [];
    const error = await inChunks(
      "export/guest: sizes",
      table(1000).map((r) => r.id),
      async (chunk) => {
        started.push(chunk.length);
        if (started.length === 2) throw pgError;
        await new Promise((resolve) => setTimeout(resolve, 5));
        return chunk;
      },
      { concurrency: 2 },
    ).then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(QueryFailedError);
    expect((error as Error).message).toBe(
      "export/guest: sizes: canceling statement due to statement timeout",
    );
    // Two lanes took the first two chunks; the second failed, and the first lane, finishing after
    // the failure, started nothing more: two of the seven ran.
    expect(started).toEqual([150, 150]);
  });

  it("passes a real Error through untouched", async () => {
    const boom = new QueryFailedError("inner label", pgError);
    await expect(
      inChunks("outer label", ["a"], async () => {
        throw boom;
      }),
    ).rejects.toBe(boom);
  });
});
