import { describe, expect, it } from "vitest";

import { WEB_EVENTS, trackAttrs } from "./events";

describe("web analytics taxonomy", () => {
  it("pins the event names (append-only: a rename splits its dashboard history)", () => {
    expect(WEB_EVENTS).toEqual([
      "cta_click",
      "demo_open",
      "reel_play",
      "checkout_start",
      "contact_submit",
      "careers_apply",
      "assistant_click",
    ]);
  });

  it("keeps names snake_case ascii (vendor-facing ids, not copy)", () => {
    for (const name of WEB_EVENTS) {
      expect(name).toMatch(/^[a-z]+(_[a-z]+)*$/);
    }
  });

  it("builds the data attributes the delegated listener round-trips", () => {
    expect(
      trackAttrs("cta_click", { cta: "start-free", location: "header" }),
    ).toEqual({
      "data-track": "cta_click",
      "data-track-cta": "start-free",
      "data-track-location": "header",
    });
    expect(trackAttrs("reel_play")).toEqual({ "data-track": "reel_play" });
  });
});
