"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { flushSync } from "react-dom";

import { EventGallery } from "@/components/app/event-feed/event-gallery";
import {
  HostAlbumProvider,
  useHostAlbum,
  type HubWrites,
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
import {
  toBinEntry,
  type BinLinksBody,
  type BinManifestBody,
} from "@/lib/event/bin";
import { BULK_LIMIT_MESSAGE, MAX_BULK_ITEMS } from "@/lib/event/bulk-selection";
import type { HubAlbumSeed } from "@/lib/event/hub-album";
import {
  ALBUM_RESYNC_AFTER,
  ENTRY_HIDDEN,
  ENTRY_PREVIEW,
  ENTRY_REEL,
  ENTRY_VIDEO,
  compareEntries,
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
 * select mode, its bin and its View menu, over the scale page's synthetic photographs, for
 * `scripts/album-perf.mjs --query surface=host` to measure on a production build and for the hub's
 * walk (select all, hide and show in batches, delete, the bin, restore, Sort, an arrival). The hub
 * itself sits behind a sign-in a local server cannot complete, so this is where its album is walked
 * before the alias carries it.
 *
 * ★ A FAKE SERVER, KEPT HONEST. One in-memory album answers the three things the hub talks to: the
 * store's poll (a 304 at the current version, a delta by id since the client's, a fresh manifest past
 * `ALBUM_RESYNC_AFTER` changes, exactly as `album_changes_since` plans it), the album's writes (handed
 * to `HostAlbumProvider` as `writes`, refusing past `MAX_BULK_ITEMS` as the actions do), and the bin's
 * two routes (answered by a `fetch` shim on this page alone). The likes live in memory, as on the
 * guest's scale page.
 *
 * `__albumScale` speaks the harness's API with the host's meanings: `like` hearts the first tile in
 * view, `tick` is nothing (a host album has no tile in flight), `poll` is a real sync answered 304,
 * `arrive(n)` n photographs landing at the head of the server's album, then a real sync. `select()`
 * and `toggle(id)` drive select mode on the one grid; `server()` and `album()` read both sides.
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
  server: () => FakeServerState;
  album: () => { entries: number; hidden: number; albumCount: number | null };
};

declare global {
  interface Window {
    __hostScale?: HostScaleApi;
  }
}

/** What the fake server holds and has been asked, for the walk to read. */
type FakeServerState = {
  version: number;
  approved: number;
  hidden: number;
  removed: number;
  /** Every write, in order: its kind and how many ids it carried. */
  writes: { kind: string; n: number }[];
  /** Polls answered: 304s, deltas, manifests. */
  polls: { unchanged: number; deltas: number; manifests: number };
  albumLinkIds: number;
  binReads: number;
  binLinkIds: number;
};

type Status = "approved" | "hidden" | "removed";
type Row = { media: GridMedia; t: number; status: Status; removedAt: number };

/** The newest first: the first item the latest, one second apart. */
const T0 = 1_790_000_000_000_000;

const EVENT = "lab-scale";

/** A fixture photograph as the host's manifest carries it, in its status. */
function entryOf(row: Row): ManifestEntry {
  const m = row.media;
  const flags =
    ENTRY_REEL |
    ENTRY_PREVIEW |
    (m.type === "video" ? ENTRY_VIDEO : 0) |
    (row.status === "hidden" ? ENTRY_HIDDEN : 0);
  return [m.id, m.width ?? 0, m.height ?? 0, flags, row.t];
}

/**
 * THE FAKE SERVER: the album, a change log keyed on a version, the writes, and the bin's routes.
 * Pure data and closures (no React), created once per page.
 */
