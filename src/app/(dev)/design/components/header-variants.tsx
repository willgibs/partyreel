import Image from "next/image";
import { Bookmark, ImageUp, Share } from "lucide-react";

import { COVER_PHOTO, EVENT_NAME, PHOTOS } from "../screens/sample-photos";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the event header. Round-6 revision (Will): in EVERY variant the
 * Add photos CTA is full width with the two secondaries split 2-up beneath -
 * the wide Add is the page-top upload affordance; the floating Add button
 * (upload combo) animates in once it scrolls away. V1 got the refinement
 * pass (more top air, structured meta); V3 stays the contender if the cover
 * image earns its keep in the entry decision.
 */
export function HeaderVariants() {
  return (
    <div aria-hidden className="grid gap-8 py-4 md:grid-cols-2 xl:grid-cols-3">
      <Variant
        n={1}
        name="Left editorial (refined)"
        rationale="Type-led and quiet, now with room to breathe: structured byline, stats that read as facts not fine print."
      >
        <div className="absolute inset-0 px-4 pt-16">
          <p data-dir-display className="text-[26px] leading-snug text-balance">
            {EVENT_NAME}
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="relative size-5 overflow-hidden rounded-full">
              <Image src={COVER_PHOTO} alt="" fill sizes="20px" className="object-cover" />
            </span>
            <p className="text-xs text-muted-foreground">
              Hosted by <span className="font-medium text-foreground">Maya</span>
            </p>
            <span className="text-muted-foreground/50">·</span>
            <p className="text-xs text-muted-foreground">June 14</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">128</span> photos &
            videos from <span className="font-medium text-foreground">43</span>{" "}
            guests
          </p>
          <Actions className="mt-4" />
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
          <Actions className="mt-3" />
          <MiniGrid />
        </div>
      </Variant>

      <Variant
        n={3}
        name="Cover hero"
        rationale="The media leads from pixel one: the cover photo is the header, the name sits in its light. Wins if the entry decision makes the cover image genuinely useful."
      >
        <div className="absolute inset-0">
          <div className="relative h-[40%]">
            <Image src={COVER_PHOTO} alt="" fill sizes="320px" className="object-cover" />
            {/* 65% floor assumes a bright/warm cover; production needs the
                overlay tuned (or sampled) per cover photo - a Phase 2 note. */}
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

/* The ratified action layout: Add photos full width (the page-top upload
   affordance), the two secondaries split evenly beneath. */
function Actions({ className }: { className?: string }) {
  return (
    <div className={className}>
      <button
        data-dir-press
        className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[var(--radius-action)] bg-primary text-[13px] font-semibold text-primary-foreground"
      >
        <ImageUp className="size-4" />
        Add photos
      </button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          data-dir-press
          className="flex h-9 items-center justify-center gap-1.5 rounded-[var(--radius-action-sm)] border border-border bg-card text-xs font-medium"
        >
          <Bookmark className="size-3.5" />
          Save
        </button>
        <button
          data-dir-press
          className="flex h-9 items-center justify-center gap-1.5 rounded-[var(--radius-action-sm)] border border-border bg-card text-xs font-medium"
        >
          <Share className="size-3.5" />
          Invite
        </button>
      </div>
    </div>
  );
}

function MiniGrid() {
  return (
    <div className="mt-4 grid grid-cols-3 gap-[3px]">
      {PHOTOS.slice(1, 7).map((src) => (
        <div
          key={src}
          className="relative aspect-square overflow-hidden"
          style={{ borderRadius: "var(--radius-tile)" }}
        >
          <Image src={src} alt="" fill sizes="100px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}
