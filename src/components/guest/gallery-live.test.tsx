/**
 * ONE LIVE SOURCE FOR THE ALBUM AND THE REEL (gallery-live.tsx): the provider holds LiveGallery's
 * state above the reel, and these are the two things it adds. The rest of its behaviour is pinned
 * in LiveGallery's test file (live-gallery.test.tsx drives the same state through the album).
 *
 * - The live reel's facts ride every poll's 200: a host turning the reel off reaches an open page.
 * - THE WATCHDOG: an image or reader failing the way an expired presign does drops the validator and
 *   forces ONE full refetch, and never more than one a minute however many images fail at once.
 */
import { Suspense, useEffect } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GalleryItem, GalleryReel } from "@/lib/events/gallery-reel";

const hooks = vi.hoisted(() => ({ refresh: null as (() => void) | null }));

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

const { GalleryLiveProvider, useGalleryLive } = await import("./gallery-live");
type Live = NonNullable<ReturnType<typeof useGalleryLive>>;

const REEL: GalleryReel = {
  showReel: true,
  liveReelEnabled: true,
  styleId: null,
  cut: null,
};

const item = (i: number): GalleryItem => ({
  id: `m${i}`,
  type: "photo",
  url: `https://r2.test/o/${i}.jpg`,
  previewUrl: `https://r2.test/p/${i}.webp`,
  status: "approved",
});

/** What the provider hands its children, captured after each commit. */
const seen: { live: Live | null } = { live: null };
function Probe() {
  const live = useGalleryLive();
  useEffect(() => {
    seen.live = live;
  });
  return null;
}

async function mount(isDemo = false) {
  const promise = Promise.resolve({
    items: [item(1), item(2)],
    teaserTotal: null,
    approvedTotal: 2,
    reel: REEL,
    etag: '"g6-seed"',
  });
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <GalleryLiveProvider
          galleryPromise={promise}
          qrToken="qr-token"
          access="full"
          isDemo={isDemo}
        >
          <Probe />
        </GalleryLiveProvider>
      </Suspense>,
    );
    await promise;
  });
}

function answer(body: Record<string, unknown> | null) {
  const fetchMock = vi.fn(async () =>
    body === null
      ? ({ status: 304, ok: false, headers: { get: () => null } } as unknown)
      : {
          status: 200,
          ok: true,
          headers: { get: () => '"g6-next"' },
          json: async () => body,
        },
  );
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

beforeEach(() => {
  seen.live = null;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the live reel's facts", () => {
  it("adopt what every poll's 200 says (a host turning the reel off reaches an open page)", async () => {
    await mount();
    expect(seen.live?.reel).toEqual(REEL);
    answer({
      ok: true,
      items: [item(1), item(2)],
      access: "full",
      gate: null,
      approvedTotal: 2,
      reel: { ...REEL, showReel: false },
    });
    await act(async () => {
      hooks.refresh?.();
    });
    expect(seen.live?.reel?.showReel).toBe(false);
  });

  it("keep what they knew when an older server's payload says nothing of them", async () => {
    await mount();
    answer({
      ok: true,
      items: [item(1), item(2), item(3)],
      access: "full",
      gate: null,
      approvedTotal: 3,
    });
    await act(async () => {
      hooks.refresh?.();
    });
    expect(seen.live?.reel).toEqual(REEL);
    expect(seen.live?.serverItems).toHaveLength(3);
    // And the newcomer is an arrival, which is what names it in the reel.
    expect(seen.live?.arrivals).toEqual(["m3"]);
  });
});

describe("the watchdog (a presign that may have expired)", () => {
  it("drops the validator and forces one full refetch", async () => {
    await mount();
    const fetchMock = answer({
      ok: true,
      items: [item(1), item(2)],
      access: "full",
      gate: null,
      approvedTotal: 2,
    });
    await act(async () => {
      seen.live!.reportPossibleExpiry();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = (fetchMock.mock.calls[0] as unknown[])[1] as {
      headers: Record<string, string>;
    };
    // No If-None-Match: the answer must be fresh presigns, never a 304.
    expect(init.headers["If-None-Match"]).toBeUndefined();
  });

  it("asks at most once a minute, however many images fail at once", async () => {
    await mount();
    const fetchMock = answer({
      ok: true,
      items: [item(1), item(2)],
      access: "full",
      gate: null,
      approvedTotal: 2,
    });
    const now = vi.spyOn(Date, "now");
    now.mockReturnValue(1_000_000);
    await act(async () => {
      for (let i = 0; i < 20; i++) seen.live!.reportPossibleExpiry();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    now.mockReturnValue(1_000_000 + 30_000);
    await act(async () => {
      seen.live!.reportPossibleExpiry();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    now.mockReturnValue(1_000_000 + 61_000);
    await act(async () => {
      seen.live!.reportPossibleExpiry();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    now.mockRestore();
  });

  it("stays quiet in the demo, whose album never polls", async () => {
    await mount(true);
    const fetchMock = answer(null);
    await act(async () => {
      seen.live!.reportPossibleExpiry();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
