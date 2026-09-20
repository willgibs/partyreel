import { Camera } from "lucide-react";

/**
 * ★ RETIRED FROM THE PRODUCT, KEPT ON DISK FOR THE BOARD (Will, `nothing=river`,
 * 2026-09-20). The locked password page drew this; it draws `GhostRiver`
 * (gallery-empty-state.tsx) now, so the same absence has one picture on both
 * screens. The file stays because the `guest-shape` board renders it — the
 * before of the very question he answered — and a lane never deletes a module
 * the lab imports (`src/app/(dev)/design/sandbox/guest-shape/page-parts.tsx`).
 * Nothing in the product imports it. Delete it when that board retires.
 */

// The locked-event ghost backdrop (Phase 4, the ratified V4 entry): empty
// bordered tiles standing in for the gallery a guest can't see yet — shape
// and count tease, zero pixels. A camera glyph every 4th cell keeps it from
// reading as a broken grid. Decorative only.
export function GhostGrid({ tiles = 9 }: { tiles?: number }) {
  return (
    <div aria-hidden className="grid grid-cols-3 gap-[var(--gap-gallery)]">
      {Array.from({ length: tiles }, (_, i) => (
        <div
          key={i}
          className="flex aspect-square items-center justify-center border border-border/70 bg-muted/60"
          style={{ borderRadius: "var(--radius-tile)" }}
        >
          {i % 4 === 1 && <Camera className="size-4 text-faint" />}
        </div>
      ))}
    </div>
  );
}
