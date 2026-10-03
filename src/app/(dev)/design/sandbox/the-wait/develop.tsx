"use client";

import { type CSSProperties, useLayoutEffect, useMemo, useRef } from "react";
import { SkipForward } from "lucide-react";

// The wait's own sheet (its well, squares and words), as production draws it.
import "@/components/guest/gallery-empty-state.css";
import { Button } from "@/components/ui/button";
import { columnsFor } from "@/lib/disposable/contact-sheet";
import { WAIT_TITLE } from "@/lib/disposable/wait-words";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { ALBUM, EVENT, FIRST_OPEN_MS, ROLL } from "./fixtures";
import {
  albumWidth,
  pageSheet,
  planAlbum,
  planSheet,
  type SheetCell,
  type SheetPlan,
  type Tile,
  wideWell,
} from "./geometry";
import { SCREENS, type ScreenId } from "./knobs";
import { at, usePlay } from "./motion";
import {
  AlbumHead,
  CoverGround,
  GuestPage,
  OpenRows,
  Picture,
  TileBox,
} from "./album";

/**
 * THE DEVELOP, THREE WAYS: the album's first open after its develop time, from
 * the contact sheet as it stood all night to the album.
 *
 *  - `in-place`, it develops where it stood: the sheet over the album's rows
 *    develops square by square in the night's order (each flashes, then its
 *    photograph comes up from bright and pale), the cover comes up out of its
 *    house light, and the newest squares grow into the album's first rows while
 *    the older sink toward where they stand in it and the well dissolves;
 *  - `light`, out of the light: the squares turn to light in the night's order,
 *    the well fills with it, and the album rises out of it, the host's Look;
 *  - `darkroom`, the darkroom first: the whole roll's sheet fills the screen in
 *    the dark, develops, and closes onto the cover as the page comes up.
 *
 * ★ EVERYTHING IS ONE NIGHT (`fixtures.ts`'s `ROLL`): the sheet's squares are
 * production's `layoutSheet` over its count and minutes, the rows are its rows
 * engine, so the square a photograph grows out of and the tile it becomes are
 * the same photograph, and a square is measured where it is drawn.
 */

export type DevelopId = "in-place" | "light" | "darkroom";

/* ── the takes' timelines, ms from the take's first movement ──────────────── */

/** Where each moment of a take falls, full and reduced. */
/**
 * ★ THE SHEET FIRST, THEN THE PRINTS (a darkroom's own order: the contact sheet comes up, then the enlargements). Each
 * take develops the sheet before anything else moves, and the cover's photographs come up with the album, so a phone's
 * first screen, most of it cover, reads one story: her sheet developing under it, then the whole page arriving.
 */
const TIMES = {
  "in-place": {
    full: { wave: 150, spread: 950, word: 1250, cover: 1650, open: 1750 },
    reduced: { wave: 200, spread: 0, word: 700, cover: 1500, open: 1500 },
  },
  light: {
    full: { wave: 150, spread: 950, word: 1250, cover: 1600, open: 1600 },
    reduced: { wave: 200, spread: 0, word: 700, cover: 1100, open: 1100 },
  },
  darkroom: {
    full: { wave: 250, spread: 1300, word: 1600, cover: 2800, open: 2200 },
    reduced: { wave: 200, spread: 0, word: 700, cover: 1800, open: 1800 },
  },
} as const;

/** How long each take runs, from its first movement to its last (the cover's coming up is the longest part). */
export const DEVELOP_MS: Record<DevelopId, { full: number; reduced: number }> =
  {
    "in-place": { full: 2950, reduced: 2800 },
    light: { full: 2900, reduced: 2400 },
    darkroom: { full: 4100, reduced: 3100 },
  };

/** The moment each take is held at for its still: where the sheet turns into the album. */
export const TURN_MS: Record<DevelopId, number> = {
  "in-place": 2100,
  light: 2000,
  darkroom: 1150,
};

