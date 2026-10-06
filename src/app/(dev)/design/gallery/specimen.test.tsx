import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Specimen } from "./specimen";

/**
 * A SPECIMEN'S HEAD NEVER WIDENS THE PAGE (crumbs-23, build 26's red-team: the Library's album-stream page
 * scrolled sideways at 1440, 2,019px wide with 579px of it sideways).
 *
 * A hint can run to a paragraph (the album stream's two are 1,089 and 1,607px on one line), and the head's
 * right-hand span was `shrink-0`, so it stood at its whole width and carried the split button out past
 * the specimen's clip; the button's `sr-only` label (absolutely positioned, so its containing block was
 * something ABOVE the specimen, where `overflow-hidden` does not reach) then sat at x = 1,998 and widened
 * the document. Two facts hold it, and jsdom has no layout to measure either, so the class contract is
 * pinned here and the page's own `scrollWidth` is read in a browser:
 *   1. every ancestor of the caption, up to the specimen, may shrink (`shrink-0` on none), and the caption
 *      itself truncates rather than wrapping past its box;
 *   2. the specimen is the containing block of its own `sr-only` labels (`relative` beside
 *      `overflow-hidden`), so a label can never sit outside the clip.
 */
const LONG_HINT =
  "1280, the narrowest window this composition serves, over the album that takes each photograph in (one LiveAlbum holds it for both). Decorative and inert: nothing in it is focusable, every frame carries its resting position as server HTML, and reduced motion leaves that resting frame standing with no loop at all";

function specimenOf(caption: HTMLElement): HTMLElement {
  const root = caption.closest<HTMLElement>(".group\\/specimen");
  if (!root) throw new Error("the caption is not inside a specimen");
  return root;
}

describe("Specimen's head", () => {
  it("★ ends a long caption in an ellipsis where the head runs out, its whole text on the title", () => {
    render(
      <Specimen label="The fall into it" hint={LONG_HINT} code="<Album />">
        <p>the specimen</p>
      </Specimen>,
    );
    const caption = screen.getByText(LONG_HINT);
    expect(caption).toHaveClass("truncate", "min-w-0");
    expect(caption).toHaveAttribute("title", LONG_HINT);
  });

  it("★ never makes a flex item of the head refuse to shrink around the caption", () => {
    render(
      <Specimen label="The fall into it" hint={LONG_HINT} code="<Album />">
        <p>the specimen</p>
      </Specimen>,
    );
    const caption = screen.getByText(LONG_HINT);
    // No ancestor between the caption and the specimen is a `shrink-0` flex item: that one span is
    // exactly what stood the caption at its whole 1,607px.
    const root = specimenOf(caption);
    for (
      let el: HTMLElement | null = caption.parentElement;
      el && el !== root;
      el = el.parentElement
    ) {
      expect(
        el,
        `<${el.tagName.toLowerCase()} class="${el.className}">`,
      ).not.toHaveClass("shrink-0");
    }
  });

  it("★ is the containing block of its own screen-reader labels, so its clip holds them", () => {
    const { container } = render(
      <Specimen label="The fall into it" hint={LONG_HINT} code="<Album />">
        <p>the specimen</p>
      </Specimen>,
    );
    const root = container.querySelector<HTMLElement>(".group\\/specimen")!;
    // Absolutely positioned labels are clipped by an `overflow-hidden` only when that element is their
    // containing block; without `relative` they sat where the header's line ended, outside the clip.
    expect(root).toHaveClass("relative", "overflow-hidden");
    // And there are such labels inside it: the split button's.
    expect(root.querySelector(".sr-only")).not.toBeNull();
  });
});

/**
 * A SPECIMEN THAT STICKS STICKS TO THE PAGE (crumbs-84; the hub's "Scrolled into the album" band never stuck).
 *
 * The frame clips with `overflow: hidden`, which makes it a scroll container that never scrolls, so a `position: sticky`
 * inside it has nothing to stick to and rides away with the page. A specimen that declares `sticks` is clipped with
 * `clip` instead (the same box, the same corners, no scroll container), and takes `min-w-0` with it, since a clip's
 * automatic minimum width is its content's where a scroll container's is 0, and a wide specimen would otherwise stretch
 * the frame past its column and the page with it (measured at 375: 396px wide). jsdom has no layout, so the contract
 * is pinned here and the band's own `top` is read in a browser.
 */
describe("Specimen's frame, where something in it sticks", () => {
  it("★ clips with `clip` only when its specimen sticks, and keeps `hidden` and `relative` beneath it", () => {
    const { container } = render(
      <>
        <Specimen label="Plain">
          <p>the plain specimen</p>
        </Specimen>
        <Specimen label="Sticks" sticks>
          <p>the sticky specimen</p>
        </Specimen>
      </>,
    );
    const [plain, sticks] = [
      ...container.querySelectorAll<HTMLElement>(".group\\/specimen"),
    ];
    expect(plain!.style.overflow).toBe("");
    expect(plain).not.toHaveClass("min-w-0");
    // `hidden` stays for a browser that does not know `clip`, and `relative` for the labels it must hold.
    expect(sticks).toHaveClass("relative", "overflow-hidden", "min-w-0");
    expect(sticks!.style.overflow).toBe("clip");
  });
});
