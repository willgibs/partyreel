import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Logo } from "@/components/shared/logo";
import { WORDMARK_DISPLAY, WORDMARK_SMALL } from "@/lib/brand/wordmark";

/**
 * THE BRAND'S CONTRACT (the v1 wordmark, 2026-09-17, finished at brand-marks
 * r1; the Ring, brand-marks r1's icon).
 *
 * What is pinned is what breaks silently: a wordmark that stops naming itself
 * to a screen reader, a fill of its own (invisible the day it sits on the wrong
 * ground), a renderer drawing his letters as drawn rather than a cut, a second
 * copy of the drawing drifting from the first, and the icon creeping in beside
 * the word. Nothing about the size or the look is asserted: those are Will's to
 * move.
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

  it("draws the bars' cut by default and the display cut when asked, each in its own box", () => {
    // ★ Never his path as drawn: at a bar's 22px three of his pairs blot
    // (the small cut parts them), and from 48px up they part a hair.
    render(
      <>
        <Logo />
        <Logo cut="display" className="h-12" />
      </>,
    );
    const [small, display] = screen.getAllByRole("img", { name: "Partyreel" });
    expect(small).toHaveAttribute("viewBox", WORDMARK_SMALL.viewBox);
    expect(small.querySelector("path")).toHaveAttribute("d", WORDMARK_SMALL.d);
    expect(display).toHaveAttribute("viewBox", WORDMARK_DISPLAY.viewBox);
    expect(display.querySelector("path")).toHaveAttribute(
      "d",
      WORDMARK_DISPLAY.d,
    );
  });

  it("keeps the drawing in one home", () => {
    // A renderer that pastes its own copy of the path is how the social card
    // and the nav end up wearing two different wordmarks after the next export.
    for (const file of [
      "src/components/shared/logo.tsx",
      "src/app/opengraph-image.tsx",
      "src/app/(guest)/e/[token]/card/route.tsx",
    ]) {
      const src = readFileSync(join(process.cwd(), file), "utf8");
      expect(src, `${file} does not read the wordmark's home`).toContain(
        'from "@/lib/brand/wordmark"',
      );
      expect(src, `${file} draws his letters as drawn, not a cut`).not.toMatch(
        /\bWORDMARK_PATH\b/,
      );
      expect(src, `${file} carries path data of its own`).not.toMatch(
        /\sd="M[\d.]/,
      );
    }
  });

  it("draws the Ring alone when asked for the mark, never beside the wordmark", () => {
    const { container } = render(<Logo markOnly size={28} />);
    const ring = screen.getByRole("img", { name: "Partyreel" });
    expect(container.children).toHaveLength(1);
    expect(ring).toHaveAttribute("viewBox", "0 0 1024 1024");
    expect(ring).toHaveAttribute("width", "28");
    // Its cut is its size's: a 28px Ring is the favicon's.
    expect(ring).toHaveAttribute("data-cut", "favicon");
    // The icon's drawing, never the word's.
    for (const path of ring.querySelectorAll("path"))
      expect(path.getAttribute("d")).not.toBe(WORDMARK_SMALL.d);
    expect(ring.querySelector("circle")).not.toBeNull();
  });

  it("gives every Ring on a page its own ids, since an SVG id is the document's", () => {
    const { container } = render(
      <>
        <Logo markOnly />
        <Logo markOnly size={60} />
      </>,
    );
    const ids = [...container.querySelectorAll("[id]")].map((e) => e.id);
    expect(ids.length).toBeGreaterThan(4);
    expect(new Set(ids).size).toBe(ids.length);
    for (const svg of container.querySelectorAll("svg"))
      for (const ref of svg.innerHTML.matchAll(/url\(#([^)]+)\)/g))
        expect(svg.querySelector(`[id="${ref[1]}"]`), ref[1]).not.toBeNull();
  });
});
