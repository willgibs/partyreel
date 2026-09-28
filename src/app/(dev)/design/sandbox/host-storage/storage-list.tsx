"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, Download, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { floatingPopupShapes } from "@/components/ui/floating-layer";
import { POPUP_KINDS } from "@/components/ui/popup-kinds";
import { formatBytesUp } from "@/lib/billing/storage-guard";
import type { Plan } from "@/lib/constants/tiers";
import { formatCount } from "@/lib/format/count";
import { cn, formatBytes } from "@/lib/utils";

import {
  EVENTS,
  eventBytes,
  type EventId,
  formatDuration,
  largestFirst,
  type StorageItem,
  TOTAL_ACTIVE_BYTES,
  totalBytes,
} from "./fixtures";
import { nameWithBilling } from "./parts";
import { Scrim } from "./plan-sheet";

/**
 * WHAT'S USING SPACE, AS HIS ROUND-ONE PICKS BUILT IT: the ground under every
 * option's "See what's using space", live in every refused frame.
 *
 *  - `order=flat`, with his note: one ranked list, largest first across every
 *    event, and a filter for All or one event ("offering both is a great mini
 *    feature"). Each event's chip carries its own total, which is what the
 *    grouped view offered, without choosing it.
 *  - `goal=live`: a strip stuck to the top of the list counts down as items
 *    are selected, and at zero its own button finishes the switch.
 *  - It opens where popups' `lists=panel` opens a list: a side panel at a desk,
 *    stacked over the plan it came from, and its own screen in a hand, whose
 *    Back names the plan it returns to.
 *
 * ★ THE STRIP'S BUTTON REMOVES FIRST. The storage check reads what is stored
 * (`host_active_bytes()`), so items only SELECTED still count against the
 * size: at zero the button reads "Remove and switch" while any are merely
 * selected, and "Switch" once they have gone to Deleted.
 *
 * ★ NOTHING HERE CALLS A SERVER FUNCTION. Selection, Remove and Undo are
 * local state; Remove to Deleted and its Undo toast are host-curation's
 * settled answer, carried rather than re-asked; Download is drawn, never
 * wired (export-flow owns it).
 */

const LIST_TITLE = "What’s using space";

type Filter = "all" | EventId;
type Ground = "popover" | "background";

/* ── the row ─────────────────────────────────────────────────────────────── */

/** The shipped Unverified mark's paper tone, quoted (the real one is a Popover). */
function UnverifiedDot() {
  return (
    <span
      role="img"
      aria-label="Unverified"
      title="Unverified"
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-border bg-muted align-middle"
    >
      <span aria-hidden className="size-1 rounded-full bg-muted-foreground" />
    </span>
  );
}

function SizeRow({
  item,
  checked,
  onToggle,
  showEvent,
}: {
  item: StorageItem;
  checked: boolean;
  onToggle: (id: string) => void;
  showEvent: boolean;
}) {
  return (
    <label
      data-hs-row=""
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors duration-150 ease-emphasis hover:bg-muted/40",
        checked && "bg-muted/60",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(item.id)}
        className="mt-3.5 size-3.5 shrink-0 rounded border-border accent-foreground"
      />
      <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, not a presigned URL */}
        <img src={item.url} alt="" className="size-full object-cover" />
        {item.type === "video" && item.durationSeconds !== undefined && (
          <span className="absolute right-0.5 bottom-0.5 rounded bg-black/60 px-1 text-micro font-medium text-white tabular-nums">
            {formatDuration(item.durationSeconds)}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-medium tabular-nums">
            {formatBytes(item.fileSizeBytes)}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {item.dateLabel}
          </span>
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
          {showEvent && <span className="truncate">{item.eventName}</span>}
          {showEvent && <span aria-hidden>·</span>}
          <span className="inline-flex items-center gap-1">
            {item.uploaderName}
            {!item.isVerified && <UnverifiedDot />}
            {item.isHost && (
              <Badge variant="secondary" className="h-4 px-1 text-micro">
                Host
              </Badge>
            )}
          </span>
        </span>
      </span>
    </label>
  );
}

/* ── the filter: All, or one event, each with its own total ─────────────── */

