import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * EACH GROUP'S 404 DRAWS THROUGH ITS ONE BOUNDARY, WHOLE (crumbs-25; the root's is `not-found.lazy.test.tsx`).
 *
 * A group's `not-found.tsx` is rendered into every page under it, so it draws nothing itself: it renders one
 * reference into the one boundary (`app/not-found.lazy.tsx`), and the screen arrives with its chunk. What the boundary
 * owes a lost visitor is what the inline 404 gave them, so each screen is read here for what it says and where
 * it sends them, in the box the layout around it expects. (That nothing else of a 404 rides a page is
 * `not-found.test.ts`'s.)
 *
 * The first assertion of each is the reference alone: the moment after `render` the 404 is not in the tree,
 * where an inline one already was.
 */

const demo = vi.hoisted(() => ({ url: "/e/the-demo" as string | null }));
// A getter, so the screen reads the value of the render it is in (the real one is a build-time constant).
vi.mock("@/lib/demo", () => ({
  get DEMO_EVENT_URL() {
    return demo.url;
  },
}));

beforeEach(() => {
  demo.url = "/e/the-demo";
});

describe("the guest link's 404", () => {
  it("is a reference until its chunk lands, then the whole screen under the session-less bar", async () => {
    const { default: GuestNotFound, metadata } =
      await import("./(guest)/e/[token]/not-found");
    expect(metadata).toMatchObject({
      title: "Event not found",
      robots: { index: false, follow: false },
    });
    render(<GuestNotFound />);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "This event link didn't work",
      }),
    ).toBeInTheDocument();
    // The failure bar: the wordmark home and nothing else (no session, no menu).
    const bar = screen.getByRole("banner");
    expect(within(bar).getAllByRole("link")).toHaveLength(1);
    expect(
      within(bar).getByRole("link", { name: "Partyreel home" }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByText("Event link")).toBeInTheDocument();
    expect(
      screen.getByText(/mistyped, or the host may have deleted/),
    ).toBeInTheDocument();
    // It never says an event "ended": there is no end date (constants/tiers.ts).
    expect(screen.queryByText(/ended/i)).toBeNull();
    expect(
      screen.getByRole("link", { name: "What is Partyreel?" }),
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("link", { name: "Visit the help center" }),
    ).toHaveAttribute("href", "/help");
    expect(
      screen.getByRole("link", { name: "See how it works with a live demo" }),
    ).toHaveAttribute("href", "/e/the-demo");
  });

  it("stands the demo's line down to a plain one when no demo is configured", async () => {
    demo.url = null;
    const { default: GuestNotFound } =
      await import("./(guest)/e/[token]/not-found");
    render(<GuestNotFound />);
    expect(
      await screen.findByText(/Hosting your own\? It is free to start/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /live demo/ })).toBeNull();
  });
});

describe("the guest profile's 404", () => {
  it("is a reference until its chunk lands, then the screen that says nothing about why", async () => {
    const { default: ProfileNotFound, metadata } =
      await import("./(guest)/u/[slug]/not-found");
    expect(metadata).toMatchObject({
      title: "Profile not found",
      robots: { index: false, follow: false },
    });
    render(<ProfileNotFound />);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "There's nobody at this address",
      }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("banner")).getByRole("link", {
        name: "Partyreel home",
      }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "What is Partyreel?" }),
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("link", { name: "Visit the help center" }),
    ).toHaveAttribute("href", "/help");
  });
});

describe("the cinema group's 404", () => {
  it("is a reference until its chunk lands, then the centred words and no chrome of its own", async () => {
    const { default: CinemaNotFound, metadata } =
      await import("./(marketing)/(cinema)/not-found");
    expect(metadata).toMatchObject({
      title: "Page not found",
      robots: { index: false, follow: false },
    });
    const { container } = render(<CinemaNotFound />);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();

    const title = await screen.findByRole("heading", {
      level: 1,
      name: "We lost this page",
    });
    // The cinema layout draws the header and footer around it; a second set here would double-stack.
    expect(screen.queryByRole("banner")).toBeNull();
    expect(screen.queryByRole("contentinfo")).toBeNull();
    // The box the layout's grown <main> expects: min-h, never flex-1.
    const box = container.firstElementChild as HTMLElement;
    expect(box).toContainElement(title);
    expect(box).toHaveClass(
      "flex",
      "min-h-[60vh]",
      "flex-col",
      "items-center",
      "justify-center",
      "px-6",
      "py-24",
    );
    expect(box).not.toHaveClass("flex-1");
    expect(screen.getByRole("link", { name: "Back home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("link", { name: "Visit the help center" }),
    ).toHaveAttribute("href", "/help");
    expect(screen.getByRole("link", { name: "contact us" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });
});

describe("the host app's 404", () => {
  it("is a reference until its chunk lands, then the block that sits inside the shell's own container", async () => {
    const { default: AppNotFound, metadata } =
      await import("./(app)/not-found");
    expect(metadata).toMatchObject({ title: "Event not found" });
    const { container } = render(<AppNotFound />);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();

    const title = await screen.findByRole("heading", {
      level: 1,
      name: "We couldn't find that event",
    });
    // AppShell already wraps children in <main><Container>: no chrome and no container of its own here.
    expect(screen.queryByRole("banner")).toBeNull();
    expect(screen.queryByRole("main")).toBeNull();
    const box = container.firstElementChild as HTMLElement;
    expect(box).toContainElement(title);
    expect(box).toHaveClass(
      "flex",
      "min-h-[60vh]",
      "flex-col",
      "items-center",
      "justify-center",
    );
    expect(
      screen.getByRole("link", { name: "Back to dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      screen.getByRole("link", { name: "Create an event" }),
    ).toHaveAttribute("href", "/dashboard/new");
    expect(
      screen.getByRole("link", { name: "Visit the help center" }),
    ).toHaveAttribute("href", "/help");
  });
});

describe("the operations portal's 404", () => {
  it("is a reference until its chunk lands, then the block inside AdminShell, its help line unlinked", async () => {
    const { default: AdminNotFound, metadata } =
      await import("./admin/not-found");
    expect(metadata).toMatchObject({
      title: "Page not found",
      robots: { index: false, follow: false },
    });
    const { container } = render(<AdminNotFound />);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();

    const title = await screen.findByRole("heading", {
      level: 1,
      name: "We couldn't find that page",
    });
    expect(screen.queryByRole("banner")).toBeNull();
    const box = container.firstElementChild as HTMLElement;
    expect(box).toContainElement(title);
    expect(box).toHaveClass("flex", "min-h-[60vh]", "flex-col");
    expect(
      screen.getByRole("link", { name: "Back to overview" }),
    ).toHaveAttribute("href", "/admin");
    // No runbook page exists to point at yet: the line is words, not a link.
    expect(screen.getByText(/Check the runbook/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /runbook/ })).toBeNull();
  });
});
