/**
 * ★ THE PASS LEDGER'S WRITES ARE EACH ONE SQL CALL (billing-locks 20261005130000; billing-integrity 20261005181000).
 *
 * The credit (claim, record, convert) and the recompute each ask one function that takes her profiles row first and does
 * its whole job in one transaction; the TypeScript touches no table itself. The recompute read the ledger and wrote the
 * profile in two requests, so a conversion landing between them had its cleared chain put back (proved in SQL by the
 * migration's two-session run); the conversion took every unconsumed pass, where it now takes exactly the passes its
 * checkout named, from the claim. Each answer is read strictly: anything a function never answers is a broken call,
 * thrown for Stripe (or the sweep) to retry, never "nothing to do".
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
// The recompute used to read the ledger through this; nothing may now.
const getLivePasses = vi.fn(async () => []);
vi.mock("@/lib/db/queries/event-passes", () => ({
  getLivePasses: () => getLivePasses(),
}));

const {
  claimPassCredit,
  convertPassCredit,
  parseClaim,
  recomputePassEntitlement,
  recordPassCreditGrant,
} = await import("@/lib/db/mutations/event-passes");

const HOST = "44444444-4444-4444-8444-444444444444";
const PASS_A = "00000000-0000-4000-8000-00000000000a";
const PASS_B = "00000000-0000-4000-8000-00000000000b";

beforeEach(() => {
  rpc.mockReset();
  from.mockReset();
  getLivePasses.mockClear();
  from.mockImplementation((table: string) => {
    throw new Error(`the ledger's write touched ${table} itself`);
  });
});

describe("the credit's claim", () => {
  it("★ is one call naming the session, the host, the credit and exactly the passes the checkout credited", async () => {
    rpc.mockResolvedValue({
      data: { state: "claimed", resumed: false },
      error: null,
    });
    await expect(
      claimPassCredit({
        sessionId: "cs_1",
        hostId: HOST,
        creditCents: 1850,
        passIds: [PASS_A, PASS_B],
      }),
    ).resolves.toEqual({ state: "claimed", resumed: false });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("claim_pass_credit", {
      p_session_id: "cs_1",
      p_host_id: HOST,
      p_credit_cents: 1850,
      p_pass_ids: [PASS_A, PASS_B],
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("reads each state the claim answers", () => {
    expect(parseClaim({ state: "claimed", resumed: true })).toEqual({
      state: "claimed",
      resumed: true,
    });
    expect(
      parseClaim({ state: "granted", balance_transaction_id: "cbtxn_1" }),
    ).toEqual({ state: "granted", balanceTransactionId: "cbtxn_1" });
    expect(parseClaim({ state: "busy", retry_after_sec: 42.2 })).toEqual({
      state: "busy",
      retryAfterSec: 43,
    });
    // A busy without a usable hint still says busy, with the lease's whole length.
    expect(parseClaim({ state: "busy" })).toEqual({
      state: "busy",
      retryAfterSec: 600,
    });
    expect(parseClaim({ state: "overlap" })).toEqual({ state: "overlap" });
    expect(parseClaim({ state: "no_host" })).toEqual({ state: "no_host" });
  });

  it("★ an answer it never gives is a broken call, never a claim (above all never a grant's go-ahead)", () => {
    for (const data of [
      null,
      "claimed",
      {},
      { state: "claimed" },
      { state: "granted" },
      { state: "granted", balance_transaction_id: "" },
      { state: "maybe" },
    ]) {
      expect(() => parseClaim(data), JSON.stringify(data)).toThrow(
        "claim_pass_credit answered something it never answers",
      );
    }
  });

  it("a failed call throws, so the webhook answers 500 and Stripe retries", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: "PGRST202", message: "Could not find the function" },
    });
    await expect(
      claimPassCredit({
        sessionId: "cs_1",
        hostId: HOST,
        creditCents: 1850,
        passIds: [PASS_A],
      }),
    ).rejects.toThrow(/^claim_pass_credit: Could not find the function/);
  });
});

describe("the grant on record", () => {
  it("is one call, and answers the transaction on record (an earlier one when there is one)", async () => {
    rpc.mockResolvedValue({ data: "cbtxn_first", error: null });
    await expect(
      recordPassCreditGrant("cs_1", HOST, "cbtxn_second"),
    ).resolves.toBe("cbtxn_first");
    expect(rpc).toHaveBeenCalledWith("record_pass_credit_grant", {
      p_session_id: "cs_1",
      p_host_id: HOST,
      p_balance_transaction_id: "cbtxn_second",
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("an answer that is not a transaction, or a failed call, throws", async () => {
    for (const data of [null, "", 7]) {
      rpc.mockResolvedValue({ data, error: null });
      await expect(
        recordPassCreditGrant("cs_1", HOST, "cbtxn_1"),
      ).rejects.toThrow("answered something other than a transaction");
    }
    rpc.mockResolvedValue({ data: null, error: { message: "no claim" } });
    await expect(
      recordPassCreditGrant("cs_1", HOST, "cbtxn_1"),
    ).rejects.toThrow(/^record_pass_credit_grant: no claim/);
  });
});

describe("the conversion", () => {
  it("★ is one call of the session's claim (the passes it named), and writes no table itself", async () => {
    rpc.mockResolvedValue({ data: 2, error: null });
    await expect(convertPassCredit("cs_1", HOST)).resolves.toBe(2);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("convert_pass_credit", {
      p_session_id: "cs_1",
      p_host_id: HOST,
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("a replay converts nothing and says 0, which the webhook reads as success", async () => {
    rpc.mockResolvedValue({ data: 0, error: null });
    await expect(convertPassCredit("cs_1", HOST)).resolves.toBe(0);
  });

  it("★ a failed call throws, and an answer that is not a count is a broken call, never 'nothing to convert'", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: "This checkout's credit is not granted yet." },
    });
    await expect(convertPassCredit("cs_1", HOST)).rejects.toThrow(
      /^convert_pass_credit: This checkout's credit is not granted yet/,
    );
    for (const data of [null, undefined, "3", 1.5, -1, Number.NaN, {}]) {
      rpc.mockResolvedValue({ data, error: null });
      await expect(
        convertPassCredit("cs_1", HOST),
        JSON.stringify(data),
      ).rejects.toThrow("answered something other than a count");
    }
  });
});

describe("the recompute", () => {
  it("★ is ONE call under her profiles lock: no ledger read and no profile write of its own for a conversion to land between", async () => {
    rpc.mockResolvedValue({ data: "updated", error: null });
    await expect(recomputePassEntitlement(HOST)).resolves.toBe("updated");
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("recompute_pass_entitlement", {
      p_host_id: HOST,
      p_now: undefined,
    });
    // It read her passes, then her profile, then wrote it: three requests a conversion could land between.
    expect(getLivePasses).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("asks at the sweep's instant when it is given one, the database's own otherwise", async () => {
    rpc.mockResolvedValue({ data: "unchanged", error: null });
    const now = new Date("2026-10-05T04:00:00.000Z");
    await expect(recomputePassEntitlement(HOST, now)).resolves.toBe(
      "unchanged",
    );
    expect(rpc).toHaveBeenCalledWith("recompute_pass_entitlement", {
      p_host_id: HOST,
      p_now: "2026-10-05T04:00:00.000Z",
    });
  });

  it("reads each answer it gives, and throws on any other or on a failed call", async () => {
    rpc.mockResolvedValue({ data: "skipped_pro", error: null });
    await expect(recomputePassEntitlement(HOST)).resolves.toBe("skipped_pro");
    for (const data of [null, "", "free", 1]) {
      rpc.mockResolvedValue({ data, error: null });
      await expect(
        recomputePassEntitlement(HOST),
        JSON.stringify(data),
      ).rejects.toThrow("answered something it never answers");
    }
    rpc.mockResolvedValue({ data: null, error: { message: "lock timeout" } });
    await expect(recomputePassEntitlement(HOST)).rejects.toThrow(
      /^recompute_pass_entitlement: lock timeout/,
    );
  });
});
