"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  Check,
  Images,
  MoreHorizontal,
  Share2,
  SlidersHorizontal,
} from "lucide-react";

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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  RUNGS,
  type Dim,
  type Scene as SceneId,
  type Side,
} from "./constants";

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

/** The content a floating layer sits over. Bible 10 turns on the words "a layer
 *  over content", so no scene judges a panel against an empty ground: these are
 *  the real event photographs the marketing pages use. */
const PHOTOS = [
  "/marketing/img/mkt-wedding-toast-01.jpg",
  "/marketing/img/mkt-party-dj-01.jpg",
  "/marketing/img/mkt-festival-lights-01.jpg",
  "/marketing/img/mkt-wedding-petals-01.jpg",
  "/marketing/img/mkt-reception-table-01.jpg",
  "/marketing/img/mkt-concert-confetti-01.jpg",
  "/marketing/img/mkt-party-balloons-01.jpg",
  "/marketing/img/mkt-wedding-golden-01.jpg",
  "/marketing/img/mkt-festival-crowd-01.jpg",
];

function Backdrop({
  phone,
  variant = "photos",
  chrome = true,
}: {
  phone: boolean;
  /** `calm` is for the corner work only: a 6px corner against a 12px one is
   *  read at the corner itself, and a busy photograph behind it hides the very
   *  thing being judged. Every other scene keeps the photographs, because that
   *  is the condition bible 10 is written for. */
  variant?: "photos" | "calm";
  chrome?: boolean;
}) {
  const cols = phone ? 3 : 6;
  return (
    <div className="absolute inset-0 flex flex-col">
      {chrome ? (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold tracking-tight">Ana and Theo</p>
          <p className="text-xs text-muted-foreground">218 photos</p>
        </div>
      ) : null}
      {variant === "calm" ? (
        <div className="min-h-0 flex-1 bg-background" />
      ) : (
        <div
          className="grid min-h-0 flex-1 content-start"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gap: "var(--gap-gallery)",
            padding: "var(--gap-gallery)",
          }}
        >
          {Array.from({ length: cols * 8 }).map((_, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden bg-muted"
              style={{ borderRadius: "var(--radius-tile)" }}
            >
              {/* Eager, against the usual instinct. Every frame on this board
                  is an iframe, and a browser defers a LAZY image inside an
                  iframe that is off the parent's screen: scrolling down the
                  board met empty grids that filled a beat later, which is the
                  worst possible thing to happen to a comparison. The cost is
                  nothing: nine files, one optimized URL each, shared by all
                  nineteen frames through the HTTP cache. */}
              <Image
                src={PHOTOS[i % PHOTOS.length]}
                alt=""
                fill
                sizes="200px"
                loading="eager"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Closes every held-open panel and re-opens it a frame later, so an entrance
 *  can be replayed without hunting for triggers. The parent board fires
 *  `flt:replay` straight at this window: same origin, no postMessage dance. */
function useReplay(initial = true) {
  const [on, setOn] = useState(initial);
  useEffect(() => {
    const replay = () => {
      setOn(false);
      // A timer, not requestAnimationFrame: rAF does not fire while the tab is
      // in the background, and a board with several frames is exactly where a
      // panel would sit half-replayed on a tab nobody is looking at. Long
      // enough for radix to unmount the panel and the browser to paint the
      // closed state before the entrance starts again.
      window.setTimeout(() => setOn(true), 60);
    };
    window.addEventListener("flt:replay", replay);
    return () => window.removeEventListener("flt:replay", replay);
  }, []);
  return on;
}

/** Mirrors a flag one frame late. The nav viewport sizes itself from a
 *  ResizeObserver that radix only runs across a real open TRANSITION: a Root
 *  mounted already-open never measures, and the panel sits at 0x0 forever (the
 *  primitive's own comment describes the one-frame version of this). Every other
 *  panel is happy to be born open. */
function useNextFrame(on: boolean): boolean {
  // `ticked` only ever goes forward; the flag reads `on && ticked`, so a replay
  // closes the panel the moment `on` drops without a second state write.
  const [ticked, setTicked] = useState(false);
  useEffect(() => {
    if (!on) return;
    const id = window.setTimeout(() => setTicked(true), 32);
    return () => window.clearTimeout(id);
  }, [on]);
  return on && ticked;
}

const MENU_ROWS = [
  { label: "Share the link", icon: Share2 },
  { label: "Download all", icon: Images },
  { label: "Slideshow settings", icon: SlidersHorizontal },
];

const UPLOAD_CHOICES = [
  { value: "anyone", label: "Anyone with the link" },
  { value: "verified", label: "Guests who verify an email" },
  { value: "nobody", label: "Nobody, uploads are closed" },
];

/** The anchored family, all of it open at once: this is the canvas rule 15 is
 *  actually about, because a stray one only reads wrong beside its siblings. */
function FamilyScene({ phone, rung }: { phone: boolean; rung?: string }) {
  const on = useReplay();
  const navOn = useNextFrame(on);
  const cls = cn("flt-panel", rung);
  return (
    <>
      <Backdrop phone={phone} />
      {/* The nav viewport, the one the contract was named for: the single menu
          outside it in 2026-08-28. Desktop only, because the marketing header
          collapses to a sheet below md, and held open through the Root's
          controlled `value`. NavigationMenu renders its own viewport, so the
          panel hook goes through `viewportProps`. */}
      {!phone ? (
        <div className="absolute inset-x-0 top-0 z-30 flex justify-center pt-2">
          <NavigationMenu
            value={navOn ? "features" : ""}
            onValueChange={() => undefined}
            viewportProps={{ className: cls }}
          >
            <NavigationMenuList>
              <NavigationMenuItem value="features">
                <NavigationMenuTrigger>Features</NavigationMenuTrigger>
                <NavigationMenuContent>
                  {/* An inline width, not an arbitrary utility: the viewport
                      sizes itself from a ResizeObserver on this content, and a
                      class that fails to compile leaves the panel at 0x0 with
                      nothing to see. */}
                  <div
                    className="grid grid-cols-2 gap-1 p-2"
                    style={{ width: 420 }}
                  >
                    {[
                      "One QR code",
                      "No app, no account",
                      "The host reviews",
                      "The reel",
                    ].map((l) => (
                      <NavigationMenuLink key={l}>{l}</NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      ) : null}
      <div
        className={cn(
          "absolute inset-x-0 flex px-4",
          phone ? "top-14 flex-col gap-40" : "top-52 justify-between",
        )}
      >
        <DropdownMenu open={on} modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              <MoreHorizontal />
              Event
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={cn(cls, "w-52")} align="start">
            <DropdownMenuLabel>This event</DropdownMenuLabel>
            {MENU_ROWS.map((r) => (
              <DropdownMenuItem key={r.label}>
                <r.icon />
                {r.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              Delete the event
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <TooltipProvider>
          <Tooltip open={on}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Bell />
                <span className="sr-only">Alerts</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className={cls} side={phone ? "bottom" : "top"}>
              Guests can still upload
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Popover open={on} modal={false}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Who can see this
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className={cn(cls, "w-60")}
            align={phone ? "start" : "end"}
            side="bottom"
          >
            <p className="text-sm font-medium">Anyone with the link</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Guests upload without an account. You approve what appears in the
              album.
            </p>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}

/** The covering family: a dialog over the scrim, with a toast in the corner.
 *  The toast is the real sonner surface, rendered through its own class hook so
 *  the same candidate reaches it. */
function OverlayScene({ phone, rung }: { phone: boolean; rung?: string }) {
  const on = useReplay();
  const cls = cn("flt-panel", rung);
  return (
    <>
      <Backdrop phone={phone} />
      {/* THE SCRIM IS A STAND-IN, and it has to be. Radix renders Dialog.Overlay
          only in MODAL mode, and a modal dialog traps focus, which in a board of
          nineteen iframes means the first frame to mount pulls the lab page to
          itself. So the scene paints the overlay's own rectangle
          (`bg-black/10` plus the backdrop blur, dialog.tsx:42) and keeps the
          dialog non-modal. It is the scrim's look, never its behaviour: the
          light question is about what the panel does over a dimmed page, and
          without this the dialog would be judged over bare photographs. */}
      {on ? (
        <div
          data-flt-scrim
          className="fixed inset-0 isolate z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
        />
      ) : null}
      <Dialog open={on} modal={false}>
        <DialogContent className={cls} showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete this event</DialogTitle>
            <DialogDescription>
              Every photo and video goes with it, for you and for your guests.
              This cannot be undone.
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
      <Toast on={on} rung={rung} />
    </>
  );
}

/** Sonner is themed by CSS variables rather than by class (ui/sonner.tsx sets
 *  --border-radius from --radius-float), so the candidate reaches it the same
 *  way every other panel does: through the `cn-toast` class the house Toaster
 *  already sets, which the generated block names directly. */
function Toast({ on, rung }: { on: boolean; rung?: string }) {
  useEffect(() => {
    if (!on) return;
    // The NEUTRAL toast on purpose. A state toast (success, warning, error)
    // paints its own background through an !important rule in globals.css, so
    // it would answer the light question with a colour instead of with the
    // popover surface. The state variants are a carve-out for the ruling to
    // note, not the surface the contract is about.
    const id = toast("Link copied", {
      description: "Anyone with it can upload to the album.",
      duration: Number.POSITIVE_INFINITY,
    });
    return () => {
      toast.dismiss(id);
    };
  }, [on]);
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{ classNames: { toast: cn("cn-toast flt-panel", rung) } }}
    />
  );
}

/** The edge family. The side is the real one for the width: a guest on a phone
 *  gets the bottom sheet, a host at 1440 gets the right one. `compact` is the
 *  corner strip's variant: a short body, so the two corners that stay on screen
 *  sit inside a 260-tall canvas and can be read at 1:1. */
function EdgeScene({
  phone,
  variant,
  side,
  rung,
  compact = false,
}: {
  phone: boolean;
  variant: "sheet" | "drawer";
  side?: Side;
  rung?: string;
  compact?: boolean;
}) {
  const on = useReplay();
  const cls = cn("flt-panel", rung);
  // The default is the real side for the width; `side` names the product's own
  // call site where it differs (the marketing mobile menu enters from the top).
  const edge: Side = side ?? (phone ? "bottom" : "right");
  const rows = compact
    ? ["Everything"]
    : ["Everything", "In the reel", "Hidden", "Liked"];
  return (
    <>
      <Backdrop phone={phone} chrome={!compact} variant="photos" />
      {variant === "sheet" ? (
        <Sheet open={on} modal={false}>
          <SheetContent
            className={cls}
            side={edge}
            showCloseButton={false}
          >
            <SheetHeader>
              <SheetTitle>Filter the album</SheetTitle>
              {compact ? null : (
                <SheetDescription>
                  Narrow the gallery down to what you are looking for.
                </SheetDescription>
              )}
            </SheetHeader>
            <div className="flex flex-col gap-2 px-4 pb-6">
              {rows.map((r) => (
                <div
                  key={r}
                  data-slot="sheet-row-item"
                  className="flex items-center justify-between bg-muted/50 px-3 py-2 text-sm"
                  style={{ borderRadius: "var(--flt-r-item, var(--radius-md))" }}
                >
                  {r}
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Drawer open={on} modal={false}>
          <DrawerContent className={cls}>
            <DrawerHeader>
              <DrawerTitle>Filter the album</DrawerTitle>
              {compact ? null : (
                <DrawerDescription>
                  The vaul drawer, which no product surface calls through
                  ui/drawer.tsx.
                </DrawerDescription>
              )}
            </DrawerHeader>
            <div className="flex flex-col gap-2 px-4 pb-8">
              {rows.map((r) => (
                <div
                  key={r}
                  className="bg-muted/50 px-3 py-2 text-sm"
                  style={{ borderRadius: "var(--flt-r-item, var(--radius-md))" }}
                >
                  {r}
                </div>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}

/** THE GUEST'S SURFACE, the real one. EntryShell is the tenth floating layer
 *  and the first thing a guest sees after the QR: a raw vaul drawer below 640
 *  (a real drag handle, keyboard repositioning), the centred Dialog above it.
 *  Rendered here as itself, so a rung either reaches it or is shown not to. */
function GuestScene({ phone, rung }: { phone: boolean; rung?: string }) {
  const on = useReplay();
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

/** A ladder: the same panel, every rung of one dimension, side by side in ONE
 *  frame. The rung rides the panel's own className, which is what lets four
 *  answers share a document. */
function LadderScene({ phone, dim }: { phone: boolean; dim: Dim }) {
  const on = useReplay();
  const rungs = RUNGS[dim];
  return (
    <>
      <Backdrop
        phone={phone}
        chrome={false}
        variant={dim === "radius" ? "calm" : "photos"}
      />
      {/* Two columns on the phone canvas rather than one: a held-open menu is
          ~150px tall, so four rungs stacked would not fit 760 and the rungs
          would cover each other instead of standing beside each other. */}
      <div
        className="absolute inset-0 grid items-start gap-3 p-3"
        style={{
          gridTemplateColumns: `repeat(${phone ? 2 : rungs.length}, minmax(0,1fr))`,
        }}
      >
        {rungs.map((rung) => (
          <div key={rung.label} className="flex flex-col items-start gap-1.5">
            <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[11px] font-medium text-background">
              {rung.label}
            </span>
            <DropdownMenu open={on} modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  Event
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className={cn("flt-panel", phone ? "w-40" : "w-48", rung.id)}
                align="start"
                side="bottom"
                sideOffset={4}
                avoidCollisions={false}
              >
                {/* The FIRST row wears the highlight at rest. The thing the
                    radius ladder is actually about is whether the highlighted
                    row's corner nests inside the panel's corner (bible 9), and
                    with no row highlighted the item radius is invisible: this
                    is the resting `focus:bg-accent` state, held. */}
                {MENU_ROWS.slice(0, phone ? 2 : 3).map((r, i) => (
                  <DropdownMenuItem
                    key={r.label}
                    className={
                      i === 0 ? "bg-accent text-accent-foreground" : undefined
                    }
                  >
                    {r.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
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
        width={LOUPE_W}
        height={LOUPE_H}
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
      <p className="text-[11px] tabular-nums">
        panel {panel.toFixed(1)} · padding {pad.toFixed(1)} · row{" "}
        {item.toFixed(1)}
      </p>
      <p
        className="text-[11px] font-medium"
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
  const on = useReplay();
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
  const on = useReplay();
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
        <DialogContent className={cn(cls, "flt-trio-dialog")} showCloseButton={false}>
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

/** The select outlier, alone because radix's select is the one panel that keeps
 *  a modal grip on the document: two of them cannot stand open side by side, so
 *  the comparison is two frames rather than two panels. */
function SelectScene({ rung }: { rung?: string }) {
  const on = useReplay();
  return (
    <div className="absolute inset-0 flex items-start justify-center bg-background p-6">
      <Select open={on}>
        <SelectTrigger className="w-52" size="sm">
          <SelectValue placeholder="Who can upload" />
        </SelectTrigger>
        <SelectContent className={cn("flt-panel", rung)} position="popper">
          {UPLOAD_CHOICES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** What replaces the select if it is dropped: the dropdown menu it already
 *  duplicates, with radio items. Same rows, same surface, one primitive fewer,
 *  and it is already on the contract. The trigger is a real Button rather than
 *  a SelectTrigger, which is the honest cost of the drop: the field loses the
 *  input chrome and has to look like a control on its own. */
function RadioScene({ rung }: { rung?: string }) {
  const on = useReplay();
  const [value, setValue] = useState("anyone");
  return (
    <div className="absolute inset-0 flex items-start justify-center bg-background p-6">
      <DropdownMenu open={on} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-52 justify-between font-normal"
          >
            {UPLOAD_CHOICES.find((c) => c.value === value)?.label}
            <Check className="opacity-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn("flt-panel w-52", rung)}
          align="start"
          sideOffset={4}
        >
          <DropdownMenuRadioGroup value={value} onValueChange={setValue}>
            {UPLOAD_CHOICES.map((c) => (
              <DropdownMenuRadioItem key={c.value} value={c.value}>
                {c.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function Scene({
  scene,
  phone,
  dim,
  variant,
  side,
  rung,
  compact,
}: {
  scene: SceneId;
  phone: boolean;
  dim: Dim;
  variant: "sheet" | "drawer";
  side?: Side;
  rung?: string;
  compact?: boolean;
}) {
  if (scene === "family") return <FamilyScene phone={phone} rung={rung} />;
  if (scene === "overlay") return <OverlayScene phone={phone} rung={rung} />;
  if (scene === "edge")
    return (
      <EdgeScene
        phone={phone}
        variant={variant}
        side={side}
        rung={rung}
        compact={compact}
      />
    );
  if (scene === "guest") return <GuestScene phone={phone} rung={rung} />;
  if (scene === "ladder") return <LadderScene phone={phone} dim={dim} />;
  if (scene === "nest") return <NestScene rung={rung} />;
  if (scene === "trio") return <TrioScene rung={rung} />;
  if (scene === "radio") return <RadioScene rung={rung} />;
  return <SelectScene rung={rung} />;
}
