"use client";

import type { CSSProperties, ReactNode } from "react";
import { CircleCheck, Download, Loader2, X } from "lucide-react";

import { floatingPanel, floatingRow } from "@/components/ui/floating-layer";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * THE DOWNLOAD'S QUICK CHOICE AS BUILT (`ui/responsive-menu.tsx`, `popups` r1
 * `choices=menu`), in both its shapes, and the toast every download walks in
 * (`export-toast.tsx`).
 *
 * ★ QUOTED, BECAUSE THE REAL MENU CANNOT BE DRAWN IN A FRAME: it portals to the
 * lab's own page and reads the lab's own media query for its shape (ROADMAP,
 * "The lab and the kit": `responsive-menu.tsx` cannot be drawn in a lab frame).
 * So its private `DESK_ROW` and `HAND_ROW` are copied here string for string,
 * on production's own `floatingPanel` and `floatingRow`, and the real `Switch`
 * and `Tabs` atoms stand in it.
 */

/** `responsive-menu.tsx`'s desk row, verbatim. */
const DESK_ROW =
  "flex min-h-9 w-full items-center gap-2.5 px-2.5 py-1.5 text-left text-sm outline-none select-none hover:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground";

/** `responsive-menu.tsx`'s hand row, verbatim. */
const HAND_ROW =
  "flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left text-base outline-none select-none active:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:text-muted-foreground";

export type MenuShape = "menu" | "rows";

export type MenuRow = {
  icon: ReactNode;
  label: string;
  /** What the row takes home: its count and its size. */
  hint: string;
  /** The row the frame's act is: pressed, so it wears the press's tint. */
  act?: boolean;
};

/** A row: an icon, its words, and what it is worth at its end. */
function Row({ shape, row }: { shape: MenuShape; row: MenuRow }) {
  return (
    <span
      role="menuitem"
      data-th-act={row.act ? "" : undefined}
      className={cn(
        shape === "menu" ? DESK_ROW : HAND_ROW,
        floatingRow,
        row.act && "bg-accent",
      )}
    >
      {row.icon}
      <span className="min-w-0 flex-1">{row.label}</span>
      <span
        className={cn(
          "shrink-0 text-muted-foreground tabular-nums",
          shape === "menu" ? "text-xs" : "text-sm",
        )}
      >
        {row.hint}
      </span>
    </span>
  );
}

/**
 * A SIZE CHOICE AT THE MENU'S HEAD (the host's `sizes`): the product's own
 * two-way control (`ui/tabs.tsx`), Originals or Phone size, and every row's
 * worth follows it.
 */
export function SizeTabs({
  value,
  shape,
}: {
  value: "original" | "phone";
  shape: MenuShape;
}) {
  return (
    <div
      className={cn(
        "flex",
        shape === "menu" ? "px-1.5 pt-1 pb-1.5" : "justify-center px-3 pb-2",
      )}
    >
      <Tabs value={value} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="original">Originals</TabsTrigger>
          <TabsTrigger value="phone">Phone size</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

/**
 * THE MENU, IN ONE OF ITS TWO SHAPES. "menu" stands under the button that
 * asked, at `anchor` (the frame's own pixels: its right edge and its top);
 * "rows" rises to the thumb as the phone's own chooser does, Cancel beneath.
 */
export function DownloadMenu({
  shape,
  title,
  head,
  rows,
  toggle,
  note,
  foot,
  anchor,
}: {
  shape: MenuShape;
  title: string;
  /** Above the rows: the host's size choice. */
  head?: ReactNode;
  rows: readonly MenuRow[];
  /** The host's Include hidden items. */
  toggle?: string;
  note: string;
  /** A quiet line after the note (each screen its own's "Phone size instead"). */
  foot?: ReactNode;
  anchor?: { right: number; top: number };
}) {
  const toggleRow = toggle ? (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        shape === "menu"
          ? "min-h-9 px-2.5 py-1.5 text-sm"
          : "min-h-12 px-3 py-2 text-base",
      )}
    >
      <span className="min-w-0 text-muted-foreground">{toggle}</span>
      <Switch checked={false} aria-label={toggle} />
    </div>
  ) : null;
  const noteLine = (
    <p
      data-th-read=""
      className={cn(
        "text-xs text-pretty text-muted-foreground",
        shape === "menu" ? "px-2.5 pt-1 pb-1.5" : "px-3 pt-1 pb-2 text-center",
      )}
    >
      {note}
    </p>
  );
  if (shape === "menu") {
    return (
      <div
        role="menu"
        className={cn(
          "absolute z-50 flex w-72 flex-col p-1 text-sm",
          floatingPanel,
        )}
        // Under the button that asked, its right edge on the button's (`align="end"`, `sideOffset` 6),
        // unless a frame places it itself.
        style={
          (anchor
            ? { right: anchor.right, top: anchor.top }
            : { right: 0, top: "calc(100% + 6px)" }) as CSSProperties
        }
      >
        <p className="px-2.5 pt-1.5 pb-1 text-xs text-muted-foreground">
          {title}
        </p>
        {head}
        {rows.map((r) => (
          <Row key={r.label} shape="menu" row={r} />
        ))}
        {toggleRow}
        {noteLine}
        {foot}
      </div>
    );
  }
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs" />
      <div className="fixed inset-x-2 bottom-2 z-50 flex flex-col gap-2 text-sm">
        <div role="menu" className={cn("p-1", floatingPanel)}>
          <p className="px-3 pt-2.5 pb-2 text-center text-xs text-pretty text-muted-foreground">
            {title}
          </p>
          {head}
          {rows.map((r) => (
            <Row key={r.label} shape="rows" row={r} />
          ))}
          {toggleRow}
          {noteLine}
          {foot}
        </div>
        <span
          className={cn(
            "flex h-12 shrink-0 items-center justify-center text-base font-medium",
            floatingPanel,
          )}
        >
          Cancel
        </span>
      </div>
    </>
  );
}

/** A quiet line under a menu's note: the other size, one press away. */
export function QuietLine({
  shape,
  children,
}: {
  shape: MenuShape;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "block text-xs font-medium underline-offset-4",
        shape === "menu" ? "px-2.5 pb-1.5" : "px-3 pb-2 text-center",
      )}
    >
      {children}
    </span>
  );
}

/* ── the toast ─────────────────────────────────────────────────────────────── */

export type ToastTone = "wait" | "between" | "done";

/**
 * THE DOWNLOAD'S TOAST (`export-toast.tsx` on the product's toaster, top
 * centre, 5rem down), quoted: its icon by tone, its one line, an answer where
 * the walk offers one, and the x on the right in every state that is still in
 * flight (Will's "a subtle x on the right to cancel").
 */
export function WalkToast({
  tone,
  title,
  action,
}: {
  tone: ToastTone;
  title: string;
  action?: string;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center px-4">
      <div
        data-th-read=""
        className="flex w-full max-w-[356px] items-center gap-2 rounded-float border border-border bg-popover p-4 text-[13px] text-popover-foreground shadow-layer"
      >
        <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
          {tone === "wait" ? (
            <Loader2 className="size-4" />
          ) : tone === "done" ? (
            <CircleCheck className="size-4 text-success" />
          ) : (
            <Download className="size-4" />
          )}
        </span>
        <span className="min-w-0 flex-1 font-medium">{title}</span>
        {action && (
          <span className="shrink-0 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
            {action}
          </span>
        )}
        {tone !== "done" && (
          <span className="-my-1.5 -mr-2 flex size-8 shrink-0 items-center justify-center rounded-md opacity-55">
            <X className="size-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}
