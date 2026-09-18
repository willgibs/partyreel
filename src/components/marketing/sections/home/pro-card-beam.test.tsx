// @contract-for: src/components/marketing/sections/home/pro-card-beam.tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ProCardBeam,
  cornerOf,
} from "@/components/marketing/sections/home/pro-card-beam";

/**
 * THE BEAM'S RING IS THE CARD'S OWN CORNER (Will, 2026-09-17: "We need to
 * always ensure that the beam border and card border have matching radii").
 *
 * The vendored library reads the child's radius but refuses a zero and falls
 * back to its own 16px, silently, which is how a square card wore a round ring
 * on the light board. The wrapper measures the card and passes the number, so
 * these pin the function: whatever the card's corner is, the ring's is the
 * same, and an unreadable corner is square rather than somebody's default.
 */
describe("ProCardBeam", () => {
  /** The radius the library drew its ring at, read from the sheet it wrote. */
  const ringOf = (container: HTMLElement): string | undefined => {
    const css = container.querySelector("style")?.textContent ?? "";
    return /border-radius:\s*([\d.]+)px/.exec(css)?.[1];
  };

  it("draws the ring at the card's corner", () => {
    const { container } = render(
      <ProCardBeam>
        <div style={{ borderTopLeftRadius: 12 }}>Pro</div>
      </ProCardBeam>,
    );
    expect(ringOf(container)).toBe("12");
  });

  it("gives a square card a square ring, never the library's default", () => {
    const { container } = render(
      <ProCardBeam>
        <div style={{ borderTopLeftRadius: 0 }}>Pro</div>
      </ProCardBeam>,
    );
    expect(ringOf(container)).toBe("0");
  });

  it("reads an unreadable corner as square", () => {
    const card = document.createElement("div");
    card.style.setProperty("border-top-left-radius", "var(--no-such-token)");
    document.body.append(card);
    expect(cornerOf(card)).toBe(0);
    card.remove();
  });
});
