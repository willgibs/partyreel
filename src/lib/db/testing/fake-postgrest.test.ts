/**
 * THE FAKE CLAMPS WHERE POSTGREST CLAMPS, AND FAILS WHERE A LONG URL FAILS. Stage 2's tests lean on
 * both, so both are pinned here, and so is every word of PostgREST the fake claims to speak. The
 * last block runs `readAllPages` and `inChunks` against it: a 2,500-row fixture reads back 2,500,
 * and a 1,000-id list fails whole and passes chunked.
 */
import { describe, expect, it } from "vitest";

import { IN_CHUNK, inChunks, MAX_ROWS, readAllPages } from "@/lib/db/read-all";
import {
  asSupabase,
  createFakePostgrest,
  FakeRpcError,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

/** `n` media rows of one event, ids sorting as strings, alternately approved and pending. */
function album(n: number, eventId = "e1"): FakeRow[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `m${String(i).padStart(6, "0")}`,
    event_id: eventId,
    status: i % 2 === 0 ? "approved" : "pending",
    created_at: `2026-09-23T12:${String(Math.floor(i / 60) % 60).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}.000000+00:00`,
  }));
}

/** 36-character ids, the length of a uuid, so a URL measures as it would live. */
function uuids(n: number): string[] {
  return Array.from(
    { length: n },
    (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
  );
}

describe("the clamp", () => {
  it("answers an unbounded read of 2,500 rows with 1,000, and no error", async () => {
    const fake = createFakePostgrest({ tables: { media: album(2500) } });
    const { data, error } = await fake.from("media").select("id");
    expect(error).toBeNull();
    expect(data).toHaveLength(MAX_ROWS);
    expect(fake.requests[0]).toMatchObject({
      target: "table",
      name: "media",
      method: "GET",
      returned: 1000,
    });
  });

  it("clamps a limit above MAX_ROWS too, silently, as PostgREST does", async () => {
    const fake = createFakePostgrest({ tables: { media: album(2500) } });
    const { data, error } = await fake.from("media").select("id").limit(5000);
    expect(error).toBeNull();
    expect(data).toHaveLength(MAX_ROWS);
  });

  it("counts every matching row, and a head count returns no rows at all", async () => {
    const fake = createFakePostgrest({ tables: { media: album(2500) } });
    const listed = await fake.from("media").select("id", { count: "exact" });
    expect(listed.count).toBe(2500);
    expect(listed.data).toHaveLength(MAX_ROWS);
    const head = await fake
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved");
    expect(head).toMatchObject({ data: null, count: 1250, error: null });
    expect(fake.requests[1].method).toBe("HEAD");
  });

  it("clamps a set-returning function the same way, and leaves a scalar alone", async () => {
    const fake = createFakePostgrest({
      rpc: {
        get_event_media_by_qr_token: () => album(2500),
        event_card_stats: () => ({ e1: { approved: 1250, pending: 1250 } }),
      },
    });
    const set = await fake.rpc("get_event_media_by_qr_token", {
      p_qr_token: "t",
    });
    expect(set.data).toHaveLength(MAX_ROWS);
    const scalar = await fake.rpc("event_card_stats", { p_event_ids: ["e1"] });
    expect(scalar.data).toEqual({ e1: { approved: 1250, pending: 1250 } });
    // The arguments ride the POST body, so the URL stays short however long the list.
    expect(fake.requests[1]).toMatchObject({
      method: "POST",
      url: expect.stringMatching(/\/rest\/v1\/rpc\/event_card_stats$/),
    });
  });

  it("does NOT clamp a write: every row an update touched comes back, as the live probe showed", async () => {
    const rows = album(1040);
    const fake = createFakePostgrest({ tables: { media: rows } });
    const { data, error } = await fake
      .from("media")
      .update({ status: "hidden" })
      .eq("event_id", "e1")
      .select("id");
    expect(error).toBeNull();
    expect(data).toHaveLength(1040);
    expect(rows.every((r) => r.status === "hidden")).toBe(true);
  });
});

describe("the URL budget", () => {
  it("fails an unchunked 1,000-id list the way a failed fetch resolves, and records why", async () => {
    const fake = createFakePostgrest({ tables: { media: album(10) } });
    const response = await fake
      .from("media")
      .select("id")
      .in("id", uuids(1000));
    expect(response).toEqual({
      data: null,
      error: expect.objectContaining({
        message: "TypeError: fetch failed",
        code: "",
      }),
      count: null,
      status: 0,
      statusText: "",
    });
    const [request] = fake.requests;
    expect(request.failed).toBe(true);
    expect(request.urlLength).toBeGreaterThan(8000);
    expect(request.filters).toEqual([
      { column: "id", op: "in", value: expect.any(Array) },
    ]);
  });

  it("passes a chunk of IN_CHUNK uuids, under the limit with room to spare", async () => {
    const fake = createFakePostgrest({ tables: { media: album(10) } });
    const { error } = await fake
      .from("media")
      .select("id, file_size_bytes")
      .in("id", uuids(IN_CHUNK));
    expect(error).toBeNull();
    expect(fake.requests[0].urlLength).toBeLessThan(7000);
  });

  it("measures the URL as postgrest-js writes it: deduped, quoted where a value holds a comma", async () => {
    const fake = createFakePostgrest({ tables: { media: album(1) } });
    await fake.from("media").select("id").in("id", ["a", "a", "b,c"]);
    expect(decodeURIComponent(fake.requests[0].url)).toContain(
      'id=in.(a,"b,c")',
    );
  });

  it("takes its own limit", async () => {
    const fake = createFakePostgrest({
      tables: { media: album(1) },
      urlLengthLimit: 200,
    });
    const { error } = await fake.from("media").select("id").in("id", uuids(10));
    expect(error?.message).toBe("TypeError: fetch failed");
  });
});

describe("the words it speaks", () => {
  const people: FakeRow[] = [
    {
      id: "p1",
      name: "Ana",
      status: "open",
      score: 3,
      joined: "2026-01-01",
      host_id: "h1",
    },
    {
      id: "p2",
      name: "ben",
      status: null,
      score: 7,
      joined: "2026-02-01",
      host_id: "h1",
    },
    {
      id: "p3",
      name: "Cal",
      status: "removed",
      score: 5,
      joined: null,
      host_id: "h2",
    },
  ];
  const names = (data: unknown) => (data as FakeRow[]).map((r) => r.id);
  const fresh = () =>
    createFakePostgrest({ tables: { people: people.map((p) => ({ ...p })) } });

  it("filters with SQL's NULL: neq and not.eq both drop a NULL", async () => {
    const fake = fresh();
    expect(
      names(
        (await fake.from("people").select("id").neq("status", "removed")).data,
      ),
    ).toEqual(["p1"]);
    expect(
      names(
        (await fake.from("people").select("id").not("status", "eq", "removed"))
          .data,
      ),
    ).toEqual(["p1"]);
  });

  it("reads is null, not is null and filter('not.is', null)", async () => {
    const fake = fresh();
    expect(
      names((await fake.from("people").select("id").is("status", null)).data),
    ).toEqual(["p2"]);
    expect(
      names(
        (await fake.from("people").select("id").not("joined", "is", null)).data,
      ),
    ).toEqual(["p1", "p2"]);
    expect(
      names(
        (
          await fake
            .from("people")
            .select("id")
            .filter("joined", "not.is", null)
        ).data,
      ),
    ).toEqual(["p1", "p2"]);
  });

  it("compares numbers as numbers and strings by code unit", async () => {
    const fake = fresh();
    expect(
      names((await fake.from("people").select("id").gt("score", 4)).data),
    ).toEqual(["p2", "p3"]);
    expect(
      names(
        (
          await fake
            .from("people")
            .select("id")
            .gte("score", "5")
            .lte("score", 7)
        ).data,
      ),
    ).toEqual(["p2", "p3"]);
    expect(
      names(
        (await fake.from("people").select("id").lt("joined", "2026-02-01"))
          .data,
      ),
    ).toEqual(["p1"]);
  });

  it("reads in, like, ilike and match", async () => {
    const fake = fresh();
    expect(
      names(
        (await fake.from("people").select("id").in("id", ["p1", "p3"])).data,
      ),
    ).toEqual(["p1", "p3"]);
    expect(
      names((await fake.from("people").select("id").like("name", "%a%")).data),
    ).toEqual(["p1", "p3"]);
    expect(
      names((await fake.from("people").select("id").like("name", "a%")).data),
    ).toEqual([]);
    expect(
      names((await fake.from("people").select("id").ilike("name", "a%")).data),
    ).toEqual(["p1"]);
    expect(
      names(
        (
          await fake
            .from("people")
            .select("id")
            .match({ host_id: "h1", score: 7 })
        ).data,
      ),
    ).toEqual(["p2"]);
  });

  it("orders on several columns, nulls last ascending and first descending unless told", async () => {
    const fake = fresh();
    expect(
      names((await fake.from("people").select("id").order("joined")).data),
    ).toEqual(["p1", "p2", "p3"]);
    expect(
      names(
        (
          await fake
            .from("people")
            .select("id")
            .order("joined", { ascending: false })
        ).data,
      ),
    ).toEqual(["p3", "p2", "p1"]);
    expect(
      names(
        (
          await fake
            .from("people")
            .select("id")
            .order("joined", { nullsFirst: true })
        ).data,
      ),
    ).toEqual(["p3", "p1", "p2"]);
    expect(
      names(
        (
          await fake
            .from("people")
            .select("id")
            .order("host_id", { ascending: false })
            .order("score")
        ).data,
      ),
    ).toEqual(["p3", "p1", "p2"]);
  });

  it("pages with range, and range cannot reach past the clamp", async () => {
    const fake = createFakePostgrest({ tables: { media: album(2500) } });
    const second = await fake
      .from("media")
      .select("id")
      .order("id")
      .range(1000, 1999);
    expect((second.data as FakeRow[])[0].id).toBe("m001000");
    const wide = await fake
      .from("media")
      .select("id")
      .order("id")
      .range(0, 2499);
    expect(wide.data).toHaveLength(MAX_ROWS);
    expect(fake.requests[1]).toMatchObject({ offset: 0, limit: 2500 });
  });

  it("answers single and maybeSingle as PostgREST does for none, one and many", async () => {
    const fake = fresh();
    expect(
      (await fake.from("people").select("id").eq("id", "p1").single()).data,
    ).toEqual({ id: "p1" });
    expect(
      (await fake.from("people").select("id").eq("id", "zz").maybeSingle())
        .data,
    ).toBeNull();
    expect(
      (await fake.from("people").select("id").eq("id", "zz").single()).error
        ?.code,
    ).toBe("PGRST116");
    const many = await fake.from("people").select("id").maybeSingle();
    expect(many).toMatchObject({
      data: null,
      status: 406,
      error: { code: "PGRST116" },
    });
  });

  it("projects the select list, aliases included, and holds embeds whole", async () => {
    const fake = createFakePostgrest({
      tables: {
        media: [
          { id: "m1", event_id: "e1", events: { host_id: "h1" }, extra: 1 },
          { id: "m2", event_id: "e2", events: { host_id: "h2" }, extra: 2 },
          { id: "m3", event_id: "e3", events: null, extra: 3 },
        ],
      },
    });
    const { data, error } = await fake
      .from("media")
      .select("id, event:event_id, events!inner(host_id)")
      .eq("events.host_id", "h1");
    expect(error).toBeNull();
    expect(data).toEqual([
      { id: "m1", event: "e1", events: { host_id: "h1" } },
    ]);
    // !inner drops the row whose embed is null even with no filter on it.
    expect(
      (await fake.from("media").select("id, events!inner(host_id)")).data,
    ).toHaveLength(2);
  });

  it("walks the composite cursor or() with a nested and(), and refuses a malformed tree", async () => {
    const fake = createFakePostgrest({
      tables: {
        media: [
          { id: "a", created_at: "2026-09-23T12:00:00.000002+00:00" },
          { id: "c", created_at: "2026-09-23T12:00:00.000001+00:00" },
          { id: "b", created_at: "2026-09-23T12:00:00.000001+00:00" },
          { id: "d", created_at: "2026-09-23T11:59:59.999999+00:00" },
        ],
      },
    });
    const at = "2026-09-23T12:00:00.000001+00:00";
    const { data, error } = await fake
      .from("media")
      .select("id")
      .or(`created_at.lt.${at},and(created_at.eq.${at},id.lt.c)`)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
    expect(error).toBeNull();
    expect(names(data)).toEqual(["b", "d"]);
    const bad = await fake.from("media").select("id").or("created_at.lt");
    expect(bad.error?.code).toBe("PGRST100");
  });

  it("writes: insert, upsert on a conflict column, delete with a count", async () => {
    const fake = fresh();
    await fake.from("people").insert({
      id: "p4",
      name: "Dee",
      status: "open",
      score: 1,
      joined: null,
      host_id: "h2",
    });
    await fake.from("people").upsert(
      [
        { id: "p4", score: 9 },
        { id: "p5", score: 2 },
      ],
      { onConflict: "id" },
    );
    expect(fake.tables.people.find((p) => p.id === "p4")).toMatchObject({
      name: "Dee",
      score: 9,
    });
    const removed = await fake
      .from("people")
      .delete({ count: "exact" })
      .eq("host_id", "h2")
      .select("id");
    expect(removed.count).toBe(2);
    expect(names(removed.data)).toEqual(["p3", "p4"]);
    expect(fake.tables.people.map((p) => p.id)).toEqual(["p1", "p2", "p5"]);
  });

  it("answers an unknown table, an unknown function and a raising function with PostgREST's codes", async () => {
    const fake = createFakePostgrest({
      rpc: {
        claim: () => {
          throw new FakeRpcError("P0001", "not your row");
        },
      },
    });
    expect((await fake.from("nope").select("id")).error?.code).toBe("PGRST205");
    expect((await fake.rpc("missing")).error?.code).toBe("PGRST202");
    expect((await fake.rpc("claim")).error).toMatchObject({
      code: "P0001",
      message: "not your row",
    });
  });

  it("rejects with throwOnError, and answers auth.getUser with its user", async () => {
    const fake = createFakePostgrest({ user: { id: "u1" } });
    await expect(fake.from("nope").select("id").throwOnError()).rejects.toThrow(
      /Could not find the table/,
    );
    expect((await fake.auth.getUser()).data.user).toEqual({ id: "u1" });
  });

  it("mutates a builder in place, which is why a pager builds a fresh one for every page", async () => {
    const fake = createFakePostgrest({ tables: { media: album(5) } });
    const reused = fake.from("media").select("id").gt("id", "m000001");
    await reused;
    reused.gt("id", "m000003");
    await reused;
    // The second request carried BOTH cursors: the first page's was never taken back.
    expect(fake.requests[1].filters).toEqual([
      { column: "id", op: "gt", value: "m000001" },
      { column: "id", op: "gt", value: "m000003" },
    ]);
  });
});

describe("the helpers, against the fake", () => {
  it("readAllPages reads a 2,500-row album back whole in three keyset pages", async () => {
    const fake = createFakePostgrest({ tables: { media: album(2500) } });
    const db = asSupabase(fake);
    const { rows, more } = await readAllPages(
      "test: album",
      (after: string | null, limit) => {
        let q = db
          .from("media")
          .select("id")
          .eq("event_id", "e1")
          .order("id")
          .limit(limit);
        if (after) q = q.gt("id", after);
        return q;
      },
      (row) => row.id,
    );
    expect(rows).toHaveLength(2500);
    expect(new Set(rows.map((r) => r.id)).size).toBe(2500);
    expect(more).toBe(false);
    expect(fake.requests.map((r) => r.returned)).toEqual([1000, 1000, 500]);
  });

  it("readAllPages walks the (created_at desc, id desc) cursor through a fixture full of ties", async () => {
    // 2,100 rows, every 30 of them sharing a created_at to the microsecond.
    const media = Array.from({ length: 2100 }, (_, i) => ({
      id: `m${String(i).padStart(6, "0")}`,
      event_id: "e1",
      created_at: `2026-09-23T12:00:00.${String(Math.floor(i / 30)).padStart(6, "0")}+00:00`,
    }));
    const fake = createFakePostgrest({ tables: { media } });
    const db = asSupabase(fake);
    const { rows } = await readAllPages(
      "test: display order",
      (after: { at: string; id: string } | null, limit) => {
        let q = db
          .from("media")
          .select("id, created_at")
          .eq("event_id", "e1")
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(limit);
        if (after)
          q = q.or(
            `created_at.lt.${after.at},and(created_at.eq.${after.at},id.lt.${after.id})`,
          );
        return q;
      },
      (row) => ({ at: row.created_at, id: row.id }),
    );
    expect(rows.map((r) => r.id)).toEqual(media.map((m) => m.id).reverse());
  });

  it("inChunks turns the 1,000-id list that fails whole into seven requests that pass", async () => {
    const ids = uuids(1000);
    const fake = createFakePostgrest({
      tables: { media: ids.map((id, i) => ({ id, file_size_bytes: i })) },
    });
    const db = asSupabase(fake);
    const whole = await db
      .from("media")
      .select("id, file_size_bytes")
      .in("id", ids);
    expect(whole.error?.message).toBe("TypeError: fetch failed");

    fake.requests.length = 0;
    const rows = await inChunks("test: sizes", ids, async (chunk) => {
      const { data, error } = await db
        .from("media")
        .select("id, file_size_bytes")
        .in("id", chunk);
      if (error) throw error;
      return data;
    });
    expect(rows).toHaveLength(1000);
    expect(fake.requests).toHaveLength(7);
    expect(fake.requests.every((r) => !r.failed && r.urlLength < 8000)).toBe(
      true,
    );
  });
});
