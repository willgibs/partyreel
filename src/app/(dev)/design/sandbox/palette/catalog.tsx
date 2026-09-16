"use client";

import Image from "next/image";
import { Ellipsis } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { resolvePalette } from "./palettes";
import {
  GROUND_CLASS,
  pairStyle,
  resolvePair,
  STATE_HUES,
  type BoardGround,
  type CardMode,
  type Pair,
} from "./registers";

/**
 * THE CATALOG, RENDERED (round six, the clarity round, 2026-09-15).
 *
 * ★ THE SHAPE IS THE ANSWER TO THE REVIEW. Will's note on round five was not
 * that the argument was wrong, it was that a reviewer should not have to
 * assemble the answer out of seven switches: "having a dozen polished variants
 * with preview palettes with some demo UI to config & compare would've been far
 * more helpful". So one card per finished palette, twelve of them on one grid,
 * each one complete enough to pick from without touching a control: the grounds
 * as a strip, the text steps drawn on the two grounds type actually lands on,
 * the accent and the six state hues in both modes, and a real product fragment
 * built from production components, dark beside light.
 *
 * ★ EVERY CARD IS AT TRUE PIXELS AND NOTHING IS SCALED. The 1:1 law of the lab
 * holds here exactly as it does inside a Stage: a card's demo column is narrow
 * because the grid is, not because anything was zoomed. A Button in it is the
 * production Button at its production height; the media tiles are the album's
 * own 3px gap and 3px radius.
 *
 * ★ AND THE CARDS DO NOT MOVE. Twelve palettes redrawing on a hover or a
 * transition would be twelve things changing colour at once, which is the exact
 * failure a catalog exists to avoid. The only motion in here is the production
 * components' own press feedback and the menu's own entrance.
 *
 * ★ THE GRID AND THE CARD LEFT THIS FILE (the revamp, 2026-09-16). What was
 * proven here is now the kit's `Catalog`: the name with its dot, the builder's
 * pill, the one line, the facts, the folded rationale, Pick, A, B and the
 * reviewer's verdict row, on the `.lab-catalog` grid. This file keeps the one
 * thing that is genuinely this board's, the PREVIEW: a palette painted on its
 * own scoped tokens, which no other board can borrow because no other board
 * has palettes. That is the shape every catalog board takes from here.
 */

/* ── The scoped panel ───────────────────────────────────────────────────── */

/**
 * A PALETTE, ON A PANEL. The one mechanism the whole catalog is built from, and
 * this board's own (the kit's Stage is a fixed 1440 or 375 canvas, which is not
 * what a catalog cell is).
 *
 * Two things have to happen together and neither is optional:
 *
 *  1 THE THEME CLASS, because production components carry `dark:` utilities and
 *    the variant is `&:is(.dark *):not(.surface-paper *)`. Custom properties
 *    alone would repaint the tokens and leave every `dark:` utility resolving
 *    against the LAB PAGE's mode, so a dark demo inside a light board would
 *    wear the light half of every component. GROUND_CLASS is the same map the
 *    rest of the board uses.
 *  2 THE PAIR'S TOKENS INLINE, because a declaration on the element beats the
 *    class's, and custom properties inherit, so the whole subtree repaints
 *    without any selector scoped to this panel.
 *
 * The state hues (--success, --like, --reel …) are deliberately NOT in the pair:
 * they come from the theme class, which is why a dark panel shows the dark
 * state hues even on a light board. That is the honest reading, and it is the
 * whole reason the class has to be here rather than only the tokens.
 */
export function ScopedTokens({
  pair,
  ground,
  className,
  style,
  children,
}: {
  pair: Pair;
  ground: BoardGround;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        GROUND_CLASS[ground],
        "bg-background text-foreground",
        className,
      )}
      data-ground={ground}
      style={{ ...pairStyle(pair, ground), ...style }}
    >
      {children}
    </div>
  );
}

/* ── The swatch strip ───────────────────────────────────────────────────── */

/** The three text steps as bars, drawn on the ground they sit on. The faint
 *  step paints from a `var()` with the alpha 37 call sites composite by hand as
 *  its fallback, so a palette with no --faint shows what ships today rather
 *  than a hole. */
function TextBars({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-[3px]", className)}>
      <span className="h-[3px] w-11 rounded-full bg-foreground" />
      <span className="h-[3px] w-8 rounded-full bg-muted-foreground" />
      <span
        className="h-[3px] w-5 rounded-full"
        style={{
          background:
            "var(--faint, color-mix(in oklab, var(--muted-foreground) 70%, transparent))",
        }}
      />
    </div>
  );
}

