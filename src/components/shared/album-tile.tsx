"use client";

/**
 * THE ONE ALBUM TILE, MEMOIZED (the album-window lane). Every album grid draws
 * its photographs through `AlbumTile` (`masonry.tsx`'s `MasonryColumns` hands
 * each one its box), and a tile re-renders only when something it draws
 * changed.
 *
 * WHY. A tile used to be JSX built inline by the grid, so any render of the grid
 * rendered every tile: a like, an upload's progress tick, a poll that changed
 * nothing and every arrival each re-rendered all 1,145 of them (measured on the
 * scale page, `scripts/album-perf.mjs`). Now:
 *
 * ★ DATA PROPS ONLY, AND COMPARED BY CONTENT. A tile takes the item and a few
 *   booleans the grid derives for it; the item is compared by the fields a tile
 *   draws (a poll hands down equal photographs in new objects), its box by its
 *   values, its hover set by what each action shows (`sameActions`: never the
 *   `onSelect` closure, which is new every render and read at tap time).
 * ★ NO HANDLER ON A TILE. The open button, the hover verbs and the yours mark
 *   carry `data-` attributes, and the GRID holds one delegated click and one
 *   long-press (`masonry.tsx`), reading the latest callbacks from a ref.
 * ★ A LIKE IS READ PER ID. The heart mark and the like glyph subscribe to their
 *   own photograph's like (`useIsLiked`), so a like re-renders one mark and one
 *   glyph and never this tile, let alone the grid.
 * ★ IT ENTERS ONCE. Whether a tile takes the album's entrance is decided when it
 *   mounts and never again, so a tile scrolled into a window long after the page
 *   opened lands still, and a mounted one never has its entrance cut short.
 *
 * ★ A TILE SHOWS STATE, NOT CONTROLS (Will, `tiles`, 2026-09-20): "Having icons
 * visible on every image card on mobile is going to get way too crowded and
 * overwhelming immediately. Aside from an active like icon..., a video play
 * icon..., or a like count..., let's handle all actions and controls (like,
 * download, etc) in the lightbox controls." So a phone tile carries marks and
 * nothing else, and the desk keeps its hover row (his `bulk-toolbar` note:
 * "every action on a photograph lives in the lightbox" was a MOBILE rule), as
 * ONE pane (`row=bar`: "This feels much cleaner and more cohesive").
 */
import "./album-tile.css";

import { memo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Check, Play } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { likeLabel, TileLikeMark } from "@/components/likes/like-button";
import { useIsLiked } from "@/components/likes/likes-provider";
import { probeAlbumRender } from "@/components/shared/album-tile-probe";
import { Skeleton } from "@/components/ui/skeleton";
import { GLASS, GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { tileAspect, UNIFORM_TILE_ASPECT } from "@/lib/media/tile-aspect";
import { cn } from "@/lib/utils";

/**
 * ONE ACTION IN A SURFACE'S HOVER ROW. Declared rather than rendered by the
 * caller, so the row stays ONE pane whoever fills it: a caller handing us JSX
 * would bring its own chip back, which is the shape `row=bar` retired.
 */
export type TileAction = {
  id: string;
  /** The native tooltip and the accessible name (tiles use `title`, not radix). */
  label: string;
  icon: LucideIcon;
  /** The hue on direct hover (emil: monochrome at rest, colour on hover/state). */
  tone?: "save" | "warning" | "destructive" | "success" | "like";
  /** A state the glyph KEEPS off-hover (the liked heart, the hidden marker's amber eye). */
  active?: boolean;
  /**
   * The viewer's like of this photograph (`useLikeAction`): the glyph reads its
   * pressed state and its words live (`useIsLiked`), so `active` and `label`
   * are ignored and a like never re-renders the grid that declared it.
   */
  like?: boolean;
  /** A link action (Save the original) — rendered as an `<a download>`. */
  href?: string;
  /** Read at TAP time by the grid's one click handler, never compared. */
  onSelect?: () => void;
  disabled?: boolean;
};

/**
 * The subtle corner play marker for video tiles (one of Will's three permitted
 * marks). In the one material at the mark's blur: the tint, the edges and the
 * backdrop are Crystal's, the 42px is not, because a tile carries one of these
 * on every video of an album and a phone pays for each of them.
 */
export function CornerPlayBadge() {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute bottom-1.5 left-1.5 flex size-5 items-center justify-center rounded-full",
        GLASS_MARK,
      )}
    >
      <Play
        className={cn("ml-px size-2.5 fill-white text-white", GLASS_MARK_LIT)}
      />
    </span>
  );
}

