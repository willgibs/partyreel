"use client";

import { useEffect } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";

import type { GridMedia } from "@/components/app/media-grid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";

// Shared full-screen media viewer for BOTH galleries (public album + host grid).
// Built by composing the radix Dialog PRIMITIVES rather than the wrapped
// <DialogContent> on purpose: a lightbox needs a dark, edge-to-edge backdrop and
// object-contain media, whereas DialogContent hard-codes a light bg-black/10
// overlay + max-w-sm popover. Composing still gives us radix's focus-trap, Esc,
// and scroll-lock for free. `index` is controlled by the grid so prev/next walks
// the whole set; null = closed.
//
// The displayed media uses each item's INLINE url; the Save button uses its
// download url (a presigned `attachment` URL — see lib/r2/presign.ts), so a plain
// <a> saves the original even cross-origin to R2.
export function MediaLightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: GridMedia[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const current = index === null ? null : (items[index] ?? null);

  // ← / → step through the set while open (Esc/backdrop close come from radix).
  useEffect(() => {
    if (index === null) return;
    const i = index; // narrowed capture for the listener closure
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && i > 0) onIndexChange(i - 1);
      else if (e.key === "ArrowRight" && i < items.length - 1)
        onIndexChange(i + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onIndexChange]);

  const hasPrev = index !== null && index > 0;
  const hasNext = index !== null && index < items.length - 1;

  return (
    <Dialog
      open={current !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-black/90" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        >
          <DialogPrimitive.Title className="sr-only">
            Media viewer
          </DialogPrimitive.Title>

          {current && (
            <>
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="text-sm text-white/70 tabular-nums">
                  {index! + 1} / {items.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="bg-white/15 text-white hover:bg-white/25"
                  >
                    {/* Cross-origin force-download comes from the signed
                        content-disposition, not this attribute — it's a harmless
                        same-origin hint. */}
                    <a href={current.downloadUrl} download>
                      <Download /> Save
                    </a>
                  </Button>
                  <DialogPrimitive.Close asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-white hover:bg-white/15 hover:text-white"
                      aria-label="Close"
                    >
                      <X />
                    </Button>
                  </DialogPrimitive.Close>
                </div>
              </div>

              {/* Clicking the dark letterbox (the wrapper itself, not the media
                  or a button) closes — alongside Esc + the X. */}
              <div
                className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6"
                onClick={(e) => {
                  if (e.target === e.currentTarget) onClose();
                }}
              >
                {hasPrev && (
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Previous"
                    onClick={() => onIndexChange(index! - 1)}
                    className="absolute left-1 z-10 text-white hover:bg-white/15 hover:text-white sm:left-3"
                  >
                    <ChevronLeft className="size-7" />
                  </Button>
                )}

                {current.type === "photo" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
                  <img
                    key={current.id}
                    src={current.url}
                    alt=""
                    className="max-h-full max-w-full rounded-md object-contain"
                  />
                ) : (
                  <video
                    key={current.id}
                    src={current.url}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-full max-w-full rounded-md bg-black"
                  />
                )}

                {hasNext && (
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Next"
                    onClick={() => onIndexChange(index! + 1)}
                    className="absolute right-1 z-10 text-white hover:bg-white/15 hover:text-white sm:right-3"
                  >
                    <ChevronRight className="size-7" />
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
