import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

/**
 * WHAT THE GUESTS ROOM READS, AND WHOSE COLOUR EACH PERSON WEARS (small-fixes, "the name-only guest's hashvatar"):
 * every person the room draws is one colour, by the same one-way hash, wherever she is drawn. A confirmed person is
 * her account's; a name-only person (a typed name, or a newcomer at the door with no account) is her own guest
 * ROW's, never her name; nothing a browser is handed beyond the id it already held is raw.
 */

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/avatar-storage", () => ({
  getAvatarUrl: async () => null,
}));

const reads = vi.hoisted(() => ({
  list: vi.fn(),
  waiting: vi.fn(),
  blocks: vi.fn(),
  queue: vi.fn(),
  invites: vi.fn(),
  addresses: vi.fn(),
}));
vi.mock("@/lib/db/queries/social", () => ({
  getEventGuestList: reads.list,
  countWaitingGuestShots: reads.waiting,
}));
vi.mock("@/lib/db/queries/event-blocks", () => ({
  getEventBlocks: reads.blocks,
}));
vi.mock("@/lib/db/queries/event-doors", () => ({
  getDoorQueue: reads.queue,
  getInviteList: reads.invites,
}));
vi.mock("@/lib/db/queries/guest-addresses", () => ({
  getConfirmedGuestAddresses: reads.addresses,
}));

const { readGuestsRoom } = await import("./room.server");

const seed = (id: string) => createHash("sha256").update(id).digest("hex");

function reading({
  list = [] as unknown[],
  people = [] as unknown[],
  waiting = 0,
} = {}) {
  reads.list.mockResolvedValue(list);
  reads.waiting.mockResolvedValue(waiting);
  reads.blocks.mockResolvedValue([]);
  reads.queue.mockResolvedValue({ total: people.length, people });
  reads.invites.mockResolvedValue([]);
  reads.addresses.mockResolvedValue(new Map());
}

const door = (over: Record<string, unknown>) => ({
  guestId: "g-1",
  userId: null,
  name: null,
  email: "ask@example.com",
  askedAt: "2026-10-04T10:00:00.000Z",
  seenAt: null,
  ...over,
});

describe("the Guests room's colours", () => {
  it("★ a name-only guest in the list wears her own row's colour, hashed", async () => {
    reading({
      list: [
        { kind: "unverified", id: "g-sam-1", displayName: "Sam" },
        { kind: "unverified", id: "g-sam-2", displayName: "Sam" },
      ],
    });
    const room = await readGuestsRoom("ev-1", "UTC");
    const sams = room.items.filter((i) => "kind" in i);
    expect(sams.map((s) => s.seed)).toEqual([seed("g-sam-1"), seed("g-sam-2")]);
    // Two people who typed one name are two colours, and the raw row id is never the seed.
    expect(sams[0].seed).not.toBe(sams[1].seed);
    expect(JSON.stringify(room)).not.toContain(seed("Sam"));
  });

  it("★ a newcomer at the door with no account wears her own row's colour; one with an account wears hers", async () => {
    reading({
      people: [
        door({ guestId: "g-ask", userId: null }),
        door({ guestId: "g-first", userId: "u-leah", name: "Leah" }),
      ],
    });
    const room = await readGuestsRoom("ev-1", "UTC");
    const [ask, leah] = room.atTheDoor;
    expect(ask.seed).toBe(seed("g-ask"));
    // An account's colour is its own, whatever row it first asked on (a claim turns the row's to this one).
    expect(leah.seed).toBe(seed("u-leah"));
    expect(leah.seed).not.toBe(seed("g-first"));
  });

  it("hands the browser no raw id it does not already hold: the door's guest id was its own, the seeds are hashes", async () => {
    reading({ people: [door({ guestId: "g-ask" })] });
    const room = await readGuestsRoom("ev-1", "UTC");
    expect(room.atTheDoor[0].seed).toMatch(/^[0-9a-f]{64}$/);
    expect(room.atTheDoor[0].seed).not.toBe("g-ask");
  });
});

// ★ A SEALED ALBUM'S ROOM TELLS WHAT WAITS (crumbs-81). A guest whose only approved shots wait for the develop is on no
// list yet (the one count's rule), so the list alone reads as an album nobody has added to; the room carries the number
// of shots that wait beside it, read in the same one read so the two can never describe different rooms.
describe("the Guests room's waiting shots", () => {
  it("★ carries the count of shots a sealed album holds, beside the list that cannot show their guests", async () => {
    reading({ waiting: 42 });
    const room = await readGuestsRoom("ev-1", "UTC");
    expect(room.items).toEqual([]);
    expect(room.waiting).toBe(42);
  });

  it("reads it for the event the room is read for, and says none for an album that holds nothing", async () => {
    reading();
    const room = await readGuestsRoom("ev-7", "UTC");
    expect(reads.waiting).toHaveBeenCalledWith("ev-7");
    expect(room.waiting).toBe(0);
  });

  it("★ a count that fails fails the room's read, never an empty room that says nobody has added a photo", async () => {
    reading();
    reads.waiting.mockRejectedValue(new Error("down"));
    await expect(readGuestsRoom("ev-1", "UTC")).rejects.toThrow("down");
  });
});
