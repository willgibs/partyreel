/**
 * THE DOOR, ON THE SERVER (the doors, event-settings r1; the one closed door of event-safety r1 grown
 * into every door). The decision table is `decide.test.ts`'s; the routes' tests pin each route's answer
 * to it. This file pins the door itself: who it asks about (the account, the tickets, shape-checked),
 * when it asks at all (a shut album, a gated one and a held ticket cost the same read), what it shows of
 * the event at each answer, and the pass it issues.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GuestEvent } from "@/lib/db/queries/guest-events";
import type { DoorStanding } from "@/lib/event/door/decide";

vi.mock("server-only", () => ({}));

const readDoorStanding = vi.fn();
const readDoorEventDetails = vi.fn();
const readTicketsBlocked = vi.fn();
vi.mock("@/lib/db/queries/event-doors", () => ({
  readDoorStanding: (...args: unknown[]) => readDoorStanding(...args),
  readDoorEventDetails: (...args: unknown[]) => readDoorEventDetails(...args),
  readTicketsBlocked: (...args: unknown[]) => readTicketsBlocked(...args),
}));

// Whose the tickets a signed-in request carries are to her is `session-owner.server.ts`'s (its own pins);
// here the answer is handed in: by default every ticket is hers, and a test sets some aside.
const sortTickets = vi.fn();
vi.mock("@/lib/guest/session-owner.server", () => ({
  sortTickets: (...args: unknown[]) => sortTickets(...args),
}));

const getEventByQrToken = vi.fn();
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrToken: (...args: unknown[]) => getEventByQrToken(...args),
}));

let cookie: string | null = null;
vi.mock("@/lib/guest/session-cookie", () => ({
  // The real shape guard: 64 lowercase hex, what create_guest mints.
  isSessionTokenShape: (value: unknown) =>
    typeof value === "string" && /^[0-9a-f]{64}$/.test(value),
  readGuestSessionCookie: vi.fn(async () => cookie),
}));

let userId: string | null = null;
const getRequestAuth = vi.fn(async () => ({
  user: userId ? { id: userId } : null,
}));
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: () => getRequestAuth(),
}));

const { doorCallerFor, isShut, isThrough, pageDoor, resolveGuestDoor } =
  await import("@/lib/events/closed-door.server");
const { holdsDoorPass } = await import("@/lib/event/door/pass.server");
const { readGuestSessionCookie } = await import("@/lib/guest/session-cookie");

const EVENT_ID = "11111111-2222-4333-8444-555555555555";
const TICKET = "a".repeat(64);
const OTHER = "b".repeat(64);

function event(over: Partial<GuestEvent> = {}): GuestEvent {
  return {
    id: EVENT_ID,
    qr_token: "0123456789abcdef0123456789abcdef",
    name: "Maya's 30th",
    description: "Bring a sweater",
    moderation_mode: "live",
    visibility: "open",
    has_password: false,
    accepting_uploads: true,
    require_verified_email: false,
    require_upload_to_view: false,
    event_date: "2026-10-10",
    qr_style: "classic",
    host_display_name: "Maya",
    custom_slug: null,
    show_reel: true,
    reel_style_id: null,
    reel_hold_sec: null,
    accepts_video: true,
    ...over,
  };
}

/** A gated album as the anon read returns it: stored private, its name and metadata redacted. */
function gatedRead(): GuestEvent {
  return event({
    visibility: "private",
    name: "",
    description: null,
    event_date: null,
    host_display_name: null,
  });
}

function standing(over: Partial<DoorStanding> = {}): DoorStanding {
  return {
    found: true,
    door: "open",
    host: false,
    blocked: false,
    wasIn: false,
    in: false,
    waiting: false,
    listed: false,
    confirmed: false,
    ...over,
  };
}

const DETAILS = {
  name: "Maya's 30th",
  description: "Bring a sweater",
  eventDate: "2026-10-10",
  customSlug: "mayas-30th",
  hostDisplayName: "Maya",
};

