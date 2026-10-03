import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { GuestActionDock } from "@/components/guest/guest-action-dock";
import type { QueueItem, QueueProgress } from "@/lib/guest/use-upload-queue";

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
    // ★ Reshaped on purpose (`event-header` r1, `stays=shutter`): the count rides the shutter's
    // shoulder as a number and its name says it in words, where the bar's button said "3 uploading".
    const { rerender } = render(
      <GuestActionDock hidden={false} uploadingCount={0} onAdd={() => {}} />,
    );
    expect(
      screen.getByRole("button", { name: "Add photos" }),
    ).toBeInTheDocument();
    expect(document.querySelector("[data-slot='shutter-count']")).toBeNull();
    rerender(
      <GuestActionDock hidden={false} uploadingCount={3} onAdd={() => {}} />,
    );
    const shutter = screen.getByRole("button", {
      name: "Add photos, 3 uploading",
    });
    expect(shutter).toHaveAttribute("data-state", "sending");
    expect(
      shutter.querySelector("[data-slot='shutter-count']")?.textContent,
    ).toBe("3");
  });

  it("opens the picker on a tap", () => {
    const onAdd = vi.fn();
    render(<GuestActionDock hidden={false} uploadingCount={0} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button", { name: /Add photos/ }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});

/**
 * ★ WHERE THE ALBUM'S ADD OPENS ITS CAMERA the shutter says so (crumbs-52, `disposable-camera`'s Question): Take photos,
 * the camera on its face, the count on its shoulder worded the same; every other album keeps the upload shutter.
 */
describe("on an album whose Add opens its camera", () => {
  it("★ the shutter says Take photos and wears the camera, its count worded the same", () => {
    const { rerender } = render(
      <GuestActionDock
        hidden={false}
        uploadingCount={0}
        onAdd={() => {}}
        camera
      />,
    );
    const shutter = screen.getByRole("button", { name: "Take photos" });
    expect(shutter.querySelector("svg.lucide-camera")).not.toBeNull();
    expect(shutter.querySelector("svg.lucide-image-up")).toBeNull();
    expect(screen.queryByRole("button", { name: /Add photos/ })).toBeNull();
    rerender(
      <GuestActionDock
        hidden={false}
        uploadingCount={2}
        onAdd={() => {}}
        camera
      />,
    );
    expect(
      screen.getByRole("button", { name: "Take photos, 2 uploading" }),
    ).toHaveAttribute("data-state", "sending");
  });

  it("is the upload shutter on every other album", () => {
    render(
      <GuestActionDock hidden={false} uploadingCount={0} onAdd={() => {}} />,
    );
    const shutter = screen.getByRole("button", { name: "Add photos" });
    expect(shutter.querySelector("svg.lucide-image-up")).not.toBeNull();
    expect(shutter.querySelector("svg.lucide-camera")).toBeNull();
  });

  it("presses the same Add", () => {
    const onAdd = vi.fn();
    render(
      <GuestActionDock
        hidden={false}
        uploadingCount={0}
        onAdd={onAdd}
        camera
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Take photos" }));
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

/**
 * HER TRACKER RIDES THE DOCK TOO (`guest-capture` r1, `tracker=button`): the dock carries what the
 * row carries, so the round button sits beside Add there as it does above.
 */
describe("the dock carries her tracker", () => {
  it("draws the tracker slot inside the group, after Add", () => {
    render(
      <GuestActionDock
        hidden={false}
        uploadingCount={0}
        onAdd={() => {}}
        invite={invite}
        tracker={<button type="button">Your uploads</button>}
      />,
    );
    const group = screen.getByRole("group", { name: "Album actions" });
    const tracker = screen.getByRole("button", { name: "Your uploads" });
    expect(group).toContainElement(tracker);
    const add = screen.getByRole("button", { name: /Add photos/ });
    // Beside Add: it follows it in the bar's own order.
    expect(
      add.compareDocumentPosition(tracker) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("is only a slot: nothing to track draws nothing, and the bar is unchanged", () => {
    render(
      <GuestActionDock
        hidden={false}
        uploadingCount={0}
        onAdd={() => {}}
        invite={invite}
        tracker={null}
      />,
    );
    expect(screen.queryByRole("button", { name: /Your uploads/ })).toBeNull();
  });
});

/**
 * WHAT STAYS IS THE SHUTTER (`event-header` r1, `stays=shutter`), with his two notes: a matching secondary on the
 * shutter's right (Invite's twin), and the page's ground rising from the foot while more album lies below.
 */
describe("the shutter's flanks and its foot", () => {
  it("★ stands Invite on its left and the twin on its right, the shutter between", () => {
    render(
      <GuestActionDock
        hidden={false}
        uploadingCount={0}
        onAdd={() => {}}
        invite={invite}
        twin={<button type="button">Watch the highlight reel</button>}
      />,
    );
    const group = screen.getByRole("group", { name: "Album actions" });
    const order = [...group.querySelectorAll("button")].map(
      (b) => b.getAttribute("aria-label") ?? b.textContent,
    );
    expect(order).toEqual(["Invite", "Add photos", "Watch the highlight reel"]);
    expect(screen.getByRole("button", { name: "Add photos" })).toHaveAttribute(
      "data-slot",
      "shutter",
    );
  });

  it("★ lets the page's ground rise only while more album lies below", () => {
    const fade = () => document.querySelector("[data-dock-fade]");
    const { rerender } = render(
      <GuestActionDock
        hidden={false}
        uploadingCount={0}
        onAdd={() => {}}
        more
      />,
    );
    expect(fade()).toHaveAttribute("data-more");
    rerender(
      <GuestActionDock
        hidden={false}
        uploadingCount={0}
        onAdd={() => {}}
        more={false}
      />,
    );
    expect(fade()).not.toHaveAttribute("data-more");
  });
});

describe("the shutter's ring is her run", () => {
  const file = (id: string, status: QueueItem["status"]): QueueItem => ({
    id,
    file: new File(["x"], `${id}.jpg`, { type: "image/jpeg" }),
    kind: "photo",
    status,
    progress: status === "done" ? 100 : 0,
  });
  const NO_TICKS: QueueProgress = { get: () => 0, subscribe: () => () => {} };
  const dock = (items: QueueItem[]) => (
    <GuestActionDock
      hidden={false}
      uploadingCount={
        items.filter((it) => it.status !== "done" && it.status !== "error")
          .length
      }
      onAdd={() => {}}
      run={{ items, progress: NO_TICKS }}
    />
  );
  const shutter = () => document.querySelector("[data-slot='shutter']")!;

  it("★ sends while files go, stands whole with its check for a beat when they land, then rests", () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(dock([]));
      expect(shutter()).toHaveAttribute("data-state", "idle");
      rerender(dock([file("a", "uploading"), file("b", "queued")]));
      expect(shutter()).toHaveAttribute("data-state", "sending");
      rerender(dock([file("a", "done"), file("b", "done")]));
      expect(shutter()).toHaveAttribute("data-state", "done");
      act(() => {
        vi.advanceTimersByTime(1600);
      });
      expect(shutter()).toHaveAttribute("data-state", "idle");
    } finally {
      vi.useRealTimers();
    }
  });

  it("never claims a run with a refusal in it landed (the failure sheet says so instead)", () => {
    const { rerender } = render(dock([file("a", "uploading")]));
    rerender(dock([file("a", "error")]));
    expect(shutter()).toHaveAttribute("data-state", "idle");
    rerender(dock([file("a", "error"), file("b", "uploading")]));
    rerender(dock([file("a", "error"), file("b", "done")]));
    expect(shutter()).toHaveAttribute("data-state", "done");
  });
});
