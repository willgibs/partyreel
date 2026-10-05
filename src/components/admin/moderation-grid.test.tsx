import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ActionResult } from "@/app/(app)/dashboard/actions";
import { TooltipProvider } from "@/components/ui/tooltip";
import type {
  ModerationGridItem,
  ModerationTile,
} from "@/lib/moderation/operator-actions";

import { ModerationGrid } from "./moderation-grid";

/**
 * THE ADMIN'S ALBUMS OPEN THE ONE VIEWER, GROWN OUT OF THEIR TILES (media-viewer
 * r1, `opening=grow`). The operator's portal cannot be signed in locally, so
 * this proves the wiring in a component: a tap hands the viewer the tile's box
 * to grow from and a way back into the tile of whichever report is showing at
 * close; the viewer the portal gets carries no Share and no curate group (it
 * passes neither), and its Remove and Restore stay on the tiles.
 *
 * ★ NOTHING IN THIS FILE MOCKS `@/app/admin/albums/actions` (crumbs-78): the grid takes its two writes as props,
 * and the albums pages hand it their Server Actions. A grid that imported that module again would fail to load
 * here, since the module's `server-only` chain does not resolve in jsdom.
 */

/** The writes the pages hand the grid, here a test's own. */
const removeAction = vi.fn(async (mediaId: string): Promise<ActionResult> => {
  void mediaId;
  return { ok: true };
});
const restoreAction = vi.fn(async (mediaId: string): Promise<ActionResult> => {
  void mediaId;
  return { ok: true };
});

// The lazy wrapper is next/dynamic, which resolves after a pin is over: mount
// the real viewer synchronously.
vi.mock("@/components/shared/media-lightbox.lazy", async () => {
  const { MediaLightbox } = await import("@/components/shared/media-lightbox");
  return { MediaLightboxLazy: MediaLightbox, preloadMediaLightbox: () => {} };
});

const ITEMS: ModerationGridItem[] = [
  {
    id: "m1",
    type: "photo",
    url: "https://r2.test/m1.jpg",
    downloadUrl: "https://r2.test/dm1.jpg",
    width: 3000,
    height: 4000,
    status: "approved",
    eventId: "e1",
    eventName: "Maya & Jay",
    hostLabel: "Maya",
  },
  {
    id: "m2",
    type: "photo",
    url: "https://r2.test/m2.jpg",
    downloadUrl: "https://r2.test/dm2.jpg",
    width: 4000,
    height: 3000,
    status: "removed",
    eventId: "e1",
    eventName: "Maya & Jay",
    hostLabel: "Maya",
  },
];

type Call = {
  el: Element;
  frames: Keyframe[];
  anim: { onfinish: (() => void) | null };
};
let calls: Call[] = [];

beforeEach(() => {
  calls = [];
  vi.clearAllMocks();
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    value(this: Element, frames: Keyframe[]) {
      const anim = { onfinish: null, oncancel: null, cancel() {} };
      calls.push({ el: this, frames, anim });
      return anim;
    },
  });
  Object.defineProperty(Element.prototype, "getAnimations", {
    configurable: true,
    value: () => [],
  });
});
afterEach(() => {
  delete (Element.prototype as unknown as Record<string, unknown>).animate;
  delete (Element.prototype as unknown as Record<string, unknown>)
    .getAnimations;
});

function mount(items: ModerationTile[] = ITEMS) {
  return render(
    <TooltipProvider>
      <ModerationGrid
        items={items}
        mode="feed"
        removeAction={removeAction}
        restoreAction={restoreAction}
      />
    </TooltipProvider>,
  );
}

