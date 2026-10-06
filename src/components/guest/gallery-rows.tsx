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
 * ★ THE STACK'S x STOPS THE FILE IN THE AIR (upload-cancel, E6 for uploads). It asks first, on the product's toast,
 * and a stopped file is no failure: it says "Upload cancelled." with Try again (`stop-upload.ts`), the file's siblings
 * go on, and nothing was recorded or counted. The stop is the queue's, reached through the progress store this stack
 * already reads (`QueueProgress.stop`); the x is drawn only while the file can still be stopped (going up, or not yet
 * begun: once its bytes are up its complete is coming), and a question about a file that left the stack is withdrawn.
 *
 * ★ A FILE THAT DID NOT GO IS DRAWN NOWHERE (the failure sheet reads it at the run's end), and no Add
 * lives here: the album's Add is the page's (the action row, then the dock).
 *
 * ★ AN ARRIVAL LANDS COMPLETE, OR NOT UNTIL IT CAN (crumbs-23, `use-arrival-gate.ts`): a live arrival is
 * held out of the rows until its link has landed and its photograph is decoded, then pushed in as a
 * photograph the browser already holds; the glow is written here, when it lands.
 *
 * ★ AND ONE SHE CANNOT SEE IS SAID (album-order): the same arrivals tell the rows what is news
 * (`AlbumNews`), so one landing out of sight (the head of a newest-first album while she reads deep, the
 * end of one in order) wears the rows' one pill rather than moving anything she is looking at. Her own
 * landing is not among them: it sweeps.
 *
 * ★ THE ALBUM'S ORDER IS THE PAGE'S (`anchor`): newest first lays from the end, the growing head on top;
 * the night in order lays from the start, so an arrival lands at the end, and the head's stack follows the
 * growing end there. ★ SO HER STACK CAN BE OUT OF HER SIGHT WHILE SHE SENDS (red-team 56's MEDIUM: from the head of
 * an album in order, or deep in a newest-first one), and then its stand-in stands in view with the same bar and x
 * (`sending-stand-in.tsx`); the x's question is the pick's, never a tile's (`StackQuestion`).
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import { Download } from "lucide-react";

import { exportToasts } from "@/components/app/export/export-toast";
import type { GridMedia } from "@/components/app/media-grid";
import { SendingStandIn } from "@/components/guest/upload/sending-stand-in";
import { UploadStackTile } from "@/components/guest/upload/stack-tile";
import { useLikeAction } from "@/components/likes/like-button";
import {
  AlbumNewsContext,
  type AlbumNews,
} from "@/components/shared/album-window-news";
import {
  MasonryColumns,
  type AlbumHandle,
  type TileAction,
  type TileSelection,
} from "@/components/shared/masonry";
import { useArrivalGate } from "@/components/shared/use-arrival-gate";
import { layerIsUp } from "@/components/ui/layer-is-up";
import {
  useQueueProgress,
  type QueueProgress,
} from "@/lib/guest/use-upload-queue";
import type { RowAnchor, RowStep } from "@/lib/shared/album-rows";
import { askToStop, withdrawStopQuestion } from "@/lib/upload/stop-upload";

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

/**
 * THE LEAD FILE AS THE STACK READS IT: its live progress, and the x's ask while it can still be stopped. One reading
 * for the stack in the rows and its stand-in in view (`SendingStandIn`), so the two never say different things.
 */
function useStackLead(lead: PendingTile, progress: QueueProgress | null) {
  const live = useQueueProgress(progress, lead.queueId);
  const now = progress ? live : lead.progress;
  // ★ THE x IS FOR A FILE THAT CAN STILL BE STOPPED: going up (even at 100, while R2 answers), or not begun. Once its
  // bytes are up it waits to be recorded with its burst and its complete is coming, which no stop could take back.
  const stoppable = lead.status === "uploading" || now < 100;
  const stop = progress?.stop;
  const askId = `stop-upload-${lead.queueId}`;
  const onStop =
    stop && stoppable
      ? () =>
          askToStop({
            port: exportToasts,
            id: askId,
            stop: () => stop(lead.queueId),
          })
      : undefined;
  return { now, stoppable, askId, onStop };
}

/**
 * THE x'S ONE QUESTION, KEPT BY THE PICK, NEVER BY A TILE: the stack's slot unmounts when the window scrolls it away,
 * and the stand-in comes and goes with her sight, so neither may withdraw a question still meant. Keyed on the lead.
 */
function StackQuestion({
  lead,
  progress,
}: {
  lead: PendingTile;
  progress: QueueProgress | null;
}) {
  const { stoppable, askId } = useStackLead(lead, progress);
  // The file leaves the stack (landed, failed, stopped): a question still standing about it goes with it.
  useEffect(() => () => withdrawStopQuestion(exportToasts, askId), [askId]);
  // ★ AND SO DOES THE x'S GOING (red-team 54b's NIT): once the bytes are up its complete is coming, the x is gone, and an
  // unanswered "Stop this upload?" outlived it by the complete's whole length (7 s on a held line) still offering a Stop
  // upload that could only answer too late. Nothing is said: the file landing is the answer.
  useEffect(() => {
    if (!stoppable) withdrawStopQuestion(exportToasts, askId);
  }, [stoppable, askId]);
  return null;
}

/** The stack at the album's head, reading its own file's progress as it goes, and telling whether she can see it. */
function LiveStackTile({
  lead,
  remaining,
  progress,
  onSight,
}: {
  lead: PendingTile;
  remaining: number;
  progress: QueueProgress | null;
  onSight: (inView: boolean) => void;
}) {
  const { now, onStop } = useStackLead(lead, progress);
  const ref = useStackSight(onSight);
  return (
    <UploadStackTile
      ref={ref}
      file={lead.file}
      url={lead.url}
      progress={now}
      remaining={remaining}
      onStop={onStop}
    />
  );
}

/** The stand-in in view, reading the same lead as the stack. */
function LiveStandIn({
  doc,
  lead,
  remaining,
  progress,
}: {
  doc: Document;
  lead: PendingTile;
  remaining: number;
  progress: QueueProgress | null;
}) {
  const { now, onStop } = useStackLead(lead, progress);
  return (
    <SendingStandIn
      doc={doc}
      file={lead.file}
      url={lead.url}
      progress={now}
      remaining={remaining}
      onStop={onStop}
    />
  );
}

/** At least this share of the stack in view is her seeing it (a sliver under the bar or the foot is not). */
const STACK_SEEN_RATIO = 0.5;

/**
 * WHETHER SHE CAN SEE THE STACK, as a callback ref: an observer on its box, reporting in view or not, and out of view
 * when the box goes (the window unmounted its row, or the pick moved on). An engine with no observer (jsdom) reports
 * nothing, and the stack is taken as seen: no stand-in is drawn where none can be judged.
 */
function useStackSight(onSight: (inView: boolean) => void) {
  const report = useRef(onSight);
  useEffect(() => {
    report.current = onSight;
  });
  return useCallback((el: HTMLDivElement | null) => {
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry)
          report.current(
            entry.isIntersecting && entry.intersectionRatio >= STACK_SEEN_RATIO,
          );
      },
      { threshold: [0, STACK_SEEN_RATIO] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      report.current(false);
    };
  }, []);
}