function createFakeHub(count: number) {
  const rows = new Map<string, Row>();
  for (let i = 0; i < count; i++) {
    const media = scaleItem(i);
    rows.set(media.id, {
      media,
      t: T0 - i * 1_000_000,
      status: "approved",
      removedAt: 0,
    });
  }
  let version = 1;
  const log: { v: number; id: string }[] = [];
  const state = {
    writes: [] as FakeServerState["writes"],
    polls: { unchanged: 0, deltas: 0, manifests: 0 },
    albumLinkIds: 0,
    binReads: 0,
    binLinkIds: 0,
  };
  let arrivals = 0;

  const touch = (id: string) => {
    version += 1;
    log.push({ v: version, id });
  };
  const albumRows = () =>
    [...rows.values()].filter((r) => r.status !== "removed");
  const counts = () => ({ album: albumRows().length, pending: 0 });
  const albumEntries = () => albumRows().map(entryOf).sort(compareEntries);
  const refuseSize = (ids: readonly string[]) =>
    ids.length > MAX_BULK_ITEMS
      ? ({
          ok: false,
          code: "validation",
          message: BULK_LIMIT_MESSAGE,
        } as const)
      : null;

  const transport: AlbumTransport<HostWhoTuple> = {
    async sync({ since }) {
      const etag = `"a1-lab-${version}"`;
      if (since === version) {
        state.polls.unchanged += 1;
        return { status: 304 };
      }
      const changed =
        since === null
          ? null
          : new Set(log.filter((c) => c.v > since).map((c) => c.id));
      if (!changed || changed.size > ALBUM_RESYNC_AFTER) {
        state.polls.manifests += 1;
        const body: HostSyncBody = {
          kind: "manifest",
          v: version,
          attr: 0,
          entries: albumEntries(),
          next: null,
          ok: true,
          counts: counts(),
        };
        return { status: 200, etag, body };
      }
      state.polls.deltas += 1;
      const upsert: ManifestEntry[] = [];
      const remove: string[] = [];
      for (const id of changed) {
        const row = rows.get(id);
        if (row && row.status !== "removed") upsert.push(entryOf(row));
        else remove.push(id);
      }
      const body: HostSyncBody = {
        kind: "delta",
        v: version,
        attr: 0,
        upsert,
        remove,
        ok: true,
        counts: counts(),
      };
      return { status: 200, etag, body };
    },
    async manifest() {
      throw new Error("the lab's album fits one manifest page");
    },
    async links(ids) {
      state.albumLinkIds += ids.length;
      const now = Date.now();
      const body: HostAlbumLinksBody = {
        ok: true,
        access: "full",
        gate: null,
        b: Number(presignBucketId(now)),
        now,
        links: ids.flatMap((id): AlbumLinkTuple<HostWhoTuple>[] => {
          const row = rows.get(id);
          if (!row || row.status === "removed") return [];
          const m = row.media;
          return [
            [id, m.previewUrl ?? m.url, m.url, m.url, ["Guest", 0, null]],
          ];
        }),
        missing: ids.filter((id) => {
          const row = rows.get(id);
          return !row || row.status === "removed";
        }),
        likes: {},
      };
      return body;
    },
  };

  const writes: HubWrites = {
    async setStatus(_event, id, status) {
      state.writes.push({ kind: `status:${status}`, n: 1 });
      const row = rows.get(id);
      if (
        row &&
        row.status !== "removed" &&
        (status === "approved" || status === "hidden")
      ) {
        row.status = status;
        touch(id);
      }
      return { ok: true };
    },
    async setStatusBulk(_event, ids, status) {
      const refused = refuseSize(ids);
      if (refused) return refused;
      state.writes.push({ kind: `status-bulk:${status}`, n: ids.length });
      for (const id of ids) {
        const row = rows.get(id);
        if (
          row &&
          row.status !== "removed" &&
          (status === "approved" || status === "hidden")
        ) {
          row.status = status;
          touch(id);
        }
      }
      return { ok: true };
    },
    async remove(_event, id) {
      state.writes.push({ kind: "remove", n: 1 });
      const row = rows.get(id);
      if (row && row.status !== "removed") {
        row.status = "removed";
        row.removedAt = Date.now();
        touch(id);
      }
      return { ok: true };
    },
    async removeBulk(_event, ids) {
      const refused = refuseSize(ids);
      if (refused) return refused;
      state.writes.push({ kind: "remove-bulk", n: ids.length });
      const at = Date.now();
      for (const id of ids) {
        const row = rows.get(id);
        if (row && row.status !== "removed") {
          row.status = "removed";
          row.removedAt = at;
          touch(id);
        }
      }
      return { ok: true };
    },
    async restore(_event, id) {
      state.writes.push({ kind: "restore", n: 1 });
      const row = rows.get(id);
      if (!row || row.status !== "removed")
        return { ok: false, code: "validation", message: "Not in Deleted." };
      row.status = "approved";
      row.removedAt = 0;
      touch(id);
      return { ok: true };
    },
    async purge(_event, ids) {
      const refused = refuseSize(ids);
      if (refused) return refused;
      state.writes.push({ kind: "purge", n: ids.length });
      for (const id of ids) {
        if (rows.get(id)?.status === "removed") rows.delete(id);
      }
      return { ok: true };
    },
  };

  /** The bin's list and its links, as `/api/events/<id>/bin` and `bin/media` answer them. */
  function binList(): BinManifestBody {
    state.binReads += 1;
    const binned = [...rows.values()]
      .filter((r) => r.status === "removed")
      .sort((a, b) => b.removedAt - a.removedAt || b.t - a.t);
    return {
      ok: true,
      entries: binned.map((r) =>
        toBinEntry({
          id: r.media.id,
          type: r.media.type === "video" ? "video" : "photo",
          width: r.media.width ?? null,
          height: r.media.height ?? null,
          duration_seconds: null,
          preview_key: "lab",
          countdownDays: 30,
        }),
      ),
    };
  }
  function binLinks(ids: string[]): BinLinksBody {
    state.binLinkIds += ids.length;
    const now = Date.now();
    const inBin = (id: string) => rows.get(id)?.status === "removed";
    return {
      ok: true,
      access: "full",
      gate: null,
      b: Number(presignBucketId(now)),
      now,
      links: ids.filter(inBin).map((id) => {
        const m = rows.get(id)!.media;
        return [id, m.previewUrl ?? m.url, m.url, "", null] as const;
      }),
      missing: ids.filter((id) => !inBin(id)),
    };
  }

  /** n photographs landing at the head of the server's album. */
  function land(n: number) {
    for (let k = 0; k < n; k++) {
      const i = arrivals++;
      const media = scaleItem(i, "arrival");
      rows.set(media.id, {
        media,
        t: T0 + 10_000_000 + i,
        status: "approved",
        removedAt: 0,
      });
      touch(media.id);
    }
  }

  function read(): FakeServerState {
    let approved = 0;
    let hidden = 0;
    let removed = 0;
    for (const r of rows.values()) {
      if (r.status === "approved") approved += 1;
      else if (r.status === "hidden") hidden += 1;
      else removed += 1;
    }
    return {
      version,
      approved,
      hidden,
      removed,
      writes: [...state.writes],
      polls: { ...state.polls },
      albumLinkIds: state.albumLinkIds,
      binReads: state.binReads,
      binLinkIds: state.binLinkIds,
    };
  }

  const seed: HubAlbumSeed = {
    eventId: EVENT,
    sync: {
      kind: "manifest",
      v: version,
      attr: 0,
      entries: albumEntries(),
      next: null,
      ok: true,
      counts: counts(),
    },
    etag: `"a1-lab-${version}"`,
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

  return { seed, transport, writes, binList, binLinks, land, read };
}

type FakeHub = ReturnType<typeof createFakeHub>;

/**
 * The bin's two routes answered on this page alone: every other request goes to the network. Installed
 * before the first paint's effects run, and taken out with the page.
 */
function useBinRoutes(hub: FakeHub) {
  useEffect(() => {
    const real = window.fetch;
    const list = `/api/events/${EVENT}/bin`;
    const media = `/api/events/${EVENT}/bin/media`;
    const json = (body: unknown) =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    window.fetch = async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.pathname
            : input.url;
      const path = url.startsWith("http") ? new URL(url).pathname : url;
      if (path === list) return json(hub.binList());
      if (path === media) {
        const { ids } = JSON.parse(String(init?.body ?? "{}")) as {
          ids: string[];
        };
        return json(hub.binLinks(ids));
      }
      return real(input, init);
    };
    return () => {
      window.fetch = real;
    };
  }, [hub]);
}

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

