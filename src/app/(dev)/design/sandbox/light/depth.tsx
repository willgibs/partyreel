"use client";

import { Check, ChevronDown } from "lucide-react";

import { GroundBox } from "@/components/lab";
import { EventCard } from "@/components/app/event-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { StageOnly, TileOnly, TrueFit } from "./fit";

/**
 * SHOULD DARK MODE GET SHADOWS? ONE SCENE, FOUR HEIGHTS (round eight).
 *
 * ★ FOUR CARDS BECAME ONE QUESTION, AND WILL ASKED FOR IT IN AS MANY WORDS:
 * "our step, ring, lift, and float: a set of four options to choose from, or
 * are we trying to use everything, and if so, how?" Round seven drew the four
 * as rival cards on one pair of tiles, so they read as four answers to one
 * question. They are four different things at four different heights, and only
 * two of them are undecided: the lighter panel and the thin outline ship on
 * every surface today. So this is one dark screen with all four in it at once,
 * a legend that says which is which, and one question about the two shadows.
 *
 * ★ THE FRONT CARD IS ABOVE AND OVER THE BACK ONE, BECAUSE A SHADOW FALLS DOWN.
 * His note on lift was a bug report: "since the top card in the stack is moved
 * to a lower Y coordinate than the card below it, the shadows don't actually
 * stack at all." A shadow's offset is downward, so it can only land on the
 * card behind when the front card's BOTTOM edge crosses that card's face. Here
 * it does, in the bright upper half of that photograph (an event card darkens
 * its own foot for its title, and a shadow over a dark gradient is invisible),
 * and the menu's bottom edge crosses the same photograph beside it, so the two
 * shadow sizes are side by side on one picture.
 *
 * ★ THE TWO PHOTOGRAPHS ARE THE SAME LIGHTNESS ON PURPOSE. That is the case the
 * small shadow exists for: two mid-key pictures whose touching edges the eye
 * cannot separate. A bright card over a dark one needs no help, and a shadow
 * over black is arithmetic nobody can see. The worst-case pair (both dark) is
 * still owed by docs/ASSETS.md row 16.
 *
 * ★ THE MENU IS THE REAL CONTENT'S CLASSES, DRAWN IN PLACE. A radix portal
 * leaves every wrapper a board paints, so it cannot wear a candidate at all;
 * this is `DropdownMenuContent`'s own surface (ui/dropdown-menu.tsx) on a
 * plain div. The floating-surfaces board owns the menu's other questions.
 */

export type DepthPick = "none" | "both" | "float-only";

export type DepthState = {
  depth: DepthPick;
  /** The thin outline (the ring), which ships everywhere today. */
  outline: boolean;
  /** The lighter panel (the step), which ships everywhere today. */
  surface: boolean;
};

type Geo = {
  w: number;
  pad: number;
  panelPad: number;
  head: number;
  gap: number;
  card: number;
  bx: number;
  by: number;
  menu: number;
  rows: readonly string[];
};

/** The tile's crop and the stage's scene: one composition at two sizes. */
const GEO: Record<"tile" | "stage", Geo> = {
  tile: {
    w: 412,
    pad: 10,
    panelPad: 12,
    head: 28,
    gap: 12,
    card: 220,
    bx: 96,
    by: 89,
    menu: 164,
    rows: ["Newest first", "Oldest first", "Most photos", "Name"],
  },
  stage: {
    w: 760,
    pad: 24,
    panelPad: 20,
    head: 32,
    gap: 16,
    card: 340,
    bx: 230,
    by: 138,
    menu: 224,
    rows: [
      "Newest first",
      "Oldest first",
      "Most photos",
      "Most guests",
      "Name",
      "Show closed events",
    ],
  },
};

const lifts = (s: DepthState) => s.depth === "both";
const floats = (s: DepthState) => s.depth !== "none";

