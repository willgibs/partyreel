"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Images, MoreHorizontal, Share2, SlidersHorizontal } from "lucide-react";

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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Toaster } from "@/components/ui/sonner";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { RUNGS, type Dim, type Scene as SceneId } from "./constants";

/**
 * THE SCENES (floating-surfaces, 2026-09-14). Everything here renders INSIDE a
 * frame document, never on the board page: a radix panel portals to
 * `globalThis.document.body`, so the only viewport that can hold one at 375 is
 * a document of its own (page.tsx is that document; frame.tsx mounts it).
 *
 * Every panel is the real primitive from src/components/ui/, untouched, with
 * two things added from the outside: `flt-panel`, the hook board.css needs to
 * reach a portalled node, and (on the ladders only) a per-rung candidate class.
 * Nothing here re-implements a primitive: if a candidate wins, the change lands
 * in components/ui in the wiring round, not here.
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
  /** `calm` is for the radius ladder only: a 6px corner against a 12px one is
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
              <Image
                src={PHOTOS[i % PHOTOS.length]}
                alt=""
                fill
                sizes="200px"
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

/** The anchored family, all of it open at once: this is the canvas rule 15 is
 *  actually about, because a stray one only reads wrong beside its siblings. */
function FamilyScene({ phone, rung }: { phone: boolean; rung?: string }) {
  const on = useReplay();
  const navOn = useNextFrame(on);
  const cls = cn("flt-panel", rung);
  return (
    <>
      <Backdrop phone={phone} />
      {/* The ninth primitive, and the one the contract was named for: the nav
          viewport was the single menu outside it in 2026-08-28. Desktop only,
          because the marketing header collapses to a drawer below md, and held
          open through the Root's controlled `value`. NavigationMenu renders its
          own viewport, so the panel hook goes through `viewportProps`. */}
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

/** The ninth primitive. Sonner is themed by CSS variables rather than by class
 *  (ui/sonner.tsx sets --border-radius from --radius-float), so the candidate
 *  reaches it the same way every other panel gets it: through the shared
 *  `flt-panel` hook, appended to the `cn-toast` class the house Toaster already
 *  sets rather than replacing it. */
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
 *  gets the bottom sheet, a host at 1440 gets the right one. */
function EdgeScene({
  phone,
  variant,
  rung,
}: {
  phone: boolean;
  variant: "sheet" | "drawer";
  rung?: string;
}) {
  const on = useReplay();
  const cls = cn("flt-panel", rung);
  return (
    <>
      <Backdrop phone={phone} />
      {variant === "sheet" ? (
        <Sheet open={on} modal={false}>
          <SheetContent
            className={cls}
            side={phone ? "bottom" : "right"}
            showCloseButton={false}
          >
            <SheetHeader>
              <SheetTitle>Filter the album</SheetTitle>
              <SheetDescription>
                Narrow the gallery down to what you are looking for.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-2 px-4 pb-6">
              {["Everything", "In the reel", "Hidden", "Liked"].map((r) => (
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
              <DrawerDescription>
                The vaul drawer, which no product surface calls yet.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col gap-2 px-4 pb-8">
              {["Everything", "In the reel", "Hidden"].map((r) => (
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

/** A ladder: the same panel, three rungs of one dimension, side by side in ONE
 *  frame. The rung rides the panel's own className, which is what lets three
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
                <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
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
          <SelectItem value="anyone">Anyone with the link</SelectItem>
          <SelectItem value="verified">Guests who verify an email</SelectItem>
          <SelectItem value="nobody">Nobody, uploads are closed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function Scene({
  scene,
  phone,
  dim,
  variant,
  rung,
}: {
  scene: SceneId;
  phone: boolean;
  dim: Dim;
  variant: "sheet" | "drawer";
  rung?: string;
}) {
  if (scene === "family") return <FamilyScene phone={phone} rung={rung} />;
  if (scene === "overlay") return <OverlayScene phone={phone} rung={rung} />;
  if (scene === "edge")
    return <EdgeScene phone={phone} variant={variant} rung={rung} />;
  if (scene === "ladder") return <LadderScene phone={phone} dim={dim} />;
  return <SelectScene rung={rung} />;
}
