import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { GuestListItem } from "@/components/social/guest-list";

/**
 * THE GUESTS, AS CALM ROWS (guests-room r1, `rows=list`): every person who added is one row whose name opens their card,
 * what they added a column at its end. Pinned: who added most leads (the board's carried `guests-order`), eight then a
 * page at a time with focus following the fold, the people in with nothing added yet folded at the foot (the ROADMAP's
 * "a let-in guest who adds nothing is on no list"), and each card the host's: in since their first, with Block.
 */

vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  followProfileAction: vi.fn(),
  unfollowProfileAction: vi.fn(),
}));
vi.mock("@/app/(app)/dashboard/[eventId]/guests/look-actions", () => ({
  readHostLookAction: vi.fn().mockResolvedValue({ ok: false }),
  readAlbumLookAction: vi.fn().mockResolvedValue({ ok: false }),
}));

const { RoomGuests, addedColumn, byAdded, GUESTS_FIRST } =
  await import("./room-guests");

const person = (i: number): GuestListItem => ({
  id: `u${i}`,
  displayName: `Guest ${String(i).padStart(2, "0")}`,
  slug: null,
  avatarMarker: null,
  avatarUrl: null,
  seed: `seed-${i}`,
});

const ctx = (
  added: [string, { photos: number; videos: number; since: string }][] = [],
) => ({
  eventId: "e1",
  emails: new Map([["u1", "guest1@example.com"]]),
  added: new Map(added),
  following: new Set<string>(),
  barred: new Set<string>(),
});

function guests(
  items: GuestListItem[],
  added: Parameters<typeof ctx>[0] = [],
  quiet: GuestListItem[] = [],
) {
  return render(
    <RoomGuests
      items={items}
      quiet={quiet}
      ctx={ctx(added)}
      invite={<button type="button">Invite</button>}
      empty={<p>Nobody has added photos yet.</p>}
    />,
  );
}

const rowNames = () =>
  [...document.querySelectorAll("[data-guest-row]")].map(
    (row) => row.querySelector("p")?.textContent,
  );

describe("the guests' rows", () => {
  it("★ who added most leads, then by name; the head counts the one count", () => {
    guests(
      [person(1), person(2), person(3)],
      [
        ["u1", { photos: 2, videos: 0, since: "6:00 PM" }],
        ["u2", { photos: 9, videos: 1, since: "7:00 PM" }],
        ["u3", { photos: 2, videos: 0, since: "8:00 PM" }],
      ],
    );
    expect(rowNames()).toEqual(["Guest 02", "Guest 01", "Guest 03"]);
    expect(screen.getByRole("heading")).toHaveTextContent("Guests3");
  });

  it("says what each added as its column, by kind, a mix in Review's word", () => {
    expect(addedColumn({ photos: 24, videos: 0 })).toEqual({
      n: 24,
      word: "photos",
    });
    expect(addedColumn({ photos: 1, videos: 0 })).toEqual({
      n: 1,
      word: "photo",
    });
    expect(addedColumn({ photos: 0, videos: 3 })).toEqual({
      n: 3,
      word: "videos",
    });
    expect(addedColumn({ photos: 2, videos: 3 })).toEqual({
      n: 5,
      word: "uploads",
    });
  });

  it("a person the read could not count stands last, never first", () => {
    const sorted = byAdded(
      [person(1), person(2)],
      new Map([["u2", { photos: 1, videos: 0, since: "6:00 PM" }]]),
    );
    expect(sorted.map((p) => p.id)).toEqual(["u2", "u1"]);
  });

  it("★ eight, then a page at a time under a fold wearing the next faces, focus landing on the first it let out", () => {
    const party = Array.from({ length: 40 }, (_, i) => person(i + 1));
    guests(party);
    expect(document.querySelectorAll("[data-guest-row]")).toHaveLength(
      GUESTS_FIRST,
    );
    // The fold lets out a page, never the whole party, and says of how many.
    const fold = screen.getByRole("button", { name: "24 more, of 40" });
    fireEvent.click(fold);
    expect(document.querySelectorAll("[data-guest-row]")).toHaveLength(32);
    expect(document.activeElement).toBe(
      document.querySelectorAll("[data-guest-row]")[GUESTS_FIRST],
    );
  });

  it("★ a name opens the host's card: in since their first, its photographs read by Block's own name for them", async () => {
    guests([person(1)], [["u1", { photos: 3, videos: 0, since: "6:03 PM" }]]);
    fireEvent.click(screen.getByRole("button", { name: /Guest 01/ }));
    const card = screen.getByRole("dialog", { name: "Guest 01" });
    expect(card.querySelector("[data-card-standing]")).toHaveTextContent(
      "In since 6:03 PM",
    );
    expect(within(card).getByText("guest1@example.com")).toBeInTheDocument();
    expect(
      within(card).getByRole("button", { name: /block from this event/i }),
    ).toBeInTheDocument();
    await act(async () => {});
  });

  it("★ the people in with nothing added yet fold at the foot, uncounted, and open as rows that say so", () => {
    guests(
      [person(1)],
      [["u1", { photos: 1, videos: 0, since: "6:00 PM" }]],
      [person(50), { kind: "unverified", id: "g-nina", displayName: "Nina" }],
    );
    expect(screen.getByRole("heading")).toHaveTextContent("Guests1");
    const fold = screen.getByRole("button", {
      name: /2 in, nothing added yet/,
    });
    expect(fold).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(fold);
    const quiet = screen.getByRole("list", { name: "In, nothing added yet" });
    expect(within(quiet).getAllByText("Nothing in the album yet")).toHaveLength(
      2,
    );
    fireEvent.click(within(quiet).getByRole("button", { name: /Nina/ }));
    expect(
      screen
        .getByRole("dialog", { name: "Nina" })
        .querySelector("[data-card-standing]"),
    ).toHaveTextContent("In,nothing in the album yet");
  });

  it("while nobody has added, the room's own line stands where the rows would, and the quiet still fold under it", () => {
    guests([], [], [person(9)]);
    expect(
      screen.getByText("Nobody has added photos yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /1 in, nothing added yet/ }),
    ).toBeInTheDocument();
  });
});