/** A numbered dot that ties a thing in the scene to its row in the legend. */
function Marker({
  n,
  className,
  style,
}: {
  n: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute z-20 flex size-[18px] items-center justify-center rounded-full bg-foreground text-[10px] leading-none font-semibold text-background tabular-nums",
        className,
      )}
      style={style}
    >
      {n}
    </span>
  );
}

function Scene({
  size,
  s,
  markers = false,
}: {
  size: "tile" | "stage";
  s: DepthState;
  markers?: boolean;
}) {
  const g = GEO[size];
  const cardH = (g.card * 10) / 16;
  const inner = g.w - 2 * (g.pad + g.panelPad);
  return (
    <GroundBox
      ground="app-dark"
      className="relative rounded-lg"
      style={{ width: g.w, padding: g.pad }}
    >
      <div inert aria-hidden className="relative">
        <Card
          className={cn(
            "gap-0 overflow-visible py-0",
            !s.outline && "ring-0",
            !s.surface && "bg-background",
          )}
          style={{ padding: g.panelPad }}
        >
          <div
            className="flex items-center justify-between"
            style={{ height: g.head }}
          >
            <p className="text-sm font-medium">Your events</p>
            <Button
              variant="outline"
              size="sm"
              // Both spellings: the outline variant re-states its border under
              // `dark:`, which a bare class does not replace.
              className={cn(
                !s.outline && "border-transparent dark:border-transparent",
              )}
            >
              Newest first
              <ChevronDown aria-hidden />
            </Button>
          </div>

          <div
            className="relative"
            style={{ marginTop: g.gap, height: g.by + cardH }}
          >
            {/* The back card: both shadows land on this photograph. */}
            <div
              className="absolute"
              style={{
                left: g.bx,
                top: g.by,
                width: g.card,
                borderRadius: "var(--radius-tile)",
              }}
              data-lgt-cue={lifts(s) ? "lift" : undefined}
            >
              <EventCard
                href={null}
                name="The Ridgeway summer"
                coverUrl={marketingImage("reception-table").src}
                dateLabel="2 August"
                itemsLabel="96 items"
                statusLabel={size === "stage" ? "Open" : null}
              />
            </div>

            {/* The front card, ABOVE and over it, so its shadow has somewhere
                to fall. */}
            <div
              className="absolute z-10"
              style={{
                left: 0,
                top: 0,
                width: g.card,
                borderRadius: "var(--radius-tile)",
              }}
              data-lgt-cue={lifts(s) ? "lift" : undefined}
            >
              <EventCard
                href={null}
                name="Sam and Priya"
                coverUrl={marketingImage("wedding-rings").src}
                dateLabel="14 June"
                itemsLabel="238 items"
                statusLabel={size === "stage" ? "Open" : null}
              />
            </div>

            {/* The open menu: DropdownMenuContent's own surface, in place. */}
            <div
              className={cn(
                "absolute z-30 rounded-float p-1 text-popover-foreground",
                s.surface ? "bg-popover" : "bg-background",
                s.outline && "ring-1 ring-foreground/10",
              )}
              style={{ right: 0, top: 4 - g.gap, width: g.menu }}
              data-lgt-cue={floats(s) ? "float" : undefined}
            >
              {g.rows.map((row, i) => (
                <div
                  key={row}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm",
                    i === 0 && "bg-accent text-accent-foreground",
                  )}
                >
                  <span className="flex-1 truncate">{row}</span>
                  {i === 0 ? <Check aria-hidden className="size-4" /> : null}
                </div>
              ))}
            </div>

            {/* On the bare panel beside the overlap, never on a photograph: a
                dot over the shadow it points at would hide the evidence. */}
            {markers ? (
              <Marker n={3} style={{ left: g.bx - 24, top: cardH + 18 }} />
            ) : null}
          </div>
        </Card>

        {markers ? (
          <>
            <Marker n={1} style={{ left: 12, bottom: 12 }} />
            <Marker n={2} style={{ left: inner / 3, top: -9 }} />
            <Marker n={4} style={{ right: -21, top: g.head + 56 }} />
          </>
        ) : null}
      </div>
    </GroundBox>
  );
}

