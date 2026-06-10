import Image from "next/image";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  ImageUp,
  Share,
  X,
} from "lucide-react";

import { PhoneShell } from "./phone-shell";
import {
  EVENT_BYLINE,
  EVENT_NAME,
  PHOTOS,
  PORTRAIT_PHOTO,
} from "./sample-photos";

/**
 * Screen 2: the live event page (phone) next to the lightbox. The lightbox
 * rides the ALWAYS-DARK --gallery tokens in every direction (ADR-0010), so this
 * pair shows how each identity hands the room over to the media: the only
 * direction-colored pixels in the lightbox are the like state and focus ring.
 */
export function GalleryScreen() {
  return (
    <div aria-hidden className="grid items-start gap-6 py-6 lg:grid-cols-2">
      {/* The event page, mobile-first. */}
      <PhoneShell>
        <div className="flex h-full flex-col">
          <div className="px-4 pt-12">
            <p data-dir-display className="text-2xl leading-tight text-balance">
              {EVENT_NAME}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {EVENT_BYLINE} · 128 photos & videos
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                data-dir-press
                className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[calc(var(--radius)*0.8)] bg-primary text-xs font-medium text-primary-foreground"
              >
                <ImageUp className="size-3.5" />
                Add photos
              </button>
              <button className="flex h-8 items-center justify-center gap-1.5 rounded-[calc(var(--radius)*0.8)] border border-border bg-card px-3 text-xs font-medium">
                <Bookmark className="size-3.5" />
                Save
              </button>
              <button className="flex h-8 items-center justify-center gap-1.5 rounded-[calc(var(--radius)*0.8)] border border-border bg-card px-3 text-xs font-medium">
                <Share className="size-3.5" />
                Invite
              </button>
            </div>
          </div>

          <div className="mt-4 flex-1 px-4">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-[11px] font-medium">Live gallery</p>
              <p className="text-[10px] text-muted-foreground">
                Updates as guests add
              </p>
            </div>
            <div data-dir-stagger className="grid grid-cols-3 gap-1.5">
              {PHOTOS.slice(0, 8).map((src, i) => (
                <div
                  key={src}
                  style={
                    { "--i": i, borderRadius: "calc(var(--radius) * 0.6)" } as React.CSSProperties
                  }
                  className="relative aspect-square overflow-hidden"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="110px"
                    className="object-cover"
                  />
                  {/* One tile mid-upload: progress, not spinner soup. */}
                  {i === 1 && (
                    <div className="absolute inset-0 flex items-end bg-black/35 p-1.5">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
                        <div className="h-full w-2/3 rounded-full bg-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div
                style={{ "--i": 8, borderRadius: "calc(var(--radius) * 0.6)" } as React.CSSProperties}
                className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  +120
                </span>
              </div>
            </div>
          </div>
        </div>
      </PhoneShell>

      {/* The lightbox: always-dark gallery surface, media as the hero. */}
      <div
        className="relative flex flex-col overflow-hidden rounded-[var(--radius)] bg-gallery text-gallery-foreground"
        style={{ minHeight: "480px" }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-xs text-gallery-muted">14 of 128 · {EVENT_NAME}</p>
          <X className="size-4 text-gallery-muted" />
        </div>
        <div className="relative mx-auto flex w-full flex-1 items-center justify-center px-12">
          <ChevronLeft className="absolute left-3 size-5 text-gallery-muted" />
          <div className="relative h-[330px] w-full max-w-[240px] overflow-hidden rounded-md">
            <Image
              src={PORTRAIT_PHOTO}
              alt=""
              fill
              priority
              sizes="240px"
              className="object-cover"
            />
          </div>
          <ChevronRight className="absolute right-3 size-5 text-gallery-muted" />
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <p className="text-xs text-gallery-muted">Photo by Dana</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs">
              {/* Liked-state color is per-direction (--dir-like): plain brand
                  ink would vanish against the always-dark gallery surface. */}
              <Heart
                className="size-4"
                style={{ color: "var(--dir-like)" }}
                fill="currentColor"
              />
              12
            </span>
            <Download className="size-4 text-gallery-muted" />
            <Share className="size-4 text-gallery-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
