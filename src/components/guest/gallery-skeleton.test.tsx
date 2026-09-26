import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ROW_CLASSES } from "@/lib/shared/album-rows";

import { GallerySkeleton } from "./gallery-skeleton";

/**
 * THE STREAMING PLACEHOLDER LAYS OUT THE ALBUM'S OWN ROWS. It reads the album's rule (photographs a
 * row, `ROW_CLASSES`) at the album's step, one custom property per width class, so the swap from
 * shimmer to photographs never changes how many a row holds. It used to lay masonry columns, which
 * under the rows album flashed the wrong layout on every load. jsdom has no layout, so what is
 * pinned is the knob and the rule.
 */
describe("GallerySkeleton", () => {
  it.each([0, 1, 2] as const)(
    "carries each width class's count at the album's step (%i)",
    (step) => {
      const { container } = render(<GallerySkeleton step={step} />);
      const row = container.querySelector(
        "[data-gallery-skeleton] .flex-wrap",
      ) as HTMLElement;
      ROW_CLASSES.forEach((c, i) => {
        expect(row.style.getPropertyValue(`--sk-n${i}`)).toBe(
          String(c.perRow[step]),
        );
      });
    },
  );

  it("draws about three of the densest rows, never a page of shimmer", () => {
    const { container } = render(<GallerySkeleton step={1} />);
    const tiles = container.querySelectorAll(
      "[data-gallery-skeleton] .flex-wrap > [data-slot='skeleton']",
    );
    const densest = Math.max(...ROW_CLASSES.map((c) => c.perRow[2]));
    expect(tiles).toHaveLength(densest * 3);
  });
});
