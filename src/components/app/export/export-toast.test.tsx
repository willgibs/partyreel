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

  it("asks about hidden items with both answers side by side, then the x, and holds until answered", () => {
    const include = vi.fn();
    const leave = vi.fn();
    act(() =>
      exportToasts.show("dl", {
        tone: "ask",
        title: "3 of these 12 are hidden.",
        actions: [
          { label: "Include them", run: include },
          { label: "Leave them out", run: leave },
        ],
        close: { label: "Cancel download", run: vi.fn() },
      }),
    );
    flush();

    const el = toastEl();
    expect(el).toHaveAttribute("data-type", "info");
    expect(el).toHaveAttribute("data-dismissible", "false");
    const buttons = within(el).getAllByRole("button");
    expect(
      buttons.map((b) => b.getAttribute("aria-label") ?? b.textContent),
    ).toEqual(["Include them", "Leave them out", "Cancel download"]);
    expect(buttons[0]).toHaveAttribute("data-button");
    expect(buttons[1]).toHaveAttribute("data-button");
    // The answers sit under the line (the description's place), so the line keeps its width at 375;
    // the x alone keeps the right.
    const answers = el.querySelector(
      "[data-export-toast-answers]",
    ) as HTMLElement;
    expect(within(answers).getAllByRole("button")).toHaveLength(2);
    const controls = el.querySelector(
      "[data-export-toast-controls]",
    ) as HTMLElement;
    expect(
      within(controls)
        .getAllByRole("button")
        .map((b) => b.getAttribute("aria-label")),
    ).toEqual(["Cancel download"]);
    fireEvent.click(buttons[1]);
    expect(leave).toHaveBeenCalledTimes(1);
    expect(include).not.toHaveBeenCalled();
  });

  it("downloading is held, neutral, with only the x, and turns saved with nothing carried over", () => {
    act(() =>
      exportToasts.show("dl", {
        tone: "downloading",
        title: "Downloading…",
        close: { label: "Dismiss", run: vi.fn() },
      }),
    );
    flush();
    const el = toastEl();
    expect(el).toHaveAttribute("data-type", "info");
    expect(el).toHaveAttribute("data-dismissible", "false");
    expect(
      within(el)
        .getAllByRole("button")
        .map((b) => b.getAttribute("aria-label")),
    ).toEqual(["Dismiss"]);
    // Still there long after a success would have gone.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(toastEl()).toHaveTextContent("Downloading…");

    act(() =>
      exportToasts.show("dl", {
        tone: "done",
        title: "Your download is saved.",
        duration: 4000,
      }),
    );
    flush();
    expect(toastEl()).toHaveAttribute("data-type", "success");
    expect(toastEl().querySelector("[data-export-toast-controls]")).toBeNull();
  });

  // E6: the x asks before it is believed, in the toast itself.
  it("★ a cancel asks first: one line, what stopping leaves, the two answers under it, and no x of its own", () => {
    const keep = vi.fn();
    const stop = vi.fn();
    act(() =>
      exportToasts.show("dl", {
        tone: "confirm",
        title: "Stop after part 1 of 3?",
        detail: "Parts 2 and 3 won't download.",
        actions: [
          { label: "Keep going", run: keep },
          { label: "Stop here", run: stop },
        ],
      }),
    );
    flush();

    const el = toastEl();
    expect(el).toHaveAttribute("data-type", "info");
    expect(el).toHaveAttribute("data-dismissible", "false");
    expect(el).toHaveTextContent("Stop after part 1 of 3?");
    expect(el).toHaveTextContent("Parts 2 and 3 won't download.");
    // The answers are the way out: no x, so there is nothing to swipe or press that decides it for her.
    expect(el.querySelector("[data-export-toast-controls]")).toBeNull();
    expect(el.querySelector("[data-close-button]")).toBeNull();
    const buttons = within(el).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual([
      "Keep going",
      "Stop here",
    ]);
    fireEvent.click(buttons[0]);
    expect(keep).toHaveBeenCalledTimes(1);
    expect(stop).not.toHaveBeenCalled();

    // The next state carries nothing of the question: its detail and its answers go.
    act(() =>
      exportToasts.show("dl", {
        tone: "wait",
        title: "Preparing part 2 of 3…",
        close: { label: "Cancel download", run: vi.fn() },
      }),
    );
    flush();
    expect(toastEl()).not.toHaveTextContent("won't download");
    expect(toastEl().querySelector("[data-export-toast-answers]")).toBeNull();
  });

  it("a cancel she made is neutral, never an error, with its way back and an x, and goes by itself in its time", () => {
    const again = vi.fn();
    act(() =>
      exportToasts.show("dl", {
        tone: "cancelled",
        title: "Download cancelled.",
        action: { label: "Try again", run: again },
        close: { label: "Dismiss", run: vi.fn() },
        duration: 8000,
      }),
    );
    flush();
    const el = toastEl();
    expect(el).toHaveAttribute("data-type", "info");
    expect(el).toHaveTextContent("Download cancelled.");
    fireEvent.click(within(el).getByRole("button", { name: "Try again" }));
    expect(again).toHaveBeenCalledTimes(1);
    expect(
      within(el).getByRole("button", { name: "Dismiss" }),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(8500);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(document.querySelector("[data-sonner-toast]")).toBeNull();
  });

  it("a cancel the Worker reported after the fact is held until she puts it away", () => {
    act(() =>
      exportToasts.show("dl", {
        tone: "cancelled",
        title: "Download cancelled.",
        action: { label: "Try again", run: vi.fn() },
        close: { label: "Dismiss", run: vi.fn() },
        duration: Infinity,
      }),
    );
    flush();
    act(() => {
      vi.advanceTimersByTime(120_000);
    });
    expect(toastEl()).toHaveTextContent("Download cancelled.");
  });

  it("★ a dropped connection is an error that says what to do, under its line, beside its Try again", () => {
    act(() =>
      exportToasts.show("dl", {
        tone: "refused",
        title: "Your connection dropped.",
        detail: "Check your signal, then try again.",
        action: { label: "Try again", run: vi.fn() },
        close: { label: "Dismiss", run: vi.fn() },
      }),
    );
    flush();
    const el = toastEl();
    expect(el).toHaveAttribute("data-type", "error");
    expect(el).toHaveTextContent("Your connection dropped.");
    expect(el).toHaveTextContent("Check your signal, then try again.");
    expect(
      within(el).getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();

    // And the next state carries nothing of it (sonner merges an update into the toast it replaces).
    act(() =>
      exportToasts.show("dl", {
        tone: "done",
        title: "Your download is saved.",
        duration: 4000,
      }),
    );
    flush();
    expect(toastEl()).not.toHaveTextContent("Check your signal");
  });

  it("a line lost while a zip streams is said under 'Downloading…', which stays held with its x", () => {
    act(() =>
      exportToasts.show("dl", {
        tone: "downloading",
        title: "Downloading…",
        detail: "Your connection dropped. Check your signal.",
        close: { label: "Dismiss", run: vi.fn() },
      }),
    );
    flush();
    const el = toastEl();
    expect(el).toHaveTextContent("Downloading…");
    expect(el).toHaveTextContent("Your connection dropped. Check your signal.");
    expect(el).toHaveAttribute("data-dismissible", "false");
    // The line is back: the same toast, the notice gone.
    act(() =>
      exportToasts.show("dl", {
        tone: "downloading",
        title: "Downloading…",
        close: { label: "Dismiss", run: vi.fn() },
      }),
    );
    flush();
    expect(toastEl()).not.toHaveTextContent("Check your signal");
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
