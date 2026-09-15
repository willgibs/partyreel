"use client";

import {
  Bell,
  ChevronDown,
  CornerDownLeft,
  Globe,
  Lock,
  MailCheck,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Kbd } from "@/components/shared/kbd";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
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
import { Toaster } from "@/components/ui/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { Direction } from "./directions";
import {
  ACCOUNT_MENU,
  CommandBody,
  EVENT_MENU,
  HeaderPanelBody,
  MenuPanel,
} from "./menus";
import { Backdrop, useNextFrame, useSceneReplay } from "./stage-bits";

/**
 * THE DIRECTION SCENES (round four, 2026-09-15).
 *
 * Will's note moved this board from tuning today's primitives to designing
 * what the floating layer should be: "I prefer to use this track to explore new
 * dropdown menu designs and variants of our existing floating surfaces". So
 * these scenes put each direction on the surfaces a person actually meets,
 * whole rather than as specimens, which is the other half of the note ("I'd
 * love to see more UI examples for comparison, especially if they can be live
 * production components").
 *
 * Every panel here is the real primitive with a direction's anatomy composed
 * on it (menus.tsx), on a real ground, in a frame laid out at true pixels.
 * The ANATOMY is React; the material, the radius and the motion are the CSS the
 * frame renders and "Apply to the site" pastes (directions.ts).
 */

/** The host's own chrome, so a menu is judged on a page rather than on a card.
 *  Not the production header (that is a marketing component with its own nav);
 *  this is the dashboard bar the app actually draws, at the sizes it draws it. */
function AppBar({
  direction,
  navOn,
  accountOn,
  phone = false,
}: {
  direction: Direction;
  navOn: boolean;
  accountOn: boolean;
  phone?: boolean;
}) {
  return (
    <div className="absolute inset-x-0 top-0 z-40 grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
      <p className="text-sm font-semibold tracking-tight">Partyreel</p>
      {/* The nav sits in the CENTRE column, which is not decoration: radix
          centres the viewport under the trigger list, so a nav pinned to the
          left edge hangs its panel off the canvas. The real marketing header
          centres it for the same reason, and a board that did not would be
          judging a layout the product does not ship. */}
      {!phone ? (
        <NavigationMenu
          value={navOn ? "features" : ""}
          onValueChange={() => undefined}
          viewportProps={{ className: "flt-panel" }}
        >
          <NavigationMenuList>
            <NavigationMenuItem value="features">
              <NavigationMenuTrigger>Features</NavigationMenuTrigger>
              <NavigationMenuContent>
                <HeaderPanelBody direction={direction} />
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      ) : (
        <span />
      )}
      <div className="justify-self-end">
        <MenuPanel
          direction={direction}
          model={ACCOUNT_MENU}
          open={accountOn}
          triggerLabel="Will"
          align="end"
          width={272}
        />
      </div>
    </div>
  );
}

/** THE HOST'S DESK at 1440: the three menus a host meets in a session, open at
 *  once on the ground they open over. This is the canvas rule 15 is about, and
 *  it is where a direction either reads as one language or does not. */
