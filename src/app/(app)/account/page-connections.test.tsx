import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FOLLOWING_WORDS, followWords } from "@/components/social/private-line";
import type { ProfileCardItem } from "@/lib/social/cards";

import { ConnectionsLists } from "./page-connections";

/**
 * ACCOUNT'S CONNECTIONS (`account-moments` r1, `tidy=stays`). A row she flips off used to leave in the Server
 * Function's own re-render, so a slip meant finding the person's page; now it stays, turned back, and leaves when she
 * comes back. Pinned: that, and the half of it that is easy to lose, that the page's re-render (`rerender` here, the
 * props the server hands the island again) never takes a row out from under her; that a name opens the look and the
 * look's Follow is offered only where it is true; and that one answer per person reaches every control that shows it.
 */

const act = {
  follow: vi.fn(),
  unfollow: vi.fn(),
  block: vi.fn(),
  unblock: vi.fn(),
};
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  followProfileAction: (...args: unknown[]) => act.follow(...args),
  unfollowProfileAction: (...args: unknown[]) => act.unfollow(...args),
  blockProfileAction: (...args: unknown[]) => act.block(...args),
  unblockProfileAction: (...args: unknown[]) => act.unblock(...args),
}));

const person = (id: string, displayName: string, slug: string | null) =>
  ({
    id,
    displayName,
    slug,
    avatarMarker: null,
    avatarUrl: null,
    seed: `seed-${id}`,
  }) satisfies ProfileCardItem;

const sam = person("sam", "Sam Okafor", "samo");
const theo = person("theo", "Theo Grant", "theog");
const ray = person("ray", "Ray Moss", "raym");

/** The flip landing: a control in flight takes no second press (`relation-toggle.test.tsx`). */
async function landed(name: string) {
  await waitFor(() =>
    expect(screen.getByRole("button", { name })).not.toHaveAttribute(
      "aria-busy",
    ),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const fn of Object.values(act)) fn.mockResolvedValue({ ok: true });
});

