import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import { MAX_REEL_SECONDS, type Tier } from "@/lib/constants/tiers";
import { clipFactsForTier } from "@/lib/events/gallery-reel";

import { clipTermsFor } from "./clip-terms";
import { ComparisonTable } from "./comparison-table";

/**
 * A CLIP IS ONE ROW (mkt-polish, from `pricing-wiring`): /pricing's matrix gave a clip's length a row of
 * its own beside its mark's, and since the free/pro shift that row read "60 seconds" on every plan and
 * compared nothing. The length now rides the mark's row, in the creator's own facts, so the matrix can
 * neither drop the length nor promise one the creator does not apply.
 *
 * The words are read back out of `clipFactsForTier`, never typed here.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

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

describe("clipTermsFor", () => {
  it.each(TIERS)(
    "says the %s plan's clip length and its mark, as the creator applies them",
    (tier) => {
      const facts = clipFactsForTier(tier);
      const words = clipTermsFor(tier);
      expect(words).toContain(`${MAX_REEL_SECONDS[tier]} seconds`);
      expect(words).toContain(facts.watermark ? "small mark" : "no mark");
    },
  );
});

describe("the pricing matrix's clip", () => {
  it("is one row carrying each plan's length and mark together", () => {
    render(
      <TooltipProvider>
        <ComparisonTable />
      </TooltipProvider>,
    );
    const seconds = new Set(TIERS.map((t) => `${MAX_REEL_SECONDS[t]} seconds`));
    const naming = screen
      .getAllByRole("row")
      .filter((row) => [...seconds].some((s) => row.textContent?.includes(s)));
    // One row names a clip's length, and it is the row that names its mark.
    expect(naming).toHaveLength(1);
    // Each cell also carries its plan's name for the stacked phone layout (hidden from sm up).
    const cells = within(naming[0]).getAllByRole("cell");
    expect(cells).toHaveLength(TIERS.length);
    TIERS.forEach((tier, i) =>
      expect(cells[i].textContent, tier).toContain(clipTermsFor(tier)),
    );
  });
});
