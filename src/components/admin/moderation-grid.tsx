"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { EyeOff, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import {
  removeMediaByOperatorAction,
  restoreMediaAction,
} from "@/app/admin/albums/actions";
import { type ActionResult } from "@/app/(app)/dashboard/actions";
import { MediaTile } from "@/components/app/media-grid";
import type { ViewerOrigin } from "@/components/shared/media-lightbox";
import {
  MediaLightboxLazy,
  preloadMediaLightbox,
} from "@/components/shared/media-lightbox.lazy";
import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import {
  type ModerationGridItem,
  type ModerationTile as ModerationTileItem,
  operatorRemovalTouches,
} from "@/lib/moderation/operator-actions";

// The operator moderation grid (admin Albums browser). Reuses the shared MediaTile +
// MediaLightbox; the per-tile controls are SIBLINGS of the open-lightbox button (the
// HostMediaGrid pattern), so tapping a control never opens the lightbox. Active items get a
// Remove (behind the portal's one destructive sheet, `destructive=sheet` 2026-09-20 — it's
// destructive-ish: pulled from the album and the host's Deleted now, hard-deleted when its
// 30-day window ends unless held; the dialog it replaces asked nothing and closed on the same
// click that fired the action, so its own `disabled={isPending}` never engaged); removed items
// get a Restore (safe + reversible, so no confirm). What the confirm lists is the one home both
// operator removals share (`operatorRemovalTouches`), so this and a report's Remove cannot drift.
// The TILE is untouched here: the glass lane rewrites every tile's marks.
// `mode="feed"` shows the album/host caption (linking to the drill-in); `mode="album"` omits it.
//
// ★ THE WORST KINDS ARRIVE COVERED HERE TOO (build 23's NIT-7, carried to the albums grid by crumbs-21):
// an item a report of the worst kinds names comes with no url at all (`toModerationFeedItems` never
// signs it), so its tile draws the reports inbox's cover and opens nothing; the viewer steps only through
// what is seen. The runbook keeps human viewing to a minimum, and the open queue's View once is the one
// look an operator takes.

function ModerationTile({
  item,
  index,
  mode,
  onOpen,
}: {
  item: ModerationTileItem;
  /** Its place among the seen tiles (the viewer's list), or null for a covered one. */
  index: number | null;
  mode: "feed" | "album";
  /** The tile's box rides along, so the viewer grows out of it (`opening=grow`). */
  onOpen: (index: number, tile: Element | null) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [asking, setAsking] = useState(false);

  function run(
    action: () => Promise<ActionResult>,
    successMsg: string,
    failTitle: string,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(successMsg);
        return;
      }
      toast.error(failTitle, { description: result.message });
    });
  }

  const isRemoved = item.status === "removed";

  return (
    <li
      data-media-tile
      data-media-id={item.id}
      className="relative aspect-square overflow-hidden rounded-lg bg-black/10"
    >
      {item.covered || index === null ? (
        <span
          data-media-covered=""
          role="img"
          aria-label={`Covered ${item.type}`}
          title="Covered: a report names it as the worst kind. The open report's View once is the only look."
          className="flex size-full flex-col items-center justify-center gap-1.5 bg-foreground/85 p-2 text-center text-background"
        >
          <EyeOff className="size-5" aria-hidden />
          <span className="text-caption font-medium">Covered</span>
        </span>
      ) : (
        <button
          type="button"
          onClick={(e) => onOpen(index, e.currentTarget.closest("li"))}
          aria-label={item.type === "photo" ? "View photo" : "Play video"}
          className="size-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset"
        >
          <MediaTile item={item} />
        </button>
      )}

      <Badge
        variant="secondary"
        className="absolute top-1.5 left-1.5 z-10 capitalize"
      >
        {item.status}
      </Badge>

      <div className="absolute inset-x-0 top-0 flex items-center justify-end gap-1 bg-gradient-to-b from-black/70 to-transparent p-1.5">
        {isRemoved ? (
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            disabled={isPending}
            aria-label="Restore"
            title="Restore"
            onClick={() =>
              run(
                () => restoreMediaAction(item.id),
                // Not "approved": the restore lands the item on the status it held before the
                // removal (a hidden photo comes back hidden), so the toast says only that.
                "Restored to where it was before the removal.",
                "Couldn't restore that item.",
              )
            }
          >
            <Undo2 />
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              disabled={isPending}
              aria-label="Remove"
              title="Remove"
              onClick={() => setAsking(true)}
            >
              <Trash2 />
            </Button>
            <DestructiveSheet
              open={asking}
              onOpenChange={setAsking}
              title={`Remove this ${item.type}?`}
              lede={`It leaves the album and the host's Deleted now; you can restore it here for ${RECENTLY_DELETED_WINDOW_DAYS} days.`}
              verb="Remove"
              touches={operatorRemovalTouches({
                kind: item.type,
                eventName: item.eventName,
                from: "album",
                wayBack: "here",
              })}
              severity="reversible"
              successMessage="Removed. It is out of the album and the host's Deleted."
              onConfirm={() => removeMediaByOperatorAction(item.id)}
            />
          </>
        )}
      </div>

      {mode === "feed" && (
        <Link
          href={`/admin/albums/${item.eventId}`}
          prefetch={false}
          className="absolute inset-x-0 bottom-0 z-10 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pt-4 pb-1.5 text-left text-xs text-white/90 hover:text-white"
          title={`${item.eventName}${item.hostLabel ? ` · ${item.hostLabel}` : ""}`}
        >
          <span className="font-medium">{item.eventName}</span>
          {item.hostLabel ? (
            <span className="text-white/70"> · {item.hostLabel}</span>
          ) : null}
        </Link>
      )}
    </li>
  );
}

export function ModerationGrid({
  items,
  mode,
}: {
  items: ModerationTileItem[];
  mode: "feed" | "album";
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [origin, setOrigin] = useState<ViewerOrigin | undefined>(undefined);
  const listRef = useRef<HTMLUListElement | null>(null);
  // The viewer steps through the seen tiles alone: a covered one has nothing to show.
  const seen = useMemo(
    () => items.filter((item): item is ModerationGridItem => !item.covered),
    [items],
  );
  const seenIndex = useMemo(
    () => new Map(seen.map((item, i) => [item.id, i] as const)),
    [seen],
  );

  // The viewer drops back into the tile of whichever report it shows at close
  // (it may have stepped on from the one tapped), and focus returns to it.
  const returnTo = useCallback(
    (item: { id: string }) =>
      listRef.current?.querySelector<HTMLElement>(
        `[data-media-tile][data-media-id="${item.id.replace(/["\\]/g, "\\$&")}"]`,
      ) ?? null,
    [],
  );

  return (
    <>
      <ul
        ref={listRef}
        className="grid grid-cols-2 gap-[var(--gap-gallery)] sm:grid-cols-3 lg:grid-cols-4"
        onPointerEnter={preloadMediaLightbox}
        onTouchStart={preloadMediaLightbox}
      >
        {items.map((item) => (
          <ModerationTile
            key={item.id}
            item={item}
            index={item.covered ? null : (seenIndex.get(item.id) ?? null)}
            mode={mode}
            onOpen={(i, tile) => {
              setOpenIndex(i);
              setOrigin(
                tile
                  ? {
                      kind: "tile",
                      rect: tile.getBoundingClientRect(),
                      returnTo,
                    }
                  : undefined,
              );
            }}
          />
        ))}
      </ul>

      <MediaLightboxLazy
        items={seen}
        index={openIndex}
        origin={origin}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </>
  );
}
