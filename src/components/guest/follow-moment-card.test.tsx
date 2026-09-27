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
