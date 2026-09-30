"use client";

import { Check, Download, Flag, Heart, Link2, Share2, X } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { EVENT, MORNING, ROLL, ROLL_STILLS } from "./fixtures";
import { FilmStill, LOOK_NAME, type LookId } from "./film";

/**
 * SAVING A DEVELOPED PHOTO, QUOTED: the shared viewer (the credit top left,
 * the close, the floating capsule at the foot: Like, Save, Share, Copy link
 * and, on someone else's photo, Report) and the album's Download album menu
 * (Yours, Everything, Photos, Videos), at 9:02 am the morning the roll
 * developed.
 *
 * ★ THE LOOK IS NEVER BAKED, SO SAVE HANDS OVER A FILE THAT IS EITHER THE
 * ORIGINAL OR A COPY MADE ON THE PHONE. The original is what R2 holds, served
 * byte for byte (Save's signed download, the zip Worker's stream); a copy
 * wearing the look is drawn on her device at the tap, as the clip is, and
 * never stored. Download all is the zip Worker's, which streams stored bytes
 * and draws nothing, so a zip that wears the look is one her phone builds.
 */

export type SaveId = "original" | "save" | "ask" | "always";

/** What a Save lands as, for each answer ("ask" draws her pick: the look). */
const SAVED: Record<SaveId, "look" | "original"> = {
  original: "original",
  save: "look",
  ask: "look",
  always: "look",
};

