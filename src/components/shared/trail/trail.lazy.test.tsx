import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TrailLazy } from "./trail.lazy";

/**
 * THE 404 DRAWS THE TRAIL THROUGH ITS LAZY WRAPPER (crumbs-22). What the wrapper owes the 404 is what the
 * component owed it: the words a lost visitor came for stand in the trail's stage, in the box the caller
 * sized, once the chunk has arrived. (That nothing else loads the trail is `trail-lazy.test.ts`'s.)
 */
describe("TrailLazy", () => {
  // The trail's loop asks the browser for a visibility watcher and frames; jsdom has neither, and this
  // pins the wrapper, not the loop (`trail.test.tsx` is the loop's). Left stubbed after the test: the setup's
  // cleanup flushes the layer's effects once the test is over.
  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
        takeRecords = vi.fn(() => []);
      },
    );
    vi.stubGlobal("requestAnimationFrame", () => 0);
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  it("draws its children in the trail's stage, with the caller's box, once the chunk has loaded", async () => {
    const { container } = render(
      <TrailLazy className="flex flex-1 items-center">
        <p>We lost this page</p>
      </TrailLazy>,
    );
    expect(await screen.findByText("We lost this page")).toBeInTheDocument();
    const stage = container.querySelector(".trl-stage");
    expect(stage).not.toBeNull();
    expect(stage).toHaveClass("flex", "flex-1", "items-center");
    expect(stage?.contains(screen.getByText("We lost this page"))).toBe(true);
  });
});
