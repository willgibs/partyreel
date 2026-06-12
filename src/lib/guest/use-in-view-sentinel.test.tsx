/**
 * Regression pin for the floating-Add-pill bug: useInViewSentinel must attach
 * its IntersectionObserver even when the sentinel node mounts AFTER first
 * paint. A password event renders <GhostGrid> (no sentinel) at access "none",
 * then unlocks via router.refresh() which flips access none->full WITHOUT
 * remounting EventExperience - so the sentinel node appears late. The original
 * mount-only `[]`-effect read a null ref and never re-ran, leaving the pill
 * permanently dead on unlocked password events. The callback-ref form fixes it;
 * these pins lock that in.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInViewSentinel } from "./use-in-view-sentinel";

type IOEntry = { isIntersecting: boolean };

// A controllable IntersectionObserver: jsdom has none, and the real one needs
// a layout engine. Tests drive intersection changes via emit().
class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: (entries: IOEntry[]) => void;
  observed = new Set<Element>();
  disconnected = false;
  constructor(cb: (entries: IOEntry[]) => void) {
    this.callback = cb;
    MockIntersectionObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.add(el);
  }
  unobserve(el: Element) {
    this.observed.delete(el);
  }
  disconnect() {
    this.disconnected = true;
    this.observed.clear();
  }
  // act() wraps the setInView so React flushes before the assertion.
  emit(isIntersecting: boolean) {
    act(() => this.callback([{ isIntersecting }]));
  }
}

/** The live observer = the most recent one that is observing something. */
function liveObserver() {
  return [...MockIntersectionObserver.instances]
    .reverse()
    .find((o) => !o.disconnected && o.observed.size > 0);
}

// Mimics EventExperience: the sentinel node renders ONLY when `unlocked`
// (access !== "none"). The component instance is STABLE across the flip (no
// remount), exactly like the soft router.refresh() unlock.
function Harness({ unlocked }: { unlocked: boolean }) {
  const { sentinelRef, inView } = useInViewSentinel<HTMLDivElement>();
  return (
    <div>
      <span data-testid="in-view">{String(inView)}</span>
      {unlocked ? (
        <div data-testid="sentinel" ref={sentinelRef} />
      ) : (
        <div data-testid="ghost-grid" />
      )}
    </div>
  );
}

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useInViewSentinel", () => {
  it("observes a sentinel that is present on first render", () => {
    const { getByTestId } = render(<Harness unlocked />);
    const observer = liveObserver();
    expect(observer).toBeDefined();
    expect(observer!.observed.has(getByTestId("sentinel"))).toBe(true);
  });

  it("flips inView to false when the sentinel leaves the viewport", () => {
    const { getByTestId } = render(<Harness unlocked />);
    expect(getByTestId("in-view")).toHaveTextContent("true"); // SSR default
    liveObserver()!.emit(false);
    expect(getByTestId("in-view")).toHaveTextContent("false");
    liveObserver()!.emit(true);
    expect(getByTestId("in-view")).toHaveTextContent("true");
  });

  it("ATTACHES when the sentinel mounts AFTER first paint (the password-unlock regression)", () => {
    // access "none": no sentinel node, so nothing is observed yet.
    const { getByTestId, rerender } = render(<Harness unlocked={false} />);
    expect(liveObserver()).toBeUndefined();
    expect(getByTestId("in-view")).toHaveTextContent("true");

    // Unlock: access none->full WITHOUT remounting (same component instance).
    rerender(<Harness unlocked />);

    const observer = liveObserver();
    expect(observer).toBeDefined();
    expect(observer!.observed.has(getByTestId("sentinel"))).toBe(true);

    // And it is now a live signal: scrolling the header out flips the pill on.
    observer!.emit(false);
    expect(getByTestId("in-view")).toHaveTextContent("false");
  });

  it("disconnects the observer when the sentinel unmounts", () => {
    const { rerender } = render(<Harness unlocked />);
    const observer = liveObserver();
    expect(observer).toBeDefined();
    rerender(<Harness unlocked={false} />);
    expect(observer!.disconnected).toBe(true);
  });
});
