import Image from "next/image";
import { Bookmark, ImageUp, Share } from "lucide-react";

import { COVER_PHOTO, EVENT_NAME, PHOTOS } from "../screens/sample-photos";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the event header, the identity block guests land on. Three
 * voices for the same facts; the gallery starts right below each.
 */
export function HeaderVariants() {
  return (
    <div aria-hidden className="grid gap-8 py-4 md:grid-cols-2 xl:grid-cols-3">
      <Variant
        n={1}
        name="Left editorial"
        rationale="Type-led and quiet, like a byline: the name leads, actions follow, photos arrive fast."
      >
        <div className="absolute inset-0 px-4 pt-12">
          <p data-dir-display className="text-2xl leading-tight text-balance">
            {EVENT_NAME}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Hosted by Maya · June 14 · 128 photos & videos
          </p>
          <Actions className="mt-3" />
          <MiniGrid />
        </div>
      </Variant>

      <Variant
        n={2}
        name="Centered formal"
        rationale="The invitation register: monogram, centered serif, small-caps date. The most wedding, the most occasion."
      >
        <div className="absolute inset-0 px-4 pt-12 text-center">
          <div className="relative mx-auto size-14 overflow-hidden rounded-full ring-1 ring-border">
            <Image src={COVER_PHOTO} alt="" fill sizes="56px" className="object-cover" />
          </div>
          <p
            data-dir-display
            className="mt-3 text-2xl leading-tight text-balance"
          >
            {EVENT_NAME}
          </p>
          <p className="mt-1.5 text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
            June 14 · Hosted by Maya
          </p>
          <Actions className="mt-3 justify-center" />
          <MiniGrid />
        </div>
      </Variant>

      <Variant
        n={3}
        name="Cover hero"
        rationale="The media leads from pixel one: the cover photo is the header, the name sits in its light."
      >
        <div className="absolute inset-0">
          <div className="relative h-[42%]">
            <Image src={COVER_PHOTO} alt="" fill sizes="320px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <p data-dir-display className="text-2xl leading-tight text-balance">
                {EVENT_NAME}
              </p>
              <p className="mt-0.5 text-[11px] text-white/75">
                Hosted by Maya · June 14 · 128 photos & videos
              </p>
            </div>
          </div>
          <div className="px-4">
            <Actions className="mt-3" />
            <MiniGrid />
          </div>
        </div>
      </Variant>
    </div>
  );
}

function Actions({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
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
  );
}

function MiniGrid() {
  return (
    <div className="mt-4 grid grid-cols-3 gap-1.5">
      {PHOTOS.slice(1, 7).map((src) => (
        <div
          key={src}
          className="relative aspect-square overflow-hidden"
          style={{ borderRadius: "calc(var(--radius) * 0.6)" }}
        >
          <Image src={src} alt="" fill sizes="100px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}
