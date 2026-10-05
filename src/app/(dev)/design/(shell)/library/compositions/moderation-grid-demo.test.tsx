import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

import { ModerationGridDemo } from "./moderation-grid-demo";

/**
 * THE ALBUMS GRID'S SPECIMEN DRAWS FOUR STATES AND WRITES NOTHING (`moderation-grid-demo.tsx`): a seen photograph, a removed
 * one, a video and a covered one, with the portal's own writes (Remove behind its sheet, Restore) and the caption's link
 * held. The grid is the real one; the Server Functions behind it are spies that must never be called.
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

describe("the portal's writes are held", () => {
  it("★ Remove opens no sheet and Restore calls nothing: not one Server Function is reached", async () => {
    grid();
    const [seen, removed] = [
      ...document.querySelectorAll("[data-media-tile]"),
    ] as HTMLElement[];
    await userEvent.click(within(seen).getByRole("button", { name: "Remove" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    await userEvent.click(
      within(removed).getByRole("button", { name: "Restore" }),
    );
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
