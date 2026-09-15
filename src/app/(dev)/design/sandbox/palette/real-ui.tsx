"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * THE FLOATING LAYER, FOR REAL (round four; all that is left of this file after
 * the migration wave, 2026-09-15).
 *
 * ★ A PORTAL LEAVES THE STAGE, which is the one reason this cannot be a
 * specimen like every other. Dialog, DropdownMenu and Popover all portal to the
 * document body, outside every wrapper a board paints and outside every frame a
 * board loads, so a real floating surface cannot be shown wearing a candidate at
 * all. Rounds two and three answered that with hand-placed replicas; the honest
 * reading is the one here: the button applies the pair to THIS page and then
 * opens, because a menu in production is painted by whatever the page declares.
 *
 * ★ WHAT LEFT THIS FILE. `TrueViewport`, `ScopedTokens`, `RealFooter`,
 * `RealPricing` and `RealChapters` were this board's answer to "more real UI":
 * production sections portalled into an iframe the board built itself, with a
 * scoped stylesheet to reach the one register a production component carries as
 * a CLASS. The kit's `Frame` loads the real ROUTES instead (live.tsx), so the
 * sections, the iframe, the settling sheet and the scoped selector all went
 * together. Nothing about the argument moved; the evidence got better.
 */

/* ── The floating layer, for real ───────────────────────────────────────── */

/**
 * A real Dialog, a real DropdownMenu and a real Popover, each opened over the
 * page. They portal to the body, so they cannot be painted by a stage; the
 * buttons apply the pair to the whole page first, which is the only honest way
 * to see a production floating surface wearing a candidate. Clear is in the
 * dock and on the paste row.
 */
export function RealFloating({
  onApply,
  applied,
}: {
  onApply: () => void;
  applied: string | null;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" onClick={onApply}>
              Open the real dialog
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this event?</DialogTitle>
              <DialogDescription>
                Every photo and video guests uploaded goes with it. This cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <p className="text-muted-foreground">
              91 uploads, 2.4 GB. The QR code stops working the moment this is
              gone.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" size="sm">
                  Keep it
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive" size="sm">
                  Delete the event
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" onClick={onApply}>
              Open the real menu
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Sarah&apos;s birthday</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Share the link</DropdownMenuItem>
            <DropdownMenuItem>Download everything</DropdownMenuItem>
            <DropdownMenuItem>Event settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              Delete the event
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" onClick={onApply}>
              Open the real popover
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72">
            <p className="text-sm font-medium">Who can see this album?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Anyone with the link. Guests never need an account, and you can
              turn the link off at any time.
            </p>
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {applied
          ? `These are the production components, portaled to the page, and the page is wearing ${applied}. The menu, the dialog and the popover all read --popover, the ring and --shadow-float, which is why the floating layer is the one place a set with no card step still has to work.`
          : "These are the production components. A portal leaves every stage, so each button applies the pair to this page first and then opens: that is what a menu in production is painted by. Clear is in the dock."}
      </p>
    </div>
  );
}
