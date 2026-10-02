import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PrefetchGuard } from "./prefetch-guard";

/**
 * THE SHELL MOUNTS THE GUARD, AND THE GUARD LEAVES WITH IT (lab-prefetch). What the guard refuses is pinned
 * in `prefetch-guard.test.ts`; this is the wiring on a real window: mounted, a keyless prefetch of the gate
 * never goes out, and unmounted (the reader leaves the lab for the site in the same tab) the window's fetch is
 * the one it was.
 */
const PREFETCH = { "next-router-prefetch": "1", rsc: "1" };

describe("PrefetchGuard", () => {
  const real = vi.fn(async () => new Response("real", { status: 200 }));
  let before: typeof fetch;

  beforeEach(() => {
    real.mockClear();
    before = window.fetch;
    window.fetch = real as unknown as typeof fetch;
  });

  afterEach(() => {
    window.fetch = before;
  });

  it("★ refuses a keyless prefetch of the gate while mounted, and gives the window's fetch back after", async () => {
    const { unmount } = render(<PrefetchGuard />);
    const gate = `${window.location.origin}/design/lab?_rsc=abc`;

    expect((await window.fetch(gate, { headers: PREFETCH })).status).toBe(404);
    expect(real).not.toHaveBeenCalled();

    unmount();
    expect(window.fetch).toBe(real);
    expect((await window.fetch(gate, { headers: PREFETCH })).status).toBe(200);
    expect(real).toHaveBeenCalledTimes(1);
  });

  it("draws nothing", () => {
    const { container } = render(<PrefetchGuard />);
    expect(container).toBeEmptyDOMElement();
  });
});
