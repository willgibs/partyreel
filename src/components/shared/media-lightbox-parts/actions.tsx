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
  Check,
  Download,
  Eye,
  EyeOff,
  FileDown,
  Images,
  Link2,
  Loader2,
  Share2,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";

import type { GridMedia } from "@/components/app/media-grid";
import { LikeButton, LikeCountBadge } from "@/components/likes/like-button";
import { ReelButton } from "@/components/reel/reel-button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
 * for everyone and, for the host, a divider and the curate group.
 *
 * ★ SHARE SENDS THE PICTURE, COPY LINK SENDS THE PLACE, SAVE FOLLOWS THE
 * PLATFORM (`link=file` and his notes; the decision tree is
 * `lib/media/share-save.ts`, tested over mocked navigators). The file is
 * fetched on the tap and never before; a fetch that outlives the tap's
 * activation turns the button into a one-tap "Ready" instead of failing.
 */

/** A capsule glyph: white at rest, its hue on direct hover (monochrome at rest). */
export const LIGHTBOX_ACTION = cn(
  "relative flex items-center gap-1.5 text-white/80 outline-none transition-[color,transform] duration-150 ease-emphasis",
  "hover:text-white focus-visible:text-white active:scale-90 motion-reduce:active:scale-100",
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
    if (!link) return;
    if (await copyText(link, currentNav())) toast.success("Link copied.");
    else toast.error("Couldn't copy the link.");
  };

  const loading = (kind: Prep["kind"]) =>
    prep?.kind === kind && prep.state === "loading";
  const ready = (kind: Prep["kind"]) =>
    prep?.kind === kind && prep.state === "ready";

  let save: ReactNode = null;
  if (item.downloadUrl) {
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
    } else if (ready("photos") || loading("photos")) {
      // Mid-flight or ready, Save is one button: the menu already chose.
      const label = ready("photos")
        ? "Ready to save. Tap to save."
        : "Preparing to save";
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
    } else {
      // ★ PHOTOS FIRST ON iOS (his "priority option of native photo library"),
      // the file second ("not looking to reduce ways to download").
      save = (
        <DropdownMenu>
          <ActionTooltip label="Save">
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Save"
                className={cn(LIGHTBOX_ACTION, "hover:text-save")}
              >
                <Download className="size-5" />
              </button>
            </DropdownMenuTrigger>
          </ActionTooltip>
          <DropdownMenuContent
            side="top"
            align="center"
            className="w-auto min-w-48"
          >
            <DropdownMenuItem onSelect={() => void onSaveToPhotos()}>
              <Images />
              Save to Photos
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={item.downloadUrl} download>
                <FileDown />
                Download file
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

      {/* the enjoy group (guest + host) */}
      <LikeButton item={item} />
      <LikeCountBadge count={item.likeCount} />
      {save}
      {shareUrl && (
        <ActionTooltip label={shareLabel}>
          <button
            type="button"
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

      {/* the curate group (HOST only): approve/hide/show are reversible and
          direct; remove waits behind a confirm. The reel's "Add to reel" stays
          until the reel teardown lane removes it. */}
      {viewerIsHost && onSetStatus && (
        <>
          <Rule />
          {item.status === "approved" && <ReelButton item={item} />}
          {item.status === "pending" && (
            <ActionTooltip label="Approve">
              <button
                type="button"
                aria-label="Approve"
                onClick={() => onSetStatus(item, "approved")}
                className={cn(LIGHTBOX_ACTION, "hover:text-success")}
              >
                <Check className="size-5" />
              </button>
            </ActionTooltip>
          )}
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
    </div>
  );
});
