import { describe, expect, it, vi } from "vitest";

/**
 * THE GUESTS ROUTE IS A DOOR NOW (event-header r2, `rooms=over`): the Guests room stands over the hub on the hub's
 * own address, so `/dashboard/<id>/guests` (in histories, in a mail, in the sign-in's return, Settings' own links
 * pressed outside a hub) redirects there and reads nothing on the way. What the room reads is `room.server.ts`'s.
 */

vi.mock("server-only", () => ({}));
const redirect = vi.hoisted(() =>
  vi.fn((to: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { to });
  }),
);
vi.mock("next/navigation", () => ({ redirect }));
const reads = vi.hoisted(() => ({ event: vi.fn(), list: vi.fn() }));
vi.mock("@/lib/db/queries/events", () => ({ getEvent: reads.event }));
vi.mock("@/lib/db/queries/social", () => ({ getEventGuestList: reads.list }));

const { default: EventGuestsRedirect } = await import("./page");

describe("the Guests route", () => {
  it("★ opens the Guests room over the hub, reading nothing on the way", async () => {
    await expect(
      EventGuestsRedirect({ params: Promise.resolve({ eventId: "e1" }) }),
    ).rejects.toMatchObject({ to: "/dashboard/e1?room=guests" });
    expect(reads.event).not.toHaveBeenCalled();
    expect(reads.list).not.toHaveBeenCalled();
  });
});
