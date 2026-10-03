"use client";

/**
 * THE GUEST ALBUM'S ROWS (the album-guest-wiring lane): the ONE grid (`MasonryColumns`) in its
 * justified, windowed layout (`layout="rows"`, `album-window.tsx`) with Will's `album-columns` round-2
 * picks: `arrival=push` (a photograph new to the rows is pushed in from its left edge while what it
 * moved glides), `steps=both` (three steps, from View's slider and from a pinch or ctrl and the
 * wheel over the album, each anchored on the photograph under it), `rhythm=double` (now and then a
 * landscape leads a row at twice the height; never at one a row, where every photograph is alone).
 *
 * ★ NEVER A SECOND COPY OF THE ALBUM. No tile box, play badge, hover row or viewer wiring of its own:
 * one `AlbumTile` serves every album grid. What lives here is what is genuinely the GUEST's: what this
 * DEVICE is sending, and a desk hover set with no moderation in it.
 *
 * ★ THE HEAD IS THE SEAM, and the whole of it is one object: one stack for a pick in flight, led by
 * the file actually in the air, in a square slot of its own at the album's head. A file a
 * hold-for-approval event keeps back draws nothing here (`voice-guest` r2, Will's `held=uploads`):
 * it shows only in her uploads, the badge beside Add counting it. ★ THE STACK SUBSCRIBES TO ITS OWN
 * PROGRESS (`useQueueProgress`): a tick re-renders the stack's bar and nothing else, never the album.
 *
 * ★ A FILE THAT DID NOT GO IS DRAWN NOWHERE (the failure sheet reads it at the run's end), and no Add
 * lives here: the album's Add is the page's (the action row, then the dock).
 *
 * ★ AN ARRIVAL LANDS COMPLETE, OR NOT UNTIL IT CAN (crumbs-23, `use-arrival-gate.ts`): a live arrival is
 * held out of the rows until its link has landed and its photograph is decoded, then pushed in as a
 * photograph the browser already holds; the glow is written here, when it lands.
 */
import type { Ref } from "react";
import { Download } from "lucide-react";

import type { GridMedia } from "@/components/app/media-grid";
import { UploadStackTile } from "@/components/guest/upload/stack-tile";
import { useLikeAction } from "@/components/likes/like-button";
import {
  MasonryColumns,
  type AlbumHandle,
  type TileAction,
  type TileSelection,
} from "@/components/shared/masonry";
import { useArrivalGate } from "@/components/shared/use-arrival-gate";
import {
  useQueueProgress,
  type QueueProgress,
} from "@/lib/guest/use-upload-queue";
import type { RowStep } from "@/lib/shared/album-rows";

/**
 * A FILE THIS DEVICE IS SENDING, drawn at the album's head. `url` is the object URL the live
 * gallery's own ledger owns, and `file` rides along so an undrawable one (an iPhone clip, a HEIC
 * outside Safari) can be NAMED rather than drawn as an empty black box.
 */
export type PendingTile = {
  queueId: string;
  url: string;
  file: File;
  kind: "photo" | "video";
  status: "queued" | "uploading";
  /** The file's progress as the queue last said it on a status change; the stack reads it live. */
  progress: number;
};

/** The stack at the album's head, reading its own file's progress as it goes. */
function LiveStackTile({
  lead,
  remaining,
  progress,
}: {
  lead: PendingTile;
  remaining: number;
  progress: QueueProgress | null;
}) {
  const live = useQueueProgress(progress, lead.queueId);
  return (
    <UploadStackTile
      file={lead.file}
      url={lead.url}
      progress={progress ? live : lead.progress}
      remaining={remaining}
    />
  );
}

