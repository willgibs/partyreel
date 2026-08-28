import { afterEach, describe, expect, it, vi } from "vitest";

const vendorTrack = vi.fn();
vi.mock("@vercel/analytics", () => ({
  track: (...args: unknown[]) => vendorTrack(...args),
}));

import { NO_TRACK_KEY, beforeSendDrop, track } from "./web";

describe("track", () => {
  it("forwards event + props to the vendor", () => {
    vendorTrack.mockImplementationOnce(() => undefined);
    track("cta_click", { cta: "start-free", location: "header" });
    expect(vendorTrack).toHaveBeenCalledWith("cta_click", {
      cta: "start-free",
      location: "header",
    });
  });

  it("never throws when the vendor does (dev SSR, absent script)", () => {
    vendorTrack.mockImplementationOnce(() => {
      throw new Error("ssr");
    });
    expect(() => track("reel_play")).not.toThrow();
  });
});

describe("beforeSendDrop", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("passes events through when no window exists (node/SSR)", () => {
    const event = { url: "https://partyreel.com/" };
    expect(beforeSendDrop(event)).toBe(event);
  });

  it("drops everything when the opt-out flag is set", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => (key === NO_TRACK_KEY ? "1" : null),
      },
    });
    expect(beforeSendDrop({ url: "https://partyreel.com/" })).toBeNull();
  });

  it("passes events through when the flag is absent", () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => null } });
    const event = { url: "https://partyreel.com/pricing" };
    expect(beforeSendDrop(event)).toBe(event);
  });

  it("fails open when storage access throws (privacy modes)", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("denied");
        },
      },
    });
    const event = { url: "https://partyreel.com/features" };
    expect(beforeSendDrop(event)).toBe(event);
  });
});
