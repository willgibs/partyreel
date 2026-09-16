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

import {
  type ActionRung,
  type LadderId,
  LADDERS,
  px,
  type Step,
  stepValue,
  STEP_CALL_SITES,
} from "./candidates";
import { TrueScale } from "./true-scale";

/**
 * THE ROUNDING BOARD'S SPECIMENS (round seven, the stepped review,
 * 2026-09-16).
 *
 * Three rules decide this file, and all three come from what the board judges:
 *
 * 1. A SPECIMEN IS AT TRUE SIZE OR IT IS NOT EVIDENCE. A corner is a fixed
 *    number of pixels, so anything that scales it renders a 16px corner at 4
 *    and every family reads the same. Everything below is wrapped in
 *    `TrueScale`, which divides out the zoom a step's option tile imposes, and
 *    laid out fluid so it fills exactly the pixels a reader can see.
 * 2. THE SPECIMEN IS THE SHIPPED COMPONENT, NOT A RECTANGLE. Card, Button,
 *    Input and Badge are imported, so a family is judged on the corner the
 *    product actually draws. The two exceptions are the floating layers: a
 *    radix panel portals to document.body and leaves any wrapper, so the menu
 *    and the guest sheet are drawn static FROM THE PRIMITIVES' OWN CLASS
 *    STRINGS, copied below beside the file they came from. Check them against
 *    the source when either moves.
 * 3. ONE SPECIMEN A QUESTION (this round's change). Round six stacked all four
 *    remaining calls into one `calls` section of three tables and a grid of
 *    arithmetic, which is a page a reviewer has to navigate rather than a thing
 *    he looks at. Each question now owns one specimen small enough to be drawn
 *    once per answer, side by side, above the same thing at full size.
 *
 * ★ AND NOTHING CARRIES A BREAKPOINT PREFIX. A Tailwind prefix inside a div
 * reads the BROWSER's width rather than the box's, so a 375-wide div with an
 * `sm:` class in it is a lie about a phone. The one prefix that does reach here
 * is Input's `md:text-sm`, which moves a font size and no corner.
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
  "flex flex-col rounded-t-[calc(var(--radius-action)*1.4)] bg-popover px-5 pt-3 pb-5 text-sm text-popover-foreground shadow-float ring-1 ring-foreground/10";

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

/**
 * THE BRIGHT-EDGED NINE, standing in for the asset this board asks for.
 *
 * A corner hole is a hole in the PHOTOGRAPHS: four corners meet, the ground
 * shows through, and how visible that is depends entirely on the contrast at
 * the junction. The mid-key set above flatters the bug. These nine are the
 * brightest edges in the marketing pool (an open sky, glassware, pastel
 * balloons, a golden flare), which is the closest the board can get to the
 * worst case until the real tiles land.
 */
export const BRIGHT_TILES = [
  "wedding-arch",
  "reception-table",
  "party-balloons",
  "wedding-golden",
  "wedding-rings",
  "wedding-toast",
  "reception-hall",
  "festival-crowd",
  "wedding-petals",
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

/** The line under a specimen: what it is set at, in the specimen's own box so
 *  it travels with the picture rather than sitting in the board's prose. */
function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] leading-snug text-muted-foreground">{children}</p>
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
 * ★ AND THE PHONE FRAME UNDER IT WENT (round seven). Every card used to carry
 * a real 375 viewport as well, which is six iframes on the one step where every
 * option has to be visible at once; the real page is the STAGE below the tiles
 * now, wearing whichever card is pressed, which is the same evidence once
 * rather than six times.
 *
 * 375 exactly, with a 16px gutter each side, which is the phone canvas's own
 * measure. Nothing is scaled and nothing carries a breakpoint.
 */
