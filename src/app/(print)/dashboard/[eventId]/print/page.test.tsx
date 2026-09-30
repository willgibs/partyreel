import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE PRINT SHEET FOR AN EVENT THAT IS GONE, OR NEVER THIS HOST'S, DRAWS ITS OWN 404 (crumbs-30, from crumbs-28). It
 * threw `notFound()`, and the print group has no nearer boundary, so the answer was the root's: Next's error shell,
 * an empty body until the script ran, under the sheet's own title. The sheet is one of the event's pages (its URL sits
 * under the event's, its one door is the hub's), so it answers as the hub, Review, Guests and the reel's old room do
 * (`event-not-found.test.tsx`): the host app's not-found drawn in its HTML, headed by the not-found's own metadata
 * (`not-found.metadata.ts`), a soft 404 behind sign-in.
 *
 * `getEvent` is the one read that decides it (RLS-scoped, deleted filtered): nothing the found sheet reads is asked.
 */
const found = vi.hoisted(() => ({
  event: null as Record<string, unknown> | null,
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/queries/events", () => ({
  getEvent: async () => found.event,
}));
const later = vi.hoisted(() => vi.fn());
vi.mock("@/lib/site-url", () => ({ getSiteUrl: later }));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));
// A found sheet's two client parts: neither is what is pinned here.
const part = vi.hoisted(() => () => null);
vi.mock("@/components/app/print/print-button", () => ({ PrintButton: part }));
vi.mock("@/components/app/print/print-stock", () => ({ PrintStock: part }));

const page = await import("./page");
const { appNotFoundMetadata } = await import("@/app/(app)/not-found.metadata");

const params = Promise.resolve({
  eventId: "00000000-0000-4000-8000-000000000000",
});
const searchParams = Promise.resolve({});

beforeEach(() => {
  found.event = null;
  later.mockClear();
});

describe("the print sheet, for an event that is gone or not this host's", () => {
  it("★ draws the host app's own not-found in its HTML, never throwing for Next's error shell", async () => {
    const drawn = await page.default({ params, searchParams });
    render(<>{drawn}</>);
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "We couldn't find that event",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
    // It stands in the app's gutter, as a landmark, with nothing of the sheet around it.
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.queryByText("Get the code out there")).toBeNull();
    // Nothing past the one read that decided it.
    expect(later).not.toHaveBeenCalled();
  });

  it('★ is titled as the 404 it is, "Event not found", noindex, from the not-found\'s own metadata', async () => {
    const metadata = await page.generateMetadata({ params, searchParams });
    expect(metadata).toBe(appNotFoundMetadata);
    expect(metadata.title).toBe("Event not found");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("a sheet whose event stands keeps its own title", async () => {
    found.event = { id: "e1", name: "Maya's 30th" };
    await expect(
      page.generateMetadata({ params, searchParams }),
    ).resolves.toEqual({ title: "Print" });
  });
});
