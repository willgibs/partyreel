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

import { px } from "./candidates";

/**
 * THE ROUNDING BOARD'S ATOMS (round two, 2026-09-14).
 *
 * Two rules decide this file, and both come from what the board judges:
 *
 * 1. A SPECIMEN IS AT TRUE SIZE OR IT IS NOT EVIDENCE. The shell's Stage fits
 *    a 1440 canvas into the lab's 992px column with `zoom`, which scales
 *    LAYOUT and PAINT together: a 16px corner renders at 11 physical pixels
 *    and every candidate reads a third sharper than it is. Round one judged
 *    the whole kit that way. So the comparison parts render at 1:1 in the lab
 *    page (widened by .rnd-wide, board.css) and the Stage is kept for part B,
 *    where the question is the real layout and the distortion is stated.
 *
 * 2. THE SPECIMEN IS THE SHIPPED COMPONENT, NOT A RECTANGLE. Card, Button,
 *    Input and Badge are imported, so a candidate is judged on the corner the
 *    product actually draws. The two exceptions are the floating layers: a
 *    radix panel portals to document.body and leaves any wrapper, so the menu
 *    and the dialog are drawn static FROM THE PRIMITIVES' OWN CLASS STRINGS,
 *    copied below beside the file they came from. Check them against the
 *    source when either moves.
 */

/** dropdown-menu.tsx, DropdownMenuContent + DropdownMenuItem. */
const MENU_PANEL =
  "min-w-44 rounded-float bg-popover p-1 text-popover-foreground shadow-float ring-1 ring-foreground/10";
const MENU_ROW =
  "flex items-center justify-between gap-1.5 rounded-md px-1.5 py-1 text-sm";

/** dialog.tsx, DialogContent + DialogFooter (the centred variant). */
const DIALOG_PANEL =
  "grid w-full gap-4 rounded-float bg-popover p-4 text-sm text-popover-foreground shadow-float ring-1 ring-foreground/10";
const DIALOG_FOOTER =
  "-mx-4 -mb-4 flex items-center justify-end gap-2 rounded-b-float border-t bg-muted/50 p-4";

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

/** A section of the board: the heading, the case, the specimens. The id is the
 *  anchor, because a ruling conversation wants to point at one part. */
export function Part({
  n,
  title,
  lede,
  children,
}: {
  n: string;
  title: string;
  lede: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={`rnd-${n.toLowerCase()}`}
      className="flex scroll-mt-6 flex-col gap-4"
    >
      <div className="max-w-2xl">
        <h2 className="text-sm font-semibold tracking-tight">
          <span className="mr-2 text-muted-foreground tabular-nums">{n}</span>
          {title}
        </h2>
        <div className="mt-1.5 space-y-2 text-xs leading-relaxed text-muted-foreground">
          {lede}
        </div>
      </div>
      {children}
    </section>
  );
}

/** What a part lands on, stated on the board rather than in a doc. */
export function Proposal({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-2xl border-l-2 border-foreground/25 pl-3 text-xs leading-relaxed text-foreground">
      {children}
    </p>
  );
}

/** The per-cell label: the body face with tabular figures, one step under the
 *  lab's caption. Never a mono face (there is no mono in the product). */
export function CellLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[11px] leading-snug text-muted-foreground tabular-nums",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** A photograph at the tile radius, the shape the tile row is judging. */
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

/* ── The matrix rows ───────────────────────────────────────────────────── */

/** --radius: the sharp family, on the components that carry it. Card is
 *  rounded-xl (1.4x), Input and the plate are rounded-lg (1x). */
export function SurfaceSpecimen({ radius }: { radius: number | null }) {
  return (
    <div className="flex flex-col gap-2.5">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Summer wedding</CardTitle>
          <CardDescription>312 photos, 48 guests</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Input placeholder="Event name" defaultValue="Ana and Theo" />
          <div className="rounded-lg border bg-muted/40 px-2.5 py-1.5 text-[11px] text-muted-foreground">
            A plate at 1x
          </div>
        </CardContent>
      </Card>
      <CellLabel>
        {radius === null ? "live" : px(radius)} base, card at 1.4x
        {radius === null ? "" : ` = ${px(radius * 1.4)}`}
      </CellLabel>
    </div>
  );
}

