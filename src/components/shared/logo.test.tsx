// @contract-for: src/components/shared/logo.tsx
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Logo } from "@/components/shared/logo";
import { WORDMARK_PATH, WORDMARK_VIEWBOX } from "@/lib/brand/wordmark";

/**
 * THE BRAND'S CONTRACT (the v1 wordmark, 2026-09-17).
 *
 * What is pinned is what breaks silently: a wordmark that stops naming itself
 * to a screen reader, a fill of its own (invisible the day it sits on the wrong
 * ground), a second copy of the drawing drifting from the first, and the
 * placeholder mark creeping back beside it. Nothing about its size or its look
 * is asserted: those are Will's to move.
 */
describe("Logo", () => {
  it("is the wordmark alone, and names itself", () => {
    const { container } = render(<Logo />);
    const mark = screen.getByRole("img", { name: "Partyreel" });
    expect(mark.tagName.toLowerCase()).toBe("svg");
    // Alone: one drawing, no tile and no type set beside it.
    expect(container.children).toHaveLength(1);
    expect(container.textContent).toBe("");
  });

  it("takes the ground's colour rather than carrying a fill of its own", () => {
    render(<Logo />);
    const mark = screen.getByRole("img", { name: "Partyreel" });
    expect(mark).toHaveAttribute("fill", "currentColor");
    for (const path of mark.querySelectorAll("path")) {
      expect(path.hasAttribute("fill")).toBe(false);
    }
  });

  it("draws the one path, in its own box", () => {
    render(<Logo />);
    const mark = screen.getByRole("img", { name: "Partyreel" });
    expect(mark).toHaveAttribute("viewBox", WORDMARK_VIEWBOX);
    expect(mark.querySelector("path")).toHaveAttribute("d", WORDMARK_PATH);
  });

  it("keeps the drawing in one home", () => {
    // A renderer that pastes its own copy of the path is how the social card
    // and the nav end up wearing two different wordmarks after the next export.
    const logo = readFileSync(
      join(process.cwd(), "src/components/shared/logo.tsx"),
      "utf8",
    );
    const card = readFileSync(
      join(process.cwd(), "src/app/opengraph-image.tsx"),
      "utf8",
    );
    for (const [name, src] of [
      ["logo.tsx", logo],
      ["opengraph-image.tsx", card],
    ] as const) {
      expect(src, `${name} does not read the shared path`).toContain(
        "WORDMARK_PATH",
      );
      expect(src, `${name} carries path data of its own`).not.toMatch(
        /\sd="M[\d.]/,
      );
    }
  });

  it("offers the stand-in mark only when asked, and never beside the wordmark", () => {
    const { container } = render(<Logo markOnly />);
    expect(screen.queryByRole("img", { name: "Partyreel" })).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
