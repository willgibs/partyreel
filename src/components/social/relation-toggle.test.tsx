import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FirstFollowScope, FirstFollowSlot } from "./first-follow-line";
import { followWords } from "./private-line";
import { RelationToggle } from "./relation-toggle";

/**
 * ONE CONTROL FOR A RELATION, ONE CONTRACT (crumbs-44; `relation-toggle.tsx`'s header holds each
 * clause's reason). The `profile-page` board found three hand-rolled controls doing one job with three
 * sets of manners (an optimistic Follow that refreshed by hand, a Block row that waited and toasted
 * its success, two Connections buttons that spelled "…ing" and toasted theirs, through a second pair
 * of Server Functions). Pinned: the clauses of the contract, and that every face of a relation is on
 * it.
 */

const follow = vi.fn();
const unfollow = vi.fn();
const block = vi.fn();
const unblock = vi.fn();
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  followProfileAction: (...args: unknown[]) => follow(...args),
  unfollowProfileAction: (...args: unknown[]) => unfollow(...args),
  blockProfileAction: (...args: unknown[]) => block(...args),
  unblockProfileAction: (...args: unknown[]) => unblock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  for (const fn of [follow, unfollow, block, unblock]) {
    fn.mockResolvedValue({ ok: true });
  }
});

describe("the relation contract", () => {
  it("★ turning a block ON asks first, and Cancel writes nothing", async () => {
    render(
      <RelationToggle
        relation="block"
        profileId="p1"
        on={false}
        person="Maya"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Block" }));
    const ask = screen.getByRole("alertdialog");
    expect(ask).toHaveTextContent("Block Maya?");
    expect(ask).toHaveTextContent(/won.t be notified/i);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(block).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Block" })).toBeInTheDocument();
  });

  it("a confirmed block lands as the control's own answer, with no toast of its own", async () => {
    render(
      <RelationToggle
        relation="block"
        profileId="p1"
        on={false}
        person="Maya"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Block" }));
    // The ask's own Block is the one inside the dialog.
    const ask = screen.getByRole("alertdialog");
    fireEvent.click(
      [...ask.querySelectorAll("button")].find(
        (b) => b.textContent === "Block",
      )!,
    );
    await waitFor(() => expect(block).toHaveBeenCalledWith("p1"));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Unblock" }),
      ).toBeInTheDocument(),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("every other flip acts at once: Unblock, Follow and Following ask nothing", async () => {
    const { unmount } = render(
      <RelationToggle relation="block" profileId="p1" on person="Maya" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Unblock" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await waitFor(() => expect(unblock).toHaveBeenCalledWith("p1"));
    unmount();

    render(<RelationToggle relation="follow" profileId="p2" on={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Follow" }));
    await waitFor(() => expect(follow).toHaveBeenCalledWith("p2"));
    // ★ THE SECOND PRESS WAITS FOR THE FIRST FLIP TO LAND (crumbs-48). "Following" is on screen from the
    // press (the optimistic flip), well before the write is answered, and a flip in flight takes no second
    // press (the next test): pressed on sight, it was swallowed whenever a loaded run got there first, and
    // the unfollow spy was never called. The busy state going is the flip landing.
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Following" }),
      ).not.toHaveAttribute("aria-busy"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Following" }));
    await waitFor(() => expect(unfollow).toHaveBeenCalledWith("p2"));
  });

  it("a flip in flight takes no second press", async () => {
    let land: (value: { ok: true }) => void = () => {};
    follow.mockReturnValue(new Promise((resolve) => (land = resolve)));
    render(<RelationToggle relation="follow" profileId="p2" on={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Follow" }));
    const flipped = screen.getByRole("button", { name: "Following" });
    expect(flipped).toHaveAttribute("aria-busy", "true");
    fireEvent.click(flipped);
    expect(follow).toHaveBeenCalledTimes(1);
    expect(unfollow).not.toHaveBeenCalled();
    land({ ok: true });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Following" }),
      ).not.toHaveAttribute("aria-busy"),
    );
  });

  it("a refused flip springs back and says the server's words", async () => {
    unblock.mockResolvedValue({
      ok: false,
      message: "Couldn't unblock right now.",
    });
    render(<RelationToggle relation="block" profileId="p1" on person="Maya" />);
    fireEvent.click(screen.getByRole("button", { name: "Unblock" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't unblock right now."),
    );
    // The spring-back is a render after the toast (the optimistic flip reverts once the action ends), so
    // it is waited for, not read the instant the toast is heard (crumbs-48: the race "every other flip
    // acts at once" lost, a loaded run reaching the control before the page had caught up).
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Unblock" }),
      ).toBeInTheDocument(),
    );
  });

  // ★ A FLIP THAT NEVER ANSWERED (account-moments r1): an offline press rejects, and a rejection inside a transition
  // goes to the page's error boundary, so she lost the screen over a press she could simply make again. It is a
  // refusal now. No error boundary stands in this tree, so a rejection that leaked would fail the run itself.
  it("a Server Function that cannot be reached springs back with one toast, never to an error boundary", async () => {
    follow.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<RelationToggle relation="follow" profileId="p2" on={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Follow" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/try again/i),
      ),
    );
    expect(toast.error).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Follow" }),
      ).not.toHaveAttribute("aria-busy"),
    );
  });

  it("tells a surface that keeps the relation what landed, and never what was refused", async () => {
    const onSettle = vi.fn();
    render(
      <RelationToggle
        relation="follow"
        profileId="p2"
        on
        onSettle={onSettle}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Following" }));
    await waitFor(() => expect(onSettle).toHaveBeenCalledWith(false));
    // The next press waits for the flip to land (crumbs-48's wait, above).
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Follow" }),
      ).not.toHaveAttribute("aria-busy"),
    );

    follow.mockResolvedValue({ ok: false, message: "Not now." });
    fireEvent.click(screen.getByRole("button", { name: "Follow" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Not now."));
    expect(onSettle).toHaveBeenCalledTimes(1);
  });

  // The Connections rows say "Following" down a whole list: the person is in the row's layout, never in the button.
  it("is heard with the name the layout beside it carries, after the words it shows", () => {
    render(
      <RelationToggle
        relation="follow"
        profileId="p2"
        on
        srLabel="Sam Okafor"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Following Sam Okafor" }),
    ).toBeInTheDocument();
  });

  it("Follow is a toggle that reads as pressed; Block is an act and carries no pressed state", () => {
    const { unmount } = render(
      <RelationToggle relation="follow" profileId="p2" on />,
    );
    expect(screen.getByRole("button", { name: "Following" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    unmount();
    render(<RelationToggle relation="block" profileId="p1" on={false} />);
    expect(screen.getByRole("button", { name: "Block" })).not.toHaveAttribute(
      "aria-pressed",
    );
  });

  it("a write the Library hands in replaces the Server Function", async () => {
    const act = vi.fn().mockResolvedValue({ ok: true });
    render(
      <RelationToggle relation="follow" profileId="p2" on={false} act={act} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Follow" }));
    await waitFor(() => expect(act).toHaveBeenCalledWith(true));
    expect(follow).not.toHaveBeenCalled();
  });
});

/**
 * HER FIRST FOLLOW SAYS, ONCE, THAT ONLY SHE SEES WHO SHE FOLLOWS (`account-moments` r2, `follow=once`). The Server
 * Function answers `first` when her list was empty before the press; the control draws the private line beside the
 * button, announces it, and takes it away the moment she unfollows. Pinned: that, the thousandth being the button alone,
 * a surface that says it itself (Connections) turning it off, a block never saying it, and a page that draws the line
 * under its head (the scope) being told instead of drawing a second copy beside the button.
 */
describe("her first follow says it once", () => {
  /** The line the eye sees (the control's own, beside the button), or null. */
  const line = (container: HTMLElement) =>
    container.querySelector("[data-follow-line]");
  /** The words the screen reader is given, which are the line's. */
  const announced = () => screen.getByRole("status").textContent;

  async function pressFollow(name = "Follow") {
    fireEvent.click(screen.getByRole("button", { name }));
    await waitFor(() => expect(follow).toHaveBeenCalled());
  }

  it("★ draws the line beside the button and announces it, naming the person where it knows them", async () => {
    follow.mockResolvedValue({ ok: true, first: true });
    const { container } = render(
      <RelationToggle
        relation="follow"
        profileId="p2"
        on={false}
        person="Maya Alvarez"
      />,
    );
    // The announcement stands before its words, so it is announced when they arrive.
    expect(announced()).toBe("");
    expect(line(container)).toBeNull();

    await pressFollow();
    await waitFor(() => expect(announced()).toBe(followWords("Maya Alvarez")));
    expect(announced()).toContain("Maya just sees one more follower.");
    expect(line(container)).toHaveTextContent(followWords("Maya Alvarez"));
    // The eye's copy is not read a second time.
    expect(line(container)!.querySelector("p")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("says 'They' where no name is known (the guest list's Follow, the moment card's)", async () => {
    follow.mockResolvedValue({ ok: true, first: true });
    render(<RelationToggle relation="follow" profileId="p2" on={false} />);
    await pressFollow();
    await waitFor(() => expect(announced()).toBe(followWords()));
    expect(announced()).toContain("They just see one more follower.");
  });

  it("★ is the button alone when the follow was not her first: the thousandth is quiet", async () => {
    follow.mockResolvedValue({ ok: true });
    const { container } = render(
      <RelationToggle relation="follow" profileId="p2" on={false} />,
    );
    await pressFollow();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Following" }),
      ).not.toHaveAttribute("aria-busy"),
    );
    expect(line(container)).toBeNull();
    expect(announced()).toBe("");
  });

  it("takes the line away at once when she unfollows, and a later follow that is not her first does not bring it back", async () => {
    follow.mockResolvedValueOnce({ ok: true, first: true });
    const { container } = render(
      <RelationToggle relation="follow" profileId="p2" on={false} />,
    );
    await pressFollow();
    await waitFor(() => expect(line(container)).not.toBeNull());
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Following" }),
      ).not.toHaveAttribute("aria-busy"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Following" }));
    // The optimistic flip: gone with the press, before the write is answered.
    expect(line(container)).toBeNull();
    await waitFor(() => expect(unfollow).toHaveBeenCalledWith("p2"));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Follow" }),
      ).not.toHaveAttribute("aria-busy"),
    );

    follow.mockResolvedValueOnce({ ok: true });
    fireEvent.click(screen.getByRole("button", { name: "Follow" }));
    await waitFor(() => expect(follow).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Following" }),
      ).not.toHaveAttribute("aria-busy"),
    );
    expect(line(container)).toBeNull();
  });

  it("says nothing for a follow that was refused", async () => {
    follow.mockResolvedValue({ ok: false, message: "Not now." });
    const { container } = render(
      <RelationToggle relation="follow" profileId="p2" on={false} />,
    );
    await pressFollow();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Not now."));
    expect(line(container)).toBeNull();
    expect(announced()).toBe("");
  });

  it("★ is turned off by a surface that stands the line itself, and draws no announcement either", async () => {
    follow.mockResolvedValue({ ok: true, first: true });
    const { container } = render(
      <RelationToggle
        relation="follow"
        profileId="p2"
        on={false}
        privateLine={false}
      />,
    );
    await pressFollow();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Following" }),
      ).not.toHaveAttribute("aria-busy"),
    );
    expect(line(container)).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("is a follow's alone: a block never says it", async () => {
    block.mockResolvedValue({ ok: true, first: true });
    const { container } = render(
      <RelationToggle
        relation="block"
        profileId="p1"
        on={false}
        person="Maya"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Block" }));
    const ask = screen.getByRole("alertdialog");
    fireEvent.click(
      [...ask.querySelectorAll("button")].find(
        (b) => b.textContent === "Block",
      )!,
    );
    await waitFor(() => expect(block).toHaveBeenCalledWith("p1"));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Unblock" }),
      ).toBeInTheDocument(),
    );
    expect(line(container)).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("★ reports to a page's scope instead of drawing a second copy: the slot under the head draws it, in her name for the page", async () => {
    follow.mockResolvedValue({ ok: true, first: true });
    const { container } = render(
      <FirstFollowScope name="Maya Alvarez">
        <RelationToggle relation="follow" profileId="p2" on={false} />
        <div data-testid="under-the-head">
          <FirstFollowSlot />
        </div>
      </FirstFollowScope>,
    );
    expect(line(container)).toBeNull();

    await pressFollow();
    await waitFor(() =>
      expect(
        screen
          .getByTestId("under-the-head")
          .querySelector("[data-follow-line]"),
      ).not.toBeNull(),
    );
    // One line, in the slot: the button's own neighbour drew none.
    expect(container.querySelectorAll("[data-follow-line]")).toHaveLength(1);
    expect(announced()).toBe(followWords("Maya Alvarez"));

    // Unfollowing empties the slot.
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Following" }),
      ).not.toHaveAttribute("aria-busy"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Following" }));
    await waitFor(() => expect(line(container)).toBeNull());
  });
});

/**
 * EVERY FACE IS ON IT. Today's three hand-rolled controls were what the board found; this keeps a
 * fourth from being written: the faces run the one hook, nothing re-reads the page by hand (the Server
 * Functions revalidate, and Next renders the page into their response), and Account no longer keeps a
 * second unfollow and unblock.
 */
describe("every face of a relation is on the one control", () => {
  const ROOT = process.cwd();
  const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
  /** The source with its comments out, so a WHY-comment naming what is gone is not the thing itself. */
  const code = (rel: string) =>
    read(rel)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

  // ★ RESHAPED BY account-moments r1 (`tidy=stays`): the Connections rows moved out of the Account page into their own
  // island (`page-connections.tsx`), one row component drawing both lists, so the page holds none and the island holds
  // the one `<RelationToggle`. The scar kept is the claim: the rows run the one control, and no second pair of buttons
  // came back. The blocked well on a profile is a face too.
  it("the profile's Follow, the menu's Block row, the blocked well and the Connections rows run the one hook", () => {
    expect(read("src/components/social/follow-button.tsx")).toMatch(
      /<RelationToggle\b/,
    );
    expect(read("src/components/social/profile-actions-menu.tsx")).toMatch(
      /useRelation\(\{\s*relation: "block"/,
    );
    expect(read("src/app/(guest)/u/[slug]/blocked-well.tsx")).toMatch(
      /<RelationToggle\b/,
    );
    // The rows' button and the look's Follow, which the island hands the look (`GuestPeek`'s `follow`).
    const rows = read("src/app/(app)/account/page-connections.tsx");
    expect(rows.match(/<RelationToggle\b/g) ?? []).toHaveLength(2);
    expect(read("src/app/(app)/account/page.tsx")).not.toMatch(
      /<RelationToggle\b/,
    );
    expect(
      existsSync(join(ROOT, "src/components/social/connection-buttons.tsx")),
    ).toBe(false);
  });

  it("no face refreshes the page by hand, and Account keeps no second pair of writes", () => {
    for (const rel of [
      "src/components/social/relation-toggle.tsx",
      "src/components/social/follow-button.tsx",
      "src/components/social/profile-actions-menu.tsx",
    ]) {
      expect(code(rel), rel).not.toMatch(/router\.refresh\(|useRouter\(/);
    }
    const accountActions = read("src/app/(app)/account/social-actions.ts");
    expect(accountActions).not.toMatch(/export async function unfollowAction/);
    expect(accountActions).not.toMatch(/export async function unblockAction/);
  });
});
