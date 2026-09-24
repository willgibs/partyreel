/**
 * Pins for the arrival beat: the auto-open holds for the beat, non-auto
 * paths are instant, and reduced motion / 0ms skip the wait. Fake timers
 * drive the delay deterministically.
 */
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useArrivalBeat } from "./use-arrival-beat";
import { setReducedMotion } from "../../../vitest.setup";

function Probe({ enabled, ms }: { enabled: boolean; ms: number }) {
  const ready = useArrivalBeat({ enabled, ms });
  return <span data-testid="ready">{String(ready)}</span>;
}

const ready = (c: HTMLElement) =>
  c.querySelector('[data-testid="ready"]')!.textContent;

afterEach(() => {
  vi.useRealTimers();
  setReducedMotion(false);
});

describe("useArrivalBeat", () => {
  it("holds an enabled beat until the ms elapse, then resolves", () => {
    vi.useFakeTimers();
    const { container } = render(<Probe enabled ms={700} />);
    expect(ready(container)).toBe("false");
    act(() => vi.advanceTimersByTime(699));
    expect(ready(container)).toBe("false");
    act(() => vi.advanceTimersByTime(1));
    expect(ready(container)).toBe("true");
  });

  it("is instantly ready when disabled (never gates a non-auto path)", () => {
    const { container } = render(<Probe enabled={false} ms={700} />);
    expect(ready(container)).toBe("true");
  });

  it("skips the wait under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<Probe enabled ms={700} />);
    expect(ready(container)).toBe("true");
  });

  it("skips the wait at 0ms", () => {
    const { container } = render(<Probe enabled ms={0} />);
    expect(ready(container)).toBe("true");
  });
});