function EventFilter({
  value,
  onChange,
}: {
  value: Filter;
  onChange: (f: Filter) => void;
}) {
  const chips: { id: Filter; label: string; bytes: number }[] = [
    { id: "all", label: "All events", bytes: TOTAL_ACTIVE_BYTES },
    ...EVENTS.map((e) => ({
      id: e.id,
      label: e.short,
      bytes: eventBytes(e.id),
    })),
  ];
  return (
    <div
      role="group"
      aria-label="Show"
      className="relative -mx-1 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-1 py-0.5 [&::-webkit-scrollbar]:hidden"
    >
      {chips.map((chip) => {
        const on = chip.id === value;
        return (
          <button
            key={chip.id}
            type="button"
            aria-pressed={on}
            onClick={(e) => {
              onChange(chip.id);
              // A chip past the phone's edge comes fully into view when
              // chosen: the row's own scroll, never `scrollIntoView`, which
              // would scroll the lab page around the frame as well.
              const el = e.currentTarget;
              const row = el.parentElement;
              if (!row) return;
              const left = el.offsetLeft;
              const right = left + el.offsetWidth;
              if (left < row.scrollLeft) row.scrollLeft = left - 4;
              else if (right > row.scrollLeft + row.clientWidth)
                row.scrollLeft = right - row.clientWidth + 4;
            }}
            className={cn(
              "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.97] motion-reduce:active:scale-100",
              on
                ? "border border-transparent bg-foreground text-background"
                : "border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {chip.label}
            <span
              className={cn(
                "text-xs tabular-nums",
                on ? "text-background/70" : "text-faint",
              )}
            >
              {formatBytes(chip.bytes)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── the live strip (`goal=live`) ────────────────────────────────────────── */

function GoalStrip({
  target,
  gap,
  freed,
  pending,
  ground,
}: {
  target: Plan;
  gap: number;
  /** Removed this visit plus what is selected now. */
  freed: number;
  /** Items selected but not yet sent to Deleted. */
  pending: number;
  ground: Ground;
}) {
  const [opening, setOpening] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const remaining = Math.max(0, gap - freed);
  const done = remaining <= 0;
  const pct = Math.min(100, Math.round((freed / gap) * 100));
  const name = nameWithBilling(target);
  return (
    <div
      data-hs-goal=""
      data-hs-state={done ? "ready" : "counting"}
      className={cn(
        "sticky top-0 z-10 -mx-4 border-b px-4 py-3",
        ground === "popover" ? "bg-popover" : "bg-background",
      )}
    >
      <div className="flex min-h-7 flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {done ? (
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-success" aria-hidden />
              Enough freed for {name}
            </span>
          ) : (
            `${formatBytesUp(remaining)} left to free for ${name}`
          )}
        </p>
        {done && (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setOpening(true);
              if (timer.current) clearTimeout(timer.current);
              timer.current = setTimeout(() => setOpening(false), 1400);
            }}
          >
            {opening
              ? "Opening…"
              : pending > 0
                ? "Remove and switch"
                : `Switch to ${name}`}
          </Button>
        )}
      </div>
      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted">
        <span
          className={cn(
            "block h-full rounded-full transition-[width] duration-300 ease-emphasis motion-reduce:transition-none",
            done ? "bg-success" : "bg-foreground/70",
          )}
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  );
}

/* ── the bulk row and the toast, quoted ──────────────────────────────────── */

/** `bulk-bar.tsx`'s icon button, re-typed (its tooltips would portal out). */
const ICON_BUTTON = cn(
  "flex size-7 items-center justify-center rounded-[calc(var(--radius-action)*0.7)] outline-none",
  "transition-[color,background-color,transform] duration-150 ease-emphasis",
  "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
  "active:scale-90 motion-reduce:active:scale-100",
);

function BulkRow({
  count,
  bytes,
  allSelected,
  onAll,
  onRemove,
  onCancel,
  ground,
}: {
  count: number;
  bytes: number;
  allSelected: boolean;
  onAll: () => void;
  onRemove: () => void;
  onCancel: () => void;
  ground: Ground;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1 border-t px-3 py-2",
        ground === "popover" ? "bg-popover" : "bg-background",
      )}
    >
      <Button type="button" variant="ghost" size="sm" onClick={onAll}>
        {allSelected ? "Clear" : "All"}
      </Button>
      <span className="px-0.5 text-xs text-muted-foreground tabular-nums">
        {formatCount(count)} · {formatBytes(bytes)}
      </span>
      <span className="ml-auto flex items-center gap-1">
        <button
          type="button"
          aria-label="Download"
          title="Download"
          className={cn(ICON_BUTTON, "text-save")}
        >
          <Download className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Remove to Deleted"
          title="Remove to Deleted"
          onClick={onRemove}
          className={cn(ICON_BUTTON, "text-destructive")}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Cancel selection"
          title="Cancel selection"
          onClick={onCancel}
          className={ICON_BUTTON}
        >
          <X className="size-4" aria-hidden />
        </button>
      </span>
    </div>
  );
}

/** The shipped Toaster's place, quoted: top centre, clear of every foot. */
function RemovedToast({
  count,
  bytes,
  onUndo,
}: {
  count: number;
  bytes: number;
  onUndo: () => void;
}) {
  return (
    <div className="hs-toast" data-hs-toast="">
      <Check className="size-4 shrink-0 text-success" aria-hidden />
      <div className="min-w-0 flex-1">
        <span>
          Removed {count} {count === 1 ? "item" : "items"} to Deleted
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {formatBytes(bytes)} freed
        </span>
      </div>
      <Button type="button" size="sm" variant="ghost" onClick={onUndo}>
        Undo
      </Button>
    </div>
  );
}

/* ── the list itself: a panel at a desk, a screen in a hand ──────────────── */

const SHELL =
  "fixed z-50 flex flex-col overflow-hidden bg-popover text-sm text-popover-foreground shadow-layer outline-none";

export function SizeList({
  desk,
  target,
  onClose,
}: {
  desk: boolean;
  /** The price she tapped that could not hold what she stores. */
  target: Plan;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
  const [lastRemoved, setLastRemoved] = useState<{
    ids: string[];
    bytes: number;
  } | null>(null);

  const all = largestFirst();
  const live = all.filter((i) => !removed.has(i.id));
  const shown = live.filter((i) => filter === "all" || i.eventId === filter);
  const gap = Math.max(0, TOTAL_ACTIVE_BYTES - target.storageBytes);
  const selectedBytes = totalBytes(live.filter((i) => selected.has(i.id)));
  const removedBytes = totalBytes(all.filter((i) => removed.has(i.id)));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const removeSelected = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setRemoved((prev) => new Set([...prev, ...ids]));
    setLastRemoved({ ids, bytes: selectedBytes });
    setSelected(new Set());
  };
  const undo = () => {
    if (!lastRemoved) return;
    const back = new Set(lastRemoved.ids);
    setRemoved((prev) => new Set([...prev].filter((id) => !back.has(id))));
    setLastRemoved(null);
  };
  const allShownSelected =
    shown.length > 0 && shown.every((i) => selected.has(i.id));

  const ground: Ground = desk ? "popover" : "background";
  const shape = desk ? POPUP_KINDS.list.desk : POPUP_KINDS.list.hand;
  const description =
    filter === "all"
      ? "Largest first, across every event. Select what to remove."
      : `Largest first, in ${EVENTS.find((e) => e.id === filter)?.name}. Select what to remove.`;

  const body = (
    <div
      data-hs-list-body=""
      className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-4"
    >
      <GoalStrip
        target={target}
        gap={gap}
        freed={removedBytes + selectedBytes}
        pending={selected.size}
        ground={ground}
      />
      <EventFilter value={filter} onChange={setFilter} />
      <div className="-mx-2 space-y-0.5">
        {shown.map((item) => (
          <SizeRow
            key={item.id}
            item={item}
            checked={selected.has(item.id)}
            onToggle={toggle}
            showEvent={filter === "all"}
          />
        ))}
      </div>
      <p className="text-xs text-pretty text-muted-foreground">
        Deleted keeps items only up to {target.name}&rsquo;s size once you
        switch, so anything older there clears sooner.
      </p>
    </div>
  );

  const foot =
    selected.size > 0 ? (
      <BulkRow
        count={selected.size}
        bytes={selectedBytes}
        allSelected={allShownSelected}
        onAll={() =>
          setSelected((prev) =>
            allShownSelected
              ? new Set(
                  [...prev].filter((id) => !shown.some((i) => i.id === id)),
                )
              : new Set([...prev, ...shown.map((i) => i.id)]),
          )
        }
        onRemove={removeSelected}
        onCancel={() => setSelected(new Set())}
        ground={ground}
      />
    ) : null;

  const toast = lastRemoved ? (
    <RemovedToast
      count={lastRemoved.ids.length}
      bytes={lastRemoved.bytes}
      onUndo={undo}
    />
  ) : null;

  if (!desk) {
    // popups' `screen`: the whole screen under a bar whose back arrow says
    // where Back returns (`PopupHeader`'s screen bar, quoted).
    return (
      <>
        <div
          role="dialog"
          aria-label={LIST_TITLE}
          data-hs-list=""
          data-shape={shape}
          className={cn(SHELL, floatingPopupShapes)}
        >
          <div className="shrink-0 border-b">
            <div className="grid h-13 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="max-w-full gap-0.5 justify-self-start px-1.5 text-muted-foreground"
              >
                <ChevronLeft className="size-5" />
                <span className="truncate">Your plan</span>
              </Button>
              <p className="max-w-[55vw] truncate text-center font-heading text-base font-medium text-foreground">
                {LIST_TITLE}
              </p>
              <span aria-hidden />
            </div>
            <p className="px-4 pb-3 text-sm text-pretty text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">{body}</div>
          {foot}
        </div>
        {toast}
      </>
    );
  }

  return (
    <>
      <Scrim />
      <div
        role="dialog"
        aria-label={LIST_TITLE}
        data-hs-list=""
        data-shape={shape}
        className={cn(SHELL, floatingPopupShapes)}
      >
        <div className="flex shrink-0 flex-col gap-1 p-4 pr-12">
          <p className="font-heading text-card-title font-medium text-pretty text-foreground">
            {LIST_TITLE}
          </p>
          <p className="text-sm text-pretty text-muted-foreground">
            {description}
          </p>
        </div>
        {body}
        {foot}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="absolute top-3 right-3"
        >
          <X />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      {toast}
    </>
  );
}