/** --radius-float: the panel and the row inside it. The nesting arithmetic is
 *  printed because it is the floating-surfaces board's finding and this board
 *  sets the number it turns on. */
export function FloatSpecimen({ float }: { float: number | null }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className={MENU_PANEL}>
        {["Rename", "Duplicate", "Share link"].map((row) => (
          <div
            key={row}
            className={cn(MENU_ROW, row === "Rename" && "bg-accent")}
          >
            {row}
            {row === "Share link" && (
              <Copy className="size-3.5 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
      <CellLabel>
        {float === null ? "live" : px(float)} panel, 4px padding
        {float === null ? "" : `, so a row nests at ${px(Math.max(0, float - 4))}`}
      </CellLabel>
    </div>
  );
}

/** --radius-tile and --gap-gallery together: the corner and the hole between
 *  four corners are one decision, which is why the gap is pinned to it. */
export function TileSpecimen({
  tile,
  gap,
}: {
  tile: number | null;
  gap: number | null;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-3 gap-[var(--gap-gallery)]">
        {TILES.slice(0, 6).map((id) => (
          <Tile key={id} id={id} className="aspect-square" sizes="90px" />
        ))}
      </div>
      <CellLabel>
        {tile === null ? "live" : px(tile)} tile, {gap === null ? "live" : px(gap)}{" "}
        gap
      </CellLabel>
    </div>
  );
}

/** The actions, as the product ships them: the default Button is h-8 on
 *  --radius-action-sm, and every marketing CTA is size="lg" forced to h-11,
 *  so it takes 0.9 x --radius-action at a height the ladder never planned
 *  for. Both are here because the ruling has to cover both. */
export function ActionSpecimen({
  action,
  sm,
}: {
  action: number | null;
  sm: number | null;
}) {
  const pill = action !== null && action > 100;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button>
          <Plus data-icon="inline-start" /> Add photos
        </Button>
        <Button variant="outline">Share</Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell />
        </Button>
      </div>
      <button
        type="button"
        className="inline-flex h-11 items-center justify-center rounded-[calc(var(--radius-action)*0.9)] bg-primary px-6 text-base font-medium text-primary-foreground"
      >
        Create an event
      </button>
      <CellLabel>
        {sm === null ? "live" : px(sm)} on h-8;{" "}
        {action === null
          ? "live"
          : pill
            ? "a pill on h-11"
            : `${px(action * 0.9)} on the h-11 CTA`}
      </CellLabel>
    </div>
  );
}

/* ── Part C: the nested corner ─────────────────────────────────────────── */

/**
 * BIBLE 9 AS A SPECIMEN. Three pairs, each the same shape drawn twice: once
 * with the rule and once the way it is drawn when nobody does the arithmetic.
 * The rule is one line of arithmetic and the failure is invisible until you
 * see the pair, which is the whole reason the pair is here.
 */
export function NestedSpecimen({
  radius,
  outerMultiplier = 1.4,
  padding = 8,
  ringOffset = 6,
}: {
  /** null on the live column: the arithmetic is printed as expressions. */
  radius: number | null;
  outerMultiplier?: number;
  padding?: number;
  ringOffset?: number;
}) {
  const outer = radius === null ? null : radius * outerMultiplier;
  const inner = outer === null ? null : Math.max(0, outer - padding);
  const ring = radius === null ? null : radius + ringOffset;
  return (
    <div className="flex flex-col gap-4">
      {/* 1. A card with an inner media plate. */}
      <div>
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <div
              className="bg-card p-3 ring-1 ring-foreground/10"
              style={{ borderRadius: `calc(var(--radius) * ${outerMultiplier})` }}
            >
              <div
                className="relative aspect-[4/3] overflow-hidden bg-muted"
                style={{
                  borderRadius: `max(0px, calc(var(--radius) * ${outerMultiplier} - ${padding}px))`,
                }}
              >
                <Image
                  src={marketingImage("wedding-golden").src}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
            </div>
            <CellLabel className="mt-1.5">
              Concentric. inner ={" "}
              {inner === null
                ? `outer minus ${padding}`
                : `${px(outer!)} - ${padding} = ${px(inner)}`}
            </CellLabel>
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="bg-card p-3 ring-1 ring-foreground/10"
              style={{ borderRadius: `calc(var(--radius) * ${outerMultiplier})` }}
            >
              <div
                className="relative aspect-[4/3] overflow-hidden bg-muted"
                style={{
                  borderRadius: `calc(var(--radius) * ${outerMultiplier})`,
                }}
              >
                <Image
                  src={marketingImage("wedding-golden").src}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
            </div>
            <CellLabel className="mt-1.5">
              The same token twice. Two centres, one shape short.
            </CellLabel>
          </div>
        </div>
      </div>

      {/* 2. A ring drawn AROUND an object at an offset. */}
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <div className="p-2">
            <div className="relative">
              <div
                className="relative aspect-square overflow-hidden bg-muted"
                style={{ borderRadius: "var(--radius)" }}
              >
                <Image
                  src={marketingImage("party-dj").src}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </div>
              <span
                aria-hidden
                className="pointer-events-none absolute border border-foreground/40"
                style={{
                  inset: `-${ringOffset}px`,
                  borderRadius: `calc(var(--radius) + ${ringOffset}px)`,
                }}
              />
            </div>
          </div>
          <CellLabel className="mt-1.5">
            Ring at {ringOffset}px offset ={" "}
            {ring === null ? "radius plus 6" : px(ring)}
          </CellLabel>
        </div>
        <div className="min-w-0 flex-1">
          <div className="p-2">
            <div className="relative">
              <div
                className="relative aspect-square overflow-hidden bg-muted"
                style={{ borderRadius: "var(--radius)" }}
              >
                <Image
                  src={marketingImage("party-dj").src}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </div>
              <span
                aria-hidden
                className="pointer-events-none absolute border border-foreground/40"
                style={{
                  inset: `-${ringOffset}px`,
                  borderRadius: "var(--radius)",
                }}
              />
            </div>
          </div>
          <CellLabel className="mt-1.5">
            The object&apos;s own radius. The corners drift apart.
          </CellLabel>
        </div>
      </div>
    </div>
  );
}

/* ── Part D: the ladder ────────────────────────────────────────────────── */

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

/* ── The static floating layers, for part B ────────────────────────────── */

export function StaticMenu({ className }: { className?: string }) {
  return (
    <div className={cn(MENU_PANEL, className)}>
      {["Rename event", "Duplicate", "Download album", "Delete"].map((row) => (
        <div
          key={row}
          className={cn(
            MENU_ROW,
            row === "Duplicate" && "bg-accent",
            row === "Delete" && "text-destructive",
          )}
        >
          {row}
          {row === "Download album" && (
            <Copy className="size-3.5 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}

export function StaticDialog({ className }: { className?: string }) {
  return (
    <div className={cn(DIALOG_PANEL, "max-w-sm", className)}>
      <div className="grid gap-1.5">
        <p className="font-heading text-base leading-snug font-semibold">
          Share this event
        </p>
        <p className="text-muted-foreground">
          Anyone with the link can add photos. The QR goes on the table.
        </p>
      </div>
      <Input defaultValue="partyreel.com/e/summer-wedding" readOnly />
      <div className={DIALOG_FOOTER}>
        <Button variant="ghost">Cancel</Button>
        <Button>
          <Copy data-icon="inline-start" /> Copy link
        </Button>
      </div>
    </div>
  );
}
