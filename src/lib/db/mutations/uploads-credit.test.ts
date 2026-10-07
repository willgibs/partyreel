import { beforeEach, describe, expect, it, vi } from "vitest";

import { MEGABYTE } from "@/lib/constants/tiers";
import { QueryFailedError } from "@/lib/db/must-query";

/**
 * ★ THE OPERATOR'S CREDIT, THE WRITE (crumbs-92, X6): one definer RPC called by its names, its one jsonb believed only
 * when it has a shape the function gives. A credit read as granted that was not is the failure this exists to prevent,
 * so an answer it never gives is an Error, and a refusal is a value with its words' facts.
 */

const state = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: state.rpc }),
}));

const { grantUploadsCredit, readCreditAnswer } =
  await import("@/lib/db/mutations/uploads-credit");

const GRANTED = {
  state: "granted",
  replayed: false,
  credit_id: "9b8d8f56-1c0e-4d52-8f0b-6f2d5d8a1c11",
  bytes: 100 * MEGABYTE,
  window_ends_at: "2026-11-01T00:00:00+00:00",
  live_bytes: 100 * MEGABYTE,
  max_bytes: 300 * MEGABYTE,
};

const INPUT = {
  operatorId: "0f1e2d3c-4b5a-4968-8776-655443322110",
  hostId: "7d0c1f3e-2b4a-4c5d-8e6f-708192a3b4c5",
  bytes: 100 * MEGABYTE,
  reason: "She wrote in: her guests were refused",
  requestId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
};

beforeEach(() => {
  state.rpc.mockReset();
});

describe("the call", () => {
  it("★ asks the function by its argument names, and answers what it granted", async () => {
    state.rpc.mockResolvedValue({ data: GRANTED, error: null });
    await expect(grantUploadsCredit(INPUT)).resolves.toEqual({
      ok: true,
      creditId: GRANTED.credit_id,
      bytes: 100 * MEGABYTE,
      windowEndsAt: "2026-11-01T00:00:00+00:00",
      liveBytes: 100 * MEGABYTE,
      maxBytes: 300 * MEGABYTE,
      replayed: false,
    });
    // PostgREST resolves a function by the names it is sent.
    expect(state.rpc).toHaveBeenCalledWith("grant_uploads_credit", {
      p_operator_id: INPUT.operatorId,
      p_host_id: INPUT.hostId,
      p_bytes: 100 * MEGABYTE,
      p_reason: INPUT.reason,
      p_request_id: INPUT.requestId,
    });
  });

  it("★ a failed call is thrown, never read as a refusal or a grant", async () => {
    state.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "42501",
        message: "uploads credit: not an operator",
        details: "",
        hint: "",
      },
    });
    const failed = grantUploadsCredit(INPUT);
    await expect(failed).rejects.toBeInstanceOf(QueryFailedError);
    await expect(failed).rejects.toThrow(/not an operator/);
  });
});

describe("the answer, believed only in a shape the function gives", () => {
  it("reads a refusal with the facts its words use", () => {
    expect(
      readCreditAnswer({
        state: "refused",
        why: "over_bound",
        max_bytes: 300 * MEGABYTE,
        live_bytes: 250 * MEGABYTE,
      }),
    ).toEqual({
      ok: false,
      why: "over_bound",
      minBytes: undefined,
      maxBytes: 300 * MEGABYTE,
      liveBytes: 250 * MEGABYTE,
      liveCount: undefined,
    });
    expect(
      readCreditAnswer({ state: "refused", why: "unmetered" }),
    ).toMatchObject({ ok: false, why: "unmetered" });
    expect(
      readCreditAnswer({ state: "refused", why: "too_many", live_count: 10 }),
    ).toMatchObject({ ok: false, why: "too_many", liveCount: 10 });
  });

  it("reads a replay as granted, and an unmetered max as null", () => {
    expect(
      readCreditAnswer({ ...GRANTED, replayed: true, max_bytes: null }),
    ).toMatchObject({ ok: true, replayed: true, maxBytes: null });
  });

  it("★ throws on anything the function never gives, so nothing is credited by a guess", () => {
    const never: unknown[] = [
      null,
      undefined,
      "granted",
      [],
      {},
      { state: "refused" },
      { state: "refused", why: "because" },
      { state: "refused", why: 3 },
      { state: "pending" },
      { ...GRANTED, credit_id: 7 },
      { ...GRANTED, bytes: "100" },
      { ...GRANTED, bytes: Number.NaN },
      { ...GRANTED, window_ends_at: "soon" },
      { ...GRANTED, window_ends_at: null },
      { ...GRANTED, live_bytes: undefined },
      { ...GRANTED, max_bytes: "300" },
      { ...GRANTED, replayed: "false" },
    ];
    for (const answer of never) {
      expect(
        () => readCreditAnswer(answer),
        JSON.stringify(answer) ?? String(answer),
      ).toThrow("grant_uploads_credit answered a shape it never does");
    }
  });
});
