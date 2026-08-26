import { Link2 } from "lucide-react";
import Image from "next/image";

import { BrowserFrame } from "@/components/marketing/frames";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * Sharing page hero media: the album-as-link artifact. The address bar is the
 * star (the fixture URL partyreel.com/a/maya-and-jay), with a copy-link pill
 * and real manifest tiles beneath: "the album IS the share". Decorative
 * (aria-hidden at the caller); the interactive moment on this page is the zip
 * modal further down.
 */

const HERO_TILE_IDS = [
  "wedding-golden",
  "party-balloons",
  "wedding-toast",
  "festival-crowd",
  "reception-table",
  "party-dj",
  "concert-confetti",
  "festival-lights",
];

export function AlbumLinkHero() {
  return (
    <BrowserFrame>
      {/* The hand-rolled window bar: the frame's dot family plus a PROMINENT
          address pill (BrowserFrame's built-in label is deliberately small;
          this page's thesis lives in the URL). */}
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="hidden gap-1.5 sm:flex">
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-muted-foreground/30" />
        </span>
        <span className="flex h-8 min-w-0 flex-1 items-center justify-center rounded-lg bg-muted/60 px-3 font-mono text-xs text-foreground sm:text-sm">
          <span className="truncate">partyreel.com/a/maya-and-jay</span>
        </span>
        {/* Icon-only below sm so the full fixture URL keeps the room. */}
        <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3 text-xs font-medium text-background">
          <Link2 className="size-3.5" />
          <span className="hidden sm:inline">Copy link</span>
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {HERO_TILE_IDS.map((id) => (
          <div
            key={id}
            className="relative aspect-square overflow-hidden rounded-lg"
          >
            <Image
              src={marketingImage(id).src}
              alt=""
              fill
              sizes="(min-width: 768px) 180px, 25vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}
