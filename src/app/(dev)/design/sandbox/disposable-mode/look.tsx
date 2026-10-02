"use client";

import { Download, Flag, Heart, Link2, Share2, X } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { EVENT, type LitStill, MORNING, ROLL } from "./fixtures";
import { FilmStill, LOOK_NAME, type LookId } from "./film";

/**
 * THE DEVELOPED ROLL, WEARING A LOOK OR NONE: what the look decision is
 * judged on (his r2 note: "feels like filters are going to make the majority
 * of guest photos worse that don't match the palette well").
 *
 * ★ REAL PHOTOGRAPHS IN TWELVE LIGHTS, NEVER A FLATTERING PICK. The set is
 * the party photographs the boards reuse, each named by its light (string
 * lights, a club, daylight indoors, an overcast sky), so a look is seen where
 * it suits and where it does not; the dock's Try your photos swaps in the
 * reader's own.
 *
 * ★ THE ALBUM AS PRODUCTION LAYS IT: justified rows, each photograph whole at
 * its own shape (the guest album's `layout="rows"`), edge to edge with the
 * gallery's gap, under the album's head. The viewer is the shared viewer,
 * quoted: the credit, the close, the capsule at the foot.
 */

/** The gallery's gap (`--gap-gallery`, its floor). */
const GAP = 3;

/**
 * JUSTIFIED ROWS, the guest album's own layout: photographs join a row at a
 * target height until it would overflow, then the row scales to fill the
 * width exactly, so each photograph is whole and every row ends flush.
 */
function rowsOf(set: readonly LitStill[], width: number, target: number) {
  const rows: { items: LitStill[]; h: number }[] = [];
  let row: LitStill[] = [];
  let sum = 0;
  for (const s of set) {
    row.push(s);
    sum += s.width / s.height;
    const w = sum * target + GAP * (row.length - 1);
    if (w >= width) {
      rows.push({ items: row, h: (width - GAP * (row.length - 1)) / sum });
      row = [];
      sum = 0;
    }
  }
  if (row.length) rows.push({ items: row, h: target });
  return rows;
}

export function LookAlbum({
  set,
  look,
  wide,
  own = false,
}: {
  set: readonly LitStill[];
  look: LookId;
  wide: boolean;
  /** The reader's own photographs (Try your photos), said as theirs. */
  own?: boolean;
}) {
  const width = wide ? 1440 - 64 : 375;
  const rows = rowsOf(set, width, wide ? 300 : 150);
  return (
    <div
      className="surface-ink min-h-screen bg-background text-foreground"
      data-dm-album={look}
      data-dm-rows={rows.length}
    >
      <div className={cn(wide ? "px-8 pt-10 pb-6" : "px-5 pt-7 pb-5")}>
        <p
          className={cn(
            "font-heading",
            wide ? "text-page" : "text-[28px] leading-tight",
          )}
        >
          {EVENT.name}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {own
            ? `Your ${set.length} photos, as the developed album would show them`
            : `${MORNING.shots} photos & videos from ${MORNING.guests} guests · developed at ${ROLL.develops}`}
        </p>
      </div>
      <div className={cn("flex flex-col", wide && "px-8")} style={{ gap: GAP }}>
        {rows.map((r, i) => (
          <div key={i} className="flex" style={{ gap: GAP, height: r.h }}>
            {r.items.map((s) => (
              <FilmStill
                key={s.id}
                still={s}
                look={look}
                className="h-full shrink-0 overflow-hidden rounded-[var(--radius-tile,3px)]"
                style={{ width: (s.width / s.height) * r.h }}
                alt={s.light}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ONE PHOTOGRAPH, UP CLOSE: the shared viewer, quoted. In a hand the photo at
 * the phone's width; at a desk at the view's height, the capsule under it.
 */
export function LookViewer({
  still,
  look,
  wide,
}: {
  still: LitStill;
  look: LookId;
  wide: boolean;
}) {
  return (
    <div
      className="relative flex min-h-screen flex-col bg-black text-white"
      data-dm-viewer={look}
    >
      <div className="flex h-14 shrink-0 items-center justify-between px-3">
        <span className="flex items-center gap-2">
          <Avatar size="sm" seed="dm-theo">
            <AvatarFallback className="text-[10px]">T</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">Theo</span>
        </span>
        <span className="flex size-9 items-center justify-center rounded-full bg-white/10">
          <X className="size-5" aria-hidden />
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <FilmStill
          still={still}
          look={look}
          alt={still.light}
          className={wide ? "h-[74vh] w-auto" : "w-full"}
          style={{ aspectRatio: `${still.width} / ${still.height}` }}
        />
      </div>
      <p className="px-6 pb-3 text-center text-xs text-white/60" data-dm-light>
        {look === "clean"
          ? `${still.light}, as the phone took it`
          : `${still.light}, wearing ${LOOK_NAME[look]}`}
      </p>
      <div className="flex justify-center pb-8">
        <span
          className={cn(
            GLASS,
            "flex items-center gap-6 rounded-full px-6 py-3 text-white/85",
          )}
        >
          <Heart className="size-5" aria-hidden />
          <span className="flex items-center gap-1.5 text-sm font-medium text-white">
            <Download className="size-5" aria-hidden /> Save
          </span>
          <Share2 className="size-5" aria-hidden />
          <Link2 className="size-5" aria-hidden />
          <Flag className="size-5" aria-hidden />
        </span>
      </div>
    </div>
  );
}
