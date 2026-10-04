import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const rpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc }),
}));

const { readHostMonthUploads } = await import("./month-uploads");

beforeEach(() => {
  rpc.mockReset();
});

describe("what a host has uploaded this month", () => {
  it("asks the ledger's own function for the month, as Pro, for the id it is given", async () => {
    rpc.mockResolvedValue({ data: 161_061_273_600, error: null });
    await expect(readHostMonthUploads("host-1")).resolves.toBe(161_061_273_600);
    // `uploads_used` reads the month's ledger for every tier but the pass, and a switch to Pro is measured against
    // the month whatever window she is in now.
    expect(rpc).toHaveBeenCalledWith("uploads_used", {
      p_host_id: "host-1",
      p_tier: "pro",
    });
  });

  it("reads a month with no ledger row as nothing uploaded", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await expect(readHostMonthUploads("host-1")).resolves.toBe(0);
  });

  it("throws a failed read, so the caller decides how to degrade (never a silent zero)", async () => {
    rpc.mockResolvedValue({ data: null, error: new Error("boom") });
    await expect(readHostMonthUploads("host-1")).rejects.toThrow("boom");
  });
});
