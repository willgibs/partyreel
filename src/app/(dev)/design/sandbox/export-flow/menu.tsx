"use client";

import type { ReactNode } from "react";

import {
  Image as ImageIcon,
  Images,
  Layers,
  UserRound,
  Video,
} from "lucide-react";

import { floatingPanel, floatingRow } from "@/components/ui/floating-layer";
import { Switch } from "@/components/ui/switch";
import {
  type ExportSummary,
  type ExportTypeFilter,
  MAX_EXPORT_BYTES,
  MAX_EXPORT_ITEMS,
} from "@/lib/export/build-manifest";
import { formatCount } from "@/lib/format/count";
import { cn, formatBytes } from "@/lib/utils";

import { hasHidden, totalFor } from "./fixtures";

/**
 * THE DOWNLOAD MENU, QUOTED SO IT CAN BE DRAWN INSIDE A FRAME (`popups` r1,
 * `choices=menu`: `export-dialog.tsx` on `ui/responsive-menu.tsx`).
 *
 * ★ WHY IT IS NOT THE SHIPPED COMPONENT. `ResponsiveMenu` portals its surface
 * to `document.body` of the realm the script runs in, which for a lab frame is
 * the BOARD PAGE, and it picks its shape from `useMediaQuery(DESK_QUERY)`,
 * which reads the lab page's width rather than the frame's. Opened for real it
 * would land on the desk, at the desk's width, in no capture. Opening
 * `ExportDialog` would also fetch a summary, a request this board never makes.
 * So the two shapes are quoted here, class for class, and the material comes
 * from the shipped constants (`floatingPanel`, `floatingRow`), so a retune of
 * the floating layer moves this picture too.
 *
 * ★ `DESK_ROW` AND `HAND_ROW` ARE PRIVATE TO `responsive-menu.tsx`, so they are
 * copied verbatim below. If the menu's rows ever change, this is the copy that
 * has to move with them.
 *
 * ★ THE WORDS AND THE ARITHMETIC ARE THE APP'S. "Download album", the three
 * bundle labels, the hint (`formatCount · formatBytes`), "Include hidden
 * items", and the note's three sentences are quoted from `export-dialog.tsx`;
 * `totalFor` is its arithmetic (fixtures.ts). Anything an option adds (the
 * Yours row, "in 2 zips", Save to Photos, the note naming 2,000) is new copy
 * and says so where it is written.
 */

/** Which of its two shapes the menu is drawn in: at a desk, or in a hand. */
export type MenuShape = "menu" | "rows";

/** The product's one breakpoint (`DESK_QUERY`, 640 px): a phone is a hand. */
export const shapeForWidth = (w: number): MenuShape =>
  w >= 640 ? "menu" : "rows";

const DESK_ROW =
  "flex min-h-9 w-full items-center gap-2.5 px-2.5 py-1.5 text-left text-sm outline-none select-none hover:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground";

const HAND_ROW =
  "flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left text-base outline-none select-none active:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:text-muted-foreground";

export type MenuRow = {
  /** The row's key, and what a reader looks it up by (`data-xf-row`). */
  readonly key: string;
  readonly icon: ReactNode;
  readonly label: string;
  readonly hint?: string;
  readonly disabled?: boolean;
};

function MenuItem({ shape, row }: { shape: MenuShape; row: MenuRow }) {
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      disabled={row.disabled}
      data-xf-row={row.key}
      className={cn(shape === "menu" ? DESK_ROW : HAND_ROW, floatingRow)}
    >
      {row.icon}
      <span className="min-w-0 flex-1" data-xf-row-label>
        {row.label}
      </span>
      {row.hint ? (
        <span
          className={cn(
            "shrink-0 text-muted-foreground tabular-nums",
            shape === "menu" ? "text-xs" : "text-sm",
          )}
          data-xf-row-hint
        >
          {row.hint}
        </span>
      ) : null}
    </button>
  );
}

/** `ResponsiveMenuToggle`: a setting among the rows, which flips in place. */
function Toggle({
  shape,
  children,
}: {
  shape: MenuShape;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        shape === "menu"
          ? "min-h-9 px-2.5 py-1.5 text-sm"
          : "min-h-12 px-3 py-2 text-base",
      )}
    >
      <span className="min-w-0 text-muted-foreground">{children}</span>
      <Switch checked={false} tabIndex={-1} aria-label="Include hidden items" />
    </div>
  );
}

