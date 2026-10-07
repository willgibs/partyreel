"use client";

/**
 * WHAT WAITS FOR THE LINE, WHEN SHE ASKS (no-signal r1, Will's `drop=standby`, its third frame: "Her press on it: the
 * send's own sheet"). The stack shows one photograph and two ghost edges, so her press on it (or on its stand-in) opens
 * the whole send: each photograph, its name and where it stands, under the promise in full ("Your 3 photos are kept on
 * this phone and go by themselves once your connection is back."). Nothing here opens by itself, and nothing here sends:
 * a press while the line is gone could only fail the same way (crumbs-71), so the sheet says what it waits for, and the
 * line's return is what sends.
 *
 * ★ THE PROMISE IS THE KEEP'S OWN TRUTH, FILE BY FILE (`waitPromise`): what her phone holds is "kept on this phone", and
 * where it could not hold one, the page must stay open, and the sheet says so.
 *
 * ★ A LIST OF HERS, SO IT OPENS AS ONE (`popups` r1's `lists=panel`, the kind her uploads open as): a panel beside the
 * album at a desk, the whole screen under "Album" in a hand, the phone's own Back closing it. The board drew a sheet;
 * the house's one table says where a list opens, so this names its kind and never picks a posture of its own.
 */
import { useEffect, useMemo, useSyncExternalStore } from "react";

import { PickPreview } from "@/components/guest/upload/pick-preview";
import { WaitPoint } from "@/components/guest/upload/wait-point";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup";
import { TRACKER_WORDS } from "@/lib/guest/upload-tracker";
import {
  WAITING_FOR_CONNECTION,
  waitPromise,
  type WaitHold,
} from "@/lib/guest/unsent/words";
import type { QueueProgress } from "@/lib/guest/use-upload-queue";

/** One file of her send, as the album's head holds it. */
export type WaitingFile = { id: string; file: File; url?: string };

const NONE = () => () => {};

/** Where each file stands by, read off the progress store as one string (an unchanged tick reads as unchanged). */
function useHolds(
  progress: QueueProgress | null,
  ids: readonly string[],
): readonly (WaitHold | null)[] {
  const key = useSyncExternalStore(
    progress?.waits ? progress.subscribe : NONE,
    () => ids.map((id) => progress?.waits?.(id) ?? "-").join(","),
    () => "",
  );
  return useMemo(
    () =>
      key === ""
        ? ids.map(() => null)
        : key.split(",").map((h) => (h === "-" ? null : (h as WaitHold))),
    [key, ids],
  );
}

export function WaitingSheet({
  open,
  onOpenChange,
  files,
  progress,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Her send still on its way, in the order it was sent. */
  files: readonly WaitingFile[];
  progress: QueueProgress | null;
}) {
  const ids = useMemo(() => files.map((f) => f.id), [files]);
  const holds = useHolds(progress, ids);
  const waiting = holds.filter((h) => h !== null).length;
  const kept = holds.filter((h) => h === "kept").length;
  // ★ IT CLOSES ONCE NOTHING WAITS (the line is back, or what waited was stopped): its title would say a wait over a
  // send that goes, and the stack under it says the send again, with its bar.
  useEffect(() => {
    if (open && waiting === 0) onOpenChange(false);
  }, [open, waiting, onOpenChange]);
  return (
    <Popup open={open && waiting > 0} onOpenChange={onOpenChange}>
      <PopupContent kind="list" data-waiting-sheet="">
        {/* The wait's own word is the title, the promise in full its description, her list's way back "Album". */}
        <PopupHeader
          title={WAITING_FOR_CONNECTION}
          description={waitPromise({ n: Math.max(1, waiting), kept })}
          back="Album"
        />
        <PopupBody>
          <ul className="divide-y divide-border/60 pb-2">
            {files.map((f, i) => (
              <li
                key={f.id}
                data-waiting-row={holds[i] ? "waiting" : "sending"}
                className="flex items-center gap-3 py-2.5"
              >
                <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-tile bg-muted">
                  <PickPreview
                    file={f.file}
                    url={f.url}
                    className="size-full"
                  />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {f.file.name}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {holds[i] ? (
                      <>
                        <WaitPoint />
                        {WAITING_FOR_CONNECTION}
                      </>
                    ) : (
                      TRACKER_WORDS.sending
                    )}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </PopupBody>
      </PopupContent>
    </Popup>
  );
}
