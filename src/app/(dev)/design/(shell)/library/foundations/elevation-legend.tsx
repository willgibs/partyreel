"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

/**
 * THE FOUR HEIGHTS ON ONE SCREEN, AND WHEN EACH IS REACHED FOR (Will's ruling on
 * the light board's depth step, 2026-09-17; the board retired into this).
 *
 * His question on round seven is why this is a legend and not four swatches:
 * "our step, ring, lift, and float: a set of four options to choose from, or are
 * we trying to use everything, and if so, how?" And his answer on round eight,
 * once they were drawn together: "I now see how step, ring, lift, and float work
 * together. Very good work." They are not rivals. Each does a different job at
 * a different height, one screen uses all four at once, and only the last two
 * are shadows. This scene is that board's, kept almost to the pixel, because
 * it is the drawing that made the system legible to the person who rules it.
 *
 * ★ THE FRONT CARD IS ABOVE AND OVER THE BACK ONE, BECAUSE A SHADOW FALLS DOWN.
 * His note on the first lift card was a bug report: "since the top card in the
 * stack is moved to a lower Y coordinate than the card below it, the shadows
 * don't actually stack at all." A shadow's offset is downward, so it can only
 * land on the card behind when the front card's BOTTOM edge crosses that card's
 * face. It does here, in the bright upper half of that photograph (an event
 * card darkens its own foot for its title, and a shadow over a dark gradient is
 * invisible), and the menu's bottom edge crosses the same photograph beside it,
 * so the two sizes sit side by side on one picture.
 *
 * ★ EVERYTHING HERE IS THE PRODUCTION THING. The panel is `Card`, the button is
 * `Button`, the two photographs are `EventCard`, and the two shadows are the
 * `shadow-lift` and `shadow-layer` utilities reading the live tokens, so this
 * flips with the theme and retunes with globals.css. The one drawing is the
 * menu: a radix portal leaves any wrapper a page paints, so it is
 * `DropdownMenuContent`'s own surface classes on a plain div.
 *
 * ★ THE OVERLAP IS STAGED, AND THE CAPTION SAYS SO. On the real dashboard the
 * event cards lie flat in a grid and take NO shadow; they are overlapped here
 * because an overlap is the only thing the small shadow is for, and a legend
 * that showed it under a flat card would teach the exact mistake the policy
 * (src/lib/elevation-policy.test.ts) exists to refuse.
 *
 * ★ TRUE PIXELS WHERE THERE IS ROOM, A FIT WHERE THERE IS NOT. An 8px blur
 * scaled to a third is a smudge nobody can judge, so the scene is laid out at
 * its real size and only zoomed down (a LAYOUT zoom, so the box around it still
 * measures a true height) when the column is narrower than the scene: a phone,
 * or one half of the specimen's light and dark split.
 */

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

/**
 * One composition at two sizes. ★ `by` AND THE MENU'S LENGTH ARE ONE DECISION:
 * the back card starts low enough that the front card's bottom edge crosses it
 * a quarter of the way down, and the menu is long enough that its own bottom
 * edge crosses the same photograph at about the same height. Both shadows then
 * fall in the bright band above the back card's title.
 */
const GEO: Record<"narrow" | "wide", Geo> = {
  narrow: {
    w: 412,
    pad: 10,
    panelPad: 12,
    head: 28,
    gap: 12,
    card: 220,
    bx: 96,
    by: 112,
    menu: 164,
    rows: [
      "Newest first",
      "Oldest first",
      "Most photos",
      "Most guests",
      "Name",
    ],
  },
  wide: {
    w: 760,
    pad: 24,
    panelPad: 20,
    head: 32,
    gap: 16,
    card: 340,
    bx: 230,
    by: 150,
    menu: 224,
    rows: [
      "Newest first",
      "Oldest first",
      "Recently updated",
      "Most photos",
      "Most guests",
      "Name",
      "Show closed events",
    ],
  },
};

/** Below this the narrow composition is the honest one: the wide scene at half
 *  size is a thumbnail of the thing being explained. */
const WIDE_FROM = 600;

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

function Scene({ size }: { size: "narrow" | "wide" }) {
  const g = GEO[size];
  const cardH = (g.card * 10) / 16;
  const inner = g.w - 2 * (g.pad + g.panelPad);
  // A row is 28px (text-sm's 20px line in py-1) and the menu pads 4px a side.
  const menuH = g.rows.length * 28 + 8;
  return (
    // The page (height zero). `bg-background`, so the panel's step is read
    // against the real ground of whichever theme the specimen is showing.
    <div
      className="relative rounded-lg bg-background"
      style={{ width: g.w, padding: g.pad }}
    >
      <div inert aria-hidden className="relative">
        {/* 1 and 2: the panel is the production Card, so its step (bg-card)
            and its ring (ring-1 ring-foreground/10) are exactly what ships. */}
        <Card
          className="gap-0 overflow-visible py-0"
          style={{ padding: g.panelPad }}
        >
          <div
            className="flex items-center justify-between"
            style={{ height: g.head }}
          >
            <p className="text-sm font-medium">Your events</p>
            <Button variant="outline" size="sm">
              Newest first
              <ChevronDown aria-hidden />
            </Button>
          </div>

          <div
            className="relative"
            style={{ marginTop: g.gap, height: g.by + cardH }}
          >
            {/* The back card: both shadows land on this photograph. The
                wrapper wears the card's own radius class (EventCard rounds its
                cover with rounded-xl), so the shadow has the card's corner
                and not a square box's. */}
            <div
              className="absolute rounded-xl shadow-lift"
              style={{ left: g.bx, top: g.by, width: g.card }}
            >
              <EventCard
                href={null}
                name="The Ridgeway summer"
                coverUrl={marketingImage("reception-table").src}
                dateLabel="2 August"
                itemsLabel="96 items"
                statusLabel={size === "wide" ? "Open" : null}
              />
            </div>

            {/* 3: the front card, ABOVE and over it, so its shadow has
                somewhere to fall. */}
            <div
              className="absolute z-10 rounded-xl shadow-lift"
              style={{ left: 0, top: 0, width: g.card }}
            >
              <EventCard
                href={null}
                name="Sam and Priya"
                coverUrl={marketingImage("wedding-rings").src}
                dateLabel="14 June"
                itemsLabel="238 items"
                statusLabel={size === "wide" ? "Open" : null}
              />
            </div>

            {/* 4: the open menu, DropdownMenuContent's own surface in place. */}
            <div
              className="absolute z-30 rounded-float bg-popover p-1 text-popover-foreground shadow-layer ring-1 ring-foreground/10"
              style={{ right: 0, top: 4 - g.gap, width: g.menu }}
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
            <Marker n={3} style={{ left: g.bx - 24, top: cardH + 18 }} />
            {/* The narrow scene has no margin to hang a dot in (its page is a
                10px rim, and the room clips), so the menu's dot sits on the
                bare strip under the menu's right end instead. */}
            {size === "narrow" ? (
              <Marker n={4} style={{ right: 6, top: 4 - g.gap + menuH + 10 }} />
            ) : null}
          </div>
        </Card>

        <Marker n={1} style={{ left: 12, bottom: 12 }} />
        <Marker n={2} style={{ left: inner / 3, top: -9 }} />
        {size === "wide" ? (
          <Marker n={4} style={{ right: -21, top: g.head + 56 }} />
        ) : null}
      </div>
    </div>
  );
}

