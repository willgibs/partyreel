/**
 * AT THE DOOR (event-settings r1, `queue=room`): Let in and Decline on each newcomer who waits.
 * Held: a row leaves the moment it is answered and returns, with a sentence, if the answer fails; a
 * decline carries its Undo, which lets her back to the door; and the section is not drawn at all when
 * nobody waits.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const { AtTheDoor } = await import("./at-the-door");

const EVENT = "11111111-2222-4333-8444-555555555555";
const WREN = {
  guestId: "33333333-4444-4555-8666-777777777777",
  userId: "55555555-6666-4777-8888-999999999999",
  name: "Wren",
  email: "wren@example.com",
  asked: "5 minutes ago",
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

  it("names who waits, their address and when they asked", () => {
    render(<AtTheDoor eventId={EVENT} people={[WREN]} total={1} />);
    expect(screen.getByText("Wren")).toBeTruthy();
    expect(screen.getByText("wren@example.com")).toBeTruthy();
    expect(screen.getByText("asked 5 minutes ago")).toBeTruthy();
  });

  it("★ Let in opens her door, and the row leaves at once", async () => {
    letInAtDoorAction.mockResolvedValue({ ok: true, admitted: 1 });
    render(<AtTheDoor eventId={EVENT} people={[WREN]} total={1} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Let in" }));
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
      fireEvent.click(screen.getByRole("button", { name: "Let in" }));
    });
    expect(screen.getByText("Wren")).toBeTruthy();
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't let them in.",
      expect.objectContaining({ description: "That didn't go through." }),
    );
  });

  it("★ Decline blocks her account, and its Undo lets her back to the door", async () => {
    declineAtDoorAction.mockResolvedValue({ ok: true, blockId: "block-1" });
    letBackInAction.mockResolvedValue({ ok: true, restored: 0, noRoom: 0 });
    render(<AtTheDoor eventId={EVENT} people={[WREN]} total={1} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    });
    expect(declineAtDoorAction).toHaveBeenCalledWith({
      eventId: EVENT,
      guestId: WREN.guestId,
      userId: WREN.userId,
    });
    expect(screen.queryByText("Wren")).toBeNull();
    const [, options] = toast.mock.calls[0] as [
      string,
      { action: { onClick: () => void } },
    ];
    await act(async () => {
      options.action.onClick();
    });
    expect(letBackInAction).toHaveBeenCalledWith({
      blockId: "block-1",
      restore: false,
    });
    expect(screen.getByText("Wren")).toBeTruthy();
  });

  it("★ declined, then let back in from Blocked, she is at the door again in the next read (build 23's NIT-4)", async () => {
    declineAtDoorAction.mockResolvedValue({ ok: true, blockId: "block-1" });
    const view = render(
      <AtTheDoor eventId={EVENT} people={[WREN]} total={1} />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    });
    expect(screen.queryByText("Wren")).toBeNull();
    // The decline's own revalidation: nobody waits.
    view.rerender(<AtTheDoor eventId={EVENT} people={[]} total={0} />);
    // Let back in, pressed under Blocked, revalidates the room: she waits again, and shows.
    view.rerender(
      <AtTheDoor eventId={EVENT} people={[{ ...WREN }]} total={1} />,
    );
    expect(screen.getByText("Wren")).toBeTruthy();
  });
});
