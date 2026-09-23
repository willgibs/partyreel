import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GALLERY_COLUMNS } from "@/components/shared/masonry";

import { GallerySkeleton } from "./gallery-skeleton";

/**
 * THE STREAMING PLACEHOLDER LAYS OUT THE ALBUM'S OWN COLUMNS. It reads the
 * album's column rule at the album's tile size (`--album-column`, the knob the
 * View menu's Tile size sets on the album's wrapper), so the swap from shimmer
 * to photographs never changes the count. Without the size it fell back to the
 * rule's 220px floor: 8 shimmering columns at 1920 under an album that landed
 * in 7. jsdom has no layout, so what is pinned is the knob and the rule.
 */
describe("GallerySkeleton", () => {
  it.each([180, 240, 300] as const)(
    "lays out on the album's tile size (%ipx), by the album's own rule",
    (size) => {
      const { container } = render(<GallerySkeleton tileSize={size} />);
      const box = container.querySelector("section") as HTMLElement;
      expect(box.style.getPropertyValue("--album-column")).toBe(`${size}px`);
      expect(
        box.querySelector(`div[class="${GALLERY_COLUMNS}"]`),
      ).not.toBeNull();
    },
  );
});
