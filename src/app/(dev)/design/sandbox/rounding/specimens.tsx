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

import { cardMultiplier, type LadderId, px, stepValue } from "./candidates";

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

/** entry-shell.tsx, Drawer.Content: the guest entry sheet. ★ Its corner is
 *  the ACTION token times 1.4, not --radius-float, which is the finding part E
 *  is built on. Copied verbatim except for the fixed positioning. */
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

/** A toggle group with a VISIBLE name. The shell's Toggle carries an
 *  ariaLabel and nothing on screen, so three unlabelled pill groups in a row
 *  is three questions a stranger has to answer by clicking (round three's cold
 *  walk). The label is the answer, in four words. */
export function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    // flex-wrap, because the label plus a four-option group is 382px and the
    // phone canvas is 375: unwrapped it took the whole document into a
    // horizontal scroll for the sake of one word.
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {children}
    </div>
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
 *  rounded-xl, so its corner is the LADDER'S xl step (1.4x stock, 1.25x
 *  quarters); Input and the plate are rounded-lg, which is 1x on both. */
export function SurfaceSpecimen({
  radius,
  ladder,
  card,
}: {
  radius: number | null;
  /** The ladder in force on THIS subtree. ★ Never print a constant beside
   *  the card: the board scopes a retune to a column, so the answer column
   *  drew a 10px card under an 11.2px caption for two rounds. */
  ladder?: LadderId;
  /** The card's corner MEASURED off the page, for the live band, which sits
   *  outside every scoped ladder and so has no multiplier to claim. */
  card?: number | null;
}) {
  const tail =
    ladder && radius !== null
      ? `, card at ${cardMultiplier(ladder)}x = ${px(stepValue(radius, ladder, "xl"))}`
      : card != null
        ? `, card ${px(card)}`
        : "";
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
        {radius === null ? "live" : px(radius)} base
        {tail}
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
        {float === null
          ? ""
          : `, so a row nests at ${px(Math.max(0, float - 4))}`}
      </CellLabel>
    </div>
  );
}

/** --radius-tile and --gap-gallery together: the corner and the hole between
 *  four corners are one decision, which is why the gap is pinned to it. */
export function TileSpecimen({
  tile,
  gap,
  count = 6,
}: {
  tile: number | null;
  gap: number | null;
  /** Six in the matrix (two rows, so a junction of four corners is in it);
   *  three in the answer strip, where the row is one line tall. */
  count?: number;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-3 gap-[var(--gap-gallery)]">
        {TILES.slice(0, count).map((id) => (
          <Tile key={id} id={id} className="aspect-square" sizes="90px" />
        ))}
      </div>
      <CellLabel>
        {tile === null ? "live" : px(tile)} tile,{" "}
        {gap === null ? "live" : px(gap)} gap
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
  card,
}: {
  action: number | null;
  sm: number | null;
  /** The candidate's CARD corner (the base through the ladder in force, or
   *  the live band's measurement), so the cell can print the CONTRAST, which
   *  is the only thing that changes down this row: the rung is the same in
   *  every column by design, and four identical cells read as a mistake. The
   *  ratio is what bible 8 is actually claiming, and it is the card's corner
   *  that carries it, so the ladder moves this number too. */
  card?: number | null;
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
      {card !== undefined && card !== null && sm !== null ? (
        <CellLabel className="text-foreground">
          {card === 0
            ? "A square card against a round action: the widest contrast there is."
            : `Card ${px(card)} against action ${px(sm)}: ${
                Math.round((sm / card) * 10) / 10
              } to 1.`}
        </CellLabel>
      ) : null}
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
  outerMultiplier,
  padding = 8,
  ringOffset = 6,
  ringOnly = false,
}: {
  /** null when the tuner is driving: the arithmetic prints as expressions. */
  radius: number | null;
  /** The card's step, from the ladder in force. ★ Required, not defaulted:
   *  this card is drawn from an inline calc, so nothing else here follows a
   *  ladder retune, and a default of 1.4 is how the board came to caption a
   *  quarters card with a stock number. */
  outerMultiplier: number;
  padding?: number;
  ringOffset?: number;
  /** The across-candidates strip shows the ring pair only: the card pair is
   *  drawn once, large, at the rail's candidate, because a 90px card cannot
   *  carry an 8px argument. */
  ringOnly?: boolean;
}) {
  const outer = radius === null ? null : radius * outerMultiplier;
  const inner = outer === null ? null : Math.max(0, outer - padding);
  const ring = radius === null ? null : radius + ringOffset;
  return (
    <div className="flex flex-col gap-4">
      {/* 1. A card with an inner media plate. Left out of the strip rather
          than hidden: a hidden <Image> still loads. */}
      {!ringOnly && (
        <div>
          <div className="flex gap-3">
            <div className="min-w-0 flex-1">
              <div
                className="bg-card p-3 ring-1 ring-foreground/10"
                style={{
                  borderRadius: `calc(var(--radius) * ${outerMultiplier})`,
                }}
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
                style={{
                  borderRadius: `calc(var(--radius) * ${outerMultiplier})`,
                }}
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
      )}

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
            {ringOnly && radius !== null
              ? `Drawn at the object's own ${px(radius)}: ${px(ringOffset)} of drift.`
              : "The object's own radius. The corners drift apart."}
          </CellLabel>
        </div>
      </div>
    </div>
  );
}