export function FamilyStrip() {
  return (
    <div className="w-[375px] shrink-0 px-4 py-3.5">
      {/* The photographs, at the tile corner and the gallery gap. Three across
          and two deep, so a junction of four corners is inside the specimen. */}
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

/* ── The buttons, and the door that borrows their token ────────────────── */

/** Every height an action ships at, and the token each one wears. h-10 and
 *  h-12 are here because the tokens are named for them and both are nearly
 *  empty in the product, which is half of the button ask's finding. */
const HEIGHTS: {
  where: string;
  px: number;
  token: string;
  sample: string;
  radius: (a: ActionRung) => number;
}[] = [
  {
    where: "32px, every Button in the app",
    px: 32,
    token: "var(--radius-action-sm)",
    sample: "Add photos",
    radius: (a) => a.values.sm,
  },
  {
    where: "40px, the reel and the footer CTA",
    px: 40,
    token: "var(--radius-action)",
    sample: "Save to phone",
    radius: (a) => a.values.action,
  },
  {
    where: "44px, the marketing button, in 26 files",
    px: 44,
    token: "calc(var(--radius-action) * 0.9)",
    sample: "Create your event",
    radius: (a) => a.values.action * 0.9,
  },
  {
    where: "48px, one call site, at h-11",
    px: 48,
    token: "var(--radius-action-lg)",
    sample: "Publish the reel",
    radius: (a) => a.values.lg,
  },
];

/**
 * THE BUTTON QUESTION, ON ONE SPECIMEN: the four heights a button ships at,
 * over the sheet that takes its corner from the same token.
 *
 * ★ THE SHEET IS THE ARGUMENT, NOT AN ASIDE. entry-shell.tsx draws the first
 * surface any guest ever meets with
 * `rounded-t-[calc(var(--radius-action)*1.4)]`, so a rung chosen for buttons
 * silently decides the corner of the biggest floating surface on the site:
 * 22.4px today, 11.2 under quiet, and a half circle under the pill, where
 * 1.4 x 999 clamps to half the sheet's height. Drawn static from the class
 * string above, because vaul portals the real one out of any stage.
 */
export function ButtonBench({ action }: { action: ActionRung }) {
  const corner = action.values.action > 100 ? null : action.values.action * 1.4;
  return (
    <TrueScale data-rnd-specimen="buttons">
      <div className="flex w-full max-w-[375px] flex-col gap-3 p-3">
        <div className="flex flex-col gap-1.5">
          {HEIGHTS.map((row) => {
            const r = row.radius(action);
            return (
              <div key={row.px} className="flex items-center gap-2.5">
                <span
                  className="inline-flex shrink-0 items-center bg-primary font-medium whitespace-nowrap text-primary-foreground"
                  style={{
                    height: row.px,
                    paddingInline: Math.round(row.px * 0.45),
                    borderRadius: row.token,
                    fontSize: row.px >= 40 ? 15 : 13,
                  }}
                >
                  {row.sample}
                </span>
                <span className="min-w-0 text-[11px] leading-snug text-muted-foreground">
                  {row.where}
                  <br />
                  {r >= 100
                    ? "a pill, whatever the height"
                    : `${px(r)}, ${Math.round((r / row.px) * 100) / 100} x height`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="relative h-[180px] w-full overflow-hidden rounded-lg bg-muted/40 ring-1 ring-foreground/10">
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
            <Button className="mt-2.5 w-full">Add your photos</Button>
          </div>
        </div>
        <Caption>
          The guest door, not a button:{" "}
          {corner === null
            ? "1.4 x 999 clamps to half the sheet"
            : `${px(corner)} on the top corners, 1.4 x the button token`}
          .
        </Caption>
      </div>
    </TrueScale>
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
      <div className="w-fit rounded-sm bg-foreground px-2 py-1 text-[11px] text-background">
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

/** The seven, in the order they read best two across: the small chrome first,
 *  then the two big surfaces the ladder actually decides. */
const LADDER_ORDER: readonly Step[] = [
  "sm",
  "md",
  "lg",
  "4xl",
  "xl",
  "2xl",
  "3xl",
];

/**
 * THE WHOLE LADDER ON ONE SPECIMEN, drawn at the card's own corner.
 *
 * ★ TWO LADDERS ARE NOT TWO NUMBERS, THEY ARE SEVEN SHAPES EACH. Round six
 * printed the two side by side as a table of multipliers and their products,
 * which is arithmetic a reviewer has to do rather than a difference he can see.
 * Both answers are now drawn in full, one per tile, so the comparison is seven
 * real components against seven real components.
 */
export function StepLadder({
  base,
  ladder,
  family,
}: {
  base: number;
  ladder: LadderId;
  /** The family whose card corner every step is a multiple of, named so a
   *  reader knows whether he is looking at his own pick or at the board's. */
  family: string;
}) {
  return (
    <TrueScale data-rnd-specimen="steps">
      <div
        data-rnd-ladder={ladder}
        style={{ "--radius": `${base}px` } as React.CSSProperties}
        className="w-full max-w-[375px] p-3"
      >
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          {LADDER_ORDER.map((step) => (
            <div key={step} className="flex min-w-0 flex-col gap-1">
              <div className="flex min-w-0 items-center">
                <StepSpecimen step={step} />
              </div>
              <Caption>
                {step} · {LADDERS[ladder][step]}x ={" "}
                {px(stepValue(base, ladder, step))}
              </Caption>
            </div>
          ))}
        </div>
        <Caption>
          Every step is a multiple of {family}&apos;s {px(base)} card. Card is
          rounded-xl, so its own corner is {px(stepValue(base, ladder, "xl"))}.
        </Caption>
      </div>
    </TrueScale>
  );
}

/* ── The two steps nobody uses ─────────────────────────────────────────── */

/**
 * THE TOP TWO RUNGS, ON THE ONLY TWO THINGS THAT USE THEM.
 *
 * Three call sites between them: one marketing panel on /features/sharing at
 * 3xl, and the Badge at 4xl, which wants a full pill and borrows the largest
 * step to fake one. Dropping them moves the panel to the step below and lets
 * the Badge ask for the pill, which is what the second tile draws.
 */
export function DeadRungs({
  base,
  ladder,
  drop,
}: {
  base: number;
  ladder: LadderId;
  drop: boolean;
}) {
  const panelStep: Step = drop ? "2xl" : "3xl";
  return (
    <TrueScale data-rnd-specimen="rungs">
      <div
        data-rnd-ladder={ladder}
        style={{ "--radius": `${base}px` } as React.CSSProperties}
        className="flex w-full max-w-[375px] flex-col gap-3 p-3"
      >
        <div className="flex flex-col gap-1">
          <div
            className={cn(
              "flex flex-col gap-1 border bg-muted/40 p-3",
              drop ? "rounded-2xl" : "rounded-3xl",
            )}
          >
            <p className="text-xs font-medium">Share the link, not the files</p>
            <p className="text-[11px] text-muted-foreground">
              One panel, on /features/sharing.
            </p>
          </div>
          <Caption>
            {drop ? "2xl, the step below" : "3xl, one use in the product"} ={" "}
            {px(stepValue(base, ladder, panelStep))}
          </Caption>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge className={drop ? "rounded-full" : undefined}>
              <Check data-icon="inline-start" /> Live
            </Badge>
            <Badge
              variant="outline"
              className={drop ? "rounded-full" : undefined}
            >
              6 to review
            </Badge>
          </div>
          <Caption>
            {drop
              ? "A full pill, asked for rather than faked"
              : `4xl, borrowed to fake a pill = ${px(stepValue(base, ladder, "4xl"))}`}
            . {STEP_CALL_SITES["4xl"].uses} uses, {STEP_CALL_SITES["3xl"].uses}{" "}
            for the panel.
          </Caption>
        </div>
      </div>
    </TrueScale>
  );
}

/* ── The album's grid, and its gap ─────────────────────────────────────── */

/**
 * THE ALBUM'S GAP, DRAWN RATHER THAN ARGUED.
 *
 * Nine photographs at a guest's own column, with four junctions inside the
 * specimen. Above a corner of 3 the fixed 3px gap opens a diamond where four
 * corners meet, on the one page every guest sees. Round six drew both answers
 * side by side in one figure; the step draws one answer a tile, which is the
 * same comparison with half the furniture.
 */
export function AlbumGrid({
  tile,
  gap,
  pinned,
  family,
}: {
  tile: number;
  gap: number;
  pinned: boolean;
  /** Whose photograph corner this is, so a reader knows whether he is looking
   *  at his own pick or at the board's answer standing in for it. */
  family: string;
}) {
  const hole = !pinned && tile > 3;
  return (
    <TrueScale data-rnd-specimen="album">
      <div className="flex w-full max-w-[375px] flex-col gap-1.5 p-3">
        <div
          className="grid grid-cols-3"
          style={{ gap: `${gap}px` }}
          // The ground shows through a junction, so the grid sits straight on
          // the app's own background rather than on a plate of its own.
        >
          {BRIGHT_TILES.map((id) => (
            <Tile key={id} id={id} className="aspect-square" sizes="120px" />
          ))}
        </div>
        <Caption>
          {family}: a {px(tile)} corner in a {px(gap)} gap.{" "}
          {hole
            ? "A hole at every junction."
            : pinned
              ? "Flush: the gap grew with the corner."
              : "Nothing to see at or below 3, which is why the bug is invisible today."}
        </Caption>
      </div>
    </TrueScale>
  );
}
