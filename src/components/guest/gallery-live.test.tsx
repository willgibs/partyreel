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
 * - A real empty album's first photograph arrives; the album that opens under a mounted provider does not.
 * - A seed that FAILED leaves the source standing: reported, then read by the store's own first sync, and healed by
 *   the next answer with no refresh, while the album says it could not load.
 */
import {
  Component,
  createRef,
  Suspense,
  useEffect,
  type ReactNode,
  type RefObject,
} from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ManifestEntry } from "@/lib/events/album-wire";
import type { GalleryReel } from "@/lib/events/gallery-reel";
import type { GallerySeed } from "@/lib/events/gallery-seed";

const hooks = vi.hoisted(() => ({ refresh: null as (() => void) | null }));
const captureWarning = vi.hoisted(() => vi.fn());
const captureError = vi.hoisted(() => vi.fn());

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
  captureError: (...args: unknown[]) => captureError(...args),
}));

const { albumCountWords, GalleryLiveProvider, useGalleryLive } =
  await import("./gallery-live");
type LiveGalleryHandle = import("./gallery-live").LiveGalleryHandle;
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

/** A full album's seed with these entries and nothing linked (an empty album's, or any other). */
function seedOf(entries: ManifestEntry[]): GallerySeed {
  const full = seed() as Extract<GallerySeed, { kind: "full" }>;
  return {
    ...full,
    sync: { ...full.sync, entries, total: entries.length },
    links: { ...full.links, links: [] },
  };
}

/** A viewer still at the door: the teaser's answer, which carries no entries by design. */
function teaserSeed(): GallerySeed {
  return {
    kind: "teaser",
    sync: {
      ok: true,
      kind: "teaser",
      access: "teaser",
      gate: "account",
      items: [],
      teaserTotal: 0,
      approvedTotal: 2,
    },
    etag: '"t1-seed"',
  };
}