export function GuestViewer({
  save,
  look,
  wide = false,
}: {
  save: SaveId;
  look: LookId;
  /** At a desk: the photograph at the view's height, the capsule under it. */
  wide?: boolean;
}) {
  const still = ROLL_STILLS[0];
  const wears = SAVED[save] === "look";
  const where = wide ? "your Downloads" : "Photos";
  return (
    <div
      className="relative flex min-h-screen flex-col bg-black text-white"
      data-dm-viewer
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
          className={wide ? "h-[68vh] w-auto" : "w-full"}
          style={{ aspectRatio: `${still.width} / ${still.height}` }}
        />
      </div>
      {save === "ask" ? (
        <div
          className={cn(
            "surface-ink mb-3 rounded-2xl bg-popover p-1.5 text-popover-foreground shadow-layer",
            wide ? "mx-auto w-80" : "mx-4",
          )}
          data-dm-menu
        >
          <p className="px-3 pt-2 pb-1 text-xs text-muted-foreground">Save</p>
          <span
            className="flex items-center justify-between rounded-xl bg-accent px-3 py-2.5 text-sm font-medium"
            data-dm-say
          >
            {`With the look (${LOOK_NAME[look]})`}
            <Check className="size-4" aria-hidden />
          </span>
          <span className="flex items-center justify-between px-3 py-2.5 text-sm">
            The original, as it was taken
          </span>
        </div>
      ) : (
        <p className="px-6 pb-3 text-center text-sm text-white/75" data-dm-say>
          {save === "always"
            ? `Saved to ${where} in ${LOOK_NAME[look]}, as you see it. Download all wears it too.`
            : wears
              ? `Saved to ${where} in ${LOOK_NAME[look]}, as you see it. Download all keeps the originals.`
              : `Saved to ${where}: the original, as it was taken.`}
        </p>
      )}
      <div className="flex justify-center pb-8">
        <span
          className={cn(
            GLASS,
            "flex items-center gap-6 rounded-full px-6 py-3 text-white/85",
          )}
        >
          <Heart className="size-5" aria-hidden />
          <span
            className="flex items-center gap-1.5 text-sm font-medium text-white"
            data-dm-reach
          >
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

/** The saved file, as the phone's own Photos app would show it (drawn plain). */
export function SavedPhoto({ save, look }: { save: SaveId; look: LookId }) {
  const still = ROLL_STILLS[0];
  const wears = SAVED[save] === "look";
  return (
    <div
      className="flex min-h-screen flex-col bg-black text-white"
      data-dm-photos
    >
      <div className="flex h-14 shrink-0 items-center justify-between px-4 text-[17px]">
        <span className="text-[#0a84ff]">‹ Recents</span>
        <span className="text-center text-sm leading-tight">
          Today
          <span className="block text-xs text-white/60">9:03 am</span>
        </span>
        <span className="text-[#0a84ff]">Edit</span>
      </div>
      <div className="flex flex-1 items-center">
        <FilmStill
          still={still}
          look={wears ? look : "clean"}
          className="w-full"
          style={{ aspectRatio: `${still.width} / ${still.height}` }}
        />
      </div>
      <p
        className="px-6 pt-3 pb-10 text-center text-xs text-white/55"
        data-dm-say
      >
        {wears
          ? `In her Photos: a copy in ${LOOK_NAME[look]}, made on her phone. The album keeps the original.`
          : "In her Photos: the original. The look stays in the album."}
      </p>
    </div>
  );
}

/**
 * The album's Download album menu, as the morning's album offers it (Yours
 * first, for a guest who has added something; then Everything, Photos and
 * Videos): in a hand the choice rising to her thumb, at a desk the menu under
 * Download all.
 */
export function DownloadMenu({
  save,
  look,
  wide = false,
}: {
  save: SaveId;
  look: LookId;
  wide?: boolean;
}) {
  const wears = save === "always";
  const line = wears
    ? `In ${LOOK_NAME[look]}, made on this ${wide ? "computer" : "phone"} one photo at a time before it zips, so a big album takes a while.`
    : "The originals, as they were taken, without the look.";
  const rows = (
    <>
      {(
        [
          ["Yours", MORNING.hers],
          ["Everything", MORNING.shots],
          ["Photos", MORNING.shots - MORNING.videos],
          ["Videos", MORNING.videos],
        ] as const
      ).map(([label, count]) => (
        <span
          key={label}
          className="flex items-center justify-between rounded-xl px-3 py-3 text-sm"
        >
          {label}
          <span className="text-muted-foreground tabular-nums">{count}</span>
        </span>
      ))}
      <p
        className="px-3 pt-2 text-sm text-pretty text-muted-foreground"
        data-dm-say
      >
        {line}
      </p>
    </>
  );
  if (wide)
    return (
      <div
        className="surface-ink relative min-h-screen bg-background text-foreground"
        data-dm-download
      >
        <div className="mx-auto max-w-6xl px-8 pt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-heading text-page">{EVENT.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {`${MORNING.shots} shots from ${MORNING.guests} guests · Developed at ${ROLL.develops}`}
              </p>
            </div>
            <div className="relative">
              <span className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-sm font-medium">
                <Download className="size-4" aria-hidden /> Download all
              </span>
              <div className="absolute top-full right-0 z-10 mt-2 w-80 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-layer">
                <p className="px-3 pt-1.5 pb-1 text-xs text-muted-foreground">
                  Download album
                </p>
                {rows}
                <span className="block h-2" />
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-6 gap-[var(--gap-gallery)]">
            {ROLL_STILLS.slice(0, 12).map((s, i) => (
              <FilmStill
                key={`${s.id}-${i}`}
                still={s}
                look={look}
                stamp={false}
                className="aspect-square w-full"
              />
            ))}
          </div>
        </div>
      </div>
    );
  return (
    <div
      className="surface-ink relative min-h-screen bg-background text-foreground"
      data-dm-download
    >
      <div className="px-5 pt-8">
        <p className="font-heading text-page">{EVENT.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {`${MORNING.shots} shots from ${MORNING.guests} guests · Developed at ${ROLL.develops}`}
        </p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-[var(--gap-gallery)] px-3">
        {ROLL_STILLS.slice(0, 6).map((s) => (
          <FilmStill
            key={s.id}
            still={s}
            look={look}
            stamp={false}
            className="aspect-square w-full"
          />
        ))}
      </div>
      <div className="fixed inset-0 bg-black/50" aria-hidden />
      <div className="rounded-t-3xl fixed inset-x-0 bottom-0 border-t border-border bg-popover px-2 pt-3 pb-8 text-popover-foreground">
        <p className="px-3 pb-2 text-sm font-medium">Download album</p>
        {rows}
        <div className="px-3 pt-4">
          <Button
            type="button"
            variant="outline"
            size="cta"
            className="w-full"
            tabIndex={-1}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
