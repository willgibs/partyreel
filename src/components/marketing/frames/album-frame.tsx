import { QrCode } from "lucide-react";

import { cn } from "@/lib/utils";

import { BrowserFrame } from "./browser-frame";

// Browser-album media frame — grayscale chrome that "holds" event media (placeholder
// tiles now; real screenshots drop in later). Used by the home hero, the event-type
// landing heroes, and careers. aria-hidden, purely decorative.
const TILES = ["", "brand", "", "", "", "", "brand", ""] as const;

export function AlbumFrame({
  label = "partyreel.com/a/your-event",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("w-full", className)}>
      <BrowserFrame
        label={
          <>
            <QrCode className="size-3" />
            {label}
          </>
        }
      >
        <div className="grid grid-cols-4 gap-2">
          {TILES.map((tile, index) => (
            <div
              key={index}
              data-media-tile
              className={cn(
                "aspect-square rounded-lg bg-muted",
                tile === "brand" && "bg-brand/15",
              )}
            />
          ))}
        </div>
      </BrowserFrame>
    </div>
  );
}
