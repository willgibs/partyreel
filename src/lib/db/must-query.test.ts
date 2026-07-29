import type { PostgrestError } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { mustCount, mustQuery, QueryFailedError } from "@/lib/db/must-query";

// A stand-in for a PostgREST builder: a thenable that resolves the
// `{ data, error }` / `{ count, error }` shape WITHOUT ever rejecting — the
// exact property that makes the swallowed-error class possible.
function resolves<T>(value: T): PromiseLike<T> {
  return { then: (onFulfilled) => Promise.resolve(value).then(onFulfilled) };
}

// The real shape supabase-js hands back on a denied read. `toJSON` is part of the
// PostgrestError class contract, so the fixture carries it or it isn't the type.
const pgError: PostgrestError = {
  message: "permission denied for table media",
  details: "",
  hint: "",
  code: "42501",
  name: "PostgrestError",
  toJSON() {
    const { name, message, details, hint, code } = this;
    return { name, message, details, hint, code };
  },
};

describe("mustQuery", () => {
  it("returns rows on success", async () => {
    const rows = await mustQuery(
      resolves({ data: [{ id: "a" }], error: null }),
      "test",
    );
    expect(rows).toEqual([{ id: "a" }]);
  });

  it("passes a genuinely empty result through (empty is a real answer)", async () => {
    expect(await mustQuery(resolves({ data: [], error: null }), "test")).toEqual(
      [],
    );
  });

  it("passes maybeSingle's null through (no row is a real answer)", async () => {
    expect(await mustQuery(resolves({ data: null, error: null }), "test")).toBe(
      null,
    );
  });

  it("THROWS on error instead of reading the failure as empty", async () => {
    await expect(
      mustQuery(resolves({ data: null, error: pgError }), "export/guest: sizes"),
    ).rejects.toThrow(QueryFailedError);
  });

  it("keeps the call-site context, the PostgREST message and the code", async () => {
    const err = await mustQuery(
      resolves({ data: null, error: pgError }),
      "export/guest: sizes",
    ).then(
      () => null,
      (e: unknown) => e as QueryFailedError,
    );
    expect(err).toBeInstanceOf(QueryFailedError);
    if (!err) throw new Error("unreachable: mustQuery resolved on an error");
    expect(err.message).toContain("export/guest: sizes");
    expect(err.message).toContain("permission denied for table media");
    expect(err.code).toBe("42501");
    expect(err.cause).toBe(pgError);
  });

  it("throws even when the failed query ALSO carried rows", async () => {
    // Belt-and-braces: `error` is authoritative, never the truthiness of data.
    await expect(
      mustQuery(resolves({ data: [{ id: "a" }], error: pgError }), "test"),
    ).rejects.toThrow(QueryFailedError);
  });
});

describe("mustCount", () => {
  it("returns the count on success", async () => {
    expect(await mustCount(resolves({ count: 7, error: null }), "test")).toBe(7);
  });

  it("returns 0 only for a real zero count", async () => {
    expect(await mustCount(resolves({ count: 0, error: null }), "test")).toBe(0);
    expect(await mustCount(resolves({ count: null, error: null }), "test")).toBe(
      0,
    );
  });

  it("THROWS rather than reporting a failed count as a confident zero", async () => {
    await expect(
      mustCount(resolves({ count: null, error: pgError }), "exports: 24h"),
    ).rejects.toThrow(QueryFailedError);
  });
});
