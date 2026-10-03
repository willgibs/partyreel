/**
 * HER WAITING UPLOADS, KNOWN BEFORE THE FIRST PAINT (crumbs-43): the page's one read for a returning guest on an
 * empty album that holds uploads. What is pinned is whose rows it reads (the ticket only as far as it is hers to a
 * signed-in viewer, and her account's), that only a WAITING row counts, and that a visitor with neither a ticket nor
 * an account costs no read at all. The reads themselves are `readOwnUploads`' and `sortTickets`' own contracts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const readOwnUploads = vi.hoisted(() => vi.fn());
const sortTickets = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db/mutations/guest-media", () => ({ readOwnUploads }));
vi.mock("@/lib/guest/session-owner.server", () => ({ sortTickets }));

const { hasWaitingUploads } =
  await import("@/lib/guest/waiting-on-arrival.server");

const EVENT = "11111111-2222-4333-8444-555555555555";
const TICKET = "a".repeat(64);

beforeEach(() => {
  vi.clearAllMocks();
  sortTickets.mockImplementation(
    async (_viewer: string | null, tickets: string[]) => ({
      hers: tickets,
      others: [],
    }),
  );
});

describe("hasWaitingUploads", () => {
  it("reads the ticket's rows signed out, and says yes for one waiting for the host", async () => {
    readOwnUploads.mockResolvedValue({
      items: [
        { id: "m1", status: "refused" },
        { id: "m2", status: "pending" },
      ],
      news: [],
    });
    await expect(
      hasWaitingUploads({ eventId: EVENT, userId: null, ticket: TICKET }),
    ).resolves.toBe(true);
    expect(readOwnUploads).toHaveBeenCalledWith({
      eventId: EVENT,
      sessionToken: TICKET,
      userId: null,
    });
  });

  it("counts only a waiting row: in the album or not approved is no reason to move her Add", async () => {
    readOwnUploads.mockResolvedValue({
      items: [
        { id: "m1", status: "approved" },
        { id: "m2", status: "refused" },
      ],
      news: [],
    });
    await expect(
      hasWaitingUploads({ eventId: EVENT, userId: null, ticket: TICKET }),
    ).resolves.toBe(false);
  });

  it("★ a shot sealed until the album develops waits too: approved, and in nobody's album yet (red-team 43)", async () => {
    readOwnUploads.mockResolvedValue({
      items: [{ id: "m1", status: "approved", sealed: true }],
      news: [],
    });
    await expect(
      hasWaitingUploads({ eventId: EVENT, userId: null, ticket: TICKET }),
    ).resolves.toBe(true);
  });

  it("a ticket that is not hers is set aside for a signed-in viewer, whose account's rows still count", async () => {
    sortTickets.mockResolvedValue({ hers: [], others: [TICKET] });
    readOwnUploads.mockResolvedValue({
      items: [{ id: "m1", status: "pending" }],
      news: [],
    });
    await expect(
      hasWaitingUploads({ eventId: EVENT, userId: "u1", ticket: TICKET }),
    ).resolves.toBe(true);
    expect(sortTickets).toHaveBeenCalledWith("u1", [TICKET]);
    expect(readOwnUploads).toHaveBeenCalledWith({
      eventId: EVENT,
      sessionToken: null,
      userId: "u1",
    });
  });

  it("a visitor with neither a ticket nor an account costs no read", async () => {
    await expect(
      hasWaitingUploads({ eventId: EVENT, userId: null, ticket: null }),
    ).resolves.toBe(false);
    expect(readOwnUploads).not.toHaveBeenCalled();
    expect(sortTickets).not.toHaveBeenCalled();
  });
});
