"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { flushSync } from "react-dom";

import { EventGallery } from "@/components/app/event-feed/event-gallery";
import {
  HostAlbumProvider,
  useHostAlbum,
} from "@/components/app/event-feed/host-album";
import { EventUploads } from "@/components/app/event-uploads";
import { HostAddProvider } from "@/components/app/host-add-provider";
import {
  HostSelectionProvider,
  useHostSelection,
} from "@/components/app/host-selection-provider";
import type { GridMedia } from "@/components/app/media-grid";
import {
  LocalLikesProvider,
  useLikes,
} from "@/components/likes/likes-provider";
import { setAlbumRenderProbe } from "@/components/shared/album-tile-probe";
import type { AlbumTransport } from "@/lib/album/store";
import type { HubAlbumSeed } from "@/lib/event/hub-album";
import {
  ENTRY_PREVIEW,
  ENTRY_REEL,
  ENTRY_VIDEO,
  type AlbumLinkTuple,
  type HostAlbumLinksBody,
  type HostSyncBody,
  type HostWhoTuple,
  type ManifestEntry,
} from "@/lib/events/album-wire";
import { presignBucketId } from "@/lib/r2/presign-bucket";
import type { RowStep } from "@/lib/shared/album-rows";

import { scaleItem } from "./fixtures";

/**
 * THE HOST'S ALBUM AT SCALE (album-host-wiring): the hub's real album, its store, its window, its
 * select mode and its View menu, over the scale page's synthetic photographs, for
 * `scripts/album-perf.mjs --query surface=host` to measure on a production build. The hub itself sits
 * behind a sign-in a local server cannot complete, so this is where its album is measured before the
 * alias carries it; the transport is a fake answering the routes' own shapes, and the likes live in
 * memory, as on the guest's scale page.
 *
 * `__albumScale` speaks the harness's API with the host's meanings: `like` hearts the first tile in
 * view, `tick` is nothing (a host album has no tile in flight), `poll` is a real sync answered 304,
 * `arrive(n)` a real delta of n photographs at the head. `select()` and `toggle(id)` drive select
 * mode on the one grid.
 */
type HostScaleApi = {
  ready: true;
  layout: "rows";
  count: () => number;
  renders: () => { tile: number; mark: number; ids: number };
  resetRenders: () => void;
  like: (id?: string) => string | null;
  tick: () => void;
  poll: () => Promise<void>;
  arrive: (n: number) => Promise<{ syncMs: number; layoutMs: number }>;
  step: (s: number) => void;
  select: () => void;
  toggle: (id?: string) => string | null;
  links: () => number;
};

declare global {
  interface Window {
    __hostScale?: HostScaleApi;
  }
}

/** A fixture photograph as the host's manifest carries it. */
function toEntry(m: GridMedia, t: number): ManifestEntry {
  const flags =
    ENTRY_REEL | ENTRY_PREVIEW | (m.type === "video" ? ENTRY_VIDEO : 0);
  return [m.id, m.width ?? 0, m.height ?? 0, flags, t];
}

/** The newest first: the first item the latest, one second apart. */
const T0 = 1_790_000_000_000_000;

function firstInView(): string | null {
  const tiles = document.querySelectorAll<HTMLElement>(
    "[data-album-grid] [data-media-tile][data-media-id]",
  );
  for (const t of tiles) {
    const r = t.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight)
      return t.dataset.mediaId ?? null;
  }
  return null;
}

/** The routes' shapes, answered in memory: links for any fixture, 304 unless a delta waits. */
function fakeTransport(byId: Map<string, GridMedia>) {
  const queue: HostSyncBody[] = [];
  let asked = 0;
  const transport: AlbumTransport<HostWhoTuple> = {
    async sync() {
      const next = queue.shift();
      return next
        ? { status: 200, etag: `"a1-lab-${next.v}"`, body: next }
        : { status: 304 };
    },
    async manifest() {
      throw new Error("the lab's album fits one manifest page");
    },
    async links(ids) {
      asked += ids.length;
      const now = Date.now();
      const body: HostAlbumLinksBody = {
        ok: true,
        access: "full",
        gate: null,
        b: Number(presignBucketId(now)),
        now,
        links: ids.flatMap((id): AlbumLinkTuple<HostWhoTuple>[] => {
          const m = byId.get(id);
          return m
            ? [[id, m.previewUrl ?? m.url, m.url, m.url, ["Guest", 0, null]]]
            : [];
        }),
        missing: ids.filter((id) => !byId.has(id)),
        likes: {},
      };
      return body;
    },
  };
  return { transport, queue, asked: () => asked };
}

