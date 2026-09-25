/**
 * THE TRIPWIRE WARNS ON A CLIPPED READ, ONCE, AND OTHERWISE IS NOT THERE. Fake `Response`s stand in
 * for PostgREST: `Content-Range: 0-999/*` is what the live cap answered on the 1,200-photo probe.
 * Every test passes its own capture, so the once-per-path memory starts empty each time.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { captureWarning } = vi.hoisted(() => ({ captureWarning: vi.fn() }));
vi.mock("@/lib/observability/sentry", () => ({ captureWarning }));

import {
  withRowCapTripwire,
  type RowCapHit,
} from "@/lib/supabase/row-cap-tripwire";

const REST = "https://ddafaemglzmuekbtjwzn.supabase.co/rest/v1";

/** A response spanning `range` (`start-end/total`), or none. */
function answer(range: string | null, body = "[]"): Response {
  return new Response(body, {
    status: 200,
    headers: range ? { "Content-Range": range } : {},
  });
}

/** A tripwire over a fetch that always answers `response`, with a recording capture. */
function wired(response: () => Response) {
  const hits: RowCapHit[] = [];
  const inner = vi.fn(async () => response());
  const tripwire = withRowCapTripwire(inner as unknown as typeof fetch, (hit) =>
    hits.push(hit),
  );
  return { hits, inner, tripwire };
}

afterEach(() => {
  vi.unstubAllGlobals();
  captureWarning.mockReset();
});

