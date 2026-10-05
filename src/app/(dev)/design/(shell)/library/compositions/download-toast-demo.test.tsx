import { act } from "react";

import { fireEvent, render, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The setup file stubs sonner for every component test; the specimen is a call on the REAL toaster, so this one
// reads what the real library paints (export-toast.test.tsx's own escape hatch).
vi.unmock("sonner");

import type { ToastView } from "@/components/app/export/export-walk";
import { Toaster } from "@/components/ui/sonner";
import { WALK_COPY } from "@/lib/export/walk";

import { DownloadToastDemo } from "./download-toast-demo";

/**
 * THE DOWNLOAD TOAST'S SPECIMEN FIRES EVERY STATE IT NAMES (`download-toast-demo.tsx`), on the real toaster: the
 * button for a state paints that state's words and controls, a press replaces the last toast in place, the controls
 * walk the fixture where they lead in production, and nothing leaves the page. A copy edit in `WALK_COPY` follows by
 * itself; a state the specimen lost, or a control that stopped doing its work, fails here and not only to a look.
 */

function flush() {
  act(() => {
    vi.advanceTimersByTime(0);
  });
}

/** Sonner takes a dismissed toast away in two beats (it marks it removed, then unmounts it a moment later): two acts. */
function settle() {
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  act(() => {
    vi.advanceTimersByTime(1000);
  });
}

const toastEls = () => [
  ...document.querySelectorAll<HTMLElement>("[data-sonner-toast]"),
];
const toastEl = () => toastEls()[0] as HTMLElement;

/** What a toast's buttons are called: the x by its label, an answer or a Try again by its words. */
const controls = (el: HTMLElement) =>
  within(el)
    .getAllByRole("button")
    .map((b) => b.getAttribute("aria-label") ?? b.textContent);

/** A state's button on the page (scoped, so a toast's "Cancel download" is never mistaken for one). */
const state = (name: string) =>
  within(document.querySelector<HTMLElement>("[data-library-demo]")!).getByRole(
    "button",
    { name },
  );

/** A press on the toast's own control. */
function press(name: string) {
  fireEvent.click(within(toastEl()).getByRole("button", { name }));
  flush();
}

let fetchSpy: ReturnType<typeof vi.fn>;
let demo: ReturnType<typeof render>;

beforeEach(() => {
  vi.useFakeTimers();
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  // Two roots, so the specimen can leave while the toaster (the root layout's) stays.
  render(<Toaster />);
  demo = render(
    <div data-library-demo="">
      <DownloadToastDemo />
    </div>,
  );
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/**
 * ★ ONE BUTTON FOR EVERY TONE THE TOAST HAS. A `Record` over the view's own tone union, so a tenth tone added to
 * `ToastView` fails the typecheck of this file until the specimen draws it too.
 */
const TONE_BUTTON: Record<ToastView["tone"], string> = {
  wait: "Preparing",
  ask: "Hidden items",
  confirm: "The cancel question",
  between: "Between parts",
  downloading: "Saving",
  done: "Saved",
  short: "Some missing",
  cancelled: "Cancelled",
  refused: "A dropped connection",
};

/** Every state: the button, the toast's kind, the words it says and the controls it carries, in order. */
const STATES: {
  button: string;
  type: "loading" | "info" | "success" | "warning" | "error";
  says: string[];
  controls: string[];
}[] = [
  {
    button: "Preparing",
    type: "loading",
    says: [WALK_COPY.preparing],
    controls: [WALK_COPY.cancel],
  },
  {
    button: "The cancel question",
    type: "info",
    says: [WALK_COPY.askCancel],
    controls: [WALK_COPY.keepGoing, WALK_COPY.cancel],
  },
  {
    button: "Hidden items",
    type: "info",
    says: [WALK_COPY.hiddenAsk(3, 12)],
    controls: [
      WALK_COPY.includeHidden(3),
      WALK_COPY.leaveHidden(3),
      WALK_COPY.cancel,
    ],
  },
  {
    button: "Saving",
    type: "info",
    says: [WALK_COPY.downloading("downloads")],
    controls: [WALK_COPY.dismiss],
  },
  {
    button: "A line lost mid-stream",
    type: "info",
    says: [WALK_COPY.downloading("downloads"), WALK_COPY.lost],
    controls: [WALK_COPY.dismiss],
  },
  {
    button: "Between parts",
    type: "info",
    says: [WALK_COPY.partStarted(1, 3)],
    controls: [WALK_COPY.nextPart(2), WALK_COPY.stop],
  },
  {
    button: "Stop after a part?",
    type: "info",
    says: [WALK_COPY.askStop(1, 3), WALK_COPY.askStopDetail(2, 3)],
    controls: [WALK_COPY.keepGoing, WALK_COPY.stopHere],
  },
  {
    button: "Saved",
    type: "success",
    says: [WALK_COPY.saved("downloads")],
    controls: [],
  },
  {
    button: "Cancelled",
    type: "info",
    says: [WALK_COPY.cancelled],
    controls: [WALK_COPY.tryAgain, WALK_COPY.dismiss],
  },
  {
    button: "A dropped connection",
    type: "error",
    says: [WALK_COPY.dropped, WALK_COPY.droppedDetail],
    controls: [WALK_COPY.tryAgain, WALK_COPY.dismiss],
  },
  {
    button: "Some missing",
    type: "warning",
    says: [WALK_COPY.short(11, 12)],
    controls: [WALK_COPY.retryMissing(1), WALK_COPY.dismiss],
  },
  {
    button: "Could not start",
    type: "error",
    says: [WALK_COPY.failed],
    controls: [WALK_COPY.tryAgain, WALK_COPY.dismiss],
  },
];

describe("the download toast's specimen", () => {
  it("has a button for every tone the toast has, and for every state this list expects", () => {
    for (const button of Object.values(TONE_BUTTON)) {
      expect(state(button), button).toBeInTheDocument();
    }
    const buttons = within(
      document.querySelector<HTMLElement>("[data-library-demo]")!,
    )
      .getAllByRole("button")
      .map((b) => b.textContent);
    // Every state button, and the one that puts the toast away.
    expect(buttons.sort()).toEqual(
      [...STATES.map((s) => s.button), "Put it away"].sort(),
    );
  });

  it.each(STATES)(
    "$button paints its words and its controls on the real toaster",
    (s) => {
      fireEvent.click(state(s.button));
      flush();

      expect(toastEls()).toHaveLength(1);
      const el = toastEl();
      expect(el).toHaveAttribute("data-type", s.type);
      for (const words of s.says) expect(el).toHaveTextContent(words);
      if (s.controls.length === 0) {
        expect(within(el).queryAllByRole("button")).toHaveLength(0);
      } else {
        expect(controls(el)).toEqual(s.controls);
      }
      // Sonner's own close (top-left) is off in every state: the x is the toast's, on the right.
      expect(el.querySelector("[data-close-button]")).toBeNull();
    },
  );

  it("replaces the last toast in place: one toast a download, never a pile", () => {
    fireEvent.click(state("Preparing"));
    flush();
    fireEvent.click(state("A dropped connection"));
    flush();
    fireEvent.click(state("Saved"));
    flush();
    expect(toastEls()).toHaveLength(1);
    expect(toastEl()).toHaveTextContent(WALK_COPY.saved("downloads"));
  });

  it("★ the x asks first, Keep going goes back, Cancel ends it with a way back, and Try again prepares again", () => {
    fireEvent.click(state("Preparing"));
    flush();
    expect(toastEl()).toHaveTextContent(WALK_COPY.preparing);

    press(WALK_COPY.cancel);
    expect(toastEl()).toHaveTextContent(WALK_COPY.askCancel);

    press(WALK_COPY.keepGoing);
    expect(toastEl()).toHaveTextContent(WALK_COPY.preparing);

    press(WALK_COPY.cancel);
    press(WALK_COPY.cancel);
    expect(toastEl()).toHaveTextContent(WALK_COPY.cancelled);
    expect(toastEl()).toHaveAttribute("data-type", "info");

    press(WALK_COPY.tryAgain);
    expect(toastEl()).toHaveTextContent(WALK_COPY.preparing);
  });

  it("walks between parts too: Stop asks, Keep going goes back, Stop here says where she stopped", () => {
    fireEvent.click(state("Between parts"));
    flush();
    press(WALK_COPY.stop);
    expect(toastEl()).toHaveTextContent(WALK_COPY.askStop(1, 3));

    press(WALK_COPY.keepGoing);
    expect(toastEl()).toHaveTextContent(WALK_COPY.partStarted(1, 3));

    press(WALK_COPY.stop);
    press(WALK_COPY.stopHere);
    expect(toastEl()).toHaveTextContent(WALK_COPY.stoppedAfter(1, 3));
    // The tap that takes the rest is still there, and the x only puts the toast away.
    expect(controls(toastEl())).toEqual([
      WALK_COPY.nextPart(2),
      WALK_COPY.dismiss,
    ]);
  });

  it("Put it away takes the toast", () => {
    fireEvent.click(state("Preparing"));
    flush();
    fireEvent.click(state("Put it away"));
    settle();
    expect(toastEls()).toHaveLength(0);
  });

  it("a held toast goes when the specimen does: it would follow her to the next entry with its x", () => {
    // A wait cannot be swiped away and never times out, so only the specimen leaving can take it.
    fireEvent.click(state("Preparing"));
    flush();
    expect(toastEls()).toHaveLength(1);
    demo.unmount();
    settle();
    expect(toastEls()).toHaveLength(0);
  });

  it("sends nothing: no state, and no control, makes a request", () => {
    for (const s of STATES) {
      fireEvent.click(state(s.button));
      flush();
      for (const name of s.controls) {
        const el = toastEls()[0];
        const control = el && within(el).queryByRole("button", { name });
        if (control) fireEvent.click(control);
        flush();
      }
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