/** The harness's hooks, installed inside the providers they drive. */
function Probe({
  queue,
  byId,
  asked,
  count,
}: {
  queue: HostSyncBody[];
  byId: Map<string, GridMedia>;
  asked: () => number;
  count: () => number;
}) {
  const album = useHostAlbum();
  const likes = useLikes();
  const selection = useHostSelection();
  const latest = useRef({ album, likes, selection });
  useEffect(() => {
    latest.current = { album, likes, selection };
  });
  const counts = useRef({ tile: 0, mark: 0, ids: new Set<string>() });
  const arrivals = useRef(0);
  const version = useRef(1);
  const total = useRef(count());

  useEffect(() => {
    setAlbumRenderProbe((kind, id) => {
      counts.current[kind] += 1;
      counts.current.ids.add(id);
    });
    const api: HostScaleApi = {
      ready: true,
      layout: "rows",
      count: () => document.querySelectorAll("[data-media-tile]").length,
      renders: () => ({
        tile: counts.current.tile,
        mark: counts.current.mark,
        ids: counts.current.ids.size,
      }),
      resetRenders: () => {
        counts.current = { tile: 0, mark: 0, ids: new Set() };
      },
      like: (id) => {
        const target = id ?? firstInView();
        const l = latest.current.likes;
        if (!target || !l) return null;
        flushSync(() => l.toggle(target));
        return target;
      },
      tick: () => {},
      poll: async () => {
        await latest.current.album?.sync();
      },
      arrive: async (n) => {
        const fresh = Array.from({ length: n }, () => {
          const i = arrivals.current++;
          const m = scaleItem(i, "arrival");
          byId.set(m.id, m);
          return toEntry(m, T0 + 10_000_000 + i);
        });
        total.current += n;
        version.current += 1;
        queue.push({
          kind: "delta",
          v: version.current,
          attr: 0,
          upsert: fresh,
          remove: [],
          ok: true,
          counts: { album: total.current, pending: 0 },
        });
        const t0 = performance.now();
        await latest.current.album?.sync();
        const t1 = performance.now();
        void document.body.offsetHeight;
        const t2 = performance.now();
        return { syncMs: t1 - t0, layoutMs: t2 - t0 };
      },
      step: () => {},
      select: () => {
        const s = latest.current.selection;
        if (s) flushSync(() => s.enterSelect());
      },
      toggle: (id) => {
        const target = id ?? firstInView();
        const s = latest.current.selection;
        if (!target || !s) return null;
        flushSync(() => s.toggle(target));
        return target;
      },
      links: asked,
    };
    window.__hostScale = api;
    // The harness reads `__albumScale`; on this surface it is the host's.
    (window as unknown as { __albumScale: HostScaleApi }).__albumScale = api;
    return () => {
      setAlbumRenderProbe(null);
      delete window.__hostScale;
    };
  }, [queue, byId, asked]);
  return null;
}

export function HostScale({
  count,
  step,
}: {
  count: number;
  step: RowStep | undefined;
}) {
  const [world] = useState(() => {
    const items = Array.from({ length: count }, (_, i) => scaleItem(i));
    const byId = new Map(items.map((m) => [m.id, m] as const));
    const entries = items.map((m, i) => toEntry(m, T0 - i * 1_000_000));
    const fake = fakeTransport(byId);
    const seed: HubAlbumSeed = {
      eventId: "lab-scale",
      sync: {
        kind: "manifest",
        v: 1,
        attr: 0,
        entries,
        next: null,
        ok: true,
        counts: { album: entries.length, pending: 0 },
      },
      etag: '"a1-lab-1"',
      // The page mints its first window server-side; the lab's links cost nothing, so the window asks.
      links: {
        ok: true,
        access: "full",
        gate: null,
        b: 0,
        now: 0,
        links: [],
        missing: [],
        likes: {},
      },
    };
    return { byId, fake, seed };
  });
  const countOf = useMemo(() => () => count, [count]);

  return (
    <div
      className="dark min-h-screen bg-background text-foreground"
      style={{ "--app-gutter": "12px" } as CSSProperties}
    >
      <div className="px-3 py-4 sm:px-5">
        <LocalLikesProvider>
          <HostAlbumProvider
            seed={world.seed}
            qrToken="lab"
            transport={world.fake.transport}
            doorbell={false}
          >
            <HostAddProvider>
              <HostSelectionProvider>
                <Probe
                  queue={world.fake.queue}
                  byId={world.byId}
                  asked={world.fake.asked}
                  count={countOf}
                />
                <EventGallery
                  eventId="lab-scale"
                  videosAllowed
                  initialStep={step ?? 1}
                >
                  <EventUploads eventId="lab-scale" rhythmSeed={25} />
                </EventGallery>
              </HostSelectionProvider>
            </HostAddProvider>
          </HostAlbumProvider>
        </LocalLikesProvider>
      </div>
    </div>
  );
}
