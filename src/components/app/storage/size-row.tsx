"use client";

import type { Ref } from "react";
import { Check } from "lucide-react";

import { MediaTile } from "@/components/app/media-grid";
import { UnverifiedMark } from "@/components/shared/unverified-mark";
import type { StorageItem } from "@/lib/db/queries/storage-list";
import { cn, formatBytes } from "@/lib/utils";

import { addedLabel, formatDuration } from "./storage-list-rules";

/**
 * ONE ITEM IN THE SIZE LIST (round one's carried `row-contents`: a thumbnail, the size and a
 * video's length, the event, who added it, and the date).
 *
 * ★ THE ROW IS ITS CHECKBOX. One press anywhere on it selects it, because the whole list exists to
 * be selected from; the control is a real `role="checkbox"` laid over the row, and the only thing
 * that answers a press of its own is the Unverified mark, which lifts above it (a tap on a typed
 * name explains the mark, as it does everywhere a name is shown).
 *
 * ★ WHO ADDED IT FOLLOWS THE CREDIT'S RULES (`resolveUploaderIdentity`): her own uploads read
 * "You", a typed name carries the mark, and a row with no name names nobody.
 *
 * The size is a file's size, to the nearest tenth as any file browser prints it; only what she
 * stores and what she must free round up (`formatBytesUp`: they are instructions).
 */
export function SizeRow({
  item,
  eventName,
  checked,
  leaving,
  disabled,
  onToggle,
  flipRef,
}: {
  item: StorageItem;
  /** The event's name, shown when the list is showing every event. */
  eventName: string | null;
  checked: boolean;
  /** On its way to Deleted: fading before the list closes over it. */
  leaving: boolean;
  disabled: boolean;
  onToggle: (item: StorageItem) => void;
  /** The list's FLIP registration (the survivors glide when a row leaves). */
  flipRef?: Ref<HTMLLIElement>;
}) {
  const size = formatBytes(item.bytes);
  const when = addedLabel(item.createdAt);
  const who = item.by.isHost ? "You" : (item.by.name?.trim() ?? "") || null;
  const kind = item.type === "video" ? "video" : "photo";
  const label = [
    `${size} ${kind}`,
    eventName,
    who ? `added by ${who === "You" ? "you" : who}` : null,
    when || null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <li ref={flipRef} data-storage-row={item.id}>
      <div
        data-leaving={leaving ? "" : undefined}
        data-selected={checked ? "" : undefined}
        className={cn(
          "relative flex items-center gap-3 rounded-lg px-2 py-2 transition-[opacity,background-color] duration-150 ease-emphasis",
          checked ? "bg-muted/70" : "hover:bg-muted/40",
          leaving && "opacity-0",
        )}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          aria-label={label}
          disabled={disabled}
          onClick={() => onToggle(item)}
          className="absolute inset-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-default"
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none relative flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 ease-emphasis",
            // The album's own selected mark (`album-tile.tsx`), so "selected"
            // reads one way wherever the host selects.
            checked
              ? "border-transparent bg-success text-success-foreground"
              : "border-border bg-background",
          )}
        >
          {checked ? <Check className="size-3" strokeWidth={3} /> : null}
        </span>
        <span className="pointer-events-none relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
          <MediaTile item={item} playBadge="none" />
          {item.type === "video" && item.durationSeconds !== null ? (
            <span className="absolute right-0.5 bottom-0.5 rounded bg-black/60 px-1 text-micro font-medium text-white tabular-nums">
              {formatDuration(item.durationSeconds)}
            </span>
          ) : null}
        </span>
        <span className="pointer-events-none relative min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="font-medium text-foreground tabular-nums">
              {size}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {when}
            </span>
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            {eventName ? (
              <span className="min-w-0 truncate">{eventName}</span>
            ) : null}
            {eventName && who ? <span aria-hidden>·</span> : null}
            {who ? (
              <span className="inline-flex min-w-0 shrink-0 items-center gap-1">
                <span className="truncate">{who}</span>
                {!item.by.isHost && !item.by.isVerified ? (
                  <UnverifiedMark
                    name={who}
                    viewerIsHost
                    className="pointer-events-auto"
                  />
                ) : null}
              </span>
            ) : null}
          </span>
        </span>
      </div>
    </li>
  );
}
