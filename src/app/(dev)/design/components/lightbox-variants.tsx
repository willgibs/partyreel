import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Play,
  Share,
  X,
} from "lucide-react";

import { EVENT_NAME, PHOTOS, PORTRAIT_PHOTO } from "../screens/sample-photos";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the lightbox chrome, the most-used full-screen surface in the
 * product. Always the dark gallery tokens (ADR-0010) in every variant; what
 * varies is where controls and attribution live around the photo.
 */
export function LightboxVariants() {
  return (
    <div aria-hidden className="grid gap-8 py-4 md:grid-cols-2 xl:grid-cols-3">
      <Variant
        n={1}
        name="Pinned chrome"
        rationale="Bars top and bottom, always visible: zero discovery cost, every control one glance away. The photo shares the room."
        framed={false}
      >
        <Stage>
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <p className="text-[11px] text-gallery-muted">14 of 128</p>
            <X className="size-4 text-gallery-muted" />
          </div>
          <Media />
          <div className="flex items-center justify-between px-3.5 py-3">
            <p className="text-[11px] text-gallery-muted">Photo by Dana</p>
            <ActionRow />
          </div>
        </Stage>
      </Variant>

      <Variant
        n={2}
        name="Floating pill (selected, revised)"
        rationale="THE SELECTED SPEC: full-bleed media, one floating pill, attribution on its own bar. Heart is utility (NO count); side tap zones are gracious (~30% each) while swipe stays primary with the next media sliding in tight; second stage = the video state."
        framed={false}
      >
        <div className="space-y-3">
          <Stage h={300}>
            <div className="absolute inset-0">
              <Image
                src={PORTRAIT_PHOTO}
                alt=""
                fill
                sizes="360px"
                className="object-cover"
              />
            </div>
            <span className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
              <X className="size-4 text-white" />
            </span>
            {/* Gracious side tap zones (~30% each) with a whisper of scrim;
                swipe stays primary on touch, the neighbor sliding in tight. */}
            <div className="absolute inset-y-0 left-0 flex w-[30%] items-center justify-start bg-gradient-to-r from-black/15 to-transparent pl-1.5">
              <ChevronLeft className="size-4 text-white/70" />
            </div>
            <div className="absolute inset-y-0 right-0 flex w-[30%] items-center justify-end bg-gradient-to-l from-black/15 to-transparent pr-1.5">
              <ChevronRight className="size-4 text-white/70" />
            </div>
            <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-5 rounded-full bg-black/55 px-5 py-2.5 backdrop-blur-sm">
                <ActionRow light />
              </div>
              {/* Attribution gets its OWN bar: always legible, never inside
                  the tap targets. */}
              <span className="rounded-full bg-black/55 px-3 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                Photo by Dana · 14 of 128
              </span>
            </div>
          </Stage>
          <Stage h={300}>
            <div className="absolute inset-0">
              <Image
                src={PHOTOS[8]}
                alt=""
                fill
                sizes="360px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/25" />
            </div>
            <span className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
              <X className="size-4 text-white" />
            </span>
            {/* VIDEO state: center play, scrubber joins the pill stack. */}
            <span className="absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
              <Play className="ml-0.5 size-6 text-white" fill="currentColor" />
            </span>
            <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1.5 px-6">
              <div className="flex w-full max-w-[260px] items-center gap-2.5 rounded-full bg-black/55 px-4 py-2.5 backdrop-blur-sm">
                <span className="text-[10px] text-white">0:12</span>
                <span className="relative h-1 flex-1 rounded-full bg-white/30">
                  <span className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-white" />
                </span>
                <span className="text-[10px] text-white/70">0:38</span>
                <ActionRow light compact />
              </div>
              <span className="rounded-full bg-black/55 px-3 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                Video by Sam · 15 of 128
              </span>
            </div>
          </Stage>
        </div>
      </Variant>

      <Variant
        n={3}
        name="Immersive auto-hide"
        rationale="Chrome appears on tap and gets out of the way: the purest photo experience, one learned gesture as the price."
        framed={false}
      >
        <Stage>
          <div className="absolute inset-0">
            <Image
              src={PORTRAIT_PHOTO}
              alt=""
              fill
              sizes="360px"
              className="object-cover"
            />
          </div>
          {/* The hidden-state mock: chrome ghosted to communicate auto-hide. */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3.5 py-2.5 opacity-35">
            <p className="text-[11px] text-white">14 of 128</p>
            <X className="size-4 text-white" />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3.5 py-3 opacity-35">
            <p className="text-[11px] text-white">Photo by Dana</p>
            <ActionRow light />
          </div>
          <span className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1.5 text-[10px] text-white/85 backdrop-blur-sm">
            Tap to show controls
          </span>
        </Stage>
      </Variant>
    </div>
  );
}

function Stage({
  children,
  h = 420,
}: {
  children: React.ReactNode;
  h?: number;
}) {
  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-[var(--radius)] bg-gallery text-gallery-foreground"
      style={{ height: `${h}px` }}
    >
      {children}
    </div>
  );
}

function Media() {
  return (
    <div className="relative mx-auto flex w-full flex-1 items-center justify-center px-10">
      <ChevronLeft className="absolute left-2.5 size-4 text-gallery-muted" />
      <div className="relative h-[290px] w-full max-w-[200px] overflow-hidden rounded-md">
        <Image
          src={PORTRAIT_PHOTO}
          alt=""
          fill
          sizes="200px"
          className="object-cover"
        />
      </div>
      <ChevronRight className="absolute right-2.5 size-4 text-gallery-muted" />
      <span className="sr-only">{EVENT_NAME}</span>
    </div>
  );
}

/* No like COUNT anywhere a guest sees (utility, not social pressure); the
   liked state reads via the rose fill (state color), unliked via outline. */
function ActionRow({
  light = false,
  compact = false,
}: {
  light?: boolean;
  compact?: boolean;
}) {
  const muted = light ? "text-white/80" : "text-gallery-muted";
  const size = compact ? "size-3.5" : "size-4";
  return (
    <div className={`flex items-center ${compact ? "gap-2.5" : "gap-4"}`}>
      <Heart
        className={size}
        style={{ color: "var(--dir-like)" }}
        fill="currentColor"
      />
      <Download className={`${size} ${muted}`} />
      <Share className={`${size} ${muted}`} />
    </div>
  );
}