/**
 * THE FOURTH MARK: THIS ONE IS YOURS (`theirs=mark`, Will 2026-09-20). A guest
 * can already remove any photograph they uploaded, for ever (`yours`, wired);
 * what no surface said was WHICH of 68 tiles are theirs, so the answer rides
 * the tile rather than a new control above the album — his own note on the
 * option he did not take: "rather than just adding more and more configs here".
 *
 * ★ IT TAKES THE TOP-LEFT CORNER, AND THAT IS THE ONLY CORNER FREE AT EVERY
 * WIDTH. The play mark and the like mark own the two bottom corners, and the
 * desk's hover row owns the top right (`row=bar`, one pane). The board drew
 * this mark top-right on a PHONE, where there is no hover row at all; on a
 * laptop that corner is the bar's, so the mark moves to the corner nobody else
 * claims rather than living under a pane that opens over it. (A guest's own
 * just-landed check shares this corner for about two seconds after an upload
 * and paints over it, which is the right order: the news wins, then the mark.)
 *
 * ★ THE GLYPH CARRIES ITS OWN LIGHT, like every other mark on a photograph:
 * `GLASS_MARK` is the material at the marks' cheaper blur and `GLASS_MARK_LIT`
 * is the dark halo that keeps a white glyph legible over a bright sky, which no
 * pane can do for it (`lib/glass.ts`).
 *
 * As a control it is a button the grid's one click handler answers (the
 * `data-tile-mark` attribute is how it finds it); as a marker it is not a button
 * at all, so a surface that cannot filter hands a screen reader nothing dead.
 */
function MineMark({
  control,
  selected,
}: {
  control: boolean;
  selected?: boolean;
}) {
  const body = (
    <span
      aria-hidden
      className={cn("size-1.5 rounded-full bg-white", GLASS_MARK_LIT)}
    />
  );
  const box = cn(
    "absolute top-1.5 left-1.5 z-10 flex size-5 items-center justify-center rounded-full",
    GLASS_MARK,
  );
  if (!control)
    return (
      <span
        data-tile-mark="mine"
        aria-hidden
        className={cn("pointer-events-none", box)}
      >
        {body}
      </span>
    );
  const label = selected
    ? "Showing only your photos. Show the whole album."
    : "Yours. Show only your photos.";
  return (
    <button
      type="button"
      data-tile-mark="mine"
      aria-label={label}
      aria-pressed={selected ?? false}
      title={label}
      className={cn(
        box,
        "cursor-pointer transition-transform duration-150 ease-emphasis outline-none",
        "focus-visible:ring-2 focus-visible:ring-white/70 active:scale-90 motion-reduce:active:scale-100",
      )}
    >
      {body}
    </button>
  );
}

/**
 * ONE COLOUR LANGUAGE FOR EVERY SURFACE'S ROW (Will, 2026-06-20: the action SET
 * differs by role, the colour language does not). Monochrome at rest, the hue on
 * direct hover, and the hue KEPT with a soft fill when the verb is a state you
 * are already in.
 */
const TONE: Record<NonNullable<TileAction["tone"]>, string> = {
  save: "hover:text-save",
  warning: "hover:text-warning",
  destructive: "hover:text-destructive",
  success: "hover:text-success",
  like: "hover:text-like",
};
const TONE_ACTIVE: Record<NonNullable<TileAction["tone"]>, string> = {
  save: "text-save",
  warning: "text-warning",
  destructive: "text-destructive",
  success: "text-success",
  like: "text-like",
};
const TONE_FILL: Record<NonNullable<TileAction["tone"]>, string> = {
  save: "fill-save/25",
  warning: "fill-warning/25",
  destructive: "fill-destructive/25",
  success: "fill-success/25",
  like: "fill-like/25",
};

