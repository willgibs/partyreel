import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import {
  friendlyCapacity,
  planById,
  plansForTier,
  type PlanId,
} from "@/lib/constants/tiers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { formatCount } from "@/lib/format/count";
import { runAsGermanNumberRuntime } from "@/lib/test-utils/german-runtime";

import { ComparisonTable } from "./comparison-table";
import { Configurator, STOP_GB } from "./configurator";
import { PassCard } from "./pass-card";
import { PlanPair } from "./plan-cards";

/**
 * ★ THE PRICING PAGES' COUNTS READ THE SAME IN EVERY RUNTIME (crumbs-36, from crumbs-33). The photo and hour counts
 * on the plan cards, the Event Pass ticket, the configurator's result card and the comparison table were each
 * printed with a bare `toLocaleString()`, so a browser set to German redrew the server's "21,943" as "21.943" (and
 * React threw #418 at the difference). Each is `formatCount`'s now. The runtime is simulated the only way a test
 * can be: every number call that names no locale answers in German (`runAsGermanNumberRuntime`).
 *
 * Copy is never pinned here: each count is read back out of tiers.ts (`friendlyCapacity`), and a page is asked for
 * the digits as `formatCount` spells them and for the German spelling of the same number to be absent.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

/** The cards and the table carry <Reveal> and <PricePop>, which observe themselves into view; visible at once. */
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

afterEach(() => {
  vi.restoreAllMocks();
});

const GERMAN = new Intl.NumberFormat("de-DE");

/** A plan's photo estimate, as the pages print it (`en`) and as an unpinned call would in German (`de`). */
function photos(planId: PlanId) {
  const n = friendlyCapacity(planById(planId).storageBytes).photos;
  return { n, en: formatCount(n), de: GERMAN.format(n) };
}

/** What the page drew, as a reader reads it. */
const drawn = (container: HTMLElement) => container.textContent ?? "";

describe("the pricing pages' counts in a browser that is not en-US", () => {
  it("the simulated runtime would have drawn these counts in German (the pins below are not vacuous)", () => {
    runAsGermanNumberRuntime();
    const pass = photos("event_pass");
    expect(pass.n).toBeGreaterThanOrEqual(1000);
    expect(pass.de).not.toBe(pass.en);
    expect(pass.n.toLocaleString()).toBe(pass.de);
  });

  it("★ the plan pair draws Pro's photos in en-US, at every size the slider reaches", () => {
    runAsGermanNumberRuntime();
    const { container } = render(<PlanPair />);
    const slider = screen.getByRole("slider", { name: /storage size/i });
    for (const [i, plan] of plansForTier("pro").entries()) {
      fireEvent.change(slider, { target: { value: String(i) } });
      const n = photos(plan.id);
      expect(drawn(container), plan.id).toContain(n.en);
      expect(drawn(container), plan.id).not.toContain(n.de);
    }
  });

  it("★ the Event Pass ticket draws its photos in en-US", () => {
    runAsGermanNumberRuntime();
    const { container } = render(<PassCard />);
    const n = photos("event_pass");
    expect(drawn(container)).toContain(n.en);
    expect(drawn(container)).not.toContain(n.de);
  });

  it("★ the configurator's result card draws its photos in en-US, at every room that lands on a paid plan", () => {
    runAsGermanNumberRuntime();
    const { container } = render(<Configurator />);
    const slider = screen.getByRole("slider", { name: /how much storage/i });
    const paid = (
      ["event_pass", ...plansForTier("pro").map((p) => p.id)] as const
    ).map(photos);
    // The pass's own room, then the three Pro sizes: the card is the brain's pick for each, whichever plan that is.
    for (const gb of [75, 100, 500, 2048]) {
      const stop = STOP_GB.indexOf(gb);
      expect(stop, `${gb} GB is a stop on the ladder`).toBeGreaterThan(-1);
      fireEvent.change(slider, { target: { value: String(stop) } });
      expect(
        paid.some((n) => drawn(container).includes(n.en)),
        `${gb} GB draws a grouped count`,
      ).toBe(true);
      for (const n of paid) {
        expect(drawn(container), `${gb} GB`).not.toContain(n.de);
      }
    }
  });

  it("★ the comparison table's Holds about row draws every count in en-US", () => {
    runAsGermanNumberRuntime();
    // The table's row names are tooltips, which the app's providers wrap (`components/providers.tsx`).
    const { container } = render(
      <TooltipProvider>
        <ComparisonTable />
      </TooltipProvider>,
    );
    const pro = plansForTier("pro");
    for (const id of ["event_pass", pro[pro.length - 1].id] as const) {
      const n = photos(id);
      expect(drawn(container), id).toContain(n.en);
      expect(drawn(container), id).not.toContain(n.de);
    }
  });
});
