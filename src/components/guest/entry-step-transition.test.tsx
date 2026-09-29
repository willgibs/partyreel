import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EntryStepTransition } from "@/components/guest/entry-step-transition";

/**
 * THE STEP CONTAINER'S HANDOFFS, as data the door's stylesheet reads (door.css). Pinned: the first
 * layer arrives with no direction; a sliding layer carries its side and SETTLES once its move has
 * landed (which is what lets words that change later inside it reveal, while words that rode the
 * slide in stand the reveal down); and "You're in" arrives in place, never settling because it
 * never slid.
 */
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function layer(container: HTMLElement) {
  return container.querySelector<HTMLElement>("[data-entry-step]")!;
}

describe("EntryStepTransition", () => {
  it("the first layer arrives with no direction and never needs to settle", () => {
    const { container } = render(
      <EntryStepTransition stepKey="welcome" direction="fwd">
        <p>welcome</p>
      </EntryStepTransition>,
    );
    expect(layer(container)).not.toHaveAttribute("data-dir");
    act(() => void vi.advanceTimersByTime(1000));
    expect(layer(container)).not.toHaveAttribute("data-settled");
  });

  it("a sliding layer carries its side, then settles once the move has landed", () => {
    const { container, rerender } = render(
      <EntryStepTransition stepKey="welcome" direction="fwd">
        <p>welcome</p>
      </EntryStepTransition>,
    );
    rerender(
      <EntryStepTransition stepKey="chooser" direction="fwd">
        <p>chooser</p>
      </EntryStepTransition>,
    );
    expect(layer(container)).toHaveAttribute("data-dir", "fwd");
    expect(layer(container)).not.toHaveAttribute("data-settled");
    act(() => void vi.advanceTimersByTime(300));
    expect(layer(container)).toHaveAttribute("data-settled");
  });

  it("'You're in' arrives in place, and an in-place layer never settles", () => {
    const { container, rerender } = render(
      <EntryStepTransition stepKey="identify" direction="fwd">
        <p>identify</p>
      </EntryStepTransition>,
    );
    rerender(
      <EntryStepTransition stepKey="success" direction="place">
        <p>You’re in</p>
      </EntryStepTransition>,
    );
    expect(layer(container)).toHaveAttribute("data-dir", "place");
    act(() => void vi.advanceTimersByTime(1000));
    expect(layer(container)).not.toHaveAttribute("data-settled");
  });
});