beforeEach(() => {
  vi.clearAllMocks();
  cookie = null;
  userId = null;
  readDoorStanding.mockResolvedValue(standing());
  readDoorEventDetails.mockResolvedValue(DETAILS);
  readTicketsBlocked.mockResolvedValue(false);
  sortTickets.mockImplementation(
    async (_viewer: string | null, tickets: readonly string[]) => ({
      hers: [...tickets],
      others: [],
    }),
  );
});

describe("who is asking: the account and the tickets, shape-checked", () => {
  it("reads the account and this event's cookie, and keeps each real ticket once", async () => {
    userId = "user-1";
    cookie = TICKET;
    const caller = await doorCallerFor(EVENT_ID, {
      bodyTokens: [
        TICKET,
        OTHER,
        OTHER,
        "not-a-token",
        TICKET.toUpperCase(),
        `${TICKET} `,
        42,
        null,
        undefined,
        { token: TICKET },
      ],
    });
    expect(caller).toEqual({ userId: "user-1", tickets: [TICKET, OTHER] });
    expect(readGuestSessionCookie).toHaveBeenCalledWith(EVENT_ID);
  });

  it("★ a write route's door never reads the cookie (cookie: false), and can leave the account out", async () => {
    cookie = TICKET;
    userId = "user-1";
    const caller = await doorCallerFor(EVENT_ID, {
      bodyTokens: [OTHER],
      cookie: false,
      account: false,
    });
    expect(caller).toEqual({ userId: null, tickets: [OTHER] });
    expect(readGuestSessionCookie).not.toHaveBeenCalled();
    expect(getRequestAuth).not.toHaveBeenCalled();
  });
});

/**
 * A SIGNED-IN ACCOUNT'S DOOR READS HER OWN TICKETS (crumbs-27, the read side of crumbs-26's owner rule). The
 * standing counts the account and the tickets together, so on a shared phone the account was let in, held or
 * (for a name-only album's gate) waiting through whichever ticket the phone kept for the album, another guest's
 * included. The write routes already refused that ticket as somebody else's; the door now reads only tickets
 * that may speak for her (`sortTickets`: her own rows, or one the claim takes).
 */
describe("★ a signed-in account's door carries only the tickets that are hers", () => {
  it("sets aside a ticket the phone kept that is not hers: the standing never sees it, and it can neither let her in nor hold her", async () => {
    userId = "user-1";
    cookie = TICKET;
    sortTickets.mockResolvedValue({ hers: [], others: [TICKET] });
    const caller = await doorCallerFor(EVENT_ID);
    expect(caller).toEqual({ userId: "user-1", tickets: [] });
    expect(sortTickets).toHaveBeenCalledWith("user-1", [TICKET]);
  });

  it("keeps the ones that are hers and sets aside the rest, in order", async () => {
    userId = "user-1";
    cookie = TICKET;
    sortTickets.mockResolvedValue({ hers: [OTHER], others: [TICKET] });
    const caller = await doorCallerFor(EVENT_ID, { bodyTokens: [OTHER] });
    expect(caller).toEqual({ userId: "user-1", tickets: [OTHER] });
  });

  it("★ a block on a ticket she may not speak through still holds the phone: a typed name's block holds on the browser that used it", async () => {
    userId = "user-1";
    cookie = TICKET;
    sortTickets.mockResolvedValue({ hers: [], others: [TICKET] });
    readTicketsBlocked.mockResolvedValue(true);
    const caller = await doorCallerFor(EVENT_ID);
    // The ticket stays in the caller, so the standing reads its block (and only its block, since a blocked
    // ticket shuts the door whatever else it says).
    expect(caller).toEqual({ userId: "user-1", tickets: [TICKET] });
    expect(readTicketsBlocked).toHaveBeenCalledWith(EVENT_ID, [TICKET]);
  });

  it("asks whether a block holds a ticket only when one was set aside", async () => {
    userId = "user-1";
    cookie = TICKET;
    await doorCallerFor(EVENT_ID);
    expect(readTicketsBlocked).not.toHaveBeenCalled();
  });

  it("signed out, every ticket is the device's: nothing is sorted and nothing more is read", async () => {
    cookie = TICKET;
    const caller = await doorCallerFor(EVENT_ID, { bodyTokens: [OTHER] });
    expect(caller).toEqual({ userId: null, tickets: [OTHER, TICKET] });
    expect(sortTickets).not.toHaveBeenCalled();
    expect(readTicketsBlocked).not.toHaveBeenCalled();
  });

  it("with no ticket there is nothing to sort, signed in or not", async () => {
    userId = "user-1";
    await expect(doorCallerFor(EVENT_ID)).resolves.toEqual({
      userId: "user-1",
      tickets: [],
    });
    expect(sortTickets).not.toHaveBeenCalled();
  });

  it("a failed block read fails loudly rather than reading the phone as clean", async () => {
    userId = "user-1";
    cookie = TICKET;
    sortTickets.mockResolvedValue({ hers: [], others: [TICKET] });
    readTicketsBlocked.mockRejectedValue(new Error("db down"));
    await expect(doorCallerFor(EVENT_ID)).rejects.toThrow("db down");
  });
});

