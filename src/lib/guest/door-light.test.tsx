import { act, render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  HOUSE_HUES,
  hueOfOklch,
  publishDoorHues,
  resetDoorLightForTests,
  useAnyLampLit,
  useDoorHues,
  useLampLit,
} from "@/lib/guest/door-light";

/**
 * THE DOOR'S LIGHT, ITS COLOUR (`identity-door` r2, `look=lit`). Every lamp wears the album's three
 * newest photographs' hues once the sample lands and the house five until then (and wherever
 * nothing can be sampled, a password event before its unlock); the album samples only while a lamp
 * is lit.
 */
afterEach(() => {
  resetDoorLightForTests();
});

describe("hueOfOklch", () => {
  it("reads the hue off the sampler's own oklch() output, and nothing off anything else", () => {
    expect(hueOfOklch("oklch(0.72 0.15 212.4)")).toBe(212.4);
    expect(hueOfOklch("  oklch(0.88 0.08 25)  ")).toBe(25);
    expect(hueOfOklch("rgb(1 2 3)")).toBeNull();
  });
});

describe("useDoorHues", () => {
  it("wears the house five until the sample lands, then the album's own", () => {
    const { result } = renderHook(() => useDoorHues());
    expect(result.current).toEqual({ hues: HOUSE_HUES, sampled: false });
    act(() => publishDoorHues([12, 200, 300, 45, 90]));
    expect(result.current).toEqual({
      hues: [12, 200, 300, 45, 90],
      sampled: true,
    });
  });

  it("a sample equal to the one it holds changes nothing", () => {
    let renders = 0;
    renderHook(() => {
      renders += 1;
      return useDoorHues();
    });
    act(() => publishDoorHues([1, 2, 3]));
    const after = renders;
    act(() => publishDoorHues([1, 2, 3]));
    expect(renders).toBe(after);
  });
});

describe("useLampLit / useAnyLampLit", () => {
  function Lamp() {
    useLampLit();
    return null;
  }

  it("is lit while a lamp is mounted, and dark once the last one leaves", () => {
    const { result } = renderHook(() => useAnyLampLit());
    expect(result.current).toBe(false);
    const one = render(<Lamp />);
    const two = render(<Lamp />);
    expect(result.current).toBe(true);
    one.unmount();
    expect(result.current).toBe(true);
    two.unmount();
    expect(result.current).toBe(false);
  });
});
