import { QrCode } from "lucide-react";

import { cn } from "@/lib/utils";

// Shared browser-album media frame — grayscale chrome that "holds" event media
// (placeholder tiles now; real screenshots drop in later). Used by the home hero
// and the use-case landing heroes. aria-hidden — purely decorative.
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
      <div className="rounded-2xl border bg-card p-3 ring-1 ring-foreground/5">
        <div className="mb-3 flex items-center gap-1.5 px-1">
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <QrCode className="size-3" />
            {label}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {TILES.map((tile, index) => (
            <div
              key={index}
              className={cn(
                "aspect-square rounded-lg bg-muted",
                tile === "brand" && "bg-brand/15",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
