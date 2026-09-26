import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { GuestActionDock } from "@/components/guest/guest-action-dock";

/**
 * THE DOCK'S CONTRACT. A guest sees the actions high on the page on landing,
 * and the dock keeps them visible as they scroll on.
 *
 * FUNCTION ONLY. Nothing here reads a gradient, a corner or a travel distance:
 * what is pinned is that the bar carries BOTH of the row's actions, that it is
 * genuinely gone — off the tab order and out of the accessibility tree — while
 * the row is still on screen, and that it never invents an action the page
 * above it does not offer. The look is free to retune.
 */
const invite = <button type="button">Invite</button>;

const dock = () => document.querySelector("[data-guest-dock]");

describe("the dock carries the row's own two actions", () => {
  it("groups Add beside Invite", () => {
    render(
      <GuestActionDock
        hidden={false}
        uploadingCount={0}
        onAdd={() => {}}
        invite={invite}
      />,
    );
    const group = screen.getByRole("group", { name: "Album actions" });
    expect(group).toBeInTheDocument();
    // Both reachable as real controls, which is the whole of "reachable at any
    // depth": a bar carrying only one of them would fail it.
    expect(
      screen.getByRole("button", { name: /Add photos/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invite" })).toBeInTheDocument();
    expect(group).toContainElement(
      screen.getByRole("button", { name: "Invite" }),
    );
  });

  it("drops Add exactly where the row drops it (uploads closed, empty album)", () => {
    render(
      <GuestActionDock hidden={false} uploadingCount={0} invite={invite} />,
    );
    expect(screen.queryByRole("button", { name: /Add photos/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Invite" })).toBeInTheDocument();
  });

  it("draws nothing at all — scrim included — when there is nothing to dock", () => {
    render(<GuestActionDock hidden={false} uploadingCount={0} />);
    expect(dock()).toBeNull();
  });

  it("says how many uploads are in flight, and nothing at zero", () => {
    const { rerender } = render(
      <GuestActionDock hidden={false} uploadingCount={0} onAdd={() => {}} />,
    );
    expect(screen.queryByText(/uploading/)).toBeNull();
    rerender(
      <GuestActionDock hidden={false} uploadingCount={3} onAdd={() => {}} />,
    );
    expect(screen.getByText("3 uploading")).toBeInTheDocument();
  });

  it("opens the picker on a tap", () => {
    const onAdd = vi.fn();
    render(<GuestActionDock hidden={false} uploadingCount={0} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button", { name: /Add photos/ }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});

describe("hidden means GONE, not merely invisible", () => {
  it("is inert while the row is still on screen, and live once it leaves", () => {
    const { rerender } = render(
      <GuestActionDock
        hidden
        uploadingCount={0}
        onAdd={() => {}}
        invite={invite}
      />,
    );
    // `inert` is what takes the two buttons out of the tab order AND the
    // accessibility tree; opacity alone would leave a keyboard walking into a
    // bar nobody can see, and a screen reader reading actions twice.
    expect(dock()!.hasAttribute("inert")).toBe(true);
    expect(dock()!.hasAttribute("data-hidden")).toBe(true);

    rerender(
      <GuestActionDock
        hidden={false}
        uploadingCount={0}
        onAdd={() => {}}
        invite={invite}
      />,
    );
    expect(dock()!.hasAttribute("inert")).toBe(false);
    expect(dock()!.hasAttribute("data-hidden")).toBe(false);
  });

  it("stays MOUNTED while hidden, so it travels rather than appears", () => {
    render(
      <GuestActionDock
        hidden
        uploadingCount={0}
        onAdd={() => {}}
        invite={invite}
      />,
    );
    expect(dock()).not.toBeNull();
  });
});
