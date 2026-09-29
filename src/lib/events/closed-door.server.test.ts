/**
 * THE ONE CLOSED DOOR (Will's `door=private`, "Sneaky block"): a private album and a ticket a block
 * holds answer the same, with the same work. The routes' own tests pin that each answers a held
 * ticket as it answers a private album; this file pins the door itself: what it asks, when, and with
 * which ticket.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const isTicketBlocked = vi.fn();
vi.mock("@/lib/db/queries/event-blocks", () => ({
  isTicketBlocked: (...args: unknown[]) => isTicketBlocked(...args),
}));

let cookie: string | null = null;
vi.mock("@/lib/guest/session-cookie", () => ({
  // The real shape guard: 64 lowercase hex, what create_guest mints.
  isSessionTokenShape: (value: unknown) =>
    typeof value === "string" && /^[0-9a-f]{64}$/.test(value),
  readGuestSessionCookie: async () => cookie,
}));

const { isClosedDoor, isClosedToThisBrowser } =
  await import("@/lib/events/closed-door.server");

const OPEN = { id: "event-1", visibility: "open" as const };
const PASSWORD = { id: "event-1", visibility: "password" as const };
const PRIVATE = { id: "event-1", visibility: "private" as const };
const TICKET = "a".repeat(64);
const OTHER = "b".repeat(64);

beforeEach(() => {
  isTicketBlocked.mockReset();
  isTicketBlocked.mockResolvedValue(false);
  cookie = null;
});

describe("isClosedDoor", () => {
  it("a private album is closed; an open or password one with no ticket is not, and nothing is asked", async () => {
    await expect(isClosedDoor(PRIVATE, [])).resolves.toBe(true);
    await expect(isClosedDoor(OPEN, [])).resolves.toBe(false);
    await expect(isClosedDoor(PASSWORD, [null, undefined])).resolves.toBe(
      false,
    );
    expect(isTicketBlocked).not.toHaveBeenCalled();
  });

  it("a ticket a block holds closes an open or a password album", async () => {
    isTicketBlocked.mockResolvedValue(true);
    await expect(isClosedDoor(OPEN, [TICKET])).resolves.toBe(true);
    await expect(isClosedDoor(PASSWORD, [TICKET])).resolves.toBe(true);
    expect(isTicketBlocked).toHaveBeenCalledWith("event-1", [TICKET]);
  });

  it("a ticket no block holds leaves the album as it is", async () => {
    await expect(isClosedDoor(OPEN, [TICKET])).resolves.toBe(false);
  });

  it("★ asks on a PRIVATE album too, so a held ticket and a private album cost the same work", async () => {
    await expect(isClosedDoor(PRIVATE, [TICKET])).resolves.toBe(true);
    expect(isTicketBlocked).toHaveBeenCalledOnce();
    expect(isTicketBlocked).toHaveBeenCalledWith("event-1", [TICKET]);
  });

  it("★ only a real token shape is ever sent, once each", async () => {
    await isClosedDoor(OPEN, [
      TICKET,
      TICKET,
      "not-a-token",
      TICKET.toUpperCase(),
      `${TICKET} `,
      42,
      { token: TICKET },
      OTHER,
    ]);
    expect(isTicketBlocked).toHaveBeenCalledWith("event-1", [TICKET, OTHER]);
  });

  it("nothing shaped like a token asks nothing, even on a private album", async () => {
    await expect(isClosedDoor(PRIVATE, ["short", ""])).resolves.toBe(true);
    expect(isTicketBlocked).not.toHaveBeenCalled();
  });

  it("a failed ask fails loudly rather than opening the door", async () => {
    isTicketBlocked.mockRejectedValue(new Error("db down"));
    await expect(isClosedDoor(OPEN, [TICKET])).rejects.toThrow("db down");
  });
});

describe("isClosedToThisBrowser: the read door, by this browser's cookie", () => {
  it("asks with this event's cookie ticket", async () => {
    cookie = TICKET;
    isTicketBlocked.mockResolvedValue(true);
    await expect(isClosedToThisBrowser(OPEN)).resolves.toBe(true);
    expect(isTicketBlocked).toHaveBeenCalledWith("event-1", [TICKET]);
  });

  it("no cookie asks nothing: an open album stays open, a private one stays shut", async () => {
    await expect(isClosedToThisBrowser(OPEN)).resolves.toBe(false);
    await expect(isClosedToThisBrowser(PRIVATE)).resolves.toBe(true);
    expect(isTicketBlocked).not.toHaveBeenCalled();
  });
});
