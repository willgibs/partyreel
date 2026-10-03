/**
 * THE WAIT'S CLOCK: null on the server's render and the hydrating one, the reader's own time after it, read again on
 * one shared timer that runs only while someone reads it.
 */
import { act, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useWaitClock,
  WAIT_CLOCK_STEP_MS,
} from "@/lib/disposable/use-wait-clock";

function Show() {
  const now = useWaitClock();
  return <p data-now={now === null ? "none" : String(now)} />;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-10T22:40:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
});

describe("useWaitClock", () => {
  it("says no time on the server, so no line ever names a time the server guessed", () => {
    expect(renderToString(<Show />)).toContain('data-now="none"');
  });

  it("★ says the reader's time once mounted, and again as the clock moves", () => {
    const { container, unmount } = render(<Show />);
    const read = () => container.querySelector("p")?.getAttribute("data-now");
    expect(read()).toBe(String(Date.parse("2026-10-10T22:40:00Z")));
    act(() => {
      vi.advanceTimersByTime(WAIT_CLOCK_STEP_MS);
    });
    expect(read()).toBe(
      String(Date.parse("2026-10-10T22:40:00Z") + WAIT_CLOCK_STEP_MS),
    );
    unmount();
    // Nobody reads it: no timer runs.
    expect(vi.getTimerCount()).toBe(0);
  });
});
