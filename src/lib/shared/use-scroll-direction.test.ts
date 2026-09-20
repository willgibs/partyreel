// @contract-for: src/lib/shared/use-scroll-direction.ts
import { describe, expect, it } from "vitest";

import { seedFrom, step, type ScrollState } from "./use-scroll-direction";

/**
 * THE HIDE-AND-RETURN MACHINE, as arithmetic. What Will ruled is a BEHAVIOUR
 * ("Hides going down, returns coming up", `on-scroll=hide`, 2026-09-19), and
 * the behaviour is entirely in this reducer: the store around it is a passive
 * listener and a rAF, and the motion is CSS. So the rules get tested here,
 * where they are a pure function, rather than through a browser that would
 * only prove jsdom can dispatch an event.
 *
 * Function, never look: nothing below asserts a class, a clock or a curve.
 */

const REVEAL_ZONE = 64;
const HYSTERESIS = 8;

/** Walk a reader down (or up) the page one position at a time. */
function scroll(from: ScrollState, ...positions: number[]): ScrollState {
  return positions.reduce(step, from);
}

describe("the scroll-direction machine", () => {
  it("shows the bar at the head of the page, whatever came before", () => {
    const hidden = scroll(seedFrom(0), 400, 800);
    expect(hidden.direction).toBe("down");
    // Back inside the reveal zone: the bar returns without needing a gesture.
    expect(step(hidden, REVEAL_ZONE).direction).toBe("top");
    expect(step(hidden, 0).direction).toBe("top");
  });

  it("does not hide until the reader commits past the hysteresis", () => {
    const atZone = step(seedFrom(0), REVEAL_ZONE);
    // One pixel out of the zone is not a decision, and neither is eight.
    expect(step(atZone, REVEAL_ZONE + 1).direction).toBe("top");
    expect(step(atZone, REVEAL_ZONE + HYSTERESIS).direction).toBe("top");
    expect(step(atZone, REVEAL_ZONE + HYSTERESIS + 1).direction).toBe("down");
  });

  it("measures the hysteresis from the furthest point, not the last flip", () => {
    // A slow reader drifting down a few pixels a frame must still get the bar
    // out of the way; a trailing anchor is what makes that true.
    let s = seedFrom(0);
    for (let y = 0; y <= 400; y += 3) s = step(s, y);
    expect(s.direction).toBe("down");
  });

  it("returns on ANY upward movement, with no threshold to clear", () => {
    const hidden = scroll(seedFrom(0), 400, 800);
    expect(hidden.direction).toBe("down");
    expect(step(hidden, 799).direction).toBe("up");
  });

  it("holds still inside the band rather than flickering", () => {
    // Coming to rest after an upward gesture: small downward drift below the
    // hysteresis must not flip the bar back off.
    const up = scroll(seedFrom(0), 800, 600);
    expect(up.direction).toBe("up");
    expect(scroll(up, 602, 605, 607).direction).toBe("up");
    expect(step(up, 620).direction).toBe("down");
  });

  it("reads a rubber-band overscroll as the top, never as a scroll up", () => {
    expect(step(seedFrom(0), -120).direction).toBe("top");
  });

  it("ignores sub-pixel jitter on a fractional-DPR display", () => {
    const hidden = scroll(seedFrom(0), 400, 800);
    // 800 -> 799.6 rounds to 800: the same pixel, not a gesture.
    expect(step(hidden, 799.6).direction).toBe("down");
  });

  it("seeds SHOWN even on a page that loads already deep", () => {
    // An anchored link, a bfcache restore, a throttled tab. The visible state
    // is the default (bible 13); the first real gesture corrects it.
    expect(seedFrom(4000).direction).toBe("up");
    expect(seedFrom(0).direction).toBe("top");
  });
});
