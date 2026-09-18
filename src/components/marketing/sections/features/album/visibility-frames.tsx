"use client";

import { Globe, KeyRound, Lock, MailCheck } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { VISIBILITY_HINTS } from "@/lib/events/visibility-labels";
import { marketingImage } from "@/lib/constants/marketing-media";
import { TEASER_LIMIT } from "@/lib/events/gallery-access";
import { cn } from "@/lib/utils";

/**
 * WHO CAN OPEN IT: four exposures of ONE album. A single plate on the album's
 * own 3px rebate (the press sheet's idiom: `bg-border` behind cells set at
 * `--gap-gallery`, so every division is a hairline), each cell the SAME
 * nine-tile album (nine = TEASER_LIMIT, product-true) with its state drawn
 * over it: Public bright; accounts required bright with the real "See all"
 * chip; Password ghosted under the gate card; Private ghosted under the lock,
 * with NO name and NO count (the real page is an early return). The plate is
 * a light table: pointing at one cell steps the others back.
 *
 * The three visibility hints are IMPORTED from the app's selector; the
 * fourth is authored to the same length band. A client component because the
 * hints live in a client module.
 */

const EVENT_NAME = "Maya & Jay's Wedding";
const TILES = [
  "wedding-golden",
  "reception-table",
  "party-balloons",
  "wedding-toast",
  "party-dj",
  "festival-crowd",
  "wedding-rings",
  "reception-hall",
  "wedding-arch",
];

function Album({ ghost }: { ghost?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-[var(--gap-gallery)] [grid-area:1/1]">
      {TILES.map((id) => (
        <span
          key={id}
          className={cn(
            "relative block aspect-square overflow-hidden rounded-tile",
            ghost && "border border-border/70 bg-muted/60",
          )}
        >
          {!ghost && (
            <Image
              src={marketingImage(id).src}
              alt=""
              fill
              sizes="90px"
              className="object-cover"
            />
          )}
        </span>
      ))}
    </div>
  );
}

function Cell({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof Globe;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div
      data-mkt-isolate-item
      className="flex flex-col gap-4 bg-card p-4 sm:p-5"
    >
      {/* One grid cell: the album and its overlay share [grid-area:1/1], so
          the state floats OVER the same nine tiles in every cell and the
          captions line up across the plate. */}
      <div aria-hidden className="relative grid">
        {children}
      </div>
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-1.5 font-heading text-subsection">
          <Icon className="size-4 text-muted-foreground" strokeWidth={1.5} />
          {title}
        </p>
        <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
          {hint}
        </p>
      </div>
    </div>
  );
}

/** A card floated over a ghosted album, centred. */
function Over({ children }: { children: ReactNode }) {
  return (
    <div className="z-10 flex items-center justify-center p-3 [grid-area:1/1]">
      {children}
    </div>
  );
}

export function VisibilityFrames() {
  return (
    <div
      data-mkt-isolate
      className="grid gap-[var(--gap-gallery)] overflow-hidden rounded-2xl border bg-border p-[var(--gap-gallery)] sm:grid-cols-2 lg:grid-cols-4"
    >
      <Cell icon={Globe} title="Public" hint={VISIBILITY_HINTS.open}>
        <Album />
      </Cell>

      <Cell
        icon={MailCheck}
        title="Accounts required"
        hint={`On by default. ${TEASER_LIMIT} show, the rest after an email code.`}
      >
        <Album />
        <Over>
          <span className="flex h-7 items-center rounded-md bg-primary px-3 text-[11px] font-medium text-primary-foreground shadow-layer">
            See all 214 photos
          </span>
        </Over>
      </Cell>

      <Cell icon={KeyRound} title="Password" hint={VISIBILITY_HINTS.password}>
        <Album ghost />
        <Over>
          <div className="w-full max-w-[10.5rem] rounded-xl border bg-card/95 p-3 text-center shadow-layer">
            <p className="flex items-center justify-center gap-1 text-[9px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              <Lock className="size-2.5" />
              Almost in
            </p>
            <p className="mt-1 font-heading text-xs text-balance">
              {EVENT_NAME} is private
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground tabular-nums">
              214 photos & videos inside
            </p>
            <div className="mt-2 flex h-6 items-center justify-center rounded-md bg-primary text-[10px] font-medium text-primary-foreground">
              Unlock
            </div>
          </div>
        </Over>
      </Cell>

      <Cell icon={Lock} title="Private" hint={VISIBILITY_HINTS.private}>
        <Album ghost />
        <Over>
          <div className="flex flex-col items-center gap-1.5 rounded-xl border bg-card/95 px-4 py-3 text-center shadow-layer">
            <span className="flex size-7 items-center justify-center rounded-full border text-muted-foreground">
              <Lock className="size-3.5" />
            </span>
            <p className="font-heading text-xs">This event is private</p>
          </div>
        </Over>
      </Cell>
    </div>
  );
}
