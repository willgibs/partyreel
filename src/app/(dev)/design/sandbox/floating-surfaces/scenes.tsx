"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { EntryShell } from "@/components/guest/entry-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { type Scene as SceneId, type Sub } from "./constants";
import { DirectionScene } from "./direction-scenes";
import type { Direction } from "./directions";
import { Backdrop, useSceneReplay } from "./stage-bits";

/**
 * THE SCENES (floating-surfaces, round two). Everything here renders INSIDE a
 * frame document, never on the board page: a radix panel portals to
 * `globalThis.document.body`, so the only viewport that can hold one at 375 is
 * a document of its own (page.tsx is that document; frame.tsx mounts it).
 *
 * Every panel is the real primitive, untouched, with two things added from the
 * outside: `flt-panel`, the hook the frame's cover uses, and (on a ladder) the
 * per-rung candidate class the generated block in candidates.ts matches. No
 * scene re-implements a primitive: if a candidate wins, the change lands in
 * components/ui in the wiring round, not here.
 *
 * Round two added the tenth surface. guest/entry-shell.tsx renders a RAW vaul
 * drawer, outside ui/drawer.tsx, and it is the floating surface most people on
 * this product will ever see: every guest who scans a QR meets it before they
 * see anything else. It is rendered here as itself, the real component, because
 * a contract that does not reach it is not a contract.
 *
 * Panels are held OPEN rather than clicked open, and every one that would trap
 * focus runs `modal={false}`, so a whole family can stand on one canvas at once
 * and be compared. `flt:replay` on the frame window closes them and re-opens
 * them a frame later, which is how the entrance is watched.
 */

/** The rows the measuring scenes hold: short enough that the corner, not the
 *  copy, is what a reader is looking at. The scenes that judge a LAYER use the
 *  real menu models in menus.tsx instead. */
const MENU_ROWS = [
  { label: "Share the link" },
  { label: "Download all" },
  { label: "Slideshow settings" },
];

/** THE GUEST'S SURFACE, the real one. EntryShell is the tenth floating layer
 *  and the first thing a guest sees after the QR: a raw vaul drawer below 640
 *  (a real drag handle, keyboard repositioning), the centred Dialog above it.
 *  Rendered here as itself, so a rung either reaches it or is shown not to. */
function GuestScene({ phone, rung }: { phone: boolean; rung?: string }) {
  const on = useSceneReplay();
  return (
    <>
      <Backdrop phone={phone} />
      {/* The rung cannot ride a className here: EntryShell owns its Content and
          takes no class. That is the point of the specimen. The generated block
          reaches it by [data-entry-drawer], the attribute the component already
          sets, which is exactly how the site-wide paste reaches it too. */}
      <div data-flt-rung={rung || undefined}>
        <EntryShell
          open={on}
          dismissMode="free"
          onDismiss={() => undefined}
          title="Join the album"
          description="Add your photos to Ana and Theo"
        >
          <div className="flex flex-col gap-4 pt-1">
            <div>
              <p className="text-base font-semibold tracking-tight">
                You are at Ana and Theo
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add the photos you took. No app, no account.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="flt-guest-name"
                className="text-xs font-medium text-muted-foreground"
              >
                Your name
              </label>
              <Input id="flt-guest-name" placeholder="So the host knows" />
            </div>
            <Button className="w-full">Continue</Button>
          </div>
        </EntryShell>
      </div>
    </>
  );
}

type Corner = { panel: number; pad: number; item: number };

/** Reads the corner off the LIVE panel rather than repeating the arithmetic in
 *  a caption. Round one asserted the rule-9 miss in prose and a reader had to
 *  take it on trust; these three numbers come out of getComputedStyle on the
 *  real primitive, so a rung that claims to nest is checked by the board that
 *  proposes it, and a later retune of --radius-float shows up here by itself.
 *
 *  A timeout rather than requestAnimationFrame: rAF does not run on a hidden
 *  tab, and every frame on this board is one tab away from being hidden. */