/** A seed whose read failed (not a refusal, which answers locked), as the page streams it: already handled. */
function failedSeed(digest = "1234567"): Promise<GallerySeed> {
  const seed = Promise.reject(
    Object.assign(new Error("read failed: relation media timed out"), {
      digest,
    }),
  );
  seed.catch(() => {});
  return seed;
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

/**
 * ★ THE ALBUM'S WINDOW, AS THE GRID ASKS (`album-window.tsx`'s `onWindowChange` -> `ensureLinks`): when the ids it mounts
 * change, it asks for their links. Opt-in (`mount`'s `window`), since a window asks for what no seed has linked.
 */
function WindowProbe({ size }: { size: number }) {
  const live = useGalleryLive();
  const ids = live
    ? live.items
        .slice(0, size)
        .map((m) => m.id)
        .join(",")
    : "";
  const ensure = live?.ensureLinks;
  // A macrotask after the commit, as the grid's own report follows its layout: never before the store has adopted its seed.
  useEffect(() => {
    if (!ids || !ensure) return;
    const timer = setTimeout(() => ensure(ids.split(",")), 0);
    return () => clearTimeout(timer);
  }, [ids, ensure]);
  return null;
}

/** Whatever the provider throws, kept here rather than taking the test down (a failed seed used to throw). */
const thrown: { error: unknown } = { error: null };
class Catch extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    thrown.error = error;
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * ★ THE SEED AS THE PAGE REALLY HANDS IT (crumbs-30's own local walk): React Flight decodes the page's promise into a
 * thenable whose `then` registers its listeners and returns NOTHING, so nothing chains off it. A test on a native
 * promise chains fine and proves nothing about the page; this is the shape the page's `galleryPromise` has.
 */
function flight<T>(from: Promise<T>): PromiseLike<T> {
  return {
    then(resolve, reject) {
      void from.then(resolve, reject);
      return undefined as never;
    },
  };
}

async function mount(
  isDemo = false,
  {
    first = seed(),
    access = "full",
    onCountChange,
    onCountWordsChange,
    onDevelopsAtChange,
    onWaitingChange,
    handle,
    window: windowSize,
  }: {
    first?: GallerySeed | PromiseLike<GallerySeed>;
    access?: "full" | "teaser";
    /** Mount a window of this many tiles over the album, asking for its links as the grid does. */
    window?: number;
    onCountChange?: (count: number) => void;
    onCountWordsChange?: (words: string) => void;
    onDevelopsAtChange?: (developsAt: string | null) => void;
    onWaitingChange?: (waits: boolean) => void;
    handle?: RefObject<LiveGalleryHandle | null>;
  } = {},
) {
  const promise = (
    typeof (first as PromiseLike<GallerySeed>).then === "function"
      ? first
      : Promise.resolve(first)
  ) as Promise<GallerySeed>;
  await act(async () => {
    render(
      <Catch>
        <Suspense fallback={null}>
          <GalleryLiveProvider
            ref={handle}
            galleryPromise={promise}
            qrToken="qr-token"
            access={access}
            isDemo={isDemo}
            onCountChange={onCountChange}
            onCountWordsChange={onCountWordsChange}
            onDevelopsAtChange={onDevelopsAtChange}
            onWaitingChange={onWaitingChange}
          >
            <Probe />
            {windowSize ? <WindowProbe size={windowSize} /> : null}
          </GalleryLiveProvider>
        </Suspense>
      </Catch>,
    );
    await Promise.resolve(promise).catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/** The whole album as the sync route answers a first ask, or a resync. */
const manifest = (entries: ManifestEntry[], v = 12) => ({
  ok: true,
  kind: "manifest",
  access: "full",
  gate: null,
  v,
  attr: 1,
  entries,
  next: null,
  total: entries.length,
  reel: REEL,
});

type Answer = Record<string, unknown> | 304 | 500;
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
  if (a === 500)
    return { status: 500, ok: false, headers: { get: () => null } };
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
  thrown.error = null;
  captureWarning.mockClear();
  captureError.mockClear();
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

describe("the arrival: what was not on screen a moment ago (crumbs-30)", () => {
  it("★ a real empty album's first photograph arrives for a guest, as on the host's grid", async () => {
    await mount(false, { first: seedOf([]) });
    expect(seen.live?.items).toEqual([]);
    expect(seen.live?.arrivals).toEqual([]);
    answer(delta({ upsert: [entry(7)], total: 1 }));
    await ring();
    expect(seen.live?.items.map((m) => m.id)).toEqual([uuid(7)]);
    expect(seen.live?.arrivals).toEqual([uuid(7)]);
  });

  it("the album that opens under a mounted provider is not an arrival (a teaser's answer, then the whole album)", async () => {
    await mount(false, { first: teaserSeed(), access: "teaser" });
    answer(manifest([entry(1), entry(2)]));
    await ring();
    // It opened, and nothing of it arrived: a teaser's answer carries no entries by design.
    expect(seen.live?.items.map((m) => m.id)).toEqual([uuid(1), uuid(2)]);
    expect(seen.live?.arrivals).toEqual([]);
  });
});

describe("the seed as React Flight hands it (crumbs-30)", () => {
  it("★ is read from a thenable that chains nothing: the album draws from it, with no request", async () => {
    await mount(false, { first: flight(Promise.resolve(seed())) });
    expect(thrown.error).toBeNull();
    expect(seen.live?.albumRead).toBe("ready");
    expect(seen.live?.items.map((m) => m.id)).toEqual([
      uuid(1),
      uuid(2),
      uuid(3),
    ]);
    expect(calls).toHaveLength(0);
  });

  it("★ and a failed one is read too: the source stands and reads the album itself", async () => {
    answer(manifest([entry(8)]));
    await mount(false, { first: flight(failedSeed()) });
    expect(thrown.error).toBeNull();
    expect(seen.live?.albumRead).toBe("ready");
    expect(seen.live?.items.map((m) => m.id)).toEqual([uuid(8)]);
  });
});

describe("a seed that failed (crumbs-30, from crumbs-28)", () => {
  it("★ the live source stands, reports the failure, and reads the album with its own first sync, healed with no refresh", async () => {
    answer(manifest([entry(1), entry(2)]));
    await mount(false, { first: failedSeed() });
    // Standing: her uploads list, the reel and the door's light all read it.
    expect(thrown.error).toBeNull();
    expect(seen.live).not.toBeNull();
    expect(captureError).toHaveBeenCalledWith(
      "render:guest",
      expect.any(Error),
      expect.objectContaining({ digest: "1234567", seam: "album" }),
    );
    // Nothing was embedded to answer it locally: the first sync asked the server for the whole album.
    const first = calls.find((c) => c.url === "/api/album/guest/sync");
    expect(first?.body).not.toHaveProperty("since");
    expect(first?.headers["If-None-Match"]).toBeUndefined();
    expect(seen.live?.albumRead).toBe("ready");
    expect(seen.live?.items.map((m) => m.id)).toEqual([uuid(1), uuid(2)]);
    // The album appearing is not an arrival.
    expect(seen.live?.arrivals).toEqual([]);
  });

  it("★ while its own read fails too, the album says so, and the next poll heals it with no refresh", async () => {
    answer(500);
    await mount(false, { first: failedSeed() });
    expect(seen.live?.albumRead).toBe("failed");
    expect(seen.live?.items).toEqual([]);
    answer(manifest([entry(3)]));
    await ring();
    expect(seen.live?.albumRead).toBe("ready");
    expect(seen.live?.items.map((m) => m.id)).toEqual([uuid(3)]);
    expect(seen.live?.arrivals).toEqual([]);
    // Reported once, for the seed: a sync that fails is the poll's to retry, never a second report.
    expect(captureError).toHaveBeenCalledTimes(1);
  });

  it("is still reading while its own first sync is in flight: not failed until that read has failed too", async () => {
    let land: (body: Record<string, unknown>) => void = () => {};
    // The server's answer, held until the test lets it land.
    answer(
      () =>
        new Promise<Record<string, unknown>>((resolve) => {
          land = resolve;
        }) as unknown as Answer,
    );
    await mount(false, { first: failedSeed() });
    expect(seen.live?.albumRead).toBe("trying");
    await act(async () => {
      land(manifest([entry(5)]));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(seen.live?.albumRead).toBe("ready");
    expect(seen.live?.items.map((m) => m.id)).toEqual([uuid(5)]);
  });

  it("Try again is the store's own sync: the album is read again, with no page refresh", async () => {
    answer(500);
    await mount(false, { first: failedSeed() });
    expect(seen.live?.albumRead).toBe("failed");
    answer(manifest([entry(4)]));
    await act(async () => {
      await seen.live!.retryAlbum();
    });
    expect(seen.live?.albumRead).toBe("ready");
    expect(seen.live?.items.map((m) => m.id)).toEqual([uuid(4)]);
  });

  it("the header keeps the page's count until an answer lands", async () => {
    const onCountChange = vi.fn();
    answer(500);
    await mount(false, { first: failedSeed(), onCountChange });
    // Not zero: the album is unread, not empty.
    expect(onCountChange).not.toHaveBeenCalled();
    answer(manifest([entry(3), entry(4)]));
    await ring();
    expect(onCountChange).toHaveBeenLastCalledWith(2);
  });

  it("never takes Next's own navigation throw for a failed read: a notFound() passes to its boundary, unreported", async () => {
    await mount(false, { first: failedSeed("NEXT_HTTP_ERROR_FALLBACK;404") });
    expect((thrown.error as { digest?: string } | null)?.digest).toBe(
      "NEXT_HTTP_ERROR_FALLBACK;404",
    );
    expect(captureError).not.toHaveBeenCalled();
  });
});

/**
 * ★ WHEN THE ALBUM DEVELOPS, AS ITS SYNC SAYS IT (red-team 44's LOW): the page read whether what she adds waits once, at
 * render, so after a develop (Develop now, or the time passing) an open page kept promising one ("Uploads appear in the
 * album when it develops, ...") over the developed album, and would have kept her next upload out of it. Every full
 * sync carries the album's develop time (`waiting.developsAt`, ahead or reached, or no `waiting` where the album has none
 * and nothing waits): the source tells the page each new word of it, and only a new one.
 */
describe("when the album develops, told to the page", () => {
  const AHEAD = "2026-10-04T02:00:00.000Z";
  const NOW = "2026-10-03T03:17:46.000Z";
  const developing = (developsAt: string | null) => {
    const full = seed() as Extract<GallerySeed, { kind: "full" }>;
    return {
      ...full,
      sync: { ...full.sync, waiting: { count: 2, minutes: [], developsAt } },
    } as GallerySeed;
  };

  it("★ tells the develop time the seed carries, then a Develop now's, and nothing for a 304", async () => {
    const told = vi.fn();
    await mount(false, { first: developing(AHEAD), onDevelopsAtChange: told });
    expect(told.mock.calls).toEqual([[AHEAD]]);
    await ring();
    expect(told.mock.calls).toEqual([[AHEAD]]);
    answer(delta({ waiting: { count: 0, minutes: [], developsAt: NOW } }));
    await ring();
    expect(told.mock.calls).toEqual([[AHEAD], [NOW]]);
    // The same word again is no news.
    answer(
      delta({ v: 13, waiting: { count: 0, minutes: [], developsAt: NOW } }),
    );
    await ring();
    expect(told.mock.calls).toEqual([[AHEAD], [NOW]]);
  });

  it("tells none once a full sync carries no develop time (Right away, nothing waiting)", async () => {
    const told = vi.fn();
    await mount(false, { first: developing(AHEAD), onDevelopsAtChange: told });
    answer(delta());
    await ring();
    expect(told).toHaveBeenLastCalledWith(null);
  });

  it("says nothing from a teaser's answer, which is no album's word on its develop", async () => {
    const told = vi.fn();
    await mount(false, {
      first: teaserSeed(),
      access: "teaser",
      onDevelopsAtChange: told,
    });
    expect(told).not.toHaveBeenCalled();
  });
});

/**
 * ★ WHAT WAITS REACHES THE PAGE (the-wait r1, Will's `wait=sheet`; crumbs-52's deferred line, retired here): the sync's
 * waiting facts (everyone's held and sealed rows, as a count and its minutes, never an id) ride the live source from
 * the seed's first paint and every full answer after it, so the album's contact sheet draws everyone's for a guest with
 * none of her own; a teaser never carries them.
 */
describe("what waits, as numbers, on the live source", () => {
  const WAITING = {
    count: 3,
    minutes: [
      [1_790_000_040_000, 1],
      [1_790_000_100_000, 2],
    ] as [number, number][],
    developsAt: "2026-10-11T16:00:00.000Z",
  };
  const waitingSeed = () => {
    const full = seed() as Extract<GallerySeed, { kind: "full" }>;
    return {
      ...full,
      sync: { ...full.sync, waiting: WAITING },
    } as GallerySeed;
  };

  it("★ is the seed's from the first paint, and carries no id of anything that waits", async () => {
    await mount(false, { first: waitingSeed() });
    expect(seen.live?.waiting).toEqual(WAITING);
    // Nothing that waits is an item: the album holds only what a guest sees.
    expect(seen.live?.items.map((m) => m.id)).toEqual([
      uuid(1),
      uuid(2),
      uuid(3),
    ]);
    expect(JSON.stringify(seen.live?.waiting)).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-/,
    );
  });

  it("follows each full answer: the count climbs, and an answer with none says nothing waits", async () => {
    await mount(false, { first: waitingSeed() });
    answer(delta({ waiting: { ...WAITING, count: 4 } }));
    await ring();
    expect(seen.live?.waiting?.count).toBe(4);
    answer(304);
    await ring();
    expect(seen.live?.waiting?.count).toBe(4);
    answer(delta({ v: 14 }));
    await ring();
    expect(seen.live?.waiting).toBeNull();
  });

  it("a teaser carries none", async () => {
    await mount(false, { first: teaserSeed(), access: "teaser" });
    expect(seen.live?.waiting ?? null).toBeNull();
  });

  /* ★ WHETHER ANYTHING WAITS, TOLD TO THE PAGE (crumbs-61, red-team 48's NIT): a guest who joined an empty album kept the
     cover's "Take the first photo" over her own sheet of developing shots, since the page's word on whether anything
     waits was the server's at render. The source tells it each change of it (the seed's word at mount, then each full
     answer's), and never the count: at a busy party the count climbs every beat, and the page re-renders on a flip alone. */
  it("★ tells the page each change of whether anything waits, and never each count", async () => {
    const told = vi.fn();
    await mount(false, { onWaitingChange: told });
    // An album with nothing waiting says nothing: the page's own word starts as none.
    expect(told).not.toHaveBeenCalled();
    answer(delta({ waiting: { ...WAITING, count: 1 } }));
    await ring();
    expect(told.mock.calls).toEqual([[true]]);
    // The count climbing is no news; the album that develops (nothing waits) is.
    answer(delta({ v: 12, waiting: { ...WAITING, count: 5 } }));
    await ring();
    answer(delta({ v: 13, waiting: { ...WAITING, count: 9 } }));
    await ring();
    expect(told.mock.calls).toEqual([[true]]);
    answer(delta({ v: 14 }));
    await ring();
    expect(told.mock.calls).toEqual([[true], [false]]);
  });

  it("tells a seed that already says something waits at mount, and a 304's silence changes nothing", async () => {
    const told = vi.fn();
    await mount(false, { first: waitingSeed(), onWaitingChange: told });
    expect(told.mock.calls).toEqual([[true]]);
    answer(304);
    await ring();
    expect(told.mock.calls).toEqual([[true]]);
  });

  it("a teaser has no word on what waits, so it tells none", async () => {
    const told = vi.fn();
    await mount(false, {
      first: teaserSeed(),
      access: "teaser",
      onWaitingChange: told,
    });
    expect(told).not.toHaveBeenCalled();
  });
});

/**
 * ★ THE GUEST'S COUNT NAMES WHAT THE ALBUM HOLDS (crumbs-61, red-team 48's NIT): the album's line said "12 photos & videos"
 * over twelve photographs, where the host's Download panel said "12 photos" (`setNoun`, crumbs-57's). Where the source can
 * see into the album (a full answer: the manifest is the whole album) its count is worded by the kinds it holds, from that
 * one home; where it cannot (a teaser's nine, a lock) it says both, as it always has, since a lone "photo" would lie when
 * the one item is a video. The words always name exactly the number the header shows.
 */
describe("★ the count names what the album holds", () => {
  const photo = (i: number): ManifestEntry => entry(i);
  const video = (i: number): ManifestEntry => entry(i, 1 | 4);

  it("photographs only: photos, never 'photos & videos'", async () => {
    await mount(false, { first: seedOf([photo(1), photo(2), photo(3)]) });
    expect(seen.live?.count).toBe(3);
    expect(seen.live?.countWords).toBe("3 photos");
  });

  it("a lone item is named by what it is: '1 photo', '1 video'", async () => {
    await mount(false, { first: seedOf([photo(1)]) });
    expect(seen.live?.countWords).toBe("1 photo");
    cleanup();
    await mount(false, { first: seedOf([video(1)]) });
    expect(seen.live?.countWords).toBe("1 video");
  });

  it("videos only: videos; both kinds: photos & videos, counted together", async () => {
    await mount(false, { first: seedOf([video(1), video(2)]) });
    expect(seen.live?.countWords).toBe("2 videos");
    cleanup();
    await mount(false, { first: seedOf([photo(1), video(2), photo(3)]) });
    expect(seen.live?.countWords).toBe("3 photos & videos");
  });

  it("★ follows the album: a video arriving turns 'photos' into 'photos & videos', and its removal turns it back", async () => {
    const told = vi.fn();
    await mount(false, {
      first: seedOf([photo(1), photo(2)]),
      onCountWordsChange: told,
    });
    expect(seen.live?.countWords).toBe("2 photos");
    expect(told).toHaveBeenLastCalledWith("2 photos");
    answer(delta({ v: 11, upsert: [video(9)], total: 3 }));
    await ring();
    expect(seen.live?.countWords).toBe("3 photos & videos");
    expect(told).toHaveBeenLastCalledWith("3 photos & videos");
    answer(delta({ v: 12, remove: [uuid(9)], total: 2 }));
    await ring();
    expect(seen.live?.countWords).toBe("2 photos");
    expect(told).toHaveBeenLastCalledWith("2 photos");
  });

  it("her own landing counts as the kind it is, the moment it lands", async () => {
    const handle = createRef<LiveGalleryHandle>();
    await mount(false, { first: seedOf([photo(1)]), handle });
    answer(304);
    await act(async () => {
      handle.current!.notifyUploaded({
        mediaId: uuid(9),
        queueId: "q-9",
        file: new File(["x"], "mine.mp4", { type: "video/mp4" }),
        kind: "video",
        status: "approved",
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(seen.live?.count).toBe(2);
    expect(seen.live?.countWords).toBe("2 photos & videos");
  });

  it("a teaser cannot see into its count: both nouns, never a guess at one", async () => {
    await mount(false, { first: teaserSeed(), access: "teaser" });
    expect(seen.live?.count).toBe(2);
    expect(seen.live?.countWords).toBe("2 photos & videos");
  });

  it("the words name exactly the count they stand beside: kinds that do not add up to it say both nouns", () => {
    expect(
      albumCountWords({ count: 12, kinds: { photos: 12, videos: 0 } }),
    ).toBe("12 photos");
    expect(
      albumCountWords({ count: 13, kinds: { photos: 12, videos: 0 } }),
    ).toBe("13 photos & videos");
    expect(albumCountWords({ count: 1, kinds: null })).toBe("1 photo or video");
    expect(albumCountWords({ count: 1_249, kinds: null })).toBe(
      "1,249 photos & videos",
    );
  });
});

/**
 * ★ THE ALBUM, CALMED (album-calm, Will's yes of 2026-10-03). Another guest's photographs reach this album in batches
 * (the doorbell's clock, `use-gallery-doorbell.test.tsx`); what this source adds on top: a batch arrives in ONE call,
 * its links riding the delta; her own upload never waits for the clock; and a tab that was hidden for hours comes
 * back right with one sync at once, its arrivals linked, its aged window re-minted and what waits counted anew.
 */
describe("★ the album, calmed", () => {
  const carried = (i: number) => [
    uuid(i),
    `https://r2.test/carried/${i}`,
    null,
    `https://r2.test/carried/${i}/dl`,
    ["Maya", 0],
  ];
  const carrying = (ids: number[]) => ({
    b: Math.floor(Date.now() / 1_800_000),
    now: Date.now(),
    links: ids.map(carried),
  });
  const media = () => calls.filter((c) => c.url === "/api/album/guest/media");
  const syncs = () => calls.filter((c) => c.url === "/api/album/guest/sync");

  function setHidden(hidden: boolean) {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => hidden,
    });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => (hidden ? "hidden" : "visible"),
    });
  }
  async function visibility(hidden: boolean) {
    await act(async () => {
      setHidden(hidden);
      document.dispatchEvent(new Event("visibilitychange"));
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
  async function window_(ids: string[]) {
    await act(async () => {
      seen.live!.ensureLinks(ids);
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  it("★ a batch arrives in one call: the delta's own links draw it, and the links route is never asked for them", async () => {
    await mount();
    // Two photographs newer than everything the album holds.
    const fresh = (i: number): ManifestEntry => [uuid(i), 640, 480, 4, T0 + i];
    answer(
      delta({
        upsert: [fresh(20), fresh(21)],
        total: 5,
        links: carrying([20, 21]),
      }),
    );
    await ring();
    expect([...(seen.live?.arrivals ?? [])].sort()).toEqual([
      uuid(20),
      uuid(21),
    ]);
    // The arrival gate and the window ask for the batch's links, as they always have.
    await window_([uuid(21), uuid(20)]);
    expect(media()).toHaveLength(0);
    expect(syncs()).toHaveLength(1);
    const byId = new Map(seen.live!.items.map((m) => [m.id, m]));
    expect(byId.get(uuid(20))?.url).toBe("https://r2.test/carried/20");
    expect(byId.get(uuid(21))?.url).toBe("https://r2.test/carried/21");
  });

  it("★ her own upload lands at once: its tile, and a sync with no wait for the batch clock", async () => {
    const handle = createRef<LiveGalleryHandle>();
    await mount(false, { handle });
    answer(304);
    await act(async () => {
      handle.current!.notifyUploaded({
        mediaId: uuid(9),
        queueId: "q-9",
        file: new File(["x"], "mine.jpg", { type: "image/jpeg" }),
        kind: "photo",
        status: "approved",
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(seen.live?.items[0].id).toBe(uuid(9));
    expect(syncs()).toHaveLength(1);
  });

  /* ★ HER OWN UPLOAD MINTS ITS LINK ONCE (crumbs-61, red-team 48's LOW). Her photograph is in the grid the moment it lands
     (the optimistic tile), so the window asked the links route for its link ~10 ms after her sync began, while that sync's
     delta carries the very same link (album-calm): twenty photographs cost forty links calls, ten of them for links the
     deltas already held. An ask for a link the album's next answer is about to carry waits for that answer, and then asks,
     which the carry answers itself: one link for one photograph. */
  describe("★ her own upload mints its link once", () => {
    const fresh = (i: number): ManifestEntry => [uuid(i), 640, 480, 4, T0 + i];
    type Upload = Parameters<LiveGalleryHandle["notifyUploaded"]>[0];
    const own = (i: number): Upload => ({
      mediaId: uuid(i),
      queueId: `q-${i}`,
      file: new File(["x"], `${i}.jpg`, { type: "image/jpeg" }),
      kind: "photo",
      status: "approved",
    });
    const asked = (log = calls) =>
      log
        .filter((c) => c.url === "/api/album/guest/media")
        .flatMap((c) => c.body.ids as string[]);
    /** A sync answer that takes a network's while (the ledger's: ~400 ms), so the window asks before it lands. */
    const slow =
      (body: Record<string, unknown>, ms = 25) =>
      () =>
        new Promise<Record<string, unknown>>((resolve) =>
          setTimeout(() => resolve(body), ms),
        ) as unknown as Answer;
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    /** The album as the page seeded it (nothing linked), with its window mounted and its first ask for links answered. */
    async function windowed(handle: RefObject<LiveGalleryHandle | null>) {
      await mount(false, {
        handle,
        window: 8,
        first: seedOf([fresh(1), fresh(2)]),
      });
      await act(async () => {
        await sleep(20);
      });
      expect(asked()).toEqual([uuid(1), uuid(2)]);
    }
    /** Her upload completes: the tile and the sync start, and the grid's effects have run when this returns. */
    const upload = (
      handle: RefObject<LiveGalleryHandle | null>,
      i: number,
      over: Partial<Upload> = {},
    ) =>
      act(async () => {
        handle.current!.notifyUploaded({ ...own(i), ...over });
      });

    it("★ the window's ask for her tile waits for the delta that carries its link: the links route is never asked for it", async () => {
      const handle = createRef<LiveGalleryHandle>();
      await windowed(handle);
      // Her sync is still in the air when the grid mounts her tile and asks for its link (the ledger's own ordering).
      let land: (body: Record<string, unknown>) => void = () => {};
      answer(
        () =>
          new Promise<Record<string, unknown>>((resolve) => {
            land = resolve;
          }) as unknown as Answer,
      );
      await upload(handle, 9);
      // Her tile is in the grid, and the window has had its turn to ask while the sync is in the air.
      await act(async () => {
        await sleep(20);
      });
      expect(seen.live?.items[0].id).toBe(uuid(9));
      expect(syncs()).toHaveLength(1);
      expect(asked()).toEqual([]);
      // The delta lands carrying her link: it draws her tile, and the route is still never asked.
      await act(async () => {
        land(
          delta({ v: 11, upsert: [fresh(9)], total: 3, links: carrying([9]) }),
        );
        await sleep(20);
      });
      expect(asked()).toEqual([]);
      expect(syncs()).toHaveLength(1);
      expect(seen.live?.items.find((m) => m.id === uuid(9))?.url).toBe(
        "https://r2.test/carried/9",
      );
    });

    it("★ five uploads in a row: five syncs, and not one links ask for her own photographs", async () => {
      const handle = createRef<LiveGalleryHandle>();
      await windowed(handle);
      const log: typeof calls = [];
      for (let k = 0; k < 5; k++) {
        const i = 10 + k;
        answer(
          slow(
            delta({
              v: 11 + k,
              upsert: [fresh(i)],
              total: 3 + k,
              links: carrying([i]),
            }),
          ),
        );
        await upload(handle, i);
        await act(async () => {
          await sleep(60);
        });
        log.push(...calls);
      }
      expect(log.filter((c) => c.url === "/api/album/guest/sync")).toHaveLength(
        5,
      );
      // Her own five, each drawn from its delta's link; before this, every one cost a links call of its own.
      expect(asked(log)).toEqual([]);
      for (let k = 0; k < 5; k++)
        expect(seen.live?.items.find((m) => m.id === uuid(10 + k))?.url).toBe(
          `https://r2.test/carried/${10 + k}`,
        );
    });

    it("an ask her window made while the link was owed is made once the answer is in, and the route answers it when the delta carried nothing", async () => {
      const handle = createRef<LiveGalleryHandle>();
      await windowed(handle);
      // A sync that brings her photograph but no link (a delta past the carry's bound, a failed carry): the ask goes.
      answer(slow(delta({ v: 11, upsert: [fresh(9)], total: 3 })));
      await upload(handle, 9);
      await act(async () => {
        await sleep(60);
      });
      expect(asked()).toEqual([uuid(9)]);
      expect(seen.live?.items.find((m) => m.id === uuid(9))?.url).toBe(
        `https://r2.test/fresh/${uuid(9)}`,
      );
    });

    it("a photograph she takes back before the answer lands is owed nothing: no ask is made for it afterwards", async () => {
      const handle = createRef<LiveGalleryHandle>();
      await windowed(handle);
      // Her sync is held in the air; the delta that lands brings neither her photograph nor a link (the server hid it already).
      let land: () => void = () => {};
      answer(
        () =>
          new Promise<Record<string, unknown>>((resolve) => {
            land = () => resolve(delta({ v: 11, upsert: [], total: 2 }));
          }) as unknown as Answer,
      );
      await upload(handle, 9);
      // The window asked for her tile while the answer was in the air (held back), and she takes it back.
      await act(async () => {
        await sleep(20);
      });
      await act(async () => {
        await seen.live!.removeOwn(uuid(9));
      });
      await act(async () => {
        land();
        await sleep(40);
      });
      expect(syncs()).toHaveLength(1);
      expect(asked()).toEqual([]);
    });

    it("a sync that fails still lets her tile ask for its link: nothing is held back for good", async () => {
      const handle = createRef<LiveGalleryHandle>();
      await windowed(handle);
      answer(500);
      await upload(handle, 9);
      await act(async () => {
        await sleep(60);
      });
      expect(asked()).toEqual([uuid(9)]);
    });

    it("only her own approved upload is owed: a held one has no tile to ask for, but her sync still runs", async () => {
      const handle = createRef<LiveGalleryHandle>();
      await windowed(handle);
      answer(304);
      await upload(handle, 9, { status: "pending" });
      await act(async () => {
        await sleep(40);
      });
      // A held upload shows only in her uploads: no tile, so no ask, and the sync (the host's approval may follow) runs.
      expect(seen.live?.items.map((m) => m.id)).toEqual([uuid(1), uuid(2)]);
      expect(syncs()).toHaveLength(1);
      expect(asked()).toEqual([]);
    });
  });

  describe("★ a tab hidden for hours", () => {
    const START = new Date("2026-10-03T20:00:00.000Z");
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(START);
      setHidden(false);
    });
    afterEach(() => {
      vi.useRealTimers();
      setHidden(false);
    });

    it("asks nothing while hidden, then once at once: its arrivals linked by the delta, its aged window re-minted, what waits counted anew", async () => {
      await mount();
      // The window holds the seed's photograph (its embedded link answers locally).
      await window_([uuid(1)]);
      answer(304);
      expect(calls).toHaveLength(0);

      await visibility(true);
      vi.setSystemTime(new Date(START.getTime() + 3 * 60 * 60_000));
      // Hours pass: no poll (the tab is hidden), and no doorbell (a hidden tab is no listener).
      expect(calls).toHaveLength(0);

      answer(
        delta({
          v: 30,
          upsert: [entry(0)],
          total: 4,
          links: carrying([0]),
          waiting: { count: 2, minutes: [], developsAt: null },
        }),
      );
      await visibility(false);
      // ONE sync, at once.
      expect(syncs()).toHaveLength(1);
      expect(syncs()[0].body).toMatchObject({ since: 10 });
      // What it missed arrives through the album's own entry.
      expect(seen.live?.arrivals).toEqual([uuid(0)]);
      expect(seen.live?.items[0].id).toBe(uuid(0));
      // The window's aged link was re-minted (the hourly re-mint holds), and only it: the arrival rode the delta.
      expect(media().map((c) => c.body.ids)).toEqual([[uuid(1)]]);
      await window_([uuid(0), uuid(1)]);
      expect(media()).toHaveLength(1);
      expect(seen.live?.items[0].url).toBe("https://r2.test/carried/0");
      expect(seen.live?.items.find((m) => m.id === uuid(1))?.url).toBe(
        `https://r2.test/fresh/${uuid(1)}`,
      );
      // What waits is counted anew.
      expect(seen.live?.waiting?.count).toBe(2);
    });
  });
});