/* ── The legend: which is which, and which are the question ─────────────── */

const ROWS: {
  n: number;
  name: string;
  yours: string;
  is: string;
  asked: boolean;
}[] = [
  {
    n: 1,
    name: "Lighter panel",
    yours: "the step",
    is: "A panel is one shade lighter than the page.",
    asked: false,
  },
  {
    n: 2,
    name: "Thin outline",
    yours: "the ring",
    is: "A hairline marks the edge of a panel, a button or a menu.",
    asked: false,
  },
  {
    n: 3,
    name: "Small shadow",
    yours: "lift",
    is: "Where one card sits on another.",
    asked: true,
  },
  {
    n: 4,
    name: "Larger shadow",
    yours: "float",
    is: "Under anything that floats over the page: a menu, a dialog, a toast.",
    asked: true,
  },
];

/**
 * ★ THE LEGEND IS THE ANSWER TO HIS QUESTION, SO IT IS WORDS BESIDE THE SCENE
 * AND NOT A FIFTH CARD. "A set of four options to choose from, or are we trying
 * to use everything": everything, one per height, never rivals. Each row says
 * whether it ships or is being asked, and what it is doing in the scene right
 * now, so pressing a tile or a switch reads back here in the same glance.
 */
function Legend({ s }: { s: DepthState }) {
  const now = (n: number) =>
    n === 1 ? s.surface : n === 2 ? s.outline : n === 3 ? lifts(s) : floats(s);
  return (
    <div className="max-w-md min-w-0 flex-1 basis-72">
      <p className="text-sm font-medium">How the four work together</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        They are not four options. Each does a different thing, and one screen
        uses all of them at once.
      </p>
      <ol className="mt-3 flex flex-col gap-2.5">
        {ROWS.map((r) => (
          <li key={r.n} className="flex items-start gap-2.5">
            <span
              aria-hidden
              className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] leading-none font-semibold text-background tabular-nums"
            >
              {r.n}
            </span>
            <span className="min-w-0 text-xs leading-relaxed">
              <span className="font-medium">{r.name}</span>{" "}
              <span className="text-muted-foreground">({r.yours})</span>
              <span className="block text-muted-foreground">{r.is}</span>
              <span className="block">
                {r.asked ? "The question." : "Ships everywhere today."}{" "}
                <span className="text-muted-foreground">
                  {now(r.n) ? "On in this picture." : "Off in this picture."}
                </span>
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Light mode keeps the shadows it has today and is not drawn.
      </p>
    </div>
  );
}

/** The section's evidence: the crop in a tile, the scene and its legend below. */
export function DepthStage({ s }: { s: DepthState }) {
  return (
    <div data-lgt-step="depth">
      <TileOnly>
        <TrueFit natural={GEO.tile.w}>
          <Scene size="tile" s={s} />
        </TrueFit>
      </TileOnly>
      <StageOnly>
        <div className="flex flex-wrap items-start gap-x-8 gap-y-5">
          {/* ★ THE FLEX ITEM OWNS THE WIDTH, NEVER THE FIT BOX. TrueFit sizes
              its child from the room it is given, so a box that took its width
              from that child would ratchet: shrink once, and the smaller child
              is then all the room it ever reports.
              The two compositions switch on the REAL window (board.css,
              section 3): the phone gets the crop, because a 760 pixel scene in
              a 343 pixel column is a thumbnail of the thing being judged. */}
          <div
            data-lgt-wide
            className="min-w-0"
            style={{ flex: `0 1 ${GEO.stage.w}px` }}
          >
            <TrueFit natural={GEO.stage.w}>
              <Scene size="stage" s={s} markers />
            </TrueFit>
          </div>
          <div data-lgt-narrow className="w-full">
            <TrueFit natural={GEO.tile.w}>
              <Scene size="tile" s={s} />
            </TrueFit>
          </div>
          <Legend s={s} />
        </div>
      </StageOnly>
    </div>
  );
}
