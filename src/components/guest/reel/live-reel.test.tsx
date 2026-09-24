/**
 * THE LIVE REEL ON THE ALBUM PAGE: the controller, the Highlight reel tile and the approval toast.
 *
 * What is pinned is Will's rulings, as behaviour: the reel exists from the SECOND reel-eligible item
 * and below it there is nothing (`states=nothing`); a cut never counts; the host's switch, the
 * platform lever and a door still standing each take it away; a tap (or `?reel`) opens the view;
 * the screen posture below the minimum is the code alone; the tile says "Make your own clip to
 * share" only with a creator to make one; and on a moderated event the toast "The host added your
 * uploads" with "Watch reel" plays once, when this device's held upload shows up approved.
 *
 * The view itself is stubbed (its own file pins it); the doorbell is the one seam driven by hand.
 */
import { Suspense } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GalleryPayload } from "@/components/guest/gallery-live";
import type { GalleryItem, GalleryReel } from "@/lib/events/gallery-reel";
import type { QueueItem } from "@/lib/guest/use-upload-queue";

const hooks = vi.hoisted(() => ({
  refresh: null as (() => void) | null,
  creator: null as unknown,
}));

vi.mock("@/app/(guest)/e/[token]/actions", () => ({
  removeMyUploadGuestAction: vi.fn(),
  setTileSizeAction: vi.fn(),
}));
vi.mock("@/lib/guest/use-gallery-doorbell", () => ({
  useGalleryDoorbell: (opts: { onRefresh: () => void }) => {
    hooks.refresh = opts.onRefresh;
    return { live: true };
  },
}));
vi.mock("@/components/guest/reel/live-reel-view", () => ({
  LiveReelView: (props: { mode: string; idle: boolean }) => (
    <div data-testid="reel-view" data-mode={props.mode} data-idle={String(props.idle)} />
  ),
}));
vi.mock("@/components/guest/reel/creator-seam", () => ({
  get REEL_CREATOR() {
    return hooks.creator;
  },
}));

const { GalleryLiveProvider } = await import("@/components/guest/gallery-live");
// The lazy view's module, loaded once up front, so its chunk resolves at once when a test opens it.
await import("@/components/guest/reel/live-reel-view");
const { LiveReel, LiveReelTile } = await import(
  "@/components/guest/reel/live-reel"
);

const REEL: GalleryReel = {
  showReel: true,
  liveReelEnabled: true,
  styleId: null,
  cut: { videoAllowed: true, watermark: false, maxSeconds: 60 },
};

function item(i: number, over: Partial<GalleryItem> = {}): GalleryItem {
  return {
    id: `m${i}`,
    type: "photo",
    url: `https://r2.test/o/${i}.jpg`,
    previewUrl: `https://r2.test/p/${i}.webp`,
    status: "approved",
    uploaderName: "Theo",
    ...over,
  };
}

async function mount({
  items = [item(1), item(2)],
  reel = REEL,
  access = "full" as const,
  queue = [] as QueueItem[],
  moderated = false,
}: {
  items?: GalleryItem[];
  reel?: GalleryReel | null;
  access?: "full" | "teaser";
  queue?: QueueItem[];
  moderated?: boolean;
} = {}) {
  const payload: GalleryPayload = {
    items,
    teaserTotal: null,
    approvedTotal: items.length,
    reel,
    etag: "e1",
  };
  const galleryPromise = Promise.resolve(payload);
  const tree = (q: QueueItem[]) => (
    <Suspense fallback={<div>loading</div>}>
      <GalleryLiveProvider
        galleryPromise={galleryPromise}
        qrToken="qr-token"
        access={access}
        isDemo={false}
        pendingUploads={q}
      >
        <LiveReel
          eventId="event-1"
          joinUrl="https://partyreel.com/e/qr-token"
          displayAddress="partyreel.com/e/qr-token"
          qrStyle="classic"
          isDemo={false}
          moderated={moderated}
          queue={q}
        >
          <LiveReelTile />
        </LiveReel>
      </GalleryLiveProvider>
    </Suspense>
  );
  let utils!: ReturnType<typeof render>;
  await act(async () => {
    utils = render(tree(queue));
    await galleryPromise;
  });
  return { ...utils, rerenderWith: (q: QueueItem[]) => utils.rerender(tree(q)) };
}

/** Let the lazy view's chunk resolve inside act, so its boundary's retry is flushed. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
}

/** A poll answering this payload (the doorbell rang). */
async function pollWith(items: GalleryItem[], reel: GalleryReel | null = REEL) {
  global.fetch = vi.fn(async () => ({
    status: 200,
    ok: true,
    headers: { get: () => "etag-next" },
    json: async () => ({
      ok: true,
      items,
      access: "full",
      gate: null,
      approvedTotal: items.length,
      reel,
    }),
  })) as unknown as typeof fetch;
  await act(async () => {
    hooks.refresh?.();
    await Promise.resolve();
  });
  await act(async () => {});
}

