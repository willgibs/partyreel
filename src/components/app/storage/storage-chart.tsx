"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmSwitch } from "@/components/ui/confirm-switch";
import {
  Popup,
  PopupClose,
  PopupContent,
  PopupFooter,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import { formatBytesUp } from "@/lib/billing/storage-guard";
import { showActionError } from "@/lib/errors/toast";
import { cn } from "@/lib/utils";

import {
  MAKE_ROOM_HINT,
  MAKE_ROOM_LABEL,
  formatStored,
  readStorage,
  storageHeadline,
  storageNote,
  type StorageFigures,
} from "./storage-figures";
import { useStorageSource } from "./storage-source";

/**
 * THE STORAGE CHART (trash-in-storage, Will 2026-10-03: "Storage visual chart can show used vs delete separately, and
 * maybe an account setting toggle to auto-delete trash if needed by FIFO if active space needs more storage"). Her
 * plan's cap holds her albums and her Deleted together, so the chart is ONE bar against the cap with the two drawn
 * apart, the words under it only when there is something to know or do, and beside it the two acts that free room
 * without leaving it: her setting, Make room from Deleted (on by default), and Empty Deleted.
 *
 * ★ EVERY FIGURE IS THE SERVER'S (`host_storage_summary`), printed through the storage flow's one rounding, and every
 * sentence reads off `storage-figures.ts`, so the chart, the ring and a refusal never tell her two numbers.
 *
 * ★ BOTH ACTS ASK WHERE THEY COST: Empty Deleted always (it cannot be undone), the switch only when it turns OFF (from
 * then a full plan refuses her guests' photos, which is the failure the setting exists to prevent: PRICING.md, "blocking
 * a real event by mistake"). Turning it on asks nothing, since its words say what it does.
 *
 * ★ WHAT IS BEHIND IT CATCHES UP AT ONCE: each act refreshes the page that drew it, so the ring, the Plan card and the
 * chart's own figures read the server again; the switch shows its new state the moment it is pressed and goes back if
 * the write is refused.
 */
export function StorageChart({
  activeBytes,
  deletedBytes,
  capBytes,
  makeRoom,
  door,
  className,
}: StorageFigures & {
  /** What sits under the figures and above the two acts: the size list's door, where a surface has one. */
  door?: ReactNode;
  className?: string;
}) {
  const source = useStorageSource();
  const router = useRouter();
  const [, startRefresh] = useTransition();
  // What the switch shows: hers, as the server last answered it, or the value she just pressed while it is written.
  const [pressed, setPressed] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [emptying, setEmptying] = useState(false);

  const on = pressed ?? makeRoom;
  const figures: StorageFigures = {
    activeBytes,
    deletedBytes,
    capBytes,
    makeRoom: on,
  };
  const reading = readStorage(figures);
  const capLabel = capBytes ? formatBytesUp(capBytes) : null;
  const note = storageNote(figures, reading);

  async function changeSetting(next: boolean) {
    setPressed(next);
    setSaving(true);
    const answer = await source.setMakeRoom(next).catch(() => ({
      ok: false as const,
      code: "unknown" as const,
      message: "Couldn't save that. Please try again.",
    }));
    setSaving(false);
    if (!answer.ok) {
      setPressed(null);
      showActionError(answer);
      return;
    }
    startRefresh(() => router.refresh());
  }

  async function emptyDeleted() {
    setEmptying(true);
    const answer = await source.emptyDeleted().catch(() => ({
      ok: false as const,
      code: "unknown" as const,
      message: "Couldn't empty Deleted. Please try again.",
    }));
    setEmptying(false);
    if (!answer.ok) {
      showActionError(answer);
      return;
    }
    toast.success(
      answer.freedBytes > 0
        ? `Deleted is empty: ${formatBytesUp(answer.freedBytes)} freed`
        : "Deleted is empty",
    );
    startRefresh(() => router.refresh());
  }

  return (
    <div data-storage-chart="" className={cn("space-y-3", className)}>
      <div className="space-y-2">
        <p
          className={cn(
            "text-sm font-medium tabular-nums",
            reading.over && "text-warning",
          )}
        >
          {storageHeadline(reading.storedBytes, capLabel)}
        </p>
        {capLabel ? (
          <span
            role="img"
            aria-label={`${formatStored(activeBytes, capLabel)} in your albums and ${formatStored(deletedBytes, capLabel)} in Deleted, of ${capLabel}`}
            data-storage-bar=""
            className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <span
              data-segment="albums"
              className={cn(
                "h-full transition-[width] duration-300 ease-emphasis motion-reduce:transition-none",
                reading.warning || reading.over
                  ? "bg-warning"
                  : "bg-foreground/70",
              )}
              style={{ width: `${reading.albumsPct}%` }}
            />
            <span
              data-segment="deleted"
              className="h-full bg-foreground/25 transition-[width] duration-300 ease-emphasis motion-reduce:transition-none"
              style={{ width: `${reading.deletedPct}%` }}
            />
          </span>
        ) : null}
        {/* The key, once there is something to tell apart: an empty plan's bar needs none. */}
        {reading.storedBytes > 0 ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
            <li
              data-legend="albums"
              className="inline-flex items-center gap-1.5"
            >
              <span
                aria-hidden
                className={cn(
                  "size-2 rounded-full",
                  reading.warning || reading.over
                    ? "bg-warning"
                    : "bg-foreground/70",
                )}
              />
              {`Albums ${formatStored(activeBytes, capLabel)}`}
            </li>
            <li
              data-legend="deleted"
              className="inline-flex items-center gap-1.5"
            >
              <span
                aria-hidden
                className="size-2 rounded-full bg-foreground/25"
              />
              {`Deleted ${formatStored(deletedBytes, capLabel)}`}
            </li>
          </ul>
        ) : null}
        {note ? (
          <p
            data-storage-note=""
            className="text-xs text-pretty text-muted-foreground"
          >
            {note}
          </p>
        ) : null}
        {door}
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <ConfirmSwitch
          checked={on}
          disabled={saving}
          onCheckedChange={(next) => void changeSetting(next)}
          label={MAKE_ROOM_LABEL}
          description={MAKE_ROOM_HINT}
          confirmWhen={(next) => next === false}
          dialogTitle="Turn off Make room from Deleted?"
          dialogDescription="When your plan is full, new uploads are refused, your guests' too, until you empty Deleted or choose a bigger plan."
          confirmLabel="Turn it off"
          cancelLabel="Keep it on"
          className="[&_p]:text-xs [&_p]:text-pretty"
        />
        {deletedBytes > 0 ? (
          <Popup>
            <PopupTrigger asChild>
              <button
                type="button"
                data-empty-deleted=""
                disabled={emptying}
                className="text-xs font-medium text-foreground underline underline-offset-4 disabled:opacity-50"
              >
                {emptying ? "Emptying Deleted…" : "Empty Deleted"}
              </button>
            </PopupTrigger>
            <PopupContent kind="confirm">
              <PopupHeader
                title="Empty Deleted?"
                description={`Everything in Deleted, ${formatBytesUp(deletedBytes)}, is deleted for good, deleted events included. It can't be undone.`}
              />
              <PopupFooter>
                <PopupClose asChild>
                  <Button variant="outline">Cancel</Button>
                </PopupClose>
                <PopupClose asChild>
                  <Button
                    variant="destructive"
                    onClick={() => void emptyDeleted()}
                  >
                    Empty Deleted
                  </Button>
                </PopupClose>
              </PopupFooter>
            </PopupContent>
          </Popup>
        ) : null}
      </div>
    </div>
  );
}