function DeskScene({ direction }: { direction: Direction }) {
  const on = useSceneReplay();
  const navOn = useNextFrame(on);
  return (
    <>
      <Backdrop phone={false} chrome={false} />
      <AppBar direction={direction} navOn={navOn} accountOn={on} />
      {/* Each panel gets its own room on the canvas. The header's viewport is
          201px tall under a 56px bar, so an event menu at 160 would open
          underneath it and the comparison would be of two panels overlapping
          rather than of a direction. */}
      <div className="absolute top-80 left-8">
        <MenuPanel
          direction={direction}
          model={EVENT_MENU}
          open={on}
          triggerLabel="Event"
          triggerIcon={MoreHorizontal}
          width={276}
        />
      </div>
      <div className="absolute top-[420px] right-10">
        <TooltipProvider>
          <Tooltip open={on}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Bell />
                <span className="sr-only">Alerts</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="flt-panel" side="left">
              Guests can still upload
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
}

/** THE SAME HOST ON A PHONE. The direction has to answer 375 as well as 1440,
 *  and the command direction answers it differently on purpose: a field with no
 *  keyboard is a bottom sheet with big rows, which is the shape the model takes
 *  where most of this product's traffic lives. */
function PocketScene({ direction }: { direction: Direction }) {
  const on = useSceneReplay();
  return (
    <>
      <Backdrop phone chrome={false} />
      <AppBar direction={direction} navOn={false} accountOn={false} phone />
      {direction === "command" ? (
        <>
          <div className="absolute top-20 left-4">
            <Button variant="secondary" size="sm">
              <MoreHorizontal />
              Event
            </Button>
          </div>
          <Drawer open={on} modal={false}>
            <DrawerContent className="flt-panel">
              <DrawerTitle className="sr-only">Search this event</DrawerTitle>
              <div className="max-h-[62vh] overflow-hidden pb-4">
                <CommandBody model={EVENT_MENU} phone />
              </div>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <div className="absolute top-20 left-4">
          <MenuPanel
            direction={direction}
            model={EVENT_MENU}
            open={on}
            triggerLabel="Event"
            triggerIcon={MoreHorizontal}
            width={300}
          />
        </div>
      )}
    </>
  );
}

/** ONE MENU, ONE DIRECTION, on a calm ground: the frame the board stands four of
 *  side by side at 1:1 so the four answers can be read as four answers. */
function MenuScene({ direction }: { direction: Direction }) {
  const on = useSceneReplay();
  return (
    <>
      <Backdrop phone chrome={false} variant="calm" />
      <div className="absolute top-3 left-3">
        <MenuPanel
          direction={direction}
          model={EVENT_MENU}
          open={on}
          triggerLabel="Event"
          triggerIcon={MoreHorizontal}
          width={276}
        />
      </div>
    </>
  );
}

/** THE NESTED BRANCH, which is the surface Will named. Card and glass open a
 *  second panel; command has no submenu at all, so the same rows are a group in
 *  the one list and the field is how you reach them. The scene seeds the field
 *  with two letters rather than describing what typing would do. */
function SubScene({ direction }: { direction: Direction }) {
  const on = useSceneReplay();
  return (
    <>
      <Backdrop phone={false} chrome={false} variant="calm" />
      {direction === "command" ? (
        <div className="absolute top-3 left-3">
          <Popover open={on} modal={false}>
            <PopoverTrigger asChild>
              <Button variant="secondary" size="sm">
                <MoreHorizontal />
                Event
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="flt-panel overflow-hidden p-0"
              style={{ width: 320 }}
              align="start"
              sideOffset={6}
              avoidCollisions={false}
            >
              <CommandBody model={EVENT_MENU} initialQuery="up" />
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        <div className="absolute top-3 left-3">
          <MenuPanel
            direction={direction}
            model={EVENT_MENU}
            open={on}
            triggerLabel="Event"
            triggerIcon={MoreHorizontal}
            width={276}
            subOpen="who"
          />
        </div>
      )}
    </>
  );
}

/** THE COVERING FAMILY under a direction: the dialog over a scrim, the tooltip,
 *  and the real sonner toast. A direction that only answers the menu is half an
 *  answer, because a dialog and a toast are the same layer. */
function SurfacesScene({
  direction,
  phone,
}: {
  direction: Direction;
  phone: boolean;
}) {
  const on = useSceneReplay();
  return (
    <>
      <Backdrop phone chrome={false} />
      {/* The scrim is painted rather than rendered: radix only mounts
          Dialog.Overlay in MODAL mode, and a modal dialog in a board of frames
          pulls focus out of the page. Glass dims less and blurs more, because a
          pane that lets the room through cannot sit on a room that is gone. */}
      {on ? (
        <div
          data-flt-scrim
          className={cn(
            "fixed inset-0 isolate z-40",
            direction === "glass"
              ? "bg-black/5 supports-backdrop-filter:backdrop-blur-sm"
              : "bg-black/10 supports-backdrop-filter:backdrop-blur-xs",
          )}
        />
      ) : null}
      <Dialog open={on} modal={false}>
        <DialogContent className="flt-panel" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete this event</DialogTitle>
            <DialogDescription>
              Every photo and video goes with it, for you and for your guests.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row items-center justify-end gap-2">
            {direction === "command" ? (
              <span className="mr-auto inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Kbd>
                  <CornerDownLeft className="size-3" />
                </Kbd>
                to confirm
              </span>
            ) : null}
            <Button variant="ghost" size="sm">
              Keep it
            </Button>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="absolute right-6 bottom-28 z-30">
        <TooltipProvider>
          <Tooltip open={on}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Bell />
                <span className="sr-only">Alerts</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="flt-panel" side={phone ? "left" : "top"}>
              Guests can still upload
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <DirectionToast on={on} />
    </>
  );
}

/** Sonner is themed by CSS variables rather than by class, so a direction
 *  reaches it through the `cn-toast` class the house Toaster already sets, which
 *  every generated block names. The neutral toast on purpose: a state toast
 *  paints its own background through an !important rule in globals.css and
 *  would answer the material question with a colour. */
function DirectionToast({ on }: { on: boolean }) {
  useEffect(() => {
    if (!on) return;
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
      position="bottom-center"
      toastOptions={{ classNames: { toast: "cn-toast flt-panel" } }}
    />
  );
}

const UPLOAD_CHOICES = [
  { value: "anyone", label: "Anyone with the link", icon: Globe },
  { value: "verified", label: "Guests who verify an email", icon: MailCheck },
  { value: "nobody", label: "Nobody, uploads are closed", icon: Lock },
];

/** THE FIELD. A select is a floating surface too, and the directions disagree
 *  about it more than about anything else: card and glass restyle the listbox,
 *  command replaces it with a searchable list, which is the same argument the
 *  submenu row makes, one level down. */
function FieldScene({ direction }: { direction: Direction }) {
  const on = useSceneReplay();
  const [value, setValue] = useState("anyone");
  return (
    <div className="absolute inset-0 flex flex-col gap-3 bg-background p-6">
      <p className="text-xs text-muted-foreground">Who can upload</p>
      {direction === "command" ? (
        <Popover open={on} modal={false}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-60 justify-between font-normal"
            >
              <span className="inline-flex items-center gap-2">
                <Search className="size-3.5 opacity-50" />
                {UPLOAD_CHOICES.find((c) => c.value === value)?.label}
              </span>
              <ChevronDown className="opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="flt-panel overflow-hidden p-0"
            style={{ width: 300 }}
            align="start"
            sideOffset={6}
            avoidCollisions={false}
          >
            <CommandBody
              model={{
                title: "Who can upload",
                placeholder: "Who can upload",
                groups: [
                  {
                    label: "Who can upload",
                    rows: UPLOAD_CHOICES.map((c) => ({
                      id: c.value,
                      label: c.label,
                      icon: c.icon,
                    })),
                  },
                ],
              }}
            />
          </PopoverContent>
        </Popover>
      ) : (
        <Select open={on} value={value} onValueChange={setValue}>
          <SelectTrigger className="w-60" size="sm">
            <SelectValue placeholder="Who can upload" />
          </SelectTrigger>
          <SelectContent className="flt-panel" position="popper">
            {UPLOAD_CHOICES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function DirectionScene({
  scene,
  direction,
  phone,
}: {
  scene: "desk" | "pocket" | "menu" | "sub" | "surfaces" | "field";
  direction: Direction;
  phone: boolean;
}) {
  if (scene === "desk") return <DeskScene direction={direction} />;
  if (scene === "pocket") return <PocketScene direction={direction} />;
  if (scene === "menu") return <MenuScene direction={direction} />;
  if (scene === "sub") return <SubScene direction={direction} />;
  if (scene === "surfaces")
    return <SurfacesScene direction={direction} phone={phone} />;
  return <FieldScene direction={direction} />;
}
