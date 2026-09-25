"use client";

import type { ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  FileDown,
  Images,
  Loader2,
  Plus,
  RotateCcw,
  Share2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Platform, SaveChoice } from "@/lib/media/share-save";
import { cn } from "@/lib/utils";

import { ROOM_FOCUS, ROOM_PRESS } from "./clip-room";

/**
 * THE FINISH, AS WILL AMENDED IT (reel-cut round 1, `finish=save`): Share leads; Save opens the
 * platform's options (iOS: Save to Photos first, then Download file; elsewhere the download is the
 * native way); Add to event waits behind a confirm; every action keeps her HERE with its done state,
 * so save-then-share or add-then-share is two taps on one screen; Make another starts over.
 *
 * ★ SHARE IS ITS OWN TAP, NEVER CHAINED OFF THE ENCODE. iOS spends the user activation on the tap
 * that started the encode long before the file exists, and refuses a share sheet without one, so the
 * finish waits for her next tap. The sheet is asked with the real file (`canShare({ files })`), and a
 * browser whose sheet would refuse it never shows Share at all: Save leads there instead.
 */

export type FinishDoor = "share" | "save" | "add";

const DOOR =
  "flex h-11 min-w-0 items-center justify-center gap-2 rounded-[var(--radius-action)] px-4 text-working font-medium whitespace-nowrap disabled:pointer-events-none";

function doorClass(loud: boolean, done: boolean) {
  return cn(
    DOOR,
    ROOM_FOCUS,
    ROOM_PRESS,
    loud
      ? "bg-reel text-white"
      : done
        ? "border border-white/15 bg-white/[0.06] text-white/80"
        : "border border-white/20 text-white/90 hover:border-white/35",
  );
}

function DoneMark() {
  return <Check className="size-4 text-[oklch(0.8_0.14_150)]" aria-hidden />;
}

export function FinishDoors({
  canShare,
  platform,
  done,
  adding,
  canAdd,
  onShare,
  onSave,
  onAskAdd,
  onMakeAnother,
}: {
  /** The system sheet takes this very file. */
  canShare: boolean;
  platform: Platform;
  done: ReadonlySet<FinishDoor>;
  /** An add in flight (the host's upload reports its share, 0..1), or null. */
  adding: number | null;
  /** Add to event is offered: a plan that takes video and a viewer who may add right now. */
  canAdd: boolean;
  onShare: () => void;
  onSave: (choice: SaveChoice) => void;
  onAskAdd: () => void;
  onMakeAnother: () => void;
}) {
  const saveLoud = !canShare;
  const saveDone = done.has("save");
  const saveInner = (
    <>
      {saveDone ? <DoneMark /> : <Download className="size-4" aria-hidden />}
      <span className="truncate">{saveDone ? "Saved" : "Save"}</span>
    </>
  );
  return (
    <div data-clip-doors className="flex w-full flex-col gap-2.5">
      {canShare ? (
        <button
          type="button"
          onClick={onShare}
          data-clip-door="share"
          className={doorClass(true, false)}
        >
          {done.has("share") ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <Share2 className="size-4" aria-hidden />
          )}
          {done.has("share") ? "Shared" : "Share"}
        </button>
      ) : null}
      <div
        className={cn("grid gap-2.5", canAdd ? "grid-cols-2" : "grid-cols-1")}
      >
        {platform === "ios" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-clip-door="save"
                className={doorClass(saveLoud, saveDone)}
              >
                {saveInner}
                <ChevronDown className="size-3.5 opacity-60" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52">
              <DropdownMenuItem onSelect={() => onSave("photos")}>
                <Images aria-hidden />
                Save to Photos
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onSave("file")}>
                <FileDown aria-hidden />
                Download file
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            onClick={() => onSave("file")}
            data-clip-door="save"
            className={doorClass(saveLoud, saveDone)}
          >
            {saveInner}
          </button>
        )}
        {canAdd ? (
          <button
            type="button"
            onClick={onAskAdd}
            disabled={adding !== null || done.has("add")}
            data-clip-door="add"
            className={doorClass(false, done.has("add"))}
          >
            {adding !== null ? (
              <>
                <Loader2
                  className="size-4 animate-spin motion-reduce:animate-none"
                  aria-hidden
                />
                <span className="tabular-nums">{`Adding ${Math.round(adding * 100)}%`}</span>
              </>
            ) : done.has("add") ? (
              <>
                <DoneMark />
                Added
              </>
            ) : (
              <>
                <Plus className="size-4" aria-hidden />
                Add to event
              </>
            )}
          </button>
        ) : null}
      </div>
      <p className="pt-1 text-center">
        <button
          type="button"
          onClick={onMakeAnother}
          className={cn(
            "rounded-sm text-caption text-white/60 underline decoration-white/25 underline-offset-4 hover:text-white",
            ROOM_FOCUS,
          )}
        >
          Make another
        </button>
      </p>
    </div>
  );
}

