/**
 * THE DASHBOARD'S CARDS TAKE TURNS, ONE PER BEAT (`reel-host`, Will 2026-09-25, his `pulse` note:
 * "each beat the next event cycled a card, going first to last and starting back with the first
 * again").
 *
 * Pinned by behaviour: the turn order is the grid's reading order and wraps; a card with one still
 * or off screen sits its turn out; exactly one card moves per beat; and nothing moves in a hidden
 * tab or under reduced motion, where every card keeps the cover it painted.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setReducedMotion } from "../../../../vitest.setup";

import {
  COVER_BEAT_MS,
  CoverCycleProvider,
  CycledCover,
  nextTurn,
} from "./cover-cycle";

describe("nextTurn", () => {
  const cards = [
    { id: "a", eligible: true },
    { id: "b", eligible: false },
    { id: "c", eligible: true },
  ];

  it("starts at the first card that may move, and goes on in reading order", () => {
    expect(nextTurn(cards, null)).toBe("a");
    expect(nextTurn(cards, "a")).toBe("c");
  });

  it("wraps from the last card back to the first", () => {
    expect(nextTurn(cards, "c")).toBe("a");
  });

  it("skips a card that may not move, and answers null when none may", () => {
    expect(nextTurn(cards, "b")).toBe("c");
    expect(
      nextTurn(
        cards.map((c) => ({ ...c, eligible: false })),
        null,
      ),
    ).toBeNull();
  });

  it("starts over when the last card to move has left the grid", () => {
    expect(nextTurn(cards, "gone")).toBe("a");
  });
});

/** An observer that says every card is on screen, or none, as the test sets it. */
let onScreen = true;
class VisibleObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(el: Element) {
    this.callback(
      [{ target: el, isIntersecting: onScreen } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  onScreen = true;
  setReducedMotion(false);
  vi.stubGlobal("IntersectionObserver", VisibleObserver);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** Which still each card shows: the src of its visible layer. */
function shown(container: HTMLElement): string[] {
  return [...container.querySelectorAll("[data-living]")].map(
    (layer) =>
      layer.querySelector("img.opacity-100")?.getAttribute("src") ?? "",
  );
}

function grid() {
  return render(
    <CoverCycleProvider>
      <CycledCover id="a" stills={["a0", "a1", "a2"]} />
      <CycledCover id="solo" stills={["s0"]} />
      <CycledCover id="c" stills={["c0", "c1"]} />
    </CoverCycleProvider>,
  );
}

describe("the cycle", () => {
  it("moves exactly one card per beat, first to last and around again", () => {
    const { container } = grid();
    expect(shown(container)).toEqual(["a0", "s0", "c0"]);

    act(() => void vi.advanceTimersByTime(COVER_BEAT_MS));
    expect(shown(container)).toEqual(["a1", "s0", "c0"]);

    // The one-still card sits its turn out.
    act(() => void vi.advanceTimersByTime(COVER_BEAT_MS));
    expect(shown(container)).toEqual(["a1", "s0", "c1"]);

    act(() => void vi.advanceTimersByTime(COVER_BEAT_MS));
    expect(shown(container)).toEqual(["a2", "s0", "c1"]);

    act(() => void vi.advanceTimersByTime(COVER_BEAT_MS));
    expect(shown(container)).toEqual(["a2", "s0", "c0"]);
  });

  it("holds every cover under reduced motion", () => {
    setReducedMotion(true);
    const { container } = grid();
    act(() => void vi.advanceTimersByTime(COVER_BEAT_MS * 4));
    expect(shown(container)).toEqual(["a0", "s0", "c0"]);
  });

  it("moves nothing while the cards are off screen", () => {
    onScreen = false;
    const { container } = grid();
    act(() => void vi.advanceTimersByTime(COVER_BEAT_MS * 4));
    expect(shown(container)).toEqual(["a0", "s0", "c0"]);
  });

  it("rests in a hidden tab and takes up again when it is back", () => {
    const { container } = grid();
    const visibility = vi
      .spyOn(document, "hidden", "get")
      .mockReturnValue(true);
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    act(() => void vi.advanceTimersByTime(COVER_BEAT_MS * 3));
    expect(shown(container)).toEqual(["a0", "s0", "c0"]);

    visibility.mockReturnValue(false);
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    act(() => void vi.advanceTimersByTime(COVER_BEAT_MS));
    expect(shown(container)).toEqual(["a1", "s0", "c0"]);
    visibility.mockRestore();
  });

  it("holds its cover outside a cycle, as the profile's cards and the lab draw it", () => {
    const { container } = render(<CycledCover id="a" stills={["a0", "a1"]} />);
    act(() => void vi.advanceTimersByTime(COVER_BEAT_MS * 3));
    expect(shown(container)).toEqual(["a0"]);
  });
});