/** One verb of the pane, drawn; the grid's click handler finds it by `data-tile-action`. */
function ActionGlyph({
  action: a,
  active,
  label,
}: {
  action: TileAction;
  active: boolean;
  label: string;
}) {
  const Icon = a.icon;
  const glyph = (
    <Icon
      className={cn(
        "size-4",
        GLASS_MARK_LIT,
        active && a.tone && TONE_FILL[a.tone],
      )}
    />
  );
  const className = cn(
    "flex size-6 cursor-pointer items-center justify-center rounded-full text-white outline-none",
    "transition-[color,transform] duration-150 ease-emphasis",
    "focus-visible:ring-2 focus-visible:ring-white/70 active:scale-90 motion-reduce:active:scale-100",
    a.tone && (active ? TONE_ACTIVE[a.tone] : TONE[a.tone]),
    a.disabled && "pointer-events-none opacity-50",
  );
  // A link action saves the original by itself; everything else is a button.
  return a.href ? (
    <a
      href={a.href}
      download
      data-tile-action={a.id}
      aria-label={label}
      title={label}
      className={className}
    >
      {glyph}
    </a>
  ) : (
    <button
      type="button"
      data-tile-action={a.id}
      aria-label={label}
      title={label}
      disabled={a.disabled}
      className={className}
    >
      {glyph}
    </button>
  );
}

/** The like verb, reading its own photograph's heart: a like re-renders this glyph alone. */
function LikeGlyph({ action, itemId }: { action: TileAction; itemId: string }) {
  const liked = useIsLiked(itemId);
  probeAlbumRender("mark", itemId);
  return (
    <ActionGlyph action={action} active={liked} label={likeLabel(liked)} />
  );
}

/**
 * THE DESK'S ROW, AS ONE PANE, AND NOT DRAWN AT ALL AT REST. The pane is a
 * backdrop filter: on every tile of a 1,145-photograph album, hidden only by a
 * zero width, it was 1,145 blurred layers nobody could see (the album-window
 * lane). `album-tile.css` keeps it `display:none` until the tile is hovered or
 * the keyboard is inside it, and slides it open from there
 * (`@starting-style`, `transition-behavior: allow-discrete`); never below `md`.
 */
function TileActionBar({
  actions,
  itemId,
}: {
  actions: readonly TileAction[];
  itemId: string;
}) {
  return (
    <div
      data-tile-actions
      style={
        { "--reveal-max": `${actions.length * 1.75 + 0.5}rem` } as CSSProperties
      }
      className={cn(
        "absolute top-1.5 right-1.5 z-10 items-center gap-0.5 rounded-full p-0.5",
        GLASS,
      )}
    >
      {actions.map((a) =>
        a.like ? (
          <LikeGlyph key={a.id} action={a} itemId={itemId} />
        ) : (
          <ActionGlyph
            key={a.id}
            action={a}
            active={!!a.active}
            label={a.label}
          />
        ),
      )}
    </div>
  );
}

/**
 * THE SELECTION'S MARKS (the host's bulk select on the one grid): a dim over a
 * chosen photograph and the check in its corner, the check keeping its colour
 * (state feedback is always coloured, `--success`), unselected the material
 * with its own hairline. Never a control: the whole tile is the toggle.
 */
function SelectMark({ selected }: { selected: boolean }) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 transition-colors",
          selected ? "bg-black/40" : "bg-black/0",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1.5 right-1.5 z-10 flex size-6 items-center justify-center rounded-full",
          selected
            ? "bg-success text-success-foreground ring-2 ring-white"
            : GLASS_MARK,
        )}
      >
        {selected && <Check data-check-pop className="size-3.5" />}
      </span>
    </>
  );
}

export type TileLayout = "masonry" | "uniform" | "rows";

