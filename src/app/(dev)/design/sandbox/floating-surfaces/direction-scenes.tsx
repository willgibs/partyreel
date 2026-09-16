"use client";

import { Bell, CornerDownLeft, MoreHorizontal } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { EventCard } from "@/components/app/event-card";
import { FeedSection } from "@/components/app/dashboard/feed-section";
import { FilterChips } from "@/components/app/dashboard/filter-chips";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { Kbd } from "@/components/shared/kbd";
import { PageHeading } from "@/components/shared/page-heading";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Toaster } from "@/components/ui/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { Sub } from "./constants";
import type { Direction } from "./directions";
import {
  ACCOUNT_MENU,
  CommandBody,
  EVENT_MENU,
  EVENT_MENU_INLINE,
  MenuPanel,
} from "./menus";
import { Backdrop, useSceneReplay } from "./stage-bits";

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

/**
 * THE HOST'S BAR ON A PHONE. The desk uses the production `AppShell` now, so
 * this is what is left of round four's hand-drawn chrome: the bar the app draws
 * at 375, where the account menu has to open without a nav beside it.
 *
 * ★ THE HEADER'S NAV PANEL LEFT THIS FILE IN ROUND SIX. It used to be drawn
 * here from `HeaderPanelBody`, and the real pages section loads / at 1440
 * instead: hovering Features there opens the PRODUCTION nav viewport wearing
 * the pick, which is the same surface with none of the drawing.
 */
function AppBar({
  direction,
  accountOn,
}: {
  direction: Direction;
  accountOn: boolean;
}) {
  return (
    <div className="absolute inset-x-0 top-0 z-40 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
      <p className="text-sm font-semibold tracking-tight">Partyreel</p>
      <MenuPanel
        direction={direction}
        model={ACCOUNT_MENU}
        open={accountOn}
        triggerLabel="Will"
        align="end"
        width={272}
      />
    </div>
  );
}

/**
 * THE HOST'S DESK at 1440: the real dashboard, with the menus a host meets in
 * one session open on it at once.
 *
 * ★ IT IS THE PRODUCTION DASHBOARD NOW, NOT A DRAWING OF ONE (round six, on
 * Will's round-four note: "live production components and whole real pages as
 * the comparison surfaces, not a screen of specimens"). The shell is
 * `shared/app-shell.tsx`, the chips are `dashboard/filter-chips.tsx`, the cards
 * are `app/event-card.tsx` and the section headings are
 * `dashboard/feed-section.tsx`, all with the real props at the real density.
 * What the board still draws is the floating layer itself, because that is the
 * thing being designed: the account menu, the event overflow and the tooltip
 * are `MenuPanel` under the direction.
 *
 * ★ AND THE ROUTE CANNOT BE LOADED: /dashboard is behind the (app) auth gate,
 * so a frame pointed at it lands on /login. This is the palette board's answer
 * to the same wall, one step further: the components, the density and the
 * breakpoint are real; the events, the counts and the covers are the board's.
 */
const DESK_EVENTS = [
  {
    name: "Ana and Theo",
    cover: "/marketing/img/mkt-wedding-golden-01.jpg",
    date: "14 June",
    items: "218 items",
    status: "Open",
    pending: 0,
  },
  {
    name: "Sarah's birthday",
    cover: "/marketing/img/mkt-party-balloons-01.jpg",
    date: "2 May",
    items: "96 items",
    status: "Open",
    pending: 8,
  },
  {
    name: "The summer festival",
    cover: "/marketing/img/mkt-festival-lights-01.jpg",
    date: "9 August",
    items: "1,204 items",
    status: "Closed",
    pending: 0,
  },
];

