"use client";

import { useState } from "react";
import { Check, ChevronRight, Download, Trash2 } from "lucide-react";

import {
  BulkBar,
  type BulkBarAction,
} from "@/components/app/event-feed/bulk-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";

import {
  CURRENT_PLAN,
  formatDuration,
  GAP_BYTES,
  groupedByEvent,
  groupedByWorstFirst,
  largestFirst,
  TARGET_PLAN,
  totalBytes,
  TOTAL_ACTIVE_BYTES,
  type EventGroup,
  type StorageItem,
} from "./fixtures";
import type { ScreenId } from "./scene";

/**
 * THE PER-ITEM SIZE LIST, the surface none of the three `where` options draw
 * differently: a row, largest-first or grouped, a live plan-switch strip when
 * `goal` is asked, and one bulk bar. Only the CHROME around it (a page, a
 * sheet, or a per-event panel behind the View menu) changes between options;
 * `account-view.tsx` and `pricing.tsx` supply that chrome.
 *
 * ★ NOTHING HERE CALLS A SERVER FUNCTION. Selection, removal and the undo are
 * plain local state (`useStorageSelection`); "Remove to Deleted" and the toast
 * are host-curation's own settled answer, carried rather than re-asked. Download
 * is drawn, never wired: the download itself is export-flow's.
 */

/* ── local, resolved-promise state (never the network) ─────────────────── */

type Removed = { ids: string[]; bytes: number };

function useStorageSelection(items: readonly StorageItem[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [justRemoved, setJustRemoved] = useState<Removed | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const selectAll = (ids: string[]) => setSelected(new Set(ids));
  const clear = () => setSelected(new Set());
  const removeSelected = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    const bytes = totalBytes(items.filter((i) => selected.has(i.id)));
    setRemovedIds((prev) => new Set([...prev, ...ids]));
    setJustRemoved({ ids, bytes });
    setSelected(new Set());
  };
  const undo = () => {
    if (!justRemoved) return;
    const ids = justRemoved.ids;
    setRemovedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setJustRemoved(null);
  };

  return {
    selected,
    toggle,
    selectAll,
    clear,
    removedIds,
    removeSelected,
    justRemoved,
    undo,
  };
}
type Selection = ReturnType<typeof useStorageSelection>;

/* ── the row ─────────────────────────────────────────────────────────────── */

/** The paper tone of the shipped Unverified mark, quoted: the real one is a
 *  Popover trigger, and a radix Popover portals out of this frame. */
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
        {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still, not a presigned URL, but every board reuses <img> for this pool */}
        <img src={item.url} alt="" className="size-full object-cover" />
        {item.type === "video" && item.durationSeconds !== undefined && (
          <span className="absolute right-0.5 bottom-0.5 rounded bg-black/60 px-1 text-[9px] font-medium tabular-nums text-white">
            {formatDuration(item.durationSeconds)}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-medium tabular-nums">
            {formatBytes(item.fileSizeBytes)}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
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
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                Host
              </Badge>
            )}
          </span>
        </span>
      </span>
    </label>
  );
}

/* ── flat and grouped bodies ─────────────────────────────────────────────── */

function FlatList({
  items,
  screen,
  showEvent,
  sel,
}: {
  items: readonly StorageItem[];
  screen: ScreenId;
  showEvent: boolean;
  sel: Selection;
}) {
  const visible = items.filter((i) => !sel.removedIds.has(i.id));
  const cap = screen === "375" ? 8 : 14;
  const shown = visible.slice(0, cap);
  return (
    <div className="space-y-0.5" data-hs-list="flat">
      {shown.map((item) => (
        <SizeRow
          key={item.id}
          item={item}
          checked={sel.selected.has(item.id)}
          onToggle={sel.toggle}
          showEvent={showEvent}
        />
      ))}
      {visible.length > cap && (
        <p className="px-2 py-1 text-xs text-muted-foreground">
          +{visible.length - cap} more, largest already at the top
        </p>
      )}
    </div>
  );
}