describe("a row she turns off", () => {
  it("★ stays, turned back, even when the page re-renders without her; one more press undoes it", async () => {
    const { rerender } = render(
      <ConnectionsLists following={[sam, theo]} blocked={[]} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Following Sam Okafor" }),
    );
    await waitFor(() => expect(act.unfollow).toHaveBeenCalledWith("sam"));
    await landed("Follow Sam Okafor");

    // The Server Function re-rendered Account with her gone from the server's list.
    rerender(<ConnectionsLists following={[theo]} blocked={[]} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText("Sam Okafor")).toBeInTheDocument();
    expect(
      within(rows[0]!).getByRole("button", { name: "Follow Sam Okafor" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Follow Sam Okafor" }));
    await waitFor(() => expect(act.follow).toHaveBeenCalledWith("sam"));
    await landed("Following Sam Okafor");
  });

  it("an unblocked row keeps Block, and Block asks first as everywhere", async () => {
    render(<ConnectionsLists following={[]} blocked={[ray]} />);
    fireEvent.click(screen.getByRole("button", { name: "Unblock Ray Moss" }));
    await waitFor(() => expect(act.unblock).toHaveBeenCalledWith("ray"));
    await landed("Block Ray Moss");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Block Ray Moss" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "Block Ray Moss?",
    );
    expect(act.block).not.toHaveBeenCalled();
  });

  it("is a refusal like any other: the row stays as it was and nothing about it changes", async () => {
    act.unfollow.mockResolvedValue({ ok: false, message: "Not now." });
    render(<ConnectionsLists following={[sam]} blocked={[]} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Following Sam Okafor" }),
    );
    await landed("Following Sam Okafor");
    expect(
      screen.getByRole("button", { name: "Following Sam Okafor" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});

describe("a name opens the look, and the look says what is true now", () => {
  it("opens the person's door from the name, with no Follow where the row's own action is the Follow", () => {
    render(<ConnectionsLists following={[sam]} blocked={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Sam Okafor" }));
    expect(
      screen.getByRole("link", { name: /open full profile/i }),
    ).toHaveAttribute("href", "/u/samo");
    // The row's button and the look's would be two controls for one relation in one row.
    expect(screen.getAllByRole("button", { name: /follow/i })).toHaveLength(1);
  });

  it("★ offers Follow after an Unblock and never while the block stands; a Follow from it joins Following", async () => {
    render(<ConnectionsLists following={[]} blocked={[ray]} />);
    const name = () => screen.getByRole("button", { name: "Ray Moss" });

    fireEvent.click(name());
    expect(screen.queryByRole("button", { name: "Follow" })).toBeNull();
    expect(
      screen.getByRole("link", { name: /open full profile/i }),
    ).toBeInTheDocument();
    fireEvent.click(name());

    fireEvent.click(screen.getByRole("button", { name: "Unblock Ray Moss" }));
    await waitFor(() => expect(act.unblock).toHaveBeenCalledWith("ray"));
    await landed("Block Ray Moss");

    // Nobody is followed yet, and the page says so until she follows him.
    expect(screen.getByText(/not following anyone yet/i)).toBeInTheDocument();
    fireEvent.click(name());
    fireEvent.click(screen.getByRole("button", { name: "Follow" }));
    await waitFor(() => expect(act.follow).toHaveBeenCalledWith("ray"));

    // Ray is on Following now, and his row under Blocked stays as the Unblock left it.
    await waitFor(() =>
      expect(screen.queryByText(/not following anyone yet/i)).toBeNull(),
    );
    const following = screen.getByRole("list", { name: "Following" });
    expect(
      within(following).getByRole("button", { name: "Following Ray Moss" }),
    ).toBeInTheDocument();
    const blocked = screen.getByRole("list", { name: "Blocked" });
    expect(
      within(blocked).getByRole("button", { name: "Block Ray Moss" }),
    ).toBeInTheDocument();
  });

  it("★ offers no Follow after an Unblock where they blocked her back: her own block lifts, theirs stands (crumbs-87)", async () => {
    // `followBarred`, from `getMyBlocks`: a Follow of Ray would be answered ok and written nowhere.
    render(
      <ConnectionsLists
        following={[]}
        blocked={[{ ...ray, followBarred: true }, theo]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Unblock Ray Moss" }));
    await waitFor(() => expect(act.unblock).toHaveBeenCalledWith("ray"));
    await landed("Block Ray Moss");

    // The Unblock stands as she asked for it, and the look still opens, with the way to his page.
    fireEvent.click(screen.getByRole("button", { name: "Ray Moss" }));
    expect(
      screen.getByRole("link", { name: /open full profile/i }),
    ).toHaveAttribute("href", "/u/raym");
    expect(screen.queryByRole("button", { name: "Follow" })).toBeNull();
    expect(screen.getByText(/not following anyone yet/i)).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });

    // Where nobody blocked her back, the same Unblock still offers one (the neighbour row, unchanged).
    fireEvent.click(screen.getByRole("button", { name: "Unblock Theo Grant" }));
    await waitFor(() => expect(act.unblock).toHaveBeenCalledWith("theo"));
    await landed("Block Theo Grant");
    fireEvent.click(screen.getByRole("button", { name: "Theo Grant" }));
    expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
  });

  it("★ a block that lands severs the follow it just made: the row that offered it goes, and the look does too", async () => {
    render(<ConnectionsLists following={[]} blocked={[ray]} />);
    fireEvent.click(screen.getByRole("button", { name: "Unblock Ray Moss" }));
    await landed("Block Ray Moss");
    fireEvent.click(screen.getByRole("button", { name: "Ray Moss" }));
    fireEvent.click(screen.getByRole("button", { name: "Follow" }));
    await waitFor(() => expect(act.follow).toHaveBeenCalledWith("ray"));
    // Ray is on both lists now (his Blocked row stays, as the Unblock left it); close the look from his name there.
    fireEvent.click(
      within(screen.getByRole("list", { name: "Blocked" })).getByRole(
        "button",
        {
          name: "Ray Moss",
        },
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Block Ray Moss" }));
    const ask = screen.getByRole("alertdialog");
    fireEvent.click(
      [...ask.querySelectorAll("button")].find(
        (b) => b.textContent === "Block",
      )!,
    );
    await waitFor(() => expect(act.block).toHaveBeenCalledWith("ray"));
    await landed("Unblock Ray Moss");

    // A Follow that could only be a silent no-op is not offered: Following is empty again.
    expect(screen.getByText(/not following anyone yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Following" })).toBeNull();
  });
});

describe("what the card says before she has done anything", () => {
  it("says so when she follows no one, and draws no Blocked list when she blocks no one", () => {
    render(<ConnectionsLists following={[]} blocked={[]} />);
    expect(screen.getByText(/not following anyone yet/i)).toBeInTheDocument();
    expect(screen.queryByText("Blocked")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
  });
});

/**
 * THE LIST KEEPS WHAT A FIRST FOLLOW SAID (`account-moments` r2, `follow=once`): her first follow says once, under its
 * button, that only she sees who she follows, and the place those follows live keeps the line for whenever she looks.
 * Pinned: it stands above the people she follows and nowhere else on the card; a row's own Follow does not say it a second
 * time, a few pixels under the line that already does; and the look's Follow, which closes, still says it on a first follow.
 */
describe("the line Connections keeps", () => {
  it("★ stands above the people she follows, and not above Blocked or in the empty state", () => {
    const { unmount } = render(
      <ConnectionsLists following={[sam]} blocked={[ray]} />,
    );
    const line = screen.getByText(FOLLOWING_WORDS);
    const following = screen.getByRole("list", { name: "Following" });
    const blocked = screen.getByRole("list", { name: "Blocked" });
    // After the heading, before its list: it is about the list under it.
    expect(
      line.compareDocumentPosition(following) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      line.compareDocumentPosition(blocked) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getAllByText(FOLLOWING_WORDS)).toHaveLength(1);

    // Nobody followed: the empty state is a sentence of its own, not a list the line would be about. (A fresh render:
    // the island reads its props once, by design, so a re-render could never empty a list.)
    unmount();
    render(<ConnectionsLists following={[]} blocked={[ray]} />);
    expect(screen.queryByText(FOLLOWING_WORDS)).toBeNull();
  });

  it("★ is not said again by a row's own Follow, though the server calls it her first", async () => {
    act.follow.mockResolvedValue({ ok: true, first: true });
    const { container } = render(
      <ConnectionsLists following={[sam]} blocked={[]} />,
    );
    // She unfollows her only follow and follows again from the same row (her list was empty before that press).
    fireEvent.click(
      screen.getByRole("button", { name: "Following Sam Okafor" }),
    );
    await landed("Follow Sam Okafor");
    fireEvent.click(screen.getByRole("button", { name: "Follow Sam Okafor" }));
    await waitFor(() => expect(act.follow).toHaveBeenCalledWith("sam"));
    await landed("Following Sam Okafor");
    expect(container.querySelector("[data-follow-line]")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getAllByText(FOLLOWING_WORDS)).toHaveLength(1);
  });

  it("★ is still said by the look's Follow on a first follow, in his name, and then stands on the list it joins", async () => {
    act.follow.mockResolvedValue({ ok: true, first: true });
    render(<ConnectionsLists following={[]} blocked={[ray]} />);
    fireEvent.click(screen.getByRole("button", { name: "Unblock Ray Moss" }));
    await landed("Block Ray Moss");

    fireEvent.click(screen.getByRole("button", { name: "Ray Moss" }));
    fireEvent.click(screen.getByRole("button", { name: "Follow" }));
    await waitFor(() => expect(act.follow).toHaveBeenCalledWith("ray"));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        followWords("Ray Moss"),
      ),
    );
    // And the list she just joined carries its standing line.
    await waitFor(() =>
      expect(screen.getByText(FOLLOWING_WORDS)).toBeInTheDocument(),
    );
  });
});
