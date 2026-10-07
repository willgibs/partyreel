import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProfileCardItem } from "@/lib/social/cards";

import { setViewportWidth } from "../../../vitest.setup";
import { GuestPeek, type CardStanding } from "./guest-peek";

/**
 * A PERSON'S CARD (guests-room r1, `card=standing`): the card every name opens. The guest list's own contract (a look
 * for every name, its door, Block in the host's room) is `guest-list.test.tsx`'s; pinned here is what the card adds
 * and what Connections asked of it:
 *  - who they are as one block, the face never in the sheet's title (a screen reader hears the name alone);
 *  - the host's lines (their standing tonight and its act) only where a host's surface hands them;
 *  - their photographs from the album the card stands in, the host's by Block's own name for the person, an album's
 *    page by its own address, and nowhere else; a person with nothing the album shows asks nothing;
 *  - Follow and their page a quiet pair, the surface's own Follow in place of the card's (Connections), none where
 *    she cannot, ★ and a Follow landed from the card still Following when it opens again (crumbs-87's ROADMAP line).
 */

const follow = vi.hoisted(() => vi.fn().mockResolvedValue({ ok: true }));
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  followProfileAction: follow,
  unfollowProfileAction: vi.fn().mockResolvedValue({ ok: true }),
}));
const looks = vi.hoisted(() => ({
  host: vi.fn(),
  album: vi.fn(),
}));
vi.mock("@/app/(app)/dashboard/[eventId]/guests/look-actions", () => ({
  readHostLookAction: looks.host,
  readAlbumLookAction: looks.album,
}));

const ray: ProfileCardItem = {
  id: "ray",
  displayName: "Ray Moss",
  slug: "raym",
  avatarMarker: null,
  avatarUrl: null,
  seed: "seed-ray",
};
const sam = { kind: "unverified" as const, id: "g-sam", displayName: "Sam" };

const photos = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    type: "photo" as const,
    url: `view-${i}`,
    previewUrl: `tile-${i}`,
    status: "approved" as const,
  }));

function card(props: Partial<React.ComponentProps<typeof GuestPeek>> = {}) {
  return (
    <GuestPeek item={ray} canFollow {...props}>
      <button type="button">
        {props.item?.displayName ?? ray.displayName}
      </button>
    </GuestPeek>
  );
}

const open = (name = "Ray Moss") =>
  fireEvent.click(screen.getByRole("button", { name }));

beforeEach(() => {
  looks.host.mockResolvedValue({
    ok: true,
    photos: 9,
    videos: 0,
    items: photos(4),
    next: null,
  });
  looks.album.mockResolvedValue({
    ok: true,
    photos: 2,
    videos: 0,
    items: photos(2),
    next: null,
  });
});

afterEach(() => {
  setViewportWidth(1024);
  window.history.replaceState(null, "", "/");
  vi.clearAllMocks();
});

describe("who they are", () => {
  it("★ in a hand the sheet's title is the name alone: the face is a cell beside it, hidden from a screen reader", () => {
    setViewportWidth(375);
    render(card());
    open();
    expect(
      screen.getByRole("dialog", { name: "Ray Moss" }),
    ).toBeInTheDocument();
  });

  it("at a desk the card is labelled by the name, its kind under it, the host's address under that", () => {
    render(card({ email: "ray@example.com" }));
    open();
    const look = screen.getByRole("dialog", { name: "Ray Moss" });
    expect(within(look).getByText("@raym")).toBeInTheDocument();
    expect(within(look).getByText("ray@example.com")).toBeInTheDocument();
  });

  it("a typed name is Unverified, and anyone can type one", () => {
    render(card({ item: sam, canFollow: false }));
    open("Sam");
    expect(screen.getByText("Unverified")).toBeInTheDocument();
    expect(screen.getByText("Anyone can type a name")).toBeInTheDocument();
  });

  it("a person drawn under the address she confirmed says so once, never the address twice", () => {
    render(
      card({
        item: { ...ray, displayName: "dev@example.com", slug: null },
        email: "dev@example.com",
        canFollow: false,
      }),
    );
    open("dev@example.com");
    const look = screen.getByRole("dialog", { name: "dev@example.com" });
    expect(
      within(look).getByText("Confirmed this address"),
    ).toBeInTheDocument();
    expect(within(look).getAllByText("dev@example.com")).toHaveLength(1);
  });
});

