/**
 * THE BLOCK'S SERVER FUNCTIONS ARE PUBLIC ENDPOINTS: each parses its raw client values before
 * anything runs, answers a refusal in the host's words, reports only a real bug, and refreshes every
 * room a block changes. Who may act is the mutations' and the RPCs' (tested there and in the
 * migration's rolled-back checks).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (p: string) => revalidatePath(p),
}));
const captureError = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...args: unknown[]) => captureError(...args),
}));
const previewBlock = vi.fn();
const blockFromEvent = vi.fn();
const letBackIn = vi.fn();
vi.mock("@/lib/db/mutations/event-blocks", () => ({
  previewBlock: (...a: unknown[]) => previewBlock(...a),
  blockFromEvent: (...a: unknown[]) => blockFromEvent(...a),
  letBackIn: (...a: unknown[]) => letBackIn(...a),
}));

const { blockFromEventAction, letBackInAction, previewBlockAction } =
  await import("@/app/(app)/dashboard/[eventId]/guests/actions");

const EVENT = "11111111-2222-4333-8444-555555555555";
const GUEST = "33333333-4444-4555-8666-777777777777";
const BLOCK = "44444444-5555-4666-8777-888888888888";
const BAD = { ok: false, message: "That didn't go through. Please try again." };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("a raw client value never reaches a mutation", () => {
  it("refuses a malformed target, options or block id", async () => {
    await expect(
      previewBlockAction({ kind: "row", guestId: "nope" }),
    ).resolves.toEqual(BAD);
    await expect(
      blockFromEventAction(
        { kind: "row", guestId: GUEST },
        { requireVerifiedEmail: "yes" },
      ),
    ).resolves.toEqual(BAD);
    await expect(
      blockFromEventAction(
        { kind: "device", id: GUEST },
        { requireVerifiedEmail: false },
      ),
    ).resolves.toEqual(BAD);
    await expect(
      letBackInAction({ blockId: "b-1", restore: false }),
    ).resolves.toEqual(BAD);
    await expect(letBackInAction({ blockId: BLOCK })).resolves.toEqual(BAD);
    expect(previewBlock).not.toHaveBeenCalled();
    expect(blockFromEvent).not.toHaveBeenCalled();
    expect(letBackIn).not.toHaveBeenCalled();
  });

  it("passes only the parsed target on (anything a client added is gone)", async () => {
    blockFromEvent.mockResolvedValue({
      ok: true,
      data: { eventId: EVENT, blockId: BLOCK, removed: 2, already: false },
    });
    await blockFromEventAction(
      { kind: "row", guestId: GUEST, email: "sam@example.com" },
      { requireVerifiedEmail: true, extra: 1 },
    );
    expect(blockFromEvent).toHaveBeenCalledWith(
      { kind: "row", guestId: GUEST },
      { requireVerifiedEmail: true },
    );
  });
});

describe("what the host is told", () => {
  it("a block answers its count and refreshes the hub, the Guests room and Review", async () => {
    blockFromEvent.mockResolvedValue({
      ok: true,
      data: { eventId: EVENT, blockId: BLOCK, removed: 2, already: false },
    });
    await expect(
      blockFromEventAction(
        { kind: "row", guestId: GUEST },
        { requireVerifiedEmail: false },
      ),
    ).resolves.toEqual({ ok: true, removed: 2, already: false });
    expect(revalidatePath.mock.calls.map(([p]) => p)).toEqual([
      `/dashboard/${EVENT}`,
      `/dashboard/${EVENT}/guests`,
      `/dashboard/${EVENT}/review`,
    ]);
  });

  it("letting back in answers what came back and refreshes the same rooms", async () => {
    letBackIn.mockResolvedValue({
      ok: true,
      data: { eventId: EVENT, restored: 1, noRoom: 0 },
    });
    await expect(
      letBackInAction({ blockId: BLOCK, restore: true }),
    ).resolves.toEqual({
      ok: true,
      restored: 1,
      noRoom: 0,
    });
    expect(letBackIn).toHaveBeenCalledWith(BLOCK, { restore: true });
    expect(revalidatePath).toHaveBeenCalledTimes(3);
  });

  it("a refusal travels as its words, uncaptured; only an unknown failure with a cause is reported", async () => {
    previewBlock.mockResolvedValue({
      ok: false,
      code: "not_found",
      message: "That person or event is no longer available.",
    });
    await expect(
      previewBlockAction({ kind: "row", guestId: GUEST }),
    ).resolves.toEqual({
      ok: false,
      message: "That person or event is no longer available.",
    });
    expect(captureError).not.toHaveBeenCalled();

    const cause = { code: "XX000" };
    letBackIn.mockResolvedValue({
      ok: false,
      code: "unknown",
      message: "That didn't go through. Please try again.",
      cause,
    });
    await letBackInAction({ blockId: BLOCK, restore: false });
    expect(captureError).toHaveBeenCalledWith("security", cause, {
      action: "let_back_in",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
