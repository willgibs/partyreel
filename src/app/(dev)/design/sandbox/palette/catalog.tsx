"use client";

import Image from "next/image";
import { Check, Ellipsis } from "lucide-react";

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

import { optionId, optionMeans } from "@/components/lab/board-spec";

import { PALETTES, resolvePalette, type PaletteDef } from "./palettes";
import { PALETTE } from "./spec";
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
 */

/**
 * A CARD'S ONE LINE, read off the ask it belongs to. The twelve `means` lines in
 * `spec.ts` are what a reviewer sees on the desk and on the review card, so the
 * card on the board has to say the same words or the catalog and the question
 * are two different catalogs. Joined on the option id, which is the ledger's own
 * join.
 */
const LINES = new Map(
  (PALETTE.asks.find((a) => a.id === "palette")?.options ?? []).map((o) => [
    optionId(o),
    optionMeans(o) ?? "",
  ]),
);

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

/* ── The card ───────────────────────────────────────────────────────────── */

/**
 * ONE PALETTE, WHOLE. The name and the line first, because that is what a
 * reviewer reads; then the face; then the same product fragment in both modes,
 * which is what makes twelve of these comparable at a glance.
 *
 * The whole card is the control. Picking it sets the dock, so the pages below
 * reload on it: a catalog where a card is a picture and the selection lives
 * somewhere else is two things to keep in your head instead of one.
 */
function CatalogCard({
  def,
  cardMode,
  faint,
  picked,
  onPick,
}: {
  def: PaletteDef;
  cardMode: CardMode;
  faint: boolean;
  picked: boolean;
  onPick: () => void;
}) {
  const { pair: raw, accent } = resolvePalette(def.id);
  const pair = resolvePair(raw, cardMode, faint);
  return (
    <div
      // ★ NOT `data-palette`: BoardPage writes `data-<controlId>` on the board
      // ROOT for every declared control, and this board's control is called
      // `palette`. A card wearing the same attribute makes any sheet selecting
      // on [data-palette="ember"] hit thirteen elements, twelve of them cards.
      data-pal-card={def.id}
      data-picked={picked ? "true" : undefined}
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-xl border p-3",
        picked
          ? "border-foreground/40 bg-muted/40"
          : "border-border bg-background",
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm leading-none font-medium">
            {def.name}
            {def.recommended ? (
              <span
                className="inline-block size-1.5 rounded-full bg-foreground"
                title="The board's own pick"
              />
            ) : null}
          </p>
          <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
            {LINES.get(def.id)}
          </p>
          <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground/70">
            {def.why}
          </p>
        </div>
        <Button
          size="xs"
          variant={picked ? "default" : "outline"}
          onClick={onPick}
          aria-pressed={picked}
          className="shrink-0"
        >
          {picked ? <Check /> : null}
          {picked ? "Picked" : "Pick"}
        </Button>
      </div>

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

/**
 * The twelve, in one grid: four across at the review width, three on a narrower
 * window, two on a tablet, one on a phone. The catalog is the board's own
 * content rather than a Stage, so a real breakpoint is honest here (inside a
 * Stage it would not be).
 *
 * ★ THE COLUMNS ARE IN `board.css`, NOT IN TAILWIND CLASSES, and this is the
 * lab-sheet landmine biting in a new place. The lab compiles its utilities into
 * `layer(utilities.lab)`, a SUB-layer of `utilities`, so any rule production
 * already emits outranks a lab-only one on the same element whatever the
 * breakpoint. `lg:grid-cols-3` is in production's sheet and `xl:grid-cols-4` is
 * lab-only, so the pair silently laid three columns at 1440 with both variants
 * matching. The board's own sheet is unlayered and settles it.
 */
export function Catalog({
  picked,
  cardMode,
  faint,
  onPick,
}: {
  /** The picked palette's id, or null while nothing is picked. */
  picked: string | null;
  cardMode: CardMode;
  faint: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <div data-pal-catalog className="grid gap-3">
      {PALETTES.map((p) => (
        <CatalogCard
          key={p.id}
          def={p}
          cardMode={cardMode}
          faint={faint}
          picked={p.id === picked}
          onPick={() => onPick(p.id)}
        />
      ))}
    </div>
  );
}
