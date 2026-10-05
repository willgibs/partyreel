"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { BehindThePopup, DevicePair, KeyboardStandIn } from "../device-frames";

/**
 * THE DIALOG AND THE SHEET, THE PRIMITIVES UNDER THE KINDS, AT BOTH SCREENS (library-specimens-3: both specimens
 * predated the kinds and drew one live layer at whatever width the reader's window was).
 *
 * A kind of popup opens through `PopupContent` (`popup-kinds.ts`, drawn on its own entry); these two are the Radix
 * primitives it stands on and the surfaces the popups board left alone: the Dialog draws Welcome to Pro, the avatar
 * cropper, the demo modal and the photograph viewer's own, and the Sheet draws the guest door (its one product sheet),
 * the failure sheet and the email dialogs' sheets, with the marketing phone menu and the design shell's panel at a fixed
 * side. Each is drawn open in a real viewport at a laptop and a phone over a stand-in album, closed by its own control
 * (Replay opens it again), the captions read off what stands in each frame.
 */

export type OverlayVariant = "dialog" | "takeover" | "responsive" | "side";

function DialogScene() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <BehindThePopup />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this event?</DialogTitle>
            <DialogDescription>
              This removes the event and everything in it. There is no undo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** The takeover: an edge-to-edge room that holds the page still behind it, closed by its own Done. */
function TakeoverScene() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <BehindThePopup />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent fullScreen showCloseButton={false}>
          <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3">
            <DialogHeader>
              <DialogTitle>Review</DialogTitle>
              <DialogDescription>
                The page behind cannot scroll, and its scrollbar does not stay
                beside this room.
              </DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">
                Done
              </Button>
            </DialogClose>
          </div>
          <div className="flex-1 overflow-y-auto p-4 text-sm text-muted-foreground">
            What scrolls is this body.
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * The guest door's sheet: `responsive`, a bottom sheet in a hand and a panel from the right at a desk, standing on the
 * keyboard while a field in it holds focus (the keyboard switch on the phone). The door's own words are a stand-in.
 */
function ResponsiveSheetScene() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <BehindThePopup />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent responsive>
          <SheetHeader>
            <SheetTitle>Add your name</SheetTitle>
            <SheetDescription>
              Everyone in the album sees it beside what you add.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-1.5 px-4">
            <Label htmlFor="library-sheet-name">Your name</Label>
            <Input id="library-sheet-name" placeholder="Maya" />
          </div>
          <SheetFooter>
            <Button>Continue</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** A fixed side: the default, which the marketing phone menu and the design shell's panel wear. */
function SideSheetScene() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <BehindThePopup />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Share this event</SheetTitle>
            <SheetDescription>
              Your guests scan one QR code to join and upload.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  );
}

const NOTES: Record<OverlayVariant, string> = {
  dialog:
    "The centred shape: a work layer on the standard clock, in the band the keyboard leaves. A press on X, Cancel or the scrim closes it; Replay opens it again.",
  takeover:
    "fullScreen: an edge-to-edge room that holds the page still behind it (no scrim, the scrollbar kept away). It brings its own close.",
  responsive:
    "responsive: a bottom sheet in a hand, a panel from the right at a desk, one surface. No field takes focus as it opens; switch the keyboard up to see it stand on it.",
  side: "The default side (right): three quarters of the screen to a cap, the edge's travel. A fixed side is for a surface with no desk posture.",
};

/** One of the primitives at both screens. */
export function DialogSheetDemo({ variant }: { variant: OverlayVariant }) {
  const keyboard = variant === "responsive";
  return (
    <DevicePair
      id={`overlay-${variant}`}
      keyboard={keyboard}
      scene={({ keyboard: up }) => (
        <>
          {variant === "dialog" ? <DialogScene /> : null}
          {variant === "takeover" ? <TakeoverScene /> : null}
          {variant === "responsive" ? <ResponsiveSheetScene /> : null}
          {variant === "side" ? <SideSheetScene /> : null}
          <KeyboardStandIn up={up} />
        </>
      )}
      note={NOTES[variant]}
    />
  );
}
