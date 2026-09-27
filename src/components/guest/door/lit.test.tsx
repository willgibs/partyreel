import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  publishDoorHues,
  resetDoorLightForTests,
} from "@/lib/guest/door-light";

import { DOOR_SCRIM, DoorLamp, LiveCount } from "./lit";

/**
 * THE DOOR'S LIT PIECES (`identity-door` r2, `look=lit`). What is pinned is the mechanism, never a
 * look: the count ticks from the number it was to the number it is (and never on the first paint),
 * the lamp wears the album's hues once sampled and the house five until then, and the scrim is the
 * board's.
 */
afterEach(() => {
  resetDoorLightForTests();
});

beforeEach(() => {
  resetDoorLightForTests();
});

describe("LiveCount", () => {
  it("the first paint never ticks: only the number, nothing leaving", () => {
    const { container } = render(<LiveCount value={48} />);
    expect(
      container.querySelector("[data-door-count-settled]")?.textContent,
    ).toBe("48");
    expect(container.querySelector(".door-count-out")).toBeNull();
    expect(container.querySelector(".door-count-in")).toBeNull();
  });

  it("a photo lands: the old number leaves (hidden from assistive tech) and the new one rises", () => {
    const { container, rerender } = render(<LiveCount value={48} />);
    rerender(<LiveCount value={49} />);
    const out = container.querySelector(".door-count-out");
    expect(out?.textContent).toBe("48");
    expect(out).toHaveAttribute("aria-hidden");
    const settled = container.querySelector("[data-door-count-settled]");
    expect(settled?.textContent).toBe("49");
    expect(settled).toHaveClass("door-count-in");
  });

  it("groups a big number the one way every count is printed", () => {
    const { container } = render(<LiveCount value={1249} />);
    expect(
      container.querySelector("[data-door-count-settled]")?.textContent,
    ).toBe("1,249");
  });
});

describe("DoorLamp", () => {
  it("wears the house five until the sample lands, then the album's hues", () => {
    const { container } = render(<DoorLamp edge="free" />);
    const lamp = container.querySelector("[data-door-lamp]");
    expect(lamp).toHaveAttribute("data-door-hues", "25,85,155");
    expect(lamp).not.toHaveAttribute("data-door-sampled");
    act(() => publishDoorHues([10, 200, 300, 40, 90]));
    expect(lamp).toHaveAttribute("data-door-hues", "10,200,300");
    expect(lamp).toHaveAttribute("data-door-sampled");
  });

  it("names its edge and its strength, and hides from assistive tech", () => {
    const { container } = render(<DoorLamp edge="card" strength="bloom" />);
    const lamp = container.querySelector("[data-door-lamp]");
    expect(lamp).toHaveAttribute("data-door-lamp", "bloom");
    expect(lamp).toHaveClass("door-lamp-card", "door-lamp-bloom");
    expect(lamp).toHaveAttribute("aria-hidden");
  });
});

describe("DOOR_SCRIM", () => {
  it("is the board's lit scrim: 30% black, a 28px blur, brightness .72, saturate 1.2", () => {
    expect(DOOR_SCRIM).toContain("bg-black/30");
    expect(DOOR_SCRIM).toContain("backdrop-blur-[28px]");
    expect(DOOR_SCRIM).toContain("backdrop-brightness-72");
    expect(DOOR_SCRIM).toContain("backdrop-saturate-120");
  });
});