describe("when the door asks: the same read for every door that could shut or hold", () => {
  it("a signed-out stranger with no ticket at an open or password album costs nothing", async () => {
    const open = await resolveGuestDoor(event(), { userId: null, tickets: [] });
    const password = await resolveGuestDoor(event({ visibility: "password" }), {
      userId: null,
      tickets: [],
    });
    expect(open.decision).toEqual({ kind: "through", admitted: false });
    expect(password.decision).toEqual({ kind: "through", admitted: false });
    expect(readDoorStanding).not.toHaveBeenCalled();
  });

  it("★ a private-reading album is always asked, so Only me, a gate and a block cost one read", async () => {
    readDoorStanding.mockResolvedValue(standing({ door: "private" }));
    const door = await resolveGuestDoor(gatedRead(), {
      userId: null,
      tickets: [],
    });
    expect(readDoorStanding).toHaveBeenCalledOnce();
    expect(readDoorStanding).toHaveBeenCalledWith(EVENT_ID, {
      userId: null,
      tickets: [],
    });
    expect(isShut(door)).toBe(true);
  });

  it("a ticket or an account asks at an open album too, and a block shuts it", async () => {
    readDoorStanding.mockResolvedValue(standing({ blocked: true }));
    const door = await resolveGuestDoor(event(), {
      userId: null,
      tickets: [TICKET],
    });
    expect(readDoorStanding).toHaveBeenCalledWith(EVENT_ID, {
      userId: null,
      tickets: [TICKET],
    });
    expect(door.decision).toEqual({ kind: "shut", previous: false });
    expect(isThrough(door)).toBe(false);
  });

  it("a failed read fails loudly rather than opening the door", async () => {
    readDoorStanding.mockRejectedValue(new Error("db down"));
    await expect(
      resolveGuestDoor(event(), { userId: "user-1", tickets: [] }),
    ).rejects.toThrow("db down");
  });
});

