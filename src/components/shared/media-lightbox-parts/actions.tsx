"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Download,
  Eye,
  EyeOff,
  Link2,
  Loader2,
  Share2,
  Trash2,
  Undo2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";

import type { GridMedia } from "@/components/app/media-grid";
import { LikeButton, LikeCountBadge } from "@/components/likes/like-button";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import {
  copyText,
  filenameFor,
  photoLink,
  saveToPhotos,
  shareFile,
  shareMedia,
  type NavigatorLike,
  type Platform,
} from "@/lib/media/share-save";
import { cn } from "@/lib/utils";

/**
 * THE FLOATING ACTION CAPSULE (`holds=pills`, Will 2026-09-24: "More visible in
 * the lightbox. Additionally, it gives more room for longer guest names by
 * stacking the actions."). One capsule at the foot, apart from the credit (which
 * moved to the top), carrying every action on the photograph: the enjoy group
 * for everyone and, for the host, a divider and the curate group; in the
 * recovery bin, the bin's Restore and Delete permanently.
 *
 * ★ SHARE SENDS THE PICTURE, COPY LINK SENDS THE PLACE, SAVE FOLLOWS THE
 * PLATFORM (`link=file` and his notes; the decision tree is
 * `lib/media/share-save.ts`, tested over mocked navigators). The file is
 * fetched on the tap and never before; a fetch that outlives the tap's
 * activation turns the button into a one-tap "Ready" instead of failing.
 *
 * ★ A CONTROL THAT SENDS THE PHOTOGRAPH WAITS FOR ITS LINK, IN PLACE. The paged
 * album hands the viewer items whose links are not minted yet (`url` is "").
 * Save and Share send the file, so they wait for its link, and Copy link waits
 * with them, so the three ways of sending a photograph arrive together and
 * nobody copies the address of a picture that has not appeared. They wait
 * DISABLED, never removed: a capsule that grew three controls when the link
 * landed would jump under the thumb already reaching for it. Like, Delete and
 * the curate group work by id and never wait.
 */

/** A capsule glyph: white at rest, its hue on direct hover (monochrome at rest). */
export const LIGHTBOX_ACTION = cn(
  "relative flex items-center gap-1.5 text-white/80 outline-none transition-[color,transform] duration-150 ease-emphasis",
  "hover:text-white focus-visible:text-white active:scale-90 motion-reduce:active:scale-100",
  // Waiting for a link (above): dimmed and inert, so no hover hue and no
  // tooltip promise a control that cannot act yet.
  "disabled:pointer-events-none disabled:opacity-40",
  GLASS_MARK_LIT,
);

/** A divider between the capsule's groups. */
function Rule() {
  return <span aria-hidden className="h-5 w-px shrink-0 bg-white/20" />;
}

/**
 * THE HOST'S REMOVAL, SAID ONCE. It is restorable, so it names the place the item
 * waits (Deleted, the app's one word for it) and the window, read off the
 * constant. Two confirms say it because two doors do it: the curate group's
 * Remove, and a host deleting their OWN upload from the personal Uploads.
 */
function HostRemovalWords() {
  return (
    <>
      It disappears from the album right away and moves to Deleted, where you
      can restore it for {RECENTLY_DELETED_WINDOW_DAYS} days. Guests won&rsquo;t
      see it.
    </>
  );
}

/**
 * THE BIN'S FINAL DELETE, SAID ONCE: the confirm behind Delete permanently,
 * opened from the bin's tile pane at a desk and from its viewer at every width
 * (`recently-deleted-grid.tsx` wraps its own trigger in the same `Dialog`). It
 * skips the window, so it names the window it skips, read off the constant.
 */
