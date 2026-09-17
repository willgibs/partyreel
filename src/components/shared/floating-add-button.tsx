"use client";

/**
 * The floating "Add photos" pill (Phase 4, the ratified upload combo): appears
 * only while the header's Add button is scrolled out of view (never both),
 * carries a live "N uploading" chip while the queue runs, and sits above the
 * safe area on notched phones. Entrance is a fade+rise on the emphasis curve;
 * reduced motion gets the fade only (the global guard clamps durations).
 * It floats over a gallery that keeps scrolling behind it, so it wears
 * shadow-layer, the same shadow as every menu and the host's action bar.
 */
import { ImageUp } from "lucide-react";

export function FloatingAddButton({
  show,
  uploadingCount,
  onClick,
}: {
  show: boolean;
  uploadingCount: number;
  onClick: () => void;
}) {
  if (!show) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(1rem+env(safe-area-inset-bottom))]"
      data-floating-add
    >
      <button
        type="button"
        onClick={onClick}
        className="pointer-events-auto flex h-11 items-center gap-3 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-layer transition-[transform,opacity] duration-200 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:active:scale-100 motion-safe:starting:translate-y-2 motion-safe:starting:opacity-0"
      >
        <ImageUp className="size-4" />
        Add photos
        {uploadingCount > 0 && (
          <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[11px] tabular-nums">
            {uploadingCount} uploading
          </span>
        )}
      </button>
    </div>
  );
}
