import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

import { ModerationGridDemo } from "./moderation-grid-demo";

/**
 * THE ALBUMS GRID'S SPECIMEN DRAWS FOUR STATES AND WRITES NOTHING (`moderation-grid-demo.tsx`): a seen photograph, a removed
 * one, a video and a covered one. The grid is the real one and takes its two writes as props, so the specimen hands it
 * stand-ins that move a tile in its own list after a round trip, and holds the caption's link. The Server Functions the
 * portal's pages hand the grid are spies that must never be called.
 */
const actions = vi.hoisted(() => ({
  removeMediaByOperatorAction: vi.fn(async () => ({ ok: true })),
  restoreMediaAction: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/app/admin/albums/actions", () => actions);
vi.mock("@/components/shared/media-lightbox.lazy", () => ({
  MediaLightboxLazy: () => null,
  preloadMediaLightbox: () => {},
}));

beforeEach(() => {
  Object.values(actions).forEach((fn) => fn.mockClear());
});
afterEach(() => {
  vi.useRealTimers();
});

const grid = (mode: "feed" | "album" = "feed") =>
  render(
    <TooltipProvider>
      <ModerationGridDemo mode={mode} />
    </TooltipProvider>,
  );

describe("the four states of a tile", () => {
  it("★ a seen photograph with Remove, a removed one with Restore, a video, and a covered one with no picture at all", () => {
    grid();
    const tiles = document.querySelectorAll("[data-media-tile]");
    expect(tiles).toHaveLength(4);
    const [seen, removed, video, covered] = [...tiles] as HTMLElement[];
    expect(
      within(seen).getByRole("button", { name: "Remove" }),
    ).toBeInTheDocument();
    expect(
      within(removed).getByRole("button", { name: "Restore" }),
    ).toBeInTheDocument();
    expect(
      within(video).getByRole("button", { name: /play video/i }),
    ).toBeInTheDocument();
    // Covered: the worst kinds' cover, and nothing of the picture is drawn or opened.
    expect(covered.querySelector("[data-media-covered]")).toBeTruthy();
    expect(within(covered).getByText("Covered")).toBeInTheDocument();
    expect(covered.querySelector("img, video")).toBeNull();
    expect(within(covered).queryByRole("button", { name: /view/i })).toBeNull();
    // Remove stays on it, since neither needs a look.
    expect(
      within(covered).getByRole("button", { name: "Remove" }),
    ).toBeInTheDocument();
  });

  it("the feed names each tile's album; inside one album the caption is gone", () => {
    const feed = grid("feed");
    expect(screen.getAllByText("Maya & Jay's wedding")).toHaveLength(4);
    feed.unmount();
    grid("album");
    expect(screen.queryByText("Maya & Jay's wedding")).toBeNull();
  });
});

describe("the portal's writes are stand-ins", () => {
  it("★ Remove asks through the sheet and the tile goes removed after a round trip, and Restore brings it back: no Server Function is reached", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    grid();
    const [seen] = [
      ...document.querySelectorAll("[data-media-tile]"),
    ] as HTMLElement[];
    await user.click(within(seen).getByRole("button", { name: "Remove" }));
    const sheet = await screen.findByRole("alertdialog");
    await user.click(within(sheet).getByRole("button", { name: "Remove" }));
    // Not yet: a round trip's wait, as the real write takes.
    expect(within(seen).queryByRole("button", { name: "Restore" })).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(
      await within(seen).findByRole("button", { name: "Restore" }),
    ).toBeInTheDocument();
    // And the way back, through the other stand-in.
    await user.click(within(seen).getByRole("button", { name: "Restore" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(
      await within(seen).findByRole("button", { name: "Remove" }),
    ).toBeInTheDocument();
    expect(actions.removeMediaByOperatorAction).not.toHaveBeenCalled();
    expect(actions.restoreMediaAction).not.toHaveBeenCalled();
  });

  it("★ the album caption's link goes nowhere", async () => {
    grid();
    const link = document.querySelector<HTMLAnchorElement>(
      "a[href^='/admin/albums/']",
    )!;
    const proceeded = link.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    // A held press is one whose default was prevented.
    expect(proceeded).toBe(false);
  });
});
