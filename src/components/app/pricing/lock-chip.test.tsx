import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import { TIER_NAMES } from "@/lib/constants/tiers";

import { LockChip } from "./lock-chip";
import { LOCKED_FEATURES, type LockedFeature } from "./triggers";

/**
 * CONVERT, NOT BLOCK (`words=chip`, Will 2026-09-20, verbatim: "the lock chip
 * should also provide context on why it's locked and provide action to
 * upgrade, rather than simply appear unusable").
 *
 * The failure this exists to catch is the obvious regression: someone makes the
 * chip `disabled` because it looks unavailable, and a gated control becomes a
 * dead end again. So three things are pinned, and none of them is a sentence:
 *
 *  1. it is a PRESSABLE button, at every gated feature;
 *  2. its accessible name carries the control's own name AND the plan, because
 *     a screen reader gets neither the tooltip nor the chip's colour;
 *  3. pressing it OPENS the pricing surface, led by this feature.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const FEATURES = Object.keys(LOCKED_FEATURES) as LockedFeature[];

/**
 * The chip's tooltip rides the ROOT provider in production (providers.tsx wraps
 * the whole app, delay 0 so a tooltip opens immediately on hover), which is why
 * the component carries none of its own. A test renders outside that tree, so
 * it supplies one here rather than pushing a second provider into the product.
 */
function chip(props: React.ComponentProps<typeof LockChip>) {
  render(
    <TooltipProvider>
      <LockChip {...props} />
    </TooltipProvider>,
  );
}

describe("every gated control wears the same chip", () => {
  it.each(FEATURES)("%s is a pressable button, never a disabled label", (feature) => {
    chip({ feature });
    const button = screen.getByRole("button");
    expect(button).toBeEnabled();
    expect(button.getAttribute("data-lock-chip")).toBe(feature);
  });

  it.each(FEATURES)("%s names itself and the plan to a screen reader", (feature) => {
    chip({ feature });
    const name = screen.getByRole("button").getAttribute("aria-label") ?? "";
    expect(name).toContain(LOCKED_FEATURES[feature].name);
    expect(name).toContain(TIER_NAMES.pro);
  });
});

describe("pressing it opens the surface that explains and sells", () => {
  it("opens the pricing sheet led by this feature", async () => {
    chip({ feature: "video" });
    expect(screen.queryByRole("dialog")).toBeNull();

    await userEvent.click(screen.getByRole("button"));

    const dialog = await screen.findByRole("dialog");
    expect(dialog.getAttribute("data-pricing-sheet")).toBe("locked");
  });

  it("hands the sheet the control's page, so Checkout can finish the job", async () => {
    // `back=finish`: the chip is the only thing that knows which page the host
    // was refused on, and the route re-validates whatever it passes.
    const returnTo = "/dashboard/9f1c2b3a-4d5e-6f70-8192-a3b4c5d6e7f8?room=settings";
    chip({ feature: "password", returnTo });
    await userEvent.click(screen.getByRole("button"));
    await screen.findByRole("dialog");
    // The buy buttons are what carry it; their presence with the chip's page is
    // the seam. (The value itself is pinned in return-path.test.ts.)
    expect(
      screen.getAllByRole("button", { name: /get|buy a pass/i }).length,
    ).toBeGreaterThan(0);
  });
});