describe("what the door shows of the event", () => {
  it("★ the shut door shows nothing and carries no pass", async () => {
    readDoorStanding.mockResolvedValue(standing({ door: "closed" }));
    const door = await resolveGuestDoor(gatedRead(), {
      userId: "user-1",
      tickets: [],
    });
    expect(door.decision.kind).toBe("shut");
    expect(door.event.name).toBe("");
    expect(door.event.host_display_name).toBeNull();
    expect(door.event.doorPass).toBeNull();
    expect(readDoorEventDetails).not.toHaveBeenCalled();
  });

  it("★ a door she stands at shows the album's name and its host, and nothing the album holds", async () => {
    readDoorStanding.mockResolvedValue(standing({ door: "approve" }));
    const door = await resolveGuestDoor(gatedRead(), {
      userId: null,
      tickets: [],
    });
    expect(door.decision).toEqual({ kind: "newcomer", gate: "approve" });
    expect(door.event.name).toBe("Maya's 30th");
    expect(door.event.host_display_name).toBe("Maya");
    expect(door.event.description).toBeNull();
    expect(door.event.event_date).toBeNull();
    expect(door.event.custom_slug).toBeNull();
    expect(door.event.door).toBe("approve");
    expect(holdsDoorPass(door.event)).toBe(false);
  });

  it("★ someone let in goes through with the album's details and a pass for this album alone", async () => {
    readDoorStanding.mockResolvedValue(
      standing({ door: "invite", in: true, confirmed: true }),
    );
    const door = await resolveGuestDoor(gatedRead(), {
      userId: "user-1",
      tickets: [],
    });
    expect(door.decision).toEqual({ kind: "through", admitted: true });
    expect(door.event.name).toBe("Maya's 30th");
    expect(door.event.description).toBe("Bring a sweater");
    expect(door.event.custom_slug).toBe("mayas-30th");
    expect(holdsDoorPass(door.event)).toBe(true);
    // A pass names its event: carried onto another album it opens nothing.
    expect(holdsDoorPass({ ...door.event, id: "another-event" })).toBe(false);
    // And a pass is an object the door made, never a shape: a copy holds nothing.
    expect(
      holdsDoorPass({ ...door.event, doorPass: { eventId: EVENT_ID } }),
    ).toBe(false);
  });

  it("★ a password album's newcomer keeps the password step's own redaction, and no pass", async () => {
    readDoorStanding.mockResolvedValue(standing({ door: "password" }));
    const redacted = event({
      visibility: "password",
      description: null,
      event_date: null,
      host_display_name: null,
    });
    const door = await resolveGuestDoor(redacted, {
      userId: "user-1",
      tickets: [],
    });
    expect(door.decision).toEqual({ kind: "through", admitted: false });
    expect(door.event.host_display_name).toBeNull();
    expect(readDoorEventDetails).not.toHaveBeenCalled();
    // The password album's reads take a pass in place of the unlock cookie: a pass here would open
    // the album without its password.
    expect(holdsDoorPass(door.event)).toBe(false);
  });

  it("★ someone already in at a password album passes it, the album's details re-read for her", async () => {
    readDoorStanding.mockResolvedValue(
      standing({ door: "password", in: true, wasIn: true }),
    );
    const redacted = event({
      visibility: "password",
      description: null,
      event_date: null,
      host_display_name: null,
    });
    const door = await resolveGuestDoor(redacted, {
      userId: null,
      tickets: [TICKET],
    });
    expect(door.decision).toEqual({ kind: "through", admitted: true });
    expect(door.event.host_display_name).toBe("Maya");
    expect(holdsDoorPass(door.event)).toBe(true);
  });

  it("an open album needs no re-read, and a stranger there carries no pass", async () => {
    const door = await resolveGuestDoor(event(), {
      userId: "user-1",
      tickets: [],
    });
    expect(door.event.name).toBe("Maya's 30th");
    expect(readDoorEventDetails).not.toHaveBeenCalled();
    expect(holdsDoorPass(door.event)).toBe(false);
  });

  it("the host goes through every door, with a pass", async () => {
    readDoorStanding.mockResolvedValue(
      standing({ door: "private", host: true }),
    );
    const door = await resolveGuestDoor(event({ visibility: "private" }), {
      userId: "host-1",
      tickets: [],
    });
    expect(door.decision).toEqual({ kind: "through", admitted: true });
    expect(holdsDoorPass(door.event)).toBe(true);
  });
});

describe("the page's door", () => {
  it("resolves the link, then the door, with this request's own caller", async () => {
    getEventByQrToken.mockResolvedValue({ ok: true, data: event() });
    userId = "user-1";
    cookie = TICKET;
    const door = await pageDoor("some-token");
    expect(getEventByQrToken).toHaveBeenCalledWith("some-token");
    expect(readDoorStanding).toHaveBeenCalledWith(EVENT_ID, {
      userId: "user-1",
      tickets: [TICKET],
    });
    expect(door?.decision.kind).toBe("through");
  });

  it("a link that names no live event has no door", async () => {
    getEventByQrToken.mockResolvedValue({ ok: false, code: "not_found" });
    await expect(pageDoor("nothing-here")).resolves.toBeNull();
    expect(readDoorStanding).not.toHaveBeenCalled();
  });
});
