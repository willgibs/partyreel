import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  installNextHistory,
  type NextHistory,
} from "@/lib/test-utils/next-history";

/**
 * THE CODE'S MORPH IN A TAB NOBODY IS LOOKING AT (red-team 40's LOW, folded into `event-header` r1's wiring).
 * Opening or closing the hub's code card in a hidden tab threw two `InvalidStateError: Transition was aborted`:
 * a hidden document cannot snapshot, so the browser aborts the view transition it was asked for and every
 * promise it hands back rejects. Pinned on the provider itself, with motion welcome (the other file holds it
 * reduced): a hidden document never starts one, a visible one does, and a transition aborted mid-way is let go
 * while the change it carried still lands.
 */
vi.mock("next/navigation", async () => {
  const { nextNavigation } = await import("@/lib/test-utils/next-history");
  return nextNavigation;
});
vi.mock("@/lib/shared/use-prefers-reduced-motion", () => ({
  usePrefersReducedMotion: () => false,
}));

const { EventShareProvider, useEventShare } =
  await import("@/components/app/share/event-share-provider");

let next: NextHistory;
let visibility: DocumentVisibilityState = "visible";

beforeEach(() => {
  next = installNextHistory();
  visibility = "visible";
  vi.spyOn(document, "visibilityState", "get").mockImplementation(
    () => visibility,
  );
});

afterEach(() => {
  next.uninstall();
  vi.restoreAllMocks();
  delete (document as { startViewTransition?: unknown }).startViewTransition;
});

function Probe() {
  const { codeOpen, openCode, closeCode } = useEventShare();
  return (
    <div>
      <p data-testid="code">{codeOpen ? "open" : "closed"}</p>
      <button type="button" onClick={openCode}>
        open the code
      </button>
      <button type="button" onClick={closeCode}>
        close the code
      </button>
    </div>
  );
}

/** A browser's `startViewTransition`: runs the change, and settles its promises as told. */
function stubTransition(outcome: "ran" | "aborted") {
  const aborted = () => {
    const p = Promise.reject(
      new DOMException("Transition was aborted", "InvalidStateError"),
    );
    return p;
  };
  const start = vi.fn((change: () => void) => {
    change();
    return outcome === "ran"
      ? { ready: Promise.resolve(), finished: Promise.resolve() }
      : { ready: aborted(), finished: aborted() };
  });
  (document as { startViewTransition?: unknown }).startViewTransition = start;
  return start;
}

describe("the code's morph", () => {
  it("★ never starts in a hidden document, and the card still opens and closes", async () => {
    const start = stubTransition("aborted");
    visibility = "hidden";
    render(
      <EventShareProvider initialSheet={null}>
        <Probe />
      </EventShareProvider>,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "open the code" }));
    });
    expect(screen.getByTestId("code")).toHaveTextContent("open");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "close the code" }));
    });
    expect(screen.getByTestId("code")).toHaveTextContent("closed");
    expect(start).not.toHaveBeenCalled();
  });

  it("starts in a visible one", async () => {
    const start = stubTransition("ran");
    render(
      <EventShareProvider initialSheet={null}>
        <Probe />
      </EventShareProvider>,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "open the code" }));
    });
    expect(start).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("code")).toHaveTextContent("open");
  });

  it("★ lets an aborted transition go: no rejection is left unhandled, and the change landed", async () => {
    stubTransition("aborted");
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    try {
      render(
        <EventShareProvider initialSheet={null}>
          <Probe />
        </EventShareProvider>,
      );
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "open the code" }));
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(unhandled).not.toHaveBeenCalled();
      expect(screen.getByTestId("code")).toHaveTextContent("open");
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });
});
