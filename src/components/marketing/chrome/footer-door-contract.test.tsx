import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

const demo = vi.hoisted(() => ({ url: undefined as string | undefined }));
vi.mock("@/lib/demo", () => ({
  get DEMO_QR_TOKEN() {
    return demo.url ? "demo-token" : undefined;
  },
  get DEMO_EVENT_URL() {
    return demo.url;
  },
  isDemoToken: () => false,
}));

import { MarketingFooter } from "./marketing-footer";

/**
 * THE FOOT'S DOOR (`foot-door=always`, Will 2026-09-19: "Start free always,
 * the demo when it is set"; his note, "we should always have a demo event set
 * and ready", is a launch line, not a guard that exists).
 *
 * This is the BEHAVIOURAL half of the footer's contract; the source-text half
 * (the slab's token set, the server-rendered QR, the glow's pause wiring)
 * lives in footer-contract.test.ts, which runs in the node project and cannot
 * render. What fails here fails LOUDLY on a page nobody develops on: the four
 * paper routes and the 404 carry no CtaBand, so with the demo token unset the
 * footer WAS the last thing on those pages and it had nothing to do on it.
 *
 * Function, never look: the action's size, border and breakpoints are Will's
 * to retune. That there IS one, in both states, is not.
 */

beforeAll(() => {
  // The slab's seam glow and the invitation's Reveal both observe themselves
  // into view; jsdom has no IntersectionObserver and the shared setup
  // deliberately polyfills only what its own pins need.
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

const startFree = () => screen.queryAllByRole("link", { name: "Start free" });
const demoDoor = () =>
  screen.queryAllByRole("link", { name: "Explore a demo event" });

describe("the footer's action, and what it does not depend on", () => {
  it("offers Start free with a demo event configured", () => {
    demo.url = "https://partyreel.com/e/abc123";
    render(<MarketingFooter />);
    expect(startFree()).toHaveLength(1);
    expect(demoDoor()).toHaveLength(1);
  });

  it("offers Start free with NO demo event configured", () => {
    // The whole point of the ruling: an env var that happens to be unset must
    // never take the site's only footer action down with it.
    demo.url = undefined;
    render(<MarketingFooter />);
    expect(startFree()).toHaveLength(1);
  });

  it("stands the invitation down with the demo, and only the invitation", () => {
    // Never a dead CTA: with no demo event the code would encode the marketing
    // site the visitor is already on.
    demo.url = undefined;
    render(<MarketingFooter />);
    expect(demoDoor()).toHaveLength(0);
    expect(screen.queryByText(/Explore a demo event\./)).toBeNull();
  });

  it("keeps the index and the legal bar in both states", () => {
    // The action moving out of the demo branch must not have moved anything
    // else: the footer is still a sign-off, a sitemap and a close.
    demo.url = undefined;
    const { unmount } = render(<MarketingFooter />);
    expect(screen.getByRole("link", { name: "Privacy" })).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Features" }),
    ).toBeInTheDocument();
    unmount();
    demo.url = "https://partyreel.com/e/abc123";
    render(<MarketingFooter />);
    expect(screen.getByRole("link", { name: "Privacy" })).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Features" }),
    ).toBeInTheDocument();
  });
});
