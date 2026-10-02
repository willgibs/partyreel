import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import PricingPage from "@/app/(marketing)/(cinema)/pricing/page";
import { HowMuchFits } from "@/components/marketing/sections/features/album/how-much-fits";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * THE FAINT STEP WEARS CAPTIONS, NEVER COPY (mkt-polish, the a11y pass on `--faint`). `--faint` is 3.2:1
 * on the page and 2.9:1 on the mat (globals.css), a caption's grey: a timestamp, a count, an ordinal, a
 * label beside a value. Sentences had drifted onto it (the estimate's basis under the plans and under the
 * album page's strip, the Event Pass's terms, Free's "No card", the configurator's yearly price and its
 * alternative, the unlock tiles' line on Free), and so had the size slider's only visible label, which
 * the design system already kept off it. Each moved up a step, to `--muted-foreground` (7.0:1 and 6.4:1).
 *
 * The rule is read off the rendered page, never the copy: a run of four words or more in faint text is a
 * sentence. Captions stay (≤ 3 words: "We recommend", "Storage", "1 GB"), and so does decoration.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/pricing",
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

/** The text colours an element can set; the nearest one above a text node is the colour it reads in. */
const COLOUR =
  /(?:^|\s)text-(faint|muted-foreground|foreground|background|success|primary|white|destructive|reel|like|save)(?:\/\d+)?(?=\s|$)/;

/** Every run of text that reads in the faint step and is four words or longer: a sentence. */
function faintSentences(root: HTMLElement): string[] {
  const found: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const words = (node.textContent ?? "").trim().split(/\s+/).filter(Boolean);
    if (words.length < 4) continue;
    let el = node.parentElement;
    while (el && !COLOUR.test(el.getAttribute("class") ?? ""))
      el = el.parentElement;
    const colour = COLOUR.exec(el?.getAttribute("class") ?? "")?.[1];
    if (colour === "faint") found.push(words.join(" "));
  }
  return found;
}

describe("the faint step", () => {
  it("carries no sentence on /pricing", () => {
    const { container } = render(
      <TooltipProvider>
        <PricingPage />
      </TooltipProvider>,
    );
    // Pinned for non-emptiness: the page still uses the step for its captions.
    expect(container.querySelectorAll(".text-faint").length).toBeGreaterThan(0);
    expect(faintSentences(container)).toEqual([]);
  });

  it("carries no sentence under the album page's strip", () => {
    const { container } = render(<HowMuchFits />);
    expect(faintSentences(container)).toEqual([]);
  });

  it("is never the size question's only visible label", () => {
    render(
      <TooltipProvider>
        <PricingPage />
      </TooltipProvider>,
    );
    const slider = screen.getByRole("slider", { name: /storage your event/i });
    // The block's first line names the control and shows its value.
    const label = slider.parentElement?.querySelector("span");
    expect(label).toBeTruthy();
    expect(label!.className).not.toMatch(/\btext-faint\b/);
  });
});
