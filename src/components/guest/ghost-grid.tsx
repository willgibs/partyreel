import { Camera } from "lucide-react";

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
