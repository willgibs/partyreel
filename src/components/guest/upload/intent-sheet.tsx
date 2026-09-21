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
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const [picks, setPicks] = useState<Pick[]>([]);

  const take = (input: HTMLInputElement) => {
    const files = Array.from(input.files ?? []);
    // Reset so re-picking the same file fires change again (a guest who
    // removed a pick and wants it back after all).
    input.value = "";
    if (files.length === 0) return;
    setPicks(files.map((file) => ({ id: crypto.randomUUID(), file })));
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    // The picks die with the sheet: a stale review from ten minutes ago
    // reopening under "Add photos" would be its own small horror.
    if (!next) setPicks([]);
  };

  const reviewing = picks.length > 0;

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent responsive className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {reviewing
              ? picks.length === 1
                ? "Send this one?"
                : `Send these ${picks.length}?`
              : "Add photos"}
          </SheetTitle>
          <SheetDescription>
            {reviewing
              ? "Tap the cross on anything you did not mean to pick."
              : `Everything you add joins ${hostName}'s album.`}
          </SheetDescription>
        </SheetHeader>

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

        {/* The body carries its own padding (SheetHeader owns the top): a panel
            runs to its own edges, where a dialog box does not. */}
        <div className="px-4 pb-6">
          {reviewing ? (
            <ReviewStep
              picks={picks}
              capBytes={capBytes}
              onRemove={(id) =>
                setPicks((prev) => prev.filter((p) => p.id !== id))
              }
              onSend={() => {
                const files = picks.map((p) => p.file);
                close(false);
                onSend(files);
              }}
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
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
