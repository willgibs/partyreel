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

const letInAtDoor = vi.fn();
const addEventInvites = vi.fn();
const removeEventInvite = vi.fn();
vi.mock("@/lib/db/mutations/event-doors", () => ({
  letInAtDoor: (...a: unknown[]) => letInAtDoor(...a),
  addEventInvites: (...a: unknown[]) => addEventInvites(...a),
  removeEventInvite: (...a: unknown[]) => removeEventInvite(...a),
}));

const {
  addInvitesAction,
  blockFromEventAction,
  declineAtDoorAction,
  letBackInAction,
  letInAtDoorAction,
  previewBlockAction,
  removeInviteAction,
} = await import("@/app/(app)/dashboard/[eventId]/guests/actions");

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
  it("a block answers its count and refreshes the hub, which holds the Guests room and Review", async () => {
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
    // Reshaped on purpose (event-header r2, `rooms=over`): the rooms stand over the hub, and their old routes only
    // redirect, so the hub is the one page to re-render.
    expect(revalidatePath.mock.calls.map(([p]) => p)).toEqual([
      `/dashboard/${EVENT}`,
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
    expect(revalidatePath).toHaveBeenCalledTimes(1);
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

describe("the door's Server Functions (event-settings r1)", () => {
  const USER = "55555555-6666-4777-8888-999999999999";

  it("refuse a malformed event, row, account or list before any write", async () => {
    await expect(
      letInAtDoorAction({ eventId: EVENT, guestId: "x" }),
    ).resolves.toEqual(BAD);
    await expect(
      declineAtDoorAction({
        eventId: EVENT,
        guestId: GUEST,
        userId: "someone",
      }),
    ).resolves.toEqual(BAD);
    await expect(
      addInvitesAction({ eventId: EVENT, emails: [] }),
    ).resolves.toEqual(BAD);
    await expect(
      addInvitesAction({ eventId: EVENT, emails: Array(2001).fill("a@b.co") }),
    ).resolves.toEqual(BAD);
    await expect(
      removeInviteAction({ eventId: "nope", email: "a@b.co" }),
    ).resolves.toEqual(BAD);
    expect(letInAtDoor).not.toHaveBeenCalled();
    expect(blockFromEvent).not.toHaveBeenCalled();
    expect(addEventInvites).not.toHaveBeenCalled();
    expect(removeEventInvite).not.toHaveBeenCalled();
  });

  it("let in writes through let_in_at_door and refreshes every room it changes", async () => {
    letInAtDoor.mockResolvedValue({
      ok: true,
      data: { admitted: 2, already: false },
    });
    await expect(
      letInAtDoorAction({ eventId: EVENT, guestId: GUEST }),
    ).resolves.toEqual({
      ok: true,
      admitted: 2,
    });
    expect(letInAtDoor).toHaveBeenCalledWith(EVENT, GUEST);
    expect(revalidatePath).toHaveBeenCalledWith(`/dashboard/${EVENT}`);
  });

  it("★ a decline is a block: her account on every device where she has one, else the row", async () => {
    blockFromEvent.mockResolvedValue({
      ok: true,
      data: { eventId: EVENT, blockId: BLOCK, removed: 0, already: false },
    });
    await expect(
      declineAtDoorAction({ eventId: EVENT, guestId: GUEST, userId: USER }),
    ).resolves.toEqual({ ok: true, blockId: BLOCK });
    expect(blockFromEvent).toHaveBeenLastCalledWith(
      { kind: "account", eventId: EVENT, userId: USER },
      { requireVerifiedEmail: false },
    );
    await declineAtDoorAction({ eventId: EVENT, guestId: GUEST, userId: null });
    expect(blockFromEvent).toHaveBeenLastCalledWith(
      { kind: "row", guestId: GUEST },
      { requireVerifiedEmail: false },
    );
  });

  it("the list's writes pass the database's count and words on", async () => {
    addEventInvites.mockResolvedValue({
      ok: true,
      data: { added: 2, already: 1, invalid: 0, overCap: 0, total: 24 },
    });
    await expect(
      addInvitesAction({
        eventId: EVENT,
        emails: ["maya@example.com", "jay@example.com", "sam@example.com"],
      }),
    ).resolves.toEqual({
      ok: true,
      result: { added: 2, already: 1, invalid: 0, overCap: 0, total: 24 },
    });
    removeEventInvite.mockResolvedValue({
      ok: false,
      code: "not_found",
      message: "That event is no longer available.",
    });
    await expect(
      removeInviteAction({ eventId: EVENT, email: "maya@example.com" }),
    ).resolves.toEqual({
      ok: false,
      message: "That event is no longer available.",
    });
    expect(captureError).not.toHaveBeenCalled();
  });
});