export function GalleryRows({
  items,
  pending = [],
  progress = null,
  step,
  onStepChange,
  seed,
  firstPaintWidth,
  onBoxWidth,
  onWindowChange,
  onViewerNeedLinks,
  albumRef,
  shareUrl,
  onDeleteItem,
  canDelete,
  arrivals,
  onNeedLinks,
  landedIds,
  selection,
}: {
  items: GridMedia[];
  /** This device's files in flight, drawn FIRST, at the head. */
  pending?: PendingTile[];
  /** The queue's live progress, which the stack reads itself. */
  progress?: QueueProgress | null;
  /** The density step (photographs per row), and the gestures' answer. */
  step: RowStep;
  onStepChange: (step: RowStep) => void;
  /** The visit's seed for the rhythm's picks: the same seed, the same features, all visit long. */
  seed: number;
  /** The width the album last laid its rows at (the page's cookie), and each new one as it lands. */
  firstPaintWidth?: number | null;
  onBoxWidth?: (width: number) => void;
  /** The photographs the window mounts (their links and hearts load per window). */
  onWindowChange?: (ids: readonly string[]) => void;
  /** The viewer's link source: the photographs it is about to show. */
  onViewerNeedLinks?: (ids: readonly string[]) => void;
  albumRef?: Ref<AlbumHandle>;
  /** The event JOIN url for the viewer's Share (guest surface only). */
  shareUrl?: string;
  /** A guest's own-photograph Remove, gated per item (the viewer's Trash). */
  onDeleteItem?: (id: string) => void;
  canDelete?: (item: GridMedia) => boolean;
  /**
   * What appeared in the album by itself (`arrivalMarks().arrived`: never the seed, never this device's own
   * upload). Each is held out of the rows until its link has landed and its photograph is decoded, so the
   * push reveals a photograph and nothing fades (`use-arrival-gate.ts`), and each glows from the moment it
   * lands. Omitted, the album pushes whatever it is handed as it is handed.
   */
  arrivals?: readonly string[];
  /** Asks for these ids' links: the arrivals held at the door, which no window has mounted to ask. */
  onNeedLinks?: (ids: readonly string[]) => void;
  /** The one arrival mark this device's own landing takes: a single pass of light. */
  landedIds?: ReadonlySet<string>;
  /** Select mode (take-home r1, `guest=select`): every tile a toggle wearing the selection's marks. */
  selection?: TileSelection;
}) {
  const likeAction = useLikeAction();
  // ★ AN ARRIVAL LANDS COMPLETE OR NOT UNTIL IT CAN (crumbs-23): the rows lay what is in the album, less
  // the arrivals still waiting for their photograph, and the glow is lit as each one lands.
  const gate = useArrivalGate(items, arrivals, onNeedLinks);

  // A guest's desk row: like, and save the original once its link has landed. No moderation, ever:
  // this is somebody else's party. A phone sees neither (the grid never renders the pane below
  // `md`); both live in the viewer at every width.
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

  // ONE PICK IS ONE OBJECT: everything still flying collapses into a single stack led by the file
  // actually in the air (the queue runs one at a time). The fallback to the first of the batch covers
  // the beat between one file completing and the next one's first byte, so the stack never blinks.
  const lead = pending.find((p) => p.status === "uploading") ?? pending[0];

  return (
    <MasonryColumns
      layout="rows"
      items={gate.items}
      stagger
      rowStep={step}
      onRowStepChange={onStepChange}
      rowRhythm="double"
      rhythmSeed={seed}
      firstPaintWidth={firstPaintWidth}
      onBoxWidth={onBoxWidth}
      onWindowChange={onWindowChange}
      onViewerNeedLinks={onViewerNeedLinks}
      albumRef={albumRef}
      shareUrl={shareUrl}
      onDeleteItem={onDeleteItem}
      canDelete={canDelete}
      arrivedIds={gate.glow}
      landedIds={landedIds}
      selection={selection}
      tileActions={tileActions}
      prefix={
        <>
          {lead && (
            <LiveStackTile
              key={lead.queueId}
              lead={lead}
              remaining={pending.length}
              progress={progress}
            />
          )}
        </>
      }
    />
  );
}
