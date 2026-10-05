import { act } from "react";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The setup file stubs sonner for every component test; this one proves what the REAL library does
// with the download's toast (sonner.test.tsx's own escape hatch).
vi.unmock("sonner");

import { toast } from "sonner";

import { exportToasts } from "@/components/app/export/export-toast";
import { createExportWalker } from "@/components/app/export/export-walk";
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

/**
 * A TRY AGAIN WAITS FOR THE LINE (crumbs-71): while the browser says it is offline a press on it can only fail the
 * same way, so the toast is drawn without it, says what it waits for, and gets it back when `online` fires.
 */
describe("a Try again waits for the line", () => {
  /** The browser's own word on its line, as a test sets it (jsdom's is always online). */
  const line = (online: boolean) =>
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(online);
  const back = () => {
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    flush();
  };
  /** A dismissed toast finishing its leave: two frames, then its exit, which is more than one act's worth of time. */
  const gone = () => {
    for (let i = 0; i < 3; i++) {
      act(() => {
        vi.advanceTimersByTime(300);
      });
    }
  };
  const dropped = (again = vi.fn()) =>
    ({
      tone: "refused",
      title: "Your connection dropped.",
      detail: "Check your signal, then try again.",
      action: { label: "Try again", run: again },
      close: { label: "Dismiss", run: vi.fn() },
    }) as const;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("★ offline by the browser's word, it says what it waits for and offers no Try again; `online` brings the toast's own words and button back", () => {
    line(false);
    const again = vi.fn();
    act(() => exportToasts.show("dl", dropped(again)));
    flush();

    let el = toastEl();
    expect(el).toHaveAttribute("data-type", "error");
    expect(el).toHaveTextContent("Your connection dropped.");
    expect(el).toHaveTextContent("Waiting for your connection…");
    expect(el).not.toHaveTextContent("Check your signal");
    expect(within(el).queryByRole("button", { name: "Try again" })).toBeNull();
    // The x is still there, and the toast is still one toast.
    expect(
      within(el).getByRole("button", { name: "Dismiss" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);

    line(true);
    back();
    el = toastEl();
    expect(el).toHaveTextContent("Check your signal, then try again.");
    expect(el).not.toHaveTextContent("Waiting for your connection");
    fireEvent.click(within(el).getByRole("button", { name: "Try again" }));
    expect(again).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("a short zip's Try again for the ones it missed waits too, and its count stays", () => {
    line(false);
    act(() =>
      exportToasts.show("dl", {
        tone: "short",
        title: "142 of 148 are in your download.",
        action: { label: "Try again for the 6", run: vi.fn() },
        close: { label: "Dismiss", run: vi.fn() },
      }),
    );
    flush();
    let el = toastEl();
    expect(el).toHaveAttribute("data-type", "warning");
    expect(el).toHaveTextContent("142 of 148 are in your download.");
    expect(el).toHaveTextContent("Waiting for your connection…");
    expect(within(el).queryByRole("button", { name: /Try again/ })).toBeNull();

    line(true);
    back();
    el = toastEl();
    expect(el).not.toHaveTextContent("Waiting for your connection");
    expect(
      within(el).getByRole("button", { name: "Try again for the 6" }),
    ).toBeInTheDocument();
  });

  it("an `online` event the browser does not stand behind changes nothing", () => {
    line(false);
    act(() => exportToasts.show("dl", dropped()));
    flush();
    back();
    expect(toastEl()).toHaveTextContent("Waiting for your connection…");
    expect(
      within(toastEl()).queryByRole("button", { name: "Try again" }),
    ).toBeNull();
  });

  it("a tab that missed the event (a phone's browser freezes one it leaves) is asked again when it is looked at", () => {
    line(false);
    act(() => exportToasts.show("dl", dropped()));
    flush();
    expect(toastEl()).toHaveTextContent("Waiting for your connection…");
    line(true);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    flush();
    expect(
      within(toastEl()).getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
    expect(toastEl()).not.toHaveTextContent("Waiting for your connection");
  });

  it("a line that only stalls keeps its Try again, and nothing is left listening", () => {
    const add = vi.spyOn(window, "addEventListener");
    act(() => exportToasts.show("dl", dropped()));
    flush();
    expect(
      within(toastEl()).getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
    expect(toastEl()).not.toHaveTextContent("Waiting for your connection");
    expect(add).not.toHaveBeenCalledWith("online", expect.anything());
  });

  it("★ the wait ends with the toast: put away by the walk, by a swipe, or replaced, the line coming back draws nothing over it", () => {
    const none = () =>
      expect(document.querySelector("[data-sonner-toast]")).toBeNull();

    // Put away by the walk (the x, an end).
    line(false);
    act(() => exportToasts.show("dl", dropped()));
    flush();
    expect(toastEl()).toHaveTextContent("Waiting for your connection…");
    act(() => exportToasts.dismiss("dl"));
    gone();
    none();
    line(true);
    back();
    gone();
    none();

    // Put away by sonner itself (a swipe takes this route), the walk never told.
    line(false);
    act(() => exportToasts.show("dl2", dropped()));
    flush();
    expect(toastEl()).toHaveTextContent("Waiting for your connection…");
    act(() => {
      toast.dismiss("dl2");
    });
    gone();
    none();
    line(true);
    back();
    gone();
    none();

    // Replaced by what the walk says next: the stale Try again never comes back over it.
    line(false);
    act(() => exportToasts.show("dl3", dropped()));
    flush();
    expect(toastEl()).toHaveTextContent("Waiting for your connection…");
    act(() =>
      exportToasts.show("dl3", {
        tone: "wait",
        title: "Preparing your download…",
        close: { label: "Cancel download", run: vi.fn() },
      }),
    );
    flush();
    line(true);
    back();
    expect(toastEl()).toHaveTextContent("Preparing your download…");
    expect(
      within(toastEl()).queryByRole("button", { name: "Try again" }),
    ).toBeNull();
    act(() => exportToasts.dismiss("dl3"));
  });

  it("drawing the same waiting toast again stacks nothing: every listener it added is taken off with it", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    line(false);
    act(() => exportToasts.show("dl", dropped()));
    act(() => exportToasts.show("dl", dropped()));
    act(() => exportToasts.show("dl", dropped()));
    flush();
    act(() => exportToasts.dismiss("dl"));
    const online = (spy: typeof add) =>
      spy.mock.calls.filter(([type]) => type === "online").length;
    expect(online(add)).toBe(3);
    expect(online(remove)).toBe(3);
  });

  it("only a Try again that a failed press would repeat waits: a cancel's, a next part's and a refusal with no button are drawn as they are", () => {
    line(false);
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
    expect(
      within(toastEl()).getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
    expect(toastEl()).not.toHaveTextContent("Waiting for your connection");

    act(() =>
      exportToasts.show("dl", {
        tone: "between",
        title: "Part 1 of 3 is downloading.",
        action: { label: "Get part 2", run: vi.fn() },
        close: { label: "Stop after this part", run: vi.fn() },
      }),
    );
    flush();
    expect(
      within(toastEl()).getByRole("button", { name: "Get part 2" }),
    ).toBeInTheDocument();
    expect(toastEl()).not.toHaveTextContent("Waiting for your connection");

    act(() =>
      exportToasts.show("dl", {
        tone: "refused",
        title: "Downloads are paused right now. Please try again later.",
        close: { label: "Dismiss", run: vi.fn() },
      }),
    );
    flush();
    expect(toastEl()).toHaveTextContent("Downloads are paused right now.");
    expect(toastEl()).not.toHaveTextContent("Waiting for your connection");
  });

  it("★ end to end: a walk that finds the browser offline says it dropped and waits; back online its Try again takes the part from a fresh mint", async () => {
    const minted = () =>
      new Response(
        JSON.stringify({
          ok: true,
          token: "tok-1",
          workerUrl: "https://worker.example/zip",
          checkUrl: "https://worker.example/check",
          part: 1,
          parts: 1,
          next: null,
          items: 3,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    const checked = () =>
      new Response(
        JSON.stringify({ ok: true, items: 3, found: 3, missing: [] }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    const fetchFn = vi
      .fn()
      // Offline: the mint's request is refused outright.
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      // Back online: the mint, then the Worker's check.
      .mockImplementationOnce(async () => minted())
      .mockImplementationOnce(async () => checked());
    const post = vi.fn();
    const walker = createExportWalker({
      fetch: fetchFn as unknown as typeof fetch,
      post,
      toast: exportToasts,
      place: () => "desk",
      online: () => navigator.onLine !== false,
      sleep: async () => {},
      newId: () => "dl",
    });

    line(false);
    await act(async () => {
      await walker.start("host", { event_id: "e" });
    });
    flush();
    let el = toastEl();
    expect(el).toHaveTextContent("Your connection dropped.");
    expect(el).toHaveTextContent("Waiting for your connection…");
    expect(within(el).queryByRole("button", { name: "Try again" })).toBeNull();
    // Nothing was posted into the dead line.
    expect(post).not.toHaveBeenCalled();

    line(true);
    back();
    el = toastEl();
    fireEvent.click(within(el).getByRole("button", { name: "Try again" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(post).toHaveBeenCalledWith("https://worker.example/zip", "tok-1");
  });
});
