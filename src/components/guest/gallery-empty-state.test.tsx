// @contract-for: src/components/guest/gallery-empty-state.tsx
// @contract-for: src/components/shared/river/river.tsx

import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setReducedMotion } from "../../../vitest.setup";
import { GalleryEmptyState } from "@/components/guest/gallery-empty-state";

/**
 * THE EMPTY GUEST ALBUM, and the river inside it.
 *
 * What this guards is the pair of rules the picture may never break, which
 * survived the picture changing from a 3 by 3 mosaic to the flow (Will,
 * `guest-photos=ghost`, 2026-09-18):
 *
 *  1  it is PURE ATMOSPHERE. A screen reader hears an empty album and a
 *     promise, never nine photographs from other people's events; a keyboard
 *     walks straight past it; and nothing in it is a door out of the host's
 *     album (bible 4: a guest surface belongs to the host's event, so no demo
 *     code and no link home, whatever the lab's version of the visual offers);
 *  2  it COSTS NOTHING when nobody is looking, and it still SAYS something when
 *     nothing can move: the settled flow is in the server's own HTML, so
 *     reduced motion, scripting off and a crawler all get a picture rather than
 *     an empty box.
 *
 * Function, never look: no class name, no copy, no duration and no alpha is
 * pinned here. Retune the fade, the pace, the pack or the layout freely.
 */

/**
 * jsdom has no IntersectionObserver and the river arms its pause through one,
 * so the loop can only be observed with a controllable stand-in: nothing runs
 * until the flow is on screen, which is half of what this file checks.
 */
class TestObserver {
  static instances: TestObserver[] = [];
  cb: IntersectionObserverCallback;
  el: Element | null = null;
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    TestObserver.instances.push(this);
  }
  observe = (el: Element) => {
    this.el = el;
  };
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  /** Scroll it into view, the way a guest would. */
  enter() {
    act(() => {
      this.cb(
        [
          {
            isIntersecting: true,
            target: this.el,
          } as IntersectionObserverEntry,
        ],
        this as unknown as IntersectionObserver,
      );
    });
  }
}

const raf = vi.spyOn(window, "requestAnimationFrame");

beforeEach(() => {
  TestObserver.instances = [];
  raf.mockClear();
  vi.stubGlobal("IntersectionObserver", TestObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The one observer the river arms; it is the only consumer in this tree. */
const observer = () => TestObserver.instances.at(-1)!;

describe("the empty album is decoration plus a promise, and nothing else", () => {
  it("hides every photograph from assistive tech", () => {
    const { container } = render(<GalleryEmptyState />);
    const hidden = container.querySelector("[aria-hidden]");
    expect(hidden).not.toBeNull();
    const images = [...container.querySelectorAll("img")];
    expect(images.length).toBeGreaterThan(0);
    for (const img of images) {
      expect(img).toHaveAttribute("alt", "");
      // Inside the hidden subtree, not beside it.
      expect(hidden!.contains(img)).toBe(true);
    }
    // The promise itself is NOT hidden: it is the only thing to hear. Asserted
    // as a STRUCTURE, never as bytes (2026-09-19): this line used to pin the
    // copy verbatim, so Will's ruled rewrite of the empty state (`empty=starts`)
    // turned a contract about assistive tech into a copy diff. What the contract
    // owes is that some readable text exists outside the aria-hidden subtree.
    const promise = [...container.querySelectorAll("p")].filter(
      (el) => !hidden!.contains(el) && (el.textContent ?? "").trim().length > 0,
    );
    expect(promise.length).toBeGreaterThan(0);
  });

  it("is not a door out of the host's album: no link and no code in it", () => {
    const { container } = render(<GalleryEmptyState />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(container.querySelectorAll("a")).toHaveLength(0);
    // A QR is drawn as an svg; the lab's river can carry one, this may not.
    expect(container.querySelectorAll("svg")).toHaveLength(0);
  });

  it("leaves nothing in the decoration for a keyboard to land on", () => {
    const { container } = render(<GalleryEmptyState />);
    const decoration = container.querySelector("[aria-hidden]")!;
    expect(
      decoration.querySelectorAll(
        "a, button, input, select, textarea, [tabindex], [contenteditable]",
      ),
    ).toHaveLength(0);
    for (const img of decoration.querySelectorAll("img")) {
      expect(img).toHaveAttribute("draggable", "false");
    }
  });

  it("shows the CTA only to a viewer who can upload", () => {
    const onAddFirst = vi.fn();
    const { rerender } = render(<GalleryEmptyState />);
    expect(screen.queryByRole("button")).toBeNull();
    rerender(<GalleryEmptyState onAddFirst={onAddFirst} />);
    const cta = screen.getByRole("button");
    act(() => cta.click());
    expect(onAddFirst).toHaveBeenCalledOnce();
  });

  it("takes its photographs from the guest pack, one card each", () => {
    const { container } = render(<GalleryEmptyState />);
    const srcs = [...container.querySelectorAll("img")].map((i) =>
      i.getAttribute("src"),
    );
    for (const src of srcs) expect(src).toMatch(/^\/guest-ghost\//);
    // No photograph is ever doubled in view.
    expect(new Set(srcs).size).toBe(srcs.length);
  });
});

describe("the flow costs nothing when nobody is looking", () => {
  it("runs no frame loop until it is on screen", () => {
    render(<GalleryEmptyState />);
    expect(raf).not.toHaveBeenCalled();
    observer().enter();
    expect(raf).toHaveBeenCalled();
  });

  it("stands still for a reader who asked for less motion, even on screen", () => {
    setReducedMotion(true);
    const { container } = render(<GalleryEmptyState />);
    observer().enter();
    expect(raf).not.toHaveBeenCalled();
    // And nothing inline was written over the settled state the sheet paints.
    for (const card of container.querySelectorAll("[style*='--rvr-rest']")) {
      expect(card.getAttribute("style")).not.toMatch(/(^|;)\s*transform:/);
      expect(card.getAttribute("style")).not.toMatch(/(^|;)\s*opacity:/);
    }
  });

  it("paints the settled flow in the server's own HTML", () => {
    // ★ The rest state lives in custom properties written during RENDER, so a
    // reader with scripting off, a reader who asked for less motion and a
    // crawler all get the flow standing at its steady spacing rather than an
    // empty box. An effect cannot do this: it runs after the first paint.
    const { container } = render(<GalleryEmptyState />);
    const cards = [...container.querySelectorAll("[style*='--rvr-rest']")];
    expect(cards.length).toBe(container.querySelectorAll("img").length);
    for (const card of cards) {
      const style = card.getAttribute("style")!;
      expect(style).toMatch(/--rvr-rest:\s*[^;]+/);
      expect(style).toMatch(/--rvr-rest-o:\s*[\d.]+/);
      expect(style).not.toMatch(/NaN|undefined/);
    }
    // The one reader the CSS split cannot reach (motion allowed, scripting
    // off) is closed with a <noscript> companion; it is the whole reason the
    // flow is not blank with JavaScript disabled.
    expect(container.querySelector("noscript")?.innerHTML).toContain(
      "--rvr-rest",
    );
  });
});
