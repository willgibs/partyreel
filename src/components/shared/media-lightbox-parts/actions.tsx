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
  Flag,
  Link2,
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
  Popup,
  PopupClose,
  PopupContent,
  PopupFooter,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import { requestPhotoReport, useReportDoorOpen } from "@/lib/guest/report-door";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import {
  copyText,
  filenameFor,
  photoLink,
  saveToPhotos,
  shareFile,
  shareMedia,
  type FetchProgress,
  type NavigatorLike,
  type Platform,
  type SaveOutcome,
  type ShareOutcome,
} from "@/lib/media/share-save";
import { PROGRESS_EVERY_MS } from "@/lib/media/share-save-held";
import { cn } from "@/lib/utils";

import { heldFraction, useHeld, useHeldStore } from "./held";
import { PurgeConfirmContent } from "./purge-confirm";

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
 * `lib/media/share-save.ts`, tested over mocked navigators).
 *
 * ★ A PHOTOGRAPH'S SAVE AND SHARE SEND THE BYTES ON SCREEN, INSIDE THE TAP
 * (save-speed, Will's 30 s on his iPhone). The viewer holds the original it
 * draws (`held.tsx`), so a tap meets a file in hand and the sheet opens in the
 * same event. A tap that comes while those bytes are still on their way waits on
 * THAT download (never a second one) and a clip, which is never held, fetches
 * its own: either way the button draws how far it has come, a ring with a stop
 * in it, and a tap on it stops the wait. A file that lands after the tap's
 * activation lapsed turns the button into a one-tap "Ready" instead of failing.
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
 *
 * ★ THE WINDOW AND ITS WORD ARE ONE STRING, ON PURPOSE. Next's SWC drops the
 * leading space of a JSX text that runs over several lines and holds an entity
 * (the `&rsquo;`), so `{N} days. Guests won&rsquo;t` read "30days" on every
 * build (build 20's red-team), and a `{" "}` would not hold: prettier folds it
 * back into the text. The test runner's own JSX transform keeps the space,
 * which is why jsx-text-space-policy compiles with SWC itself.
 */
function HostRemovalWords() {
  return (
    <>
      It disappears from the album right away and moves to Deleted, where you
      can restore it for {`${RECENTLY_DELETED_WINDOW_DAYS} days`}. Guests
      won&rsquo;t see it.
    </>
  );
}

type Act = "share" | "photos";

/**
 * A tap that is waiting for its file, and where the wait's bytes come from:
 * `held`, the download the viewer is already making for the photograph on
 * screen, or `own`, the tap's own (a clip, or a photograph nothing holds).
 */
type Prep =
  | {
      kind: Act;
      state: "pending";
      via: "held" | "own";
      received: number;
      total: number | null;
    }
  | { kind: Act; state: "ready"; file: File };

/** The "Ready" word a lapsed tap leaves on its button: tap once more to send. */
function ReadyWord() {
  return (
    <span data-lightbox-ready className="text-caption font-medium text-white">
      Ready
    </span>
  );
}

const RING_R = 8.25;
const RING_C = 2 * Math.PI * RING_R;

/**
 * HOW FAR A WAIT HAS COME, AND THAT A TAP STOPS IT: a ring that fills with the
 * bytes and a stop square in it, the download button every phone already knows.
 * Before the answer has said how big the file is (`fraction` null), a quarter of
 * the ring turns, still around the stop; under reduced motion it holds still.
 */
export function ProgressGlyph({ fraction }: { fraction: number | null }) {
  const known = fraction !== null;
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden
      data-lightbox-progress={known ? Math.round(fraction * 100) : "unknown"}
      className="size-5"
    >
      <circle
        cx="10"
        cy="10"
        r={RING_R}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.28}
        strokeWidth={1.75}
      />
      <g
        className={cn(
          "origin-center",
          !known && "animate-spin motion-reduce:animate-none",
        )}
      >
        <circle
          cx="10"
          cy="10"
          r={RING_R}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={known ? RING_C * (1 - fraction) : RING_C * 0.75}
          transform="rotate(-90 10 10)"
          className="transition-[stroke-dashoffset] duration-150 ease-emphasis motion-reduce:transition-none"
        />
      </g>
      <rect x="7" y="7" width="6" height="6" rx="1.25" fill="currentColor" />
    </svg>
  );
}