/**
 * HOW LONG THE STACK MAY BE OUT OF SIGHT BEFORE ITS STAND-IN COMES: a beat, so a lead handing over to the next file (its
 * slot remounting) or a row the window is about to mount never flashes the pill.
 */
const STAND_IN_DELAY_MS = 250;

/**
 * WHETHER THE STAND-IN IS DRAWN: a pick in flight whose stack she has not seen for a beat. A stack never mounted (the
 * window lays only the rows around her, so the end of a long album in order is not in the DOM at all) is not seen;
 * an engine with no observer judges nothing and draws no stand-in.
 */
function useStandIn(active: boolean) {
  const [seen, setSeen] = useState(
    () => typeof IntersectionObserver === "undefined",
  );
  // Each loss of sight is its own count, and the beat's timer answers for the loss it began on, so a stack seen again
  // (or a pick ended: its box going reports a loss) never lets an older timer draw the stand-in.
  const [lost, setLost] = useState(0);
  const [fired, setFired] = useState(-1);
  const onSight = useCallback((inView: boolean) => {
    setSeen(inView);
    if (!inView) setLost((n) => n + 1);
  }, []);
  useEffect(() => {
    if (!active || seen) return;
    const t = setTimeout(() => setFired(lost), STAND_IN_DELAY_MS);
    return () => clearTimeout(t);
  }, [active, seen, lost]);
  return { away: active && !seen && fired === lost, onSight };
}

/** Whether a layer is over the album (the viewer, a dialog): the stand-in waits behind it, as the news pill does. */
function useLayerUp(on: boolean): boolean {
  const [up, setUp] = useState(false);
  useEffect(() => {
    if (!on || typeof document === "undefined") return;
    const read = () => setUp(layerIsUp({ dialogsOnly: true }));
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.body, { childList: true });
    return () => mo.disconnect();
  }, [on]);
  return on && up;
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
  anchor = "end",
  lens,
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
  /** The fixed end (`RowAnchor`): "end" for newest first, "start" for the night in order. */
  anchor?: RowAnchor;
  /** Her lens on the album (its filter): what a new lens reveals is no arrival. */
  lens?: string;
}) {
  const likeAction = useLikeAction();
  // ★ AN ARRIVAL LANDS COMPLETE OR NOT UNTIL IT CAN (crumbs-23): the rows lay what is in the album, less
  // the arrivals still waiting for their photograph, and the glow is lit as each one lands.
  const gate = useArrivalGate(items, arrivals, onNeedLinks);
  // What the rows judge as news: the same arrivals, through the same lens (one object while neither moves).
  const news = useMemo<AlbumNews>(
    () => ({ arrivals: arrivals ?? NO_ARRIVALS, lens }),
    [arrivals, lens],
  );

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
  // ★ AND WHERE SHE CANNOT SEE IT, IT STANDS IN VIEW (red-team 56's MEDIUM): the stack keeps the slot her photograph
  // lands in, the end of an album in order, and while that slot is out of her sight its stand-in carries the bar and
  // the x where she is (`sending-stand-in.tsx`).
  const standIn = useStandIn(lead !== undefined);
  const layerUp = useLayerUp(standIn.away);

  return (
    <AlbumNewsContext value={news}>
      <MasonryColumns
        layout="rows"
        items={gate.items}
        stagger
        rowStep={step}
        onRowStepChange={onStepChange}
        rowAnchor={anchor}
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
                onSight={standIn.onSight}
              />
            )}
          </>
        }
      />
      {lead && (
        <StackQuestion key={lead.queueId} lead={lead} progress={progress} />
      )}
      {lead && standIn.away && !layerUp && typeof document !== "undefined" && (
        <LiveStandIn
          doc={document}
          lead={lead}
          remaining={pending.length}
          progress={progress}
        />
      )}
    </AlbumNewsContext>
  );
}

const NO_ARRIVALS: readonly string[] = [];
