/**
 * YOURS, FOR THE ZIP, ON A SHARED PHONE (crumbs-27, the read side of crumbs-26's owner rule).
 *
 * The set is her account's rows and the unclaimed row this browser's ticket owns, unioned. A signed-in account's
 * Yours is her account's: the ticket the phone still holds for the album speaks for her only as far as it is hers
 * (her own row, or one the claim takes), or another guest's photographs went into the zip the Yours row called
 * hers, and into the summary that counted them.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const listAccountMediaIds = vi.fn();
const listSessionMediaIds = vi.fn();
vi.mock("@/lib/db/mutations/guest-media", () => ({
  listAccountMediaIds: (...a: unknown[]) => listAccountMediaIds(...a),
  listSessionMediaIds: (...a: unknown[]) => listSessionMediaIds(...a),
}));

// Whose a ticket is to a signed-in viewer is `session-owner.server.ts`'s (its own pins); here it is handed in.
const sortTickets = vi.fn();
vi.mock("@/lib/guest/session-owner.server", () => ({
  sortTickets: (...a: unknown[]) => sortTickets(...a),
}));

const { ownMediaIds } = await import("@/lib/export/yours.server");

const EVENT = "event-1";
const USER = "user-1";
const TICKET = "t".repeat(64);

beforeEach(() => {
  vi.clearAllMocks();
  listAccountMediaIds.mockResolvedValue(["acct-1", "acct-2"]);
  listSessionMediaIds.mockResolvedValue(["tick-1"]);
  sortTickets.mockImplementation(
    async (_viewer: string | null, tickets: readonly string[]) => ({
      hers: [...tickets],
      others: [],
    }),
  );
});

describe("ownMediaIds", () => {
  it("★ a signed-in account's ticket that is not hers adds nothing: her rows alone, and another guest's are never read", async () => {
    sortTickets.mockResolvedValue({ hers: [], others: [TICKET] });
    const own = await ownMediaIds({
      eventId: EVENT,
      userId: USER,
      sessionToken: TICKET,
    });
    expect(own).toEqual(new Set(["acct-1", "acct-2"]));
    expect(sortTickets).toHaveBeenCalledWith(USER, [TICKET]);
    expect(listSessionMediaIds).not.toHaveBeenCalled();
  });

  it("a ticket that is hers adds its rows beside her account's", async () => {
    const own = await ownMediaIds({
      eventId: EVENT,
      userId: USER,
      sessionToken: TICKET,
    });
    expect(own).toEqual(new Set(["acct-1", "acct-2", "tick-1"]));
    expect(listSessionMediaIds).toHaveBeenCalledWith({
      eventId: EVENT,
      sessionToken: TICKET,
    });
  });

  it("signed out, the ticket's rows are the device's, and nobody is asked whose it is", async () => {
    const own = await ownMediaIds({
      eventId: EVENT,
      userId: null,
      sessionToken: TICKET,
    });
    expect(own).toEqual(new Set(["tick-1"]));
    expect(sortTickets).toHaveBeenCalledWith(null, [TICKET]);
    expect(listAccountMediaIds).not.toHaveBeenCalled();
  });

  it("no account and no ticket is nothing, and nothing is read", async () => {
    const own = await ownMediaIds({
      eventId: EVENT,
      userId: null,
      sessionToken: null,
    });
    expect(own).toEqual(new Set());
    expect(sortTickets).not.toHaveBeenCalled();
    expect(listAccountMediaIds).not.toHaveBeenCalled();
    expect(listSessionMediaIds).not.toHaveBeenCalled();
  });

  it("an account with no ticket reads her rows and sorts nothing", async () => {
    const own = await ownMediaIds({
      eventId: EVENT,
      userId: USER,
      sessionToken: null,
    });
    expect(own).toEqual(new Set(["acct-1", "acct-2"]));
    expect(sortTickets).not.toHaveBeenCalled();
  });
});
