/**
 * AT THE DOOR (event-settings r1, `queue=room`; guests-room r1, `rows=list` and `card=standing`): each newcomer who
 * waits is one calm row with one act, Let in, and her name opens her card, where Decline stands beside Let in.
 * Held: a row leaves the moment it is answered and returns, with a sentence, if the answer fails; a
 * decline's toast carries Let in, which lifts it and lets her in (host-moments r1, `let-back=straight`); at
 * Only me a Let in never says the album opens; and the section is not drawn at all when nobody waits.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LET_IN, letInToast } from "@/lib/events/event-blocks";

const { toast, letInAtDoorAction, declineAtDoorAction, letBackInAction } =
  vi.hoisted(() => ({
    toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
    letInAtDoorAction: vi.fn(),
    declineAtDoorAction: vi.fn(),
    letBackInAction: vi.fn(),
  }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/app/(app)/dashboard/[eventId]/guests/actions", () => ({
  letInAtDoorAction: (...a: unknown[]) => letInAtDoorAction(...a),
  declineAtDoorAction: (...a: unknown[]) => declineAtDoorAction(...a),
  letBackInAction: (...a: unknown[]) => letBackInAction(...a),
}));

// Her card is the one every name opens (`GuestPeek`), whose Follow reaches the profile's server actions (server-only).
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  followProfileAction: vi.fn(),
  unfollowProfileAction: vi.fn(),
}));

const { AtTheDoor } = await import("./at-the-door");

/** The decline, as she makes it now: her name opens her card, and Decline is pressed there (`card=standing`). */
async function decline(name = "Wren") {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${name}`) }));
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: `Decline ${name}` }));
  });
}

const EVENT = "11111111-2222-4333-8444-555555555555";
const WREN = {
  guestId: "33333333-4444-4555-8666-777777777777",
  userId: "55555555-6666-4777-8888-999999999999",
  name: "Wren",
  email: "wren@example.com",
  asked: "5 minutes ago",
  waited: "5 min",
  seed: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("at the door", () => {
  it("is not drawn while nobody waits", () => {
    const { container } = render(
      <AtTheDoor eventId={EVENT} people={[]} total={0} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("names who waits, how long beside the name, and the address she confirmed under it", () => {
    render(<AtTheDoor eventId={EVENT} people={[WREN]} total={1} />);
    expect(screen.getByText("Wren")).toBeTruthy();
    expect(screen.getByText("5 min")).toBeTruthy();
    expect(screen.getByText("wren@example.com")).toBeTruthy();
  });

  it("★ the row keeps one act, Let in, naming whom; Decline is her card's, explained there (`card=standing`)", () => {
    render(<AtTheDoor eventId={EVENT} people={[WREN]} total={1} />);
    expect(screen.getByRole("button", { name: "Let in Wren" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /decline/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Wren/ }));
    const card = screen.getByRole("dialog", { name: "Wren" });
    expect(card).toHaveTextContent("At the door for 5 min");
    expect(screen.getByRole("button", { name: "Decline Wren" })).toBeTruthy();
    expect(card).toHaveTextContent(/declining blocks them/i);
  });

  it("★ its count wears the tally the hub's Guests card wears: someone waits on her", () => {
    render(<AtTheDoor eventId={EVENT} people={[WREN]} total={3} />);
    expect(document.querySelector("[data-needs]")).toHaveTextContent("3");
  });

  it("a newcomer with no name stands under the address she confirmed, split at its @, read whole", () => {
    render(
      <AtTheDoor
        eventId={EVENT}
        people={[{ ...WREN, name: null, waited: "now" }]}
        total={1}
      />,
    );
    const row = document.querySelector("[data-door-name]");
    expect(row).toHaveTextContent("wren@example.com");
    expect(screen.getByText("@example.com")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Let in wren@example.com" }),
    ).toBeTruthy();
  });

  it("★ Let in opens her door, and the row leaves at once", async () => {
    letInAtDoorAction.mockResolvedValue({ ok: true, admitted: 1 });
    render(<AtTheDoor eventId={EVENT} people={[WREN]} total={1} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Let in Wren" }));
    });
    expect(letInAtDoorAction).toHaveBeenCalledWith({
      eventId: EVENT,
      guestId: WREN.guestId,
    });
    expect(screen.queryByText("Wren")).toBeNull();
    expect(toast.success).toHaveBeenCalledWith(
      "Wren is in.",
      expect.anything(),
    );
  });

  it("a failed answer puts the row back, with a sentence", async () => {
    letInAtDoorAction.mockResolvedValue({
      ok: false,
      message: "That didn't go through.",
    });
    render(<AtTheDoor eventId={EVENT} people={[WREN]} total={1} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Let in Wren" }));
    });
    expect(screen.getByText("Wren")).toBeTruthy();
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't let them in.",
      expect.objectContaining({ description: "That didn't go through." }),
    );
  });

  // ★ RESHAPED ON PURPOSE (host-moments r1, `let-back=straight`; scar kept: a decline is taken back from its own
  // toast, in one press, and the block it made is the one lifted). The expired reason: "its Undo lets her back to
  // the door". Undoing a decline means yes (the board's reason, which Will picked), so the toast's key says Let in,
  // Blocked's own word, and she is in, in the words Blocked's Let in says it in.
  it("★ Decline blocks her account, and its toast's Let in lifts it and lets her in", async () => {
    declineAtDoorAction.mockResolvedValue({ ok: true, blockId: "block-1" });
    letBackInAction.mockResolvedValue({
      ok: true,
      restored: 0,
      noRoom: 0,
      admitted: 1,
    });
    render(<AtTheDoor eventId={EVENT} people={[WREN]} total={1} />);
    await decline();
    expect(declineAtDoorAction).toHaveBeenCalledWith({
      eventId: EVENT,
      guestId: WREN.guestId,
      userId: WREN.userId,
    });
    expect(screen.queryByText("Wren")).toBeNull();
    const [, options] = toast.mock.calls[0] as [
      string,
      { action: { label: string; onClick: () => void } },
    ];
    expect(options.action.label).toBe(LET_IN);
    await act(async () => {
      options.action.onClick();
    });
    expect(letBackInAction).toHaveBeenCalledWith({
      blockId: "block-1",
      restore: false,
      letIn: true,
    });
    const said = letInToast("Wren", { from: "decline", onlyMe: false });
    expect(toast.success).toHaveBeenCalledWith(said.title, {
      description: said.description,
    });
    // She is in, not back at the door: her row stays answered.
    expect(screen.queryByText("Wren")).toBeNull();
  });

  it("a Let in from the decline's toast that fails says so, and she stays declined", async () => {
    declineAtDoorAction.mockResolvedValue({ ok: true, blockId: "block-1" });
    letBackInAction.mockResolvedValue({ ok: false, message: "Nope." });
    render(<AtTheDoor eventId={EVENT} people={[WREN]} total={1} />);
    await decline();
    const [, options] = toast.mock.calls[0] as [
      string,
      { action: { onClick: () => void } },
    ];
    await act(async () => {
      options.action.onClick();
    });
    expect(toast.error).toHaveBeenCalledWith("Couldn't let them in.", {
      description: "Nope.",
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("★ at Only me a Let in never says the album opens, from the row or from the decline's toast (crumbs-30)", async () => {
    letInAtDoorAction.mockResolvedValue({ ok: true, admitted: 1 });
    declineAtDoorAction.mockResolvedValue({ ok: true, blockId: "block-1" });
    letBackInAction.mockResolvedValue({
      ok: true,
      restored: 0,
      noRoom: 0,
      admitted: 1,
    });
    const KIT = {
      ...WREN,
      guestId: "44444444-5555-4666-8777-888888888888",
      name: "Kit",
    };
    render(
      <AtTheDoor
        eventId={EVENT}
        people={[WREN, KIT]}
        total={2}
        door="private"
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Let in Wren" }));
    });
    await decline("Kit");
    const [, options] = toast.mock.calls[0] as [
      string,
      { action: { onClick: () => void } },
    ];
    await act(async () => {
      options.action.onClick();
    });
    const closed = letInToast("x", { from: "door", onlyMe: true }).description;
    for (const call of toast.success.mock.calls) {
      expect((call[1] as { description: string }).description).toBe(closed);
    }
    expect(toast.success).toHaveBeenCalledTimes(2);
  });

  // ★ RESHAPED ON PURPOSE (host-moments r1; scar kept: an answered row stays hidden only until the room is read
  // again). The expired reason: "let back in from Blocked, she is back at the door", since Blocked's Let in lets a
  // standing ask in now; the read that brings her back is one where she asks again.
  it("★ declined, then asking again, she is at the door in the next read (build 23's NIT-4)", async () => {
    declineAtDoorAction.mockResolvedValue({ ok: true, blockId: "block-1" });
    const view = render(
      <AtTheDoor eventId={EVENT} people={[WREN]} total={1} />,
    );
    await decline();
    expect(screen.queryByText("Wren")).toBeNull();
    // The decline's own revalidation: nobody waits.
    view.rerender(<AtTheDoor eventId={EVENT} people={[]} total={0} />);
    // A later read finds her asking again (her ask ended, Blocked lifted the block, she asked once more): she shows.
    view.rerender(
      <AtTheDoor eventId={EVENT} people={[{ ...WREN }]} total={1} />,
    );
    expect(screen.getByText("Wren")).toBeTruthy();
  });
});
