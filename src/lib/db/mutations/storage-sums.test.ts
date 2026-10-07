/**
 * THE OPERATOR'S REBUILD'S CALL (storage-sums-signal): `rebuild_storage_sums` asked for her id alone, its answer read
 * defensively (her two summaries, or no host), and a failure thrown, never read as a rebuild.
 */
import { describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));

const { parseRebuildAnswer, rebuildStorageSums } =
  await import("@/lib/db/mutations/storage-sums");

const HOST = "6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b";
const summary = (active: number) => ({
  active_bytes: active,
  standby_bytes: 40,
  system_bytes: 0,
});

describe("rebuildStorageSums", () => {
  it("asks for her alone and reads her summary before and after", async () => {
    const seen: Record<string, unknown>[] = [];
    const fake = createFakePostgrest({
      rpc: {
        rebuild_storage_sums: (args) => {
          seen.push(args);
          return {
            ok: true,
            host_id: HOST,
            before: summary(1_001),
            after: summary(1_000),
          };
        },
      },
    });
    expect(await rebuildStorageSums(asSupabase(fake), HOST)).toEqual({
      ok: true,
      before: { active: 1_001, deleted: 40, system: 0 },
      after: { active: 1_000, deleted: 40, system: 0 },
    });
    expect(seen).toEqual([{ p_host_id: HOST }]);
  });

  it("throws when the call fails", async () => {
    await expect(
      rebuildStorageSums(asSupabase(createFakePostgrest()), HOST),
    ).rejects.toThrow(/rebuild_storage_sums/);
  });
});

describe("parseRebuildAnswer", () => {
  it("reads a host with no profile as no host", () => {
    expect(parseRebuildAnswer({ ok: false, reason: "no_host" })).toEqual({
      ok: false,
      reason: "no_host",
    });
  });

  it.each([
    ["no answer", null],
    ["another refusal", { ok: false, reason: "busy" }],
    ["no summary after", { ok: true, before: summary(1) }],
    [
      "a figure that is no number",
      {
        ok: true,
        before: summary(1),
        after: { ...summary(1), system_bytes: "0" },
      },
    ],
  ])("★ fails on %s, never reading it as a rebuild", (_name, data) => {
    expect(() => parseRebuildAnswer(data)).toThrow(TypeError);
  });
});