/** The harness's hooks, installed inside the providers they drive. */
function Probe({ hub }: { hub: FakeHub }) {
  const album = useHostAlbum();
  const likes = useLikes();
  const selection = useHostSelection();
  const latest = useRef({ album, likes, selection });
  useEffect(() => {
    latest.current = { album, likes, selection };
  });
  const counts = useRef({ tile: 0, mark: 0, ids: new Set<string>() });

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
        hub.land(n);
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
      links: () => hub.read().albumLinkIds,
      server: () => hub.read(),
      album: () => {
        const snap = latest.current.album?.store.getSnapshot();
        const entries = snap?.entries ?? [];
        let hidden = 0;
        for (const e of entries) if (e[3] & ENTRY_HIDDEN) hidden += 1;
        return {
          entries: entries.length,
          hidden,
          albumCount: snap?.counts?.album ?? null,
        };
      },
    };
    window.__hostScale = api;
    // The harness reads `__albumScale`; on this surface it is the host's.
    (window as unknown as { __albumScale: HostScaleApi }).__albumScale = api;
    return () => {
      setAlbumRenderProbe(null);
      delete window.__hostScale;
    };
  }, [hub]);
  return null;
}

export function HostScale({
  count,
  step,
}: {
  count: number;
  step: RowStep | undefined;
}) {
  const [hub] = useState(() => createFakeHub(count));
  useBinRoutes(hub);
  const writes = useMemo(() => hub.writes, [hub]);

  return (
    <div
      className="dark min-h-screen bg-background text-foreground"
      style={{ "--app-gutter": "12px" } as CSSProperties}
    >
      <div className="px-3 py-4 sm:px-5">
        <LocalLikesProvider>
          <HostAlbumProvider
            seed={hub.seed}
            qrToken="lab"
            transport={hub.transport}
            writes={writes}
            doorbell={false}
          >
            <HostAddProvider>
              <HostSelectionProvider>
                <Probe hub={hub} />
                <EventGallery
                  eventId={EVENT}
                  videosAllowed
                  initialStep={step ?? 1}
                >
                  <EventUploads eventId={EVENT} rhythmSeed={25} />
                </EventGallery>
              </HostSelectionProvider>
            </HostAddProvider>
          </HostAlbumProvider>
        </LocalLikesProvider>
      </div>
    </div>
  );
}
