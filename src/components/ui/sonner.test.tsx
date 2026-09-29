import { act } from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup";
import { setViewportWidth } from "../../../vitest.setup";

// vitest.setup.ts stubs the whole "sonner" package for every OTHER component
// test (`Toaster` renders null, `toast` is a bag of vi.fn()s) so a tree that
// merely IMPORTS this file doesn't crash or actually toast. That is exactly
// wrong here: this file's only job is to prove what the REAL library does
// once sonner.tsx's props and its toast.error patch are applied, so it opts
// back into the real thing (the setup file's own documented escape hatch).
vi.unmock("sonner");

import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";

/**
 * `toasts` r1 (2026-09-20), every ask the board's own recommendation:
 * where=top, material=card, life=persist, stack=expanded, action=always.
 * This guards the WIRING - what sonner does with the props and the patch
 * sonner.tsx applies - never a word any of the app's 65 call sites writes.
 *
 * Sonner queues a just-created toast's first paint on a zero-delay
 * setTimeout (its own "prevent batching" comment, index.mjs) rather than
 * committing synchronously, so every assertion below flushes one after
 * firing a toast; life=persist then rides real auto-close timers, hence
 * fake timers throughout.
 */

function flush() {
  act(() => {
    vi.advanceTimersByTime(0);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Toaster", () => {
  it("mounts the band at the top, centered, on both host and guest chrome alike", () => {
    render(<Toaster />);
    act(() => {
      toast("hello", { testId: "t-where" });
    });
    flush();

    const root = document.querySelector("[data-sonner-toaster]");
    expect(root).toHaveAttribute("data-y-position", "top");
    expect(root).toHaveAttribute("data-x-position", "center");
  });

  it("keeps a toast expanded to its full height with no hover", () => {
    render(<Toaster />);
    act(() => {
      toast("first", { testId: "t-expand" });
    });
    flush();

    expect(screen.getByTestId("t-expand")).toHaveAttribute(
      "data-expanded",
      "true",
    );
  });

  it("holds an error open past every finite clock while a success clears on its own", () => {
    render(<Toaster />);
    act(() => {
      toast.success("saved", { testId: "t-success" });
      toast.error("failed", { testId: "t-error" });
    });
    flush();

    expect(screen.getByTestId("t-success")).toBeInTheDocument();
    expect(screen.getByTestId("t-error")).toBeInTheDocument();

    // Past sonner's own 4s default plus its 200ms exit-animation delay.
    act(() => {
      vi.advanceTimersByTime(4300);
    });
    expect(screen.queryByTestId("t-success")).not.toBeInTheDocument();
    expect(screen.getByTestId("t-error")).toBeInTheDocument();

    // Comfortably past any finite clock: still there, because `duration:
    // Infinity` never starts sonner's own close timer at all.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("t-error")).toBeInTheDocument();
  });

  it("gives a persistent error a close control; a clearing success gets none", () => {
    render(<Toaster />);
    act(() => {
      toast.success("saved", { testId: "t-success-close" });
      toast.error("failed", { testId: "t-error-close" });
    });
    flush();

    expect(
      screen.getByTestId("t-error-close").querySelector("[data-close-button]"),
    ).toBeTruthy();
    expect(
      screen
        .getByTestId("t-success-close")
        .querySelector("[data-close-button]"),
    ).toBeNull();
  });

  it("reserves the action slot only when a call site fills it", () => {
    render(<Toaster />);
    const onUndo = vi.fn();
    act(() => {
      toast.success("shipped", {
        testId: "t-action",
        action: { label: "Undo", onClick: onUndo },
      });
      toast.success("shipped, nothing to undo", { testId: "t-no-action" });
    });
    flush();

    const withAction = screen
      .getByTestId("t-action")
      .querySelector("[data-action]");
    expect(withAction).toBeTruthy();
    expect(withAction).toHaveTextContent("Undo");
    // Sonner's own action-button attribute is simply absent, not present
    // and empty: the reserved slot renders nothing when nothing fills it.
    expect(
      screen.getByTestId("t-no-action").querySelector("[data-action]"),
    ).toBeNull();
  });

  it("still lets a call site override the forced error defaults", () => {
    render(<Toaster />);
    act(() => {
      toast.error("quick failure", {
        testId: "t-override",
        duration: 1000,
        closeButton: false,
      });
    });
    flush();

    expect(
      screen.getByTestId("t-override").querySelector("[data-close-button]"),
    ).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1300);
    });
    expect(screen.queryByTestId("t-override")).not.toBeInTheDocument();
  });
});

/**
 * A TOAST OVER AN OPEN MODAL (build 14's red-team: the storage list's Undo
 * closed the list at a desk and went through to the chip under it in a hand,
 * and nothing was undone). Two halves, each its own pin: the band takes
 * presses though a modal has turned them off on the body, and a press on a
 * toast is inside every open layer, so it never reads as the outside press
 * that closes one. Both ride the real Radix layers the product's modals are.
 */
describe("a toast over an open modal", () => {
  afterEach(() => {
    setViewportWidth(1024);
  });

  /** Radix listens for an outside press from a zero-delay timer after it opens. */
  function settle() {
    act(() => {
      vi.advanceTimersByTime(1);
    });
  }

  function toastWithUndo(onUndo: () => void) {
    act(() => {
      toast.success("Removed 2 videos to Deleted", {
        testId: "t-undo",
        action: { label: "Undo", onClick: onUndo },
      });
    });
    flush();
    return screen.getByRole("button", { name: "Undo" });
  }

  function list(onOpenChange: (open: boolean) => void) {
    return (
      <>
        <Popup open onOpenChange={onOpenChange}>
          <PopupContent kind="list" aria-describedby={undefined}>
            <PopupHeader title="What's using space" back="Dashboard" />
            <PopupBody>
              <button type="button">Remove to Deleted</button>
            </PopupBody>
          </PopupContent>
        </Popup>
        <Toaster />
      </>
    );
  }

  it("takes presses while the modal has turned them off on the body", () => {
    render(list(() => {}));
    settle();
    toastWithUndo(() => {});
    expect(document.body.style.pointerEvents).toBe("none");
    expect(
      document.querySelector<HTMLElement>("[data-sonner-toaster]")?.style
        .pointerEvents,
    ).toBe("auto");
  });

  it.each([
    ["at a desk, its side panel", 1024],
    ["in a hand, its own screen", 375],
  ])(
    "is inside the list %s: its Undo acts and the list stays open",
    (_where, width) => {
      setViewportWidth(width);
      const onOpenChange = vi.fn();
      const onUndo = vi.fn();
      render(list(onOpenChange));
      settle();
      const undo = toastWithUndo(onUndo);

      fireEvent.pointerDown(undo);
      fireEvent.click(undo);
      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(
        screen.getByRole("dialog", { name: "What's using space" }),
      ).toBeInTheDocument();

      // The control: a press on the scrim is still the outside press that closes it.
      fireEvent.pointerDown(
        document.querySelector('[data-slot="popup-overlay"]')!,
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    },
  );

  it("is inside the Dialog under every popup too", () => {
    const onOpenChange = vi.fn();
    const onUndo = vi.fn();
    render(
      <>
        <Dialog open onOpenChange={onOpenChange}>
          <DialogContent aria-describedby={undefined}>
            <DialogTitle>Welcome to Pro</DialogTitle>
          </DialogContent>
        </Dialog>
        <Toaster />
      </>,
    );
    settle();
    const undo = toastWithUndo(onUndo);

    fireEvent.pointerDown(undo);
    fireEvent.click(undo);
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.pointerDown(
      document.querySelector('[data-slot="dialog-overlay"]')!,
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
