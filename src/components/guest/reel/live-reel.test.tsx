/**
 * THE LIVE REEL ON THE ALBUM PAGE: the controller, the Highlight reel tile and the approval toast.
 *
 * What is pinned is behaviour: the reel exists from the SECOND reel-eligible item and below it
 * there is nothing; a clip never counts; the host's switch, the platform lever and a door still
 * standing each take it away; a tap (or `?reel`) opens the view; the screen posture below the
 * minimum is the code alone; the tile says "Make your own clip to share" only with a creator to
 * make one; and on a moderated event the toast "The host added your uploads" with "Watch reel"
 * plays once, when this device's held upload shows up approved.
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
  setForEveryone: undefined as
    | ((look: { styleId: string; holdSec: number }) => Promise<boolean>)
    | undefined,
  setReelDefaults: vi.fn(async (input: unknown) => {
    void input;
    return { ok: true } as { ok: boolean };
  }),
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
vi.mock("@/lib/reel/defaults-action", () => ({
  setReelDefaults: (input: unknown) => hooks.setReelDefaults(input),
}));
vi.mock("@/components/guest/reel/live-reel-view", () => ({
  LiveReelView: (props: {
    mode: string;
    idle: boolean;
    isOwner?: boolean;
    onSetForEveryone?: (look: { styleId: string; holdSec: number }) => Promise<boolean>;
    onClose: () => void;
  }) => {
    hooks.setForEveryone = props.onSetForEveryone;
    return (
    <div
      data-testid="reel-view"
      data-mode={props.mode}
      data-idle={String(props.idle)}
      data-owner={String(Boolean(props.isOwner))}
    >
      <button type="button" onClick={props.onClose}>
        Close the view
      </button>
    </div>
    );
  },
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
  clip: { videoAllowed: true, watermark: false, maxSeconds: 60 },
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
  welcomePending = false,
  isOwner = false,
}: {
  items?: GalleryItem[];
  reel?: GalleryReel | null;
  access?: "full" | "teaser";
  queue?: QueueItem[];
  moderated?: boolean;
  welcomePending?: boolean;
  isOwner?: boolean;
} = {}) {
  const payload: GalleryPayload = {
    items,
    teaserTotal: null,
    approvedTotal: items.length,
    reel,
    etag: "e1",
  };
  const galleryPromise = Promise.resolve(payload);
  const tree = (q: QueueItem[], pending = welcomePending) => (
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
          welcomePending={pending}
          isOwner={isOwner}
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
  return {
    ...utils,
    rerenderWith: (q: QueueItem[]) => utils.rerender(tree(q)),
    /** The door reports the visitor through (EntryModal's `onPendingChange(false)`). */
    passWelcome: async () => {
      await act(async () => {
        utils.rerender(tree(queue, false));
      });
    },
  };
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

  it("is absent at one item, and a clip never counts toward the two", async () => {
    await mount({ items: [item(1)] });
    expect(screen.queryByRole("button", { name: /highlight reel/i })).toBeNull();
  });

  it("does not count a clip, a held item or one with nothing to draw", async () => {
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
    await mount({ reel: { ...REEL, clip: null } });
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

describe("the welcome comes first", () => {
  it("?reel waits for the welcome: nothing under it or over it, the address still asks, then the view", async () => {
    window.history.replaceState(null, "", "/e/qr-token?reel");
    const { passWelcome } = await mount({ welcomePending: true });
    await settle();
    expect(screen.queryByTestId("reel-view")).toBeNull();
    expect(window.location.search).toBe("?reel");
    await passWelcome();
    await settle();
    expect(screen.getByTestId("reel-view")).toHaveAttribute("data-mode", "hand");
  });

  it("?reel=screen waits the same way (no special case for a wall)", async () => {
    window.history.replaceState(null, "", "/e/qr-token?reel=screen");
    const { passWelcome } = await mount({ welcomePending: true });
    await settle();
    expect(screen.queryByTestId("reel-view")).toBeNull();
    await passWelcome();
    await settle();
    expect(screen.getByTestId("reel-view")).toHaveAttribute("data-mode", "screen");
  });

  it("the screen's idle state waits too, and so does the answer below the minimum", async () => {
    window.history.replaceState(null, "", "/e/qr-token?reel=screen");
    const idle = await mount({ items: [item(1)], welcomePending: true });
    await settle();
    expect(screen.queryByTestId("reel-view")).toBeNull();
    await idle.passWelcome();
    await settle();
    expect(screen.getByTestId("reel-view")).toHaveAttribute("data-idle", "true");
    idle.unmount();

    // A phone link below the minimum keeps asking while the door stands (the album may grow
    // meanwhile), and is dropped only once the visitor is through and it still cannot play.
    window.history.replaceState(null, "", "/e/qr-token?reel");
    const phone = await mount({ items: [item(1)], welcomePending: true });
    expect(window.location.search).toBe("?reel");
    await phone.passWelcome();
    expect(window.location.search).toBe("");
    expect(screen.queryByTestId("reel-view")).toBeNull();
  });

  it("the owner, who never owes it, gets the reel at once", async () => {
    window.history.replaceState(null, "", "/e/qr-token?reel");
    await mount({ welcomePending: false });
    await settle();
    expect(screen.getByTestId("reel-view")).toHaveAttribute("data-mode", "hand");
  });
});

describe("a screen below two, and the owner's view", () => {
  it("a screen whose album drops under two shows the code alone until the reel returns", async () => {
    window.history.replaceState(null, "", "/e/qr-token?reel=screen");
    await mount();
    await settle();
    expect(screen.getByTestId("reel-view")).toHaveAttribute("data-idle", "false");
    await pollWith([item(1)]);
    await settle();
    expect(screen.getByTestId("reel-view")).toHaveAttribute("data-idle", "true");
    expect(window.location.search).toBe("?reel=screen");
    await pollWith([item(1), item(3)]);
    await settle();
    expect(screen.getByTestId("reel-view")).toHaveAttribute("data-idle", "false");
  });

  it("a phone's view whose album drops under two returns to the plain album", async () => {
    window.history.replaceState(null, "", "/e/qr-token?reel");
    await mount();
    await settle();
    expect(screen.getByTestId("reel-view")).toBeInTheDocument();
    await pollWith([item(1)]);
    expect(screen.queryByTestId("reel-view")).toBeNull();
    expect(window.location.search).toBe("");
  });

  it("the owner's reel counts and plays what a guest sees: approved, visible, reel-eligible", async () => {
    window.history.replaceState(null, "", "/e/qr-token?reel");
    await mount({
      isOwner: true,
      items: [
        item(1),
        item(2, { status: "pending" }),
        item(3, { status: "hidden" }),
        item(4, { reelEligible: false }),
      ],
    });
    await settle();
    // One playable item: the owner gets the plain album, like anyone else.
    expect(screen.queryByTestId("reel-view")).toBeNull();
    expect(screen.queryByRole("button", { name: /highlight reel/i })).toBeNull();
  });

  it("the owner's Close goes back where they came from, when there is somewhere to go", async () => {
    window.history.replaceState(null, "", "/dashboard/event-1");
    window.history.pushState(null, "", "/e/qr-token?reel");
    await mount({ isOwner: true });
    await settle();
    expect(screen.getByTestId("reel-view")).toHaveAttribute("data-owner", "true");
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Close the view" }));
    expect(back).toHaveBeenCalledTimes(1);
    back.mockRestore();
  });

  it("binds the owner's Set for everyone to the event-wide defaults' write, and nobody else's", async () => {
    window.history.replaceState(null, "", "/e/qr-token?reel");
    const owner = await mount({ isOwner: true });
    await settle();
    expect(hooks.setForEveryone).toBeTypeOf("function");
    await expect(
      hooks.setForEveryone!({ styleId: "mono", holdSec: 5 }),
    ).resolves.toBe(true);
    expect(hooks.setReelDefaults).toHaveBeenCalledWith({
      eventId: "event-1",
      styleId: "mono",
      holdSec: 5,
    });
    // A refusal says so to the view.
    hooks.setReelDefaults.mockResolvedValueOnce({ ok: false });
    await expect(
      hooks.setForEveryone!({ styleId: "warm", holdSec: 3 }),
    ).resolves.toBe(false);
    owner.unmount();

    window.history.replaceState(null, "", "/e/qr-token?reel");
    await mount();
    await settle();
    expect(hooks.setForEveryone).toBeUndefined();
  });

  it("with nowhere to go back to, the owner's Close lands on the album", async () => {
    window.history.replaceState(null, "", "/e/qr-token?reel");
    const length = vi.spyOn(window.history, "length", "get").mockReturnValue(1);
    await mount({ isOwner: true });
    await settle();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Close the view" }));
    });
    expect(window.location.search).toBe("");
    expect(screen.queryByTestId("reel-view")).toBeNull();
    length.mockRestore();
  });

  it("a guest's deep link never leaves the page, whatever the history holds", async () => {
    window.history.replaceState(null, "", "/somewhere-else");
    window.history.pushState(null, "", "/e/qr-token?reel");
    await mount();
    await settle();
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Close the view" }));
    });
    expect(back).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
    back.mockRestore();
  });
});

describe("the approval toast", () => {
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

  it("does not count a clip the host approved (it will never be in the reel)", async () => {
    await mount({ moderated: true, queue: [held] });
    await pollWith([item(1), item(2), item(9, { reelEligible: false })]);
    expect(toast).not.toHaveBeenCalled();
  });
});
