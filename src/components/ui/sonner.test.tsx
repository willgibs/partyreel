// @contract-for: src/components/ui/sonner.tsx
import { act } from "react";

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
