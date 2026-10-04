import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";

/**
 * THE ALBUM'S KINDS, CARRIED TO THE FOOT (red-team 49's NIT): the source sits inside the album's live source and says
 * which of its items are clips while select mode is on, so the foot's Save can name her set ("photos & videos"). It
 * says nothing while she is not selecting, and follows the album as it changes under her picks.
 */
const live = vi.hoisted(() => ({
  items: [] as { id: string; type: "photo" | "video" }[],
}));
vi.mock("@/components/guest/gallery-live", () => ({
  useGalleryLive: () => ({ items: live.items }),
}));

const { AlbumKindsSource } =
  await import("@/components/guest/guest-action-dock-kinds-source");
const { createAlbumKinds } =
  await import("@/components/guest/guest-action-dock-kinds");
const { guestSelect } = await import("@/components/guest/live-gallery-select");

afterEach(() => act(() => guestSelect.exit()));

describe("the album's kinds, carried to the foot", () => {
  it("★ says the album's kinds once select mode is on, and nothing before it", () => {
    live.items = [
      { id: "a", type: "photo" },
      { id: "v", type: "video" },
    ];
    const kinds = createAlbumKinds();
    render(<AlbumKindsSource store={kinds} />);
    expect(kinds.get().size).toBe(0);
    act(() => guestSelect.enter());
    expect(kinds.get().get("a")).toBe("photo");
    expect(kinds.get().get("v")).toBe("video");
  });

  it("follows the album while she selects", () => {
    live.items = [{ id: "a", type: "photo" }];
    const kinds = createAlbumKinds();
    const view = render(<AlbumKindsSource store={kinds} />);
    act(() => guestSelect.enter());
    expect(kinds.get().has("v")).toBe(false);
    live.items = [
      { id: "a", type: "photo" },
      { id: "v", type: "video" },
    ];
    view.rerender(<AlbumKindsSource store={kinds} />);
    expect(kinds.get().get("v")).toBe("video");
  });

  it("tells whoever reads it each time it changes", () => {
    const kinds = createAlbumKinds();
    const heard = vi.fn();
    const stop = kinds.subscribe(heard);
    kinds.set(new Map([["a", "photo"]]));
    expect(heard).toHaveBeenCalledTimes(1);
    stop();
    kinds.set(new Map());
    expect(heard).toHaveBeenCalledTimes(1);
  });
});
