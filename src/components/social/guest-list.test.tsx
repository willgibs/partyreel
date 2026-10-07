import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UNVERIFIED_LABEL } from "@/components/shared/unverified-mark";
import type { ProfileCardItem } from "@/lib/social/cards";

import {
  GUEST_LIST_FACES_THRESHOLD,
  GuestList,
  type GuestListItem,
} from "./guest-list";

// A chip's Follow is the real FollowButton, which reaches the profile's server
// actions (server-only) and the app router; neither exists in jsdom.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  followProfileAction: vi.fn().mockResolvedValue({ ok: true }),
  unfollowProfileAction: vi.fn().mockResolvedValue({ ok: true }),
}));
// The block screen is its own file's contract (event-blocks/block-confirm.test.tsx), and it reaches
// the host's server actions; here it stands in as what it was opened for.
vi.mock(
  "@/components/app/event-blocks/block-look-action",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/components/app/event-blocks/block-look-action")
    >()),
    LazyBlockConfirm: ({
      open,
      target,
      name,
    }: {
      open: boolean;
      target: unknown;
      name: string | null;
    }) =>
      open ? (
        <div data-testid="block-screen" data-target={JSON.stringify(target)}>
          {name}
        </div>
      ) : null,
  }),
);

/**
 * THE GUEST LIST'S CONTRACT (the profile wiring, 2026-09-19).
 *
 * What is pinned is FUNCTION: that ONE component serves both surfaces and
 * therefore switches shape on a size rather than on a caller's opinion, that
 * the condensed row is a single control rather than a label with a link beside
 * it, that opening it pages instead of dumping a thousand names, and that a
 * handle-less guest gets no dead link. Nothing here asserts a colour, a radius,
 * a duration or a word.
 *
 * ★ RESHAPED ON PURPOSE BY `popups` r1 (2026-09-27), the round this file said
 * it must not stand in the way of: View all opens the LIST in its panel
 * (`lists=panel`) rather than in place, and every name opens a LOOK
 * (`peek=card`) rather than linking straight to its page. The scars kept: the
 * list still pages, and a name without a page still links nowhere (its look
 * has no door); the expired reason dropped: "opens IN PLACE" and "a chip is a
 * link", which were the interim this file named as one.
 */
function guests(n: number, withSlug = false): ProfileCardItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `u${i}`,
    displayName: `Guest ${i}`,
    slug: withSlug ? `guest-${i}` : null,
    avatarMarker: null,
    avatarUrl: null,
    // A fixture stand-in for withAvatarUrls' seedFor(id): this file's
    // contract is the list's shape, never a colour, so a plain per-index
    // string is enough to satisfy the type.
    seed: `seed-${i}`,
  }));
}

