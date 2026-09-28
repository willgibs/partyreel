/**
 * THE MOMENT'S COUNT OF EVENTS WAITING UNDER HER EMAIL (`identity-claims` r3, Will's `pointer=line`).
 * Pinned: the count is the dashboard banner's own list (the caller's confirmed address, re-verified
 * inside it), a token that is not one reaches no read, the album on screen is never one of the
 * OTHER events, nothing waiting costs one read, only a number leaves, and any failure is 0 and said
 * where failures are read.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const getMyClaimableGuestRows = vi.fn();
vi.mock("@/lib/db/queries/claims", () => ({
  getMyClaimableGuestRows: (...args: unknown[]) =>
    getMyClaimableGuestRows(...args),
}));
const getEventByQrToken = vi.fn();
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrToken: (...args: unknown[]) => getEventByQrToken(...args),
}));
const captureError = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...args: unknown[]) => captureError(...args),
}));

const { countWaitingEventsAction } =
  await import("@/lib/guest/confirm-beat-action");

const HERE = "0fd56a19-ad5c-4599-8ed9-319520fd1f7a";
const row = (eventId: string) => ({
  eventId,
  eventName: `Event ${eventId.slice(0, 4)}`,
  eventDate: null,
  names: ["Priya"],
  uploadCount: 3,
  lastUploadAt: "2026-09-27T10:00:00Z",
  gate: null,
  previews: [],
});

beforeEach(() => {
  vi.clearAllMocks();
  getMyClaimableGuestRows.mockResolvedValue([]);
  getEventByQrToken.mockResolvedValue({ ok: true, data: { id: HERE } });
});

describe("countWaitingEventsAction", () => {
  it("counts the events waiting under her email, from the banner's own list", async () => {
    getMyClaimableGuestRows.mockResolvedValue([
      row("a1a1a1a1"),
      row("b2b2b2b2"),
      row("c3c3c3c3"),
    ]);
    await expect(countWaitingEventsAction("qr-here")).resolves.toBe(3);
    // The list without its previews: nothing is presigned for a count.
    expect(getMyClaimableGuestRows).toHaveBeenCalledWith();
    expect(getEventByQrToken).toHaveBeenCalledWith("qr-here");
  });

  it("★ the album on screen is never one of the other events, even when rows wait there too", async () => {
    getMyClaimableGuestRows.mockResolvedValue([
      row("a1a1a1a1"),
      row(HERE),
      row("b2b2b2b2"),
    ]);
    await expect(countWaitingEventsAction("qr-here")).resolves.toBe(2);

    getMyClaimableGuestRows.mockResolvedValue([row(HERE)]);
    await expect(countWaitingEventsAction("qr-here")).resolves.toBe(0);
  });

  it("nothing waiting (or signed out, or an unconfirmed address: the list's own gate) is one read", async () => {
    await expect(countWaitingEventsAction("qr-here")).resolves.toBe(0);
    expect(getMyClaimableGuestRows).toHaveBeenCalledTimes(1);
    expect(getEventByQrToken).not.toHaveBeenCalled();
  });

  it.each([
    ["nothing", undefined],
    ["an empty token", ""],
    ["a number", 42],
    ["a list", ["qr-here", "qr-other"]],
    ["an object", { qr: "qr-here" }],
    ["an overlong token", "q".repeat(201)],
  ])("%s reaches no read", async (_, token) => {
    await expect(countWaitingEventsAction(token)).resolves.toBe(0);
    expect(getMyClaimableGuestRows).not.toHaveBeenCalled();
    expect(getEventByQrToken).not.toHaveBeenCalled();
  });

  it("a token that names no album says nothing", async () => {
    getMyClaimableGuestRows.mockResolvedValue([row("a1a1a1a1")]);
    getEventByQrToken.mockResolvedValue({ ok: false, code: "not_found" });
    await expect(countWaitingEventsAction("qr-gone")).resolves.toBe(0);
  });

  it("only a number leaves: never a name, an event id or a key", async () => {
    getMyClaimableGuestRows.mockResolvedValue([
      { ...row("a1a1a1a1"), previews: ["https://r2.example/key?sig"] },
    ]);
    const answer = await countWaitingEventsAction("qr-here");
    expect(answer).toBe(1);
    expect(typeof answer).toBe("number");
  });

  it("a failed read answers 0 and is captured where failures are read", async () => {
    const failure = new Error("list_guest_rows_by_email failed");
    getMyClaimableGuestRows.mockRejectedValue(failure);
    await expect(countWaitingEventsAction("qr-here")).resolves.toBe(0);
    expect(captureError).toHaveBeenCalledWith("account", failure, {
      seam: "moment_waiting",
    });

    captureError.mockClear();
    getMyClaimableGuestRows.mockResolvedValue([row("a1a1a1a1")]);
    getEventByQrToken.mockRejectedValue(new Error("rpc failed"));
    await expect(countWaitingEventsAction("qr-here")).resolves.toBe(0);
    expect(captureError).toHaveBeenCalledTimes(1);
  });
});