/** One ground of the strip: a block of its own background, with the text steps
 *  on the two grounds type actually lands on. */
function GroundBlock({
  pair,
  ground,
  grow,
  bars,
}: {
  pair: Pair;
  ground: BoardGround;
  grow: number;
  bars?: boolean;
}) {
  return (
    <ScopedTokens
      pair={pair}
      ground={ground}
      className="flex items-end px-2 pb-2"
      style={{ flexGrow: grow, flexBasis: 0 }}
    >
      {bars ? <TextBars /> : null}
    </ScopedTokens>
  );
}

/** The accent and the six state hues, on one mode's page. The accent is a
 *  filled chip because that is how it ships (a mark, a badge, a dot); the
 *  states are the sizes they ship at. */
function AccentBand({
  pair,
  ground,
  accentValue,
}: {
  pair: Pair;
  ground: BoardGround;
  accentValue: string;
}) {
  return (
    <ScopedTokens
      pair={pair}
      ground={ground}
      className="flex flex-1 items-center gap-2 px-2 py-1.5"
    >
      <span
        className="h-3.5 w-6 shrink-0 rounded-full"
        style={{ background: accentValue }}
      />
      <span className="flex items-center gap-1.5">
        {STATE_HUES.map((s) => (
          <span
            key={s.token}
            className="size-2 rounded-full"
            style={{ background: `var(${s.token})` }}
          />
        ))}
      </span>
    </ScopedTokens>
  );
}

/**
 * THE PALETTE'S FACE: every ground it declares, deepest to brightest, then the
 * accent and the states in both modes under them.
 *
 * The order is the argument in one object. Left to right the strip runs well,
 * room, slab, then mat, paper: the well is the bed a photograph lies on and is
 * the deepest thing in the set; the slab sits LIGHTER than the room because a
 * room dropped into paper reads as a hole; the mat sits under the paper for the
 * same reason in the other direction. A palette whose slab equals its room
 * shows one block where the others show two, which is the whole of that set's
 * claim visible without a word.
 */
function SwatchStrip({
  pair,
  accentDark,
  accentLight,
}: {
  pair: Pair;
  accentDark: string;
  accentLight: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg ring-1 ring-foreground/10">
      <div className="flex h-12">
        {/* The well is the one ground with no register of its own: it belongs to
            neither mode and is spread under both, so it is painted from its own
            token rather than resolved through pairStyle. */}
        <span
          className="grow basis-0"
          style={{ background: pair.dark.well["--gallery"] }}
        />
        <GroundBlock pair={pair} ground="cinema" grow={2} bars />
        <GroundBlock pair={pair} ground="ink" grow={1} />
        <GroundBlock pair={pair} ground="mat" grow={1} />
        <GroundBlock pair={pair} ground="paper" grow={2} bars />
      </div>
      <div className="flex border-t border-foreground/10">
        <AccentBand pair={pair} ground="cinema" accentValue={accentDark} />
        <AccentBand pair={pair} ground="paper" accentValue={accentLight} />
      </div>
    </div>
  );
}

/* ── The demo UI ────────────────────────────────────────────────────────── */

/** One photograph on every card, on purpose: a ground is being compared, so the
 *  thing lying on it has to be the same thing every time. */
const TILES = [
  marketingImage("wedding-golden").src,
  marketingImage("party-balloons").src,
];

/**
 * A REAL PRODUCT FRAGMENT, from the production components, on one palette in
 * one mode. Everything a ground has to survive, in one column: a card lifting
 * off the page, the three text steps in real copy, media lying on the well, a
 * badge and a button in the accent's own colours, a form control, and a menu
 * that opens over the card.
 *
 * ★ THE MENU IS REAL AND IT PORTALS, which is the one thing a scoped panel
 * cannot contain. `DropdownMenuContent` renders into document.body, so it would
 * be painted by the LAB PAGE rather than by this palette. It carries the
 * palette's theme class and tokens on itself instead, which is the same
 * mechanism ScopedTokens uses and the only honest way to see a production
 * floating surface wearing a candidate. It is closed by default: twelve open
 * menus would be twelve fixed-position panels stacked over the board.
 */