/** `ResponsiveMenuNote`: the quiet line among the rows, the act's terms. */
function Note({ shape, children }: { shape: MenuShape; children: ReactNode }) {
  return (
    <p
      data-xf-note
      className={cn(
        "text-xs text-pretty text-muted-foreground",
        shape === "menu" ? "px-2.5 pt-1 pb-1.5" : "px-3 pt-1 pb-2 text-center",
      )}
    >
      {children}
    </p>
  );
}

/**
 * THE HAND'S SHAPE: the rows rise to the thumb over the album's scrim, the
 * title centred over them, Cancel beneath as its own panel. `fixed` is the
 * frame's own viewport, exactly as it is a phone's.
 */
function HandMenu({ children }: { children: ReactNode }) {
  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
      />
      <div
        data-xf-menu="rows"
        className="fixed inset-x-2 bottom-2 z-50 flex flex-col gap-2 text-sm outline-none"
      >
        <div
          role="menu"
          aria-label="Download album"
          className={cn(
            "max-h-[calc(100svh-6rem)] overflow-y-auto overscroll-contain p-1",
            floatingPanel,
          )}
        >
          <p className="px-3 pt-2.5 pb-2 text-center text-xs text-pretty text-muted-foreground">
            Download album
          </p>
          {children}
        </div>
        <button
          type="button"
          tabIndex={-1}
          className={cn(
            "flex h-12 shrink-0 items-center justify-center text-base font-medium transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.99] motion-reduce:active:scale-100",
            floatingPanel,
          )}
        >
          Cancel
        </button>
      </div>
    </>
  );
}

/**
 * THE DESK'S SHAPE: a menu under the Download that asked, its right edge on
 * the button's (`align="end"`) and six pixels below it (`sideOffset={6}`).
 * The caller renders it inside the trigger's own `relative` box, which is
 * where the popper would have put it.
 */
function DeskMenu({ children }: { children: ReactNode }) {
  return (
    <div
      data-xf-menu="menu"
      role="menu"
      aria-label="Download album"
      className={cn(
        "absolute top-full right-0 z-50 mt-1.5 flex w-72 flex-col overflow-y-auto p-1 text-left text-sm font-normal outline-none",
        floatingPanel,
      )}
    >
      <p className="px-2.5 pt-1.5 pb-1 text-xs text-muted-foreground">
        Download album
      </p>
      {children}
    </div>
  );
}

/* ── what the rows say ───────────────────────────────────────────────────── */

const BUNDLES: { key: ExportTypeFilter; label: string; Icon: typeof Layers }[] =
  [
    { key: "all", label: "Everything", Icon: Layers },
    { key: "photo", label: "Photos", Icon: ImageIcon },
    { key: "video", label: "Videos", Icon: Video },
  ];

const hint = (b: { count: number; bytes: number }) =>
  `${formatCount(b.count)} · ${formatBytes(b.bytes)}`;

const overCap = (b: { count: number; bytes: number }) =>
  b.count > MAX_EXPORT_ITEMS || b.bytes > MAX_EXPORT_BYTES;

/** How many zips a bundle takes when the product splits it (`cap=split`). */
export const partsFor = (b: { count: number; bytes: number }) =>
  Math.max(
    Math.ceil(b.count / MAX_EXPORT_ITEMS),
    Math.ceil(b.bytes / MAX_EXPORT_BYTES),
  );

/**
 * What a bundle keeps when the product trims it (`cap=auto`): the newest items
 * up to both ceilings. A summary has no per-item sizes, so the kept bytes are
 * the kept share of the total: a fixture's stand-in for the real manifest's
 * arithmetic over actual objects, never shipped.
 */
const trimmed = (b: { count: number; bytes: number }) => {
  const each = b.count > 0 ? b.bytes / b.count : 0;
  const kept = Math.min(
    b.count,
    MAX_EXPORT_ITEMS,
    each > 0 ? Math.floor(MAX_EXPORT_BYTES / each) : b.count,
  );
  return { count: kept, bytes: Math.round(kept * each), left: b.count - kept };
};

/** The three answers to the limit on this board (`bite`, today's, left with the audit). */
export type CapMode = "today" | "near" | "split" | "auto";

const LIMIT = formatCount(MAX_EXPORT_ITEMS);

export type MenuVariant = {
  /** `means=mine`: a Yours row at the top, the set View's Yours already names. */
  yours?: ExportSummary;
  /** `phone=both`: Save to Photos above the bundles (save-sheet's one-tap Save). */
  photos?: boolean;
  /** The limit's answer (`cap`); every other ask draws today's. */
  cap?: CapMode;
};

