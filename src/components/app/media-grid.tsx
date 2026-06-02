"use client";

import { useState } from "react";
import { Play } from "lucide-react";

import { MediaLightbox } from "@/components/shared/media-lightbox";
import { videoPosterSrc } from "@/lib/media/poster";

export type GridMedia = {
  id: string;
  type: "photo" | "video";
  /** Short-lived presigned URL for INLINE render — built server-side; never a raw R2 key. */
  url: string;
  /** Presigned `attachment` URL that saves the original (see lib/r2/presign.ts). */
  downloadUrl: string;
  status?: "pending" | "approved" | "hidden" | "removed";
};

// Presentational thumbnail shared by the public album (MediaGrid below) and the
// host moderation grid (host-media-grid.tsx). Renders straight <img>/<video> from
// presigned URLs (next/image is wrong here — presigned URLs are short-lived and
// per-request, so optimization/caching would break them). Video renders WITHOUT
// `controls` (a poster-frame thumbnail + a play badge): a controls-less <video>
// is non-interactive, so the tile can be wrapped in a <button> that opens the
// lightbox, where the video actually plays. No status/controls/host concerns live
// here — keep it a clean primitive both surfaces reuse. It renders from only
// `type` + `url`, so it also accepts thinner shapes (e.g. the operator report
// thumbnail) that have no downloadUrl/lightbox.
export function MediaTile({ item }: { item: Pick<GridMedia, "type" | "url"> }) {
  if (item.type === "photo") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
      <img
        src={item.url}
        alt=""
        loading="lazy"
        className="size-full object-cover"
      />
    );
  }
  return (
    <>
      <video
        // iOS shows a black box without this poster fragment — see videoPosterSrc.
        src={videoPosterSrc(item.url)}
        preload="metadata"
        muted
        playsInline
        className="size-full bg-black object-cover"
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-black/50 text-white">
          <Play className="size-5 translate-x-px fill-current" />
        </span>
      </span>
    </>
  );
}

// Public-album grid. Tiles are buttons that open the shared lightbox (full-screen
// view + Save); the grid owns the open index so prev/next walks the whole set.
// Host moderation controls live in HostMediaGrid, never here.
export function MediaGrid({ items }: { items: GridMedia[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item, i) => (
          <li
            key={item.id}
            data-media-tile
            className="relative aspect-square overflow-hidden rounded-lg bg-black/10"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={item.type === "photo" ? "View photo" : "Play video"}
              className="size-full cursor-pointer transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset active:scale-[0.98]"
            >
              <MediaTile item={item} />
            </button>
          </li>
        ))}
      </ul>

      <MediaLightbox
        items={items}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </>
  );
}
