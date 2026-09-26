/**
 * ONE LIVE SOURCE FOR THE ALBUM AND THE REEL, ON THE PAGED ALBUM (gallery-live.tsx): the provider
 * holds the album store above the reel. These are the things it adds on top of the store; the rest
 * of its behaviour is pinned in LiveGallery's test file (live-gallery.test.tsx drives the same state
 * through the album).
 *
 * - The seed is adopted with no request: the first real ask is the next poll, carrying the version
 *   and the seed's own validator (so a quiet album answers 304 on its very first poll).
 * - The live reel's facts ride every answer that changed something; a 304 keeps what was known.
 * - THE WATCHDOG, BY ID: a picture failing the way an expired presign does re-mints exactly its own
 *   link, at most once a minute per id, never the album, never in the demo.
 * - A delta that leaves the album a different size than the server counted is reported, then healed
 *   with a fresh manifest before anything is drawn.
 * - The reel's items are the manifest's, with no urls, each saying whether it has a still.
 */
import { Suspense, useEffect } from "react";
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ManifestEntry } from "@/lib/events/album-wire";
import type { GalleryReel } from "@/lib/events/gallery-reel";
import type { GallerySeed } from "@/lib/events/gallery-seed";

const hooks = vi.hoisted(() => ({ refresh: null as (() => void) | null }));
const captureWarning = vi.hoisted(() => vi.fn());

vi.mock("@/app/(guest)/e/[token]/actions", () => ({
  removeMyUploadGuestAction: vi.fn(),
  setRowStepAction: vi.fn(),
}));
vi.mock("@/lib/guest/use-gallery-doorbell", () => ({
  useGalleryDoorbell: (opts: { onRefresh: () => void }) => {
    hooks.refresh = opts.onRefresh;
    return { live: true };
  },
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...args: unknown[]) => captureWarning(...args),
  captureError: vi.fn(),
}));

const { GalleryLiveProvider, useGalleryLive } = await import("./gallery-live");
type Live = NonNullable<ReturnType<typeof useGalleryLive>>;

const REEL: GalleryReel = {
  showReel: true,
  liveReelEnabled: true,
  styleId: null,
  clip: null,
};
const T0 = 1_790_000_000_000_000;
const uuid = (i: number) =>
  `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const entry = (i: number, flags = 4): ManifestEntry => [
  uuid(i),
  640,
  480,
  flags,
  T0 - i,
];

function seed(): GallerySeed {
  return {
    kind: "full",
    sync: {
      ok: true,
      kind: "manifest",
      access: "full",
      gate: null,
      v: 10,
      attr: 1,
      // A photo, a video with a poster, and a video with none (never drawable).
      entries: [entry(1), entry(2, 1 | 2 | 4), entry(3, 1 | 4)],
      next: null,
      total: 3,
      reel: REEL,
    },
    etag: '"a1-seed"',
    links: {
      ok: true,
      access: "full",
      gate: null,
      b: Math.floor(Date.now() / 1_800_000),
      now: Date.now(),
      links: [[uuid(1), "https://r2.test/t/1", null, "d1", null]],
      missing: [],
    },
  };
}

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
  const promise = Promise.resolve(seed());
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
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

type Answer = Record<string, unknown> | 304;
type Reply = {
  status: number;
  ok: boolean;
  headers: { get: (name: string) => string | null };
  json?: () => Promise<unknown>;
};
const calls: {
  url: string;
  body: Record<string, unknown>;
  headers: Record<string, string>;
}[] = [];
/**
 * ★ ONE fetch MOCK FOR THE PROVIDER'S LIFE, ITS ANSWER SWAPPED IN PLACE. The album's transport reads
 * `fetch` once, when the store is built, so a test that assigned a fresh mock after mounting would be
 * answering a function nobody calls any more.
 */
let current: Answer | (() => Answer) = 304;
function answer(sync: Answer | (() => Answer)) {
  calls.length = 0;
  current = sync;
}
async function handle(
  url: string,
  init: { body?: string; headers?: Record<string, string> } = {},
): Promise<Reply> {
  const body = JSON.parse(init.body ?? "{}");
  calls.push({ url, body, headers: init.headers ?? {} });
  if (url === "/api/album/guest/media") {
    return {
      status: 200,
      ok: true,
      headers: { get: () => null },
      json: async () => ({
        ok: true,
        access: "full",
        gate: null,
        b: Math.floor(Date.now() / 1_800_000),
        now: Date.now(),
        links: (body.ids as string[]).map((id) => [
          id,
          `https://r2.test/fresh/${id}`,
          null,
          "d",
          null,
        ]),
        missing: [],
      }),
    };
  }
  const a = typeof current === "function" ? current() : current;
  return a === 304
    ? { status: 304, ok: false, headers: { get: () => null } }
    : {
        status: 200,
        ok: true,
        headers: { get: () => '"a1-next"' },
        json: async () => a,
      };
}

