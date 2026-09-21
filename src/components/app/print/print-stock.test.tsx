// @contract-for: src/components/app/print/print-stock.tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LINK_STEP_DOWN, PrintStock, WRAP_RISK_CHARS } from "@/components/app/print/print-stock";
import { PRINT_STOCK, STOCK_IDS } from "@/lib/qr/stock";

/**
 * THE LINK LINE MUST STAY INSIDE ITS OWN CARD (the alias red-team, 2026-09-21:
 * a 61-char link at 8.67px measured 255px wide inside a 234px card and ran
 * into the next one on the printed sheet, nine cards to a page).
 *
 * FUNCTION ONLY: jsdom has no print layout engine, so this cannot measure a
 * rendered width the way the red-team did on paper — it asserts the RULES
 * that make the line shrink-to-fit instead (the wrap property + the width
 * bound to the face) and the font-size arithmetic, never a pixel box. The
 * real fit is eyeballed on the alias at 70+ characters; that measurement
 * belongs in the Handoff, not a unit test.
 */
function urlOfLength(n: number): string {
  const base = "partyreel.com/e/";
  return (base + "a".repeat(Math.max(0, n - base.length))).slice(0, n);
}

function linkLine(container: HTMLElement) {
  return container.querySelector("[data-print-link]") as HTMLElement;
}

describe("the link line wraps inside its own face, never past it", () => {
  it("carries the wrap rule and is bound to the face's own width", () => {
    const { container } = render(
      <PrintStock
        stockId="cards"
        eventName="Maya's Wedding"
        joinUrl="https://partyreel.com/e/abc123"
        readableUrl={urlOfLength(WRAP_RISK_CHARS)}
      />,
    );
    const line = linkLine(container);
    // `wrap-anywhere` (overflow-wrap: anywhere) breaks the token; `w-full`
    // binds the box to the face's own inner width so there is something for
    // that rule to break INTO — the two are one fix, and either alone still
    // overflows (a bare wrap rule on a shrink-to-fit flex child never wraps;
    // a bound width with no wrap rule just clips the unbroken token).
    expect(line.className).toContain("wrap-anywhere");
    expect(line.className).toContain("w-full");
  });

  it("applies the same rule to every piece, not only the cards", () => {
    for (const stockId of STOCK_IDS) {
      const { container, unmount } = render(
        <PrintStock
          stockId={stockId}
          eventName="Maya's Wedding"
          joinUrl="https://partyreel.com/e/abc123"
          readableUrl={urlOfLength(75)}
        />,
      );
      const line = linkLine(container);
      expect(line.className).toContain("wrap-anywhere");
      expect(line.className).toContain("w-full");
      unmount();
    }
  });
});

describe("past WRAP_RISK_CHARS the face steps its link line down once", () => {
  it("keeps the piece's normal size at or under the risk length", () => {
    const { container } = render(
      <PrintStock
        stockId="cards"
        eventName="Maya's Wedding"
        joinUrl="https://partyreel.com/e/abc123"
        readableUrl={urlOfLength(WRAP_RISK_CHARS)}
      />,
    );
    expect(linkLine(container).style.fontSize).toBe(
      `${PRINT_STOCK.cards.type.link}pt`,
    );
  });

  it("steps down, rounded to 2dp, one character past the risk length", () => {
    const { container } = render(
      <PrintStock
        stockId="cards"
        eventName="Maya's Wedding"
        joinUrl="https://partyreel.com/e/abc123"
        readableUrl={urlOfLength(WRAP_RISK_CHARS + 1)}
      />,
    );
    const expected =
      Math.round(PRINT_STOCK.cards.type.link * LINK_STEP_DOWN * 100) / 100;
    expect(linkLine(container).style.fontSize).toBe(`${expected}pt`);
    // Never a raw binary-float tail (5.5249999999999995pt): the rounding is
    // the whole reason `linkFontPt` exists rather than inlining `* 0.85`.
    expect(linkLine(container).style.fontSize).not.toMatch(/\d{4,}/);
  });

  it("never shrinks the title or the event name, only the link", () => {
    const { container } = render(
      <PrintStock
        stockId="cards"
        eventName="Maya's Wedding"
        joinUrl="https://partyreel.com/e/abc123"
        readableUrl={urlOfLength(WRAP_RISK_CHARS + 1)}
      />,
    );
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs[0].style.fontSize).toBe(
      `${PRINT_STOCK.cards.type.title}pt`,
    );
    expect(paragraphs[1].style.fontSize).toBe(
      `${PRINT_STOCK.cards.type.name}pt`,
    );
  });
});
