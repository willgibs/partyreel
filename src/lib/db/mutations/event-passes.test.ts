/**
 * ★ THE CREDIT'S CONVERSION IS ONE CALL (billing-locks, 20261005130000). `consumeLivePassesForProCredit` wrote the
 * passes itself, a PostgREST update of `event_passes`, and the webhook patched the profile's chain in a second request:
 * the reverse of an upload's complete, which takes her profiles row and then the pass it counts on. It now asks
 * `consume_passes_for_pro_credit`, which takes her profiles row first and does both in one transaction, and touches no
 * table itself. Its answer is the count the webhook reads as "a replay" at 0, so anything that is not a count is a
 * broken call, thrown for Stripe to retry, never "nothing to consume".
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const from = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: (...args: unknown[]) => rpc(...args),
    from: (...args: unknown[]) => from(...args),
  }),
}));
vi.mock("@/lib/db/queries/event-passes", () => ({
  getLivePasses: vi.fn(async () => []),
}));

const { consumeLivePassesForProCredit } =
  await import("@/lib/db/mutations/event-passes");

const HOST = "44444444-4444-4444-8444-444444444444";

beforeEach(() => {
  rpc.mockReset();
  from.mockReset();
  from.mockImplementation((table: string) => {
    throw new Error(`the conversion touched ${table} itself`);
  });
});

describe("the pass-to-Pro credit's conversion", () => {
  it("★ is one call of the transaction that takes her profiles row first, and writes no table itself", async () => {
    rpc.mockResolvedValue({ data: 3, error: null });
    await expect(consumeLivePassesForProCredit(HOST)).resolves.toBe(3);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("consume_passes_for_pro_credit", {
      p_host_id: HOST,
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("a replay consumes nothing and says 0, which the webhook reads as success", async () => {
    rpc.mockResolvedValue({ data: 0, error: null });
    await expect(consumeLivePassesForProCredit(HOST)).resolves.toBe(0);
  });

  it("★ a failed call throws (the webhook answers 500 and Stripe retries)", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: {
        code: "PGRST202",
        message:
          "Could not find the function public.consume_passes_for_pro_credit(p_host_id) in the schema cache",
      },
    });
    await expect(consumeLivePassesForProCredit(HOST)).rejects.toThrow(
      /^consume_passes_for_pro_credit: Could not find the function/,
    );
  });

  it("★ an answer that is not a count is a broken call, never 'nothing to consume'", async () => {
    for (const data of [null, undefined, "3", 1.5, -1, Number.NaN, {}]) {
      rpc.mockResolvedValue({ data, error: null });
      await expect(
        consumeLivePassesForProCredit(HOST),
        JSON.stringify(data),
      ).rejects.toThrow("answered something other than a count");
    }
  });
});
