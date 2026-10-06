/**
 * ★ THE PASS LEDGER'S WRITES ARE EACH ONE SQL CALL (billing-locks 20261005130000; billing-integrity 20261005181000;
 * credit-watch 20261005201000: the claim's two busy holders and its unsettled overlap, the release, the recompute's
 * Pro-pending answer).
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
  adoptPassCreditOrphans,
  claimPassCredit,
  PassCreditReleasedError,
  convertPassCredit,
  parseClaim,
  recomputePassEntitlement,
  recordPassCreditGrant,
  releasePassCredit,
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
    ).resolves.toEqual({
      state: "claimed",
      resumed: false,
      orphans: [],
      claimedUntil: null,
    });
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
      orphans: [],
      claimedUntil: null,
    });
    // The lease's end, which the route never grants past (credit-watch).
    expect(
      parseClaim({
        state: "claimed",
        resumed: false,
        orphans: [],
        claimed_until: "2026-10-05T12:10:00+00:00",
      }),
    ).toEqual({
      state: "claimed",
      resumed: false,
      orphans: [],
      claimedUntil: "2026-10-05T12:10:00+00:00",
    });
    // ★ The orphans a claim is taken past (credit-watch): their grants are looked for on Stripe's side first.
    expect(
      parseClaim({
        state: "claimed",
        resumed: false,
        orphans: [
          { session: "cs_dead_1", claimed_at: 1_790_000_011 },
          { session: "cs_dead_2", claimed_at: 1_790_000_021 },
        ],
      }),
    ).toEqual({
      state: "claimed",
      resumed: false,
      orphans: [
        { session: "cs_dead_1", claimedAt: 1_790_000_011 },
        { session: "cs_dead_2", claimedAt: 1_790_000_021 },
      ],
      claimedUntil: null,
    });
    expect(
      parseClaim({ state: "granted", balance_transaction_id: "cbtxn_1" }),
    ).toEqual({ state: "granted", balanceTransactionId: "cbtxn_1" });
    expect(
      parseClaim({
        state: "busy",
        held_by: "this_checkout",
        retry_after_sec: 42.2,
      }),
    ).toEqual({ state: "busy", heldBy: "this_checkout", retryAfterSec: 43 });
    // ★ Another checkout's lease on its passes is busy too (credit-watch): the retry meets its grant or its lapse.
    expect(
      parseClaim({
        state: "busy",
        held_by: "another_checkout",
        retry_after_sec: 90,
      }),
    ).toEqual({ state: "busy", heldBy: "another_checkout", retryAfterSec: 90 });
    // A busy without a usable hint still says busy, with the lease's whole length; one with no holder is the
    // billing-integrity function's, whose busy was always this checkout's own lease.
    expect(parseClaim({ state: "busy" })).toEqual({
      state: "busy",
      heldBy: "this_checkout",
      retryAfterSec: 600,
    });
    expect(parseClaim({ state: "overlap", unsettled: true })).toEqual({
      state: "overlap",
      unsettled: true,
    });
    expect(parseClaim({ state: "overlap", unsettled: false })).toEqual({
      state: "overlap",
      unsettled: false,
    });
    // An overlap with no word on it is the older function's, which left nothing of its own to settle.
    expect(parseClaim({ state: "overlap" })).toEqual({
      state: "overlap",
      unsettled: false,
    });
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
      // A holder, a settlement or an orphan it never names is no answer either.
      { state: "claimed", resumed: true, orphans: "cs_dead_1" },
      { state: "claimed", resumed: true, orphans: [{ session: "cs_dead_1" }] },
      {
        state: "claimed",
        resumed: true,
        orphans: [{ session: "", claimed_at: 1 }],
      },
      { state: "claimed", resumed: true, orphans: null },
      { state: "claimed", resumed: true, orphans: [], claimed_until: "soon" },
      { state: "claimed", resumed: true, orphans: [], claimed_until: 600 },
      { state: "busy", held_by: "somebody" },
      { state: "busy", held_by: null },
      { state: "overlap", unsettled: "yes" },
      { state: "overlap", unsettled: null },
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

describe("the release (credit-watch)", () => {
  it("★ is one call naming the session, the host and the grant Stripe holds for it, and writes no table itself", async () => {
    rpc.mockResolvedValue({ data: "released_granted", error: null });
    await expect(releasePassCredit("cs_1", HOST, "cbtxn_lost")).resolves.toBe(
      "released_granted",
    );
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("release_pass_credit", {
      p_session_id: "cs_1",
      p_host_id: HOST,
      p_balance_transaction_id: "cbtxn_lost",
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("with no grant found, leaves the grant's key out, so the function's own null applies", async () => {
    rpc.mockResolvedValue({ data: "released", error: null });
    await expect(releasePassCredit("cs_1", HOST, null)).resolves.toBe(
      "released",
    );
    expect(rpc).toHaveBeenCalledWith("release_pass_credit", {
      p_session_id: "cs_1",
      p_host_id: HOST,
      p_balance_transaction_id: undefined,
    });
  });

  it("a refusal (a claim still owed, granted, or held) throws, and an answer it never gives is a broken call", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: {
        message:
          "This checkout's passes are not another checkout's to credit: it is still owed.",
      },
    });
    await expect(releasePassCredit("cs_1", HOST, null)).rejects.toThrow(
      /^release_pass_credit: This checkout's passes are not another checkout's/,
    );
    for (const data of [null, "", "granted", 1, {}]) {
      rpc.mockResolvedValue({ data, error: null });
      await expect(
        releasePassCredit("cs_1", HOST, null),
        JSON.stringify(data),
      ).rejects.toThrow(
        "release_pass_credit answered something it never answers",
      );
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
    // ★ Her Pro plan seconds behind its credited checkout (credit-watch): written nothing, said so.
    rpc.mockResolvedValue({ data: "skipped_pro_pending", error: null });
    await expect(recomputePassEntitlement(HOST)).resolves.toBe(
      "skipped_pro_pending",
    );
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

describe("the orphans' adoption and a released claim's record (billing-orphans)", () => {
  beforeEach(() => rpc.mockReset());

  it("★ adopts in one call: the orphans and their grants index for index, the answer read strictly", async () => {
    rpc.mockResolvedValueOnce({
      data: {
        state: "adopted",
        orphans: [
          {
            session: "cs_a",
            balance_transaction_id: "cbtxn_a",
            converted: 2,
            granted_twice: false,
          },
          {
            session: "cs_b",
            balance_transaction_id: "cbtxn_b",
            converted: 0,
            granted_twice: true,
          },
        ],
      },
      error: null,
    });
    const answer = await adoptPassCreditOrphans("cs_t", HOST, [
      { session: "cs_b", balanceTransactionId: "cbtxn_b" },
      { session: "cs_a", balanceTransactionId: "cbtxn_a" },
    ]);
    expect(rpc).toHaveBeenCalledWith("adopt_pass_credit_orphans", {
      p_session_id: "cs_t",
      p_host_id: HOST,
      p_orphan_sessions: ["cs_b", "cs_a"],
      p_balance_transaction_ids: ["cbtxn_b", "cbtxn_a"],
    });
    expect(answer).toEqual({
      state: "adopted",
      orphans: [
        {
          session: "cs_a",
          balanceTransactionId: "cbtxn_a",
          converted: 2,
          grantedTwice: false,
        },
        {
          session: "cs_b",
          balanceTransactionId: "cbtxn_b",
          converted: 0,
          grantedTwice: true,
        },
      ],
    });
  });

  it("reads busy with its wait, and throws on an error, an empty adoption or a malformed orphan", async () => {
    rpc.mockResolvedValueOnce({
      data: { state: "busy", retry_after_sec: 212 },
      error: null,
    });
    expect(
      await adoptPassCreditOrphans("cs_t", HOST, [
        { session: "cs_a", balanceTransactionId: "x" },
      ]),
    ).toEqual({
      state: "busy",
      retryAfterSec: 212,
    });
    for (const data of [
      { state: "adopted", orphans: [] },
      {
        state: "adopted",
        orphans: [
          {
            session: "cs_a",
            balance_transaction_id: "x",
            converted: -1,
            granted_twice: false,
          },
        ],
      },
      { state: "adopted" },
      { state: "overlap" },
      null,
    ]) {
      rpc.mockResolvedValueOnce({ data, error: null });
      await expect(
        adoptPassCreditOrphans("cs_t", HOST, [
          { session: "cs_a", balanceTransactionId: "x" },
        ]),
      ).rejects.toThrow(/never answers/);
    }
    rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "boom", code: "XX000" },
    });
    await expect(
      adoptPassCreditOrphans("cs_t", HOST, [
        { session: "cs_a", balanceTransactionId: "x" },
      ]),
    ).rejects.toThrow("adopt_pass_credit_orphans: boom");
  });

  it("★ a record refused for a released claim throws its own error; any other failure stays a plain one", async () => {
    rpc.mockResolvedValueOnce({
      data: null,
      error: {
        code: "55000",
        message:
          "This checkout's credit is released: its grant goes on record beside the release.",
      },
    });
    await expect(
      recordPassCreditGrant("cs_w", HOST, "cbtxn_w"),
    ).rejects.toBeInstanceOf(PassCreditReleasedError);
    rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "55000", message: "something else not in state" },
    });
    const other = await recordPassCreditGrant("cs_w", HOST, "cbtxn_w").catch(
      (e: unknown) => e,
    );
    expect(other).toBeInstanceOf(Error);
    expect(other).not.toBeInstanceOf(PassCreditReleasedError);
  });
});