describe("GuestList", () => {
  it("names everyone, in chips, at or under the threshold, each name its own button", () => {
    render(<GuestList items={guests(GUEST_LIST_FACES_THRESHOLD)} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(
      GUEST_LIST_FACES_THRESHOLD,
    );
    // No condensed row: every button here is a name that opens its look.
    expect(screen.getAllByRole("button")).toHaveLength(
      GUEST_LIST_FACES_THRESHOLD,
    );
    expect(screen.queryByText(/guests added photos/)).not.toBeInTheDocument();
  });

  it("condenses to ONE button past the threshold, and the button carries the count", () => {
    const items = guests(GUEST_LIST_FACES_THRESHOLD + 1);
    render(<GuestList items={items} />);
    const row = screen.getByRole("button");
    expect(row).toHaveTextContent(`${items.length} guests added photos`);
    // The names are not in the document until it is opened.
    expect(screen.queryByText("Guest 0")).not.toBeInTheDocument();
  });

  it("opens the list in its panel, one page at a time, never the whole list at once", () => {
    // 60 guests: a page, then a page, then the tail.
    render(<GuestList items={guests(60)} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("dialog", { name: "Guests" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(24);

    fireEvent.click(screen.getByRole("button", { name: /show \d+ more/i }));
    expect(screen.getAllByRole("listitem")).toHaveLength(48);

    fireEvent.click(screen.getByRole("button", { name: /show \d+ more/i }));
    expect(screen.getAllByRole("listitem")).toHaveLength(60);
    // Nothing left to ask for.
    expect(
      screen.queryByRole("button", { name: /show \d+ more/i }),
    ).not.toBeInTheDocument();
  });

  it("opens a look for every name: a handle's look links its page, and one without links nowhere", () => {
    render(
      <GuestList
        items={[
          { ...guests(1)[0], id: "a", displayName: "Maya", slug: "maya" },
          { ...guests(1)[0], id: "b", displayName: "Priya", slug: null },
        ]}
      />,
    );
    // The list itself links nowhere now: a name opens its look first.
    expect(screen.queryByRole("link")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /maya/i }));
    expect(
      screen.getByRole("link", { name: /open full profile/i }),
    ).toHaveAttribute("href", "/u/maya");
  });

  it("gives a name with no page a look with no door", () => {
    render(
      <GuestList
        items={[{ ...guests(1)[0], id: "b", displayName: "Priya", slug: null }]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /priya/i }));
    expect(screen.getByText(/confirmed their email/i)).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("says so when nobody has added a photo yet", () => {
    // ★ Reshaped: [] was "the host's key is on, and empty", beside a null that meant OFF. The key is
    // retired (event-safety `room=always`), so [] means only that nobody has added a photo yet.
    render(<GuestList items={[]} />);
    expect(
      screen.getByText(/nobody has added photos yet/i),
    ).toBeInTheDocument();
  });
});

/**
 * THE IDENTITY RESHAPE'S PINS (2026-09-21, his "Listed, with the mark").
 * Function, not look: that a name nobody proved is NAMED and MARKED and links
 * nowhere, and that the one act a guest list is for is reachable from it.
 */
describe("GuestList: unverified guests", () => {
  const unverified = {
    kind: "unverified" as const,
    id: "g1",
    displayName: "Sam",
  };

  // The name-only guest's hashvatar (small-fixes): her own row's colour, never a photograph, on the chip, the faces
  // row and the look alike. The scar kept from the plain-disc rule it replaces: the mark still stands beside her.
  it("★ paints a typed name in her own row's colour, and still marks it", () => {
    const { container } = render(
      <GuestList items={[{ ...unverified, seed: "seed-g1" }]} />,
    );
    const disc = container.querySelector("[data-slot='avatar']") as HTMLElement;
    // jsdom cannot store the mesh gradient, so a seeded root is read off its blend mode (avatar.test.tsx says why).
    expect(disc.style.backgroundBlendMode).not.toBe("");
    expect(
      screen.getByRole("button", { name: UNVERIFIED_LABEL }),
    ).toBeInTheDocument();
  });

  it("two typed names that are the same word wear two colours: the colour is the row's, never the name's", () => {
    const { container } = render(
      <GuestList
        items={[
          { ...unverified, id: "g1", seed: "seed-g1" },
          { ...unverified, id: "g2", seed: "seed-g2" },
        ]}
      />,
    );
    // The ink the fallback's initial is painted in is the seed's own (one colour per person).
    const [a, b] = [
      ...container.querySelectorAll("[data-slot='avatar-fallback']"),
    ].map((el) => (el as HTMLElement).style.color);
    expect(a).not.toBe("");
    expect(b).not.toBe("");
    expect(a).not.toBe(b);
  });

  it("an entry with no seed (a road that has not read one) keeps the plain disc", () => {
    const { container } = render(<GuestList items={[unverified]} />);
    const disc = container.querySelector("[data-slot='avatar']") as HTMLElement;
    expect(disc.style.backgroundBlendMode).toBe("");
  });

  it("names an unverified guest, marks the name, and links nowhere, look and all", () => {
    render(<GuestList items={[unverified]} />);
    expect(screen.getByText("Sam")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UNVERIFIED_LABEL }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();

    // Its look says what kind of name it is, and still has no door.
    fireEvent.click(screen.getByRole("button", { name: /sam/i }));
    expect(screen.getByText(/anyone can type a name/i)).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });

  /*
   * ★ NO STAND-IN NAME, EVER (crumbs-43; ROADMAP: "draws 'A guest' for a null `displayName`, a label the
   * product retired (a nameless credit shows nothing)"). A row with no name is on no list
   * (`resolveEventGuests` drops it, the one count's rule), so the entry's type admits no null, and the chip
   * and its look draw the typed name alone. The expect-error is the type's half (the typecheck fails the
   * day a null is admitted again); the render is the drawing's, for a null that got past a cast.
   */
  it("invents no name for a typed-name guest: 'A guest' is retired, chip and look alike", () => {
    // @ts-expect-error a nameless row is on no list, so its entry has no null name to draw
    const nameless: GuestListItem = {
      kind: "unverified",
      id: "g0",
      displayName: null,
    };
    render(<GuestList items={[nameless]} />);
    expect(screen.queryByText(/a guest/i)).toBeNull();
    const [chip] = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-label") !== UNVERIFIED_LABEL);
    fireEvent.click(chip);
    expect(screen.getByText(/anyone can type a name/i)).toBeInTheDocument();
    expect(screen.queryByText(/a guest/i)).toBeNull();
  });

  it("offers a Follow on a HANDLED chip for a signed-in viewer, and never on an unverified one", () => {
    render(
      <GuestList
        items={[
          { ...guests(1)[0], id: "a", displayName: "Maya", slug: "maya" },
          unverified,
        ]}
        viewerId="me"
      />,
    );
    expect(screen.getAllByRole("button", { name: "Follow" })).toHaveLength(1);
  });

  it("offers no Follow to a signed-out viewer, to themselves, or to somebody already followed", () => {
    const items = [
      { ...guests(1)[0], id: "a", displayName: "Maya", slug: "maya" },
      { ...guests(1)[0], id: "me", displayName: "Me", slug: "me" },
      { ...guests(1)[0], id: "b", displayName: "Priya", slug: "priya" },
    ];
    const { unmount } = render(<GuestList items={items} />);
    expect(screen.queryByRole("button", { name: "Follow" })).toBeNull();
    unmount();

    render(
      <GuestList items={items} viewerId="me" followingIds={new Set(["b"])} />,
    );
    // Only Maya is left: "me" is the viewer, "b" is already followed.
    expect(screen.getAllByRole("button", { name: "Follow" })).toHaveLength(1);
  });

  it("★ offers no Follow across a block, on the chip or in the look: a Follow there writes nothing and would read Following (crumbs-87)", () => {
    const items = [
      { ...guests(1)[0], id: "a", displayName: "Maya", slug: "maya" },
      { ...guests(1)[0], id: "b", displayName: "Priya", slug: "priya" },
    ];
    render(
      <GuestList items={items} viewerId="me" blockedIds={new Set(["b"])} />,
    );
    // Only Maya's chip carries one; Priya's name has none beside it.
    expect(screen.getAllByRole("button", { name: "Follow" })).toHaveLength(1);

    // Nor does her look: the same answer, said once, for both places a Follow is offered.
    fireEvent.click(screen.getByRole("button", { name: /priya/i }));
    expect(
      screen.getByRole("link", { name: /open full profile/i }),
    ).toHaveAttribute("href", "/u/priya");
    expect(screen.getAllByRole("button", { name: "Follow" })).toHaveLength(1);
  });

  it("is the faces row's list too: a blocked name in the opened panel has no Follow", () => {
    const many = guests(GUEST_LIST_FACES_THRESHOLD + 2).map((g, i) => ({
      ...g,
      id: `p${i}`,
      displayName: `Person ${i}`,
      slug: `person-${i}`,
    }));
    render(
      <GuestList items={many} viewerId="me" blockedIds={new Set(["p1"])} />,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(`${many.length} guests added photos`),
      }),
    );
    const panel = document.querySelector("[data-guest-list-panel]")!;
    const names = [...panel.querySelectorAll("li")];
    const withFollow = names.filter((li) =>
      [...li.querySelectorAll("button")].some(
        (b) => b.textContent === "Follow",
      ),
    );
    expect(withFollow).toHaveLength(names.length - 1);
    expect(
      names
        .find((li) => li.textContent?.includes("Person 1"))
        ?.textContent?.includes("Follow"),
    ).toBe(false);
  });
});

/**
 * THE HOST'S ADDRESSES (Will, 2026-09-23: "Guests should not see other
 * confirmed guests' emails, making them more comfortable knowing only the host
 * sees it"). Function, not look: that a confirmed guest's address reaches the
 * page only through `emails` (which only the Guests room passes), that it
 * reaches it in the opened names panel as well as the chips, and that a name
 * nobody proved never wears one.
 */
describe("GuestList: the host's addresses", () => {
  const maya = {
    ...guests(1)[0],
    id: "u-maya",
    displayName: "Maya",
    slug: "maya",
  };
  const priya = {
    ...guests(1)[0],
    id: "u-priya",
    displayName: "Priya",
    slug: null,
  };
  const unverified = {
    kind: "unverified" as const,
    id: "g-sam",
    displayName: "Sam",
  };

  it("shows a confirmed guest's address with the name when the host passes it", () => {
    render(
      <GuestList
        items={[maya, priya]}
        emails={
          new Map([
            ["u-maya", "maya@example.com"],
            ["u-priya", "priya@example.com"],
          ])
        }
      />,
    );
    expect(screen.getByRole("button", { name: /maya/i })).toHaveTextContent(
      "maya@example.com",
    );
    expect(screen.getByText("priya@example.com")).toBeInTheDocument();
  });

  it("★ shows no address at all without the prop (every guest-facing caller)", () => {
    render(<GuestList items={[maya, priya, unverified]} viewerId="me" />);
    expect(document.body.textContent).not.toMatch(/@/);
  });

  it("★ never puts an address under a name nobody proved, even one keyed to its row", () => {
    render(
      <GuestList
        items={[unverified]}
        emails={new Map([["g-sam", "sam@example.com"]])}
      />,
    );
    expect(screen.getByText("Sam")).toBeInTheDocument();
    expect(screen.queryByText("sam@example.com")).toBeNull();
  });

  it("carries the address into the opened names panel, not only the chips", () => {
    const party = guests(GUEST_LIST_FACES_THRESHOLD + 5);
    render(
      <GuestList
        items={party}
        emails={new Map([[party[0].id, "first@example.com"]])}
      />,
    );
    // Condensed: nobody is named, so nobody's address shows.
    expect(screen.queryByText("first@example.com")).toBeNull();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("first@example.com")).toBeInTheDocument();
  });
});

