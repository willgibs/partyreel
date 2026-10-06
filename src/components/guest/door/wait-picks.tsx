"use client";

import "./doorway.css";

import { useRef, type CSSProperties } from "react";
import { Camera, ImagePlus } from "lucide-react";

import { PickPreview } from "@/components/guest/upload/pick-preview";
import { usePickUrls } from "@/components/guest/upload/use-pick-urls";
import { Button } from "@/components/ui/button";
import {
  formatCount,
  formatKindCount,
  formatMediaCount,
} from "@/lib/format/count";
import { cn } from "@/lib/utils";

/**
 * THE WAIT'S CHOOSER (`locked-door` r2, Will's `wait=pick`: "adds a lot of value to the waiting door", and
 * his note on it: "The 'while you wait' upload UI should definitely be designed cleaner within this").
 * While the host decides, she chooses what she will add, and the page's one queue holds it
 * (`use-upload-queue.ts`'s `holdAtDoor`): nothing is sent while the door holds her, and the moment it
 * lets her in her choice goes up on its own.
 *
 * ★ CLEANER, SO IT IS PART OF THE DOOR, NOT A WIDGET UNDER IT: no card and no heading of its own, in the
 * door's centred column. Before she chooses, one quiet outline button and one line saying nothing is sent
 * until she is in; once she has, her photographs in a row, how many, a Change, and when they go. ★ HER
 * CHOICE OUTLIVES THE TAB (door-reveal, ROADMAP's line from door-wiring): it is kept on the device
 * (`wait-picks-store.ts`), so a reload or a closed tab keeps it and the door no longer asks her to keep the
 * tab open; only where the device could not keep it (no storage) does it still say so.
 *
 * ★ ONE INPUT, IN THE PAGE, CLICKED INSIDE THE TAP (the intent sheet's own rule): Safari opens a picker
 * only inside the gesture that asked for it, and an input that unmounts before its picker answers never
 * fires `change`. Her album's picker on a phone offers its camera too, so the door asks one question.
 *
 * ★ ON AN ALBUM WHOSE HOST CHOSE THE CAMERA, WHAT WAITS IS TAKEN WITH THE ALBUM'S CAMERA, NEVER THE LIBRARY
 * (crumbs-83, as the door's own step since crumbs-76). The picker offered her photo library here too, so a
 * library photo could wait for a roll the camera exists to keep to what was taken in the moment. With
 * `camera`, there is no picker of any kind: one primary opens the album's camera (the door holds it,
 * `entry-modal.tsx`), its shots join the page's queue and wait there like a choice, and Take another
 * opens it again. Those shots live in the tab alone (the device keeps a choice, `wait-picks-store.ts`, never
 * the camera's shots), so the door says to keep it open.
 */

/** One held choice: the queue's own item (its file, its kind, how far it has gone). */
export type WaitPick = {
  id: string;
  file: File;
  kind: "photo" | "video";
  status: "queued" | "uploading" | "done" | "error";
  progress: number;
};

/** How many tiles the row draws before it counts the rest. */
const SHOWN = 4;

/**
 * "3 photos" | "1 video" | "6 photos & videos": what she chose, by its kinds, a mix in the guest page's
 * own words for both (`formatMediaCount`, the album header's "photos & videos").
 */
export function pickedLine(picks: readonly Pick<WaitPick, "kind">[]): string {
  const videos = picks.filter((p) => p.kind === "video").length;
  if (videos > 0 && videos < picks.length)
    return formatMediaCount(picks.length);
  return formatKindCount(
    picks.map((p) => ({ type: p.kind })),
    "upload",
  );
}

