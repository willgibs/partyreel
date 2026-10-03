/**
 * SEE IT AS A GUEST STANDS OVER THE HUB, AND EVERY WAY OUT LANDS ON IT (event-header r2, `rooms=over`).
 *
 * The stage holds the guests' view's own page in a phone's viewport (framed: the hub's stage carries the way back),
 * offers it whole in a tab of its own, and closes from its way back, Escape, and a press on the dimmed hub. jsdom lays
 * nothing out, so the phone's fit and the dimmed hub are the Handoff's pictures; what is pinned is where the frame
 * points, that every way out closes, and that the stage names itself as the room it is.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AsGuestStage } from "./as-guest-stage";

function stage() {
  const onOpenChange = vi.fn();
  render(
    <AsGuestStage
      open
      onOpenChange={onOpenChange}
      eventId="e1"
      eventName="Maya & Jay"
      doorLine="Private · You let in"
    />,
  );
  return { onOpenChange, dialog: screen.getByRole("dialog") };
}

describe("See it as a guest, over the hub", () => {
  it("★ holds the guests' view's own page, framed, in the phone", () => {
    const { dialog } = stage();
    const frame = dialog.querySelector("iframe");
    expect(frame).toHaveAttribute("src", "/dashboard/e1/as-guest?in=hub");
    expect(frame).toHaveAttribute("title", "Maya & Jay, as your guests see it");
    expect(dialog).toHaveAttribute("data-room-panel", "as-guest");
  });

  it("offers the same view whole in a tab of its own, where it carries its own way back", () => {
    const { dialog } = stage();
    const tab = within(dialog).getByRole("link", {
      name: /open it in a new tab/i,
    });
    expect(tab).toHaveAttribute("href", "/dashboard/e1/as-guest");
    expect(tab).toHaveAttribute("target", "_blank");
  });

  it("says who meets the album, beside the phone", () => {
    const { dialog } = stage();
    expect(dialog).toHaveTextContent("What your guests see");
    expect(dialog).toHaveTextContent("Private · You let in");
  });

  it("★ closes from its way back (a desk's, and a hand's arrow naming the event)", () => {
    const { onOpenChange, dialog } = stage();
    fireEvent.click(
      within(dialog).getByRole("button", { name: /back to your hub/i }),
    );
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    onOpenChange.mockClear();
    fireEvent.click(
      within(dialog).getByRole("button", { name: /maya & jay/i }),
    );
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("closes on Escape, and on a press on the dimmed hub (never on the phone)", () => {
    const { onOpenChange, dialog } = stage();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    onOpenChange.mockClear();
    fireEvent.pointerDown(dialog.querySelector("[data-as-guest-phone]")!);
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.pointerDown(dialog);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});