function DeskScene({ direction }: { direction: Direction }) {
  const on = useSceneReplay();
  return (
    <AppShell
      headerActions={
        <>
          <TooltipProvider>
            <Tooltip open={on}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <Bell />
                  <span className="sr-only">Alerts</span>
                </Button>
              </TooltipTrigger>
              {/* LEFT, not bottom: the account menu hangs from the avatar
                  beside this bell and is 272 wide, so a tooltip under the bell
                  opens underneath it and the desk shows two panels where it
                  claims three. */}
              <TooltipContent className="flt-panel" side="left">
                Guests can still upload
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <MenuPanel
            direction={direction}
            model={ACCOUNT_MENU}
            open={on}
            triggerLabel="Will"
            align="end"
            width={272}
          />
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <PageHeading>Your events</PageHeading>
          <Button size="sm">New event</Button>
        </div>
        {/* The storage row, copied from dashboard/storage-meter.tsx's trigger:
            the real component is a Popover, and a second panel open on this
            canvas would sit under the account menu being judged. */}
        <div className="flex w-full items-center gap-3 rounded-lg px-1.5 py-1">
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            Storage
          </span>
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-foreground/70"
              style={{ width: "38%" }}
            />
          </span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            3.8 GB / 10 GB
          </span>
        </div>
        <FilterChips active="all" onChange={() => undefined} trashCount={2} />
        <FeedSection heading="Hosting">
          <ul className="grid grid-cols-3 gap-4">
            {DESK_EVENTS.map((e, i) => (
              <li key={e.name}>
                <EventCard
                  href={null}
                  name={e.name}
                  coverUrl={e.cover}
                  dateLabel={e.date}
                  itemsLabel={e.items}
                  statusLabel={e.status}
                  pendingCount={e.pending}
                  // The overflow lands in the card's own top-right slot, which
                  // is where a hosted card's actions already live.
                  action={
                    i === 0 ? (
                      <MenuPanel
                        direction={direction}
                        model={EVENT_MENU}
                        open={on}
                        triggerLabel="Event"
                        triggerIcon={MoreHorizontal}
                        align="end"
                        width={276}
                      />
                    ) : undefined
                  }
                />
              </li>
            ))}
          </ul>
        </FeedSection>
      </div>
    </AppShell>
  );
}

/**
 * THE ACCOUNT MENU AS IT SHIPS, and the one place on this board that renders no
 * candidate at all: `app/user-menu.tsx`, the real component, with the real
 * theme submenu inside it. It is here because the submenu call is about a bug
 * rather than about a taste, and a bug is only worth ruling on once somebody
 * has seen it: open the avatar, hover Theme, and nothing paints.
 */
function RealAccountScene() {
  return (
    <div className="absolute inset-0 flex flex-col bg-background">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <p className="text-sm font-semibold tracking-tight">Partyreel</p>
        <UserMenu
          email="will@partyreel.com"
          displayName="Will Gibson"
          avatarUrl={null}
        />
      </div>
      <p className="px-4 py-3 text-xs text-muted-foreground">
        Open the avatar, then hover Theme. The submenu opens, reports itself
        visible and paints nothing, because SubContent has no portal and Content
        clips what overflows it. Every host and every guest has this menu.
      </p>
    </div>
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
      <AppBar direction={direction} accountOn={false} />
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

/**
 * ONE MENU, ONE LAYER, AT 328: the catalog card's preview.
 *
 * ★ THE PHOTOGRAPHS ARE THE POINT, not decoration (round six). Round four gave
 * this scene the calm ground, because four frames in a row were being compared
 * at the corner. As a catalog card it is being compared at the MATERIAL, and
 * bible 10 turns on the words "a layer over content": a menu in this product
 * opens over an album, so a card with nothing behind its panel would flatter
 * every opaque layer and tell Glass nothing at all. The corner has its own calm
 * scene at six times magnification in the calls section.
 */
function MenuScene({ direction }: { direction: Direction }) {
  const on = useSceneReplay();
  return (
    <>
      <Backdrop phone chrome={false} />
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

/**
 * THE NESTED BRANCH, KEPT AND DELETED, in whatever direction is picked.
 *
 * ★ THE BRANCH IS THE ANSWER, NOT THE DIRECTION (round six). Round four made
 * this scene a comparison between card and command, which asked two questions
 * in one frame: a reviewer who liked the flat list could not tell whether he
 * was ruling on the anatomy or on the tree. Now the direction comes off the
 * dock and the SWITCH is the ask: `keep` holds the second panel open, `delete`
 * puts its three rows inline under their own name in the one panel.
 *
 * The command direction has no branch to keep, by construction, so it shows its
 * field with two letters typed either way: that IS its answer to this ask.
 */
function SubScene({ direction, sub }: { direction: Direction; sub: Sub }) {
  const on = useSceneReplay();
  const flat = sub === "delete";
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
            model={flat ? EVENT_MENU_INLINE : EVENT_MENU}
            open={on}
            triggerLabel="Event"
            triggerIcon={MoreHorizontal}
            width={flat ? 300 : 276}
            subOpen={flat ? undefined : "who"}
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

export function DirectionScene({
  scene,
  direction,
  sub,
  phone,
}: {
  scene: "desk" | "pocket" | "menu" | "sub" | "real" | "surfaces";
  direction: Direction;
  sub: Sub;
  phone: boolean;
}) {
  if (scene === "desk") return <DeskScene direction={direction} />;
  if (scene === "pocket") return <PocketScene direction={direction} />;
  if (scene === "menu") return <MenuScene direction={direction} />;
  if (scene === "sub") return <SubScene direction={direction} sub={sub} />;
  if (scene === "real") return <RealAccountScene />;
  return <SurfacesScene direction={direction} phone={phone} />;
}