describe("the admin's album grid opens the one viewer", () => {
  it("grows the photograph out of the tile it was tapped on", async () => {
    mount();
    fireEvent.click(screen.getAllByLabelText("View photo")[0]);
    await act(async () => {});
    expect(screen.getByRole("dialog", { name: "Photo 1 of 2" })).toBeTruthy();
    const flight = calls.find((c) => c.el.hasAttribute("data-lightbox-media"));
    expect(flight, "the photograph flies out of its tile").toBeTruthy();
    expect(String(flight!.frames[0].transform)).toMatch(/scale\(/);
  });

  it("drops back into the tile of the report showing at close, and gives it focus", async () => {
    mount();
    fireEvent.click(screen.getAllByLabelText("View photo")[0]);
    await act(async () => {});
    await act(async () => {
      calls
        .find((c) => c.el.hasAttribute("data-lightbox-media"))
        ?.anim.onfinish?.();
    });
    // Step to the second report, then leave.
    fireEvent.keyDown(window, { key: "ArrowRight" });
    calls = [];
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    const drop = calls.find((c) => c.el.hasAttribute("data-lightbox-media"));
    expect(drop, "the photograph drops back").toBeTruthy();
    await act(async () => {
      drop!.anim.onfinish?.();
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    const second = document.querySelector('[data-media-id="m2"] button');
    // Radix returns focus a tick after the dialog unmounts.
    await vi.waitFor(() => expect(document.activeElement).toBe(second));
  });

  it("hands the portal's viewer no Share, no Copy link and no curate group", async () => {
    mount();
    fireEvent.click(screen.getAllByLabelText("View photo")[0]);
    await act(async () => {});
    const capsule = document.querySelector("[data-lightbox-capsule]")!;
    expect(capsule.querySelector('[aria-label="Share"]')).toBeNull();
    expect(capsule.querySelector('[aria-label="Copy link"]')).toBeNull();
    expect(capsule.querySelector('[aria-label="Hide"]')).toBeNull();
    expect(capsule.querySelector('[aria-label="Save"]')).not.toBeNull();
  });
});

/**
 * THE REMOVE SAYS WHAT IS TRUE AFTER THE PRESS (admin-triage r1): the host loses it from her album
 * and her Deleted at once and is told nothing, the guest's own list says it in its own words, and it
 * comes back from here for the one 30-day window. Build 15's red-team read "her uploads list
 * already says Not in the album" on an item still up.
 */
describe("the operator's Remove", () => {
  it("lists what the removal reaches, never what is already so", async () => {
    mount();
    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    const dialog = await screen.findByRole("alertdialog");
    const lines = [
      ...dialog.querySelectorAll("[data-slot='destructive-touches'] li"),
    ].map((li) => li.textContent);
    expect(lines).toEqual([
      "-1 photo in Maya & Jay",
      "-Gone from the host's album and her Deleted at once; she is sent nothing",
      "-At an event that reviews uploads, the guest who sent it sees “Not approved” in her uploads list",
      "-Restorable here for 30 days, then the purge deletes it unless it is held",
    ]);
  });
});

/**
 * THE WORST KINDS ARRIVE COVERED IN THE ALBUMS GRID (build 23's NIT-7, carried here by crumbs-21): the
 * reports inbox covers an item a report of the worst kinds names, and the albums grid covers the same set
 * from the same rule (`readCoveredItems`). A covered item comes with no url at all, so its tile draws the
 * cover, opens nothing, and the viewer steps only through what is seen; Remove and Restore stay on it.
 */
describe("a covered item in the albums grid", () => {
  const COVERED: ModerationTile = {
    id: "m3",
    type: "photo",
    covered: true,
    status: "approved",
    eventId: "e1",
    eventName: "Maya & Jay",
    hostLabel: "Maya",
  };

  function mountWithCovered() {
    return render(
      <TooltipProvider>
        <ModerationGrid
          items={[ITEMS[0], COVERED, ITEMS[1]]}
          mode="album"
          removeAction={removeAction}
          restoreAction={restoreAction}
        />
      </TooltipProvider>,
    );
  }

  it("★ draws the cover, loads no picture of it, and opens nothing", () => {
    mountWithCovered();
    const tile = document.querySelector('[data-media-id="m3"]') as HTMLElement;
    expect(
      within(tile).getByRole("img", { name: "Covered photo" }),
    ).toBeInTheDocument();
    expect(tile.querySelector("img, video")).toBeNull();
    expect(within(tile).queryByLabelText("View photo")).toBeNull();
    // The operator's acts stay: a removal needs no look.
    expect(within(tile).getByRole("button", { name: "Remove" })).toBeTruthy();
    // The seen tiles still open, two of them.
    expect(screen.getAllByLabelText("View photo")).toHaveLength(2);
  });

  it("the viewer steps through the seen items alone", async () => {
    mountWithCovered();
    fireEvent.click(screen.getAllByLabelText("View photo")[1]);
    await act(async () => {});
    expect(screen.getByRole("dialog", { name: "Photo 2 of 2" })).toBeTruthy();
    expect(
      document
        .querySelector("[data-lightbox-media] img")
        ?.getAttribute("src") ?? "",
    ).not.toContain("m3");
  });
});

/**
 * ★ THE OPERATOR'S TILES DRAW PREVIEWS (crumbs-78). The feed (60 tiles) and a drill-in page (500) fetched each
 * original to draw a square. `toModerationFeedItems` signs each row's preview now, and a tile draws
 * `previewUrl ?? url`, so the original is a tile's picture only on a row with no preview; the viewer still opens
 * the original (`url`), and Save is its `downloadUrl`.
 */
describe("the operator's tiles draw previews", () => {
  const PREVIEWED: ModerationGridItem[] = [
    { ...ITEMS[0], previewUrl: "https://r2.test/m1.preview.webp" },
    { ...ITEMS[1], previewUrl: null },
  ];
  const tileSrc = (id: string) =>
    document.querySelector(`[data-media-id="${id}"] img`)?.getAttribute("src");

  it("★ a tile with a preview draws it, never the original; one with none draws the original", () => {
    mount(PREVIEWED);
    expect(tileSrc("m1")).toBe("https://r2.test/m1.preview.webp");
    expect(tileSrc("m2")).toBe("https://r2.test/m2.jpg");
  });

  it("a video's tile draws its preview picture, never a <video> that fetches the clip", () => {
    mount([
      {
        ...ITEMS[0],
        id: "v1",
        type: "video",
        url: "https://r2.test/v1.mp4",
        previewUrl: "https://r2.test/v1.preview.webp",
      },
    ]);
    const tile = document.querySelector('[data-media-id="v1"]')!;
    expect(tile.querySelector("video")).toBeNull();
    expect(tileSrc("v1")).toBe("https://r2.test/v1.preview.webp");
  });
});

/**
 * ★ THE WRITES COME IN AS PROPS (crumbs-78): Restore and Remove call the functions the page handed the grid, with
 * the item's id, and say the result in the portal's toasts. Remove waits for the destructive sheet's confirm.
 */
describe("the writes the grid is handed", () => {
  it("★ Restore asks the restore it was handed, with the item's id, and says it landed", async () => {
    mount();
    const tile = document.querySelector('[data-media-id="m2"]') as HTMLElement;
    await act(async () => {
      fireEvent.click(within(tile).getByRole("button", { name: "Restore" }));
    });
    expect(restoreAction).toHaveBeenCalledTimes(1);
    expect(restoreAction).toHaveBeenCalledWith("m2");
    expect(removeAction).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      "Restored to where it was before the removal.",
    );
  });

  it("a restore the action refuses is told in the action's own words", async () => {
    restoreAction.mockResolvedValueOnce({
      ok: false,
      code: "unknown",
      message: "Couldn't restore that item. Please try again.",
    });
    mount();
    const tile = document.querySelector('[data-media-id="m2"]') as HTMLElement;
    await act(async () => {
      fireEvent.click(within(tile).getByRole("button", { name: "Restore" }));
    });
    expect(toast.error).toHaveBeenCalledWith("Couldn't restore that item.", {
      description: "Couldn't restore that item. Please try again.",
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("★ Remove asks the remove it was handed only once the sheet is confirmed", async () => {
    mount();
    const tile = document.querySelector('[data-media-id="m1"]') as HTMLElement;
    fireEvent.click(within(tile).getByRole("button", { name: "Remove" }));
    const dialog = await screen.findByRole("alertdialog");
    // Asked, not done: the sheet says what it touches and waits.
    expect(removeAction).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
    });
    expect(removeAction).toHaveBeenCalledTimes(1);
    expect(removeAction).toHaveBeenCalledWith("m1");
    expect(restoreAction).not.toHaveBeenCalled();
  });
});
