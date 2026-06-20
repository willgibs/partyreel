import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import type { GridMedia } from "@/components/app/media-grid";
import { MasonryColumns } from "@/components/shared/masonry";

// S3·3a: the host moderation + recovery-bin grids moved onto MasonryColumns and
// inject their per-tile controls via `renderOverlay`. The load-bearing contract
// (carried over from the old square grids): the overlay renders as a SIBLING of
// the open-lightbox button, NOT a child — so it paints on top and a control tap
// is captured by the control, never opening the lightbox. jsdom can't verify
// paint-order hit-testing, so we pin the structural invariant it depends on.

const items: GridMedia[] = [
  { id: "a", type: "photo", url: "/a.jpg", width: 800, height: 1200 },
  { id: "b", type: "video", url: "/b.mp4", width: 1920, height: 1080 },
];

describe("MasonryColumns renderOverlay (S3·3a)", () => {
  it("renders one overlay per tile, as a sibling of the open-lightbox button", () => {
    render(
      <MasonryColumns
        items={items}
        viewerIsHost
        clampAspect
        renderOverlay={(item) => (
          <button type="button" data-testid={`ov-${item.id}`}>
            control
          </button>
        )}
      />,
    );

    // One overlay per item.
    expect(screen.getByTestId("ov-a")).toBeInTheDocument();
    expect(screen.getByTestId("ov-b")).toBeInTheDocument();

    // Each tile still has its open-lightbox button.
    const openBtn = screen.getByLabelText("View photo");
    expect(openBtn).toBeInTheDocument();
    expect(screen.getByLabelText("Play video")).toBeInTheDocument();

    // The overlay is a SIBLING (same parent), never nested inside the open
    // button — the invariant that keeps a control tap off the lightbox.
    const overlay = screen.getByTestId("ov-a");
    expect(openBtn.contains(overlay)).toBe(false);
    expect(openBtn.parentElement).toBe(overlay.parentElement);
  });

  it("renderOverlay is optional — a tile renders without it and still opens", () => {
    render(<MasonryColumns items={items} />);
    expect(screen.getByLabelText("View photo")).toBeInTheDocument();
    expect(screen.queryByTestId("ov-a")).not.toBeInTheDocument();
  });
});