beforeEach(() => {
  hooks.creator = null;
  window.history.replaceState(null, "", "/e/qr-token");
  vi.mocked(toast).mockClear();
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("the Highlight reel tile", () => {
  it("is there at two reel-eligible items, headed Highlight reel", async () => {
    await mount();
    const tile = screen.getByRole("button", {
      name: "Watch the highlight reel",
    });
    expect(tile).toHaveTextContent("Highlight reel");
    // No creator yet: no promise of a clip nobody can make.
    expect(tile).not.toHaveTextContent("Make your own clip to share");
    // No style name, no moment count, no corner badge.
    expect(tile).not.toHaveTextContent(/Cinematic|moments|The reel/);
  });

  it("is absent at one item, and a cut never counts toward the two", async () => {
    await mount({ items: [item(1)] });
    expect(screen.queryByRole("button", { name: /highlight reel/i })).toBeNull();
  });

  it("does not count a cut, a held item or one with nothing to draw", async () => {
    await mount({
      items: [
        item(1),
        item(2, { reelEligible: false }),
        item(3, { status: "pending" }),
        item(4, { type: "video", previewUrl: null }),
      ],
    });
    expect(screen.queryByRole("button", { name: /highlight reel/i })).toBeNull();
  });

  it("is absent with the host's switch off, the lever off, or a door still standing", async () => {
    for (const reel of [
      { ...REEL, showReel: false },
      { ...REEL, liveReelEnabled: false },
      null,
    ]) {
      const { unmount } = await mount({ reel });
      expect(screen.queryByRole("button", { name: /highlight reel/i })).toBeNull();
      unmount();
    }
  });

  it("offers the clip only with a creator AND the host's plan in hand", async () => {
    hooks.creator = () => null;
    const { unmount } = await mount();
    expect(
      screen.getByRole("button", { name: "Watch the highlight reel" }),
    ).toHaveTextContent("Make your own clip to share");
    unmount();
    await mount({ reel: { ...REEL, cut: null } });
    expect(
      screen.getByRole("button", { name: "Watch the highlight reel" }),
    ).not.toHaveTextContent("Make your own clip to share");
  });

  it("crossfades the reel's own stills: previews only, six slots", async () => {
    const { container } = await mount();
    const stills = [...container.querySelectorAll("img.lr-still")];
    expect(stills).toHaveLength(6);
    for (const img of stills) {
      expect(img.getAttribute("src")).toMatch(/\/p\/\d\.webp$/);
    }
  });

  it("appears the moment the doorbell brings the second photograph", async () => {
    await mount({ items: [item(1)] });
    expect(screen.queryByRole("button", { name: /highlight reel/i })).toBeNull();
    await pollWith([item(1), item(2)]);
    expect(
      screen.getByRole("button", { name: "Watch the highlight reel" }),
    ).toBeInTheDocument();
  });
});

describe("the view's address", () => {
  it("a tap opens the view and writes ?reel", async () => {
    await mount();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Watch the highlight reel" }),
      );
    });
    expect(window.location.search).toBe("?reel");
    await settle();
    expect(screen.getByTestId("reel-view")).toHaveAttribute("data-mode", "hand");
  });

  it("?reel opens it on arrival (deep-linkable)", async () => {
    window.history.replaceState(null, "", "/e/qr-token?reel");
    await mount();
    await settle();
    expect(screen.getByTestId("reel-view")).toHaveAttribute("data-mode", "hand");
  });

  it("?reel below the minimum is quietly dropped: no view, no parameter", async () => {
    window.history.replaceState(null, "", "/e/qr-token?reel");
    await mount({ items: [item(1)] });
    expect(screen.queryByTestId("reel-view")).toBeNull();
    expect(window.location.search).toBe("");
  });

  it("?reel behind a door waits for it (the parameter stays for after the door)", async () => {
    window.history.replaceState(null, "", "/e/qr-token?reel");
    await mount({ reel: null, access: "teaser" });
    expect(screen.queryByTestId("reel-view")).toBeNull();
    expect(window.location.search).toBe("?reel");
  });

  it("?reel=screen below the minimum is the screen's idle state (the code alone)", async () => {
    window.history.replaceState(null, "", "/e/qr-token?reel=screen");
    await mount({ items: [item(1)] });
    await settle();
    const view = screen.getByTestId("reel-view");
    expect(view).toHaveAttribute("data-mode", "screen");
    expect(view).toHaveAttribute("data-idle", "true");
  });

  it("?reel=screen with the reel off is no view at all", async () => {
    window.history.replaceState(null, "", "/e/qr-token?reel=screen");
    await mount({ items: [item(1)], reel: { ...REEL, showReel: false } });
    expect(screen.queryByTestId("reel-view")).toBeNull();
    expect(window.location.search).toBe("");
  });
});

describe("the approval toast (yours=toast)", () => {
  const held: QueueItem = {
    id: "q1",
    file: new File([new Uint8Array([1])], "a.jpg", { type: "image/jpeg" }),
    kind: "photo",
    status: "done",
    progress: 100,
    mediaStatus: "pending",
    mediaId: "m9",
  };

  it("says it once, with Watch reel, when this device's held upload shows up approved", async () => {
    await mount({ moderated: true, queue: [held] });
    expect(toast).not.toHaveBeenCalled();
    await pollWith([item(1), item(2), item(9)]);
    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith(
      "The host added your uploads",
      expect.objectContaining({
        action: expect.objectContaining({ label: "Watch reel" }),
      }),
    );
    // Once per visit: a later poll that still carries it says nothing more.
    await pollWith([item(1), item(2), item(9), item(10)]);
    expect(toast).toHaveBeenCalledTimes(1);
  });

  it("never plays while no reel is showing", async () => {
    await mount({
      moderated: true,
      queue: [held],
      reel: { ...REEL, showReel: false },
    });
    await pollWith([item(1), item(2), item(9)], { ...REEL, showReel: false });
    expect(toast).not.toHaveBeenCalled();
  });

  it("never plays on a live event (nothing is ever held there)", async () => {
    await mount({ moderated: false, queue: [held] });
    await pollWith([item(1), item(2), item(9)]);
    expect(toast).not.toHaveBeenCalled();
  });

  it("does not count a cut the host approved (it will never be in the reel)", async () => {
    await mount({ moderated: true, queue: [held] });
    await pollWith([item(1), item(2), item(9, { reelEligible: false })]);
    expect(toast).not.toHaveBeenCalled();
  });
});
