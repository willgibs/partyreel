/**
 * THE GUESTS ROOM, AS IT STANDS OVER THE HUB (event-header r2, `rooms=over`; guests-room r1, `rows=list`): its sections
 * in their order, the addresses and what each person added handed to the guests' rows alone, Invite the main action
 * only while the room is empty (and the guests' head's quiet one after), and a link into a section landing on it. Its
 * panel titles it, so it draws no heading of its own. The sections are their own tests'; here they are stood in for
 * and what each is handed is pinned.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GuestsRoomData } from "./room.server";

const handed = vi.hoisted(() => ({
  list: [] as Record<string, unknown>[],
  invite: [] as Record<string, unknown>[],
  invited: [] as Record<string, unknown>[],
}));
vi.mock("./at-the-door", () => ({
  AtTheDoor: ({ total }: { total: number }) => (
    <section id="at-the-door" aria-label="At the door">
      {total}
    </section>
  ),
}));
vi.mock("./invited-section", () => ({
  InvitedSection: (props: { listIsTheDoor: boolean }) => {
    handed.invited.push(props);
    return (
      <section
        id="invited"
        aria-label="Invited"
        data-door={String(props.listIsTheDoor)}
      />
    );
  },
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
// The guests' rows stand in as what they draw where nobody has added: the room's own line for why.
vi.mock("./room-guests", () => ({
  RoomGuests: (props: {
    items: unknown[];
    quiet: unknown[];
    empty: React.ReactNode;
    invite: React.ReactNode;
  }) => {
    handed.list.push(props);
    return (
      <section aria-label="Guests">
        {props.invite}
        {props.items.length === 0 ? props.empty : null}
      </section>
    );
  },
}));

const { GuestsRoom } = await import("./guests-room");

const DATA: GuestsRoomData = {
  readAt: 1,
  items: [{ kind: "unverified", id: "g1", displayName: "Theo" }] as never,
  waiting: 0,
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
  handed.invited.length = 0;
});

describe("the Guests room over the hub", () => {
  it("stands its sections in order: At the door, the guests, Invited, Blocked; no heading of its own", () => {
    room();
    const order = [...document.querySelectorAll("section")].map((el) =>
      el.getAttribute("aria-label"),
    );
    expect(order).toEqual(["At the door", "Guests", "Invited", "Blocked"]);
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.getByLabelText("Invited")).toHaveAttribute(
      "data-door",
      "true",
    );
  });

  it("★ hands the addresses, what each added and her relations to the guests' rows, as the room alone may", () => {
    room({
      ...DATA,
      added: [["g1", { photos: 3, videos: 1, since: "6:03 PM" }]],
      following: ["u1"],
      barred: ["u2"],
    });
    const { ctx } = handed.list.at(-1) as {
      ctx: Record<string, unknown>;
    };
    expect(ctx.eventId).toBe("e1");
    expect(ctx.emails).toEqual(new Map([["u1", "maya@example.com"]]));
    expect(ctx.added).toEqual(
      new Map([["g1", { photos: 3, videos: 1, since: "6:03 PM" }]]),
    );
    expect(ctx.following).toEqual(new Set(["u1"]));
    expect(ctx.barred).toEqual(new Set(["u2"]));
  });

  it("a read with none of the rows' facts (a stand-in's) draws them with nothing counted and nobody quiet", () => {
    room();
    const props = handed.list.at(-1) as {
      quiet: unknown[];
      ctx: { added: Map<string, unknown> };
    };
    expect(props.quiet).toEqual([]);
    expect(props.ctx.added.size).toBe(0);
  });

  it("★ hands a joined invite the face the room holds for its address: a listed guest's, or someone in with nothing yet", () => {
    room({
      ...DATA,
      items: [
        {
          id: "u1",
          displayName: "Maya",
          slug: null,
          avatarMarker: null,
          avatarUrl: "https://cdn.test/maya.webp",
          seed: "seed-u1",
        },
      ] as never,
      quiet: [
        {
          id: "u2",
          displayName: "Dev",
          slug: null,
          avatarMarker: null,
          avatarUrl: null,
          seed: "seed-u2",
        },
      ] as never,
      emails: [
        ["u1", "maya@example.com"],
        ["u2", "dev@example.com"],
      ],
    });
    const { faces } = handed.invited.at(-1) as {
      faces: Map<string, unknown>;
    };
    expect(faces.get("maya@example.com")).toEqual({
      name: "Maya",
      seed: "seed-u1",
      photo: "https://cdn.test/maya.webp",
    });
    expect(faces.get("dev@example.com")).toMatchObject({ name: "Dev" });
  });

  it("★ someone in with nothing added yet keeps the room from reading as empty", () => {
    room({
      ...DATA,
      items: [],
      doorTotal: 0,
      invited: [],
      quiet: [{ kind: "unverified", id: "g9", displayName: "Nina" }] as never,
    });
    expect(handed.invite.at(-1)).toMatchObject({ prominent: false });
    expect(document.querySelector("[data-guests-empty]")).toBeNull();
    expect(handed.list.at(-1)).toMatchObject({ quiet: [{ id: "g9" }] });
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

  // ★ A SEALED ALBUM'S ROOM SAYS ITS ROLL IS DEVELOPING (crumbs-81). A guest whose only approved shots wait for the
  // develop is on no list yet, so a room read while a roll is shot is a list of nobody: it said "Nobody has added
  // photos yet" to a host whose guests had filled it. The shots that wait are counted beside the list, and the room
  // says them in the camera's own word instead.
  describe("while a sealed album holds shots its guests have taken", () => {
    const sealed = (waiting: number, over: Partial<GuestsRoomData> = {}) => ({
      ...DATA,
      items: [],
      doorTotal: 0,
      invited: [],
      waiting,
      ...over,
    });

    it("★ says the shots are developing, never that nobody has added photos", () => {
      room(sealed(42));
      expect(
        screen.getByText(
          "42 shots are developing. Their guests join this list when the album develops.",
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText(/nobody has added photos/i)).toBeNull();
      expect(document.querySelector("[data-guests-empty]")).toBeNull();
    });

    it("says it in the singular for one shot, and groups a big roll's count", () => {
      room(sealed(1));
      expect(
        screen.getByText(
          "1 shot is developing. Its guest joins this list when the album develops.",
        ),
      ).toBeInTheDocument();
      cleanup();
      room(sealed(1204));
      expect(
        screen.getByText(/^1,204 shots are developing\./),
      ).toBeInTheDocument();
    });

    it("makes Invite the quiet action, not the room's main one: the room has a roll in it", () => {
      room(sealed(5));
      expect(handed.invite.at(-1)).toMatchObject({ prominent: false });
      expect(screen.getAllByRole("button", { name: "Invite" })).toHaveLength(1);
    });

    it("★ says it even where someone waits at the door or is invited, since the list's own empty line would lie there too", () => {
      room(sealed(3, { doorTotal: 2 }));
      expect(screen.getByText(/3 shots are developing/)).toBeInTheDocument();
      expect(screen.queryByText(/nobody has added photos/i)).toBeNull();
      cleanup();
      room(sealed(3, { invited: [{ email: "a@b.co", joined: false }] }));
      expect(screen.getByText(/3 shots are developing/)).toBeInTheDocument();
      expect(screen.queryByText(/nobody has added photos/i)).toBeNull();
    });

    it("leaves the list to speak once a guest is on it, and keeps the empty room's own words for an album that holds nothing", () => {
      room({ ...DATA, waiting: 5 });
      expect(screen.queryByText(/shots? (is|are) developing/)).toBeNull();
      expect(handed.list).toHaveLength(1);
      cleanup();
      room(sealed(0));
      expect(
        screen.getByText(/nobody has added photos yet/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/developing/)).toBeNull();
    });
  });

  it("★ lands on the section its opener's link named", () => {
    const scrolled = vi.fn();
    Element.prototype.scrollIntoView = scrolled;
    room(DATA, "invited");
    expect(scrolled).toHaveBeenCalledTimes(1);
    expect(scrolled.mock.contexts[0]).toBe(screen.getByLabelText("Invited"));
  });
});