function useCorner(on: boolean): Corner | null {
  const [corner, setCorner] = useState<Corner | null>(null);
  useEffect(() => {
    // No synchronous clear on the way out: the caller hides the loupe while the
    // panel is closed, so a setState inside the effect body would only buy a
    // cascading render for a value nobody reads.
    if (!on) return;
    let tries = 0;
    let id = 0;
    const read = () => {
      const panel = document.querySelector<HTMLElement>(
        '[data-slot="dropdown-menu-content"]',
      );
      const item = panel?.querySelector<HTMLElement>(
        '[data-slot="dropdown-menu-item"]',
      );
      if (!panel || !item) {
        if (tries++ < 20) id = window.setTimeout(read, 50);
        return;
      }
      const p = getComputedStyle(panel);
      const i = getComputedStyle(item);
      setCorner({
        panel: parseFloat(p.borderTopLeftRadius) || 0,
        pad: parseFloat(p.paddingTop) || 0,
        item: parseFloat(i.borderTopLeftRadius) || 0,
      });
    };
    id = window.setTimeout(read, 80);
    return () => window.clearTimeout(id);
  }, [on]);
  return corner;
}

const K = 6; // the loupe's magnification
const LOUPE_W = 200;
const LOUPE_H = 118;
const OX = 12;
const OY = 12;
/**
 * ★ THE DRAWING IS SCALED, THE MAGNIFICATION IS NOT (round seven). The corner
 * is now an option TILE as well as a stage: a tile is the section zoom-fitted
 * to a third of the column (step.tsx), so a 200px loupe arrived there about 75
 * pixels wide and three corners that differ by four pixels were three identical
 * grey smudges. The viewBox is untouched and only the drawn size moves, so the
 * arithmetic, the 6x and the caption all still say the same thing; what changes
 * is that the dashed arc and the row's arc are far enough apart to SEE at the
 * size the review looks at them.
 */
const LOUPE_SCALE = 2.5;

/** The corner at 1:1, then the same corner at 6x with the arithmetic drawn on
 *  it. The solid outer arc is the panel, the solid inner arc is the lit row,
 *  and the dashed arc is where the row's corner has to sit for the two to share
 *  a centre (bible 9: the container is the object plus its offset). When the
 *  dashed arc and the row's arc are the same line, the rung nests. */
function Loupe({ corner }: { corner: Corner | null }) {
  if (!corner) return null;
  const { panel, pad, item } = corner;
  const needs = Math.max(0, panel - pad);
  const nests = Math.abs(item - needs) < 0.5;
  const ix = OX + pad * K;
  const iy = OY + pad * K;
  const END = 132;
  /** A corner: the vertical run up into the arc, the arc, then the run right. */
  const cornerPath = (r: number, ox: number, oy: number, bottom: number) =>
    `M ${ox} ${bottom} L ${ox} ${oy + r * K} A ${Math.max(r * K, 0.01)} ${Math.max(r * K, 0.01)} 0 0 1 ${ox + r * K} ${oy} L ${END} ${oy}`;
  return (
    <div className="flex flex-col gap-1">
      <svg
        width={LOUPE_W * LOUPE_SCALE}
        height={LOUPE_H * LOUPE_SCALE}
        viewBox={`0 0 ${LOUPE_W} ${LOUPE_H}`}
        aria-hidden
        className="overflow-visible"
      >
        {/* the panel */}
        <path
          d={cornerPath(panel, OX, OY, LOUPE_H - 4)}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.5}
          strokeWidth={1.5}
        />
        {/* the row, as it actually draws */}
        <path
          d={cornerPath(item, ix, iy, LOUPE_H - 16)}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        />
        {/* where the row has to be to share the panel's centre. Drawn LAST, on
            top, and in the GROUND's colour when it nests, so the dashes read as
            dashes lying along the solid line rather than disappearing into it.
            When it does not nest they are two different lines and the caption
            says by how much. */}
        <path
          d={cornerPath(needs, ix, iy, LOUPE_H - 16)}
          fill="none"
          stroke={nests ? "var(--background)" : "var(--destructive)"}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <text
          x={END + 6}
          y={OY + 3}
          fontSize={9}
          fill="currentColor"
          fillOpacity={0.5}
        >
          panel
        </text>
        <text
          x={END + 6}
          y={iy + 3}
          fontSize={9}
          fill="currentColor"
          fillOpacity={0.5}
        >
          row
        </text>
      </svg>
      <p className="text-sm tabular-nums">
        panel {panel.toFixed(1)} · padding {pad.toFixed(1)} · row{" "}
        {item.toFixed(1)}
      </p>
      <p
        className="text-sm font-medium"
        style={{ color: nests ? undefined : "var(--destructive)" }}
      >
        {nests
          ? `nests: the row is the panel minus its padding, ${needs.toFixed(1)}`
          : `does not nest: the row needs ${needs.toFixed(1)}, it draws ${item.toFixed(1)}`}
      </p>
    </div>
  );
}

