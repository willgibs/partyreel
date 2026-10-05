import { Component, type ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE ROOT LAYOUT'S CRASH LANDS ON `global-error`, NOT ON THE ROOT `error.tsx` (crumbs-78). The probe's whole claim
 * is structural: a toast whose element throws is drawn by the layout's own `<Toaster />`, beside `{children}`, so
 * the boundary around `{children}` (the root `error.tsx`) never sees it and only the outermost one (`global-error`)
 * does. That is pinned here with sonner's real Toaster and real React boundaries laid out as the root layout lays
 * them out; the production build in a browser is the other half (`/design/lab/tools/boom?boundary=global`).
 *
 * If sonner ever draws a toast's element outside its own tree (a portal into a second root, say), the first test
 * fails and says the probe no longer reaches `global-error`.
 */

// The component project stubs sonner everywhere; this file needs the real Toaster, whose tree is the point.
vi.unmock("sonner");

const { Toaster, toast } = await import("sonner");
const { RootLayoutCrash } = await import("./root-layout-crash");

/** A boundary that says it caught the crash: a segment's `error.tsx` and Next's outermost one, in a test's size. */
class Catches extends Component<
  { name: string; children: ReactNode },
  { crashed: boolean }
> {
  state = { crashed: false };
  static getDerivedStateFromError() {
    return { crashed: true };
  }
  render() {
    return this.state.crashed ? (
      <p>{this.props.name} caught it</p>
    ) : (
      this.props.children
    );
  }
}

/** The root layout as it nests them: the outermost boundary, the page inside `error.tsx`'s, the Toaster beside it. */
function RootLayout({ page }: { page: ReactNode }) {
  return (
    <Catches name="global-error">
      <div>
        <Catches name="error.tsx">{page}</Catches>
        <Toaster />
      </div>
    </Catches>
  );
}

function PageThatThrows(): never {
  throw new Error("a page's own crash");
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("the root layout's crash", () => {
  it("★ lands on the outermost boundary, and never on the root error.tsx", async () => {
    render(<RootLayout page={<RootLayoutCrash />} />);
    expect(await screen.findByText("global-error caught it")).toBeVisible();
    expect(screen.queryByText("error.tsx caught it")).toBeNull();
  });

  it("★ is the difference a page's own crash does not make: that one stops at the root error.tsx", async () => {
    render(<RootLayout page={<PageThatThrows />} />);
    expect(await screen.findByText("error.tsx caught it")).toBeVisible();
    expect(screen.queryByText("global-error caught it")).toBeNull();
  });
});

describe("when the toast is published", () => {
  it("★ a beat after mount, never in the effect itself: the Toaster comes after the page, so a toast sent in the same commit is dropped", () => {
    vi.useFakeTimers();
    const custom = vi.spyOn(toast, "custom").mockReturnValue(1);
    render(<RootLayoutCrash />);
    expect(custom).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(custom).toHaveBeenCalledTimes(1);
  });

  it("a page left before the beat never crashes the layout", () => {
    vi.useFakeTimers();
    const custom = vi.spyOn(toast, "custom").mockReturnValue(1);
    const { unmount } = render(<RootLayoutCrash />);
    unmount();
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(custom).not.toHaveBeenCalled();
  });
});