describe("their standing tonight, for the host", () => {
  it("draws no host line on a guest's side of the card", () => {
    render(card());
    open();
    expect(document.querySelector("[data-card-standing]")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /block from this event/i }),
    ).toBeNull();
  });

  it("★ says how they stand, and its act closes the card as it answers", () => {
    const decline = vi.fn();
    const standing: CardStanding = {
      tone: "door",
      line: "At the door for 2 min",
      act: (close) => (
        <button
          type="button"
          onClick={() => {
            close();
            decline();
          }}
        >
          Decline
        </button>
      ),
    };
    render(card({ standing, canFollow: false }));
    open();
    expect(
      document.querySelector('[data-card-standing="door"]'),
    ).toHaveTextContent("At the door for 2 min");
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(decline).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("reads a standing line's point as a pause", () => {
    render(
      card({
        standing: {
          tone: "blocked",
          line: "Declined at 9:12 PM",
          aside: "still asking",
        },
      }),
    );
    open();
    expect(
      document.querySelector('[data-card-standing="blocked"]')?.textContent,
    ).toBe("Declined at 9:12 PM,still asking");
  });
});

describe("their photographs", () => {
  it("★ a host's card reads her album by Block's own name for the person, four tiles and See all", async () => {
    render(
      card({
        block: { target: { kind: "account", eventId: "e1", userId: "ray" } },
      }),
    );
    open();
    await act(async () => {});
    expect(looks.host).toHaveBeenCalledWith({
      target: { kind: "account", eventId: "e1", userId: "ray" },
      after: null,
      limit: 4,
    });
    expect(document.querySelectorAll("[data-look-photo]")).toHaveLength(4);
    expect(
      screen.getByRole("button", { name: /see all 9 photos from ray moss/i }),
    ).toBeInTheDocument();
    expect(looks.album).not.toHaveBeenCalled();
  });

  it("★ an album's page reads its own album, as its list names the person", async () => {
    window.history.replaceState(null, "", "/e/qr-abc");
    render(card({ item: sam, canFollow: false }));
    open("Sam");
    await act(async () => {});
    expect(looks.album).toHaveBeenCalledWith(
      expect.objectContaining({
        qrToken: "qr-abc",
        who: { kind: "row", guestId: "g-sam" },
        limit: 4,
      }),
    );
    // Two are all of them: no See all.
    expect(screen.queryByRole("button", { name: /see all/i })).toBeNull();
  });

  it("anywhere else (Account's Connections) the card shows no photographs and asks for none", async () => {
    window.history.replaceState(null, "", "/account");
    render(card());
    open();
    await act(async () => {});
    expect(document.querySelector("[data-look-strip]")).toBeNull();
    expect(looks.host).not.toHaveBeenCalled();
    expect(looks.album).not.toHaveBeenCalled();
  });

  it("a person the room counted nothing of asks for nothing", async () => {
    render(
      card({
        block: { target: { kind: "row", guestId: "g-1" } },
        added: { photos: 0, videos: 0 },
      }),
    );
    open();
    await act(async () => {});
    expect(looks.host).not.toHaveBeenCalled();
  });

  it("★ a read that fails says so, with Try again, never an empty strip", async () => {
    looks.host.mockResolvedValueOnce({ ok: false });
    render(card({ block: { target: { kind: "row", guestId: "g-fails" } } }));
    open();
    await act(async () => {});
    expect(screen.getByText(/couldn.t load their photos/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await act(async () => {});
    expect(document.querySelectorAll("[data-look-photo]")).toHaveLength(4);
  });
});

describe("Follow and their page", () => {
  it("offers the surface's own Follow in place of its own, and keeps the door", () => {
    render(card({ follow: <button type="button">Surface follow</button> }));
    open();
    expect(
      screen.getByRole("button", { name: "Surface follow" }),
    ).toBeInTheDocument();
    // One Follow, never two: the card's own would be a second control for the one relation.
    expect(screen.queryByRole("button", { name: "Follow" })).toBeNull();
    // ★ RESHAPED BY guests-room r1 (`card=standing`): the door is the quiet pair's "Their page", where it was the
    // look's loudest "Open full profile"; that it opens their page is the scar kept.
    expect(screen.getByRole("link", { name: "Their page" })).toHaveAttribute(
      "href",
      "/u/raym",
    );
  });

  it("★ offers none where the surface says she cannot, its own or the card's, and still opens the door", () => {
    render(
      card({
        canFollow: false,
        follow: <button type="button">Surface follow</button>,
      }),
    );
    open();
    expect(screen.queryByRole("button", { name: /follow/i })).toBeNull();
    expect(
      screen.getByRole("link", { name: "Their page" }),
    ).toBeInTheDocument();
  });

  it("★ a Follow landed from the card is still Following when the card opens again (one answer a person)", async () => {
    render(card({ item: { ...ray, id: "ray-kept" } }));
    open();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Follow" }));
    });
    expect(follow).toHaveBeenCalledWith("ray-kept");
    expect(screen.getByRole("button", { name: "Following" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // Closed and opened again: the card's content was gone in between, and its answer was not.
    open();
    expect(screen.queryByRole("dialog")).toBeNull();
    open();
    expect(
      screen.getByRole("button", { name: "Following" }),
    ).toBeInTheDocument();
  });

  it("no pair at all for a name with no page", () => {
    render(card({ item: { ...ray, slug: null } }));
    open();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button", { name: "Follow" })).toBeNull();
  });
});
