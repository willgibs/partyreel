/**
 * THE GUESTS ROOM, AS IT STANDS OVER THE HUB (event-header r2, `rooms=over`): its sections in their order, the
 * addresses handed to the one list allowed them, Invite the main action only while the room is empty, and a link into
 * a section landing on it. Its panel titles it, so it draws no heading of its own. The sections are their own tests';
 * here they are stood in for and what each is handed is pinned.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GuestsRoomData } from "./room.server";

const handed = vi.hoisted(() => ({
  list: [] as Record<string, unknown>[],
  invite: [] as Record<string, unknown>[],
}));
vi.mock("./at-the-door", () => ({
  AtTheDoor: ({ total }: { total: number }) => (
    <section id="at-the-door" aria-label="At the door">
      {total}
    </section>
  ),
}));
vi.mock("./invited-section", () => ({
  InvitedSection: ({ listIsTheDoor }: { listIsTheDoor: boolean }) => (
    <section
      id="invited"
      aria-label="Invited"
      data-door={String(listIsTheDoor)}
    />
  ),
}));
vi.mock("./guests-invite", () => ({
  GuestsInvite: (props: Record<string, unknown>) => {
    handed.invite.push(props);
    return <button type="button">Invite</button>;
  },
}));
vi.mock("@/components/app/event-blocks/blocked-section", () => ({
  BlockedSection: () => <section aria-label="Blocked" />,
}));
vi.mock("@/components/social/guest-list", () => ({
  GuestList: (props: Record<string, unknown>) => {
    handed.list.push(props);
    return <ul aria-label="Guests list" />;
  },
}));

const { GuestsRoom } = await import("./guests-room");

const DATA: GuestsRoomData = {
  readAt: 1,
  items: [{ kind: "unverified", id: "g1", displayName: "Theo" }] as never,
  emails: [["u1", "maya@example.com"]],
  atTheDoor: [],
  doorTotal: 2,
  invited: [{ email: "a@b.co", joined: false }],
  blocked: [],
};

function room(data: GuestsRoomData = DATA, anchor: string | null = null) {
  return render(
    <GuestsRoom
      eventId="e1"
      eventName="Maya & Jay"
      joinUrl="https://partyreel.test/e/abc"
      qrStyle="classic"
      door="invite"
      data={data}
      anchor={anchor}
    />,
  );
}

beforeEach(() => {
  handed.list.length = 0;
  handed.invite.length = 0;
});

describe("the Guests room over the hub", () => {
  it("stands its sections in order: At the door, the guests, Invited, Blocked; no heading of its own", () => {
    room();
    const order = [...document.querySelectorAll("section, ul")].map((el) =>
      el.getAttribute("aria-label"),
    );
    expect(order).toEqual(["At the door", "Guests list", "Invited", "Blocked"]);
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.getByLabelText("Invited")).toHaveAttribute(
      "data-door",
      "true",
    );
  });

  it("★ hands the addresses and Block to its one list, as the room alone may", () => {
    room();
    const props = handed.list.at(-1)!;
    expect(props.emails).toEqual(new Map([["u1", "maya@example.com"]]));
    expect(props.blockFrom).toEqual({ eventId: "e1" });
  });

  it("makes Invite its main action only while it is empty", () => {
    room();
    expect(handed.invite.at(-1)).toMatchObject({ prominent: false });
    room({ ...DATA, items: [], doorTotal: 0, invited: [] });
    expect(handed.invite.at(-1)).toMatchObject({ prominent: true });
    expect(
      screen.getByText(/nobody has added photos yet/i),
    ).toBeInTheDocument();
  });

  it("★ lands on the section its opener's link named", () => {
    const scrolled = vi.fn();
    Element.prototype.scrollIntoView = scrolled;
    room(DATA, "invited");
    expect(scrolled).toHaveBeenCalledTimes(1);
    expect(scrolled.mock.contexts[0]).toBe(screen.getByLabelText("Invited"));
  });
});
