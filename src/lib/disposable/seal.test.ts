/**
 * THE SEAL'S APP HALF (20261002200000): the column filter every guest-path PostgREST read carries, and the
 * predicate for a row already read. The filter's behaviour on each read is the leak matrix's (`leak-matrix.test.ts`).
 */
import { describe, expect, it } from "vitest";

import { isSealed, nowIso, unsealedFilter } from "@/lib/disposable/seal";

describe("unsealedFilter", () => {
  it("is PostgREST's logic tree for 'not sealed now', the time unquoted", () => {
    expect(unsealedFilter("2026-10-02T20:00:00.000Z")).toBe(
      "sealed_until.is.null,sealed_until.lte.2026-10-02T20:00:00.000Z",
    );
  });

  it("nowIso is an ISO instant the database parses as a timestamptz", () => {
    expect(nowIso(Date.parse("2026-10-02T20:00:00Z"))).toBe("2026-10-02T20:00:00.000Z");
  });
});

describe("isSealed", () => {
  const now = Date.parse("2026-10-02T20:00:00Z");

  it("holds while its time is ahead; NULL, a time reached or one it cannot read is open", () => {
    expect(isSealed("2026-10-03T09:00:00+00:00", now)).toBe(true);
    expect(isSealed("2026-10-02T20:00:00+00:00", now)).toBe(false);
    expect(isSealed("2026-10-01T09:00:00+00:00", now)).toBe(false);
    expect(isSealed(null, now)).toBe(false);
    expect(isSealed(undefined, now)).toBe(false);
    expect(isSealed("soon", now)).toBe(false);
  });
});