function DemoPanel({
  pair,
  ground,
  accentValue,
  accentForeground,
  name,
}: {
  pair: Pair;
  ground: BoardGround;
  accentValue: string;
  accentForeground: string;
  name: string;
}) {
  const accent = {
    "--brand": accentValue,
    "--brand-foreground": accentForeground,
  } as React.CSSProperties;
  return (
    <ScopedTokens
      pair={pair}
      ground={ground}
      className="flex min-w-0 flex-1 flex-col gap-2.5 rounded-lg p-2.5 ring-1 ring-foreground/10"
      style={accent}
    >
      <Card size="sm" className="gap-2">
        <CardHeader>
          {/* Short on purpose. The panel is 155px wide at the review width and
              CardHeader's action column leaves the description the title's own
              width, so anything longer than two words wraps and pushes every
              one of the twelve cards down a line for no colour information. */}
          <CardTitle className="text-[13px]!">Sarah&apos;s 30th</CardTitle>
          <CardDescription className="text-[11px] leading-snug">
            91 uploads
          </CardDescription>
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`A menu on ${name}`}
                >
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className={GROUND_CLASS[ground]}
                style={pairStyle(pair, ground)}
              >
                <DropdownMenuItem>Share the link</DropdownMenuItem>
                <DropdownMenuItem>Download everything</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  Delete the event
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </CardHeader>

        <CardContent>
          <div
            className="grid grid-cols-3 gap-[3px] overflow-hidden rounded-[3px]"
            style={{ background: "var(--gallery)" }}
          >
            {TILES.map((src) => (
              <span
                key={src}
                className="relative aspect-square overflow-hidden"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </span>
            ))}
            {/* The third tile is the well with nothing in it yet: the one place
                a guest sees the bed on its own, and the reason the well is a
                register rather than a shade of the room. */}
            <span className="aspect-square" />
          </div>
        </CardContent>

        {/* The footer is its own surface (bg-muted/50 over the card), so the
            badge sits on the panel register and the button on the accent: two
            of the five steps meeting in eighteen pixels. */}
        <CardFooter className="justify-between gap-1.5 py-2">
          <Badge
            className="border-transparent"
            style={{
              background: "var(--brand)",
              color: "var(--brand-foreground)",
            }}
          >
            Live
          </Badge>
          <Button size="xs">Share</Button>
        </CardFooter>
      </Card>

      {/* The one form control: --input and --ring are the two tokens nothing
          else on the card reads. Full width, because a button beside it at this
          width leaves the value clipped and a clipped URL reads as a bug. */}
      <Input
        readOnly
        value="partyreel.com/e/9fq2"
        aria-label="The event link"
        className="h-7 text-[11px] md:text-[11px]"
      />

      <p
        className="text-[10px] leading-none"
        style={{
          color:
            "var(--faint, color-mix(in oklab, var(--muted-foreground) 70%, transparent))",
        }}
      >
        Last change 4 minutes ago
      </p>
    </ScopedTokens>
  );
}

/* ── The preview ────────────────────────────────────────────────────────── */

/**
 * ONE PALETTE'S FACE AND ITS DEMO, which is what the kit's `Catalog` mounts as
 * a card's preview.
 *
 * The order is the argument in one object: the strip first (every ground the
 * palette declares, deepest to brightest, with the accent and the states under
 * it), then the SAME product fragment in dark beside light, which is what makes
 * twelve of these comparable at a glance rather than twelve pictures.
 *
 * ★ IT PAINTS ITS OWN GROUND, so the kit's Catalog is given no `ground` prop.
 * A stock production ground is the right default for a board judging shapes;
 * this board is judging the grounds themselves, so every panel in here carries
 * its candidate's tokens and its own theme class.
 */
export function PalettePreview({
  id,
  cardMode,
  faint,
}: {
  /** The candidate's id, which is the palette's. */
  id: string;
  cardMode: CardMode;
  faint: boolean;
}) {
  const { def, pair: raw, accent } = resolvePalette(id);
  const pair = resolvePair(raw, cardMode, faint);
  return (
    <div className="flex flex-col gap-3">
      <SwatchStrip
        pair={pair}
        accentDark={accent.dark}
        accentLight={accent.light}
      />
      <div className="flex min-w-0 gap-2">
        <DemoPanel
          pair={pair}
          ground="cinema"
          accentValue={accent.dark}
          accentForeground={accent.darkForeground}
          name={def.name}
        />
        <DemoPanel
          pair={pair}
          ground="paper"
          accentValue={accent.light}
          accentForeground={accent.lightForeground}
          name={def.name}
        />
      </div>
    </div>
  );
}
