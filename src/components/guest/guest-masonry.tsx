"use client";

/**
 * THE GUEST ALBUM — a thin wrapper over the ONE grid (the `glass` wiring,
 * 2026-09-20).
 *
 * ★ IT USED TO BE A SECOND COPY OF THE ALBUM, AND THAT WAS THE WHOLE PROBLEM.
 * This file carried its own tile box, its own play badge, its own hover row and
 * its own lightbox wiring, next to `shared/masonry.tsx` doing the same for the
 * host. Two copies answering one ruling is how they drift (Will's `host=same`,
 * 2026-09-19), and `tile-grammar`'s call took the last reason to keep them
 * apart: one `MediaTile` for every album grid. What is left here is what is
 * genuinely the GUEST's and nobody else's — the in-flight upload tiles, the
 * "it landed" check, and a hover set with no moderation in it.
 *
 * ★ THE PENDING TILES RIDE `prefix`, the seam's slot before the first tile, so
 * an upload in flight is still the first thing in the album and the grid does
 * not have to know what a queue is. Their box is the landed tile's box to the
 * pixel (the same radius, the same `data-lit` hook, the same bottom margin), so
 * a photograph does not change shape at the moment it finishes uploading.
 *
 * ★ AND THE ADD PILL IS NOT HERE, AND STAYS SOLID. The board carried `add-pill`
 * (the guest's loudest action drawn in the material) and he did not answer it;
 * the pill's fate rides `guest-shape` round two with the rest of the chrome, so
 * this wiring leaves it exactly as it is.
 */
import type { CSSProperties, ReactNode } from "react";
import { Check, Download, RefreshCw } from "lucide-react";

import { type GridMedia } from "@/components/app/media-grid";
import { useLikeAction } from "@/components/likes/like-button";
import { MasonryColumns, type TileAction } from "@/components/shared/masonry";

/** An in-flight upload rendered as a gallery tile (Phase 4: progress lives IN
 *  the gallery, not a separate file list). `url` is a local object URL. */
export type PendingTile = {
  queueId: string;
  url: string;
  kind: "photo" | "video";
  status: "queued" | "uploading" | "error";
  progress: number;
  error?: string;
};

export function GuestMasonry({
  items,
  pending = [],
  justLandedIds,
  onRetryPending,
  shareUrl,
  onDeleteItem,
  canDelete,
  arrivedIds,
  prefix,
  mineIds,
  onSelectMine,
  mineSelected,
}: {
  items: GridMedia[];
  /**
   * THE SEAM (the Orchestrator, 2026-09-20): additive props for the guest lane's own-photograph
   * Remove (`onDeleteItem` gated per item by `canDelete`; the lightbox's Trash), the arrival mark
   * (`arrivedIds` -> `data-arrived` on the tile box) and a slot before the first tile (`prefix`),
   * all of which now pass straight through to the one grid.
   */
  onDeleteItem?: (id: string) => void;
  canDelete?: (item: GridMedia) => boolean;
  arrivedIds?: ReadonlySet<string>;
  prefix?: ReactNode;
  /**
   * THE FOURTH MARK (`theirs=mark`, Will 2026-09-20): the ids that are this
   * guest's own, the mark's tap, and whether the Yours filter is already on.
   * Straight through to the one grid, like the three above.
   */
  mineIds?: ReadonlySet<string>;
  onSelectMine?: () => void;
  mineSelected?: boolean;
  /** In-flight uploads, rendered FIRST (newest activity leads the flow). */
  pending?: PendingTile[];
  /** Media ids that JUST landed (the ~2.5s green --success check window). */
  justLandedIds?: Set<string>;
  /** Tap-to-retry for an errored pending tile. */
  onRetryPending?: (queueId: string) => void;
  /** The event JOIN url for the lightbox Share button (guest surface only). */
  shareUrl?: string;
}) {
  const likeAction = useLikeAction();

  // A guest's desk row: like, and save the original. No moderation, ever — this
  // is somebody else's party. A phone sees neither (the grid never renders the
  // pane below `md`); both live in the lightbox at every width.
  const tileActions = (item: GridMedia): readonly TileAction[] => {
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

  return (
    <MasonryColumns
      items={items}
      stagger
      shareUrl={shareUrl}
      onDeleteItem={onDeleteItem}
      canDelete={canDelete}
      arrivedIds={arrivedIds}
      mineIds={mineIds}
      onSelectMine={onSelectMine}
      mineSelected={mineSelected}
      tileActions={tileActions}
      prefix={
        <>
          {prefix}
          {pending.map((p) => (
            <PendingMediaTile
              key={p.queueId}
              tile={p}
              onRetry={onRetryPending}
            />
          ))}
        </>
      }
      renderOverlay={(item) =>
        justLandedIds?.has(item.id) ? (
          // The ~2.5s "it landed" confirmation: state feedback is always
          // coloured (--success), then the badge unmounts.
          <span
            aria-hidden
            data-just-landed
            className="pointer-events-none absolute top-1.5 left-1.5 flex size-4.5 items-center justify-center rounded-full bg-success text-success-foreground"
          >
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : null
      }
    />
  );
}

/** One upload in flight, in the album, wearing the landed tile's own box. */
function PendingMediaTile({
  tile: p,
  onRetry,
}: {
  tile: PendingTile;
  onRetry?: (queueId: string) => void;
}) {
  return (
    <div
      data-media-tile
      // The bright edge ([data-lit], globals.css) sits on the box that owns the
      // tile radius, on a pending tile as on a landed one.
      data-lit=""
      style={{ borderRadius: "var(--radius-tile)" } as CSSProperties}
      className="relative mb-[var(--gap-gallery)] w-full overflow-hidden bg-black/10"
    >
      {/* The local preview sizes itself (natural blob dimensions). */}
      {p.kind === "photo" ? (
        // eslint-disable-next-line @next/next/no-img-element -- local object URL
        <img
          src={p.url}
          alt=""
          className={p.status === "error" ? "w-full opacity-40" : "w-full"}
        />
      ) : (
        <video
          src={p.url}
          muted
          playsInline
          preload="metadata"
          className={
            p.status === "error"
              ? "w-full bg-black opacity-40"
              : "w-full bg-black"
          }
        />
      )}
      {p.status !== "error" ? (
        // Uploading: a thin progress bar in a soft scrim strip at the tile's
        // foot (the ratified in-gallery progress treatment).
        <div className="absolute inset-x-0 bottom-0 bg-black/35 p-1.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
            <div
              data-pending-progress
              className="h-full rounded-full bg-white transition-[width] duration-200 ease-emphasis"
              style={{ width: `${p.progress}%` }}
            />
          </div>
        </div>
      ) : (
        // Error: dimmed preview + the retry affordance covering the tile.
        <button
          type="button"
          onClick={() => onRetry?.(p.queueId)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/45 text-white outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset"
        >
          <RefreshCw className="size-4" aria-hidden />
          <span className="text-xs font-medium">Tap to retry</span>
        </button>
      )}
    </div>
  );
}