/** ONE rung, at 1:1, with the loupe under it. Four of these side by side are
 *  the finding: today's panel is the only one where the dashed arc and the
 *  row's arc are different lines. */
function NestScene({ rung }: { rung?: string }) {
  const on = useSceneReplay();
  const corner = useCorner(on);
  return (
    <>
      <Backdrop phone={false} chrome={false} variant="calm" />
      <div className="absolute inset-x-4 top-3">
        <DropdownMenu open={on} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              Event
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={cn("flt-panel w-48", rung)}
            align="start"
            side="bottom"
            sideOffset={4}
            avoidCollisions={false}
          >
            {MENU_ROWS.map((r, i) => (
              <DropdownMenuItem
                key={r.label}
                className={
                  i === 0 ? "bg-accent text-accent-foreground" : undefined
                }
              >
                {r.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="absolute inset-x-4 bottom-3">
        <Loupe corner={on ? corner : null} />
      </div>
    </>
  );
}

/** The three primitives the entrance question is really about, on one canvas:
 *  the tooltip (the highest-frequency surface on the site), the menu (opened
 *  dozens of times in an evening) and the dialog (a decision). Rule 12 wants
 *  them on different clocks; rule 15 wants them on one. The scrim is hidden by
 *  board.css for this scene only, so all three entrances can be watched at
 *  once; the scrim's own fade is judged in the Overlays scene. */
function TrioScene({ rung }: { rung?: string }) {
  const on = useSceneReplay();
  const cls = cn("flt-panel", rung);
  return (
    <>
      <Backdrop phone={false} chrome={false} variant="calm" />
      <div className="absolute inset-y-0 left-6 flex w-52 items-center">
        <DropdownMenu open={on} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              Event
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={cn(cls, "w-48")} align="start">
            {MENU_ROWS.map((r) => (
              <DropdownMenuItem key={r.label}>{r.label}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="absolute inset-y-0 left-1/3 flex items-center">
        <TooltipProvider>
          <Tooltip open={on}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Bell />
                <span className="sr-only">Alerts</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className={cls} side="top">
              Guests can still upload
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Dialog open={on} modal={false}>
        <DialogContent
          className={cn(cls, "flt-trio-dialog")}
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle>Delete this event</DialogTitle>
            <DialogDescription>
              Every photo and video goes with it. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button variant="ghost" size="sm">
              Keep it
            </Button>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const DIRECTION_SCENES = ["desk", "pocket", "menu", "sub", "surfaces"] as const;

export function Scene({
  scene,
  direction,
  sub,
  phone,
  rung,
}: {
  scene: SceneId;
  /** Which floating layer this frame is rendering. The direction changes
   *  ANATOMY as well as material, so it is React state rather than a class, and
   *  the frame receives it by event so a switch never reloads. */
  direction: Direction;
  /** The nested branch, kept or deleted: anatomy too, so it travels the same way. */
  sub: Sub;
  phone: boolean;
  rung?: string;
}) {
  if ((DIRECTION_SCENES as readonly string[]).includes(scene)) {
    return (
      <DirectionScene
        scene={scene as (typeof DIRECTION_SCENES)[number]}
        direction={direction}
        sub={sub}
        phone={phone}
      />
    );
  }
  if (scene === "guest") return <GuestScene phone={phone} rung={rung} />;
  if (scene === "nest") return <NestScene rung={rung} />;
  return <TrioScene rung={rung} />;
}