async function ring() {
  await act(async () => {
    hooks.refresh?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const delta = (extra: Record<string, unknown> = {}) => ({
  ok: true,
  kind: "delta",
  access: "full",
  gate: null,
  v: 11,
  attr: 1,
  upsert: [],
  remove: [],
  total: 3,
  reel: REEL,
  ...extra,
});

beforeEach(() => {
  seen.live = null;
  captureWarning.mockClear();
  global.fetch = vi.fn(handle) as unknown as typeof fetch;
  answer(304);
});

describe("the seed", () => {
  it("is adopted with no request, and the first poll carries its version and validator", async () => {
    await mount();
    expect(calls).toHaveLength(0);
    expect(seen.live?.items.map((m) => m.id)).toEqual([
      uuid(1),
      uuid(2),
      uuid(3),
    ]);
    await ring();
    const sync = calls.find((c) => c.url === "/api/album/guest/sync")!;
    expect(sync.body).toMatchObject({ qr_token: "qr-token", since: 10 });
    expect(sync.headers["If-None-Match"]).toBe('"a1-seed"');
  });

  it("a quiet album's 304 changes nothing", async () => {
    await mount();
    const before = seen.live!.items;
    await ring();
    expect(seen.live!.items).toBe(before);
  });
});

describe("the live reel's facts", () => {
  it("adopt what an answer that changed something says (a host turning the reel off reaches an open page)", async () => {
    await mount();
    expect(seen.live?.reel).toEqual(REEL);
    answer(delta({ reel: { ...REEL, showReel: false } }));
    await ring();
    expect(seen.live?.reel?.showReel).toBe(false);
  });

  it("the reel's items are the manifest's, with no urls, each saying whether it has a still", async () => {
    await mount();
    expect(seen.live?.reelItems.map((m) => [m.id, m.url, m.drawable])).toEqual([
      [uuid(1), "", true],
      [uuid(2), "", true],
      [uuid(3), "", false],
    ]);
  });
});

describe("the watchdog (a presign that may have expired), by id", () => {
  it("re-mints exactly the failing ids' links, never the album", async () => {
    await mount();
    answer(304);
    await act(async () => {
      seen.live!.reportPossibleExpiry([uuid(1)]);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const media = calls.filter((c) => c.url === "/api/album/guest/media");
    expect(media).toHaveLength(1);
    expect(media[0].body.ids).toEqual([uuid(1)]);
    expect(calls.some((c) => c.url === "/api/album/guest/sync")).toBe(false);
    // The fresh link is what the album draws now.
    expect(seen.live?.items[0].url).toBe(`https://r2.test/fresh/${uuid(1)}`);
  });

  it("asks at most once a minute per id, however many times its picture fails", async () => {
    await mount();
    answer(304);
    const now = vi.spyOn(Date, "now");
    now.mockReturnValue(1_000_000);
    await act(async () => {
      for (let i = 0; i < 20; i++) seen.live!.reportPossibleExpiry([uuid(1)]);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const media = () => calls.filter((c) => c.url === "/api/album/guest/media");
    expect(media()).toHaveLength(1);
    now.mockReturnValue(1_000_000 + 30_000);
    await act(async () => {
      seen.live!.reportPossibleExpiry([uuid(1)]);
      // Another id is its own: it goes at once.
      seen.live!.reportPossibleExpiry([uuid(2)]);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(media()).toHaveLength(2);
    expect(media()[1].body.ids).toEqual([uuid(2)]);
    now.mockReturnValue(1_000_000 + 61_000);
    await act(async () => {
      seen.live!.reportPossibleExpiry([uuid(1)]);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(media()).toHaveLength(3);
    now.mockRestore();
  });

  it("stays quiet in the demo, whose album never polls", async () => {
    await mount(true);
    answer(304);
    await act(async () => {
      seen.live!.reportPossibleExpiry([uuid(1)]);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(calls).toHaveLength(0);
  });
});

describe("integrity", () => {
  it("a delta that leaves the album a different size than counted is reported, and healed with a manifest", async () => {
    await mount();
    let asks = 0;
    answer(() => {
      asks += 1;
      // The first answer claims 5 photographs after a delta that adds one: a lost change.
      return asks === 1
        ? delta({ upsert: [entry(0)], total: 5 })
        : {
            ok: true,
            kind: "manifest",
            access: "full",
            gate: null,
            v: 12,
            attr: 1,
            entries: [entry(0), entry(1), entry(2), entry(3), entry(4)],
            next: null,
            total: 5,
            reel: REEL,
          };
    });
    await ring();
    expect(captureWarning).toHaveBeenCalledWith(
      "media",
      "album: a delta left the album a different size than counted",
      { holds: 4, counted: 5, version: 11 },
    );
    expect(seen.live?.items).toHaveLength(5);
  });
});