export type AlbumTileProps = {
  item: GridMedia;
  layout: TileLayout;
  /**
   * Where the layout puts the tile: the rows engine's box, or a measured
   * masonry column's place. Without one the tile sizes itself by its aspect
   * in the flow (the first paint, and uniform always).
   */
  box?: CSSProperties;
  /** Rows: the glide's key (`data-rows-key`). */
  rowsKey?: string;
  clampAspect?: boolean;
  /** Take the album's entrance (and its stagger from `seedIndex`); read once, at mount. */
  enter?: boolean;
  seedIndex?: number;
  /** A photograph new to the rows this moment: it pushes in (`arrival.css`). */
  entering?: boolean;
  arrived?: boolean;
  landed?: boolean;
  /** The viewer's own: a marker, or a control the grid answers. */
  mine?: "marker" | "control";
  mineSelected?: boolean;
  dimmed?: boolean;
  /** The first row: fetched at once and first. */
  eager?: boolean;
  hideLikeMark?: boolean;
  actions?: readonly TileAction[];
  /** Per-tile chrome painted over everything; compared by identity. */
  overlay?: ReactNode;
  /** Select mode: the tile is a toggle and wears the selection's marks. */
  selecting?: boolean;
  selected?: boolean;
  exiting?: boolean;
  /** An item of the window's list (`role=listitem`; the window writes its set size and position). */
  listItem?: boolean;
  /** The grid's one in-view observer (stable for the grid's life, never compared). */
  observe?: (el: HTMLElement | null) => void | (() => void);
};

/** The fields of an item a tile draws: an equal photograph in a new object renders nothing. */
function sameItem(a: GridMedia, b: GridMedia): boolean {
  return (
    a === b ||
    (a.id === b.id &&
      a.type === b.type &&
      a.url === b.url &&
      a.previewUrl === b.previewUrl &&
      a.width === b.width &&
      a.height === b.height &&
      a.likeCount === b.likeCount)
  );
}

/** Two style objects with the same keys and values. */
export function sameBox(
  a: CSSProperties | undefined,
  b: CSSProperties | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const ka = Object.keys(a) as (keyof CSSProperties)[];
  if (ka.length !== Object.keys(b).length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
}

/** Two hover sets that draw the same verbs: everything but `onSelect`, which is read at tap time. */
export function sameActions(
  a: readonly TileAction[] | undefined,
  b: readonly TileAction[] | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (
      x.id !== y.id ||
      x.label !== y.label ||
      x.icon !== y.icon ||
      x.tone !== y.tone ||
      !!x.active !== !!y.active ||
      !!x.like !== !!y.like ||
      x.href !== y.href ||
      !!x.disabled !== !!y.disabled
    )
      return false;
  }
  return true;
}

/** `enter` and `seedIndex` are left out on purpose: a tile reads them once, when it mounts. */
function sameTileProps(a: AlbumTileProps, b: AlbumTileProps): boolean {
  return (
    sameItem(a.item, b.item) &&
    a.layout === b.layout &&
    sameBox(a.box, b.box) &&
    a.rowsKey === b.rowsKey &&
    !!a.clampAspect === !!b.clampAspect &&
    !!a.entering === !!b.entering &&
    !!a.arrived === !!b.arrived &&
    !!a.landed === !!b.landed &&
    a.mine === b.mine &&
    !!a.mineSelected === !!b.mineSelected &&
    !!a.dimmed === !!b.dimmed &&
    !!a.eager === !!b.eager &&
    !!a.hideLikeMark === !!b.hideLikeMark &&
    sameActions(a.actions, b.actions) &&
    a.overlay === b.overlay &&
    !!a.selecting === !!b.selecting &&
    !!a.selected === !!b.selected &&
    !!a.exiting === !!b.exiting &&
    !!a.listItem === !!b.listItem &&
    a.observe === b.observe
  );
}

