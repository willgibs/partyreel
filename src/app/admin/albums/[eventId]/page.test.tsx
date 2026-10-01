import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE OPERATOR'S ALBUM DRILL-IN, A PAGE AT A TIME (crumbs-37). The page read the whole album and signed every
 * item, so past a few thousand items one look was thousands of links. It signs one page now, says which items
 * these are, and links the newest page and the next older one; the cursor in its URL reaches the read, and a
 * mangled one reads as the newest page. The portal cannot sign in on localhost, so this is the page's eye
 * short of the alias (the red-team's steps are in the lane's handoff).
 */
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/admin-context", () => ({
  requireAdmin: async () => ({ aal: "aal2" }),
}));
const getAlbumForModeration = vi.fn();
vi.mock("@/lib/db/queries/moderation", () => ({
  getAlbumForModeration: (...a: unknown[]) => getAlbumForModeration(...a),
}));
vi.mock("@/lib/db/queries/reports", () => ({
  readCoveredItems: async () => new Set<string>(),
}));
const toModerationFeedItems = vi.fn(async (items: { id: string }[]) =>
  items.map((m) => ({ ...m, url: `signed:${m.id}` })),
);
vi.mock("@/lib/r2/grid-items", () => ({
  toModerationFeedItems: (items: { id: string }[]) =>
    toModerationFeedItems(items),
}));
vi.mock("@/components/admin/moderation-grid", () => ({
  ModerationGrid: ({ items }: { items: unknown[] }) => (
    <div data-testid="grid" data-count={items.length} />
  ),
}));
vi.mock("next/link", () => ({
  default: ({
    href,
    prefetch,
    children,
    ...rest
  }: {
    href: string;
    prefetch?: boolean;
    children: React.ReactNode;
  }) => (
    <a href={href} data-prefetch={String(prefetch)} {...rest}>
      {children}
    </a>
  ),
}));

const page = await import("./page");

const EVENT = "736ead6a-5b1c-4d2e-9f30-4a5b6c7d8e9f";
const AT = "2026-09-23T12:00:00.123456+00:00";
const NEXT_ID = "0a1b2c3d-4e5f-4061-8273-8495a6b7c8d9";

function detail(
  shown: number,
  over: { position?: number; next?: { at: string; id: string } | null } = {},
) {
  return {
    event: {
      id: EVENT,
      host_id: "h0000000-0000-4000-8000-000000000001",
      name: "Big one",
      visibility: "open",
      accepting_uploads: true,
      moderation_mode: "live",
      created_at: "2026-09-01T00:00:00+00:00",
    },
    hostLabel: "Maya",
    counts: { approved: 2_000, pending: 300, hidden: 100, removed: 100 },
    media: Array.from({ length: shown }, (_, i) => ({
      id: `m${i}`,
      type: "photo",
      status: "approved",
      createdAt: AT,
      originalKey: `k${i}`,
      eventId: EVENT,
      eventName: "Big one",
      hostId: "h0000000-0000-4000-8000-000000000001",
      hostLabel: "Maya",
    })),
    position: over.position ?? 0,
    next: over.next === undefined ? { at: AT, id: NEXT_ID } : over.next,
  };
}

async function draw(searchParams: Record<string, string> = {}) {
  render(
    await page.default({
      params: Promise.resolve({ eventId: EVENT }),
      searchParams: Promise.resolve(searchParams),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("the album drill-in, a page at a time", () => {
  it("★ signs ONE page, never the album, and says which items these are", async () => {
    getAlbumForModeration.mockResolvedValue(detail(500));
    await draw();
    expect(toModerationFeedItems).toHaveBeenCalledTimes(1);
    expect(toModerationFeedItems.mock.calls[0][0]).toHaveLength(500);
    expect(screen.getAllByTestId("grid")[0]).toHaveAttribute(
      "data-count",
      "500",
    );
    expect(
      screen.getAllByText("Items 1–500 of 2,500, newest first")[0],
    ).toBeInTheDocument();
    // The newest page: an Older link, no Newest.
    expect(screen.queryByRole("link", { name: "Newest" })).toBeNull();
  });

  it("★ Older carries the next page's cursor, and never prefetches", async () => {
    getAlbumForModeration.mockResolvedValue(detail(500));
    await draw();
    const older = screen.getAllByRole("link", { name: "Older" })[0];
    const url = new URL(older.getAttribute("href")!, "https://admin.test");
    expect(url.pathname).toBe(`/admin/albums/${EVENT}`);
    expect(url.searchParams.get("at")).toBe(AT);
    expect(url.searchParams.get("id")).toBe(NEXT_ID);
    expect(older).toHaveAttribute("data-prefetch", "false");
  });

  it("a later page says where it sits and links the newest page", async () => {
    getAlbumForModeration.mockResolvedValue(detail(500, { position: 500 }));
    await draw({ at: AT, id: NEXT_ID });
    expect(
      screen.getAllByText("Items 501–1,000 of 2,500, newest first")[0],
    ).toBeInTheDocument();
    const newest = screen.getAllByRole("link", { name: "Newest" })[0];
    expect(newest).toHaveAttribute("href", `/admin/albums/${EVENT}`);
    expect(newest).toHaveAttribute("data-prefetch", "false");
  });

  it("★ the cursor in the URL reaches the read; a mangled one reads the newest page", async () => {
    getAlbumForModeration.mockResolvedValue(detail(10, { next: null }));
    await draw({ at: AT, id: NEXT_ID });
    expect(getAlbumForModeration).toHaveBeenLastCalledWith(EVENT, AT, NEXT_ID);
    await draw({ at: "2026-09-23,x", id: NEXT_ID });
    expect(getAlbumForModeration).toHaveBeenLastCalledWith(EVENT, null, null);
  });

  it("an album of one page says nothing about pages", async () => {
    getAlbumForModeration.mockResolvedValue(detail(12, { next: null }));
    await draw();
    expect(
      screen.queryByRole("navigation", { name: "Album pages" }),
    ).toBeNull();
    expect(screen.getByTestId("grid")).toHaveAttribute("data-count", "12");
  });

  it('a page past the album\'s end (a stale link) draws the way back, not "No media"', async () => {
    getAlbumForModeration.mockResolvedValue(
      detail(0, { position: 2_500, next: null }),
    );
    await draw({ at: AT, id: NEXT_ID });
    expect(
      screen.getByText("Nothing older here, of 2,500"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Newest" })).toBeInTheDocument();
    expect(screen.queryByText("No media")).toBeNull();
  });
});