describe("withRowCapTripwire", () => {
  it("warns on a clipped GET with no limit, naming the method and the path only", async () => {
    const { hits, tripwire } = wired(() => answer("0-999/*"));
    await tripwire(
      `${REST}/media?select=id&event_id=eq.14bb4318&email=eq.someone%40example.com`,
    );
    expect(hits).toEqual([{ method: "GET", path: "/rest/v1/media" }]);
  });

  it("passes the response through untouched, its body unread", async () => {
    const original = answer("0-999/*", '[{"id":"a"}]');
    const { tripwire } = wired(() => original);
    const response = await tripwire(`${REST}/media?select=id`);
    expect(response).toBe(original);
    expect(response.bodyUsed).toBe(false);
    expect(await response.json()).toEqual([{ id: "a" }]);
  });

  it("stays quiet on a GET with a limit at or under the cap, a paged read", async () => {
    const { hits, tripwire } = wired(() => answer("0-999/*"));
    await tripwire(`${REST}/media?select=id&order=id.asc&limit=1000`);
    await tripwire(`${REST}/events?select=id&offset=1000&limit=1000`);
    expect(hits).toEqual([]);
  });

  it("warns on a limit above the cap, which PostgREST clips all the same", async () => {
    const { hits, tripwire } = wired(() => answer("0-999/*"));
    await tripwire(`${REST}/media?select=id&limit=5000`);
    expect(hits).toEqual([{ method: "GET", path: "/rest/v1/media" }]);
  });

  it("warns on a function call with no p_limit, and stays quiet on one with p_limit", async () => {
    const { hits, tripwire } = wired(() => answer("0-999/*"));
    const url = `${REST}/rpc/get_event_media_by_qr_token`;
    await tripwire(url, {
      method: "POST",
      body: JSON.stringify({ p_qr_token: "t" }),
    });
    expect(hits).toEqual([
      { method: "POST", path: "/rest/v1/rpc/get_event_media_by_qr_token" },
    ]);

    const paged = wired(() => answer("0-999/*"));
    await paged.tripwire(url, {
      method: "POST",
      body: JSON.stringify({ p_qr_token: "t", p_limit: 1000 }),
    });
    expect(paged.hits).toEqual([]);
  });

  it("reads a null p_limit as no limit (today's unlimited read), and a GET function call's query p_limit as one", async () => {
    const { hits, tripwire } = wired(() => answer("0-999/*"));
    await tripwire(`${REST}/rpc/list_guest_rows_by_email`, {
      method: "POST",
      body: JSON.stringify({ p_limit: null }),
    });
    await tripwire(`${REST}/rpc/get_my_uploads?p_limit=60`);
    expect(hits).toEqual([
      { method: "POST", path: "/rest/v1/rpc/list_guest_rows_by_email" },
    ]);
  });

  it("passes a HEAD straight through, whatever its range says", async () => {
    const { hits, inner, tripwire } = wired(
      () => new Response(null, { headers: { "Content-Range": "0-999/1024" } }),
    );
    await tripwire(`${REST}/media?select=id`, { method: "HEAD" });
    expect(inner).toHaveBeenCalledTimes(1);
    expect(hits).toEqual([]);
  });

  it("ignores everything that is not REST: auth, storage, realtime", async () => {
    const { hits, inner, tripwire } = wired(() => answer("0-999/*"));
    await tripwire("https://ddafaemglzmuekbtjwzn.supabase.co/auth/v1/user");
    await tripwire(
      "https://ddafaemglzmuekbtjwzn.supabase.co/storage/v1/object/list/avatars",
      { method: "POST" },
    );
    expect(inner).toHaveBeenCalledTimes(2);
    expect(hits).toEqual([]);
  });

  it("ignores a write, which PostgREST never clips (a PATCH returned all 1,040 rows it touched)", async () => {
    const { hits, tripwire } = wired(() => answer("0-1039/*"));
    await tripwire(`${REST}/media?event_id=eq.e1&select=id`, {
      method: "PATCH",
      body: "{}",
    });
    await tripwire(`${REST}/media?select=id`, { method: "POST", body: "[]" });
    expect(hits).toEqual([]);
  });

  it("stays quiet on a short read and on a response with no range", async () => {
    const { hits, tripwire } = wired(() => answer("0-11/*"));
    await tripwire(`${REST}/media?select=id`);
    const bare = wired(() => answer(null));
    await bare.tripwire(`${REST}/media?select=id`);
    expect([...hits, ...bare.hits]).toEqual([]);
  });

  it("warns once per method and path, however often the read clips", async () => {
    const { hits, tripwire } = wired(() => answer("0-999/*"));
    await tripwire(`${REST}/media?select=id&event_id=eq.a`);
    await tripwire(`${REST}/media?select=id&event_id=eq.b`);
    await tripwire(`${REST}/events?select=id`);
    await tripwire(`${REST}/rpc/get_event_like_counts`, {
      method: "POST",
      body: "{}",
    });
    await tripwire(`${REST}/rpc/get_event_like_counts`, {
      method: "POST",
      body: "{}",
    });
    expect(hits).toEqual([
      { method: "GET", path: "/rest/v1/media" },
      { method: "GET", path: "/rest/v1/events" },
      { method: "POST", path: "/rest/v1/rpc/get_event_like_counts" },
    ]);
  });

  it("never throws: a failing capture leaves the response alone, and the fetch's own failure passes through", async () => {
    const original = answer("0-999/*");
    const tripwire = withRowCapTripwire(
      (async () => original) as unknown as typeof fetch,
      () => {
        throw new Error("sink down");
      },
    );
    await expect(tripwire(`${REST}/media?select=id`)).resolves.toBe(original);

    const offline = new TypeError("fetch failed");
    const failing = withRowCapTripwire((async () => {
      throw offline;
    }) as unknown as typeof fetch);
    await expect(failing(`${REST}/media?select=id`)).rejects.toBe(offline);
  });

  it("reads a URL object and a Request as well as a string", async () => {
    const { hits, tripwire } = wired(() => answer("0-999/*"));
    await tripwire(new URL(`${REST}/media?select=id`));
    await tripwire(new Request(`${REST}/events?select=id`));
    expect(hits.map((h) => h.path)).toEqual([
      "/rest/v1/media",
      "/rest/v1/events",
    ]);
  });

  it("sends the default warning to Sentry under the db area", async () => {
    const tripwire = withRowCapTripwire((async () =>
      answer("0-999/*")) as unknown as typeof fetch);
    await tripwire(`${REST}/guests?select=id`);
    await vi.waitFor(() =>
      expect(captureWarning).toHaveBeenCalledWith("db", "row_cap_hit", {
        method: "GET",
        path: "/rest/v1/guests",
      }),
    );
  });

  it("calls the global fetch at request time when given none", async () => {
    const tripwire = withRowCapTripwire(undefined, () => {});
    const late = vi.fn(async () => answer(null));
    vi.stubGlobal("fetch", late);
    await tripwire(`${REST}/media?select=id`);
    expect(late).toHaveBeenCalledWith(`${REST}/media?select=id`, undefined);
  });
});