function GroupedList({
  groups,
  screen,
  sel,
}: {
  groups: readonly EventGroup[];
  screen: ScreenId;
  sel: Selection;
}) {
  const cap = screen === "375" ? 3 : 5;
  return (
    <div className="space-y-4" data-hs-list="grouped">
      {groups.map((g) => {
        const visible = g.items.filter((i) => !sel.removedIds.has(i.id));
        const shown = visible.slice(0, cap);
        return (
          <div key={g.eventId} className="space-y-0.5">
            <div className="flex items-baseline justify-between gap-2 px-2">
              <span className="text-sm font-medium">{g.eventName}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatBytes(totalBytes(visible))}
              </span>
            </div>
            {shown.map((item) => (
              <SizeRow
                key={item.id}
                item={item}
                checked={sel.selected.has(item.id)}
                onToggle={sel.toggle}
                showEvent={false}
              />
            ))}
            {visible.length > cap && (
              <p className="px-2 text-xs text-muted-foreground">
                +{visible.length - cap} more in this event
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── the plan-switch strip (`goal`) ──────────────────────────────────────── */

function GoalStrip({
  goal,
  selectedBytes,
  removedBytes,
}: {
  goal: "live" | "plain";
  selectedBytes: number;
  /** Already sent to Deleted this visit: counts permanently, so committing a
   *  Remove keeps the strip's progress rather than resetting it to zero along
   *  with the selection. */
  removedBytes: number;
}) {
  if (goal === "plain") {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
        <p className="font-medium text-foreground">
          You&rsquo;re storing {formatBytes(TOTAL_ACTIVE_BYTES)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {TARGET_PLAN.name} holds {formatBytes(TARGET_PLAN.storageBytes)}.
          Free at least {formatBytes(GAP_BYTES)} to switch, then return to the
          plan sheet.
        </p>
      </div>
    );
  }
  const freed = removedBytes + selectedBytes;
  const remaining = Math.max(0, GAP_BYTES - freed);
  const done = remaining <= 0;
  const pct = Math.min(100, Math.round((freed / GAP_BYTES) * 100));
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        done ? "border-success/40 bg-success/10" : "border-border bg-muted/30",
      )}
      data-hs-goal={done ? "ready" : "counting"}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-foreground">
          {done
            ? `Ready to switch to ${TARGET_PLAN.name}`
            : `${formatBytes(remaining)} left to free for ${TARGET_PLAN.name}`}
        </p>
        {done && <Button size="sm">Switch to {TARGET_PLAN.name}</Button>}
      </div>
      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full bg-foreground/70 transition-[width] duration-300 ease-emphasis motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  );
}

/* ── the bulk bar and the toast ──────────────────────────────────────────── */

function BulkFooter({
  sel,
  items,
}: {
  sel: Selection;
  items: readonly StorageItem[];
}) {
  const chosen = items.filter((i) => sel.selected.has(i.id));
  const bytes = totalBytes(chosen);
  const actions: BulkBarAction[] = [
    {
      id: "download",
      label: "Download",
      icon: Download,
      color: "save",
      onRun: () => {
        /* Drawn, never wired: the download itself is export-flow's. */
      },
    },
    {
      id: "remove",
      label: "Remove to Deleted",
      icon: Trash2,
      color: "destructive",
      onRun: sel.removeSelected,
    },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <BulkBar
        count={sel.selected.size}
        allSelected={sel.selected.size === items.length}
        onSelectAll={() => sel.selectAll(items.map((i) => i.id))}
        onCancel={sel.clear}
        actions={actions}
      />
      <span className="text-xs tabular-nums text-muted-foreground">
        {formatBytes(bytes)} selected
      </span>
    </div>
  );
}

/**
 * `goal=toast` (boards refresh, 2026-09-24): nothing running while a host
 * selects, then this the moment enough is freed. Mutually exclusive with
 * `ToastQuote` below (a fresh goal versus a just-committed Remove), so the two
 * never fight for the same fixed corner.
 */
function GoalReachedToast({ screen }: { screen: ScreenId }) {
  return (
    <div className="hs-toast" data-screen={screen} data-hs-goal="ready">
      <Check className="size-4 shrink-0 text-success" aria-hidden />
      <div className="min-w-0 flex-1">
        <span>You&rsquo;ve freed enough for {TARGET_PLAN.name}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">
          Switch now, or keep going first.
        </span>
      </div>
      <Button type="button" size="sm">
        Switch
      </Button>
    </div>
  );
}

function ToastQuote({
  count,
  bytes,
  onUndo,
  screen,
}: {
  count: number;
  bytes: number;
  onUndo: () => void;
  screen: ScreenId;
}) {
  return (
    <div className="hs-toast" data-screen={screen} data-hs-toast>
      <Check className="size-4 shrink-0 text-success" aria-hidden />
      <div className="min-w-0 flex-1">
        <span>
          Removed {count} {count === 1 ? "item" : "items"} to Deleted
        </span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">
          {formatBytes(bytes)} freed
        </span>
      </div>
      <Button type="button" size="sm" variant="ghost" onClick={onUndo}>
        Undo
      </Button>
    </div>
  );
}

/** One line, drawn the same wherever the list appears: the standby budget
 *  shrinks with the plan (lifecycle-recovery.md's `standby_budget`), so a
 *  switch is not "free space now, pay for it in Deleted later." */
function DeletedShrinksNote() {
  return (
    <p className="px-2 text-xs text-muted-foreground">
      Deleted keeps items only up to {TARGET_PLAN.name}&rsquo;s size once you
      switch, so anything older there purges sooner.
    </p>
  );
}

/* ── the one surface every scope wraps ──────────────────────────────────── */

export function StorageSurface({
  items,
  groups,
  mode,
  goal,
  screen,
  showEvent = true,
}: {
  items: readonly StorageItem[];
  groups?: readonly EventGroup[];
  mode: "flat" | "grouped";
  goal: "live" | "plain" | "toast" | null;
  screen: ScreenId;
  showEvent?: boolean;
}) {
  const flat = mode === "flat" ? items : (groups?.flatMap((g) => g.items) ?? []);
  const sel = useStorageSelection(flat);
  const selectedBytes = totalBytes(flat.filter((i) => sel.selected.has(i.id)));
  const removedBytes = totalBytes(flat.filter((i) => sel.removedIds.has(i.id)));

  return (
    <div className="space-y-3">
      {goal === "live" || goal === "plain" ? (
        <GoalStrip
          goal={goal}
          selectedBytes={selectedBytes}
          removedBytes={removedBytes}
        />
      ) : null}
      {mode === "flat" ? (
        <FlatList items={items} screen={screen} showEvent={showEvent} sel={sel} />
      ) : (
        <GroupedList groups={groups ?? []} screen={screen} sel={sel} />
      )}
      {sel.selected.size > 0 && <BulkFooter sel={sel} items={flat} />}
      {sel.justRemoved ? (
        <ToastQuote
          count={sel.justRemoved.ids.length}
          bytes={sel.justRemoved.bytes}
          onUndo={sel.undo}
          screen={screen}
        />
      ) : goal === "toast" ? (
        <GoalReachedToast screen={screen} />
      ) : null}
      <DeletedShrinksNote />
    </div>
  );
}

/* ── the account-level Storage page (`where=account`) ───────────────────── */

export function AccountScope({
  order,
  goal,
  screen,
}: {
  order: "flat" | "grouped" | "hybrid";
  goal: "live" | "plain" | "toast" | null;
  screen: ScreenId;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="space-y-1">
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          Account <ChevronRight className="size-3" aria-hidden /> Plan and
          storage
        </p>
        <h1 className="font-heading text-subsection">Storage</h1>
        <p className="text-sm text-muted-foreground">
          {formatBytes(TOTAL_ACTIVE_BYTES)} of{" "}
          {formatBytes(CURRENT_PLAN.storageBytes)} used, across every live
          event.
        </p>
      </div>
      <StorageSurface
        items={order === "flat" ? largestFirst() : []}
        groups={
          order === "grouped"
            ? groupedByEvent()
            : order === "hybrid"
              ? groupedByWorstFirst()
              : undefined
        }
        mode={order === "flat" ? "flat" : "grouped"}
        goal={goal}
        screen={screen}
      />
    </div>
  );
}
