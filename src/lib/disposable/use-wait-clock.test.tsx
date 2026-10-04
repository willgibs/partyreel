/**
 * THE WAIT'S CLOCK: null on the server's render and the hydrating one, the reader's own time after it, read again on
 * one shared timer that runs only while someone reads it, ★ and turning at the develop itself (red-team 46's LOW): a
 * render that brings a develop time reads a clock that has passed it, and a develop ahead gets its tick at its own
 * moment, never at the next step of a timer that started whenever the first reader mounted.
 */
import { act, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useWaitClock,
  WAIT_CLOCK_STEP_MS,
} from "@/lib/disposable/use-wait-clock";
import { coverEyebrow } from "@/lib/disposable/wait-words";

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

/** What the guest's cover says over the event's name, read through the clock exactly as the page reads it. */
function Eyebrow({ developsAt }: { developsAt: string }) {
  const now = useWaitClock();
  return (
    <p data-eyebrow="">
      {coverEyebrow({ capture: "camera", developsAt }, now) ?? "none"}
    </p>
  );
}
const said = (container: HTMLElement) =>
  container.querySelector("[data-eyebrow]")?.textContent ?? "";

describe("★ the clock turns at the develop itself (red-team 46's LOW)", () => {
  it("★ a develop moved to now is reached on the very render that brings it, not at the clock's next step", () => {
    // Saturday 7:42:00, on the clock's own grid: its next step is 30 s away.
    vi.setSystemTime(new Date(2026, 9, 10, 7, 42, 0));
    const { container, rerender } = render(
      <Eyebrow developsAt={new Date(2026, 9, 10, 9, 0).toISOString()} />,
    );
    expect(said(container)).toBe("Disposable · develops at 9 am");
    // Ten seconds pass (no step yet), and the host presses Develop now: the database's now, which the page reads afresh.
    act(() => {
      vi.setSystemTime(new Date(2026, 9, 10, 7, 42, 10));
    });
    rerender(<Eyebrow developsAt={new Date(Date.now()).toISOString()} />);
    expect(said(container)).toMatch(/^Disposable · developed /);
  });

  it("★ a develop ahead is reached at its own moment, whenever the first reader mounted", () => {
    // Mounted 19 s before 9 am: a timer started here would step at 9:00:11, eleven seconds after the develop.
    vi.setSystemTime(new Date(2026, 9, 11, 8, 59, 41));
    const developsAt = new Date(2026, 9, 11, 9, 0).toISOString();
    const { container } = render(<Eyebrow developsAt={developsAt} />);
    expect(said(container)).toBe("Disposable · develops at 9 am");
    act(() => {
      vi.advanceTimersByTime(18_999);
    });
    expect(said(container)).toBe("Disposable · develops at 9 am");
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(said(container)).toBe("Disposable · developed at 9 am");
  });

  it("★ a reader that arrives while the timer runs reads the clock afresh, not the one the first reader took", () => {
    vi.setSystemTime(new Date(2026, 9, 10, 7, 42, 0));
    const first = render(<Show />);
    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    const late = render(<Show />);
    expect(late.container.querySelector("p")?.getAttribute("data-now")).toBe(
      String(Date.now()),
    );
    first.unmount();
    late.unmount();
  });

  it("one timer serves every reader, and none runs for a reader with no time to tell", () => {
    const a = render(<Show />);
    const b = render(<Show />);
    expect(vi.getTimerCount()).toBe(1);
    a.unmount();
    expect(vi.getTimerCount()).toBe(1);
    b.unmount();
    expect(vi.getTimerCount()).toBe(0);
    function Off() {
      return <p data-now={String(useWaitClock(false))} />;
    }
    const off = render(<Off />);
    expect(off.container.querySelector("p")?.getAttribute("data-now")).toBe(
      "null",
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it("★ a clock set back does not stall the steps: they go on from the clock as it now reads", () => {
    vi.setSystemTime(new Date(2026, 9, 10, 7, 42, 0));
    const { container, unmount } = render(<Show />);
    const read = () =>
      Number(container.querySelector("p")?.getAttribute("data-now"));
    // Ten minutes back, with the timer armed for 7:42:30: it fires on schedule and finds the clock behind its moment.
    act(() => {
      vi.setSystemTime(new Date(2026, 9, 10, 7, 32, 0));
    });
    act(() => {
      vi.advanceTimersByTime(WAIT_CLOCK_STEP_MS);
    });
    expect(read()).toBe(new Date(2026, 9, 10, 7, 32, 30).getTime());
    // And the next step is the next half minute of the clock as it reads, not ten minutes on.
    act(() => {
      vi.advanceTimersByTime(WAIT_CLOCK_STEP_MS);
    });
    expect(read()).toBe(new Date(2026, 9, 10, 7, 33, 0).getTime());
    unmount();
  });

  it("steps on the clock's own half minutes, so a develop picked to the minute meets a step exactly", () => {
    vi.setSystemTime(new Date(2026, 9, 10, 7, 42, 11, 500));
    const { container, unmount } = render(<Show />);
    const read = () =>
      Number(container.querySelector("p")?.getAttribute("data-now"));
    act(() => {
      vi.advanceTimersByTime(18_500);
    });
    // 7:42:30.000: the first step, 18.5 s on, whatever second the reader mounted in.
    expect(read()).toBe(new Date(2026, 9, 10, 7, 42, 30).getTime());
    act(() => {
      vi.advanceTimersByTime(WAIT_CLOCK_STEP_MS);
    });
    expect(read()).toBe(new Date(2026, 9, 10, 7, 43, 0).getTime());
    unmount();
  });
});
