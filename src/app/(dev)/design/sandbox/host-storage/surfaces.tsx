"use client";

import { useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { floatingPanel, floatingRow } from "@/components/ui/floating-layer";
import { friendlyCapacity } from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";

import {
  ALBUM_SCOPE_EVENT_ID,
  ALBUM_SCOPE_ITEMS,
  CURRENT_PLAN,
  EVENTS,
  groupedByEvent,
  largestFirst,
  TOTAL_ACTIVE_BYTES,
} from "./fixtures";
import type { ScreenId } from "./scene";
import { StorageSurface } from "./storage-list";

/**
 * THE CHROME AROUND THE LIST: the three homes `where` is asked about, each
 * quoted from its real surface (account/page.tsx's Plan card, storage-
 * meter.tsx's popover, dashboard/page.tsx's grace banner, event-gallery.tsx's
 * View menu) with the ONE new line or link each option proposes. Quoted, not
 * imported: a Popover and a DropdownMenu both portal out of this frame (the
 * frame IS the viewport), same reason `host-curation` quotes its own peek and
 * bell rather than opening the real ones.
 */

/* ── the account-level entry points (`where=account`) ───────────────────── */

export function AccountEntryPoints() {
  const capacity = friendlyCapacity(CURRENT_PLAN.storageBytes);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Four places already talk about the cap; each gains one new link into
        Storage rather than a new page of its own.
      </p>

      {/* 1. account/page.tsx's Plan card, quoted */}
      <div className="space-y-2 rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium">Plan</p>
        <p className="text-xs text-muted-foreground">
          {CURRENT_PLAN.name} · {formatBytes(TOTAL_ACTIVE_BYTES)} of{" "}
          {formatBytes(CURRENT_PLAN.storageBytes)} used
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" size="sm" variant="outline">
            Manage billing
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-foreground underline underline-offset-4"
          >
            {/* New */}
            View sizes
          </Button>
        </div>
      </div>

      {/* 2. storage-meter.tsx's popover, quoted */}
      <div className={cn("w-72 max-w-full space-y-2 p-3", floatingPanel)}>
        <p className="text-sm font-medium">
          {formatBytes(TOTAL_ACTIVE_BYTES)} of{" "}
          {formatBytes(CURRENT_PLAN.storageBytes)}
        </p>
        <p className="text-xs text-muted-foreground">
          Your {CURRENT_PLAN.name} plan holds about{" "}
          {capacity.photos.toLocaleString()} photos or{" "}
          {capacity.videoMinutes.toLocaleString()} min of video.{" "}
          <button
            type="button"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Need more?
          </button>{" "}
          ·{" "}
          <button
            type="button"
            className="font-medium text-foreground underline underline-offset-4"
          >
            {/* New */}
            View details
          </button>
        </p>
      </div>

      {/* 3. dashboard/page.tsx's over-cap grace banner, quoted */}
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
        <p className="font-medium text-foreground">
          You&rsquo;re over your storage limit
        </p>
        <p className="mt-1 text-muted-foreground">
          Upgrade or remove media by{" "}
          <strong className="text-foreground">14 Oct 2026</strong>. After that
          we&rsquo;ll automatically reduce your storage (largest files first).{" "}
          <button
            type="button"
            className="font-medium text-foreground underline underline-offset-4"
          >
            See plans
          </button>{" "}
          ·{" "}
          <button
            type="button"
            className="font-medium text-foreground underline underline-offset-4"
          >
            {/* New */}
            Find the largest files
          </button>
          .
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        The fourth, the pricing sheet&rsquo;s own refusal, is decision 4 below.
      </p>
    </div>
  );
}

/* ── the album's View menu, one new group (`where=album`) ───────────────── */

function MenuGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5" role="group" aria-label={label}>
      <div className="flex items-baseline justify-between gap-3 px-2 pt-0.5 pb-1 text-xs text-foreground opacity-70">
        <span>{label}</span>
        {hint && (
          <span className="text-[10px] text-muted-foreground/70">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function MenuRow({
  label,
  selected,
  disabled,
  onSelect,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "relative flex w-full items-center py-1.5 pr-8 pl-2 text-left text-sm outline-none",
        floatingRow,
        disabled
          ? "pointer-events-none opacity-50"
          : "hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {selected && (
        <Check className="absolute right-2 size-4" aria-hidden strokeWidth={2.5} />
      )}
      {label}
    </button>
  );
}

