/**
 * THE CLAIMS REVIEW'S TWO WRITES (`identity-claims` r2: `save=once`, `confirm=card`). Pinned: each
 * names exactly ONE event (a double tap can never widen it to the next), an id that is not one and a
 * signed-out caller reach no RPC, a failure says so where failures are read, the claim's follow-up is
 * never worth the claim, and an answer that arrives after its event stopped waiting is `gone`, never
 * reported as done.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
let user: { id: string } | null = { id: "u1" };
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ supabase: { rpc }, user }),
}));
const getClaimedEventNext = vi.fn();
vi.mock("@/lib/db/queries/claims", () => ({
  getClaimedEventNext: (...args: unknown[]) => getClaimedEventNext(...args),
}));
const captureError = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...args: unknown[]) => captureError(...args),
}));

const { claimEventAction, disownEventAction } =
  await import("@/app/(app)/dashboard/claims-actions");

const EVENT = "0fd56a19-ad5c-4599-8ed9-319520fd1f7a";
const NEXT = {
  href: "/e/qr",
  host: { id: "h", slug: "tom", name: "Tom", following: false },
};

beforeEach(() => {
  vi.clearAllMocks();
  user = { id: "u1" };
  rpc.mockResolvedValue({ data: 1, error: null });
  getClaimedEventNext.mockResolvedValue(NEXT);
});

describe("both writes", () => {
  it.each([
    ["claim", claimEventAction],
    ["disown", disownEventAction],
  ] as const)(
    "%s refuses an id that is not an event before any RPC",
    async (_, action) => {
      await expect(action("not-a-uuid")).resolves.toMatchObject({
        ok: false,
        gone: false,
      });
      await expect(action([EVENT, EVENT])).resolves.toMatchObject({
        ok: false,
      });
      expect(rpc).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["claim", claimEventAction],
    ["disown", disownEventAction],
  ] as const)(
    "%s asks a signed-out caller to sign in, and writes nothing",
    async (_, action) => {
      user = null;
      await expect(action(EVENT)).resolves.toEqual({
        ok: false,
        gone: false,
        message: "Sign in and try again.",
      });
      expect(rpc).not.toHaveBeenCalled();
    },
  );
});

describe("claimEventAction", () => {
  it("★ claims exactly one event, then offers what it opens", async () => {
    await expect(claimEventAction(EVENT)).resolves.toEqual({
      ok: true,
      next: NEXT,
    });
    expect(rpc).toHaveBeenCalledWith("claim_guest_rows_by_email", {
      p_event_ids: [EVENT],
    });
    expect(getClaimedEventNext).toHaveBeenCalledWith(
      expect.objectContaining({ user: { id: "u1" } }),
      EVENT,
    );
  });

  it("a failed claim says so, is recorded, and reads nothing after it", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(claimEventAction(EVENT)).resolves.toEqual({
      ok: false,
      gone: false,
      message: "Couldn't claim those photos. Please try again.",
    });
    expect(captureError).toHaveBeenCalledWith("account", expect.anything(), {
      seam: "claims_claim",
    });
    expect(getClaimedEventNext).not.toHaveBeenCalled();
  });

  it("a claim that landed stays landed when the offer after it cannot be read", async () => {
    getClaimedEventNext.mockRejectedValue(new Error("read failed"));
    await expect(claimEventAction(EVENT)).resolves.toEqual({
      ok: true,
      next: null,
    });
    expect(captureError).toHaveBeenCalledWith("account", expect.any(Error), {
      seam: "claims_next",
    });
  });

  it("is gone when nothing was claimed and she is no guest there", async () => {
    rpc.mockResolvedValue({ data: 0, error: null });
    getClaimedEventNext.mockResolvedValue(null);
    await expect(claimEventAction(EVENT)).resolves.toMatchObject({
      ok: false,
      gone: true,
    });
  });

  it("is hers when another tab claimed it first", async () => {
    rpc.mockResolvedValue({ data: 0, error: null });
    await expect(claimEventAction(EVENT)).resolves.toEqual({
      ok: true,
      next: NEXT,
    });
  });
});

describe("disownEventAction", () => {
  it("★ deletes under exactly one event, once its dialog said Delete", async () => {
    await expect(disownEventAction(EVENT)).resolves.toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("disown_guest_rows_by_email", {
      p_event_ids: [EVENT],
    });
  });

  it("a failed delete says so and is recorded", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(disownEventAction(EVENT)).resolves.toEqual({
      ok: false,
      gone: false,
      message: "Couldn't delete those photos. Please try again.",
    });
    expect(captureError).toHaveBeenCalledWith("account", expect.anything(), {
      seam: "claims_disown",
    });
  });

  it("is gone when nothing was waiting there any more", async () => {
    rpc.mockResolvedValue({ data: 0, error: null });
    await expect(disownEventAction(EVENT)).resolves.toMatchObject({
      ok: false,
      gone: true,
    });
  });
});
