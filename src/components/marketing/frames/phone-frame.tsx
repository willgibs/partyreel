import { Check, ImageUp } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The phone bezel with a children slot (extracted at the /features/album
 * round, 2026-09-02, so a frame can hold live media rather than the fixed
 * upload mock below). Same chrome as before: the rounded card, the notch, the
 * inner screen. aria-hidden is the caller's job.
 *
 * The bezel is a FRAMED SCREEN, one of the three kinds of surface that take the
 * bright edge (globals.css, [data-lit]). The hook sits on the bezel because the
 * bezel owns the 2.5rem radius, and it says "border" because the bezel wears
 * one: the light lands ON that border rather than drawing a third outline
 * inside it. Two rules follow, both held by lit-edge-contract.test.ts: this
 * box keeps its 1px `border`, and it never clips (the screen inside does). It
 * took a stock shadow-sm until the light ruling (2026-09-17); a frame standing
 * flat on the page takes none, and a composition that really overlaps one over
 * something declares `shadow-lift` itself.
 */
export function PhoneShell({
  className,
  screenClassName,
  children,
}: {
  className?: string;
  /** Classes on the inner screen (padding, ground). */
  screenClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("w-full", className)}>
      <div
        data-lit="border"
        className="rounded-[2.5rem] border bg-card p-3 ring-1 ring-foreground/5"
      >
        {/* speaker / notch */}
        <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-muted-foreground/20" />
        <div
          className={cn(
            "overflow-hidden rounded-[1.75rem] bg-muted/40 p-4",
            screenClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// A phone device mock showing the just-in-time guest upload: a dropzone, thumbnails
// landing, and a brand progress bar. The "upload from your phone, no app" story.
// aria-hidden, purely decorative.
export function PhoneFrame({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("mx-auto max-w-[260px]", className)}>
      <PhoneShell>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">
            Add your photos
          </span>
          <span className="text-[10px] text-muted-foreground">
            Sara&rsquo;s party
          </span>
        </div>

        <div className="mt-3 flex flex-col items-center gap-1 rounded-xl border border-dashed border-brand/40 bg-brand/5 py-4 text-brand">
          <ImageUp className="size-5" />
          <span className="text-[10px] font-medium">Tap to upload</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div data-media-tile className="aspect-square rounded-lg bg-muted" />
          <div
            data-media-tile
            className="aspect-square rounded-lg bg-brand/15"
          />
          <div
            data-media-tile
            className="relative aspect-square rounded-lg bg-muted"
          >
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <Check className="size-2.5" />
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="relative h-1 flex-1 rounded-full bg-muted">
            <span className="absolute inset-y-0 left-0 w-2/3 rounded-full bg-brand" />
          </span>
          <span className="text-[10px] text-muted-foreground">2 of 3</span>
        </div>
      </PhoneShell>
    </div>
  );
}
