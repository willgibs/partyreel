import { describe, expect, it, vi } from "vitest";

/**
 * THE REEL VIEW'S CHUNK, ASKED FOR ON INTENT (`hub-reel-view.ts`): one import promise for the Reel card's warm-up and the
 * lazy boundary alike, so a press after a hover never asks twice.
 */
const loads = vi.hoisted(() => ({ count: 0 }));
vi.mock("@/components/guest/reel/live-reel-view", () => {
  loads.count += 1;
  return { LiveReelView: () => null };
});

describe("the view's chunk", () => {
  it("is asked for once, however many times a hover, a focus and a press ask", async () => {
    const { loadHubReelView, warmHubReelView } =
      await import("./hub-reel-view");
    warmHubReelView();
    warmHubReelView();
    const view = await loadHubReelView();
    await loadHubReelView();
    expect(typeof view.LiveReelView).toBe("function");
    expect(loads.count).toBe(1);
  });
});