/** A square's moment in the wave: the night's order, a touch uneven, as a tray develops. */
function waveAt(i: number, n: number, from: number, spread: number): number {
  if (spread === 0 || n <= 1) return from;
  const jitter = (((i * 2654435761) >>> 0) % 70) - 35;
  return Math.max(from, from + (i / (n - 1)) * spread + jitter);
}

/* ── the sheet, as production draws it, with the develop's layers ─────────── */

/** "Yours" under the sheet, as the guest's own sheet says it (a count here: every press is inert). */
function Yours({ n }: { n: number }) {
  return (
    <span data-wait-yours="" className="wait-muted flex items-center gap-1.5">
      <span className="wait-key" aria-hidden />
      {`Yours · ${formatCount(n)}`}
    </span>
  );
}

/** The count's word, turning from "Developing" to the take's own once the roll has developed. */
function Word({ to, at: when }: { to: string; at: number }) {
  const { reduced } = usePlay();
  return (
    <span className="grid" data-tw-word={to}>
      <span className="tw-a tw-fade-out [grid-area:1/1]" style={at(when)}>
        {WAIT_TITLE}
      </span>
      <span
        className={cn(
          "tw-a [grid-area:1/1]",
          reduced ? "tw-fade-in" : "tw-rise-in",
        )}
        style={at(when + 60)}
      >
        {to}
      </span>
    </span>
  );
}

type CellMode =
  /** Its photograph develops (the in-place take and the darkroom). */
  | "develop"
  /** It turns to light and stays lit (the light take). */
  | "light";

/**
 * ONE SQUARE: production's `.wait-cell`, hers lit with her own photograph and
 * rimmed, everyone's dark until the wave reaches it. `slot` keeps a square's
 * place for the tile that grows out of it (drawn in the album, over it).
 */
function Cell({
  cell,
  waveMs,
  mode,
  slot,
  leave,
}: {
  cell: SheetCell;
  waveMs: number;
  mode: CellMode;
  slot: boolean;
  /** When it sinks away, or null for a square that leaves with its whole sheet. */
  leave: number | null;
}) {
  const { reduced } = usePlay();
  const hers = cell.kind === "hers";
  const leaving =
    leave === null
      ? undefined
      : { className: "tw-a tw-sink", style: at(leave) };
  if (slot)
    return (
      <span
        className="wait-cell"
        data-tw-slot={cell.photo.id}
        style={{ visibility: "hidden" }}
      />
    );
  return (
    <span
      className={cn("wait-cell", leaving?.className)}
      style={leaving?.style}
      data-tw-sq={cell.photo.id}
      data-hers={hers ? "" : undefined}
      data-tw-wave={Math.round(waveMs)}
    >
      {hers ? (
        <Picture photo={cell.photo} />
      ) : mode === "develop" ? (
        <Picture
          photo={cell.photo}
          className={cn("tw-a", reduced ? "tw-fade-in" : "tw-sq-develop")}
          style={at(waveMs)}
        />
      ) : null}
      {!hers && (
        <span
          aria-hidden
          className={cn(
            "tw-flash",
            mode === "light" ? "tw-a tw-lit" : !reduced && "tw-a",
          )}
          style={at(waveMs)}
        />
      )}
    </span>
  );
}

/**
 * THE SHEET'S SQUARES (`.wait-sheet`, production's columns), the "+N" of the
 * folded at its head where it is capped.
 */
