"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { flushSync } from "react-dom";
import { Download } from "lucide-react";

import type { GridMedia } from "@/components/app/media-grid";
import { UploadStackTile } from "@/components/guest/upload/stack-tile";
import { useLikeAction } from "@/components/likes/like-button";
import { LikesProvider } from "@/components/likes/likes-provider";
import { setAlbumRenderProbe } from "@/components/shared/album-tile";
import { MasonryColumns, type TileAction } from "@/components/shared/masonry";
import type { RowStep } from "@/lib/shared/album-rows";
import { ARRIVAL_GLOW_MS, ARRIVAL_SWEEP_MS } from "@/lib/shared/arrival";

import { scaleAlbum, scaleItem } from "./fixtures";

export type ScaleLayout = "masonry" | "rows";

/**
 * WHAT `scripts/album-perf.mjs` DRIVES. Every call is synchronous (flushSync),
 * so the render count it reads back belongs to the call and to nothing else.
 */
export type AlbumScaleApi = {
  ready: true;
  layout: ScaleLayout;
  count: () => number;
  renders: () => { tile: number; mark: number };
  resetRenders: () => void;
  /** Toggles one photograph's like (the first in view unless named); its id. */
  like: (id?: string) => string | null;
  /** One upload-progress tick of the in-flight tile, as the queue patches it. */
  tick: () => void;
  /** A poll that changed nothing: an equal list, in new objects. */
  poll: () => void;
  /** `n` photographs land at the head; the synchronous work it cost. */
  arrive: (n: number) => { syncMs: number; layoutMs: number };
};

declare global {
  interface Window {
    __albumScale?: AlbumScaleApi;
  }
}

/** The first tile whose box is on screen, by id. */
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

/** A still for the in-flight tile (a File the stack can name, a URL it can draw). */
const PENDING_FILE =
  typeof File === "undefined"
    ? null
    : new File([new Uint8Array([0xff, 0xd8])], "IMG_0421.jpg", {
        type: "image/jpeg",
      });

/**
 * THE GUEST'S DESK ROW, as `GuestMasonry` declares it: like, and save the
 * original. Rendered under the likes context, as the album is.
 */
function useGuestRow() {
  const likeAction = useLikeAction();
  return (item: GridMedia): readonly TileAction[] => {
    const like = likeAction(item);
    const out: TileAction[] = [];
    if (like) out.push(like);
    if (item.downloadUrl)
      out.push({
        id: "save",
        label: "Save",
        icon: Download,
        tone: "save",
        href: item.downloadUrl,
      });
    return out;
  };
}

function Album({
  layout,
  step,
  items,
  progress,
}: {
  layout: ScaleLayout;
  step: RowStep | undefined;
  items: GridMedia[];
  progress: number | null;
}) {
  const tileActions = useGuestRow();
  return (
    <MasonryColumns
      items={items}
      layout={layout}
      rowStep={step}
      stagger
      tileActions={tileActions}
      photoAddress={false}
      prefix={
        progress !== null && PENDING_FILE ? (
          <UploadStackTile
            file={PENDING_FILE}
            url={items[0]?.previewUrl ?? ""}
            progress={progress}
            remaining={3}
          />
        ) : null
      }
    />
  );
}

/**
 * THE SCALE PAGE: the real album grid over a synthetic album at a party's
 * scale, with nothing around it but a line of links, so what the harness
 * measures is the album and not the lab's shell.
 */
export function AlbumScale({
  layout,
  count,
  step,
  uploading,
}: {
  layout: ScaleLayout;
  count: number;
  step: RowStep | undefined;
  uploading: boolean;
}) {
  const [items, setItems] = useState(() => scaleAlbum(count));
  const [progress, setProgress] = useState<number | null>(uploading ? 0 : null);
  const arrivals = useRef(0);
  const counts = useRef({ tile: 0, mark: 0 });

  useEffect(() => {
    setAlbumRenderProbe((kind) => {
      counts.current[kind] += 1;
    });
    window.__albumScale = {
      ready: true,
      layout,
      count: () => document.querySelectorAll("[data-media-tile]").length,
      renders: () => ({ ...counts.current }),
      resetRenders: () => {
        counts.current = { tile: 0, mark: 0 };
      },
      like: (id) => {
        const target = id ?? firstInView();
        if (!target) return null;
        // A like changes one photograph's state and nothing else.
        flushSync(() =>
          setItems((prev) =>
            prev.map((m) =>
              m.id === target ? { ...m, likeCount: (m.likeCount ?? 0) + 1 } : m,
            ),
          ),
        );
        return target;
      },
      tick: () => {
        flushSync(() => setProgress((p) => ((p ?? 0) + 1) % 100));
      },
      poll: () => {
        flushSync(() => setItems((prev) => prev.map((m) => ({ ...m }))));
      },
      arrive: (n) => {
        const fresh = Array.from({ length: n }, () =>
          scaleItem(arrivals.current++, "arrival"),
        );
        const t0 = performance.now();
        flushSync(() => setItems((prev) => [...fresh, ...prev]));
        const t1 = performance.now();
        // Style and layout, forced now, so the cost is read in this call.
        void document.body.offsetHeight;
        const t2 = performance.now();
        return { syncMs: t1 - t0, layoutMs: t2 - t0 };
      },
    };
    return () => {
      setAlbumRenderProbe(null);
      delete window.__albumScale;
    };
  }, [layout]);

  const link = (params: Record<string, string>) => {
    const q = new URLSearchParams(
      typeof window === "undefined" ? "" : window.location.search,
    );
    for (const [k, v] of Object.entries(params)) q.set(k, v);
    return `?${q.toString()}`;
  };

  return (
    <div
      className="dark min-h-screen bg-background text-foreground"
      style={
        {
          "--arrival-glow-ms": `${ARRIVAL_GLOW_MS}ms`,
          "--arrival-sweep-ms": `${ARRIVAL_SWEEP_MS}ms`,
        } as CSSProperties
      }
    >
      <div className="px-3 py-4 sm:px-5">
        <p className="mb-3 flex flex-wrap gap-x-3 text-sm text-muted-foreground tabular-nums">
          <span>{items.length.toLocaleString("en")} photographs</span>
          <a href={link({ layout: "masonry" })} className="underline">
            masonry
          </a>
          <a href={link({ layout: "rows" })} className="underline">
            rows
          </a>
        </p>
        <LikesProvider mediaIds={items.map((m) => m.id)}>
          <Album
            layout={layout}
            step={step}
            items={items}
            progress={progress}
          />
        </LikesProvider>
      </div>
    </div>
  );
}
