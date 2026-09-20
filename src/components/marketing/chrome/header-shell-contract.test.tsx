// @contract-for: src/components/marketing/chrome/header-shell.tsx
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { act, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

import { HeaderShell } from "./header-shell";

/**
 * THE BAR THAT GETS OUT OF THE WAY (`on-scroll=hide`, Will 2026-09-19: "Hides
 * going down, returns coming up"). Function, never look: nothing here asserts
 * a curve, a clock or a colour, and the numbers it does assert are the ones
 * that decide WHETHER the bar is there, which is the thing he ruled.
 *
 * Split in two on purpose. The state machine is a render assertion, because
 * jsdom can dispatch a scroll. The three ESCAPES are source pins, because they
 * are a CSS selector (`:focus-within`, an open nav panel, an open phone sheet)
 * and jsdom has no cascade to evaluate one with: they would fail silently and
 * invisibly, which is exactly the case footer-contract.test.ts exists for.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const shell = read("src/components/marketing/chrome/header-shell.tsx");
// The WHY comments legitimately name the traps they warn about (`translate`
// vs `transform`), so a pin must never pass or fail on prose: the
// footer-contract.test.ts house pattern.
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const shellCode = stripComments(shell);

/** The header observes a sentinel (the glass crossfade) and the store waits a
 *  frame before measuring. Both stand in here; the sentinel reports visible,
 *  which is the transparent-over-hero posture. */
let frames: FrameRequestCallback[] = [];
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
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

beforeEach(() => {
  frames = [];
  setScrollY(0);
});

function setScrollY(y: number) {
  Object.defineProperty(window, "scrollY", {
    value: y,
    writable: true,
    configurable: true,
  });
}

/** Move the reader, then let the frame the store was waiting for arrive. */
function scrollTo(y: number) {
  setScrollY(y);
  act(() => {
    window.dispatchEvent(new Event("scroll"));
    const queued = frames;
    frames = [];
    for (const frame of queued) frame(0);
  });
}

const bar = () => screen.getByRole("banner");
const gone = () => bar().getAttribute("data-hidden") === "true";

describe("the header's hide-on-scroll", () => {
  it("starts visible and stays visible inside the reveal zone", () => {
    render(
      <HeaderShell overlay>
        <div>bar</div>
      </HeaderShell>,
    );
    expect(gone()).toBe(false);
    // One header height down is still the head of the page.
    scrollTo(64);
    expect(gone()).toBe(false);
    // ...and eight more is a drift, not a decision.
    scrollTo(72);
    expect(gone()).toBe(false);
  });

  it("leaves once the reader commits to scrolling away", () => {
    render(
      <HeaderShell overlay>
        <div>bar</div>
      </HeaderShell>,
    );
    scrollTo(400);
    expect(gone()).toBe(true);
  });

  it("comes back on ANY upward movement, with no threshold to clear", () => {
    render(
      <HeaderShell overlay>
        <div>bar</div>
      </HeaderShell>,
    );
    scrollTo(800);
    expect(gone()).toBe(true);
    scrollTo(799);
    expect(gone()).toBe(false);
  });

  it("comes back at the top of the page without a gesture", () => {
    render(
      <HeaderShell overlay>
        <div>bar</div>
      </HeaderShell>,
    );
    scrollTo(800);
    expect(gone()).toBe(true);
    scrollTo(0);
    expect(gone()).toBe(false);
  });

  it("hides the SOLID posture on the same signal, not a second rule", () => {
    // Paper routes and the root 404 render the always-glass bar. Will ruled
    // one behaviour for the chrome, so the two postures must not drift.
    render(
      <HeaderShell>
        <div>bar</div>
      </HeaderShell>,
    );
    scrollTo(400);
    expect(gone()).toBe(true);
    scrollTo(0);
    expect(gone()).toBe(false);
  });

  it("stays reachable while it is out of the way", () => {
    // A transform, never `hidden` / `display:none` / `aria-hidden`: a keyboard
    // reader must be able to tab into the bar, which is what brings it back.
    render(
      <HeaderShell overlay>
        <button type="button">home</button>
      </HeaderShell>,
    );
    scrollTo(400);
    expect(bar()).not.toHaveAttribute("aria-hidden");
    expect(screen.getByRole("button", { name: "home" })).toBeInTheDocument();
  });
});

describe("the escapes and the height knob (source pins: no cascade in jsdom)", () => {
  const hideRule = shellCode.match(
    /\[&\[data-hidden\][^"]*\]:-translate-y-full/,
  )?.[0];

  it("never hides while something inside it is focused", () => {
    expect(hideRule).toBeTruthy();
    expect(hideRule).toContain(":not(:focus-within)");
  });

  it("never hides with a nav panel or the phone sheet open", () => {
    expect(hideRule).toContain(
      ":not(:has([data-slot=navigation-menu-trigger][data-state=open]))",
    );
    expect(hideRule).toContain(
      ":not(:has([data-slot=sheet-trigger][data-state=open]))",
    );
  });

  it("honours reduced motion, keeping the function and dropping the slide", () => {
    expect(shellCode).toContain("motion-reduce:transition-none");
  });

  it("animates the property the translate utility actually sets", () => {
    // Tailwind v4 landmine: `-translate-y-full` writes the STANDALONE
    // `translate` property, so `transition-transform` would animate nothing
    // and the bar would teleport.
    expect(shellCode).toContain("transition-[translate]");
    expect(shellCode).not.toContain("transition-transform");
  });

  it("moves the bar by transform alone: the height knob is untouched", () => {
    // ~14 consumers derive from --mkt-header-h (every anchor's scroll-mt, the
    // sticky reading rails, the negative-pull heroes, the sheet's mirrored
    // row). A bar that changed its height would move all of them mid-page.
    expect(read("src/app/(marketing)/marketing.css")).toMatch(
      /--mkt-header-h:\s*4rem;/,
    );
    // The same 4rem, as the reveal zone the store measures in pixels.
    expect(read("src/lib/shared/use-scroll-direction.ts")).toMatch(
      /REVEAL_ZONE_PX\s*=\s*64/,
    );
    // The sticky box itself is unchanged.
    expect(shellCode).toContain("sticky top-0 isolate z-40");
  });
});
