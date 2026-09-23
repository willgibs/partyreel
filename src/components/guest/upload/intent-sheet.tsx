"use client";

/**
 * WHAT THE TAP OPENS (Will, `tap=sheet`, 2026-09-21, verbatim: "This focuses the
 * add options as opposed to option 3, but allows us a custom visual design to
 * support anything across operating systems, as opposed to option 1. Plus,
 * option one being native gives it a huge advantage.").
 *
 * Every Add in the guest page — the row under the event's name, the dock, the
 * empty album's own CTA — opens THIS, on the one responsive Sheet (`dialogs=
 * stands`): a side panel at a desk, a bottom sheet in a hand. Two rows name the
 * two acts the phone's own chooser never distinguishes, and at a party the one
 * that matters most has not been taken yet.
 *
 * ★ THE `.click()` IS SYNCHRONOUS WITH THE TAP, AND THAT IS NOT A STYLE CHOICE.
 * Safari only opens a file picker inside the gesture that asked for it, so ONE
 * `await` anywhere between the row's `onClick` and `input.click()` silently
 * drops the picker on iOS and the guest taps a button that does nothing. That is
 * why both inputs are mounted here and clicked directly rather than, say, minted
 * on demand or reached through a promise.
 *
 * ★ AND BOTH INPUTS LIVE INSIDE `SheetContent`. The sheet is a Radix dialog: it
 * `aria-hidden`s the rest of the page and traps focus, so an input parked
 * outside the content is inert while the sheet is open. Inside, it is ordinary.
 *
 * ★ TWO INPUTS, BECAUSE `capture` CANNOT BE BOTH. With `capture` the input opens
 * the camera directly; without it, the chooser. The camera row therefore takes a
 * PHOTOGRAPH and only a photograph: iOS ignores `multiple` under `capture`
 * anyway, and Android shows a Camera/Camcorder chooser the moment video is
 * accepted, which is a third decision in front of a guest who has already made
 * two. The album row takes both kinds, many at a time.
 *
 * ★ NO FIELD IS EVER TYPED IN HERE, which is what makes Radix safe on a phone:
 * the one guest surface with a text field (Report) is the one carrying the
 * keyboard risk the responsive Sheet has not been proven against.
 */
import { useRef, useState } from "react";
import { Camera, Images } from "lucide-react";

import { ReviewStep, type Pick } from "@/components/guest/upload/review-step";
import { uploadTermsLine } from "@/components/guest/upload/upload-terms";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * ★ THE BODY IS ITS OWN EXPORT NOW (the door as three steps, 2026-09-21). The guest door's UPLOAD
 * step asks for the first photograph INSIDE the entry sheet, and a Radix dialog `aria-hidden`s
 * everything outside itself: an input parked in the page would be inert while the door is open, and
 * a second sheet over the first is two things to dismiss in the dark at a party. So the two inputs,
 * the two rows, the terms line and the review swap live in `UploadIntentBody`, which the album's
 * sheet wraps and the door's step renders directly. The Safari-synchronous `.click()` rule travels
 * with it unchanged, because the inputs travel with it.
 *
 * The body owns no open state and no header: whoever mounts it owns the surface, and asks for the
 * heading with `headingFor(picks.length)` so the sheet's title and the step's own heading say the
 * same words without either one importing the other's shell.
 */
export function uploadIntentHeading(pickCount: number): {
  title: string;
  description: string;
  reviewing: boolean;
} {
  if (pickCount === 0) {
    return { title: "Add photos", description: "", reviewing: false };
  }
  return {
    title: pickCount === 1 ? "Send this one?" : `Send these ${pickCount}?`,
    description: "Tap the cross on anything you did not mean to pick.",
    reviewing: true,
  };
}