export function PurgeConfirmContent({
  onConfirm,
  disabled,
}: {
  onConfirm: () => void;
  disabled?: boolean;
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete permanently?</DialogTitle>
        <DialogDescription>
          This skips the {RECENTLY_DELETED_WINDOW_DAYS}-day recovery window and
          deletes the file for good. It can&rsquo;t be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="destructive" disabled={disabled} onClick={onConfirm}>
            Delete permanently
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}

type Prep =
  | { kind: "share" | "photos"; state: "loading" }
  | { kind: "share" | "photos"; state: "ready"; file: File };

/** The "Ready" word a lapsed tap leaves on its button: tap once more to send. */
function ReadyWord() {
  return (
    <span data-lightbox-ready className="text-caption font-medium text-white">
      Ready
    </span>
  );
}

/** The live navigator, as the pure helpers read it (tests replace its fields). */
function currentNav(): NavigatorLike {
  return typeof navigator === "undefined" ? {} : (navigator as NavigatorLike);
}

/** A hidden anchor click: the plain download, from a place that is not a link. */
function download(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Memoised: the viewer re-renders on every frame of a swipe, and none of that
 * reaches the capsule (its props hold still until the photograph changes).
 */
export const ActionCapsule = memo(function ActionCapsule({
  item,
  platform,
  viewerIsHost,
  shareUrl,
  canDeleteThis,
  onDelete,
  deleteConsequence,
  onSetStatus,
  onRemove,
  onRestore,
  onPurge,
  soundMuted,
  onToggleSound,
}: {
  item: GridMedia;
  platform: Platform;
  viewerIsHost: boolean;
  /** The PUBLIC album link (the event's join link), where the surface shares at all. */
  shareUrl?: string;
  canDeleteThis: boolean;
  onDelete?: (item: GridMedia) => void;
  deleteConsequence: string | null;
  onSetStatus?: (item: GridMedia, status: "approved" | "hidden") => void;
  onRemove?: (item: GridMedia) => void;
  /** The bin's two verbs (the recovery bin only): back to the album, and gone for good. */
  onRestore?: (item: GridMedia) => void;
  onPurge?: (item: GridMedia) => void;
  /**
   * A video's sound (undefined for a photograph), which lives here now that the
   * credit holds the top-left corner.
   */
  soundMuted?: boolean;
  onToggleSound: () => void;
}) {
  const [prep, setPrep] = useState<Prep | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // The capsule is keyed by item, so leaving a photograph (or closing the
  // viewer) aborts a fetch nobody is waiting for any more.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Only an approved photograph has a public address; a pending or hidden one
  // opens the album plainly for anyone else, so its link would say nothing.
  const approved = (item.status ?? "approved") === "approved";
  const link = shareUrl
    ? approved
      ? photoLink(shareUrl, item.id)
      : shareUrl
    : undefined;
  const name = filenameFor(item);
  // Every surface's item carries a view link once it has any (the paged
  // album's unlinked item has ""), so this is the one test for "not yet".
  const linked = !!item.url;
  const fileUrl = item.downloadUrl ?? item.url;

  const begin = (kind: Prep["kind"]) => {
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    setPrep({ kind, state: "loading" });
    return ctl;
  };

  /** A second tap on "Ready": the file is in hand and the tap is fresh. */
  const sendReady = useCallback(
    async (file: File, kind: Prep["kind"]) => {
      setPrep(null);
      const out = await shareFile(file, currentNav());
      if (out.kind === "needs-tap") setPrep({ kind, state: "ready", file });
      else if (out.kind === "failed" || out.kind === "unsupported") {
        if (kind === "photos" && item.downloadUrl) download(item.downloadUrl);
        else toast.error("Couldn't share this one.");
      }
    },
    [item.downloadUrl],
  );

  const onShare = async () => {
    // Belt to the disabled button's braces: an empty file url would fetch the
    // PAGE (it resolves against the page's own address).
    if (!linked) return;
    if (prep?.state === "ready" && prep.kind === "share")
      return sendReady(prep.file, "share");
    if (prep?.state === "loading") return;
    const ctl = begin("share");
    const out = await shareMedia(
      { fileUrl, name, link },
      { nav: currentNav(), signal: ctl.signal },
    );
    if (ctl.signal.aborted) return;
    if (out.kind === "needs-tap") {
      setPrep({ kind: "share", state: "ready", file: out.file });
      return;
    }
    setPrep(null);
    if (out.kind === "copied") toast.success("Link copied.");
    else if (out.kind === "failed") toast.error("Couldn't share this one.");
  };

  const onSaveToPhotos = async () => {
    if (!item.downloadUrl) return;
    if (prep?.state === "ready" && prep.kind === "photos")
      return sendReady(prep.file, "photos");
    if (prep?.state === "loading") return;
    const ctl = begin("photos");
    const out = await saveToPhotos(
      { fileUrl: item.downloadUrl, name },
      { nav: currentNav(), signal: ctl.signal },
    );
    if (ctl.signal.aborted) return;
    if (out.kind === "needs-tap") {
      setPrep({ kind: "photos", state: "ready", file: out.file });
      return;
    }
    setPrep(null);
    if (out.kind === "download") download(item.downloadUrl);
  };

  const onCopyLink = async () => {
    if (!link || !linked) return;
    if (await copyText(link, currentNav())) toast.success("Link copied.");
    else toast.error("Couldn't copy the link.");
  };

  const loading = (kind: Prep["kind"]) =>
    prep?.kind === kind && prep.state === "loading";
  const ready = (kind: Prep["kind"]) =>
    prep?.kind === kind && prep.state === "ready";

  // ★ THE BIN NEVER SAVES (its items carry no download link, by design), so its
  // capsule holds no place for a Save that would never come: a waiting glyph
  // that vanished when the link landed would slide Restore and Delete
  // permanently out from under the thumb reaching for them.
  const binned = !!(onRestore || onPurge);
  let save: ReactNode = null;
  if (!linked && !binned) {
    // Waiting (the header): the glyph holds Save's place. An album item's
    // download link arrives with its view link (the wire mints both at once),
    // so this becomes the real Save below.
    save = (
      <button
        type="button"
        disabled
        aria-label="Save"
        className={cn(LIGHTBOX_ACTION, "hover:text-save")}
      >
        <Download className="size-5" />
      </button>
    );
  } else if (item.downloadUrl) {
    if (platform !== "ios") {
      // Android's download lands in the gallery and a desk downloads: the
      // plain signed link IS the native way, so it stays a link.
      save = (
        <ActionTooltip label="Save">
          <a
            href={item.downloadUrl}
            download
            aria-label="Save"
            className={cn(LIGHTBOX_ACTION, "hover:text-save")}
          >
            <Download className="size-5" />
          </a>
        </ActionTooltip>
      );
    } else {
      // ★ ONE BUTTON, IDLE THROUGH READY (save-sheet, Will's iPhone check): the
      // system sheet already carries every way to keep the file — "Save Image"
      // or "Save Video" into Photos, "Save to Files" beside it — so there is no
      // second, plain-download choice left to offer, and no menu to open first.
      const label = ready("photos")
        ? "Ready to save. Tap to save."
        : loading("photos")
          ? "Preparing to save"
          : "Save";
      save = (
        <ActionTooltip label={label}>
          <button
            type="button"
            aria-label={label}
            aria-busy={loading("photos") || undefined}
            onClick={onSaveToPhotos}
            className={cn(LIGHTBOX_ACTION, "hover:text-save")}
          >
            {loading("photos") ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Download className="size-5" />
            )}
            {ready("photos") && <ReadyWord />}
          </button>
        </ActionTooltip>
      );
    }
  }

  const shareLabel = ready("share")
    ? "Ready to share. Tap to share."
    : loading("share")
      ? "Preparing to share"
      : "Share";

  return (
    <div
      data-lightbox-capsule
      className={cn(
        "pointer-events-auto flex max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-full px-4 py-2.5 sm:gap-4 sm:px-5",
        GLASS,
      )}
    >
      {soundMuted !== undefined && (
        <>
          <ActionTooltip
            label={soundMuted ? "Turn sound on" : "Turn sound off"}
          >
            <button
              type="button"
              aria-label={soundMuted ? "Turn sound on" : "Turn sound off"}
              aria-pressed={!soundMuted}
              onClick={onToggleSound}
              className={LIGHTBOX_ACTION}
            >
              {soundMuted ? (
                <VolumeX className="size-5" />
              ) : (
                <Volume2 className="size-5" />
              )}
            </button>
          </ActionTooltip>
          <Rule />
        </>
      )}

      {/* the enjoy group (guest + host). A photograph in the bin is on its way
          out, so the bin's capsule carries its two verbs and nothing to enjoy,
          even under a likes store (the lab's scale page keeps one above it). */}
      {!binned && <LikeButton item={item} />}
      {!binned && <LikeCountBadge count={item.likeCount} />}
      {save}
      {shareUrl && (
        <ActionTooltip label={shareLabel}>
          <button
            type="button"
            disabled={!linked}
            onClick={() => void onShare()}
            aria-label={shareLabel}
            aria-busy={loading("share") || undefined}
            className={cn(LIGHTBOX_ACTION, "hover:text-save")}
          >
            {loading("share") ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Share2 className="size-5" />
            )}
            {ready("share") && <ReadyWord />}
          </button>
        </ActionTooltip>
      )}
      {shareUrl && approved && (
        <ActionTooltip label="Copy link">
          <button
            type="button"
            disabled={!linked}
            onClick={() => void onCopyLink()}
            aria-label="Copy link"
            className={cn(LIGHTBOX_ACTION, "hover:text-save")}
          >
            <Link2 className="size-5" />
          </button>
        </ActionTooltip>
      )}

      {/* The uploader's OWN delete (the guest album and the personal Uploads).
          ★ A GUEST'S OWN DELETE IS FINAL, AND SAYS SO (Will, 2026-09-23: "I want
          it gone everywhere, not still visible to the host as well"): no window
          and no place it waits. ★ A HOST'S OWN UPLOAD is the one exception
          (`isHost`, which only the personal Uploads pairs with this Trash): its
          delete is restorable, so it says the host's words. */}
      {onDelete && canDeleteThis && (
        <Dialog>
          <ActionTooltip label="Delete">
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label="Delete"
                className={cn(LIGHTBOX_ACTION, "hover:text-destructive")}
              >
                <Trash2 className="size-5" />
              </button>
            </DialogTrigger>
          </ActionTooltip>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this upload?</DialogTitle>
              <DialogDescription>
                {item.isHost ? (
                  <HostRemovalWords />
                ) : (
                  <>
                    It&rsquo;s deleted from the event right away and can&rsquo;t
                    be recovered.
                  </>
                )}
                {deleteConsequence && ` ${deleteConsequence}`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive" onClick={() => onDelete(item)}>
                  Delete
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* the curate group (HOST only): hide/show are reversible and direct;
          remove waits behind a confirm. No Approve: pending media lives in the
          Review room and never reaches an album grid, so the viewer is never
          handed one to approve. The live reel makes itself, so nothing here
          curates a reel. */}
      {viewerIsHost && onSetStatus && (
        <>
          <Rule />
          {item.status === "hidden" ? (
            // Hidden = the amber Show is ACTIVE, not just on hover: the viewer's
            // hidden-state marker (mirrors the liked heart).
            <ActionTooltip label="Show">
              <button
                type="button"
                aria-label="Show"
                onClick={() => onSetStatus(item, "approved")}
                className={cn(
                  LIGHTBOX_ACTION,
                  "text-warning hover:text-warning",
                )}
              >
                <Eye className="size-5 fill-warning/25" />
              </button>
            </ActionTooltip>
          ) : (
            <ActionTooltip label="Hide">
              <button
                type="button"
                aria-label="Hide"
                onClick={() => onSetStatus(item, "hidden")}
                className={cn(LIGHTBOX_ACTION, "hover:text-warning")}
              >
                <EyeOff className="size-5" />
              </button>
            </ActionTooltip>
          )}
          {onRemove && (
            <Dialog>
              <ActionTooltip label="Remove">
                <DialogTrigger asChild>
                  <button
                    type="button"
                    aria-label="Remove"
                    className={cn(LIGHTBOX_ACTION, "hover:text-destructive")}
                  >
                    <Trash2 className="size-5" />
                  </button>
                </DialogTrigger>
              </ActionTooltip>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Remove this item?</DialogTitle>
                  <DialogDescription>
                    <HostRemovalWords />
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      variant="destructive"
                      onClick={() => onRemove(item)}
                    >
                      Remove
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}

      {/* THE BIN'S TWO VERBS (album-fixes; Will's question from
          album-host-wiring, its recommended answer): the tile pane that
          carries them is a desk's, so on a phone the viewer is the only place
          they can live, and at a desk it carries them too, as the album's
          viewer carries the album's. Restore is reversible and acts at once;
          Delete permanently skips the window, so it confirms first. */}
      {onRestore && (
        <ActionTooltip label="Restore">
          <button
            type="button"
            aria-label="Restore"
            onClick={() => onRestore(item)}
            className={LIGHTBOX_ACTION}
          >
            <Undo2 className="size-5" />
          </button>
        </ActionTooltip>
      )}
      {onPurge && (
        <Dialog>
          <ActionTooltip label="Delete permanently">
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label="Delete permanently"
                className={cn(LIGHTBOX_ACTION, "hover:text-destructive")}
              >
                <Trash2 className="size-5" />
              </button>
            </DialogTrigger>
          </ActionTooltip>
          <PurgeConfirmContent onConfirm={() => onPurge(item)} />
        </Dialog>
      )}
    </div>
  );
});