export function WaitPicks({
  picks,
  onPick,
  kept = null,
  acceptsVideo = true,
  camera = null,
}: {
  picks: readonly WaitPick[];
  /** Her choice, held for the door (it replaces the last one: a Change is a new choice). */
  onPick?: (files: File[]) => void;
  /** The device could not keep her choice (`false`): it lives in this tab alone, and the door says so. */
  kept?: boolean | null;
  /** Whether this album takes a video from a guest: the picker offers only what it takes. */
  acceptsVideo?: boolean;
  /**
   * The album's host chose the camera: what waits is taken with it, so the chooser offers that and no picker
   * (`onOpen` opens the album's camera, which the door holds). Absent on a free-upload album.
   */
  camera?: { onOpen: () => void } | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const choose = camera ? camera.onOpen : () => inputRef.current?.click();
  const chosen = picks.length > 0;
  // The camera's shots live in the tab alone; a choice says so only where the device could not keep it.
  const tabOnly = camera !== null || kept === false;

  return (
    <div
      data-door-picks={chosen ? "ready" : "empty"}
      className="flex w-full flex-col items-center"
    >
      {camera ? null : (
        <input
          ref={inputRef}
          type="file"
          accept={acceptsVideo ? "image/*,video/*" : "image/*"}
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.currentTarget.files ?? []);
            // Reset, so choosing the same photographs again still answers.
            e.currentTarget.value = "";
            if (files.length > 0) onPick?.(files);
          }}
        />
      )}
      {chosen ? (
        <>
          <PickRow picks={picks} />
          <p className="mt-3 text-working text-foreground">
            {pickedLine(picks)} ready
            <span aria-hidden className="mx-1.5 text-faint">
              ·
            </span>
            <button
              type="button"
              onClick={choose}
              className="font-medium underline decoration-border underline-offset-4 transition-colors duration-150 ease-emphasis hover:decoration-foreground"
            >
              {camera ? "Take another" : "Change"}
            </button>
          </p>
          <p className="mt-1 text-sm text-balance text-muted-foreground">
            They go in the moment you&rsquo;re let in.
            {tabOnly && " Keep this tab open."}
          </p>
        </>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            size="cta"
            className="w-full"
            onClick={choose}
          >
            {camera ? (
              <>
                <Camera />
                Take a photo
              </>
            ) : (
              <>
                <ImagePlus />
                {"Choose what you’ll add"}
              </>
            )}
          </Button>
          <p className="mt-2.5 text-sm text-pretty text-muted-foreground">
            Nothing is sent until you&rsquo;re let in.
          </p>
        </>
      )}
    </div>
  );
}

/**
 * HER CHOICE IN A ROW: the first few as square tiles, the rest counted on the last. `sending` dims each
 * tile under a thin line of light until it has gone in (the beat, the moment she is let in).
 */
export function PickRow({
  picks,
  sending = false,
  className,
}: {
  picks: readonly WaitPick[];
  sending?: boolean;
  className?: string;
}) {
  // The blob ledger is the row's own (one owner per object URL, `use-pick-urls.ts`).
  const urls = usePickUrls(picks);
  const shown = picks.slice(0, SHOWN);
  const more = picks.length - shown.length;
  return (
    <ul
      data-door-pick-row={sending ? "sending" : "ready"}
      className={cn("flex items-center justify-center gap-2", className)}
    >
      {shown.map((pick, i) => {
        const counted = more > 0 && i === shown.length - 1;
        return (
          <li
            key={pick.id}
            className="relative size-14 overflow-hidden rounded-tile"
          >
            <PickPreview
              file={pick.file}
              url={urls.get(pick.id)}
              className="size-full"
            />
            {sending && pick.status !== "done" && (
              <span
                aria-hidden
                className="door-way-sending"
                style={{ "--sent": `${pick.progress}%` } as CSSProperties}
              />
            )}
            {counted && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-medium text-white tabular-nums">
                +{formatCount(more + 1)}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** "Sending your 3 photos", under "You're in", with the row going in. */
export function SendingPicks({ picks }: { picks: readonly WaitPick[] }) {
  return (
    <div data-door-sending="" className="flex w-full flex-col items-center">
      <PickRow picks={picks} sending />
      <p className="mt-3 text-working text-muted-foreground">
        Sending your {pickedLine(picks)}
      </p>
    </div>
  );
}