export function UploadIntentBody({
  picks,
  onPicks,
  onSend,
  capBytes,
  /** The door's step replaces the two rows' footer with its own (a skip, or the held line). */
  footer,
  /** The primary's words on the pick view; the album's sheet keeps the two named acts alone. */
  className,
}: {
  picks: readonly Pick[];
  onPicks: (picks: Pick[]) => void;
  onSend: (files: File[]) => void;
  capBytes?: number | null;
  footer?: React.ReactNode;
  className?: string;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);

  const take = (input: HTMLInputElement) => {
    const files = Array.from(input.files ?? []);
    // Reset so re-picking the same file fires change again (a guest who
    // removed a pick and wants it back after all).
    input.value = "";
    if (files.length === 0) return;
    onPicks(files.map((file) => ({ id: crypto.randomUUID(), file })));
  };

  const reviewing = picks.length > 0;

  return (
    <div className={className}>
      {/* The two inputs, mounted whichever step is showing, so a row's tap
          never waits on a render before it can click one. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => take(e.currentTarget)}
      />
      <input
        ref={albumRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => take(e.currentTarget)}
      />

      {reviewing ? (
        <ReviewStep
          picks={picks}
          capBytes={capBytes}
          onRemove={(id) => onPicks(picks.filter((p) => p.id !== id))}
          onSend={() => onSend(picks.map((p) => p.file))}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="cta"
            className="w-full justify-start active:scale-[0.99] motion-reduce:active:scale-100"
            onClick={() => cameraRef.current?.click()}
          >
            <Camera /> Take a photo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="cta"
            className="w-full justify-start active:scale-[0.99] motion-reduce:active:scale-100"
            onClick={() => albumRef.current?.click()}
          >
            <Images /> Choose from your album
          </Button>
          {/* The facts of the act, quietly, under the two doors into it. */}
          <p
            data-upload-terms
            className="pt-1 text-center text-reading text-muted-foreground"
          >
            {uploadTermsLine(capBytes)}
          </p>
          {footer}
        </div>
      )}
    </div>
  );
}

export function UploadIntentSheet({
  open,
  onOpenChange,
  hostName,
  onSend,
  capBytes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The host's display name, so the sheet says whose album this joins. */
  hostName: string;
  /** The kept picks, once the guest has reviewed them. */
  onSend: (files: File[]) => void;
  /** The host's own per-event cap once the RPC returns it (upload-terms.ts). */
  capBytes?: number | null;
}) {
  const [picks, setPicks] = useState<Pick[]>([]);
  const heading = uploadIntentHeading(picks.length);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        responsive
        className="overflow-y-auto"
        onAnimationEnd={(e) => {
          /**
           * The picks die with the sheet, but only once it has ACTUALLY
           * closed — never in the same tick as the call that closes it. Send
           * used to clear `picks` immediately, which flipped `reviewing` back
           * to false while the sheet was still visibly playing its exit: the
           * still-open panel repainted the two intent rows underneath itself
           * for the rest of the close (captured in the pane at 375, 12:11
           * EDT). A stale review from ten minutes ago reopening under "Add
           * photos" would be its own small horror, so this still runs on
           * every genuine close (Send, the X, Escape, the backdrop) — just
           * on the CONTENT's own `animate-out` finishing rather than on the
           * tap that started it.
           *
           * `e.target === e.currentTarget` skips a bubbled animation from a
           * child (there are none today, but the review grid is exactly the
           * kind of place one gets added later); `!open` skips the ENTRANCE
           * animation's own end, which would otherwise wipe a pick mid-review
           * the moment the sheet finished opening.
           */
          if (e.target === e.currentTarget && !open) setPicks([]);
        }}
      >
        <SheetHeader>
          <SheetTitle>{heading.title}</SheetTitle>
          <SheetDescription>
            {heading.reviewing
              ? heading.description
              : `Everything you add joins ${hostName}'s album.`}
          </SheetDescription>
        </SheetHeader>

        {/* The body carries its own padding (SheetHeader owns the top): a panel
            runs to its own edges, where a dialog box does not. */}
        <UploadIntentBody
          className="px-4 pb-6"
          picks={picks}
          onPicks={setPicks}
          capBytes={capBytes}
          onSend={(files) => {
            onOpenChange(false);
            onSend(files);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
