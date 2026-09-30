import { describe, expect, it } from "vitest";

import { isUuidShape } from "@/lib/validation/uuid-shape";

/**
 * The shape a path's id must have before a read takes it (build 33's red-team): exactly what Postgres will cast to a
 * uuid in the canonical form, whatever its version, and nothing that would make the cast throw.
 */
describe("isUuidShape", () => {
  it("takes every canonical uuid, whatever its version or case", () => {
    for (const id of [
      "00000000-0000-4000-8000-000000000000",
      "886460a3-5a2b-4c8e-9f1d-2b7c0e3d4f5a",
      "12345678-1234-1234-1234-123456789abc",
      "ABCDEF01-2345-6789-ABCD-EF0123456789",
    ]) {
      expect(isUuidShape(id), id).toBe(true);
    }
  });

  it("refuses what the red-team typed, and a link cut short or run on", () => {
    for (const id of [
      "not-a-uuid",
      "12345",
      "g0000000-0000-4000-8000-000000000000",
      "'",
      "",
      "00000000-0000-4000-8000-00000000000",
      "00000000-0000-4000-8000-0000000000000",
      " 00000000-0000-4000-8000-000000000000",
      "00000000000040008000000000000000",
    ]) {
      expect(isUuidShape(id), JSON.stringify(id)).toBe(false);
    }
  });
});