function AlbumTileBody({
  item,
  layout,
  box,
  rowsKey,
  clampAspect = false,
  enter: enterProp = false,
  seedIndex,
  entering,
  arrived,
  landed,
  mine,
  mineSelected,
  dimmed,
  eager,
  hideLikeMark,
  actions,
  overlay,
  selecting,
  selected,
  exiting,
  listItem,
  observe,
}: AlbumTileProps) {
  probeAlbumRender("tile", item.id);
  // Decided at mount and kept (see the head note: a tile enters once).
  const [enter] = useState(enterProp);
  const uniform = layout === "uniform";
  return (
    <div
      ref={observe}
      role={listItem ? "listitem" : undefined}
      data-rows-key={rowsKey}
      data-media-tile
      data-arrived={arrived ? "" : undefined}
      data-landed={landed ? "" : undefined}
      data-entering={entering ? "" : undefined}
      data-mine={mine ? "" : undefined}
      data-exiting={exiting ? "" : undefined}
      data-selected={selecting && selected ? "" : undefined}
      // The lightbox finds a photograph's tile by it, to drop back into; the
      // grid's click and long-press find the photograph by it too.
      data-media-id={item.id}
      // The bright edge (globals.css, [data-lit]): this div owns the tile
      // radius and clips the photo, so the hook sits here and nowhere
      // above it. No value: a tile has no border for the light to land on.
      data-lit=""
      // No entrance: the host (emil: no entrance theater on host), and any tile
      // mounted after the album first settled (a window's scroll, an arrival).
      data-static={enter ? undefined : ""}
      style={
        {
          // A layout's box; else the one fixed aspect (uniform, object-cover
          // crops) or the natural ratio (the flow before a measure).
          ...(box ?? {
            aspectRatio: uniform
              ? UNIFORM_TILE_ASPECT
              : tileAspect(item, clampAspect),
          }),
          borderRadius: "var(--radius-tile)",
          ...(enter && seedIndex !== undefined
            ? { "--tile-i": seedIndex }
            : {}),
        } as CSSProperties
      }
      // Uniform: the CSS-grid gap spaces tiles; rows: the flex gap and the row
      // breaks. Masonry: the gap is the tile's own bottom margin, in the flow
      // and in the measured columns alike.
      //
      // ★ `contain: strict`: A TILE IS A LAYOUT BOUNDARY. Its size is its box's
      // (a width and a shape, or a row's height), never its content's, so what
      // changes inside it (a photograph landing and its shimmer leaving, a mark,
      // the desk row) re-lays that tile and nothing else. Without it every
      // image that landed mid-fling re-ran the album's flex layout over all its
      // tiles (measured: 2.5x the old columns' layout time on a throttled
      // phone's fling through the measured masonry).
      className={cn(
        "group relative overflow-hidden bg-black/10 contain-strict",
        layout === "uniform" && "w-full",
        layout === "masonry" &&
          "mb-[var(--gap-gallery)] w-full break-inside-avoid",
      )}
    >
      <button
        type="button"
        data-tile-open
        aria-label={
          selecting
            ? selected
              ? "Deselect"
              : "Select"
            : item.type === "photo"
              ? "View photo"
              : "Play video"
        }
        aria-pressed={selecting ? !!selected : undefined}
        // ★ `cn`, never a template: the dim used to be glued straight onto
        // `active:scale-[0.98]` with no space, one class nobody emits, so a
        // hidden photograph sat in the host album at full brightness.
        className={cn(
          "size-full cursor-pointer transition-[transform,opacity] duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset active:scale-[0.98]",
          dimmed && "opacity-30",
        )}
      >
        {item.url || item.previewUrl ? (
          <MediaTile item={item} playBadge="none" eager={eager} />
        ) : (
          // ★ A PHOTOGRAPH WHOSE LINK HAS NOT LANDED YET IS A LOADING TILE, NEVER A REQUEST. On the
          // paged album the grid lays every photograph out from the manifest, and a tile's link
          // arrives by id a beat after its row mounts; until then it is the shimmer MediaTile draws
          // before a decode (the same skeleton, so the sheet's in-view rule runs it), and never an
          // empty `src`, which a video would resolve against the page's own address.
          <span aria-hidden className="relative block size-full">
            <Skeleton className="absolute inset-0 size-full rounded-none" />
          </span>
        )}
      </button>

      {/* THE MARKS — state, never controls, and the whole of a phone tile. The
          fourth ("yours") is the one exception his own ruling asked for: a mark
          the guest album also makes tappable. Select mode wears its own marks
          instead, and keeps only the play mark. */}
      {item.type === "video" && <CornerPlayBadge />}
      {!selecting && !hideLikeMark && (
        <TileLikeMark item={item} count={item.likeCount} />
      )}
      {!selecting && mine && (
        <MineMark control={mine === "control"} selected={mineSelected} />
      )}

      {/* The desk's hover row, as one pane. A sibling of the open button, so a
          control's tap is its own and never opens the lightbox. */}
      {!selecting && actions && actions.length > 0 && (
        <TileActionBar actions={actions} itemId={item.id} />
      )}
      {selecting && <SelectMark selected={!!selected} />}

      {/* Per-tile chrome LAST so it paints over everything; its own buttons
          capture the tap (the lightbox never opens behind them). */}
      {overlay}
    </div>
  );
}

export const AlbumTile = memo(AlbumTileBody, sameTileProps);
