"use client";

import Image from "next/image";
import { Bell, Check, Copy, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { CellLabel } from "@/components/lab";

import { px } from "./candidates";

/**
 * THE ROUNDING BOARD'S ATOMS (round six, the catalog rebuild, 2026-09-16).
 *
 * Two rules decide this file, and both come from what the board judges:
 *
 * 1. A SPECIMEN IS AT TRUE SIZE OR IT IS NOT EVIDENCE. A corner is a fixed
 *    number of pixels, so anything that scales it (a Stage's `zoom`, a
 *    transform, a fitted canvas) renders a 16px corner at 11 and reads a third
 *    sharper than it is. Round one judged the whole kit that way. Nothing here
 *    is scaled: the strip is drawn at 375 in this document, and where the
 *    question is a whole page the board loads it into a viewport of its own
 *    (frames.tsx), which is 1:1 by construction.
 *
 * 2. THE SPECIMEN IS THE SHIPPED COMPONENT, NOT A RECTANGLE. Card, Button,
 *    Input and Badge are imported, so a family is judged on the corner the
 *    product actually draws. The two exceptions are the floating layers: a
 *    radix panel portals to document.body and leaves any wrapper, so the menu
 *    and the guest sheet are drawn static FROM THE PRIMITIVES' OWN CLASS
 *    STRINGS, copied below beside the file they came from. Check them against
 *    the source when either moves.
 *
 * ★ AND NOTHING IN THE STRIP CARRIES A BREAKPOINT PREFIX. A Tailwind prefix
 * inside a div reads the BROWSER's width rather than the box's, so a 375-wide
 * div with an `sm:` class in it is a lie about a phone. The strip is written
 * unprefixed for exactly that reason; the one prefix that does reach it is
 * Input's `md:text-sm`, which moves a font size and no corner.
 */

/** dropdown-menu.tsx, DropdownMenuContent + DropdownMenuItem. */
const MENU_PANEL =
  "rounded-float bg-popover p-1 text-popover-foreground shadow-float ring-1 ring-foreground/10";
const MENU_ROW =
  "flex items-center justify-between gap-1.5 rounded-md px-1.5 py-1 text-sm";

/** entry-shell.tsx, Drawer.Content: the guest entry sheet. ★ Its corner is
 *  the ACTION token times 1.4, not --radius-float, which is the finding the
 *  button ask is built on. Copied verbatim except for the fixed positioning. */
const ENTRY_SHEET =
  "flex flex-col rounded-t-[calc(var(--radius-action)*1.4)] bg-popover px-6 pt-3 pb-6 text-sm text-popover-foreground shadow-float ring-1 ring-foreground/10";

export const TILES = [
  "wedding-golden",
  "party-dj",
  "festival-lights",
  "concert-confetti",
  "wedding-toast",
  "reception-hall",
  "party-balloons",
  "festival-crowd",
];

/** A photograph at the tile radius, the shape every grid here is judging. */
export function Tile({
  id,
  className,
  sizes = "200px",
}: {
  id: string;
  className?: string;
  sizes?: string;
}) {
  const img = marketingImage(id);
  return (
    <div
      className={cn("relative overflow-hidden bg-muted", className)}
      style={{ borderRadius: "var(--radius-tile)" }}
    >
      <Image src={img.src} alt="" fill sizes={sizes} className="object-cover" />
    </div>
  );
}

/* ── The catalog card's strip ──────────────────────────────────────────── */

/**
 * ONE FAMILY'S FOUR CORNERS, AT TRUE SIZE, IN ONE PIECE OF PRODUCT.
 *
 * ★ FOUR SPECIMENS IN A ROW IS A SWATCH BOOK, AND A CORNER IS NOT A SWATCH.
 * What a reviewer has to judge is whether these four corners belong to each
 * other: the photographs above the card, the menu floating over it, the button
 * under it. So the card's preview is one composition carrying all four, at the
 * width a guest actually holds, rather than four labelled boxes.
 *
 * 375 exactly, with a 16px gutter each side, which is the phone canvas's own
 * measure. Nothing is scaled and nothing carries a breakpoint.
 */
export function FamilyStrip() {
  return (
    <div className="w-[375px] shrink-0 px-4 py-3.5">
      {/* The photographs, at the tile corner and the gallery gap. Three across
          and two deep, so a junction of four corners is inside the specimen:
          that junction is where the album's gap finding lives. */}
      <div className="grid grid-cols-3 gap-[var(--gap-gallery)]">
        {TILES.slice(0, 6).map((id) => (
          <Tile key={id} id={id} className="aspect-[4/3]" sizes="120px" />
        ))}
      </div>

      {/* The card, with the floating layer over it: the two corners that have
          to read as different things, touching. */}
      <div className="relative mt-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Summer wedding</CardTitle>
            <CardDescription>312 photos, 48 guests</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Input defaultValue="Ana and Theo" aria-label="Event name" />
            <div className="rounded-lg border bg-muted/40 px-2.5 py-1.5 text-[11px] text-muted-foreground">
              A plate inside the card
            </div>
          </CardContent>
        </Card>
        <div
          aria-hidden
          className={cn(MENU_PANEL, "absolute top-9 right-3 w-[9.5rem]")}
        >
          {["Rename", "Duplicate", "Share link"].map((row) => (
            <div
              key={row}
              className={cn(MENU_ROW, row === "Rename" && "bg-accent")}
            >
              {row}
              {row === "Share link" ? (
                <Copy className="size-3.5 text-muted-foreground" />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* The buttons, which are what every corner above is read against. */}
      <div className="mt-3 flex items-center gap-1.5">
        <Button>
          <Plus data-icon="inline-start" /> Add photos
        </Button>
        <Button variant="outline">Share</Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell />
        </Button>
        <Badge className="ml-auto">6 to review</Badge>
      </div>
    </div>
  );
}

/* ── The gap between photographs ───────────────────────────────────────── */

/**
 * THE ALBUM'S GAP, DRAWN RATHER THAN ARGUED.
 *
 * The same nine photographs twice at a phone's own column: once with the gap
 * following the corner, once with the literal 3px the guest album hard-codes
 * in three files. Above a corner of 3 the second grid opens a diamond where
 * four corners meet, on the one page every guest sees.
 */
export function GapPair({ tile, gap }: { tile: number; gap: number }) {
  const hole = tile > 3;
  return (
    <div className="flex flex-wrap gap-6">
      <GapGrid
        width={196}
        gap={gap}
        title="The gap follows the photograph"
        note={`${px(tile)} corner, ${px(gap)} gap. Flush.`}
      />
      <GapGrid
        width={196}
        gap={3}
        title="A fixed 3px gap, as it ships"
        note={
          hole
            ? `${px(tile)} corner in a 3px gap: a hole at every junction.`
            : `${px(tile)} corner in a 3px gap. Nothing to see at or below 3, which is why the bug is invisible today.`
        }
      />
    </div>
  );
}

function GapGrid({
  width,
  gap,
  title,
  note,
}: {
  width: number;
  gap: number;
  title: string;
  note: string;
}) {
  return (
    <figure className="m-0 flex flex-col gap-1.5">
      <figcaption className="text-[11px] font-medium">{title}</figcaption>
      <div
        className="grid grid-cols-3"
        style={{ width, gap: `${gap}px` }}
        // A near-white plate under the grid, because a corner hole is a hole
        // in the PHOTOGRAPHS and only shows against what is behind them.
      >
        {TILES.slice(0, 8)
          .concat(TILES[0])
          .map((id, i) => (
            <Tile
              key={`${id}-${i}`}
              id={id}
              className="aspect-square"
              sizes="70px"
            />
          ))}
      </div>
      <CellLabel className="max-w-[18rem]">{note}</CellLabel>
    </figure>
  );
}

/* ── The seven derived steps ───────────────────────────────────────────── */

/** The real component each derived step lands on, at whatever the step
 *  resolves to in this subtree. A rectangle would make every step look equally
 *  reasonable; the point is that a badge and a plan card are not the same
 *  argument. */
export function StepSpecimen({ step }: { step: string }) {
  if (step === "4xl") {
    return (
      <Badge>
        <Check data-icon="inline-start" /> Live
      </Badge>
    );
  }
  if (step === "lg") {
    return (
      <div className="relative w-full">
        <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-7" placeholder="Search" />
      </div>
    );
  }
  if (step === "md") {
    return (
      <div className="w-full bg-popover p-1 ring-1 ring-foreground/10">
        <div className={cn(MENU_ROW, "bg-accent")}>Rename</div>
      </div>
    );
  }
  if (step === "sm") {
    return (
      <div className="rounded-sm bg-foreground px-2 py-1 text-[11px] text-background">
        A tooltip
      </div>
    );
  }
  if (step === "xl") {
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl">
        <Image
          src={marketingImage("reception-hall").src}
          alt=""
          fill
          sizes="200px"
          className="object-cover"
        />
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-[11px] text-white">
          Summer wedding
        </span>
      </div>
    );
  }
  if (step === "2xl") {
    return (
      <div className="w-full rounded-2xl border bg-card p-3 ring-1 ring-foreground/5">
        <p className="text-xs font-medium">Pro</p>
        <p className="text-[11px] text-muted-foreground">50 GB, 5 events</p>
      </div>
    );
  }
  return (
    <div className="w-full rounded-3xl bg-muted/60 p-3 text-[11px] text-muted-foreground">
      One modal
    </div>
  );
}

/* ── The guest entry sheet ─────────────────────────────────────────────── */

/**
 * THE GUEST ENTRY SHEET, at the action token (round three's finding).
 *
 * ★ THIS IS NOT A BUTTON AND IT WEARS THE BUTTON'S TOKEN. entry-shell.tsx
 * draws the sheet every guest meets before they see a single photograph with
 * `rounded-t-[calc(var(--radius-action)*1.4)]`, so the button rung decides the
 * corner of the biggest floating surface on the site: 22.4px today, 11.2 under
 * quiet, and a half circle under the pill, where 1.4 x 999 clamps to half the
 * sheet's height. Drawn static from the class string above, because vaul
 * portals the real one out of any stage.
 */
export function EntrySheetSpecimen({ action }: { action: number }) {
  const corner = action > 100 ? null : action * 1.4;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-[230px] w-full overflow-hidden rounded-lg bg-muted/40 ring-1 ring-foreground/10">
        <div
          aria-hidden
          className="grid grid-cols-3 gap-[var(--gap-gallery)] p-1 opacity-60"
        >
          {TILES.slice(0, 3).map((id) => (
            <Tile key={id} id={id} className="aspect-square" sizes="70px" />
          ))}
        </div>
        <div className={cn(ENTRY_SHEET, "absolute inset-x-0 bottom-0")}>
          <span
            aria-hidden
            className="mx-auto mb-2 h-1 w-9 shrink-0 rounded-full bg-muted-foreground/30"
          />
          <p className="font-heading text-base leading-snug font-semibold">
            Welcome to Summer wedding
          </p>
          <p className="mt-1 text-muted-foreground">
            A shared gallery for the whole event.
          </p>
          <Button className="mt-3 w-full">Add your photos</Button>
        </div>
      </div>
      <CellLabel>
        {corner === null
          ? "A half circle: 1.4 x 999 clamps to half the sheet"
          : `${px(corner)} on the top corners, 1.4 x the button token`}
      </CellLabel>
    </div>
  );
}
