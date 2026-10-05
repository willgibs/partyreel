import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE OPERATOR'S ALBUMS FEED (crumbs-78): the page hands the grid its two writes. `ModerationGrid` imports no Server
 * Action (a grid that did mounted nowhere but this page), so the page names them, each on the prop of its own name:
 * a swap would remove what the operator restores, which the types cannot tell. The gate comes first, and the status
 * filter reaches the read as the feed's own words.
 */
vi.mock("server-only", () => ({}));
const requireAdmin = vi.fn();
vi.mock("@/lib/auth/admin-context", () => ({
  requireAdmin: (...a: unknown[]) => requireAdmin(...a),
}));
const listRecentMedia = vi.fn();
vi.mock("@/lib/db/queries/moderation", () => ({
  listRecentMedia: (...a: unknown[]) => listRecentMedia(...a),
}));
const readCoveredItems = vi.fn();
vi.mock("@/lib/db/queries/reports", () => ({
  readCoveredItems: (...a: unknown[]) => readCoveredItems(...a),
}));
const toModerationFeedItems = vi.fn();
vi.mock("@/lib/r2/grid-items", () => ({
  toModerationFeedItems: (...a: unknown[]) => toModerationFeedItems(...a),
}));
// The real module's `server-only` chain does not resolve in jsdom; the page only passes the two functions along.
vi.mock("@/app/admin/albums/actions", () => ({
  removeMediaByOperatorAction: vi.fn(),
  restoreMediaAction: vi.fn(),
}));
const gridProps = vi.fn();
vi.mock("@/components/admin/moderation-grid", () => ({
  ModerationGrid: (props: { items: unknown[] }) => {
    gridProps(props);
    return <div data-testid="grid" data-count={props.items.length} />;
  },
}));

const page = await import("./page");
const actions = await import("@/app/admin/albums/actions");

async function draw(searchParams: { status?: string } = {}) {
  const ui = await page.default({
    searchParams: Promise.resolve(searchParams),
  });
  if (ui) render(ui);
  return ui;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdmin.mockResolvedValue({ aal: "aal2" });
  listRecentMedia.mockResolvedValue([{ id: "m1" }, { id: "m2" }]);
  readCoveredItems.mockResolvedValue(new Set<string>());
  toModerationFeedItems.mockImplementation(async (media: { id: string }[]) =>
    media.map((m) => ({ id: m.id })),
  );
});

describe("the albums feed page", () => {
  it("★ hands the grid the albums' own Server Actions, each as its own prop", async () => {
    await draw();
    expect(gridProps).toHaveBeenCalledTimes(1);
    const props = gridProps.mock.calls[0][0];
    expect(props.mode).toBe("feed");
    expect(props.removeAction).toBe(actions.removeMediaByOperatorAction);
    expect(props.restoreAction).toBe(actions.restoreMediaAction);
    expect(screen.getByTestId("grid")).toHaveAttribute("data-count", "2");
  });

  it("★ reads nothing below the second factor: the MFA step comes first", async () => {
    requireAdmin.mockResolvedValue({ aal: "aal1" });
    await expect(draw()).resolves.toBeNull();
    expect(listRecentMedia).not.toHaveBeenCalled();
    expect(readCoveredItems).not.toHaveBeenCalled();
    expect(toModerationFeedItems).not.toHaveBeenCalled();
  });

  it("asks the read for the filter's own status, and reads every status for anything it does not know", async () => {
    await draw({ status: "removed" });
    expect(listRecentMedia).toHaveBeenLastCalledWith("removed");
    await draw({ status: "removed,approved" });
    expect(listRecentMedia).toHaveBeenLastCalledWith("all");
  });

  it("★ a covered item is asked of the rule before anything is signed, and the set reaches the signer", async () => {
    const covered = new Set(["m2"]);
    readCoveredItems.mockResolvedValue(covered);
    await draw();
    expect(readCoveredItems).toHaveBeenCalledWith({ mediaIds: ["m1", "m2"] });
    expect(toModerationFeedItems).toHaveBeenCalledWith(
      [{ id: "m1" }, { id: "m2" }],
      covered,
    );
  });

  it("an empty feed draws no grid, only its card", async () => {
    listRecentMedia.mockResolvedValue([]);
    await draw();
    expect(screen.queryByTestId("grid")).toBeNull();
    expect(screen.getByText("No uploads yet.")).toBeInTheDocument();
  });
});