/**
 * A LONG ADDRESS KEEPS ITS DOMAIN. The domain is what tells a host whether an
 * address is real, so the eye's copy gives up the middle, never the domain, and
 * a screen reader still hears the whole address.
 */
describe("GuestList: a long address", () => {
  const maya = {
    ...guests(1)[0],
    id: "u-maya",
    displayName: "Maya",
    slug: "maya",
  };

  it("shortens from the middle and keeps the domain whole", () => {
    render(
      <GuestList
        items={[maya]}
        emails={
          new Map([["u-maya", "priya.raman.1987.personal.inbox@outlook.com"]])
        }
      />,
    );
    expect(
      screen.getByText("priya.raman.1987…@outlook.com"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("priya.raman.1987.personal.inbox@outlook.com"),
    ).toBeInTheDocument();
  });

  it("gives up a very long domain's end last, never the part before the @ it has room for", () => {
    render(
      <GuestList
        items={[maya]}
        emails={
          new Map([["u-maya", "alex@students.university-of-somewhere-far.edu"]])
        }
      />,
    );
    expect(screen.getByText("alex@students.universit…")).toBeInTheDocument();
  });

  it("draws an ordinary address whole, once", () => {
    render(
      <GuestList
        items={[maya]}
        emails={new Map([["u-maya", "fakeemail@domain.com"]])}
      />,
    );
    expect(screen.getAllByText("fakeemail@domain.com")).toHaveLength(1);
  });
});

/**
 * BLOCK, FROM A NAME'S LOOK, IN THE HOST'S ROOM ALONE (event-safety `entry=all`): the look stays
 * social and Block is its last line, only where the Guests room passes `blockFrom`; pressing it
 * closes the look and opens the one block screen, naming the person the way the room knows them (a
 * confirmed guest by their account at this event, a typed name by its guest row).
 */
describe("GuestList: Block in the host's room", () => {
  const maya = {
    ...guests(1)[0],
    id: "u-maya",
    displayName: "Maya",
    slug: "maya",
  };
  const sam = { kind: "unverified" as const, id: "g-sam", displayName: "Sam" };

  it("no Block without `blockFrom` (the album's list, and every other caller)", () => {
    render(<GuestList items={[maya, sam]} />);
    fireEvent.click(screen.getByRole("button", { name: /maya/i }));
    expect(
      screen.queryByRole("button", { name: /block from this event/i }),
    ).toBeNull();
  });

  it("★ a confirmed guest's look ends in Block, which opens the block screen for their account", () => {
    render(<GuestList items={[maya]} blockFrom={{ eventId: "e-1" }} />);
    fireEvent.click(screen.getByRole("button", { name: /maya/i }));
    // Social first: the page is still the look's lead.
    expect(
      screen.getByRole("link", { name: /open full profile/i }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /block from this event/i }),
    );
    const screenFor = screen.getByTestId("block-screen");
    expect(JSON.parse(screenFor.dataset.target ?? "null")).toEqual({
      kind: "account",
      eventId: "e-1",
      userId: "u-maya",
    });
    expect(screenFor).toHaveTextContent("Maya");
    // The look closed as the screen opened.
    expect(
      screen.queryByRole("link", { name: /open full profile/i }),
    ).toBeNull();
  });

  it("a typed name's Block names its guest row", () => {
    render(<GuestList items={[sam]} blockFrom={{ eventId: "e-1" }} />);
    fireEvent.click(screen.getByRole("button", { name: /sam/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /block from this event/i }),
    );
    expect(
      JSON.parse(screen.getByTestId("block-screen").dataset.target ?? "null"),
    ).toEqual({
      kind: "row",
      guestId: "g-sam",
    });
  });
});
