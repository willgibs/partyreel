import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
