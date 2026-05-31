import { QrCode } from "lucide-react";

import { cn } from "@/lib/utils";

import { BrowserFrame } from "./browser-frame";

// Lightbox-style album frame — one large media area on the dark `--gallery` surface +
// a thumbnail filmstrip (the "viewing the album" experience), deliberately distinct
// from AlbumFrame's even grid. aria-hidden, purely decorative.
export function GalleryFrame({
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
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gallery">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent" />
          <div className="absolute right-3 bottom-3 size-10 rounded-lg bg-brand/30" />
        </div>
        <div className="mt-2 grid grid-cols-6 gap-1.5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              data-media-tile
              className={cn(
                "aspect-square rounded-md bg-muted",
                index === 0 && "ring-2 ring-brand",
                index === 2 && "bg-brand/15",
              )}
            />
          ))}
        </div>
      </BrowserFrame>
    </div>
  );
}
