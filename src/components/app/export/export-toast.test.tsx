import { act } from "react";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The setup file stubs sonner for every component test; this one proves what the REAL library does
// with the download's toast (sonner.test.tsx's own escape hatch).
vi.unmock("sonner");

import { exportToasts } from "@/components/app/export/export-toast";
import { Toaster } from "@/components/ui/sonner";

/**
 * THE DOWNLOAD'S TOAST ON THE REAL TOASTER (`export-toast.tsx`): one toast a download, updated in
 * place, with Will's "subtle x icon on the right side" in every state that waits on her, sonner's
 * own top-left close off (even on an error, whose patched default turns it on), and nothing a state
 * leaves behind for the next (sonner merges an update into the toast it replaces).
 */

function flush() {
  act(() => {
    vi.advanceTimersByTime(0);
  });
}

const toastEl = () =>
  document.querySelector<HTMLElement>("[data-sonner-toast]") as HTMLElement;

beforeEach(() => {
  vi.useFakeTimers();
  render(<Toaster />);
});
afterEach(() => {
  act(() => exportToasts.dismiss("dl"));
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe("the download's toast", () => {
  it("waits with a spinner and the x on its right, and cannot be swiped away", () => {
    const cancel = vi.fn();
    act(() =>
      exportToasts.show("dl", {
        tone: "wait",
        title: "Preparing your download…",
        close: { label: "Cancel download", run: cancel },
      }),
    );
    flush();

    const el = toastEl();
    expect(el).toHaveAttribute("data-type", "loading");
    expect(el).toHaveAttribute("data-dismissible", "false");
    expect(el).toHaveTextContent("Preparing your download…");
    // Sonner's own close (top-left) is off; the x is the last thing in the row, on the right.
    expect(el.querySelector("[data-close-button]")).toBeNull();
    const controls = el.querySelector(
      "[data-export-toast-controls]",
    ) as HTMLElement;
    expect(el.lastElementChild).toBe(controls);
    const x = within(controls).getByRole("button", { name: "Cancel download" });
    fireEvent.click(x);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("between parts: neutral, the next part's button, then the x", () => {
    const next = vi.fn();
    act(() =>
      exportToasts.show("dl", {
        tone: "between",
        title: "Part 1 of 3 is downloading.",
        action: { label: "Get part 2", run: next },
        close: { label: "Stop after this part", run: vi.fn() },
      }),
    );
    flush();

    const el = toastEl();
    expect(el).toHaveAttribute("data-type", "info");
    const buttons = within(el).getAllByRole("button");
    expect(
      buttons.map((b) => b.getAttribute("aria-label") ?? b.textContent),
    ).toEqual(["Get part 2", "Stop after this part"]);
    // The part's button wears sonner's own action styling, like every toast's Undo.
    expect(buttons[0]).toHaveAttribute("data-button");
    fireEvent.click(buttons[0]);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("an error keeps the x on the right, never sonner's corner close", () => {
    act(() =>
      exportToasts.show("dl", {
        tone: "refused",
        title: "Nothing left to download.",
        action: { label: "Try again", run: vi.fn() },
        close: { label: "Dismiss", run: vi.fn() },
      }),
    );
    flush();

    const el = toastEl();
    expect(el).toHaveAttribute("data-type", "error");
    expect(el.querySelector("[data-close-button]")).toBeNull();
    expect(
      within(el).getByRole("button", { name: "Dismiss" }),
    ).toBeInTheDocument();
  });

  it("a wait that turns done carries nothing over: no x, no endless life", () => {
    act(() =>
      exportToasts.show("dl", {
        tone: "wait",
        title: "Preparing your download…",
        close: { label: "Cancel download", run: vi.fn() },
      }),
    );
    flush();
    act(() =>
      exportToasts.show("dl", {
        tone: "done",
        title: "Your download is starting.",
        duration: 4000,
      }),
    );
    flush();

    const el = toastEl();
    expect(el).toHaveAttribute("data-type", "success");
    expect(el).toHaveTextContent("Your download is starting.");
    expect(el.querySelector("[data-export-toast-controls]")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);

    // It goes on its own, as any success does.
    act(() => {
      vi.advanceTimersByTime(4500);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(document.querySelector("[data-sonner-toast]")).toBeNull();
  });

  it("a short zip is amber, with its Try again and the x", () => {
    act(() =>
      exportToasts.show("dl", {
        tone: "short",
        title: "142 of 148 are in your download.",
        action: { label: "Try again for the 6", run: vi.fn() },
        close: { label: "Dismiss", run: vi.fn() },
      }),
    );
    flush();
    const el = toastEl();
    expect(el).toHaveAttribute("data-type", "warning");
    expect(
      within(el).getByRole("button", { name: "Try again for the 6" }),
    ).toBeInTheDocument();
    expect(
      within(el).getByRole("button", { name: "Dismiss" }),
    ).toBeInTheDocument();
  });
});
