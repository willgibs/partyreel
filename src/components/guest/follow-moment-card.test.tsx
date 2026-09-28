import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FollowMomentCard } from "./follow-moment-card";

/**
 * THE MOMENT CARD IS THE CONFIRMATION'S ONE BEAT (`guest-capture` r1: `follow=card` within any
 * multi-claim handling, `name=told`: "Rather than 'Change it in Account', we could likely have a
 * simple 'Change' link to actually do so"). Pinned: the other events said once, the name told with
 * a Change that changes it in place through the one display-name action, refused in place, and a
 * card that says nothing is not drawn at all.
 */
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  followProfileAction: vi.fn().mockResolvedValue({ ok: true }),
  unfollowProfileAction: vi.fn().mockResolvedValue({ ok: true }),
}));
const updateDisplayName = vi.fn();
vi.mock("@/app/(app)/account/actions", () => ({
  updateDisplayNameAction: (name: string) => updateDisplayName(name),
}));

const HOST = {
  id: "host-1",
  slug: "maya",
  displayName: "Maya",
  avatarUrl: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  updateDisplayName.mockResolvedValue({ ok: true });
});

describe("FollowMomentCard", () => {
  it("says the other events once, inside the card", () => {
    render(
      <FollowMomentCard
        host={HOST}
        needsHandle={false}
        count={2}
        elsewhere={3}
      />,
    );
    expect(
      screen.getByText(
        /Your uploads from other events are in your account too\./,
      ),
    ).toBeInTheDocument();
  });

  it("tells the name with a Change, and keeps the host's own row", () => {
    render(
      <FollowMomentCard
        host={HOST}
        needsHandle={false}
        count={2}
        toldName="Priya"
      />,
    );
    expect(screen.getByText(/You're on as Priya\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
  });

  it("★ Change edits the name in place: the field takes focus inside the tap, Save writes it", async () => {
    const onRenamed = vi.fn();
    render(
      <FollowMomentCard
        host={HOST}
        needsHandle={false}
        count={2}
        toldName="Priya"
        onRenamed={onRenamed}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Change" }));
    const field = screen.getByLabelText("Your name") as HTMLInputElement;
    expect(field).toHaveFocus();
    expect(field.value).toBe("Priya");
    fireEvent.change(field, { target: { value: "Priya S." } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(updateDisplayName).toHaveBeenCalledWith("Priya S."),
    );
    await waitFor(() => expect(onRenamed).toHaveBeenCalledWith("Priya S."));
    expect(screen.queryByLabelText("Your name")).toBeNull();
  });

  it("refuses in place and writes nothing for a blank name; the server's refusal lands there too", async () => {
    render(
      <FollowMomentCard
        host={HOST}
        needsHandle={false}
        count={2}
        toldName="Priya"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Change" }));
    const field = screen.getByLabelText("Your name");
    fireEvent.change(field, { target: { value: "   " } });
    fireEvent.submit(field.closest("form")!);
    expect(await screen.findByText("Enter a name.")).toBeInTheDocument();
    expect(updateDisplayName).not.toHaveBeenCalled();

    updateDisplayName.mockResolvedValue({
      ok: false,
      code: "validation",
      message: "Please choose a different name.",
    });
    fireEvent.change(field, { target: { value: "Taken" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(
      await screen.findByText("Please choose a different name."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
  });

  it("Cancel puts the told line back, untouched", () => {
    render(
      <FollowMomentCard
        host={HOST}
        needsHandle={false}
        count={2}
        toldName="Priya"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Change" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText(/You're on as Priya\./)).toBeInTheDocument();
    expect(updateDisplayName).not.toHaveBeenCalled();
  });

  it("offers the host the quieter Follow, never the card's loudest button", () => {
    // His guest-capture note: "Follow doesn't have to be pushed as hard as a feature relative to
    // uploads/verifications/etc."
    render(<FollowMomentCard host={HOST} needsHandle={false} count={2} />);
    expect(screen.getByRole("button", { name: "Follow" })).toHaveAttribute(
      "data-variant",
      "ghost",
    );
  });

  it("the handle row points at the page's own setup", () => {
    render(<FollowMomentCard host={null} needsHandle count={1} />);
    expect(screen.getByRole("link", { name: "Claim" })).toHaveAttribute(
      "href",
      "/account/profile",
    );
  });

  it("a card with nothing to say beyond its heading is not drawn", () => {
    const { container } = render(
      <FollowMomentCard host={null} needsHandle={false} count={1} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

/**
 * THE OTHER EVENTS, ONE LINE THAT ACKNOWLEDGES AND NEVER LEADS OUT (`identity-claims` r3, Will's
 * `pointer=line`: "not attempt to point guests out of the event to their dashboard or past events.
 * Simply acknowledging the existence of other events and allowing that to be handled back on the
 * dashboard later is enough"). Pinned in each case: her uploads elsewhere alone finish the keep's
 * sentence; events waiting under her email stand as one row with nothing to press; both are that
 * one row, and the card says "other events" once.
 */
describe("FollowMomentCard: the other events, once", () => {
  const KEEP = /All 2 are in your account now, and this event came with them\./;
  const row = (container: HTMLElement) =>
    container.querySelector<HTMLElement>("[data-follow-moment-others]");
  const otherEvents = (container: HTMLElement) =>
    (container.textContent?.match(/other events/g) ?? []).length;

  it("here only: no line about other events at all", () => {
    const { container } = render(
      <FollowMomentCard host={HOST} needsHandle={false} count={2} />,
    );
    expect(screen.getByText(KEEP)).toBeInTheDocument();
    expect(row(container)).toBeNull();
    expect(container.textContent).not.toMatch(
      /other events|more events|another event|dashboard/,
    );
  });

  it("elsewhere only: they finish the keep's sentence, with no row of their own", () => {
    const { container } = render(
      <FollowMomentCard
        host={HOST}
        needsHandle={false}
        count={2}
        elsewhere={3}
      />,
    );
    expect(screen.getByText(KEEP)).toHaveTextContent(
      "Your uploads from other events are in your account too.",
    );
    expect(row(container)).toBeNull();
    expect(otherEvents(container)).toBe(1);
  });

  it("★ waiting only: one row, under what she keeps and above the host, with nothing to press", () => {
    const { container } = render(
      <FollowMomentCard
        host={HOST}
        needsHandle
        count={2}
        waiting={4}
        toldName="Priya"
      />,
    );
    const line = row(container);
    expect(line).toHaveTextContent(
      "4 more events have photos waiting on your dashboard, whenever you like.",
    );
    // No Review, no link: the album stays the host's, and her dashboard sorts them later.
    expect(line!.querySelector("a, button")).toBeNull();
    expect(
      screen.queryByRole("link", { name: /review|dashboard/i }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: /review/i })).toBeNull();
    // The keep's sentence says only what she keeps.
    expect(screen.getByText(KEEP)).not.toHaveTextContent(/events/);
    // Right under what she keeps (the told name included), above the host's row and the handle.
    const told = container.querySelector("[data-told-name]")!;
    const hostRow = container.querySelector("[data-follow-moment-host]")!;
    expect(
      told.compareDocumentPosition(line!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      line!.compareDocumentPosition(hostRow) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("both: the one row says both, and the card says other events once", () => {
    const { container } = render(
      <FollowMomentCard
        host={HOST}
        needsHandle={false}
        count={2}
        elsewhere={2}
        waiting={1}
      />,
    );
    expect(row(container)).toHaveTextContent(
      "Your uploads from other events are in your account too, and another event has photos waiting on your dashboard, whenever you like.",
    );
    expect(screen.getByText(KEEP)).not.toHaveTextContent(/other events/);
    expect(otherEvents(container)).toBe(1);
  });

  it("the waiting events are enough on their own for the card to stand", () => {
    const { container } = render(
      <FollowMomentCard
        host={null}
        needsHandle={false}
        count={1}
        waiting={2}
      />,
    );
    expect(row(container)).toHaveTextContent(
      "2 more events have photos waiting on your dashboard, whenever you like.",
    );
  });
});
