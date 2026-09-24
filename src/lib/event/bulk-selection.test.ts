/**
 * THE BULK CAP AND THE ONE CALLER THAT REACHES PAST IT (the 1,000-row round, 2026-09-23).
 *
 * Every bulk verb refuses a selection past MAX_BULK_ITEMS (the export's 2,000) in words. The Review
 * room's Approve all hands over the whole queue, which is whatever the guests sent, so it runs in
 * consecutive batches at the cap instead: its size can never be the reason it fails.
 */
import { describe, expect, it } from "vitest";

import {
  BULK_LIMIT_MESSAGE,
  inBulkBatches,
  MAX_BULK_ITEMS,
} from "@/lib/event/bulk-selection";
import { MAX_EXPORT_ITEMS } from "@/lib/export/build-manifest";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `m${i}`);

describe("the bulk cap", () => {
  it("is the export's cap, said in words with no em-dash", () => {
    expect(MAX_BULK_ITEMS).toBe(MAX_EXPORT_ITEMS);
    expect(BULK_LIMIT_MESSAGE).toBe("Select up to 2,000 items at a time.");
  });
});

describe("inBulkBatches", () => {
  it("runs a 4,500-id queue as three batches at the cap, in order, every id once", async () => {
    const batches: string[][] = [];
    const result = await inBulkBatches(ids(4500), async (batch) => {
      batches.push(batch);
      return { ok: true as const };
    });
    expect(result).toEqual({ ok: true });
    expect(batches.map((b) => b.length)).toEqual([2000, 2000, 500]);
    expect(batches.flat()).toEqual(ids(4500));
  });

  it("stops at the first refusal and returns it", async () => {
    const batches: string[][] = [];
    const result = await inBulkBatches(ids(4500), async (batch) => {
      batches.push(batch);
      return batches.length === 2
        ? { ok: false as const, message: "no" }
        : { ok: true as const, message: "" };
    });
    expect(result).toEqual({ ok: false, message: "no" });
    expect(batches).toHaveLength(2);
  });

  it("makes exactly one call for a selection inside the cap, and for an empty one", async () => {
    let calls = 0;
    await inBulkBatches(ids(2000), async () => {
      calls += 1;
      return { ok: true };
    });
    await inBulkBatches([], async (batch) => {
      calls += 1;
      expect(batch).toEqual([]);
      return { ok: true };
    });
    expect(calls).toBe(2);
  });
});