/* ── The legend: which is which, and when each is reached for ───────────── */

const ROWS: {
  n: number;
  name: string;
  yours: string;
  hint: string;
  when: string;
  /** The live token the row prints, read off the scene's own ground. */
  token?: "--shadow-lift" | "--shadow-layer";
}[] = [
  {
    n: 1,
    name: "The lighter panel",
    yours: "the step",
    hint: "bg-card",
    when: "Reached for first. A panel is a shade lighter than the page it sits on, so closer reads as lighter. On a light page the page is already the brightest thing, so the step is a hair and the outline carries the edge.",
  },
  {
    n: 2,
    name: "The thin outline",
    yours: "the ring",
    hint: "ring-1 ring-foreground/10",
    when: "Reached for on every surface. One hairline marks where a panel, a button or a menu ends.",
  },
  {
    n: 3,
    name: "The small shadow",
    yours: "lift",
    hint: "shadow-lift",
    when: "Reached for only where one object really overlaps another of its own lightness: stacked photographs, a print deck, a card laid across a seam.",
    token: "--shadow-lift",
  },
  {
    n: 4,
    name: "The larger shadow",
    yours: "layer",
    hint: "shadow-layer",
    when: "Reached for under anything the page keeps living behind: a menu, a dialog, a sheet, a toast, a bar floating over the gallery.",
    token: "--shadow-layer",
  },
];

export function ElevationLegend() {
  const room = useRef<HTMLDivElement | null>(null);
  const [fit, setFit] = useState<{ size: "narrow" | "wide"; k: number }>({
    size: "narrow",
    k: 1,
  });
  const [tokens, setTokens] = useState<Record<string, string>>({});

  useEffect(() => {
    const el = room.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const size = w >= WIDE_FROM ? "wide" : "narrow";
      // A hair of tolerance, or a sub-pixel width starts a measure and render
      // loop between this box and the column measuring it.
      const k = Math.min(1, Math.floor((w / GEO[size].w) * 1000) / 1000);
      setFit((now) => (now.size === size && now.k === k ? now : { size, k }));
      // Read off THIS element, not the root: in the specimen's split the two
      // panes are two grounds, and each prints its own ramp.
      const style = getComputedStyle(el);
      setTokens({
        "--shadow-lift": style.getPropertyValue("--shadow-lift").trim(),
        "--shadow-layer": style.getPropertyValue("--shadow-layer").trim(),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // The theme toggle flips a class on <html>, which no ResizeObserver sees.
    const mo = new MutationObserver(measure);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  const g = GEO[fit.size];
  return (
    <div className="flex flex-col gap-6">
      {/* ★ THIS BOX OWNS THE WIDTH, NEVER THE SCENE. The scene is sized from
          the room this box is given, so a box that took its width from the
          scene would ratchet: shrink once, and the smaller scene is then all
          the room it ever reports. `overflow-hidden` is for the one frame
          before the first measure, when a phone still holds the unfitted
          scene. */}
      <div
        ref={room}
        className="w-full min-w-0 overflow-hidden"
        style={{ maxWidth: GEO.wide.w }}
      >
        <div style={{ width: g.w, zoom: fit.k === 1 ? undefined : fit.k }}>
          <Scene size={fit.size} />
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium">Four heights, one screen</p>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          They are not four options. Each does a different job, one screen uses
          all of them at once, and only the last two are shadows.
        </p>
        {/* auto-fit, not a breakpoint: in the specimen's split each pane is
            half the column on a full-width window, so the column count has to
            follow the pane and not the viewport. */}
        <ol className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,19rem),1fr))] gap-x-8 gap-y-4">
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
                <span className="text-muted-foreground">
                  ({r.yours}) · {r.hint}
                </span>
                <span className="block text-muted-foreground">{r.when}</span>
                {r.token && tokens[r.token] ? (
                  <span className="block break-words text-faint tabular-nums">
                    {tokens[r.token]}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          A surface lying flat takes neither shadow, in either mode. The two
          cards overlap here to show the small one; on the dashboard they lie
          flat in a grid and take none.
        </p>
      </div>
    </div>
  );
}