/** The panel, always OPEN: `event-gallery.tsx`'s real ViewMenu is a radix
 *  DropdownMenu, whose content portals to document.body of the wrong realm.
 *  Every row but the new Storage group is inert, matching the shipped menu's
 *  own reserved Sort group exactly. */
function ViewMenuQuote({
  tab,
  onTab,
}: {
  tab: "album" | "sizes";
  onTab: (t: "album" | "sizes") => void;
}) {
  return (
    <div
      role="menu"
      aria-label="View"
      className={cn("w-56 space-y-1.5 p-1", floatingPanel)}
    >
      <MenuGroup label="Tile size">
        <MenuRow label="Small" />
        <MenuRow label="Medium" selected />
        <MenuRow label="Large" />
      </MenuGroup>
      <MenuGroup label="Sort" hint="Coming soon">
        <MenuRow label="Newest first" selected disabled />
        <MenuRow label="Oldest first" disabled />
      </MenuGroup>
      <MenuGroup label="Filter">
        <MenuRow label="All" selected />
        <MenuRow label="Deleted" />
      </MenuGroup>
      <MenuGroup label="Storage" hint="New">
        <MenuRow
          label="Album"
          selected={tab === "album"}
          onSelect={() => onTab("album")}
        />
        <MenuRow
          label="Sizes"
          selected={tab === "sizes"}
          onSelect={() => onTab("sizes")}
        />
      </MenuGroup>
    </div>
  );
}

export function AlbumScope({
  goal,
  screen,
}: {
  goal: "live" | "plain" | null;
  screen: ScreenId;
}) {
  const [tab, setTab] = useState<"album" | "sizes">("sizes");
  const event = EVENTS.find((e) => e.id === ALBUM_SCOPE_EVENT_ID)!;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-heading text-card-title font-medium">
            {event.name}
          </p>
          <p className="text-xs text-muted-foreground">
            Album · {ALBUM_SCOPE_ITEMS.length} items
          </p>
        </div>
        <div className="relative">
          <Button type="button" variant="outline" size="sm">
            <SlidersHorizontal /> View
          </Button>
          <div className="absolute top-full right-0 z-10 mt-1.5">
            <ViewMenuQuote tab={tab} onTab={setTab} />
          </div>
        </div>
      </div>

      {tab === "album" ? (
        <>
          <div
            aria-hidden
            className="grid grid-cols-4 gap-1.5"
            data-hs-album-grid
          >
            {ALBUM_SCOPE_ITEMS.slice(0, screen === "375" ? 8 : 12).map((i) => (
              // eslint-disable-next-line @next/next/no-img-element -- a bootstrap still
              <img
                key={i.id}
                src={i.url}
                alt=""
                className="aspect-4/5 w-full rounded-md object-cover"
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            The album&rsquo;s own masonry, unchanged. Sizes, above, is the new
            group.
          </p>
        </>
      ) : (
        <StorageSurface
          items={ALBUM_SCOPE_ITEMS}
          mode="flat"
          goal={goal}
          screen={screen}
          showEvent={false}
        />
      )}
    </div>
  );
}

/* ── a Storage sheet off the meter (`where=sheet`) ───────────────────────── */

export function SheetScope({
  order,
  goal,
  screen,
}: {
  order: "flat" | "grouped";
  goal: "live" | "plain" | null;
  screen: ScreenId;
}) {
  return (
    <>
      <div className="hs-scrim" aria-hidden />
      <div className="hs-sheet" data-screen={screen} role="dialog" aria-label="Storage">
        <div className="flex flex-col gap-0.5 p-4">
          <p className="font-heading text-card-title font-medium">Storage</p>
          <p className="text-sm text-muted-foreground">
            {formatBytes(TOTAL_ACTIVE_BYTES)} across every live event.
          </p>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          <StorageSurface
            items={order === "flat" ? largestFirst() : []}
            groups={order === "grouped" ? groupedByEvent() : undefined}
            mode={order}
            goal={goal}
            screen={screen}
          />
        </div>
      </div>
    </>
  );
}