function Squares({
  plan,
  mode,
  times,
  slots,
  sinkFrom,
}: {
  plan: SheetPlan;
  mode: CellMode;
  times: { wave: number; spread: number };
  /** The squares whose tiles grow out of them. */
  slots: ReadonlySet<string>;
  /** When the older squares begin to sink, or null where the sheet leaves whole. */
  sinkFrom: number | null;
}) {
  const n = plan.cells.length;
  const columns = plan.columns;
  return (
    <div
      aria-hidden
      className="wait-sheet"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      data-wait-sheet={n}
      data-tw-folded={plan.folded}
    >
      {plan.folded > 0 && (
        <span
          data-wait-folded={plan.folded}
          className={cn(
            "wait-muted flex items-center justify-center rounded-[3px] text-[10px] font-medium tabular-nums",
            sinkFrom !== null && "tw-a tw-sink",
          )}
          style={{
            gridColumn: "span 3",
            background:
              "color-mix(in oklab, var(--gallery-foreground) 6%, var(--gallery))",
            ...(sinkFrom !== null ? at(sinkFrom) : null),
          }}
        >
          {`+${formatCount(plan.folded)}`}
        </span>
      )}
      {plan.cells.map((cell, i) => {
        const row = Math.floor((i + (plan.folded > 0 ? 3 : 0)) / columns);
        return (
          <Cell
            key={cell.key}
            cell={cell}
            mode={mode}
            waveMs={waveAt(i, n, times.wave, times.spread)}
            slot={slots.has(cell.photo.id)}
            leave={sinkFrom === null ? null : sinkFrom + row * 24}
          />
        );
      })}
    </div>
  );
}

/**
 * THE CONTACT SHEET OVER THE ALBUM, AS IT STOOD ALL NIGHT (production's
 * `ContactSheet`, its markup line for line: the count and its word, the
 * squares, Yours and the clock; side by side from a well of 1024), its ground
 * drawn as a layer of its own so the develop can let it go while the squares
 * stay.
 */