/** "Everything", "Everything and Photos", "Everything, Photos and Videos". */
const listed = (names: string[]) =>
  names.length <= 1
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

/**
 * THE MENU AS THE SHIPPED `ExportDialog` DRAWS IT for one summary, with the
 * one thing an option changes. `today` everywhere is the shipped menu, byte
 * for byte in words: a row over the limit is dead and the note names no
 * number.
 */
export function DownloadMenu({
  shape,
  summary,
  isHost = false,
  variant = {},
}: {
  shape: MenuShape;
  summary: ExportSummary;
  isHost?: boolean;
  variant?: MenuVariant;
}) {
  const cap = variant.cap ?? "today";
  const rows: MenuRow[] = [];

  if (variant.photos) {
    // NEW COPY (`phone=both`): the save-sheet precedent's one tap, for the lot.
    const all = totalFor(summary, "all", false);
    rows.push({
      key: "photos",
      icon: <Images />,
      label: "Save to Photos",
      hint: hint(all),
      disabled: all.count === 0,
    });
  }

  if (variant.yours) {
    // NEW COPY (`means=mine`): the word View beside Download all already uses.
    const mine = totalFor(variant.yours, "all", false);
    if (mine.count > 0)
      rows.push({
        key: "yours",
        icon: <UserRound />,
        label: "Yours",
        hint: hint(mine),
      });
  }

  const dead: string[] = [];
  let anyNear = false;
  for (const { key, label, Icon } of BUNDLES) {
    const total = totalFor(summary, key, false);
    const over = overCap(total);
    // "Close" is the last tenth before the ceiling, where a line that warns
    // is still a warning rather than a refusal.
    if (!over && total.count > MAX_EXPORT_ITEMS * 0.9) anyNear = true;
    if (over && cap === "split") {
      // NEW COPY (`cap=split`): the row takes the lot, in numbered parts.
      rows.push({
        key,
        icon: <Icon />,
        label: `${label}, in ${partsFor(total)} zips`,
        hint: hint(total),
      });
      continue;
    }
    if (over && cap === "auto") {
      // NEW COPY (`cap=auto`): the row takes the newest it can, and says what it left.
      const t = trimmed(total);
      rows.push({
        key,
        icon: <Icon />,
        label: `${label}, ${formatCount(t.left)} left out`,
        hint: hint(t),
      });
      continue;
    }
    if (over) dead.push(label);
    rows.push({
      key,
      icon: <Icon />,
      label,
      hint: hint(total),
      disabled: total.count === 0 || over,
    });
  }
  const anyDead = dead.length > 0;

  const note = (() => {
    if (variant.photos)
      // NEW COPY (`phone=both`).
      return "Save to Photos opens your phone's share sheet. The rest each download as one zip, to Files.";
    if (cap === "near" && anyDead)
      // NEW COPY (`cap=near`): the refusal, with the number it refuses at.
      return `A download holds up to ${LIMIT} items or ${formatBytes(MAX_EXPORT_BYTES)}. ${listed(dead)} ${dead.length === 1 ? "is" : "are"} over it.`;
    if (cap === "near" && anyNear)
      // NEW COPY (`cap=near`): the same line, a warning while it still fits.
      return `Close to the ${LIMIT} items a download can hold.`;
    if (cap === "split" && rows.some((r) => /zips$/.test(r.label)))
      // NEW COPY (`cap=split`).
      return `Over ${LIMIT} items, a download comes in numbered zips.`;
    if (cap === "auto" && rows.some((r) => /left out$/.test(r.label)))
      // NEW COPY (`cap=auto`).
      return `Over ${LIMIT} items, a download keeps the newest ${LIMIT}.`;
    // THE SHIPPED NOTE, verbatim.
    return anyDead
      ? "Too large to download all at once. Pick photos or videos to split it up."
      : "Each downloads as one file.";
  })();

  const body = (
    <>
      {rows.map((row) => (
        <MenuItem key={row.key} shape={shape} row={row} />
      ))}
      {isHost && hasHidden(summary) ? (
        <Toggle shape={shape}>Include hidden items</Toggle>
      ) : null}
      <Note shape={shape}>{note}</Note>
    </>
  );

  return shape === "menu" ? (
    <DeskMenu>{body}</DeskMenu>
  ) : (
    <HandMenu>{body}</HandMenu>
  );
}