/**
 * THE THIRD NESTING CASE: something drawn around an ACTION.
 *
 * ★ THIS WANTED TO BE THE BEAM AND IS NOT, BY LANE. BorderBeam is the case the
 * system already gets right, because it is given no borderRadius prop and
 * reads its child's computed radius instead, so its ring is whatever the
 * object is at whatever this board rules (pro-card-beam.tsx says so out loud:
 * a literal is what once put a 16px ring around a 3.6px card). Putting one on
 * this board adds a call site, and glow-contract.test.ts pins the exact set of
 * them in a file this track does not own. So the case is drawn with a plain
 * ring at an offset, which is the same arithmetic and the same failure, and
 * the Handoff asks for the one line that would let the beam stand here.
 */
export function ActionRingSpecimen({
  radius,
  offset = 4,
}: {
  radius: number | null;
  offset?: number;
}) {
  return (
    <div className="flex gap-3">
      {(["right", "wrong"] as const).map((kind) => (
        <div key={kind} className="flex min-w-0 flex-1 flex-col">
          <div className="p-2">
            <span className="relative inline-flex">
              <Button>
                <Plus data-icon="inline-start" /> Add
              </Button>
              <span
                aria-hidden
                className="pointer-events-none absolute border border-foreground/40"
                style={{
                  inset: `-${offset}px`,
                  borderRadius:
                    kind === "right"
                      ? `calc(var(--radius-action-sm) + ${offset}px)`
                      : "var(--radius-action-sm)",
                }}
              />
            </span>
          </div>
          <CellLabel className="mt-1.5">
            {kind === "right"
              ? `Ring at ${offset}px = ${
                  radius === null ? "action-sm plus 4" : px(radius + offset)
                }`
              : "The action's own radius."}
          </CellLabel>
        </div>
      ))}
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

/**
 * THE GUEST ENTRY SHEET, at the action token (round three's finding).
 *
 * ★ THIS IS NOT A BUTTON AND IT WEARS THE BUTTON'S TOKEN. entry-shell.tsx
 * draws the sheet every guest meets before they see a single photograph with
 * `rounded-t-[calc(var(--radius-action)*1.4)]`, so the action rung decides the
 * corner of the biggest floating surface on the site: 22.4px today, 11.2 under
 * quiet, and a half-circle under the pill, where 1.4 x 999 clamps to half the
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
          : `${px(corner)} on the top corners, 1.4 x the action token`}
      </CellLabel>
    </div>
  );
}
