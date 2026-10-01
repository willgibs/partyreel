import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE ROOT 404 DRAWS THROUGH ITS ONE BOUNDARY (perf-404). What the boundary owes a lost visitor is what the
 * inline 404 gave them: on the site, the header, the words standing in the trail's stage with the box the page
 * sized, and the footer; on the admin host, the portal's own screen and its one way out. Each arrives once its
 * chunk has loaded. (That nothing else of the 404 rides a page is `not-found.test.ts`'s.)
 */

const surfaceNow = vi.hoisted(() => ({
  value: undefined as "app" | "admin" | undefined,
}));
vi.mock("@/lib/surface", () => ({ surface: () => surfaceNow.value }));
vi.mock("next/navigation", () => ({ usePathname: () => "/perf-404-nope" }));

const { default: NotFound } = await import("./not-found");

beforeEach(() => {
  surfaceNow.value = undefined;
  // The trail's loop, the footer's seam glow and the Reveal ask for a visibility watcher, and the trail for
  // frames; jsdom has neither, and this pins the boundary, not the loop (`trail.test.tsx` is the loop's).
  // Left stubbed after the test: the setup's cleanup flushes the layers' effects once the test is over.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
    },
  );
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

describe("the root 404", () => {
  it("draws the site's screen on the app surface: the chrome, and the words in the trail's stage", async () => {
    surfaceNow.value = "app";
    const { container } = render(<NotFound />);
    // The file's first lazy chunk (the whole site chrome) loads here: alone it takes about half a second, but in a
    // full parallel run on a busy machine it took just over findBy's default second, and failed every lane's gate.
    const title = await screen.findByRole(
      "heading",
      { level: 1, name: "We lost this page" },
      { timeout: 4000 },
    );
    const stage = container.querySelector(".trl-stage");
    expect(stage).not.toBeNull();
    expect(stage).toHaveClass(
      "flex",
      "flex-1",
      "flex-col",
      "items-center",
      "justify-center",
    );
    expect(stage?.contains(title)).toBe(true);
    expect(stage?.closest("main")).not.toBeNull();
    // Its own chrome, because an unmatched URL has no group layout to borrow one from.
    expect(
      within(screen.getByRole("banner")).getByRole("link", {
        name: "Partyreel home",
      }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    // The paper surface, forced light without marketing.css.
    expect(container.querySelector(".surface-paper")).not.toBeNull();
    expect(screen.getByRole("link", { name: "Back home" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("draws the same with the surface unset (local dev, and any deployment before the split)", async () => {
    render(<NotFound />);
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "We lost this page",
      }),
    ).toBeInTheDocument();
  });

  it("draws the portal's own screen on the admin host, and nothing of the site's", async () => {
    surfaceNow.value = "admin";
    const { container } = render(<NotFound />);
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "This page isn't part of the operations portal",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to overview" }),
    ).toHaveAttribute("href", "/admin");
    expect(container.querySelector(".trl-stage")).toBeNull();
    expect(screen.queryByRole("contentinfo")).toBeNull();
    expect(screen.queryByText("We lost this page")).toBeNull();
  });
});