/** The finish's words: whose it is now and where it lives. */
function FinishWords({ compact }: { compact?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-label font-semibold text-white/45 uppercase">
        Your clip is ready
      </p>
      {compact ? null : (
        <p className="font-heading text-page text-white">
          It&rsquo;s on this device.
        </p>
      )}
      <p className="text-working text-white/55">
        Nothing leaves it until you share it or add it.
      </p>
    </div>
  );
}

function BackToEditing({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className={cn(
        "flex items-center gap-2 self-start rounded-sm text-caption text-white/55 hover:text-white",
        ROOM_FOCUS,
      )}
    >
      <ArrowLeft className="size-3.5" aria-hidden />
      Back to editing, your picks kept
    </button>
  );
}

/** At a laptop the finish sits in the bench's panel; the clip keeps playing at full height beside. */
export function FinishPanel({
  onBack,
  doors,
}: {
  onBack: () => void;
  doors: ReactNode;
}) {
  return (
    <div data-clip-finish="panel" className="flex h-full flex-col">
      <BackToEditing onBack={onBack} />
      <div className="flex flex-1 flex-col justify-center gap-6 px-6 xl:px-10">
        <FinishWords />
        <div className="w-full max-w-[420px]">{doors}</div>
      </div>
    </div>
  );
}

/**
 * In a hand the finish is its own screen: the file above, the doors under it. The room's own head
 * stays over it, and its Back is the way back to editing (one control, not two).
 */
export function FinishScreen({
  clip,
  mark,
  doors,
}: {
  clip: ReactNode;
  mark?: ReactNode;
  doors: ReactNode;
}) {
  return (
    <div
      data-clip-finish="screen"
      className="flex min-h-0 flex-1 flex-col px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center pt-1">
        {clip}
        {mark}
      </div>
      <div className="flex flex-col gap-3 pt-4">
        <FinishWords compact />
        {doors}
      </div>
    </div>
  );
}

/**
 * A CLIP THAT DID NOT FINISH (a lost GPU context, an encoder that gave up): the finish with Retry,
 * the picks kept, never a dead end (bible 3).
 */
export function FailedFinish({
  onRetry,
  onBack,
}: {
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div
      data-clip-finish="failed"
      role="alert"
      className="flex h-full flex-col justify-center gap-6 px-6 xl:px-10"
    >
      <div className="flex flex-col gap-1">
        <p className="text-label font-semibold text-white/45 uppercase">
          Your clip didn&rsquo;t finish
        </p>
        <p className="text-working text-white/60">
          This device stopped drawing it partway. Your picks are kept, so a
          retry starts right where you left off.
        </p>
      </div>
      <div className="flex w-full max-w-[420px] flex-col gap-2.5">
        <button
          type="button"
          onClick={onRetry}
          className={doorClass(true, false)}
        >
          <RotateCcw className="size-4" aria-hidden />
          Retry
        </button>
        <button
          type="button"
          onClick={onBack}
          className={doorClass(false, false)}
        >
          Back to editing
        </button>
      </div>
    </div>
  );
}

/**
 * ADD TO EVENT'S CONFIRM, like the host's own confirms (Will: "so they know what they're doing and
 * don't accidentally click"). The words are `addConfirmWords`'s: the host's clip lands approved and
 * costs her storage; a guest on a moderated album learns the host sees it first.
 */
export function AddConfirm({
  open,
  onOpenChange,
  title,
  body,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={onConfirm}>Add to event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