/** The live navigator, as the pure helpers read it (tests replace its fields). */
function currentNav(): NavigatorLike {
  return typeof navigator === "undefined" ? {} : (navigator as NavigatorLike);
}

/** A hidden anchor click: the plain download, from a place that is not a link. */
function download(url: string, name?: string) {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  if (name) a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * THE DESK'S AND ANDROID'S SAVE, FROM THE BYTES ON SCREEN: a held original is
 * saved from memory under the server's own name, so the download is instant and
 * nothing is fetched twice. Its object URL is its own (the store revokes the one
 * it draws with on its own clock) and outlives the click by a minute, which a
 * download that has started no longer needs.
 */
function saveHeld(file: File) {
  const href = URL.createObjectURL(file);
  download(href, file.name);
  setTimeout(() => URL.revokeObjectURL(href), 60_000);
}

/** The held file under the name Save gives it (the store may have named it first). */
function named(file: File, name: string): File {
  return file.name === name
    ? file
    : new File([file], name, { type: file.type });
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
  // A report form listens only on the guest's album (report-door.ts): anywhere else, no Report is drawn.
  const reportDoor = useReportDoorOpen();
  // The original the viewer holds for this photograph (`held.tsx`), if it does.
  const store = useHeldStore();
  const held = useHeld(store, item.id);
  const heldFile = held?.kind === "held" ? held.file : null;
  const heldComing = held?.kind === "waiting" || held?.kind === "loading";

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

  /** The wait starts: on the viewer's own download when it is making one, else the tap's. */
  const begin = (kind: Act) => {
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    setPrep({
      kind,
      state: "pending",
      via: heldComing ? "held" : "own",
      received: 0,
      total: null,
    });
    return ctl;
  };

  /** A tap on a wait stops it: the tap's own download goes; the viewer's own carries on drawing. */
  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPrep(null);
  };

  /** The tap's own download, drawn on its button at most every `PROGRESS_EVERY_MS`. */
  const progressOf = (kind: Act, ctl: AbortController): FetchProgress => {
    let painted = 0;
    return (received, total) => {
      if (ctl.signal.aborted) return;
      const t = performance.now();
      if (t - painted < PROGRESS_EVERY_MS && received !== total) return;
      painted = t;
      setPrep({ kind, state: "pending", via: "own", received, total });
    };
  };

  /**
   * The file a waiting tap will send: the viewer's own download when it is
   * making one (never a second), else nothing, and the tap fetches its own.
   */
  const heldForTap = async (kind: Act, ctl: AbortController) => {
    if (!store || !heldComing) return undefined;
    const file = await store.whenHeld(item.id, ctl.signal);
    if (ctl.signal.aborted) return undefined;
    // The viewer's download went plain (too big, stalled, refused): the tap
    // fetches its own, from a fresh request, and draws that one instead.
    if (!file)
      setPrep({ kind, state: "pending", via: "own", received: 0, total: null });
    return file ? named(file, name) : undefined;
  };

  /** A second tap on "Ready": the file is in hand and the tap is fresh. */
  const sendReady = useCallback(
    async (file: File, kind: Act) => {
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

  const settleShare = (out: ShareOutcome) => {
    if (out.kind === "needs-tap") {
      setPrep({ kind: "share", state: "ready", file: out.file });
      return;
    }
    setPrep(null);
    if (out.kind === "copied") toast.success("Link copied.");
    else if (out.kind === "failed") toast.error("Couldn't share this one.");
  };

  const onShare = async () => {
    // Belt to the disabled button's braces: an empty file url would fetch the
    // PAGE (it resolves against the page's own address).
    if (!linked) return;
    if (prep?.state === "ready" && prep.kind === "share")
      return sendReady(prep.file, "share");
    // A tap on its own wait stops it; a tap on the other act takes over from it.
    if (prep?.state === "pending" && prep.kind === "share") return stop();
    if (heldFile) {
      stop();
      // ★ In hand: into the sheet inside this tap (no await before `share()`).
      settleShare(
        await shareMedia(
          { file: named(heldFile, name), name, link },
          { nav: currentNav() },
        ),
      );
      return;
    }
    const ctl = begin("share");
    const file = await heldForTap("share", ctl);
    if (ctl.signal.aborted) return;
    const out = await shareMedia(
      { file, fileUrl, name, link },
      {
        nav: currentNav(),
        signal: ctl.signal,
        onProgress: progressOf("share", ctl),
      },
    );
    if (ctl.signal.aborted) return;
    settleShare(out);
  };

  const settleSave = (out: SaveOutcome, url: string) => {
    if (out.kind === "needs-tap") {
      setPrep({ kind: "photos", state: "ready", file: out.file });
      return;
    }
    setPrep(null);
    if (out.kind === "download") download(url);
  };

  const onSaveToPhotos = async () => {
    const url = item.downloadUrl;
    if (!url) return;
    if (prep?.state === "ready" && prep.kind === "photos")
      return sendReady(prep.file, "photos");
    if (prep?.state === "pending" && prep.kind === "photos") return stop();
    if (heldFile) {
      stop();
      // ★ In hand: into the sheet inside this tap (no await before `share()`).
      settleSave(
        await saveToPhotos(
          { file: named(heldFile, name), fileUrl: url, name },
          { nav: currentNav() },
        ),
        url,
      );
      return;
    }
    const ctl = begin("photos");
    const file = await heldForTap("photos", ctl);
    if (ctl.signal.aborted) return;
    const out = await saveToPhotos(
      { file, fileUrl: url, name },
      {
        nav: currentNav(),
        signal: ctl.signal,
        onProgress: progressOf("photos", ctl),
      },
    );
    if (ctl.signal.aborted) return;
    settleSave(out, url);
  };

  const onCopyLink = async () => {
    if (!link || !linked) return;
    if (await copyText(link, currentNav())) toast.success("Link copied.");
    else toast.error("Couldn't copy the link.");
  };

  const pending = (kind: Act) =>
    prep?.kind === kind && prep.state === "pending";
  const ready = (kind: Act) => prep?.kind === kind && prep.state === "ready";
  /** How far the wait has come: the viewer's download, or the tap's own. */
  const fraction =
    prep?.state !== "pending"
      ? null
      : prep.via === "held"
        ? held?.kind === "held"
          ? 1
          : heldFraction(held)
        : prep.total
          ? Math.min(1, prep.received / prep.total)
          : null;

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
      // plain signed link IS the native way, so it stays a link. A held
      // original is saved from memory instead (`saveHeld`): the same file under
      // the same name, at once, and never fetched twice.
      save = (
        <ActionTooltip label="Save">
          <a
            href={item.downloadUrl}
            download
            aria-label="Save"
            onClick={(e) => {
              if (!heldFile) return;
              e.preventDefault();
              saveHeld(named(heldFile, name));
            }}
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
        : pending("photos")
          ? "Preparing to save. Tap to stop."
          : "Save";
      save = (
        <ActionTooltip label={label}>
          <button
            type="button"
            aria-label={label}
            aria-busy={pending("photos") || undefined}
            onClick={() => void onSaveToPhotos()}
            className={cn(LIGHTBOX_ACTION, "hover:text-save")}
          >
            {pending("photos") ? (
              <ProgressGlyph fraction={fraction} />
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
    : pending("share")
      ? "Preparing to share. Tap to stop."
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
            aria-busy={pending("share") || undefined}
            className={cn(LIGHTBOX_ACTION, "hover:text-save")}
          >
            {pending("share") ? (
              <ProgressGlyph fraction={fraction} />
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

      {/* A PHOTO'S OWN REPORT (admin-triage r2: "A photo can be reported"): the album's one report form,
          opened with this photograph named. Only where that form listens (the guest's album), never on
          the host's own album (her curate group removes it in one tap), never on the viewer's own upload
          (her Delete is right beside it) and never in the bin. */}
      {reportDoor &&
        !binned &&
        !viewerIsHost &&
        !(onDelete && canDeleteThis) && (
          <ActionTooltip label="Report">
            <button
              type="button"
              aria-label={`Report this ${item.type}`}
              onClick={() =>
                requestPhotoReport({
                  mediaId: item.id,
                  type: item.type,
                  previewUrl: item.previewUrl ?? (linked ? item.url : null),
                })
              }
              className={cn(LIGHTBOX_ACTION, "hover:text-destructive")}
            >
              <Flag className="size-5" />
            </button>
          </ActionTooltip>
        )}

      {/* The uploader's OWN delete (the guest album and the personal Uploads).
          ★ A GUEST'S OWN DELETE IS FINAL, AND SAYS SO (Will, 2026-09-23: "I want
          it gone everywhere, not still visible to the host as well"): no window
          and no place it waits. ★ A HOST'S OWN UPLOAD is the one exception
          (`isHost`, which only the personal Uploads pairs with this Trash): its
          delete is restorable, so it says the host's words.
          ★ THE VIEWER'S QUESTIONS ARE THE ONE TABLE'S CONFIRM (back-layers), as its
          Delete permanently already was: over the viewer a question holds a
          history entry of its own (`ui/popup-back.ts`), so on a phone Back closes
          the question and leaves the photograph, and only the Popup knows it. */}
      {onDelete && canDeleteThis && (
        <Popup>
          <ActionTooltip label="Delete">
            <PopupTrigger asChild>
              <button
                type="button"
                aria-label="Delete"
                className={cn(LIGHTBOX_ACTION, "hover:text-destructive")}
              >
                <Trash2 className="size-5" />
              </button>
            </PopupTrigger>
          </ActionTooltip>
          <PopupContent kind="confirm">
            <PopupHeader
              title="Delete this upload?"
              description={
                <>
                  {item.isHost ? (
                    <HostRemovalWords />
                  ) : (
                    <>
                      It&rsquo;s deleted from the event right away and
                      can&rsquo;t be recovered.
                    </>
                  )}
                  {deleteConsequence && ` ${deleteConsequence}`}
                </>
              }
            />
            <PopupFooter>
              <PopupClose asChild>
                <Button variant="outline">Cancel</Button>
              </PopupClose>
              <PopupClose asChild>
                <Button variant="destructive" onClick={() => onDelete(item)}>
                  Delete
                </Button>
              </PopupClose>
            </PopupFooter>
          </PopupContent>
        </Popup>
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
            <Popup>
              <ActionTooltip label="Remove">
                <PopupTrigger asChild>
                  <button
                    type="button"
                    aria-label="Remove"
                    className={cn(LIGHTBOX_ACTION, "hover:text-destructive")}
                  >
                    <Trash2 className="size-5" />
                  </button>
                </PopupTrigger>
              </ActionTooltip>
              <PopupContent kind="confirm">
                <PopupHeader
                  title="Remove this item?"
                  description={<HostRemovalWords />}
                />
                <PopupFooter>
                  <PopupClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </PopupClose>
                  <PopupClose asChild>
                    <Button
                      variant="destructive"
                      onClick={() => onRemove(item)}
                    >
                      Remove
                    </Button>
                  </PopupClose>
                </PopupFooter>
              </PopupContent>
            </Popup>
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
        <Popup>
          <ActionTooltip label="Delete permanently">
            <PopupTrigger asChild>
              <button
                type="button"
                aria-label="Delete permanently"
                className={cn(LIGHTBOX_ACTION, "hover:text-destructive")}
              >
                <Trash2 className="size-5" />
              </button>
            </PopupTrigger>
          </ActionTooltip>
          <PurgeConfirmContent onConfirm={() => onPurge(item)} />
        </Popup>
      )}
    </div>
  );
});