function PageSheet({
  plan,
  wide,
  mode,
  times,
  word,
  slots,
  sinkFrom,
  groundOut,
  wordsOut,
  children,
}: {
  plan: SheetPlan;
  wide: boolean;
  mode: CellMode;
  times: { wave: number; spread: number };
  word: { to: string; at: number };
  slots: ReadonlySet<string>;
  sinkFrom: number | null;
  /** When the well's ground goes, or null where it leaves with the sheet. */
  groundOut: number | null;
  /** When its words go, or null. */
  wordsOut: number | null;
  /** Over the squares, inside the well (the light take's wash). */
  children?: React.ReactNode;
}) {
  const clock = "All at once at 9 am";
  const wordsLeave =
    wordsOut === null
      ? undefined
      : { className: "tw-a tw-fade-out", style: at(wordsOut) };
  const count = (
    <div
      aria-hidden
      className={wordsLeave?.className}
      style={wordsLeave?.style}
    >
      <p
        data-wait-count={plan.count}
        className="font-heading leading-none tabular-nums"
        style={{ fontSize: wide ? 64 : 44 }}
      >
        {formatCount(plan.count)}
      </p>
      <p className="wait-muted mt-2 text-sm" data-wait-title="">
        <Word to={word.to} at={word.at} />
      </p>
    </div>
  );
  const foot = (
    <>
      <Yours n={plan.hers} />
      <p className="wait-muted" data-wait-clock="">
        {clock}
      </p>
    </>
  );
  const squares = (
    <Squares
      plan={plan}
      mode={mode}
      times={times}
      slots={slots}
      sinkFrom={sinkFrom}
    />
  );
  return (
    <div className="relative" data-tw-well="" data-contact-sheet={plan.count}>
      {/* The well's ground (`.wait-well`: the media surface, its rim and the house's lamp over it), on its own. */}
      <div
        className={cn(
          "absolute inset-0",
          groundOut !== null && "tw-a tw-fade-out",
        )}
        style={groundOut !== null ? at(groundOut) : undefined}
      >
        <div className="wait-well size-full" />
      </div>
      <div
        className={cn(
          "relative text-[var(--gallery-foreground)]",
          wide ? "flex items-stretch gap-10 p-8" : "p-4",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 justify-between",
            wide ? "w-56 flex-col" : "items-end",
          )}
        >
          {count}
          {wide && (
            <div
              className={cn("space-y-2 text-xs", wordsLeave?.className)}
              style={wordsLeave?.style}
            >
              {foot}
            </div>
          )}
        </div>
        <div className={cn(wide ? "min-w-0 flex-1 self-center" : "mt-4")}>
          {squares}
          {!wide && (
            <div
              className={cn(
                "mt-3 flex items-center justify-between gap-3 text-xs",
                wordsLeave?.className,
              )}
              style={wordsLeave?.style}
            >
              {foot}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── in place, and out of the light ───────────────────────────────────────── */

/** The cover's height (`--cover-h` at both screens) and the album box's top under it (`mt-5`). */
const COVER_PX = 544;
const BOX_TOP = COVER_PX + 20;
/** The album's section sits 12px into its box (`mt-3`), its head row 44px tall with its margin. */
const SECTION_TOP = 12;
const HEAD_PX = 44;

/**
 * THE SHEET AND THE ALBUM IN ONE BOX: the sheet where it stood, the album's
 * head and rows where they will stand, the tiles of the first screen growing
 * out of the squares they were (`in-place`) or rising out of the light
 * (`light`).
 */
function InPlaceStage({
  take,
  screen,
}: {
  take: "in-place" | "light";
  screen: ScreenId;
}) {
  const { reduced } = usePlay();
  const frame = SCREENS[screen];
  const box = albumWidth(frame.w);
  const wide = wideWell(box);
  const sheet = useMemo(() => pageSheet(ROLL, box), [box]);
  const album = useMemo(
    () => planAlbum(ALBUM, box, frame.h * 1.4),
    [box, frame.h],
  );
  const t = TIMES[take][reduced ? "reduced" : "full"];

  // The first screen's tiles: what a guest sees of the album as it lands.
  const firstScreen = useMemo(
    () =>
      album.tiles.filter(
        (tile) => BOX_TOP + SECTION_TOP + HEAD_PX + tile.y < frame.h,
      ),
    [album, frame.h],
  );
  const grows = take === "in-place" && !reduced;
  const slots = useMemo(
    () => new Set(grows ? firstScreen.map((tile) => tile.photo.id) : []),
    [grows, firstScreen],
  );

  const stage = useRef<HTMLDivElement | null>(null);
  const rows = useRef<HTMLDivElement | null>(null);
  // ★ EVERY GROWING TILE STARTS ON ITS SQUARE, MEASURED WHERE THE SQUARE IS DRAWN (never predicted): set before the
  // first paint, so its first frame is the square.
  useLayoutEffect(() => {
    const root = stage.current;
    const box = rows.current;
    if (!root || !box || slots.size === 0) return;
    const place = () => {
      const origin = box.getBoundingClientRect();
      for (const id of slots) {
        const slot = root.querySelector<HTMLElement>(`[data-tw-slot="${id}"]`);
        const tile = root.querySelector<HTMLElement>(`[data-tw-grow="${id}"]`);
        if (!slot || !tile) continue;
        const r = slot.getBoundingClientRect();
        tile.style.setProperty("--tw-fx", `${r.left - origin.left}px`);
        tile.style.setProperty("--tw-fy", `${r.top - origin.top}px`);
        tile.style.setProperty("--tw-fw", `${r.width}px`);
        tile.style.setProperty("--tw-fh", `${r.height}px`);
      }
    };
    place();
    const win = root.ownerDocument.defaultView;
    const ro = win ? new win.ResizeObserver(place) : null;
    ro?.observe(root);
    return () => ro?.disconnect();
  }, [slots]);

  const growAt = (k: number) => t.open + 40 + k * 60;
  const slotWave = new Map(
    sheet.cells.map((c, i) => [
      c.photo.id,
      {
        wave: waveAt(i, sheet.cells.length, t.wave, t.spread),
        hers: c.kind === "hers",
      },
    ]),
  );
  const albumAt = (
    tile: Tile,
    k: number,
  ): { className?: string; style?: CSSProperties } => {
    if (reduced) return {};
    if (take === "light")
      return { className: "tw-a tw-from-light", style: at(t.open + k * 60) };
    if (slots.has(tile.photo.id)) return {};
    return {
      className: "tw-a tw-tile-in",
      style: at(t.open + 480 + Math.min(k * 45, 540)),
    };
  };

  return (
    <div
      ref={stage}
      className="relative"
      data-tw-stage={take}
      style={{ height: SECTION_TOP + HEAD_PX + album.height }}
    >
      {/* The sheet, where it stood all night. */}
      <div
        className={cn(
          "absolute inset-x-0 top-0",
          (reduced || take === "light") && "tw-a",
          reduced ? "tw-fade-out" : take === "light" && "tw-fade-out-slow",
        )}
        style={
          reduced ? at(t.open) : take === "light" ? at(t.open + 300) : undefined
        }
        data-tw-sheet=""
      >
        <PageSheet
          plan={sheet}
          wide={wide}
          mode={take === "light" ? "light" : "develop"}
          times={t}
          word={{ to: "Developed", at: t.word }}
          slots={slots}
          sinkFrom={grows ? t.open : null}
          groundOut={grows ? t.open + 60 : null}
          wordsOut={grows ? t.open : null}
        >
          {take === "light" && (
            <span
              aria-hidden
              className="tw-wash tw-a"
              style={at(reduced ? 600 : t.open - 500)}
            />
          )}
        </PageSheet>
      </div>

      {/* The album, where it will stand. */}
      <div
        className={cn("absolute inset-x-0", reduced && "tw-a tw-fade-in")}
        style={{ top: SECTION_TOP, ...(reduced ? at(t.open) : null) }}
        data-tw-album=""
      >
        <AlbumHead
          className={cn(
            !reduced && "tw-a",
            !reduced && (take === "light" ? "tw-from-light" : "tw-rise-in"),
          )}
          style={
            reduced ? undefined : at(take === "light" ? t.open : t.open + 380)
          }
        />
        <div
          ref={rows}
          className="relative"
          style={{ height: album.height }}
          data-tw-rows=""
        >
          {album.tiles.map((tile, k) => {
            if (slots.has(tile.photo.id)) {
              const sq = slotWave.get(tile.photo.id);
              const order = firstScreen.indexOf(tile);
              return (
                <TileBox
                  key={tile.photo.id}
                  tile={tile}
                  bare
                  className="tw-a tw-grow tw-as-cell z-10"
                  style={at(growAt(order))}
                  data-tw-grow={tile.photo.id}
                  data-hers={sq?.hers ? "" : undefined}
                >
                  {/* While it is a square it develops with the rest of the sheet; hers stands lit and rimmed. */}
                  {sq?.hers ? (
                    <>
                      <Picture photo={tile.photo} />
                      <span
                        aria-hidden
                        className="tw-rim tw-a"
                        style={at(growAt(order))}
                      />
                    </>
                  ) : (
                    <>
                      <Picture
                        photo={tile.photo}
                        className="tw-a tw-sq-develop"
                        style={at(sq?.wave ?? 0)}
                      />
                      <span
                        aria-hidden
                        className="tw-a tw-flash"
                        style={at(sq?.wave ?? 0)}
                      />
                    </>
                  )}
                </TileBox>
              );
            }
            const shown = albumAt(tile, k);
            return (
              <TileBox
                key={tile.photo.id}
                tile={tile}
                className={shown.className}
                style={shown.style}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── the darkroom ─────────────────────────────────────────────────────────── */

/**
 * THE DARKROOM, OVER THE PAGE: the whole roll's sheet with the screen to itself
 * (every square, nothing folded), the count over it and Yours under it, a Skip
 * at the foot. It develops in the night's order, then its walls close onto the
 * cover and its sheet fits there, and it goes as the cover's photographs come
 * up under it.
 */
function Darkroom({ screen }: { screen: ScreenId }) {
  const { reduced } = usePlay();
  const frame = SCREENS[screen];
  const wide = frame.w >= 1024;
  const content = Math.min(frame.w - 40, 980);
  const sheet = useMemo(
    () => planSheet(ROLL, columnsFor(content), null),
    [content],
  );
  const t = TIMES.darkroom[reduced ? "reduced" : "full"];
  const group = useRef<HTMLDivElement | null>(null);

  // The sheet's fit on the cover: its middle onto the cover's, and no taller than the cover under the header.
  useLayoutEffect(() => {
    const el = group.current;
    if (!el) return;
    // Its top is the screen's middle and it is lifted by half its height (`-translate-y-1/2`), so its middle is its top.
    const r = { middle: el.offsetTop, h: el.offsetHeight };
    const room = COVER_PX - 56 - 40;
    const k = Math.min(1, room / r.h);
    const y = (56 + COVER_PX) / 2 - r.middle;
    el.style.setProperty("--tw-fit-k", `${k}`);
    el.style.setProperty("--tw-fit-y", `${y}px`);
  }, [content]);

  return (
    <div className="fixed inset-0 z-40" data-tw-darkroom="">
      <div
        className={cn("absolute inset-0", !reduced && "tw-a tw-shrink")}
        style={reduced ? undefined : at(t.open)}
      >
        {/* Its dark goes last, after its sheet, so the cover's photograph comes up under the dark, never under the
            squares. */}
        <div
          className="tw-a tw-fade-out-slow absolute inset-0 overflow-hidden bg-[var(--gallery)]"
          style={at(reduced ? t.open : t.open + 800)}
        >
          {/* The darkroom's light: the house's coral from above, the lamp the well always had, larger. */}
          <div
            aria-hidden
            className="absolute inset-x-[-20%] top-[-45%] h-[90%]"
            style={{
              background:
                "radial-gradient(closest-side, oklch(0.72 0.12 25 / 0.2), oklch(0.72 0.12 25 / 0.05) 60%, transparent)",
            }}
          />
        </div>
        <div
          className="tw-a tw-fade-out absolute inset-0"
          style={at(reduced ? t.open : t.open + 600)}
        >
          <div
            ref={group}
            className={cn(
              "absolute inset-x-0 top-1/2 mx-auto flex -translate-y-1/2 flex-col text-[var(--gallery-foreground)]",
              !reduced && "tw-a tw-fit",
            )}
            style={{ width: content, ...(reduced ? null : at(t.open)) }}
            data-tw-group=""
          >
            <p className="wait-muted text-label font-medium uppercase">
              {EVENT.name}
            </p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p
                  data-wait-count={sheet.count}
                  className="font-heading leading-none tabular-nums"
                  style={{ fontSize: wide ? 64 : 52 }}
                >
                  {formatCount(sheet.count)}
                </p>
                <p className="wait-muted mt-2 text-sm" data-wait-title="">
                  <Word to="Developed at 9 am" at={t.word} />
                </p>
              </div>
              <Yours n={sheet.hers} />
            </div>
            <div className="mt-4">
              <Squares
                plan={sheet}
                mode="develop"
                times={t}
                slots={new Set()}
                sinkFrom={null}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="tw-a tw-fade-out tw-skip-row" style={at(t.open)}>
        <Button
          type="button"
          variant="glass"
          size="cta"
          tabIndex={-1}
          data-tw-skip=""
        >
          The album <SkipForward />
        </Button>
      </div>
    </div>
  );
}

/* ── the frame ───────────────────────────────────────────────────────────── */

/**
 * HER FIRST OPEN AFTER THE DEVELOP, ONE TAKE: production's page, the cover on
 * the house light it stood on all night, and the take drawn in.
 */
export function DevelopFrame({
  take,
  screen,
}: {
  take: DevelopId;
  screen: ScreenId;
}) {
  const { reduced } = usePlay();
  const t = TIMES[take][reduced ? "reduced" : "full"];
  if (take === "darkroom") {
    const frame = SCREENS[screen];
    const box = albumWidth(frame.w);
    const album = planAlbum(ALBUM, box, frame.h * 1.4);
    return (
      <GuestPage
        nowMs={FIRST_OPEN_MS}
        ground={<CoverGround developAt={t.cover} />}
        above={<Darkroom screen={screen} />}
      >
        <section className="mt-3">
          <AlbumHead />
          <OpenRows
            tiles={album.tiles}
            height={album.height}
            from={t.open + 200}
          />
        </section>
      </GuestPage>
    );
  }
  return (
    <GuestPage
      nowMs={FIRST_OPEN_MS}
      ground={<CoverGround developAt={t.cover} />}
    >
      <InPlaceStage take={take} screen={screen} />
    </GuestPage>
  );
}
