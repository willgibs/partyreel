import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { clipTermsFor } from "@/components/marketing/sections/pricing/clip-terms";
import { MAX_REEL_SECONDS, TIER_NAMES, type Tier } from "@/lib/constants/tiers";

import { ClipSection } from "./clip-section";

/**
 * /REEL'S CLIP TABLE GIVES A PLAN'S CLIP ONE CELL (mkt-polish, from `pricing-wiring`): it carried a
 * length column beside the mark's, and since every plan's clips run the same length that column read
 * "60 seconds" all the way down. The length rides the mark's cell, in the pricing matrix's own phrase,
 * so the two tables say a clip the same way.
 */

beforeAll(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private cb: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.cb(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      unobserve() {}
      disconnect() {}
    },
  );
});

const TIERS: readonly Tier[] = ["free", "event_pass", "pro"];

describe("the /reel clip table", () => {
  it("says each plan's clip length and mark in one cell", () => {
    render(<ClipSection />);
    const table = screen.getByRole("table");
    // The plan, then its clips: one column of data, never a length column of its own.
    expect(within(table).getAllByRole("columnheader")).toHaveLength(2);
    for (const tier of TIERS) {
      const row = within(table).getByRole("row", {
        name: new RegExp(`^${TIER_NAMES[tier]}`),
      });
      const cells = within(row).getAllByRole("cell");
      expect(cells, tier).toHaveLength(1);
      expect(cells[0].textContent, tier).toContain(clipTermsFor(tier));
      expect(cells[0].textContent, tier).toContain(
        `${MAX_REEL_SECONDS[tier]} seconds`,
      );
    }
  });
});
